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
      playerRef.current?.audioRef?.current?.pause();
      setIsPlaying(false);
    } else if (cmd.type === 'PLAY') {
      setIsPlaying(true);
      playerRef.current?.audioRef?.current?.play().catch(() => {});
    } else if (cmd.type === 'SEEK_TO') {
      const seekTime = Number(cmd.payload?.time ?? cmd.time);
      const audioEl = playerRef.current?.audioRef?.current;
      if (Number.isFinite(seekTime) && audioEl) {
        try {
          audioEl.currentTime = seekTime;
        } catch {}
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
    setAudioError
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
    const signature = `${remoteTab}__${currentPlay.station_name || ''}__${currentPlay.station_url || ''}__${currentPlay.is_playing}`;

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
      if (list.length === 0) return;

      const urlIdMatch = (currentPlay.station_url || '').match(/\/media\/audio\/([^/?#]+)/);
      const remoteTrackId = urlIdMatch ? decodeURIComponent(urlIdMatch[1]) : null;
      const remoteTitle = (currentPlay.station_name || '').trim().toLowerCase();

      const matchedIdx = list.findIndex((t) => {
        if (remoteTrackId && t.id && String(t.id) === remoteTrackId) return true;
        if (currentPlay.station_url && (t.streamUrl === currentPlay.station_url || t.url === currentPlay.station_url)) {
          return true;
        }
        if (remoteTitle && t.title) {
          const localTitle = t.title.trim().toLowerCase();
          return localTitle === remoteTitle || localTitle.includes(remoteTitle) || remoteTitle.includes(localTitle);
        }
        return false;
      });

      if (matchedIdx !== -1 && matchedIdx !== currentTrackIndex) {
        setCurrentTrackIndex(matchedIdx);
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

  // Limpiar bandera de recuperación al cambiar de pista exitosamente
  useEffect(() => {
    setAudioError(null);
  }, [currentTrack?.id, activeTab]);

  // Autoplay automático al iniciar /Radio (con desbloqueo instantáneo al primer toque si el navegador lo bloquea)
  useEffect(() => {
    if (hasAttemptedAutoplayRef.current) return;
    if (activeTab !== 'supabase') return;
    if (radioData.mediaServerStatus !== 'online' || !activeAudioSrc) return;

    const audioEl = playerRef.current?.audioRef?.current;
    if (!audioEl) return;

    hasAttemptedAutoplayRef.current = true;
    audioEl.volume = player.isMuted ? 0 : player.volume;

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

  // Si el navegador bloqueó el autoplay inicial, arrancar música automáticamente al primer toque/tecla
  useEffect(() => {
    if (!needsAutoplayUnlock) return;

    const unlockAndPlay = () => {
      const audioEl = playerRef.current?.audioRef?.current;
      if (!audioEl || !activeAudioSrc) return;
      audioEl.volume = player.isMuted ? 0 : player.volume;
      audioEl
        .play()
        .then(() => {
          setIsPlaying(true);
          setNeedsAutoplayUnlock(false);
        })
        .catch(() => {});
    };

    window.addEventListener('pointerdown', unlockAndPlay, { once: true });
    window.addEventListener('keydown', unlockAndPlay, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
    };
  }, [needsAutoplayUnlock, activeAudioSrc, player.isMuted, player.volume]);

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

  // Integración con MediaSession API (controles nativos en móvil y escritorio)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      const title = currentTrack?.title || 'Proyecto Café Radio';
      const artist = currentTrack?.artist || 'Proyecto Café Radio';
      const album = currentTrack?.album || 'Proyecto Café Radio';
      const coverSrc = currentTrack?.coverUrl || currentTrack?.cover || '';

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title,
        artist,
        album,
        ...(coverSrc ? { artwork: [{ src: coverSrc, sizes: '512x512', type: 'image/webp' }] } : {}),
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        if (activeTab !== 'youtube') {
          playerRef.current?.togglePlay?.();
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (activeTab !== 'youtube') {
          const audioEl = playerRef.current?.audioRef?.current;
          if (audioEl && !audioEl.paused) audioEl.pause();
          setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playerRef.current?.prevTrack?.();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playerRef.current?.nextTrack?.();
      });
    } catch {}
  }, [
    currentTrack?.title,
    currentTrack?.artist,
    currentTrack?.album,
    currentTrack?.coverUrl,
    currentTrack?.cover,
    isPlaying,
    activeTab,
  ]);

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
                  const audioEl = playerRef.current?.audioRef?.current;
                  if (audioEl) {
                    audioEl.volume = player.isMuted ? 0 : player.volume;
                    audioEl.play().then(() => {
                      setIsPlaying(true);
                      setNeedsAutoplayUnlock(false);
                    }).catch(() => {});
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

      {/* AUDIO ELEMENT: Streaming MP3 directo con soporte HTTP 206 Partial Content / Range */}
      <audio
        ref={player.audioRef}
        src={activeAudioSrc}
        preload="metadata"
        onLoadedMetadata={player.handleLoadedMetadata}
        onTimeUpdate={player.handleTimeUpdate}
        onPlaying={() => {
          setAudioError(null);
          setNeedsAutoplayUnlock(false);
          recoveryAttemptRef.current = '';
        }}
        onError={handleAudioError}
        onEnded={() => {
          if (activeTab !== 'youtube') {
            player.handleTrackEnded();
          }
        }}
      />
    </div>
  );
}
