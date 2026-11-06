import React, { useState, useEffect, useRef, useMemo } from 'react';
import supabase from '../config/supabaseClient';
import { useRadioSync } from '../hooks/useRadioSync';
import { parseAudioFileMetadata } from '../utils/radioMetadataParser';
import RadioEditModal from './radio/RadioEditModal';
import AlbumEditModal from './radio/AlbumEditModal';
import CreateAlbumModal from './radio/CreateAlbumModal';
import YoutubeBulkModal from './radio/YoutubeBulkModal';
import MusicCoversGalleryModal from './radio/MusicCoversGalleryModal';
import AlbumTracklistModal from './radio/AlbumTracklistModal';
import ListenersRemoteModal from './radio/ListenersRemoteModal';
import P2PStreamManager from './radio/P2PStreamManager';
import { extractYoutubeId, getYoutubeThumbnail, fetchYoutubeMetadata, YOUTUBE_CATEGORIES } from '../utils/youtubeHelpers';
import { 
  Play, Pause, Music, Upload, FolderUp, Trash2, Edit3, ArrowUp, ArrowDown, 
  GripVertical, Search, Filter, Layers, Disc, Tag, Calendar, Sparkles, 
  Clock, CheckSquare, Square, Volume2, VolumeX, SkipBack, SkipForward,
  Loader2, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Plus, Youtube, ExternalLink, Image as ImageIcon, ListPlus, RotateCcw, Shuffle, Radio, Users, Lock, Grid, List, LayoutGrid, X
} from 'lucide-react';

const MAX_PLAYLIST_SECONDS = Infinity; // Sin límite de tiempo ni de canciones

// Helper de subida a Supabase Storage con progreso y fallback
const uploadFileWithProgress = async (bucketName, filePath, file, onProgress) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { 
        upsert: true, 
        cacheControl: '3600',
        contentType: file.type || 'audio/mpeg'
      });

    if (!error && data) {
      onProgress(100);
      return { success: true, bucket: bucketName };
    }
  } catch (sdkErr) {
    console.warn(`SDK upload falló en bucket ${bucketName}, intentando XHR:`, sdkErr.message);
  }

  return new Promise((resolve, reject) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
    xhr.setRequestHeader('apikey', supabaseKey);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('cache-control', '3600');
    xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true, bucket: bucketName });
      } else {
        let errMessage = `Error HTTP ${xhr.status}`;
        try {
          const res = JSON.parse(xhr.responseText);
          errMessage = res.message || res.error || errMessage;
        } catch (e) {}
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => reject(new Error("Error de conexión durante la subida."));
    xhr.send(file);
  });
};

