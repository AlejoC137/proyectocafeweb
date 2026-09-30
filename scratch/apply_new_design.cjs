const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Asegurar importación de Shuffle y Radio desde lucide-react
if (!content.includes('Shuffle,') && !content.includes(', Shuffle')) {
  content = content.replace("ListPlus, RotateCcw", "ListPlus, RotateCcw, Shuffle, Radio");
}

// 2. Agregar estado de Bat y catálogo después de showCreateAlbumModal
const targetModalHook = "const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);";
if (!content.includes('batCatalog')) {
  const batStateCode = `const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);

  // Biblioteca y Cola Sincronizada con el Bat
  const [batCatalog, setBatCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedAirAlbumFolder, setSelectedAirAlbumFolder] = useState('');
  const [isUpdatingAirList, setIsUpdatingAirList] = useState(false);
  const [mp3ViewMode, setMp3ViewMode] = useState('split'); // 'split' (ambos lados), 'queue' o 'library'
  const [libraryViewType, setLibraryViewType] = useState('tracks'); // 'tracks' o 'albums'
  const [expandedLibraryAlbum, setExpandedLibraryAlbum] = useState(null);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [isDraggingOverQueue, setIsDraggingOverQueue] = useState(false);
  const [onAirTrack, setOnAirTrack] = useState(null);
  const [isBatOnline, setIsBatOnline] = useState(false);

  // Comprobar latido activo del .bat
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
  };

  // Cargar biblioteca sincronizada por el .bat desde Supabase Storage
  const fetchBatCatalog = async (silent = false) => {
    try {
      if (!silent) setLoadingCatalog(true);
      const storageUrl = \`\${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Radio/catalog.json?t=\${Date.now()}\`;
      const res = await fetch(storageUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBatCatalog(data);
          setSelectedAirAlbumFolder(prev => prev || data[0]?.folderName || '');
          if (!silent) {
            const totalTracks = data.reduce((a, b) => a + (b.tracks?.length || b.trackCount || 0), 0);
            setSuccess(\`¡Biblioteca completa cargada desde el Bat! (\${data.length} álbumes, \${totalTracks} canciones).\`);
          }
          return;
        }
      }
      setBatCatalog([]);
    } catch (err) {
      console.warn("No se pudo cargar catalog.json:", err);
      setBatCatalog([]);
    } finally {
      if (!silent) setLoadingCatalog(false);
    }
  };`;
  content = content.replace(targetModalHook, batStateCode);
}

// 3. Agregar libraryTracks y modificar albumList
const targetAlbumList = `  const albumList = useMemo(() => {
    const map = new Map();`;

if (!content.includes('libraryTracks = useMemo')) {
  const replacementAlbumList = `  // Lista plana de canciones de la biblioteca del Bat
  const libraryTracks = useMemo(() => {
    const list = [];
    (batCatalog || []).forEach(alb => {
      (alb.tracks || []).forEach(t => {
        list.push({
          ...t,
          folderName: alb.folderName,
          album: alb.albumName || t.album,
          artist: t.artist || alb.artist,
          albumArtist: alb.artist,
          cover: t.cover || alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'
        });
      });
    });
    return list;
  }, [batCatalog]);

  const filteredLibraryTracks = useMemo(() => {
    if (!librarySearchQuery.trim()) return libraryTracks;
    const q = librarySearchQuery.toLowerCase();
    return libraryTracks.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [libraryTracks, librarySearchQuery]);

  const albumList = useMemo(() => {
    if (batCatalog && batCatalog.length > 0) {
      return batCatalog;
    }
    const map = new Map();`;
  content = content.replace(targetAlbumList, replacementAlbumList);
}

// 4. Modificar useEffect inicial para suscripción a radio_current_play
const targetUseEffect = `  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();
  }, []);`;

