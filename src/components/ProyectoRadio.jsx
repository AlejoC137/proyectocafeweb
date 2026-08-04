import React, { useState, useRef } from 'react';
import { useRadioSync } from '../hooks/useRadioSync';
import { useCafeData } from '../hooks/useCafeData';
import { useRadioData } from '../hooks/useRadioData';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import { Radio, Play } from 'lucide-react';

import RadioHeader from './radio/RadioHeader';
import AgendaColumn from './radio/AgendaColumn';
import MenuColumn from './radio/MenuColumn';
import PlayerCenter from './radio/PlayerCenter';
import SourceTabs from './radio/SourceTabs';

export default function ProyectoRadio() {
  // 1. Sync
  const { currentPlay, broadcastPlay, broadcastStop, isSyncing } = useRadioSync();
  const isApplyingRemoteChange = useRef(false);

  // 2. Tab Local
  const [activeTab, setActiveTab] = useState('supabase');
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    player.setCurrentTrackIndex(0);
    player.setProgress(0);
    player.setCurrentTime(0);
    player.setIsPlaying(false);
    player.setAudioError(null);
  };

  // 3. Hooks
  const cafeData = useCafeData();
  
  // Create a placeholder currentTrackIndex and currentTrack first to pass to radioData? 
  // Wait, radioData needs currentTrack to fetch NowPlaying from SomaFM, 
  // and needs setCurrentTrackIndex to remove local files.
  // This is a circular dependency if we're not careful. 
  // Let's hoist states we need shared.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const radioData = useRadioData(
    activeTab, 
    null, // we can't pass currentTrack yet because it's derived from radioData
    currentTrackIndex, 
    setCurrentTrackIndex, 
    setIsPlaying, 
    setAudioError
  );

  const currentTrack = radioData.currentPlaylist[currentTrackIndex] || radioData.currentPlaylist[0];

  const player = useRadioPlayer(
    radioData.currentPlaylist,
    activeTab,
    broadcastPlay,
    broadcastStop,
    isApplyingRemoteChange
  );

  // Override player's states with hoisted states
  player.currentTrackIndex = currentTrackIndex;
  player.setCurrentTrackIndex = setCurrentTrackIndex;
  player.isPlaying = isPlaying;
  player.setIsPlaying = setIsPlaying;
  player.audioError = audioError;
  player.setAudioError = setAudioError;
  player.currentTrack = currentTrack;

  // React to remote sync changes
  React.useEffect(() => {
    if (!currentPlay || !currentPlay.station_url) return;
    isApplyingRemoteChange.current = true;

    const remoteTrack = {
      id: `sync-${Date.now()}`,
      title: currentPlay.station_name || 'Radio en Vivo',
      artist: currentPlay.station_artist || '',
      url: currentPlay.station_url,
      cover: currentPlay.station_cover || '',
      isLiveStream: true,
    };

    if (currentPlay.tab && currentPlay.tab !== 'local') {
      setActiveTab(currentPlay.tab);
    }

    player.pendingPlayRef.current = remoteTrack.url;

    if (player.audioRef.current && remoteTrack.url) {
      player.audioRef.current.src = remoteTrack.url;
      player.audioRef.current.volume = player.isMuted ? 0 : player.volume;
    }

    if (player.showAutoStart) {
      setIsPlaying(false);
    } else {
      if (currentPlay.is_playing && player.audioRef.current) {
        setIsPlaying(true);
        player.audioRef.current.play().catch((err) => {
          console.warn('[RadioSync] Autoplay bloqueado:', err.message);
          setIsPlaying(false);
        });
      } else {
        player.audioRef.current?.pause();
        setIsPlaying(false);
      }
    }

    setTimeout(() => {
      isApplyingRemoteChange.current = false;
    }, 500);
  }, [currentPlay]);

  // Sincronizar el index local si la playlist actual contiene la estación global
  React.useEffect(() => {
    if (currentPlay && radioData.currentPlaylist.length > 0) {
      const idx = radioData.currentPlaylist.findIndex(t => (t.url || t.stream_url) === currentPlay.station_url);
      if (idx !== -1 && idx !== currentTrackIndex) {
        setCurrentTrackIndex(idx);
      }
    }
  }, [currentPlay, radioData.currentPlaylist]);

  const handleAutoStart = () => {
    player.setShowAutoStart(false);
    if (player.pendingPlayRef.current && player.audioRef.current) {
      player.audioRef.current.src = player.pendingPlayRef.current;
      player.audioRef.current.volume = player.isMuted ? 0 : player.volume;
      const promise = player.audioRef.current.play();
      if (promise !== undefined) {
        promise.then(() => setIsPlaying(true)).catch((err) => {
          console.warn("Autoplay block (AutoStart):", err.message);
          setIsPlaying(false);
        });
      }
    } else if (currentTrack?.url && player.audioRef.current) {
      player.audioRef.current.src = currentTrack.url;
      player.audioRef.current.volume = player.isMuted ? 0 : player.volume;
      const promise = player.audioRef.current.play();
      if (promise !== undefined) {
        promise.then(() => setIsPlaying(true)).catch((err) => {
          console.warn("Autoplay fallback:", err.message);
          setIsPlaying(false);
        });
      }
    }
  };

  const borderColor = "border-[#1F2937]";
  const shadowColor = "shadow-[6px_6px_0px_0px_rgba(31,41,55,1)]";

  return (
    <div className="w-full min-h-screen bg-cream-bg text-black relative font-sans overflow-x-hidden pb-8">
      
      {/* Marquee Header Estilo EventosOffer */}
      <section className={`w-full bg-yellow-100 border-b-[3px] ${borderColor} py-2 rounded-none shadow-[0px_4px_0px_0px_rgba(31,41,55,1)] mb-4 overflow-hidden flex items-center h-12 box-border relative z-10`}>
          <style>{`
            @keyframes marquee-radio {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-radio {
              display: flex;
              width: max-content;
              animation: marquee-radio 15s linear infinite;
            }
          `}</style>
          <div className="animate-marquee-radio text-lg md:text-xl font-black uppercase tracking-[0.2em] whitespace-nowrap flex items-center" style={{ fontFamily: "'First Bunny', sans-serif" }}>
              <span className="px-12">• PROYECTO CAFÉ RADIO • ON AIR •</span>
              <span className="px-12">• SELECCIÓN CURADA • ON AIR •</span>
              <span className="px-12">• PROYECTO CAFÉ RADIO • ON AIR •</span>
              <span className="px-12">• SELECCIÓN CURADA • ON AIR •</span>
          </div>
      </section>

      <RadioHeader 
        isPlaying={isPlaying}
        nowPlaying={radioData.nowPlaying}
        currentTrack={currentTrack}
        isSyncing={isSyncing}
        isDailyLoop={player.isDailyLoop}
        setIsDailyLoop={player.setIsDailyLoop}
        setShowInfoModal={player.setShowInfoModal}
      />

      {/* BANNER AHORA SUENA */}
      {isPlaying && radioData.nowPlaying?.title && activeTab === 'somafm' && (
        <div className="relative z-10 mx-auto px-4 mb-4" style={{ maxWidth: '1600px' }}>
          <div className="flex items-center gap-3 px-4 py-2 border-[3px] border-black bg-yellow-100 text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
            <span className="w-3 h-3 border-[2px] border-black bg-red-500 animate-ping flex-shrink-0" />
            <span className="tracking-widest">AHORA SUENA:</span>
            <span className="truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>{radioData.nowPlaying.title}</span>
            {radioData.nowPlaying.artist && <span className="truncate text-black/70">— {radioData.nowPlaying.artist}</span>}
            {radioData.nowPlaying.album && <span className="hidden md:inline truncate text-black/50">· {radioData.nowPlaying.album}</span>}
          </div>
        </div>
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="relative z-10 px-4 lg:px-6 pb-8 mx-auto w-full" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 xl:gap-16">
          
          <AgendaColumn {...cafeData} />

          <div className="flex flex-col gap-4">
            <PlayerCenter 
              currentTrack={{
                ...currentTrack,
                // Si la URL que está sonando es la global, garantizamos que el título y cover vengan del global para evitar desajustes
                title: (player.audioRef.current?.src === currentPlay?.station_url) ? currentPlay?.station_name : (currentTrack?.title || currentPlay?.station_name || 'Selecciona una estación'),
                artist: (player.audioRef.current?.src === currentPlay?.station_url) ? currentPlay?.station_artist : (currentTrack?.artist || currentPlay?.station_artist || ''),
                cover: (player.audioRef.current?.src === currentPlay?.station_url) ? currentPlay?.station_cover : (currentTrack?.cover || currentPlay?.station_cover),
                isLiveStream: currentTrack?.isLiveStream ?? true,
                url: currentTrack?.url || currentPlay?.station_url
              }}
              nowPlaying={radioData.nowPlaying}
              isPlaying={isPlaying}
              volume={player.volume}
              isMuted={player.isMuted}
              handleVolumeChange={player.handleVolumeChange}
              toggleMute={player.toggleMute}
              progress={player.progress}
              handleSeek={player.handleSeek}
              currentTime={player.currentTime}
              duration={player.duration}
              formatTime={player.formatTime}
              isShuffle={player.isShuffle}
              setIsShuffle={player.setIsShuffle}
              prevTrack={player.prevTrack}
              togglePlay={player.togglePlay}
              nextTrack={player.nextTrack}
              isRepeatSingle={player.isRepeatSingle}
              setIsRepeatSingle={player.setIsRepeatSingle}
              audioError={audioError}
            />

            <SourceTabs 
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              currentTrackIndex={currentTrackIndex}
              setCurrentTrackIndex={setCurrentTrackIndex}
              setIsPlaying={setIsPlaying}
              broadcastPlay={broadcastPlay}
              isApplyingRemoteChange={isApplyingRemoteChange}
              formattedTotalPlaylistTime={player.formatTime(radioData.totalPlaylistSeconds)}
              quotaPercent={Math.min(100, Math.round((radioData.totalPlaylistSeconds / 14400) * 100))}
              {...radioData}
            />
          </div>

          <MenuColumn {...cafeData} />
        </div>
      </div>

      {/* OVERLAY AUTO-START */}
      {player.showAutoStart && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer bg-cream-bg bg-opacity-95 backdrop-blur-sm p-4"
          onClick={handleAutoStart}
        >
          {currentPlay?.station_cover && (
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none grayscale">
              <img src={currentPlay.station_cover} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg border-[4px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none py-10">
            <div className="relative mb-8">
              <div className="w-28 h-28 border-[4px] border-black bg-yellow-100 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <Radio className="w-14 h-14 text-black" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-widest text-black leading-tight" style={{ fontFamily: "'First Bunny', sans-serif" }}>
              Proyecto<br/>Café Radio
            </h1>
            {currentPlay?.station_name && currentPlay.station_name !== 'Esperando primera reproducción...' ? (
              <div className="mb-8 border-t-[3px] border-b-[3px] border-black py-4 w-full">
                <p className="text-sm font-bold uppercase tracking-widest mb-1 text-black">Transmisión activa:</p>
                <p className="text-xl font-black uppercase text-black">{currentPlay.station_name}</p>
                {currentPlay.station_artist && (
                  <p className="text-sm mt-1 font-bold text-black/70 uppercase">{currentPlay.station_artist}</p>
                )}
              </div>
            ) : (
              <p className="text-base font-bold uppercase tracking-widest mb-8 text-black/60 border-t-[3px] border-b-[3px] border-black py-4 w-full">
                Música curada para el café
              </p>
            )}
            <button onClick={handleAutoStart}
              className="w-20 h-20 border-[4px] border-black bg-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none mb-6"
            >
              <Play className="w-10 h-10 fill-current ml-1" />
            </button>
            <p className="text-sm font-black uppercase tracking-widest text-black">Toca para iniciar</p>
          </div>
        </div>
      )}

      {/* AUDIO ELEMENT */}
      <audio
        ref={player.audioRef}
        preload="metadata"
        referrerPolicy="no-referrer"
        onTimeUpdate={player.handleTimeUpdate}
        onError={() => {
          if (isPlaying && currentTrack?.url) {
            setAudioError(`No se pudo cargar "${currentTrack.title}". Prueba con otra señal.`);
            setIsPlaying(false);
          }
        }}
        onEnded={player.handleTrackEnded}
      />
    </div>
  );
}
