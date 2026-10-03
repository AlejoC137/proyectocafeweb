import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useRadioSync } from '../hooks/useRadioSync';
import { useCafeData } from '../hooks/useCafeData';
import { useRadioData } from '../hooks/useRadioData';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import { Radio, Play, Youtube, Globe } from 'lucide-react';

import RadioHeader from './radio/RadioHeader';
import AgendaColumn from './radio/AgendaColumn';
import MenuColumn from './radio/MenuColumn';
import RadioMenuDelDia from './radio/RadioMenuDelDia';
import PlayerCenter from './radio/PlayerCenter';
import SourceTabs from './radio/SourceTabs';

export default function ProyectoRadio() {
  const isApplyingRemoteChange = useRef(false);
  const playerRef = useRef(null);

  // 2. Tab Local con persistencia en localStorage para recordar estado entre sesiones
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('proyecto_radio_active_tab');
      if (saved && ['supabase', 'live', 'youtube'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'supabase';
  });
  const [mobileTab, setMobileTab] = useState('player'); // 'agenda', 'player', 'menu'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('proyecto_radio_active_tab', tab);
      const savedIdx = localStorage.getItem(`proyecto_radio_index_${tab}`);
      const restoredIdx = (savedIdx !== null && !isNaN(Number(savedIdx))) ? Math.max(0, parseInt(savedIdx, 10)) : 0;
      setCurrentTrackIndex(restoredIdx);
      playerRef.current?.setCurrentTrackIndex(restoredIdx);
    } catch (e) {
      setCurrentTrackIndex(0);
      playerRef.current?.setCurrentTrackIndex(0);
    }
    playerRef.current?.setProgress(0);
    playerRef.current?.setCurrentTime(0);
    playerRef.current?.setIsPlaying(false);
    playerRef.current?.setAudioError(null);
  };

  // 3. Hooks
  const cafeData = useCafeData();
  
  // Hoist shared states needed for player and radioData con persistencia de índice por tab
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    try {
      const savedTab = localStorage.getItem('proyecto_radio_active_tab') || 'supabase';
      const savedIdx = localStorage.getItem(`proyecto_radio_index_${savedTab}`);
      if (savedIdx !== null && !isNaN(Number(savedIdx))) {
        return Math.max(0, parseInt(savedIdx, 10));
      }
    } catch (e) {}
    return 0;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(`proyecto_radio_index_${activeTab}`, String(currentTrackIndex));
    } catch (e) {}
  }, [currentTrackIndex, activeTab]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const radioData = useRadioData(
    activeTab, 
    null, // we can't pass currentTrack yet because it's derived from radioData
    currentTrackIndex, 
    setCurrentTrackIndex, 
    setIsPlaying, 
    setAudioError
  );

  const currentTrack = radioData.currentPlaylist[currentTrackIndex] || radioData.currentPlaylist[0];

  // Callback para ejecutar comandos remotos enviados desde Radio Manager
  const handleRemoteCommand = useCallback((cmd) => {
    console.log('[ProyectoRadio] Ejecutando comando remoto:', cmd);
    if (cmd.type === 'FORCE_RELOAD') {
      window.location.reload();
    } else if (cmd.type === 'APPLY_PLAYLIST') {
      if (Array.isArray(cmd.tracks) && cmd.tracks.length > 0) {
        radioData.setSupabasePlaylist(cmd.tracks);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
      }
    } else if (cmd.type === 'FORCE_MODE' || cmd.type === 'SWITCH_TAB') {
      const rawTab = cmd.payload?.tab || cmd.tab || cmd.payload?.mode || cmd.mode;
      let targetTab = 'supabase';
      if (rawTab === 'youtube' || rawTab === 'yt') targetTab = 'youtube';
      else if (rawTab === 'live' || rawTab === 'radio' || rawTab === 'radios' || rawTab === 'plaza') targetTab = 'live';
      else if (rawTab === 'supabase' || rawTab === 'files') targetTab = 'supabase';

      console.log(`[ProyectoRadio] ⚡ Forzando modo remoto a: ${targetTab}`);
      setActiveTab(targetTab);
      try {
        localStorage.setItem('proyecto_radio_active_tab', targetTab);
      } catch (e) {}

      playerRef.current?.setShowAutoStart(false);
      setIsPlaying(true);

      if (targetTab === 'youtube') {
        if (playerRef.current?.audioRef?.current) {
          try { playerRef.current.audioRef.current.pause(); } catch (e) {}
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('YT_FORCE_PLAY'));
        }, 150);
      } else if (targetTab === 'live') {
        const station = radioData.apiStations[0] || (currentTrack?.isLiveStream ? currentTrack : null);
        const stationUrl = station?.url || cmd.payload?.url || cmd.url;
        if (stationUrl && playerRef.current?.audioRef?.current) {
          playerRef.current.audioRef.current.src = stationUrl;
          playerRef.current.audioRef.current.play().catch(() => {});
        }
      } else if (targetTab === 'supabase') {
        const fileUrl = radioData.supabasePlaylist[0]?.url || cmd.payload?.url || cmd.url;
        if (fileUrl && playerRef.current?.audioRef?.current) {
          playerRef.current.audioRef.current.src = fileUrl;
          playerRef.current.audioRef.current.play().catch(() => {});
        }
      }
    } else if (cmd.type === 'PAUSE') {
      playerRef.current?.audioRef?.current?.pause();
      setIsPlaying(false);
    } else if (cmd.type === 'PLAY') {
      setIsPlaying(true);
      if (activeTab === 'youtube') {
        window.dispatchEvent(new CustomEvent('YT_FORCE_PLAY'));
      } else {
        playerRef.current?.audioRef?.current?.play().catch(() => {});
      }
    } else if (cmd.type === 'NEXT') {
      playerRef.current?.nextTrack();
    } else if (cmd.type === 'SEEK_TO') {
      const seekTime = Number(cmd.payload?.time ?? cmd.time);
      if (Number.isFinite(seekTime) && playerRef.current?.audioRef?.current) {
        playerRef.current.audioRef.current.currentTime = seekTime;
        console.log(`[ProyectoRadio] ⏩ Comando remoto SEEK_TO: ${seekTime.toFixed(1)}s`);
      }
    } else if (cmd.type === 'PLAYLIST_UPDATED') {
      radioData.fetchSupabasePlaylist?.(true);
    } else if (cmd.type === 'PLAYLIST_TRACK_REMOVED') {
      if (cmd.payload?.deletedId) {
        radioData.setSupabasePlaylist?.(prev => prev.filter(t => t.id !== cmd.payload.deletedId));
      } else {
        radioData.fetchSupabasePlaylist?.(true);
      }
    } else if (cmd.type === 'SET_VOLUME') {
      if (cmd.volume !== undefined) {
        playerRef.current?.handleVolumeChange({ target: { value: cmd.volume } });
      }
    }
  }, [radioData, activeTab, currentTrack, setCurrentTrackIndex, setIsPlaying]);

  // Telemetría de presencia para reportar estado y oyentes activos a Radio Manager
  const presenceData = useMemo(() => ({
    isPlaying,
    trackTitle: currentTrack?.title || 'En espera',
    artist: currentTrack?.artist || '',
    volume: playerRef.current?.volume !== undefined ? playerRef.current.volume : 0.85,
    isMuted: Boolean(playerRef.current?.isMuted)
  }), [isPlaying, currentTrack?.title, currentTrack?.artist]);

  // 1. Sync & Presence
  const { currentPlay, remoteVolume, broadcastPlay, broadcastStop, broadcastVolume, isSyncing } = useRadioSync({
    isManager: false,
    presenceData,
    onRemoteCommand: handleRemoteCommand
  });

  const player = useRadioPlayer(
    radioData.currentPlaylist,
    activeTab,
    null, // Oyente: NO emite broadcastPlay a la estación
    null, // Oyente: NO emite broadcastStop a la estación
    isApplyingRemoteChange,
    currentTrackIndex,
    setCurrentTrackIndex,
    null, // Oyente: NO altera el volumen de la estación
    isPlaying,
    setIsPlaying,
    audioError,
    setAudioError
  );
  playerRef.current = player;

  // Sincronizar estado Play/Pausa de ProyectoRadio con currentPlay.is_playing (recuerda tras F5)
  React.useEffect(() => {
    if (currentPlay && typeof currentPlay.is_playing === 'boolean') {
      setIsPlaying(currentPlay.is_playing);
      player.setIsPlaying(currentPlay.is_playing);
    }
  }, [currentPlay?.is_playing]);

  // Override player's states with hoisted states
  player.currentTrackIndex = currentTrackIndex;
  player.setCurrentTrackIndex = setCurrentTrackIndex;
  player.isPlaying = isPlaying;
  player.setIsPlaying = setIsPlaying;
  player.audioError = audioError;
  player.setAudioError = setAudioError;
  player.currentTrack = currentTrack;

  // Sincronización continua de tiempo en vivo emitida desde Radio Manager
  const lastLiveTickRef = useRef({ time: 0, receivedAt: 0, url: '' });
  const lastPlayedTrackKeyRef = useRef('');
  const lastPlayedSongNameRef = useRef('');

  React.useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('radio-live-time');
      bc.onmessage = (event) => {
        if (event.data?.type === 'LIVE_TICK') {
          lastLiveTickRef.current = {
            time: Number(event.data.currentTime) || 0,
            receivedAt: Number(event.data.timestamp) || Date.now(),
            url: event.data.url || ''
          };
          // Si es un SEEK manual explícito desde el cursor de Radio Manager:
          if (event.data.isForceSeek) {
            const seekTime = Number(event.data.currentTime);
            if (Number.isFinite(seekTime) && playerRef.current?.audioRef?.current) {
              playerRef.current.audioRef.current.currentTime = seekTime;
              console.log(`[ProyectoRadio] ⚡ Seek remoto manual aplicado: ${seekTime.toFixed(1)}s`);
            }
          }
        }
      };
    } catch (e) {}
    return () => {
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, []);

  const getLiveBroadcastOffset = (trackDuration) => {
    let offset = 0;
    // 1. Tick local de BroadcastChannel (instantáneo y sin latencia)
    if (lastLiveTickRef.current.receivedAt > 0) {
      const elapsedSinceTick = (Date.now() - lastLiveTickRef.current.receivedAt) / 1000;
      if (elapsedSinceTick >= 0 && elapsedSinceTick < 60) {
        offset = lastLiveTickRef.current.time + elapsedSinceTick;
      }
    }
    // 2. Fallback: Diferencia respecto al timestamp updated_at de Supabase
    if (offset <= 0 && currentPlay?.updated_at && currentPlay.is_playing) {
      const startedAt = new Date(currentPlay.updated_at).getTime();
      const elapsedSinceStart = (Date.now() - startedAt) / 1000;
      if (elapsedSinceStart > 0) {
        offset = elapsedSinceStart;
      }
    }

    if (trackDuration && Number.isFinite(trackDuration) && trackDuration > 0) {
      offset = offset % trackDuration;
    }
    return Math.max(0, offset);
  };

  const applyLiveSeek = (audioEl) => {
    if (!audioEl || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
    const targetOffset = getLiveBroadcastOffset(audioEl.duration);
    if (targetOffset > 1 && targetOffset < audioEl.duration) {
      try {
        audioEl.currentTime = targetOffset;
        console.log(`[ProyectoRadio] 📻 Señal al aire sincronizada a ${targetOffset.toFixed(1)}s`);
      } catch (err) {}
    }
  };

  // Reacción limpia a eventos de cambio de canción al aire (SIN loops ni recargas que corten el audio)
  React.useEffect(() => {
    if (!currentPlay) return;

    // Si la estación está desautorizada por el switch OFF AIR de Radio Manager
    if (currentPlay.tab === 'OFF_AIR') {
      const audioEl = player.audioRef.current;
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    // Ignorar señales internas de control o sincronización
    const ignoredControlSignals = ['SYNC', 'BAT_ONLINE', 'CARGANDO...', 'OFFLINE', 'ON_AIR:ON', 'ON_AIR:OFF', 'SHUFFLE', 'PAUSED', 'NEXT_TRACK', 'START_BROADCAST', 'RESUME_BROADCAST', 'FORCE_RELOAD'];
    if (ignoredControlSignals.includes(currentPlay.station_artist) || ignoredControlSignals.includes(currentPlay.station_name)) {
      return;
    }

    const audioEl = player.audioRef.current;
    if (!audioEl) return;

    let streamUrl = currentPlay.station_url || '';
    if (streamUrl && streamUrl.startsWith('local://')) {
      const isLocalHost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const rawName = decodeURIComponent(streamUrl.replace('local://', ''));

      if (isLocalHost) {
        streamUrl = `/api/local-audio?file=${encodeURIComponent(rawName)}`;
      } else {
        streamUrl = '';
      }
    }

    const isNewSong = currentPlay.station_name && lastPlayedSongNameRef.current && currentPlay.station_name !== lastPlayedSongNameRef.current;

    // Si cambió la canción o la nueva pista no tiene una URL de streaming lista (está cargando o subiendo en el BAT):
    // Silenciar inmediatamente el audio anterior para no reproducir residuo/fantasma en caché.
    if (isNewSong || !streamUrl || (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://') && !streamUrl.startsWith('/api/local-audio'))) {
      if (isNewSong) {
        lastPlayedSongNameRef.current = currentPlay.station_name;
        lastPlayedTrackKeyRef.current = '';
        if (audioEl) {
          audioEl.pause();
          audioEl.currentTime = 0;
        }
      }
      if (!streamUrl || (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://') && !streamUrl.startsWith('/api/local-audio'))) {
        return; // Esperar en silencio a que llegue la URL real del nuevo tema
      }
    }

    lastPlayedSongNameRef.current = currentPlay.station_name;
    const trackKey = `${currentPlay.station_name}__${streamUrl}`;

    // Si es la misma canción ya cargada, solo manejar play/pause sin recargar
    if (lastPlayedTrackKeyRef.current === trackKey) {
      if (currentPlay.is_playing) {
        setIsPlaying(true);
        if (audioEl.paused) audioEl.play().catch(() => {});
      } else {
        audioEl.pause();
        setIsPlaying(false);
      }
      return;
    }

    // Nueva canción al aire:
    lastPlayedTrackKeyRef.current = trackKey;
    isApplyingRemoteChange.current = true;

    audioEl.pause();
    audioEl.currentTime = 0;

    if (currentPlay.tab) {
      let resolvedTab = null;
      if (currentPlay.tab === 'youtube') resolvedTab = 'youtube';
      else if (currentPlay.tab === 'live' || currentPlay.tab === 'radio' || currentPlay.tab === 'radios' || currentPlay.tab === 'plaza') resolvedTab = 'live';
      else if (currentPlay.tab === 'supabase' || currentPlay.tab === 'files') resolvedTab = 'supabase';

      if (resolvedTab && resolvedTab !== activeTab) {
        setActiveTab(resolvedTab);
        try {
          localStorage.setItem('proyecto_radio_active_tab', resolvedTab);
        } catch (e) {}
      }
    }

    const targetVol = player.isMuted ? 0 : player.volume;
    audioEl.volume = targetVol;
    if (audioEl.src !== streamUrl) {
      audioEl.src = streamUrl;
    }

    const startTrack = () => {
      applyLiveSeek(audioEl);
      if (currentPlay.is_playing) {
        setIsPlaying(true);
        audioEl.play().catch(err => {
          console.warn("Autoplay diferido:", err.message);
        });
      }
    };

    if (audioEl.readyState >= 1) {
      startTrack();
    } else {
      audioEl.addEventListener('loadedmetadata', startTrack, { once: true });
    }

    setTimeout(() => {
      isApplyingRemoteChange.current = false;
    }, 400);
  }, [currentPlay?.station_url, currentPlay?.station_name, currentPlay?.is_playing]);

  // Sincronizar el index local si la playlist actual contiene la canción o estación global al aire
  React.useEffect(() => {
    if (currentPlay && radioData.currentPlaylist.length > 0) {
      const idx = radioData.currentPlaylist.findIndex(t => 
        (t.url && (t.url === currentPlay.station_url || t.stream_url === currentPlay.station_url)) ||
        (t.title && currentPlay.station_name && (
          t.title.toLowerCase() === currentPlay.station_name.toLowerCase() ||
          currentPlay.station_name.toLowerCase().includes(t.title.toLowerCase())
        ))
      );
      if (idx !== -1 && idx !== currentTrackIndex) {
        setCurrentTrackIndex(idx);
      }
    }
  }, [currentPlay?.station_url, currentPlay?.station_name, radioData.currentPlaylist]);

  // Escuchar evento de reinicio forzado global
  React.useEffect(() => {
    const handleForceRestartEvent = () => {
      if (player.audioRef.current) {
        player.audioRef.current.pause();
        player.audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      player.setProgress(0);
      player.setCurrentTime(0);
    };

    window.addEventListener('RADIO_FORCE_RESTART', handleForceRestartEvent);
    return () => window.removeEventListener('RADIO_FORCE_RESTART', handleForceRestartEvent);
  }, []);

  const handleAutoStart = () => {
    player.setShowAutoStart(false);
    setIsPlaying(true);

    if (activeTab === 'youtube' || currentTrack?.type === 'youtube') {
      if (player.audioRef.current) {
        try { player.audioRef.current.pause(); } catch (e) {}
      }
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('YT_FORCE_PLAY'));
      }, 100);
      return;
    }

    if (activeTab === 'live') {
      const station = currentTrack || radioData.apiStations[0];
      const stationUrl = station?.url;
      if (stationUrl && player.audioRef.current) {
        const audioEl = player.audioRef.current;
        audioEl.src = stationUrl;
        audioEl.volume = player.isMuted ? 0 : player.volume;
        audioEl.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn("Autoplay block (Live Radio):", err.message);
        });
        return;
      }
    }

    // Resolve local:// URLs to the API proxy path or Supabase Storage in production
    const resolveUrl = (raw) => {
      if (!raw) return null;
      if (raw.startsWith('local://')) {
        const isLocalHost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const rawName = decodeURIComponent(raw.replace('local://', ''));
        if (isLocalHost) {
          return `/api/local-audio?file=${encodeURIComponent(rawName)}`;
        }
        return currentPlay?.station_url || null;
      }
      return raw;
    };

    const targetUrl =
      (currentPlay?.station_url && (currentPlay.station_url.startsWith('http://') || currentPlay.station_url.startsWith('https://')) ? currentPlay.station_url : null) ||
      resolveUrl(currentTrack?.url) ||
      resolveUrl(player.pendingPlayRef.current) ||
      resolveUrl(radioData.supabasePlaylist[0]?.url) ||
      // Last resort: whatever is already loaded in the audio element
      player.audioRef.current?.src || null;

    if (!targetUrl || !player.audioRef.current) {
      console.warn("AutoStart: no se encontró una URL válida para reproducir.");
      setIsPlaying(false);
      return;
    }

    const audioEl = player.audioRef.current;
    audioEl.volume = player.isMuted ? 0 : player.volume;

    const srcChanged = audioEl.src !== targetUrl && audioEl.src !== new URL(targetUrl, window.location.origin).href;
    if (srcChanged) {
      audioEl.src = targetUrl;
    }

    applyLiveSeek(audioEl);

    const promise = audioEl.play();
    if (promise !== undefined) {
      promise.then(() => {
        setIsPlaying(true);
        applyLiveSeek(audioEl);
      }).catch((err) => {
        if (err.name === 'AbortError' || err.message?.includes('interrupted') || err.message?.includes('new load request')) {
          return;
        }
        console.warn("Autoplay block (AutoStart):", err.message);
        setIsPlaying(false);
      });
    }
  };

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

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const borderColor = "border-[#1F2937] dark:border-slate-700";
  const shadowColor = "shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] dark:shadow-[6px_6px_0px_0px_rgba(239,68,68,0.5)]";

  const handleAudioEnded = () => {
    const audioEl = player.audioRef?.current;
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    // En modo radio sincronizada (supabase/live), no auto-avanzar con nextTrack local para no disparar audio en caché.
    // Simplemente detenerse en silencio; el BAT o RadioManager avanzará la estación y enviará la nueva señal por Supabase.
    if (activeTab === 'youtube') {
      player.handleTrackEnded();
    }
  };

  return (
    <div className={`w-full min-h-screen relative font-sans overflow-x-hidden pb-8 transition-colors duration-300 ${
      isDarkMode ? 'dark bg-[#0b0c10] text-white' : 'bg-cream-bg text-black'
    }`}>
      

      <RadioHeader 
        isPlaying={isPlaying}
        nowPlaying={radioData.nowPlaying}
        currentTrack={currentTrack}
        isSyncing={isSyncing}
        isDailyLoop={player.isDailyLoop}
        setIsDailyLoop={player.setIsDailyLoop}
        setShowInfoModal={player.setShowInfoModal}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* LAYOUT PRINCIPAL */}
      <div className="relative z-10 px-4 lg:px-6 pb-8 mx-auto w-full" style={{ maxWidth: '1600px' }}>
        
        {/* MOBILE TABS SWITCHER */}
        <div className="lg:hidden flex border-[3px] border-black bg-cream-bg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 rounded-none overflow-hidden">
          <button 
            onClick={() => setMobileTab('agenda')}
            className={`flex-1 py-3 px-2 font-black uppercase text-xs sm:text-sm border-r-[3px] border-black transition-colors ${mobileTab === 'agenda' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            Agenda
          </button>
          <button 
            onClick={() => setMobileTab('player')}
            className={`flex-1 py-3 px-2 font-black uppercase text-xs sm:text-sm border-r-[3px] border-black transition-colors ${mobileTab === 'player' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            Radio
          </button>
          <button 
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-3 px-2 font-black uppercase text-xs sm:text-sm transition-colors ${mobileTab === 'menu' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            Menú
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 xl:gap-16">
          
          <div className={`${mobileTab === 'agenda' ? 'block' : 'hidden'} lg:block`}>
            <AgendaColumn {...cafeData} />
          </div>

          <div className={`flex-col gap-4 ${mobileTab === 'player' ? 'flex' : 'hidden'} lg:flex`}>
            <PlayerCenter 
              currentTrack={{
                ...currentTrack,
                // Si la URL que está sonando es la global, garantizamos que el título y cover vengan del global para evitar desajustes
                title: (player.audioRef.current?.src === currentPlay?.station_url) ? currentPlay?.station_name : (currentTrack?.title || currentPlay?.station_name || 'Selecciona una estación'),
                artist: (player.audioRef.current?.src === currentPlay?.station_url) ? currentPlay?.station_artist : (currentTrack?.artist || currentPlay?.station_artist || ''),
                cover: (player.audioRef.current?.src === currentPlay?.station_url) ? currentPlay?.station_cover : (currentTrack?.cover || currentPlay?.station_cover),
                isLiveStream: currentTrack?.isLiveStream ?? true,
                url: currentTrack?.url || currentPlay?.station_url
              }}
              nowPlaying={radioData.nowPlaying}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              volume={player.volume}
              isMuted={player.isMuted}
              handleVolumeChange={player.handleVolumeChange}
              toggleMute={player.toggleMute}
              progress={player.progress}
              handleSeek={player.handleSeek}
              currentTime={player.currentTime}
              duration={player.duration}
              formatTime={player.formatTime}
              isShuffle={player.isShuffle}
              setIsShuffle={player.setIsShuffle}
              prevTrack={player.prevTrack}
              togglePlay={player.togglePlay}
              nextTrack={player.nextTrack}
              jumpToTrack={player.jumpToTrack}
              queueWindow={player.queueWindow}
              isRepeatSingle={player.isRepeatSingle}
              setIsRepeatSingle={player.setIsRepeatSingle}
              audioError={audioError}
              activeTab={activeTab}
            />

            <SourceTabs 
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              currentPlay={currentPlay}
              currentTrackIndex={currentTrackIndex}
              setCurrentTrackIndex={setCurrentTrackIndex}
              setIsPlaying={setIsPlaying}
              broadcastPlay={broadcastPlay}
              isApplyingRemoteChange={isApplyingRemoteChange}
              formattedTotalPlaylistTime={player.formatTime(radioData.totalPlaylistSeconds)}
              quotaPercent={Math.min(100, Math.round((radioData.totalPlaylistSeconds / 14400) * 100))}
              isShuffle={player.isShuffle}
              setIsShuffle={player.setIsShuffle}
              queueWindow={player.queueWindow}
              jumpToTrack={player.jumpToTrack}
              {...radioData}
            />
          </div>

          <div className={`${mobileTab === 'menu' ? 'block' : 'hidden'} lg:block`}>
            {/* Componente original preservado (descomentar para reactivar Carta de Hoy + carrusel):
                <MenuColumn {...cafeData} />
            */}
            <RadioMenuDelDia todaysLunch={cafeData.todaysLunch} />
          </div>
        </div>
      </div>

      {/* OVERLAY AUTO-START */}
      {player.showAutoStart && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer bg-cream-bg bg-opacity-95 backdrop-blur-sm p-4"
          onClick={handleAutoStart}
        >
          {currentPlay?.station_cover && (
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none grayscale">
              <img src={currentPlay.station_cover} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg border-[4px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none py-10">
            <div className="relative mb-6">
              <div className={`w-28 h-28 border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                activeTab === 'youtube' ? 'bg-red-100 text-red-600' :
                activeTab === 'live' ? 'bg-cyan-100 text-cyan-600' :
                'bg-yellow-100 text-black'
              }`}>
                {activeTab === 'youtube' ? (
                  <Youtube className="w-14 h-14 fill-current" />
                ) : activeTab === 'live' ? (
                  <Globe className="w-14 h-14" />
                ) : (
                  <Radio className="w-14 h-14" />
                )}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-widest text-black leading-tight" style={{ fontFamily: "'First Bunny', sans-serif" }}>
              Proyecto<br/>Café Radio
            </h1>
            
            <div className="mb-6 border-t-[3px] border-b-[3px] border-black py-4 w-full">
              <p className="text-xs font-black uppercase tracking-widest mb-1 text-black/60">
                {activeTab === 'youtube' ? '🔴 Modo Recordado: YouTube' :
                 activeTab === 'live' ? '📻 Modo Recordado: Radios En Vivo' :
                 '📁 Modo Recordado: Files (Biblioteca)'}
              </p>
              <p className="text-lg md:text-xl font-black uppercase text-black truncate">
                {currentTrack?.title || currentPlay?.station_name || (activeTab === 'youtube' ? 'Videos Seleccionados' : activeTab === 'live' ? 'Emisora Online' : 'Música curada para el café')}
              </p>
              {(currentTrack?.artist || currentPlay?.station_artist) && (
                <p className="text-xs mt-1 font-bold text-black/70 uppercase truncate">
                  {currentTrack?.artist || currentPlay?.station_artist}
                </p>
              )}
            </div>
            <button onClick={handleAutoStart}
              className="w-20 h-20 border-[4px] border-black bg-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none mb-6"
            >
              <Play className="w-10 h-10 fill-current ml-1" />
            </button>
            <p className="text-sm font-black uppercase tracking-widest text-black">Toca para iniciar</p>
          </div>
        </div>
      )}

      {/* AUDIO ELEMENT */}
      <audio
        ref={player.audioRef}
        preload="auto"
        referrerPolicy="no-referrer"
        onLoadedMetadata={(e) => {
          player.handleLoadedMetadata?.(e);
          applyLiveSeek(e.target);
        }}
        onTimeUpdate={player.handleTimeUpdate}
        onError={() => {
          const audioEl = player.audioRef?.current;
          if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
          }
          if (isPlaying && currentTrack?.url && activeTab !== 'youtube' && currentTrack?.type !== 'youtube') {
            console.warn(`[ProyectoRadio] Esperando señal válida para "${currentTrack.title}"...`);
            setIsPlaying(false);
          }
        }}
        onEnded={handleAudioEnded}
      />
    </div>
  );
}
