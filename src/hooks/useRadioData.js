import { useState, useEffect, useCallback } from 'react';
import supabase from '../config/supabaseClient';
import { getAudioDuration, MAX_PLAYLIST_SECONDS } from '../utils/radioHelpers';
import { extractYoutubeId, getYoutubeThumbnail } from '../utils/youtubeHelpers';

export function useRadioData(activeTab, currentTrack, currentTrackIndex, setCurrentTrackIndex, setIsPlaying, setAudioError) {
  // Radio Browser API & Filtros
  const [selectedCategory, setSelectedCategory] = useState('lofi'); 
  const [apiStations, setApiStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingApi, setLoadingApi] = useState(false);

  // Metadata "ahora suena"
  const [nowPlaying, setNowPlaying] = useState(null);

  // Playlist de Supabase (MP3s)
  const [supabasePlaylist, setSupabasePlaylist] = useState([]);
  const [localPlaylist, setLocalPlaylist] = useState([]);
  const [loadingSupabase, setLoadingSupabase] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);

  // Playlist de YouTube (Estrictamente desde Supabase)
  const [youtubePlaylist, setYoutubePlaylist] = useState([]);
  const [selectedYoutubeCategory, setSelectedYoutubeCategory] = useState('Todos');
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  // 2. Fetch playlist real desde Supabase (MP3s)
  const fetchSupabasePlaylist = async () => {
    try {
      setLoadingSupabase(true);
      setSupabaseError(null);
      
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
      setSupabasePlaylist(data || []);
    } catch (err) {
      console.warn("Supabase playlist no disponible:", err.message);
      setSupabaseError(err.message);
    } finally {
      setLoadingSupabase(false);
    }
  };

  useEffect(() => {
    fetchSupabasePlaylist();
  }, []);

  // 2.5 Fetch playlist de YouTube estrictamente desde Supabase
  const fetchYoutubePlaylist = async () => {
    try {
      setLoadingYoutube(true);
      const { data, error } = await supabase
        .from('playlist_youtube')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error("Error al consultar playlist_youtube en Supabase:", error.message);
        setYoutubePlaylist([]);
        return;
      }

      const formatted = (data || []).map(item => {
        const ytId = item.youtube_id || extractYoutubeId(item.url || item.youtube_url);
        return {
          ...item,
          id: item.id ? String(item.id) : `yt-${Date.now()}`,
          title: item.title || 'Video de YouTube',
          artist: item.artist || 'Canal de YouTube',
          youtubeId: ytId,
          url: item.url || item.youtube_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : ''),
          cover: (item.cover && typeof item.cover === 'string' && !item.cover.startsWith('blob:'))
            ? item.cover.replace('hqdefault.jpg', 'mqdefault.jpg')
            : getYoutubeThumbnail(ytId),
          category: item.category || 'Lofi & Chill',
          type: 'youtube'
        };
      });
      setYoutubePlaylist(formatted);
    } catch (err) {
      console.error("Error cargando playlist de YouTube desde Supabase:", err);
      setYoutubePlaylist([]);
    } finally {
      setLoadingYoutube(false);
    }
  };

  useEffect(() => {
    fetchYoutubePlaylist();
  }, []);



  // 4. Radio-Browser API
  const fetchApiRadioStations = async (tag, query = '') => {
    try {
      setLoadingApi(true);
      let endpoint = '';
      if (query) {
        endpoint = `https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(query)}?limit=15&hidebroken=true`;
      } else {
        endpoint = `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(tag)}?limit=15&hidebroken=true`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item, idx) => ({
          id: `api-${item.stationuuid || idx}`,
          title: item.name?.trim() || 'Emisora En Vivo',
          artist: `${item.country || 'Global'} • ${item.codec || 'MP3'} ${item.bitrate ? `${item.bitrate}kbps` : ''}`,
          genre: item.tags ? item.tags.split(',')[0] : 'Radio Online',
          url: item.url_resolved || item.url,
          isLiveStream: true,
          duration: 0,
          cover: item.favicon && item.favicon.startsWith('http') 
            ? item.favicon 
            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600'
        }));
        setApiStations(formatted);
      }
    } catch (err) {
      console.warn("API de radios no disponible:", err);
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'live') {
      fetchApiRadioStations(selectedCategory, searchQuery);
    }
  }, [selectedCategory, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchApiRadioStations(selectedCategory, searchQuery);
    }
  };

  // 5. Reordenar canción en Supabase (MP3s)
  const moveSongOrder = async (index, direction) => {
    if (activeTab !== 'supabase' || supabasePlaylist.length === 0) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= supabasePlaylist.length) return;

    const updated = [...supabasePlaylist];
    const itemToMove = updated[index];
    const itemTarget = updated[newIndex];

    updated[index] = itemTarget;
    updated[newIndex] = itemToMove;
    setSupabasePlaylist(updated);

    try {
      await supabase.from('playlist_radio').update({ order_index: newIndex }).eq('id', itemToMove.id);
      await supabase.from('playlist_radio').update({ order_index: index }).eq('id', itemTarget.id);
    } catch (err) {
      console.error("Error al reordenar en la BD:", err);
    }
  };

  // 6. Eliminar canción de Supabase (MP3)
  const handleDeleteSong = async (id, fileUrl) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta canción de Supabase?")) return;
    try {
      setSupabasePlaylist(prev => prev.filter(s => String(s.id) !== String(id)));
      const numId = !isNaN(Number(id)) ? Number(id) : id;
      await supabase.from('playlist_radio').delete().eq('id', numId);

      if (fileUrl && (fileUrl.includes('/Radio/') || fileUrl.includes('/radio_mp3/'))) {
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from('Radio').remove([fileName]).catch(() => {
          supabase.storage.from('radio_mp3').remove([fileName]).catch(e => console.log("Error borrando:", e));
        });
      }

      fetchSupabasePlaylist();
    } catch (err) {
      alert("Error eliminando canción: " + err.message);
    }
  };

  // 6.1 Eliminar canción de YouTube de Supabase
  const handleDeleteYoutubeSong = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este enlace de YouTube de Supabase?")) return;
    try {
      setYoutubePlaylist(prev => prev.filter(s => String(s.id) !== String(id)));
      const numId = !isNaN(Number(id)) ? Number(id) : id;
      await supabase.from('playlist_youtube').delete().eq('id', numId);
      fetchYoutubePlaylist();
    } catch (err) {
      alert("Error eliminando video de YouTube: " + err.message);
    }
  };

  // 6.5 Favoritos (Radio Browser)
  const toggleFavorite = async (station) => {
    try {
      const exists = supabasePlaylist.find(s => s.url === station.url || s.id === station.id);
      if (exists) {
        await supabase.from('playlist_radio').delete().eq('id', exists.id);
      } else {
        const newFavorite = {
          title: station.title,
          artist: station.artist,
          url: station.url,
          cover: station.cover,
          isLiveStream: true,
          order_index: supabasePlaylist.length
        };
        await supabase.from('playlist_radio').insert(newFavorite);
      }
      fetchSupabasePlaylist();
    } catch (err) {
      console.error("Error al modificar favoritos:", err);
    }
  };

  // Toggle Favorito en YouTube
  const toggleYoutubeFavorite = async (trackId) => {
    const updated = youtubePlaylist.map(t => {
      if (t.id === trackId) {
        return { ...t, is_favorite: !t.is_favorite };
      }
      return t;
    });
    setYoutubePlaylist(updated);

    try {
      const track = updated.find(t => t.id === trackId);
      if (track && typeof track.id !== 'string' || !track.id.startsWith('yt-default')) {
        await supabase.from('playlist_youtube').update({ is_favorite: track.is_favorite }).eq('id', trackId);
      }
    } catch (e) {
      console.warn("No se pudo actualizar favorito en Supabase:", e);
    }
  };

  // 7. Archivos Locales / YouTube / Obtener Playlist Activa
  const getFilteredYoutubePlaylist = () => {
    return youtubePlaylist.filter(track => {
      const matchCat = selectedYoutubeCategory === 'Todos' || track.category === selectedYoutubeCategory;
      const q = youtubeSearchQuery.toLowerCase().trim();
      const matchQuery = !q || (track.title || '').toLowerCase().includes(q) || (track.artist || '').toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  };

  const filteredYoutubePlaylist = getFilteredYoutubePlaylist();

  const getActivePlaylist = () => {
    if (activeTab === 'live') return apiStations;
    if (activeTab === 'supabase') return supabasePlaylist;
    if (activeTab === 'youtube') return filteredYoutubePlaylist.length > 0 ? filteredYoutubePlaylist : youtubePlaylist;
    return localPlaylist;
  };

  const currentPlaylist = getActivePlaylist();
  const totalPlaylistSeconds = currentPlaylist.reduce((acc, item) => acc + (item.duration || 0), 0);

  const handleLocalFilesUpload = async (e, setActiveTabCallback) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAudioError(null);
    let accumulatedNewSeconds = 0;
    const processedTracks = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const durSec = await getAudioDuration(file);

      if (totalPlaylistSeconds + accumulatedNewSeconds + durSec > MAX_PLAYLIST_SECONDS) {
        setAudioError(`⚠️ Límite de 4 horas alcanzado. Se agregaron solo los temas dentro del cupo disponible.`);
        break;
      }

      accumulatedNewSeconds += durSec;
      const objectUrl = URL.createObjectURL(file);

      processedTracks.push({
        id: `local-${Date.now()}-${idx}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Archivo Local (Tu PC)',
        url: objectUrl,
        duration: durSec,
        isLocalFile: true,
        fileName: file.name,
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600'
      });
    }

    if (processedTracks.length > 0) {
      setLocalPlaylist((prev) => [...prev, ...processedTracks]);
      setActiveTabCallback('local');
    }
  };

  const removeLocalTrack = (id) => {
    setLocalPlaylist((prev) => prev.filter((t) => t.id !== id));
    if (currentTrackIndex >= localPlaylist.length - 1 && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  return {
    nowPlaying,
    apiStations,
    loadingApi,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    supabasePlaylist,
    loadingSupabase,
    supabaseError,
    moveSongOrder,
    handleDeleteSong,
    handleDeleteYoutubeSong,
    toggleFavorite,
    // YouTube
    youtubePlaylist,
    filteredYoutubePlaylist,
    selectedYoutubeCategory,
    setSelectedYoutubeCategory,
    youtubeSearchQuery,
    setYoutubeSearchQuery,
    loadingYoutube,
    toggleYoutubeFavorite,
    fetchYoutubePlaylist,
    setYoutubePlaylist,
    // Local / Playlist activa
    localPlaylist,
    handleLocalFilesUpload,
    removeLocalTrack,
    currentPlaylist,
    totalPlaylistSeconds
  };
}