if (!content.includes("radio-bat-status")) {
  const replacementUseEffect = `  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();

    // Consultar estado inicial del bat
    supabase.from('radio_current_play').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) {
        setOnAirTrack(data);
        const online = checkBatHeartbeat(data);
        if (online) fetchBatCatalog(true);
      }
    });

    // Escuchar si el bat notifica en vivo
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

  // Monitor de latido cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      if (onAirTrack) checkBatHeartbeat(onAirTrack);
    }, 3000);
    return () => clearInterval(timer);
  }, [onAirTrack, batCatalog.length]);`;
  content = content.replace(targetUseEffect, replacementUseEffect);
}

// 5. Reemplazar handlePlayPreview y handlers de cola
const targetHandlePlayPreview = `  // Manejo de Reproducción Preview
  const handlePlayPreview = (song) => {
    if (previewTrack?.id === song.id) {
      if (isPlayingPreview) {
        audioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioRef.current.play();
        setIsPlayingPreview(true);
      }
    } else {
      setPreviewTrack(song);
      audioRef.current.src = song.url;
      audioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const playNextPreview = () => {
    if (!previewTrack || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === previewTrack.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    handlePlayPreview(songs[nextIndex]);
  };

  const playPrevPreview = () => {
    if (!previewTrack || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === previewTrack.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    handlePlayPreview(songs[prevIndex]);
  };`;

