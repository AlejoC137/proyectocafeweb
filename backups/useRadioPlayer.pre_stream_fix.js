import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export function useRadioPlayer(
  currentPlaylist, 
  activeTab, 
  broadcastPlay, 
  broadcastStop, 
  isApplyingRemoteChange,
  externalTrackIndex,
  externalSetTrackIndex,
  broadcastVolume,
  externalIsPlaying,
  externalSetIsPlaying,
  externalAudioError,
  externalSetAudioError
) {
  const [internalTrackIndex, setInternalTrackIndex] = useState(0);
  const currentTrackIndex = externalTrackIndex !== undefined ? externalTrackIndex : internalTrackIndex;
  const setCurrentTrackIndex = externalSetTrackIndex || setInternalTrackIndex;

  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const setIsPlaying = externalSetIsPlaying || setInternalIsPlaying;

  const [internalAudioError, setInternalAudioError] = useState(null);
  const audioError = externalAudioError !== undefined ? externalAudioError : internalAudioError;
  const setAudioError = externalSetAudioError || setInternalAudioError;
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('proyecto_radio_volume');
      return saved !== null ? parseFloat(saved) : 0.85;
    } catch (e) {
      return 0.85;
    }
  });
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('proyecto_radio_muted') === 'true';
    } catch (e) {
      return false;
    }
  });

  const volumeDebounceTimer = useRef(null);
  const isApplyingRemoteVolume = useRef(false);

  // Opciones
  const [isDailyLoop, setIsDailyLoop] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeatSingle, setIsRepeatSingle] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAutoStart, setShowAutoStart] = useState(true);

  // Historial y Cola para Shuffle & Buffer de 10 canciones
  const [shuffleHistory, setShuffleHistory] = useState([]);
  const unplayedShuffleRef = useRef([]);
  const preloaderPoolRef = useRef([]);

  const audioRef = useRef(null);
  const pendingPlayRef = useRef(null); 
  const currentTrack = currentPlaylist[currentTrackIndex] || currentPlaylist[0];

  useEffect(() => {
    return () => {
      if (volumeDebounceTimer.current) {
        clearTimeout(volumeDebounceTimer.current);
      }
    };
  }, []);

  // Reinicializar pool de shuffle cuando cambie la lista o se active shuffle
  useEffect(() => {
    if (currentPlaylist && currentPlaylist.length > 0) {
      unplayedShuffleRef.current = currentPlaylist
        .map((_, idx) => idx)
        .filter(idx => idx !== currentTrackIndex);
    }
  }, [currentPlaylist?.length, isShuffle]);

  // Precargar las siguientes canciones en memoria para cambio instantáneo sin lentitud
  useEffect(() => {
    if (!currentPlaylist || currentPlaylist.length === 0 || activeTab === 'youtube') return;

    const total = currentPlaylist.length;
    const next1Idx = (currentTrackIndex + 1) % total;
    const next2Idx = (currentTrackIndex + 2) % total;

    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname.includes('localhost'));

    const resolvePreloadUrl = (track) => {
      if (!track || !track.url) return null;
      if (track.type?.includes('youtube') || track.isLiveStream) return null;
      if (track.url.startsWith('local://')) {
        const rawName = decodeURIComponent(track.url.replace('local://', ''));
        return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(rawName)}` : null;
      }
      if (track.filePath && isLocalHost) {
        return `/api/local-audio?path=${encodeURIComponent(track.filePath)}`;
      }
      if (track.url.startsWith('http://') || track.url.startsWith('https://') || track.url.startsWith('/')) {
        return track.url;
      }
      return null;
    };

    const tracksToPreload = [currentPlaylist[next1Idx], currentPlaylist[next2Idx]]
      .map(resolvePreloadUrl)
      .filter(Boolean);

    // Reutilizar o crear elementos de audio para caché en segundo plano
    tracksToPreload.forEach((targetUrl, i) => {
      try {
        if (!preloaderPoolRef.current[i]) {
          preloaderPoolRef.current[i] = new Audio();
        }
        const preAudio = preloaderPoolRef.current[i];
        if (preAudio.src !== targetUrl && preAudio.src !== new URL(targetUrl, window.location.origin).href) {
          preAudio.src = targetUrl;
          preAudio.preload = 'auto';
          preAudio.load();
        }
      } catch (e) {}
    });
  }, [currentPlaylist, currentTrackIndex, activeTab]);

  // Cola de 10 canciones: 5 anteriores (historial) y 5 siguientes (en espera)
  const queueWindow = useMemo(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) {
      return { history: [], current: null, upcoming: [], allInQueue: [] };
    }

    const total = currentPlaylist.length;
    const history = [];
    const upcoming = [];

    // 5 hacia atrás (historial)
    if (isShuffle && shuffleHistory.length > 0) {
      const recentHistory = shuffleHistory.slice(-5);
      for (let i = recentHistory.length - 1; i >= 0; i--) {
        const idx = recentHistory[i];
        if (currentPlaylist[idx]) {
          history.push({ ...currentPlaylist[idx], playlistIndex: idx, queueType: 'history' });
        }
      }
    } else {
      const countBack = Math.min(5, total - 1);
      for (let i = countBack; i >= 1; i--) {
        const idx = (currentTrackIndex - i + total) % total;
        history.push({ ...currentPlaylist[idx], playlistIndex: idx, queueType: 'history' });
      }
    }

    // 5 hacia adelante
    const countForward = Math.min(5, total - 1);
    for (let i = 1; i <= countForward; i++) {
      let idx;
      if (isShuffle && unplayedShuffleRef.current.length >= i) {
        idx = unplayedShuffleRef.current[i - 1];
      } else {
        idx = (currentTrackIndex + i) % total;
      }
      if (currentPlaylist[idx]) {
        upcoming.push({ ...currentPlaylist[idx], playlistIndex: idx, queueType: 'upcoming' });
      }
    }

    const currentItem = currentPlaylist[currentTrackIndex] 
      ? { ...currentPlaylist[currentTrackIndex], playlistIndex: currentTrackIndex, queueType: 'current' }
      : null;

    return {
      history,
      current: currentItem,
      upcoming,
      allInQueue: [...history, currentItem, ...upcoming].filter(Boolean)
    };
  }, [currentPlaylist, currentTrackIndex, isShuffle, shuffleHistory]);

  const togglePlay = () => {
    if (!currentTrack?.url || !audioRef.current) return;

    setAudioError(null);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Broadcast pausa global
      if (broadcastStop && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
        broadcastStop();
      }
    } else {
      setShowAutoStart(false);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // Broadcast reproducción global
            if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
              broadcastPlay(currentTrack, activeTab, true, volume, isMuted);
            }
          })
          .catch((err) => {
            if (err.name === 'AbortError' || err.name === 'NotSupportedError' || err.message?.includes('interrupted') || err.message?.includes('no supported source')) {
              return;
            }
            console.error("Error reproduciendo audio:", err);
            setIsPlaying(false);
            setAudioError("Haz clic nuevamente para iniciar la reproducción.");
          });
      }
    }
  };

  const nextTrack = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    setAudioError(null);

    // Silenciar y limpiar inmediatamente el audio previo para evitar reproducir residuos de la cancion anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    let newIdx;

    if (isShuffle && currentPlaylist.length > 1) {
      // Guardar el actual en el historial de shuffle
      setShuffleHistory(prev => [...prev, currentTrackIndex]);

      // Filtrar los que no han sonado
      let pool = unplayedShuffleRef.current.filter(idx => idx !== currentTrackIndex && idx < currentPlaylist.length);
      if (pool.length === 0) {
        // Refrescar el pool con todos los índices disponibles excepto el actual
        pool = currentPlaylist
          .map((_, i) => i)
          .filter(i => i !== currentTrackIndex);
      }

      // Elegir aleatoriamente
      const randomPos = Math.floor(Math.random() * pool.length);
      newIdx = pool[randomPos];

      // Actualizar pool restante
      unplayedShuffleRef.current = pool.filter((_, i) => i !== randomPos);
    } else {
      newIdx = currentTrackIndex === currentPlaylist.length - 1 ? 0 : currentTrackIndex + 1;
    }

    setCurrentTrackIndex(newIdx);
    setIsPlaying(true);

    const nextStation = currentPlaylist[newIdx];
    if (nextStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(nextStation, activeTab, true, volume, isMuted);
    }
  }, [currentPlaylist, currentTrackIndex, isShuffle, broadcastPlay, isApplyingRemoteChange, activeTab, volume, isMuted, setCurrentTrackIndex]);

  const prevTrack = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    setAudioError(null);

    // Silenciar y limpiar inmediatamente el audio previo
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    let newIdx;

    if (isShuffle && shuffleHistory.length > 0) {
      // Regresar al último reproducido en modo aleatorio
      newIdx = shuffleHistory[shuffleHistory.length - 1];
      setShuffleHistory(prev => prev.slice(0, -1));
    } else {
      newIdx = currentTrackIndex === 0 ? currentPlaylist.length - 1 : currentTrackIndex - 1;
    }

    if (newIdx >= currentPlaylist.length) newIdx = 0;

    setCurrentTrackIndex(newIdx);
    setIsPlaying(true);

    const prevStation = currentPlaylist[newIdx];
    if (prevStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(prevStation, activeTab, true, volume, isMuted);
    }
  }, [currentPlaylist, currentTrackIndex, isShuffle, shuffleHistory, broadcastPlay, isApplyingRemoteChange, activeTab, volume, isMuted, setCurrentTrackIndex]);

  const jumpToTrack = useCallback((index) => {
    if (!currentPlaylist || index < 0 || index >= currentPlaylist.length) return;
    setAudioError(null);

    // Silenciar y limpiar inmediatamente el audio previo para evitar reproducir residuos de la cancion anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    if (isShuffle) {
      setShuffleHistory(prev => [...prev, currentTrackIndex]);
    }
    setCurrentTrackIndex(index);
    setIsPlaying(true);

    const targetStation = currentPlaylist[index];
    if (targetStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(targetStation, activeTab, true, volume, isMuted);
    }
  }, [currentPlaylist, currentTrackIndex, isShuffle, broadcastPlay, isApplyingRemoteChange, activeTab, volume, isMuted, setCurrentTrackIndex]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration || currentTrack?.isLiveStream) return;
    const seekPercent = parseFloat(e.target.value);
    const newTime = (seekPercent / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(seekPercent);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const muted = val === 0;
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    try {
      localStorage.setItem('proyecto_radio_volume', String(val));
      localStorage.setItem('proyecto_radio_muted', String(muted));
    } catch (err) {}

    // Emitir cambio de volumen con debounce/throttle si no proviene de un evento remoto
    if (broadcastVolume && !isApplyingRemoteVolume.current) {
      if (volumeDebounceTimer.current) {
        clearTimeout(volumeDebounceTimer.current);
      }
      volumeDebounceTimer.current = setTimeout(() => {
        broadcastVolume(val, muted);
      }, 75);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const effectiveVol = nextMuted ? 0 : (volume || 0.85);
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    try {
      localStorage.setItem('proyecto_radio_muted', String(nextMuted));
    } catch (err) {}

    if (broadcastVolume && !isApplyingRemoteVolume.current) {
      if (volumeDebounceTimer.current) {
        clearTimeout(volumeDebounceTimer.current);
      }
      broadcastVolume(volume || 0.85, nextMuted);
    }
  };

  const applyRemoteVolume = (newVolume, newIsMuted) => {
    if (newVolume === undefined || newVolume === null || isNaN(newVolume)) return;
    const clampedVol = Math.max(0, Math.min(1, Number(newVolume)));
    const muted = Boolean(newIsMuted);

    isApplyingRemoteVolume.current = true;
    setVolume(clampedVol);
    setIsMuted(muted);

    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : clampedVol;
    }

    try {
      localStorage.setItem('proyecto_radio_volume', String(clampedVol));
      localStorage.setItem('proyecto_radio_muted', String(muted));
    } catch (err) {}

    setTimeout(() => {
      isApplyingRemoteVolume.current = false;
    }, 150);
  };

  useEffect(() => {
    if (activeTab === 'youtube') {
      if (audioRef.current) {
        try { 
          audioRef.current.pause();
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
        } catch (e) {}
      }
      return;
    }

    if (audioRef.current && currentTrack?.url) {
      const isLocalHost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      let playableUrl = currentTrack.station_url || currentTrack.stream_url || currentTrack.url;
      if (playableUrl && playableUrl.startsWith('local://')) {
        const rawName = decodeURIComponent(playableUrl.replace('local://', ''));
        if (isLocalHost) {
          playableUrl = `/api/local-audio?file=${encodeURIComponent(rawName)}`;
        } else {
          // En deploy remoto: una URL local:// no se puede reproducir directamente en Vercel.
          // Silenciar el elemento de audio para esperar en silencio la señal al aire de Supabase.
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
          return;
        }
      }

      // Validar que sea una URL de audio directamente reproducible
      if (!playableUrl || (!playableUrl.startsWith('http://') && !playableUrl.startsWith('https://') && !playableUrl.startsWith('/api/local-audio') && !playableUrl.startsWith('/'))) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
        }
        return;
      }

      const currentSrcPath = audioRef.current.src ? new URL(audioRef.current.src, window.location.origin).pathname + new URL(audioRef.current.src, window.location.origin).search : '';
      const isSameSrc = (currentSrcPath === playableUrl || audioRef.current.src === playableUrl);

      if (!isSameSrc) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current.src = playableUrl;
        audioRef.current.load();
      }
      audioRef.current.volume = isMuted ? 0 : volume;

      if (isPlaying) {
        if (!isSameSrc) {
          if (!currentTrack?.isLiveStream) {
            setProgress(0);
            setCurrentTime(0);
          }
          const promise = audioRef.current.play();
          if (promise !== undefined) {
            promise.catch((err) => {
              if (err.name === 'AbortError' || err.name === 'NotSupportedError' || err.message?.includes('interrupted') || err.message?.includes('no supported source')) {
                return;
              }
              console.warn("Autoplay o reproducción cancelada:", err.message);
              setIsPlaying(false);
            });
          }
        } else if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
    } else if (!currentTrack?.url && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      setIsPlaying(false);
    }
  }, [currentTrack?.url, activeTab, isPlaying]);

  const handleTrackEnded = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (isRepeatSingle) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (isDailyLoop) {
      nextTrack();
    } else {
      nextTrack();
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return {
    currentTrackIndex,
    setCurrentTrackIndex,
    currentTrack,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    duration,
    currentTime,
    setCurrentTime,
    volume,
    isMuted,
    isDailyLoop,
    setIsDailyLoop,
    isShuffle,
    setIsShuffle,
    isRepeatSingle,
    setIsRepeatSingle,
    audioError,
    setAudioError,
    showInfoModal,
    setShowInfoModal,
    showAutoStart,
    setShowAutoStart,
    audioRef,
    pendingPlayRef,
    togglePlay,
    nextTrack,
    prevTrack,
    jumpToTrack,
    queueWindow,
    handleTimeUpdate,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    applyRemoteVolume,
    setVolume,
    setIsMuted,
    handleTrackEnded,
    formatTime
  };
}
