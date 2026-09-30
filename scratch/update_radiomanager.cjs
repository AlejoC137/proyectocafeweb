const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add isBatOnline state and heartbeat checker if not present
if (!content.includes('const [isBatOnline, setIsBatOnline] = useState')) {
  content = content.replace(
    "const [onAirTrack, setOnAirTrack] = useState(null);",
    `const [onAirTrack, setOnAirTrack] = useState(null);
  const [isBatOnline, setIsBatOnline] = useState(false);

  const checkBatHeartbeat = (record) => {
    if (!record) {
      setIsBatOnline(false);
      return false;
    }
    if (record.station_artist === 'OFFLINE') {
      setIsBatOnline(false);
      setBatCatalog([]);
      return false;
    }
    const updatedAt = record.updated_at ? new Date(record.updated_at).getTime() : 0;
    const diff = Date.now() - updatedAt;
    const online = diff < 12000;
    setIsBatOnline(online);
    if (!online && batCatalog.length > 0) {
      setBatCatalog([]);
    }
    return online;
  };`
  );
}

// 2. Add library & queue playback functions
const newHandlers = `
  // --- CONTROLES DE CABECERA: BIBLIOTECA (PRE-ESCUCHA INTERNA) ---
  const handleToggleLibraryPreview = () => {
    if (isPlayingPreview) {
      audioRef.current?.pause();
      setIsPlayingPreview(false);
      return;
    }
    if (previewTrack) {
      audioRef.current?.play().catch(() => {});
      setIsPlayingPreview(true);
      return;
    }
    if (filteredLibraryTracks.length > 0) {
      handlePlayPreview(filteredLibraryTracks[0]);
    }
  };

  const handleNextLibraryPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    if (!previewTrack) {
      handlePlayPreview(filteredLibraryTracks[0]);
      return;
    }
    const currIdx = filteredLibraryTracks.findIndex(t => t.id === previewTrack.id || t.title === previewTrack.title);
    const nextIdx = (currIdx + 1) % filteredLibraryTracks.length;
    handlePlayPreview(filteredLibraryTracks[nextIdx]);
  };

  const handleRandomLibraryPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    const randIdx = Math.floor(Math.random() * filteredLibraryTracks.length);
    handlePlayPreview(filteredLibraryTracks[randIdx]);
  };

  // --- CONTROLES DE CABECERA: COLA DE EMISIÓN (AL AIRE EN RADIO PROYECTO) ---
  const handleToggleOnAirSwitch = async () => {
    try {
      const isCurrentlyAir = Boolean(onAirTrack?.is_playing);
      if (isCurrentlyAir) {
        await supabase.from('radio_current_play').update({
          station_artist: 'PAUSE_BROADCAST',
          is_playing: false,
          updated_at: new Date().toISOString()
        }).eq('id', 1);
        setSuccess("🔴 Switch ON AIR apagado: Emisión en pausa en Radio Proyecto.");
      } else {
        if (songs.length === 0 && batCatalog.length > 0) {
          await handleGoRandom(15);
        } else {
          await supabase.from('radio_current_play').update({
            station_artist: 'START_BROADCAST',
            is_playing: true,
            updated_at: new Date().toISOString()
          }).eq('id', 1);
        }
        setSuccess("🟢 Switch ON AIR encendido: ¡Transmitiendo la cola en vivo en Radio Proyecto!");
      }
    } catch (e) {
      setError("Error switch ON AIR: " + e.message);
    }
  };

  const handleAirPlayPause = async () => {
    await handleToggleOnAirSwitch();
  };

  const handleAirNext = async () => {
    try {
      await supabase.from('radio_current_play').update({
        station_artist: 'NEXT_TRACK',
        station_name: 'NEXT_TRACK',
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSuccess("⏭ Saltando a la siguiente canción al aire en Radio Proyecto...");
    } catch (e) {
      setError("Error al saltar pista: " + e.message);
    }
  };

  const handleAirShuffle = async () => {
    if (songs.length > 1) {
      await handleShuffleAirList();
    } else {
      await handleGoRandom(15);
    }
  };
`;

if (!content.includes('handleToggleLibraryPreview')) {
  content = content.replace(
    "const handleBroadcastDJTrack = async (track) => {",
    newHandlers + "\n  const handleBroadcastDJTrack = async (track) => {"
  );
}

