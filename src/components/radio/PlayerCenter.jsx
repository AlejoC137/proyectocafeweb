import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Youtube, ListMusic, X, Maximize2, Minimize2 } from 'lucide-react';
import { extractYoutubeId, extractPlaylistId } from '../../utils/youtubeHelpers';

export default function PlayerCenter({
  currentTrack,
  nowPlaying,
  isPlaying,
  setIsPlaying,
  volume,
  isMuted,
  handleVolumeChange,
  toggleMute,
  progress,
  handleSeek,
  currentTime,
  duration,
  formatTime,
  isShuffle,
  setIsShuffle,
  prevTrack,
  togglePlay,
  nextTrack,
  jumpToTrack,
  queueWindow,
  isRepeatSingle,
  setIsRepeatSingle,
  audioError,
  activeTab
}) {
  const [showQueue, setShowQueue] = useState(false);
  const [isExpandedCover, setIsExpandedCover] = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);

  const borderColor = "border-[#1F2937] dark:border-slate-700";
  const shadowColor = "shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] dark:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.4)]";

  // Sólo considerar pista de YouTube cuando la pestaña activa es explícitamente 'youtube'
  const isYoutubeTrack = activeTab === 'youtube' && (currentTrack?.type === 'youtube' || Boolean(currentTrack?.youtubeId) || Boolean(extractYoutubeId(currentTrack?.url)));
  const ytId = currentTrack?.youtubeId || extractYoutubeId(currentTrack?.url);
  const listId = currentTrack?.listId || extractPlaylistId(currentTrack?.url || currentTrack?.youtube_url);

  const iframeContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const nextTrackRef = useRef(nextTrack);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const forcePlayRequestedRef = useRef(false);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  // Escuchar evento directo para forzar inicio de YouTube
  useEffect(() => {
    const handleForcePlay = () => {
      forcePlayRequestedRef.current = true;
      if (setIsPlaying) setIsPlaying(true);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          const volVal = isMuted ? 0 : Math.round(volume * 100);
          if (typeof ytPlayerRef.current.setVolume === 'function') {
            ytPlayerRef.current.setVolume(volVal);
          }
          if (isMuted) {
            if (typeof ytPlayerRef.current.mute === 'function') ytPlayerRef.current.mute();
          } else {
            if (typeof ytPlayerRef.current.unMute === 'function') ytPlayerRef.current.unMute();
          }
          ytPlayerRef.current.playVideo();
        } catch (e) { }
      }
    };

    window.addEventListener('YT_FORCE_PLAY', handleForcePlay);
    return () => window.removeEventListener('YT_FORCE_PLAY', handleForcePlay);
  }, [setIsPlaying, isMuted, volume]);

  // Pausar y destruir YouTube inmediatamente si la pestaña activa ya no es YouTube
  useEffect(() => {
    if (!isYoutubeTrack && ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.stopVideo === 'function') ytPlayerRef.current.stopVideo();
        if (typeof ytPlayerRef.current.pauseVideo === 'function') ytPlayerRef.current.pauseVideo();
        if (typeof ytPlayerRef.current.destroy === 'function') ytPlayerRef.current.destroy();
      } catch (e) { }
      ytPlayerRef.current = null;
    }
  }, [isYoutubeTrack]);

  // Cargar el script oficial de YouTube Iframe API si no existe aún
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Inicializar o re-inicializar el reproductor de YouTube mediante la API oficial YT.Player
  useEffect(() => {
    if (!isYoutubeTrack || !ytId) return;

    let isSubscribed = true;

    const createPlayer = () => {
      if (!isSubscribed || !window.YT || !window.YT.Player || !iframeContainerRef.current) return;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch (e) { }
      }

      const isYoutubeMix = listId && listId.startsWith('RD');
      const validList = (listId && !isYoutubeMix) ? listId : undefined;

      try {
        ytPlayerRef.current = new window.YT.Player(iframeContainerRef.current, {
          height: '100%',
          width: '100%',
          videoId: ytId,
          playerVars: {
            autoplay: (isPlaying || forcePlayRequestedRef.current) ? 1 : 0,
            controls: 1,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            ...(validList ? { list: validList, listType: 'playlist' } : {})
          },
          events: {
            onReady: (event) => {
              try {
                const volVal = isMuted ? 0 : Math.round(volume * 100);
                event.target.setVolume(volVal);
                if (isMuted) {
                  event.target.mute();
                } else {
                  event.target.unMute();
                }
                if (isPlayingRef.current || forcePlayRequestedRef.current) {
                  event.target.playVideo();
                }
              } catch (e) { }
            },
            onStateChange: (event) => {
              if (event.data === 0) {
                if (isRepeatSingle) {
                  try {
                    event.target.seekTo(0, true);
                    event.target.playVideo();
                  } catch (e) { }
                } else if (nextTrackRef.current) {
                  nextTrackRef.current();
                }
              } else if (event.data === 1 && !isPlayingRef.current) {
                if (setIsPlaying) setIsPlaying(true);
              } else if (event.data === 2 && isPlayingRef.current) {
                if (setIsPlaying) setIsPlaying(false);
              }
            }
          }
        });
      } catch (err) {
        console.error("Error creando YT.Player:", err);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const timer = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(timer);
          createPlayer();
        }
      }, 250);
      return () => {
        isSubscribed = false;
        clearInterval(timer);
      };
    }

    return () => {
      isSubscribed = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch (e) { }
      }
    };
  }, [ytId, listId, isYoutubeTrack]);

  // Sincronización continua de Play/Pausa con el reproductor YT.Player
  useEffect(() => {
    if (isYoutubeTrack && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      try {
        const state = ytPlayerRef.current.getPlayerState();
        if (isPlaying && state !== 1 && typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        } else if (!isPlaying && state === 1 && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) { }
    }
  }, [isPlaying, isYoutubeTrack]);

  // Sincronización continua de Volumen y Mute con el reproductor YT.Player
  useEffect(() => {
    if (!isYoutubeTrack || !ytPlayerRef.current) return;
    try {
      const volVal = isMuted ? 0 : Math.round(volume * 100);
      if (typeof ytPlayerRef.current.setVolume === 'function') {
        ytPlayerRef.current.setVolume(volVal);
      }
      if (typeof ytPlayerRef.current.mute === 'function' && typeof ytPlayerRef.current.unMute === 'function') {
        if (isMuted || volume === 0) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      }
    } catch (e) { }
  }, [volume, isMuted, isYoutubeTrack]);

  const handleMainPlayToggle = () => {
    if (isYoutubeTrack) {
      const nextState = !isPlaying;
      if (setIsPlaying) setIsPlaying(nextState);
      if (ytPlayerRef.current) {
        try {
          if (nextState && typeof ytPlayerRef.current.playVideo === 'function') {
            ytPlayerRef.current.playVideo();
          } else if (!nextState && typeof ytPlayerRef.current.pauseVideo === 'function') {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (e) { }
      }
    } else {
      togglePlay();
    }
  };

  const handleNextWrapper = () => {
    if (nextTrack) nextTrack();
  };

  const handlePrevWrapper = () => {
    if (prevTrack) prevTrack();
  };

  const handleVolumeChangeWrapper = (e) => {
    handleVolumeChange(e);
    if (isYoutubeTrack) {
      const val = parseFloat(e.target.value);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
        try {
          ytPlayerRef.current.setVolume(Math.round(val * 100));
        } catch (err) { }
      }
    }
  };

  const toggleMuteWrapper = () => {
    toggleMute();
    if (isYoutubeTrack && ytPlayerRef.current) {
      try {
        if (!isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch (err) { }
    }
  };

  const isYoutubeMix = listId && listId.startsWith('RD');
  const coverUrl = currentTrack?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600';

  return (
    <div className={`rounded-none border-[2.5px] ${borderColor} ${shadowColor} relative w-full overflow-hidden bg-[#121212] text-white flex-shrink-0 transition-all`}>
      
      {/* MODO 1: REPRODUCTOR DE VIDEO YOUTUBE (16:9 ADAPTATIVO) */}
      {isYoutubeTrack && ytId ? (
        <div className="flex flex-col">
          <div className="relative aspect-video w-full bg-black overflow-hidden">
            <div ref={iframeContainerRef} className="w-full h-full" />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[#FF0000] border border-black text-white px-2 py-0.5 shadow-md pointer-events-none">
              <Youtube className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isYoutubeMix ? 'YouTube Mix' : (listId ? 'Playlist' : 'YouTube')}
              </span>
            </div>
          </div>

          {/* Barra compacta inferior de controles para YouTube */}
          <div className="p-2.5 bg-[#181818] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="text-xs sm:text-sm font-black uppercase text-white truncate">
                {currentTrack?.title || 'YouTube Video'}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 truncate">
                {nowPlaying?.artist || currentTrack?.artist || 'Proyecto Café Radio'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                title="Aleatorio"
                className={`p-1.5 rounded-lg border transition ${
                  isShuffle
                    ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/15'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handlePrevWrapper}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white border border-white/10 transition"
                title="Anterior"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMainPlayToggle}
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md transition"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={handleNextWrapper}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white border border-white/10 transition"
                title="Siguiente"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsRepeatSingle(!isRepeatSingle)}
                title="Repetir 1"
                className={`p-1.5 rounded-lg border transition ${
                  isRepeatSingle
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/15'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Volumen compacto */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              <button onClick={toggleMuteWrapper} className="text-gray-300 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChangeWrapper}
                className="w-14 sm:w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>
        </div>
      ) : (
        /* MODO 2: REPRODUCTOR DE AUDIO ESTILO SPOTIFY COMPACTO (CON OPCIÓN DE EXPANDIR CARÁTULA) */
        <div className="relative overflow-hidden">
          {/* Fondo atmosférico desenfocado */}
          <img
            src={coverUrl}
            alt=""
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600'; }}
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl scale-110 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/95 via-[#121212]/80 to-[#121212]/95 pointer-events-none" />

          {/* Vista expandida opcional de carátula */}
          {isExpandedCover && (
            <div className="relative z-10 w-full aspect-square max-h-[280px] bg-black/60 flex items-center justify-center p-3 border-b border-white/10">
              <img
                src={coverUrl}
                alt={currentTrack?.title || 'Radio'}
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600'; }}
                className="h-full aspect-square object-cover rounded-lg shadow-2xl border border-white/15"
              />
            </div>
          )}

          {/* Barra Principal Now Playing (Compacta y Sin Desperdicio de Espacio) */}
          <div className="relative z-10 p-2.5 sm:p-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              {/* Carátula Cuadrada Compacta */}
              <div
                onClick={() => setIsExpandedCover(!isExpandedCover)}
                title={isExpandedCover ? "Reducir carátula" : "Ampliar carátula"}
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden shrink-0 border-2 border-white/15 bg-black shadow-lg cursor-pointer group/cover"
              >
                <img
                  src={coverUrl}
                  alt={currentTrack?.title || 'Radio'}
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600'; }}
                  className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-white opacity-0 group-hover/cover:opacity-100 transition-opacity">
                  {isExpandedCover ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </div>
                {isPlaying && (
                  <div className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/75 rounded-sm flex items-end gap-[2px] h-3.5">
                    <span className="w-0.5 bg-[#1DB954] animate-eq-1 h-2" />
                    <span className="w-0.5 bg-[#1DB954] animate-eq-2 h-3" />
                    <span className="w-0.5 bg-[#1DB954] animate-eq-3 h-1.5" />
                  </div>
                )}
              </div>

              {/* Metadatos de la Canción al Aire */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    En Vivo
                  </span>
                  {currentTrack?.category && (
                    <span className="text-[9px] font-bold uppercase text-yellow-300 bg-white/10 px-1.5 py-0.2 truncate">
                      {currentTrack.category}
                    </span>
                  )}
                </div>

                <h2
                  className="text-sm sm:text-base font-black uppercase text-white truncate leading-tight tracking-wide"
                  title={currentTrack?.title || 'Selecciona una estación'}
                >
                  {currentTrack?.title || 'Selecciona una estación'}
                </h2>

                <p className="text-[11px] sm:text-xs font-bold text-gray-300 truncate mt-0.5">
                  {nowPlaying?.artist || currentTrack?.artist || 'Proyecto Café Radio'}
                </p>
              </div>

              {/* Acciones Rápidas Derecha: Botón Cola (10) */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  title="Ventana rápida de 10 pistas (5 anteriores y 5 siguientes)"
                  className={`px-2 py-1 border border-white/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition ${
                    showQueue ? 'bg-yellow-400 text-black border-black' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5 text-[#1DB954]" />
                  <span className="hidden sm:inline">Buffer</span>
                  <span className="bg-black/60 text-yellow-300 px-1 text-[9px] font-mono rounded-sm">10</span>
                </button>
              </div>
            </div>

            {/* Mensaje de Error compacto */}
            {audioError && (
              <div className="px-2.5 py-1.5 border border-red-500/50 bg-red-950/90 text-red-200 text-[11px] font-bold truncate">
                ⚠️ {audioError}
              </div>
            )}

            {/* Barra de Controles de Audio (Mute/Unmute + Slider de Volumen directo estilo Spotify) */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
              <button
                onClick={toggleMuteWrapper}
                className={`py-1.5 px-3 border-[2px] border-black font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  isMuted || volume === 0
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
                }`}
                title={isMuted ? "Activar audio" : "Silenciar transmisión"}
              >
                {isMuted || volume === 0 ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-white animate-bounce shrink-0" />
                    <span>Activar Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Silenciar</span>
                  </>
                )}
              </button>

              {/* Slider de Volumen Horizontal Siempre Accesible */}
              <div className="flex items-center gap-2 flex-1 max-w-[180px] bg-black/40 px-2.5 py-1 rounded border border-white/10">
                <button onClick={toggleMuteWrapper} className="text-gray-300 hover:text-white shrink-0">
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-[#1DB954]" />}
                </button>
                <input
                  type="range"
                  min="0" max="1" step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChangeWrapper}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                  title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
                <span className="text-[10px] font-mono font-bold text-gray-300 w-7 text-right shrink-0">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL DESPLEGABLE DE BUFFER (10 PISTAS: 5 ATRÁS Y 5 ADELANTE) */}
      {showQueue && queueWindow && (
        <div className="border-t-2 border-yellow-400 bg-neutral-950 p-3 text-white animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/15 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <ListMusic className="w-4 h-4 text-yellow-400" />
              <h4 className="font-black text-xs uppercase tracking-wider text-yellow-400">
                Ventana de Reproducción (10 Pistas)
              </h4>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="px-1.5 py-0.5 border border-white/30 hover:bg-white hover:text-black font-bold text-[10px] uppercase transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cerrar
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs custom-scrollbar">
            {queueWindow.history && queueWindow.history.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">5 Anteriores</p>
                {queueWindow.history.map((t, idx) => (
                  <div
                    key={`hist-${t.id || idx}`}
                    onClick={() => { if (jumpToTrack) jumpToTrack(t.playlistIndex); setShowQueue(false); }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/15 cursor-pointer border-l-2 border-gray-500 flex items-center justify-between truncate text-[11px]"
                  >
                    <span className="truncate opacity-75">{t.title}</span>
                    <span className="text-[9px] text-gray-400 font-mono ml-2">-{queueWindow.history.length - idx}</span>
                  </div>
                ))}
              </div>
            )}

            {queueWindow.current && (
              <div className="px-2 py-1 bg-yellow-400 text-black font-black flex items-center justify-between text-[11px]">
                <span className="truncate uppercase">{queueWindow.current.title}</span>
                <span className="bg-red-600 text-white text-[8px] font-black px-1 uppercase">LIVE</span>
              </div>
            )}

            {queueWindow.upcoming && queueWindow.upcoming.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-yellow-300 uppercase tracking-wider">5 Siguientes</p>
                {queueWindow.upcoming.map((t, idx) => (
                  <div
                    key={`up-${t.id || idx}`}
                    onClick={() => { if (jumpToTrack) jumpToTrack(t.playlistIndex); setShowQueue(false); }}
                    className="px-2 py-1 bg-white/10 hover:bg-yellow-400 hover:text-black cursor-pointer border-l-2 border-yellow-400 flex items-center justify-between truncate text-[11px]"
                  >
                    <span className="truncate font-semibold">{t.title}</span>
                    <span className="text-[9px] font-mono ml-2">+{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
