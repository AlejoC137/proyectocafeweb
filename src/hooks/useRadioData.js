import { useState, useEffect, useCallback } from 'react';
import supabase from '../config/supabaseClient';
import { SOMAFM_CURATED_STATIONS, getAudioDuration, MAX_PLAYLIST_SECONDS } from '../utils/radioHelpers';

export function useRadioData(activeTab, currentTrack, currentTrackIndex, setCurrentTrackIndex, setIsPlaying, setAudioError) {
  // Radio Browser API & Filtros
  const [selectedCategory, setSelectedCategory] = useState('lofi'); 
  const [apiStations, setApiStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingApi, setLoadingApi] = useState(false);

  // SomaFM API State
  const [somaFmChannels, setSomaFmChannels] = useState(SOMAFM_CURATED_STATIONS);
  const [loadingSomaFm, setLoadingSomaFm] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null); // Metadata "ahora suena" de SomaFM

  // Playlist estrictamente de Supabase
  const [supabasePlaylist, setSupabasePlaylist] = useState([]);
  const [localPlaylist, setLocalPlaylist] = useState([]);
  const [loadingSupabase, setLoadingSupabase] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);

  // 1. Fetch Canales de SomaFM API
  const fetchSomaFmChannels = async () => {
    try {
      setLoadingSomaFm(true);
      const res = await fetch('https://api.somafm.com/channels.json');
      const data = await res.json();
      console.log("==== SOMA FM API DATA ====", data);
      if (data && Array.isArray(data.channels)) {
        const formatted = data.channels.map((chan) => ({
          id: `somafm-${chan.id}`,
          title: `${chan.title} (SomaFM)`,
          artist: chan.description || 'SomaFM Internet Radio',
          genre: chan.genre ? chan.genre.replace(/\|/g, ' / ') : 'Lounge',
          url: `https://stream.somafm.com/${chan.id}-128-mp3`,
          isLiveStream: true,
          cover: chan.largeimage || chan.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600'
        }));
        setSomaFmChannels(formatted);
      }
    } catch (err) {
      console.warn("SomaFM API no disponible, usando canales curados:", err);
      setSomaFmChannels(SOMAFM_CURATED_STATIONS);
    } finally {
      setLoadingSomaFm(false);
    }
  };

  useEffect(() => {
    fetchSomaFmChannels();
  }, []);

  // 2. Fetch playlist real desde Supabase
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

  // 3. SomaFM Now Playing
  const fetchNowPlaying = useCallback(async () => {
    if (activeTab !== 'somafm' || !currentTrack?.id) return;
    try {
      const channelId = currentTrack.id?.replace('somafm-', '');
      if (!channelId) return;
      const res = await fetch(`https://api.somafm.com/songs/${channelId}.json`);
      const data = await res.json();
      if (data?.songs?.[0]) {
        setNowPlaying({
          title: data.songs[0].title,
          artist: data.songs[0].artist,
          album: data.songs[0].album,
        });
      }
    } catch {
      // silencioso
    }
  }, [activeTab, currentTrack?.id]);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

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
      console.log("==== RADIO BROWSER API DATA ====", data);

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

  // 5. Reordenar canción en Supabase
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

  // 6. Eliminar canción de Supabase
  const handleDeleteSong = async (id, fileUrl) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta canción de Supabase?")) return;
    try {
      const { error: dbError } = await supabase
        .from('playlist_radio')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

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

  // 6.5 Favoritos (Radio Browser)
  const toggleFavorite = async (station) => {
    try {
      const exists = supabasePlaylist.find(s => s.url === station.url || s.id === station.id);
      if (exists) {
        // Eliminar de favoritos
        await supabase.from('playlist_radio').delete().eq('id', exists.id);
      } else {
        // Agregar a favoritos
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

  // 7. Archivos Locales
  const getActivePlaylist = () => {
    if (activeTab === 'somafm') return somaFmChannels;
    if (activeTab === 'live') return apiStations;
    if (activeTab === 'supabase') return supabasePlaylist;
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
      setActiveTabCallback('local'); // Callback to main component
    }
  };

  const removeLocalTrack = (id) => {
    setLocalPlaylist((prev) => prev.filter((t) => t.id !== id));
    if (currentTrackIndex >= localPlaylist.length - 1 && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  return {
    somaFmChannels,
    loadingSomaFm,
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
    toggleFavorite,
    localPlaylist,
    handleLocalFilesUpload,
    removeLocalTrack,
    currentPlaylist,
    totalPlaylistSeconds
  };
}
