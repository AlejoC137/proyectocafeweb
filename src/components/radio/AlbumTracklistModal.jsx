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
      <div className="relative w-full max-w-2xl border-[3.5px] border-black dark:border-slate-700 bg-white dark:bg-[#12131C] text-black dark:text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden flex flex-col max-h-[90dvh] pb-safe">
        
        {/* Input oculto de archivos audio */}
        <input 
          type="file"
          ref={fileInputRef}
          accept="audio/*,.mp3"
          multiple
          className="hidden"
          onChange={handleFileAdd}
        />

        {/* Cabecera del Modal Compacta estilo Spotify */}
        <div className="relative p-4 border-b-[2.5px] border-black dark:border-slate-700 bg-yellow-300 dark:bg-yellow-400 text-black flex items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border-[2.5px] border-black flex-shrink-0 overflow-hidden bg-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <img 
              src={album.cover} 
              alt={album.albumName} 
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'; }}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-0.5 pr-6">
            <div className="flex items-center gap-1.5">
              <span className="bg-black text-white px-1.5 py-0.5 text-[8px] font-mono font-black uppercase">Álbum</span>
              <span className="text-[10px] font-extrabold uppercase truncate">{album.genre || 'General'}</span>
            </div>

            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight leading-tight text-black truncate">
              {album.albumName}
            </h2>

            <p className="text-[11px] font-black uppercase text-black/80 truncate">
              {album.artistName} • {album.year || '2026'} • {tracks.length} {tracks.length === 1 ? 'pista' : 'pistas'} ({formatTime(tracks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0))})
            </p>

            {/* Acciones Rápidas del Álbum */}
            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
              <button
                onClick={() => {
                  if (onPlayAlbum) onPlayAlbum(album);
                  if (onPlayTrack && tracks[0]) onPlayTrack(tracks[0]);
                }}
                className="px-2.5 py-1 border-[2px] border-black bg-[#1DB954] text-black hover:bg-emerald-400 font-black uppercase text-[10px] transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" /> Reproducir
              </button>

              <button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 border-[2px] border-black bg-black text-white font-black uppercase text-[10px] hover:bg-gray-800 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 disabled:opacity-50"
                title="Subir canciones MP3 directamente a este álbum"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} + MP3
              </button>

              {onEditAlbum && (
                <button
                  onClick={() => {
                    onClose();
                    onEditAlbum(album);
                  }}
                  className="px-2.5 py-1 border-[2px] border-black bg-white text-black font-black uppercase text-[10px] hover:bg-gray-200 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition rounded-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Estado de Carga / Mensajes */}
        {uploadStatus && (
          <div className="px-3 py-1.5 bg-black text-yellow-300 border-b-[2px] border-black text-[11px] font-mono font-bold flex items-center gap-2 justify-between">
            <span>⚡ {uploadStatus}</span>
            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1DB954]" />}
          </div>
        )}

        {/* Buscador de Pistas */}
        <div className="px-3 py-2 bg-cream-bg dark:bg-[#0d0e15] border-b-[2px] border-black dark:border-slate-700 flex items-center justify-between gap-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="🔍 Filtrar pistas del álbum..."
            className="w-full px-2.5 py-1 border-[1.5px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-[11px] font-bold uppercase outline-none focus:border-[#1DB954]"
          />
        </div>

        {/* Lista de Canciones Compacta */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/10 dark:divide-slate-800">
          {filteredTracks.length === 0 ? (
            <div className="p-6 text-center text-gray-500 font-mono text-xs">
              No se encontraron canciones en este álbum. Pulsa <strong>"+ MP3"</strong> para agregar temas.
            </div>
          ) : (
            filteredTracks.map((song, index) => (
              <div 
                key={song.id || index}
                onClick={() => onPlayTrack && onPlayTrack(song)}
                className="group flex items-center justify-between px-3 py-1.5 hover:bg-yellow-300/25 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-[10px] font-mono font-bold text-gray-400 group-hover:hidden">
                    {index + 1}
                  </span>
                  <Play className="w-3.5 h-3.5 hidden group-hover:block text-[#1DB954] fill-current flex-shrink-0" />

                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black uppercase text-black dark:text-white truncate leading-tight">
                      {song.title}
                    </h4>
                    <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate leading-tight">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold text-gray-400">
                    {formatTime(song.duration || 180)}
                  </span>

                  {onDeleteTrack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrack(song.id);
                        setLocalTracks(prev => prev.filter(t => t.id !== song.id));
                      }}
                      className="p-1 border-[1.5px] border-black bg-red-500 text-white hover:bg-red-600 transition opacity-70 group-hover:opacity-100"
                      title="Eliminar esta canción del álbum"
                    >
                      <Trash2 className="w-3 h-3" />
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
