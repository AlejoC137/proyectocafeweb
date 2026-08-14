import React from 'react';
import { Cloud, Globe, Youtube, Loader2, ArrowUp, ArrowDown, Trash2, Search, Play, Heart, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { YOUTUBE_CATEGORIES } from '../../utils/youtubeHelpers';
import AlejoSpotifySearch from './AlejoSpotifySearch';


export default function SourceTabs({
  activeTab,
  handleTabChange,
  supabasePlaylist = [],
  loadingSupabase = false,
  currentTrackIndex,
  setCurrentTrackIndex,
  setIsPlaying,
  broadcastPlay,
  isApplyingRemoteChange,
  moveSongOrder,
  handleDeleteSong,
  toggleFavorite,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  apiStations = [],
  loadingApi = false,
  // Props de YouTube
  youtubePlaylist = [],
  filteredYoutubePlaylist = [],
  selectedYoutubeCategory = 'Todos',
  setSelectedYoutubeCategory,
  youtubeSearchQuery = '',
  setYoutubeSearchQuery,
  loadingYoutube = false,
  toggleYoutubeFavorite,
  handleDeleteYoutubeLink,
  continueYoutubeAutoplay = true,
  setContinueYoutubeAutoplay
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* TABS de fuente */}
      <div className="flex flex-wrap md:flex-nowrap border-[3px] border-black dark:border-slate-700 bg-white dark:bg-[#161722] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] rounded-none mb-4 w-full transition-colors">
        {[{id:'supabase',icon:<Cloud className="w-5 h-5"/>,label:'Files'},
          {id:'live',icon:<Globe className="w-5 h-5"/>,label:'Radio'},
          {id:'youtube',icon:<Youtube className="w-5 h-5 text-red-600"/>,label:'YouTube'},
        ].map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-2 p-3 font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-colors border-r-[3px] last:border-r-0 border-black dark:border-slate-700 rounded-none ${
              activeTab === tab.id
                ? 'bg-black text-white dark:bg-yellow-400 dark:text-black font-black'
                : 'bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-slate-300 hover:bg-black/10 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline" style={{ fontFamily: "'First Bunny', sans-serif", fontSize: '14px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENIDO DEL TAB */}
      <div className="border-[3px] border-black dark:border-slate-700 bg-white dark:bg-[#161722] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] rounded-none transition-colors">
        {/* TAB: SUPABASE (Buscador Tipo Spotify Confinado a Este Espacio) */}
        {activeTab === 'supabase' && (
          <AlejoSpotifySearch
            supabasePlaylist={supabasePlaylist}
            loadingSupabase={loadingSupabase}
            currentTrackIndex={currentTrackIndex}
            setCurrentTrackIndex={setCurrentTrackIndex}
            setIsPlaying={setIsPlaying}
            broadcastPlay={broadcastPlay}
            isApplyingRemoteChange={isApplyingRemoteChange}
            moveSongOrder={moveSongOrder}
            handleDeleteSong={handleDeleteSong}
            toggleFavorite={toggleFavorite}
            navigate={navigate}
            activeTab={activeTab}
          />
        )}

        {/* TAB: RADIO */}
        {activeTab === 'live' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 border-b-[3px] border-black dark:border-slate-700 bg-white dark:bg-[#1e1f2e] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.15)_4px,rgba(31,41,55,0.15)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)] px-3 py-2">
              <h3 className="text-xl lg:text-2xl font-black flex items-center gap-2 uppercase tracking-widest text-black dark:text-white mt-1 whitespace-nowrap truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                <Globe className="w-6 h-6 -mt-1 flex-shrink-0 text-cyan-400" />
                <span className="truncate">Radio</span>
              </h3>
              {loadingApi && <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" />}
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {['lofi', 'jazz', 'rock', 'salsa', 'chillout', 'classical'].map(tag => (
                <button key={tag} onClick={() => { setSelectedCategory(tag); setSearchQuery(''); }}
                  className={`px-3 py-1.5 border-[2px] border-black dark:border-slate-600 text-[10px] font-black uppercase tracking-widest transition shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                    selectedCategory === tag && !searchQuery ? 'bg-black text-white dark:bg-yellow-400 dark:text-black dark:border-yellow-400' : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-yellow-100 dark:hover:bg-slate-800'
                  }`}
                >{tag}</button>
              ))}
            </div>
            <form onSubmit={handleSearchSubmit} className="relative mb-3 flex gap-2">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar emisora en vivo..."
                className="w-full pl-10 pr-4 py-2 border-[2.5px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-xs font-bold uppercase placeholder-black/50 dark:placeholder-white/40 outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-black dark:text-slate-400" />
              <button type="submit" className="px-4 py-2 border-[2.5px] border-black dark:border-slate-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black dark:bg-yellow-400 text-white dark:text-black text-xs font-black uppercase rounded-none hover:bg-white dark:hover:bg-white hover:text-black transition">Buscar</button>
            </form>
            <div className="space-y-1.5 overflow-y-auto max-h-64 pr-1">
              {apiStations.map((station, index) => {
                const isCurrent = activeTab === 'live' && currentTrackIndex === index;
                return (
                  <div key={station.id || index} onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) broadcastPlay(station, 'live', true); }}
                    className={`p-2 border-[2.5px] border-black dark:border-slate-700 flex items-center justify-between cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] rounded-none ${
                      isCurrent 
                        ? 'bg-black text-white border-cyan-400 dark:bg-[#08080c] dark:border-yellow-400' 
                        : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-slate-800 group'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 truncate">
                      <span className={`text-[10px] font-black w-5 text-center flex-shrink-0 ${isCurrent ? 'text-cyan-400 dark:text-yellow-400' : 'text-black/70 dark:text-slate-400'}`}>
                        {index + 1}
                      </span>
                      <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-black relative group/img">
                        <img 
                          src={station.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'} 
                          alt={station.title} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400';
                          }}
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200" 
                        />
                        <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'bg-black/60' : 'bg-black/40 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <Play className="w-4 h-4 text-cyan-400 fill-current" />
                        </div>
                      </div>
                      <div className="truncate flex-1">
                        <p className={`text-xs font-black truncate uppercase tracking-wider ${isCurrent ? 'text-cyan-400 dark:text-yellow-400' : 'text-black dark:text-white'}`}>
                          {station.title}
                        </p>
                        <p className="text-[10px] font-bold uppercase opacity-80 truncate text-black/70 dark:text-slate-300">
                          📻 {station.artist || 'Emisora En Vivo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (toggleFavorite) toggleFavorite(station);
                        }}
                        className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white transition hover:bg-red-50 hover:scale-105 rounded-none"
                        title="Añadir a Files"
                      >
                        <Heart 
                          className={`w-3.5 h-3.5 ${supabasePlaylist.some(s => s.url === station.url || s.id === station.id) ? 'fill-[#FF0000] text-[#FF0000]' : 'text-black dark:text-white'}`} 
                        />
                      </button>
                      {isCurrent ? (
                        <span className="text-[9px] font-black px-2 py-1 bg-[#FF0000] border-[1.5px] border-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">LIVE</span>
                      ) : (
                        <div className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white group-hover:bg-black group-hover:text-white dark:group-hover:bg-yellow-400 dark:group-hover:text-black transition rounded-none">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: YOUTUBE */}
        {activeTab === 'youtube' && (
          <div className="p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2 border-b-[3px] border-black dark:border-slate-700 bg-white dark:bg-[#1e1f2e] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.15)_4px,rgba(31,41,55,0.15)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)] px-3 py-2">
              <h3 className="text-xl lg:text-2xl font-black flex items-center gap-2 uppercase tracking-widest text-black dark:text-white mt-1 whitespace-nowrap truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                <Youtube className="w-7 h-7 text-red-600 -mt-1 flex-shrink-0 fill-current" />
                <span className="truncate">YouTube Videos ({filteredYoutubePlaylist?.length || 0})</span>
              </h3>
              
              <div className="flex items-center gap-2.5 ml-auto sm:ml-0 flex-shrink-0">
                <button onClick={() => navigate('/RadioManager')}
                  className="px-3 py-1.5 text-xs font-black uppercase tracking-widest transition border-[2.5px] border-black dark:border-red-600 bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black rounded-none flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Administrar
                </button>
              </div>
            </div>

            {/* Filtros de Categorías Dinámicos */}
            <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-1">
              {(['Todos', ...Array.from(new Set([
                ...YOUTUBE_CATEGORIES.filter(c => c !== 'Todos'),
                ...(youtubePlaylist || []).map(t => t.category).filter(Boolean)
              ]))]).map(cat => (
                <button key={cat} onClick={() => setSelectedYoutubeCategory(cat)}
                  className={`px-3 py-1.5 border-[3px] border-black dark:border-slate-600 text-[10px] font-black uppercase tracking-widest transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                    selectedYoutubeCategory === cat ? 'bg-red-600 text-white' : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-yellow-100 dark:hover:bg-slate-800'
                  }`}
                >{cat}</button>
              ))}
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <input type="text" value={youtubeSearchQuery} onChange={e => setYoutubeSearchQuery(e.target.value)}
                placeholder="Filtrar por título o artista..."
                className="w-full pl-10 pr-4 py-2.5 border-[3px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-xs font-bold uppercase placeholder-black/50 dark:placeholder-white/40 outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-black dark:text-slate-400" />
            </div>

            {/* Lista de Videos */}
            {loadingYoutube ? (
              <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-black dark:text-white">Cargando videos de YouTube...</div>
            ) : !filteredYoutubePlaylist || filteredYoutubePlaylist.length === 0 ? (
              <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-black dark:text-white">
                <Youtube className="w-10 h-10 mx-auto mb-3 text-red-500 opacity-70" />
                <p>No se encontraron videos en esta categoría.</p>
                <button onClick={() => navigate('/RadioManager')} className="mt-4 px-6 py-3 text-sm font-black uppercase border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-red-600 text-white hover:bg-black transition-colors rounded-none"
                >+ Agregar Enlaces de YouTube</button>
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-64 pr-1">
                {filteredYoutubePlaylist.map((track, index) => {
                  const isCurrent = activeTab === 'youtube' && currentTrackIndex === index;
                  return (
                    <div key={track.id || index}
                      className={`p-2 border-[2.5px] border-black dark:border-slate-700 flex items-center justify-between group cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] rounded-none ${
                        isCurrent 
                          ? 'bg-black text-white border-red-600 dark:bg-[#08080c] dark:border-red-600' 
                          : 'bg-white dark:bg-[#1e1f2e] text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) broadcastPlay(track, 'youtube', true); }}
                        className="flex items-center gap-2.5 flex-1 truncate"
                      >
                        <span className={`text-[10px] font-black w-5 text-center flex-shrink-0 ${isCurrent ? 'text-red-500' : 'text-black/70 dark:text-slate-400'}`}>
                          {index + 1}
                        </span>
                        <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-black relative group/img">
                          <img 
                            src={track.cover || (track.youtubeId ? `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400')} 
                            alt={track.title} 
                            onError={(e) => {
                              if (track.youtubeId) {
                                e.currentTarget.src = `https://img.youtube.com/vi/${track.youtubeId}/0.jpg`;
                              } else {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400';
                              }
                            }}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200" 
                          />
                          <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'bg-black/60' : 'bg-black/40 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            <Play className="w-4 h-4 text-red-500 fill-current" />
                          </div>
                        </div>
                        <div className="truncate flex-1">
                          <p className={`text-xs font-black truncate uppercase tracking-wider ${isCurrent ? 'text-red-500' : 'text-black dark:text-white'}`}>
                            {track.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-80 truncate text-black/70 dark:text-slate-300">
                            <span>{track.artist || 'YouTube Video'}</span>
                            {track.category && <span className="bg-yellow-300 text-black px-1 border border-black flex-shrink-0">{track.category}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toggleYoutubeFavorite) toggleYoutubeFavorite(track.id);
                          }}
                          className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white transition hover:bg-red-50 hover:scale-105 rounded-none"
                          title="Marcar como favorito"
                        >
                          <Heart 
                            className={`w-3.5 h-3.5 ${track.is_favorite ? 'fill-[#FF0000] text-[#FF0000]' : 'text-black dark:text-white'}`} 
                          />
                        </button>
                        {isCurrent ? (
                          <span className="text-[9px] font-black px-2 py-1 bg-red-600 border-[1.5px] border-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">SONANDO</span>
                        ) : (
                          <div className="p-1.5 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#12131C] text-black dark:text-white group-hover:bg-black group-hover:text-white dark:group-hover:bg-red-600 dark:group-hover:text-white transition rounded-none">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

