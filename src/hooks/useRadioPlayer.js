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
    } catch {
      return 0.85;
    }
  });
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('proyecto_radio_muted') === 'true';
    } catch {
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
  const [showAutoStart, setShowAutoStart] = useState(false);

  // Historial y Cola para Shuffle & Buffer de 10 canciones
  const [shuffleHistory, setShuffleHistory] = useState([]);
  const unplayedShuffleRef = useRef([]);

  const audioRef = useRef(null);
  const pendingPlayRef = useRef(null);
  const lastLoadedSrcRef = useRef('');

  const currentTrack = currentPlaylist?.[currentTrackIndex] || currentPlaylist?.[0] || null;
  const currentStreamUrl = currentTrack?.streamUrl || currentTrack?.url || '';

  useEffect(() => {
    return () => {
      if (volumeDebounceTimer.current) {
        clearTimeout(volumeDebounceTimer.current);
      }
    };
  }, []);

  // Inicializar duración estimada cuando cambia la pista
  useEffect(() => {
    if (!currentTrack) {
      setDuration(0);
      setCurrentTime(0);
      setProgress(0);
      return;
    }
    if (currentTrack.isLiveStream) {
      setDuration(0);
      setCurrentTime(0);
      setProgress(0);
    } else if (Number.isFinite(currentTrack.duration) && currentTrack.duration > 0) {
      setDuration(currentTrack.duration);
    }
  }, [currentTrack?.id, currentTrack?.duration, currentTrack?.isLiveStream]);

  // Reinicializar pool de shuffle cuando cambie la lista o se active shuffle
  useEffect(() => {
    if (currentPlaylist && currentPlaylist.length > 0) {
      unplayedShuffleRef.current = currentPlaylist
        .map((_, idx) => idx)
        .filter((idx) => idx !== currentTrackIndex);
    }
  }, [currentPlaylist?.length, isShuffle]);

  // Cola de 10 canciones: 5 anteriores (historial) y 5 siguientes (en espera)
  const queueWindow = useMemo(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) {
      return { history: [], current: null, upcoming: [], allInQueue: [] };
    }

    const total = currentPlaylist.length;
    const history = [];
    const upcoming = [];

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
      allInQueue: [...history, currentItem, ...upcoming].filter(Boolean),
    };
  }, [currentPlaylist, currentTrackIndex, isShuffle, shuffleHistory]);

  const togglePlay = useCallback(() => {
    if (!currentStreamUrl || !audioRef.current) return;

    setAudioError(null);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (broadcastStop && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
        broadcastStop();
      }
    } else {
      setShowAutoStart(false);
      audioRef.current.volume = isMuted ? 0 : volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
              broadcastPlay(currentTrack, activeTab, true, volume, isMuted);
            }
          })
          .catch((err) => {
            if (
              err.name === 'AbortError' ||
              err.message?.includes('interrupted')
            ) {
              return;
            }
            console.error('Error reproduciendo audio:', err);
            setIsPlaying(false);
            setAudioError('Haz clic nuevamente para iniciar la reproducción.');
          });
      }
    }
  }, [
    currentStreamUrl,
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    activeTab,
    broadcastPlay,
    broadcastStop,
    isApplyingRemoteChange,
    setAudioError,
    setIsPlaying,
  ]);

  const nextTrack = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    setAudioError(null);
    let newIdx;

    if (isShuffle && currentPlaylist.length > 1) {
      setShuffleHistory((prev) => [...prev, currentTrackIndex]);

      let pool = unplayedShuffleRef.current.filter(
        (idx) => idx !== currentTrackIndex && idx < currentPlaylist.length
      );
      if (pool.length === 0) {
        pool = currentPlaylist.map((_, i) => i).filter((i) => i !== currentTrackIndex);
      }

      const randomPos = Math.floor(Math.random() * pool.length);
      newIdx = pool[randomPos];
      unplayedShuffleRef.current = pool.filter((_, i) => i !== randomPos);
    } else {
      newIdx = currentTrackIndex === currentPlaylist.length - 1 ? 0 : currentTrackIndex + 1;
    }

    setCurrentTrackIndex(newIdx);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);

    const nextStation = currentPlaylist[newIdx];
    if (nextStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(nextStation, activeTab, true, volume, isMuted);
    }
  }, [
    currentPlaylist,
    currentTrackIndex,
    isShuffle,
    broadcastPlay,
    isApplyingRemoteChange,
    activeTab,
    volume,
    isMuted,
    setCurrentTrackIndex,
    setAudioError,
    setIsPlaying,
  ]);

  const prevTrack = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    setAudioError(null);

    // Si la canción lleva más de 3 segundos, reiniciar al inicio antes de retroceder
    if (audioRef.current && !currentTrack?.isLiveStream && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      return;
    }

    let newIdx;
    if (isShuffle && shuffleHistory.length > 0) {
      newIdx = shuffleHistory[shuffleHistory.length - 1];
      setShuffleHistory((prev) => prev.slice(0, -1));
    } else {
      newIdx = currentTrackIndex === 0 ? currentPlaylist.length - 1 : currentTrackIndex - 1;
    }

    if (newIdx >= currentPlaylist.length) newIdx = 0;

    setCurrentTrackIndex(newIdx);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);

    const prevStation = currentPlaylist[newIdx];
    if (prevStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(prevStation, activeTab, true, volume, isMuted);
    }
  }, [
    currentPlaylist,
    currentTrack?.isLiveStream,
    currentTrackIndex,
    isShuffle,
    shuffleHistory,
    broadcastPlay,
    isApplyingRemoteChange,
    activeTab,
    volume,
    isMuted,
    setCurrentTrackIndex,
    setAudioError,
    setIsPlaying,
  ]);

  const jumpToTrack = useCallback(
    (index) => {
      if (!currentPlaylist || index < 0 || index >= currentPlaylist.length) return;
      setAudioError(null);
      if (isShuffle && index !== currentTrackIndex) {
        setShuffleHistory((prev) => [...prev, currentTrackIndex]);
      }
      setCurrentTrackIndex(index);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);

      const targetStation = currentPlaylist[index];
      if (targetStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
        broadcastPlay(targetStation, activeTab, true, volume, isMuted);
      }
    },
    [
      currentPlaylist,
      currentTrackIndex,
      isShuffle,
      broadcastPlay,
      isApplyingRemoteChange,
      activeTab,
      volume,
      isMuted,
      setCurrentTrackIndex,
      setAudioError,
      setIsPlaying,
    ]
  );

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (dur && Number.isFinite(dur) && dur > 0) {
      setDuration(dur);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);
    if (dur && Number.isFinite(dur) && dur > 0) {
      setDuration(dur);
      setProgress(Math.min(100, Math.max(0, (cur / dur) * 100)));
    } else if (currentTrack?.duration > 0) {
      setProgress(Math.min(100, Math.max(0, (cur / currentTrack.duration) * 100)));
    }
  }, [currentTrack?.duration]);

  const handleSeek = useCallback(
    (e) => {
      if (!audioRef.current || currentTrack?.isLiveStream) return;
      const effectiveDuration =
        (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0
          ? audioRef.current.duration
          : duration) || currentTrack?.duration || 0;
      if (!effectiveDuration) return;

      const seekPercent = Math.min(100, Math.max(0, parseFloat(e.target.value)));
      const newTime = (seekPercent / 100) * effectiveDuration;
      try {
        audioRef.current.currentTime = newTime;
      } catch {
        // Ignorar si aún no hay rangos cargados
      }
      setCurrentTime(newTime);
      setProgress(seekPercent);
    },
    [duration, currentTrack?.isLiveStream, currentTrack?.duration]
  );

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
    } catch {}

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
    const effectiveVol = nextMuted ? 0 : volume || 0.85;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    try {
      localStorage.setItem('proyecto_radio_muted', String(nextMuted));
    } catch {}

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
    } catch {}

    setTimeout(() => {
      isApplyingRemoteVolume.current = false;
    }, 150);
  };

  // Sincronización del elemento <audio> con la pista activa (Personal Media Server y Radios Online)
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // En pestaña YouTube, detener el <audio> para evitar doble reproducción
    if (activeTab === 'youtube') {
      try {
        audioEl.pause();
        lastLoadedSrcRef.current = '';
      } catch {}
      return;
    }

    audioEl.volume = isMuted ? 0 : volume;

    const validSrc =
      currentStreamUrl &&
      (currentStreamUrl.startsWith('http://') ||
        currentStreamUrl.startsWith('https://') ||
        currentStreamUrl.startsWith('blob:') ||
        currentStreamUrl.startsWith('/'))
        ? currentStreamUrl
        : '';

    if (!validSrc) {
      if (!audioEl.paused) {
        audioEl.pause();
      }
      lastLoadedSrcRef.current = '';
      if (isPlaying) {
        setIsPlaying(false);
      }
      return;
    }

    const srcChanged = lastLoadedSrcRef.current !== validSrc;
    if (srcChanged) {
      lastLoadedSrcRef.current = validSrc;
      if (!currentTrack?.isLiveStream) {
        setProgress(0);
        setCurrentTime(0);
      }
      if (audioEl.src !== validSrc) {
        audioEl.src = validSrc;
      }
    }

    if (isPlaying) {
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (
            err.name === 'AbortError' ||
            err.name === 'NotSupportedError' ||
            err.message?.includes('interrupted') ||
            err.message?.includes('no supported source')
          ) {
            return;
          }
          console.warn('Autoplay o reproducción cancelada:', err.message);
          setIsPlaying(false);
        });
      }
    } else if (!audioEl.paused) {
      audioEl.pause();
    }
  }, [currentStreamUrl, activeTab, isPlaying]);

  // Mantener volumen sincronizado en caliente
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTrackEnded = useCallback(() => {
    if (isRepeatSingle) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    nextTrack();
  }, [isRepeatSingle, nextTrack]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !Number.isFinite(secs)) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
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
    setDuration,
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
    handleLoadedMetadata,
    handleTimeUpdate,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    applyRemoteVolume,
    setVolume,
    setIsMuted,
    handleTrackEnded,
    formatTime,
  };
}
