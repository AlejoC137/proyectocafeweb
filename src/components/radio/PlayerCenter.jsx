import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Youtube } from 'lucide-react';
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
  isRepeatSingle,
  setIsRepeatSingle,
  audioError,
  activeTab
}) {
  const [showVolume, setShowVolume] = useState(false);
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
        try { ytPlayerRef.current.destroy(); } catch (e) {}
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
              } catch (e) {}
            },
            onStateChange: (event) => {
              // event.data === 0 (ENDED -> Video finalizado)
              if (event.data === 0) {
                console.log("🎵 YouTube Iframe API: Video Finalizado (ENDED). Avanzando a la siguiente pista...");
                if (isRepeatSingle) {
                  try {
                    event.target.seekTo(0, true);
                    event.target.playVideo();
                  } catch (e) {}
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
        try { ytPlayerRef.current.destroy(); } catch (e) {}
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
      } catch (e) {}
    }
  }, [isPlaying, isYoutubeTrack]);

  // Escuchar eventos e info de tiempo del IFrame de YouTube API
  useEffect(() => {
    const handleYoutubeEvent = (event) => {
      if (!isYoutubeTrack) return;
      try {
        let payload = event.data;
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }
        if (payload) {
          const evt = payload.event;
          const info = payload.info;
          let curTime = ytCurrentTime;
          let dur = ytDuration;

          if (info && typeof info === 'object') {
            if (typeof info.currentTime === 'number') {
              curTime = info.currentTime;
              setYtCurrentTime(curTime);
            }
            if (typeof info.duration === 'number' && info.duration > 0) {
              dur = info.duration;
              setYtDuration(dur);
            }
            if (typeof info.playerState === 'number') {
              const pState = info.playerState;
              if (pState === 1 && !isPlaying) {
                if (setIsPlaying) setIsPlaying(true);
              } else if (pState === 2 && isPlaying) {
                if (setIsPlaying) setIsPlaying(false);
              }
            }
          } else if (typeof payload.info === 'number') {
            if (payload.func === 'getCurrentTime') {
              curTime = payload.info;
              setYtCurrentTime(curTime);
            } else if (payload.func === 'getDuration') {
              dur = payload.info;
              setYtDuration(dur);
            }
          }

          const state = info?.playerState ?? payload.infoState ?? (typeof info === 'number' ? info : undefined);
          const isEnded = state === 0 || (dur > 3 && curTime >= dur - 1.2);

          if ((evt === 'onReady' || evt === 'initialDelivery') && isPlaying) {
            iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }

          // State 0 === ENDED o tiempo alcanzado -> Avanzar automáticamente al siguiente video
          if (isEnded && !hasTriggeredNextRef.current) {
            hasTriggeredNextRef.current = true;
            if (isRepeatSingle) {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
                iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
              }
              setTimeout(() => { hasTriggeredNextRef.current = false; }, 2000);
            } else if (nextTrack) {
              console.log("🎵 Video de YouTube finalizado. Avanzando automáticamente al siguiente tema...");
              nextTrack();
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleYoutubeEvent);
    return () => window.removeEventListener('message', handleYoutubeEvent);
  }, [isYoutubeTrack, nextTrack, isPlaying, isRepeatSingle, setIsPlaying, ytCurrentTime, ytDuration]);

  // Escuchar inicio forzado desde el modal AutoStart
  useEffect(() => {
    const handleForcePlay = () => {
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch (e) {}
      }
    };
    window.addEventListener('YT_FORCE_PLAY', handleForcePlay);
    return () => window.removeEventListener('YT_FORCE_PLAY', handleForcePlay);
  }, []);

  const handleMainPlayToggle = () => {
    if (isYoutubeTrack) {
      const nextState = !isPlaying;
      if (setIsPlaying) setIsPlaying(nextState);
      if (iframeRef.current?.contentWindow) {
        try {
          const command = nextState ? 'playVideo' : 'pauseVideo';
          iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"${command}","args":""}`, '*');
        } catch (e) {}
      }
    } else {
      togglePlay();
    }
  };

  const handleNextWrapper = () => {
    if (isYoutubeTrack && listId && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"nextVideo","args":""}', '*');
      } catch (e) {}
    }
    if (nextTrack) nextTrack();
  };

  const handlePrevWrapper = () => {
    if (isYoutubeTrack && listId && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"previousVideo","args":""}', '*');
      } catch (e) {}
    }
    if (prevTrack) prevTrack();
  };

  const handleSeekWrapper = (e) => {
    if (isYoutubeTrack) {
      const seekPercent = parseFloat(e.target.value);
      const targetTime = (seekPercent / 100) * (ytDuration || 0);
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${targetTime}, true]}`, '*');
        } catch (err) {}
      }
      setYtCurrentTime(targetTime);
    } else {
      handleSeek(e);
    }
  };

  const handleVolumeChangeWrapper = (e) => {
    handleVolumeChange(e);
    if (isYoutubeTrack && iframeRef.current?.contentWindow) {
      const val = parseFloat(e.target.value);
      try {
        iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${Math.round(val * 100)}]}`, '*');
      } catch (err) {}
    }
  };

  const toggleMuteWrapper = () => {
    toggleMute();
    if (isYoutubeTrack && iframeRef.current?.contentWindow) {
      try {
        const command = !isMuted ? 'mute' : 'unMute';
        iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"${command}","args":""}`, '*');
      } catch (err) {}
    }
  };

  const ytProgress = ytDuration > 0 ? (ytCurrentTime / ytDuration) * 100 : 0;
  const activeProgress = isYoutubeTrack ? ytProgress : progress;
  const activeTimeStr = isYoutubeTrack ? formatTime(ytCurrentTime) : formatTime(currentTime);
  const activeDurStr = isYoutubeTrack ? formatTime(ytDuration) : formatTime(duration);

  // Si listId empieza con RD (YouTube Mix / Radio Mix automático), YouTube prohíbe el parámetro &list= en incrustaciones.
  // En ese caso, incrustamos el vídeo directamente para garantizar la reproducción fluida.
  const isYoutubeMix = listId && listId.startsWith('RD');
  const validListParam = (listId && !isYoutubeMix) ? `&list=${listId}` : '';
  const originParam = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  const iframeSrc = `https://www.youtube-nocookie.com/embed/${ytId || ''}?autoplay=1&controls=1&enablejsapi=1&origin=${originParam}&rel=0&playsinline=1&modestbranding=1${validListParam}`;

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

        {/* Top Bar: Badge EN VIVO / YOUTUBE / MIX + Volumen */}
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

          {/* Control de Volumen Vertical Interactivo */}
          <div 
            className="pointer-events-auto relative flex flex-col items-center bg-white dark:bg-[#1e1f2e] border-[3px] border-[#1F2937] dark:border-slate-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] p-2 transition-all duration-300"
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

        {/* Barra de Progreso Ultra Minimalista (Solo en pestañas de Archivos / Files) */}
        {(activeTab === 'supabase' || activeTab === 'files' || activeTab === 'local') && !currentTrack?.isLiveStream && (
          <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 sm:left-6 sm:right-6 z-30 flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] px-0.5 select-none">
              <span>{activeTimeStr}</span>
              <span>{activeDurStr}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.1" 
              value={activeProgress || 0} 
              onChange={handleSeekWrapper}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-yellow-400 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black"
              style={{
                background: `linear-gradient(to right, #facc15 0%, #facc15 ${activeProgress || 0}%, rgba(255, 255, 255, 0.3) ${activeProgress || 0}%, rgba(255, 255, 255, 0.3) 100%)`
              }}
              title="Adelantar o retroceder canción"
            />
          </div>
        )}

        {/* Controles Principales SUPERPUESTOS (Ocultos ÚNICAMENTE cuando la pestaña activa es YouTube) */}
        {!isYoutubeTrack && activeTab !== 'youtube' && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 px-4 z-20">
            <button onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} rounded-none ${
                isShuffle ? 'bg-black text-white dark:bg-yellow-400 dark:text-black dark:border-yellow-400' : 'bg-white text-black dark:bg-[#1e1f2e] dark:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={handlePrevWrapper} disabled={!currentTrack?.url && !ytId}
              className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} bg-white text-black dark:bg-[#1e1f2e] dark:text-white rounded-none disabled:opacity-50`}
            >
              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={handleMainPlayToggle} disabled={!currentTrack?.url && !ytId}
              className={`w-14 h-14 sm:w-16 sm:h-16 border-[3px] ${borderColor} shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.6)] flex items-center justify-center bg-yellow-100 text-black dark:bg-yellow-400 dark:text-black dark:border-yellow-400 transition-all ${buttonHover} rounded-none disabled:opacity-50`}
            >
              {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
            </button>
            <button onClick={handleNextWrapper} disabled={!currentTrack?.url && !ytId}
              className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} bg-white text-black dark:bg-[#1e1f2e] dark:text-white rounded-none disabled:opacity-50`}
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={() => setIsRepeatSingle(!isRepeatSingle)}
              className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} rounded-none ${
                isRepeatSingle ? 'bg-black text-white dark:bg-yellow-400 dark:text-black dark:border-yellow-400' : 'bg-white text-black dark:bg-[#1e1f2e] dark:text-white'
              }`}
            >
              <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

