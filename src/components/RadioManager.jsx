import React, { useState, useEffect, useRef, useMemo } from 'react';
import supabase from '../config/supabaseClient';
import { parseAudioFileMetadata } from '../utils/radioMetadataParser';
import RadioEditModal from './radio/RadioEditModal';
import AlbumEditModal from './radio/AlbumEditModal';
import CreateAlbumModal from './radio/CreateAlbumModal';
import YoutubeBulkModal from './radio/YoutubeBulkModal';
import MusicCoversGalleryModal from './radio/MusicCoversGalleryModal';
import AlbumTracklistModal from './radio/AlbumTracklistModal';
import { extractYoutubeId, getYoutubeThumbnail, fetchYoutubeMetadata, YOUTUBE_CATEGORIES } from '../utils/youtubeHelpers';
import { 
  Play, Pause, Music, Upload, FolderUp, Trash2, Edit3, ArrowUp, ArrowDown, 
  GripVertical, Search, Filter, Layers, Disc, Tag, Calendar, Sparkles, 
  Clock, CheckSquare, Square, Volume2, VolumeX, SkipBack, SkipForward,
  Loader2, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Plus, Youtube, ExternalLink, Image as ImageIcon, ListPlus
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

  // Notificaciones
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Reproductor Preview de Spotify en RadioManager
  const [previewTrack, setPreviewTrack] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(new Audio());

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

  // Editor y Detalle de Álbumes en React
  const [editingAlbumTarget, setEditingAlbumTarget] = useState(null);
  const [selectedAlbumModalTarget, setSelectedAlbumModalTarget] = useState(null);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);

  // Modal de Creación e Importación Masiva
  const [showYoutubeBulkModal, setShowYoutubeBulkModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);

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

  // Generación automática de lista de álbumes agrupados a profundidad
  const albumList = useMemo(() => {
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
  }, []);

  // Control de audio preview
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setPreviewTime(audio.currentTime);
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

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

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

  // Manejo de Reproducción Preview
  const handlePlayPreview = (song) => {
    if (previewTrack?.id === song.id) {
      if (isPlayingPreview) {
        audioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioRef.current.play();
        setIsPlayingPreview(true);
      }
    } else {
      setPreviewTrack(song);
      audioRef.current.src = song.url;
      audioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const playNextPreview = () => {
    if (!previewTrack || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === previewTrack.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    handlePlayPreview(songs[nextIndex]);
  };

  const playPrevPreview = () => {
    if (!previewTrack || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === previewTrack.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    handlePlayPreview(songs[prevIndex]);
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
            {/* METRICAS Y BUCLE 4 HORAS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 bg-[#181818] p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs font-extrabold mb-2">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1DB954]" /> Tiempo Total de Música Registrada ({songs.length} canciones)
                  </span>
                  <span className="font-mono text-[#1DB954] bg-[#1DB954]/10 px-3 py-1 rounded-full border border-[#1DB954]/30 font-bold">
                    ⏱️ {formatTime(totalPlaylistSeconds)} ({(totalPlaylistSeconds / 3600).toFixed(1)} hrs de audio)
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden p-0.5 mt-2">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#1DB954] via-emerald-400 to-cyan-400"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Música en Supabase</p>
                  <h2 className="text-3xl font-black text-white">{songs.length} <span className="text-xs text-[#1DB954] font-bold">temas</span></h2>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[#1DB954]">
                  <Disc className="w-6 h-6 animate-spin-slow" />
                </div>
              </div>
            </div>

            {/* NOTIFICACIONES */}
            {error && (
              <div className="bg-red-950/80 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold text-base px-2">×</button>
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/80 border border-[#1DB954]/50 text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954] flex-shrink-0" />
                  <span>{success}</span>
                </div>
                <button onClick={() => setSuccess(null)} className="text-[#1DB954] hover:text-white font-bold text-base px-2">×</button>
              </div>
            )}

            {/* BARRA DE PROGRESO DE SUBIDA */}
            {isUploading && (
              <div className="bg-[#181818] p-4 rounded-2xl border border-[#1DB954]/30 shadow-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#1DB954] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando y subiendo ({uploadIndex}/{uploadQueue.length})
                  </span>
                  <span className="font-mono text-white">{uploadPercent}%</span>
                </div>
                <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                  <div className="bg-[#1DB954] h-full transition-all duration-300" style={{ width: `${uploadPercent}%` }}></div>
                </div>
              </div>
            )}

            {/* CONTROLES DE BUSQUEDA, FILTRADO Y PESTAÑAS */}
            <div className="bg-[#181818] p-4 rounded-2xl border border-white/5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* BUSCADOR */}
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título, artista, álbum, género, mood..."
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition"
                  />
                </div>

                {/* BOTONES DE PESTAÑA / AGRUPACIÓN */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1">
                  {[
                    { id: 'all', label: 'Todas', icon: Layers },
                    { id: 'genre', label: 'Género', icon: Tag },
                    { id: 'artist', label: 'Artista', icon: Music },
                    { id: 'album', label: 'Álbum', icon: Disc },
                    { id: 'year', label: 'Año', icon: Calendar },
                    { id: 'mood', label: 'Mood', icon: Sparkles }
                  ].map(tab => {
                    const IconComp = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          isActive 
                            ? 'bg-[#1DB954] text-black font-extrabold shadow-md shadow-[#1DB954]/20' 
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* SELECCION MULTIPLE Y ACCIONES EN LOTE */}
              {selectedIds.length > 0 && (
                <div className="p-3 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl flex items-center justify-between text-xs font-extrabold text-[#1DB954]">
                  <span>{selectedIds.length} canciones seleccionadas</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleBulkSetField('genre', 'Ingresa el nuevo Género para los elementos seleccionados:')}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                      Asignar Género
                    </button>
                    <button 
                      onClick={() => handleBulkSetField('mood', 'Ingresa el nuevo Mood para los elementos seleccionados:')}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                      Asignar Mood
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TABLA STICKY SPOTIFY STYLE */}
            {groupedSongs.length === 0 ? (
              <div className="p-12 text-center text-gray-400 bg-[#181818] rounded-2xl border border-white/5 space-y-2">
                <Music className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-sm font-bold text-white">No hay canciones disponibles</p>
                <p className="text-xs text-gray-400">Arrastra o sube tus archivos MP3 para iniciar la emisión</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSongs.map(group => (
                  <div key={group.title} className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    
                    {activeTab !== 'all' && (
                      <div className="px-5 py-3 bg-white/5 border-b border-white/5 font-extrabold text-xs text-[#1DB954] uppercase tracking-wider flex items-center gap-2">
                        <Disc className="w-4 h-4" /> {group.title} ({group.songs.length} pistas)
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 font-extrabold uppercase tracking-wider text-[10px] bg-black/40">
                            <th className="p-3 text-center w-10">
                              <button onClick={toggleSelectAll} className="hover:text-white">
                                {selectedIds.length > 0 && selectedIds.length === filteredSongs.length ? <CheckSquare className="w-4 h-4 text-[#1DB954]" /> : <Square className="w-4 h-4" />}
                              </button>
                            </th>
                            <th className="p-3 text-center w-10">#</th>
                            <th className="p-3">Título y Portada</th>
                            <th className="p-3">Álbum / Artista</th>
                            <th className="p-3">Género / Mood</th>
                            <th className="p-3 text-center">Año</th>
                            <th className="p-3 text-right">Duración</th>
                            <th className="p-3 text-center w-24">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.songs.map((song, idx) => {
                            const isSelected = selectedIds.includes(song.id);
                            const isCurrentPlaying = previewTrack?.id === song.id;

                            return (
                              <tr 
                                key={song.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragEnter={(e) => handleDragEnter(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`border-b border-white/5 hover:bg-white/5 transition group ${isSelected ? 'bg-[#1DB954]/10' : ''}`}
                              >
                                <td className="p-3 text-center">
                                  <button onClick={() => toggleSelectSong(song.id)} className="text-gray-400 hover:text-white">
                                    {isSelected ? <CheckSquare className="w-4 h-4 text-[#1DB954]" /> : <Square className="w-4 h-4" />}
                                  </button>
                                </td>

                                <td className="p-3 text-center text-gray-500 font-mono font-bold group-hover:text-white">
                                  <div className="flex items-center justify-center gap-1">
                                    <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                                    <span>{song.order_index + 1}</span>
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black group/cover">
                                      <img 
                                        src={song.cover} 
                                        alt={song.title} 
                                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'; }}
                                        className="w-full h-full object-cover"
                                      />
                                      <button 
                                        onClick={() => handlePlayPreview(song)}
                                        className={`absolute inset-0 bg-black/60 flex items-center justify-center transition ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}
                                      >
                                        {isCurrentPlaying && isPlayingPreview ? (
                                          <Pause className="w-5 h-5 text-[#1DB954] fill-current" />
                                        ) : (
                                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                        )}
                                      </button>
                                    </div>

                                    <div className="truncate">
                                      <h4 className={`font-extrabold truncate text-xs ${isCurrentPlaying ? 'text-[#1DB954]' : 'text-white'}`}>
                                        {song.title}
                                      </h4>
                                      <p className="text-[11px] text-gray-400 truncate">{song.artist}</p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3">
                                  <p className="text-xs font-semibold text-gray-300 truncate">{song.album}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{song.artist}</p>
                                </td>

                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    <span className="text-[10px] px-2 py-0.5 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-full text-[#1DB954] font-extrabold">
                                      {song.genre}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-300 font-semibold">
                                      {song.mood}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-3 text-center font-mono text-gray-400 text-xs">
                                  {song.year}
                                </td>

                                <td className="p-3 text-right font-mono text-xs text-gray-300 font-extrabold">
                                  {formatTime(song.duration)}
                                </td>

                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button 
                                      onClick={() => setEditingSong(song)}
                                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                      title="Editar canción"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>

                                    <button 
                                      onClick={() => handleDeleteSong(song.id, song.url)}
                                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                      title="Eliminar canción"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                ))}
              </div>
            )}
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
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500 fill-current" />
                  Lista de Enlaces Guardados ({youtubeSongs.length})
                </h4>
                <p className="text-xs text-gray-400">Reordena o cambia propiedades de cada video</p>
              </div>

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
              ) : (
                <div className="divide-y divide-white/5">
                  {youtubeSongs.map((track, idx) => (
                    <div key={track.id || idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/5 transition">
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
                              className="text-gray-400 hover:text-red-400 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{track.artist || 'Canal de YouTube'}</p>
                          <span className="inline-block text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full font-bold mt-1">
                            {track.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => moveYoutubeOrder(idx, 'up')} 
                          disabled={idx === 0}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 transition"
                          title="Subir posición"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => moveYoutubeOrder(idx, 'down')} 
                          disabled={idx === youtubeSongs.length - 1}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 transition"
                          title="Bajar posición"
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
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* BARRA INFERIOR DE REPRODUCCION DE VISTA PREVIA (SPOTIFY BOTTOM PLAYER BAR) */}
      {previewTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#181818]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 text-white flex items-center justify-between shadow-2xl animate-slide-up">
          
          {/* Info Pista */}
          <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
            <img 
              src={previewTrack.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'} 
              alt="preview cover" 
              className="w-12 h-12 rounded-lg object-cover border border-white/10 shadow-md"
            />
            <div className="truncate">
              <h4 className="font-bold text-xs text-white truncate">{previewTrack.title}</h4>
              <p className="text-[11px] text-gray-400 truncate">{previewTrack.artist}</p>
            </div>
          </div>

          {/* Controles de Reproducción y Barra de Tiempo */}
          <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-md">
            <div className="flex items-center gap-4">
              <button onClick={playPrevPreview} className="text-gray-400 hover:text-white transition">
                <SkipBack className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handlePlayPreview(previewTrack)}
                className="p-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full shadow-lg transition"
              >
                {isPlayingPreview ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button onClick={playNextPreview} className="text-gray-400 hover:text-white transition">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <span>{formatTime(previewTime)}</span>
              <input 
                type="range"
                min="0"
                max={previewDuration || 100}
                value={previewTime}
                onChange={(e) => {
                  const newTime = Number(e.target.value);
                  audioRef.current.currentTime = newTime;
                  setPreviewTime(newTime);
                }}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
              />
              <span>{formatTime(previewDuration)}</span>
            </div>
          </div>

          {/* Control Volumen */}
          <div className="flex items-center justify-end gap-2 w-1/4">
            <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white transition">
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
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
            />
          </div>

        </div>
      )}

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
