import React from 'react';
import { Radio, RotateCw, Info, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RadioHeader({ isPlaying, nowPlaying, currentTrack, isSyncing, isDailyLoop, setIsDailyLoop, setShowInfoModal }) {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 w-full px-4 pt-6 pb-4 flex items-center justify-between" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
            <Radio className="w-7 h-7 text-black" />
          </div>
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-[2px] border-black animate-ping" />
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-black" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Proyecto Café Radio
          </h1>
          <p className="text-xs font-bold text-black uppercase tracking-widest mt-1">
            {isSyncing ? 'Sincronizando...' : isPlaying ? 'En transmisión · ' + (nowPlaying?.title || currentTrack?.title || 'En vivo') : 'En pausa · Selección Curada'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setIsDailyLoop(!isDailyLoop)}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white rounded-none ${
            isDailyLoop ? 'bg-yellow-100 text-black' : 'bg-white text-black'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${isDailyLoop ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          Bucle
        </button>
        <button onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white text-black hover:bg-black hover:text-white rounded-none"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">Info</span>
        </button>
        <button onClick={() => navigate('/RadioManager')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-cobalt-blue text-white hover:bg-black hover:text-white rounded-none"
        >
          <Settings className="w-4 h-4" />
          Admin
        </button>
      </div>
    </div>
  );
}
