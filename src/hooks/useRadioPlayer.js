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
  externalSetAudioError,
  options = {}
) {
  const { isStreamReady = true, onStallRecover } = options;

  const [internalTrackIndex, setInternalTrackIndex] = useState(0);
  const currentTrackIndex = externalTrackIndex !== undefined ? externalTrackIndex : internalTrackIndex;
  const setCurrentTrackIndex = externalSetTrackIndex || setInternalTrackIndex;

  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const setIsPlaying = externalSetIsPlaying || setInternalIsPlaying;

  const [internalAudioError, setInternalAudioError] = useState(null);
  const audioError = externalAudioError !== undefined ? externalAudioError : internalAudioError;
  const setAudioError = externalAudioError !== undefined ? externalSetAudioError : setInternalAudioError;

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
  const wantsToPlayRef = useRef(false);
  const userPausedRef = useRef(false);
  const pendingSeekRef = useRef(null);

  // Throttling de UI para Android antiguos (evita 4-10 re-renders/s del árbol completo)
  const lastUiTimeUpdateRef = useRef(0);
  const lastUiSecondRef = useRef(-1);
  const lastDurationRef = useRef(0);

  // Watchdog anti-congelamiento / anti-corte en Android
  const lastWatchdogTimeRef = useRef(-1);
  const stallCountRef = useRef(0);
  const softRetryCountRef = useRef(0);

  const currentTrack = currentPlaylist?.[currentTrackIndex] || currentPlaylist?.[0] || null;
  const rawStreamUrl = currentTrack?.streamUrl || currentTrack?.url || '';
  const currentStreamUrl = isStreamReady ? rawStreamUrl : '';

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const onStallRecoverRef = useRef(onStallRecover);
  onStallRecoverRef.current = onStallRecover;

  // Mantener wantsToPlayRef sincronizado con isPlaying externo/interno
  useEffect(() => {
    wantsToPlayRef.current = Boolean(isPlaying);
    if (isPlaying) {
      userPausedRef.current = false;
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (volumeDebounceTimer.current) {
        clearTimeout(volumeDebounceTimer.current);
      }
    };
  }, []);

  // Helper seguro para cargar y reproducir inmediatamente en el mismo <audio>
  // Crucial en Android: cambiar src y llamar play() síncronamente dentro del gesto o evento `ended`
  // sin llamar pause() evita que Android Chrome libere AudioFocus o bloquee por autoplay.
  const loadAndPlayImmediate = useCallback((url, { seekTime = null, forceReload = false } = {}) => {
    const audioEl = audioRef.current;
    if (!audioEl || !url || activeTabRef.current === 'youtube') return;

    const validSrc =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('blob:') ||
      url.startsWith('/')
        ? url
        : '';
    if (!validSrc) return;

    wantsToPlayRef.current = true;
    userPausedRef.current = false;
    stallCountRef.current = 0;

    if (seekTime !== null && Number.isFinite(seekTime) && seekTime >= 0) {
      pendingSeekRef.current = seekTime;
    }

    audioEl.volume = isMutedRef.current ? 0 : volumeRef.current;

    if (forceReload || lastLoadedSrcRef.current !== validSrc) {
      lastLoadedSrcRef.current = validSrc;
      try {
        audioEl.src = validSrc;
        audioEl.load();
      } catch {}
    }

    try {
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          if (
            err?.name === 'AbortError' ||
            err?.name === 'NotSupportedError' ||
            err?.message?.includes('interrupted')
          ) {
            // Se reintentará automáticamente en onCanPlay / onLoadedData
            return;
          }
          if (err?.name === 'NotAllowedError') {
            setIsPlaying(false);
            wantsToPlayRef.current = false;
          }
        });
      }
    } catch {}
  }, [setIsPlaying]);

  // Aplicar seek seguro (inmediato si hay metadata, o diferido en pendingSeekRef)
  const seekToTime = useCallback((targetSeconds) => {
    const audioEl = audioRef.current;
    if (!Number.isFinite(targetSeconds) || targetSeconds < 0) return;

    if (!audioEl || audioEl.readyState < 1) {
      pendingSeekRef.current = targetSeconds;
      return;
    }

    const dur = audioEl.duration;
    const clamped =
      Number.isFinite(dur) && dur > 0
        ? Math.min(Math.max(0, targetSeconds), Math.max(0, dur - 0.5))
        : targetSeconds;

    try {
      audioEl.currentTime = clamped;
      pendingSeekRef.current = null;
      setCurrentTime(clamped);
      if (Number.isFinite(dur) && dur > 0) {
        setProgress(Math.min(100, Math.max(0, (clamped / dur) * 100)));
      }
    } catch {
      pendingSeekRef.current = targetSeconds;
    }
  }, []);

  // Inicializar duración estimada cuando cambia la pista
  useEffect(() => {
    if (!currentTrack) {
      lastDurationRef.current = 0;
      setDuration(0);
      setCurrentTime(0);
      setProgress(0);
      return;
    }
    if (currentTrack.isLiveStream) {
      lastDurationRef.current = 0;
      setDuration(0);
      setCurrentTime(0);
      setProgress(0);
    } else if (Number.isFinite(currentTrack.duration) && currentTrack.duration > 0) {
      lastDurationRef.current = currentTrack.duration;
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
      wantsToPlayRef.current = false;
      userPausedRef.current = true;
      audioRef.current.pause();
      setIsPlaying(false);
      if (broadcastStop && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
        broadcastStop();
      }
    } else {
      setShowAutoStart(false);
      wantsToPlayRef.current = true;
      userPausedRef.current = false;
      stallCountRef.current = 0;
      softRetryCountRef.current = 0;

      const audioEl = audioRef.current;
      audioEl.volume = isMuted ? 0 : volume;
      if (lastLoadedSrcRef.current !== currentStreamUrl || !audioEl.src) {
        lastLoadedSrcRef.current = currentStreamUrl;
        audioEl.src = currentStreamUrl;
        audioEl.load();
      }

      const playPromise = audioEl.play();
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
            wantsToPlayRef.current = false;
            setIsPlaying(false);
            setAudioError('Toca nuevamente para iniciar la reproducción.');
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
    softRetryCountRef.current = 0;
    stallCountRef.current = 0;
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

    const nextStation = currentPlaylist[newIdx];
    const nextUrl = isStreamReady ? (nextStation?.streamUrl || nextStation?.url || '') : '';

    // Transición síncrona en el mismo <audio> (clave para Android en segundo plano / pantalla apagada)
    if (nextUrl && activeTab !== 'youtube') {
      loadAndPlayImmediate(nextUrl);
    }

    setCurrentTrackIndex(newIdx);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);

    if (nextStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(nextStation, activeTab, true, volume, isMuted);
    }
  }, [
    currentPlaylist,
    currentTrackIndex,
    isShuffle,
    isStreamReady,
    loadAndPlayImmediate,
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
    softRetryCountRef.current = 0;
    stallCountRef.current = 0;

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

    const prevStation = currentPlaylist[newIdx];
    const prevUrl = isStreamReady ? (prevStation?.streamUrl || prevStation?.url || '') : '';

    if (prevUrl && activeTab !== 'youtube') {
      loadAndPlayImmediate(prevUrl);
    }

    setCurrentTrackIndex(newIdx);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);

    if (prevStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(prevStation, activeTab, true, volume, isMuted);
    }
  }, [
    currentPlaylist,
    currentTrack?.isLiveStream,
    currentTrackIndex,
    isShuffle,
    isStreamReady,
    loadAndPlayImmediate,
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
      softRetryCountRef.current = 0;
      stallCountRef.current = 0;
      if (isShuffle && index !== currentTrackIndex) {
        setShuffleHistory((prev) => [...prev, currentTrackIndex]);
      }

      const targetStation = currentPlaylist[index];
      const targetUrl = isStreamReady ? (targetStation?.streamUrl || targetStation?.url || '') : '';

      if (targetUrl && activeTab !== 'youtube') {
        loadAndPlayImmediate(targetUrl);
      }

      setCurrentTrackIndex(index);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);

      if (targetStation && broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
        broadcastPlay(targetStation, activeTab, true, volume, isMuted);
      }
    },
    [
      currentPlaylist,
      currentTrackIndex,
      isShuffle,
      isStreamReady,
      loadAndPlayImmediate,
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
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const dur = audioEl.duration;
    if (dur && Number.isFinite(dur) && dur > 0) {
      lastDurationRef.current = dur;
      setDuration(dur);
    }
    if (pendingSeekRef.current !== null && !currentTrackRef.current?.isLiveStream) {
      const target = pendingSeekRef.current;
      pendingSeekRef.current = null;
      const clamped =
        Number.isFinite(dur) && dur > 0
          ? Math.min(Math.max(0, target), Math.max(0, dur - 0.5))
          : target;
      try {
        audioEl.currentTime = clamped;
        setCurrentTime(clamped);
        if (Number.isFinite(dur) && dur > 0) {
          setProgress(Math.min(100, Math.max(0, (clamped / dur) * 100)));
        }
      } catch {
        pendingSeekRef.current = target;
      }
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl || activeTabRef.current === 'youtube') return;

    if (pendingSeekRef.current !== null && !currentTrackRef.current?.isLiveStream) {
      const target = pendingSeekRef.current;
      pendingSeekRef.current = null;
      const dur = audioEl.duration;
      const clamped =
        Number.isFinite(dur) && dur > 0
          ? Math.min(Math.max(0, target), Math.max(0, dur - 0.5))
          : target;
      try {
        audioEl.currentTime = clamped;
      } catch {}
    }

    if (wantsToPlayRef.current && audioEl.paused && !userPausedRef.current) {
      audioEl.volume = isMutedRef.current ? 0 : volumeRef.current;
      audioEl.play().catch(() => {});
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const now = Date.now();
    const cur = audioEl.currentTime || 0;
    const dur = audioEl.duration;
    const sec = Math.floor(cur);

    // Resetear contador de stall mientras el audio avanza
    if (Math.abs(cur - lastWatchdogTimeRef.current) > 0.15) {
      stallCountRef.current = 0;
    }

    // Throttle de actualizaciones de estado React para mantener Android antiguos fluidos
    if (now - lastUiTimeUpdateRef.current < 450 && sec === lastUiSecondRef.current) {
      return;
    }
    lastUiTimeUpdateRef.current = now;
    lastUiSecondRef.current = sec;

    setCurrentTime(cur);
    if (dur && Number.isFinite(dur) && dur > 0) {
      if (Math.abs(dur - lastDurationRef.current) > 0.5) {
        lastDurationRef.current = dur;
        setDuration(dur);
      }
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
      seekToTime(newTime);
      setProgress(seekPercent);
    },
    [duration, currentTrack?.isLiveStream, currentTrack?.duration, seekToTime]
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

  // Sincronización del elemento <audio> con la pista activa (fuente única de verdad para audioEl.src)
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
      stallCountRef.current = 0;
      softRetryCountRef.current = 0;
      if (!currentTrack?.isLiveStream) {
        setProgress(0);
        setCurrentTime(0);
      }
      if (audioEl.src !== validSrc) {
        audioEl.src = validSrc;
        audioEl.load();
      }
    }

    if (isPlaying) {
      wantsToPlayRef.current = true;
      userPausedRef.current = false;
      if (audioEl.paused || srcChanged) {
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (
              err.name === 'AbortError' ||
              err.name === 'NotSupportedError' ||
              err.message?.includes('interrupted') ||
              err.message?.includes('no supported source')
            ) {
              // onCanPlay reintentará reproducir automáticamente
              return;
            }
            console.warn('Autoplay o reproducción cancelada:', err.message);
            wantsToPlayRef.current = false;
            setIsPlaying(false);
          });
        }
      }
    } else if (!audioEl.paused) {
      wantsToPlayRef.current = false;
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
    const audioEl = audioRef.current;
    if (isRepeatSingle) {
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      }
      return;
    }

    // IMPORTANTE PARA ANDROID: NO llamar audioEl.pause() antes de pasar a la siguiente pista.
    // Llamar pause() suelta AudioFocus y permite que Android suspenda el proceso en pantalla apagada.
    nextTrack();
  }, [isRepeatSingle, nextTrack]);

  const handleTrackEndedRef = useRef(handleTrackEnded);
  handleTrackEndedRef.current = handleTrackEnded;

  // Watchdog anti-interrupciones / anti-corte entre canciones para Android
  useEffect(() => {
    if (!isPlaying || activeTab === 'youtube') {
      stallCountRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      const audioEl = audioRef.current;
      if (!audioEl || !wantsToPlayRef.current || userPausedRef.current) return;

      const cur = audioEl.currentTime || 0;
      const dur = audioEl.duration;
      const isLive = Boolean(currentTrackRef.current?.isLiveStream);

      // 1. Detectar pistas MP3 VBR que se quedan congeladas al final sin disparar `ended` en Android
      if (!isLive && Number.isFinite(dur) && dur > 5 && cur >= dur - 0.8) {
        if (audioEl.ended || Math.abs(cur - lastWatchdogTimeRef.current) < 0.1) {
          stallCountRef.current = 0;
          handleTrackEndedRef.current();
          return;
        }
      }

      // 2. Si el audio quedó pausado inesperadamente (p.ej. micro-interrupción del OS o AbortError)
      if (audioEl.paused && !audioEl.ended) {
        audioEl.play().catch(() => {});
      }

      // 3. Detectar congelamiento de buffer (mismo currentTime durante >= 9 segundos)
      if (Math.abs(cur - lastWatchdogTimeRef.current) < 0.1) {
        stallCountRef.current += 1;
      } else {
        stallCountRef.current = 0;
        softRetryCountRef.current = 0;
      }
      lastWatchdogTimeRef.current = cur;

      if (stallCountRef.current >= 3) {
        stallCountRef.current = 0;
        const activeUrl = lastLoadedSrcRef.current || audioEl.currentSrc || audioEl.src;

        if (softRetryCountRef.current < 2 && activeUrl) {
          softRetryCountRef.current += 1;
          const savedPos = !isLive && Number.isFinite(cur) && cur > 1 ? cur : null;
          loadAndPlayImmediate(activeUrl, { seekTime: savedPos, forceReload: true });
        } else if (onStallRecoverRef.current) {
          softRetryCountRef.current = 0;
          onStallRecoverRef.current();
        } else if (!isLive) {
          softRetryCountRef.current = 0;
          handleTrackEndedRef.current();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, activeTab, loadAndPlayImmediate]);

  // Reanudar automáticamente al volver red Wi-Fi/datos o al desbloquear pantalla en Android
  useEffect(() => {
    const resumeIfNeeded = () => {
      const audioEl = audioRef.current;
      if (!audioEl || activeTabRef.current === 'youtube') return;
      if (!wantsToPlayRef.current || userPausedRef.current) return;

      if (audioEl.ended) {
        handleTrackEndedRef.current();
        return;
      }
      if (audioEl.paused) {
        const activeUrl = lastLoadedSrcRef.current;
        if (audioEl.readyState === 0 && activeUrl) {
          loadAndPlayImmediate(activeUrl, { forceReload: true });
        } else {
          audioEl.play().catch(() => {});
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resumeIfNeeded();
      }
    };

    window.addEventListener('online', resumeIfNeeded);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', resumeIfNeeded);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadAndPlayImmediate]);

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
    wantsToPlayRef,
    togglePlay,
    nextTrack,
    prevTrack,
    jumpToTrack,
    queueWindow,
    loadAndPlayImmediate,
    seekToTime,
    handleLoadedMetadata,
    handleCanPlay,
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
