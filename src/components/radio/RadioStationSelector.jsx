import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Disc,
  ArrowLeft,
  Radio,
  Grid,
  List,
  Search,
  Loader2,
  LayoutGrid,
  X,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import CoverArt from './CoverArt';

export default function RadioStationSelector({
  supabasePlaylist = [],
  mediaAlbums = [],
  mediaServerStatus = 'loading',
  mediaServerInfo = null,
  retryMediaServer,
  currentTrack = null,
  currentTrackIndex = 0,
  isPlaying = false,
  togglePlay,
  jumpToTrack = null,
}) {
  const [selectorTab, setSelectorTab] = useState('albums'); // 'queue' | 'albums'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumName, setSelectedAlbumName] = useState(null);
  const [showPreviousTracks, setShowPreviousTracks] = useState(false);
  // 'compact' (mini grid adaptativo), 'grid' (grid estándar Spotify), 'list' (lista densa)
  const [albumDisplayMode, setAlbumDisplayMode] = useState('compact');

  // Lista dinámica de pistas filtradas por búsqueda
  const filteredQueueTracks = useMemo(() => {
    const list = supabasePlaylist || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q)) ||
        (t.album && t.album.toLowerCase().includes(q))
    );
  }, [supabasePlaylist, searchQuery]);

  const isTrackActive = (track) => {
    if (!track || !currentTrack) return false;
    if (track.id && currentTrack.id) return String(track.id) === String(currentTrack.id);
    if (track.streamUrl && currentTrack.streamUrl) return track.streamUrl === currentTrack.streamUrl;
    return track.title === currentTrack.title && track.artist === currentTrack.artist;
  };

  // Separación de Pista Actual vs Siguientes vs Anteriores
  const { currentQueueTrack, nextQueueTracks, previousQueueTracks } = useMemo(() => {
    if (!filteredQueueTracks || filteredQueueTracks.length === 0) {
      return { currentQueueTrack: null, nextQueueTracks: [], previousQueueTracks: [] };
    }

    const foundIndex = filteredQueueTracks.findIndex((track) => isTrackActive(track));

    if (foundIndex !== -1) {
      return {
        currentQueueTrack: filteredQueueTracks[foundIndex],
        nextQueueTracks: filteredQueueTracks.slice(foundIndex + 1),
        previousQueueTracks: filteredQueueTracks.slice(0, foundIndex),
      };
    }

    return {
      currentQueueTrack: filteredQueueTracks[0],
      nextQueueTracks: filteredQueueTracks.slice(1),
      previousQueueTracks: [],
    };
  }, [filteredQueueTracks, currentTrack]);

  // Álbumes del Personal Media Server (con fallback a agrupación local si viene vacío)
  const albumsList = useMemo(() => {
    if (Array.isArray(mediaAlbums) && mediaAlbums.length > 0) {
      return mediaAlbums;
    }

    const groups = {};
    (supabasePlaylist || []).forEach((track, index) => {
      const albumName = (track.album || 'Sencillos').trim();
      if (!groups[albumName]) {
        groups[albumName] = {
          name: albumName,
          album: albumName,
          artist: track.artist || 'Varios Artistas',
          coverUrl: track.coverUrl || track.cover || '',
          cover: track.coverUrl || track.cover || '',
          tracks: [],
        };
      }
      groups[albumName].tracks.push({
        ...track,
        playlistOriginalIndex: track.playlistOriginalIndex ?? index,
      });
    });

    return Object.values(groups).map((g) => ({
      ...g,
      trackCount: g.tracks.length,
      totalDuration: g.tracks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0),
    }));
  }, [mediaAlbums, supabasePlaylist]);

  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albumsList;
    const q = searchQuery.toLowerCase().trim();
    return albumsList.filter(
      (alb) =>
        (alb.name || '').toLowerCase().includes(q) ||
        (alb.artist || '').toLowerCase().includes(q) ||
        (alb.tracks || []).some(
          (t) =>
            (t.title || '').toLowerCase().includes(q) ||
            (t.artist || '').toLowerCase().includes(q)
        )
    );
  }, [albumsList, searchQuery]);

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumName) return null;
    return albumsList.find((a) => a.name === selectedAlbumName) || null;
  }, [albumsList, selectedAlbumName]);

  const activeAlbumTracks = useMemo(() => {
    if (!selectedAlbum) return [];
    const tracks = selectedAlbum.tracks || [];
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q))
    );
  }, [selectedAlbum, searchQuery]);

  const handlePlayTrack = (track) => {
    if (!track || !jumpToTrack) return;

    if (isTrackActive(track) && togglePlay) {
      togglePlay();
      return;
    }

    if (
      typeof track.playlistOriginalIndex === 'number' &&
      track.playlistOriginalIndex >= 0 &&
      track.playlistOriginalIndex < supabasePlaylist.length
    ) {
      jumpToTrack(track.playlistOriginalIndex);
      return;
    }

    const idx = (supabasePlaylist || []).findIndex((t) => String(t.id) === String(track.id));
    if (idx !== -1) {
      jumpToTrack(idx);
    }
  };

  const handlePlayEntireAlbum = (album) => {
    if (!album || !album.tracks || album.tracks.length === 0) return;
    handlePlayTrack(album.tracks[0]);
  };

  const formatDuration = (secs) => {
    if (!secs || isNaN(secs) || !Number.isFinite(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (secs) => {
    if (!secs || isNaN(secs)) return '0 min';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  // ESTADO: CARGANDO
  if (mediaServerStatus === 'loading') {
    return (
      <div className="p-8 bg-white dark:bg-[#12131C] text-black dark:text-white flex flex-col items-center justify-center text-center gap-2.5">
        <Loader2 className="w-7 h-7 animate-spin text-[#1DB954]" />
        <p className="font-black uppercase text-xs tracking-wider">
          Conectando con el servidor de música...
        </p>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
          Verificando estado y cargando biblioteca
        </p>
      </div>
    );
  }

  // ESTADO: FUERA DE LÍNEA
  if (mediaServerStatus === 'offline') {
    return (
      <div className="p-6 sm:p-8 bg-white dark:bg-[#12131C] text-black dark:text-white flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 border-[2.5px] border-black dark:border-red-500/60 bg-red-100 dark:bg-red-950/50 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-black uppercase text-sm tracking-wider">Radio fuera de línea</h3>
          <p className="text-xs text-gray-600 dark:text-slate-400 font-semibold mt-1 max-w-sm">
            El servidor personal de audio no está respondiendo en este momento.
          </p>
          {mediaServerInfo?.updatedAt && (
            <p className="text-[10px] font-mono text-gray-400 mt-1">
              Última actualización: {new Date(mediaServerInfo.updatedAt).toLocaleString('es-CO')}
            </p>
          )}
        </div>
        {retryMediaServer && (
          <button
            onClick={retryMediaServer}
            className="mt-1 px-4 py-2 border-[2px] border-black bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-2.5 sm:p-3 bg-white dark:bg-[#12131C] text-black dark:text-white transition-colors">
      {/* BARRA SUPERIOR INTEGRADA: TABS COMPACTOS + BUSCADOR RÁPIDO + REFRESH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => setSelectorTab('albums')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-[2px] border-black dark:border-slate-700 transition ${
              selectorTab === 'albums'
                ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black dark:border-[#1DB954]'
                : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Disc
              className={`w-3 h-3 ${
                selectorTab === 'albums' ? 'text-amber-400 dark:text-black' : 'text-amber-500'
              }`}
            />
            <span className="truncate">Álbumes ({filteredAlbums.length})</span>
          </button>

          <button
            onClick={() => {
              setSelectorTab('queue');
              setSelectedAlbumName(null);
            }}
            className={`flex-1 py-1.5 px-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-[2px] border-black dark:border-slate-700 transition ${
              selectorTab === 'queue'
                ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black dark:border-[#1DB954]'
                : 'bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio
              className={`w-3 h-3 ${
                selectorTab === 'queue' ? 'text-[#1DB954] dark:text-black' : 'text-[#1DB954]'
              }`}
            />
            <span className="truncate">Pistas ({supabasePlaylist.length})</span>
          </button>

          {retryMediaServer && (
            <button
              onClick={retryMediaServer}
              title="Actualizar catálogo"
              className="p-1.5 border-[2px] border-black dark:border-slate-700 bg-white dark:bg-[#181926] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Buscador rápido en vivo */}
        <div className="relative flex-1 sm:max-w-[210px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectorTab === 'albums' ? 'Buscar álbum o pista...' : 'Filtrar pistas...'}
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
      </div>

      {/* VISTA A: COLA / LISTA DE PISTAS */}
      {selectorTab === 'queue' && (
        <div className="space-y-2.5">
          {!currentQueueTrack && nextQueueTracks.length === 0 ? (
            <div className="p-6 text-center border-[2px] border-dashed border-black/40 dark:border-slate-700 bg-cream-bg dark:bg-[#181926]">
              <Radio className="w-8 h-8 mx-auto text-gray-400 mb-1.5" />
              <p className="font-black uppercase text-xs">No se encontraron pistas</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-bold">
                {searchQuery ? 'Prueba con otro término de búsqueda.' : 'El catálogo del servidor está vacío.'}
              </p>
            </div>
          ) : (
            <>
              {/* SECCIÓN 1: PISTA ACTUAL */}
              {currentQueueTrack && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full bg-[#1DB954] ${
                          isPlaying ? 'animate-ping' : ''
                        }`}
                      />
                      {isPlaying ? 'Sonando Ahora' : 'Seleccionada'}
                    </span>
                  </div>

                  <div
                    onClick={() => handlePlayTrack(currentQueueTrack)}
                    className="p-2 bg-yellow-50/90 dark:bg-[#1DB954]/10 border-[2px] border-black dark:border-[#1DB954]/50 flex items-center justify-between gap-2.5 cursor-pointer transition-all"
                  >
                    <div className="relative w-9 h-9 shrink-0 overflow-hidden border border-black dark:border-[#1DB954]/40 bg-neutral-900">
                      <CoverArt
                        src={currentQueueTrack.coverUrl || currentQueueTrack.cover}
                        alt={currentQueueTrack.title}
                        iconClassName="w-4 h-4 text-neutral-500"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-1 gap-[2px] pointer-events-none">
                          <span className="w-0.5 bg-[#1DB954] animate-eq-1 h-2.5" />
                          <span className="w-0.5 bg-[#1DB954] animate-eq-2 h-3.5" />
                          <span className="w-0.5 bg-[#1DB954] animate-eq-3 h-1.5" />
                          <span className="w-0.5 bg-[#1DB954] animate-eq-4 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-black text-xs uppercase tracking-tight truncate text-red-600 dark:text-[#1DB954]">
                          {currentQueueTrack.title}
                        </p>
                        {isPlaying && (
                          <span className="px-1 py-0.2 bg-[#1DB954] text-black text-[8px] font-black uppercase shrink-0">
                            PLAY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 truncate">
                        {currentQueueTrack.artist || 'Artista desconocido'}
                        {currentQueueTrack.album ? ` • ${currentQueueTrack.album}` : ''}
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

              {/* SECCIÓN 2: A CONTINUACIÓN */}
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
                    {nextQueueTracks.map((track, idx) => (
                      <div
                        key={track.id || `${track.title}-${idx}`}
                        onClick={() => handlePlayTrack(track)}
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

                        <div className="w-7 h-7 shrink-0 overflow-hidden rounded-sm border border-black/20 dark:border-white/10 bg-neutral-900">
                          <CoverArt
                            src={track.coverUrl || track.cover}
                            alt={track.title}
                            iconClassName="w-3.5 h-3.5 text-neutral-500"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-[#1DB954] transition-colors leading-tight">
                            {track.title}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                            {track.artist || 'Artista desconocido'}
                            {track.album ? ` • ${track.album}` : ''}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-mono text-gray-400 group-hover:text-black dark:group-hover:text-white">
                            {formatDuration(track.duration)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN 3: HISTORIAL COLAPSABLE */}
              {previousQueueTracks.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPreviousTracks(!showPreviousTracks)}
                    className="w-full py-1 px-2 border border-dashed border-black/25 dark:border-slate-700 font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:text-black dark:hover:text-white transition flex items-center justify-center gap-1.5 bg-cream-bg/30 dark:bg-white/5"
                  >
                    <span>
                      {showPreviousTracks
                        ? '▲ Ocultar anteriores'
                        : `▼ Pistas anteriores (${previousQueueTracks.length})`}
                    </span>
                  </button>

                  {showPreviousTracks && (
                    <div className="mt-1 flex flex-col divide-y divide-black/10 dark:divide-slate-800 border border-black/20 dark:border-slate-800 bg-black/5 dark:bg-black/20 max-h-40 overflow-y-auto custom-scrollbar">
                      {previousQueueTracks.map((track, idx) => (
                        <div
                          key={track.id || `${track.title}-prev-${idx}`}
                          onClick={() => handlePlayTrack(track)}
                          className="flex items-center gap-2 px-2.5 py-1 hover:bg-black/10 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <span className="w-4 text-center font-mono text-[10px] text-gray-400 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-6 h-6 shrink-0 overflow-hidden bg-neutral-900 rounded-sm">
                            <CoverArt
                              src={track.coverUrl || track.cover}
                              alt={track.title}
                              className="w-full h-full object-cover grayscale opacity-70"
                              iconClassName="w-3 h-3 text-neutral-500"
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

      {/* VISTA B: GRID ADAPTATIVO DE ÁLBUMES */}
      {selectorTab === 'albums' && !selectedAlbum && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#1DB954]" />
              <span>Biblioteca de Álbumes ({filteredAlbums.length})</span>
            </span>
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-[#181926] p-0.5 border border-black/20 dark:border-slate-700 rounded">
              <button
                onClick={() => setAlbumDisplayMode('compact')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition flex items-center gap-1 ${
                  albumDisplayMode === 'compact'
                    ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="Cuadrícula compacta adaptativa"
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

          {filteredAlbums.length === 0 ? (
            <div className="p-6 text-center border-[2px] border-dashed border-black/30 dark:border-slate-700 bg-cream-bg dark:bg-[#181926]">
              <Disc className="w-8 h-8 mx-auto text-gray-400 mb-1.5" />
              <p className="font-black uppercase text-xs">No se encontraron álbumes</p>
            </div>
          ) : albumDisplayMode !== 'list' ? (
            <div
              className={`grid gap-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5 ${
                albumDisplayMode === 'compact'
                  ? 'grid-cols-[repeat(auto-fill,minmax(92px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(104px,1fr))]'
                  : 'grid-cols-[repeat(auto-fill,minmax(125px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]'
              }`}
            >
              {filteredAlbums.map((album) => {
                const isCurrentPlayingInAlbum = (album.tracks || []).some((t) => isTrackActive(t));

                return (
                  <div
                    key={album.name}
                    onClick={() => setSelectedAlbumName(album.name)}
                    className={`group relative cursor-pointer rounded-md p-1.5 transition-all duration-200 select-none border ${
                      isCurrentPlayingInAlbum
                        ? 'bg-[#1DB954]/10 border-[#1DB954] ring-1 ring-[#1DB954]/40'
                        : 'bg-gray-50/80 dark:bg-[#181926] hover:bg-gray-100 dark:hover:bg-[#232536] border-black/15 dark:border-white/5'
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded bg-neutral-900 mb-1.5 shadow-sm">
                      <CoverArt
                        src={album.coverUrl || album.cover}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        iconClassName="w-6 h-6 text-slate-600"
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEntireAlbum(album);
                        }}
                        title={`Reproducir álbum ${album.name}`}
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 text-black shadow-lg flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                      </button>

                      {isCurrentPlayingInAlbum && (
                        <div className="absolute top-1 left-1">
                          <span className="px-1 py-0.2 bg-[#1DB954] text-black text-[8px] font-black uppercase rounded-sm">
                            {isPlaying ? 'PLAY' : 'ACTIVO'}
                          </span>
                        </div>
                      )}

                      <div className="absolute top-1 right-1">
                        <span className="px-1 py-0.2 bg-black/75 text-white text-[8px] font-mono font-bold rounded-sm">
                          {album.trackCount}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="font-bold text-[11px] text-black dark:text-white truncate leading-tight"
                        title={album.name}
                      >
                        {album.name}
                      </p>
                      <p
                        className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5"
                        title={album.artist}
                      >
                        {album.artist}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-black/10 dark:divide-white/5 border-[2px] border-black dark:border-slate-700 max-h-[380px] overflow-y-auto custom-scrollbar">
              {filteredAlbums.map((album) => {
                const isCurrentPlayingInAlbum = (album.tracks || []).some((t) => isTrackActive(t));

                return (
                  <div
                    key={album.name}
                    onClick={() => setSelectedAlbumName(album.name)}
                    className={`group flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer transition-colors select-none ${
                      isCurrentPlayingInAlbum
                        ? 'bg-[#1DB954]/10'
                        : 'bg-white dark:bg-[#181926] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative w-8 h-8 flex-shrink-0 overflow-hidden rounded-sm bg-neutral-900 border border-black/20 dark:border-white/10">
                      <CoverArt
                        src={album.coverUrl || album.cover}
                        alt={album.name}
                        iconClassName="w-4 h-4 text-slate-600"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-black dark:text-white truncate leading-tight">
                          {album.name}
                        </p>
                        {isCurrentPlayingInAlbum && (
                          <span className="px-1 py-0.2 bg-[#1DB954] text-black text-[8px] font-black uppercase flex-shrink-0">
                            {isPlaying ? 'PLAY' : 'ACTIVO'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                        {album.artist}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right flex items-center gap-2">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-black dark:text-white">
                          {album.trackCount} pistas
                        </p>
                        <p className="text-[9px] font-mono text-gray-400">
                          {formatTotalTime(album.totalDuration)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEntireAlbum(album);
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

      {/* VISTA C: DETALLE DE CANCIONES DEL ÁLBUM SELECCIONADO */}
      {selectorTab === 'albums' && selectedAlbum && (
        <div>
          <div className="mb-2.5">
            <button
              onClick={() => setSelectedAlbumName(null)}
              className="inline-flex items-center gap-1 mb-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Volver a Álbumes</span>
            </button>

            <div className="p-2.5 border-[2px] border-black dark:border-slate-700 bg-neutral-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-slate-800 border border-white/20">
                  <CoverArt
                    src={selectedAlbum.coverUrl || selectedAlbum.cover}
                    alt={selectedAlbum.name}
                    iconClassName="w-5 h-5 text-slate-500"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#1DB954] block">
                    Álbum • {selectedAlbum.trackCount} pistas (
                    {formatTotalTime(selectedAlbum.totalDuration)})
                  </span>
                  <h4 className="font-black text-xs sm:text-sm text-white truncate leading-tight">
                    {selectedAlbum.name}
                  </h4>
                  <p className="text-[11px] text-gray-300 truncate">{selectedAlbum.artist}</p>
                </div>
              </div>

              <button
                onClick={() => handlePlayEntireAlbum(selectedAlbum)}
                className="px-3 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-[11px] font-black uppercase transition flex items-center gap-1 shrink-0 shadow-md"
              >
                <Play className="w-3 h-3 fill-black" />
                <span>Play</span>
              </button>
            </div>
          </div>

          {activeAlbumTracks.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-black/30 dark:border-slate-700 bg-cream-bg dark:bg-[#181926]">
              <p className="font-bold uppercase text-xs text-gray-500">
                No hay canciones que coincidan
              </p>
            </div>
          ) : (
            <div className="border-[2px] border-black dark:border-slate-700 divide-y divide-black/10 dark:divide-white/5 max-h-[320px] overflow-y-auto custom-scrollbar">
              {activeAlbumTracks.map((track, idx) => {
                const active = isTrackActive(track);

                return (
                  <div
                    key={track.id || idx}
                    className={`group flex items-center justify-between px-2.5 py-1.5 transition-colors cursor-pointer select-none ${
                      active
                        ? 'bg-[#1DB954]/15'
                        : 'bg-white dark:bg-[#191a27] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                      <div className="w-5 text-center shrink-0">
                        {active ? (
                          <span className="flex items-center justify-center text-[#1DB954]">
                            {isPlaying ? (
                              <Pause className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </span>
                        ) : (
                          <>
                            <span className="font-mono text-[11px] text-gray-400 group-hover:hidden">
                              {track.trackNumber || idx + 1}
                            </span>
                            <span className="hidden group-hover:flex items-center justify-center text-black dark:text-[#1DB954]">
                              <Play className="w-3 h-3 fill-current" />
                            </span>
                          </>
                        )}
                      </div>

                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <p
                            className={`font-bold text-xs truncate leading-tight ${
                              active
                                ? 'text-red-600 dark:text-[#1DB954] font-black'
                                : 'text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-[#1DB954]'
                            }`}
                          >
                            {track.title}
                          </p>
                          {active && isPlaying && (
                            <span className="bg-[#1DB954] text-black text-[8px] font-black uppercase px-1 flex-shrink-0">
                              PLAY
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate leading-tight">
                          {track.artist || selectedAlbum.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {track.sizeFormatted && (
                        <span className="hidden sm:inline font-mono text-[9px] text-gray-400">
                          {track.sizeFormatted}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-gray-400">
                        {formatDuration(track.duration)}
                      </span>
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
