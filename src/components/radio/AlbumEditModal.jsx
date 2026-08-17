import React, { useState, useEffect, useRef } from 'react';
import { X, Disc, Save, Loader2, Music, Tag, Smile, Layers, Image as ImageIcon, Trash2 } from 'lucide-react';
import { TWO_LAYER_GENRES_MAP, PARENT_GENRES, parseTwoLayerGenre, formatTwoLayerGenre } from '../../utils/genreHelpers';
import MusicCoversGalleryModal from './MusicCoversGalleryModal';
import { uploadCoverImageToSupabase } from '../../utils/coverUploadHelper';

export const MOOD_PRESETS = [
  'Chill & Relax',
  'Enfoque & Estudio',
  'Energético & Activo',
  'Café Mañanero',
  'Fiesta & Celebración',
  'Noche Urbana & Lofi',
  'Nostálgico & Melancólico',
  'Romántico & Suave'
];

export const GENRE_PRESETS = [
  'Rock / Argentino',
  'Rock / Suave',
  'Rock / Pesado',
  'Rock / Pop',
  'Rock / Alternativo',
  'Hip Hop / Rap',
  'Hip Hop / Trap',
  'Hip Hop / Lofi Beats',
  'Hip Hop / Boom Bap',
  'Pop / Latino',
  'Pop / 80s & Retro Synth',
  'Pop / Dance',
  'Electrónica / House',
  'Electrónica / Chillout',
  'Jazz / Bossa Nova',
  'Jazz / Smooth',
  'Reggae / Dub',
  'Latino / Salsa',
  'Latino / Cumbia',
  'Metal / Heavy',
  'Metal / Thrash',
  'Indie / Folk'
];

