import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Youtube } from 'lucide-react';
import { extractYoutubeId } from '../../utils/youtubeHelpers';

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
  const iframeRef = useRef(null);
  const borderColor = "border-[#1F2937] dark:border-slate-600";
  const shadowColor = "shadow-[6px_6px_0px_0px_rgba(255,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(239,68,68,0.7)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  const isYoutubeTrack = currentTrack?.type === 'youtube' || activeTab === 'youtube' || Boolean(currentTrack?.youtubeId);
  const ytId = currentTrack?.youtubeId || extractYoutubeId(currentTrack?.url);

  // Sincronizar reproducir/pausar con el iframe de YouTube vía postMessage
  useEffect(() => {
    if (isYoutubeTrack && iframeRef.current?.contentWindow) {
      try {
        const command = isPlaying ? 'playVideo' : 'pauseVideo';
        iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"${command}","args":""}`, '*');
      } catch (e) {}
    }
  }, [isPlaying, isYoutubeTrack]);

  // Escuchar fin de video en el IFrame de YouTube API para pasar automáticamente al siguiente video en la lista
  useEffect(() => {
    const handleYoutubeEvent = (event) => {
      if (!isYoutubeTrack) return;
      try {
        let payload = event.data;
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }
        if (payload) {
          const state = payload.info?.playerState ?? payload.infoState ?? payload.info;
          // State 0 === ENDED (Video Terminado -> Avanzar automáticamente al siguiente video)
          if (state === 0 && (payload.event === 'infoDelivery' || payload.event === 'onStateChange')) {
            if (nextTrack) {
              nextTrack();
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleYoutubeEvent);
    return () => window.removeEventListener('message', handleYoutubeEvent);
  }, [isYoutubeTrack, nextTrack]);

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

  return (
    <div className={`rounded-none border-[3px] ${borderColor} ${shadowColor} relative w-full pt-[100%] overflow-hidden bg-black group flex-shrink-0 transition-all`}>
      <div className="absolute inset-0 flex flex-col">
        {isYoutubeTrack && ytId ? (
          <iframe
            ref={iframeRef}
            key={ytId}
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1&modestbranding=1`}
            title={currentTrack?.title || 'YouTube Player'}
            className="absolute inset-0 w-full h-full border-0 object-cover z-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <img 
            src={currentTrack?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=900'} 
            alt={currentTrack?.title || 'Radio'}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=900'; }}
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-70"
          />
        )}
        
        {/* Degradado para visibilidad de texto y controles */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none z-10 ${isYoutubeTrack ? 'opacity-60 hover:opacity-80 transition-opacity' : 'opacity-90'}`} />

        {/* Top Bar: Badge EN VIVO / YOUTUBE + Volumen */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
          {isYoutubeTrack ? (
            <div className="bg-[#FF0000] border-[2px] border-black text-white px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
              <Youtube className="w-4 h-4 fill-current text-white animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-white">YouTube Video</span>
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
            <button onClick={toggleMute} className="text-black dark:text-white hover:scale-110 transition-transform">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-600" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className={`overflow-hidden transition-all duration-300 flex flex-col items-center ${showVolume ? 'h-24 mt-3' : 'h-0 mt-0'}`}>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
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

        {/* Info sobre el cover */}
        <div className="absolute bottom-28 left-0 right-0 p-6 pt-0 z-10 pointer-events-none flex flex-col justify-end items-start">
          <h2 className="text-2xl sm:text-4xl font-black leading-tight mb-2 line-clamp-2 uppercase text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            {currentTrack?.title || 'Selecciona una estación'}
          </h2>
          <p className="text-sm font-black truncate uppercase text-white bg-[#1F2937] dark:bg-slate-900 inline-block px-2 py-0.5 border-[2px] border-white dark:border-slate-400 max-w-full">
            {nowPlaying?.artist || currentTrack?.artist || 'Proyecto Café Radio'}
          </p>
          {currentTrack?.category && (
            <p className="text-xs mt-1 font-bold truncate uppercase text-yellow-300 bg-black/80 px-2 py-0.5 border-[1px] border-yellow-300">
              🏷️ {currentTrack.category}
            </p>
          )}
        </div>

        {/* Controles Principales SUPERPUESTOS */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 px-4 z-20">
          <button onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} rounded-none ${
              isShuffle ? 'bg-black text-white dark:bg-yellow-400 dark:text-black dark:border-yellow-400' : 'bg-white text-black dark:bg-[#1e1f2e] dark:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={prevTrack} disabled={!currentTrack?.url && !ytId}
            className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all ${buttonHover} bg-white text-black dark:bg-[#1e1f2e] dark:text-white rounded-none disabled:opacity-50`}
          >
            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={handleMainPlayToggle} disabled={!currentTrack?.url && !ytId}
            className={`w-14 h-14 sm:w-16 sm:h-16 border-[3px] ${borderColor} shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.6)] flex items-center justify-center bg-yellow-100 text-black dark:bg-yellow-400 dark:text-black dark:border-yellow-400 transition-all ${buttonHover} rounded-none disabled:opacity-50`}
          >
            {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
          </button>
          <button onClick={nextTrack} disabled={!currentTrack?.url && !ytId}
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

        {/* Barra de Progreso Superpuesta en el borde inferior (Solo Local o MP3) */}
        {!currentTrack?.isLiveStream && !isYoutubeTrack && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-1">
            <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek}
              className={`w-full h-1 appearance-none cursor-pointer border-t-[1px] ${borderColor} bg-white opacity-80 hover:opacity-100 transition-opacity`}
              style={{ accentColor: '#1F2937' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

