import React from 'react';
import { 
  Users, X, RotateCcw, Play, Pause, SkipForward, Disc, ListMusic, 
  Monitor, Smartphone, Volume2, Send, CheckCircle2, Radio 
} from 'lucide-react';

export default function ListenersRemoteModal({
  isOpen,
  onClose,
  listeners = [],
  activeListenersCount = 0,
  batCatalog = [],
  songs = [],
  selectedTargetList = 'queue',
  setSelectedTargetList,
  onApplyListToRemoteListeners,
  onForceReloadAll,
  onPauseAll,
  onPlayAll,
  onNextAll,
  onReloadListener,
  onTogglePlayListener,
  onNextTrackListener,
  currentMode,
  onForceModeAll,
  onSetVolumeAll,
  onSetVolumeListener
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-white/15 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] pb-safe overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Panel de Escuchas & Control Remoto
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  activeListenersCount > 0 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}>
                  {activeListenersCount} {activeListenersCount === 1 ? 'instancia activa' : 'instancias activas'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Monitorea las instancias abiertas de ProyectoRadio y envíales listas o comandos en vivo.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
          
          {/* SECCIÓN 1: APLICAR LISTA ESPECÍFICA A TODOS */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm">
              <ListMusic className="w-4 h-4 text-[#1DB954]" />
              <h4>Aplicar Lista o Álbum a Todos los Escuchas</h4>
            </div>
            <p className="text-gray-400 text-xs">
              Elige qué contenido enviar a todas las instancias conectadas. Cambiarán inmediatamente sin recargar la página.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedTargetList}
                onChange={(e) => setSelectedTargetList(e.target.value)}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-[#1DB954]"
              >
                <option value="queue">
                  📋 Cola de Emisión al Aire ({songs.length} pistas activas)
                </option>
                {batCatalog.map((alb) => (
                  <option key={alb.folderName || alb.albumName} value={alb.folderName || alb.albumName}>
                    💿 Álbum: {alb.albumName} ({alb.tracks?.length || alb.trackCount || 0} pistas) - {alb.artist}
                  </option>
                ))}
              </select>

              <button
                onClick={onApplyListToRemoteListeners}
                className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#1DB954]/20 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Aplicar a Todos
              </button>
            </div>
          </div>

          {/* SECCIÓN: FORZAR FUENTE EN TODAS LAS INSTANCIAS (FILES / RADIOS / YOUTUBE) */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-white font-extrabold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" />
              Forzar Fuente en Todas las Instancias de Proyecto Radio
            </h4>
            <p className="text-gray-400 text-xs">
              Pasa forzosamente a todas las instancias conectadas a reproducir Files, Radios en vivo (Plaza) o YouTube inmediatamente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onForceModeAll && onForceModeAll('supabase')}
                className={`p-2.5 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                  currentMode === 'supabase' || !currentMode
                    ? 'bg-[#1DB954] text-black border-[#1DB954] shadow-lg shadow-[#1DB954]/30'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                }`}
              >
                <ListMusic className="w-4 h-4" />
                Forzar Files (MP3s)
              </button>

              <button
                onClick={() => onForceModeAll && onForceModeAll('live')}
                className={`p-2.5 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                  currentMode === 'live'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                }`}
              >
                <Radio className="w-4 h-4" />
                Forzar Radios (Plaza)
              </button>

              <button
                onClick={() => onForceModeAll && onForceModeAll('youtube')}
                className={`p-2.5 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                  currentMode === 'youtube'
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Forzar YouTube
              </button>
            </div>
          </div>

          {/* SECCIÓN 2: ACCIONES MAESTRAS GLOBALES */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-white font-extrabold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              Acciones Maestras (Afecta a todas las instancias)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={onPlayAll}
                className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold transition flex items-center justify-center gap-1.5"
                title="Reanudar reproducción en todas las instancias"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Todos
              </button>

              <button
                onClick={onPauseAll}
                className="p-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold transition flex items-center justify-center gap-1.5"
                title="Pausar audio en todas las instancias"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pausar Todos
              </button>

              <button
                onClick={onNextAll}
                className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold transition flex items-center justify-center gap-1.5"
                title="Saltar a la siguiente canción en todas las instancias"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Siguiente
              </button>

              <button
                onClick={onForceReloadAll}
                className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold transition flex items-center justify-center gap-1.5"
                title="Forzar recarga completa (F5) en todas las instancias"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Recargar F5
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-white/10">
              <span className="text-gray-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Volumen para Todos los Oyentes:
              </span>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.85"
                onChange={(e) => onSetVolumeAll && onSetVolumeAll(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                title="Ajustar volumen en todas las instancias de oyentes"
              />
            </div>
          </div>

          {/* SECCIÓN 3: INSTANCIAS CONECTADAS EN VIVO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-extrabold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Instancias de Escuchas en Tiempo Real ({listeners.length})
              </h4>
              <span className="text-[11px] text-gray-400">Actualizado vía WebSockets + Local</span>
            </div>

            {listeners.length === 0 ? (
              <div className="bg-black/30 border border-white/10 rounded-xl p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-gray-500 mx-auto" />
                <p className="text-sm font-bold text-gray-300">No hay escuchas conectados en este momento</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Abre ProyectoRadio en otra pestaña o en tu teléfono móvil para ver la instancia reportando aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {listeners.map((listener, idx) => {
                  const isMobile = listener.device === 'Móvil';
                  return (
                    <div 
                      key={listener.clientId || idx}
                      className="bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 shrink-0">
                          {isMobile ? <Smartphone className="w-4 h-4 text-purple-400" /> : <Monitor className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs truncate max-w-[150px] sm:max-w-[200px]">
                              {listener.device || 'Escritorio'} #{idx + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              listener.isPlaying 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              {listener.isPlaying ? '▶ Sonando' : '⏸ Pausado'}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-gray-400" />
                              {Math.round((listener.volume !== undefined ? listener.volume : 0.85) * 100)}%
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            🎵 {listener.trackTitle || 'En espera'} {listener.artist ? `• ${listener.artist}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* ACCIONES INDIVIDUALES PARA ESTA INSTANCIA */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10" title="Ajustar volumen de esta instancia">
                          <Volume2 className="w-3 h-3 text-blue-400" />
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={listener.volume !== undefined ? listener.volume : 0.85}
                            onChange={(e) => onSetVolumeListener && onSetVolumeListener(listener.clientId, Number(e.target.value))}
                            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
                          />
                        </div>

                        <button
                          onClick={() => onTogglePlayListener(listener.clientId, Boolean(listener.isPlaying))}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition"
                          title={listener.isPlaying ? "Pausar esta instancia" : "Reanudar esta instancia"}
                        >
                          {listener.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>

                        <button
                          onClick={() => onNextTrackListener(listener.clientId)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition"
                          title="Siguiente canción en esta instancia"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onReloadListener(listener.clientId)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition"
                          title="Recargar (F5) solo esta instancia"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3 sm:p-4 border-t border-white/10 flex items-center justify-between bg-black/40 text-xs">
          <span className="text-gray-400">
            Sincronizado vía Supabase Realtime + Broadcast local
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