export default function AlbumEditModal({ isOpen, onClose, albumData, album, onSave, isSaving: externalIsSaving, onDeleteAlbum }) {
  const currentAlbum = albumData || album;

  const [albumName, setAlbumName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [parentGenre, setParentGenre] = useState('Hip Hop');
  const [subGenre, setSubGenre] = useState('Rap');
  const [mood, setMood] = useState('Chill & Relax');
  const [coverUrl, setCoverUrl] = useState('');
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de Galería musicCovers
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const coverFileInputRef = useRef(null);

  useEffect(() => {
    if (currentAlbum) {
      setAlbumName(currentAlbum.name || currentAlbum.albumName || '');
      setArtistName(currentAlbum.artist || currentAlbum.artistName || 'Varios');
      
      const parsed = parseTwoLayerGenre(currentAlbum.genre || 'Hip Hop / Rap');
      setParentGenre(parsed.parent || 'Hip Hop');
      setSubGenre(parsed.sub || 'Rap');
      
      setMood(currentAlbum.mood || 'Chill & Relax');
      setCoverUrl(currentAlbum.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400');
    }
  }, [currentAlbum]);

  if (!isOpen || !currentAlbum) return null;

  const songCount = currentAlbum.songCount || currentAlbum.tracks?.length || currentAlbum.count || 0;
  const originalName = currentAlbum.name || currentAlbum.albumName || '';
  const isSaving = externalIsSaving || isSavingLocal;

  const availableSubGenres = TWO_LAYER_GENRES_MAP[parentGenre] || ['General', 'Clásico', 'Suave', 'Pesado', 'Nacional', 'Urbano'];

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadedUrl = await uploadCoverImageToSupabase(file, albumName, artistName);
      if (uploadedUrl) {
        setCoverUrl(uploadedUrl);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!albumName.trim()) {
      setErrorMsg('El nombre del álbum es obligatorio');
      return;
    }
    setIsSavingLocal(true);
    setErrorMsg('');
    try {
      const combinedGenre = formatTwoLayerGenre(parentGenre, subGenre);

      const updatedFields = {
        name: albumName.trim(),
        albumName: albumName.trim(),
        artist: artistName.trim(),
        artistName: artistName.trim(),
        genre: combinedGenre,
        subgenre: subGenre.trim(),
        category: combinedGenre,
        mood: mood.trim(),
        cover: coverUrl.trim(),
        year: currentAlbum.year || new Date().getFullYear().toString()
      };

      if (currentAlbum.tracks) {
        await onSave(currentAlbum, updatedFields);
      } else {
        await onSave(originalName, updatedFields);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar el álbum');
    } finally {
      setIsSavingLocal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg border-[3.5px] border-black dark:border-slate-700 bg-white dark:bg-[#12131C] text-black dark:text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-[3px] border-black dark:border-slate-700 bg-yellow-300 dark:bg-yellow-400 text-black">
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-sm">
            <Disc className="w-5 h-5 animate-spin-slow" />
            <span>Editar Álbum ({songCount} pistas)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition rounded-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 border-[2px] border-black bg-red-100 text-red-700 font-bold text-xs uppercase">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Vista previa de Portada e Info */}
          <div className="flex items-center gap-4 p-3 border-[2px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15]">
            <input
              type="file"
              ref={coverFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCoverFileUpload}
            />
            
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                onClick={() => setShowGalleryModal(true)}
                className="w-16 h-16 border-[2px] border-black overflow-hidden bg-black relative group cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="Haz clic para seleccionar portada de la galería o subir nueva"
              >
                <img
                  src={coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'}
                  alt="Vista previa"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition p-0.5 text-center">
                  <ImageIcon className="w-4 h-4 text-white" />
                  <span className="text-[7px] font-black uppercase text-white leading-tight">Cambiar</span>
                </div>
              </div>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="px-1 py-0.5 border border-black bg-white hover:bg-black hover:text-white text-[7px] font-extrabold uppercase"
                >
                  📁 Subir
                </button>
                <button
                  type="button"
                  onClick={() => setShowGalleryModal(true)}
                  className="px-1 py-0.5 border border-black bg-yellow-300 text-black text-[7px] font-extrabold uppercase"
                >
                  🖼️ Galería
                </button>
              </div>
            </div>

            <div className="truncate flex-1">
              <p className="text-xs font-black uppercase text-black dark:text-white truncate">
                Álbum Original: <span className="text-purple-600 dark:text-purple-400">{originalName}</span>
              </p>
              <p className="text-[10px] font-bold uppercase opacity-75">
                Impactará a {songCount} canciones asociadas en la biblioteca.
              </p>
              <div className="mt-1 flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <span>Género 2 Capas:</span>
                <span className="bg-emerald-100 dark:bg-emerald-950 px-1 border border-emerald-600">
                  {formatTwoLayerGenre(parentGenre, subGenre)}
                </span>
              </div>
            </div>
          </div>

          {/* Campo: Nombre del Álbum */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-purple-600" /> Nombre del Álbum:
            </label>
            <input
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Ej. Kind of Blue"
              className="w-full px-3 py-2 border-[2.5px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none focus:border-purple-600 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              required
            />
          </div>

          {/* Campo: Artista Principal */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-600" /> Artista / Banda:
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Ej. Miles Davis"
              className="w-full px-3 py-2 border-[2.5px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none focus:border-purple-600 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Campo: Género en 2 Capas libre y editable */}
          <div className="p-3 border-[2px] border-black dark:border-slate-600 bg-emerald-50/60 dark:bg-[#081810] space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <Layers className="w-4 h-4 text-emerald-600" /> Género en 2 Capas (Sobrescribible libremente):
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Capa 1: Género Principal (Editable) */}
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-black/70 dark:text-slate-300 mb-0.5">
                  1. Género Principal (Escribe o Elige):
                </span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={parentGenre}
                    onChange={(e) => setParentGenre(e.target.value)}
                    placeholder="Ej. Hip Hop, Rock, Salsa..."
                    className="w-full px-2 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-black uppercase outline-none rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setParentGenre(e.target.value);
                        const defaultSubs = TWO_LAYER_GENRES_MAP[e.target.value] || [];
                        if (defaultSubs.length > 0) setSubGenre(defaultSubs[0]);
                      }
                    }}
                    value=""
                    className="px-1 border-[2px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#151622] text-[9px] font-bold uppercase outline-none cursor-pointer rounded-none"
                  >
                    <option value="">Presets</option>
                    {PARENT_GENRES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capa 2: Subgénero / Estilo (Editable) */}
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-black/70 dark:text-slate-300 mb-0.5">
                  2. Sub-género / Estilo (Escribe o Elige):
                </span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={subGenre}
                    onChange={(e) => setSubGenre(e.target.value)}
                    placeholder="Ej. Rap, Argentino, Suave..."
                    className="w-full px-2.5 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <select
                    onChange={(e) => { if (e.target.value) setSubGenre(e.target.value); }}
                    value=""
                    className="px-1 border-[2px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#151622] text-[9px] font-bold uppercase outline-none cursor-pointer rounded-none"
                  >
                    <option value="">Presets</option>
                    {availableSubGenres.map((sg) => (
                      <option key={sg} value={sg}>{sg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Campo: Mood / Ambiente */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-amber-500" /> Mood / Ambiente:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Ej. Chill & Relax"
                className="flex-1 px-3 py-2 border-[2.5px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <select
                onChange={(e) => { if (e.target.value) setMood(e.target.value); }}
                value=""
                className="px-2 border-[2.5px] border-black dark:border-slate-600 bg-cream-bg dark:bg-[#151622] text-xs font-bold uppercase outline-none cursor-pointer rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="">Presets...</option>
                {MOOD_PRESETS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo: URL Portada */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
              URL de la Portada del Álbum:
            </label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border-[2.5px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold outline-none rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Acciones del Formulario */}
          <div className="flex items-center justify-between pt-3 border-t-[2px] border-black dark:border-slate-700">
            {onDeleteAlbum ? (
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAlbum) onDeleteAlbum(currentAlbum);
                }}
                className="px-3 py-2 border-[2.5px] border-black bg-red-600 text-white font-black uppercase text-xs hover:bg-red-700 transition rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                title="Eliminar este álbum y todas sus canciones"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar Álbum
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-[2.5px] border-black bg-white text-black font-black uppercase text-xs hover:bg-gray-200 transition rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 border-[2.5px] border-black bg-[#1DB954] text-black font-black uppercase text-xs hover:bg-emerald-400 transition rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Actualizando Canciones...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar Álbum
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Galería musicCovers */}
      <MusicCoversGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onSelectCover={(url) => {
          setCoverUrl(url);
          setShowGalleryModal(false);
        }}
      />
    </div>
  );
}
