import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Radio,
  Disc,
  Music2,
  ListMusic,
  Users,
  Search,
  RefreshCw,
  Loader2,
  WifiOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Grid,
  List,
  LayoutGrid,
  ExternalLink,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Youtube,
} from 'lucide-react';
import supabase from '../config/supabaseClient';
import { useRadioSync } from '../hooks/useRadioSync';
import {
  extractYoutubeId,
  extractPlaylistId,
  getYoutubeThumbnail,
  fetchYoutubeMetadata,
  YOUTUBE_CATEGORIES,
} from '../utils/youtubeHelpers';
import {
  discoverMediaServer,
  fetchMediaCatalog,
  rebaseCatalogUrls,
  buildStreamUrl,
} from '../services/mediaServerService';
import CoverArt from './radio/CoverArt';

const SETLIST_STORAGE_KEY = 'proyecto_radio_manager_setlist_v2';
const SETLIST_ACTIVE_KEY = 'proyecto_radio_manager_broadcast_active_v2';

function formatTime(secs) {
  if (!secs || isNaN(secs) || !Number.isFinite(secs)) return '0:00';
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (hrs > 0) return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  return `${mins}:${s < 10 ? '0' : ''}${s}`;
}

function formatTotalTime(secs) {
  if (!secs || isNaN(secs)) return '0 min';
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}

