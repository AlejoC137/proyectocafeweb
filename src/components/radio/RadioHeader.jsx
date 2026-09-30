import React, { useState, useEffect } from 'react';
import { Radio, RotateCw, Info, Settings, Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RadioHeader({ 
  isPlaying, 
  nowPlaying, 
  currentTrack, 
  isSyncing, 
  isDailyLoop, 
  setIsDailyLoop, 
  setShowInfoModal,
  isDarkMode,
  toggleDarkMode 
}) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour12: true, hour: 'numeric', minute: '2-digit' }).toUpperCase();
  };

  return (
    <div className="relative z-10 w-full px-4 pt-4 pb-4 flex items-center justify-between gap-3 overflow-hidden" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* IZQUIERDA: Logo + título */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 border-[3px] border-black dark:border-yellow-400 bg-white dark:bg-[#1e1f2e] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,204,21,0.8)] transition-all">
            <Radio className="w-6 h-6 text-black dark:text-yellow-400" />
          </div>
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-[2px] border-black dark:border-white animate-ping" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black tracking-widest uppercase text-black dark:text-white transition-colors truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Proyecto Café Radio
          </h1>
          <p className="text-[10px] font-bold text-black dark:text-slate-300 uppercase tracking-widest truncate transition-colors">
            {isSyncing ? 'Sincronizando...' : isPlaying ? '● ' + (nowPlaying?.title || currentTrack?.title || 'En vivo') : 'En pausa · Selección Curada'}
          </p>
        </div>
      </div>

      {/* DERECHA: Reloj + burger */}
      <div className="flex items-center gap-2 flex-shrink-0 relative">
        {/* RELOJ DIGITAL */}
        <div className="hidden sm:block text-xl lg:text-2xl font-black tracking-widest text-black dark:text-cyan-300 bg-white dark:bg-[#1e1f2e] border-[3px] border-black dark:border-cyan-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(34,211,238,0.5)] px-3 py-1 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatTime(time)}
        </div>

        {/* BURGER MENU BUTTON */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center w-[42px] h-[42px] border-[3px] border-black dark:border-slate-600 bg-white dark:bg-[#1e1f2e] text-black dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:bg-black hover:text-white dark:hover:bg-slate-800 transition-colors rounded-none"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* DROPDOWN MENU */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 flex flex-col gap-2 z-50 min-w-[160px]">
            <button onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,204,21,0.5)] bg-white dark:bg-[#1e1f2e] text-black dark:text-yellow-400 hover:bg-black hover:text-white rounded-none whitespace-nowrap"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button onClick={() => { setIsDailyLoop(!isDailyLoop); setIsMenuOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-slate-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:bg-black hover:text-white dark:hover:bg-slate-800 rounded-none whitespace-nowrap ${
                isDailyLoop ? 'bg-yellow-100 dark:bg-yellow-400 dark:text-black text-black' : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white'
              }`}
            >
              <RotateCw className={`w-4 h-4 ${isDailyLoop ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              Bucle
            </button>
            <button onClick={() => { setShowInfoModal(true); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-slate-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-slate-800 rounded-none whitespace-nowrap"
            >
              <Info className="w-4 h-4" />
              Info
            </button>
            <button onClick={() => { navigate('/RadioManager'); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-blue-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] bg-cobalt-blue text-white hover:bg-black hover:text-white rounded-none whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

