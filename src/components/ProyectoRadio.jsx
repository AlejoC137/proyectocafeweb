import React, { useState, useRef, useEffect } from 'react';
import supabase from '../config/supabaseClient';

export default function ProyectoRadio() {
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  // Fetch playlist from Supabase on mount
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const { data, error } = await supabase
          .from('playlist_radio')
          .select('*')
          .order('order_index', { ascending: true })
          .order('id', { ascending: true });

        if (error) throw error;
        setPlaylist(data || []);
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, []);

  const currentTrack = playlist[currentTrackIndex];

  // Alternar Play / Pausa
  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Siguiente Canción
  const nextTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prevIndex) => 
      prevIndex === playlist.length - 1 ? 0 : prevIndex + 1
    );
    setIsPlaying(true);
  };

  // Canción Anterior
  const prevTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prevIndex) => 
      prevIndex === 0 ? playlist.length - 1 : prevIndex - 1
    );
    setIsPlaying(true);
  };

  // Actualizar barra de progreso
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    const currentTime = audioRef.current.currentTime;
    // Evitar NaN si la duración aún no carga
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  // Cuando cambia la canción, reproducimos si ya estaba en modo play
  useEffect(() => {
    if (isPlaying && audioRef.current && currentTrack) {
      // Necesario resetear progreso temporalmente al cambiar pista
      setProgress(0);
      
      // Asegurar que se reproduce después de cargar el nuevo src
      console.log("Intentando reproducir URL:", currentTrack.url);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Autoplay prevent:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, currentTrack, isPlaying]);

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-6 flex justify-center items-center h-64 text-slate-800 dark:text-white">
        <p className="animate-pulse">Sintonizando Radio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-sm mx-auto bg-red-500/10 backdrop-blur-md rounded-3xl p-6 text-red-500 border border-red-500/20">
        <p>Error al sintonizar: {error}</p>
        <p className="text-xs mt-2 opacity-70">Asegúrate de haber creado la tabla playlist_radio en Supabase.</p>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center text-slate-800 dark:text-white border border-white/20">
        <p>La radio está fuera del aire (No hay canciones).</p>
        <p className="text-sm mt-2 opacity-70">Ve a /RadioManager para agregar música.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/20 p-6 text-slate-800 dark:text-white">
      {/* Portada */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-6 shadow-lg bg-black/20 flex items-center justify-center">
        {currentTrack.cover ? (
          <img 
            src={currentTrack.cover} 
            alt="Album Cover" 
            className={`object-cover w-full h-full transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`}
          />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Info de la canción */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold truncate text-white">{currentTrack.title}</h2>
        <p className="text-sm opacity-70 truncate text-white/80">{currentTrack.artist}</p>
        <p className="text-[10px] opacity-50 text-white/50 mt-2 break-all font-mono">
          URL: {currentTrack.url}
        </p>
      </div>

      {/* Elemento de Audio Nativo Oculto */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />

      {/* Barra de Progreso */}
      <div className="w-full bg-slate-200/20 dark:bg-white/20 rounded-full h-1.5 mb-6 overflow-hidden">
        <div 
          className="bg-orange-500 h-1.5 rounded-full transition-all duration-100 ease-linear" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={prevTrack}
          className="p-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition text-slate-800 dark:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
        </button>
        
        <button 
          onClick={togglePlay}
          className="p-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition shadow-lg shadow-orange-500/30 transform hover:scale-105"
        >
          {isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          )}
        </button>

        <button 
          onClick={nextTrack}
          className="p-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition text-slate-800 dark:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
        </button>
      </div>
    </div>
  );
}
