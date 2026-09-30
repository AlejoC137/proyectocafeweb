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
import { extractYoutubeId, getYoutubeThumbnail, fetchYoutubeMetadata, YOUTUBE_CATEGORIES } from '../utils/youtubeHelpers';
import fallbackCatalogData from '../data/localMusicCatalog.json';
import { 
  Play, Pause, Music, Upload, FolderUp, Trash2, Edit3, ArrowUp, ArrowDown, 
  GripVertical, Search, Filter, Layers, Disc, Tag, Calendar, Sparkles, 
  Clock, CheckSquare, Square, Volume2, VolumeX, SkipBack, SkipForward,
  Loader2, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Plus, Youtube, ExternalLink, Image as ImageIcon, ListPlus, RotateCcw, Shuffle, Radio, Users
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
  const [bottomPlayerMode, setBottomPlayerMode] = useState('live'); // 'live' o 'preview'
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(new Audio());
  const masterAirAudioRef = useRef(new Audio());

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

  // Biblioteca y Cola Sincronizada con el Bat
  const [batCatalog, setBatCatalog] = useState(() => {
    return Array.isArray(fallbackCatalogData) && fallbackCatalogData.length > 0 ? fallbackCatalogData : [];
  });
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedAirAlbumFolder, setSelectedAirAlbumFolder] = useState(() => {
    return (Array.isArray(fallbackCatalogData) && fallbackCatalogData[0]?.folderName) || '';
  });
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
    broadcastForceReload
  } = useRadioSync({ isManager: true });

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

  // Comprobar latido activo del .bat (tolerante para evitar falsas desconexiones)
  const checkBatHeartbeat = (record) => {
    if (!record) {
      setIsBatOnline(false);
      return false;
    }
    if (record.station_artist === 'OFFLINE') {
      setIsBatOnline(false);
      return false;
    }
    const updatedAt = record.updated_at ? new Date(record.updated_at).getTime() : 0;
    const diff = Date.now() - updatedAt;
    // 40 segundos de tolerancia para absorber cambios de pista y subidas mp3
    const online = diff < 40000;
    setIsBatOnline(online);
    return online;
  };

  // Cargar biblioteca sincronizada por el .bat: primero vía endpoint local Vite, fallback a Supabase Storage
  const fetchBatCatalog = async (silent = false) => {
    try {
      if (!silent) setLoadingCatalog(true);

      // 1. Intentar cargar desde el endpoint local de Vite o catálogo público de la web
      try {
        let localRes = await fetch(`/api/local-audio?file=catalog.json&t=${Date.now()}`);
        if (!localRes.ok) {
          localRes = await fetch(`/api/local-catalog?t=${Date.now()}`);
        }
        if (!localRes.ok) {
          localRes = await fetch(`/catalog.json?t=${Date.now()}`);
        }
        if (localRes.ok) {
          const localData = await localRes.json();
          if (Array.isArray(localData) && localData.length > 0) {
            setBatCatalog(localData);
            setSelectedAirAlbumFolder(prev => prev || localData[0]?.folderName || '');
            if (!silent) {
              const totalTracks = localData.reduce((a, b) => a + (b.tracks?.length || b.trackCount || 0), 0);
              setSuccess(`¡Biblioteca completa cargada! (${localData.length} álbumes, ${totalTracks} canciones).`);
            }
            return;
          }
        }
      } catch (e) {}

      // 2. Usar catálogo empaquetado si tiene la colección completa
      if (Array.isArray(fallbackCatalogData) && fallbackCatalogData.length > 0) {
        setBatCatalog(fallbackCatalogData);
        setSelectedAirAlbumFolder(prev => prev || fallbackCatalogData[0]?.folderName || '');
        if (!silent) {
          const totalTracks = fallbackCatalogData.reduce((a, b) => a + (b.tracks?.length || b.trackCount || 0), 0);
          setSuccess(`¡Biblioteca completa cargada! (${fallbackCatalogData.length} álbumes, ${totalTracks} canciones).`);
        }
      }

      // 3. Fallback a Supabase Storage sólo si tiene igual o más álbumes que el actual
      try {
        const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Radio/catalog.json?t=${Date.now()}`;
        const res = await fetch(storageUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data) && data.length >= 40) {
            setBatCatalog(data);
            setSelectedAirAlbumFolder(prev => prev || data[0]?.folderName || '');
          }
        }
      } catch (e) {}
    } catch (err) {
      console.warn("No se pudo cargar catalog.json:", err);
      setBatCatalog(prev => (prev && prev.length > 0 ? prev : (Array.isArray(fallbackCatalogData) ? fallbackCatalogData : [])));
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

  const filteredLibraryTracks = useMemo(() => {
    if (!librarySearchQuery.trim()) return libraryTracks;
    const q = librarySearchQuery.toLowerCase();
    return libraryTracks.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [libraryTracks, librarySearchQuery]);

  const albumList = useMemo(() => {
    if (batCatalog && batCatalog.length > 0) {
      return batCatalog;
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
          cover: (song.cover && !song.cover.startsWith('blob:')) ? song.cover : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400',
          tracks: [],
          totalDuration: 0
        });
      }

      const item = map.get(key);
      item.tracks.push(song);
      item.totalDuration += (song.duration || 0);
    });

    return Array.from(map.values());
  }, [songs]);

  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();

    // Consultar estado inicial del bat y de la señal al aire
    supabase.from('radio_current_play').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) {
        setOnAirTrack(data);
        checkBatHeartbeat(data);
        fetchBatCatalog(true); // Siempre cargar el catálogo disponible de canciones locales/en la nube

        // Si la señal al aire está activa en la base de datos, reanudar motor de emisión continua de fondo
        if (data.is_playing && data.station_url) {
          const liveUrl = getPreviewAudioUrl({ url: data.station_url });
          const elapsed = Math.max(0, (Date.now() - new Date(data.updated_at).getTime()) / 1000);
          setAirTime(elapsed);

          if (liveUrl) {
            const airAudio = masterAirAudioRef.current;
            airAudio.src = liveUrl;
            airAudio.muted = true; // Emisión continua silenciosa en cabina por defecto
            const seekAndPlay = () => {
              if (elapsed > 0 && airAudio.duration && elapsed < airAudio.duration) {
                airAudio.currentTime = elapsed;
              } else if (elapsed > 0) {
                airAudio.currentTime = elapsed;
              }
              airAudio.play().catch(() => {});
            };
            if (airAudio.readyState >= 1) {
              seekAndPlay();
            } else {
              airAudio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
              airAudio.load();
            }
          }
        }
      }
    });

    // Suscripción en tiempo real al estado de la señal de radio
    const channel = supabase
      .channel('radio-air-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_current_play' }, (payload) => {
        const row = payload.new;
        if (row) {
          setOnAirTrack(row);
          // Actualizar la fuente del monitor de cabina si se recibio la señal en vivo transmitida por el .bat
          if (row.station_url && (row.station_url.startsWith('http://') || row.station_url.startsWith('https://'))) {
            const airAudio = masterAirAudioRef.current;
            if (airAudio && airAudio.src !== row.station_url) {
              airAudio.src = row.station_url;
              if (isPlayingLiveSignal && row.is_playing) {
                airAudio.play().catch(() => {});
              }
            }
          }
          const online = checkBatHeartbeat(row);
          if (online && (row.station_artist === 'BAT_ONLINE' || row.station_artist === 'LIBRARY_LOADED' || row.station_name === 'BAT_READY')) {
            fetchBatCatalog(true);
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

      // Si la pista terminó en tiempo real, avanzar automáticamente la cola
      if (songDur > 5 && elapsed >= songDur) {
        console.log('[IncorruptibleClock] Canción finalizada en tiempo real. Avanzando cola...');
        handleAirNext();
      } else {
        setAirTime(elapsed);

        // Si el audio en cabina está activo, mantenerlo alineado
        const airAudio = masterAirAudioRef.current;
        if (airAudio && airAudio.src && !airAudio.paused) {
          if (Math.abs(airAudio.currentTime - elapsed) > 3) {
            airAudio.currentTime = elapsed;
          }
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

  // Control de audio preview
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setPreviewTime(audio.currentTime);
      if (isPlayingLiveSignal && audio.src) {
        try {
          const bc = new BroadcastChannel('radio-live-time');
          bc.postMessage({
            type: 'LIVE_TICK',
            currentTime: audio.currentTime,
            timestamp: Date.now(),
            url: audio.src
          });
          bc.close();
        } catch (e) {}
      }
    };
    const handleLoadedMetadata = () => setPreviewDuration(audio.duration || 0);
    const handleEnded = () => playNextPreview();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [previewTrack, songs]);

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
      console.log('[MasterBroadcaster] Canción al aire finalizada. Avanzando automáticamente en la cola...');
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

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    if (masterAirAudioRef.current) {
      masterAirAudioRef.current.muted = !isPlayingLiveSignal || isMuted;
      masterAirAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isPlayingLiveSignal]);

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
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const liveStreamUrl = (onAirTrack?.station_url && (onAirTrack.station_url.startsWith('http://') || onAirTrack.station_url.startsWith('https://')))
      ? onAirTrack.station_url
      : null;

    if (song.station_url) {
      if (song.station_url.startsWith('http://') || song.station_url.startsWith('https://')) {
        return song.station_url;
      }
      if (song.station_url.startsWith('/')) {
        return song.station_url;
      }
      if (song.station_url.startsWith('local://')) {
        const raw = decodeURIComponent(song.station_url.substring(8));
        return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(raw)}` : liveStreamUrl;
      }
    }
    if (song.filePath) {
      return `/api/local-audio?path=${encodeURIComponent(song.filePath)}`;
    }
    if (song.url) {
      if (song.url.startsWith('http://') || song.url.startsWith('https://') || song.url.startsWith('/')) {
        return song.url;
      }
      if (song.url.startsWith('local://')) {
        const fileName = song.fileName || decodeURIComponent(song.url.substring(8));
        return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(fileName)}` : liveStreamUrl;
      }
    }
    if (song.fileName) {
      return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(song.fileName)}` : liveStreamUrl;
    }
    if (song.title) {
      return isLocalHost ? `/api/local-audio?file=${encodeURIComponent(song.title + '.mp3')}` : liveStreamUrl;
    }
    return null;
  };

  // Manejo de Reproducción Preview / Pre-escucha CUE en Radio Manager (Modo Azul)
  const handlePlayPreview = async (song) => {
    if (!song) return;

    // Cambiar la barra inferior inmediatamente a MODO AZUL (Biblioteca)
    setBottomPlayerMode('preview');

    if (previewTrack?.id === song.id && (previewTrack?.title === song.title || previewTrack?.fileName === song.fileName)) {
      if (isPlayingPreview) {
        audioRef.current?.pause();
        setIsPlayingPreview(false);
      } else {
        try {
          if (!audioRef.current?.src || audioRef.current?.src === 'about:blank' || audioRef.current?.src === window.location.href) {
            const audioUrl = getPreviewAudioUrl(song);
            if (audioUrl) {
              audioRef.current.src = audioUrl;
              audioRef.current.load();
            }
          }
          await audioRef.current?.play();
          setIsPlayingPreview(true);
        } catch (e) {
          console.warn("Error reanudando preview:", e);
        }
      }
      return;
    }

    setPreviewTrack(song);
    const audioUrl = getPreviewAudioUrl(song);
    if (!audioUrl) {
      setError(`No se encontró ruta de audio para pre-escuchar "${song.title}". Asegúrate de que existe en la carpeta de música.`);
      setIsPlayingPreview(false);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlayingPreview(true);
        setSuccess(`🎧 Modo Azul Activado: Pre-escuchando "${song.title}"`);
      }
    } catch (err) {
      console.warn("Error en reproducción preview:", err);
      // Mantener la pista en la barra para que el usuario pueda verla e interactuar
      setIsPlayingPreview(false);
    }
  };

  // --- CONTROLES DE CABECERA DE LA BIBLIOTECA (PRE-ESCUCHA INTERNA MODO AZUL) ---
  const handleToggleLibraryPreview = () => {
    setBottomPlayerMode('preview');
    if (isPlayingPreview) {
      audioRef.current?.pause();
      setIsPlayingPreview(false);
      return;
    }
    if (previewTrack) {
      if (!audioRef.current?.src || audioRef.current?.src === 'about:blank' || audioRef.current?.src === window.location.href) {
        handlePlayPreview(previewTrack);
      } else {
        audioRef.current?.play().catch(() => {
          handlePlayPreview(previewTrack);
        });
        setIsPlayingPreview(true);
      }
      return;
    }
    const target = (filteredLibraryTracks && filteredLibraryTracks[0]) || 
                   (libraryTracks && libraryTracks[0]) || 
                   (batCatalog && batCatalog[0]?.tracks && batCatalog[0].tracks[0]);
    if (target) {
      handlePlayPreview(target);
    }
  };

  const handleNextLibraryPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    if (!previewTrack) {
      handlePlayPreview(filteredLibraryTracks[0]);
      return;
    }
    const currIdx = filteredLibraryTracks.findIndex(t => t.id === previewTrack.id || t.title === previewTrack.title);
    const nextIdx = (currIdx + 1) % filteredLibraryTracks.length;
    handlePlayPreview(filteredLibraryTracks[nextIdx]);
  };

  const handleRandomLibraryPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredLibraryTracks.length);
    handlePlayPreview(filteredLibraryTracks[randomIdx]);
  };

  // --- CONTROLES DE CABECERA DE LA COLA (AL AIRE EN RADIO PROYECTO) ---
  // Switch Maestro ON AIR: Prender / Apagar la emisión de la cola en Radio Proyecto
  // Switch Maestro ON AIR / OFF AIR: Autoriza o determina si se está mandando la señal a los receptores de Proyecto Radio
  const handleToggleOnAirSwitch = async () => {
    try {
      const isCurrentlyAir = Boolean(onAirTrack?.is_playing);
      const nextOnAir = !isCurrentlyAir;

      if (!nextOnAir) {
        // Apagar transmisión hacia Proyecto Radio (OFF AIR)
        // REGLA: El switch ON/OFF AIR solo corta la transmisión a receptores; NO altera el nombre de la pista
        let currentSecond = 0;
        if (masterAirAudioRef.current && masterAirAudioRef.current.currentTime > 0) {
          currentSecond = masterAirAudioRef.current.currentTime;
        } else if (airTime > 0) {
          currentSecond = airTime;
        } else if (onAirTrack?.updated_at) {
          currentSecond = Math.max(0, (Date.now() - new Date(onAirTrack.updated_at).getTime()) / 1000);
        }

        setOnAirTrack(prev => ({
          ...(prev || {}),
          is_playing: false,
          paused_position: currentSecond
        }));

        await supabase.from('radio_current_play').update({
          is_playing: false,
          tab: String(Math.round(currentSecond * 10) / 10)
        }).eq('id', 1);

        await sendRemoteCommand({ type: 'PAUSE', targetClientId: 'all' });
        setSuccess("⚫ Switch OFF AIR: Transmisión desautorizada. Receptores de Proyecto Radio silenciados.");
      } else {
        // Autorizar transmisión hacia Proyecto Radio (ON AIR)
        const airAudio = masterAirAudioRef.current;
        const currentSong = onAirTrack?.station_name 
          ? onAirTrack 
          : (songs[0] || null);

        if (!currentSong && batCatalog.length > 0) {
          await handleGoRandom(15);
          return;
        }

        if (!currentSong) {
          setError("No hay canciones en la cola para autorizar la emisión.");
          return;
        }

        const resumeFromSecond = (onAirTrack?.paused_position != null)
          ? Number(onAirTrack.paused_position)
          : (parseFloat(onAirTrack?.tab) || airTime || 0);

        const startedAt = new Date(Date.now() - resumeFromSecond * 1000).toISOString();

        // Si el motor maestro de audio no estaba reproduciendo aún, arrancarlo
        const liveUrl = getPreviewAudioUrl(currentSong);
        if (liveUrl) {
          const currentSrcPath = airAudio.src ? new URL(airAudio.src, window.location.origin).pathname + new URL(airAudio.src, window.location.origin).search : '';
          const isSameSrc = (currentSrcPath === liveUrl || airAudio.src === liveUrl);

          if (!isSameSrc) {
            airAudio.src = liveUrl;
            airAudio.load();
          }
          airAudio.currentTime = resumeFromSecond;
          airAudio.muted = isMuted;
          airAudio.volume = isMuted ? 0 : volume;
          setIsPlayingLiveSignal(true);
          await airAudio.play().catch(() => {});
        }

        setAirTime(resumeFromSecond);

        const validLiveUrl = (currentSong.station_url && currentSong.station_url.startsWith('http'))
          ? currentSong.station_url
          : ((currentSong.url && currentSong.url.startsWith('http'))
            ? currentSong.url
            : ((onAirTrack?.station_url && onAirTrack.station_url.startsWith('http')) ? onAirTrack.station_url : null));

        const updatePayload = {
          station_name: currentSong.station_name || currentSong.title,
          station_artist: currentSong.station_artist || currentSong.artist || 'Radio Café',
          station_cover: currentSong.station_cover || currentSong.cover || '',
          is_playing: true,
          updated_at: startedAt,
          tab: 'supabase'
        };
        if (validLiveUrl) {
          updatePayload.station_url = validLiveUrl;
        }

        setOnAirTrack({
          ...updatePayload,
          station_url: validLiveUrl || currentSong.station_url || currentSong.url || '',
          paused_position: null
        });

        await supabase.from('radio_current_play').update(updatePayload).eq('id', 1);

        await sendRemoteCommand({ type: 'PLAY', targetClientId: 'all', payload: { position: resumeFromSecond, startedAt } });
        setSuccess("🟢 Switch ON AIR activado: Emisión autorizada y transmitiendo en vivo a Proyecto Radio.");
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

  const handleAirPrev = async () => {
    const airAudio = masterAirAudioRef.current;
    if (airAudio.currentTime > 3) {
      await handleSeekAir(0);
      return;
    }
    if (songs.length === 0) return;
    try {
      const prevSong = songs[songs.length - 1];
      const updatedSongs = [prevSong, ...songs.slice(0, songs.length - 1)];
      setSongs(updatedSongs);

      setOnAirTrack(prev => ({
        ...(prev || {}),
        station_name: prevSong.title,
        station_artist: prevSong.artist || 'Radio Café',
        station_url: (prevSong.url && prevSong.url.startsWith('http')) ? prevSong.url : (prev?.station_url || ''),
        station_cover: prevSong.cover || '',
        is_playing: true,
        updated_at: new Date().toISOString()
      }));

      const nextUrl = getPreviewAudioUrl(prevSong);
      if (nextUrl) {
        airAudio.src = nextUrl;
        airAudio.currentTime = 0;
        airAudio.muted = isMuted;
        airAudio.volume = isMuted ? 0 : volume;
        setIsPlayingLiveSignal(true);
        airAudio.load();
        airAudio.play().catch(() => {});
      }

      const validPrevUrl = (prevSong.url && prevSong.url.startsWith('http')) 
        ? prevSong.url 
        : ((onAirTrack?.station_url && onAirTrack.station_url.startsWith('http')) ? onAirTrack.station_url : null);

      const prevPayload = {
        station_name: prevSong.title,
        station_artist: `REQUEST:${prevSong.title}`,
        station_cover: prevSong.cover || '',
        is_playing: true,
        updated_at: new Date().toISOString()
      };
      if (validPrevUrl) {
        prevPayload.station_url = validPrevUrl;
      }

      await supabase.from('radio_current_play').update(prevPayload).eq('id', 1);

      await sendRemoteCommand({
        type: 'NEXT',
        targetClientId: 'all',
        payload: { track: prevSong }
      });

      setSuccess(`⏮ Al aire: "${prevSong.title}" - ${prevSong.artist || 'Radio Café'}`);
    } catch (e) {
      setError("Error retrocediendo canción: " + e.message);
    }
  };

  // BOTÓN: Escuchar la señal que está saliendo al aire en vivo (NUNCA REINICIA LA CANCIÓN)
  const handleToggleListenLive = async () => {
    const airAudio = masterAirAudioRef.current;

    // Si ya estamos escuchando la señal en cabina, simplemente silenciar el monitor (la radio sigue de fondo)
    if (isPlayingLiveSignal) {
      airAudio.muted = true;
      setIsPlayingLiveSignal(false);
      setSuccess("🔇 Monitor de cabina silenciado (la emisión sigue activa de fondo).");
      return;
    }

    // Activar modo EN VIVO en la barra inferior
    setBottomPlayerMode('live');

    // Si la pre-escucha de la biblioteca estaba sonando, pausarla para no encimar audios
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    }

    let liveTrack = onAirTrack?.station_url ? onAirTrack : (songs[0] || null);
    let liveUrl = liveTrack ? getPreviewAudioUrl(liveTrack) : null;

    if (!liveUrl) {
      setError("No hay pista activa en la cola para escuchar. Agrega canciones a la cola.");
      return;
    }

    try {
      const currentSrcPath = airAudio.src 
        ? new URL(airAudio.src, window.location.origin).pathname + new URL(airAudio.src, window.location.origin).search 
        : '';
      const isSameSrc = (currentSrcPath === liveUrl || airAudio.src === liveUrl || (airAudio.src && airAudio.src.includes(encodeURIComponent(liveTrack.station_name || liveTrack.title || ''))));

      // Calcular el segundo exacto donde va la emisión
      let elapsed = 0;
      if (!onAirTrack?.is_playing && onAirTrack?.tab && !isNaN(parseFloat(onAirTrack.tab))) {
        elapsed = parseFloat(onAirTrack.tab);
      } else if (onAirTrack?.updated_at) {
        elapsed = Math.max(0, (Date.now() - new Date(onAirTrack.updated_at).getTime()) / 1000);
      } else if (airTime > 0) {
        elapsed = airTime;
      }

      // SOLO cargar si el audio maestro NO tenía esta pista ya cargada
      if (!airAudio.src || !isSameSrc) {
        airAudio.src = liveUrl;
        airAudio.load();
        const seekOnReady = () => {
          if (elapsed > 0) {
            airAudio.currentTime = elapsed;
          }
          setAirTime(airAudio.currentTime);
        };
        if (airAudio.readyState >= 1) {
          seekOnReady();
        } else {
          airAudio.addEventListener('loadedmetadata', seekOnReady, { once: true });
        }
      } else {
        // La pista ya está cargada: verificar sincronía
        if (elapsed > 0 && Math.abs(airAudio.currentTime - elapsed) > 3) {
          airAudio.currentTime = elapsed;
        }
        setAirTime(airAudio.currentTime);
      }

      airAudio.muted = false;
      airAudio.volume = isMuted ? 0 : volume;
      if (onAirTrack?.is_playing && airAudio.paused) {
        await airAudio.play().catch(() => {});
      }
      setIsPlayingLiveSignal(true);
      setSuccess(`📻 🔊 Monitor de cabina activado: escuchando "${onAirTrack?.station_name || songs[0]?.title || 'Radio al Aire'}"`);
    } catch (err) {
      setError("No se pudo activar el monitor en vivo: " + err.message);
      setIsPlayingLiveSignal(false);
    }
  };

  // Control PLAY / PAUSA de la Emisión: Pausa o reanuda la reproducción sin reiniciar la canción ni cambiar nombre
  const handleAirPlayPause = async () => {
    const airAudio = masterAirAudioRef.current;
    if (!airAudio) return;

    const isCurrentlyPlaying = Boolean(onAirTrack?.is_playing);

    if (isCurrentlyPlaying) {
      // --- ACCIÓN: PAUSAR ---
      let currentSecond = 0;
      if (airAudio && !isNaN(airAudio.currentTime) && airAudio.currentTime > 0) {
        currentSecond = airAudio.currentTime;
      } else if (airTime > 0) {
        currentSecond = airTime;
      } else if (onAirTrack?.updated_at) {
        currentSecond = Math.max(0, (Date.now() - new Date(onAirTrack.updated_at).getTime()) / 1000);
      }

      // Pausar motor local maestro
      airAudio.pause();

      setOnAirTrack(prev => ({
        ...(prev || {}),
        is_playing: false,
        paused_position: currentSecond
      }));

      // Guardar en Supabase: congelar posición en 'tab' SIN cambiar station_name ni resetear updated_at
      await supabase.from('radio_current_play').update({
        is_playing: false,
        tab: String(Math.round(currentSecond * 10) / 10)
      }).eq('id', 1);

      try {
        if (liveTimeBcRef.current) {
          liveTimeBcRef.current.postMessage({
            type: 'PAUSE',
            currentTime: currentSecond,
            timestamp: Date.now()
          });
        }
      } catch (e) {}

      await sendRemoteCommand({
        type: 'PAUSE',
        targetClientId: 'all',
        payload: { position: currentSecond }
      });

      setSuccess(`⏸ Emisión en vivo pausada en ${formatTime(currentSecond)}.`);
    } else {
      // --- ACCIÓN: REANUDAR (PLAY) ---
      let songToPlay = onAirTrack?.station_name ? onAirTrack : (songs[0] || null);
      if (!songToPlay && songs.length > 0) songToPlay = songs[0];

      if (!songToPlay) {
        setError("No hay canciones en la cola para reproducir.");
        return;
      }

      // Obtener el segundo exacto donde se pausó
      const resumeFromSecond = (onAirTrack?.paused_position != null)
        ? Number(onAirTrack.paused_position)
        : (parseFloat(onAirTrack?.tab) || airTime || 0);

      const newStartedAt = new Date(Date.now() - resumeFromSecond * 1000).toISOString();

      const liveUrl = getPreviewAudioUrl(songToPlay);
      if (liveUrl) {
        const currentSrcPath = airAudio.src ? new URL(airAudio.src, window.location.origin).pathname + new URL(airAudio.src, window.location.origin).search : '';
        const isSameSrc = (currentSrcPath === liveUrl || airAudio.src === liveUrl);

        if (!isSameSrc || !airAudio.src) {
          airAudio.src = liveUrl;
          airAudio.load();
        }
        airAudio.currentTime = resumeFromSecond;
        airAudio.muted = isMuted;
        airAudio.volume = isMuted ? 0 : volume;
        setIsPlayingLiveSignal(true);
        await airAudio.play().catch(() => {});
      }

      setAirTime(resumeFromSecond);

      const validPlayUrl = (songToPlay.station_url && songToPlay.station_url.startsWith('http'))
        ? songToPlay.station_url
        : ((songToPlay.url && songToPlay.url.startsWith('http'))
          ? songToPlay.url
          : ((onAirTrack?.station_url && onAirTrack.station_url.startsWith('http')) ? onAirTrack.station_url : null));

      const playPayload = {
        station_name: songToPlay.station_name || songToPlay.title,
        station_artist: `REQUEST:${songToPlay.station_name || songToPlay.title}`,
        station_cover: songToPlay.station_cover || songToPlay.cover || '',
        is_playing: true,
        updated_at: newStartedAt,
        tab: 'supabase'
      };
      if (validPlayUrl) {
        playPayload.station_url = validPlayUrl;
      }

      setOnAirTrack(prev => ({
        ...(prev || {}),
        ...playPayload,
        station_url: validPlayUrl || songToPlay.station_url || songToPlay.url || '',
        paused_position: null
      }));

      await supabase.from('radio_current_play').update(playPayload).eq('id', 1);

      try {
        if (liveTimeBcRef.current) {
          liveTimeBcRef.current.postMessage({
            type: 'PLAY',
            currentTime: resumeFromSecond,
            startedAt: newStartedAt,
            url: airAudio.src
          });
        }
      } catch (e) {}

      await sendRemoteCommand({
        type: 'PLAY',
        targetClientId: 'all',
        payload: { position: resumeFromSecond, startedAt: newStartedAt }
      });

      setSuccess(`▶ Emisión en vivo reanudada desde ${formatTime(resumeFromSecond)}.`);
    }
  };

  const handleAirNext = async () => {
    if (songs.length === 0) {
      setError("No hay canciones en la cola de emisión para avanzar.");
      return;
    }
    try {
      const nextSong = songs[1] || songs[0];
      const updatedSongs = songs.length > 1 ? [...songs.slice(1), songs[0]] : songs;
      setSongs(updatedSongs);

      setOnAirTrack(prev => ({
        ...(prev || {}),
        station_name: nextSong.title,
        station_artist: nextSong.artist || 'Radio Café',
        station_url: (nextSong.url && nextSong.url.startsWith('http')) ? nextSong.url : (prev?.station_url || ''),
        station_cover: nextSong.cover || '',
        is_playing: true,
        updated_at: new Date().toISOString()
      }));

      // Actualizar el motor maestro de emisión continua
      const airAudio = masterAirAudioRef.current;
      const nextUrl = getPreviewAudioUrl(nextSong);
      if (nextUrl) {
        airAudio.src = nextUrl;
        airAudio.currentTime = 0;
        airAudio.muted = isMuted;
        airAudio.volume = isMuted ? 0 : volume;
        setIsPlayingLiveSignal(true);
        airAudio.load();
        airAudio.play().catch(() => {});
      }

      const validNextUrl = (nextSong.url && nextSong.url.startsWith('http')) 
        ? nextSong.url 
        : ((onAirTrack?.station_url && onAirTrack.station_url.startsWith('http')) ? onAirTrack.station_url : null);

      const nextPayload = {
        station_name: nextSong.title,
        station_artist: `REQUEST:${nextSong.title}`,
        station_cover: nextSong.cover || '',
        is_playing: true,
        updated_at: new Date().toISOString()
      };
      if (validNextUrl) {
        nextPayload.station_url = validNextUrl;
      }

      await supabase.from('radio_current_play').update(nextPayload).eq('id', 1);

      await sendRemoteCommand({
        type: 'NEXT',
        targetClientId: 'all',
        payload: {
          track: nextSong
        }
      });

      setSuccess(`⏭ Al aire: "${nextSong.title}" - ${nextSong.artist || 'Radio Café'}`);
    } catch (e) {
      setError("Error saltando canción: " + e.message);
    }
  };

  const handleAirShuffle = async () => {
    if (songs.length > 1) {
      await handleShuffleAirList();
    } else {
      await handleGoRandom(15);
    }
  };

  const handleAddTrackToQueue = async (track) => {
    try {
      const nextIndex = songs.length;
      const cleanTrack = {
        title: track.title,
        artist: track.artist || track.albumArtist || 'Radio Café',
        album: track.album || 'Sencillo',
        url: track.url || `local://${encodeURIComponent(track.fileName)}`,
        duration: track.duration || 210,
        cover: track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        order_index: nextIndex
      };
      const { error } = await supabase.from('playlist_radio').insert([cleanTrack]);
      if (error) throw error;
      await supabase.from('radio_current_play').update({
        station_artist: 'SYNC',
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      // Notificar de inmediato a otras pestañas (como ProyectoRadio) para que agreguen la canción en caliente sin recargar la página
      try {
        const bc = new BroadcastChannel('radio-playlist-channel');
        bc.postMessage({ type: 'PLAYLIST_UPDATED', track: cleanTrack, timestamp: Date.now() });
        bc.close();
      } catch (e) {}

      await sendRemoteCommand({
        type: 'PLAYLIST_UPDATED',
        targetClientId: 'all',
        payload: { track: cleanTrack }
      });

      await fetchSongs();
      setSuccess(`➕ Canción "${track.title}" añadida a la cola.`);
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
      const { error: insErr } = await supabase.from('playlist_radio').insert(tracksToInsert);
      if (insErr) throw insErr;
      await supabase.from('radio_current_play').update({
        station_artist: `ALBUM:${albumItem.albumName}`,
        station_name: `Cambiando a ${albumItem.albumName}...`,
        is_playing: true,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
      setSuccess(`📻 ¡Álbum "${albumItem.albumName}" cargado en la cola al aire!`);
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
      await supabase.from('playlist_radio').insert(tracksToInsert);
      await supabase.from('radio_current_play').update({
        station_artist: 'START_BROADCAST',
        station_name: 'Mix Aleatorio Dinámico',
        is_playing: true,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
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
      for (let i = 0; i < shuffled.length; i++) {
        await supabase.from('playlist_radio').update({ order_index: i }).eq('id', shuffled[i].id);
      }
      await supabase.from('radio_current_play').update({
        station_artist: "SYNC",
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
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
      const { data } = await supabase.from('radio_current_play').select('*').eq('id', 1).single();
      const online = checkBatHeartbeat(data);
      if (!online) {
        setBatCatalog([]);
        setError("El .bat no está abierto. Inicia 'iniciar_radio.bat' en G:\\Mi unidad\\Radio para conectar la biblioteca.");
        setIsUpdatingAirList(false);
        return;
      }
      await fetchBatCatalog(false);
      await fetchSongs();
      await supabase.from('radio_current_play').update({
        station_artist: "SYNC",
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSuccess("🔄 ¡Sincronizado con el Bat en vivo!");
    } catch (err) {
      setError("Error al sincronizar: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const playNextPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    if (!previewTrack) {
      handlePlayPreview(filteredLibraryTracks[0]);
      return;
    }
    const currIdx = filteredLibraryTracks.findIndex(t => t.id === previewTrack.id || t.title === previewTrack.title);
    const nextIdx = (currIdx + 1) % filteredLibraryTracks.length;
    handlePlayPreview(filteredLibraryTracks[nextIdx]);
  };

  const playPrevPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    if (!previewTrack) {
      handlePlayPreview(filteredLibraryTracks[0]);
      return;
    }
    const currIdx = filteredLibraryTracks.findIndex(t => t.id === previewTrack.id || t.title === previewTrack.title);
    const prevIdx = (currIdx - 1 + filteredLibraryTracks.length) % filteredLibraryTracks.length;
    handlePlayPreview(filteredLibraryTracks[prevIdx]);
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

  return (
    <div 
      className={`min-h-screen bg-[#121212] text-white font-sans p-4 sm:p-8 pb-32 transition-colors ${isDragOver ? 'border-4 border-dashed border-[#1DB954]' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER PRINCIPAL SPOTIFY */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1DB954] text-black rounded-2xl shadow-xl shadow-[#1DB954]/20">
                <Music className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                  Radio Studio Manager <span className="text-xs px-3 py-1 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-extrabold border border-[#1DB954]/30 uppercase tracking-widest">Spotify Style</span>
                </h1>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Gestión integral de playlist de radio, metadatos ID3, carpetas, álbumes y enlaces de YouTube
                </p>
              </div>
            </div>
          </div>

          {/* ACCIONES DE CARGA Y SUBIDA */}
          <div className="flex items-center gap-3 w-full md:w-auto">
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
              className="flex-1 md:flex-none px-5 py-3 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-[#1DB954]/20"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              Subir MP3s
            </button>

            <button 
              onClick={() => folderInputRef.current?.click()}
              className="flex-1 md:flex-none px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider border border-white/15 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <FolderUp className="w-4 h-4" />
              Subir Carpeta Completa
            </button>

            <button 
              onClick={handleForceRestart}
              disabled={isRestarting}
              title="Forzar el reinicio completo de la radio, detener la transmisión activa y recargar listas"
              className="flex-1 md:flex-none px-5 py-3 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider border border-red-500/40 transition flex items-center justify-center gap-2 shadow-xl shadow-red-900/30 disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isRestarting ? 'animate-spin' : ''}`} />
              {isRestarting ? 'Reiniciando...' : 'Forzar Reinicio'}
            </button>
          </div>
        </div>

        {/* SWITCHER DE PESTAÑAS PRINCIPALES */}
        <div className="flex border-b border-white/10 gap-3 sm:gap-6 pt-2">
          <button 
            onClick={() => setManagerTab('mp3')}
            className={`pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
              managerTab === 'mp3' ? 'border-[#1DB954] text-[#1DB954]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" /> Gestor MP3 ({songs.length})
          </button>

          <button 
            onClick={() => setManagerTab('albums')}
            className={`pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
              managerTab === 'albums' ? 'border-[#1DB954] text-[#1DB954]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4 text-emerald-400" /> Gestor de Álbumes ({albumList.length})
          </button>

          <button 
            onClick={() => setManagerTab('youtube')}
            className={`pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
              managerTab === 'youtube' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-500 fill-current" /> YouTube Manager ({youtubeSongs.length})
          </button>
        </div>

        {managerTab === 'mp3' ? (
          <div className="space-y-6">

            {/* BARRA SUPERIOR DE ESTADO Y VISTAS */}
            <div className="bg-[#181818] p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isBatOnline ? 'bg-emerald-500' : 'bg-red-500'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isBatOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    PARRILLA DINÁMICA AL AIRE
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isBatOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {isBatOnline ? '🟢 BAT CONECTADO' : '🔴 BAT DESCONECTADO'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isBatOnline 
                      ? 'Emisión sincronizada en vivo con G:\\Mi unidad\\Radio.' 
                      : 'Inicia "iniciar_radio.bat" en tu PC para conectar la biblioteca y transmitir.'}
                  </p>
                </div>
              </div>

              {/* BOTÓN SINCRONIZAR BAT */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncWithBat}
                  disabled={isUpdatingAirList}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 border border-white/10 shadow-md disabled:opacity-50"
                  title="Recargar catálogo y sincronizar con el bat"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingAirList ? 'animate-spin text-[#1DB954]' : 'text-gray-300'}`} />
                  <span>Sincronizar Bat</span>
                </button>
              </div>
            </div>

            {/* SELECTOR DE VISTAS: SPLIT, BIBLIOTECA, COLA */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMp3ViewMode('split')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    mp3ViewMode === 'split'
                      ? 'bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Consola Dividida (DJ Split)
                </button>
                <button
                  onClick={() => setMp3ViewMode('library')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    mp3ViewMode === 'library'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FolderUp className="w-3.5 h-3.5" /> Solo Biblioteca ({libraryTracks.length})
                </button>
                <button
                  onClick={() => setMp3ViewMode('queue')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    mp3ViewMode === 'queue'
                      ? 'bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" /> Solo Cola Al Aire ({songs.length})
                </button>
              </div>

              <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-2">
                <span>💡 Arrastra canciones de la izquierda a la derecha para sumarlas a la cola</span>
              </div>
            </div>

            {/* GRID DUAL PANEL 50% / 50% */}
            <div className="w-full">
              <div className={`w-full ${mp3ViewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : ''}`}>

                {/* ========================================================================= */}
                {/* PANEL IZQUIERDO: BIBLIOTECA COMPLETA DE LA CARPETA (CON PLAY, NEXT, ALEATORIO) */}
                {/* ========================================================================= */}
                {(mp3ViewMode === 'split' || mp3ViewMode === 'library') && (
                  <div className="w-full bg-[#181818] pt-6 px-5 pb-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[780px]">
                    {/* CABECERA PANEL IZQUIERDO */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-1">
                      {/* FILA 1: TÍTULO Y CONTEO */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="pt-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FolderUp className="w-5 h-5 text-cyan-400 shrink-0" />
                            <h4 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                              Biblioteca de la Carpeta
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                              {libraryTracks.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                            G:\\Mi unidad\\Radio
                          </p>
                        </div>
                      </div>

                      {/* FILA 2: BARRA DE CONTROLES PLAYBACK BIBLIOTECA (GRID 3 COLUMNAS SIN DESBORDE) */}
                      <div className="grid grid-cols-3 gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                        <button
                          onClick={handleToggleLibraryPreview}
                          className="py-2 px-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                          title="Reproducir o pausar pre-escucha de la biblioteca en Radio Manager"
                        >
                          {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5 shrink-0" />}
                          <span className="truncate">{isPlayingPreview ? 'Pausa' : 'Play'}</span>
                        </button>
                        <button
                          onClick={handleNextLibraryPreview}
                          className="py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                          title="Saltar a la siguiente canción en biblioteca"
                        >
                          <SkipForward className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Next</span>
                        </button>
                        <button
                          onClick={handleRandomLibraryPreview}
                          className="py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                          title="Pre-escuchar canción aleatoria de la biblioteca"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">Aleatorio</span>
                        </button>
                      </div>

                      {/* SUB-CABECERA: BUSCADOR Y SELECTOR DE VISTA DE BIBLIOTECA */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={librarySearchQuery}
                            onChange={e => setLibrarySearchQuery(e.target.value)}
                            placeholder="Buscar en la biblioteca local..."
                            className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={() => setLibraryViewType('tracks')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              libraryViewType === 'tracks'
                                ? 'bg-cyan-500 text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <Music className="w-3 h-3" /> Canciones ({filteredLibraryTracks.length})
                          </button>
                          <button
                            onClick={() => setLibraryViewType('albums')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              libraryViewType === 'albums'
                                ? 'bg-cyan-500 text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <Disc className="w-3 h-3" /> Álbumes ({batCatalog.length})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CUERPO DEL PANEL IZQUIERDO */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-3 space-y-1.5">
                      {batCatalog.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-gray-400">
                          <FolderUp className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                          <div>
                            <p className="text-sm font-extrabold text-white">Biblioteca no conectada</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                              Ejecuta <code>iniciar_radio.bat</code> en <code>G:\\Mi unidad\\Radio</code> para indexar tus canciones MP3.
                            </p>
                          </div>
                          <button
                            onClick={handleSyncWithBat}
                            disabled={isUpdatingAirList}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingAirList ? 'animate-spin' : ''}`} />
                            <span>Comprobar Bat</span>
                          </button>
                        </div>
                      ) : libraryViewType === 'tracks' ? (
                        /* VISTA POR CANCIONES DE LA BIBLIOTECA */
                        filteredLibraryTracks.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-xs">
                            No se encontraron canciones que coincidan con la búsqueda.
                          </div>
                        ) : (
                          filteredLibraryTracks.map((track, idx) => {
                            const isCurrentPreview = (previewTrack?.title === track.title || previewTrack?.fileName === track.fileName) && isPlayingPreview;
                            return (
                              <div
                                key={track.id || track.fileName || idx}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify(track));
                                }}
                                onClick={() => handlePlayPreview(track)}
                                className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                  isCurrentPreview
                                    ? 'bg-cyan-500/15 border-cyan-400/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                                    : 'bg-black/40 hover:bg-white/5 border-white/5 hover:border-cyan-500/30'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                  <span className="text-[11px] font-mono text-gray-500 w-5 text-right shrink-0">
                                    {idx + 1}
                                  </span>

                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800 border border-white/10 relative">
                                    <img
                                      src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'}
                                      alt={track.title}
                                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-bold truncate leading-tight ${isCurrentPreview ? 'text-cyan-400' : 'text-white'}`} title={track.title}>
                                      {track.title}
                                    </p>
                                    <p className="text-[11px] text-gray-400 truncate" title={`${track.artist || track.albumArtist} • ${track.album}`}>
                                      {track.artist || track.albumArtist} <span className="text-gray-600">•</span> {track.album}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[11px] font-mono text-gray-400 mr-1 hidden sm:inline">
                                    {formatTime(track.duration || 210)}
                                  </span>

                                  {/* BOTÓN PRE-ESCUCHA (HEADPHONES PREVIEW MODO AZUL) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayPreview(track);
                                    }}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                      isCurrentPreview
                                        ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/30 ring-2 ring-cyan-300'
                                        : 'bg-white/10 hover:bg-cyan-400 hover:text-black text-gray-300'
                                    }`}
                                    title="Pre-escuchar en audífonos (Modo Azul)"
                                  >
                                    {isCurrentPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                  </button>

                                  {/* BOTÓN AGREGAR A LA COLA */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddTrackToQueue(track);
                                    }}
                                    className="px-2 py-1 bg-white/10 hover:bg-[#1DB954] hover:text-black text-gray-200 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1"
                                    title="Añadir a la cola de emisión de la derecha"
                                  >
                                    <Plus className="w-3 h-3" /> Cola
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        /* VISTA POR ÁLBUMES DE LA BIBLIOTECA */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {batCatalog.map(alb => {
                            const isExpanded = expandedLibraryAlbum === (alb.folderName || alb.albumName);
                            const trackCount = alb.tracks?.length || alb.trackCount || 0;
                            return (
                              <div key={alb.folderName || alb.albumName} className="bg-black/50 border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between">
                                <div>
                                  <div className="relative aspect-video w-full overflow-hidden bg-black/60 group">
                                    <img 
                                      src={alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'} 
                                      alt={alb.albumName} 
                                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-3 flex flex-col justify-end">
                                      <h5 className="text-xs font-black text-white truncate" title={alb.albumName}>{alb.albumName}</h5>
                                      <p className="text-[11px] text-gray-300 truncate">{alb.artist}</p>
                                    </div>
                                  </div>
                                  <div className="p-3">
                                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                                      <span>{trackCount} canciones</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handlePutAlbumOnAir(alb.folderName || alb.albumName)}
                                        className="flex-1 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[11px] rounded-lg transition flex items-center justify-center gap-1"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Poner Álbum en Cola
                                      </button>
                                      <button
                                        onClick={() => setExpandedLibraryAlbum(isExpanded ? null : (alb.folderName || alb.albumName))}
                                        className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-0.5"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="border-t border-white/10 bg-black/80 p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {(alb.tracks || []).map(t => (
                                      <div 
                                        key={t.id || t.fileName} 
                                        onClick={() => handlePlayPreview(t)}
                                        className="flex items-center justify-between p-1.5 hover:bg-cyan-500/10 rounded-lg text-xs cursor-pointer select-none group"
                                      >
                                        <div className="min-w-0 flex-1 pr-2">
                                          <p className="text-white group-hover:text-cyan-400 font-semibold truncate text-[11px] transition-colors">{t.title}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handlePlayPreview(t);
                                            }}
                                            className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-400 text-cyan-300 hover:text-black rounded text-[10px] font-bold transition"
                                          >
                                            Escuchar
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddTrackToQueue(t);
                                            }}
                                            className="px-2 py-0.5 bg-white/10 hover:bg-[#1DB954] hover:text-black rounded text-[10px] font-bold transition"
                                          >
                                            + Cola
                                          </button>
                                        </div>
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
                  </div>
                )}

                {/* ========================================================================= */}
                {/* PANEL DERECHO: COLA DE EMISIÓN AL AIRE (CON SWITCH ON AIR, PLAY, NEXT, ALEATORIO, VACIAR) */}
                {/* ========================================================================= */}
                {(mp3ViewMode === 'split' || mp3ViewMode === 'queue') && (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOverQueue(true); }}
                    onDragLeave={() => setIsDraggingOverQueue(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDraggingOverQueue(false);
                      const rawData = e.dataTransfer.getData('application/json');
                      if (rawData) {
                        try {
                          const droppedTrack = JSON.parse(rawData);
                          await handleAddTrackToQueue(droppedTrack);
                        } catch (err) {}
                      }
                    }}
                    className={`w-full bg-[#181818] pt-6 px-5 pb-5 rounded-2xl border-2 transition-all shadow-2xl flex flex-col h-[780px] ${
                      isDraggingOverQueue 
                        ? 'border-[#1DB954] bg-[#1DB954]/5 ring-4 ring-[#1DB954]/30 scale-[1.002]' 
                        : 'border-white/10'
                    }`}
                  >
                    {/* CABECERA PANEL DERECHO */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-1">
                      {/* FILA 1: TÍTULO, ESTADO Y SWITCH MASTER ON AIR + VACIAR */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="pt-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-3 w-3 ${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 tracking-tight truncate">
                              <Radio className="w-5 h-5 text-[#1DB954] shrink-0" />
                              Cola de Emisión al Aire
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 border ${
                              onAirTrack?.is_playing 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : 'bg-white/10 text-gray-400 border-white/10'
                            }`}>
                              {songs.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            Tanda en vivo sincronizada con Proyecto Radio y el Bat
                          </p>
                        </div>

                        {/* MASTER SWITCH ON AIR & VACIAR COLA */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={handleToggleOnAirSwitch}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border shadow-lg ${
                              onAirTrack?.is_playing
                                ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white hover:bg-white/20'
                            }`}
                            title={onAirTrack?.is_playing ? "Switch ON AIR encendido: Transmitiendo en Radio Proyecto. Clic para apagar" : "Switch ON AIR apagado: Clic para prender la cola en Radio Proyecto"}
                          >
                            <span className={`w-2 h-2 rounded-full ${onAirTrack?.is_playing ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                            <span>{onAirTrack?.is_playing ? 'ON AIR' : 'OFF AIR'}</span>
                          </button>

                          <button
                            onClick={handleClearQueue}
                            disabled={isUpdatingAirList || songs.length === 0}
                            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition border border-red-500/20 disabled:opacity-30"
                            title="Vaciar la cola de emisión"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* FILA 2: BARRA DE CONTROLES PLAYBACK Y MONITOR AL AIRE (GRID 4 COLUMNAS SIN DESBORDE) */}
                      <div className="grid grid-cols-4 gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                        {/* BOTÓN ESCUCHAR SEÑAL EN VIVO */}
                        <button
                          onClick={handleToggleListenLive}
                          className={`col-span-1 py-2 px-2 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border shadow-sm ${
                            isPlayingLiveSignal
                              ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/10'
                          }`}
                          title={isPlayingLiveSignal ? "Pausar audio de la señal en vivo" : "Escuchar la señal que está saliendo al aire en Radio Proyecto"}
                        >
                          <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isPlayingLiveSignal ? 'text-white animate-bounce' : 'text-red-400'}`} />
                          <span className="truncate">{isPlayingLiveSignal ? 'Sonando' : 'En Vivo'}</span>
                        </button>

                        {/* PLAY / PAUSA COLA */}
                        <button
                          onClick={handleAirPlayPause}
                          className="col-span-1 py-2 px-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-md shadow-[#1DB954]/20"
                          title="Iniciar o pausar emisión de la cola"
                        >
                          {onAirTrack?.is_playing ? <Pause className="w-3.5 h-3.5 fill-current shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5 shrink-0" />}
                          <span className="truncate">{onAirTrack?.is_playing ? 'Pausa' : 'Play'}</span>
                        </button>

                        {/* NEXT COLA */}
                        <button
                          onClick={handleAirNext}
                          className="col-span-1 py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                          title="Saltar a la siguiente canción al aire en Radio Proyecto"
                        >
                          <SkipForward className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Next</span>
                        </button>

                        {/* ALEATORIO COLA */}
                        <button
                          onClick={handleAirShuffle}
                          className="col-span-1 py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                          title="Mezclar canciones de la cola"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                          <span className="truncate">Aleatorio</span>
                        </button>
                      </div>

                      {/* BUSCADOR DENTRO DE LA COLA */}
                      <div className="relative pt-1">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Filtrar pistas de la cola..."
                          className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition"
                        />
                      </div>

                      {/* ZONA DE ARRASTRE */}
                      <div className={`border-2 border-dashed rounded-xl p-2 text-center text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isDraggingOverQueue 
                          ? 'border-[#1DB954] text-[#1DB954] bg-[#1DB954]/20 animate-pulse' 
                          : 'border-white/10 text-gray-400 bg-black/30'
                      }`}>
                        <ListPlus className="w-4 h-4 text-[#1DB954]" />
                        <span>
                          {isDraggingOverQueue 
                            ? '¡Suelta la canción aquí para agregarla a la cola!' 
                            : 'Arrastra canciones aquí desde la izquierda o presiona [+ Cola]'}
                        </span>
                      </div>
                    </div>

                    {/* CUERPO DEL PANEL DERECHO (LISTA DE CANCIONES DE LA COLA) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-3 space-y-1.5">
                      {songs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-gray-400">
                          <Radio className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                          <div>
                            <p className="text-sm font-extrabold text-white">La cola de emisión está vacía</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                              Arrastra canciones desde el panel izquierdo, o pulsa el botón Aleatorio en la cabecera.
                            </p>
                          </div>
                          <button
                            onClick={() => handleAirShuffle()}
                            disabled={isUpdatingAirList || batCatalog.length === 0}
                            className="px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-[#1DB954]/20 disabled:opacity-50"
                          >
                            <Shuffle className="w-3.5 h-3.5" /> Cargar 15 Aleatorios
                          </button>
                        </div>
                      ) : filteredSongs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">
                          No hay canciones en la cola que coincidan con "${searchQuery}".
                        </div>
                      ) : (
                        filteredSongs.map((song, idx) => {
                          const isOnAir = Boolean(
                            onAirTrack?.is_playing && (
                              (onAirTrack?.station_name && song.title && onAirTrack.station_name.toLowerCase().includes(song.title.toLowerCase())) ||
                              (onAirTrack?.station_name === song.title)
                            )
                          );

                          return (
                            <div
                              key={song.id || idx}
                              className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                                isOnAir
                                  ? 'bg-[#1DB954]/10 border-[#1DB954]/40 shadow-sm'
                                  : 'bg-black/40 hover:bg-white/5 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                <span className="text-[11px] font-mono text-gray-500 w-5 text-right shrink-0">
                                  {idx + 1}
                                </span>

                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800 border border-white/10 relative">
                                  <img
                                    src={song.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'}
                                    alt={song.title}
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                                    className="w-full h-full object-cover"
                                  />
                                  {isOnAir && (
                                    <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-xs font-bold truncate leading-tight ${isOnAir ? 'text-[#1DB954]' : 'text-white'}`} title={song.title}>
                                      {song.title}
                                    </p>
                                    {isOnAir && (
                                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black border border-red-500/30 uppercase shrink-0">
                                        AL AIRE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate" title={`${song.artist} • ${song.album}`}>
                                    {song.artist} <span className="text-gray-600">•</span> {song.album}
                                  </p>
                                </div>
                              </div>

                              {/* EN LA COLA SOLO SE MUESTRAN CONTROLES DE ORDEN Y ELIMINAR (SIN PLAY Y SIN ON AIR INDIVIDUAL) */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[11px] font-mono text-gray-400 mr-1">
                                  {formatTime(song.duration)}
                                </span>

                                {/* SUBIR / BAJAR ORDEN */}
                                <button
                                  onClick={() => handleMoveAirTrack(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20"
                                  title="Subir en el orden de emisión"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveAirTrack(idx, 'down')}
                                  disabled={idx === filteredSongs.length - 1}
                                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20"
                                  title="Bajar en el orden de emisión"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                {/* ELIMINAR DE LA COLA */}
                                <button
                                  onClick={() => handleRemoveAirTrack(song.id)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                  title="Quitar de la cola de emisión"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : managerTab === 'albums' ? (
          /* SECTION: GESTOR DE ÁLBUMES A PROFUNDIDAD */
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#181818] p-5 rounded-2xl border border-white/5 shadow-xl gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Disc className="w-5 h-5 text-[#1DB954]" /> Gestor de Álbumes a Profundidad
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Se han catalogado <strong className="text-[#1DB954]">{albumList.length} álbumes</strong> automáticamente. Cambia portadas en bloque desde musicCovers o edita sus metadatos.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => setShowCreateAlbumModal(true)}
                  className="px-4 py-2 rounded-full bg-[#1DB954] text-black font-extrabold text-xs hover:bg-[#1ed760] transition flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Crear Álbum desde MP3
                </button>
                <button 
                  onClick={() => {
                    setTargetAlbumForCover(null);
                    setShowAlbumCoversModal(true);
                  }}
                  className="px-4 py-2 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] font-extrabold text-xs hover:bg-[#1DB954] hover:text-black transition flex items-center gap-2 shadow-lg"
                >
                  <ImageIcon className="w-4 h-4" /> Abrir Galería musicCovers
                </button>
              </div>
            </div>

            {albumList.length === 0 ? (
              <div className="p-12 text-center text-gray-400 bg-[#181818] rounded-2xl border border-white/5">
                <Disc className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No hay álbumes catalogados aún</p>
                <p className="text-xs text-gray-400">Sube canciones MP3 con metadatos para organizarlas en álbumes automáticamente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {albumList.map((alb) => (
                  <div key={alb.key} className="bg-[#181818] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden shadow-xl group transition-all duration-300 flex flex-col justify-between">
                    <div>
                      {/* Portada de Álbum con Overlay Play */}
                      <div className="relative aspect-square w-full overflow-hidden bg-black/50">
                        <img 
                          src={alb.cover} 
                          alt={alb.albumName}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'; }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                          <button 
                            onClick={() => {
                              if (alb.tracks[0]) handlePlayPreview(alb.tracks[0]);
                            }}
                            className="p-3 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full shadow-2xl scale-90 group-hover:scale-100 transition"
                            title="Reproducir Álbum"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
                          <button 
                            onClick={() => setSelectedAlbumModalTarget(alb)}
                            className="p-3 bg-white text-black hover:bg-yellow-300 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition"
                            title="Ver lista de canciones de este álbum"
                          >
                            <ListPlus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-mono text-[#1DB954] font-bold border border-white/10">
                          {alb.tracks.length} {alb.tracks.length === 1 ? 'pista' : 'pistas'}
                        </div>
                      </div>

                      {/* Info del Álbum */}
                      <div className="p-4 space-y-2 cursor-pointer" onClick={() => setSelectedAlbumModalTarget(alb)}>
                        <h4 className="font-extrabold text-sm text-white truncate hover:text-[#1DB954] transition" title={alb.albumName}>
                          {alb.albumName}
                        </h4>
                        <p className="text-xs font-semibold text-gray-300 truncate" title={alb.artistName}>
                          {alb.artistName}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400 font-mono">
                            {alb.year}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-full text-[#1DB954] font-extrabold">
                            {alb.genre}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400 font-mono">
                            {formatTime(alb.totalDuration)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción del Álbum */}
                    <div className="p-3 bg-black/30 border-t border-white/5 flex items-center justify-between gap-1.5 flex-wrap">
                      <button 
                        onClick={() => setSelectedAlbumModalTarget(alb)}
                        className="py-1.5 px-2 bg-[#1DB954]/20 hover:bg-[#1DB954] text-[#1DB954] hover:text-black rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-[#1DB954]/30"
                        title="Ver lista de canciones del álbum"
                      >
                        <ListPlus className="w-3.5 h-3.5" /> Canciones
                      </button>

                      <button 
                        onClick={() => {
                          setTargetAlbumForCover(alb);
                          setShowAlbumCoversModal(true);
                        }}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        title="Cambiar carátula de todas las canciones de este álbum"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Carátula
                      </button>

                      <button 
                        onClick={() => setEditingAlbumTarget(alb)}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        title="Editar metadatos del álbum"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>

                      <button 
                        onClick={() => handleDeleteAlbum(alb)}
                        className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-red-500/20"
                        title="Eliminar este álbum y todas sus canciones"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* SECTION: YOUTUBE MANAGER */
          <div className="space-y-6">
            {/* Formulario Agregar / Editar Enlace YouTube */}
            <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500 fill-current" />
                  {isEditingYt ? 'Editar Propiedades de Video YouTube' : 'Agregar Enlace de YouTube'}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowYoutubeBulkModal(true)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-600/30 flex items-center gap-1.5 transition"
                  >
                    <ListPlus className="w-4 h-4" /> Importación Masiva / Playlists
                  </button>

                  {isEditingYt && (
                    <button 
                      onClick={() => {
                        setYtForm({ id: null, title: '', artist: '', youtubeUrl: '', category: 'Lofi & Chill' });
                        setIsEditingYt(false);
                      }}
                      className="text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-white/10 rounded-xl"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveYoutubeLink} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">URL de YouTube / Enlace *</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      required
                      placeholder="Ej: https://www.youtube.com/watch?v=jfKfPfyJRdk"
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
                      className="flex-1 px-4 py-2.5 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 font-mono"
                    />
                    {extractYoutubeId(ytForm.youtubeUrl) && (
                      <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 bg-black">
                        <img 
                          src={getYoutubeThumbnail(extractYoutubeId(ytForm.youtubeUrl))} 
                          alt="preview" 
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400'; }}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Título *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Título de la Canción o Transmisión"
                    value={ytForm.title}
                    onChange={e => setYtForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Artista / Canal</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Lofi Girl, Cafe Music BGM, etc."
                    value={ytForm.artist}
                    onChange={e => setYtForm(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-300 uppercase">Categoría</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          setYtForm(prev => ({ ...prev, category: '' }));
                        }
                      }}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 underline uppercase"
                    >
                      {isCustomCategory ? '← Seleccionar de lista' : '+ Crear Nueva Categoría'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input 
                      type="text" 
                      required
                      placeholder="Escribe el nombre de la nueva categoría..."
                      value={ytForm.category}
                      onChange={e => setYtForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-black/50 border border-red-500 rounded-xl text-white text-sm focus:outline-none font-bold placeholder-gray-500"
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
                      className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 font-bold"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#181818] text-white">{cat}</option>
                      ))}
                      <option value="__NEW__" className="bg-[#2a1515] text-red-400 font-bold">+ Crear Nueva Categoría...</option>
                    </select>
                  )}
                </div>

                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full py-2.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {isEditingYt ? 'Guardar Cambios' : 'Agregar Enlace a la Radio'}
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de Enlaces de YouTube Creados */}
            <div className="bg-[#181818] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              {/* Encabezado con Contador y Herramientas */}
              <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/5">
                <div>
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500 fill-current" />
                    Lista de Enlaces Guardados ({filteredAndSortedYoutubeSongs.length}
                    {filteredAndSortedYoutubeSongs.length !== youtubeSongs.length && ` de ${youtubeSongs.length}`})
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">Filtra por categoría, busca por texto o reordena los videos guardados</p>
                </div>

                {/* Controles de Búsqueda y Ordenamiento */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Campo de Búsqueda */}
                  <div className="relative flex-1 sm:w-44">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Buscar video..."
                      value={ytSearchQuery}
                      onChange={(e) => setYtSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                    />
                    {ytSearchQuery && (
                      <button 
                        onClick={() => setYtSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold px-1"
                        title="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Selector de Orden */}
                  <div className="relative">
                    <select
                      value={ytSortBy}
                      onChange={(e) => setYtSortBy(e.target.value)}
                      className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-red-500 font-medium cursor-pointer"
                    >
                      <option value="custom" className="bg-[#181818] text-white">↕ Orden Personalizado</option>
                      <option value="title-asc" className="bg-[#181818] text-white">🔤 Título (A - Z)</option>
                      <option value="title-desc" className="bg-[#181818] text-white">🔤 Título (Z - A)</option>
                      <option value="artist-asc" className="bg-[#181818] text-white">🎤 Artista (A - Z)</option>
                      <option value="category" className="bg-[#181818] text-white">🏷️ Categoría</option>
                      <option value="newest" className="bg-[#181818] text-white">🕒 Más Recientes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Barra de Categorías para Filtrado Rápido */}
              {youtubeSongs.length > 0 && (
                <div className="px-4 py-2.5 bg-black/30 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                    <Filter className="w-3 h-3 text-red-400" /> Categorías:
                  </span>
                  {ytCategoriesForFilter.map((cat) => {
                    const count = ytCategoryCounts[cat] || 0;
                    const isActive = ytFilterCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setYtFilterCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          isActive 
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {loadingYoutubeManager ? (
                <div className="p-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
                  <p className="text-xs mt-2 font-bold">Cargando videos de YouTube...</p>
                </div>
              ) : youtubeSongs.length === 0 ? (
                <div className="p-12 text-center text-gray-400 space-y-2">
                  <Youtube className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm font-bold text-white">No hay enlaces de YouTube configurados</p>
                  <p className="text-xs text-gray-400">Ingresa la URL de una canción o transmisión en vivo arriba para agregarla.</p>
                </div>
              ) : filteredAndSortedYoutubeSongs.length === 0 ? (
                <div className="p-10 text-center text-gray-400 space-y-3">
                  <Filter className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm font-bold text-white">No hay enlaces que coincidan con el filtro</p>
                  <p className="text-xs text-gray-400">Prueba cambiando el texto de búsqueda o la categoría seleccionada.</p>
                  <button 
                    onClick={() => { setYtFilterCategory('Todos'); setYtSearchQuery(''); }}
                    className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredAndSortedYoutubeSongs.map((track) => {
                    const origIndex = youtubeSongs.findIndex(s => String(s.id) === String(track.id));
                    const isManualOrderActive = ytSortBy === 'custom' && ytFilterCategory === 'Todos' && !ytSearchQuery;

                    return (
                      <div key={track.id || track.youtubeId} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/5 transition">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                            <img 
                              src={track.cover} 
                              alt={track.title}
                              onError={(e) => { e.currentTarget.src = getYoutubeThumbnail(track.youtubeId); }}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="truncate flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-white truncate">{track.title}</h4>
                              <a 
                                href={track.youtube_url || track.url || `https://www.youtube.com/watch?v=${track.youtubeId}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-gray-400 hover:text-red-400 transition shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{track.artist || 'Canal de YouTube'}</p>
                            <button
                              onClick={() => setYtFilterCategory(track.category)}
                              className="inline-block text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-full font-bold mt-1 transition cursor-pointer"
                              title={`Filtrar por ${track.category}`}
                            >
                              {track.category}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button 
                            onClick={() => moveYoutubeOrder(origIndex, 'up')} 
                            disabled={!isManualOrderActive || origIndex <= 0}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-20 transition"
                            title={isManualOrderActive ? "Subir posición" : "Cambia a 'Orden Personalizado' y quita filtros para mover"}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => moveYoutubeOrder(origIndex, 'down')} 
                            disabled={!isManualOrderActive || origIndex >= youtubeSongs.length - 1}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-20 transition"
                            title={isManualOrderActive ? "Bajar posición" : "Cambia a 'Orden Personalizado' y quita filtros para mover"}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleEditYoutubeClick(track)}
                            className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 transition"
                            title="Editar Propiedades"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteYoutubeLink(track.id)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition"
                            title="Eliminar Enlace"
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
          </div>
        )}

      </div>

      {/* BARRA INFERIOR DE REPRODUCCION COMPARTIDA (MODO ROJO: AL AIRE | MODO AZUL: BIBLIOTECA) */}
      {(previewTrack || onAirTrack?.station_name || songs.length > 0) && (() => {
        const isLiveBottomActive = (bottomPlayerMode === 'live' || !previewTrack) && Boolean(onAirTrack?.station_name || songs.length > 0);
        const liveDisplayTrack = onAirTrack?.station_name ? onAirTrack : (songs[0] || null);

        return (
          <div className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-4 py-3 text-white flex items-center justify-between shadow-2xl animate-slide-up transition-all duration-300 ${
            isLiveBottomActive 
              ? 'border-red-500/50 bg-gradient-to-r from-neutral-950 via-[#1c0808]/95 to-neutral-950 shadow-red-950/30' 
              : 'border-cyan-400/50 bg-gradient-to-r from-neutral-950 via-[#071926]/95 to-neutral-950 shadow-cyan-950/30 ring-1 ring-cyan-500/20'
          }`}>
            
            {/* Info Pista */}
            <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
              <div className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border shadow-md transition-all ${
                isLiveBottomActive ? 'border-red-500/40 ring-1 ring-red-500/30' : 'border-cyan-400/40 ring-1 ring-cyan-400/30'
              }`}>
                <img 
                  src={isLiveBottomActive 
                    ? (liveDisplayTrack?.station_cover || liveDisplayTrack?.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400')
                    : (previewTrack?.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400')} 
                  alt="cover" 
                  className="w-full h-full object-cover"
                />
                {isLiveBottomActive ? (
                  <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h4 className={`font-black text-xs truncate transition-colors ${isLiveBottomActive ? 'text-red-400' : 'text-cyan-400'}`}>
                    {isLiveBottomActive 
                      ? (liveDisplayTrack?.station_name || liveDisplayTrack?.title || 'Radio Café') 
                      : previewTrack?.title}
                  </h4>
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  {isLiveBottomActive 
                    ? (liveDisplayTrack?.station_artist || liveDisplayTrack?.artist || 'En Vivo') 
                    : (previewTrack?.artist || previewTrack?.albumArtist || 'Biblioteca Local')}
                </p>

                {/* Badges y selector de modo */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isLiveBottomActive ? (
                    <span className="px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500/40 text-red-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      🔴 EN VIVO AL AIRE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-cyan-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      🎧 MODO AZUL (BIBLIOTECA)
                    </span>
                  )}

                  {previewTrack && isLiveBottomActive && (
                    <button 
                      onClick={() => setBottomPlayerMode('preview')} 
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold underline ml-1 cursor-pointer"
                      title="Cambiar a la barra de pre-escucha de biblioteca"
                    >
                      Ir a Azul
                    </button>
                  )}
                  {!isLiveBottomActive && (onAirTrack?.station_name || songs.length > 0) && (
                    <button 
                      onClick={() => setBottomPlayerMode('live')} 
                      className="text-[9px] text-red-400 hover:text-red-300 font-bold underline ml-1 cursor-pointer"
                      title="Cambiar a la barra de transmisión al aire"
                    >
                      Ir a Rojo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Controles de Reproducción y Barra de Tiempo */}
            <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-md">
              <div className="flex items-center gap-4">
                <button 
                  onClick={isLiveBottomActive ? handleAirPrev : playPrevPreview} 
                  className={`transition ${isLiveBottomActive ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-cyan-400'}`}
                  title={isLiveBottomActive ? "Pista anterior en la cola al aire" : "Pista anterior en biblioteca"}
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={isLiveBottomActive ? handleAirPlayPause : () => handlePlayPreview(previewTrack)}
                  className={`p-2.5 rounded-full shadow-lg transition-transform active:scale-95 ${
                    isLiveBottomActive 
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                      : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-cyan-400/30 ring-2 ring-cyan-300'
                  }`}
                  title={isLiveBottomActive ? (onAirTrack?.is_playing ? "Pausar emisión" : "Iniciar emisión") : (isPlayingPreview ? "Pausar pre-escucha" : "Reproducir pre-escucha")}
                >
                  {isLiveBottomActive 
                    ? (onAirTrack?.is_playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />)
                    : (isPlayingPreview ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />)}
                </button>

                <button 
                  onClick={isLiveBottomActive ? handleAirNext : playNextPreview} 
                  className={`transition ${isLiveBottomActive ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-cyan-400'}`}
                  title={isLiveBottomActive ? "Siguiente canción al aire" : "Siguiente canción en biblioteca"}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de Tiempo / Seek */}
              <div className="w-full flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <span className={isLiveBottomActive ? 'text-red-400' : 'text-cyan-400'}>
                  {formatTime(isLiveBottomActive ? airTime : previewTime)}
                </span>
                <input 
                  type="range"
                  min="0"
                  max={isLiveBottomActive ? (airDuration || liveDisplayTrack?.duration || 180) : (previewDuration || 100)}
                  step="0.5"
                  value={isLiveBottomActive ? airTime : previewTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    if (isLiveBottomActive) {
                      handleSeekAir(newTime);
                    } else {
                      audioRef.current.currentTime = newTime;
                      setPreviewTime(newTime);
                    }
                  }}
                  className={`w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all ${
                    isLiveBottomActive ? 'accent-red-500' : 'accent-cyan-400'
                  }`}
                  title={isLiveBottomActive ? "Arrastra para mover dónde va la canción (sincroniza en vivo a Proyecto Radio)" : "Adelantar o retroceder pre-escucha"}
                />
                <span>{formatTime(isLiveBottomActive ? (airDuration || liveDisplayTrack?.duration || 180) : previewDuration)}</span>
              </div>
            </div>

            {/* Control Volumen y Monitor */}
            <div className="flex items-center justify-end gap-3 w-1/4">
              {isLiveBottomActive ? (
                <button
                  onClick={handleToggleListenLive}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition border ${
                    isPlayingLiveSignal 
                      ? 'bg-red-600/30 border-red-500 text-red-300' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                  title={isPlayingLiveSignal ? "Silenciar audio del monitor de cabina" : "Escuchar la señal en vivo en tus audífonos"}
                >
                  {isPlayingLiveSignal ? '🔊 Monitor ON' : '🔇 Monitor OFF'}
                </button>
              ) : (
                <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider hidden sm:inline">
                  🎧 Audífonos CUE
                </span>
              )}

              <button onClick={() => setIsMuted(!isMuted)} className={`transition ${isLiveBottomActive ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-cyan-400'}`}>
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className={`w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer ${
                  isLiveBottomActive ? 'accent-red-500' : 'accent-cyan-400'
                }`}
              />
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

    </div>
  );
}
