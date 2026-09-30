const fs = require('fs');
const path = require('path');

const file = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(file, 'utf8');

const targetStart = "  const handlePlayPreview = (song) => {";
const targetEnd = "  // Guardar Enlace YouTube";

const sIdx = content.indexOf(targetStart);
const eIdx = content.indexOf(targetEnd);

console.log("Indices:", { sIdx, eIdx });

if (sIdx === -1 || eIdx === -1) {
  console.error("Could not find start or end target");
  process.exit(1);
}

// Find preceding comment if any
const beforeSlice = content.substring(0, sIdx);
const lastCommentIdx = beforeSlice.lastIndexOf("// Manejo de Reproduc");
const actualStart = (lastCommentIdx !== -1 && sIdx - lastCommentIdx < 100) ? lastCommentIdx : sIdx;

const replacementCode = `// Resolver URL de reproducción para preview privado (audífonos del DJ) en Radio Manager
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
  };

  `;

content = content.substring(0, actualStart) + replacementCode + content.substring(eIdx);
fs.writeFileSync(file, content, 'utf8');
console.log("Successfully inserted all handlers including handleSyncWithBat!");
