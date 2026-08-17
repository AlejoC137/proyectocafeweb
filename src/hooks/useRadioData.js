import { useState, useEffect, useCallback } from 'react';
import supabase from '../config/supabaseClient';
import { getAudioDuration, MAX_PLAYLIST_SECONDS } from '../utils/radioHelpers';
import { extractYoutubeId, extractPlaylistId, getYoutubeThumbnail } from '../utils/youtubeHelpers';

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
        const ytUrl = item.url || item.youtube_url || '';
        const ytId = item.youtube_id || extractYoutubeId(ytUrl);
        const listId = item.list_id || extractPlaylistId(ytUrl);
        return {
          ...item,
          id: item.id ? String(item.id) : `yt-${Date.now()}`,
          title: item.title || 'Video de YouTube',
          artist: item.artist || 'Canal de YouTube',
          youtubeId: ytId,
          listId,
          url: ytUrl || (ytId ? (listId ? `https://www.youtube.com/watch?v=${ytId}&list=${listId}` : `https://www.youtube.com/watch?v=${ytId}`) : ''),
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

  // 6.5 Favoritos para Files (Supabase MP3s)
  const toggleSupabaseFavorite = async (songOrId) => {
    const songId = typeof songOrId === 'object' ? songOrId.id : songOrId;
    const updated = supabasePlaylist.map(s => {
      if (String(s.id) === String(songId)) {
        return { ...s, is_favorite: !s.is_favorite };
      }
      return s;
    });
    setSupabasePlaylist(updated);

    try {
      const numId = !isNaN(Number(songId)) ? Number(songId) : songId;
      const targetSong = updated.find(s => String(s.id) === String(songId));
      if (targetSong) {
        await supabase.from('playlist_radio').update({ is_favorite: Boolean(targetSong.is_favorite) }).eq('id', numId);
      }
    } catch (e) {
      console.warn("No se pudo actualizar favorito en Supabase:", e);
    }
  };

  // Toggle Favorito Unificado para Files, Radio Browser y YouTube
  const toggleFavorite = async (item, source) => {
    if (!item) return;
    const isYt = source === 'youtube' || item.type === 'youtube' || Boolean(item.youtubeId);
    if (isYt) {
      const trackId = typeof item === 'object' ? item.id : item;
      return toggleYoutubeFavorite(trackId);
    }

    const isLiveApi = source === 'live' || (item.isLiveStream && !supabasePlaylist.some(s => s.id === item.id));
    if (isLiveApi) {
      try {
        const exists = supabasePlaylist.find(s => s.url === item.url || s.id === item.id);
        if (exists) {
          return toggleSupabaseFavorite(exists.id);
        } else {
          const newFavorite = {
            title: item.title,
            artist: item.artist,
            url: item.url,
            cover: item.cover,
            isLiveStream: true,
            is_favorite: true,
            order_index: supabasePlaylist.length
          };
          const { data } = await supabase.from('playlist_radio').insert([newFavorite]).select();
          if (data?.[0]) {
            setSupabasePlaylist(prev => [...prev, data[0]]);
          } else {
            setSupabasePlaylist(prev => [...prev, { ...newFavorite, id: `fav-${Date.now()}` }]);
          }
        }
      } catch (err) {
        console.error("Error al modificar favorito en radio:", err);
      }
      return;
    }

    // Default: Canción de Files
    toggleSupabaseFavorite(item);
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
      if (track && (typeof track.id !== 'string' || !track.id.startsWith('yt-default'))) {
        const numId = !isNaN(Number(trackId)) ? Number(trackId) : trackId;
        await supabase.from('playlist_youtube').update({ is_favorite: Boolean(track.is_favorite) }).eq('id', numId);
      }
    } catch (e) {
      console.warn("No se pudo actualizar favorito en Supabase:", e);
    }
  };

  // Actualizar Álbum (Género, Mood, Portada, Nombre) afectando a todas sus canciones
  const updateAlbumData = async (oldAlbumName, updatedAlbum) => {
    try {
      const payload = {
        album: updatedAlbum.name,
        artist: updatedAlbum.artist,
        genre: updatedAlbum.genre,
        mood: updatedAlbum.mood,
        cover: updatedAlbum.cover
      };

      const { error: err1 } = await supabase
        .from('playlist_radio')
        .update(payload)
        .eq('album', oldAlbumName);

      if (err1 && (err1.message?.includes('mood') || err1.message?.includes('column'))) {
        const minimalPayload = {
          album: updatedAlbum.name,
          artist: updatedAlbum.artist,
          genre: updatedAlbum.genre,
          cover: updatedAlbum.cover
        };
        await supabase
          .from('playlist_radio')
          .update(minimalPayload)
          .eq('album', oldAlbumName);
      }

      setSupabasePlaylist(prev => prev.map(song => {
        const songAlbum = (song.album || 'Sencillo').trim().toLowerCase();
        if (songAlbum === oldAlbumName.trim().toLowerCase()) {
          return {
            ...song,
            album: updatedAlbum.name,
            artist: updatedAlbum.artist || song.artist,
            genre: updatedAlbum.genre,
            mood: updatedAlbum.mood,
            cover: updatedAlbum.cover || song.cover
          };
        }
        return song;
      }));

    } catch (err) {
      console.error("Error al actualizar álbum:", err);
      throw err;
    }
  };

  // Filtros Supabase (Files)
  const [supabaseSearchQuery, setSupabaseSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [activeView, setActiveView] = useState('all'); // 'all', 'favorites'

  const handleSetSelectedGenre = (genre) => {
    setSelectedGenre(genre);
    if (genre !== 'all') {
      setSelectedCategory(genre.toLowerCase());
      setSelectedYoutubeCategory(genre);
    } else {
      setSelectedYoutubeCategory('Todos');
    }
  };

  // Helper para inferir género
  const getTrackGenre = (song) => {
    if (song.genre && song.genre.trim() !== '') return song.genre.toLowerCase();
    const text = `${song.title || ''} ${song.artist || ''} ${song.album || ''}`.toLowerCase();
    if (text.includes('rock') || text.includes('metal')) return 'rock';
    if (text.includes('lofi') || text.includes('lo-fi') || text.includes('chill') || text.includes('relax')) return 'lofi';
    if (text.includes('jazz') || text.includes('blues') || text.includes('swing')) return 'jazz';
    if (text.includes('pop') || text.includes('dance')) return 'pop';
    if (text.includes('salsa') || text.includes('latin') || text.includes('cumbia') || text.includes('merengue')) return 'salsa';
    if (text.includes('electro') || text.includes('house') || text.includes('techno') || text.includes('synth')) return 'electro';
    if (text.includes('acoustic') || text.includes('acustico') || text.includes('guitar') || text.includes('unplugged')) return 'acustico';
    if (text.includes('indie') || text.includes('alt')) return 'indie';
    return 'varios';
  };

  // Filtrar playlist de Supabase
  const getFilteredSupabasePlaylist = () => {
    return supabasePlaylist.filter((song) => {
      if (activeView === 'favorites' && !song.is_favorite) return false;

      if (selectedGenre !== 'all') {
        const songGenre = (song.genre || song.category || '').trim().toLowerCase();
        if (!songGenre.includes(selectedGenre.toLowerCase())) return false;
      }

      if (selectedArtist !== 'all') {
        const songArtist = (song.artist || 'Artista Desconocido').trim().toLowerCase();
        if (songArtist !== selectedArtist.toLowerCase()) return false;
      }

      if (selectedAlbum !== 'all') {
        const songAlbum = (song.album || 'Sencillo').trim().toLowerCase();
        if (songAlbum !== selectedAlbum.toLowerCase()) return false;
      }

      if (supabaseSearchQuery.trim() !== '') {
        const q = supabaseSearchQuery.toLowerCase().trim();
        const matchTitle = (song.title || '').toLowerCase().includes(q);
        const matchArtist = (song.artist || '').toLowerCase().includes(q);
        const matchAlbum = (song.album || '').toLowerCase().includes(q);
        const matchGenre = (song.genre || song.category || '').toLowerCase().includes(q);
        return matchTitle || matchArtist || matchAlbum || matchGenre;
      }

      return true;
    });
  };

  const filteredSupabasePlaylist = getFilteredSupabasePlaylist();

  // Reset index if out of bounds when filter changes
  useEffect(() => {
    if (activeTab === 'supabase' && currentTrackIndex >= filteredSupabasePlaylist.length && filteredSupabasePlaylist.length > 0) {
      if (setCurrentTrackIndex) setCurrentTrackIndex(0);
    }
  }, [filteredSupabasePlaylist.length, activeTab]);

  // 7. Archivos Locales / YouTube / Obtener Playlist Activa
  const getFilteredYoutubePlaylist = () => {
    return youtubePlaylist.filter(track => {
      const matchFav = activeView !== 'favorites' || track.is_favorite;
      const matchCat = selectedYoutubeCategory === 'Todos' || selectedGenre === 'all' ||
        (track.category && track.category.toLowerCase().includes(selectedGenre.toLowerCase())) ||
        (selectedYoutubeCategory !== 'Todos' && track.category === selectedYoutubeCategory);
      const q = youtubeSearchQuery.toLowerCase().trim();
      const matchQuery = !q || (track.title || '').toLowerCase().includes(q) || (track.artist || '').toLowerCase().includes(q);
      return matchFav && matchCat && matchQuery;
    });
  };

  const filteredYoutubePlaylist = getFilteredYoutubePlaylist();

  const getActivePlaylist = () => {
    if (activeTab === 'live') return apiStations;
    if (activeTab === 'supabase') return filteredSupabasePlaylist;
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
    filteredSupabasePlaylist,
    supabaseSearchQuery,
    setSupabaseSearchQuery,
    selectedGenre,
    setSelectedGenre: handleSetSelectedGenre,
    selectedArtist,
    setSelectedArtist,
    selectedAlbum,
    setSelectedAlbum,
    activeView,
    setActiveView,
    loadingSupabase,
    supabaseError,
    moveSongOrder,
    handleDeleteSong,
    updateAlbumData,
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

