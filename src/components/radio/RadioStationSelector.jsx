import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  Search, 
  Disc, 
  Music, 
  Sparkles, 
  Volume2, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Folder
} from 'lucide-react';
import supabase from '../../config/supabaseClient';

export default function RadioStationSelector({
  supabasePlaylist = [],
  currentPlay = null,
  setIsPlaying,
  broadcastPlay,
  isApplyingRemoteChange
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [requestingTrackId, setRequestingTrackId] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);

  // Filtrar canciones según el buscador
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return supabasePlaylist;
    const q = searchQuery.toLowerCase();
    return supabasePlaylist.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [supabasePlaylist, searchQuery]);

  // Nombre de la canción que está sonando actualmente en la estación
  const currentLiveTitle = currentPlay?.station_name || '';

  // Función para solicitar que la estación transmita esta pista
  const handleSelectSong = async (track) => {
    try {
      setRequestingTrackId(track.id);
      setRequestSuccess(`Solicitando "${track.title}" a la emisora...`);

      // 1. Notificar a Supabase radio_current_play con la petición de cambio
      const payload = {
        id: 1,
        station_artist: `REQUEST:${track.title}`,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('radio_current_play')
        .update(payload)
        .eq('id', 1);

      setTimeout(() => {
        setRequestSuccess(`¡Pista solicitada! Radio Station cambiará a "${track.title}"`);
        setRequestingTrackId(null);
      }, 1000);

      setTimeout(() => {
        setRequestSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error al pedir canción:', err);
      setRequestingTrackId(null);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '03:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-white dark:bg-[#12131C] text-black dark:text-white transition-colors">
      {/* HEADER DE LA ESTACIÓN */}
      <div className="border-[3px] border-black dark:border-slate-700 bg-yellow-300 dark:bg-yellow-400 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 text-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-yellow-300 border-[2px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  EN VIVO
                </span>
                <h3 className="font-black uppercase tracking-wider text-base sm:text-lg" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                  Selector de Canciones - Radio Station
                </h3>
              </div>
              <p className="text-xs font-bold text-black/80 flex items-center gap-1 mt-0.5">
                <Folder className="w-3.5 h-3.5" />
                <span>Origen: G:\Mi unidad\Radio</span>
              </p>
            </div>
          </div>

          <div className="bg-black text-white px-3 py-1.5 border-[2px] border-black font-mono text-xs font-bold self-start sm:self-auto">
            {supabasePlaylist.length} PISTAS DISPONIBLES
          </div>
        </div>

        {/* PISTA ACTUAL AL AIRE */}
        {currentLiveTitle && (
          <div className="mt-3 pt-3 border-t-[2px] border-black/20 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-black animate-bounce" />
              <span className="font-bold">Sonando al aire:</span>
              <span className="font-black bg-black text-yellow-300 px-2 py-0.5 truncate max-w-[280px] sm:max-w-md">
                {currentLiveTitle}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* NOTIFICACIÓN TOAST DE PETICIÓN */}
      {requestSuccess && (
        <div className="mb-4 p-3 bg-emerald-400 border-[3px] border-black font-black text-xs text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA RÁPIDA */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Buscar canción por título, álbum o artista..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-cream-bg dark:bg-[#1a1b26] border-[3px] border-black dark:border-slate-700 text-black dark:text-white font-bold text-xs uppercase tracking-wider placeholder-gray-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] focus:outline-none focus:bg-white transition-colors"
        />
        <Search className="w-4 h-4 text-black dark:text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* LISTA DE CANCIONES */}
      {filteredTracks.length === 0 ? (
        <div className="p-8 text-center border-[3px] border-dashed border-black dark:border-slate-700 bg-cream-bg dark:bg-[#181926] my-4">
          <Disc className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-2" />
          <p className="font-black uppercase text-sm">No se encontraron canciones</p>
          <p className="text-xs text-gray-500 mt-1 font-bold">Verifica tu búsqueda o que el script radio_station.ps1 esté corriendo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredTracks.map((track, idx) => {
            const isCurrentPlaying = currentLiveTitle && (
              currentLiveTitle.toLowerCase().includes(track.title?.toLowerCase()) ||
              track.title?.toLowerCase().includes(currentLiveTitle.toLowerCase())
            );

            return (
              <div 
                key={track.id || idx}
                className={`flex items-center justify-between p-3 border-[3px] transition-all ${
                  isCurrentPlaying
                    ? 'border-black bg-yellow-200 dark:bg-yellow-500/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-black dark:border-slate-700 bg-white dark:bg-[#191a27] hover:bg-cream-bg dark:hover:bg-[#202234] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.08)]'
                }`}
              >
                {/* INFO DE LA CANCIÓN */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-8 h-8 flex items-center justify-center font-black text-xs border-[2px] border-black flex-shrink-0 ${
                    isCurrentPlaying 
                      ? 'bg-red-600 text-white' 
                      : 'bg-black text-white dark:bg-slate-700'
                  }`}>
                    {isCurrentPlaying ? (
                      <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                    ) : (
                      String(idx + 1).padStart(2, '0')
                    )}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2 truncate">
                      <p className="font-black text-xs sm:text-sm uppercase tracking-wider text-black dark:text-white truncate">
                        {track.title}
                      </p>
                      {isCurrentPlaying && (
                        <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-none flex-shrink-0 animate-pulse">
                          AL AIRE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-slate-400 mt-0.5">
                      <span className="truncate">{track.artist || 'Alcolirykoz'}</span>
                      {track.album && (
                        <>
                          <span>•</span>
                          <span className="truncate text-gray-500">{track.album}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTÓN Y TIEMPO */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="hidden sm:inline-block font-mono text-[11px] font-bold text-gray-500">
                    {formatDuration(track.duration)}
                  </span>

                  <button
                    onClick={() => handleSelectSong(track)}
                    disabled={isCurrentPlaying || requestingTrackId === track.id}
                    className={`px-3 py-1.5 font-black text-[10px] uppercase tracking-widest border-[2px] border-black flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      isCurrentPlaying
                        ? 'bg-black text-yellow-400 cursor-default opacity-90'
                        : 'bg-emerald-400 hover:bg-emerald-300 active:translate-x-[1px] active:translate-y-[1px] text-black cursor-pointer'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Sonando</span>
                      </>
                    ) : requestingTrackId === track.id ? (
                      <>
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>Pidiendo...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-black" />
                        <span>Poner</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