export default function RadioManager() {
  // ── 1. PERSONAL MEDIA SERVER STATE ──
  const [serverStatus, setServerStatus] = useState('loading'); // 'loading' | 'online' | 'offline'
  const [serverUrl, setServerUrl] = useState(null);
  const [serverInfo, setServerInfo] = useState({ totalAudio: 0, updatedAt: null });
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);

  const serverUrlRef = useRef(null);
  const tracksRef = useRef([]);
  const albumsRef = useRef([]);

  useEffect(() => { serverUrlRef.current = serverUrl; }, [serverUrl]);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { albumsRef.current = albums; }, [albums]);

  // ── 2. SETLIST (LOCAL, 0ms, SIN SUPABASE playlist_radio) ──
  const [setlist, setSetlist] = useState(() => {
    try {
      const saved = localStorage.getItem(SETLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // ── 3. REPRODUCTOR PERSONAL / CABINA ──
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeatSingle, setIsRepeatSingle] = useState(false);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('proyecto_radio_manager_volume');
      return saved !== null ? parseFloat(saved) : 0.85;
    } catch {
      return 0.85;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const audioRef = useRef(null);
  const recoveryAttemptRef = useRef('');
  const hasAttemptedAutoplayRef = useRef(false);
  const [needsAutoplayUnlock, setNeedsAutoplayUnlock] = useState(false);

  // ── 4. MODO CABINA / SETLIST AL AIRE (CONTROL DE /RADIO) ──
  const [broadcastSetlistActive, setBroadcastSetlistActive] = useState(() => {
    try {
      return localStorage.getItem(SETLIST_ACTIVE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [remoteVolumeLevel, setRemoteVolumeLevel] = useState(0.85);

  const {
    broadcastPlay,
    broadcastStop,
    broadcastVolume,
    broadcastForceReload,
    broadcastTyrannySettings,
    sendRemoteCommand,
    listeners,
    activeListenersCount,
    isSyncing,
  } = useRadioSync({ isManager: true });

  // ── 5. UI STATE ──
  const [libraryTab, setLibraryTab] = useState('albums'); // 'albums' | 'tracks' | 'youtube'
  const [rightTab, setRightTab] = useState('setlist'); // 'setlist' | 'listeners'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumName, setSelectedAlbumName] = useState(null);
  const [albumDisplayMode, setAlbumDisplayMode] = useState('compact'); // 'compact' | 'grid' | 'list'
  const [toast, setToast] = useState(null); // { type: 'ok' | 'err', text: string }

  // ── 5.5 YOUTUBE STATE ──
  const [youtubeSongs, setYoutubeSongs] = useState([]);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [activeYoutube, setActiveYoutube] = useState(null);
  const [ytCategoryFilter, setYtCategoryFilter] = useState('Todos');
  const [newYtUrl, setNewYtUrl] = useState('');
  const [newYtCategory, setNewYtCategory] = useState('Lofi & Chill');
  const [isAddingYt, setIsAddingYt] = useState(false);

  const showToast = useCallback((text, type = 'ok') => {
    setToast({ text, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Persistir setlist en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETLIST_STORAGE_KEY, JSON.stringify(setlist));
    } catch {}
  }, [setlist]);

  // ── 6. DESCUBRIR Y CARGAR PERSONAL MEDIA SERVER ──
  const loadMediaServer = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setServerStatus('loading');

      const discovery = await discoverMediaServer(4000);
      if (!discovery.online || !discovery.baseUrl) {
        setServerUrl(null);
        setServerStatus('offline');
        setServerInfo({
          totalAudio: discovery.config?.totalAudio || 0,
          updatedAt: discovery.config?.updatedAt || null,
        });
        return { online: false, baseUrl: null };
      }

      const catalog = await fetchMediaCatalog(discovery.baseUrl, { groupBy: 'album' });
      setServerUrl(discovery.baseUrl);
      setServerStatus('online');
      setServerInfo({
        totalAudio: catalog.total || catalog.tracks.length,
        updatedAt: discovery.config?.updatedAt || null,
      });
      setTracks(catalog.tracks);
      setAlbums(catalog.albums);

      // Rebasar URLs del setlist guardado y de la pista actual por si cambió el túnel
      setSetlist((prev) => {
        if (!prev || prev.length === 0) return prev;
        return prev.map((t) => {
          const fresh = catalog.tracks.find((c) => String(c.id) === String(t.id));
          if (fresh) return fresh;
          if (t.id) {
            const streamUrl = buildStreamUrl(discovery.baseUrl, t);
            return { ...t, streamUrl, url: streamUrl };
          }
          return t;
        });
      });

      setCurrentTrack((prev) => {
        if (prev) {
          const fresh = catalog.tracks.find((c) => String(c.id) === String(prev.id));
          return fresh || prev;
        }
        return catalog.tracks[0] || null;
      });

      if (!silent) {
        showToast(`Conectado: ${catalog.albums.length} álbumes · ${catalog.tracks.length} pistas`);
      }

      return { online: true, baseUrl: discovery.baseUrl, catalog };
    } catch (err) {
      console.warn('[RadioManager] Error conectando al Personal Media Server:', err);
      setServerStatus('offline');
      if (!silent) {
        showToast('No se pudo conectar con el Personal Media Server', 'err');
      }
      return { online: false, baseUrl: null };
    }
  }, [showToast]);

  const loadYoutubeSongs = useCallback(async () => {
    try {
      setLoadingYoutube(true);
      const { data, error } = await supabase
        .from('playlist_youtube')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;

      const formatted = (data || []).map((item) => {
        const ytUrl = item.url || item.youtube_url || '';
        const ytId = item.youtube_id || extractYoutubeId(ytUrl);
        const listId = item.list_id || extractPlaylistId(ytUrl);
        return {
          ...item,
          youtubeId: ytId,
          listId,
          url: ytUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : ''),
          cover: item.cover || getYoutubeThumbnail(ytId),
          category: item.category || 'Lofi & Chill',
        };
      });
      setYoutubeSongs(formatted);
    } catch (err) {
      console.warn('[RadioManager] Error cargando YouTube:', err);
    } finally {
      setLoadingYoutube(false);
    }
  }, []);

  useEffect(() => {
    loadMediaServer({ silent: false });
    loadYoutubeSongs();
  }, []);

  const handleAddYoutube = async (e) => {
    e.preventDefault();
    const raw = newYtUrl.trim();
    if (!raw) return;
    const ytId = extractYoutubeId(raw);
    if (!ytId) {
      showToast('Enlace de YouTube no válido', 'err');
      return;
    }
    setIsAddingYt(true);
    try {
      const meta = await fetchYoutubeMetadata(raw).catch(() => null);
      const payload = {
        title: meta?.title || 'Video de YouTube',
        artist: meta?.artist || 'YouTube',
        url: raw,
        youtube_id: ytId,
        cover: getYoutubeThumbnail(ytId),
        category: newYtCategory,
        order_index: youtubeSongs.length,
      };
      const { error } = await supabase.from('playlist_youtube').insert([payload]);
      if (error) throw error;
      setNewYtUrl('');
      await loadYoutubeSongs();
      showToast(`🎬 Video "${payload.title}" añadido a YouTube`);
    } catch (err) {
      showToast('Error añadiendo video de YouTube: ' + err.message, 'err');
    } finally {
      setIsAddingYt(false);
    }
  };

  const handleDeleteYoutube = async (id) => {
    try {
      setYoutubeSongs((prev) => prev.filter((y) => String(y.id) !== String(id)));
      const numId = !isNaN(Number(id)) ? Number(id) : id;
      await supabase.from('playlist_youtube').delete().eq('id', numId);
      if (activeYoutube && String(activeYoutube.id) === String(id)) {
        setActiveYoutube(null);
      }
      showToast('Video eliminado de YouTube');
    } catch (err) {
      showToast('Error eliminando video: ' + err.message, 'err');
    }
  };

  const lastBroadcastTabRef = useRef('supabase');

  const handlePlayYoutube = async (ytTrack, broadcastNow = false) => {
    if (!ytTrack?.youtubeId) return;
    // Pausar audio MP3 para evitar doble sonido
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setActiveYoutube(ytTrack);

    if (broadcastNow || broadcastSetlistActive) {
      const ytCover = ytTrack.cover || getYoutubeThumbnail(ytTrack.youtubeId);
      const ytUrl =
        ytTrack.url ||
        (ytTrack.listId
          ? `https://www.youtube.com/watch?v=${ytTrack.youtubeId}&list=${ytTrack.listId}`
          : `https://www.youtube.com/watch?v=${ytTrack.youtubeId}`);

      try {
        lastBroadcastTabRef.current = 'youtube';
        if (broadcastSetlistActive) {
          await broadcastTyrannySettings({
            lockConsoles: true,
            setlistMode: true,
            forcedTab: 'youtube',
            bannerEnabled: false,
          });
        }
        await broadcastPlay(
          {
            id: ytTrack.id,
            title: ytTrack.title,
            artist: ytTrack.artist || 'YouTube',
            cover: ytCover,
            url: ytUrl,
          },
          'youtube',
          true
        );
        await sendRemoteCommand({
          type: 'FORCE_MODE',
          targetClientId: 'all',
          payload: {
            tab: 'youtube',
            id: ytTrack.id,
            youtubeId: ytTrack.youtubeId,
            listId: ytTrack.listId || null,
            url: ytUrl,
            title: ytTrack.title,
            artist: ytTrack.artist || 'YouTube',
            cover: ytCover,
          },
        });
        showToast(`📺 Emitiendo YouTube en /Radio: "${ytTrack.title}"`);
      } catch (e) {
        console.warn('[RadioManager] Error emitiendo YouTube a /Radio:', e);
      }
    }
  };

  // ── 7. EMISIÓN A /RADIO CUANDO SETLIST AL AIRE ESTÁ ACTIVO ──
  const syncTrackToRadioListeners = useCallback(
    async (track, playing = true, seekSec = 0) => {
      if (!broadcastSetlistActive || !track) return;
      try {
        if (lastBroadcastTabRef.current !== 'supabase') {
          lastBroadcastTabRef.current = 'supabase';
          await broadcastTyrannySettings({
            lockConsoles: true,
            setlistMode: true,
            forcedTab: 'supabase',
            bannerEnabled: false,
          });
          await sendRemoteCommand({
            type: 'FORCE_MODE',
            targetClientId: 'all',
            payload: { tab: 'supabase' },
          });
        }
        await broadcastPlay(
          {
            id: track.id,
            title: track.title,
            artist: track.artist || 'Proyecto Café Radio',
            cover: track.coverUrl || track.cover || '',
            url: track.streamUrl || track.url || '',
          },
          'supabase',
          playing
        );
        if (seekSec > 0) {
          await sendRemoteCommand({
            type: 'SEEK_TO',
            targetClientId: 'all',
            payload: { time: seekSec, trackId: track.id },
          });
        }
      } catch (e) {
        console.warn('[RadioManager] Error emitiendo pista a /Radio:', e);
      }
    },
    [broadcastSetlistActive, broadcastPlay, broadcastTyrannySettings, sendRemoteCommand]
  );

  // Activar / Desactivar Modo Setlist al Aire (bloquea o libera /Radio)
  const toggleBroadcastSetlist = async () => {
    const nextActive = !broadcastSetlistActive;
    setBroadcastSetlistActive(nextActive);
    try {
      localStorage.setItem(SETLIST_ACTIVE_KEY, String(nextActive));
    } catch {}

    try {
      const targetTab = nextActive && activeYoutube?.youtubeId ? 'youtube' : 'supabase';
      lastBroadcastTabRef.current = targetTab;

      await broadcastTyrannySettings({
        lockConsoles: nextActive,
        setlistMode: nextActive,
        forcedTab: targetTab,
        bannerEnabled: false,
      });

      if (nextActive) {
        if (activeYoutube?.youtubeId) {
          const ytCover = activeYoutube.cover || getYoutubeThumbnail(activeYoutube.youtubeId);
          const ytUrl =
            activeYoutube.url ||
            (activeYoutube.listId
              ? `https://www.youtube.com/watch?v=${activeYoutube.youtubeId}&list=${activeYoutube.listId}`
              : `https://www.youtube.com/watch?v=${activeYoutube.youtubeId}`);
          await broadcastPlay(
            {
              id: activeYoutube.id,
              title: activeYoutube.title,
              artist: activeYoutube.artist || 'YouTube',
              cover: ytCover,
              url: ytUrl,
            },
            'youtube',
            true
          );
          await sendRemoteCommand({
            type: 'FORCE_MODE',
            targetClientId: 'all',
            payload: {
              tab: 'youtube',
              id: activeYoutube.id,
              youtubeId: activeYoutube.youtubeId,
              listId: activeYoutube.listId || null,
              url: ytUrl,
              title: activeYoutube.title,
              artist: activeYoutube.artist || 'YouTube',
              cover: ytCover,
            },
          });
        } else {
          const trackToAir = currentTrack || setlist[0] || tracks[0];
          if (trackToAir) {
            await broadcastPlay(
              {
                id: trackToAir.id,
                title: trackToAir.title,
                artist: trackToAir.artist || 'Proyecto Café Radio',
                cover: trackToAir.coverUrl || trackToAir.cover || '',
                url: trackToAir.streamUrl || trackToAir.url || '',
              },
              'supabase',
              isPlaying
            );
          }
        }
        showToast('🔴 Setlist al Aire ACTIVADO: /Radio ahora sigue tu cabina y no puede cambiar música.');
      } else {
        showToast('🟢 Modo Personal: /Radio liberado para que cada oyente elija su música.');
      }
    } catch (err) {
      showToast('Error actualizando estado de cabina: ' + err.message, 'err');
    }
  };

  // ── 8. CONTROLES DE REPRODUCCIÓN (PERSONAL + CABINA) ──
  const activePlayQueue = useMemo(() => {
    return setlist.length > 0 ? setlist : tracks;
  }, [setlist, tracks]);

  const playTrack = useCallback(
    (track) => {
      if (!track) return;
      recoveryAttemptRef.current = '';
      setActiveYoutube(null);
      setCurrentTrack(track);
      setCurrentTime(0);
      setProgress(0);
      setDuration(Number(track.duration) || 0);
      setIsPlaying(true);

      if (broadcastSetlistActive) {
        syncTrackToRadioListeners(track, true, 0);
      }
    },
    [broadcastSetlistActive, syncTrackToRadioListeners]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      const first = activePlayQueue[0];
      if (first) playTrack(first);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (broadcastSetlistActive) {
        broadcastStop();
      }
    } else {
      audio.volume = isMuted ? 0 : volume;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          if (broadcastSetlistActive) {
            syncTrackToRadioListeners(currentTrack, true, audio.currentTime || 0);
          }
        })
        .catch(() => {});
    }
  }, [
    currentTrack,
    activePlayQueue,
    playTrack,
    isPlaying,
    isMuted,
    volume,
    broadcastSetlistActive,
    broadcastStop,
    syncTrackToRadioListeners,
  ]);

  const nextTrack = useCallback(() => {
    if (activePlayQueue.length === 0) return;
    const curIdx = currentTrack
      ? activePlayQueue.findIndex((t) => String(t.id) === String(currentTrack.id))
      : -1;

    let nextIdx;
    if (isShuffle && activePlayQueue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * activePlayQueue.length);
      } while (nextIdx === curIdx);
    } else {
      nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % activePlayQueue.length;
    }

    playTrack(activePlayQueue[nextIdx]);
  }, [activePlayQueue, currentTrack, isShuffle, playTrack]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      if (broadcastSetlistActive && currentTrack) {
        sendRemoteCommand({
          type: 'SEEK_TO',
          targetClientId: 'all',
          payload: { time: 0, trackId: currentTrack.id },
        });
      }
      return;
    }

    if (activePlayQueue.length === 0) return;
    const curIdx = currentTrack
      ? activePlayQueue.findIndex((t) => String(t.id) === String(currentTrack.id))
      : 0;
    const prevIdx = (curIdx - 1 + activePlayQueue.length) % activePlayQueue.length;
    playTrack(activePlayQueue[prevIdx]);
  }, [activePlayQueue, currentTrack, playTrack, broadcastSetlistActive, sendRemoteCommand]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const effDur = (audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration) || 0;
    if (!audio || !effDur) return;

    const pct = Math.min(100, Math.max(0, parseFloat(e.target.value)));
    const newTime = (pct / 100) * effDur;
    try {
      audio.currentTime = newTime;
    } catch {}
    setCurrentTime(newTime);
    setProgress(pct);

    if (broadcastSetlistActive && currentTrack) {
      sendRemoteCommand({
        type: 'SEEK_TO',
        targetClientId: 'all',
        payload: { time: newTime, trackId: currentTrack.id },
      });
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
    try {
      localStorage.setItem('proyecto_radio_manager_volume', String(val));
    } catch {}
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume || 0.85;
    }
  };

  // Sincronizar <audio> con currentTrack e isPlaying
  const activeAudioSrc =
    serverStatus === 'online' ? currentTrack?.streamUrl || currentTrack?.url || undefined : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;

    if (!activeAudioSrc) {
      if (!audio.paused) audio.pause();
      return;
    }

    if (isPlaying) {
      audio.play().catch((err) => {
        if (err?.name !== 'AbortError') {
          setIsPlaying(false);
        }
      });
    } else if (!audio.paused) {
      audio.pause();
    }
  }, [activeAudioSrc, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Autoplay automático al iniciar RadioManager (con desbloqueo al primer toque si el navegador lo bloquea)
  useEffect(() => {
    if (hasAttemptedAutoplayRef.current) return;
    if (serverStatus !== 'online' || !activeAudioSrc || activeYoutube) return;

    const audio = audioRef.current;
    if (!audio) return;

    hasAttemptedAutoplayRef.current = true;
    audio.volume = isMuted ? 0 : volume;

    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        setIsPlaying(true);
        setNeedsAutoplayUnlock(false);
      }).catch((err) => {
        if (err?.name === 'AbortError') return;
        setNeedsAutoplayUnlock(true);
      });
    }
  }, [serverStatus, activeAudioSrc, activeYoutube, isMuted, volume]);

  useEffect(() => {
    if (!needsAutoplayUnlock) return;

    const unlockAndPlay = () => {
      const audio = audioRef.current;
      if (!audio || !activeAudioSrc || activeYoutube) return;
      audio.volume = isMuted ? 0 : volume;
      audio
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
  }, [needsAutoplayUnlock, activeAudioSrc, activeYoutube, isMuted, volume]);

  // Auto-recuperación si el túnel de Cloudflare cambia durante la reproducción
  const handleAudioError = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.id) return;
    if (!audio.paused && (audio.currentTime > 0 || audio.readyState >= 2)) return;

    const attemptKey = `${currentTrack.id}__${serverUrlRef.current || 'none'}`;
    if (recoveryAttemptRef.current === attemptKey || isRecovering) {
      setIsPlaying(false);
      showToast(`No se pudo reproducir "${currentTrack.title}"`, 'err');
      return;
    }

    recoveryAttemptRef.current = attemptKey;
    const savedTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const shouldResume = isPlaying;

    setIsRecovering(true);
    const discovery = await discoverMediaServer(4000);
    setIsRecovering(false);

    if (discovery.online && discovery.baseUrl) {
      const rebased = rebaseCatalogUrls(tracksRef.current, albumsRef.current, discovery.baseUrl);
      setServerUrl(discovery.baseUrl);
      setServerStatus('online');
      setTracks(rebased.tracks);
      setAlbums(rebased.albums);

      const freshUrl = buildStreamUrl(discovery.baseUrl, currentTrack);
      recoveryAttemptRef.current = `${currentTrack.id}__${discovery.baseUrl}`;

      const resumeAtTime = () => {
        if (savedTime > 1 && Number.isFinite(audio.duration) && savedTime < audio.duration - 1) {
          try { audio.currentTime = savedTime; } catch {}
        }
        if (shouldResume) audio.play().catch(() => {});
      };

      audio.src = freshUrl;
      audio.load();
      if (audio.readyState >= 1) resumeAtTime();
      else audio.addEventListener('loadedmetadata', resumeAtTime, { once: true });
      return;
    }

    setServerStatus('offline');
    setIsPlaying(false);
    showToast('Servidor de música fuera de línea', 'err');
  };

  // ── 9. OPERACIONES DEL SETLIST (0ms, SIN ERRORES DE BD) ──
  const addTrackToSetlist = (track) => {
    if (!track) return;
    setSetlist((prev) => {
      if (prev.some((t) => String(t.id) === String(track.id))) {
        showToast(`"${track.title}" ya está en el Setlist`);
        return prev;
      }
      showToast(`➕ "${track.title}" añadida al Setlist`);
      return [...prev, track];
    });
  };

  const addAlbumToSetlist = (album, playImmediately = false) => {
    if (!album?.tracks?.length) return;
    if (playImmediately) {
      setSetlist(album.tracks);
      playTrack(album.tracks[0]);
      showToast(`▶ Álbum "${album.name}" cargado al Setlist (${album.tracks.length} pistas)`);
      return;
    }
    setSetlist((prev) => {
      const existing = new Set(prev.map((t) => String(t.id)));
      const toAdd = album.tracks.filter((t) => !existing.has(String(t.id)));
      showToast(`➕ ${toAdd.length} pistas de "${album.name}" añadidas al Setlist`);
      return [...prev, ...toAdd];
    });
  };

  const generateRandomSetlist = (count = 15) => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));
    setSetlist(picked);
    playTrack(picked[0]);
    showToast(`🔀 Mix aleatorio de ${picked.length} pistas cargado al Setlist`);
  };

  const moveSetlistItem = (index, dir) => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= setlist.length) return;
    setSetlist((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const removeSetlistItem = (id) => {
    setSetlist((prev) => prev.filter((t) => String(t.id) !== String(id)));
  };

  const clearSetlist = () => {
    setSetlist([]);
    showToast('Setlist vaciado');
  };

  // ── 10. FILTROS DE BIBLIOTECA ──
  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    const q = searchQuery.toLowerCase().trim();
    return albums.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.artist || '').toLowerCase().includes(q) ||
        (a.tracks || []).some((t) => (t.title || '').toLowerCase().includes(q))
    );
  }, [albums, searchQuery]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter(
      (t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.artist || '').toLowerCase().includes(q) ||
        (t.album || '').toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  const selectedAlbum = useMemo(
    () => (selectedAlbumName ? albums.find((a) => a.name === selectedAlbumName) || null : null),
    [albums, selectedAlbumName]
  );

  const filteredYoutube = useMemo(() => {
    return youtubeSongs.filter((y) => {
      if (ytCategoryFilter !== 'Todos' && y.category !== ytCategoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (y.title || '').toLowerCase().includes(q) ||
        (y.artist || '').toLowerCase().includes(q) ||
        (y.category || '').toLowerCase().includes(q)
      );
    });
  }, [youtubeSongs, ytCategoryFilter, searchQuery]);

  const setlistTotalDuration = useMemo(
    () => setlist.reduce((acc, t) => acc + (Number(t.duration) || 0), 0),
    [setlist]
  );

  const isTrackActive = (track) =>
    Boolean(track && currentTrack && String(track.id) === String(currentTrack.id));

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white font-sans pb-10">
      {/* HEADER COMPACTO */}
      <header className="sticky top-0 z-30 bg-[#12131C]/95 backdrop-blur border-b-2 border-slate-700 px-3 lg:px-5 py-2.5">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Izquierda: Identidad + Estado Personal Media Server */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 border-2 border-[#1DB954] bg-[#181926] flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-[#1DB954]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wider truncate">
                  Radio Manager
                </h1>
                {serverStatus === 'online' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1DB954]/20 border border-[#1DB954] text-[#1DB954] text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                    Server ON · {tracks.length} pistas
                  </span>
                ) : serverStatus === 'loading' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-black uppercase">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Conectando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500 text-red-400 text-[10px] font-black uppercase">
                    <WifiOff className="w-3 h-3" />
                    Server OFF
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold truncate">
                Personal Media Server · Reproductor personal y control de cabina /Radio
              </p>
            </div>
          </div>

          {/* Derecha: Switch Setlist al Aire + Oyentes + Abrir /Radio + Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleBroadcastSetlist}
              className={`px-3 py-1.5 border-2 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                broadcastSetlistActive
                  ? 'bg-red-600 hover:bg-red-500 border-red-300 text-white'
                  : 'bg-[#181926] hover:bg-slate-800 border-slate-600 text-slate-200'
              }`}
              title={
                broadcastSetlistActive
                  ? 'Setlist al Aire ACTIVO: /Radio está bloqueado a tu emisión'
                  : 'Activar para controlar /Radio y quitar permiso de cambio a los oyentes'
              }
            >
              {broadcastSetlistActive ? (
                <>
                  <Lock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Setlist al Aire: ON</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-[#1DB954]" />
                  <span>Modo Personal (/Radio libre)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setRightTab(rightTab === 'listeners' ? 'setlist' : 'listeners')}
              className={`px-2.5 py-1.5 border-2 text-xs font-black uppercase flex items-center gap-1.5 transition ${
                rightTab === 'listeners'
                  ? 'bg-yellow-400 text-black border-black'
                  : 'bg-[#181926] hover:bg-slate-800 border-slate-600 text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Oyentes ({activeListenersCount})</span>
            </button>

            <a
              href="/Radio"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 border-2 border-slate-600 bg-[#181926] hover:bg-slate-800 text-xs font-black uppercase flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#1DB954]" />
              <span className="hidden sm:inline">/Radio</span>
            </a>

            <button
              onClick={() => loadMediaServer({ silent: false })}
              title="Recargar catálogo"
              className="p-1.5 border-2 border-slate-600 bg-[#181926] hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${serverStatus === 'loading' ? 'animate-spin text-[#1DB954]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1680px] mx-auto px-3 lg:px-5 pt-3 space-y-3">
        {/* Toast feedback */}
        {toast && (
          <div
            className={`px-3 py-2 border-2 text-xs font-black flex items-center justify-between gap-2 ${
              toast.type === 'err'
                ? 'bg-red-950/90 border-red-500 text-red-200'
                : 'bg-emerald-950/90 border-[#1DB954] text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === 'err' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1DB954]" />
              )}
              <span className="truncate">{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Banner de desbloqueo de autoplay si el navegador bloqueó el inicio */}
        {needsAutoplayUnlock && !isPlaying && serverStatus === 'online' && !activeYoutube && (
          <button
            onClick={() => {
              const audio = audioRef.current;
              if (audio) {
                audio.volume = isMuted ? 0 : volume;
                audio.play().then(() => {
                  setIsPlaying(true);
                  setNeedsAutoplayUnlock(false);
                }).catch(() => {});
              }
            }}
            className="w-full py-2 px-3 border-2 border-black bg-[#1DB954] hover:bg-[#1ed760] text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 animate-pulse transition"
          >
            <span>🔊 Toca aquí o en cualquier parte para activar la música</span>
          </button>
        )}

        {/* REPRODUCTOR PRINCIPAL (ESTILO SPOTIFY COMPACTO) */}
        <section className="border-2 border-slate-700 bg-[#14151f] shadow-[4px_4px_0px_0px_rgba(29,185,84,0.25)] p-3 flex flex-col gap-2.5">
          {serverStatus === 'offline' ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded border border-red-500/40 bg-red-950/50 flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase">Radio fuera de línea</h2>
                  <p className="text-xs text-slate-400">
                    El Personal Media Server no está respondiendo. Verifica el túnel de Cloudflare.
                  </p>
                </div>
              </div>
              <button
                onClick={() => loadMediaServer({ silent: false })}
                className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs uppercase flex items-center gap-1.5 border-2 border-black"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden shrink-0 border-2 border-white/15 bg-neutral-900">
                  <CoverArt
                    src={currentTrack?.coverUrl || currentTrack?.cover}
                    alt={currentTrack?.title || 'Radio Manager'}
                    iconClassName="w-6 h-6 text-neutral-500"
                  />
                  {isPlaying && (
                    <div className="absolute bottom-1 left-1 px-1 bg-black/75 rounded-sm flex items-end gap-[2px] h-3.5">
                      <span className="w-0.5 bg-[#1DB954] animate-eq-1 h-2" />
                      <span className="w-0.5 bg-[#1DB954] animate-eq-2 h-3" />
                      <span className="w-0.5 bg-[#1DB954] animate-eq-3 h-1.5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    {broadcastSetlistActive ? (
                      <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                        🔴 Emitiendo a /Radio
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-[#1DB954] text-black text-[9px] font-black uppercase tracking-wider">
                        Escucha Personal
                      </span>
                    )}
                    {isRecovering && (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[9px] font-black uppercase">
                        Reconectando túnel...
                      </span>
                    )}
                    {currentTrack?.album && (
                      <span className="text-[10px] font-bold text-yellow-300 bg-white/10 px-1.5 truncate max-w-[200px]">
                        {currentTrack.album}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-black uppercase truncate">
                    {currentTrack?.title || 'Selecciona una canción o álbum'}
                  </h2>
                  <p className="text-xs text-slate-300 font-semibold truncate">
                    {currentTrack?.artist || 'Personal Media Server'}
                  </p>
                </div>

                {broadcastSetlistActive && currentTrack && (
                  <button
                    onClick={() => syncTrackToRadioListeners(currentTrack, isPlaying, currentTime)}
                    disabled={isSyncing}
                    title="Forzar sincronización inmediata a todos los oyentes de /Radio"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-red-400/60 bg-red-950/60 hover:bg-red-900/60 text-red-200 text-[10px] font-black uppercase shrink-0"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Sincronizar /Radio</span>
                  </button>
                )}
              </div>

              {/* Barra de Progreso / Seek */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 w-9 text-right shrink-0">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={Number.isFinite(progress) ? progress : 0}
                  onChange={handleSeek}
                  disabled={!currentTrack}
                  className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1DB954] disabled:opacity-40"
                />
                <span className="text-[10px] font-mono text-slate-400 w-9 shrink-0">
                  {formatTime(duration || currentTrack?.duration || 0)}
                </span>
              </div>

              {/* Controles de Transporte + Volumen */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    title="Aleatorio"
                    className={`p-1.5 rounded border transition ${
                      isShuffle
                        ? 'bg-yellow-400 text-black border-yellow-400'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={prevTrack}
                    disabled={activePlayQueue.length === 0}
                    title="Anterior"
                    className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white border border-white/10 disabled:opacity-40"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={activePlayQueue.length === 0}
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                    className="w-9 h-9 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow disabled:opacity-40"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={nextTrack}
                    disabled={activePlayQueue.length === 0}
                    title="Siguiente"
                    className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white border border-white/10 disabled:opacity-40"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsRepeatSingle(!isRepeatSingle)}
                    title="Repetir pista"
                    className={`p-1.5 rounded border transition ${
                      isRepeatSingle
                        ? 'bg-yellow-400 text-black border-yellow-400'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Volumen */}
                <div className="flex items-center gap-2 flex-1 max-w-[200px] bg-black/40 px-2.5 py-1 rounded border border-white/10">
                  <button onClick={toggleMute} className="text-slate-300 hover:text-white shrink-0">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#1DB954]" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* GRID PRINCIPAL: BIBLIOTECA (IZQ) + SETLIST / OYENTES (DER) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* COLUMNA IZQUIERDA (7 cols): BIBLIOTECA DEL PERSONAL MEDIA SERVER */}
          <section className="lg:col-span-7 border-2 border-slate-700 bg-[#12131C] p-3">
            {/* Tabs + Buscador */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={() => setLibraryTab('albums')}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-black uppercase border-2 flex items-center justify-center gap-1.5 transition ${
                    libraryTab === 'albums'
                      ? 'bg-[#1DB954] text-black border-[#1DB954]'
                      : 'bg-[#181926] text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>Álbumes ({filteredAlbums.length})</span>
                </button>
                <button
                  onClick={() => {
                    setLibraryTab('tracks');
                    setSelectedAlbumName(null);
                  }}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-black uppercase border-2 flex items-center justify-center gap-1.5 transition ${
                    libraryTab === 'tracks'
                      ? 'bg-[#1DB954] text-black border-[#1DB954]'
                      : 'bg-[#181926] text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>Pistas ({filteredTracks.length})</span>
                </button>
                <button
                  onClick={() => {
                    setLibraryTab('youtube');
                    setSelectedAlbumName(null);
                  }}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-black uppercase border-2 flex items-center justify-center gap-1.5 transition ${
                    libraryTab === 'youtube'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-[#181926] text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <span>YouTube ({youtubeSongs.length})</span>
                </button>
              </div>

              <div className="relative flex-1 sm:max-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar álbum, artista o pista..."
                  className="w-full pl-8 pr-6 py-1.5 border-2 border-slate-700 bg-[#0d0e15] text-white text-xs font-bold placeholder-slate-500 outline-none focus:border-[#1DB954]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {libraryTab === 'youtube' ? (
              <div className="space-y-3">
                {/* Reproductor embebido 16:9 cuando hay video seleccionado */}
                {activeYoutube?.youtubeId && (
                  <div className="border border-red-600/60 bg-black overflow-hidden">
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${activeYoutube.youtubeId}?autoplay=1&rel=0${
                          activeYoutube.listId ? `&list=${activeYoutube.listId}` : ''
                        }`}
                        title={activeYoutube.title}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <div className="px-2.5 py-1.5 bg-[#181926] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{activeYoutube.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{activeYoutube.artist}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handlePlayYoutube(activeYoutube, true)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase flex items-center gap-1"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Emitir a /Radio</span>
                        </button>
                        <button
                          onClick={() => setActiveYoutube(null)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Cerrar video"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulario rápido para añadir enlace de YouTube */}
                <form onSubmit={handleAddYoutube} className="flex flex-col sm:flex-row gap-1.5">
                  <input
                    type="text"
                    value={newYtUrl}
                    onChange={(e) => setNewYtUrl(e.target.value)}
                    placeholder="Pegar URL de YouTube (video o playlist)..."
                    className="flex-1 px-2.5 py-1.5 border border-slate-700 bg-[#0d0e15] text-white text-xs font-bold placeholder-slate-500 outline-none focus:border-red-500"
                  />
                  <select
                    value={newYtCategory}
                    onChange={(e) => setNewYtCategory(e.target.value)}
                    className="px-2 py-1.5 border border-slate-700 bg-[#0d0e15] text-white text-xs font-bold outline-none"
                  >
                    {YOUTUBE_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isAddingYt || !newYtUrl.trim()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    {isAddingYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Añadir</span>
                  </button>
                </form>

                {/* Filtros de categoría */}
                <div className="flex flex-wrap gap-1">
                  {YOUTUBE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setYtCategoryFilter(cat)}
                      className={`px-2 py-0.5 text-[10px] font-black uppercase border transition ${
                        ytCategoryFilter === cat
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-[#181926] text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Lista de videos */}
                {loadingYoutube ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  </div>
                ) : filteredYoutube.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-700">
                    No hay videos de YouTube en esta categoría.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-slate-700 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {filteredYoutube.map((yt) => {
                      const isCurrentYt = activeYoutube && String(activeYoutube.id) === String(yt.id);
                      return (
                        <div
                          key={yt.id}
                          onClick={() => handlePlayYoutube(yt, false)}
                          className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer transition ${
                            isCurrentYt ? 'bg-red-600/20' : 'bg-[#181926] hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-10 h-7 rounded-sm overflow-hidden bg-black shrink-0">
                              <img src={yt.cover} alt={yt.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isCurrentYt ? 'text-red-400' : 'text-white'}`}>
                                {yt.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {yt.artist} · {yt.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayYoutube(yt, true);
                              }}
                              title="Emitir este video en /Radio"
                              className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white text-[9px] font-black uppercase flex items-center gap-1"
                            >
                              <Radio className="w-3 h-3" />
                              <span className="hidden sm:inline">/Radio</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteYoutube(yt.id);
                              }}
                              title="Eliminar"
                              className="p-1 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : serverStatus === 'loading' ? (
              <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-[#1DB954]" />
                <p className="text-xs font-black uppercase">Cargando biblioteca...</p>
              </div>
            ) : serverStatus === 'offline' ? (
              <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                <WifiOff className="w-8 h-8 text-red-400" />
                <p className="text-xs font-black uppercase text-white">Servidor fuera de línea</p>
              </div>
            ) : libraryTab === 'albums' && !selectedAlbum ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Biblioteca de Álbumes
                  </span>
                  <div className="flex items-center gap-0.5 bg-[#181926] p-0.5 border border-slate-700 rounded">
                    {[
                      { id: 'compact', icon: LayoutGrid, title: 'Compacto' },
                      { id: 'grid', icon: Grid, title: 'Mediano' },
                      { id: 'list', icon: List, title: 'Lista' },
                    ].map(({ id, icon: Icon, title }) => (
                      <button
                        key={id}
                        onClick={() => setAlbumDisplayMode(id)}
                        title={title}
                        className={`p-1 rounded-sm transition ${
                          albumDisplayMode === id
                            ? 'bg-[#1DB954] text-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {albumDisplayMode !== 'list' ? (
                  <div
                    className={`grid gap-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1 ${
                      albumDisplayMode === 'compact'
                        ? 'grid-cols-[repeat(auto-fill,minmax(105px,1fr))]'
                        : 'grid-cols-[repeat(auto-fill,minmax(140px,1fr))]'
                    }`}
                  >
                    {filteredAlbums.map((album) => {
                      const activeInAlbum = (album.tracks || []).some((t) => isTrackActive(t));
                      return (
                        <div
                          key={album.name}
                          onClick={() => setSelectedAlbumName(album.name)}
                          className={`group relative cursor-pointer rounded p-1.5 border transition select-none ${
                            activeInAlbum
                              ? 'bg-[#1DB954]/15 border-[#1DB954]'
                              : 'bg-[#181926] hover:bg-[#222436] border-white/5'
                          }`}
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded bg-neutral-900 mb-1.5">
                            <CoverArt
                              src={album.coverUrl || album.cover}
                              alt={album.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              iconClassName="w-7 h-7 text-slate-600"
                            />
                            <div className="absolute top-1 right-1 px-1 bg-black/75 text-[9px] font-mono font-bold rounded-sm">
                              {album.trackCount}
                            </div>
                            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addAlbumToSetlist(album, false);
                                }}
                                title="Añadir álbum al Setlist"
                                className="w-6 h-6 rounded-full bg-black/85 hover:bg-black text-white border border-white/30 flex items-center justify-center"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addAlbumToSetlist(album, true);
                                }}
                                title="Reproducir álbum"
                                className="w-7 h-7 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow"
                              >
                                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                              </button>
                            </div>
                          </div>
                          <p className="font-bold text-[11px] truncate" title={album.name}>
                            {album.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate" title={album.artist}>
                            {album.artist}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-slate-700 max-h-[520px] overflow-y-auto custom-scrollbar">
                    {filteredAlbums.map((album) => (
                      <div
                        key={album.name}
                        onClick={() => setSelectedAlbumName(album.name)}
                        className="group flex items-center gap-2.5 px-2.5 py-1.5 bg-[#181926] hover:bg-white/5 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-sm overflow-hidden bg-neutral-900 shrink-0">
                          <CoverArt src={album.coverUrl || album.cover} alt={album.name} iconClassName="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate">{album.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{album.artist}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {album.trackCount} pistas · {formatTotalTime(album.totalDuration)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addAlbumToSetlist(album, false);
                            }}
                            title="Añadir al Setlist"
                            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addAlbumToSetlist(album, true);
                            }}
                            title="Reproducir álbum"
                            className="p-1.5 rounded bg-[#1DB954] text-black"
                          >
                            <Play className="w-3 h-3 fill-black" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : libraryTab === 'albums' && selectedAlbum ? (
              <div>
                <button
                  onClick={() => setSelectedAlbumName(null)}
                  className="inline-flex items-center gap-1 mb-2 text-xs font-black uppercase text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Álbumes</span>
                </button>

                <div className="p-3 bg-[#181926] border border-slate-700 flex flex-wrap items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded overflow-hidden bg-neutral-900 shrink-0">
                      <CoverArt src={selectedAlbum.coverUrl || selectedAlbum.cover} alt={selectedAlbum.name} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase text-[#1DB954]">
                        Álbum · {selectedAlbum.trackCount} pistas · {formatTotalTime(selectedAlbum.totalDuration)}
                      </span>
                      <h3 className="font-black text-sm truncate">{selectedAlbum.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{selectedAlbum.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => addAlbumToSetlist(selectedAlbum, false)}
                      className="px-2.5 py-1.5 border border-slate-600 bg-white/10 hover:bg-white/20 text-xs font-black uppercase flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Al Setlist</span>
                    </button>
                    <button
                      onClick={() => addAlbumToSetlist(selectedAlbum, true)}
                      className="px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-black uppercase flex items-center gap-1 rounded-full"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Reproducir</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-white/5 border border-slate-700 max-h-[420px] overflow-y-auto custom-scrollbar">
                  {(selectedAlbum.tracks || []).map((track, idx) => {
                    const active = isTrackActive(track);
                    return (
                      <div
                        key={track.id || idx}
                        onClick={() => playTrack(track)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 cursor-pointer transition ${
                          active ? 'bg-[#1DB954]/15' : 'bg-[#181926] hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 text-center font-mono text-[11px] text-slate-400 shrink-0">
                            {active && isPlaying ? (
                              <Pause className="w-3 h-3 text-[#1DB954] mx-auto" />
                            ) : (
                              track.trackNumber || idx + 1
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${active ? 'text-[#1DB954]' : 'text-white'}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatTime(track.duration)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addTrackToSetlist(track);
                            }}
                            title="Añadir al Setlist"
                            className="p-1 rounded bg-white/10 hover:bg-[#1DB954] hover:text-black transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TODAS LAS PISTAS */
              <div className="divide-y divide-white/5 border border-slate-700 max-h-[520px] overflow-y-auto custom-scrollbar">
                {filteredTracks.map((track, idx) => {
                  const active = isTrackActive(track);
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => playTrack(track)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 cursor-pointer transition ${
                        active ? 'bg-[#1DB954]/15' : 'bg-[#181926] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-sm overflow-hidden bg-neutral-900 shrink-0">
                          <CoverArt src={track.coverUrl || track.cover} alt={track.title} iconClassName="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${active ? 'text-[#1DB954]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {track.artist} {track.album ? `· ${track.album}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono text-[10px] text-slate-400">
                          {formatTime(track.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addTrackToSetlist(track);
                          }}
                          title="Añadir al Setlist"
                          className="p-1 rounded bg-white/10 hover:bg-[#1DB954] hover:text-black transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* COLUMNA DERECHA (5 cols): SETLIST & OYENTES /RADIO */}
          <section className="lg:col-span-5 border-2 border-slate-700 bg-[#12131C] p-3">
            {/* Tabs Derecha */}
            <div className="flex items-center gap-1.5 mb-3">
              <button
                onClick={() => setRightTab('setlist')}
                className={`flex-1 py-1.5 px-2.5 text-xs font-black uppercase border-2 flex items-center justify-center gap-1.5 transition ${
                  rightTab === 'setlist'
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-[#181926] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Setlist ({setlist.length})</span>
              </button>
              <button
                onClick={() => setRightTab('listeners')}
                className={`flex-1 py-1.5 px-2.5 text-xs font-black uppercase border-2 flex items-center justify-center gap-1.5 transition ${
                  rightTab === 'listeners'
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-[#181926] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Oyentes /Radio ({activeListenersCount})</span>
              </button>
            </div>

            {rightTab === 'setlist' ? (
              <div className="space-y-2.5">
                {/* Banner estado del Setlist */}
                <div
                  className={`p-2.5 border text-xs flex items-center justify-between gap-2 ${
                    broadcastSetlistActive
                      ? 'bg-red-950/50 border-red-500/60 text-red-200'
                      : 'bg-[#181926] border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-black uppercase text-[11px]">
                      {broadcastSetlistActive
                        ? '🔴 Setlist al Aire Activo (/Radio bloqueado)'
                        : '🎧 Setlist Personal (/Radio independiente)'}
                    </p>
                    <p className="text-[10px] opacity-80">
                      {setlist.length > 0
                        ? `${setlist.length} pistas · ${formatTotalTime(setlistTotalDuration)}`
                        : 'Vacío: se reproduce la biblioteca completa.'}
                    </p>
                  </div>
                  <button
                    onClick={toggleBroadcastSetlist}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase border shrink-0 ${
                      broadcastSetlistActive
                        ? 'bg-red-600 text-white border-red-300'
                        : 'bg-[#1DB954] text-black border-black'
                    }`}
                  >
                    {broadcastSetlistActive ? 'Liberar /Radio' : 'Activar Cabina'}
                  </button>
                </div>

                {/* Acciones rápidas del Setlist */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => generateRandomSetlist(15)}
                    disabled={tracks.length === 0}
                    className="px-2.5 py-1 bg-[#181926] hover:bg-slate-800 border border-slate-600 text-[10px] font-black uppercase flex items-center gap-1 disabled:opacity-40"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Mix 15</span>
                  </button>
                  <button
                    onClick={() => generateRandomSetlist(30)}
                    disabled={tracks.length === 0}
                    className="px-2.5 py-1 bg-[#181926] hover:bg-slate-800 border border-slate-600 text-[10px] font-black uppercase flex items-center gap-1 disabled:opacity-40"
                  >
                    <Shuffle className="w-3 h-3 text-[#1DB954]" />
                    <span>Mix 30</span>
                  </button>
                  {setlist.length > 0 && (
                    <button
                      onClick={clearSetlist}
                      className="ml-auto px-2.5 py-1 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>

                {/* Lista del Setlist */}
                {setlist.length === 0 ? (
                  <div className="py-10 px-4 text-center border border-dashed border-slate-700 bg-[#181926]/50">
                    <ListMusic className="w-7 h-7 mx-auto text-slate-500 mb-1.5" />
                    <p className="text-xs font-black uppercase">Tu Setlist está vacío</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Usa el botón <strong>+</strong> en cualquier álbum o canción, o genera un Mix aleatorio.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-slate-700 max-h-[440px] overflow-y-auto custom-scrollbar">
                    {setlist.map((track, idx) => {
                      const active = isTrackActive(track);
                      return (
                        <div
                          key={`${track.id}-${idx}`}
                          onClick={() => playTrack(track)}
                          className={`group flex items-center gap-2 px-2 py-1.5 cursor-pointer transition ${
                            active ? 'bg-[#1DB954]/15' : 'bg-[#181926] hover:bg-white/5'
                          }`}
                        >
                          <span className="w-4 text-center font-mono text-[10px] text-slate-400 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-7 h-7 rounded-sm overflow-hidden bg-neutral-900 shrink-0">
                            <CoverArt src={track.coverUrl || track.cover} alt={track.title} iconClassName="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${active ? 'text-[#1DB954]' : 'text-white'}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSetlistItem(idx, 'up');
                              }}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-25"
                              title="Subir"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSetlistItem(idx, 'down');
                              }}
                              disabled={idx === setlist.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-25"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSetlistItem(track.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-400"
                              title="Quitar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* PANEL DE CONTROL DE OYENTES /RADIO */
              <div className="space-y-3">
                {/* Controles globales para todos los oyentes */}
                <div className="p-2.5 bg-[#181926] border border-slate-700 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                    Comandos Globales para /Radio ({activeListenersCount})
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        sendRemoteCommand({ type: 'PLAY', targetClientId: 'all' });
                        showToast('▶ Play enviado a todos los oyentes');
                      }}
                      className="py-1.5 px-2 bg-[#1DB954] hover:bg-[#1ed760] text-black text-[11px] font-black uppercase flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Play Todos</span>
                    </button>
                    <button
                      onClick={() => {
                        sendRemoteCommand({ type: 'PAUSE', targetClientId: 'all' });
                        showToast('⏸ Pausa enviada a todos los oyentes');
                      }}
                      className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-black uppercase flex items-center justify-center gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pausar Todos</span>
                    </button>
                    <button
                      onClick={() => {
                        if (currentTrack) {
                          syncTrackToRadioListeners(currentTrack, isPlaying, currentTime);
                          showToast(`📡 "${currentTrack.title}" enviada a /Radio`);
                        }
                      }}
                      disabled={!currentTrack}
                      className="py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Radio className="w-3 h-3 text-[#1DB954]" />
                      <span>Sincronizar</span>
                    </button>
                    <button
                      onClick={() => {
                        broadcastForceReload('all');
                        showToast('🔄 Recarga F5 enviada a todos los oyentes');
                      }}
                      className="py-1.5 px-2 bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-500/40 text-[11px] font-black uppercase flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Recargar (F5)</span>
                    </button>
                  </div>

                  {/* Volumen remoto global */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                      Vol. /Radio:
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={remoteVolumeLevel}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setRemoteVolumeLevel(v);
                        broadcastVolume(v, v === 0);
                      }}
                      className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                    <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                      {Math.round(remoteVolumeLevel * 100)}%
                    </span>
                  </div>
                </div>

                {/* Lista de instancias conectadas */}
                {listeners.length === 0 ? (
                  <div className="py-8 px-4 text-center border border-dashed border-slate-700 bg-[#181926]/50">
                    <Users className="w-7 h-7 mx-auto text-slate-500 mb-1.5" />
                    <p className="text-xs font-black uppercase">Sin oyentes conectados</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Abre <a href="/Radio" target="_blank" rel="noreferrer" className="text-[#1DB954] underline">/Radio</a> en otra pestaña o dispositivo para gestionarlo desde aquí.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-slate-700 max-h-[340px] overflow-y-auto custom-scrollbar">
                    {listeners.map((l) => (
                      <div
                        key={l.clientId}
                        className="p-2.5 bg-[#181926] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                l.isPlaying ? 'bg-[#1DB954] animate-pulse' : 'bg-slate-500'
                              }`}
                            />
                            <p className="text-xs font-black truncate">{l.device || 'Oyente'}</p>
                            <span className="text-[9px] font-mono text-slate-500 truncate">
                              {l.clientId.slice(-6)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {l.trackTitle || 'En espera'} {l.artist ? `· ${l.artist}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              sendRemoteCommand({
                                type: l.isPlaying ? 'PAUSE' : 'PLAY',
                                targetClientId: l.clientId,
                              })
                            }
                            title={l.isPlaying ? 'Pausar oyente' : 'Reproducir oyente'}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded"
                          >
                            {l.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => broadcastForceReload(l.clientId)}
                            title="Recargar este oyente"
                            className="p-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 rounded"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* AUDIO ELEMENT: Streaming MP3 directo con soporte HTTP 206 Range */}
      <audio
        ref={audioRef}
        src={activeAudioSrc}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          if (dur && Number.isFinite(dur) && dur > 0) setDuration(dur);
        }}
        onTimeUpdate={(e) => {
          const cur = e.currentTarget.currentTime || 0;
          const dur = e.currentTarget.duration || duration || currentTrack?.duration || 0;
          setCurrentTime(cur);
          if (dur > 0) setProgress(Math.min(100, Math.max(0, (cur / dur) * 100)));
        }}
        onPlaying={() => {
          setNeedsAutoplayUnlock(false);
          recoveryAttemptRef.current = '';
        }}
        onError={handleAudioError}
        onEnded={() => {
          if (isRepeatSingle && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else {
            nextTrack();
          }
        }}
      />
    </div>
  );
}