// 3. Update top banner: remove select, PONER ÁLBUM AL AIRE, and IR ALEATORIO (15)
// Find the select and buttons in the top banner
const topBannerRegex = /<select[\s\S]*?<\/select>[\s\S]*?<button[\s\S]*?handlePutAlbumOnAir[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?handleGoRandom\(15\)[\s\S]*?<\/button>/;
if (topBannerRegex.test(content)) {
  content = content.replace(topBannerRegex, '');
}

// 4. Update Biblioteca Header: Add Play, Next, Aleatorio buttons and prevent text clipping
const biblioHeaderTarget = `<h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                            <FolderUp className="w-4 h-4 text-cyan-400" />
                            Biblioteca de la Carpeta
                          </h4>`;

const biblioHeaderReplacement = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="pt-1">
                              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
                                <FolderUp className="w-5 h-5 text-cyan-400" />
                                Biblioteca de la Carpeta
                              </h4>
                              <p className="text-[11px] text-gray-400 font-mono truncate max-w-xs sm:max-w-md">
                                G:\\Mi unidad\\Radio
                              </p>
                            </div>

                            {/* BOTONES PLAY, NEXT, ALEATORIO DE LA BIBLIOTECA */}
                            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
                              <button
                                onClick={handleToggleLibraryPreview}
                                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                                title="Reproducir o pausar pre-escucha de la biblioteca"
                              >
                                {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                <span>{isPlayingPreview ? 'Pausar' : 'Play'}</span>
                              </button>
                              <button
                                onClick={handleNextLibraryPreview}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                                title="Siguiente canción en biblioteca"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                                <span>Next</span>
                              </button>
                              <button
                                onClick={handleRandomLibraryPreview}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                                title="Canción aleatoria en biblioteca"
                              >
                                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Aleatorio</span>
                              </button>
                            </div>
                          </div>`;

if (content.includes(biblioHeaderTarget)) {
  content = content.replace(biblioHeaderTarget, biblioHeaderReplacement);
}

// 5. Update Biblioteca Track Row: Remove ON AIR button from individual rows
const biblioRowAirBtnRegex = /\{\/\* 3\. SWITCH DE ON AIR \(DISPARADOR AL AIRE EN VIVO\) \*\/\}[\s\S]*?<button[\s\S]*?handleBroadcastDJTrack\(track\)[\s\S]*?<\/button>/;
if (biblioRowAirBtnRegex.test(content)) {
  content = content.replace(biblioRowAirBtnRegex, '');
}

// 6. Update Cola Header: Add Switch ON AIR, Play, Next, Aleatorio, Vaciar buttons
const colaHeaderTarget = `<h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                              <Radio className="w-4 h-4 text-[#1DB954]" />
                              Cola de Emisión al Aire
                            </h4>`;

const colaHeaderReplacement = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                            <div className="pt-1">
                              <div className="flex items-center gap-2">
                                <span className="flex h-3 w-3 relative">
                                  <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full \${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'} opacity-75\`}></span>
                                  <span className={\`relative inline-flex rounded-full h-3 w-3 \${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'}\`}></span>
                                </span>
                                <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 tracking-tight">
                                  <Radio className="w-5 h-5 text-[#1DB954]" />
                                  Cola de Emisión al Aire
                                </h4>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Tanda en vivo sincronizada con Proyecto Radio y el Bat
                              </p>
                            </div>

                            {/* SWITCH ON AIR Y BOTONES PLAY, NEXT, ALEATORIO DE LA COLA */}
                            <div className="flex flex-wrap items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
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
                                title="Saltar a la siguiente canción al aire"
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
                                title="Vaciar cola de emisión"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>`;

// Replace the inner part of cola header
const oldColaHeaderSectionRegex = /<div className="flex items-center justify-between gap-2">[\s\S]*?<Radio className="w-4 h-4 text-\[#1DB954\]" \/>[\s\S]*?Cola de Emisión al Aire[\s\S]*?<\/div>[\s\S]*?<div className="flex items-center gap-1\.5 shrink-0">[\s\S]*?<\/div>[\s\S]*?<\/div>/;

if (oldColaHeaderSectionRegex.test(content)) {
  content = content.replace(oldColaHeaderSectionRegex, colaHeaderReplacement);
}

// 7. Update Cola Track Row: Remove preview button and ON AIR button completely!
// In the Cola row:
// Remove preview button:
const colaRowPreviewBtnRegex = /\{\/\* 1\. PLAY DE REVISAR \/ PRE-ESCUCHA CUE \(EN RADIO MANAGER\) \*\/\}[\s\S]*?<button[\s\S]*?handlePlayPreview\(song\)[\s\S]*?<\/button>/;
if (colaRowPreviewBtnRegex.test(content)) {
  content = content.replace(colaRowPreviewBtnRegex, '');
}

// Remove ON AIR button in Cola row:
const colaRowAirBtnRegex = /\{\/\* 2\. SWITCH ON AIR \(EN VIVO\) \*\/\}[\s\S]*?<button[\s\S]*?handleBroadcastDJTrack\(song\)[\s\S]*?<\/button>/;
if (colaRowAirBtnRegex.test(content)) {
  content = content.replace(colaRowAirBtnRegex, '');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('RadioManager.jsx updated successfully!');
