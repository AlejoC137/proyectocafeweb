import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Cloud, 
  Play, 
  Music, 
  Heart, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  X, 
  Plus, 
  Filter, 
  ListMusic, 
  Disc, 
  Sparkles,
  Volume2,
  Mic,
  User,
  Edit2
} from 'lucide-react';
import AlbumEditModal from './AlbumEditModal';
import CreateAlbumModal from './CreateAlbumModal';

// Categorías de género predefinidas con colores estilo Spotify / Neo-brutalismo
const GENRES_LIST = [
  { id: 'all', label: 'Todos los Géneros', color: 'bg-black text-white' },
  { id: 'rock', label: 'Rock', color: 'bg-red-500 text-white' },
  { id: 'lofi', label: 'Lo-Fi / Chill', color: 'bg-indigo-600 text-white' },
  { id: 'jazz', label: 'Jazz & Blues', color: 'bg-amber-600 text-white' },
  { id: 'pop', label: 'Pop', color: 'bg-pink-500 text-white' },
  { id: 'salsa', label: 'Latino & Salsa', color: 'bg-orange-500 text-white' },
  { id: 'electro', label: 'Electrónica', color: 'bg-cyan-600 text-white' },
  { id: 'acustico', label: 'Acústico', color: 'bg-emerald-600 text-white' },
  { id: 'indie', label: 'Indie & Alt', color: 'bg-purple-600 text-white' },
  { id: 'metal', label: 'Metal & Hard', color: 'bg-neutral-800 text-white' },
];

