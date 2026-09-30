import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Youtube, ListMusic, X } from 'lucide-react';
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
  const [showVolume, setShowVolume] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);

  const borderColor = "border-[#1F2937] dark:border-slate-600";
  const shadowColor = "shadow-[6px_6px_0px_0px_rgba(255,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(239,68,68,0.7)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  const isYoutubeTrack = currentTrack?.type === 'youtube' || activeTab === 'youtube' || Boolean(currentTrack?.youtubeId);
  const ytId = currentTrack?.youtubeId || extractYoutubeId(currentTrack?.url);
  const listId = currentTrack?.listId || extractPlaylistId(currentTrack?.url || currentTrack?.youtube_url);

  const iframeContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const nextTrackRef = useRef(nextTrack);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

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
            autoplay: isPlaying ? 1 : 0,
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
                if (isMuted) event.target.mute();
                if (isPlaying) event.target.playVideo();
              } catch (e) { }
            },
            onStateChange: (event) => {
              // event.data === 0 (ENDED -> Video finalizado)
              if (event.data === 0) {
                console.log("🎵 YouTube Iframe API: Video Finalizado (ENDED). Avanzando a la siguiente pista...");
                if (isRepeatSingle) {
                  try {
                    event.target.seekTo(0, true);
                    event.target.playVideo();
                  } catch (e) { }
                } else if (nextTrackRef.current) {
                  nextTrackRef.current();
                }
              } else if (event.data === 1 && !isPlaying) {
                if (setIsPlaying) setIsPlaying(true);
              } else if (event.data === 2 && isPlaying) {
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

  const handleSeekWrapper = (e) => {
    if (isYoutubeTrack) {
      const seekPercent = parseFloat(e.target.value);
      const targetTime = (seekPercent / 100) * (ytDuration || 0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(targetTime, true);
        } catch (err) { }
      }
      setYtCurrentTime(targetTime);
    } else {
      handleSeek(e);
    }
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

  const ytProgress = ytDuration > 0 ? (ytCurrentTime / ytDuration) * 100 : 0;
  const activeProgress = isYoutubeTrack ? ytProgress : progress;
  const activeTimeStr = isYoutubeTrack ? formatTime(ytCurrentTime) : formatTime(currentTime);
  const activeDurStr = isYoutubeTrack ? formatTime(ytDuration) : formatTime(duration);

  const isYoutubeMix = listId && listId.startsWith('RD');

  return (
    <div className={`rounded-none border-[3px] ${borderColor} ${shadowColor} relative w-full pt-[100%] overflow-hidden bg-black group flex-shrink-0 transition-all`}>
      <div className="absolute inset-0 flex flex-col">
        {isYoutubeTrack && ytId ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-auto">
            <div ref={iframeContainerRef} className="w-full h-full" />
          </div>
        ) : (
          <img
            src={currentTrack?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=900'}
            alt={currentTrack?.title || 'Radio'}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=900'; }}
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-70"
          />
        )}

        {/* Degradado para visibilidad de texto y controles */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none z-10 ${isYoutubeTrack ? 'opacity-30 hover:opacity-60 transition-opacity' : 'opacity-90'}`} />

        {/* Top Bar: Badge EN VIVO / YOUTUBE / MIX + Botón Cola (10) + Volumen */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
          {isYoutubeTrack ? (
            <div className="bg-[#FF0000] border-[2px] border-black text-white px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
              <Youtube className="w-4 h-4 fill-current text-white animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-white">
                {isYoutubeMix ? 'YouTube Mix' : (listId ? 'YouTube Playlist' : 'YouTube Video')}
              </span>
            </div>
          ) : currentTrack?.isLiveStream ? (
            <div className="bg-[#FF0000] border-[2px] border-black text-black px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-black">En Vivo</span>
            </div>
          ) : <div />}

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Botón Cola de Reproducción (10 canciones: 5 atrás y 5 adelante) */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              title="Cola de reproducción (10 canciones: 5 anteriores y 5 siguientes)"
              className={`px-2.5 py-1.5 border-[2.5px] border-black text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 rounded-none ${showQueue ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white'
                }`}
            >
              <ListMusic className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Cola</span>
              <span className="bg-black text-yellow-300 dark:bg-yellow-400 dark:text-black px-1 text-[10px] font-mono">10</span>
            </button>

            {/* Control de Volumen Vertical Interactivo */}
            <div
              className="relative flex flex-col items-center bg-white dark:bg-[#1e1f2e] border-[3px] border-[#1F2937] dark:border-slate-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] p-2 transition-all duration-300 rounded-none"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button onClick={toggleMuteWrapper} className="text-black dark:text-white hover:scale-110 transition-transform">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-600" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 flex flex-col items-center ${showVolume ? 'h-24 mt-3' : 'h-0 mt-0'}`}>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChangeWrapper}
                  className="appearance-none cursor-pointer w-20 h-2 bg-gray-200 dark:bg-slate-700 border-[2px] border-[#1F2937] dark:border-slate-500 -rotate-90 origin-center translate-y-10"
                  style={{ accentColor: '#1F2937' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAY INTERACTIVO: COLA DE REPRODUCCIÓN (10 PISTAS: 5 ATRÁS Y 5 ADELANTE) */}
        {showQueue && queueWindow && (
          <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-hidden pointer-events-auto text-white border-[4px] border-yellow-400 animate-fade-in">
            <div className="flex items-center justify-between border-b-2 border-white/20 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-yellow-400" />
                <h4 className="font-black text-sm uppercase tracking-widest text-yellow-400" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                  Cola de Reproducción (10 Pistas)
                </h4>
              </div>
              <button
                onClick={() => setShowQueue(false)}
                className="p-1 px-2 border-2 border-white bg-black hover:bg-white hover:text-black font-black text-[11px] uppercase transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {/* 5 CANCIONES ANTERIORES (HISTORIAL) */}
              {queueWindow.history && queueWindow.history.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-0.5">
                    <SkipBack className="w-3 h-3 text-gray-400" /> 5 Anteriores (Historial reciente)
                  </p>
                  {queueWindow.history.map((t, idx) => (
                    <div
                      key={`hist-${t.id || idx}`}
                      onClick={() => { if (jumpToTrack) jumpToTrack(t.playlistIndex); setShowQueue(false); }}
                      className="p-1.5 bg-white/5 hover:bg-white/20 cursor-pointer border-l-2 border-gray-500 flex items-center justify-between truncate transition-colors"
                      title="Saltar a esta canción del historial"
                    >
                      <div className="truncate flex items-center gap-2">
                        <span className="font-mono text-[9px] text-gray-400">-{queueWindow.history.length - idx}</span>
                        <span className="truncate opacity-75">{t.title}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono flex-shrink-0 ml-2">Historial</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CANCIÓN ACTUAL */}
              {queueWindow.current && (
                <div className="p-2 bg-yellow-400 text-black border-[2px] border-black font-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] my-1">
                  <div className="flex items-center gap-2 truncate">
                    <Volume2 className="w-4 h-4 animate-bounce flex-shrink-0" />
                    <span className="truncate uppercase text-xs">{queueWindow.current.title}</span>
                  </div>
                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider flex-shrink-0 animate-pulse">
                    AL AIRE
                  </span>
                </div>
              )}

              {/* 5 CANCIONES SIGUIENTES (EN ESPERA PRECARGADAS) */}
              {queueWindow.upcoming && queueWindow.upcoming.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-0.5">
                    <SkipForward className="w-3 h-3 text-yellow-400" /> 5 Siguientes (Precargadas en buffer)
                  </p>
                  {queueWindow.upcoming.map((t, idx) => (
                    <div
                      key={`up-${t.id || idx}`}
                      onClick={() => { if (jumpToTrack) jumpToTrack(t.playlistIndex); setShowQueue(false); }}
                      className="p-1.5 bg-white/10 hover:bg-yellow-400 hover:text-black cursor-pointer border-l-2 border-yellow-400 flex items-center justify-between truncate transition-colors group"
                      title="Reproducir ahora (Precargada)"
                    >
                      <div className="truncate flex items-center gap-2">
                        <span className="font-mono text-[9px] text-yellow-400 group-hover:text-black">+{idx + 1}</span>
                        <span className="truncate font-semibold">{t.title}</span>
                      </div>
                      <span className="text-[9px] opacity-75 group-hover:opacity-100 flex-shrink-0 ml-2 font-mono">En espera</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-gray-300">
              <span>{isShuffle ? 'Modo Aleatorio ACTIVO' : 'Modo Secuencial'}</span>
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className="underline hover:text-yellow-400 font-bold"
              >
                Cambiar a {isShuffle ? 'Orden Secuencial' : 'Aleatorio'}
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {audioError && (
          <div className="absolute top-20 left-4 right-4 z-20">
            <div className={`px-4 py-3 border-[3px] ${borderColor} bg-red-100 dark:bg-red-950 dark:text-red-300 text-red-700 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] text-xs font-black uppercase text-center rounded-none`}>
              ⚠️ {audioError}
            </div>
          </div>
        )}

        {/* Info sobre el cover / título */}
        <div className="absolute bottom-32 sm:bottom-36 left-0 right-0 p-4 sm:p-6 pt-0 z-10 pointer-events-none flex flex-col justify-end items-start">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight mb-1 sm:mb-2 line-clamp-2 uppercase text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            {currentTrack?.title || 'Selecciona una estación'}
          </h2>
          <p className="text-xs sm:text-sm font-black truncate uppercase text-white bg-[#1F2937] dark:bg-slate-900 inline-block px-2 py-0.5 border-[2px] border-white dark:border-slate-400 max-w-full">
            {nowPlaying?.artist || currentTrack?.artist || 'Proyecto Café Radio'}
          </p>
          {currentTrack?.category && !isYoutubeTrack && (
            <p className="text-[10px] sm:text-xs mt-1 font-bold truncate uppercase text-yellow-300 bg-black/80 px-2 py-0.5 border-[1px] border-yellow-300">
              🏷️ {currentTrack.category}
            </p>
          )}
        </div>



        {/* Controles Principales SUPERPUESTOS */}
        <div className={`absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 px-4 z-20 ${isYoutubeTrack ? 'bg-black/60 backdrop-blur-sm py-2' : ''
          }`}>
          {isYoutubeTrack ? (
            <>
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                title={isShuffle ? "Modo aleatorio (Shuffle) ACTIVADO" : "Activar modo aleatorio (Shuffle)"}
                className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} rounded-none ${isShuffle
                    ? 'bg-yellow-400 text-black border-yellow-400 font-black ring-2 ring-yellow-400'
                    : 'bg-white text-black dark:bg-[#1e1f2e] dark:text-white'
                  }`}
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handlePrevWrapper}
                disabled={!currentTrack?.url && !ytId}
                title="Pista anterior"
                className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} bg-white text-black dark:bg-[#1e1f2e] dark:text-white rounded-none disabled:opacity-50`}
              >
                <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={handleMainPlayToggle}
                disabled={!currentTrack?.url && !ytId}
                title={isPlaying ? "Pausar" : "Reproducir"}
                className={`w-14 h-14 sm:w-16 sm:h-16 border-[3px] ${borderColor} shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.6)] flex items-center justify-center bg-red-600 text-white border-black transition-all ${buttonHover} rounded-none disabled:opacity-50`}
              >
                {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
              </button>

              <button
                onClick={handleNextWrapper}
                disabled={!currentTrack?.url && !ytId}
                title="Siguiente pista"
                className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} bg-white text-black dark:bg-[#1e1f2e] dark:text-white rounded-none disabled:opacity-50`}
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={() => setIsRepeatSingle(!isRepeatSingle)}
                title={isRepeatSingle ? "Repetir 1 canción activado" : "Repetir 1 canción"}
                className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} rounded-none ${isRepeatSingle ? 'bg-black text-white dark:bg-yellow-400 dark:text-black dark:border-yellow-400' : 'bg-white text-black dark:bg-[#1e1f2e] dark:text-white'
                  }`}
              >
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          ) : (
            /* CONTROL EN VIVO INCORRUPTIBLE: Solo Mute / Desmutear */
            <div className="flex flex-col items-center gap-1.5 w-full max-w-sm px-2">
              <button
                onClick={toggleMuteWrapper}
                className={`w-full py-3 px-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] rounded-none ${isMuted || volume === 0
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                  }`}
                title={isMuted ? "Activar audio" : "Silenciar audio"}
              >
                {isMuted || volume === 0 ? (
                  <>
                    <VolumeX className="w-5 h-5 text-white animate-bounce flex-shrink-0" />
                    <span>Activar Sonido (Desmutear)</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 flex-shrink-0" />
                    <span>Silenciar Transmisión (Mute)</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/80 bg-black/80 px-2 py-0.5 border border-white/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>Señal en vivo </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
