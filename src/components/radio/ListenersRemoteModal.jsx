import React, { useState, useEffect } from 'react';
import { 
  Users, X, RotateCcw, Play, Pause, SkipForward, Disc, ListMusic, 
  Monitor, Smartphone, Volume2, Send, CheckCircle2, Radio,
  Lock, Unlock, Image, Type, Menu, ShieldAlert, Sparkles, Check, Sliders
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
  onSetVolumeListener,
  tyrannySettings = {},
  onUpdateTyrannySettings,
  currentTrackCover = ''
}) {
  const [modalTab, setModalTab] = useState('tyranny'); // 'tyranny' | 'listeners' | 'commands'
  
  // Estado local para los ajustes tiránicos en edición
  const [localTyranny, setLocalTyranny] = useState({
    lockConsoles: true,
    forcedTab: 'supabase',
    bannerEnabled: true,
    bannerContentType: 'both',
    bannerImageUrl: '',
    bannerTitle: 'Proyecto Café Radio',
    bannerText: 'Música curada para el café',
    showHamburgerMenu: false,
    allowAdminNav: false,
    ...tyrannySettings
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (tyrannySettings) {
      setLocalTyranny(prev => ({
        ...prev,
        ...tyrannySettings
      }));
    }
  }, [tyrannySettings]);

  if (!isOpen) return null;

  const handleSaveTyranny = async (overrides = {}) => {
    const toSave = { ...localTyranny, ...overrides };
    setLocalTyranny(toSave);
    if (onUpdateTyrannySettings) {
      await onUpdateTyrannySettings(toSave);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-white/15 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] pb-safe overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
              localTyranny.lockConsoles 
                ? 'bg-red-500/20 border border-red-500/40 text-red-400' 
                : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
            }`}>
              {localTyranny.lockConsoles ? <Lock className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Panel Tiránico & Control Remoto
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  activeListenersCount > 0 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}>
                  {activeListenersCount} {activeListenersCount === 1 ? 'oyente activo' : 'oyentes activos'}
                </span>
                {localTyranny.lockConsoles && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase animate-pulse">
                    🔒 Modo Tiránico
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Dicta las consolas, banners de inicio con play y accesos de navegación en Radio Proyecto.
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

        {/* PESTAÑAS DE NAVEGACIÓN DENTRO DEL MODAL */}
        <div className="flex border-b border-white/10 bg-black/40 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setModalTab('tyranny')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              modalTab === 'tyranny'
                ? 'bg-[#181818] text-red-400 border-red-500/40 border-b-2 border-b-[#181818]'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Control Tiránico & Locks</span>
          </button>

          <button
            onClick={() => setModalTab('listeners')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              modalTab === 'listeners'
                ? 'bg-[#181818] text-blue-400 border-blue-500/40 border-b-2 border-b-[#181818]'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Oyentes en Vivo ({activeListenersCount})</span>
          </button>

          <button
            onClick={() => setModalTab('commands')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              modalTab === 'commands'
                ? 'bg-[#181818] text-purple-400 border-purple-500/40 border-b-2 border-b-[#181818]'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Emisión & Comandos</span>
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
          
          {/* TAB 1: CONTROL TIRÁNICO & LOCKS */}
          {modalTab === 'tyranny' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* BLOQUEO 1: LOCK DE CONSOLAS */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      localTyranny.lockConsoles ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'
                    }`}>
                      {localTyranny.lockConsoles ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-white font-extrabold text-sm">
                        Bloqueo de Cambio de Consola (Files / Radio / YouTube)
                      </h4>
                      <p className="text-gray-400 text-[11px]">
                        Si está activo, el oyente NO puede cambiar de consola. La consola es 100% impuesta por ti.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !localTyranny.lockConsoles;
                      handleSaveTyranny({ lockConsoles: nextVal });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition border ${
                      localTyranny.lockConsoles
                        ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-lg shadow-red-900/30'
                        : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/15'
                    }`}
                  >
                    {localTyranny.lockConsoles ? '🔒 Bloqueo ACTIVO' : '🔓 Libre'}
                  </button>
                </div>

                {/* SELECTOR DE CONSOLA TIRÁNICA */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                    Consola Forzada Actual:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'supabase', label: 'Files (MP3s)', icon: <ListMusic className="w-4 h-4" />, color: 'emerald' },
                      { id: 'live', label: 'Radio (Plaza)', icon: <Radio className="w-4 h-4" />, color: 'cyan' },
                      { id: 'youtube', label: 'YouTube', icon: <Play className="w-4 h-4 fill-current" />, color: 'red' }
                    ].map(tabItem => {
                      const isSel = (localTyranny.forcedTab || currentMode) === tabItem.id;
                      return (
                        <button
                          key={tabItem.id}
                          onClick={() => {
                            handleSaveTyranny({ forcedTab: tabItem.id });
                            if (onForceModeAll) onForceModeAll(tabItem.id);
                          }}
                          className={`p-2.5 rounded-xl border font-black text-xs transition flex items-center justify-center gap-1.5 ${
                            isSel
                              ? tabItem.color === 'emerald'
                                ? 'bg-[#1DB954] text-black border-[#1DB954] shadow-md shadow-[#1DB954]/20'
                                : tabItem.color === 'cyan'
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                                : 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                          }`}
                        >
                          {tabItem.icon}
                          <span>{tabItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BLOQUEO 2: BANNER DE INICIO CON PLAY (SPLASH / LANDING) */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      localTyranny.bannerEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'
                    }`}>
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-white font-extrabold text-sm">
                        Banner de Inicio con Play (Overlay de Bienvenida)
                      </h4>
                      <p className="text-gray-400 text-[11px]">
                        Controla si los oyentes ven la pantalla de bienvenida con el botón Play al ingresar a Radio Proyecto.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextVal = !localTyranny.bannerEnabled;
                      handleSaveTyranny({ bannerEnabled: nextVal });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition border ${
                      localTyranny.bannerEnabled
                        ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-900/30'
                        : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/15'
                    }`}
                  >
                    {localTyranny.bannerEnabled ? '✅ Banner ACTIVO' : '❌ Desactivado'}
                  </button>
                </div>

                {localTyranny.bannerEnabled && (
                  <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                    
                    {/* SELECTOR DE CONTENIDO DEL BANNER */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                        ¿Qué contiene el Banner?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'both', label: 'Imagen y Texto', icon: <Sliders className="w-3.5 h-3.5" /> },
                          { id: 'image', label: 'Solo Imagen', icon: <Image className="w-3.5 h-3.5" /> },
                          { id: 'text', label: 'Solo Texto', icon: <Type className="w-3.5 h-3.5" /> },
                        ].map(cType => {
                          const isSel = (localTyranny.bannerContentType || 'both') === cType.id;
                          return (
                            <button
                              key={cType.id}
                              onClick={() => setLocalTyranny(prev => ({ ...prev, bannerContentType: cType.id }))}
                              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                isSel
                                  ? 'bg-white text-black border-white shadow-sm font-black'
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                              }`}
                            >
                              {cType.icon}
                              <span>{cType.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* IMAGEN PERSONALIZADA (si no es solo texto) */}
                    {localTyranny.bannerContentType !== 'text' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                            URL de Imagen de Portada / Banner:
                          </label>
                          {currentTrackCover && (
                            <button
                              onClick={() => setLocalTyranny(prev => ({ ...prev, bannerImageUrl: currentTrackCover }))}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                            >
                              Usar portada al aire actual
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={localTyranny.bannerImageUrl || ''}
                          onChange={(e) => setLocalTyranny(prev => ({ ...prev, bannerImageUrl: e.target.value }))}
                          placeholder="https://... (deja vacío para usar carátula de emisión o logo)"
                          className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    )}

                    {/* TEXTOS PERSONALIZADOS (si no es solo imagen) */}
                    {localTyranny.bannerContentType !== 'image' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                            Título del Banner:
                          </label>
                          <input
                            type="text"
                            value={localTyranny.bannerTitle || ''}
                            onChange={(e) => setLocalTyranny(prev => ({ ...prev, bannerTitle: e.target.value }))}
                            placeholder="Proyecto Café Radio"
                            className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                            Subtítulo / Mensaje:
                          </label>
                          <input
                            type="text"
                            value={localTyranny.bannerText || ''}
                            onChange={(e) => setLocalTyranny(prev => ({ ...prev, bannerText: e.target.value }))}
                            placeholder="Música curada para el café"
                            className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* BLOQUEO 3: CONTROL DE MENÚ HAMBURGUESA Y NAVEGACIÓN */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Menu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-extrabold text-sm">
                      Privacidad y Menú de Navegación en Radio Proyecto
                    </h4>
                    <p className="text-gray-400 text-[11px]">
                      Oculta el menú hamburguesa o el botón de administrador para que el público no acceda a áreas internas del café.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-white text-xs block">Menú Hamburguesa en Radio</span>
                      <span className="text-[10px] text-gray-400">Mostrar botón de menú en la cabecera</span>
                    </div>
                    <button
                      onClick={() => setLocalTyranny(prev => ({ ...prev, showHamburgerMenu: !prev.showHamburgerMenu }))}
                      className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase transition border ${
                        localTyranny.showHamburgerMenu
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/10 text-gray-400 border-white/10'
                      }`}
                    >
                      {localTyranny.showHamburgerMenu ? 'Visible' : 'Oculto'}
                    </button>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-white text-xs block">Acceso Botón Admin</span>
                      <span className="text-[10px] text-gray-400">Mostrar botón directo a RadioManager</span>
                    </div>
                    <button
                      onClick={() => setLocalTyranny(prev => ({ ...prev, allowAdminNav: !prev.allowAdminNav }))}
                      className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase transition border ${
                        localTyranny.allowAdminNav
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-white/10 text-gray-400 border-white/10'
                      }`}
                    >
                      {localTyranny.allowAdminNav ? 'Permitido' : 'Solo Staff'}
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTÓN MAESTRO DE APLICAR AJUSTES TIRÁNICOS */}
              <div className="pt-2">
                <button
                  onClick={() => handleSaveTyranny()}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 shadow-xl shadow-red-900/40"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>¡Órdenes Tiránicas Enviadas a Todos los Oyentes!</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Guardar y Aplicar Órdenes a Todos los Oyentes Ahora</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: OYENTES EN TIEMPO REAL */}
          {modalTab === 'listeners' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-extrabold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Instancias de Escuchas Conectadas ({listeners.length})
                </h4>
                <span className="text-[11px] text-gray-400">Monitoreo WebSocket + Presence</span>
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
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
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
          )}

          {/* TAB 3: EMISIÓN & COMANDOS */}
          {modalTab === 'commands' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* SECCIÓN: APLICAR LISTA ESPECÍFICA A TODOS */}
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

              {/* SECCIÓN: ACCIONES MAESTRAS GLOBALES */}
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

            </div>
          )}

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
