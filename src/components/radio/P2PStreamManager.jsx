import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Radio, 
  Download, 
  Play, 
  Pause, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Server, 
  Wifi, 
  Layers, 
  ExternalLink,
  PlusCircle,
  Volume2
} from 'lucide-react';
import supabase from '../../config/supabaseClient';

export default function P2PStreamManager({ onPlayTrackInDeck, onQueueTrack }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeTransferId, setActiveTransferId] = useState(null);
  const [transferStatus, setTransferStatus] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  // Polling para estados de buffering
  const pollTimerRef = useRef(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/p2p-search?q=${encodeURIComponent(query.trim())}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('La pasarela P2P no devolvió una respuesta JSON válida.');
      }
      const data = await res.json();
      setResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        setError(`No se encontraron resultados para "${query}".`);
      }
    } catch (err) {
      console.error('[P2PStreamManager] Error buscando:', err);
      setError('Fallo de conexión con la pasarela P2P.');
    } finally {
      setIsSearching(false);
    }
  };

  // Iniciar adquisición y streaming progresivo para una pista
  const handleStartStream = async (track, targetAction = 'deck') => {
    try {
      setActiveTransferId(track.id);
      setToastMsg(`Iniciando conexión con peer para "${track.title}"...`);

      const params = new URLSearchParams({
        id: track.id,
        title: track.title || '',
        artist: track.artist || '',
        filePath: track.filePath || '',
        fileName: track.fileName || '',
        streamUrl: track.streamUrl || ''
      });

      const res = await fetch(`/api/p2p-transfer?${params.toString()}`);
      if (!res.ok) throw new Error('Error solicitando slot al peer');
      const data = await res.json();
      const transfer = data.transfer;

      setTransferStatus(prev => ({
        ...prev,
        [track.id]: transfer
      }));

      // Si el buffer ya está listo o se resolvió de inmediato
      const streamUrl = `/api/p2p-stream?id=${encodeURIComponent(track.id)}${track.filePath ? `&path=${encodeURIComponent(track.filePath)}` : ''}`;
      const streamTrack = {
        ...track,
        url: streamUrl,
        station_url: streamUrl,
        isP2PStream: true
      };

      if (targetAction === 'deck' && onPlayTrackInDeck) {
        onPlayTrackInDeck(streamTrack);
        setToastMsg(`🎧 Reproduciendo stream progresivo: "${track.title}"`);
      } else if (targetAction === 'queue' && onQueueTrack) {
        await onQueueTrack(streamTrack);
        setToastMsg(`📻 Añadido a la cola al aire: "${track.title}"`);
      }
    } catch (err) {
      setError(`Error en transferencia P2P: ${err.message}`);
    } finally {
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Agregar a la tabla de base de datos Supabase playlist_radio
  const handleAddToSupabasePlaylist = async (track) => {
    try {
      setToastMsg(`Guardando "${track.title}" en la Cola de Emisión...`);
      const streamUrl = `/api/p2p-stream?id=${encodeURIComponent(track.id)}${track.filePath ? `&path=${encodeURIComponent(track.filePath)}` : ''}`;

      const { data, error } = await supabase.from('playlist_radio').insert([{
        title: track.title,
        artist: track.artist || 'P2P Stream',
        album: track.album || 'P2P Downloads',
        url: streamUrl,
        cover: track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        duration: track.duration || 180,
        genre: 'P2P Audio'
      }]).select();

      if (error) throw error;
      setToastMsg(`✅ "${track.title}" añadida con éxito a la Cola permanente.`);
    } catch (err) {
      setError(`No se pudo guardar en Supabase: ${err.message}`);
    } finally {
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="bg-[#181818] p-4 rounded-2xl border border-white/10 shadow-2xl space-y-4">
      {/* Header del Gestor P2P */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-black shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              P2P Audio Stream Gateway
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-500/30 uppercase tracking-widest">
                Informe Arquitectura
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Buscador federado y streaming desacoplado con búfer progresivo (HTTP Chunked & Ranges)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Gateway Activo: 0ms TTFB Local</span>
        </div>
      </div>

      {/* Toast Notificación */}
      {toastMsg && (
        <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Buscador P2P */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por artista, álbum o tema en la red P2P y catálogo federado..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-cyan-500/20"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Buscar P2P</span>
        </button>
      </form>

      {/* Resultados de la red */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
          <span>Resultados Encontrados ({results.length})</span>
          <span className="text-[10px] text-gray-500">Auto-priorización por velocidad y slots</span>
        </div>

        {results.length === 0 && !isSearching && (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-black/20 text-gray-500 text-xs font-semibold">
            Ingresa un término para consultar peers locales y la red abierta federada.
          </div>
        )}

        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {results.map((track) => {
            const isProcessing = activeTransferId === track.id;
            const currentTransfer = transferStatus[track.id];

            return (
              <div 
                key={track.id}
                className="p-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-cyan-500/30 rounded-xl transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                {/* Info de la pista */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shrink-0 relative">
                    <img 
                      src={track.cover} 
                      alt="" 
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'; }}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">{track.title}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-cyan-400 shrink-0">
                        {track.bitrate || 'MP3'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {track.artist} {track.album ? `• ${track.album}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
                      <span className="text-emerald-400 font-bold">{track.peerStatus}</span>
                      <span>•</span>
                      <span>Velocidad: {track.speed}</span>
                      <span>•</span>
                      <span>{Math.floor((track.duration || 180) / 60)}:{(Math.floor((track.duration || 180) % 60)).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Reproducción en Decks / Cola */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                  {/* Probar en Deck Azul (CUE) */}
                  <button
                    onClick={() => handleStartStream(track, 'deck')}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 touch-manipulation"
                    title="Reproducir de inmediato en el Deck Azul (CUE)"
                  >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>Escuchar en Deck</span>
                  </button>

                  {/* Añadir a Cola Permanente */}
                  <button
                    onClick={() => handleAddToSupabasePlaylist(track)}
                    className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white rounded-lg transition touch-manipulation"
                    title="Añadir a la lista de canciones permanentemente"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
