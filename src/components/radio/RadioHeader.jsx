import React, { useState, useEffect } from 'react';
import { Radio, RotateCw, Info, Settings, Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function RadioHeader({ 
  isPlaying, 
  nowPlaying, 
  currentTrack, 
  isSyncing, 
  isDailyLoop, 
  setIsDailyLoop, 
  setShowInfoModal,
  isDarkMode,
  toggleDarkMode,
  showHamburgerMenu = true,
  allowAdminNav = false
}) {
  const navigate = useNavigate();
  const currentStaff = useSelector(state => state.currentStaff);
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
    <div className="relative z-20 w-full px-3 lg:px-5 py-2 flex items-center justify-between gap-2.5 border-b border-black/10 dark:border-white/10 mb-2.5" style={{ maxWidth: '1720px', margin: '0 auto' }}>
      
      {/* IZQUIERDA: Logo + título compacto */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 border-[2px] border-black dark:border-[#1DB954] bg-white dark:bg-[#181926] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            <Radio className="w-4 h-4 text-black dark:text-[#1DB954]" />
          </div>
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border border-black dark:border-white animate-ping" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-black dark:text-white transition-colors truncate leading-tight" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Proyecto Café Radio
          </h1>
          <p className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider truncate leading-tight">
            {isSyncing ? 'Sincronizando...' : isPlaying ? '● ' + (nowPlaying?.title || currentTrack?.title || 'En vivo') : 'En pausa · Selección Curada'}
          </p>
        </div>
      </div>

      {/* DERECHA: Reloj + burger compacto */}
      <div className="flex items-center gap-2 flex-shrink-0 relative">
        <div className="hidden sm:block text-xs lg:text-sm font-black tracking-wider text-black dark:text-cyan-300 bg-white dark:bg-[#181926] border-[2px] border-black dark:border-cyan-400/60 px-2.5 py-1 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatTime(time)}
        </div>

        {showHamburgerMenu && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-8 h-8 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#181926] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-slate-800 transition-colors rounded-none"
            aria-label="Menú de opciones de radio"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        {/* DROPDOWN MENU */}
        {showHamburgerMenu && isMenuOpen && (
          <div className="absolute top-full right-0 mt-1.5 flex flex-col gap-1.5 z-50 min-w-[150px] bg-white dark:bg-[#181926] p-1.5 border-[2px] border-black dark:border-slate-600 shadow-xl">
            <button
              onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors bg-gray-50 dark:bg-[#12131C] text-black dark:text-yellow-400 hover:bg-black hover:text-white"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button
              onClick={() => { setIsDailyLoop(!isDailyLoop); setIsMenuOpen(false); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors hover:bg-black hover:text-white ${
                isDailyLoop ? 'bg-yellow-300 text-black' : 'bg-gray-50 dark:bg-[#12131C] text-black dark:text-white'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isDailyLoop ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              Bucle
            </button>
            <button
              onClick={() => { setShowInfoModal(true); setIsMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors bg-gray-50 dark:bg-[#12131C] text-black dark:text-white hover:bg-black hover:text-white"
            >
              <Info className="w-3.5 h-3.5" />
              Info
            </button>
            {(allowAdminNav || Boolean(currentStaff)) && (
              <button
                onClick={() => { navigate('/RadioManager'); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors bg-[#1DB954] text-black hover:bg-[#1ed760]"
              >
                <Settings className="w-3.5 h-3.5" />
                Admin Studio
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
