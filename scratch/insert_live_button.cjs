const fs = require('fs');
const path = require('path');

const file = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(file, 'utf8');

const target = `{/* PLAY / PAUSA COLA */}`;
const replacement = `{/* BOTÓN ESCUCHAR SEÑAL EN VIVO */}
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

                          {/* PLAY / PAUSA COLA */}`;

if (content.includes(target) && !content.includes('handleToggleListenLive}')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully inserted 'Escuchar En Vivo' button in Cola header!");
} else {
  console.log("Already inserted or target not found");
}
