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
    <div className="relative z-10 w-full px-4 pt-6 pb-4 flex items-center justify-between" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-black dark:border-yellow-400 bg-white dark:bg-[#1e1f2e] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.8)] rounded-none transition-all">
            <Radio className="w-7 h-7 text-black dark:text-yellow-400" />
          </div>
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-[2px] border-black dark:border-white animate-ping" />
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-black dark:text-white transition-colors" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Proyecto Café Radio
          </h1>
          <p className="text-xs font-bold text-black dark:text-slate-300 uppercase tracking-widest mt-1 transition-colors">
            {isSyncing ? 'Sincronizando...' : isPlaying ? 'En transmisión · ' + (nowPlaying?.title || currentTrack?.title || 'En vivo') : 'En pausa · Selección Curada'}
          </p>
        </div>
      </div>

      {/* Marquee Header Inline Estilo EventosOffer */}
      <div className="hidden lg:flex flex-1 mx-6 border-[3px] border-black dark:border-yellow-400/70 bg-yellow-100 dark:bg-yellow-400/10 text-black dark:text-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.3)] rounded-none overflow-hidden h-[42px] items-center transition-all">
          <style>{`
            @keyframes marquee-radio-inline {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-inline {
              display: flex;
              width: max-content;
              animation: marquee-radio-inline 15s linear infinite;
            }
          `}</style>
          <div className="animate-marquee-inline text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap flex items-center" style={{ fontFamily: "'First Bunny', sans-serif" }}>
              <span className="px-8">• PROYECTO CAFÉ RADIO • ON AIR •</span>
              <span className="px-8">• SELECCIÓN CURADA • ON AIR •</span>
              <span className="px-8">• PROYECTO CAFÉ RADIO • ON AIR •</span>
              <span className="px-8">• SELECCIÓN CURADA • ON AIR •</span>
          </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 relative">
        {/* RELOJ DIGITAL */}
        <div className="hidden sm:block text-2xl lg:text-3xl font-black tracking-widest text-black dark:text-cyan-300 bg-white dark:bg-[#1e1f2e] border-[3px] border-black dark:border-cyan-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)] px-3 py-1 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatTime(time)}
        </div>

        {/* BOTÓN TOGGLE MODO OSCURO / CLARO */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          className="flex items-center justify-center w-[42px] h-[42px] border-[3px] border-black dark:border-yellow-400 bg-white dark:bg-[#1e1f2e] text-black dark:text-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.6)] hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] transition-all rounded-none"
        >
          {isDarkMode ? <Sun className="w-5 h-5 animate-pulse" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* BURGER MENU BUTTON */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center w-[42px] h-[42px] border-[3px] border-black dark:border-slate-600 bg-white dark:bg-[#1e1f2e] text-black dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:bg-black hover:text-white dark:hover:bg-slate-800 transition-colors rounded-none"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* DROPDOWN MENU */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-3 flex flex-col gap-3 z-50">
            <button onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)] bg-white dark:bg-[#1e1f2e] text-black dark:text-yellow-400 hover:bg-black hover:text-white rounded-none whitespace-nowrap"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button onClick={() => { setIsDailyLoop(!isDailyLoop); setIsMenuOpen(false); }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-slate-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:bg-black hover:text-white dark:hover:bg-slate-800 rounded-none whitespace-nowrap ${
                isDailyLoop ? 'bg-yellow-100 dark:bg-yellow-400 dark:text-black text-black' : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white'
              }`}
            >
              <RotateCw className={`w-4 h-4 ${isDailyLoop ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              Bucle
            </button>
            <button onClick={() => { setShowInfoModal(true); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-slate-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-slate-800 rounded-none whitespace-nowrap"
            >
              <Info className="w-4 h-4" />
              Info
            </button>
            <button onClick={() => { navigate('/RadioManager'); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-[3px] border-black dark:border-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] bg-cobalt-blue text-white hover:bg-black hover:text-white rounded-none whitespace-nowrap"
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

