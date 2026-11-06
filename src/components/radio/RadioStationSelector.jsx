import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Disc, 
  CheckCircle2, 
  ArrowLeft,
  Volume2,
  Radio,
  Grid,
  List,
  Music2,
  Wifi,
  Search,
  Loader2,
  LayoutGrid,
  X
} from 'lucide-react';
import supabase from '../../config/supabaseClient';
import fallbackCatalogData from '../../data/localMusicCatalog.json';

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
  const [selectorTab, setSelectorTab] = useState('queue'); // 'queue' | 'albums' | 'p2p'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [requestingTrackId, setRequestingTrackId] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [showPreviousTracks, setShowPreviousTracks] = useState(false);
  // 'compact' (mini grid adaptativo), 'grid' (grid estándar Spotify), 'list' (lista densa)
  const [albumDisplayMode, setAlbumDisplayMode] = useState('compact');
  
  // Estado para buscador federado P2P en Proyecto Radio
  const [p2pSearchQuery, setP2pSearchQuery] = useState('');
  const [p2pResults, setP2pResults] = useState([]);
  const [isP2pSearching, setIsP2pSearching] = useState(false);

  const currentLiveTitle = currentPlay?.station_name || '';

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

  // Función helper para determinar si una pista específica está al aire
  const isSongOnAir = (track) => {
    if (!track) return false;
    if (track.url && currentPlay?.station_url && track.url === currentPlay.station_url) return true;
    if (currentLiveTitle && track.title) {
      const liveLower = currentLiveTitle.toLowerCase().trim();
      const titleLower = track.title.toLowerCase().trim();
      if (liveLower === titleLower) return true;
      if (liveLower.includes(titleLower) || titleLower.includes(liveLower)) return true;
    }
    return false;
  };

  // Separación exacta de Pista Actual vs Siguientes estilo Spotify Queue
  const { currentQueueTrack, nextQueueTracks, previousQueueTracks } = useMemo(() => {
    if (!filteredQueueTracks || filteredQueueTracks.length === 0) {
      return { currentQueueTrack: null, nextQueueTracks: [], previousQueueTracks: [] };
    }

    const foundIndex = filteredQueueTracks.findIndex(track => isSongOnAir(track));

    if (foundIndex !== -1) {
      return {
        currentQueueTrack: filteredQueueTracks[foundIndex],
        nextQueueTracks: filteredQueueTracks.slice(foundIndex + 1),
        previousQueueTracks: filteredQueueTracks.slice(0, foundIndex)
      };
    }

    if (currentPlay?.station_name) {
      const liveFallback = {
        id: 'current-live-play',
        title: currentPlay.station_name,
        artist: (currentPlay.station_artist || 'Radio Café').replace(/^REQUEST:[^|]*\|\|/, ''),
        album: 'Emisión al Aire',
        cover: currentPlay.station_cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        duration: 180,
        url: currentPlay.station_url
      };
      return {
        currentQueueTrack: liveFallback,
        nextQueueTracks: filteredQueueTracks,
        previousQueueTracks: []
      };
    }

    return {
      currentQueueTrack: filteredQueueTracks[0],
      nextQueueTracks: filteredQueueTracks.slice(1),
      previousQueueTracks: []
    };
  }, [filteredQueueTracks, currentLiveTitle, currentPlay]);

  // Agrupar canciones en las Playlists / Álbumes creados en Radio Manager
  const playlistsFromManager = useMemo(() => {
    const groups = {};
    const isRealCover = (url) => url && !url.startsWith('blob:') && !url.includes('images.unsplash.com') && url.trim() !== '';

    (supabasePlaylist || []).forEach((track, index) => {
      const albumName = (track.album || 'Playlists Variadas').trim();
      if (!groups[albumName]) {
        groups[albumName] = {
          name: albumName,
          artist: track.artist || 'Varios Artistas',
          cover: '',
          genre: track.genre || 'Radio',
          year: track.year || '',
          tracks: []
        };
      }
      if (!isRealCover(groups[albumName].cover) && isRealCover(track.cover)) {
        groups[albumName].cover = track.cover;
      }
      groups[albumName].tracks.push({ ...track, playlistOriginalIndex: index });
    });

    return Object.values(groups).map(group => {
      const totalSecs = group.tracks.reduce((acc, t) => acc + (Number(t.duration) || 180), 0);

      let cover = group.cover;
      if (!cover) {
        const fallbackAlbum = (fallbackCatalogData || []).find(a =>
          a.albumName?.toLowerCase().trim() === group.name.toLowerCase().trim() ||
          a.folderName?.toLowerCase().includes(group.name.toLowerCase().trim())
        );
        cover = fallbackAlbum?.cover || '';
      }

      return { ...group, cover, totalDuration: totalSecs, trackCount: group.tracks.length };
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

  const handleSelectSong = async (track) => {
    try {
      setRequestingTrackId(track.id);
      setRequestSuccess(`🎧 Mezclando al aire "${track.title}"...`);

      const rawTrackUrl = track.rawUrl || track.url || '';
      const isDirectHttp = (track.url && (track.url.startsWith('http://') || track.url.startsWith('https://')) && !track.url.includes('/api/local-audio'));
      let fileInfo = track.fileName || track.filePath || '';
      if (!fileInfo && rawTrackUrl.startsWith('local://')) {
        fileInfo = decodeURIComponent(rawTrackUrl.replace('local://', ''));
      } else if (!fileInfo && track.url && track.url.includes('/api/local-audio')) {
        try {
          const u = new URL(track.url, window.location.origin);
          fileInfo = u.searchParams.get('file') || u.searchParams.get('path') || '';
        } catch (e) {}
      }

      const payload = {
        id: 1,
        station_name: track.title,
        station_artist: `REQUEST:${track.title}||${track.artist || ''}||${fileInfo}`,
        station_cover: track.cover || '',
        station_url: isDirectHttp ? track.url : '',
        tab: 'supabase',
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
      }, 4000);
    } catch (err) {
      console.error('Error al pedir canción:', err);
      setRequestingTrackId(null);
    }
  };

  const handleSearchP2P = async (e) => {
    if (e) e.preventDefault();
    if (!p2pSearchQuery.trim()) return;
    setIsP2pSearching(true);
    try {
      const res = await fetch(`/api/p2p-search?q=${encodeURIComponent(p2pSearchQuery.trim())}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setP2pResults(data.results || []);
      } else {
        setP2pResults([]);
      }
    } catch (e) {
      console.warn("Error en búsqueda P2P:", e);
    } finally {
      setIsP2pSearching(false);
    }
  };

  const handleSelectP2PTrack = async (track) => {
    try {
      setRequestingTrackId(track.id);
      setRequestSuccess(`🛰️ Adquiriendo stream P2P para "${track.title}"...`);

      const params = new URLSearchParams({
        id: track.id,
        title: track.title || '',
        artist: track.artist || '',
        filePath: track.filePath || '',
        fileName: track.fileName || '',
        streamUrl: track.streamUrl || ''
      });
      await fetch(`/api/p2p-transfer?${params.toString()}`);

      const streamUrl = `/api/p2p-stream?id=${encodeURIComponent(track.id)}${track.filePath ? `&path=${encodeURIComponent(track.filePath)}` : ''}`;
      
      const payload = {
        id: 1,
        station_name: track.title,
        station_artist: track.artist || 'P2P Stream Audio',
        station_cover: track.cover || '',
        station_url: streamUrl,
        tab: 'supabase',
        is_playing: true,
        updated_at: new Date().toISOString()
      };

      await supabase.from('radio_current_play').update(payload).eq('id', 1);

      setTimeout(() => {
        setRequestSuccess(`🎧 ¡Al Aire Stream P2P!: "${track.title}"`);
        setRequestingTrackId(null);
      }, 1500);

      setTimeout(() => {
        setRequestSuccess(null);
      }, 4000);
    } catch (err) {
      console.error('Error al pedir pista P2P:', err);
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
    <div className="p-2.5 sm:p-3 bg-white dark:bg-[#12131C] text-black dark:text-white transition-colors">

      {/* Toast éxito compacto */}
      {requestSuccess && (
        <div className="mb-2.5 px-2.5 py-1.5 bg-emerald-400 border-[2px] border-black font-black text-[11px] text-black flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{requestSuccess}</span>
        </div>
      )}

      {/* BARRA SUPERIOR INTEGRADA: TABS COMPACTOS + BUSCADOR RÁPIDO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => { setSelectorTab('queue'); setSelectedPlaylist(null); }}
            className={`flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-[2px] border-black dark:border-slate-700 transition ${
              selectorTab === 'queue'
                ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black dark:border-[#1DB954]'
                : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className={`w-3 h-3 ${selectorTab === 'queue' ? 'text-red-500 dark:text-black' : 'text-red-500'} animate-pulse`} />
            <span className="truncate">Cola ({supabasePlaylist.length})</span>
          </button>
          <button
            onClick={() => setSelectorTab('albums')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-[2px] border-black dark:border-slate-700 transition ${
              selectorTab === 'albums'
                ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black dark:border-[#1DB954]'
                : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Disc className={`w-3 h-3 ${selectorTab === 'albums' ? 'text-amber-400 dark:text-black' : 'text-amber-500'}`} />
            <span className="truncate">Álbumes ({filteredPlaylists.length})</span>
          </button>
          <button
            onClick={() => { setSelectorTab('p2p'); setSelectedPlaylist(null); }}
            className={`py-1.5 px-2.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border-[2px] border-black dark:border-slate-700 transition ${
              selectorTab === 'p2p'
                ? 'bg-black text-white dark:bg-cyan-400 dark:text-black dark:border-cyan-400'
                : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span>P2P</span>
          </button>
        </div>

        {/* Buscador rápido en vivo para Cola y Álbumes */}
        {selectorTab !== 'p2p' && (
          <div className="relative flex-1 sm:max-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectorTab === 'albums' ? 'Filtrar álbum o pista...' : 'Filtrar cola...'}
              className="w-full pl-8 pr-6 py-1 border-[2px] border-black dark:border-slate-700 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-[11px] font-bold placeholder-gray-400 outline-none focus:border-[#1DB954]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* VISTA A: COLA DE EMISIÓN AL AIRE (ESTILO SPOTIFY COMPACTO) */}
      {selectorTab === 'queue' && (
        <div className="space-y-2.5">
          {(!currentQueueTrack && nextQueueTracks.length === 0) ? (
            <div className="p-6 text-center border-[2px] border-dashed border-black/40 dark:border-slate-700 bg-cream-bg dark:bg-[#181926]">
              <Radio className="w-8 h-8 mx-auto text-gray-400 animate-pulse mb-1.5" />
              <p className="font-black uppercase text-xs">Cola de emisión vacía</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-bold">Agrega canciones en Radio Manager para verlas aquí.</p>
            </div>
          ) : (
            <>
              {/* SECCIÓN 1: CANCIÓN ACTUAL AL AIRE (COMPACT SPOTIFY NOW PLAYING BAR) */}
              {currentQueueTrack && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-ping" />
                      Sonando Ahora
                    </span>
                  </div>

                  <div className="p-2 bg-yellow-50/90 dark:bg-[#1DB954]/10 border-[2px] border-black dark:border-[#1DB954]/50 flex items-center justify-between gap-2.5 transition-all">
                    {/* Miniatura con Ecualizador animado estilo Spotify */}
                    <div className="relative w-9 h-9 shrink-0 overflow-hidden border border-black dark:border-[#1DB954]/40 bg-black">
                      <img
                        src={currentQueueTrack.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                        alt={currentQueueTrack.title}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-1 gap-[2px] pointer-events-none">
                        <span className="w-0.5 bg-[#1DB954] animate-eq-1 h-2.5" />
                        <span className="w-0.5 bg-[#1DB954] animate-eq-2 h-3.5" />
                        <span className="w-0.5 bg-[#1DB954] animate-eq-3 h-1.5" />
                        <span className="w-0.5 bg-[#1DB954] animate-eq-4 h-3" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-black text-xs uppercase tracking-tight truncate text-red-600 dark:text-[#1DB954]">
                          {currentQueueTrack.title}
                        </p>
                        <span className="px-1 py-0.2 bg-red-600 text-white text-[8px] font-black uppercase shrink-0">
                          LIVE
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 truncate">
                        {currentQueueTrack.artist || 'Radio Café'} {currentQueueTrack.album ? `• ${currentQueueTrack.album}` : ''}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-mono font-bold text-black dark:text-[#1DB954]">
                        {formatDuration(currentQueueTrack.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: A CONTINUACIÓN EN LA COLA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      A continuación
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-black/10 dark:bg-white/10 text-black dark:text-white rounded">
                      {nextQueueTracks.length}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">
                    Clic para reproducir
                  </span>
                </div>

                {nextQueueTracks.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-black/20 dark:border-slate-700 bg-cream-bg/40 dark:bg-[#181926]">
                    <p className="font-bold uppercase text-[11px] text-gray-500 dark:text-gray-400">
                      Fin de la cola • Continuará en bucle
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-black/10 dark:divide-white/5 border-[2px] border-black dark:border-slate-700 bg-white dark:bg-[#181926] max-h-[340px] overflow-y-auto custom-scrollbar">
                    {nextQueueTracks.map((track, idx) => {
                      const isRequesting = requestingTrackId === track.id;

                      return (
                        <div
                          key={track.id || `${track.title}-${idx}`}
                          onClick={() => handleSelectSong(track)}
                          className="group flex items-center gap-2.5 px-2.5 py-1.5 bg-white dark:bg-[#181926] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer select-none"
                          title={`Reproducir: "${track.title}"`}
                        >
                          <div className="w-4 text-center shrink-0 flex items-center justify-center">
                            <span className="font-mono text-[11px] text-gray-400 group-hover:hidden">
                              {idx + 1}
                            </span>
                            <span className="hidden group-hover:flex items-center justify-center text-black dark:text-[#1DB954]">
                              <Play className="w-3 h-3 fill-current" />
                            </span>
                          </div>

                          <div className="w-7 h-7 shrink-0 overflow-hidden rounded-sm border border-black/20 dark:border-white/10 bg-black">
                            <img
                              src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                              alt={track.title}
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-[#1DB954] transition-colors leading-tight">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                              {track.artist || 'Radio Café'} {track.album ? `• ${track.album}` : ''}
                            </p>
                          </div>

                          <div className="shrink-0 text-right flex items-center gap-1.5">
                            {isRequesting ? (
                              <span className="text-[10px] font-black uppercase text-red-600 dark:text-[#1DB954] animate-pulse">
                                Mezclando...
                              </span>
                            ) : (
                              <p className="text-[10px] font-mono text-gray-400 group-hover:text-black dark:group-hover:text-white">
                                {formatDuration(track.duration)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN 3: HISTORIAL COLAPSABLE DE PISTAS ANTERIORES */}
              {previousQueueTracks.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPreviousTracks(!showPreviousTracks)}
                    className="w-full py-1 px-2 border border-dashed border-black/25 dark:border-slate-700 font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:text-black dark:hover:text-white transition flex items-center justify-center gap-1.5 bg-cream-bg/30 dark:bg-white/5"
                  >
                    <span>{showPreviousTracks ? '▲ Ocultar anteriores' : `▼ Pistas anteriores (${previousQueueTracks.length})`}</span>
                  </button>

                  {showPreviousTracks && (
                    <div className="mt-1 flex flex-col divide-y divide-black/10 dark:divide-slate-800 border border-black/20 dark:border-slate-800 bg-black/5 dark:bg-black/20 max-h-40 overflow-y-auto custom-scrollbar">
                      {previousQueueTracks.map((track, idx) => (
                        <div
                          key={track.id || `${track.title}-prev-${idx}`}
                          onClick={() => handleSelectSong(track)}
                          className="flex items-center gap-2 px-2.5 py-1 hover:bg-black/10 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <span className="w-4 text-center font-mono text-[10px] text-gray-400 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-6 h-6 shrink-0 overflow-hidden bg-black rounded-sm">
                            <img
                              src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                              alt={track.title}
                              className="w-full h-full object-cover grayscale opacity-70"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[11px] text-gray-700 dark:text-gray-300 truncate">
                              {track.title}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] text-gray-400">
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VISTA B: GRID ADAPTATIVO DE CARÁTULAS / ÁLBUMES ESTILO SPOTIFY */}
      {selectorTab === 'albums' && !selectedPlaylist && (
        <div>
          {/* Sub-header con selector de escala/vista adaptativa */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#1DB954]" />
              <span>Biblioteca de Álbumes ({filteredPlaylists.length})</span>
            </span>
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-[#181926] p-0.5 border border-black/20 dark:border-slate-700 rounded">
              <button
                onClick={() => setAlbumDisplayMode('compact')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition flex items-center gap-1 ${
                  albumDisplayMode === 'compact'
                    ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title=" Cuadrícula compacta adaptativa"
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden sm:inline">Compacto</span>
              </button>
              <button
                onClick={() => setAlbumDisplayMode('grid')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition flex items-center gap-1 ${
                  albumDisplayMode === 'grid'
                    ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="Cuadrícula media"
              >
                <Grid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setAlbumDisplayMode('list')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition flex items-center gap-1 ${
                  albumDisplayMode === 'list'
                    ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="Lista compacta"
              >
                <List className="w-3 h-3" />
              </button>
            </div>
          </div>

          {filteredPlaylists.length === 0 ? (
            <div className="p-6 text-center border-[2px] border-dashed border-black/30 dark:border-slate-700 bg-cream-bg dark:bg-[#181926]">
              <Disc className="w-8 h-8 mx-auto text-gray-400 mb-1.5" />
              <p className="font-black uppercase text-xs">No se encontraron álbumes</p>
            </div>
          ) : albumDisplayMode !== 'list' ? (
            /* ───── ADAPTIVE SPOTIFY GRID VIEW (COMPACT / NORMAL) ───── */
            <div
              className={`grid gap-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5 ${
                albumDisplayMode === 'compact'
                  ? 'grid-cols-[repeat(auto-fill,minmax(92px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(104px,1fr))]'
                  : 'grid-cols-[repeat(auto-fill,minmax(125px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]'
              }`}
            >
              {filteredPlaylists.map((playlist) => {
                const isCurrentPlayingInAlbum = currentLiveTitle && playlist.tracks.some(t =>
                  currentLiveTitle.toLowerCase().includes((t.title || '').toLowerCase()) ||
                  (t.title || '').toLowerCase().includes(currentLiveTitle.toLowerCase())
                );
                const hasCover = playlist.cover && playlist.cover.trim() !== '';

                return (
                  <div
                    key={playlist.name}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className={`group relative cursor-pointer rounded-md p-1.5 transition-all duration-200 select-none border ${
                      isCurrentPlayingInAlbum
                        ? 'bg-[#1DB954]/10 border-[#1DB954] ring-1 ring-[#1DB954]/40'
                        : 'bg-gray-50/80 dark:bg-[#181926] hover:bg-gray-100 dark:hover:bg-[#232536] border-black/15 dark:border-white/5'
                    }`}
                  >
                    {/* Carátula square compacta */}
                    <div className="relative aspect-square w-full overflow-hidden rounded bg-neutral-900 mb-1.5 shadow-sm">
                      {hasCover ? (
                        <img
                          src={playlist.cover}
                          alt={playlist.name}
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}
                      <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center ${hasCover ? 'hidden' : 'flex'}`}>
                        <Music2 className="w-6 h-6 text-slate-600" />
                      </div>

                      {/* Botón Play flotante estilo Spotify en esquina inferior derecha */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEntirePlaylist(playlist);
                        }}
                        title={`Reproducir álbum ${playlist.name}`}
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 text-black shadow-lg flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                      </button>

                      {/* AL AIRE badge */}
                      {isCurrentPlayingInAlbum && (
                        <div className="absolute top-1 left-1">
                          <span className="px-1 py-0.2 bg-red-600 text-white text-[8px] font-black uppercase rounded-sm animate-pulse">
                            LIVE
                          </span>
                        </div>
                      )}

                      {/* Track count pill */}
                      <div className="absolute top-1 right-1">
                        <span className="px-1 py-0.2 bg-black/75 text-white text-[8px] font-mono font-bold rounded-sm">
                          {playlist.trackCount}
                        </span>
                      </div>
                    </div>

                    {/* Info compacta debajo de la carátula */}
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] text-black dark:text-white truncate leading-tight" title={playlist.name}>
                        {playlist.name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5" title={playlist.artist}>
                        {playlist.artist}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ───── COMPACT LIST VIEW ───── */
            <div className="flex flex-col divide-y divide-black/10 dark:divide-white/5 border-[2px] border-black dark:border-slate-700 max-h-[380px] overflow-y-auto custom-scrollbar">
              {filteredPlaylists.map((playlist) => {
                const isCurrentPlayingInAlbum = currentLiveTitle && playlist.tracks.some(t =>
                  currentLiveTitle.toLowerCase().includes((t.title || '').toLowerCase()) ||
                  (t.title || '').toLowerCase().includes(currentLiveTitle.toLowerCase())
                );
                const hasCover = playlist.cover && playlist.cover.trim() !== '';

                return (
                  <div
                    key={playlist.name}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className={`group flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer transition-colors select-none ${
                      isCurrentPlayingInAlbum
                        ? 'bg-[#1DB954]/10'
                        : 'bg-white dark:bg-[#181926] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative w-8 h-8 flex-shrink-0 overflow-hidden rounded-sm bg-black border border-black/20 dark:border-white/10">
                      {hasCover ? (
                        <img
                          src={playlist.cover}
                          alt={playlist.name}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <Music2 className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-black dark:text-white truncate leading-tight">
                          {playlist.name}
                        </p>
                        {isCurrentPlayingInAlbum && (
                          <span className="px-1 py-0.2 bg-red-600 text-white text-[8px] font-black uppercase flex-shrink-0">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                        {playlist.artist}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right flex items-center gap-2">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-black dark:text-white">
                          {playlist.trackCount} pistas
                        </p>
                        <p className="text-[9px] font-mono text-gray-400">
                          {formatTotalTime(playlist.totalDuration)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEntirePlaylist(playlist);
                        }}
                        className="p-1.5 rounded-full bg-[#1DB954] text-black opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Reproducir álbum"
                      >
                        <Play className="w-3 h-3 fill-black" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA C: DETALLE DE CANCIONES DEL ÁLBUM SELECCIONADO (HEADER COMPACTO SPOTIFY) */}
      {selectorTab === 'albums' && selectedPlaylist && (
        <div>
          {/* Cabecera compacta del Álbum */}
          <div className="mb-2.5">
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="inline-flex items-center gap-1 mb-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Volver a Álbumes</span>
            </button>

            <div className="p-2.5 border-[2px] border-black dark:border-slate-700 bg-neutral-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-slate-800 border border-white/20">
                  {selectedPlaylist.cover ? (
                    <img
                      src={selectedPlaylist.cover}
                      alt={selectedPlaylist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#1DB954] block">
                    Álbum • {selectedPlaylist.trackCount} pistas ({formatTotalTime(selectedPlaylist.totalDuration)})
                  </span>
                  <h4 className="font-black text-xs sm:text-sm text-white truncate leading-tight">
                    {selectedPlaylist.name}
                  </h4>
                  <p className="text-[11px] text-gray-300 truncate">
                    {selectedPlaylist.artist}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePlayEntirePlaylist(selectedPlaylist)}
                className="px-3 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-[11px] font-black uppercase transition flex items-center gap-1 shrink-0 shadow-md"
              >
                <Play className="w-3 h-3 fill-black" />
                <span>Play</span>
              </button>
            </div>
          </div>

          {/* Lista compacta de pistas del álbum */}
          {activePlaylistTracks.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-black/30 dark:border-slate-700 bg-cream-bg dark:bg-[#181926]">
              <p className="font-bold uppercase text-xs text-gray-500">No hay canciones que coincidan</p>
            </div>
          ) : (
            <div className="border-[2px] border-black dark:border-slate-700 divide-y divide-black/10 dark:divide-white/5 max-h-[320px] overflow-y-auto custom-scrollbar">
              {activePlaylistTracks.map((track, idx) => {
                const isCurrentPlaying = currentLiveTitle && (
                  currentLiveTitle.toLowerCase().includes((track.title || '').toLowerCase()) ||
                  (track.title || '').toLowerCase().includes(currentLiveTitle.toLowerCase())
                );

                return (
                  <div
                    key={track.id || idx}
                    className={`group flex items-center justify-between px-2.5 py-1.5 transition-colors cursor-pointer select-none ${
                      isCurrentPlaying
                        ? 'bg-[#1DB954]/15'
                        : 'bg-white dark:bg-[#191a27] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    onClick={() => !isCurrentPlaying && handleSelectSong(track)}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                      <div className="w-5 text-center shrink-0">
                        {isCurrentPlaying ? (
                          <span className="flex items-center justify-center">
                            <span className="w-2 h-2 bg-[#1DB954] rounded-full animate-ping" />
                          </span>
                        ) : (
                          <>
                            <span className="font-mono text-[11px] text-gray-400 group-hover:hidden">
                              {idx + 1}
                            </span>
                            <span className="hidden group-hover:flex items-center justify-center text-black dark:text-[#1DB954]">
                              <Play className="w-3 h-3 fill-current" />
                            </span>
                          </>
                        )}
                      </div>

                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className={`font-bold text-xs truncate leading-tight ${
                            isCurrentPlaying
                              ? 'text-red-600 dark:text-[#1DB954] font-black'
                              : 'text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-[#1DB954]'
                          }`}>
                            {track.title}
                          </p>
                          {isCurrentPlaying && (
                            <span className="bg-red-600 text-white text-[8px] font-black uppercase px-1 flex-shrink-0">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate leading-tight">
                          {track.artist || selectedPlaylist.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-mono text-[10px] text-gray-400">
                        {formatDuration(track.duration)}
                      </span>
                      {requestingTrackId === track.id && (
                        <span className="text-[9px] font-black uppercase text-[#1DB954] animate-pulse">
                          Mezclando
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA D: BUSCADOR FEDERADO Y STREAMING P2P */}
      {selectorTab === 'p2p' && (
        <div className="space-y-2.5">
          <form onSubmit={handleSearchP2P} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={p2pSearchQuery}
                onChange={(e) => setP2pSearchQuery(e.target.value)}
                placeholder="Buscar canción en red P2P..."
                className="w-full pl-8 pr-3 py-1.5 border-[2px] border-black dark:border-slate-700 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-xs font-bold placeholder-gray-400 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isP2pSearching || !p2pSearchQuery.trim()}
              className="px-3 py-1.5 bg-black dark:bg-cyan-400 text-white dark:text-black font-black text-xs uppercase border-[2px] border-black transition flex items-center gap-1 disabled:opacity-50"
            >
              {isP2pSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Buscar</span>
            </button>
          </form>

          {p2pResults.length === 0 && !isP2pSearching && (
            <div className="p-6 text-center border border-dashed border-black/30 dark:border-slate-700 bg-cream-bg/60 dark:bg-[#181926]">
              <Wifi className="w-6 h-6 mx-auto text-gray-400 mb-1" />
              <p className="font-black uppercase text-[11px]">Búsqueda P2P Desacoplada</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Consulta nodos locales y peers federados con inicio instantáneo.
              </p>
            </div>
          )}

          {p2pResults.length > 0 && (
            <div className="flex flex-col divide-y divide-black/10 dark:divide-slate-700/60 border-[2px] border-black dark:border-slate-700 bg-white dark:bg-[#181926] max-h-[320px] overflow-y-auto custom-scrollbar">
              {p2pResults.map((track, idx) => {
                const isRequesting = requestingTrackId === track.id;
                return (
                  <div
                    key={track.id || idx}
                    onClick={() => handleSelectP2PTrack(track)}
                    className="group flex items-center justify-between gap-2.5 px-2.5 py-1.5 bg-white dark:bg-[#181926] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 shrink-0 overflow-hidden rounded-sm bg-black">
                        <img
                          src={track.cover}
                          alt=""
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate group-hover:text-cyan-400">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {track.artist} • <span className="text-emerald-500 font-bold">{track.peerStatus}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isRequesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <span className="px-2 py-0.5 bg-cyan-400 text-black text-[9px] font-black uppercase rounded-sm flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-black" /> Stream
                        </span>
                      )}
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
