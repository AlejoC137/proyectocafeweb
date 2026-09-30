const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Agregar isPlayingLiveSignal en el estado (junto a isPlayingPreview)
if (!content.includes('isPlayingLiveSignal')) {
  content = content.replace(
    "const [isPlayingPreview, setIsPlayingPreview] = useState(false);",
    "const [isPlayingPreview, setIsPlayingPreview] = useState(false);\n  const [isPlayingLiveSignal, setIsPlayingLiveSignal] = useState(false);"
  );
}

// 2. Reemplazar el useEffect de inicio para suscribirse a radio_current_play en tiempo real
const oldEffect = `  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();
  }, []);`;

const newEffect = `  useEffect(() => {
    fetchSongs();
    fetchYoutubeSongs();

    // Consultar estado inicial del bat y de la señal al aire
    supabase.from('radio_current_play').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) {
        setOnAirTrack(data);
        const online = checkBatHeartbeat(data);
        if (online) fetchBatCatalog(true);
      }
    });

    // Suscripción en tiempo real al estado de la señal de radio
    const channel = supabase
      .channel('radio-air-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_current_play' }, (payload) => {
        const row = payload.new;
        if (row) {
          setOnAirTrack(row);
          const online = checkBatHeartbeat(row);
          if (online && (row.station_artist === 'BAT_ONLINE' || row.station_artist === 'LIBRARY_LOADED' || row.station_name === 'BAT_READY')) {
            fetchBatCatalog(true);
          } else if (!online || row.station_artist === 'OFFLINE') {
            setIsBatOnline(false);
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

if (content.includes(oldEffect)) {
  content = content.replace(oldEffect, newEffect);
} else {
  // Normalize line endings and try
  const normOld = oldEffect.replace(/\r\n/g, '\n');
  const normContent = content.replace(/\r\n/g, '\n');
  if (normContent.includes(normOld)) {
    content = normContent.replace(normOld, newEffect);
  }
}

// 3. Mejorar handleToggleOnAirSwitch con actualización optimista inmediata y agregar handleToggleListenLive
const targetSwitchStart = "  const handleToggleOnAirSwitch = async () => {";
const targetSwitchEnd = "  const handleAirPlayPause = async () => {";

const sIdx = content.indexOf(targetSwitchStart);
const eIdx = content.indexOf(targetSwitchEnd);

if (sIdx !== -1 && eIdx !== -1) {
  const newSwitchAndListenCode = `  // Switch Maestro ON AIR: Prender / Apagar la emisión de la cola en Radio Proyecto
  const handleToggleOnAirSwitch = async () => {
    try {
      const isCurrentlyAir = Boolean(onAirTrack?.is_playing);
      const nextPlaying = !isCurrentlyAir;

      // Actualizar estado optimista INMEDIATAMENTE para que el botón y el punto se pongan ROJOS sin espera
      setOnAirTrack(prev => ({
        ...(prev || {}),
        is_playing: nextPlaying,
        station_artist: nextPlaying ? 'START_BROADCAST' : 'PAUSE_BROADCAST',
        station_name: nextPlaying ? (songs[0]?.title || prev?.station_name || 'En Vivo') : (prev?.station_name || 'En Pausa')
      }));

      if (!nextPlaying) {
        await supabase.from('radio_current_play').update({
          station_artist: 'PAUSE_BROADCAST',
          is_playing: false,
          updated_at: new Date().toISOString()
        }).eq('id', 1);
        if (isPlayingLiveSignal) {
          audioRef.current?.pause();
          setIsPlayingLiveSignal(false);
        }
        setSuccess("🔴 Switch OFF AIR: Emisión de la cola en pausa en Radio Proyecto.");
      } else {
        if (songs.length === 0 && batCatalog.length > 0) {
          await handleGoRandom(15);
        } else {
          const firstSong = songs[0];
          await supabase.from('radio_current_play').update({
            station_artist: 'START_BROADCAST',
            station_name: firstSong?.title || 'Radio Proyecto en Vivo',
            station_url: firstSong?.url || '',
            station_cover: firstSong?.cover || '',
            is_playing: true,
            updated_at: new Date().toISOString()
          }).eq('id', 1);
        }
        setSuccess("🟢 Switch ON AIR activado: ¡Transmitiendo al aire en Radio Proyecto!");
      }
    } catch (e) {
      setError("Error switch ON AIR: " + e.message);
    }
  };

  // BOTÓN: Escuchar la señal que está saliendo al aire en vivo
  const handleToggleListenLive = async () => {
    if (isPlayingLiveSignal) {
      audioRef.current?.pause();
      setIsPlayingLiveSignal(false);
      setSuccess("🔇 Dejaste de escuchar la señal en vivo.");
      return;
    }

    let liveUrl = null;
    if (onAirTrack?.station_url) {
      liveUrl = getPreviewAudioUrl(onAirTrack);
    }
    if (!liveUrl && songs.length > 0) {
      liveUrl = getPreviewAudioUrl(songs[0]);
    }

    if (!liveUrl) {
      setError("No hay pista activa en la cola para escuchar. Agrega canciones a la cola.");
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = liveUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlayingLiveSignal(true);
        setIsPlayingPreview(false);
        setSuccess(\`📻 🔴 Escuchando señal en vivo: "\${onAirTrack?.station_name || songs[0]?.title || 'Radio al Aire'}"\`);
      }
    } catch (err) {
      setError("No se pudo reproducir la señal en vivo: " + err.message);
      setIsPlayingLiveSignal(false);
    }
  };

`;

  content = content.substring(0, sIdx) + newSwitchAndListenCode + content.substring(eIdx);
}

// 4. Agregar el botón "Escuchar En Vivo" en la cabecera de la cola (junto a Play y Next)
const targetPlayBtn = `{/* PLAY / PAUSA COLA */}`;
const listenLiveButtonJSX = `{/* BOTÓN ESCUCHAR SEÑAL EN VIVO */}
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
                            <span>{isPlayingLiveSignal ? 'En Vivo' : 'Escuchar En Vivo'}</span>
                          </button>

                          {/* PLAY / PAUSA COLA */}`;

if (content.includes(targetPlayBtn) && !content.includes('handleToggleListenLive')) {
  content = content.replace(targetPlayBtn, listenLiveButtonJSX);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated RadioManager with realtime ON AIR, live audio listener button, and optimistic UI!");
