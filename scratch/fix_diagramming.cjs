const fs = require('fs');
const path = require('path');

const file = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Rediagramar Cabecera de la Biblioteca (Panel Izquierdo)
const oldLibraryHeaderStart = `{/* CABECERA PANEL IZQUIERDO */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="pt-1">
                          <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight leading-normal">
                            <FolderUp className="w-5 h-5 text-cyan-400 shrink-0" />
                            Biblioteca de la Carpeta
                          </h4>
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                            G:\\\\Mi unidad\\\\Radio
                          </p>
                        </div>

                        {/* BOTONES PLAY, NEXT, ALEATORIO EN LA CABECERA DE LA BIBLIOTECA */}
                        <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={handleToggleLibraryPreview}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                            title="Reproducir o pausar pre-escucha de la biblioteca en Radio Manager"
                          >
                            {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            <span>{isPlayingPreview ? 'Pausa' : 'Play'}</span>
                          </button>
                          <button
                            onClick={handleNextLibraryPreview}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                            title="Saltar a la siguiente canción en biblioteca"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>Next</span>
                          </button>
                          <button
                            onClick={handleRandomLibraryPreview}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                            title="Pre-escuchar canción aleatoria de la biblioteca"
                          >
                            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Aleatorio</span>
                          </button>
                        </div>
                      </div>`;

const newLibraryHeader = `{/* CABECERA PANEL IZQUIERDO */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-1">
                      {/* FILA 1: TÍTULO Y CONTEO */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="pt-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FolderUp className="w-5 h-5 text-cyan-400 shrink-0" />
                            <h4 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                              Biblioteca de la Carpeta
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                              {libraryTracks.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                            G:\\\\Mi unidad\\\\Radio
                          </p>
                        </div>
                      </div>

                      {/* FILA 2: BARRA DE CONTROLES PLAYBACK BIBLIOTECA (GRID 3 COLUMNAS SIN DESBORDE) */}
                      <div className="grid grid-cols-3 gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                        <button
                          onClick={handleToggleLibraryPreview}
                          className="py-2 px-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                          title="Reproducir o pausar pre-escucha de la biblioteca en Radio Manager"
                        >
                          {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5 shrink-0" />}
                          <span className="truncate">{isPlayingPreview ? 'Pausa' : 'Play'}</span>
                        </button>
                        <button
                          onClick={handleNextLibraryPreview}
                          className="py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                          title="Saltar a la siguiente canción en biblioteca"
                        >
                          <SkipForward className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Next</span>
                        </button>
                        <button
                          onClick={handleRandomLibraryPreview}
                          className="py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                          title="Pre-escuchar canción aleatoria de la biblioteca"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">Aleatorio</span>
                        </button>
                      </div>`;

// 2. Rediagramar Cabecera de la Cola (Panel Derecho)
const oldColaHeaderStart = `{/* CABECERA PANEL DERECHO */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="pt-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                              <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full \${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'} opacity-75\`}></span>
                              <span className={\`relative inline-flex rounded-full h-3 w-3 \${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'}\`}></span>
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 tracking-tight leading-normal">
                              <Radio className="w-5 h-5 text-[#1DB954] shrink-0" />
                              Cola de Emisión al Aire
                            </h4>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Tanda en vivo sincronizada con Proyecto Radio y el Bat
                          </p>
                        </div>

                        {/* CONTROLES DE LA COLA: SWITCH ON AIR, PLAY, NEXT, ALEATORIO, VACIAR */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
                          {/* SWITCH ON AIR MAESTRO */}
                          <button
                            onClick={handleToggleOnAirSwitch}
                            className={\`px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border shadow-lg \${
                              onAirTrack?.is_playing
                                ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white hover:bg-white/20'
                            }\`}
                            title={onAirTrack?.is_playing ? "Switch ON AIR encendido: Transmitiendo en Radio Proyecto. Clic para apagar" : "Switch ON AIR apagado: Clic para prender la cola en Radio Proyecto"}
                          >
                            <span className={\`w-2 h-2 rounded-full \${onAirTrack?.is_playing ? 'bg-white animate-ping' : 'bg-red-500'}\`} />
                            <span>{onAirTrack?.is_playing ? 'ON AIR' : 'OFF AIR'}</span>
                          </button>

                          {/* BOTÓN ESCUCHAR SEÑAL EN VIVO */}
                          <button
                            onClick={handleToggleListenLive}
                            className={\`px-2.5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 border shadow-lg \${
                              isPlayingLiveSignal
                                ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                : 'bg-white/10 text-gray-300 border-white/10 hover:text-white hover:bg-white/20'
                            }\`}
                            title={isPlayingLiveSignal ? "Pausar audio de la señal en vivo" : "Escuchar la señal que está saliendo al aire en Radio Proyecto"}
                          >
                            <Volume2 className={\`w-3.5 h-3.5 \${isPlayingLiveSignal ? 'text-white animate-bounce' : 'text-red-400'}\`} />
                            <span>{isPlayingLiveSignal ? 'En Vivo Sonando' : 'Escuchar En Vivo'}</span>
                          </button>

                          {/* PLAY / PAUSA COLA */}
                          <button
                            onClick={handleAirPlayPause}
                            className="px-2.5 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs rounded-lg transition flex items-center gap-1 shadow-md shadow-[#1DB954]/20"
                            title="Iniciar o pausar emisión de la cola"
                          >
                            {onAirTrack?.is_playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            <span>{onAirTrack?.is_playing ? 'Pausa' : 'Play'}</span>
                          </button>

                          {/* NEXT COLA */}
                          <button
                            onClick={handleAirNext}
                            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                            title="Saltar a la siguiente canción al aire en Radio Proyecto"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>Next</span>
                          </button>

                          {/* ALEATORIO COLA */}
                          <button
                            onClick={handleAirShuffle}
                            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                            title="Mezclar canciones de la cola"
                          >
                            <Shuffle className="w-3.5 h-3.5 text-[#1DB954]" />
                            <span>Aleatorio</span>
                          </button>

                          {/* VACIAR COLA */}
                          <button
                            onClick={handleClearQueue}
                            disabled={isUpdatingAirList || songs.length === 0}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition border border-red-500/20 disabled:opacity-30"
                            title="Vaciar la cola de emisión"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>`;

