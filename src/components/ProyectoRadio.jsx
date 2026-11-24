import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCafeData } from '../hooks/useCafeData';
import { useRadioData } from '../hooks/useRadioData';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import { useRadioSync } from '../hooks/useRadioSync';
import { buildStreamUrl } from '../services/mediaServerService';
import { extractYoutubeId, extractPlaylistId, getYoutubeThumbnail } from '../utils/youtubeHelpers';

import RadioHeader from './radio/RadioHeader';
import AgendaColumn from './radio/AgendaColumn';
import RadioMenuDelDia from './radio/RadioMenuDelDia';
import PlayerCenter from './radio/PlayerCenter';
import SourceTabs from './radio/SourceTabs';

export default function ProyectoRadio() {
  const isApplyingRemoteChange = useRef(false);
  const playerRef = useRef(null);
  const recoveryAttemptRef = useRef('');
  const hasAttemptedAutoplayRef = useRef(false);
  const [isRecoveringStream, setIsRecoveringStream] = useState(false);
  const [needsAutoplayUnlock, setNeedsAutoplayUnlock] = useState(false);

  // Tab activa con persistencia en localStorage
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('proyecto_radio_active_tab');
      if (saved && ['supabase', 'live', 'youtube'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'supabase';
  });
  const [mobileTab, setMobileTab] = useState('player'); // 'agenda', 'player', 'menu'

  // Estados compartidos entre radioData y player
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    try {
      const savedTab = localStorage.getItem('proyecto_radio_active_tab') || 'supabase';
      const savedIdx = localStorage.getItem(`proyecto_radio_index_${savedTab}`);
      if (savedIdx !== null && !isNaN(Number(savedIdx))) {
        return Math.max(0, parseInt(savedIdx, 10));
      }
    } catch {}
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // Modo mixto: independiente por defecto, sincronización opcional con RadioManager
  // Si RadioManager activa "Setlist al Aire", se bloquea /Radio automáticamente a la Cabina
  const [isCabinaSync, setIsCabinaSync] = useState(false);
  const [remoteYoutubeTrack, setRemoteYoutubeTrack] = useState(null);
  const lastSyncedSignatureRef = useRef('');
  const radioDataRef = useRef(null);
  const effectiveCabinaSyncRef = useRef(false);
  const cabinaEndedFallbackTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  const applyRemoteYoutubeVideo = useCallback((payload = {}) => {
    const rawUrl = payload.url || payload.station_url || '';
    const ytId = payload.youtubeId || extractYoutubeId(rawUrl);
    const listId = payload.listId || extractPlaylistId(rawUrl);

    playerRef.current?.audioRef?.current?.pause();
    setActiveTab('youtube');

    const ytList = radioDataRef.current?.youtubePlaylist || [];
    const remoteTitle = (payload.title || payload.station_name || '').trim().toLowerCase();
    const matchedIdx = ytList.findIndex((t) => {
      if (ytId && t.youtubeId && t.youtubeId === ytId) return true;
      if (rawUrl && t.url && t.url === rawUrl) return true;
      if (payload.id && t.id && String(t.id) === String(payload.id)) return true;
      if (remoteTitle && t.title && t.title.trim().toLowerCase() === remoteTitle) return true;
      return false;
    });

    if (matchedIdx !== -1) {
      radioDataRef.current?.setSelectedYoutubeCategory?.('Todos');
      radioDataRef.current?.setYoutubeSearchQuery?.('');
      setRemoteYoutubeTrack(null);
      setCurrentTrackIndex(matchedIdx);
    } else if (ytId) {
      setRemoteYoutubeTrack({
        id: payload.id ? String(payload.id) : `remote-yt-${ytId}`,
        title: payload.title || payload.station_name || 'Video de YouTube',
        artist: payload.artist || payload.station_artist || 'YouTube',
        youtubeId: ytId,
        listId: listId || null,
        url:
          rawUrl ||
          (listId
            ? `https://www.youtube.com/watch?v=${ytId}&list=${listId}`
            : `https://www.youtube.com/watch?v=${ytId}`),
        cover: payload.cover || payload.station_cover || getYoutubeThumbnail(ytId),
        type: 'youtube',
        isLiveStream: true,
      });
    }

    const shouldPlay = payload.isPlaying !== false;
    setIsPlaying(shouldPlay);
    if (shouldPlay) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('YT_FORCE_PLAY'));
      }, 200);
    }
  }, []);

  const handleRemoteCommand = useCallback((cmd) => {
    if (!cmd) return;
    if (cmd.type === 'FORCE_RELOAD') {
      window.location.reload();
    } else if (cmd.type === 'PAUSE') {
      if (playerRef.current?.wantsToPlayRef) playerRef.current.wantsToPlayRef.current = false;
      playerRef.current?.audioRef?.current?.pause();
      setIsPlaying(false);
    } else if (cmd.type === 'PLAY') {
      setIsPlaying(true);
      playerRef.current?.audioRef?.current?.play().catch(() => {});
    } else if (cmd.type === 'SEEK_TO') {
      const seekTime = Number(cmd.payload?.time ?? cmd.time);
      if (Number.isFinite(seekTime)) {
        playerRef.current?.seekToTime?.(seekTime);
      }
    } else if (cmd.type === 'SYNC_HEARTBEAT') {
      // Sincronización precisa de pista + reloj en vivo desde Cabina (RadioManager)
      if (!effectiveCabinaSyncRef.current) return;
      const p = cmd.payload || cmd;
      const remoteTab = p.tab || 'supabase';
      if (remoteTab === 'youtube') {
        if (p.immediate) {
          applyRemoteYoutubeVideo({
            id: p.trackId,
            url: p.url,
            title: p.title,
            artist: p.artist,
            isPlaying: p.isPlaying !== false,
          });
        }
        return;
      }
      if (remoteTab !== 'supabase') return;

      const rd = radioDataRef.current;
      if (!rd || rd.mediaServerStatus !== 'online') return;

      const fullTracks = rd.mediaTracks || [];
      const currentList = rd.currentPlaylist || [];
      const urlIdMatch = (p.url || '').match(/\/media\/audio\/([^/?#]+)/);
      const remoteTrackId = p.trackId ? String(p.trackId) : (urlIdMatch ? decodeURIComponent(urlIdMatch[1]) : null);
      const remoteTitle = (p.title || '').trim().toLowerCase();

      const matcher = (t) => {
        if (remoteTrackId && t.id && String(t.id) === remoteTrackId) return true;
        if (p.url && (t.streamUrl === p.url || t.url === p.url)) return true;
        if (remoteTitle && t.title) {
          const lt = t.title.trim().toLowerCase();
          return lt === remoteTitle || lt.includes(remoteTitle) || remoteTitle.includes(lt);
        }
        return false;
      };

      let matchedIdx = currentList.findIndex(matcher);
      let matchedTrack = matchedIdx !== -1 ? currentList[matchedIdx] : null;

      // Si los filtros locales ocultaban la canción de Cabina, limpiar filtros para sincronizar
      if (matchedIdx === -1 && fullTracks.length > 0) {
        const fullIdx = fullTracks.findIndex(matcher);
        if (fullIdx !== -1) {
          rd.setSupabaseSearchQuery?.('');
          rd.setSelectedArtist?.('all');
          rd.setSelectedAlbum?.('all');
          matchedIdx = fullIdx;
          matchedTrack = fullTracks[fullIdx];
        }
      }

      const latencySec = p.sentAt ? Math.max(0, Math.min(5, (Date.now() - Number(p.sentAt)) / 1000)) : 0;
      const targetTime = Number.isFinite(Number(p.currentTime))
        ? Number(p.currentTime) + (p.isPlaying ? latencySec : 0)
        : 0;

      const activeTrack = playerRef.current?.currentTrack;
      const isDifferentTrack =
        matchedTrack && (!activeTrack || String(activeTrack.id) !== String(matchedTrack.id));

      if (isDifferentTrack && matchedIdx !== -1) {
        if (cabinaEndedFallbackTimerRef.current) {
          clearTimeout(cabinaEndedFallbackTimerRef.current);
          cabinaEndedFallbackTimerRef.current = null;
        }
        const nextUrl = matchedTrack.streamUrl || matchedTrack.url || '';
        setCurrentTrackIndex(matchedIdx);
        if (p.isPlaying !== false && nextUrl) {
          playerRef.current?.loadAndPlayImmediate?.(nextUrl, { seekTime: targetTime });
          setIsPlaying(true);
        } else {
          setIsPlaying(Boolean(p.isPlaying));
        }
        return;
      }

      // Misma pista: corregir desfase solo si supera 2.5 segundos (evita micro-saltos en Android)
      const audioEl = playerRef.current?.audioRef?.current;
      if (audioEl && p.isPlaying !== false && Number.isFinite(targetTime) && targetTime >= 0) {
        const localTime = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
        if (Math.abs(localTime - targetTime) > 2.5) {
          playerRef.current?.seekToTime?.(targetTime);
        }
        if (audioEl.paused && !audioEl.ended) {
          setIsPlaying(true);
          audioEl.play().catch(() => {});
        }
      } else if (p.isPlaying === false) {
        setIsPlaying(false);
        audioEl?.pause();
      }
    } else if (cmd.type === 'FORCE_MODE') {
      const targetTab = cmd.payload?.tab || cmd.tab;
      if (targetTab && ['supabase', 'live', 'youtube'].includes(targetTab)) {
        if (targetTab === 'youtube') {
          applyRemoteYoutubeVideo(cmd.payload || cmd);
        } else {
          setRemoteYoutubeTrack(null);
          setActiveTab(targetTab);
        }
      }
    }
  }, [applyRemoteYoutubeVideo]);

  useEffect(() => {
    try {
      localStorage.setItem(`proyecto_radio_index_${activeTab}`, String(currentTrackIndex));
    } catch {}
  }, [currentTrackIndex, activeTab]);

  // Datos del café (Agenda y Menú del día)
  const cafeData = useCafeData();

  // Datos de la Radio (Personal Media Server + Radios Online + YouTube)
  const radioData = useRadioData(
    activeTab,
    null,
    currentTrackIndex,
    setCurrentTrackIndex,
    setIsPlaying,
    setAudioError
  );
  radioDataRef.current = radioData;

  const baseTrack =
    radioData.currentPlaylist[currentTrackIndex] || radioData.currentPlaylist[0] || null;
  const currentTrack =
    activeTab === 'youtube' && remoteYoutubeTrack ? remoteYoutubeTrack : baseTrack;

  // Telemetría de presencia para que RadioManager vea los oyentes conectados
  const presenceData = useMemo(
    () => ({
      isPlaying,
      trackTitle: currentTrack?.title || 'En espera',
      artist: currentTrack?.artist || '',
      volume: playerRef.current?.volume ?? 0.85,
      isMuted: Boolean(playerRef.current?.isMuted),
    }),
    [isPlaying, currentTrack?.title, currentTrack?.artist]
  );

  const {
    currentPlay,
    refreshCurrentPlay,
    remoteVolume,
    tyrannySettings,
    isSyncing: isCabinaSyncing,
  } = useRadioSync({
    isManager: false,
    presenceData,
    onRemoteCommand: handleRemoteCommand,
  });

  // Cuando RadioManager activa "Setlist al Aire", quita permiso de cambio en /Radio
  const isSetlistLocked = Boolean(tyrannySettings?.lockConsoles || tyrannySettings?.setlistMode);
  const effectiveCabinaSync = isSetlistLocked || isCabinaSync;
  effectiveCabinaSyncRef.current = effectiveCabinaSync;

  // Pestaña autorizada por Cabina (soporta biblioteca MP3 y YouTube)
  const forcedCabinaTab =
    currentPlay?.tab && ['supabase', 'live', 'youtube'].includes(currentPlay.tab)
      ? currentPlay.tab
      : tyrannySettings?.forcedTab && ['supabase', 'live', 'youtube'].includes(tyrannySettings.forcedTab)
      ? tyrannySettings.forcedTab
      : 'supabase';

  // Forzar pestaña de Cabina cuando Setlist al Aire está activo (MP3 o YouTube según lo que emita RadioManager)
  useEffect(() => {
    if (isSetlistLocked && activeTab !== forcedCabinaTab) {
      if (forcedCabinaTab === 'youtube') {
        playerRef.current?.audioRef?.current?.pause();
      } else {
        setRemoteYoutubeTrack(null);
      }
      setActiveTab(forcedCabinaTab);
    }
  }, [isSetlistLocked, forcedCabinaTab, activeTab]);

  // Aplicar volumen remoto enviado desde RadioManager
  useEffect(() => {
    if (remoteVolume && playerRef.current?.applyRemoteVolume) {
      playerRef.current.applyRemoteVolume(remoteVolume.volume, remoteVolume.isMuted);
    }
  }, [remoteVolume?.timestamp]);

  const isStreamReady =
    activeTab === 'youtube'
      ? false
      : activeTab === 'supabase'
      ? radioData.mediaServerStatus === 'online'
      : true;

  const handleAudioErrorRef = useRef(null);

  // Reproductor de audio
  const player = useRadioPlayer(
    radioData.currentPlaylist,
    activeTab,
    null,
    null,
    isApplyingRemoteChange,
    currentTrackIndex,
    setCurrentTrackIndex,
    null,
    isPlaying,
    setIsPlaying,
    audioError,
    setAudioError,
    {
      isStreamReady,
      onStallRecover: () => {
        if (handleAudioErrorRef.current) {
          handleAudioErrorRef.current();
        }
      },
    }
  );
  playerRef.current = player;

  const handleTabChange = useCallback(
    (tab) => {
      if (isSetlistLocked && tab !== forcedCabinaTab) return;
      const audioEl = playerRef.current?.audioRef?.current;
      if (audioEl) {
        try {
          audioEl.pause();
        } catch {}
      }

      setRemoteYoutubeTrack(null);
      setActiveTab(tab);
      setIsPlaying(false);
      setAudioError(null);
      recoveryAttemptRef.current = '';

      try {
        localStorage.setItem('proyecto_radio_active_tab', tab);
        const savedIdx = localStorage.getItem(`proyecto_radio_index_${tab}`);
        const restoredIdx =
          savedIdx !== null && !isNaN(Number(savedIdx)) ? Math.max(0, parseInt(savedIdx, 10)) : 0;
        setCurrentTrackIndex(restoredIdx);
      } catch {
        setCurrentTrackIndex(0);
      }

      playerRef.current?.setProgress(0);
      playerRef.current?.setCurrentTime(0);
    },
    [isSetlistLocked, forcedCabinaTab, setCurrentTrackIndex]
  );

  // URL directa para <audio src={...} preload="metadata" />
  const activeAudioSrc =
    activeTab === 'youtube'
      ? undefined
      : activeTab === 'supabase'
      ? radioData.mediaServerStatus === 'online'
        ? currentTrack?.streamUrl || currentTrack?.url || undefined
        : undefined
      : currentTrack?.url || undefined;

  // Sincronización con Cabina (obligatoria cuando Setlist al Aire está activo, u opcional)
  useEffect(() => {
    if (!effectiveCabinaSync || !currentPlay) return;

    const ignoredSignals = [
      'SYNC',
      'BAT_ONLINE',
      'CARGANDO...',
      'OFFLINE',
      'ON_AIR:ON',
      'ON_AIR:OFF',
      'SHUFFLE',
      'PAUSED',
      'NEXT_TRACK',
      'START_BROADCAST',
      'RESUME_BROADCAST',
      'FORCE_RELOAD',
    ];
    if (
      currentPlay.tab === 'OFF_AIR' ||
      ignoredSignals.includes(currentPlay.station_name) ||
      ignoredSignals.includes(currentPlay.station_artist)
    ) {
      setIsPlaying(false);
      return;
    }

    const remoteTab = currentPlay.tab || 'supabase';
    const signature = `${remoteTab}__${currentPlay.station_name || ''}__${currentPlay.station_url || ''}__${currentPlay.is_playing}__${currentPlay.updated_at || ''}`;

    // 1. Modo YouTube desde Cabina
    if (remoteTab === 'youtube') {
      if (lastSyncedSignatureRef.current === signature && activeTab === 'youtube') return;
      lastSyncedSignatureRef.current = signature;
      applyRemoteYoutubeVideo({
        url: currentPlay.station_url,
        title: currentPlay.station_name,
        artist: currentPlay.station_artist,
        cover: currentPlay.station_cover,
        isPlaying: currentPlay.is_playing !== false,
      });
      return;
    }

    // 2. Modo Biblioteca MP3 desde Cabina
    if (remoteTab === 'supabase') {
      if (activeTab !== 'supabase') {
        setRemoteYoutubeTrack(null);
        setActiveTab('supabase');
        return;
      }
      if (radioData.mediaServerStatus !== 'online') return;
      if (lastSyncedSignatureRef.current === signature) return;
      lastSyncedSignatureRef.current = signature;

      const list = radioData.currentPlaylist || [];
      const fullList = radioData.mediaTracks || [];
      if (list.length === 0 && fullList.length === 0) return;

      const urlIdMatch = (currentPlay.station_url || '').match(/\/media\/audio\/([^/?#]+)/);
      const remoteTrackId = urlIdMatch ? decodeURIComponent(urlIdMatch[1]) : null;
      const remoteTitle = (currentPlay.station_name || '').trim().toLowerCase();

      const matcher = (t) => {
        if (remoteTrackId && t.id && String(t.id) === remoteTrackId) return true;
        if (currentPlay.station_url && (t.streamUrl === currentPlay.station_url || t.url === currentPlay.station_url)) {
          return true;
        }
        if (remoteTitle && t.title) {
          const localTitle = t.title.trim().toLowerCase();
          return localTitle === remoteTitle || localTitle.includes(remoteTitle) || remoteTitle.includes(localTitle);
        }
        return false;
      };

      let matchedIdx = list.findIndex(matcher);
      let matchedTrack = matchedIdx !== -1 ? list[matchedIdx] : null;

      if (matchedIdx === -1 && fullList.length > 0) {
        const fullIdx = fullList.findIndex(matcher);
        if (fullIdx !== -1) {
          radioData.setSupabaseSearchQuery?.('');
          radioData.setSelectedArtist?.('all');
          radioData.setSelectedAlbum?.('all');
          matchedIdx = fullIdx;
          matchedTrack = fullList[fullIdx];
        }
      }

      if (cabinaEndedFallbackTimerRef.current) {
        clearTimeout(cabinaEndedFallbackTimerRef.current);
        cabinaEndedFallbackTimerRef.current = null;
      }

      if (matchedIdx !== -1 && matchedIdx !== currentTrackIndex) {
        setCurrentTrackIndex(matchedIdx);
        // Estimar posición inicial aproximada si nos conectamos a mitad de canción (respaldo sin WebSocket)
        let estimatedPos = 0;
        if (currentPlay.is_playing && currentPlay.updated_at && matchedTrack?.duration > 5) {
          const elapsed = (Date.now() - new Date(currentPlay.updated_at).getTime()) / 1000;
          if (elapsed > 2 && elapsed < matchedTrack.duration - 2) {
            estimatedPos = elapsed;
          }
        }
        const nextUrl = matchedTrack?.streamUrl || matchedTrack?.url || '';
        if (currentPlay.is_playing !== false && nextUrl) {
          playerRef.current?.loadAndPlayImmediate?.(nextUrl, {
            seekTime: estimatedPos > 2 ? estimatedPos : null,
          });
        }
      }

      if (typeof currentPlay.is_playing === 'boolean') {
        setIsPlaying(currentPlay.is_playing);
      }
    }
  }, [
    effectiveCabinaSync,
    currentPlay,
    activeTab,
    radioData.mediaServerStatus,
    radioData.currentPlaylist,
    currentTrackIndex,
    applyRemoteYoutubeVideo,
  ]);

  const handleToggleCabinaSync = useCallback(() => {
    if (isSetlistLocked) return;
    setIsCabinaSync((prev) => {
      const next = !prev;
      if (next) {
        lastSyncedSignatureRef.current = '';
      }
      return next;
    });
  }, [isSetlistLocked]);

  // Si Setlist al Aire está activo, bloquear cambios manuales; si no, desactivar sync opcional
  const handleManualJumpToTrack = useCallback(
    (index) => {
      if (isSetlistLocked) return;
      if (isCabinaSync) setIsCabinaSync(false);
      setRemoteYoutubeTrack(null);
      playerRef.current?.jumpToTrack?.(index);
    },
    [isSetlistLocked, isCabinaSync]
  );

  const handleManualNextTrack = useCallback(() => {
    if (isSetlistLocked) return;
    if (isCabinaSync) setIsCabinaSync(false);
    setRemoteYoutubeTrack(null);
    playerRef.current?.nextTrack?.();
  }, [isSetlistLocked, isCabinaSync]);

  const handleManualPrevTrack = useCallback(() => {
    if (isSetlistLocked) return;
    if (isCabinaSync) setIsCabinaSync(false);
    setRemoteYoutubeTrack(null);
    playerRef.current?.prevTrack?.();
  }, [isSetlistLocked, isCabinaSync]);

  const handleManualSeek = useCallback(
    (e) => {
      if (isSetlistLocked) return;
      playerRef.current?.handleSeek?.(e);
    },
    [isSetlistLocked]
  );

  // Limpiar bandera de recuperación y timers al cambiar de pista exitosamente
  useEffect(() => {
    setAudioError(null);
    if (cabinaEndedFallbackTimerRef.current) {
      clearTimeout(cabinaEndedFallbackTimerRef.current);
      cabinaEndedFallbackTimerRef.current = null;
    }
  }, [currentTrack?.id, activeTab]);

  // Limpiar fallback timer al desmontar
  useEffect(() => {
    return () => {
      if (cabinaEndedFallbackTimerRef.current) {
        clearTimeout(cabinaEndedFallbackTimerRef.current);
      }
    };
  }, []);

  // Android Wake Lock: evita que el modo Doze suspenda la pestaña o los timers de red/audio
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let released = false;

    const acquireWakeLock = async () => {
      if (released || !isPlaying) return;
      try {
        if (wakeLockRef.current) return;
        const lock = await navigator.wakeLock.request('screen');
        if (released) {
          lock.release().catch(() => {});
          return;
        }
        wakeLockRef.current = lock;
        lock.addEventListener('release', () => {
          if (wakeLockRef.current === lock) {
            wakeLockRef.current = null;
          }
        });
      } catch {
        // Ignorar en navegadores Android antiguos o sin permiso de WakeLock
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };

    if (isPlaying) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Autoplay automático al iniciar /Radio (con desbloqueo instantáneo al primer toque si el navegador lo bloquea)
  useEffect(() => {
    if (hasAttemptedAutoplayRef.current) return;
    if (activeTab !== 'supabase') return;
    if (radioData.mediaServerStatus !== 'online' || !activeAudioSrc) return;

    const audioEl = playerRef.current?.audioRef?.current;
    if (!audioEl) return;

    hasAttemptedAutoplayRef.current = true;
    audioEl.volume = player.isMuted ? 0 : player.volume;
    if (!audioEl.src || audioEl.src !== activeAudioSrc) {
      audioEl.src = activeAudioSrc;
      audioEl.load();
    }

    const tryAutoplay = () => {
      const p = audioEl.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
          setNeedsAutoplayUnlock(false);
        }).catch((err) => {
          if (err?.name === 'AbortError') return;
          // El navegador bloqueó autoplay sin interacción previa: desbloquear al primer toque/clic
          setNeedsAutoplayUnlock(true);
        });
      }
    };

    tryAutoplay();
  }, [activeTab, radioData.mediaServerStatus, activeAudioSrc, player.isMuted, player.volume]);

  // Si el navegador bloqueó el autoplay inicial, arrancar música automáticamente al primer toque/clic/tecla
  // En Android antiguos, `touchend` y `click` sí activan el gesto de audio (a diferencia de `pointerdown`)
  useEffect(() => {
    if (!needsAutoplayUnlock) return;

    const unlockAndPlay = () => {
      if (!activeAudioSrc) return;
      playerRef.current?.loadAndPlayImmediate?.(activeAudioSrc);
      setIsPlaying(true);
      setNeedsAutoplayUnlock(false);
    };

    window.addEventListener('click', unlockAndPlay, { once: true });
    window.addEventListener('touchend', unlockAndPlay, { once: true });
    window.addEventListener('keydown', unlockAndPlay, { once: true });

    return () => {
      window.removeEventListener('click', unlockAndPlay);
      window.removeEventListener('touchend', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
    };
  }, [needsAutoplayUnlock, activeAudioSrc]);

  // Auto-recuperación: si falla el stream del Personal Media Server, re-leer media_server_config 1 vez
  const handleAudioError = useCallback(async () => {
    const audioEl = playerRef.current?.audioRef?.current;
    if (!audioEl || activeTab === 'youtube') return;

    // Ignorar errores transitorios si el audio sigue reproduciéndose con buffer válido
    if (!audioEl.paused && (audioEl.currentTime > 0 || audioEl.readyState >= 2)) {
      return;
    }

    if (activeTab === 'supabase' && currentTrack?.id) {
      const attemptKey = `${currentTrack.id}__${radioData.mediaServerUrl || 'none'}`;

      if (recoveryAttemptRef.current !== attemptKey && !isRecoveringStream) {
        recoveryAttemptRef.current = attemptKey;
        const savedTime = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
        const shouldResume = isPlaying;

        setIsRecoveringStream(true);
        setAudioError('Reconectando con el servidor de música...');

        const result = await radioData.recoverMediaServer();
        setIsRecoveringStream(false);

        if (result.recovered && result.newBaseUrl) {
          const freshUrl = buildStreamUrl(result.newBaseUrl, currentTrack);
          recoveryAttemptRef.current = `${currentTrack.id}__${result.newBaseUrl}`;
          setAudioError(null);

          const restoreAndPlay = () => {
            if (
              savedTime > 1 &&
              Number.isFinite(audioEl.duration) &&
              savedTime < audioEl.duration - 1
            ) {
              try {
                audioEl.currentTime = savedTime;
              } catch {}
            }
            if (shouldResume) {
              audioEl.play().catch(() => {});
            }
          };

          audioEl.src = freshUrl;
          audioEl.load();
          if (audioEl.readyState >= 1) {
            restoreAndPlay();
          } else {
            audioEl.addEventListener('loadedmetadata', restoreAndPlay, { once: true });
          }
          return;
        }

        // Si no se pudo recuperar, marcar fuera de línea limpiamente
        radioData.markMediaServerOffline('stream_failed');
        setIsPlaying(false);
        setAudioError('No se pudo conectar con el servidor de música.');
        return;
      }

      setIsPlaying(false);
      setAudioError(`No se pudo reproducir "${currentTrack.title}".`);
      return;
    }

    if (isPlaying && currentTrack?.url) {
      setAudioError(`No se pudo cargar "${currentTrack.title}".`);
      setIsPlaying(false);
    }
  }, [activeTab, currentTrack, isPlaying, isRecoveringStream, radioData]);
  handleAudioErrorRef.current = handleAudioError;

  // Integración con MediaSession API (controles nativos en Android, pantalla bloqueada y escritorio)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      const title = currentTrack?.title || 'Proyecto Café Radio';
      const artist = currentTrack?.artist || 'Proyecto Café Radio';
      const album = currentTrack?.album || 'Proyecto Café Radio';
      const coverSrc = currentTrack?.coverUrl || currentTrack?.cover || '';

      if (typeof window !== 'undefined' && typeof window.MediaMetadata === 'function') {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title,
          artist,
          album,
          // No forzar type:'image/webp' para máxima compatibilidad en Android antiguos (JPEG/PNG/WebP)
          ...(coverSrc ? { artwork: [{ src: coverSrc, sizes: '512x512' }] } : {}),
        });
      }

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {}

    // Registrar cada acción individualmente para que un handler no soportado en Chrome Android antiguo no rompa los demás
    const safeSetAction = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    };

    safeSetAction('play', () => {
      if (activeTab !== 'youtube') {
        const audioEl = playerRef.current?.audioRef?.current;
        if (audioEl && audioEl.paused) {
          playerRef.current?.togglePlay?.();
        }
      }
    });
    safeSetAction('pause', () => {
      if (activeTab !== 'youtube') {
        const audioEl = playerRef.current?.audioRef?.current;
        if (playerRef.current?.wantsToPlayRef) playerRef.current.wantsToPlayRef.current = false;
        if (audioEl && !audioEl.paused) audioEl.pause();
        setIsPlaying(false);
      }
    });
    safeSetAction('previoustrack', isSetlistLocked ? null : () => {
      playerRef.current?.prevTrack?.();
    });
    safeSetAction('nexttrack', isSetlistLocked ? null : () => {
      playerRef.current?.nextTrack?.();
    });
  }, [
    currentTrack?.title,
    currentTrack?.artist,
    currentTrack?.album,
    currentTrack?.coverUrl,
    currentTrack?.cover,
    isPlaying,
    activeTab,
    isSetlistLocked,
  ]);

  // Mantener MediaSession positionState actualizado para que Android mantenga vivo el servicio de audio en segundo plano
  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !('mediaSession' in navigator) ||
      typeof navigator.mediaSession.setPositionState !== 'function'
    ) {
      return;
    }
    if (activeTab === 'youtube' || currentTrack?.isLiveStream) return;
    if (!Number.isFinite(player.duration) || player.duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: player.duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, player.currentTime || 0), player.duration),
      });
    } catch {}
  }, [player.currentTime, player.duration, activeTab, currentTrack?.isLiveStream]);

  // Dark mode state with persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('proyecto_radio_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('proyecto_radio_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div
      className={`w-full min-h-screen relative font-sans overflow-x-hidden pb-8 transition-colors duration-300 ${
        isDarkMode ? 'dark bg-[#0b0c10] text-white' : 'bg-cream-bg text-black'
      }`}
    >
      <RadioHeader
        isPlaying={isPlaying}
        nowPlaying={radioData.nowPlaying}
        currentTrack={currentTrack}
        isSyncing={radioData.mediaServerStatus === 'loading' || isRecoveringStream || (isCabinaSync && isCabinaSyncing)}
        isDailyLoop={player.isDailyLoop}
        setIsDailyLoop={player.setIsDailyLoop}
        setShowInfoModal={player.setShowInfoModal}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        showHamburgerMenu={true}
        allowAdminNav={false}
      />

      {/* LAYOUT PRINCIPAL COMPACTO Y ADAPTATIVO */}
      <div className="relative z-10 px-3 lg:px-5 pb-6 mx-auto w-full" style={{ maxWidth: '1720px' }}>
        {/* MOBILE TABS SWITCHER COMPACTO */}
        <div className="lg:hidden flex border-[2.5px] border-black bg-cream-bg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 rounded-none overflow-hidden">
          <button
            onClick={() => setMobileTab('agenda')}
            className={`flex-1 py-2 px-2 font-black uppercase text-xs border-r-[2.5px] border-black transition-colors ${
              mobileTab === 'agenda' ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setMobileTab('player')}
            className={`flex-1 py-2 px-2 font-black uppercase text-xs border-r-[2.5px] border-black transition-colors ${
              mobileTab === 'player' ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
          >
            Radio
          </button>
          <button
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-2 px-2 font-black uppercase text-xs transition-colors ${
              mobileTab === 'menu' ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
          >
            Menú
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start">
          <div className={`${mobileTab === 'agenda' ? 'block' : 'hidden'} lg:block lg:col-span-3`}>
            <AgendaColumn {...cafeData} />
          </div>

          <div
            className={`flex-col gap-2.5 ${
              mobileTab === 'player' ? 'flex' : 'hidden'
            } lg:flex lg:col-span-6`}
          >
            {needsAutoplayUnlock && !isPlaying && radioData.mediaServerStatus === 'online' && (
              <button
                onClick={() => {
                  if (activeAudioSrc) {
                    playerRef.current?.loadAndPlayImmediate?.(activeAudioSrc);
                    setIsPlaying(true);
                    setNeedsAutoplayUnlock(false);
                  }
                }}
                className="w-full py-2 px-3 border-[2.5px] border-black bg-[#1DB954] hover:bg-[#1ed760] text-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 animate-pulse transition"
              >
                <span>🔊 Toca aquí o en cualquier parte para activar la música</span>
              </button>
            )}

            <PlayerCenter
              currentTrack={currentTrack}
              nowPlaying={radioData.nowPlaying}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              volume={player.volume}
              isMuted={player.isMuted}
              handleVolumeChange={player.handleVolumeChange}
              toggleMute={player.toggleMute}
              progress={player.progress}
              handleSeek={handleManualSeek}
              currentTime={player.currentTime}
              duration={player.duration}
              formatTime={player.formatTime}
              isShuffle={player.isShuffle}
              setIsShuffle={player.setIsShuffle}
              prevTrack={handleManualPrevTrack}
              togglePlay={player.togglePlay}
              nextTrack={handleManualNextTrack}
              jumpToTrack={handleManualJumpToTrack}
              queueWindow={player.queueWindow}
              isRepeatSingle={player.isRepeatSingle}
              setIsRepeatSingle={player.setIsRepeatSingle}
              audioError={audioError}
              activeTab={activeTab}
              mediaServerStatus={radioData.mediaServerStatus}
              retryMediaServer={radioData.retryMediaServer}
              isRecoveringStream={isRecoveringStream}
              isCabinaSync={effectiveCabinaSync}
              isSetlistLocked={isSetlistLocked}
              onToggleCabinaSync={handleToggleCabinaSync}
            />

            <SourceTabs
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              isConsoleLocked={isSetlistLocked}
              currentTrack={currentTrack}
              currentTrackIndex={currentTrackIndex}
              setCurrentTrackIndex={setCurrentTrackIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              togglePlay={player.togglePlay}
              broadcastPlay={null}
              isApplyingRemoteChange={isApplyingRemoteChange}
              isShuffle={player.isShuffle}
              setIsShuffle={player.setIsShuffle}
              jumpToTrack={handleManualJumpToTrack}
              {...radioData}
            />
          </div>

          <div className={`${mobileTab === 'menu' ? 'block' : 'hidden'} lg:block lg:col-span-3`}>
            <RadioMenuDelDia todaysLunch={cafeData.todaysLunch} />
          </div>
        </div>
      </div>

      {/* AUDIO ELEMENT: Streaming MP3 directo con soporte HTTP 206 Partial Content / Range.
          Sin prop `src` en JSX para evitar conflictos de reconciliación con la carga síncrona de useRadioPlayer en Android */}
      <audio
        ref={player.audioRef}
        preload="auto"
        playsInline
        onLoadedMetadata={player.handleLoadedMetadata}
        onCanPlay={player.handleCanPlay}
        onTimeUpdate={player.handleTimeUpdate}
        onPlaying={() => {
          setAudioError(null);
          setNeedsAutoplayUnlock(false);
          recoveryAttemptRef.current = '';
        }}
        onError={handleAudioError}
        onEnded={() => {
          if (activeTab === 'youtube') return;
          if (effectiveCabinaSync) {
            // En modo Cabina Sync: consultar inmediatamente si Cabina ya cambió de pista
            // y usar fallback de 2.5s para garantizar que Android jamás se quede en silencio
            refreshCurrentPlay?.();
            if (cabinaEndedFallbackTimerRef.current) {
              clearTimeout(cabinaEndedFallbackTimerRef.current);
            }
            cabinaEndedFallbackTimerRef.current = setTimeout(() => {
              cabinaEndedFallbackTimerRef.current = null;
              const audioEl = playerRef.current?.audioRef?.current;
              if (audioEl && (audioEl.ended || audioEl.paused)) {
                playerRef.current?.handleTrackEnded?.();
              }
            }, 2500);
          } else {
            player.handleTrackEnded();
          }
        }}
      />
    </div>
  );
}
