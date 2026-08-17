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
  const [mobileTab, setMobileTab] = useState('player'); // 'agenda', 'player', 'menu'
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
  
  // Hoist shared states needed for player and radioData
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
    isApplyingRemoteChange,
    currentTrackIndex,
    setCurrentTrackIndex
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

    if (currentPlay.tab === 'youtube' || activeTab === 'youtube') {
      player.audioRef.current?.pause();
      setIsPlaying(Boolean(currentPlay.is_playing));
      setTimeout(() => { isApplyingRemoteChange.current = false; }, 500);
      return;
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
    setIsPlaying(true);

    if (activeTab === 'youtube' || currentTrack?.type === 'youtube') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('YT_FORCE_PLAY'));
      }, 150);
      return;
    }

    if (player.pendingPlayRef.current && player.audioRef.current) {
      player.audioRef.current.src = player.pendingPlayRef.current;
      player.audioRef.current.volume = player.isMuted ? 0 : player.volume;
      const promise = player.audioRef.current.play();
      if (promise !== undefined) {
        promise.then(() => setIsPlaying(true)).catch((err) => {
          if (err.name === 'AbortError' || err.message?.includes('interrupted') || err.message?.includes('new load request')) {
            return;
          }
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
          if (err.name === 'AbortError' || err.message?.includes('interrupted') || err.message?.includes('new load request')) {
            return;
          }
          console.warn("Autoplay fallback:", err.message);
          setIsPlaying(false);
        });
      }
    }
  };

  // Dark mode state with persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('proyecto_radio_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('proyecto_radio_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const borderColor = "border-[#1F2937] dark:border-slate-700";
  const shadowColor = "shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] dark:shadow-[6px_6px_0px_0px_rgba(239,68,68,0.5)]";

  return (
    <div className={`w-full min-h-screen relative font-sans overflow-x-hidden pb-8 transition-colors duration-300 ${
      isDarkMode ? 'dark bg-[#0b0c10] text-white' : 'bg-cream-bg text-black'
    }`}>
      

      <RadioHeader 
        isPlaying={isPlaying}
        nowPlaying={radioData.nowPlaying}
        currentTrack={currentTrack}
        isSyncing={isSyncing}
        isDailyLoop={player.isDailyLoop}
        setIsDailyLoop={player.setIsDailyLoop}
        setShowInfoModal={player.setShowInfoModal}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* LAYOUT PRINCIPAL */}
      <div className="relative z-10 px-4 lg:px-6 pb-8 mx-auto w-full" style={{ maxWidth: '1600px' }}>
        
        {/* MOBILE TABS SWITCHER */}
        <div className="lg:hidden flex border-[3px] border-black bg-cream-bg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 rounded-none overflow-hidden">
          <button 
            onClick={() => setMobileTab('agenda')}
            className={`flex-1 py-3 px-2 font-black uppercase text-xs sm:text-sm border-r-[3px] border-black transition-colors ${mobileTab === 'agenda' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            Agenda
          </button>
          <button 
            onClick={() => setMobileTab('player')}
            className={`flex-1 py-3 px-2 font-black uppercase text-xs sm:text-sm border-r-[3px] border-black transition-colors ${mobileTab === 'player' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            Radio
          </button>
          <button 
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-3 px-2 font-black uppercase text-xs sm:text-sm transition-colors ${mobileTab === 'menu' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
          >
            Menú
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 xl:gap-16">
          
          <div className={`${mobileTab === 'agenda' ? 'block' : 'hidden'} lg:block`}>
            <AgendaColumn {...cafeData} />
          </div>

          <div className={`flex-col gap-4 ${mobileTab === 'player' ? 'flex' : 'hidden'} lg:flex`}>
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
              setIsPlaying={setIsPlaying}
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
              activeTab={activeTab}
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

          <div className={`${mobileTab === 'menu' ? 'block' : 'hidden'} lg:block`}>
            <MenuColumn {...cafeData} />
          </div>
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
          if (isPlaying && currentTrack?.url && activeTab !== 'youtube' && currentTrack?.type !== 'youtube') {
            setAudioError(`No se pudo cargar "${currentTrack.title}". Prueba con otra señal.`);
            setIsPlaying(false);
          }
        }}
        onEnded={player.handleTrackEnded}
      />
    </div>
  );
}
