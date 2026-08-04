import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabaseClient';
import { 
  Radio, 
  Cloud, 
  FolderOpen, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Upload, 
  Settings, 
  Globe, 
  HardDrive, 
  Sparkles, 
  Info, 
  Music, 
  Repeat, 
  Shuffle, 
  Wifi, 
  Trash2,
  Clock,
  RotateCw,
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Disc
} from 'lucide-react';

const MAX_PLAYLIST_SECONDS = 4 * 60 * 60; // 4 horas en segundos (14,400 seg)

// Canales SomaFM Curados Especialmente para Proyecto Café (Sección SomaFM API)
const SOMAFM_CURATED_STATIONS = [
  {
    id: 'somafm-groovesalad',
    title: 'Groove Salad (SomaFM)',
    artist: 'Downtempo, Ambient & Chillout para Café',
    genre: 'Ambient / Chill',
    url: 'https://stream.somafm.com/groovesalad-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-illstreet',
    title: 'Illinois Street Lounge (SomaFM)',
    artist: 'Lounge Clásico, Exotica & Música de Coctelería',
    genre: 'Lounge',
    url: 'https://stream.somafm.com/illstreet-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1445985543470-41fba5c3144a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-bossa',
    title: 'Bossa Beyond (SomaFM)',
    artist: 'Bossa Nova Moderna & Tradicional',
    genre: 'Bossa Nova',
    url: 'https://stream.somafm.com/bossa-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-lush',
    title: 'Lush (SomaFM)',
    artist: 'Downtempo Vocal & Sensuous Chill',
    genre: 'Downtempo',
    url: 'https://stream.somafm.com/lush-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-secretagent',
    title: 'Secret Agent (SomaFM)',
    artist: 'Retro Spy & Surf Lounge Beats',
    genre: 'Retro Beats',
    url: 'https://stream.somafm.com/secretagent-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=600'
  }
];

// Extractor Inteligente de Metadatos ID3 (Título, Artista, Carátula e Información de Audio)
const parseMp3Metadata = (file) => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target.result;
      const view = new DataView(buffer);

      let title = file.name.replace(/\.[^/.]+$/, "");
      let artist = '';
      let coverUrl = null;

      if (buffer.byteLength > 10 && view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
        const id3Size = (view.getUint8(6) << 21) | (view.getUint8(7) << 14) | (view.getUint8(8) << 7) | view.getUint8(9);
        let offset = 10;

        while (offset < id3Size + 10 && offset + 10 < buffer.byteLength) {
          const frameId = String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
          );

          const frameSize = (view.getUint8(offset + 4) << 24) |
                            (view.getUint8(offset + 5) << 16) |
                            (view.getUint8(offset + 6) << 8) |
                            view.getUint8(offset + 7);

          if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) break;

          const frameDataOffset = offset + 10;

          if (frameId === 'TIT2') {
            const bytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);
            const str = new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
            if (str) title = str;
          }

          if (frameId === 'TPE1') {
            const bytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);
            const str = new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
            if (str) artist = str;
          }

          if (frameId === 'APIC') {
            try {
              const bytes = new Uint8Array(buffer, frameDataOffset, frameSize);
              let imgOffset = 1;
              while (imgOffset < bytes.length && bytes[imgOffset] !== 0) imgOffset++;
              imgOffset += 2;

              let imageStart = imgOffset;
              for (let i = imgOffset; i < bytes.length - 1; i++) {
                if ((bytes[i] === 0xFF && bytes[i + 1] === 0xD8) || (bytes[i] === 0x89 && bytes[i + 1] === 0x50)) {
                  imageStart = i;
                  break;
                }
              }

              const imgBuffer = bytes.subarray(imageStart);
              const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
              coverUrl = URL.createObjectURL(blob);
            } catch (err) {
              console.log("No se pudo extraer carátula:", err);
            }
          }

          offset += 10 + frameSize;
        }
      }

      const audio = new Audio();
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        resolve({
          title,
          artist: artist || 'Archivo Local (Tu PC)',
          cover: coverUrl,
          duration: Math.round(audio.duration || 0),
          objectUrl
        });
      };
      audio.onerror = () => resolve({ title, artist: artist || 'Archivo Local (Tu PC)', cover: coverUrl, duration: 0, objectUrl });
    };

    reader.onerror = () => resolve({
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'Archivo Local (Tu PC)',
      cover: null,
      duration: 0,
      objectUrl
    });

    reader.readAsArrayBuffer(file.slice(0, 512 * 1024));
  });
};

