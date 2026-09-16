import { useState, useEffect, useRef } from 'react';

export function useRadioPlayer(
  currentPlaylist, 
  activeTab, 
  broadcastPlay, 
  broadcastStop, 
  isApplyingRemoteChange,
  externalTrackIndex,
  externalSetTrackIndex,
  broadcastVolume
) {
  const [internalTrackIndex, setInternalTrackIndex] = useState(0);
  const currentTrackIndex = externalTrackIndex !== undefined ? externalTrackIndex : internalTrackIndex;
  const setCurrentTrackIndex = externalSetTrackIndex || setInternalTrackIndex;

  const [isPlaying, setIsPlaying] = useState(false);
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
  const [audioError, setAudioError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAutoStart, setShowAutoStart] = useState(true);

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

  const togglePlay = () => {
    if (!currentTrack?.url || !audioRef.current) return;

    setAudioError(null);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Broadcast pausa global (solo si no estamos aplicando cambio remoto)
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

  const nextTrack = () => {
    if (currentPlaylist.length === 0) return;
    setAudioError(null);
    let newIdx;
    if (isShuffle) {
      newIdx = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      newIdx = currentTrackIndex === currentPlaylist.length - 1 ? 0 : currentTrackIndex + 1;
    }
    setCurrentTrackIndex(newIdx);
    setIsPlaying(true);
    // Broadcast cambio de pista
    const nextStation = currentPlaylist[newIdx];
    if (nextStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(nextStation, activeTab, true, volume, isMuted);
    }
  };

  const prevTrack = () => {
    if (currentPlaylist.length === 0) return;
    setAudioError(null);
    const newIdx = currentTrackIndex === 0 ? currentPlaylist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(newIdx);
    setIsPlaying(true);
    // Broadcast cambio de pista
    const prevStation = currentPlaylist[newIdx];
    if (prevStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(prevStation, activeTab, true, volume, isMuted);
    }
  };

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
        try { audioRef.current.pause(); } catch (e) {}
      }
      return;
    }

    if (audioRef.current && currentTrack?.url) {
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
      }
      audioRef.current.volume = isMuted ? 0 : volume;

      if (isPlaying) {
        setProgress(0);
        setCurrentTime(0);
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
      }
    } else if (!currentTrack?.url && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentTrack?.url, activeTab]);

  const handleTrackEnded = () => {
    if (isRepeatSingle) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (isDailyLoop) {
      if (currentTrackIndex === currentPlaylist.length - 1) {
        setCurrentTrackIndex(0);
      } else {
        nextTrack();
      }
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
