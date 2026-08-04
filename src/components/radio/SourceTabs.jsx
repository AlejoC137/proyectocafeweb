import React from 'react';
import { Cloud, Disc, Globe, HardDrive, Loader2, ArrowUp, ArrowDown, Trash2, Search, Play, FolderOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SourceTabs({
  activeTab,
  handleTabChange,
  supabasePlaylist,
  loadingSupabase,
  currentTrackIndex,
  setCurrentTrackIndex,
  setIsPlaying,
  broadcastPlay,
  isApplyingRemoteChange,
  moveSongOrder,
  handleDeleteSong,
  somaFmChannels,
  loadingSomaFm,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  apiStations,
  loadingApi,
  localPlaylist,
  fileInputRef,
  handleLocalFilesUpload,
  removeLocalTrack,
  totalPlaylistSeconds,
  formattedTotalPlaylistTime,
  quotaPercent
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* TABS de fuente */}
      <div className="flex flex-wrap md:flex-nowrap border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none mb-4 w-full">
        {[{id:'supabase',icon:<Cloud className="w-5 h-5"/>,label:'Play List Alejo'},
          {id:'somafm',icon:<Disc className="w-5 h-5"/>,label:'Selección Proyecto'},
          {id:'live',icon:<Globe className="w-5 h-5"/>,label:'Radio Browser'},
          {id:'local',icon:<HardDrive className="w-5 h-5"/>,label:'Local'},
        ].map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-2 p-3 font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-colors border-r-[3px] last:border-r-0 border-black rounded-none ${
              activeTab === tab.id
                ? 'bg-black text-white'
                : 'bg-cream-bg text-black hover:bg-black/10'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline" style={{ fontFamily: "'First Bunny', sans-serif", fontSize: '14px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENIDO DEL TAB */}
      <div className="border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
        {/* TAB: SUPABASE */}
        {activeTab === 'supabase' && (
          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-2xl lg:text-3xl font-black flex items-center gap-2 uppercase tracking-widest text-black border-b-[3px] border-black pb-1 mt-1 whitespace-nowrap truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                <Cloud className="w-6 h-6 -mt-1 flex-shrink-0" />
                <span className="truncate">Play List Alejo ({supabasePlaylist.length})</span>
              </h3>
              <button onClick={() => navigate('/RadioManager')}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest transition border-[3px] border-black bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-black hover:text-white rounded-none"
              >
                + Administrar
              </button>
            </div>
            {loadingSupabase ? (
              <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-black">Cargando desde Supabase...</div>
            ) : supabasePlaylist.length === 0 ? (
              <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-black">
                <Cloud className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>La Play List está vacía.</p>
                <button onClick={() => navigate('/RadioManager')} className="mt-4 px-6 py-3 text-sm font-black uppercase border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black text-white hover:bg-white hover:text-black transition-colors rounded-none"
                >⚙️ Administrar Radio</button>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
                {supabasePlaylist.map((song, index) => {
                  const isCurrent = activeTab === 'supabase' && currentTrackIndex === index;
                  return (
                    <div key={song.id || index}
                      className={`p-3 border-[3px] border-black flex items-center justify-between group cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                        isCurrent ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <div onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) broadcastPlay(song, 'supabase', true); }}
                        className="flex items-center gap-3 flex-1 truncate"
                      >
                        <span className="text-[10px] font-black w-4 text-center">{index+1}</span>
                        <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-cream-bg">
                          <img src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=80'} alt={song.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-black truncate uppercase tracking-widest">{song.title}</p>
                          <p className="text-[10px] font-bold truncate uppercase">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button onClick={() => moveSongOrder(index,'up')} disabled={index===0} className="p-2 border-[2px] border-black bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition disabled:opacity-30 hover:bg-black hover:text-white rounded-none"><ArrowUp className="w-3 h-3"/></button>
                        <button onClick={() => moveSongOrder(index,'down')} disabled={index===supabasePlaylist.length-1} className="p-2 border-[2px] border-black bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition disabled:opacity-30 hover:bg-black hover:text-white rounded-none"><ArrowDown className="w-3 h-3"/></button>
                        <button onClick={() => handleDeleteSong(song.id, song.url)} className="p-2 border-[2px] border-black bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition rounded-none"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: SOMAFM */}
        {activeTab === 'somafm' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl lg:text-3xl font-black flex items-center gap-2 uppercase tracking-widest text-black border-b-[3px] border-black pb-1 mt-1 whitespace-nowrap truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                <Disc className="w-6 h-6 -mt-1 flex-shrink-0" />
                <span className="truncate">Selección Proyecto</span>
              </h3>
              {loadingSomaFm && <Loader2 className="w-5 h-5 animate-spin text-black" />}
            </div>
            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {somaFmChannels.map((chan, index) => {
                const isCurrent = activeTab === 'somafm' && currentTrackIndex === index;
                return (
                  <div key={chan.id} onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) broadcastPlay(chan, 'somafm', true); }}
                    className={`p-3 border-[3px] border-black flex items-center justify-between cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                      isCurrent ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white group'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-cream-bg">
                        <img src={chan.cover} alt={chan.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-black truncate uppercase tracking-widest">{chan.title}</p>
                        <p className="text-[10px] font-bold truncate uppercase">{chan.genre}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="px-2 py-1 bg-[#FF0000] border-[2px] border-black text-black text-[10px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">LIVE</span>
                    ) : (
                      <Play className="w-5 h-5 flex-shrink-0 group-hover:text-white" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: RADIO BROWSER */}
        {activeTab === 'live' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl lg:text-3xl font-black flex items-center gap-2 uppercase tracking-widest text-black border-b-[3px] border-black pb-1 mt-1 whitespace-nowrap truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                <Globe className="w-6 h-6 -mt-1 flex-shrink-0" />
                <span className="truncate">Radio Browser</span>
              </h3>
              {loadingApi && <Loader2 className="w-5 h-5 animate-spin text-black" />}
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              {['lofi', 'jazz', 'rock', 'salsa', 'chillout', 'classical'].map(tag => (
                <button key={tag} onClick={() => { setSelectedCategory(tag); setSearchQuery(''); }}
                  className={`px-4 py-2 border-[3px] border-black text-[10px] font-black uppercase tracking-widest transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                    selectedCategory === tag && !searchQuery ? 'bg-black text-white' : 'bg-white text-black hover:bg-yellow-100'
                  }`}
                >{tag}</button>
              ))}
            </div>
            <form onSubmit={handleSearchSubmit} className="relative mb-4 flex gap-2">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar emisora..."
                className="w-full pl-10 pr-4 py-3 border-[3px] border-black bg-cream-bg text-black text-xs font-bold uppercase placeholder-black/50 outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <Search className="w-4 h-4 absolute left-4 top-4 text-black" />
              <button type="submit" className="px-4 py-3 border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black text-white text-xs font-black uppercase rounded-none hover:bg-white hover:text-black transition">Buscar</button>
            </form>
            <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
              {apiStations.map((station, index) => {
                const isCurrent = activeTab === 'live' && currentTrackIndex === index;
                return (
                  <div key={station.id} onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); if (broadcastPlay && isApplyingRemoteChange && !isApplyingRemoteChange.current) broadcastPlay(station, 'live', true); }}
                    className={`p-3 border-[3px] border-black flex items-center justify-between cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                      isCurrent ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white group'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-cream-bg">
                        <img src={station.cover} alt={station.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest">{station.title}</p>
                        <p className="text-[10px] font-bold uppercase">{station.artist}</p>
                      </div>
                    </div>
                    {isCurrent
                      ? <span className="text-[10px] font-black px-2 py-1 bg-[#FF0000] border-[2px] border-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">LIVE</span>
                      : <Play className="w-5 h-5 group-hover:text-white" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: LOCAL */}
        {activeTab === 'local' && (
          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-2xl lg:text-3xl font-black flex items-center gap-2 uppercase tracking-widest text-black border-b-[3px] border-black pb-1 mt-1 whitespace-nowrap truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                <HardDrive className="w-6 h-6 -mt-1 flex-shrink-0" />
                <span className="truncate">Archivos de tu PC ({localPlaylist.length})</span>
              </h3>
              <button onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest transition border-[3px] border-black bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-black hover:text-white rounded-none"
              >
                <FolderOpen className="w-4 h-4 inline mr-2" />Cargar
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={(e) => handleLocalFilesUpload(e, (tab) => handleTabChange(tab))} className="hidden" />
            </div>
            {localPlaylist.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()}
                className="py-10 border-[4px] border-black border-dashed bg-cream-bg flex flex-col items-center gap-3 cursor-pointer transition hover:bg-yellow-100 rounded-none"
              >
                <FolderOpen className="w-10 h-10 text-black" />
                <p className="text-xs font-black uppercase tracking-widest text-black">Haz clic para cargar MP3s</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
                {localPlaylist.map((track, index) => {
                  const isCurrent = activeTab === 'local' && currentTrackIndex === index;
                  return (
                    <div key={track.id} className={`p-3 border-[3px] border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none ${
                      isCurrent ? 'bg-black text-white' : 'bg-white text-black'
                    }`}>
                      <div onClick={() => { setCurrentTrackIndex(index); setIsPlaying(true); }} className="flex items-center gap-3 cursor-pointer flex-1 truncate hover:opacity-80 transition">
                        <div className="w-10 h-10 border-[2px] border-black overflow-hidden flex-shrink-0 bg-cream-bg">
                          <img src={track.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=80'} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-black uppercase tracking-widest truncate">{track.title}</p>
                          <p className="text-[10px] font-bold uppercase truncate">{track.fileName}</p>
                        </div>
                      </div>
                      <button onClick={() => removeLocalTrack(track.id)} className="p-2 border-[2px] border-black bg-white text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition rounded-none ml-2"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cuota 4 horas (solo tabs locales) */}
      {(activeTab === 'supabase' || activeTab === 'local') && totalPlaylistSeconds > 0 && (
        <div className="p-4 border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 rounded-none">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-black mb-2">
            <span className="flex items-center gap-1 bg-yellow-100 border-[2px] border-black px-2 py-0.5"><Clock className="w-4 h-4" /> Cuota 4h</span>
            <span className="border-[2px] border-black px-2 py-0.5">{formattedTotalPlaylistTime} / 4h ({quotaPercent}%)</span>
          </div>
          <div className="w-full h-3 border-[2px] border-black bg-cream-bg rounded-none">
            <div className="h-full transition-all" style={{ width: `${quotaPercent}%`, background: quotaPercent >= 90 ? '#FF0000' : '#000' }} />
          </div>
        </div>
      )}
    </>
  );
}