if (!content.includes("getPreviewAudioUrl")) {
  const replacementPreviewHandlers = `  // Resolver URL de reproducción para preview privado (audífonos del DJ) en Radio Manager
  const getPreviewAudioUrl = (song) => {
    if (!song) return null;
    if (song.filePath) {
      return \`/api/local-audio?path=\${encodeURIComponent(song.filePath)}\`;
    }
    if (song.url && song.url.startsWith('local://')) {
      const fileName = song.fileName || decodeURIComponent(song.url.substring(8));
      return \`/api/local-audio?file=\${encodeURIComponent(fileName)}\`;
    }
    if (song.url && (song.url.startsWith('http://') || song.url.startsWith('https://'))) {
      return song.url;
    }
    if (song.fileName) {
      return \`/api/local-audio?file=\${encodeURIComponent(song.fileName)}\`;
    }
    return null;
  };

  // Manejo de Reproducción Preview / Pre-escucha CUE en Radio Manager
  const handlePlayPreview = async (song) => {
    if (!song) return;

    if (previewTrack?.id === song.id && previewTrack?.title === song.title) {
      if (isPlayingPreview) {
        audioRef.current?.pause();
        setIsPlayingPreview(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlayingPreview(true);
      }
      return;
    }

    const audioUrl = getPreviewAudioUrl(song);
    if (!audioUrl) {
      setError(\`No se encontró archivo de audio para escuchar "\${song.title}". Asegúrate de que existe en G:\\\\Mi unidad\\\\Radio.\`);
      return;
    }

    try {
      setPreviewTrack(song);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlayingPreview(true);
        setSuccess(\`🎧 Pre-escuchando en audífonos: "\${song.title}"\`);
      }
    } catch (err) {
      console.warn("Error en reproducción preview:", err);
      setError("No se pudo iniciar la pre-escucha local: " + err.message);
      setIsPlayingPreview(false);
    }
  };

  // --- CONTROLES DE CABECERA DE LA BIBLIOTECA (PRE-ESCUCHA INTERNA) ---
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
    const randomIdx = Math.floor(Math.random() * filteredLibraryTracks.length);
    handlePlayPreview(filteredLibraryTracks[randomIdx]);
  };

  // --- CONTROLES DE CABECERA DE LA COLA (AL AIRE EN RADIO PROYECTO) ---
  // Switch Maestro ON AIR: Prender / Apagar la emisión de la cola en Radio Proyecto
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
        station_name: 'Saltando a la siguiente pista...',
        is_playing: true,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSuccess("⏭ Saltando a la siguiente canción al aire en Radio Proyecto...");
    } catch (e) {
      setError("Error saltando canción: " + e.message);
    }
  };

  const handleAirShuffle = async () => {
    if (songs.length > 1) {
      await handleShuffleAirList();
    } else {
      await handleGoRandom(15);
    }
  };

  const handleAddTrackToQueue = async (track) => {
    try {
      const nextIndex = songs.length;
      const cleanTrack = {
        title: track.title,
        artist: track.artist || track.albumArtist || 'Radio Café',
        album: track.album || 'Sencillo',
        url: track.url || \`local://\${encodeURIComponent(track.fileName)}\`,
        duration: track.duration || 210,
        cover: track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        order_index: nextIndex
      };
      const { error } = await supabase.from('playlist_radio').insert([cleanTrack]);
      if (error) throw error;
      await supabase.from('radio_current_play').update({
        station_artist: 'SYNC',
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
      setSuccess(\`➕ Canción "\${track.title}" añadida a la cola.\`);
    } catch (e) {
      setError("Error al añadir canción a la cola: " + e.message);
    }
  };

  const handlePutAlbumOnAir = async (folderName) => {
    const albumItem = (batCatalog || []).find(a => a.folderName === folderName || a.albumName === folderName) || batCatalog[0];
    if (!albumItem) return;
    setIsUpdatingAirList(true);
    try {
      const { data: currentRows } = await supabase.from('playlist_radio').select('id');
      if (currentRows && currentRows.length > 0) {
        await supabase.from('playlist_radio').delete().in('id', currentRows.map(r => r.id));
      }
      const defaultCover = albumItem.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400';
      const tracksToInsert = (albumItem.tracks || []).map((t, idx) => ({
        title: t.title,
        artist: t.artist || albumItem.artist || 'Radio Café',
        album: albumItem.albumName,
        url: \`local://\${encodeURIComponent(t.fileName)}\`,
        duration: t.duration || 210,
        cover: t.cover || defaultCover,
        genre: t.genre || albumItem.genre || 'Radio',
        year: t.year || albumItem.year || '2024',
        order_index: idx
      }));
      const { error: insErr } = await supabase.from('playlist_radio').insert(tracksToInsert);
      if (insErr) throw insErr;
      await supabase.from('radio_current_play').update({
        station_artist: \`ALBUM:\${albumItem.albumName}\`,
        station_name: \`Cambiando a \${albumItem.albumName}...\`,
        is_playing: true,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
      setSuccess(\`📻 ¡Álbum "\${albumItem.albumName}" cargado en la cola al aire!\`);
    } catch (err) {
      setError("Error al poner álbum: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const handleGoRandom = async (count = 15) => {
    if (!batCatalog || batCatalog.length === 0) {
      setError("Primero inicia el .bat para cargar la biblioteca y armar la cola aleatoria.");
      return;
    }
    setIsUpdatingAirList(true);
    try {
      const allTracks = [];
      batCatalog.forEach(alb => {
        (alb.tracks || []).forEach(t => {
          allTracks.push({ ...t, albumArtist: alb.artist, albumCover: alb.cover });
        });
      });
      if (allTracks.length === 0) return;
      const shuffled = [...allTracks].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      const { data: currentRows } = await supabase.from('playlist_radio').select('id');
      if (currentRows && currentRows.length > 0) {
        await supabase.from('playlist_radio').delete().in('id', currentRows.map(r => r.id));
      }
      const tracksToInsert = selected.map((t, idx) => ({
        title: t.title,
        artist: t.artist || t.albumArtist || 'Radio Café',
        album: t.album || 'Mix Aleatorio',
        url: \`local://\${encodeURIComponent(t.fileName)}\`,
        duration: t.duration || 210,
        cover: t.cover || t.albumCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        order_index: idx
      }));
      await supabase.from('playlist_radio').insert(tracksToInsert);
      await supabase.from('radio_current_play').update({
        station_artist: 'START_BROADCAST',
        station_name: 'Mix Aleatorio Dinámico',
        is_playing: true,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
      setSuccess(\`🔀 ¡Cola aleatoria de \${selected.length} canciones cargada y transmitiendo al aire!\`);
    } catch (err) {
      setError("Error generando cola: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const handleShuffleAirList = async () => {
    if (songs.length <= 1) return;
    setIsUpdatingAirList(true);
    try {
      const shuffled = [...songs].sort(() => 0.5 - Math.random());
      for (let i = 0; i < shuffled.length; i++) {
        await supabase.from('playlist_radio').update({ order_index: i }).eq('id', shuffled[i].id);
      }
      await supabase.from('radio_current_play').update({
        station_artist: "SYNC",
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      await fetchSongs();
      setSuccess("🔀 ¡Cola de reproducción mezclada aleatoriamente!");
    } catch (err) {
      setError("Error al mezclar cola: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const handleMoveAirTrack = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= songs.length) return;
    try {
      const newSongs = [...songs];
      const temp = newSongs[index];
      newSongs[index] = newSongs[targetIndex];
      newSongs[targetIndex] = temp;
      setSongs(newSongs);
      await supabase.from('playlist_radio').update({ order_index: index }).eq('id', newSongs[index].id);
      await supabase.from('playlist_radio').update({ order_index: targetIndex }).eq('id', newSongs[targetIndex].id);
      await supabase.from('radio_current_play').update({
        station_artist: "SYNC",
        updated_at: new Date().toISOString()
      }).eq('id', 1);
    } catch (err) {
      fetchSongs();
    }
  };

  const handleRemoveAirTrack = async (songId) => {
    try {
      setSongs(prev => prev.filter(s => s.id !== songId));
      await supabase.from('playlist_radio').delete().eq('id', songId);
      await supabase.from('radio_current_play').update({
        station_artist: "SYNC",
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSuccess("Pista quitada de la cola de emisión.");
    } catch (err) {
      setError("Error al quitar pista: " + err.message);
    }
  };

  const handleClearQueue = async () => {
    if (!window.confirm("¿Seguro que deseas vaciar la cola de reproducción al aire? La emisión en el Bat y en la web se pausará.")) return;
    try {
      const { data: currentRows } = await supabase.from('playlist_radio').select('id');
      if (currentRows && currentRows.length > 0) {
        await supabase.from('playlist_radio').delete().in('id', currentRows.map(r => r.id));
      }
      await supabase.from('radio_current_play').update({
        station_name: 'Estacion en Pausa',
        station_artist: 'PAUSED',
        is_playing: false,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSongs([]);
      setSuccess("Cola de reproducción vaciada y emisión pausada.");
    } catch (e) {
      setError("Error al vaciar cola: " + e.message);
    }
  };

  const handleSyncWithBat = async () => {
    setIsUpdatingAirList(true);
    try {
      const { data } = await supabase.from('radio_current_play').select('*').eq('id', 1).single();
      const online = checkBatHeartbeat(data);
      if (!online) {
        setBatCatalog([]);
        setError("El .bat no está abierto. Inicia 'iniciar_radio.bat' en G:\\\\Mi unidad\\\\Radio para conectar la biblioteca.");
        setIsUpdatingAirList(false);
        return;
      }
      await fetchBatCatalog(false);
      await fetchSongs();
      await supabase.from('radio_current_play').update({
        station_artist: "SYNC",
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      setSuccess("🔄 ¡Sincronizado con el Bat en vivo!");
    } catch (err) {
      setError("Error al sincronizar: " + err.message);
    } finally {
      setIsUpdatingAirList(false);
    }
  };

  const playNextPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    if (!previewTrack) {
      handlePlayPreview(filteredLibraryTracks[0]);
      return;
    }
    const currIdx = filteredLibraryTracks.findIndex(t => t.id === previewTrack.id || t.title === previewTrack.title);
    const nextIdx = (currIdx + 1) % filteredLibraryTracks.length;
    handlePlayPreview(filteredLibraryTracks[nextIdx]);
  };

  const playPrevPreview = () => {
    if (filteredLibraryTracks.length === 0) return;
    if (!previewTrack) {
      handlePlayPreview(filteredLibraryTracks[0]);
      return;
    }
    const currIdx = filteredLibraryTracks.findIndex(t => t.id === previewTrack.id || t.title === previewTrack.title);
    const prevIdx = (currIdx - 1 + filteredLibraryTracks.length) % filteredLibraryTracks.length;
    handlePlayPreview(filteredLibraryTracks[prevIdx]);
  };`;
  content = content.replace(targetHandlePlayPreview, replacementPreviewHandlers);
}