// Helper para calcular duración de un archivo MP3 en el navegador
const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration || 0));
    };
    audio.onerror = () => resolve(0);
  });
};

export default function ProyectoRadio() {
  const navigate = useNavigate();
  
  // Tab/Modo de origen: 'supabase' | 'somafm' | 'live' | 'local'
  const [activeTab, setActiveTab] = useState('supabase');

  // Radio Browser API & Filtros
  const [selectedCategory, setSelectedCategory] = useState('lofi'); 
  const [apiStations, setApiStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingApi, setLoadingApi] = useState(false);

  // SomaFM API State
  const [somaFmChannels, setSomaFmChannels] = useState(SOMAFM_CURATED_STATIONS);
  const [loadingSomaFm, setLoadingSomaFm] = useState(false);

  // Playlist estrictamente de Supabase (sin mezclar nada)
  const [supabasePlaylist, setSupabasePlaylist] = useState([]);
  const [localPlaylist, setLocalPlaylist] = useState([]);
  const [loadingSupabase, setLoadingSupabase] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);

  // Reproducción y controles
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Opciones
  const [isDailyLoop, setIsDailyLoop] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeatSingle, setIsRepeatSingle] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch Canales de SomaFM API
  const fetchSomaFmChannels = async () => {
    try {
      setLoadingSomaFm(true);
      const res = await fetch('https://api.somafm.com/channels.json');
      const data = await res.json();
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

  // 2. Obtener la playlist activa por tab (Sin inventar en Supabase)
  const getActivePlaylist = () => {
    if (activeTab === 'somafm') {
      return somaFmChannels;
    }
    if (activeTab === 'live') {
      return apiStations;
    }
    if (activeTab === 'supabase') {
      // Estrictamente SOLO lo que existe en Supabase
      return supabasePlaylist;
    }
    return localPlaylist;
  };

  const currentPlaylist = getActivePlaylist();
  const currentTrack = currentPlaylist[currentTrackIndex] || currentPlaylist[0];

  const totalPlaylistSeconds = currentPlaylist.reduce((acc, item) => acc + (item.duration || 0), 0);

  // 3. Fetch playlist real desde Supabase (Resiliente a si existe o no order_index)
  const fetchSupabasePlaylist = async () => {
    try {
      setLoadingSupabase(true);
      setSupabaseError(null);
      
      let data = null;
      let error = null;

      // Intentar ordenar por order_index primero
      const firstTry = await supabase
        .from('playlist_radio')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (firstTry.error && firstTry.error.message?.includes('order_index')) {
        // Fallback ordenando por id si order_index no existe en la tabla del usuario
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentTrackIndex(0);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioError(null);
  };

  const togglePlay = () => {
    if (!currentTrack?.url || !audioRef.current) return;

    setAudioError(null);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            if (err.name === 'AbortError' || err.name === 'NotSupportedError' || err.message?.includes('interrupted') || err.message?.includes('no supported source')) {
              return;
            }
            console.error("Error reproduciendo audio:", err);
            setIsPlaying(false);
            setAudioError("Haz clic nuevamente para iniciar la reproducción.");
          });
      }
    }
  };

  const nextTrack = () => {
    if (currentPlaylist.length === 0) return;
    setAudioError(null);
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * currentPlaylist.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev === currentPlaylist.length - 1 ? 0 : prev + 1));
    }
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (currentPlaylist.length === 0) return;
    setAudioError(null);
    setCurrentTrackIndex((prev) => (prev === 0 ? currentPlaylist.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const handleLocalFilesUpload = async (e) => {
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
      setActiveTab('local');
      if (!isPlaying) {
        setCurrentTrackIndex(localPlaylist.length);
        setIsPlaying(true);
      }
    }
  };

  const removeLocalTrack = (id) => {
    setLocalPlaylist((prev) => prev.filter((t) => t.id !== id));
    if (currentTrackIndex >= localPlaylist.length - 1 && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration || currentTrack?.isLiveStream) return;
    const seekPercent = parseFloat(e.target.value);
    const newTime = (seekPercent / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(seekPercent);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  useEffect(() => {
    if (audioRef.current && currentTrack?.url) {
      audioRef.current.volume = isMuted ? 0 : volume;

      if (isPlaying) {
        setProgress(0);
        setCurrentTime(0);
        const promise = audioRef.current.play();
        if (promise !== undefined) {
          promise.catch((err) => {
            if (err.name === 'AbortError' || err.name === 'NotSupportedError' || err.message?.includes('interrupted') || err.message?.includes('no supported source')) {
              return;
            }
            console.warn("Autoplay o reproducción cancelada:", err.message);
            setIsPlaying(false);
          });
        }
      }
    } else if (!currentTrack?.url && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentTrack?.url, activeTab]);

  const handleTrackEnded = () => {
    if (isRepeatSingle) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (isDailyLoop) {
      if (currentTrackIndex === currentPlaylist.length - 1) {
        setCurrentTrackIndex(0);
      } else {
        nextTrack();
      }
    } else {
      nextTrack();
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const formattedTotalPlaylistTime = formatTime(totalPlaylistSeconds);
  const quotaPercent = Math.min(100, Math.round((totalPlaylistSeconds / MAX_PLAYLIST_SECONDS) * 100));

  return (
    <div className="w-full min-h-screen bg-[#F5F0E1] text-[#374151] p-4 sm:p-8 flex flex-col items-center justify-start relative font-sans">
      
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E0A996]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A5B8A1]/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Superior */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-700 to-orange-600 rounded-2xl shadow-md shadow-orange-900/20 text-white">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Proyecto Radio Web
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              SomaFM API • Supabase Storage • Radio Browser API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDailyLoop(!isDailyLoop)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm ${
              isDailyLoop 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-white/80 text-slate-500 border border-slate-200'
            }`}
            title="Repetir la lista completa del día en bucle infinito"
          >
            <RotateCw className={`w-4 h-4 ${isDailyLoop ? 'animate-spin text-orange-600' : ''}`} style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">{isDailyLoop ? 'Bucle Diario: ON' : 'Bucle Diario: OFF'}</span>
          </button>

          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/80 hover:bg-white border border-amber-900/15 rounded-2xl text-xs font-bold text-amber-900 transition shadow-sm hover:shadow-md"
            title="APIs de Radio Integradas y Guía Técnica"
          >
            <Info className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">APIs & Setup</span>
          </button>
          
          <button
            onClick={() => navigate('/RadioManager')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-bold text-xs rounded-2xl transition shadow-md shadow-orange-900/20 hover:scale-[1.02] active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span>Admin Radio</span>
          </button>
        </div>
      </div>

      {/* BARRA DE CUOTA DE 4 HORAS */}
      {activeTab !== 'live' && activeTab !== 'somafm' && (
        <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-2xl p-4 mb-6 shadow-md z-10">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-2 text-slate-800">
              <Clock className="w-4 h-4 text-orange-600" />
              Límite de Bucle Diario (4 Horas Máximo)
            </span>
            <span className="text-amber-900 font-mono">
              {formattedTotalPlaylistTime} / 4h 00m ({quotaPercent}%)
            </span>
          </div>

          <div className="w-full bg-amber-100/80 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                quotaPercent >= 90 ? 'bg-red-500' : quotaPercent >= 70 ? 'bg-amber-500' : 'bg-orange-600'
              }`}
              style={{ width: `${quotaPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* COLUMNA IZQUIERDA: TARJETA DEL REPRODUCTOR */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/5 relative flex flex-col items-center">
            
            {/* Badge de Estado */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                currentTrack?.isLiveStream 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-orange-50 text-orange-800 border-orange-200'
              }`}>
                {currentTrack?.isLiveStream ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    {activeTab === 'somafm' ? 'SomaFM Live' : 'Emisora En Vivo'}
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5 text-orange-600" />
                    {activeTab === 'local' ? 'Bucle Local PC' : 'Play List Alejo'}
                  </>
                )}
              </span>

              {/* Control Rápido de Volumen */}
              <div className="flex items-center gap-2 bg-amber-50/80 px-3 py-1 rounded-full border border-amber-200/60">
                <button onClick={toggleMute} className="text-slate-600 hover:text-orange-600 transition">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>
            </div>

            {/* Carátula del Álbum */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-6">
              <div className={`w-full h-full rounded-3xl overflow-hidden shadow-xl border-2 border-amber-200/80 relative bg-amber-100 flex items-center justify-center transition-transform duration-500 ${isPlaying ? 'scale-105 shadow-orange-900/15' : 'scale-100'}`}>
                <img
                  src={currentTrack?.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'}
                  alt={currentTrack?.title || 'Cover'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
              </div>

              {/* Ecualizador Animado */}
              {isPlaying && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-amber-200 shadow-md">
                  <span className="w-1 bg-orange-600 rounded-full animate-[bounce_1s_infinite_100ms] h-4"></span>
                  <span className="w-1 bg-amber-500 rounded-full animate-[bounce_1s_infinite_300ms] h-6"></span>
                  <span className="w-1 bg-orange-500 rounded-full animate-[bounce_1s_infinite_150ms] h-3"></span>
                  <span className="w-1 bg-amber-600 rounded-full animate-[bounce_1s_infinite_400ms] h-5"></span>
                  <span className="w-1 bg-orange-600 rounded-full animate-[bounce_1s_infinite_200ms] h-4"></span>
                </div>
              )}
            </div>

            {/* Información del Track */}
            <div className="text-center w-full mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate max-w-full px-2" title={currentTrack?.title}>
                {currentTrack?.title || (activeTab === 'supabase' ? 'Sin Canciones en Supabase' : 'Selecciona una canción')}
              </h2>
              <p className="text-sm font-semibold text-amber-800 truncate max-w-full px-2 mt-1" title={currentTrack?.artist}>
                {currentTrack?.artist || (activeTab === 'supabase' ? 'Sube o siembra canciones en Supabase' : 'Proyecto Radio')}
              </p>
            </div>

            {/* Barra de Progreso */}
            {!currentTrack?.isLiveStream ? (
              <div className="w-full mb-6">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-orange-600 hover:accent-orange-700 transition"
                />
                <div className="flex justify-between text-xs font-mono font-bold text-slate-600 mt-1.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            ) : (
              <div className="w-full mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <span className="text-xs text-amber-900 font-semibold flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4 text-orange-600 animate-pulse" /> Transmisión Continua En Vivo
                </span>
              </div>
            )}

            {/* Controles Principales */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-3 rounded-2xl transition ${isShuffle ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50'}`}
                title="Modo Aleatorio"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevTrack}
                disabled={!currentTrack?.url}
                className="p-3 bg-amber-100/70 hover:bg-amber-200 text-amber-950 rounded-2xl transition border border-amber-200/80 shadow-sm active:scale-95 disabled:opacity-40"
                title="Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                disabled={!currentTrack?.url}
                className="p-5 bg-gradient-to-tr from-amber-700 via-orange-600 to-orange-500 hover:from-amber-800 hover:to-orange-600 text-white rounded-3xl transition shadow-lg shadow-orange-600/30 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                disabled={!currentTrack?.url}
                className="p-3 bg-amber-100/70 hover:bg-amber-200 text-amber-950 rounded-2xl transition border border-amber-200/80 shadow-sm active:scale-95 disabled:opacity-40"
                title="Siguiente"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsRepeatSingle(!isRepeatSingle)}
                className={`p-3 rounded-2xl transition ${isRepeatSingle ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50'}`}
                title="Repetir Una Canción"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Banner de aviso de error */}
            {audioError && (
              <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl text-center">
                ⚠️ {audioError}
              </div>
            )}

            {/* Elemento HTML5 Audio */}
            <audio
              ref={audioRef}
              src={currentTrack?.url || undefined}
              preload="metadata"
              referrerPolicy="no-referrer"
              onTimeUpdate={handleTimeUpdate}
              onError={() => {
                if (isPlaying && currentTrack?.url) {
                  setAudioError(`No se pudo cargar "${currentTrack.title}". Prueba con otra señal.`);
                  setIsPlaying(false);
                }
              }}
              onEnded={handleTrackEnded}
            />
          </div>
        </div>

        {/* COLUMNA DERECHA: SELECCIÓN DE ORIGEN Y PLAYLIST */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* TABS DE SELECCIÓN DE FUENTE */}
          <div className="bg-white/80 backdrop-blur-md border border-amber-900/10 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-sm">
            
            <button
              onClick={() => handleTabChange('supabase')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-bold text-xs transition ${
                activeTab === 'supabase'
                  ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Play List Alejo</span>
            </button>

            <button
              onClick={() => handleTabChange('somafm')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-bold text-xs transition ${
                activeTab === 'somafm'
                  ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
              }`}
            >
              <Disc className="w-4 h-4 text-amber-300" />
              <span>Selección Proyecto</span>
            </button>

            <button
              onClick={() => handleTabChange('live')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-bold text-xs transition ${
                activeTab === 'live'
                  ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Radio Browser</span>
            </button>

            <button
              onClick={() => handleTabChange('local')}
              className={`p-3 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                activeTab === 'local'
                  ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
              }`}
              title="Cargar Archivos de tu PC Local"
            >
              <HardDrive className="w-5 h-5" />
            </button>
          </div>

          {/* TAB 1: BASE DE DATOS SUPABASE (ESTRICTAMENTE FILAS REALES DE LA BD) */}
          {activeTab === 'supabase' && (
            <div className="bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-3xl p-6 shadow-xl shadow-amber-950/5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-amber-700" />
                    Playlist Base de Datos Supabase (Tabla `playlist_radio`)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {supabasePlaylist.length > 0 
                      ? `${supabasePlaylist.length} canciones almacenadas en la base de datos.` 
                      : 'La tabla playlist_radio está vacía.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/RadioManager')}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Administrar Radio
                  </button>
                </div>
              </div>

              {loadingSupabase ? (
                <div className="py-12 text-center text-slate-500 animate-pulse text-sm font-medium">
                  Cargando canciones desde Supabase...
                </div>
              ) : supabasePlaylist.length === 0 ? (
                <div className="p-8 bg-amber-50/60 border border-amber-200/70 text-slate-700 text-xs rounded-2xl my-4 text-center flex flex-col items-center gap-3">
                  <div className="p-3.5 bg-orange-100 text-orange-700 rounded-full">
                    <Cloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-base">La Play List está vacía</p>
                    <p className="text-slate-600 mt-1 max-w-md">
                      Sube tus archivos MP3 o sincroniza directamente desde el Bucket usando el botón de <strong>Administrar Radio</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button 
                      onClick={() => navigate('/RadioManager')} 
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-orange-600 text-white font-bold rounded-xl text-xs shadow hover:from-amber-800 hover:to-orange-700 transition"
                    >
                      ⚙️ Administrar Radio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                  {supabaseError && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl mb-3 flex justify-between items-center">
                      <span>⚠️ Conexión Supabase: {supabaseError}</span>
                      <button onClick={fetchSupabasePlaylist} className="underline text-orange-700 font-bold ml-2">Reintentar</button>
                    </div>
                  )}

                  {supabasePlaylist.map((song, index) => {
                    const isCurrent = activeTab === 'supabase' && currentTrackIndex === index;
                    return (
                      <div
                        key={song.id || index}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                          isCurrent
                            ? 'bg-gradient-to-r from-amber-100/90 to-orange-50/90 border-orange-400/60 shadow-md'
                            : 'bg-white/80 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <div 
                          onClick={() => {
                            setCurrentTrackIndex(index);
                            setIsPlaying(true);
                          }}
                          className="flex items-center gap-3.5 cursor-pointer flex-1 truncate"
                        >
                          <span className="text-xs font-mono font-bold text-amber-800 w-5 text-center">{index + 1}</span>
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 border border-amber-200">
                            <img src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'} alt={song.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="truncate">
                            <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-orange-900' : 'text-slate-800 group-hover:text-amber-900'}`}>
                              {song.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        {/* Controles de Playlist */}
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => moveSongOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 text-slate-400 hover:text-orange-700 hover:bg-orange-100 rounded-lg disabled:opacity-30 transition"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => moveSongOrder(index, 'down')}
                            disabled={index === supabasePlaylist.length - 1}
                            className="p-1.5 text-slate-400 hover:text-orange-700 hover:bg-orange-100 rounded-lg disabled:opacity-30 transition"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSong(song.id, song.url)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar de Supabase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOMAFM API (CANALES AMBIENT, LOUNGE & BOSSA NOVA) */}
          {activeTab === 'somafm' && (
            <div className="bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-3xl p-6 shadow-xl shadow-amber-950/5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Disc className="w-5 h-5 text-orange-600" />
                    Selección Proyecto (Radio Libre de Anuncios)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Canales curados independientes en vivo: Lounge, Bossa Nova, Downtempo y Ambient.
                  </p>
                </div>
                {loadingSomaFm && <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />}
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                {somaFmChannels.map((chan, index) => {
                  const isCurrent = activeTab === 'somafm' && currentTrackIndex === index;
                  return (
                    <div
                      key={chan.id}
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-100/90 to-orange-50/90 border-orange-400/60 shadow-md'
                          : 'bg-white/80 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4 truncate">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 border border-amber-200">
                          <img src={chan.cover} alt={chan.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-orange-900' : 'text-slate-800 group-hover:text-amber-900'}`}>
                            {chan.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">{chan.artist}</p>
                          <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mt-1">
                            {chan.genre}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                        {isCurrent && isPlaying ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold rounded-full animate-pulse">
                            EN VIVO
                          </span>
                        ) : (
                          <span className="p-2.5 rounded-xl bg-amber-100 group-hover:bg-orange-600 group-hover:text-white text-amber-900 transition">
                            <Play className="w-4 h-4 fill-current" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RADIO BROWSER API */}
          {activeTab === 'live' && (
            <div className="bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-3xl p-6 shadow-xl shadow-amber-950/5 flex flex-col flex-1">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-orange-600" />
                    Radio Browser API (90,000+ Emisoras Mundiales)
                  </h3>
                  {loadingApi && <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
                  {['lofi', 'jazz', 'rock', 'salsa', 'chillout', 'classical'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedCategory(tag);
                        setSearchQuery('');
                      }}
                      className={`px-3.5 py-1.5 rounded-full font-bold capitalize transition flex-shrink-0 ${
                        selectedCategory === tag && !searchQuery
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por tag (ej. cafe, lounge, bossa-nova)..."
                    className="w-full pl-9 pr-20 py-2 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg transition"
                  >
                    Buscar
                  </button>
                </form>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                {apiStations.map((station, index) => {
                  const isCurrent = activeTab === 'live' && currentTrackIndex === index;
                  return (
                    <div
                      key={station.id}
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-100/90 to-orange-50/90 border-orange-400/60 shadow-md'
                          : 'bg-white/80 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 border border-amber-200">
                          <img src={station.cover} alt={station.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isCurrent ? 'text-orange-900' : 'text-slate-800 group-hover:text-amber-900'}`}>
                            {station.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">{station.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isCurrent && isPlaying ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold rounded-full animate-pulse">
                            REPRODUCIENDO
                          </span>
                        ) : (
                          <span className="p-2.5 rounded-xl bg-amber-100 group-hover:bg-orange-600 group-hover:text-white text-amber-900 transition">
                            <Play className="w-4 h-4 fill-current" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHIVOS LOCALES PC */}
          {activeTab === 'local' && (
            <div className="bg-white/90 backdrop-blur-md border border-amber-900/10 rounded-3xl p-6 shadow-xl shadow-amber-950/5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-orange-600" />
                    Reproductor de Archivos de tu PC
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Carga archivos MP3 de tu PC para crear la lista continua del día (Máximo 4 horas).
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" /> Cargar MP3s
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleLocalFilesUpload}
                  className="hidden"
                />
              </div>

              {localPlaylist.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-300 hover:border-orange-500 rounded-3xl p-8 text-center cursor-pointer transition bg-amber-50/40 hover:bg-amber-50/90 flex flex-col items-center justify-center gap-3 my-4"
                >
                  <div className="p-4 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Haz clic aquí para seleccionar música de tu PC</p>
                    <p className="text-xs text-slate-500 mt-1">Soporta archivos MP3, WAV, FLAC, M4A y OGG locales hasta 4 horas</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                  {localPlaylist.map((track, index) => {
                    const isCurrent = activeTab === 'local' && currentTrackIndex === index;
                    return (
                      <div
                        key={track.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                          isCurrent
                            ? 'bg-gradient-to-r from-amber-100/90 to-orange-50/90 border-orange-400/60 shadow-md'
                            : 'bg-white/80 border-amber-100 hover:border-amber-300'
                        }`}
                      >
                        <div 
                          onClick={() => {
                            setCurrentTrackIndex(index);
                            setIsPlaying(true);
                          }}
                          className="flex items-center gap-4 cursor-pointer flex-1"
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 border border-amber-200">
                            <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm ${isCurrent ? 'text-orange-900' : 'text-slate-800 group-hover:text-amber-900'}`}>
                              {track.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                              <span>{track.fileName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => removeLocalTrack(track.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Quitar de la lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL INFORMATIVO Y GUÍA TÉCNICA */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative text-slate-800 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-xl font-bold p-2"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl border border-orange-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">APIs Integradas & Configuración Supabase</h3>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                <h4 className="font-bold text-amber-900 mb-1">1. 📻 SomaFM API (Sin Anuncios)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conectado al endpoint de SomaFM (<code className="bg-orange-100 px-1 rounded font-mono text-orange-900">api.somafm.com/channels.json</code>) con señales curadas para cafeterías: <em>Groove Salad, Illinois Street Lounge, Bossa Beyond y Lush</em>.
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                <h4 className="font-bold text-amber-900 mb-1">2. 🌐 Radio Browser API (Open Data)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Búsqueda abierta entre más de 90.000 estaciones de radio en JSON REST con filtrado por etiquetas (<code className="bg-orange-100 px-1 rounded font-mono text-orange-900">bytag/cafe</code>, <code className="bg-orange-100 px-1 rounded font-mono text-orange-900">jazz</code>, <code className="bg-orange-100 px-1 rounded font-mono text-orange-900">bossa-nova</code>).
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                <h4 className="font-bold text-amber-900 mb-1">3. ☁️ Supabase Storage (Bucket `Radio`)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conectado a tu bucket de almacenamiento <code className="bg-orange-100 text-orange-900 px-1.5 py-0.5 rounded font-bold">Radio</code> (<code className="font-mono text-[11px]">gmothqjjqvbxshvvlbrq</code>). Los MP3 subidos se transmiten mediante HTTP Range Requests (HTTP 206 Streaming) directo al navegador.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-700 to-orange-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-amber-800 hover:to-orange-700 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
