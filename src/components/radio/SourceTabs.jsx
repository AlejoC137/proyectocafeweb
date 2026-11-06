import React from 'react';
import { Cloud, Globe, Youtube, Loader2, Search, Play, Heart, Plus, Shuffle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { YOUTUBE_CATEGORIES } from '../../utils/youtubeHelpers';
import RadioStationSelector from './RadioStationSelector';

export default function SourceTabs({
  activeTab,
  handleTabChange,
  isConsoleLocked = false,
  currentPlay = null,
  supabasePlaylist = [],
  currentTrackIndex,
  setCurrentTrackIndex,
  setIsPlaying,
  broadcastPlay,
  isApplyingRemoteChange,
  toggleFavorite,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  apiStations = [],
  loadingApi = false,
  isShuffle,
  setIsShuffle,
  queueWindow,
  jumpToTrack,
  // Props de YouTube
  youtubePlaylist = [],
  filteredYoutubePlaylist = [],
  selectedYoutubeCategory = 'Todos',
  setSelectedYoutubeCategory,
  youtubeSearchQuery = '',
  setYoutubeSearchQuery,
  loadingYoutube = false,
  toggleYoutubeFavorite
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      {/* TABS DE FUENTE COMPACTOS HORIZONTALES ESTILO SPOTIFY PILLS */}
      <div className="flex flex-col border-[2.5px] border-black dark:border-slate-700 bg-white dark:bg-[#161722] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)] rounded-none w-full transition-colors overflow-hidden">
        {isConsoleLocked && (
          <div className="w-full bg-red-600 text-white px-2.5 py-1 text-center font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 border-b-[2px] border-black">
            <Lock className="w-3 h-3 stroke-[3]" />
            <span>Consola Bloqueada por Radio Manager</span>
          </div>
        )}
        <div className="flex w-full">
          {[
            { id: 'supabase', icon: <Cloud className="w-3.5 h-3.5" />, label: 'Files / Álbumes' },
            { id: 'live', icon: <Globe className="w-3.5 h-3.5" />, label: 'Radios' },
            { id: 'youtube', icon: <Youtube className="w-3.5 h-3.5 text-red-500" />, label: 'YouTube' },
          ].map(tab => {
            const isCurrent = activeTab === tab.id;
            const isLockedOut = isConsoleLocked && !isCurrent;
            return (
              <button 
                key={tab.id} 
                onClick={() => {
                  if (isConsoleLocked && !isCurrent) return;
                  handleTabChange(tab.id);
                }}
                disabled={isLockedOut}
                title={isLockedOut ? "Consola bloqueada por Cabina Central" : `Modo ${tab.label}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 font-black uppercase tracking-wider text-[11px] transition-all border-r-[2px] last:border-r-0 border-black dark:border-slate-700 rounded-none relative ${
                  isCurrent
                    ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black font-black'
                    : isLockedOut
                    ? 'bg-gray-200 dark:bg-slate-900 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
                    : 'bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-slate-300 hover:bg-black/10 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {isLockedOut && <Lock className="w-2.5 h-2.5 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DEL TAB */}
      <div className="border-[2.5px] border-black dark:border-slate-700 bg-white dark:bg-[#161722] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)] rounded-none transition-colors">
        {/* TAB: RADIO STATION (Selector interactivo de la emisora) */}
        {activeTab === 'supabase' && (
          <RadioStationSelector
            supabasePlaylist={supabasePlaylist}
            currentPlay={currentPlay}
            setIsPlaying={setIsPlaying}
            broadcastPlay={broadcastPlay}
            isApplyingRemoteChange={isApplyingRemoteChange}
            queueWindow={queueWindow}
            jumpToTrack={jumpToTrack}
            isShuffle={isShuffle}
            setIsShuffle={setIsShuffle}
          />
        )}

        {/* TAB: RADIOS ONLINE */}
        {activeTab === 'live' && (
          <div className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex gap-1 flex-wrap">
                {['lofi', 'jazz', 'rock', 'salsa', 'chillout', 'classical'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedCategory(tag); setSearchQuery(''); }}
                    className={`px-2 py-1 border border-black dark:border-slate-600 text-[10px] font-black uppercase tracking-wider transition ${
                      selectedCategory === tag && !searchQuery
                        ? 'bg-black text-white dark:bg-[#1DB954] dark:text-black dark:border-[#1DB954]'
                        : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-yellow-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {loadingApi && <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white shrink-0" />}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-2.5 flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar emisora en vivo..."
                  className="w-full pl-8 pr-3 py-1.5 border-[2px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-xs font-bold placeholder-gray-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 border-[2px] border-black dark:border-slate-600 bg-black dark:bg-[#1DB954] text-white dark:text-black text-xs font-black uppercase hover:opacity-90 transition"
              >
                Buscar
              </button>
            </form>

            <div className="divide-y divide-black/10 dark:divide-white/5 border-[2px] border-black dark:border-slate-700 overflow-y-auto max-h-[360px] custom-scrollbar">
              {apiStations.map((station, index) => {
                const isCurrent = activeTab === 'live' && currentTrackIndex === index;
                return (
                  <div
                    key={station.id || index}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      setIsPlaying(true);
                      if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
                        broadcastPlay(station, 'live', true);
                      }
                    }}
                    className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition ${
                      isCurrent
                        ? 'bg-[#1DB954]/15 text-black dark:text-white'
                        : 'bg-white dark:bg-[#181926] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 group'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className={`text-[10px] font-mono font-bold w-4 text-center flex-shrink-0 ${isCurrent ? 'text-[#1DB954]' : 'text-gray-400'}`}>
                        {index + 1}
                      </span>
                      <div className="w-7 h-7 rounded-sm border border-black/20 overflow-hidden flex-shrink-0 bg-black relative">
                        <img
                          src={station.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                          alt={station.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate flex-1">
                        <p className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-red-600 dark:text-[#1DB954] font-black' : 'text-black dark:text-white'}`}>
                          {station.title}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate leading-tight">
                          {station.artist || 'Emisora En Vivo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (toggleFavorite) toggleFavorite(station);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                        title="Añadir a Files"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${supabasePlaylist.some(s => s.url === station.url || s.id === station.id) ? 'fill-[#FF0000] text-[#FF0000]' : ''}`}
                        />
                      </button>
                      {isCurrent && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-600 text-white uppercase">LIVE</span>
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
          <div className="p-2.5 sm:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex gap-1 flex-wrap overflow-x-auto">
                {(['Todos', ...Array.from(new Set([
                  ...YOUTUBE_CATEGORIES.filter(c => c !== 'Todos'),
                  ...(youtubePlaylist || []).map(t => t.category).filter(Boolean)
                ]))]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedYoutubeCategory(cat)}
                    className={`px-2 py-0.5 border border-black dark:border-slate-600 text-[10px] font-black uppercase tracking-wider transition ${
                      selectedYoutubeCategory === cat
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-[#0d0e15] text-black dark:text-slate-200 hover:bg-yellow-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsShuffle && setIsShuffle(!isShuffle)}
                  className={`px-2 py-1 text-[10px] font-black uppercase border border-black dark:border-slate-600 flex items-center gap-1 ${
                    isShuffle ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-[#181926] text-black dark:text-white'
                  }`}
                >
                  <Shuffle className="w-3 h-3" />
                  <span>{isShuffle ? 'Shuffle ON' : 'Shuffle'}</span>
                </button>
                <button
                  onClick={() => navigate('/RadioManager')}
                  className="px-2 py-1 text-[10px] font-black uppercase border border-black bg-red-600 text-white hover:bg-red-500 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Gestionar
                </button>
              </div>
            </div>

            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={youtubeSearchQuery}
                onChange={e => setYoutubeSearchQuery(e.target.value)}
                placeholder="Filtrar videos por título o canal..."
                className="w-full pl-8 pr-3 py-1.5 border-[2px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15] text-black dark:text-white text-xs font-bold placeholder-gray-400 outline-none"
              />
            </div>

            {loadingYoutube ? (
              <div className="py-6 text-center text-xs font-black uppercase text-gray-400">Cargando videos...</div>
            ) : !filteredYoutubePlaylist || filteredYoutubePlaylist.length === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-gray-500">
                <Youtube className="w-7 h-7 mx-auto mb-1.5 text-red-500 opacity-70" />
                <p>No se encontraron videos en esta categoría.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/10 dark:divide-white/5 border-[2px] border-black dark:border-slate-700 overflow-y-auto max-h-[360px] custom-scrollbar">
                {filteredYoutubePlaylist.map((track, index) => {
                  const isCurrent = activeTab === 'youtube' && currentTrackIndex === index;
                  return (
                    <div
                      key={track.id || index}
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                        if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) {
                          broadcastPlay(track, 'youtube', true);
                        }
                      }}
                      className={`px-2.5 py-1.5 flex items-center justify-between group cursor-pointer transition ${
                        isCurrent
                          ? 'bg-red-600/15 text-black dark:text-white'
                          : 'bg-white dark:bg-[#181926] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className={`text-[10px] font-mono font-bold w-4 text-center flex-shrink-0 ${isCurrent ? 'text-red-500' : 'text-gray-400'}`}>
                          {index + 1}
                        </span>
                        <div className="w-8 h-6 rounded-sm border border-black/20 overflow-hidden flex-shrink-0 bg-black relative">
                          <img
                            src={track.cover || (track.youtubeId ? `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200')}
                            alt={track.title}
                            onError={(e) => {
                              if (track.youtubeId) {
                                e.currentTarget.src = `https://img.youtube.com/vi/${track.youtubeId}/0.jpg`;
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <p className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-red-500 font-black' : 'text-black dark:text-white'}`}>
                            {track.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 truncate leading-tight">
                            <span className="truncate">{track.artist || 'YouTube'}</span>
                            {track.category && <span className="text-[9px] px-1 bg-white/10 rounded">{track.category}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toggleYoutubeFavorite) toggleYoutubeFavorite(track.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                        >
                          <Heart className={`w-3.5 h-3.5 ${track.is_favorite ? 'fill-[#FF0000] text-[#FF0000]' : ''}`} />
                        </button>
                        {isCurrent && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-600 text-white uppercase">PLAYING</span>
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
    </div>
  );
}