// 6. Reemplazar la sección MP3 (desde {managerTab === 'mp3' ? ( hasta ) : managerTab === 'albums' ? ()
const startMarker = "{managerTab === 'mp3' ? (";
const endMarker = ") : managerTab === 'albums' ? (";

const sStart = content.indexOf(startMarker);
const sEnd = content.indexOf(endMarker);

if (sStart === -1 || sEnd === -1) {
  console.error("Could not find start/end markers for MP3 section:", { sStart, sEnd });
  process.exit(1);
}

const newMp3Section = `{managerTab === 'mp3' ? (
          <div className="space-y-6">

            {/* BARRA SUPERIOR DE ESTADO Y VISTAS */}
            <div className="bg-[#181818] p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full \${isBatOnline ? 'bg-emerald-500' : 'bg-red-500'} opacity-75\`}></span>
                  <span className={\`relative inline-flex rounded-full h-3 w-3 \${isBatOnline ? 'bg-emerald-500' : 'bg-red-500'}\`}></span>
                </span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    PARRILLA DINÁMICA AL AIRE
                    <span className={\`text-[10px] px-2 py-0.5 rounded-full font-bold border \${
                      isBatOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }\`}>
                      {isBatOnline ? '🟢 BAT CONECTADO' : '🔴 BAT DESCONECTADO'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isBatOnline 
                      ? 'Emisión sincronizada en vivo con G:\\\\Mi unidad\\\\Radio.' 
                      : 'Inicia "iniciar_radio.bat" en tu PC para conectar la biblioteca y transmitir.'}
                  </p>
                </div>
              </div>

              {/* BOTÓN SINCRONIZAR BAT */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncWithBat}
                  disabled={isUpdatingAirList}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 border border-white/10 shadow-md disabled:opacity-50"
                  title="Recargar catálogo y sincronizar con el bat"
                >
                  <RefreshCw className={\`w-3.5 h-3.5 \${isUpdatingAirList ? 'animate-spin text-[#1DB954]' : 'text-gray-300'}\`} />
                  <span>Sincronizar Bat</span>
                </button>
              </div>
            </div>

            {/* SELECTOR DE VISTAS: SPLIT, BIBLIOTECA, COLA */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMp3ViewMode('split')}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 \${
                    mp3ViewMode === 'split'
                      ? 'bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }\`}
                >
                  <Layers className="w-3.5 h-3.5" /> Consola Dividida (DJ Split)
                </button>
                <button
                  onClick={() => setMp3ViewMode('library')}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 \${
                    mp3ViewMode === 'library'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }\`}
                >
                  <FolderUp className="w-3.5 h-3.5" /> Solo Biblioteca ({libraryTracks.length})
                </button>
                <button
                  onClick={() => setMp3ViewMode('queue')}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 \${
                    mp3ViewMode === 'queue'
                      ? 'bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }\`}
                >
                  <Radio className="w-3.5 h-3.5" /> Solo Cola Al Aire ({songs.length})
                </button>
              </div>

              <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-2">
                <span>💡 Arrastra canciones de la izquierda a la derecha para sumarlas a la cola</span>
              </div>
            </div>

            {/* GRID DUAL PANEL 50% / 50% */}
            <div className="w-full">
              <div className={\`w-full \${mp3ViewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : ''}\`}>

                {/* ========================================================================= */}
                {/* PANEL IZQUIERDO: BIBLIOTECA COMPLETA DE LA CARPETA (CON PLAY, NEXT, ALEATORIO) */}
                {/* ========================================================================= */}
                {(mp3ViewMode === 'split' || mp3ViewMode === 'library') && (
                  <div className="w-full bg-[#181818] pt-6 px-5 pb-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[780px]">
                    {/* CABECERA PANEL IZQUIERDO */}
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
                      </div>

                      {/* SUB-CABECERA: BUSCADOR Y SELECTOR DE VISTA DE BIBLIOTECA */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={librarySearchQuery}
                            onChange={e => setLibrarySearchQuery(e.target.value)}
                            placeholder="Buscar en la biblioteca local..."
                            className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                          <button
                            onClick={() => setLibraryViewType('tracks')}
                            className={\`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 \${
                              libraryViewType === 'tracks'
                                ? 'bg-cyan-500 text-black'
                                : 'text-gray-400 hover:text-white'
                            }\`}
                          >
                            <Music className="w-3 h-3" /> Canciones ({filteredLibraryTracks.length})
                          </button>
                          <button
                            onClick={() => setLibraryViewType('albums')}
                            className={\`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 \${
                              libraryViewType === 'albums'
                                ? 'bg-cyan-500 text-black'
                                : 'text-gray-400 hover:text-white'
                            }\`}
                          >
                            <Disc className="w-3 h-3" /> Álbumes ({batCatalog.length})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CUERPO DEL PANEL IZQUIERDO */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-3 space-y-1.5">
                      {!isBatOnline || batCatalog.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-gray-400">
                          <FolderUp className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                          <div>
                            <p className="text-sm font-extrabold text-white">Biblioteca no conectada</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                              Ejecuta <code>iniciar_radio.bat</code> en <code>G:\\\\Mi unidad\\\\Radio</code> para indexar tus canciones MP3.
                            </p>
                          </div>
                          <button
                            onClick={handleSyncWithBat}
                            disabled={isUpdatingAirList}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                          >
                            <RefreshCw className={\`w-3.5 h-3.5 \${isUpdatingAirList ? 'animate-spin' : ''}\`} />
                            <span>Comprobar Bat</span>
                          </button>
                        </div>
                      ) : libraryViewType === 'tracks' ? (
                        /* VISTA POR CANCIONES DE LA BIBLIOTECA */
                        filteredLibraryTracks.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-xs">
                            No se encontraron canciones que coincidan con la búsqueda.
                          </div>
                        ) : (
                          filteredLibraryTracks.map((track, idx) => {
                            const isCurrentPreview = previewTrack?.title === track.title && isPlayingPreview;
                            return (
                              <div
                                key={track.id || track.fileName || idx}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify(track));
                                }}
                                className={\`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing \${
                                  isCurrentPreview
                                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                                    : 'bg-black/40 hover:bg-white/5 border-white/5 hover:border-white/10'
                                }\`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                  <span className="text-[11px] font-mono text-gray-500 w-5 text-right shrink-0">
                                    {idx + 1}
                                  </span>

                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800 border border-white/10 relative">
                                    <img
                                      src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'}
                                      alt={track.title}
                                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className={\`text-xs font-bold truncate leading-tight \${isCurrentPreview ? 'text-cyan-400' : 'text-white'}\`} title={track.title}>
                                      {track.title}
                                    </p>
                                    <p className="text-[11px] text-gray-400 truncate" title={\`\${track.artist || track.albumArtist} • \${track.album}\`}>
                                      {track.artist || track.albumArtist} <span className="text-gray-600">•</span> {track.album}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[11px] font-mono text-gray-400 mr-1 hidden sm:inline">
                                    {formatTime(track.duration || 210)}
                                  </span>

                                  {/* BOTÓN PRE-ESCUCHA (HEADPHONES PREVIEW) */}
                                  <button
                                    onClick={() => handlePlayPreview(track)}
                                    className={\`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 \${
                                      isCurrentPreview
                                        ? 'bg-cyan-500 text-black'
                                        : 'bg-white/10 hover:bg-cyan-500 hover:text-black text-gray-300'
                                    }\`}
                                    title="Pre-escuchar en audífonos (no sale al aire)"
                                  >
                                    {isCurrentPreview ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                  </button>

                                  {/* BOTÓN AGREGAR A LA COLA */}
                                  <button
                                    onClick={() => handleAddTrackToQueue(track)}
                                    className="px-2 py-1 bg-white/10 hover:bg-[#1DB954] hover:text-black text-gray-200 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1"
                                    title="Añadir a la cola de emisión de la derecha"
                                  >
                                    <Plus className="w-3 h-3" /> Cola
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        /* VISTA POR ÁLBUMES DE LA BIBLIOTECA */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {batCatalog.map(alb => {
                            const isExpanded = expandedLibraryAlbum === (alb.folderName || alb.albumName);
                            const trackCount = alb.tracks?.length || alb.trackCount || 0;
                            return (
                              <div key={alb.folderName || alb.albumName} className="bg-black/50 border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between">
                                <div>
                                  <div className="relative aspect-video w-full overflow-hidden bg-black/60 group">
                                    <img 
                                      src={alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'} 
                                      alt={alb.albumName} 
                                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-3 flex flex-col justify-end">
                                      <h5 className="text-xs font-black text-white truncate" title={alb.albumName}>{alb.albumName}</h5>
                                      <p className="text-[11px] text-gray-300 truncate">{alb.artist}</p>
                                    </div>
                                  </div>
                                  <div className="p-3">
                                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                                      <span>{trackCount} canciones</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handlePutAlbumOnAir(alb.folderName || alb.albumName)}
                                        className="flex-1 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[11px] rounded-lg transition flex items-center justify-center gap-1"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Poner Álbum en Cola
                                      </button>
                                      <button
                                        onClick={() => setExpandedLibraryAlbum(isExpanded ? null : (alb.folderName || alb.albumName))}
                                        className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-0.5"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="border-t border-white/10 bg-black/80 p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {(alb.tracks || []).map(t => (
                                      <div key={t.id || t.fileName} className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg text-xs">
                                        <div className="min-w-0 flex-1 pr-2">
                                          <p className="text-white font-semibold truncate text-[11px]">{t.title}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => handlePlayPreview(t)}
                                            className="px-2 py-0.5 bg-white/10 hover:bg-cyan-500 hover:text-black rounded text-[10px] font-bold transition"
                                          >
                                            Escuchar
                                          </button>
                                          <button
                                            onClick={() => handleAddTrackToQueue(t)}
                                            className="px-2 py-0.5 bg-white/10 hover:bg-[#1DB954] hover:text-black rounded text-[10px] font-bold transition"
                                          >
                                            + Cola
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* PANEL DERECHO: COLA DE EMISIÓN AL AIRE (CON SWITCH ON AIR, PLAY, NEXT, ALEATORIO, VACIAR) */}
                {/* ========================================================================= */}
                {(mp3ViewMode === 'split' || mp3ViewMode === 'queue') && (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOverQueue(true); }}
                    onDragLeave={() => setIsDraggingOverQueue(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDraggingOverQueue(false);
                      const rawData = e.dataTransfer.getData('application/json');
                      if (rawData) {
                        try {
                          const droppedTrack = JSON.parse(rawData);
                          await handleAddTrackToQueue(droppedTrack);
                        } catch (err) {}
                      }
                    }}
                    className={\`w-full bg-[#181818] pt-6 px-5 pb-5 rounded-2xl border-2 transition-all shadow-2xl flex flex-col h-[780px] \${
                      isDraggingOverQueue 
                        ? 'border-[#1DB954] bg-[#1DB954]/5 ring-4 ring-[#1DB954]/30 scale-[1.002]' 
                        : 'border-white/10'
                    }\`}
                  >
                    {/* CABECERA PANEL DERECHO */}
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

                      {/* BUSCADOR DENTRO DE LA COLA */}
                      <div className="relative pt-1">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Filtrar pistas de la cola..."
                          className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition"
                        />
                      </div>

                      {/* ZONA DE ARRASTRE */}
                      <div className={\`border-2 border-dashed rounded-xl p-2 text-center text-xs font-bold transition flex items-center justify-center gap-2 \${
                        isDraggingOverQueue 
                          ? 'border-[#1DB954] text-[#1DB954] bg-[#1DB954]/20 animate-pulse' 
                          : 'border-white/10 text-gray-400 bg-black/30'
                      }\`}>
                        <ListPlus className="w-4 h-4 text-[#1DB954]" />
                        <span>
                          {isDraggingOverQueue 
                            ? '¡Suelta la canción aquí para agregarla a la cola!' 
                            : 'Arrastra canciones aquí desde la izquierda o presiona [+ Cola]'}
                        </span>
                      </div>
                    </div>

                    {/* CUERPO DEL PANEL DERECHO (LISTA DE CANCIONES DE LA COLA) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-3 space-y-1.5">
                      {songs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-gray-400">
                          <Radio className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                          <div>
                            <p className="text-sm font-extrabold text-white">La cola de emisión está vacía</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                              Arrastra canciones desde el panel izquierdo, o pulsa el botón Aleatorio en la cabecera.
                            </p>
                          </div>
                          <button
                            onClick={() => handleAirShuffle()}
                            disabled={isUpdatingAirList || batCatalog.length === 0}
                            className="px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-[#1DB954]/20 disabled:opacity-50"
                          >
                            <Shuffle className="w-3.5 h-3.5" /> Cargar 15 Aleatorios
                          </button>
                        </div>
                      ) : filteredSongs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">
                          No hay canciones en la cola que coincidan con "\${searchQuery}".
                        </div>
                      ) : (
                        filteredSongs.map((song, idx) => {
                          const isOnAir = Boolean(
                            onAirTrack?.is_playing && (
                              (onAirTrack?.station_name && song.title && onAirTrack.station_name.toLowerCase().includes(song.title.toLowerCase())) ||
                              (onAirTrack?.station_name === song.title)
                            )
                          );

                          return (
                            <div
                              key={song.id || idx}
                              className={\`group flex items-center justify-between p-2 rounded-xl border transition-all \${
                                isOnAir
                                  ? 'bg-[#1DB954]/10 border-[#1DB954]/40 shadow-sm'
                                  : 'bg-black/40 hover:bg-white/5 border-white/5 hover:border-white/10'
                              }\`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                <span className="text-[11px] font-mono text-gray-500 w-5 text-right shrink-0">
                                  {idx + 1}
                                </span>

                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800 border border-white/10 relative">
                                  <img
                                    src={song.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'}
                                    alt={song.title}
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'; }}
                                    className="w-full h-full object-cover"
                                  />
                                  {isOnAir && (
                                    <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className={\`text-xs font-bold truncate leading-tight \${isOnAir ? 'text-[#1DB954]' : 'text-white'}\`} title={song.title}>
                                      {song.title}
                                    </p>
                                    {isOnAir && (
                                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black border border-red-500/30 uppercase shrink-0">
                                        AL AIRE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate" title={\`\${song.artist} • \${song.album}\`}>
                                    {song.artist} <span className="text-gray-600">•</span> {song.album}
                                  </p>
                                </div>
                              </div>

                              {/* EN LA COLA SOLO SE MUESTRAN CONTROLES DE ORDEN Y ELIMINAR (SIN PLAY Y SIN ON AIR INDIVIDUAL) */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[11px] font-mono text-gray-400 mr-1">
                                  {formatTime(song.duration)}
                                </span>

                                {/* SUBIR / BAJAR ORDEN */}
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

                                {/* ELIMINAR DE LA COLA */}
                                <button
                                  onClick={() => handleRemoveAirTrack(song.id)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                  title="Quitar de la cola de emisión"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        `;

content = content.substring(0, sStart) + newMp3Section + content.substring(sEnd);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully rebuilt RadioManager.jsx with clean architecture and dual panel headers!");