export default function AlejoSpotifySearch({
  supabasePlaylist = [],
  filteredSupabasePlaylist,
  supabaseSearchQuery = '',
  setSupabaseSearchQuery,
  selectedGenre = 'all',
  setSelectedGenre,
  selectedArtist = 'all',
  setSelectedArtist,
  selectedAlbum = 'all',
  setSelectedAlbum,
  activeView = 'all',
  setActiveView,
  loadingSupabase = false,
  currentTrackIndex,
  setCurrentTrackIndex,
  setIsPlaying,
  broadcastPlay,
  isApplyingRemoteChange,
  moveSongOrder,
  handleDeleteSong,
  updateAlbumData,
  toggleFavorite,
  navigate,
  activeTab
}) {
  const searchQuery = supabaseSearchQuery;
  const setSearchQuery = setSupabaseSearchQuery;

  const [showGenreGrid, setShowGenreGrid] = useState(false);
  const [showArtistGrid, setShowArtistGrid] = useState(false);
  const [showAlbumGrid, setShowAlbumGrid] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);

  // Helper para inferir género si no está especificado en los metadatos
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

  // Extraer lista única de artistas ordenados con contador de canciones
  const artistList = useMemo(() => {
    const map = {};
    supabasePlaylist.forEach(song => {
      const artistName = (song.artist || 'Artista Desconocido').trim();
      if (artistName) {
        map[artistName] = (map[artistName] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [supabasePlaylist]);

  // Extraer lista única de álbumes ordenados con contador de canciones
  const albumList = useMemo(() => {
    const map = {};
    supabasePlaylist.forEach(song => {
      const albumName = (song.album || 'Sencillo').trim();
      if (albumName) {
        if (!map[albumName]) {
          map[albumName] = {
            name: albumName,
            artist: song.artist || 'Varios',
            genre: song.genre || 'Lofi / Chill',
            mood: song.mood || 'Chill & Relax',
            cover: song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400',
            count: 0,
            songCount: 0
          };
        }
        map[albumName].count += 1;
        map[albumName].songCount += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [supabasePlaylist]);

  // Extraer lista única de géneros reales desde las canciones de Supabase
  const genreList = useMemo(() => {
    const map = {};
    supabasePlaylist.forEach(song => {
      const g = (song.genre || song.category || '').trim();
      if (g) {
        const parts = g.split(/[,/]/).map(p => p.trim()).filter(Boolean);
        parts.forEach(part => {
          const formattedName = part.charAt(0).toUpperCase() + part.slice(1);
          map[formattedName] = (map[formattedName] || 0) + 1;
        });
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [supabasePlaylist]);

  // Lista de canciones filtradas recibida o calculada
  const filteredTracks = filteredSupabasePlaylist || supabasePlaylist;

  const handlePlayTrack = (index, track) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
      broadcastPlay(track, 'supabase', true);
    }
  };

  const clearAllFilters = () => {
    if (setSearchQuery) setSearchQuery('');
    if (setSelectedGenre) setSelectedGenre('all');
    if (setSelectedArtist) setSelectedArtist('all');
    if (setSelectedAlbum) setSelectedAlbum('all');
    if (setActiveView) setActiveView('all');
    setShowGenreGrid(false);
    setShowArtistGrid(false);
    setShowAlbumGrid(false);
  };

  return (
    <div className="p-3 bg-white dark:bg-[#161722] text-black dark:text-white font-sans select-none transition-colors">
      {/* 1. CABECERA SPOTIFY STYLE (Confina al espacio verde) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 border-b-[3px] border-black dark:border-slate-700 bg-white dark:bg-[#1e1f2e] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.1)_4px,rgba(31,41,55,0.1)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)] p-2">
        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 bg-[#1DB954] border-[2px] border-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
            <Search className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="truncate">
            <h3 className="text-xl lg:text-2xl font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2" style={{ fontFamily: "'First Bunny', sans-serif" }}>
              <span>FILES</span>
              <span className="text-[10px] bg-black text-[#1DB954] px-2 py-0.5 border border-black font-mono font-bold tracking-normal rounded-none">
                {supabasePlaylist.length} TRACKS
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          <button 
            onClick={() => setShowCreateAlbumModal(true)}
            className="px-3 py-1 text-[11px] font-black uppercase tracking-widest transition border-[2px] border-black bg-[#1DB954] text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 rounded-none"
            title="Crear Álbum desde archivos MP3 leyendo metadatos automáticamente"
          >
            <Plus className="w-3.5 h-3.5" /> Crear Álbum
          </button>
          <button 
            onClick={() => navigate('/RadioManager')}
            className="px-3 py-1 text-[11px] font-black uppercase tracking-widest transition border-[2px] border-black dark:border-yellow-400 bg-yellow-300 dark:bg-yellow-400 text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 rounded-none"
          >
            <Plus className="w-3.5 h-3.5" /> Administrar
          </button>
        </div>
      </div>

      {/* 2. BUSCADOR PRINCIPAL (Canción, Artista, Género) */}
      <div className="relative mb-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-black/70 dark:text-white/60 pointer-events-none stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por canción, artista, género o álbum..."
            className="w-full pl-10 pr-10 py-2 border-[3px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-xs font-black uppercase placeholder-black/50 dark:placeholder-white/40 outline-none rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] focus:bg-white dark:focus:bg-[#12131C] focus:border-[#1DB954] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-black dark:border-white transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. BARRA DE HERRAMIENTAS: UNIFICADA EN UNA SOLA BARRA CERO DESBORDE */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-1.5 w-full">
          {/* BARRA UNIFICADA */}
          <div className="flex flex-1 flex-nowrap border-[3px] border-black dark:border-slate-600 bg-white dark:bg-[#0d0e15] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.08)] rounded-none overflow-hidden">
            {/* Todas */}
            <button
              onClick={() => { clearAllFilters(); }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition border-r-[2px] border-black dark:border-slate-600 rounded-none leading-none min-w-0 ${
                activeView === 'all' && selectedGenre === 'all' && selectedArtist === 'all' && !searchQuery
                  ? 'bg-black text-[#1DB954] dark:bg-yellow-400 dark:text-black font-extrabold'
                  : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-yellow-100 dark:hover:bg-slate-800'
              }`}
            >
              <ListMusic className="w-4 h-4 mb-1 flex-shrink-0" />
              <span className="truncate w-full text-center px-0.5">Todas ({supabasePlaylist.length})</span>
            </button>

            {/* Favoritos */}
            <button
              onClick={() => { setActiveView('favorites'); setSelectedGenre('all'); setSelectedArtist('all'); }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition border-r-[2px] border-black dark:border-slate-600 rounded-none leading-none min-w-0 ${
                activeView === 'favorites'
                  ? 'bg-[#FF0000] text-white font-extrabold'
                  : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950'
              }`}
            >
              <Heart className="w-4 h-4 mb-1 fill-current flex-shrink-0" />
              <span className="truncate w-full text-center px-0.5">Favoritos ({supabasePlaylist.filter(s => s.is_favorite).length})</span>
            </button>

            {/* Géneros */}
            <button
              onClick={() => {
                setShowGenreGrid(!showGenreGrid);
                setShowArtistGrid(false);
                setShowAlbumGrid(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition border-r-[2px] border-black dark:border-slate-600 rounded-none leading-none min-w-0 ${
                showGenreGrid || selectedGenre !== 'all'
                  ? 'bg-[#1DB954] text-black font-extrabold'
                  : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-green-100 dark:hover:bg-emerald-950'
              }`}
            >
              <Filter className="w-4 h-4 mb-1 flex-shrink-0" />
              <span className="truncate w-full text-center px-0.5">Género {selectedGenre !== 'all' ? `(${selectedGenre})` : ''}</span>
            </button>

            {/* Artistas */}
            <button
              onClick={() => {
                setShowArtistGrid(!showArtistGrid);
                setShowGenreGrid(false);
                setShowAlbumGrid(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition border-r-[2px] border-black dark:border-slate-600 rounded-none leading-none min-w-0 ${
                showArtistGrid || selectedArtist !== 'all'
                  ? 'bg-purple-600 text-white font-extrabold'
                  : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950'
              }`}
            >
              <User className="w-4 h-4 mb-1 flex-shrink-0" />
              <span className="truncate w-full text-center px-0.5">Artistas {selectedArtist !== 'all' ? `(${selectedArtist})` : `(${artistList.length})`}</span>
            </button>

            {/* Álbumes */}
            <button
              onClick={() => {
                setShowAlbumGrid(!showAlbumGrid);
                setShowGenreGrid(false);
                setShowArtistGrid(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition rounded-none leading-none min-w-0 ${
                showAlbumGrid || selectedAlbum !== 'all'
                  ? 'bg-amber-500 text-black font-extrabold'
                  : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950'
              }`}
            >
              <Disc className="w-4 h-4 mb-1 flex-shrink-0" />
              <span className="truncate w-full text-center px-0.5">Álbumes {selectedAlbum !== 'all' ? `(${selectedAlbum})` : `(${albumList.length})`}</span>
            </button>
          </div>

          {(searchQuery || selectedGenre !== 'all' || selectedArtist !== 'all' || selectedAlbum !== 'all' || activeView !== 'all') && (
            <button
              onClick={clearAllFilters}
              className="px-2 py-2 text-[9px] font-black uppercase border-[2.5px] border-black dark:border-red-500 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-600 hover:text-white transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none flex-shrink-0"
              title="Limpiar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Explorador Desplegable de Géneros */}
        {(showGenreGrid || selectedGenre !== 'all') && !showArtistGrid && !showAlbumGrid && (
          <div className="flex gap-1.5 flex-wrap p-2 border-[2px] border-black dark:border-slate-700 bg-emerald-50 dark:bg-[#091f14] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-h-36 overflow-y-auto animate-in fade-in duration-150">
            <button
              onClick={() => { setSelectedGenre('all'); }}
              className={`px-2 py-1 text-[9px] font-black uppercase border-[2px] border-black dark:border-slate-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                selectedGenre === 'all' ? 'bg-black text-white' : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-emerald-200'
              }`}
            >
              Todos los Géneros ({genreList.length})
            </button>
            {genreList.map((genreObj) => {
              const isSelected = selectedGenre.toLowerCase() === genreObj.name.toLowerCase();
              return (
                <button
                  key={genreObj.name}
                  onClick={() => {
                    setSelectedGenre(genreObj.name);
                    setSelectedArtist('all');
                    setSelectedAlbum('all');
                    setActiveView('all');
                  }}
                  className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border-[2px] border-black dark:border-slate-600 transition shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 rounded-none ${
                    isSelected
                      ? 'bg-[#1DB954] text-black font-extrabold scale-105 z-10'
                      : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900'
                  }`}
                >
                  <Filter className="w-3 h-3 text-[#1DB954]" />
                  <span className="truncate max-w-[120px]">{genreObj.name}</span>
                  <span className={`px-1 text-[8px] font-mono border border-black ${isSelected ? 'bg-black text-white' : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'}`}>
                    {genreObj.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Explorador Desplegable de Artistas */}
        {(showArtistGrid || selectedArtist !== 'all') && !showGenreGrid && !showAlbumGrid && (
          <div className="flex gap-1.5 flex-wrap p-2 border-[2px] border-black dark:border-slate-700 bg-purple-50 dark:bg-[#150e24] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-h-36 overflow-y-auto animate-in fade-in duration-150">
            <button
              onClick={() => { setSelectedArtist('all'); }}
              className={`px-2 py-1 text-[9px] font-black uppercase border-[2px] border-black dark:border-slate-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                selectedArtist === 'all' ? 'bg-black text-white' : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-purple-200'
              }`}
            >
              Todos los Artistas ({artistList.length})
            </button>
            {artistList.map((artistObj) => {
              const isSelected = selectedArtist.toLowerCase() === artistObj.name.toLowerCase();
              return (
                <button
                  key={artistObj.name}
                  onClick={() => {
                    setSelectedArtist(artistObj.name);
                    setSelectedGenre('all');
                    setSelectedAlbum('all');
                    setActiveView('all');
                  }}
                  className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border-[2px] border-black dark:border-slate-600 transition shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 rounded-none ${
                    isSelected
                      ? 'bg-purple-900 text-yellow-300 scale-105 z-10'
                      : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-purple-200 dark:hover:bg-purple-900'
                  }`}
                >
                  <Mic className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span className="truncate max-w-[120px]">{artistObj.name}</span>
                  <span className={`px-1 text-[8px] font-mono border border-black ${isSelected ? 'bg-yellow-300 text-black' : 'bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200'}`}>
                    {artistObj.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Explorador Desplegable de Álbumes */}
        {(showAlbumGrid || selectedAlbum !== 'all') && !showGenreGrid && !showArtistGrid && (
          <div className="flex gap-1.5 flex-wrap p-2 border-[2px] border-black dark:border-slate-700 bg-amber-50 dark:bg-[#20180a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-h-40 overflow-y-auto animate-in fade-in duration-150">
            <button
              onClick={() => { setSelectedAlbum('all'); }}
              className={`px-2 py-1 text-[9px] font-black uppercase border-[2px] border-black dark:border-slate-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                selectedAlbum === 'all' ? 'bg-black text-white' : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-amber-200'
              }`}
            >
              Todos los Álbumes ({albumList.length})
            </button>
            {albumList.map((albumObj) => {
              const isSelected = selectedAlbum.toLowerCase() === albumObj.name.toLowerCase();
              return (
                <div
                  key={albumObj.name}
                  className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border-[2px] border-black dark:border-slate-600 transition shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 rounded-none ${
                    isSelected
                      ? 'bg-amber-900 text-yellow-300 scale-105 z-10'
                      : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-amber-200 dark:hover:bg-amber-900'
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedAlbum(albumObj.name);
                      setSelectedGenre('all');
                      setSelectedArtist('all');
                      setActiveView('all');
                    }}
                    className="flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    <img 
                      src={albumObj.cover} 
                      alt={albumObj.name} 
                      className="w-4 h-4 object-cover border border-black flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="truncate max-w-[110px] font-extrabold">{albumObj.name}</span>
                    <span className={`px-1 text-[8px] font-mono border border-black ${isSelected ? 'bg-yellow-300 text-black' : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'}`}>
                      {albumObj.count}
                    </span>
                  </div>
                  {updateAlbumData && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAlbum(albumObj);
                      }}
                      className="p-1 hover:bg-yellow-400 hover:text-black border border-black transition bg-black/10 rounded-none ml-0.5"
                      title="Editar Género, Mood y Detalles del Álbum"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. LISTA DE CANCIONES RESULTANTES (Confinado a este espacio) */}
      <div className="space-y-1.5 overflow-y-auto max-h-64 pr-1 scrollbar-thin scrollbar-thumb-black">
        {loadingSupabase ? (
          <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-black dark:text-white flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-black border-t-[#1DB954] rounded-full animate-spin"></div>
            <span>Buscando en catálogo Alejo...</span>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-black dark:text-white border-[2px] border-dashed border-black/40 dark:border-white/40 p-4 bg-cream-bg dark:bg-[#0d0e15]">
            <Disc className="w-8 h-8 mx-auto mb-2 text-black/50 dark:text-white/50 animate-pulse" />
            <p className="font-extrabold text-sm mb-1">No se encontraron canciones</p>
            <p className="text-[10px] text-black/70 dark:text-slate-300 mb-3">
              {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay tracks con los filtros seleccionados.'}
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-[10px] font-black uppercase border-[2px] border-black dark:border-yellow-400 bg-yellow-300 dark:bg-yellow-400 text-black hover:bg-black hover:text-white transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Mostrar todas las canciones
            </button>
          </div>
        ) : (
          filteredTracks.map((song, index) => {
            const realIndex = supabasePlaylist.findIndex(s => (s.id && s.id === song.id) || (s.url === song.url));
            const isCurrent = activeTab === 'supabase' && currentTrackIndex === index;

            return (
              <div
                key={song.id || index}
                className={`p-2 border-[2.5px] border-black dark:border-slate-700 flex items-center justify-between group transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] rounded-none ${
                  isCurrent 
                    ? 'bg-black text-white border-[#1DB954] dark:bg-[#08080c] dark:border-[#1DB954]' 
                    : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-slate-800'
                }`}
              >
                {/* Info de la Canción & Play */}
                <div
                  onClick={() => handlePlayTrack(index, song)}
                  className="flex items-center gap-2.5 flex-1 truncate cursor-pointer"
                >
                  <span className={`text-[10px] font-black w-5 text-center flex-shrink-0 ${isCurrent ? 'text-[#1DB954]' : 'text-black/70 dark:text-slate-400'}`}>
                    {isCurrent ? <Volume2 className="w-4 h-4 animate-bounce text-[#1DB954] mx-auto" /> : index}
                  </span>

                  <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-black relative group/img">
                    <img
                      src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'}
                      alt={song.title || 'Track Cover'}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400';
                      }}
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200"
                    />
                    <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'bg-black/60' : 'bg-black/40 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <Play className="w-4 h-4 text-[#1DB954] fill-current" />
                    </div>
                  </div>

                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <p className={`text-xs font-black truncate uppercase tracking-wider ${isCurrent ? 'text-[#1DB954]' : 'text-black dark:text-white'}`}>
                        {song.title}
                      </p>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 bg-[#1DB954] text-black text-[8px] font-extrabold uppercase border border-black flex-shrink-0">
                          SONANDO
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-80 truncate">
                      <span className={`truncate cursor-pointer hover:underline ${selectedArtist.toLowerCase() === (song.artist || '').toLowerCase() ? 'text-purple-600 dark:text-purple-400 font-extrabold' : 'text-black/80 dark:text-slate-300'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (song.artist) setSelectedArtist(song.artist);
                        }}
                      >
                        🎤 {song.artist || 'Artista Desconocido'}
                      </span>
                      {song.genre && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGenre(song.genre.toLowerCase());
                          }}
                          className={`px-1 text-[8px] font-mono uppercase border border-black flex-shrink-0 cursor-pointer hover:opacity-80 ${isCurrent ? 'bg-white text-black' : 'bg-black text-white dark:bg-yellow-400 dark:text-black'}`}
                        >
                          {song.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción (Favorito, Orden, Eliminar) */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toggleFavorite) toggleFavorite(song);
                    }}
                    className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white transition hover:bg-red-50 hover:scale-105 rounded-none"
                    title={song.is_favorite ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${song.is_favorite ? 'fill-red-600 text-red-600' : 'text-black dark:text-white'}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (moveSongOrder) moveSongOrder(realIndex !== -1 ? realIndex : index, 'up');
                    }}
                    disabled={realIndex === 0}
                    className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white disabled:opacity-30 hover:bg-black hover:text-white dark:hover:bg-slate-700 transition rounded-none"
                    title="Subir orden"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (moveSongOrder) moveSongOrder(realIndex !== -1 ? realIndex : index, 'down');
                    }}
                    disabled={realIndex === supabasePlaylist.length - 1}
                    className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white disabled:opacity-30 hover:bg-black hover:text-white dark:hover:bg-slate-700 transition rounded-none"
                    title="Bajar orden"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (handleDeleteSong) handleDeleteSong(song.id, song.url);
                    }}
                    className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white hover:bg-red-600 hover:text-white transition rounded-none"
                    title="Eliminar canción"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. RESUMEN / FOOTER DE ESTADO */}
      <div className="mt-2 pt-2 border-t border-black/20 dark:border-white/20 flex items-center justify-between text-[10px] font-mono text-black/70 dark:text-slate-400">
        <span>Resultados: {filteredTracks.length} de {supabasePlaylist.length} tracks</span>
        <div className="flex items-center gap-1">
          {selectedGenre !== 'all' && (
            <span className="font-bold text-black bg-yellow-200 dark:bg-yellow-400 px-1 border border-black">
              GÉNERO: {selectedGenre.toUpperCase()}
            </span>
          )}
          {selectedArtist !== 'all' && (
            <span className="font-bold text-white bg-purple-700 px-1 border border-black">
              ARTISTA: {selectedArtist.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      {/* Modal de Edición de Álbum */}
      <AlbumEditModal
        isOpen={Boolean(editingAlbum)}
        onClose={() => setEditingAlbum(null)}
        albumData={editingAlbum}
        onSave={updateAlbumData}
      />
      {/* Modal de Creación de Álbum desde MP3 */}
      <CreateAlbumModal
        isOpen={showCreateAlbumModal}
        onClose={() => setShowCreateAlbumModal(false)}
      />
    </div>
  );
}
