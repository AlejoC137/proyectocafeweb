import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';

export default function PlayerCenter({
  currentTrack,
  nowPlaying,
  isPlaying,
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
  audioError
}) {
  const [showVolume, setShowVolume] = useState(false);
  const borderColor = "border-[#1F2937]";
  const shadowColor = "shadow-[6px_6px_0px_0px_rgba(255,0,0,1)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  return (
    <div className={`rounded-none border-[3px] ${borderColor} ${shadowColor} relative w-full pt-[100%] overflow-hidden bg-black group flex-shrink-0`}>
      <div className="absolute inset-0 flex flex-col">
        <img 
          src={currentTrack?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=900'} 
          alt={currentTrack?.title || 'Radio'}
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 pointer-events-none" />

        {/* Top Bar: Badge EN VIVO + Volumen */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
          {currentTrack?.isLiveStream ? (
            <div className="bg-[#FF0000] border-[2px] border-black text-black px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-black">En Vivo</span>
            </div>
          ) : <div />}

          {/* Control de Volumen Vertical Interactivo */}
          <div 
            className="pointer-events-auto relative flex flex-col items-center bg-white border-[3px] border-[#1F2937] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2 transition-all duration-300"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button onClick={toggleMute} className="text-black hover:scale-110 transition-transform">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-600" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className={`overflow-hidden transition-all duration-300 flex flex-col items-center ${showVolume ? 'h-24 mt-3' : 'h-0 mt-0'}`}>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="appearance-none cursor-pointer w-20 h-2 bg-gray-200 border-[2px] border-[#1F2937] -rotate-90 origin-center translate-y-10"
                style={{ accentColor: '#1F2937' }}
              />
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {audioError && (
          <div className="absolute top-20 left-4 right-4 z-20">
            <div className={`px-4 py-3 border-[3px] ${borderColor} bg-red-100 text-red-700 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] text-xs font-black uppercase text-center rounded-none`}>
              ⚠️ {audioError}
            </div>
          </div>
        )}

        {/* Info sobre el cover */}
        <div className="absolute bottom-28 left-0 right-0 p-6 pt-0 z-10 pointer-events-none flex flex-col justify-end items-start">
          <h2 className="text-2xl sm:text-4xl font-black leading-tight mb-2 line-clamp-2 uppercase text-white tracking-widest" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            {currentTrack?.title || 'Selecciona una estación'}
          </h2>
          <p className="text-sm font-black truncate uppercase text-white bg-[#1F2937] inline-block px-2 py-0.5 border-[2px] border-white max-w-full">
            {nowPlaying?.artist || currentTrack?.artist || 'Proyecto Café Radio'}
          </p>
          {nowPlaying?.album && (
            <p className="text-xs mt-2 font-bold truncate uppercase text-white opacity-80 max-w-full">💿 {nowPlaying.album}</p>
          )}
        </div>

        {/* Controles Principales SUPERPUESTOS */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 px-4 z-20">
          <button onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all ${buttonHover} rounded-none ${isShuffle ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={prevTrack} disabled={!currentTrack?.url}
            className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all ${buttonHover} bg-white text-black rounded-none disabled:opacity-50`}
          >
            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={togglePlay} disabled={!currentTrack?.url}
            className={`w-14 h-14 sm:w-16 sm:h-16 border-[3px] ${borderColor} shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] flex items-center justify-center bg-yellow-100 text-black transition-all ${buttonHover} rounded-none disabled:opacity-50`}
          >
            {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
          </button>
          <button onClick={nextTrack} disabled={!currentTrack?.url}
            className={`p-3 sm:p-4 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all ${buttonHover} bg-white text-black rounded-none disabled:opacity-50`}
          >
            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={() => setIsRepeatSingle(!isRepeatSingle)}
            className={`p-2 sm:p-3 border-[3px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all ${buttonHover} rounded-none ${isRepeatSingle ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Barra de Progreso Superpuesta en el borde inferior (Solo Local) */}
        {!currentTrack?.isLiveStream && (
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
