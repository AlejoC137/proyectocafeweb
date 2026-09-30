import re

with open('src/components/RadioManager.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add isBatOnline state and checkBatHeartbeat
old_state = "const [onAirTrack, setOnAirTrack] = useState(null);"
new_state = """const [onAirTrack, setOnAirTrack] = useState(null);
  const [isBatOnline, setIsBatOnline] = useState(false);

  // Verificar latido activo del .bat
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
  };"""

assert old_state in code, "old_state not found"
code = code.replace(old_state, new_state, 1)

# 2. Add handlers before handleBroadcastDJTrack
handlers = """  // --- CONTROLES DE LA BIBLIOTECA (PRE-ESCUCHA INTERNA EN RADIO MANAGER) ---
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

  // --- CONTROLES DE LA COLA (AL AIRE EN RADIO PROYECTO) ---
  // Switch Maestro ON AIR: Prender / Apagar la cola en Radio Proyecto
  const handleToggleOnAirSwitch = async () => {
    try {
      const isCurrentlyAir = Boolean(onAirTrack?.is_playing);
      if (isCurrentlyAir) {
        await supabase.from('radio_current_play').update({
          station_artist: 'PAUSE_BROADCAST',
          is_playing: false,
          updated_at: new Date().toISOString()
        }).eq('id', 1);
        setSuccess("🔴 Switch ON AIR apagado: Emisión de la cola en pausa en Radio Proyecto.");
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
      setError("Error al cambiar switch ON AIR: " + e.message);
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
      setError("Error al saltar canción: " + e.message);
    }
  };

  const handleAirShuffle = async () => {
    if (songs.length > 1) {
      await handleShuffleAirList();
    } else {
      await handleGoRandom(15);
    }
  };
"""

landmark_dj = "  const handleBroadcastDJTrack = async (track) => {"
assert landmark_dj in code, "landmark_dj not found"
code = code.replace(landmark_dj, handlers + "\n" + landmark_dj, 1)

# 3. In useEffect, listen to radio_current_play and init
old_use_effect = """  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();
    fetchBatCatalog(true);

    // Escuchar si el bat notifica que cargó la biblioteca
    const channel = supabase
      .channel('radio-bat-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_current_play' }, (payload) => {
        if (payload.new?.station_artist === 'LIBRARY_LOADED' || payload.new?.station_name === 'BAT_READY') {
          fetchBatCatalog(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);"""

new_use_effect = """  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();

    const initStatus = async () => {
      try {
        const { data } = await supabase.from('radio_current_play').select('*').eq('id', 1).single();
        if (data) {
          setOnAirTrack(data);
          const online = checkBatHeartbeat(data);
          if (online) fetchBatCatalog(true);
        }
      } catch (e) {}
    };
    initStatus();

    // Escuchar cambios en vivo de radio_current_play
    const channel = supabase
      .channel('radio-bat-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_current_play' }, (payload) => {
        const row = payload.new;
        if (row) {
          setOnAirTrack(row);
          const online = checkBatHeartbeat(row);
          if (online && (row.station_artist === 'BAT_ONLINE' || row.station_artist === 'LIBRARY_LOADED' || row.station_name === 'BAT_READY')) {
            fetchBatCatalog(true);
          } else if (!online || row.station_artist === 'OFFLINE') {
            setIsBatOnline(false);
            setBatCatalog([]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Comprobar heartbeat cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      if (onAirTrack) checkBatHeartbeat(onAirTrack);
    }, 3000);
    return () => clearInterval(timer);
  }, [onAirTrack, batCatalog.length]);"""

assert old_use_effect in code, "old_use_effect not found"
code = code.replace(old_use_effect, new_use_effect, 1)

# 4. In top banner: remove select, PONER ÁLBUM AL AIRE, and IR ALEATORIO (15)
# Find the actions container in the top banner
banner_block = """                {/* SELECTOR RÁPIDO Y ACCIONES DE EMISIÓN */}
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={selectedAirAlbumFolder}
                    onChange={e => setSelectedAirAlbumFolder(e.target.value)}
                    className="bg-black/80 border border-white/20 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:border-[#1DB954] focus:outline-none max-w-xs"
                  >
                    {batCatalog.length === 0 ? (
                      <option value="">(Inicia iniciar_radio.bat para ver álbumes)</option>
                    ) : (
                      batCatalog.map(alb => (
                        <option key={alb.folderName || alb.albumName} value={alb.folderName || alb.albumName}>
                          💿 {alb.artist} - {alb.albumName} ({alb.trackCount || alb.tracks?.length || 0} pistas)
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    onClick={() => handlePutAlbumOnAir(selectedAirAlbumFolder || batCatalog[0]?.folderName)}
                    disabled={isUpdatingAirList || batCatalog.length === 0}
                    className="px-4 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-[#1DB954]/20 disabled:opacity-50"
                  >
                    <Radio className="w-4 h-4 stroke-[2.5]" />
                    {isUpdatingAirList ? 'Cargando...' : 'Poner Álbum Al Aire'}
                  </button>

                  <button
                    onClick={() => handleGoRandom(15)}
                    disabled={isUpdatingAirList || batCatalog.length === 0}
                    title="Cargar 15 canciones aleatorias de toda la biblioteca"
                    className="px-3.5 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    <Shuffle className="w-3.5 h-3.5" /> Ir Aleatorio (15)
                  </button>

                  <button
                    onClick={handleShuffleAirList}
                    disabled={isUpdatingAirList || songs.length <= 1}
                    title="Mezclar aleatoriamente el orden de la tanda"
                    className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-emerald-400" /> Mezclar
                  </button>

                  <button
                    onClick={handleSyncWithBat}
                    disabled={isUpdatingAirList}
                    title="Forzar actualización y sincronización con el Bat"
                    className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${isUpdatingAirList ? 'animate-spin' : ''}`} /> Sincronizar Bat
                  </button>

                  <button
                    onClick={handleClearQueue}
                    disabled={isUpdatingAirList || songs.length === 0}
                    title="Vaciar la cola al aire y pausar emisión"
                    className="px-3 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 font-bold text-xs transition flex items-center gap-1.5 border border-red-500/30 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Vaciar
                  </button>
                </div>"""

new_banner_block = """                {/* ACCIONES Y ESTADO EN BARRA SUPERIOR */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSyncWithBat}
                    disabled={isUpdatingAirList}
                    title="Forzar actualización y sincronización con el Bat"
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 border border-white/10 shadow-md"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${isUpdatingAirList ? 'animate-spin' : ''}`} /> Sincronizar Bat
                  </button>
                </div>"""

assert banner_block in code, "banner_block not found"
code = code.replace(banner_block, new_banner_block, 1)

# 5. Left panel header: Biblioteca de la Carpeta (Fix clipping with pt-2 and add Play, Next, Aleatorio buttons)
old_biblio_top = """                    {/* CABECERA PANEL IZQUIERDO */}
                    <div className="space-y-3 pb-3 border-b border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                            <FolderUp className="w-4 h-4 text-cyan-400" />
                            Biblioteca de la Carpeta
                          </h4>
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-xs sm:max-w-md">
                            G:\\Mi unidad\\Radio
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-extrabold">
                            {filteredLibraryTracks.length} canciones
                          </span>
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold">
                            {batCatalog.length} álbumes
                          </span>
                        </div>
                      </div>"""

new_biblio_top = """                    {/* CABECERA PANEL IZQUIERDO: BIBLIOTECA DE LA CARPETA */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="pt-1">
                          <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
                            <FolderUp className="w-5 h-5 text-cyan-400" />
                            Biblioteca de la Carpeta
                          </h4>
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                            G:\\Mi unidad\\Radio
                          </p>
                        </div>

                        {/* CONTROLES DE LA BIBLIOTECA: PLAY, NEXT, ALEATORIO */}
                        <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={handleToggleLibraryPreview}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                            title="Reproducir o pausar pre-escucha en Radio Manager"
                          >
                            {isPlayingPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            <span>{isPlayingPreview ? 'Pausa' : 'Play'}</span>
                          </button>
                          <button
                            onClick={handleNextLibraryPreview}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                            title="Siguiente canción para pre-escuchar"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>Next</span>
                          </button>
                          <button
                            onClick={handleRandomLibraryPreview}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                            title="Canción aleatoria para pre-escuchar"
                          >
                            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Aleatorio</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-extrabold">
                            {filteredLibraryTracks.length} canciones
                          </span>
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold">
                            {batCatalog.length} álbumes
                          </span>
                        </div>
                      </div>"""

assert old_biblio_top in code, "old_biblio_top not found"
code = code.replace(old_biblio_top, new_biblio_top, 1)

# 6. In Biblioteca track rows: Remove ON AIR button from individual rows
old_biblio_air_btn = """                                   {/* 3. SWITCH DE ON AIR (DISPARADOR AL AIRE EN VIVO) */}
                                   <button
                                     onClick={() => handleBroadcastDJTrack(track)}
                                     className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 border shadow-sm ${
                                       isOnAir
                                         ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                         : 'bg-black/60 hover:bg-red-600/30 text-gray-300 hover:text-red-300 border-white/20'
                                     }`}
                                     title={isOnAir ? "Sonando actualmente al aire" : "Switch ON AIR: Transmitir esta canción al aire en vivo"}
                                   >
                                     <Radio className={`w-3 h-3 ${isOnAir ? 'text-white' : 'text-red-400'}`} />
                                     <span>{isOnAir ? 'EN VIVO' : 'ON AIR'}</span>
                                   </button>"""

assert old_biblio_air_btn in code, "old_biblio_air_btn not found"
code = code.replace(old_biblio_air_btn, "", 1)

# 7. Right panel header: Cola de Emisión al Aire (Add Switch ON AIR, Play, Next, Aleatorio, Vaciar)
old_cola_top = """                    {/* CABECERA PANEL DERECHO */}
                    <div className="space-y-3 pb-3 border-b border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1DB954]"></span>
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                              <Radio className="w-4 h-4 text-[#1DB954]" />
                              Cola de Emisión al Aire
                            </h4>
                          </div>
                          <p className="text-[11px] text-gray-400">
                            Tanda en vivo sincronizada con Proyecto Radio y el Bat
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2.5 py-1 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] text-[11px] font-extrabold">
                            {songs.length} pistas en cola
                          </span>
                          <button
                            onClick={handleShuffleAirList}
                            disabled={isUpdatingAirList || songs.length <= 1}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 disabled:opacity-30"
                            title="Mezclar aleatoriamente el orden de la tanda"
                          >
                            <Shuffle className="w-3 h-3 text-[#1DB954]" /> Mezclar
                          </button>
                          <button
                            onClick={handleClearQueue}
                            disabled={isUpdatingAirList || songs.length === 0}
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-red-500/20 disabled:opacity-30"
                            title="Vaciar la cola y pausar emisión"
                          >
                            <Trash2 className="w-3 h-3" /> Vaciar
                          </button>
                        </div>
                      </div>"""

new_cola_top = """                    {/* CABECERA PANEL DERECHO: COLA DE EMISIÓN AL AIRE */}
                    <div className="space-y-3 pb-3 border-b border-white/10 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="pt-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-3 w-3 ${onAirTrack?.is_playing ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 tracking-tight">
                              <Radio className="w-5 h-5 text-[#1DB954]" />
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
                            className={`px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border shadow-lg ${
                              onAirTrack?.is_playing
                                ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                : 'bg-white/10 text-gray-400 border-white/10 hover:text-white hover:bg-white/20'
                            }`}
                            title={onAirTrack?.is_playing ? "Switch ON AIR encendido: Transmitiendo en vivo en Radio Proyecto. Clic para apagar" : "Switch ON AIR apagado: Clic para prender la cola en Radio Proyecto"}
                          >
                            <span className={`w-2 h-2 rounded-full ${onAirTrack?.is_playing ? 'bg-white animate-ping' : 'bg-red-500'}`} />
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
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] text-[11px] font-extrabold">
                          {songs.length} pistas en cola
                        </span>
                      </div>"""

assert old_cola_top in code, "old_cola_top not found"
code = code.replace(old_cola_top, new_cola_top, 1)

# 8. In Cola track rows: REMOVE both [Escuchar] preview button AND [ON AIR] button completely!
old_cola_row_buttons = """                                 {/* 1. PLAY DE REVISAR / PRE-ESCUCHA CUE (EN RADIO MANAGER) */}
                                 <button
                                   onClick={() => handlePlayPreview(song)}
                                   className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 shadow-sm ${
                                     isCurrentPreview
                                       ? 'bg-emerald-500 text-black animate-pulse'
                                       : 'bg-white/10 hover:bg-emerald-500 hover:text-black text-gray-200'
                                   }`}
                                   title={isCurrentPreview ? "Pausar pre-escucha" : "Escuchar y revisar en Radio Manager (audífonos DJ)"}
                                 >
                                   {isCurrentPreview ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                                   <span className="hidden sm:inline">{isCurrentPreview ? 'Pausar' : 'Escuchar'}</span>
                                 </button>

                                 {/* REORDENAR */}
                                 <button
                                   onClick={() => handleMoveAirTrack(idx, 'up')}
                                   disabled={idx === 0}
                                   className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20"
                                   title="Subir en el orden de emisión"
                                 >
                                   <ArrowUp className="w-3.5 h-3.5" />
                                 </button>
                                 <button
                                   onClick={() => handleMoveAirTrack(idx, 'down')}
                                   disabled={idx === filteredSongs.length - 1}
                                   className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20"
                                   title="Bajar en el orden de emisión"
                                 >
                                   <ArrowDown className="w-3.5 h-3.5" />
                                 </button>

                                 {/* 2. SWITCH ON AIR (EN VIVO) */}
                                 <button
                                   onClick={() => handleBroadcastDJTrack(song)}
                                   className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 border shadow-sm ${
                                     isOnAir
                                       ? 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/50 animate-pulse'
                                       : 'bg-black/60 hover:bg-red-600/30 text-gray-300 hover:text-red-300 border-white/20'
                                     }`}
                                   title={isOnAir ? "Sonando actualmente al aire" : "Switch ON AIR: Transmitir esta canción al aire ahora mismo"}
                                 >
                                   <Radio className={`w-3 h-3 ${isOnAir ? 'text-white' : 'text-red-400'}`} />
                                   <span>{isOnAir ? 'EN VIVO' : 'ON AIR'}</span>
                                 </button>"""

new_cola_row_buttons = """                                 {/* REORDENAR */}
                                 <button
                                   onClick={() => handleMoveAirTrack(idx, 'up')}
                                   disabled={idx === 0}
                                   className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20"
                                   title="Subir en el orden de emisión"
                                 >
                                   <ArrowUp className="w-3.5 h-3.5" />
                                 </button>
                                 <button
                                   onClick={() => handleMoveAirTrack(idx, 'down')}
                                   disabled={idx === filteredSongs.length - 1}
                                   className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-20"
                                   title="Bajar en el orden de emisión"
                                 >
                                   <ArrowDown className="w-3.5 h-3.5" />
                                 </button>"""

assert old_cola_row_buttons in code, "old_cola_row_buttons not found"
code = code.replace(old_cola_row_buttons, new_cola_row_buttons, 1)

with open('src/components/RadioManager.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Python script applied changes successfully!")