export default function RadioManager() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'genre', 'artist', 'album', 'year', 'mood'
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sortBy, setSortBy] = useState('order'); // 'order', 'title', 'artist', 'duration'

  // Selección múltiple para acciones masivas
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal de edición de canción
  const [editingSong, setEditingSong] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Subida de archivos / carpetas
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Notificaciones
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Reproductor Preview de Spotify en RadioManager
  const [previewTrack, setPreviewTrack] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isPlayingLiveSignal, setIsPlayingLiveSignal] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [airTime, setAirTime] = useState(0);
  const [airDuration, setAirDuration] = useState(0);
  const [bottomPlayerMode, setBottomPlayerMode] = useState('split'); // 'split', 'live' o 'preview'

  // Volúmenes y silenciadores 100% independientes para los dos Decks
  const [previewVolume, setPreviewVolume] = useState(0.8);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [airVolume, setAirVolume] = useState(0.9);
  const [isAirMuted, setIsAirMuted] = useState(false);

  // Modos aleatorios independientes para Deck Azul (Biblioteca) y Deck Rojo (Cola)
  const [isLibraryShuffle, setIsLibraryShuffle] = useState(false);
  const [isAirShuffle, setIsAirShuffle] = useState(false);
  const isLibraryShuffleRef = useRef(false);
  const isAirShuffleRef = useRef(false);

  // Compatibilidad general
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Control de Instancia Única (Singleton Lock) para evitar múltiples Radio Manager abiertos
  const managerInstanceIdRef = useRef('rm-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now());
  const [isDuplicateInstance, setIsDuplicateInstance] = useState(false);
  const isDuplicateInstanceRef = useRef(false);

  const audioRef = useRef(new Audio());
  const masterAirAudioRef = useRef(new Audio());

  // Referencias para evitar cierres obsoletos (stale closures) en eventos Realtime
  const isPlayingLiveSignalRef = useRef(false);
  const isPlayingPreviewRef = useRef(false);
  const airVolumeRef = useRef(0.9);
  const isAirMutedRef = useRef(false);
  const previewVolumeRef = useRef(0.8);
  const isPreviewMutedRef = useRef(false);
  const volumeRef = useRef(0.8);
  const isMutedRef = useRef(false);
  const lastLoadedPreviewTabRef = useRef('');
  const requestedPreviewTitleRef = useRef('');
  const lastAirTrackNameRef = useRef('');
  const isAdvancingAirRef = useRef(false);
  // true SOLO cuando el usuario inició la pre-escucha explícitamente.
  // Evita que handleEnded avance automáticamente si el deck CUE no fue arrancado por el usuario.
  const userStartedPreviewRef = useRef(false);
  const draggedLibraryTrackRef = useRef(null);

  useEffect(() => {
    isLibraryShuffleRef.current = isLibraryShuffle;
  }, [isLibraryShuffle]);

  useEffect(() => {
    isAirShuffleRef.current = isAirShuffle;
  }, [isAirShuffle]);

  useEffect(() => {
    isPlayingLiveSignalRef.current = isPlayingLiveSignal;
  }, [isPlayingLiveSignal]);

  useEffect(() => {
    isPlayingPreviewRef.current = isPlayingPreview;
  }, [isPlayingPreview]);

  useEffect(() => {
    airVolumeRef.current = airVolume;
    if (masterAirAudioRef.current) {
      masterAirAudioRef.current.volume = isAirMuted ? 0 : airVolume;
    }
  }, [airVolume, isAirMuted]);

  useEffect(() => {
    isAirMutedRef.current = isAirMuted;
    if (masterAirAudioRef.current) {
      masterAirAudioRef.current.muted = isAirMuted || airVolume === 0;
    }
  }, [isAirMuted, airVolume]);

  useEffect(() => {
    previewVolumeRef.current = previewVolume;
    if (audioRef.current) {
      audioRef.current.volume = isPreviewMuted ? 0 : previewVolume;
    }
  }, [previewVolume, isPreviewMuted]);

  useEffect(() => {
    isPreviewMutedRef.current = isPreviewMuted;
    if (audioRef.current) {
      audioRef.current.muted = isPreviewMuted;
    }
  }, [isPreviewMuted]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Bloqueo de Instancia Única de Radio Manager (BroadcastChannel + localStorage Heartbeat)
  const handleTakeoverInstance = () => {
    const myId = managerInstanceIdRef.current;
    try {
      localStorage.setItem('radio_manager_singleton_lock', JSON.stringify({
        id: myId,
        timestamp: Date.now()
      }));
      const bc = new BroadcastChannel('radio-manager-singleton');
      bc.postMessage({ type: 'TAKEOVER', newActiveId: myId, timestamp: Date.now() });
      bc.close();
    } catch (e) {}
    isDuplicateInstanceRef.current = false;
    setIsDuplicateInstance(false);
  };

  useEffect(() => {
    const myId = managerInstanceIdRef.current;
    const LOCK_KEY = 'radio_manager_singleton_lock';
    let bc = null;

    // Verificar si ya hay otra pestaña activa con heartbeat reciente (< 4 segundos)
    try {
      const raw = localStorage.getItem(LOCK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.id !== myId && (Date.now() - parsed.timestamp) < 4000) {
          isDuplicateInstanceRef.current = true;
          setIsDuplicateInstance(true);
        } else {
          localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, timestamp: Date.now() }));
        }
      } else {
        localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, timestamp: Date.now() }));
      }
    } catch (e) {}

    try {
      bc = new BroadcastChannel('radio-manager-singleton');
      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'WHO_IS_ACTIVE' && msg.senderId !== myId && !isDuplicateInstanceRef.current) {
          bc.postMessage({ type: 'I_AM_ACTIVE', activeId: myId, timestamp: Date.now() });
        } else if (msg.type === 'I_AM_ACTIVE' && msg.activeId !== myId) {
          isDuplicateInstanceRef.current = true;
          setIsDuplicateInstance(true);
          try {
            audioRef.current?.pause();
            masterAirAudioRef.current?.pause();
          } catch (e) {}
          setIsPlayingPreview(false);
          setIsPlayingLiveSignal(false);
        } else if (msg.type === 'TAKEOVER' && msg.newActiveId !== myId) {
          isDuplicateInstanceRef.current = true;
          setIsDuplicateInstance(true);
          try {
            audioRef.current?.pause();
            masterAirAudioRef.current?.pause();
          } catch (e) {}
          setIsPlayingPreview(false);
          setIsPlayingLiveSignal(false);
        }
      };

      bc.postMessage({ type: 'WHO_IS_ACTIVE', senderId: myId });
    } catch (e) {}

    const heartbeat = setInterval(() => {
      if (!isDuplicateInstanceRef.current) {
        try {
          localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, timestamp: Date.now() }));
        } catch (e) {}
      }
    }, 1500);

    const releaseLock = () => {
      try {
        const raw = localStorage.getItem(LOCK_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id === myId) {
            localStorage.removeItem(LOCK_KEY);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('beforeunload', releaseLock);
    window.addEventListener('pagehide', releaseLock);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', releaseLock);
      window.removeEventListener('pagehide', releaseLock);
      releaseLock();
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      // Al desmontar RadioManager, detener ambos decks para no dejar audio fantasma
      try {
        audioRef.current?.pause();
        masterAirAudioRef.current?.pause();
      } catch (e) {}
    };
  }, []);

  // Referencias para Drag & Drop y carpetas
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Pestaña principal: 'mp3', 'albums' o 'youtube'
  const [managerTab, setManagerTab] = useState('mp3');

  // Galería y Gestor de Álbumes musicCovers
  const [showAlbumCoversModal, setShowAlbumCoversModal] = useState(false);
  const [targetAlbumForCover, setTargetAlbumForCover] = useState(null);

  // Estado del YouTube Manager
  const [youtubeSongs, setYoutubeSongs] = useState([]);
  const [loadingYoutubeManager, setLoadingYoutubeManager] = useState(false);
  const [ytForm, setYtForm] = useState({
    id: null,
    title: '',
    artist: '',
    youtubeUrl: '',
    category: 'Lofi & Chill'
  });
  const [isEditingYt, setIsEditingYt] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Filtros y Orden de Enlaces Guardados de YouTube
  const [ytFilterCategory, setYtFilterCategory] = useState('Todos');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [ytSortBy, setYtSortBy] = useState('custom');

  // Editor y Detalle de Álbumes en React
  const [editingAlbumTarget, setEditingAlbumTarget] = useState(null);
  const [selectedAlbumModalTarget, setSelectedAlbumModalTarget] = useState(null);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);

  // Modal de Creación e Importación Masiva
  const [showYoutubeBulkModal, setShowYoutubeBulkModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);

  // Biblioteca y Cola Sincronizada Dinámicamente con el Bat (Cero listas estáticas)
  const [batCatalog, setBatCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedAirAlbumFolder, setSelectedAirAlbumFolder] = useState('');
  const lastCatalogSignatureRef = useRef('');
  const [isUpdatingAirList, setIsUpdatingAirList] = useState(false);
  const [mp3ViewMode, setMp3ViewMode] = useState('split'); // 'split' (ambos lados), 'queue' o 'library'
  const [libraryViewType, setLibraryViewType] = useState('tracks'); // 'tracks' o 'albums'
  const [expandedLibraryAlbum, setExpandedLibraryAlbum] = useState(null);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [isDraggingOverQueue, setIsDraggingOverQueue] = useState(false);
  const [onAirTrack, setOnAirTrack] = useState(null);
  const [isBatOnline, setIsBatOnline] = useState(false);

  // Sincronización y Control Remoto de Escuchas
  const {
    listeners,
    activeListenersCount,
    sendRemoteCommand,
    broadcastForceReload,
    broadcastTyrannySettings,
    tyrannySettings
  } = useRadioSync({ isManager: true });

  // Notificador universal de cambios en la lista de reproducción hacia Proyecto Radio
  const notifyPlaylistUpdate = async (extraPayload = {}) => {
    try {
      const bc = new BroadcastChannel('radio-playlist-channel');
      bc.postMessage({ type: 'PLAYLIST_UPDATED', timestamp: Date.now(), ...extraPayload });
      bc.close();
    } catch (e) {}

    try {
      await sendRemoteCommand({
        type: 'PLAYLIST_UPDATED',
        targetClientId: 'all',
        payload: extraPayload
      });
    } catch (e) {}
  };

  const [showListenersModal, setShowListenersModal] = useState(false);
  const [selectedTargetListForRemote, setSelectedTargetListForRemote] = useState('queue');

  const handleApplyListToRemoteListeners = async () => {
    try {
      if (selectedTargetListForRemote === 'queue') {
        if (!songs || songs.length === 0) {
          setError("La cola de emisión está vacía.");
          return;
        }
        await sendRemoteCommand({
          type: 'APPLY_PLAYLIST',
          targetClientId: 'all',
          payload: {
            playlistName: 'Cola de Emisión Actual',
            tracks: songs
          }
        });
        setSuccess(`🚀 Cola de emisión enviada a ${activeListenersCount} escucha(s).`);
      } else {
        const album = (batCatalog || []).find(a => a.folderName === selectedTargetListForRemote || a.albumName === selectedTargetListForRemote);
        if (!album || !album.tracks || album.tracks.length === 0) {
          setError("El álbum seleccionado no contiene pistas.");
          return;
        }
        const formattedTracks = album.tracks.map((t, idx) => ({
          id: t.id || `remote-${idx}`,
          title: t.title,
          artist: t.artist || album.artist || 'Radio Café',
          album: album.albumName,
          url: `/api/local-audio?file=${encodeURIComponent(t.fileName)}`,
          duration: t.duration || 210,
          cover: t.cover || album.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
          order_index: idx
        }));
        await sendRemoteCommand({
          type: 'APPLY_PLAYLIST',
          targetClientId: 'all',
          payload: {
            playlistName: album.albumName,
            tracks: formattedTracks
          }
        });
        setSuccess(`🚀 Álbum "${album.albumName}" aplicado a ${activeListenersCount} escucha(s).`);
      }
    } catch (e) {
      setError("Error enviando lista a escuchas: " + e.message);
    }
  };

  const handleReloadListener = async (targetId) => {
    await sendRemoteCommand({
      type: 'FORCE_RELOAD',
      targetClientId: targetId
    });
    setSuccess(`Comando de recarga F5 enviado a la instancia.`);
  };

  const handleTogglePlayListener = async (targetId, currentIsPlaying) => {
    await sendRemoteCommand({
      type: currentIsPlaying ? 'PAUSE' : 'PLAY',
      targetClientId: targetId
    });
    setSuccess(`Comando ${currentIsPlaying ? 'PAUSA' : 'PLAY'} enviado a la instancia.`);
  };

  const handleNextTrackListener = async (targetId) => {
    await sendRemoteCommand({
      type: 'NEXT',
      targetClientId: targetId
    });
    setSuccess(`Comando SIGUIENTE enviado a la instancia.`);
  };

  // Forzar cambio de modo/fuente (Files, Radios o YouTube) a todas las instancias conectadas
  const handleForceModeAll = async (targetMode) => {
    try {
      setIsUpdatingAirList(true);
      const modeNames = { supabase: 'FILES (MP3s)', live: 'RADIOS (Plaza)', youtube: 'YOUTUBE' };

      // 1. Enviar comando remoto a todas las instancias de Proyecto Radio
      await sendRemoteCommand({
        type: 'FORCE_MODE',
        targetClientId: 'all',
        payload: {
          tab: targetMode,
          mode: targetMode,
          isPlaying: true
        }
      });

      // 2. BroadcastChannel local inter-pestañas
      try {
        const bc = new BroadcastChannel('radio-command-channel');
        bc.postMessage({
          type: 'FORCE_MODE',
          targetClientId: 'all',
          tab: targetMode,
          mode: targetMode,
          isPlaying: true,
          timestamp: Date.now()
        });
        bc.close();
      } catch (e) {}

      // 3. Actualizar la tabla radio_current_play en Supabase
      let updatePayload = {
        tab: targetMode,
        is_playing: true,
        updated_at: new Date().toISOString()
      };

      if (targetMode === 'supabase') {
        const firstSong = songs[0];
        if (firstSong) {
          updatePayload.station_name = firstSong.title;
          updatePayload.station_artist = firstSong.artist || 'Radio Café';
          updatePayload.station_cover = firstSong.cover || '';
          updatePayload.station_url = firstSong.url || (firstSong.fileName ? `local://${encodeURIComponent(firstSong.fileName)}` : '');
        }
      } else if (targetMode === 'live') {
        updatePayload.station_name = 'Emisora En Vivo';
        updatePayload.station_artist = 'Radios En Vivo';
      } else if (targetMode === 'youtube') {
        const firstYt = youtubeSongs[0];
        if (firstYt) {
          updatePayload.station_name = firstYt.title || 'YouTube Video';
          updatePayload.station_artist = firstYt.artist || 'Canal YouTube';
          updatePayload.station_cover = firstYt.cover || '';
          updatePayload.station_url = firstYt.url || '';
        }
      }

      await supabase.from('radio_current_play').update(updatePayload).eq('id', 1);

      setOnAirTrack(prev => ({
        ...(prev || {}),
        ...updatePayload
      }));

      setSuccess(`⚡ ¡Modo forzado a ${modeNames[targetMode]} en todas las instancias (${activeListenersCount} activas)!`);
    } catch (err) {
      setError(`Error forzando modo ${targetMode}: ` + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  // Comprobar latido activo del .bat (detección inmediata local vía Vite y fallback Supabase)
  const checkBatHeartbeat = async (record) => {
    // 1. Verificación local inmediata (G:\Mi unidad\Radio\bat_heartbeat.json)
    try {
      const res = await fetch(`/api/bat-status?t=${Date.now()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.online) {
          setIsBatOnline(true);
          if (json.totalSongs && Number(json.totalSongs) > 0) {
            const currentLoadedSongs = (batCatalog || []).reduce((acc, a) => acc + (a.tracks?.length || a.trackCount || 0), 0);
            if (currentLoadedSongs !== Number(json.totalSongs)) {
              fetchBatCatalog(true);
            }
          }
          return true;
        } else {
          // El servidor Vite local confirma que el BAT no está corriendo
          setIsBatOnline(false);
          return false;
        }
      }
    } catch (e) {}

    // 2. Si no responde local (ej. en Vercel producción donde no hay servidor local), verificar estado en Supabase
    if (!record) {
      setIsBatOnline(false);
      return false;
    }
    if (record.station_artist === 'OFFLINE' || record.station_name === 'Estacion Desconectada' || !record.is_playing) {
      setIsBatOnline(false);
      return false;
    }
    setIsBatOnline(true);
    return true;
  };

  // Cargar biblioteca 100% dinámica escaneada por el .bat (vía Supabase DB + Storage o disco local en Vite)
  const fetchBatCatalog = async (silent = false, explicitCatalogUrl = null) => {
    try {
      if (!silent) setLoadingCatalog(true);

      const applyDynamicCatalog = (data, sourceLabel) => {
        const totalTracks = data.reduce((a, b) => a + (b.tracks?.length || b.trackCount || 0), 0);
        setBatCatalog(data);
        setSelectedAirAlbumFolder(prev => prev || data[0]?.folderName || '');
        if (!silent) {
          setSuccess(`¡Biblioteca dinámica del .bat cargada (${sourceLabel})! (${data.length} álbumes, ${totalTracks} canciones).`);
        }
      };

      // 1. Si estamos en entorno local con Vite activo, leer el catalog.json generado en disco por el .bat
      try {
        const localRes = await fetch(`/api/local-catalog?t=${Date.now()}`);
        const ct = localRes.headers.get('content-type') || '';
        if (localRes.ok && ct.includes('application/json')) {
          const localData = await localRes.json();
          if (Array.isArray(localData) && localData.length > 0) {
            applyDynamicCatalog(localData, 'Disco Local');
            return;
          }
        }
      } catch (e) {}

      // 2. Consultar la URL del catálogo dinámico registrado por el .bat en la base de datos (radio_current_play.tyranny_settings.catalogUrl)
      let targetCloudUrl = explicitCatalogUrl;
      if (!targetCloudUrl) {
        try {
          const { data: playRow } = await supabase
            .from('radio_current_play')
            .select('tyranny_settings')
            .eq('id', 1)
            .single();
          if (playRow?.tyranny_settings?.catalogUrl) {
            targetCloudUrl = playRow.tyranny_settings.catalogUrl;
            const ts = playRow.tyranny_settings;
            lastCatalogSignatureRef.current = `${ts.catalogUrl || ''}|${ts.catalogSongsCount || ''}|${ts.catalogUpdatedAt || ''}`;
          }
        } catch (e) {}
      }

      if (targetCloudUrl) {
        try {
          const sep = targetCloudUrl.includes('?') ? '&' : '?';
          const res = await fetch(`${targetCloudUrl}${sep}t=${Date.now()}`);
          if (res.ok) {
            const cloudData = await res.json();
            if (Array.isArray(cloudData) && cloudData.length > 0) {
              applyDynamicCatalog(cloudData, 'Supabase Live');
              return;
            }
          }
        } catch (e) {}
      }

      // 3. Buscar el archivo catalog_live_*.json más reciente directamente en el bucket Radio de Supabase Storage
      try {
        const { data: filesList } = await supabase.storage
          .from('Radio')
          .list('', {
            limit: 20,
            search: 'catalog_live_',
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (Array.isArray(filesList) && filesList.length > 0) {
          const sorted = [...filesList]
            .filter(f => f.name && f.name.startsWith('catalog_live_') && f.name.endsWith('.json'))
            .sort((a, b) => b.name.localeCompare(a.name));

          if (sorted.length > 0) {
            const newestFile = sorted[0].name;
            const latestUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Radio/${newestFile}?t=${Date.now()}`;
            const res = await fetch(latestUrl);
            if (res.ok) {
              const storageData = await res.json();
              if (Array.isArray(storageData) && storageData.length > 0) {
                applyDynamicCatalog(storageData, 'Storage Dinámico');
                return;
              }
            }
          }
        }
      } catch (e) {}
    } catch (err) {
      console.warn("No se pudo cargar el catálogo dinámico del .bat:", err);
    } finally {
      if (!silent) setLoadingCatalog(false);
    }
  };

  const handleAlbumCreated = (newSongs) => {
    setSongs(prev => [...prev, ...newSongs]);
    setSuccess(`¡Álbum creado exitosamente con ${newSongs.length} canciones!`);
    fetchSongs();
  };

  const availableCategories = useMemo(() => {
    return Array.from(new Set([
      ...YOUTUBE_CATEGORIES.filter(c => c !== 'Todos'),
      ...youtubeSongs.map(s => s.category).filter(Boolean)
    ]));
  }, [youtubeSongs]);

  const ytCategoryCounts = useMemo(() => {
    const counts = { 'Todos': youtubeSongs.length };
    youtubeSongs.forEach(song => {
      const cat = song.category || 'Sin Categoría';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [youtubeSongs]);

  const ytCategoriesForFilter = useMemo(() => {
    const cats = new Set(youtubeSongs.map(s => s.category).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [youtubeSongs]);

  const filteredAndSortedYoutubeSongs = useMemo(() => {
    let list = [...youtubeSongs];

    // 1. Filtrar por Categoría
    if (ytFilterCategory !== 'Todos') {
      list = list.filter(item => (item.category || 'Sin Categoría') === ytFilterCategory);
    }

    // 2. Filtrar por Búsqueda
    if (ytSearchQuery.trim() !== '') {
      const q = ytSearchQuery.toLowerCase().trim();
      list = list.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.artist && item.artist.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // 3. Ordenar
    switch (ytSortBy) {
      case 'title-asc':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title-desc':
        list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'artist-asc':
        list.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
        break;
      case 'category':
        list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'custom':
      default:
        // Mantener orden personalizado
        break;
    }

    return list;
  }, [youtubeSongs, ytFilterCategory, ytSearchQuery, ytSortBy]);

  // Generación automática de lista de álbumes agrupados a profundidad
  // Lista plana de canciones de la biblioteca del Bat
  const libraryTracks = useMemo(() => {
    const list = [];
    (batCatalog || []).forEach(alb => {
      (alb.tracks || []).forEach(t => {
        list.push({
          ...t,
          folderName: alb.folderName,
          album: alb.albumName || t.album,
          artist: t.artist || alb.artist,
          albumArtist: alb.artist,
          cover: t.cover || alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'
        });
      });
    });
    return list;
  }, [batCatalog]);

  const normalizeSearchStr = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredLibraryTracks = useMemo(() => {
    if (!librarySearchQuery.trim()) return libraryTracks;
    const words = normalizeSearchStr(librarySearchQuery).split(/\s+/).filter(Boolean);
    return libraryTracks.filter(t => {
      const haystack = normalizeSearchStr(
        `${t.title || ''} ${t.artist || ''} ${t.album || ''} ${t.folderName || ''} ${t.fileName || ''}`
      );
      return words.every(w => haystack.includes(w));
    });
  }, [libraryTracks, librarySearchQuery]);

  const filteredLibraryAlbums = useMemo(() => {
    if (!librarySearchQuery.trim()) return batCatalog || [];
    const words = normalizeSearchStr(librarySearchQuery).split(/\s+/).filter(Boolean);
    return (batCatalog || []).filter(alb => {
      const albumText = `${alb.albumName || ''} ${alb.artist || ''} ${alb.folderName || ''} ${(alb.tracks || []).map(t => t.title || '').join(' ')}`;
      const haystack = normalizeSearchStr(albumText);
      return words.every(w => haystack.includes(w));
    });
  }, [batCatalog, librarySearchQuery]);

  const albumList = useMemo(() => {
    const isRealCover = (url) => url && !url.startsWith('blob:') && !url.includes('images.unsplash.com') && url.trim() !== '';

    if (batCatalog && batCatalog.length > 0) {
      // Build a quick lookup: albumName (lowercase) → best cover from songs
      const songsCoverMap = new Map();
      songs.forEach(song => {
        if (isRealCover(song.cover)) {
          const key = (song.album || '').toLowerCase().trim();
          if (key && !songsCoverMap.has(key)) {
            songsCoverMap.set(key, song.cover);
          }
        }
      });

      return batCatalog.map((alb, idx) => {
        const enrichedCover = isRealCover(alb.cover)
          ? alb.cover
          : (songsCoverMap.get((alb.albumName || alb.folderName || '').toLowerCase().trim()) || alb.cover || '');
        const tracks = alb.tracks || [];
        return {
          ...alb,
          key: alb.key || alb.folderName || alb.albumName || `alb-${idx}`,
          albumName: alb.albumName || alb.folderName || 'Álbum',
          artistName: alb.artistName || alb.artist || 'Varios Artistas',
          year: alb.year || '2026',
          genre: alb.genre || 'Radio',
          tracks,
          totalDuration: alb.totalDuration || tracks.reduce((acc, t) => acc + (Number(t.duration) || 180), 0),
          cover: enrichedCover
        };
      });
    }

    const map = new Map();
    songs.forEach(song => {
      const albumName = song.album || 'Sencillo';
      const artistName = song.artist || 'Artista Desconocido';
      const key = `${albumName.trim().toLowerCase()}___${artistName.trim().toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          albumName,
          artistName,
          year: song.year || new Date().getFullYear().toString(),
          genre: song.genre || 'General',
          cover: isRealCover(song.cover) ? song.cover : '',
          tracks: [],
          totalDuration: 0
        });
      }

      const item = map.get(key);
      // Upgrade cover if we find a real one later in the song list
      if (!isRealCover(item.cover) && isRealCover(song.cover)) {
        item.cover = song.cover;
      }
      item.tracks.push(song);
      item.totalDuration += (song.duration || 0);
    });

    return Array.from(map.values());
  }, [batCatalog, songs]);

  // Controles de escala adaptativa, vista y búsqueda de Álbumes (Estilo Spotify)
  const [albumScale, setAlbumScale] = useState('spotify'); // 'compact' | 'spotify' | 'list'
  const [libraryAlbumScale, setLibraryAlbumScale] = useState('compact'); // 'compact' | 'grid' | 'list'
  const [albumSearchQuery, setAlbumSearchQuery] = useState('');
  const [albumSortBy, setAlbumSortBy] = useState('name'); // 'name' | 'artist' | 'tracks' | 'year'

  const filteredAlbumList = useMemo(() => {
    let list = [...albumList];
    if (albumSearchQuery.trim()) {
      const words = normalizeSearchStr(albumSearchQuery).split(/\s+/).filter(Boolean);
      list = list.filter(alb => {
        const haystack = normalizeSearchStr(
          `${alb.albumName || ''} ${alb.artistName || ''} ${alb.genre || ''} ${alb.year || ''} ${(alb.tracks || []).map(t => t.title || '').join(' ')}`
        );
        return words.every(w => haystack.includes(w));
      });
    }
    list.sort((a, b) => {
      if (albumSortBy === 'artist') return (a.artistName || '').localeCompare(b.artistName || '');
      if (albumSortBy === 'tracks') return ((b.tracks?.length || 0) - (a.tracks?.length || 0));
      if (albumSortBy === 'year') return String(b.year || '').localeCompare(String(a.year || ''));
      return (a.albumName || '').localeCompare(b.albumName || '');
    });
    return list;
  }, [albumList, albumSearchQuery, albumSortBy]);

  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();

    // Consultar estado inicial del bat y de la señal al aire
    supabase.from('radio_current_play').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) {
        setOnAirTrack(data);
        if (data.station_name) {
          lastAirTrackNameRef.current = data.station_name;
        }
        const ts = data.tyranny_settings || {};
        if (ts.catalogUrl || ts.catalogSongsCount || ts.catalogUpdatedAt) {
          lastCatalogSignatureRef.current = `${ts.catalogUrl || ''}|${ts.catalogSongsCount || ''}|${ts.catalogUpdatedAt || ''}`;
        }
        checkBatHeartbeat(data);
        fetchBatCatalog(true, ts.catalogUrl || null);

        // Si la señal al aire está activa en la base de datos, preparar el reloj y la URL del Deck Rojo (sin reproducir en silencio hasta que el usuario active el Deck Rojo)
        if (data.is_playing && data.station_url) {
          const elapsed = Math.max(0, (Date.now() - new Date(data.updated_at).getTime()) / 1000);
          setAirTime(elapsed);
        }
      } else {
        fetchBatCatalog(true);
      }
    });

    // Suscripción en tiempo real al estado de la señal de radio
    const channel = supabase
      .channel('radio-air-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_current_play' }, (payload) => {
        const row = payload.new;
        if (row) {
          // 1. Si es señal de pre-escucha (Modo Azul / Biblioteca CUE exclusiva)
          if (row.tab && row.tab.startsWith('PREVIEW_READY:')) {
            if (row.tab !== lastLoadedPreviewTabRef.current && userStartedPreviewRef.current) {
              const parts = row.tab.substring(14).split('||');
              const previewUrl = parts[0];
              const previewTitle = parts[1] || '';
              const previewArtist = parts[2] || '';
              const previewDur = Number(parts[3]) || 180;

              // Validar que la señal corresponda a la canción actualmente solicitada
              const reqTitle = requestedPreviewTitleRef.current;
              const isMatch = !reqTitle || !previewTitle ||
                previewTitle.trim().toLowerCase().includes(reqTitle) ||
                reqTitle.includes(previewTitle.trim().toLowerCase());

              if (isMatch && previewUrl && audioRef.current) {
                lastLoadedPreviewTabRef.current = row.tab;
                audioRef.current.src = previewUrl;
                audioRef.current.currentTime = 0;
                audioRef.current.muted = isPreviewMutedRef.current;
                audioRef.current.volume = isPreviewMutedRef.current ? 0 : previewVolumeRef.current;
                setPreviewDuration(previewDur);
                setPreviewTrack(prev => ({
                  ...(prev || {}),
                  title: previewTitle || prev?.title,
                  artist: previewArtist || prev?.artist,
                  duration: previewDur
                }));
                setIsPlayingPreview(true);
                audioRef.current.play().catch(err => console.warn("Autoplay pre-escucha diferido:", err));
                setSuccess(`🎧 Reproduciendo en Deck CUE (Biblioteca): "${previewTitle}"`);
              }
            }
            // Si el evento fue únicamente de pre-escucha y no cambió la canción al aire, salir aquí
            if (!row.station_name || row.station_name === lastAirTrackNameRef.current) {
              return;
            }
          }

          if (row.tab && row.tab.startsWith('PREVIEW_REQ:')) {
            return; // Solicitud en tránsito al BAT, no alterar emisión al aire
          }

          // 2. Si es actualización de la emisión general al aire (Deck Rojo / Cola de emisión)
          setOnAirTrack(row);

          const airAudio = masterAirAudioRef.current;
          const trackChanged = Boolean(row.station_name && row.station_name !== lastAirTrackNameRef.current);
          if (trackChanged) {
            lastAirTrackNameRef.current = row.station_name;
            // Si la nueva pista no tiene URL HTTP lista todavía (está subiendo en el BAT)
            // y el monitor NO está ya reproduciendo la pista local en localhost, pausar temporalmente SIN apagar isPlayingLiveSignal
            const isAlreadyPlayingLocal = airAudio && !airAudio.paused && airAudio.src && airAudio.src.includes('/api/local-audio');
            if (!isAlreadyPlayingLocal && (!row.station_url || (!row.station_url.startsWith('http://') && !row.station_url.startsWith('https://')))) {
              if (airAudio) {
                airAudio.pause();
                airAudio.currentTime = 0;
              }
            }
          }

          // Actualizar la fuente del Deck Rojo si se recibió la señal en vivo transmitida por el .bat
          if (row.station_url && (row.station_url.startsWith('http://') || row.station_url.startsWith('https://'))) {
            if (airAudio) {
              // Si ya está sonando esta misma canción por /api/local-audio en localhost, no cortarla
              const isPlayingSameLocal = !trackChanged && !airAudio.paused && airAudio.src && airAudio.src.includes('/api/local-audio');
              if (!isPlayingSameLocal) {
                const isDifferent = airAudio.src !== row.station_url;
                if (isDifferent) {
                  airAudio.pause();
                  airAudio.currentTime = 0;
                  airAudio.src = row.station_url;
                  airAudio.load();
                }
                if (isPlayingLiveSignalRef.current && row.is_playing) {
                  airAudio.muted = isAirMutedRef.current || airVolumeRef.current === 0;
                  airAudio.volume = isAirMutedRef.current ? 0 : airVolumeRef.current;
                  airAudio.play().catch(err => {
                    console.warn("Autoplay diferido al recibir señal del BAT:", err);
                    airAudio.addEventListener('canplay', () => {
                      if (isPlayingLiveSignalRef.current) {
                        airAudio.play().catch(() => {});
                      }
                    }, { once: true });
                  });
                }
              }
            }
          }
          // Detectar si el .bat acaba de iniciar o actualizar el catálogo en la base de datos
          const ts = row.tyranny_settings || {};
          const newCatSig = `${ts.catalogUrl || ''}|${ts.catalogSongsCount || ''}|${ts.catalogUpdatedAt || ''}`;
          if (newCatSig !== '||' && newCatSig !== lastCatalogSignatureRef.current) {
            lastCatalogSignatureRef.current = newCatSig;
            fetchBatCatalog(false, ts.catalogUrl || null);
          }

          const online = checkBatHeartbeat(row);
          if (online && (row.station_artist === 'BAT_ONLINE' || row.station_artist === 'LIBRARY_LOADED' || row.station_name === 'BAT_READY')) {
            fetchBatCatalog(true, ts.catalogUrl || null);
          } else if (!online || row.station_artist === 'OFFLINE') {
            setIsBatOnline(false);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Monitor de latido cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      if (onAirTrack) checkBatHeartbeat(onAirTrack);
    }, 3000);
    return () => clearInterval(timer);
  }, [onAirTrack, batCatalog.length]);

  // Reloj Incorruptible de Emisión: cuenta segundo a segundo de forma continua basándose en updated_at
  useEffect(() => {
    if (!onAirTrack?.is_playing || !onAirTrack?.updated_at) return;

    const calcElapsed = () => {
      const startedAt = new Date(onAirTrack.updated_at).getTime();
      return Math.max(0, (Date.now() - startedAt) / 1000);
    };

    setAirTime(calcElapsed());

    const timer = setInterval(() => {
      const elapsed = calcElapsed();
      const songDur = airDuration || onAirTrack?.duration || 180;

      // Mantener actualizado el reloj visual de emisión sin interrumpir la canción
      setAirTime(elapsed);

      // Si el audio en cabina está activo, mantenerlo alineado
      const airAudio = masterAirAudioRef.current;
      if (airAudio && airAudio.src && !airAudio.paused) {
        if (Math.abs(airAudio.currentTime - elapsed) > 3) {
          airAudio.currentTime = elapsed;
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onAirTrack?.updated_at, onAirTrack?.is_playing, airDuration, songs.length]);

  // Forzar Reinicio del sistema de radio y recarga (F5) de todas las instancias abiertas
  const handleForceRestart = async () => {
    if (!window.confirm("¿Estás seguro de que deseas forzar el reinicio de la radio? Esto recargará (F5) todas las instancias y pestañas abiertas de la página.")) {
      return;
    }

    setIsRestarting(true);
    setError(null);
    setSuccess("Enviando señal de recarga forzada (F5) a todas las instancias...");

    try {
      // 1. Detener preview local de audio si está activo
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // 2. Emitir mensaje por BroadcastChannel local (todas las pestañas del mismo navegador)
      try {
        const bc = new BroadcastChannel('radio-reload-channel');
        bc.postMessage({ type: 'FORCE_RELOAD', timestamp: Date.now() });
        bc.close();
      } catch (e) {}

      // 3. Emitir mensaje por Supabase Realtime Broadcast (WebSockets)
      try {
        const channel = supabase.channel('radio-sync-global');
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'FORCE_RELOAD',
          payload: { timestamp: Date.now() }
        });
      } catch (e) {}

      // 4. Actualizar la tabla radio_current_play en Supabase
      try {
        await supabase
          .from('radio_current_play')
          .upsert({
            id: 1,
            tab: 'supabase',
            station_url: '',
            station_name: 'FORCE_RELOAD',
            station_cover: '',
            station_artist: '',
            is_playing: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (syncErr) {
        console.warn("Error al forzar reinicio en Supabase:", syncErr.message);
      }

      // 5. Recargar la propia instancia actual (F5)
      setTimeout(() => {
        window.location.reload();
      }, 300);

    } catch (err) {
      console.error("Error al forzar reinicio:", err);
      setError("Error al forzar reinicio: " + err.message);
      setIsRestarting(false);
    }
  };

  // Control de audio preview (Deck Azul / CUE - 100% independiente de la transmisión al aire)
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setPreviewTime(audio.currentTime || 0);
    };
    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setPreviewDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      // Avanzar automáticamente a la siguiente canción de la biblioteca si el usuario inició el Deck Azul
      if (userStartedPreviewRef.current) {
        playNextPreview();
      } else {
        setIsPlayingPreview(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [previewTrack, songs, expandedLibraryAlbum, librarySearchQuery, isLibraryShuffle]);

  // Canal persistente para sincronización de tiempo en vivo sin latencia
  const liveTimeBcRef = useRef(null);
  useEffect(() => {
    try {
      liveTimeBcRef.current = new BroadcastChannel('radio-live-time');
    } catch (e) {}
    return () => {
      if (liveTimeBcRef.current) {
        try { liveTimeBcRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Motor maestro de emisión continua al aire (Background Broadcaster)
  useEffect(() => {
    const airAudio = masterAirAudioRef.current;

    const handleAirTimeUpdate = () => {
      if (airAudio.src) {
        if (!airAudio.paused) {
          setAirTime(airAudio.currentTime || 0);
        }
        if (airAudio.duration && Number.isFinite(airAudio.duration)) {
          setAirDuration(airAudio.duration);
        }
        if (liveTimeBcRef.current && !airAudio.paused) {
          try {
            liveTimeBcRef.current.postMessage({
              type: 'LIVE_TICK',
              currentTime: airAudio.currentTime,
              timestamp: Date.now(),
              url: airAudio.src
            });
          } catch (e) {}
        }
      }
    };

    const handleAirLoadedMetadata = () => {
      if (airAudio.duration && Number.isFinite(airAudio.duration)) {
        setAirDuration(airAudio.duration);
      }
    };

    const handleAirEnded = () => {
      // Si el transmisor .bat está activo, el .bat es la autoridad de transmisión; el monitor no debe cortar canciones
      if (isBatOnline) {
        console.log('[MasterBroadcaster] Monitor de cabina finalizó reproducción local. Esperando señal del transmisor .bat.');
        return;
      }
      console.log('[MasterBroadcaster] Canción finalizada en modo autónomo. Avanzando cola...');
      handleAirNext();
    };

    airAudio.addEventListener('timeupdate', handleAirTimeUpdate);
    airAudio.addEventListener('loadedmetadata', handleAirLoadedMetadata);
    airAudio.addEventListener('durationchange', handleAirLoadedMetadata);
    airAudio.addEventListener('ended', handleAirEnded);

    return () => {
      airAudio.removeEventListener('timeupdate', handleAirTimeUpdate);
      airAudio.removeEventListener('loadedmetadata', handleAirLoadedMetadata);
      airAudio.removeEventListener('durationchange', handleAirLoadedMetadata);
      airAudio.removeEventListener('ended', handleAirEnded);
    };
  }, [songs]);


  const [dbColumns, setDbColumns] = useState(null);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      let data = null;
      let error = null;

      const firstTry = await supabase
        .from('playlist_radio')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (firstTry.error && firstTry.error.message?.includes('order_index')) {
        const fallbackTry = await supabase
          .from('playlist_radio')
          .select('*')
          .order('id', { ascending: true });
        data = fallbackTry.data;
        error = fallbackTry.error;
      } else {
        data = firstTry.data;
        error = firstTry.error;
      }

      if (error) throw error;

      if (data && data.length > 0) {
        setDbColumns(Object.keys(data[0]));
      }

      const defaultCover = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400';
      const normalized = (data || []).map((s, idx) => ({
        ...s,
        album: s.album || 'Sencillo',
        genre: s.genre || 'General',
        year: s.year || new Date().getFullYear().toString(),
        mood: s.mood || 'Chill & Relax',
        cover: (s.cover && typeof s.cover === 'string' && !s.cover.startsWith('blob:')) ? s.cover : defaultCover,
        duration: (s.duration && Number(s.duration) > 0) ? Number(s.duration) : 180, // Estimado de 3 minutos si no tenía duración guardada
        order_index: s.order_index ?? idx
      }));

      setSongs(normalized);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError("No se pudieron cargar las canciones: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchYoutubeSongs = async () => {
    try {
      setLoadingYoutubeManager(true);
      const { data, error } = await supabase
        .from('playlist_youtube')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (!error && data) {
        const formatted = data.map(item => {
          const ytId = item.youtube_id || extractYoutubeId(item.youtube_url || item.url);
          return {
            ...item,
            youtubeId: ytId,
            cover: item.cover || getYoutubeThumbnail(ytId),
            category: item.category || 'Lofi & Chill'
          };
        });
        setYoutubeSongs(formatted);
      }
    } catch (err) {
      console.warn("Error cargando canciones de YouTube:", err);
    } finally {
      setLoadingYoutubeManager(false);
    }
  };

  const filterPayloadByKnownColumns = (payload) => {
    if (!dbColumns || dbColumns.length === 0) {
      const essentialKeys = ['title', 'artist', 'url', 'cover'];
      const filtered = {};
      for (const k of essentialKeys) {
        if (payload[k] !== undefined) filtered[k] = payload[k];
      }
      return filtered;
    }

    const clean = {};
    for (const key of Object.keys(payload)) {
      if (dbColumns.includes(key)) {
        clean[key] = payload[key];
      }
    }
    return clean;
  };

  const totalPlaylistSeconds = songs.reduce((acc, item) => acc + (Number(item.duration) || 180), 0);
  const quotaPercent = Math.min(100, Math.round((totalPlaylistSeconds / MAX_PLAYLIST_SECONDS) * 100));

  // Resolver URL de reproducción para preview privado o señal en vivo en Radio Manager
  const getPreviewAudioUrl = (song) => {
    if (!song) return null;
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname === '::1' || 
       window.location.hostname === '[::1]' ||
       window.location.hostname.includes('localhost') ||
       window.location.port === '5173');

    if (song.station_url) {
      if (song.station_url.startsWith('http://') || song.station_url.startsWith('https://') || song.station_url.startsWith('/')) {
        return song.station_url;
      }
      if (song.station_url.startsWith('local://')) {
        const raw = decodeURIComponent(song.station_url.substring(8));
        return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(raw)}` : null;
      }
    }
    if (song.filePath) {
      return isLocalHost ? `/api/local-audio?path=${encodeURIComponent(song.filePath)}` : null;
    }
    if (song.url) {
      if (song.url.startsWith('http://') || song.url.startsWith('https://') || song.url.startsWith('/')) {
        return song.url;
      }
      if (song.url.startsWith('local://')) {
        const fileName = song.fileName || decodeURIComponent(song.url.substring(8));
        return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(fileName)}` : null;
      }
    }
    if (song.fileName) {
      return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(song.fileName)}` : null;
    }
    if (song.title && isLocalHost) {
      return `/api/local-audio?file=${encodeURIComponent(song.title + '.mp3')}`;
    }
    return null;
  };

  // Control PLAY / PAUSA exclusivo de la pre-escucha (Modo Azul / Biblioteca CUE)
  const handleTogglePreviewPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingPreview && !audio.paused) {
      audio.pause();
      userStartedPreviewRef.current = false; // usuario pausó → no auto-avanzar al terminar
      setIsPlayingPreview(false);
      setSuccess("⏸ Deck CUE (Biblioteca) en pausa.");
    } else if (audio.src) {
      userStartedPreviewRef.current = true; // usuario arrancó explícitamente
      audio.muted = isPreviewMutedRef.current;
      audio.volume = isPreviewMutedRef.current ? 0 : previewVolumeRef.current;
      audio.play().catch(() => {});
      setIsPlayingPreview(true);
      setBottomPlayerMode(prev => prev === 'live' ? 'split' : prev);
      setSuccess(`🎧 Reproduciendo en Deck CUE: "${previewTrack?.title || 'Canción'}"`);
    } else if (previewTrack) {
      handlePlayPreview(previewTrack, true);
    } else {
      const list = getActiveLibraryTrackList();
      if (list && list.length > 0) {
        handlePlayPreview(list[0], true);
      }
    }
  };

  // Manejo de Reproducción / Pre-escucha de Biblioteca (Deck Azul, 100% independiente del Deck Rojo y de la radio al aire)
  const handlePlayPreview = async (song, forcePlay = false) => {
    if (!song) return;

    // Si ya es la misma canción y NO es cambio forzado por Next/Prev, alternar play / pausa
    const isSameSong = previewTrack && (
      (previewTrack.id && song.id && String(previewTrack.id) === String(song.id)) ||
      (previewTrack.fileName && song.fileName && previewTrack.fileName === song.fileName) ||
      (previewTrack.title && song.title && previewTrack.title.trim().toLowerCase() === song.title.trim().toLowerCase())
    );

    if (!forcePlay && isSameSong && audioRef.current?.src) {
      handleTogglePreviewPlay();
      return;
    }

    // Marcar que el usuario inició activamente el Deck CUE para permitir auto-avance continuo en Biblioteca
    userStartedPreviewRef.current = true;

    // Mantener modo 'split' si ambos decks estaban visibles
    setBottomPlayerMode(prev => prev === 'live' ? 'split' : prev);
    setPreviewTrack(song);
    setPreviewDuration(song.duration || 0);
    setPreviewTime(0);
    setIsPlayingPreview(false);

    // Limpiar el audio anterior del Deck Azul (NUNCA toca masterAirAudioRef)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    requestedPreviewTitleRef.current = (song.title || '').trim().toLowerCase();
    lastLoadedPreviewTabRef.current = '';

    const requestFromBat = async () => {
      setSuccess(`⏳ Cargando "${song.title}" en Deck CUE...`);
      try {
        const fileInfo = song.fileName || song.filePath || '';
        const requestPayload = `PREVIEW_REQ:${song.title}||${song.artist || song.albumArtist || ''}||${fileInfo}`;
        await supabase.from('radio_current_play').update({
          tab: requestPayload
        }).eq('id', 1);
      } catch (err) {
        console.error("Error enviando solicitud de pre-escucha al BAT:", err);
        setError("Error solicitando pre-escucha al .bat: " + err.message);
      }
    };

    // En localhost, reproducir instantáneamente desde el disco local vía Vite middleware (0ms latencia y sin usar la nube)
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal && (song.filePath || song.fileName || song.url)) {
      const localAudioUrl = getPreviewAudioUrl(song) || `/api/local-audio?path=${encodeURIComponent(song.filePath || '')}&file=${encodeURIComponent(song.fileName || '')}`;
      if (localAudioUrl && audioRef.current) {
        const audio = audioRef.current;
        audio.src = localAudioUrl;
        audio.currentTime = 0;
        audio.muted = isPreviewMutedRef.current;
        audio.volume = isPreviewMutedRef.current ? 0 : previewVolumeRef.current;
        audio.onerror = () => {
          audio.onerror = null;
          requestFromBat();
        };
        audio.play().then(() => {
          setIsPlayingPreview(true);
          setSuccess(`🎧 Reproduciendo en Deck CUE (Biblioteca): "${song.title}"`);
        }).catch(err => {
          console.warn("Fallo reproducción local directa, usando fallback BAT:", err);
          requestFromBat();
        });
        return;
      }
    }

    // Si la canción ya tiene una URL HTTP directa en la nube, usarla directamente
    if (song.url && (song.url.startsWith('http://') || song.url.startsWith('https://')) && !song.url.includes('/api/local-audio')) {
      if (audioRef.current) {
        audioRef.current.src = song.url;
        audioRef.current.currentTime = 0;
        audioRef.current.muted = isPreviewMutedRef.current;
        audioRef.current.volume = isPreviewMutedRef.current ? 0 : previewVolumeRef.current;
        audioRef.current.play().catch(() => {});
        setIsPlayingPreview(true);
        setSuccess(`🎧 Reproduciendo en Deck CUE: "${song.title}"`);
        return;
      }
    }

    await requestFromBat();
  };

  // --- CONTROLES DE CABECERA DE LA BIBLIOTECA (PLAY / PAUSE EXCLUSIVO DE LA BIBLIOTECA) ---
  const handleToggleLibraryPreview = () => {
    const audio = audioRef.current;
    if (isPlayingPreview && audio && !audio.paused) {
      audio.pause();
      userStartedPreviewRef.current = false;
      setIsPlayingPreview(false);
      setSuccess("⏸ Deck CUE (Biblioteca) en pausa.");
      return;
    }
    if (previewTrack && audio && audio.src) {
      userStartedPreviewRef.current = true;
      audio.muted = isPreviewMutedRef.current;
      audio.volume = isPreviewMutedRef.current ? 0 : previewVolumeRef.current;
      audio.play().catch(() => {});
      setIsPlayingPreview(true);
      setBottomPlayerMode(prev => prev === 'live' ? 'split' : prev);
      setSuccess(`🎧 Reproduciendo en Deck CUE: "${previewTrack.title}"`);
      return;
    }
    const list = getActiveLibraryTrackList();
    if (list && list.length > 0) {
      handlePlayPreview(list[0], true);
    }
  };

  // Obtener la lista activa según la vista (álbum abierto o lista filtrada)
  const getActiveLibraryTrackList = () => {
    if (expandedLibraryAlbum) {
      const alb = (batCatalog || []).find(a => (a.folderName || a.albumName) === expandedLibraryAlbum);
      if (alb && alb.tracks && alb.tracks.length > 0) {
        return alb.tracks.map(t => ({
          ...t,
          folderName: alb.folderName,
          album: alb.albumName || t.album,
          artist: t.artist || alb.artist,
          albumArtist: alb.artist,
          cover: t.cover || alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'
        }));
      }
    }
    if (filteredLibraryTracks && filteredLibraryTracks.length > 0) {
      return filteredLibraryTracks;
    }
    return libraryTracks;
  };

  const playNextPreview = () => {
    const list = getActiveLibraryTrackList();
    if (!list || list.length === 0) return;

    if (isLibraryShuffleRef.current || isLibraryShuffle) {
      handleRandomLibraryPreview();
      return;
    }

    if (!previewTrack) {
      handlePlayPreview(list[0], true);
      return;
    }

    const currIdx = list.findIndex(t => 
      (previewTrack.id && t.id && String(previewTrack.id) === String(t.id)) ||
      (previewTrack.fileName && t.fileName && previewTrack.fileName === t.fileName) ||
      (previewTrack.title && t.title && previewTrack.title.trim().toLowerCase() === t.title.trim().toLowerCase())
    );

    const nextIdx = currIdx >= 0 ? (currIdx + 1) % list.length : 0;
    const nextTrack = list[nextIdx];
    if (nextTrack) {
      handlePlayPreview(nextTrack, true);
    }
  };

  const playPrevPreview = () => {
    const list = getActiveLibraryTrackList();
    if (!list || list.length === 0) return;

    if (!previewTrack) {
      handlePlayPreview(list[0], true);
      return;
    }

    const currIdx = list.findIndex(t => 
      (previewTrack.id && t.id && String(previewTrack.id) === String(t.id)) ||
      (previewTrack.fileName && t.fileName && previewTrack.fileName === t.fileName) ||
      (previewTrack.title && t.title && previewTrack.title.trim().toLowerCase() === t.title.trim().toLowerCase())
    );

    const prevIdx = currIdx > 0 ? currIdx - 1 : (currIdx === 0 ? list.length - 1 : 0);
    const prevTrack = list[prevIdx];
    if (prevTrack) {
      handlePlayPreview(prevTrack, true);
    }
  };

  const handleNextLibraryPreview = playNextPreview;
  const handlePrevLibraryPreview = playPrevPreview;

  const handleRandomLibraryPreview = () => {
    const list = getActiveLibraryTrackList();
    if (!list || list.length === 0) return;
    if (list.length === 1) {
      handlePlayPreview(list[0], true);
      return;
    }
    let randomIdx;
    let attempts = 0;
    do {
      randomIdx = Math.floor(Math.random() * list.length);
      attempts++;
    } while (attempts < 10 && list[randomIdx]?.title === previewTrack?.title);
    handlePlayPreview(list[randomIdx], true);
  };

  const handleToggleLibraryShuffle = () => {
    const nextVal = !isLibraryShuffle;
    setIsLibraryShuffle(nextVal);
    isLibraryShuffleRef.current = nextVal;
    if (nextVal) {
      setSuccess("🔀 Modo aleatorio ACTIVADO en Biblioteca");
      if (!isPlayingPreview || !previewTrack) {
        handleRandomLibraryPreview();
      }
    } else {
      setSuccess("⏹ Modo aleatorio DESACTIVADO en Biblioteca (Secuencial)");
    }
  };

  // --- CONTROLES DE CABECERA DE LA COLA (AL AIRE EN RADIO PROYECTO) ---
  // Switch Maestro ON AIR: Prender / Apagar la emisión de la cola en Radio Proyecto
  // Switch Maestro ON AIR / OFF AIR: Autoriza o determina si se está mandando la señal a los receptores de Proyecto Radio
  const handleToggleOnAirSwitch = async () => {
    try {
      const isCurrentlyAir = onAirTrack?.tab !== 'OFF_AIR';
      const nextTab = isCurrentlyAir ? 'OFF_AIR' : 'ON_AIR';

      setOnAirTrack(prev => ({
        ...(prev || {}),
        tab: nextTab
      }));

      await supabase.from('radio_current_play').update({
        tab: nextTab
      }).eq('id', 1);

      if (nextTab === 'ON_AIR') {
        setSuccess("🟢 Switch ON AIR activado: Emisión autorizada para oyentes de Proyecto Radio.");
      } else {
        setSuccess("⚫ Switch OFF AIR: Emisión desautorizada. Oyentes de Proyecto Radio silenciados.");
      }
    } catch (e) {
      setError("Error switch ON AIR: " + e.message);
    }
  };

  // Control de salto temporal (Seek) en la transmisión al aire
  const handleSeekAir = async (newTime) => {
    const airAudio = masterAirAudioRef.current;
    if (!airAudio) return;

    airAudio.currentTime = newTime;
    setAirTime(newTime);

    // Ajustamos updated_at para que Date.now() - updated_at sea permanentemente newTime segundos
    const newStartedAt = new Date(Date.now() - newTime * 1000).toISOString();

    setOnAirTrack(prev => ({
      ...(prev || {}),
      updated_at: newStartedAt
    }));

    try {
      await supabase.from('radio_current_play').update({
        updated_at: newStartedAt
      }).eq('id', 1);
    } catch (e) {
      console.warn("Error guardando seek en Supabase:", e.message);
    }

    try {
      if (liveTimeBcRef.current) {
        liveTimeBcRef.current.postMessage({
          type: 'LIVE_TICK',
          currentTime: newTime,
          timestamp: Date.now(),
          url: airAudio.src,
          isForceSeek: true
        });
      }
      await sendRemoteCommand({
        type: 'SEEK_TO',
        targetClientId: 'all',
        payload: { time: newTime, startedAt: newStartedAt }
      });
    } catch (e) {}
  };

  // Emitir inmediatamente una pista de la cola al aire (Deck Rojo)
  const handlePlayAirSong = async (song) => {
    if (!song) return;
    setBottomPlayerMode(prev => prev === 'preview' ? 'split' : prev);
    try {
      // 1. Pausar y limpiar audio anterior del Deck Rojo inmediatamente (sin tocar el Deck Azul)
      const airAudio = masterAirAudioRef.current;
      if (airAudio) {
        airAudio.pause();
        airAudio.currentTime = 0;
        airAudio.removeAttribute('src');
        airAudio.load();
      }

      // Resolver URL de audio local o pública para el monitor de cabina (Deck Rojo)
      const directAudioUrl = getPreviewAudioUrl(song) || (song.url && (song.url.startsWith('http://') || song.url.startsWith('https://')) ? song.url : '');
      // IMPORTANTE: Para Supabase (y celulares remotos), SOLO enviar station_url si es una URL HTTP/HTTPS pública real (NUNCA /api/local-audio)
      const isPublicCloudUrl = Boolean(
        directAudioUrl &&
        (directAudioUrl.startsWith('http://') || directAudioUrl.startsWith('https://')) &&
        !directAudioUrl.includes('/api/local-audio') &&
        !directAudioUrl.includes('localhost') &&
        !directAudioUrl.includes('127.0.0.1')
      );

      lastAirTrackNameRef.current = song.title;

      setOnAirTrack(prev => ({
        ...(prev || {}),
        station_name: song.title,
        station_artist: song.artist || 'Radio Café',
        station_cover: song.cover || '',
        station_url: isPublicCloudUrl ? directAudioUrl : (prev?.station_url || ''),
        tab: 'supabase',
        is_playing: true,
        updated_at: new Date().toISOString()
      }));

      // Activar Deck Rojo en cabina inmediatamente
      setIsPlayingLiveSignal(true);
      isPlayingLiveSignalRef.current = true;

      if (airAudio && directAudioUrl && (directAudioUrl.startsWith('http://') || directAudioUrl.startsWith('https://') || directAudioUrl.startsWith('/api/local-audio'))) {
        airAudio.src = directAudioUrl;
        airAudio.muted = isAirMutedRef.current || airVolumeRef.current === 0;
        airAudio.volume = isAirMutedRef.current ? 0 : airVolumeRef.current;
        airAudio.play().catch(() => {});
      }

      // 2. Notificar inmediatamente al transmisor .bat y a Supabase
      // Si el archivo es local, enviamos station_url: '' con REQUEST: para que el .bat lo suba a Supabase Storage y publique el enlace HTTPS para celulares
      let fileInfo = song.fileName || song.filePath || '';
      if (!fileInfo && song.url && song.url.startsWith('local://')) {
        fileInfo = decodeURIComponent(song.url.replace('local://', ''));
      }
      await supabase.from('radio_current_play').update({
        station_name: song.title,
        station_artist: `REQUEST:${song.title}||${song.artist || ''}||${fileInfo}`,
        station_cover: song.cover || '',
        station_url: isPublicCloudUrl ? directAudioUrl : '',
        tab: 'supabase',
        is_playing: true,
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      // Reiniciar reloj local a 0s
      setAirTime(0);

      // Notificar reinicio de tiempo a 0s a todos los oyentes de Proyecto Radio
      try {
        await sendRemoteCommand({
          type: 'SEEK_TO',
          targetClientId: 'all',
          payload: { time: 0, title: song.title, artist: song.artist }
        });
      } catch (e) {}

      setSuccess(`📻 Al aire en Deck Rojo: "${song.title}"`);
    } catch (e) {
      setError("Error emitiendo canción: " + e.message);
    }
  };

  const handleAirPrev = async () => {
    const airAudio = masterAirAudioRef.current;
    if (airAudio && airAudio.currentTime > 3) {
      await handleSeekAir(0);
      return;
    }
    if (airAudio) {
      airAudio.pause();
      airAudio.currentTime = 0;
      airAudio.removeAttribute('src');
      airAudio.load();
    }
    if (songs.length === 0) return;
    try {
      let currentIdx = songs.findIndex(s => 
        s.title === onAirTrack?.station_name || 
        (onAirTrack?.station_name && s.title && onAirTrack.station_name.toLowerCase().includes(s.title.toLowerCase())) ||
        (onAirTrack?.station_name && s.title && s.title.toLowerCase().includes(onAirTrack.station_name.toLowerCase()))
      );
      if (currentIdx === -1) currentIdx = 0;
      const prevIdx = (currentIdx - 1 + songs.length) % songs.length;
      const prevSong = songs[prevIdx];

      await handlePlayAirSong(prevSong);
      setSuccess(`⏮ Al aire: "${prevSong.title}" - ${prevSong.artist || 'Radio Café'}`);
    } catch (e) {
      setError("Error retrocediendo canción: " + e.message);
    }
  };

  // BOTÓN: Escuchar la señal que está saliendo al aire en vivo
  const handleToggleListenLive = async () => {
    const airAudio = masterAirAudioRef.current;
    if (!airAudio) return;

    // Si ya estamos escuchando la señal en cabina, simplemente silenciar el monitor (la radio sigue de fondo)
    if (isPlayingLiveSignal && !airAudio.paused) {
      airAudio.pause();
      airAudio.muted = true;
      setIsPlayingLiveSignal(false);
      setSuccess("🔇 Monitor de cabina silenciado (la emisión sigue activa al aire).");
      return;
    }

    const currentSong = songs.find(s => 
      s.title === onAirTrack?.station_name || 
      (onAirTrack?.station_name && s.title && onAirTrack.station_name.toLowerCase().includes(s.title.toLowerCase()))
    ) || songs[0];

    const liveUrl = (onAirTrack?.station_url && onAirTrack.station_url.startsWith('http'))
      ? onAirTrack.station_url
      : (currentSong ? getPreviewAudioUrl(currentSong) : null);

    if (!liveUrl) {
      setError("No hay señal al aire disponible aún. Inicia el transmisor .bat.");
      return;
    }

    try {
      if (airAudio.src !== liveUrl) {
        airAudio.src = liveUrl;
        airAudio.load();
      }
      airAudio.muted = false;
      airAudio.volume = isAirMuted ? 0 : airVolume;
      await airAudio.play();
      setIsPlayingLiveSignal(true);
      isPlayingLiveSignalRef.current = true;
      setSuccess(`📻 🔊 Monitor de cabina activado: escuchando "${onAirTrack?.station_name || currentSong?.title || 'Radio al Aire'}"`);
    } catch (err) {
      setError("No se pudo activar el monitor en vivo: " + err.message);
      setIsPlayingLiveSignal(false);
      isPlayingLiveSignalRef.current = false;
    }
  };

  // Control PLAY / PAUSA del Deck Rojo (Monitor de Cabina): Pausa o reanuda la escucha local en Radio Manager de forma independiente al Deck Azul
  const handleAirPlayPause = async () => {
    const airAudio = masterAirAudioRef.current;
    if (!airAudio) return;

    if (isPlayingLiveSignal && !airAudio.paused) {
      airAudio.pause();
      setIsPlayingLiveSignal(false);
      isPlayingLiveSignalRef.current = false;
      setSuccess("⏸ Deck Rojo (Monitor de Cola) en pausa (la emisión del .bat al aire continúa).");
    } else {
      const currentSong = songs.find(s => 
        s.title === onAirTrack?.station_name || 
        (onAirTrack?.station_name && s.title && onAirTrack.station_name.toLowerCase().includes(s.title.toLowerCase()))
      ) || songs[0];

      const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const liveUrl = (isLocal && currentSong ? getPreviewAudioUrl(currentSong) : null) ||
        ((onAirTrack?.station_url && onAirTrack.station_url.startsWith('http')) ? onAirTrack.station_url : null) ||
        (currentSong ? getPreviewAudioUrl(currentSong) : null);

      if (!liveUrl) {
        if (currentSong) {
          await handlePlayAirSong(currentSong);
          return;
        }
        setError("No hay canción en la cola al aire para reproducir.");
        return;
      }

      if (airAudio.src !== liveUrl && (!airAudio.src || !airAudio.src.endsWith(liveUrl))) {
        airAudio.src = liveUrl;
        airAudio.load();
      }
      airAudio.muted = isAirMutedRef.current || airVolumeRef.current === 0;
      airAudio.volume = isAirMutedRef.current ? 0 : airVolumeRef.current;
      try {
        await airAudio.play();
        setIsPlayingLiveSignal(true);
        isPlayingLiveSignalRef.current = true;
        setBottomPlayerMode(prev => prev === 'preview' ? 'split' : prev);
        setSuccess(`▶ Deck Rojo reproduciendo: "${onAirTrack?.station_name || currentSong?.title || 'Cola al Aire'}"`);
      } catch (e) {
        setError("Error al reproducir Deck Rojo: " + e.message);
      }
    }
  };

  const handleAirNext = async () => {
    if (isAdvancingAirRef.current) return;
    isAdvancingAirRef.current = true;
    setTimeout(() => { isAdvancingAirRef.current = false; }, 2500);

    const airAudio = masterAirAudioRef.current;
    if (airAudio) {
      airAudio.pause();
      airAudio.currentTime = 0;
      airAudio.removeAttribute('src');
      airAudio.load();
    }

    if (songs.length === 0) {
      setError("No hay canciones en la cola de emisión para avanzar.");
      return;
    }
    try {
      let currentIdx = songs.findIndex(s => 
        s.title === onAirTrack?.station_name || 
        (onAirTrack?.station_name && s.title && onAirTrack.station_name.toLowerCase().includes(s.title.toLowerCase())) ||
        (onAirTrack?.station_name && s.title && s.title.toLowerCase().includes(onAirTrack.station_name.toLowerCase()))
      );
      if (currentIdx === -1) currentIdx = 0;

      let nextIdx;
      if ((isAirShuffleRef.current || isAirShuffle) && songs.length > 1) {
        let attempts = 0;
        do {
          nextIdx = Math.floor(Math.random() * songs.length);
          attempts++;
        } while (attempts < 10 && nextIdx === currentIdx);
      } else {
        nextIdx = (currentIdx + 1) % songs.length;
      }

      const nextSong = songs[nextIdx];

      await handlePlayAirSong(nextSong);
      setSuccess(`⏭ Al aire (${(isAirShuffleRef.current || isAirShuffle) ? 'Aleatorio' : 'Siguiente'}): "${nextSong.title}" - ${nextSong.artist || 'Radio Café'}`);
    } catch (e) {
      setError("Error saltando canción: " + e.message);
    }
  };

  const handleToggleAirShuffle = async () => {
    const nextVal = !isAirShuffle;
    setIsAirShuffle(nextVal);
    isAirShuffleRef.current = nextVal;
    if (nextVal) {
      setSuccess("🔀 Modo aleatorio ACTIVADO en Cola de Emisión");
      if (songs.length === 0 && batCatalog && batCatalog.length > 0) {
        await handleGoRandom(15);
      }
    } else {
      setSuccess("⏹ Modo aleatorio DESACTIVADO en Cola de Emisión (Secuencial)");
    }
  };

  const handleAirShuffle = handleToggleAirShuffle;

  const handleQueueDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'copy';
    } catch (err) {}
    setIsDraggingOverQueue(true);
  };

  const handleQueueDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOverQueue(false);
    }
  };

  const handleQueueDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverQueue(false);

    let trackToInsert = draggedLibraryTrackRef.current;
    if (!trackToInsert) {
      try {
        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
        if (raw) trackToInsert = JSON.parse(raw);
      } catch (err) {}
    }

    if (trackToInsert) {
      draggedLibraryTrackRef.current = null;
      await handleAddTrackToQueue(trackToInsert);
    }
  };

  // Añadir pista a la cola de emisión: se coloca abajo al final de la lista, NO altera el orden ni interrumpe la emisión actual
  const handleAddTrackToQueue = async (track) => {
    if (!track) return;
    try {
      // 1. Obtener el orden máximo actual para asegurar que quede al final estricto
      const maxOrder = songs.reduce((max, s) => Math.max(max, Number(s.order_index) ?? -1), -1);
      const nextIndex = maxOrder + 1;

      const cleanTrack = {
        title: track.title,
        artist: track.artist || track.albumArtist || 'Radio Café',
        album: track.album || 'Sencillo',
        url: track.url || `local://${encodeURIComponent(track.fileName || track.title)}`,
        duration: track.duration || 210,
        cover: track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        order_index: nextIndex
      };
      
      const { data, error } = await supabase.from('playlist_radio').insert([cleanTrack]).select();
      if (error) throw error;

      const inserted = data?.[0] || { ...cleanTrack, id: `queue-${Date.now()}` };

      // 2. Colocar al final abajo de la lista de RadioManager
      setSongs(prev => [...prev, inserted]);

      // 3. Notificar inmediatamente a Proyecto Radio para actualizar la lista en tiempo real
      await notifyPlaylistUpdate();

      setSuccess(`➕ Canción "${track.title}" añadida al final de la cola (sonará en su turno).`);
    } catch (e) {
      setError("Error al añadir canción a la cola: " + e.message);
    }
  };

  const handlePutAlbumOnAir = async (folderName) => {
    const albumItem = (batCatalog || []).find(a => a.folderName === folderName || a.albumName === folderName) || batCatalog[0];
    if (!albumItem) return;
    setIsUpdatingAirList(true);
    try {
      const { data: currentRows } = await supabase.from('playlist_radio').select('id');
      if (currentRows && currentRows.length > 0) {
        await supabase.from('playlist_radio').delete().in('id', currentRows.map(r => r.id));
      }
      const defaultCover = albumItem.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400';
      const tracksToInsert = (albumItem.tracks || []).map((t, idx) => ({
        title: t.title,
        artist: t.artist || albumItem.artist || 'Radio Café',
        album: albumItem.albumName,
        url: `local://${encodeURIComponent(t.fileName)}`,
        duration: t.duration || 210,
        cover: t.cover || defaultCover,
        genre: t.genre || albumItem.genre || 'Radio',
        year: t.year || albumItem.year || '2024',
        order_index: idx
      }));
      const { data: insData, error: insErr } = await supabase.from('playlist_radio').insert(tracksToInsert).select();
      if (insErr) throw insErr;

      const newSongs = insData || tracksToInsert;
      setSongs(newSongs);

      // Notificar a Proyecto Radio
      await notifyPlaylistUpdate();

      if (newSongs.length > 0) {
        setBottomPlayerMode('live');
        await handlePlayAirSong(newSongs[0]);
      }

      setSuccess(`📻 ¡Álbum "${albumItem.albumName}" cargado en la cola al aire (${newSongs.length} pistas)!`);
    } catch (err) {
      setError("Error al poner álbum: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const handleGoRandom = async (count = 15) => {
    if (!batCatalog || batCatalog.length === 0) {
      setError("Primero inicia el .bat para cargar la biblioteca y armar la cola aleatoria.");
      return;
    }
    setIsUpdatingAirList(true);
    try {
      const allTracks = [];
      batCatalog.forEach(alb => {
        (alb.tracks || []).forEach(t => {
          allTracks.push({ ...t, albumArtist: alb.artist, albumCover: alb.cover });
        });
      });
      if (allTracks.length === 0) return;
      const shuffled = [...allTracks].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      const { data: currentRows } = await supabase.from('playlist_radio').select('id');
      if (currentRows && currentRows.length > 0) {
        await supabase.from('playlist_radio').delete().in('id', currentRows.map(r => r.id));
      }
      const tracksToInsert = selected.map((t, idx) => ({
        title: t.title,
        artist: t.artist || t.albumArtist || 'Radio Café',
        album: t.album || 'Mix Aleatorio',
        url: `local://${encodeURIComponent(t.fileName)}`,
        duration: t.duration || 210,
        cover: t.cover || t.albumCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        order_index: idx
      }));
      const { data: insData } = await supabase.from('playlist_radio').insert(tracksToInsert).select();
      const newSongs = insData || tracksToInsert;
      setSongs(newSongs);

      await notifyPlaylistUpdate();

      if (newSongs.length > 0) {
        setBottomPlayerMode('live');
        await handlePlayAirSong(newSongs[0]);
      }

      setSuccess(`🔀 ¡Cola aleatoria de ${selected.length} canciones cargada y transmitiendo al aire!`);
    } catch (err) {
      setError("Error generando cola: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const handleShuffleAirList = async () => {
    if (songs.length <= 1) return;
    setIsUpdatingAirList(true);
    try {
      const shuffled = [...songs].sort(() => 0.5 - Math.random());
      await Promise.all(
        shuffled.map((item, i) =>
          supabase.from('playlist_radio').update({ order_index: i }).eq('id', item.id)
        )
      );
      setSongs(shuffled);
      await notifyPlaylistUpdate();
      setSuccess("🔀 ¡Cola de reproducción mezclada aleatoriamente!");
    } catch (err) {
      setError("Error al mezclar cola: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const handleMoveAirTrack = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= songs.length) return;
    try {
      const newSongs = [...songs];
      const itemToMove = newSongs[index];
      newSongs.splice(index, 1);
      newSongs.splice(targetIndex, 0, itemToMove);

      // Re-indexar limpiamente de 0 a N-1 para evitar cualquier colisión o reversión
      const reindexed = newSongs.map((s, idx) => ({ ...s, order_index: idx }));
      setSongs(reindexed);

      // Persistir cada nuevo order_index en Supabase
      await Promise.all(
        reindexed.map(s => 
          supabase.from('playlist_radio').update({ order_index: s.order_index }).eq('id', s.id)
        )
      );

      // Notificar a Proyecto Radio por BroadcastChannel
      try {
        const bc = new BroadcastChannel('radio-playlist-channel');
        bc.postMessage({ type: 'PLAYLIST_UPDATED', timestamp: Date.now() });
        bc.close();
      } catch (e) {}

      // Notificar a Proyecto Radio por comando remoto
      await sendRemoteCommand({
        type: 'PLAYLIST_UPDATED',
        targetClientId: 'all'
      });
    } catch (err) {
      console.error("Error al mover pista:", err);
      fetchSongs();
    }
  };

  const handleRemoveAirTrack = async (songId) => {
    try {
      setSongs(prev => prev.filter(s => s.id !== songId));
      await supabase.from('playlist_radio').delete().eq('id', songId);

      // Notificar a Proyecto Radio instantáneamente por BroadcastChannel y comando remoto
      try {
        const bc = new BroadcastChannel('radio-playlist-channel');
        bc.postMessage({ type: 'PLAYLIST_TRACK_REMOVED', deletedId: songId, timestamp: Date.now() });
        bc.close();
      } catch (e) {}

      await sendRemoteCommand({
        type: 'PLAYLIST_TRACK_REMOVED',
        targetClientId: 'all',
        payload: { deletedId: songId }
      });

      setSuccess("Pista quitada de la cola de emisión y actualizada en Proyecto Radio.");
    } catch (err) {
      setError("Error al quitar pista: " + err.message);
    }
  };

  const handleClearQueue = async () => {
    if (!window.confirm("¿Seguro que deseas vaciar la cola de reproducción al aire? La emisión en el Bat y en la web se pausará.")) return;
    try {
      const { data: currentRows } = await supabase.from('playlist_radio').select('id');
      if (currentRows && currentRows.length > 0) {
        await supabase.from('playlist_radio').delete().in('id', currentRows.map(r => r.id));
      }
      await supabase.from('radio_current_play').update({
        is_playing: false,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSongs([]);

      try {
        const bc = new BroadcastChannel('radio-playlist-channel');
        bc.postMessage({ type: 'PLAYLIST_CLEARED', timestamp: Date.now() });
        bc.close();
      } catch (e) {}

      await sendRemoteCommand({
        type: 'PLAYLIST_CLEARED',
        targetClientId: 'all'
      });

      setSuccess("Cola de reproducción vaciada y actualizada en Proyecto Radio.");
    } catch (e) {
      setError("Error al vaciar cola: " + e.message);
    }
  };

  const handleSyncWithBat = async () => {
    setIsUpdatingAirList(true);
    try {
      // Solicitar al .bat en vivo que re-escanee la carpeta y actualice la BD
      try {
        await supabase.from('radio_current_play').update({ tab: 'RESCAN_CATALOG' }).eq('id', 1);
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {}

      const { data } = await supabase.from('radio_current_play').select('*').eq('id', 1).single();
      if (data) {
        checkBatHeartbeat(data);
      }
      await fetchBatCatalog(false, data?.tyranny_settings?.catalogUrl || null);
      await fetchSongs();
      setSuccess("🔄 ¡Catálogo dinámico del .bat y cola sincronizados correctamente!");
    } catch (err) {
      setError("Error al sincronizar: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

    // Guardar Enlace YouTube
  const handleSaveYoutubeLink = async (e) => {
    e.preventDefault();
    if (!ytForm.youtubeUrl || !ytForm.title) return;

    const ytId = extractYoutubeId(ytForm.youtubeUrl);
    const listId = extractPlaylistId(ytForm.youtubeUrl);
    if (!ytId) {
      setError("Por favor ingresa una URL válida de YouTube.");
      return;
    }

    const coverUrl = getYoutubeThumbnail(ytId);
    const insertPayload = {
      title: ytForm.title.trim(),
      artist: ytForm.artist?.trim() || 'YouTube',
      youtube_url: ytForm.youtubeUrl.trim(),
      youtube_id: ytId,
      list_id: listId,
      cover: coverUrl,
      category: ytForm.category || 'Lofi & Chill',
      order_index: ytForm.id ? (ytForm.order_index ?? 0) : youtubeSongs.length
    };

    try {
      if (ytForm.id) {
        const numId = !isNaN(Number(ytForm.id)) ? Number(ytForm.id) : ytForm.id;
        let { error: errUpdate } = await supabase
          .from('playlist_youtube')
          .update(insertPayload)
          .eq('id', numId);

        if (errUpdate) {
          await supabase.from('playlist_youtube').update(insertPayload).eq('id', String(ytForm.id));
        }

        setYoutubeSongs(prev => prev.map(item => String(item.id) === String(ytForm.id) ? { ...item, ...insertPayload, youtubeId: ytId, url: `https://www.youtube.com/watch?v=${ytId}` } : item));
        setSuccess("Propiedades del video de YouTube actualizadas.");
      } else {
        let insertedItem = null;
        let dbError = null;

        const resFull = await supabase
          .from('playlist_youtube')
          .insert([insertPayload])
          .select();

        if (!resFull.error && resFull.data?.[0]) {
          insertedItem = resFull.data[0];
        } else {
          dbError = resFull.error;
          const minimalPayload = {
            title: insertPayload.title,
            youtube_url: insertPayload.youtube_url,
            youtube_id: insertPayload.youtube_id
          };
          const resMin = await supabase
            .from('playlist_youtube')
            .insert([minimalPayload])
            .select();

          if (!resMin.error && resMin.data?.[0]) {
            insertedItem = { ...resMin.data[0], ...insertPayload };
            dbError = null;
          }
        }

        const newTrack = {
          ...insertPayload,
          id: insertedItem?.id ? String(insertedItem.id) : `yt-${Date.now()}`,
          youtubeId: ytId,
          url: `https://www.youtube.com/watch?v=${ytId}`
        };

        setYoutubeSongs(prev => [...prev, newTrack]);

        if (dbError) {
          setSuccess(`Video agregado localmente. Nota de Supabase: ${dbError.message || 'Verifica las Políticas RLS'}`);
        } else {
          setSuccess("¡Video de YouTube agregado correctamente a Supabase!");
        }
      }

      setYtForm({ id: null, title: '', artist: '', youtubeUrl: '', category: 'Lofi & Chill' });
      setIsEditingYt(false);
      setIsCustomCategory(false);
      setError(null);
    } catch (err) {
      console.error("Error guardando enlace de YouTube:", err);
      setError("Error al guardar enlace de YouTube: " + err.message);
    }
  };

  const handleEditYoutubeClick = (track) => {
    setYtForm({
      id: track.id,
      title: track.title,
      artist: track.artist || '',
      youtubeUrl: track.youtube_url || track.url || `https://www.youtube.com/watch?v=${track.youtubeId}`,
      category: track.category || 'Lofi & Chill',
      order_index: track.order_index ?? 0
    });
    setIsEditingYt(true);
    setIsCustomCategory(false);
  };

  const handleDeleteYoutubeLink = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este enlace de YouTube?")) return;
    try {
      setYoutubeSongs(prev => prev.filter(item => String(item.id) !== String(id)));

      const numId = !isNaN(Number(id)) ? Number(id) : id;
      let { error: delErr } = await supabase.from('playlist_youtube').delete().eq('id', numId);
      if (delErr) {
        await supabase.from('playlist_youtube').delete().eq('id', String(id));
      }

      setSuccess("Enlace de YouTube eliminado.");
    } catch (err) {
      console.error("Error al eliminar enlace de YouTube:", err);
      setError("Error eliminando enlace en Supabase: " + err.message);
    }
  };

  const moveYoutubeOrder = async (index, direction) => {
    const newItems = [...youtubeSongs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    newItems.forEach((item, idx) => {
      item.order_index = idx;
    });

    setYoutubeSongs(newItems);

    try {
      for (const item of newItems) {
        const numId = !isNaN(Number(item.id)) ? Number(item.id) : item.id;
        await supabase.from('playlist_youtube').update({ order_index: item.order_index }).eq('id', numId);
      }
    } catch (err) {}
  };

  // Subida Masiva de Archivos MP3 y Carpetas Completas
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processAndUploadFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    const files = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
        if (item) {
          traverseFileTree(item, files).then(() => {
            if (i === items.length - 1 && files.length > 0) {
              processAndUploadFiles(files);
            }
          });
        } else {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
    } else {
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      if (droppedFiles.length > 0) processAndUploadFiles(droppedFiles);
    }
  };

  const traverseFileTree = (item, filesArray) => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => {
          if (file.name.match(/\.(mp3|flac|wav|m4a|aac|ogg|webm)$/i)) {
            filesArray.push(file);
          }
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries((entries) => {
          const promises = [];
          for (let i = 0; i < entries.length; i++) {
            promises.push(traverseFileTree(entries[i], filesArray));
          }
          Promise.all(promises).then(resolve);
        });
      } else {
        resolve();
      }
    });
  };

  const processAndUploadFiles = async (filesList) => {
    const validAudioFiles = filesList.filter(f => f.name.match(/\.(mp3|flac|wav|m4a|aac|ogg|webm)$/i));
    if (validAudioFiles.length === 0) {
      setError("No se encontraron archivos de audio válidos.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadQueue(validAudioFiles);

    let addedCount = 0;
    let possibleBuckets = ['Radio', 'radio', 'radio_mp3', 'media', 'audio', 'public', 'music'];

    try {
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      if (existingBuckets && existingBuckets.length > 0) {
        possibleBuckets = Array.from(new Set([...existingBuckets.map(b => b.name), ...possibleBuckets]));
      }
    } catch (e) {}

    let failedDueToBucketNotFound = false;

    for (let i = 0; i < validAudioFiles.length; i++) {
      setUploadIndex(i + 1);
      setUploadPercent(0);

      const file = validAudioFiles[i];

      try {
        const meta = await parseAudioFileMetadata(file);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        let targetBucket = null;
        let finalUrl = null;

        let bucketsToTry = window._cachedRadioBucket 
          ? [window._cachedRadioBucket, ...possibleBuckets.filter(b => b !== window._cachedRadioBucket)] 
          : possibleBuckets;

        for (const bName of bucketsToTry) {
          try {
            const { success: upOk, bucket } = await uploadFileWithProgress(bName, filePath, file, (pct) => {
              setUploadPercent(pct);
            });
            if (upOk) {
              targetBucket = bucket;
              window._cachedRadioBucket = bucket;
              break;
            }
          } catch (err) {}
        }

        if (targetBucket) {
          const { data: publicUrlData } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(filePath);
          finalUrl = publicUrlData?.publicUrl;
        }

        if (!finalUrl) {
          finalUrl = meta.objectUrl || URL.createObjectURL(file);
          failedDueToBucketNotFound = true;
        }

        const nextOrder = songs.length + addedCount;
        let insertPayload = {
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          genre: meta.genre,
          year: meta.year,
          mood: meta.mood,
          url: finalUrl,
          duration: meta.duration || 180,
          order_index: nextOrder,
          cover: meta.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'
        };

        const cleanPayload = filterPayloadByKnownColumns(insertPayload);
        let { error: dbError } = await supabase.from('playlist_radio').insert([cleanPayload]);

        if (dbError) {
          const basePayload = {
            title: meta.title,
            artist: meta.artist,
            url: finalUrl,
            cover: insertPayload.cover
          };
          const retry = await supabase.from('playlist_radio').insert([basePayload]);
          if (retry.error) throw retry.error;
        }

        addedCount++;
      } catch (err) {
        console.error(`Error procesando ${file.name}:`, err);
      }
    }

    setIsUploading(false);
    setUploadQueue([]);

    if (addedCount > 0) {
      if (failedDueToBucketNotFound) {
        setSuccess(`¡Canciones agregadas a la Radio! Nota: Para almacenar los archivos físicamente en la nube de Supabase, ejecuta el script SQL de Políticas RLS para Storage.`);
      } else {
        setSuccess(`¡Proceso completado al 100%! Se agregaron ${addedCount} de ${validAudioFiles.length} canciones a Supabase.`);
      }
      fetchSongs();
    } else {
      setError("No se pudieron agregar las canciones. Por favor verifica la conexión con Supabase.");
    }
  };

  // Guardar Edición de Canción Individual
  const handleSaveEdit = async (songId, updatedData) => {
    try {
      setIsSavingEdit(true);
      setError(null);

      const cleanPayload = filterPayloadByKnownColumns(updatedData);

      let { error: dbError } = await supabase
        .from('playlist_radio')
        .update(cleanPayload)
        .eq('id', songId);

      if (dbError) {
        const baseData = {
          title: updatedData.title,
          artist: updatedData.artist,
          url: updatedData.url,
          cover: updatedData.cover
        };

        const retryBase = await supabase
          .from('playlist_radio')
          .update(baseData)
          .eq('id', songId);

        if (retryBase.error) throw retryBase.error;
      }

      setSuccess("Canción actualizada correctamente.");
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updatedData } : s));
      setEditingSong(null);
    } catch (err) {
      console.error("Error guardando edición:", err);
      setError("Error al guardar en Supabase: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Actualizar carátula para TODAS las canciones de un álbum en Supabase
  const handleUpdateAlbumCover = async (albumTarget, newCoverUrl) => {
    try {
      const trackIds = albumTarget.tracks.map(t => t.id);
      setSongs(prev => prev.map(s => trackIds.includes(s.id) ? { ...s, cover: newCoverUrl } : s));

      for (const songId of trackIds) {
        try {
          const cleanPayload = filterPayloadByKnownColumns({ cover: newCoverUrl });
          await supabase.from('playlist_radio').update(cleanPayload).eq('id', songId);
        } catch (e) {}
      }

      setSuccess(`¡Carátula actualizada para todas las ${trackIds.length} canciones del álbum "${albumTarget.albumName}"!`);
    } catch (err) {
      console.error("Error al actualizar carátula de álbum:", err);
      setError("Error actualizando carátula de álbum: " + err.message);
    }
  };

  // Editar metadatos del álbum completo (Título, Artista, Año, Género, Carátula) en React Modal
  const handleSaveAlbumModal = async (albumTarget, updatedFields) => {
    setIsSavingAlbum(true);
    try {
      const trackIds = albumTarget.tracks.map(t => t.id);
      setSongs(prev => prev.map(s => trackIds.includes(s.id) ? { 
        ...s, 
        album: updatedFields.albumName, 
        artist: updatedFields.artistName,
        year: updatedFields.year,
        genre: updatedFields.genre,
        mood: updatedFields.mood,
        cover: updatedFields.cover || s.cover
      } : s));

      for (const songId of trackIds) {
        try {
          const cleanPayload = filterPayloadByKnownColumns({ 
            album: updatedFields.albumName, 
            artist: updatedFields.artistName,
            year: updatedFields.year,
            genre: updatedFields.genre,
            mood: updatedFields.mood,
            cover: updatedFields.cover
          });
          await supabase.from('playlist_radio').update(cleanPayload).eq('id', songId);
        } catch (e) {}
      }

      setSuccess(`¡Álbum "${updatedFields.albumName}" actualizado correctamente (${trackIds.length} canciones)!`);
      setEditingAlbumTarget(null);
    } catch (err) {
      console.error("Error editando álbum:", err);
      setError("Error al guardar cambios del álbum: " + err.message);
    } finally {
      setIsSavingAlbum(false);
    }
  };

  // Eliminar Álbum completo y todas sus canciones de Supabase y estado local
  const handleDeleteAlbum = async (albumTarget) => {
    if (!albumTarget || !albumTarget.tracks) return;
    
    const trackCount = albumTarget.tracks.length;
    const confirmMessage = `¿Estás seguro de eliminar el álbum "${albumTarget.albumName}"?\nSe eliminarán las ${trackCount} canciones pertenecientes a este álbum.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const trackIds = albumTarget.tracks.map(t => t.id);
      
      const numIds = trackIds.filter(id => !String(id).startsWith('local-') && !String(id).startsWith('album-track-'));
      if (numIds.length > 0) {
        let { error: delErr } = await supabase.from('playlist_radio').delete().in('id', numIds);
        if (delErr) {
          for (const id of numIds) {
            await supabase.from('playlist_radio').delete().eq('id', id);
          }
        }
      }

      setSongs(prev => prev.filter(s => !trackIds.includes(s.id)));
      setSuccess(`¡El álbum "${albumTarget.albumName}" y sus ${trackCount} canciones fueron eliminados correctamente!`);
      if (editingAlbumTarget?.albumName === albumTarget.albumName) {
        setEditingAlbumTarget(null);
      }
    } catch (err) {
      console.error("Error al eliminar el álbum:", err);
      setError("Error al eliminar el álbum: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Importación Masiva y de Playlists de YouTube a Supabase con filtro de no repetición
  const handleBulkImportYoutube = async (itemsToInsert) => {
    try {
      // Descartar repeticiones contra las canciones ya existentes en Supabase
      const nonDuplicates = itemsToInsert.filter(item => {
        const itemTitle = (item.title || '').trim().toLowerCase();
        const itemVid = item.videoId || extractYoutubeId(item.url);
        const itemUrl = item.url || '';

        return !youtubeSongs.some(existing => {
          const exId = existing.youtube_id || existing.videoId || extractYoutubeId(existing.youtube_url || existing.url);
          const exTitle = (existing.title || '').trim().toLowerCase();
          const exUrl = existing.youtube_url || existing.url;

          if (itemVid && exId && itemVid === exId) return true;
          if (itemUrl && exUrl && itemUrl === exUrl) return true;
          if (itemTitle && exTitle && itemTitle.length > 3 && itemTitle === exTitle) return true;
          return false;
        });
      });

      if (nonDuplicates.length === 0) {
        setInfo("Todas las canciones seleccionadas ya existen en tu biblioteca de YouTube. Se omitieron para evitar repeticiones.");
        return;
      }

      const newEntries = nonDuplicates.map((item, idx) => ({
        title: item.title.trim(),
        artist: item.artist?.trim() || 'YouTube',
        youtube_url: item.url,
        youtube_id: item.videoId,
        cover: item.cover,
        category: item.category || 'Lofi & Chill',
        order_index: youtubeSongs.length + idx
      }));

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('playlist_youtube')
        .insert(newEntries)
        .select();

      if (error) {
        console.warn("Falló inserción directa completa de YouTube, intentando payload mínimo:", error.message);
        const minimalEntries = newEntries.map(e => ({
          title: e.title,
          youtube_url: e.youtube_url,
          youtube_id: e.youtube_id
        }));
        await supabase.from('playlist_youtube').insert(minimalEntries);
      }

      await fetchYoutubeSongs();
      setSuccess(`¡${nonDuplicates.length} canciones/videos agregados exitosamente a la Radio desde YouTube!`);
    } catch (err) {
      console.error("Error en importación masiva de YouTube:", err);
      setError("No se pudieron agregar los videos masivamente: " + err.message);
    }
  };

  // Reordenar mediante HTML5 Drag & Drop
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const startIndex = dragItem.current;
    const endIndex = dragOverItem.current;

    if (startIndex === endIndex) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const reordered = [...songs];
    const [moved] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, moved);

    const updated = reordered.map((item, idx) => ({ ...item, order_index: idx }));
    setSongs(updated);

    dragItem.current = null;
    dragOverItem.current = null;

    try {
      for (const item of updated) {
        try {
          const clean = filterPayloadByKnownColumns({ order_index: item.order_index });
          await supabase.from('playlist_radio').update(clean).eq('id', item.id);
        } catch (e) {}
      }
    } catch (err) {}
  };

  const handleDeleteSong = async (id, fileUrl) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta canción?")) return;
    try {
      setSongs(prev => prev.filter(s => String(s.id) !== String(id)));

      const numId = !isNaN(Number(id)) ? Number(id) : id;
      let { error: dbError } = await supabase.from('playlist_radio').delete().eq('id', numId);
      if (dbError) {
        await supabase.from('playlist_radio').delete().eq('id', String(id));
      }

      if (fileUrl && fileUrl.includes('storage')) {
        const parts = fileUrl.split('/');
        const fileName = parts[parts.length - 1];
        try {
          await supabase.storage.from('Radio').remove([fileName]);
        } catch (e) {}
      }

      setSuccess("Canción eliminada correctamente.");
    } catch (err) {
      setError("Error al eliminar: " + err.message);
    }
  };

  // Selección múltiple
  const toggleSelectSong = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSongs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSongs.map(s => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Seguro que deseas eliminar ${selectedIds.length} canciones seleccionadas?`)) return;

    try {
      for (const id of selectedIds) {
        await supabase.from('playlist_radio').delete().eq('id', id);
      }
      setSongs(prev => prev.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      setSuccess(`Se eliminaron ${selectedIds.length} canciones.`);
    } catch (err) {
      setError("Error en eliminación en lote: " + err.message);
    }
  };

  const handleBulkSetField = async (field, promptMsg) => {
    if (selectedIds.length === 0) return;
    const value = window.prompt(promptMsg);
    if (!value) return;

    try {
      for (const id of selectedIds) {
        try {
          const clean = filterPayloadByKnownColumns({ [field]: value });
          await supabase.from('playlist_radio').update(clean).eq('id', id);
        } catch (e) {}
      }
      setSongs(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, [field]: value } : s));
      setSuccess(`Se actualizó ${field} en ${selectedIds.length} canciones.`);
    } catch (err) {
      setError("Error actualizando en lote: " + err.message);
    }
  };

  // Filtrado y Ordenación de Lista
  const filteredSongs = songs.filter(song => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (song.title && song.title.toLowerCase().includes(q)) ||
      (song.artist && song.artist.toLowerCase().includes(q)) ||
      (song.album && song.album.toLowerCase().includes(q)) ||
      (song.genre && song.genre.toLowerCase().includes(q)) ||
      (song.mood && song.mood.toLowerCase().includes(q)) ||
      (song.year && song.year.toString().includes(q))
    );
  }).sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'order') {
      valA = a.order_index ?? 0;
      valB = b.order_index ?? 0;
    }

    if (typeof valA === 'string') return valA.localeCompare(valB || '');
    return (valA || 0) - (valB || 0);
  });

  // Agrupamiento dinámico según pestaña activa
  const groupedSongs = useMemo(() => {
    if (activeTab === 'all') return [{ title: 'Todas las Canciones', songs: filteredSongs }];

    const map = new Map();
    filteredSongs.forEach(song => {
      let key = 'Sin clasificar';
      if (activeTab === 'genre') key = song.genre || 'General';
      if (activeTab === 'artist') key = song.artist || 'Artista Desconocido';
      if (activeTab === 'album') key = song.album || 'Sencillo';
      if (activeTab === 'year') key = song.year || 'Sin Año';
      if (activeTab === 'mood') key = song.mood || 'Chill';

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(song);
    });

    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      songs: items
    }));
  }, [filteredSongs, activeTab]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isDuplicateInstance) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#121212] text-white p-6 font-sans">
        <div className="max-w-lg w-full bg-neutral-900 border-2 border-red-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest border border-red-500/30">
              Protección de Cabina Activa
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Radio Manager ya está abierto en otra pestaña
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Para evitar conflictos de audio entre los dos decks y colisiones en la transmisión con el <code className="text-emerald-400 font-mono">.bat</code>, solo puede existir <strong>una única instancia activa</strong> de Radio Manager a la vez.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleTakeoverInstance}
              className="flex-1 py-3 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#1DB954]/20"
            >
              Usar Radio Manager aquí (Desactivar la otra)
            </button>
            <a
              href="/proyectoradio"
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center"
            >
              Ir a Proyecto Radio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] flex flex-col bg-[#121212] text-white font-sans overflow-hidden safe-bottom ${isDragOver ? 'border-4 border-dashed border-[#1DB954]' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR UNIFICADA COMPACTA (ESTILO SPOTIFY DESKTOP)                */}
      {/* ========================================================================= */}
      <div className="flex-shrink-0 bg-[#0e0e0e] border-b border-white/10 px-3 py-2 space-y-1.5">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* IZQUIERDA: LOGO + ESTADO BAT */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-[#1DB954] text-black rounded-lg flex items-center justify-center shadow-md shadow-[#1DB954]/20 shrink-0">
              <Music className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                Radio Studio
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${
                isBatOnline
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBatOnline ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                {isBatOnline ? 'BAT ON' : 'BAT OFF'}
              </span>
              <button
                onClick={handleSyncWithBat}
                disabled={isUpdatingAirList}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition disabled:opacity-50"
                title="Sincronizar biblioteca y cola con iniciar_radio.bat"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingAirList ? 'animate-spin text-[#1DB954]' : ''}`} />
              </button>
            </div>
          </div>

          {/* CENTRO: PESTAÑAS DE NAVEGACIÓN PRINCIPALES COMPACTAS */}
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setManagerTab('mp3')}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 ${
                managerTab === 'mp3'
                  ? 'bg-[#1DB954] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Consola MP3 ({songs.length})</span>
            </button>

            <button
              onClick={() => setManagerTab('albums')}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 ${
                managerTab === 'albums'
                  ? 'bg-[#1DB954] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Álbumes ({albumList.length})</span>
            </button>

            <button
              onClick={() => setManagerTab('youtube')}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 ${
                managerTab === 'youtube'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 fill-current" />
              <span>YouTube ({youtubeSongs.length})</span>
            </button>

            <button
              onClick={() => setManagerTab('p2p')}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 ${
                managerTab === 'p2p'
                  ? 'bg-cyan-400 text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>P2P</span>
            </button>
          </div>

          {/* DERECHA: ACCIONES RÁPIDAS DE CARGA Y CONTROL */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={folderInputRef}
              type="file"
              multiple
              webkitdirectory=""
              directory=""
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[11px] uppercase tracking-wider transition flex items-center gap-1 shadow-sm"
              title="Subir archivos MP3"
            >
              <Upload className="w-3 h-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Subir MP3</span>
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider border border-white/10 transition flex items-center gap-1"
              title="Subir carpeta completa"
            >
              <FolderUp className="w-3 h-3" />
              <span className="hidden sm:inline">Carpeta</span>
            </button>

            <button
              onClick={() => setShowListenersModal(true)}
              className={`h-7 px-2.5 rounded-full font-extrabold text-[11px] uppercase tracking-wider border transition flex items-center gap-1 ${
                tyrannySettings?.lockConsoles
                  ? 'bg-red-600/30 border-red-500/50 text-red-200'
                  : 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/35'
              }`}
              title="Panel de Oyentes y Control Tiránico"
            >
              <Users className="w-3 h-3" />
              <span>{tyrannySettings?.lockConsoles ? '🔒' : ''} Oyentes ({activeListenersCount})</span>
            </button>

            <button
              onClick={handleForceRestart}
              disabled={isRestarting}
              title="Forzar reinicio de la radio"
              className="h-7 px-2.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider transition flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCcw className={`w-3 h-3 ${isRestarting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isRestarting ? '...' : 'Reinicio'}</span>
            </button>
          </div>
        </div>

        {/* SUB-BARRA COMPACTA: CONTROL DE FUENTES EN OYENTES + VISTAS MP3 */}
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-purple-400" />
              Forzar Fuente:
            </span>

            <button
              onClick={() => handleForceModeAll('supabase')}
              className={`h-6 px-2.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1 border ${
                onAirTrack?.tab === 'supabase' || !onAirTrack?.tab
                  ? 'bg-[#1DB954] text-black border-[#1DB954]'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
              }`}
            >
              <Music className="w-3 h-3" /> Files
            </button>

            <button
              onClick={() => handleForceModeAll('live')}
              className={`h-6 px-2.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1 border ${
                onAirTrack?.tab === 'live'
                  ? 'bg-cyan-400 text-black border-cyan-400'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
              }`}
            >
              <Radio className="w-3 h-3" /> Radios
            </button>

            <button
              onClick={() => handleForceModeAll('youtube')}
              className={`h-6 px-2.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1 border ${
                onAirTrack?.tab === 'youtube'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
              }`}
            >
              <Youtube className="w-3 h-3 fill-current" /> YouTube
            </button>

            <button
              onClick={async () => {
                const nextVal = !tyrannySettings?.lockConsoles;
                await broadcastTyrannySettings({ lockConsoles: nextVal });
                if (nextVal) {
                  setSuccess("🔒 Consolas bloqueadas en modo tiránico.");
                } else {
                  setSuccess("🔓 Consolas liberadas.");
                }
              }}
              className={`h-6 px-2.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1 border ${
                tyrannySettings?.lockConsoles
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 border-white/10'
              }`}
            >
              <Lock className="w-2.5 h-2.5" />
              <span>{tyrannySettings?.lockConsoles ? 'Bloqueadas' : 'Libres'}</span>
            </button>
          </div>

          {/* Alertas / Progreso de subida inline o Selector de Vista MP3 */}
          <div className="flex items-center gap-2 ml-auto">
            {error && (
              <div className="px-2.5 py-0.5 rounded bg-red-950/90 border border-red-500/40 text-red-200 text-[10px] font-bold flex items-center gap-1.5 max-w-md truncate">
                <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate">{error}</span>
                <button onClick={() => setError(null)} className="text-red-300 hover:text-white ml-1">✕</button>
              </div>
            )}
            {success && (
              <div className="px-2.5 py-0.5 rounded bg-emerald-950/90 border border-[#1DB954]/40 text-emerald-200 text-[10px] font-bold flex items-center gap-1.5 max-w-md truncate">
                <CheckCircle2 className="w-3 h-3 text-[#1DB954] shrink-0" />
                <span className="truncate">{success}</span>
                <button onClick={() => setSuccess(null)} className="text-emerald-300 hover:text-white ml-1">✕</button>
              </div>
            )}

            {managerTab === 'mp3' && (
              <div className="flex items-center gap-1 bg-[#181818] p-0.5 rounded-lg border border-white/10">
                <button
                  onClick={() => setMp3ViewMode('split')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase transition flex items-center gap-1 ${
                    mp3ViewMode === 'split'
                      ? 'bg-[#1DB954] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" /> Dividida
                </button>
                <button
                  onClick={() => setMp3ViewMode('library')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase transition flex items-center gap-1 ${
                    mp3ViewMode === 'library'
                      ? 'bg-cyan-400 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FolderUp className="w-3 h-3" /> Biblioteca ({libraryTracks.length})
                </button>
                <button
                  onClick={() => setMp3ViewMode('queue')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase transition flex items-center gap-1 ${
                    mp3ViewMode === 'queue'
                      ? 'bg-[#1DB954] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3 h-3" /> Cola ({songs.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTENEDOR PRINCIPAL DE TRABAJO (COMPACTO, ADAPTATIVO Y SIN DESPERDICIO)  */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 sm:p-3">
        <div className="max-w-[1920px] mx-auto h-full">

        {managerTab === 'mp3' ? (
          /* VISTA 1: CONSOLA DUAL MP3 (BIBLIOTECA + COLA AL AIRE) */
          <div className={`w-full h-full ${mp3ViewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 items-stretch' : 'flex flex-col'}`}>

            {/* ========================================================================= */}
            {/* PANEL IZQUIERDO: BIBLIOTECA LOCAL (CANCIONES Y ÁLBUMES ADAPTATIVOS)       */}
            {/* ========================================================================= */}
            {(mp3ViewMode === 'split' || mp3ViewMode === 'library') && (
              <div className="w-full bg-[#181818] p-2.5 rounded-xl border border-white/10 shadow-xl flex flex-col h-[calc(100vh-12.5rem)] min-h-[420px]">
                
                {/* CABECERA COMPACTA DEL PANEL IZQUIERDO */}
                <div className="space-y-2 pb-2 border-b border-white/10 flex-shrink-0">
                  {/* Fila 1: Título + Controles de Pre-escucha CUE */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FolderUp className="w-4 h-4 text-cyan-400 shrink-0" />
                      <h4 className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                        Biblioteca Local
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        {libraryTracks.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleToggleLibraryPreview}
                        className="h-6 px-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[10px] uppercase rounded-md transition flex items-center gap-1"
                        title="Reproducir o pausar pre-escucha (Deck CUE)"
                      >
                        {isPlayingPreview ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isPlayingPreview ? 'Pausa' : 'Cue Play'}</span>
                      </button>
                      <button
                        onClick={handleNextLibraryPreview}
                        className="h-6 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] rounded-md transition flex items-center gap-1"
                        title="Siguiente en biblioteca"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Next</span>
                      </button>
                      <button
                        onClick={handleToggleLibraryShuffle}
                        className={`h-6 px-2 font-bold text-[10px] rounded-md transition flex items-center gap-1 ${
                          isLibraryShuffle
                            ? 'bg-cyan-400 text-black font-black ring-1 ring-cyan-200'
                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                        }`}
                        title="Modo aleatorio en biblioteca"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Fila 2: Buscador + Switcher Canciones/Álbumes + Escala de Álbumes */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="relative flex-1 min-w-[140px]">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={librarySearchQuery}
                        onChange={e => setLibrarySearchQuery(e.target.value)}
                        placeholder="Buscar canción, artista o álbum..."
                        className="w-full h-7 pl-7 pr-6 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                      />
                      {librarySearchQuery && (
                        <button
                          onClick={() => setLibrarySearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 bg-black/50 p-0.5 rounded-lg border border-white/10 shrink-0">
                      <button
                        onClick={() => setLibraryViewType('tracks')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                          libraryViewType === 'tracks'
                            ? 'bg-cyan-400 text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Music className="w-3 h-3" /> Pistas ({filteredLibraryTracks.length})
                      </button>
                      <button
                        onClick={() => setLibraryViewType('albums')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                          libraryViewType === 'albums'
                            ? 'bg-cyan-400 text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Disc className="w-3 h-3" /> Álbumes ({filteredLibraryAlbums.length})
                      </button>
                    </div>

                    {/* Selector de escala adaptativa cuando se ven álbumes en la biblioteca */}
                    {libraryViewType === 'albums' && (
                      <div className="flex items-center gap-0.5 bg-black/50 p-0.5 rounded-lg border border-white/10 shrink-0">
                        <button
                          onClick={() => setLibraryAlbumScale('compact')}
                          className={`p-1 rounded transition ${libraryAlbumScale === 'compact' ? 'bg-cyan-400 text-black' : 'text-gray-400 hover:text-white'}`}
                          title="Álbumes compactos"
                        >
                          <LayoutGrid className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setLibraryAlbumScale('grid')}
                          className={`p-1 rounded transition ${libraryAlbumScale === 'grid' ? 'bg-cyan-400 text-black' : 'text-gray-400 hover:text-white'}`}
                          title="Álbumes tamaño medio"
                        >
                          <Grid className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setLibraryAlbumScale('list')}
                          className={`p-1 rounded transition ${libraryAlbumScale === 'list' ? 'bg-cyan-400 text-black' : 'text-gray-400 hover:text-white'}`}
                          title="Vista de lista compacta"
                        >
                          <List className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* CUERPO DEL PANEL IZQUIERDO */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 mt-1.5">
                  {batCatalog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5 text-gray-400">
                      <FolderUp className="w-8 h-8 text-gray-600 mx-auto animate-pulse" />
                      <div>
                        <p className="text-xs font-extrabold text-white">Biblioteca no conectada</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
                          Ejecuta <code>iniciar_radio.bat</code> en <code>G:\Mi unidad\Radio</code> para indexar tus MP3.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncWithBat}
                        disabled={isUpdatingAirList}
                        className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-[11px] uppercase tracking-wider transition flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isUpdatingAirList ? 'animate-spin' : ''}`} />
                        <span>Comprobar Bat</span>
                      </button>
                    </div>
                  ) : libraryViewType === 'tracks' ? (
                    /* LISTA DENSA ESTILO SPOTIFY DE PISTAS DE LA BIBLIOTECA */
                    filteredLibraryTracks.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-xs">
                        No hay canciones que coincidan con la búsqueda.
                      </div>
                    ) : (
                      <div className="space-y-0.5 pb-4">
                        {filteredLibraryTracks.map((track, idx) => {
                          const isCurrentPreview = previewTrack && (
                            previewTrack.title === track.title ||
                            (track.fileName && previewTrack.fileName === track.fileName)
                          ) && isPlayingPreview;

                          return (
                            <div
                              key={track.id || track.fileName || idx}
                              draggable={true}
                              onDragStart={(e) => {
                                draggedLibraryTrackRef.current = track;
                                try {
                                  e.dataTransfer.effectAllowed = 'copy';
                                  e.dataTransfer.setData('application/json', JSON.stringify(track));
                                  e.dataTransfer.setData('text/plain', JSON.stringify(track));
                                } catch (err) {}
                                setIsDraggingOverQueue(true);
                              }}
                              onDragEnd={() => {
                                setIsDraggingOverQueue(false);
                                setTimeout(() => { draggedLibraryTrackRef.current = null; }, 500);
                              }}
                              onClick={() => handlePlayPreview(track)}
                              className={`group flex items-center justify-between px-2 py-1 rounded-md transition-colors cursor-pointer select-none ${
                                isCurrentPreview
                                  ? 'bg-cyan-500/15 ring-1 ring-cyan-400/40'
                                  : 'hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                <div className="w-5 text-right shrink-0 flex items-center justify-end">
                                  {isCurrentPreview ? (
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                  ) : (
                                    <>
                                      <span className="text-[11px] font-mono text-gray-500 group-hover:hidden">
                                        {idx + 1}
                                      </span>
                                      <Play className="w-3 h-3 text-cyan-400 fill-current hidden group-hover:inline-block" />
                                    </>
                                  )}
                                </div>

                                <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                                  <img
                                    src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                                    alt={track.title}
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-semibold truncate leading-tight ${isCurrentPreview ? 'text-cyan-400 font-bold' : 'text-white'}`} title={track.title}>
                                    {track.title}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate leading-tight" title={`${track.artist || track.albumArtist} • ${track.album}`}>
                                    {track.artist || track.albumArtist} <span className="text-gray-600">•</span> {track.album}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                                  {formatTime(track.duration || 210)}
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddTrackToQueue(track);
                                  }}
                                  className="px-2 py-0.5 bg-white/10 hover:bg-[#1DB954] hover:text-black text-gray-200 rounded text-[10px] font-bold transition flex items-center gap-0.5"
                                  title="Añadir a la cola de emisión"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Cola
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    /* VISTA ADAPTATIVA DE ÁLBUMES EN LA BIBLIOTECA (COMPACTA / GRID / LISTA) */
                    <div className="space-y-2 pb-4">
                      {libraryAlbumScale === 'list' ? (
                        <div className="space-y-1">
                          {filteredLibraryAlbums.map(alb => {
                            const albId = alb.folderName || alb.albumName;
                            const isExpanded = expandedLibraryAlbum === albId;
                            const trackCount = alb.tracks?.length || alb.trackCount || 0;
                            return (
                              <div key={albId} className="bg-black/40 border border-white/5 rounded-lg overflow-hidden">
                                <div
                                  onClick={() => setExpandedLibraryAlbum(isExpanded ? null : albId)}
                                  className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white/5 cursor-pointer transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                                      <img
                                        src={alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                                        alt={alb.albumName}
                                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-white truncate leading-tight">{alb.albumName}</p>
                                      <p className="text-[10px] text-gray-400 truncate leading-tight">{alb.artist} • {trackCount} pistas</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePutAlbumOnAir(albId);
                                      }}
                                      className="px-2 py-0.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[10px] rounded transition flex items-center gap-0.5"
                                    >
                                      <Plus className="w-2.5 h-2.5" /> Cola
                                    </button>
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="border-t border-white/10 bg-black/70 p-1.5 space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar">
                                    {(alb.tracks || []).map((t, tIdx) => (
                                      <div
                                        key={t.id || t.fileName || tIdx}
                                        onClick={() => handlePlayPreview(t)}
                                        className="flex items-center justify-between px-2 py-1 hover:bg-cyan-500/10 rounded text-[11px] cursor-pointer group"
                                      >
                                        <span className="text-gray-300 group-hover:text-cyan-400 truncate flex-1 pr-2">
                                          {tIdx + 1}. {t.title}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddTrackToQueue(t);
                                          }}
                                          className="px-1.5 py-0.2 bg-white/10 hover:bg-[#1DB954] hover:text-black rounded text-[9px] font-bold"
                                        >
                                          + Cola
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* GRID ADAPTATIVO SPOTIFY PARA ÁLBUMES DE LA BIBLIOTECA */
                        <div
                          className={`grid gap-2 ${
                            libraryAlbumScale === 'compact'
                              ? 'grid-cols-[repeat(auto-fill,minmax(98px,1fr))]'
                              : 'grid-cols-[repeat(auto-fill,minmax(130px,1fr))]'
                          }`}
                        >
                          {filteredLibraryAlbums.map(alb => {
                            const albId = alb.folderName || alb.albumName;
                            const isExpanded = expandedLibraryAlbum === albId;
                            const trackCount = alb.tracks?.length || alb.trackCount || 0;
                            return (
                              <div
                                key={albId}
                                className={`bg-[#202020] hover:bg-[#282828] border border-white/5 hover:border-white/15 rounded-lg p-1.5 transition-all group flex flex-col justify-between ${
                                  isExpanded ? 'col-span-2 row-span-2 ring-1 ring-cyan-400/50' : ''
                                }`}
                              >
                                <div>
                                  <div
                                    onClick={() => setExpandedLibraryAlbum(isExpanded ? null : albId)}
                                    className="relative aspect-square w-full rounded overflow-hidden bg-black/60 cursor-pointer mb-1.5"
                                  >
                                    <img
                                      src={alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300'}
                                      alt={alb.albumName}
                                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300'; }}
                                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-black/75 text-[9px] font-mono font-bold text-white">
                                      {trackCount}
                                    </span>

                                    {/* Botones flotantes en hover estilo Spotify */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (alb.tracks?.[0]) handlePlayPreview(alb.tracks[0]);
                                        }}
                                        className="w-7 h-7 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow-lg"
                                        title="Pre-escuchar álbum en Deck CUE"
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePutAlbumOnAir(albId);
                                        }}
                                        className="px-2 py-1 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-[9px] uppercase shadow-lg flex items-center gap-0.5"
                                        title="Enviar álbum completo a la cola"
                                      >
                                        <Plus className="w-2.5 h-2.5" /> Cola
                                      </button>
                                    </div>
                                  </div>

                                  <div
                                    onClick={() => setExpandedLibraryAlbum(isExpanded ? null : albId)}
                                    className="cursor-pointer min-w-0 px-0.5"
                                  >
                                    <h5 className="text-[11px] font-bold text-white truncate leading-tight" title={alb.albumName}>
                                      {alb.albumName}
                                    </h5>
                                    <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5" title={alb.artist}>
                                      {alb.artist}
                                    </p>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="mt-2 pt-1.5 border-t border-white/10 max-h-40 overflow-y-auto custom-scrollbar space-y-0.5">
                                    {(alb.tracks || []).map((t, tIdx) => (
                                      <div
                                        key={t.id || t.fileName || tIdx}
                                        onClick={() => handlePlayPreview(t)}
                                        className="flex items-center justify-between px-1.5 py-1 hover:bg-cyan-500/10 rounded text-[10px] cursor-pointer group/t"
                                      >
                                        <span className="text-gray-300 group-hover/t:text-cyan-400 truncate flex-1 pr-1">
                                          {tIdx + 1}. {t.title}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddTrackToQueue(t);
                                          }}
                                          className="px-1.5 py-0.2 bg-white/10 hover:bg-[#1DB954] hover:text-black rounded text-[9px] font-bold shrink-0"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PANEL DERECHO: COLA DE EMISIÓN AL AIRE                                    */}
            {/* ========================================================================= */}
            {(mp3ViewMode === 'split' || mp3ViewMode === 'queue') && (
              <div
                onDragOver={handleQueueDragOver}
                onDragLeave={handleQueueDragLeave}
                onDrop={handleQueueDrop}
                className={`w-full bg-[#181818] p-2.5 rounded-xl border transition-all shadow-xl flex flex-col h-[calc(100vh-12.5rem)] min-h-[420px] ${
                  isDraggingOverQueue
                    ? 'border-[#1DB954] bg-[#1DB954]/5 ring-2 ring-[#1DB954]/30'
                    : 'border-white/10'
                }`}
              >
                {/* CABECERA COMPACTA DEL PANEL DERECHO */}
                <div className="space-y-2 pb-2 border-b border-white/10 flex-shrink-0">
                  {/* Fila 1: Título + Controles de Emisión y Monitor */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${onAirTrack?.tab !== 'OFF_AIR' ? 'bg-red-500' : 'bg-gray-500'} opacity-75`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${onAirTrack?.tab !== 'OFF_AIR' ? 'bg-red-500' : 'bg-gray-500'}`} />
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                        Cola al Aire
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        {songs.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={handleToggleListenLive}
                        className={`h-6 px-2 rounded-md font-bold text-[10px] uppercase transition flex items-center gap-1 border ${
                          isPlayingLiveSignal
                            ? 'bg-red-600 text-white border-red-500 animate-pulse'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
                        }`}
                        title="Escuchar retorno en vivo"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isPlayingLiveSignal ? 'Monitor ON' : 'Monitor'}</span>
                      </button>

                      <button
                        onClick={handleAirPlayPause}
                        className="h-6 px-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-[10px] uppercase rounded-md transition flex items-center gap-1"
                        title="Play / Pausa Cola"
                      >
                        {isPlayingLiveSignal ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isPlayingLiveSignal ? 'Pausa' : 'Play'}</span>
                      </button>

                      <button
                        onClick={handleAirNext}
                        className="h-6 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] rounded-md transition flex items-center gap-1"
                        title="Siguiente canción al aire"
                      >
                        <SkipForward className="w-3 h-3" />
                      </button>

                      <button
                        onClick={handleToggleAirShuffle}
                        className={`h-6 px-2 font-bold text-[10px] rounded-md transition flex items-center gap-1 ${
                          isAirShuffle
                            ? 'bg-red-600 text-white font-black ring-1 ring-red-400'
                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                        }`}
                        title="Modo aleatorio en cola"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>

                      <button
                        onClick={handleToggleOnAirSwitch}
                        className={`h-6 px-2 rounded-md font-black text-[10px] uppercase transition flex items-center gap-1 border ${
                          onAirTrack?.tab !== 'OFF_AIR'
                            ? 'bg-red-600/30 text-red-300 border-red-500/50'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                        title="Autorizar o cortar señal al aire"
                      >
                        <span>{onAirTrack?.tab !== 'OFF_AIR' ? 'ON AIR' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={handleClearQueue}
                        disabled={isUpdatingAirList || songs.length === 0}
                        className="h-6 px-1.5 bg-red-600/15 hover:bg-red-600/35 text-red-400 rounded-md transition border border-red-500/20 disabled:opacity-30"
                        title="Vaciar cola de emisión"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Fila 2: Buscador de Cola + Volumen Monitor + Drop Hint compacto */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[140px]">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Filtrar pistas en cola..."
                        className="w-full h-7 pl-7 pr-6 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Volumen Monitor compacto inline */}
                    <div className="flex items-center gap-1.5 bg-black/50 px-2 h-7 rounded-lg border border-white/10 shrink-0">
                      <button
                        onClick={() => {
                          const nextMute = !isAirMuted;
                          setIsAirMuted(nextMute);
                          if (masterAirAudioRef.current) {
                            masterAirAudioRef.current.muted = nextMute;
                            masterAirAudioRef.current.volume = nextMute ? 0 : airVolume;
                          }
                        }}
                        className="text-gray-400 hover:text-red-400"
                        title="Silenciar monitor"
                      >
                        {isAirMuted || airVolume === 0 ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3 text-red-400" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={isAirMuted ? 0 : airVolume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAirVolume(val);
                          setIsAirMuted(false);
                          if (masterAirAudioRef.current) {
                            masterAirAudioRef.current.muted = false;
                            masterAirAudioRef.current.volume = val;
                          }
                        }}
                        className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                      <span className="text-[9px] font-mono text-gray-400 w-6 text-right">
                        {isAirMuted ? '0%' : `${Math.round(airVolume * 100)}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CUERPO DEL PANEL DERECHO (LISTA DENSA DE COLA AL AIRE) */}
                <div
                  onDragOver={handleQueueDragOver}
                  onDragLeave={handleQueueDragLeave}
                  onDrop={handleQueueDrop}
                  className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 mt-1.5"
                >
                  {songs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5 text-gray-400 border border-dashed border-white/10 rounded-lg">
                      <Radio className="w-8 h-8 text-gray-600 mx-auto animate-pulse" />
                      <div>
                        <p className="text-xs font-extrabold text-white">Cola de emisión vacía</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
                          Arrastra canciones desde la izquierda o carga 15 temas aleatorios.
                        </p>
                      </div>
                      <button
                        onClick={() => handleAirShuffle()}
                        disabled={isUpdatingAirList || batCatalog.length === 0}
                        className="px-3 py-1.5 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[11px] uppercase tracking-wider transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Shuffle className="w-3 h-3" /> Cargar 15 Aleatorios
                      </button>
                    </div>
                  ) : filteredSongs.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs">
                      No hay canciones en la cola que coincidan con "{searchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-0.5 pb-4">
                      {filteredSongs.map((song, idx) => {
                        const isOnAir = Boolean(
                          onAirTrack?.is_playing && (
                            (onAirTrack?.station_name && song.title && onAirTrack.station_name.toLowerCase().includes(song.title.toLowerCase())) ||
                            (onAirTrack?.station_name === song.title)
                          )
                        );

                        return (
                          <div
                            key={song.id || idx}
                            onClick={() => {
                              setBottomPlayerMode('live');
                              handlePlayAirSong(song);
                            }}
                            className={`group flex items-center justify-between px-2 py-1 rounded-md transition-colors cursor-pointer select-none ${
                              isOnAir
                                ? 'bg-[#1DB954]/15 ring-1 ring-[#1DB954]/40'
                                : 'hover:bg-white/10'
                            }`}
                            title={`Transmitir al aire: "${song.title}"`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <div className="w-5 text-right shrink-0 flex items-center justify-end">
                                {isOnAir ? (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                ) : (
                                  <>
                                    <span className="text-[11px] font-mono text-gray-500 group-hover:hidden">
                                      {idx + 1}
                                    </span>
                                    <Play className="w-3 h-3 text-[#1DB954] fill-current hidden group-hover:inline-block" />
                                  </>
                                )}
                              </div>

                              <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                                <img
                                  src={song.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                                  alt={song.title}
                                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-xs font-semibold truncate leading-tight ${isOnAir ? 'text-[#1DB954] font-bold' : 'text-white'}`} title={song.title}>
                                    {song.title}
                                  </p>
                                  {isOnAir && (
                                    <span className="px-1 py-0.2 rounded bg-red-600 text-white text-[8px] font-black uppercase shrink-0">
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 truncate leading-tight" title={`${song.artist} • ${song.album}`}>
                                  {song.artist} <span className="text-gray-600">•</span> {song.album}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              <span className="text-[10px] font-mono text-gray-500 mr-1 hidden sm:inline">
                                {formatTime(song.duration)}
                              </span>

                              <button
                                onClick={() => handleMoveAirTrack(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20 opacity-0 group-hover:opacity-100"
                                title="Subir"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveAirTrack(idx, 'down')}
                                disabled={idx === filteredSongs.length - 1}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20 opacity-0 group-hover:opacity-100"
                                title="Bajar"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingSong(song)}
                                className="p-1 text-gray-400 hover:text-yellow-300 hover:bg-white/10 rounded transition opacity-0 group-hover:opacity-100"
                                title="Editar metadatos"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRemoveAirTrack(song.id)}
                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                                title="Quitar de la cola"
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
              </div>
            )}
          </div>

        ) : managerTab === 'albums' ? (
          /* ========================================================================= */
          /* VISTA 2: GESTOR DE ÁLBUMES ADAPTATIVO ESTILO SPOTIFY                      */
          /* ========================================================================= */
          <div className="space-y-3 animate-fade-in pb-6">
            {/* BARRA DE HERRAMIENTAS DE ÁLBUMES COMPACTA */}
            <div className="bg-[#181818] p-2.5 sm:p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
                <div className="flex items-center gap-1.5">
                  <Disc className="w-4 h-4 text-[#1DB954]" />
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Álbumes
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1DB954]/15 text-[#1DB954] font-mono font-bold border border-[#1DB954]/30">
                    {filteredAlbumList.length}
                  </span>
                </div>

                {/* Buscador de álbumes */}
                <div className="relative flex-1 max-w-xs min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={albumSearchQuery}
                    onChange={e => setAlbumSearchQuery(e.target.value)}
                    placeholder="Buscar álbum, artista o pista..."
                    className="w-full h-7 pl-8 pr-6 bg-black/50 border border-white/10 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition"
                  />
                  {albumSearchQuery && (
                    <button
                      onClick={() => setAlbumSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Ordenar por */}
                <select
                  value={albumSortBy}
                  onChange={e => setAlbumSortBy(e.target.value)}
                  className="h-7 px-2.5 bg-black/50 border border-white/10 rounded-full text-[11px] text-gray-300 font-bold focus:outline-none focus:border-[#1DB954] cursor-pointer"
                >
                  <option value="name" className="bg-[#181818]">Orden: Nombre (A-Z)</option>
                  <option value="artist" className="bg-[#181818]">Orden: Artista</option>
                  <option value="tracks" className="bg-[#181818]">Orden: N° de Pistas</option>
                  <option value="year" className="bg-[#181818]">Orden: Año</option>
                </select>
              </div>

              {/* CONTROLES DE ESCALA ADAPTATIVA Y ACCIONES */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5 bg-black/50 p-0.5 rounded-full border border-white/10">
                  <button
                    onClick={() => setAlbumScale('compact')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition flex items-center gap-1 ${
                      albumScale === 'compact'
                        ? 'bg-[#1DB954] text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Escala Mini Compacta (8-12 álbumes por fila)"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Mini</span>
                  </button>
                  <button
                    onClick={() => setAlbumScale('spotify')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition flex items-center gap-1 ${
                      albumScale === 'spotify'
                        ? 'bg-[#1DB954] text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Escala Estándar Spotify (6-9 álbumes por fila)"
                  >
                    <Grid className="w-3 h-3" />
                    <span>Spotify</span>
                  </button>
                  <button
                    onClick={() => setAlbumScale('list')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition flex items-center gap-1 ${
                      albumScale === 'list'
                        ? 'bg-[#1DB954] text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Vista de Tabla Compacta"
                  >
                    <List className="w-3 h-3" />
                    <span>Lista</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateAlbumModal(true)}
                  className="h-7 px-3 rounded-full bg-[#1DB954] text-black font-extrabold text-[11px] hover:bg-[#1ed760] transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Álbum
                </button>

                <button
                  onClick={() => {
                    setTargetAlbumForCover(null);
                    setShowAlbumCoversModal(true);
                  }}
                  className="h-7 px-3 rounded-full bg-white/10 border border-white/15 text-white font-bold text-[11px] hover:bg-white/20 transition flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#1DB954]" /> Covers
                </button>
              </div>
            </div>

            {filteredAlbumList.length === 0 ? (
              <div className="p-10 text-center text-gray-400 bg-[#181818] rounded-xl border border-white/5">
                <Disc className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">No se encontraron álbumes</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Prueba con otra búsqueda o sube carpetas MP3.</p>
              </div>
            ) : albumScale === 'list' ? (
              /* ───── VISTA DE TABLA COMPACTA ESTILO SPOTIFY ───── */
              <div className="bg-[#181818] rounded-xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <div className="col-span-5 sm:col-span-4">Álbum</div>
                  <div className="col-span-3 hidden sm:block">Artista</div>
                  <div className="col-span-2 hidden md:block">Género / Año</div>
                  <div className="col-span-2 sm:col-span-1 text-right">Pistas</div>
                  <div className="col-span-5 sm:col-span-2 text-right">Acciones</div>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredAlbumList.map((alb, idx) => (
                    <div
                      key={alb.key || idx}
                      onClick={() => setSelectedAlbumModalTarget(alb)}
                      className="grid grid-cols-12 gap-2 items-center px-3 py-1.5 hover:bg-white/5 transition cursor-pointer group"
                    >
                      <div className="col-span-5 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded overflow-hidden bg-black shrink-0 border border-white/10 relative">
                          <img
                            src={alb.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200'}
                            alt={alb.albumName}
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200'; }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-[#1DB954] truncate transition-colors">
                            {alb.albumName}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate sm:hidden">
                            {alb.artistName}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3 hidden sm:block text-xs text-gray-300 truncate">
                        {alb.artistName}
                      </div>

                      <div className="col-span-2 hidden md:flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1DB954]/10 text-[#1DB954] font-bold truncate">
                          {alb.genre}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{alb.year}</span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 text-right font-mono text-[11px] text-gray-300">
                        {alb.tracks?.length || 0} <span className="text-[9px] text-gray-500">({formatTime(alb.totalDuration)})</span>
                      </div>

                      <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { if (alb.tracks?.[0]) handlePlayPreview(alb.tracks[0]); }}
                          className="p-1.5 rounded-full bg-[#1DB954] text-black hover:scale-105 transition"
                          title="Pre-escuchar álbum"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                        <button
                          onClick={() => handlePutAlbumOnAir(alb.folderName || alb.albumName)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-[#1DB954] hover:text-black text-[10px] font-bold transition"
                          title="Enviar álbum a la cola"
                        >
                          + Cola
                        </button>
                        <button
                          onClick={() => {
                            setTargetAlbumForCover(alb);
                            setShowAlbumCoversModal(true);
                          }}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 transition"
                          title="Cambiar carátula"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingAlbumTarget(alb)}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 transition"
                          title="Editar álbum"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAlbum(alb)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 transition"
                          title="Eliminar álbum"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ───── GRID ADAPTATIVO ESTILO SPOTIFY (MINI / SPOTIFY) ───── */
              <div
                className={`grid gap-2.5 sm:gap-3 ${
                  albumScale === 'compact'
                    ? 'grid-cols-[repeat(auto-fill,minmax(115px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(125px,1fr))]'
                    : 'grid-cols-[repeat(auto-fill,minmax(145px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]'
                }`}
              >
                {filteredAlbumList.map((alb, idx) => (
                  <div
                    key={alb.key || idx}
                    onClick={() => setSelectedAlbumModalTarget(alb)}
                    className="bg-[#181818] hover:bg-[#242424] border border-white/5 hover:border-white/15 rounded-xl p-2.5 shadow-md group transition-all duration-200 flex flex-col justify-between cursor-pointer select-none"
                  >
                    <div>
                      {/* Portada Cuadrada con Controles Flotantes estilo Spotify */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-900 mb-2 shadow-md">
                        <img
                          src={alb.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=300'}
                          alt={alb.albumName}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=300'; }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Pill de conteo de pistas arriba a la izquierda */}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm rounded text-[9px] font-mono text-white font-bold">
                          {alb.tracks?.length || 0} pistas
                        </div>

                        {/* Barra de micro-acciones arriba a la derecha en hover */}
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <button
                            onClick={() => {
                              setTargetAlbumForCover(alb);
                              setShowAlbumCoversModal(true);
                            }}
                            className="p-1 hover:bg-white/20 text-gray-200 hover:text-white rounded transition"
                            title="Cambiar carátula"
                          >
                            <ImageIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingAlbumTarget(alb)}
                            className="p-1 hover:bg-white/20 text-gray-200 hover:text-white rounded transition"
                            title="Editar metadatos"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlbum(alb)}
                            className="p-1 hover:bg-red-500/30 text-red-400 rounded transition"
                            title="Eliminar álbum"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Botón Play verde flotante estilo Spotify en esquina inferior derecha */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (alb.tracks?.[0]) handlePlayPreview(alb.tracks[0]);
                          }}
                          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 text-black shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
                          title="Reproducir Álbum"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>

                        {/* Botón + Cola en esquina inferior izquierda en hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePutAlbumOnAir(alb.folderName || alb.albumName);
                          }}
                          className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/85 hover:bg-[#1DB954] text-white hover:text-black font-extrabold text-[9px] uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-0.5 border border-white/15"
                          title="Poner álbum en la cola al aire"
                        >
                          <Plus className="w-2.5 h-2.5" /> Cola
                        </button>
                      </div>

                      {/* Info Compacta del Álbum */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-[#1DB954] transition-colors leading-tight" title={alb.albumName}>
                          {alb.albumName}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5" title={alb.artistName}>
                          {alb.artistName}
                        </p>
                      </div>
                    </div>

                    {/* Pie micro del álbum */}
                    <div className="flex items-center justify-between gap-1 pt-2 mt-1.5 border-t border-white/5 text-[9px] text-gray-500 font-mono">
                      <span className="truncate text-[#1DB954] font-sans font-bold">{alb.genre}</span>
                      <span>{alb.year} • {formatTime(alb.totalDuration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : managerTab === 'youtube' ? (
          /* ========================================================================= */
          /* VISTA 3: YOUTUBE MANAGER COMPACTO                                         */
          /* ========================================================================= */
          <div className="space-y-4 pb-6">
            {/* Formulario Compacto Agregar / Editar Enlace YouTube */}
            <div className="bg-[#181818] p-3.5 rounded-xl border border-white/10 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2 gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Youtube className="w-4 h-4 text-red-500 fill-current" />
                  {isEditingYt ? 'Editar Enlace YouTube' : 'Agregar Enlace de YouTube'}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowYoutubeBulkModal(true)}
                    className="h-7 px-3 bg-red-600 hover:bg-red-500 text-white rounded-full text-[11px] font-extrabold flex items-center gap-1 transition"
                  >
                    <ListPlus className="w-3.5 h-3.5" /> Importación Masiva / Playlists
                  </button>

                  {isEditingYt && (
                    <button
                      onClick={() => {
                        setYtForm({ id: null, title: '', artist: '', youtubeUrl: '', category: 'Lofi & Chill' });
                        setIsEditingYt(false);
                      }}
                      className="h-7 px-2.5 text-[11px] text-gray-300 hover:text-white bg-white/10 rounded-full"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveYoutubeLink} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">URL de YouTube *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={ytForm.youtubeUrl}
                    onChange={async (e) => {
                      const url = e.target.value;
                      const ytId = extractYoutubeId(url);
                      setYtForm(prev => ({
                        ...prev,
                        youtubeUrl: url,
                        title: prev.title || (ytId ? `Video de YouTube (${ytId})` : prev.title)
                      }));

                      if (ytId && !isEditingYt) {
                        const meta = await fetchYoutubeMetadata(url);
                        if (meta && meta.title) {
                          setYtForm(prev => ({
                            ...prev,
                            title: meta.title,
                            artist: meta.artist || prev.artist
                          }));
                        }
                      }
                    }}
                    className="w-full h-8 px-3 bg-black/50 border border-white/15 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    placeholder="Título del video"
                    value={ytForm.title}
                    onChange={e => setYtForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-8 px-3 bg-black/50 border border-white/15 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 font-bold"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Artista / Canal</label>
                  <input
                    type="text"
                    placeholder="Canal..."
                    value={ytForm.artist}
                    onChange={e => setYtForm(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full h-8 px-3 bg-black/50 border border-white/15 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Categoría</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) setYtForm(prev => ({ ...prev, category: '' }));
                      }}
                      className="text-[9px] font-bold text-red-400 hover:underline uppercase"
                    >
                      {isCustomCategory ? 'Lista' : '+ Nueva'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Categoría..."
                      value={ytForm.category}
                      onChange={e => setYtForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-8 px-3 bg-black/50 border border-red-500 rounded-lg text-white text-xs focus:outline-none font-bold"
                    />
                  ) : (
                    <select
                      value={ytForm.category}
                      onChange={e => {
                        if (e.target.value === '__NEW__') {
                          setIsCustomCategory(true);
                          setYtForm(prev => ({ ...prev, category: '' }));
                        } else {
                          setYtForm(prev => ({ ...prev, category: e.target.value }));
                        }
                      }}
                      className="w-full h-8 px-2.5 bg-black/50 border border-white/15 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 font-bold"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#181818] text-white">{cat}</option>
                      ))}
                      <option value="__NEW__" className="bg-[#2a1515] text-red-400 font-bold">+ Nueva Categoría...</option>
                    </select>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <button
                    type="submit"
                    className="w-full h-8 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEditingYt ? 'Guardar' : 'Añadir'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Lista Compacta de Enlaces de YouTube */}
            <div className="bg-[#181818] rounded-xl border border-white/10 overflow-hidden shadow-xl">
              <div className="p-2.5 sm:p-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-white/5">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500 fill-current" />
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Videos Guardados ({filteredAndSortedYoutubeSongs.length})
                  </h4>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar video..."
                      value={ytSearchQuery}
                      onChange={(e) => setYtSearchQuery(e.target.value)}
                      className="w-full h-7 pl-8 pr-6 bg-black/40 border border-white/10 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                    {ytSearchQuery && (
                      <button
                        onClick={() => setYtSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={ytSortBy}
                    onChange={(e) => setYtSortBy(e.target.value)}
                    className="h-7 px-2.5 bg-black/40 border border-white/10 rounded-full text-[11px] text-gray-200 focus:outline-none focus:border-red-500 font-bold cursor-pointer"
                  >
                    <option value="custom" className="bg-[#181818]">↕ Personalizado</option>
                    <option value="title-asc" className="bg-[#181818]">Título (A-Z)</option>
                    <option value="artist-asc" className="bg-[#181818]">Artista (A-Z)</option>
                    <option value="category" className="bg-[#181818]">Categoría</option>
                    <option value="newest" className="bg-[#181818]">Más Recientes</option>
                  </select>
                </div>
              </div>

              {youtubeSongs.length > 0 && (
                <div className="px-3 py-1.5 bg-black/30 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {ytCategoriesForFilter.map((cat) => {
                    const count = ytCategoryCounts[cat] || 0;
                    const isActive = ytFilterCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setYtFilterCategory(cat)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition shrink-0 flex items-center gap-1 ${
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="text-[9px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {loadingYoutubeManager ? (
                <div className="p-8 text-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-red-500" />
                </div>
              ) : filteredAndSortedYoutubeSongs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No hay videos que coincidan con el filtro.
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto custom-scrollbar">
                  {filteredAndSortedYoutubeSongs.map((track) => {
                    const origIndex = youtubeSongs.findIndex(s => String(s.id) === String(track.id));
                    const isManualOrderActive = ytSortBy === 'custom' && ytFilterCategory === 'Todos' && !ytSearchQuery;

                    return (
                      <div key={track.id || track.youtubeId} className="px-3 py-1.5 flex items-center justify-between gap-3 hover:bg-white/5 transition">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative w-10 h-7 rounded overflow-hidden bg-black flex-shrink-0 border border-white/10">
                            <img
                              src={track.cover}
                              alt={track.title}
                              onError={(e) => { e.currentTarget.src = getYoutubeThumbnail(track.youtubeId); }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs text-white truncate">{track.title}</h4>
                              <a
                                href={track.youtube_url || track.url || `https://www.youtube.com/watch?v=${track.youtubeId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-red-400 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate">
                              <span className="truncate">{track.artist || 'Canal de YouTube'}</span>
                              <span>•</span>
                              <span className="text-red-400 font-semibold">{track.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveYoutubeOrder(origIndex, 'up')}
                            disabled={!isManualOrderActive || origIndex <= 0}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-20"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveYoutubeOrder(origIndex, 'down')}
                            disabled={!isManualOrderActive || origIndex >= youtubeSongs.length - 1}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-20"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleEditYoutubeClick(track)}
                            className="p-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteYoutubeLink(track.id)}
                            className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"
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
          </div>

        ) : managerTab === 'p2p' ? (
          <div className="space-y-3 pb-6">
            <P2PStreamManager
              onPlayTrackInDeck={(track) => {
                handlePlayPreview(track, true);
              }}
              onQueueTrack={async (track) => {
                await handlePlayAirSong(track);
              }}
            />
          </div>
        ) : null}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTENEDOR 2: BARRA INFERIOR COMPACTA DE REPRODUCTORES DUALES (SPOTIFY)   */}
      {/* ========================================================================= */}
      {(previewTrack || onAirTrack?.station_name || songs.length > 0) && (() => {
        const liveDisplayTrack = onAirTrack?.station_name ? onAirTrack : (songs[0] || null);

        return (
          <div className="flex-shrink-0 w-full bg-[#0a0a0a] border-t border-white/10 px-2.5 py-1.5 shadow-2xl z-20 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
            
            {/* SELECTOR DE DECKS EN MÓVIL (< lg) */}
            <div className="flex lg:hidden items-center justify-between gap-1 pb-1.5 border-b border-white/10 mb-1.5">
              <button
                onClick={() => setBottomPlayerMode('preview')}
                className={`flex-1 py-1 px-2 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 transition ${
                  bottomPlayerMode === 'preview' ? 'bg-cyan-400 text-black' : 'bg-white/5 text-gray-400'
                }`}
              >
                <span>Deck CUE</span>
              </button>
              <button
                onClick={() => setBottomPlayerMode('live')}
                className={`flex-1 py-1 px-2 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 transition ${
                  bottomPlayerMode === 'live' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400'
                }`}
              >
                <span>Deck Aire</span>
              </button>
              <button
                onClick={() => setBottomPlayerMode('split')}
                className={`py-1 px-2 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 transition ${
                  bottomPlayerMode === 'split' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Layers className="w-3 h-3" />
              </button>
            </div>

            <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-2">
              
              {/* ===================== DECK AZUL: BIBLIOTECA (CUE) ===================== */}
              <div className={`bg-[#0c1d29] border border-cyan-500/40 rounded-lg px-2.5 py-1.5 items-center justify-between gap-2 min-w-0 ${
                bottomPlayerMode === 'live' ? 'hidden lg:flex' : 'flex'
              }`}>
                <div className="flex items-center gap-2 min-w-0 w-1/3 shrink-0">
                  <div className="relative w-9 h-9 rounded overflow-hidden shrink-0 border border-cyan-400/40 bg-neutral-900">
                    <img
                      src={previewTrack?.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200'}
                      alt="cue"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200'; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400 block leading-none mb-0.5">
                      🎧 DECK CUE
                    </span>
                    <h4 className="font-bold text-[11px] text-white truncate leading-tight" title={previewTrack?.title || 'Sin pre-escucha'}>
                      {previewTrack?.title || 'Selecciona pista'}
                    </h4>
                    <p className="text-[9px] text-gray-400 truncate leading-tight">
                      {previewTrack?.artist || previewTrack?.albumArtist || 'Biblioteca Local'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-0.5 flex-1 max-w-xs min-w-0">
                  <div className="flex items-center gap-2">
                    <button onClick={playPrevPreview} className="p-0.5 text-gray-400 hover:text-cyan-400 transition">
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleTogglePreviewPlay}
                      className="w-7 h-7 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow"
                    >
                      {isPlayingPreview ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                    <button onClick={playNextPreview} className="p-0.5 text-gray-400 hover:text-cyan-400 transition">
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleToggleLibraryShuffle}
                      className={`p-1 rounded transition ${isLibraryShuffle ? 'text-cyan-300 bg-cyan-500/20' : 'text-gray-400 hover:text-cyan-400'}`}
                    >
                      <Shuffle className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-full flex items-center gap-1.5 text-[9px] font-mono text-gray-400">
                    <span className="text-cyan-400 w-7 text-right shrink-0">{formatTime(previewTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={previewDuration || 100}
                      step="0.5"
                      value={previewTime}
                      onChange={(e) => {
                        const newTime = Number(e.target.value);
                        if (audioRef.current) audioRef.current.currentTime = newTime;
                        setPreviewTime(newTime);
                      }}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span className="w-7 shrink-0">{formatTime(previewDuration)}</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <button onClick={() => setIsPreviewMuted(!isPreviewMuted)} className="p-1 text-gray-400 hover:text-cyan-400">
                    {isPreviewMuted || previewVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isPreviewMuted ? 0 : previewVolume}
                    onChange={(e) => {
                      setPreviewVolume(Number(e.target.value));
                      setIsPreviewMuted(false);
                    }}
                    className="w-14 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* ===================== DECK ROJO: COLA AL AIRE ===================== */}
              <div className={`bg-[#210b0c] border border-red-500/40 rounded-lg px-2.5 py-1.5 items-center justify-between gap-2 min-w-0 ${
                bottomPlayerMode === 'preview' ? 'hidden lg:flex' : 'flex'
              }`}>
                <div className="flex items-center gap-2 min-w-0 w-1/3 shrink-0">
                  <div className="relative w-9 h-9 rounded overflow-hidden shrink-0 border border-red-500/40 bg-neutral-900">
                    <img
                      src={liveDisplayTrack?.station_cover || liveDisplayTrack?.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                      alt="air"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-red-400 block leading-none mb-0.5">
                      🔴 AL AIRE
                    </span>
                    <h4 className="font-bold text-[11px] text-white truncate leading-tight" title={liveDisplayTrack?.station_name || liveDisplayTrack?.title || 'Radio Café'}>
                      {liveDisplayTrack?.station_name || liveDisplayTrack?.title || 'Radio Café'}
                    </h4>
                    <p className="text-[9px] text-gray-400 truncate leading-tight">
                      {liveDisplayTrack?.station_artist || liveDisplayTrack?.artist || 'En Vivo'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-0.5 flex-1 max-w-xs min-w-0">
                  <div className="flex items-center gap-2">
                    <button onClick={handleAirPrev} className="p-0.5 text-gray-400 hover:text-red-400 transition">
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleAirPlayPause}
                      className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow"
                    >
                      {isPlayingLiveSignal ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                    <button onClick={handleAirNext} className="p-0.5 text-gray-400 hover:text-red-400 transition">
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleToggleAirShuffle}
                      className={`p-1 rounded transition ${isAirShuffle ? 'text-red-300 bg-red-500/20' : 'text-gray-400 hover:text-red-400'}`}
                    >
                      <Shuffle className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-full flex items-center gap-1.5 text-[9px] font-mono text-gray-400">
                    <span className="text-red-400 w-7 text-right shrink-0">{formatTime(airTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={airDuration || liveDisplayTrack?.duration || 180}
                      step="0.5"
                      value={airTime}
                      onChange={(e) => handleSeekAir(Number(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <span className="w-7 shrink-0">{formatTime(airDuration || liveDisplayTrack?.duration || 180)}</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const nextMute = !isAirMuted;
                      setIsAirMuted(nextMute);
                      if (masterAirAudioRef.current) {
                        masterAirAudioRef.current.muted = nextMute;
                        masterAirAudioRef.current.volume = nextMute ? 0 : airVolume;
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    {isAirMuted || airVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isAirMuted ? 0 : airVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAirVolume(val);
                      setIsAirMuted(false);
                      if (masterAirAudioRef.current) {
                        masterAirAudioRef.current.muted = false;
                        masterAirAudioRef.current.volume = val;
                      }
                    }}
                    className="w-14 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL DE EDICIÓN DE TODOS LOS CAMPOS */}
      <RadioEditModal 
        song={editingSong}
        isOpen={Boolean(editingSong)}
        onClose={() => setEditingSong(null)}
        onSave={handleSaveEdit}
        isSaving={isSavingEdit}
      />

      {/* GALERÍA DE CARÁTULAS MUSICCOVERS DE SUPABASE */}
      <MusicCoversGalleryModal 
        isOpen={showAlbumCoversModal}
        onClose={() => {
          setShowAlbumCoversModal(false);
          setTargetAlbumForCover(null);
        }}
        currentCoverUrl={targetAlbumForCover?.cover || ''}
        onSelectCover={(selectedUrl) => {
          if (targetAlbumForCover) {
            handleUpdateAlbumCover(targetAlbumForCover, selectedUrl);
          }
          setShowAlbumCoversModal(false);
          setTargetAlbumForCover(null);
        }}
      />

      {/* MODAL DE EDICIÓN DE ÁLBUMES EN REACT */}
      <AlbumEditModal 
        albumData={editingAlbumTarget}
        album={editingAlbumTarget}
        isOpen={Boolean(editingAlbumTarget)}
        onClose={() => setEditingAlbumTarget(null)}
        onSave={handleSaveAlbumModal}
        onDeleteAlbum={handleDeleteAlbum}
        isSaving={isSavingAlbum}
      />

      {/* MODAL DE LISTA DE CANCIONES Y DETALLE DE ÁLBUM */}
      <AlbumTracklistModal 
        album={selectedAlbumModalTarget}
        isOpen={Boolean(selectedAlbumModalTarget)}
        onClose={() => setSelectedAlbumModalTarget(null)}
        onPlayTrack={(track) => handlePlayPreview(track)}
        onPlayAlbum={(alb) => {
          if (alb.tracks && alb.tracks[0]) handlePlayPreview(alb.tracks[0]);
        }}
        onDeleteTrack={(trackId) => handleDeleteSong(trackId)}
        onEditAlbum={(alb) => setEditingAlbumTarget(alb)}
        onAddSongsToAlbum={(albumName, newSongs) => {
          setSongs(prev => [...prev, ...newSongs]);
        }}
      />

      {/* MODAL DE IMPORTACIÓN MASIVA Y PLAYLISTS DE YOUTUBE */}
      <YoutubeBulkModal 
        isOpen={showYoutubeBulkModal}
        onClose={() => setShowYoutubeBulkModal(false)}
        onImport={handleBulkImportYoutube}
        categories={availableCategories}
        existingSongs={youtubeSongs}
      />

      {/* MODAL DE CREACIÓN DE ÁLBUMES DESDE ARCHIVOS MP3 */}
      <CreateAlbumModal
        isOpen={showCreateAlbumModal}
        onClose={() => setShowCreateAlbumModal(false)}
        onAlbumCreated={handleAlbumCreated}
      />

      {/* MODAL DE CONTROL REMOTO Y OYENTES ACTIVOS */}
      <ListenersRemoteModal 
        isOpen={showListenersModal}
        onClose={() => setShowListenersModal(false)}
        listeners={listeners}
        activeListenersCount={activeListenersCount}
        batCatalog={batCatalog}
        songs={songs}
        selectedTargetList={selectedTargetListForRemote}
        setSelectedTargetList={setSelectedTargetListForRemote}
        onApplyListToRemoteListeners={handleApplyListToRemoteListeners}
        onForceReloadAll={() => broadcastForceReload('all')}
        onPauseAll={async () => {
          await sendRemoteCommand({ type: 'PAUSE', targetClientId: 'all' });
          setSuccess("⏸️ Comando de pausa enviado a todas las instancias.");
        }}
        onPlayAll={async () => {
          await sendRemoteCommand({ type: 'PLAY', targetClientId: 'all' });
          setSuccess("▶️ Comando de reproducción enviado a todas las instancias.");
        }}
        onNextAll={async () => {
          await sendRemoteCommand({ type: 'NEXT', targetClientId: 'all' });
          setSuccess("⏭️ Comando siguiente pista enviado a todas las instancias.");
        }}
        onReloadListener={handleReloadListener}
        onTogglePlayListener={handleTogglePlayListener}
        onNextTrackListener={handleNextTrackListener}
        currentMode={onAirTrack?.tab}
        onForceModeAll={handleForceModeAll}
        onSetVolumeAll={async (vol) => {
          await sendRemoteCommand({ type: 'SET_VOLUME', volume: vol, targetClientId: 'all' });
          setSuccess(`🔊 Volumen de todas las instancias de oyentes fijado a ${Math.round(vol * 100)}%`);
        }}
        onSetVolumeListener={async (clientId, vol) => {
          await sendRemoteCommand({ type: 'SET_VOLUME', volume: vol, targetClientId: clientId });
        }}
        tyrannySettings={tyrannySettings}
        onUpdateTyrannySettings={async (settings) => {
          await broadcastTyrannySettings(settings);
          setSuccess("👑 Ajustes tiránicos sincronizados y guardados.");
        }}
        currentTrackCover={onAirTrack?.station_cover || songs[0]?.cover || ''}
      />

    </div>
  );
}
