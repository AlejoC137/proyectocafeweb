import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Disc, 
  CheckCircle2, 
  ArrowLeft,
  Volume2,
  Radio
} from 'lucide-react';
import supabase from '../../config/supabaseClient';

export default function RadioStationSelector({
  supabasePlaylist = [],
  currentPlay = null,
  setIsPlaying,
  broadcastPlay,
  isApplyingRemoteChange,
  queueWindow = null,
  jumpToTrack = null,
  isShuffle = false,
  setIsShuffle = null
}) {
  const [selectorTab, setSelectorTab] = useState('queue'); // 'queue' (Cola al Aire en vivo) o 'albums' (Álbumes)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [requestingTrackId, setRequestingTrackId] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [djMixingTrack, setDjMixingTrack] = useState(null);

  // Lista dinámica de pistas de la cola filtradas por búsqueda
  const filteredQueueTracks = useMemo(() => {
    if (!searchQuery.trim()) return supabasePlaylist || [];
    const q = searchQuery.toLowerCase();
    return (supabasePlaylist || []).filter(t =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [supabasePlaylist, searchQuery]);

  // 1. Agrupar canciones en las Playlists / Álbumes creados en Radio Manager
  const playlistsFromManager = useMemo(() => {
    const groups = {};

    (supabasePlaylist || []).forEach((track, index) => {
      const albumName = (track.album || 'Playlists Variadas').trim();
      if (!groups[albumName]) {
        groups[albumName] = {
          name: albumName,
          artist: track.artist || 'Varios Artistas',
          cover: track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
          genre: track.genre || 'Radio',
          year: track.year || '',
          tracks: []
        };
      }
      groups[albumName].tracks.push({ ...track, playlistOriginalIndex: index });
    });

    return Object.values(groups).map(group => {
      const totalSecs = group.tracks.reduce((acc, t) => acc + (Number(t.duration) || 180), 0);
      return { ...group, totalDuration: totalSecs, trackCount: group.tracks.length };
    });
  }, [supabasePlaylist]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlistsFromManager;
    const q = searchQuery.toLowerCase();
    return playlistsFromManager.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.artist.toLowerCase().includes(q) ||
      p.tracks.some(t => t.title && t.title.toLowerCase().includes(q))
    );
  }, [playlistsFromManager, searchQuery]);

  const activePlaylistTracks = useMemo(() => {
    if (!selectedPlaylist) return [];
    const target = playlistsFromManager.find(p => p.name === selectedPlaylist.name) || selectedPlaylist;
    if (!searchQuery.trim()) return target.tracks;
    const q = searchQuery.toLowerCase();
    return target.tracks.filter(t =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q))
    );
  }, [selectedPlaylist, playlistsFromManager, searchQuery]);

  useEffect(() => {
    if (playlistsFromManager.length === 1 && !selectedPlaylist && !searchQuery) {
      setSelectedPlaylist(playlistsFromManager[0]);
    }
  }, [playlistsFromManager, selectedPlaylist, searchQuery]);

  const currentLiveTitle = currentPlay?.station_name || '';

  // Formato de cola al aire: la canción actual al aire queda arriba y solo se muestran las siguientes
  const displayedQueueTracks = useMemo(() => {
    if (searchQuery.trim()) return filteredQueueTracks;

    const currentIdx = filteredQueueTracks.findIndex(track =>
      Boolean(
        currentLiveTitle && (
          (track.title && currentLiveTitle.toLowerCase().includes(track.title.toLowerCase())) ||
          (currentLiveTitle.toLowerCase().includes((track.title || '').toLowerCase())) ||
          (track.url && currentPlay?.station_url && track.url === currentPlay.station_url)
        )
      )
    );

    if (currentIdx > 0) {
      return filteredQueueTracks.slice(currentIdx);
    }
    return filteredQueueTracks;
  }, [filteredQueueTracks, searchQuery, currentLiveTitle, currentPlay]);

  const handleSelectSong = async (track) => {
    try {
      setRequestingTrackId(track.id);
      setRequestSuccess(`🎧 Mezclando al aire "${track.title}"...`);

      const payload = {
        id: 1,
        station_name: track.title,
        station_artist: `REQUEST:${track.title}||${track.artist || ''}`,
        station_cover: track.cover || '',
        station_url: track.url || '',
        is_playing: true,
        updated_at: new Date().toISOString()
      };

      await supabase.from('radio_current_play').update(payload).eq('id', 1);

      if (jumpToTrack) {
        if (track.playlistOriginalIndex !== undefined) {
          jumpToTrack(track.playlistOriginalIndex);
        } else {
          const foundIdx = (supabasePlaylist || []).findIndex(t => t.id === track.id || t.url === track.url || t.title === track.title);
          if (foundIdx !== -1) jumpToTrack(foundIdx);
        }
      }

      setTimeout(() => {
        setRequestSuccess(`🎧 ¡Al Aire!: "${track.title}"`);
        setRequestingTrackId(null);
      }, 1200);

      setTimeout(() => {
        setRequestSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error al pedir canción:', err);
      setRequestingTrackId(null);
    }
  };

  const handlePlayEntirePlaylist = (playlist) => {
    if (!playlist || playlist.tracks.length === 0) return;
    handleSelectSong(playlist.tracks[0]);
  };

  const formatDuration = (secs) => {
    if (!secs) return '03:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (secs) => {
    if (!secs) return '0 min';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <div className="p-4 bg-white dark:bg-[#12131C] text-black dark:text-white transition-colors">

      {/* Toast éxito */}
      {requestSuccess && (
        <div className="mb-4 p-3 bg-emerald-400 border-[3px] border-black font-black text-xs text-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{requestSuccess}</span>
        </div>
      )}

      {/* SELECTOR DE VISTA: COLA AL AIRE (DINÁMICA) VS ÁLBUMES */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => { setSelectorTab('queue'); setSelectedPlaylist(null); }}
          className={`flex-1 py-2 px-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-[2px] border-black transition ${
            selectorTab === 'queue'
              ? 'bg-black text-white dark:bg-yellow-400 dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>Cola al Aire ({supabasePlaylist.length})</span>
        </button>
        <button
          onClick={() => setSelectorTab('albums')}
          className={`flex-1 py-2 px-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-[2px] border-black transition ${
            selectorTab === 'albums'
              ? 'bg-black text-white dark:bg-yellow-400 dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Disc className="w-3.5 h-3.5 text-amber-500" />
          <span>Álbumes ({filteredPlaylists.length})</span>
        </button>
      </div>

      {/* VISTA A: COLA DE EMISIÓN AL AIRE (DINÁMICA EN TIEMPO REAL) */}
      {selectorTab === 'queue' && (
        <div>
          {filteredQueueTracks.length === 0 ? (
            <div className="p-8 text-center border-[3px] border-dashed border-black dark:border-slate-700 bg-cream-bg dark:bg-[#181926] my-4">
              <Radio className="w-12 h-12 mx-auto text-gray-400 animate-pulse mb-2" />
              <p className="font-black uppercase text-sm">Cola de emisión vacía</p>
              <p className="text-xs text-gray-500 mt-1 font-bold">Agrega canciones en Radio Manager para verlas aquí en vivo.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y-[3px] divide-black dark:divide-slate-700 border-[3px] border-black dark:border-slate-700">
              {displayedQueueTracks.map((track, idx) => {
                const isCurrentPlaying = Boolean(
                  currentLiveTitle && (
                    (track.title && currentLiveTitle.toLowerCase().includes(track.title.toLowerCase())) ||
                    (currentLiveTitle.toLowerCase().includes((track.title || '').toLowerCase())) ||
                    (track.url && currentPlay?.station_url && track.url === currentPlay.station_url)
                  )
                );

                return (
                  <div
                    key={track.id || `${track.title}-${idx}`}
                    className={`flex items-center gap-3 px-3 py-2 bg-white dark:bg-[#181926] transition-colors ${
                      isCurrentPlaying ? 'bg-yellow-50 dark:bg-yellow-400/10' : ''
                    }`}
                  >
                    {/* Número en la tanda */}
                    <span className="w-5 text-center font-mono font-bold text-xs text-gray-400 shrink-0">
                      {idx + 1}
                    </span>

                    {/* Miniatura */}
                    <div className="w-9 h-9 shrink-0 overflow-hidden border-[2px] border-black dark:border-slate-600 bg-black">
                      <img
                        src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                        alt={track.title}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-black text-xs uppercase tracking-wide truncate ${
                          isCurrentPlaying ? 'text-red-600 dark:text-yellow-400' : 'text-black dark:text-white'
                        }`}>
                          {track.title}
                        </p>
                        {isCurrentPlaying && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase animate-pulse shrink-0">
                            AL AIRE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                        {track.artist || 'Radio Café'} {track.album ? `• ${track.album}` : ''}
                      </p>
                    </div>

                    {/* Duración */}
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-mono font-bold text-gray-400">
                        {formatDuration(track.duration)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA B: GRID DE PLAYLISTS / ÁLBUMES */}
      {selectorTab === 'albums' && !selectedPlaylist && (
        <div>
          <div className="flex items-start justify-between mb-3 gap-2">
            <h4 className="font-black uppercase tracking-wider text-xs sm:text-sm text-black dark:text-white flex items-center gap-2 flex-shrink-0">
              <Disc className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Listas de Reproducción ({filteredPlaylists.length})</span>
            </h4>
          </div>

          {filteredPlaylists.length === 0 ? (
            <div className="p-8 text-center border-[3px] border-dashed border-black dark:border-slate-700 bg-cream-bg dark:bg-[#181926] my-4">
              <Disc className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-2" />
              <p className="font-black uppercase text-sm">No se encontraron playlists</p>
              <p className="text-xs text-gray-500 mt-1 font-bold">Crea álbumes en Radio Manager para verlos aquí.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y-[3px] divide-black dark:divide-slate-700 border-[3px] border-black dark:border-slate-700">
              {filteredPlaylists.map((playlist) => {
                const isCurrentPlayingInAlbum = currentLiveTitle && playlist.tracks.some(t =>
                  currentLiveTitle.toLowerCase().includes((t.title || '').toLowerCase()) ||
                  (t.title || '').toLowerCase().includes(currentLiveTitle.toLowerCase())
                );

                return (
                  <div
                    key={playlist.name}
                    className={`flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-[#181926] transition-colors ${
                      isCurrentPlayingInAlbum ? 'bg-yellow-50 dark:bg-yellow-400/10' : ''
                    }`}
                  >
                    {/* Miniatura */}
                    <div className="w-10 h-10 flex-shrink-0 overflow-hidden border-[2px] border-black dark:border-slate-600 bg-black">
                      <img
                        src={playlist.cover}
                        alt={playlist.name}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-xs uppercase tracking-wide text-black dark:text-white truncate">
                          {playlist.name}
                        </p>
                        {isCurrentPlayingInAlbum && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase animate-pulse flex-shrink-0">
                            AL AIRE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                        {playlist.artist}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[11px] font-mono font-bold text-black dark:text-white">
                        {playlist.trackCount} pistas
                      </p>
                      <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                        {formatTotalTime(playlist.totalDuration)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VISTA C: DETALLE DE CANCIONES DEL ÁLBUM SELECCIONADO */}
      {selectorTab === 'albums' && selectedPlaylist && (
        <div>
          {/* Header con volver */}
          <div className="border-[3px] border-black dark:border-slate-700 bg-cream-bg dark:bg-[#181926] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="p-2 bg-black hover:bg-yellow-400 text-white hover:text-black border-[2px] border-black transition flex-shrink-0"
                title="Volver a todas las playlists"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-black">
                <img
                  src={selectedPlaylist.cover}
                  alt={selectedPlaylist.name}
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-black uppercase tracking-wider text-sm text-black dark:text-white truncate">
                  {selectedPlaylist.name}
                </h4>
                <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate">
                  {selectedPlaylist.artist} · {selectedPlaylist.trackCount} canciones ({formatTotalTime(selectedPlaylist.totalDuration)})
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePlayEntirePlaylist(selectedPlaylist)}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-[2px] border-black text-xs font-black uppercase text-black transition flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto"
            >
              <Play className="w-4 h-4 fill-black" />
              Reproducir Lista
            </button>
          </div>

          {/* Lista de pistas */}
          {activePlaylistTracks.length === 0 ? (
            <div className="p-8 text-center border-[3px] border-dashed border-black dark:border-slate-700 bg-cream-bg dark:bg-[#181926] my-4">
              <Disc className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="font-black uppercase text-xs">No hay canciones que coincidan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activePlaylistTracks.map((track, idx) => {
                const isCurrentPlaying = currentLiveTitle && (
                  currentLiveTitle.toLowerCase().includes((track.title || '').toLowerCase()) ||
                  (track.title || '').toLowerCase().includes(currentLiveTitle.toLowerCase())
                );

                return (
                  <div
                    key={track.id || idx}
                    className={`flex items-center justify-between p-3 border-[3px] transition-all ${
                      isCurrentPlaying
                        ? 'border-black bg-yellow-200 dark:bg-yellow-500/20 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-black dark:border-slate-700 bg-white dark:bg-[#191a27] hover:bg-cream-bg dark:hover:bg-[#202234] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                      <div className={`w-7 h-7 flex items-center justify-center font-black text-xs border-[2px] border-black flex-shrink-0 ${
                        isCurrentPlaying ? 'bg-red-600 text-white' : 'bg-black text-white dark:bg-slate-700'
                      }`}>
                        {isCurrentPlaying ? (
                          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        ) : (
                          String(idx + 1).padStart(2, '0')
                        )}
                      </div>
                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <p className="font-black text-xs uppercase tracking-wider text-black dark:text-white truncate">
                            {track.title}
                          </p>
                          {isCurrentPlaying && (
                            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1 flex-shrink-0 animate-pulse">
                              AL AIRE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-slate-400 mt-0.5">
                          <span className="truncate">{track.artist || selectedPlaylist.artist}</span>
                          {track.year && <span className="flex-shrink-0">· {track.year}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="hidden sm:inline-block font-mono text-[11px] font-bold text-gray-500">
                        {formatDuration(track.duration)}
                      </span>
                      <button
                        onClick={() => handleSelectSong(track)}
                        disabled={isCurrentPlaying || requestingTrackId === track.id}
                        className={`px-3 py-1.5 font-black text-[10px] uppercase tracking-widest border-[2px] border-black flex items-center gap-1 transition-all ${
                          isCurrentPlaying
                            ? 'bg-black text-yellow-400 cursor-default'
                            : 'bg-emerald-400 hover:bg-emerald-300 text-black cursor-pointer'
                        }`}
                      >
                        {isCurrentPlaying ? (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Sonando</span>
                          </>
                        ) : requestingTrackId === track.id ? (
                          <>
                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                            <span>Poniendo...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-black" />
                            <span>Poner</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
