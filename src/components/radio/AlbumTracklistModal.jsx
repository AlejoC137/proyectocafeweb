import React, { useState, useRef } from 'react';
import { X, Play, Plus, Disc, Music, Clock, Trash2, Edit3, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { parseMp3Metadata } from '../../utils/id3Parser';
import { uploadAudioFileToSupabase } from '../../utils/radioUploadHelper';
import supabase from '../../config/supabaseClient';

const formatTime = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function AlbumTracklistModal({
  album,
  isOpen,
  onClose,
  onPlayTrack,
  onPlayAlbum,
  onDeleteTrack,
  onEditAlbum,
  onAddSongsToAlbum
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [localTracks, setLocalTracks] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen || !album) return null;

  const tracks = localTracks.length > 0 ? localTracks : (album.tracks || []);

  const handleFileAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadStatus(`Subiendo ${files.length} canción(es)...`);

      const addedSongs = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatus(`Analizando (${i + 1}/${files.length}): ${file.name}`);

        let metadata = { title: file.name.replace(/\.[^/.]+$/, ""), artist: album.artistName, duration: 180 };
        try {
          const parsed = await parseMp3Metadata(file);
          if (parsed.title) metadata.title = parsed.title;
          if (parsed.artist) metadata.artist = parsed.artist;
          if (parsed.duration) metadata.duration = parsed.duration;
        } catch (err) {}

        const publicUrl = await uploadAudioFileToSupabase(file, (pct) => {
          setUploadStatus(`Subiendo (${i + 1}/${files.length}): ${pct}%`);
        });

        const songRecord = {
          title: metadata.title,
          artist: metadata.artist || album.artistName || 'Desconocido',
          album: album.albumName,
          genre: album.genre || 'General',
          mood: album.mood || '',
          year: album.year || new Date().getFullYear().toString(),
          cover: album.cover,
          duration: metadata.duration || 180,
          url: publicUrl || URL.createObjectURL(file),
          order_index: tracks.length + i + 1
        };

        try {
          const { data: inserted } = await supabase
            .from('playlist_radio')
            .insert([songRecord])
            .select();

          const createdTrack = inserted?.[0] || { id: `loc-${Date.now()}-${i}`, ...songRecord };
          addedSongs.push(createdTrack);
        } catch (dbErr) {
          addedSongs.push({ id: `loc-${Date.now()}-${i}`, ...songRecord });
        }
      }

      const updatedList = [...tracks, ...addedSongs];
      setLocalTracks(updatedList);

      if (onAddSongsToAlbum) {
        onAddSongsToAlbum(album.albumName, addedSongs);
      }

      setUploadStatus(`¡${addedSongs.length} canción(es) agregada(s) exitosamente!`);
    } catch (err) {
      console.error("Error agregando canciones al álbum:", err);
      setUploadStatus("Error al subir canciones.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredTracks = tracks.filter(t => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl border-[3.5px] border-black dark:border-slate-700 bg-white dark:bg-[#12131C] text-black dark:text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Input oculto de archivos audio */}
        <input 
          type="file"
          ref={fileInputRef}
          accept="audio/*,.mp3"
          multiple
          className="hidden"
          onChange={handleFileAdd}
        />

        {/* Cabecera del Modal con Fondo de Carátula */}
        <div className="relative p-6 border-b-[3px] border-black dark:border-slate-700 bg-yellow-300 dark:bg-yellow-400 text-black flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 border-[3px] border-black flex-shrink-0 overflow-hidden bg-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <img 
              src={album.cover} 
              alt={album.albumName} 
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'; }}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono font-black uppercase">Álbum</span>
              <span className="text-xs font-extrabold uppercase">{album.genre || 'General'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none text-black">
              {album.albumName}
            </h2>

            <p className="text-xs font-black uppercase text-black/80">
              {album.artistName} • {album.year || '2026'}
            </p>

            <div className="flex items-center gap-3 pt-1 text-[11px] font-mono font-bold text-black/90">
              <span>{tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}</span>
              <span>•</span>
              <span>Duración: {formatTime(tracks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0))}</span>
            </div>

            {/* Acciones Rápidas del Álbum */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <button
                onClick={() => {
                  if (onPlayAlbum) onPlayAlbum(album);
                  if (onPlayTrack && tracks[0]) onPlayTrack(tracks[0]);
                }}
                className="px-3.5 py-1.5 border-[2.5px] border-black bg-black text-white hover:bg-emerald-400 hover:text-black font-black uppercase text-xs transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Reproducir
              </button>

              <button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 border-[2.5px] border-black bg-[#1DB954] text-black font-black uppercase text-xs hover:bg-emerald-400 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 disabled:opacity-50"
                title="Subir canciones MP3 directamente a este álbum"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Subir Canciones
              </button>

              {onEditAlbum && (
                <button
                  onClick={() => {
                    onClose();
                    onEditAlbum(album);
                  }}
                  className="px-3 py-1.5 border-[2.5px] border-black bg-white text-black font-black uppercase text-xs hover:bg-gray-200 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 border-[2.5px] border-black bg-white hover:bg-black hover:text-white transition rounded-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Estado de Carga / Mensajes */}
        {uploadStatus && (
          <div className="px-4 py-2 bg-black text-yellow-300 border-b-[2px] border-black text-xs font-mono font-bold flex items-center gap-2 justify-between">
            <span>⚡ {uploadStatus}</span>
            {isUploading && <Loader2 className="w-4 h-4 animate-spin text-[#1DB954]" />}
          </div>
        )}

        {/* Buscador de Pistas */}
        <div className="p-3 bg-cream-bg dark:bg-[#0d0e15] border-b-[2px] border-black dark:border-slate-700 flex items-center justify-between gap-3">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="🔍 Buscar canción en este álbum..."
            className="w-full px-3 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none focus:border-[#1DB954]"
          />
        </div>

        {/* Lista de Canciones */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredTracks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-mono text-xs">
              No se encontraron canciones en este álbum. Pulsa <strong>"+ SUBIR CANCIONES"</strong> para agregar temas MP3.
            </div>
          ) : (
            filteredTracks.map((song, index) => (
              <div 
                key={song.id || index}
                className="group flex items-center justify-between p-2.5 border-[2px] border-transparent hover:border-black dark:hover:border-slate-500 bg-white/5 hover:bg-yellow-300/20 dark:hover:bg-yellow-400/10 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center text-xs font-mono font-bold text-gray-400 group-hover:text-black dark:group-hover:text-white">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase text-black dark:text-white truncate">
                      {song.title}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[11px] font-mono font-bold text-gray-400">
                    {formatTime(song.duration || 180)}
                  </span>

                  <button
                    onClick={() => {
                      if (onPlayTrack) onPlayTrack(song);
                    }}
                    className="p-1.5 border-[2px] border-black bg-[#1DB954] text-black hover:bg-emerald-400 transition font-extrabold text-[10px] flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    title="Reproducir esta canción"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Reproducir
                  </button>

                  {onDeleteTrack && (
                    <button
                      onClick={() => {
                        if (onDeleteTrack) {
                          onDeleteTrack(song.id);
                          setLocalTracks(prev => prev.filter(t => t.id !== song.id));
                        }
                      }}
                      className="p-1.5 border-[2.5px] border-black bg-red-500 text-white hover:bg-red-600 transition"
                      title="Eliminar esta canción del álbum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-3 border-t-[2.5px] border-black dark:border-slate-700 bg-white dark:bg-[#12131C] flex justify-between items-center">
          <button
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border-[2px] border-black bg-[#1DB954] text-black font-black uppercase text-xs hover:bg-emerald-400 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Más Canciones MP3
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 border-[2px] border-black bg-white text-black font-black uppercase text-xs hover:bg-gray-200 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