const newColaHeader = `{/* CABECERA PANEL DERECHO */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-1">
                      {/* FILA 1: TÍTULO, ESTADO Y SWITCH MASTER ON AIR + VACIAR */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="pt-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative shrink-0">
                              <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full \${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'} opacity-75\`}></span>
                              <span className={\`relative inline-flex rounded-full h-3 w-3 \${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'}\`}></span>
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 tracking-tight truncate">
                              <Radio className="w-5 h-5 text-[#1DB954] shrink-0" />
                              Cola de Emisión al Aire
                            </h4>
                            <span className={\`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 border \${
                              onAirTrack?.is_playing 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : 'bg-white/10 text-gray-400 border-white/10'
                            }\`}>
                              {songs.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            Tanda en vivo sincronizada con Proyecto Radio y el Bat
                          </p>
                        </div>

                        {/* MASTER SWITCH ON AIR & VACIAR COLA */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={handleToggleOnAirSwitch}
                            className={\`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border shadow-lg \${
                              onAirTrack?.is_playing
                                ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white hover:bg-white/20'
                            }\`}
                            title={onAirTrack?.is_playing ? "Switch ON AIR encendido: Transmitiendo en Radio Proyecto. Clic para apagar" : "Switch ON AIR apagado: Clic para prender la cola en Radio Proyecto"}
                          >
                            <span className={\`w-2 h-2 rounded-full \${onAirTrack?.is_playing ? 'bg-white animate-ping' : 'bg-red-500'}\`} />
                            <span>{onAirTrack?.is_playing ? 'ON AIR' : 'OFF AIR'}</span>
                          </button>

                          <button
                            onClick={handleClearQueue}
                            disabled={isUpdatingAirList || songs.length === 0}
                            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition border border-red-500/20 disabled:opacity-30"
                            title="Vaciar la cola de emisión"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* FILA 2: BARRA DE CONTROLES PLAYBACK Y MONITOR AL AIRE (GRID 4 COLUMNAS SIN DESBORDE) */}
                      <div className="grid grid-cols-4 gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                        {/* BOTÓN ESCUCHAR SEÑAL EN VIVO */}
                        <button
                          onClick={handleToggleListenLive}
                          className={\`col-span-1 py-2 px-2 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border shadow-sm \${
                            isPlayingLiveSignal
                              ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/10'
                          }\`}
                          title={isPlayingLiveSignal ? "Pausar audio de la señal en vivo" : "Escuchar la señal que está saliendo al aire en Radio Proyecto"}
                        >
                          <Volume2 className={\`w-3.5 h-3.5 shrink-0 \${isPlayingLiveSignal ? 'text-white animate-bounce' : 'text-red-400'}\`} />
                          <span className="truncate">{isPlayingLiveSignal ? 'Sonando' : 'En Vivo'}</span>
                        </button>

                        {/* PLAY / PAUSA COLA */}
                        <button
                          onClick={handleAirPlayPause}
                          className="col-span-1 py-2 px-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-md shadow-[#1DB954]/20"
                          title="Iniciar o pausar emisión de la cola"
                        >
                          {onAirTrack?.is_playing ? <Pause className="w-3.5 h-3.5 fill-current shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5 shrink-0" />}
                          <span className="truncate">{onAirTrack?.is_playing ? 'Pausa' : 'Play'}</span>
                        </button>

                        {/* NEXT COLA */}
                        <button
                          onClick={handleAirNext}
                          className="col-span-1 py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                          title="Saltar a la siguiente canción al aire en Radio Proyecto"
                        >
                          <SkipForward className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Next</span>
                        </button>

                        {/* ALEATORIO COLA */}
                        <button
                          onClick={handleAirShuffle}
                          className="col-span-1 py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                          title="Mezclar canciones de la cola"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                          <span className="truncate">Aleatorio</span>
                        </button>
                      </div>`;

// Apply Biblioteca Header replacement
const libStart = content.indexOf('{/* CABECERA PANEL IZQUIERDO */}');
const libEnd = content.indexOf('{/* SUB-CABECERA: BUSCADOR Y SELECTOR DE VISTA DE BIBLIOTECA */}');

if (libStart !== -1 && libEnd !== -1) {
  content = content.substring(0, libStart) + newLibraryHeader + '\n\n                      ' + content.substring(libEnd);
} else {
  console.error("Could not find Biblioteca header markers", { libStart, libEnd });
}

// Apply Cola Header replacement
const colaStart = content.indexOf('{/* CABECERA PANEL DERECHO */}');
const colaEnd = content.indexOf('{/* BUSCADOR DENTRO DE LA COLA */}');

if (colaStart !== -1 && colaEnd !== -1) {
  content = content.substring(0, colaStart) + newColaHeader + '\n\n                      ' + content.substring(colaEnd);
} else {
  console.error("Could not find Cola header markers", { colaStart, colaEnd });
}

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully rediagrammed Biblioteca and Cola headers with zero overflow!");
