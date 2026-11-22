import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../config/supabaseClient';
import { getAudioDuration } from '../utils/radioHelpers';
import { extractYoutubeId, extractPlaylistId, getYoutubeThumbnail, DEFAULT_YOUTUBE_PLAYLIST } from '../utils/youtubeHelpers';
import {
  discoverMediaServer,
  fetchMediaCatalog,
  rebaseCatalogUrls,
} from '../services/mediaServerService';

export const DEFAULT_RADIO_STATIONS = [
  {
    id: 'api-default-1',
    title: 'Lofi Cafe Radio',
    artist: 'Global • MP3 Online',
    genre: 'lofi',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    isLiveStream: true,
    duration: 0,
    cover: ''
  },
  {
    id: 'api-default-2',
    title: 'Smooth Jazz Global',
    artist: 'Global • MP3 Online',
    genre: 'jazz',
    url: 'https://streaming.exclusive.radio/er/smoothjazz/icecast.audio',
    isLiveStream: true,
    duration: 0,
    cover: ''
  },
  {
    id: 'api-default-3',
    title: 'Chillout Lounge Ambient',
    artist: 'Chillout • Stream',
    genre: 'chillout',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    isLiveStream: true,
    duration: 0,
    cover: ''
  }
];

export function useRadioData(
  activeTab,
  currentTrack,
  currentTrackIndex,
  setCurrentTrackIndex,
  setIsPlaying,
  setAudioError
) {
  // Radio Browser API & Filtros
  const [selectedCategory, setSelectedCategory] = useState('lofi');
  const [apiStations, setApiStations] = useState(DEFAULT_RADIO_STATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingApi, setLoadingApi] = useState(false);

  // Metadata "ahora suena"
  const [nowPlaying, setNowPlaying] = useState(null);

  // Personal Media Server (Cloudflare Tunnel + discovery via Supabase `media_server_config`)
  const [mediaServerStatus, setMediaServerStatus] = useState('loading'); // 'loading' | 'online' | 'offline'
  const [mediaServerUrl, setMediaServerUrl] = useState(null);
  const [mediaServerInfo, setMediaServerInfo] = useState({
    totalAudio: 0,
    updatedAt: null,
    reason: null,
    error: null,
  });
  const [mediaTracks, setMediaTracks] = useState([]);
  const [mediaAlbums, setMediaAlbums] = useState([]);
  const [localPlaylist, setLocalPlaylist] = useState([]);

  const mediaServerUrlRef = useRef(null);
  const mediaTracksRef = useRef([]);
  const mediaAlbumsRef = useRef([]);
  const activeTrackRef = useRef(null);

  useEffect(() => {
    mediaServerUrlRef.current = mediaServerUrl;
  }, [mediaServerUrl]);

  useEffect(() => {
    mediaTracksRef.current = mediaTracks;
  }, [mediaTracks]);

  useEffect(() => {
    mediaAlbumsRef.current = mediaAlbums;
  }, [mediaAlbums]);

  useEffect(() => {
    if (mediaTracks && mediaTracks[currentTrackIndex]) {
      activeTrackRef.current = mediaTracks[currentTrackIndex];
    }
  }, [mediaTracks, currentTrackIndex]);

  // Playlist de YouTube (lectura desde Supabase, con fallback curado)
  const [youtubePlaylist, setYoutubePlaylist] = useState(DEFAULT_YOUTUBE_PLAYLIST);
  const [selectedYoutubeCategory, setSelectedYoutubeCategory] = useState('Todos');
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  // 1. Conectar y cargar catálogo desde Personal Media Server
  const loadMediaServerCatalog = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setMediaServerStatus('loading');
      }

      const discovery = await discoverMediaServer(4000);

      if (!discovery.online || !discovery.baseUrl) {
        setMediaServerUrl(null);
        setMediaServerStatus('offline');
        setMediaServerInfo({
          totalAudio: discovery.config?.totalAudio || 0,
          updatedAt: discovery.config?.updatedAt || null,
          reason: discovery.reason || 'server_offline',
          error: discovery.config?.error || null,
        });
        return { online: false, baseUrl: null };
      }

      const catalog = await fetchMediaCatalog(discovery.baseUrl, { groupBy: 'album' });

      setMediaServerUrl(discovery.baseUrl);
      setMediaServerStatus('online');
      setMediaServerInfo({
        totalAudio: catalog.total || discovery.config?.totalAudio || catalog.tracks.length,
        updatedAt: discovery.config?.updatedAt || null,
        reason: null,
        error: null,
      });

      // Preservar pista activa al refrescar el catálogo
      if (activeTrackRef.current && setCurrentTrackIndex) {
        const curActive = activeTrackRef.current;
        const foundIdx = catalog.tracks.findIndex(
          (t) =>
            (curActive.id && t.id === curActive.id) ||
            (curActive.title && t.title === curActive.title && t.artist === curActive.artist)
        );
        if (foundIdx !== -1 && foundIdx !== currentTrackIndex) {
          setCurrentTrackIndex(foundIdx);
        }
      }

      setMediaTracks(catalog.tracks);
      setMediaAlbums(catalog.albums);

      return { online: true, baseUrl: discovery.baseUrl, catalog };
    } catch (err) {
      console.warn('[MediaServer] Error cargando catálogo:', err?.message || err);
      setMediaServerStatus('offline');
      setMediaServerInfo((prev) => ({
        ...prev,
        reason: 'catalog_error',
        error: err?.message || 'No se pudo cargar el catálogo de audio',
      }));
      return { online: false, baseUrl: null };
    }
  }, [currentTrackIndex, setCurrentTrackIndex]);

  // Botón "Reintentar" explícito
  const retryMediaServer = useCallback(async () => {
    if (setAudioError) setAudioError(null);
    return loadMediaServerCatalog({ silent: false });
  }, [loadMediaServerCatalog, setAudioError]);

  // Auto-recuperación: si falla el stream durante reproducción, re-lee `media_server_config` 1 vez
  // para refrescar `baseUrl` (p.ej. si el túnel de Cloudflare cambió) y re-mapea las URLs
  const recoverMediaServer = useCallback(async () => {
    try {
      const prevUrl = mediaServerUrlRef.current;
      const discovery = await discoverMediaServer(4000);

      if (!discovery.online || !discovery.baseUrl) {
        setMediaServerStatus('offline');
        setMediaServerInfo({
          totalAudio: discovery.config?.totalAudio || 0,
          updatedAt: discovery.config?.updatedAt || null,
          reason: discovery.reason || 'server_offline',
          error: discovery.config?.error || null,
        });
        return { recovered: false, newBaseUrl: null, changed: false };
      }

      const newBaseUrl = discovery.baseUrl;
      const changed = newBaseUrl !== prevUrl;

      setMediaServerUrl(newBaseUrl);
      setMediaServerStatus('online');
      setMediaServerInfo({
        totalAudio: discovery.config?.totalAudio || mediaTracksRef.current.length,
        updatedAt: discovery.config?.updatedAt || null,
        reason: null,
        error: null,
      });

      if (mediaTracksRef.current.length > 0) {
        if (changed) {
          const rebased = rebaseCatalogUrls(
            mediaTracksRef.current,
            mediaAlbumsRef.current,
            newBaseUrl
          );
          setMediaTracks(rebased.tracks);
          setMediaAlbums(rebased.albums);
        }
      } else {
        const catalog = await fetchMediaCatalog(newBaseUrl, { groupBy: 'album' });
        setMediaTracks(catalog.tracks);
        setMediaAlbums(catalog.albums);
      }

      return { recovered: true, newBaseUrl, changed };
    } catch (err) {
      console.warn('[MediaServer] Auto-recuperación fallida:', err?.message || err);
      setMediaServerStatus('offline');
      return { recovered: false, newBaseUrl: null, changed: false };
    }
  }, []);

  const markMediaServerOffline = useCallback((reason = 'stream_failed') => {
    setMediaServerStatus('offline');
    setMediaServerInfo((prev) => ({
      ...prev,
      reason,
    }));
  }, []);

  useEffect(() => {
    loadMediaServerCatalog({ silent: false });
  }, []);

  // 2. Fetch playlist de YouTube desde Supabase
  const fetchYoutubePlaylist = async () => {
    try {
      setLoadingYoutube(true);
      const { data, error } = await supabase
        .from('playlist_youtube')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.warn('Error al consultar playlist_youtube en Supabase:', error.message);
        setYoutubePlaylist([]);
        return;
      }

      const formatted = (data || []).map((item) => {
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
          url:
            ytUrl ||
            (ytId
              ? listId
                ? `https://www.youtube.com/watch?v=${ytId}&list=${listId}`
                : `https://www.youtube.com/watch?v=${ytId}`
              : ''),
          cover:
            item.cover && typeof item.cover === 'string' && !item.cover.startsWith('blob:')
              ? item.cover.replace('hqdefault.jpg', 'mqdefault.jpg')
              : getYoutubeThumbnail(ytId),
          category: item.category || 'Lofi & Chill',
          type: 'youtube',
        };
      });
      setYoutubePlaylist(formatted);
    } catch (err) {
      console.warn('Error cargando playlist de YouTube:', err);
      setYoutubePlaylist([]);
    } finally {
      setLoadingYoutube(false);
    }
  };

  useEffect(() => {
    fetchYoutubePlaylist();
  }, []);

  // 3. Radio-Browser API (Tab Radios Online)
  const fetchApiRadioStations = async (tag, query = '') => {
    try {
      setLoadingApi(true);
      const endpoint = query
        ? `https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(query)}?limit=15&hidebroken=true`
        : `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(tag)}?limit=15&hidebroken=true`;

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
          cover: item.favicon && item.favicon.startsWith('http') ? item.favicon : '',
        }));
        setApiStations(formatted);
      }
    } catch (err) {
      console.warn('API de radios no disponible:', err);
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

  // Favoritos YouTube
  const toggleYoutubeFavorite = async (trackId) => {
    const updated = youtubePlaylist.map((t) =>
      t.id === trackId ? { ...t, is_favorite: !t.is_favorite } : t
    );
    setYoutubePlaylist(updated);

    try {
      const track = updated.find((t) => t.id === trackId);
      if (track && (typeof track.id !== 'string' || !track.id.startsWith('yt-default'))) {
        const numId = !isNaN(Number(trackId)) ? Number(trackId) : trackId;
        await supabase
          .from('playlist_youtube')
          .update({ is_favorite: Boolean(track.is_favorite) })
          .eq('id', numId);
      }
    } catch (e) {
      console.warn('No se pudo actualizar favorito en YouTube:', e);
    }
  };

  const toggleFavorite = async (item, source) => {
    if (!item) return;
    const isYt = source === 'youtube' || item.type === 'youtube' || Boolean(item.youtubeId);
    if (isYt) {
      const trackId = typeof item === 'object' ? item.id : item;
      return toggleYoutubeFavorite(trackId);
    }
  };

  // Filtros de biblioteca (Personal Media Server)
  const [supabaseSearchQuery, setSupabaseSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [activeView, setActiveView] = useState('all');

  const handleSetSelectedGenre = (genre) => {
    setSelectedGenre(genre);
    if (genre !== 'all') {
      setSelectedCategory(genre.toLowerCase());
      setSelectedYoutubeCategory(genre);
    } else {
      setSelectedYoutubeCategory('Todos');
    }
  };

  const filteredMediaTracks = mediaTracks.filter((song) => {
    if (selectedArtist !== 'all') {
      const songArtist = (song.artist || 'Artista desconocido').trim().toLowerCase();
      if (songArtist !== selectedArtist.toLowerCase()) return false;
    }

    if (selectedAlbum !== 'all') {
      const songAlbum = (song.album || 'Sencillos').trim().toLowerCase();
      if (songAlbum !== selectedAlbum.toLowerCase()) return false;
    }

    if (supabaseSearchQuery.trim() !== '') {
      const q = supabaseSearchQuery.toLowerCase().trim();
      const matchTitle = (song.title || '').toLowerCase().includes(q);
      const matchArtist = (song.artist || '').toLowerCase().includes(q);
      const matchAlbum = (song.album || '').toLowerCase().includes(q);
      return matchTitle || matchArtist || matchAlbum;
    }

    return true;
  });

  // Reset index if out of bounds when filter changes
  useEffect(() => {
    if (
      activeTab === 'supabase' &&
      currentTrackIndex >= filteredMediaTracks.length &&
      filteredMediaTracks.length > 0
    ) {
      if (setCurrentTrackIndex) setCurrentTrackIndex(0);
    }
  }, [filteredMediaTracks.length, activeTab, currentTrackIndex, setCurrentTrackIndex]);

  const filteredYoutubePlaylist = youtubePlaylist.filter((track) => {
    const matchFav = activeView !== 'favorites' || track.is_favorite;
    const matchCat =
      selectedYoutubeCategory === 'Todos' ||
      selectedGenre === 'all' ||
      (track.category && track.category.toLowerCase().includes(selectedGenre.toLowerCase())) ||
      (selectedYoutubeCategory !== 'Todos' && track.category === selectedYoutubeCategory);
    const q = youtubeSearchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      (track.title || '').toLowerCase().includes(q) ||
      (track.artist || '').toLowerCase().includes(q);
    return matchFav && matchCat && matchQuery;
  });

  const getActivePlaylist = () => {
    if (activeTab === 'live') return apiStations;
    if (activeTab === 'supabase') return filteredMediaTracks;
    if (activeTab === 'youtube') {
      return filteredYoutubePlaylist.length > 0 ? filteredYoutubePlaylist : youtubePlaylist;
    }
    return localPlaylist;
  };

  const currentPlaylist = getActivePlaylist();
  const totalPlaylistSeconds = currentPlaylist.reduce((acc, item) => acc + (item.duration || 0), 0);

  const handleLocalFilesUpload = async (e, setActiveTabCallback) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (setAudioError) setAudioError(null);
    const processedTracks = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const durSec = await getAudioDuration(file);
      const objectUrl = URL.createObjectURL(file);

      processedTracks.push({
        id: `local-${Date.now()}-${idx}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Archivo Local (Tu PC)',
        url: objectUrl,
        streamUrl: objectUrl,
        duration: durSec,
        isLocalFile: true,
        isLiveStream: false,
        fileName: file.name,
        cover: '',
        coverUrl: '',
      });
    }

    if (processedTracks.length > 0) {
      setLocalPlaylist((prev) => [...prev, ...processedTracks]);
      if (setActiveTabCallback) setActiveTabCallback('local');
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
    setNowPlaying,
    // Radios online
    apiStations,
    loadingApi,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    // Personal Media Server
    mediaServerStatus,
    mediaServerUrl,
    mediaServerInfo,
    mediaAlbums,
    mediaTracks,
    retryMediaServer,
    recoverMediaServer,
    markMediaServerOffline,
    // Aliases compatibles con el árbol de componentes existente
    supabasePlaylist: mediaTracks,
    setSupabasePlaylist: setMediaTracks,
    fetchSupabasePlaylist: retryMediaServer,
    filteredSupabasePlaylist: filteredMediaTracks,
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
    loadingSupabase: mediaServerStatus === 'loading',
    supabaseError: mediaServerInfo.error,
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
    totalPlaylistSeconds,
  };
}
