import React, { useState, useEffect } from 'react';
import { X, Save, Disc, Calendar, Music, Tag, Image as ImageIcon, Loader2 } from 'lucide-react';
import MusicCoversGalleryModal from './MusicCoversGalleryModal';
import { formatDuration } from '../../utils/youtubeHelpers';

const PRESET_GENRES = ['General', 'Lofi', 'Jazz', 'Pop', 'Rock', 'Ambient', 'Electrónica', 'Hip-Hop', 'Clásica', 'Indie', 'Reggae', 'Salsa', 'Bossa Nova', 'Café & Chill'];

export default function AlbumEditModal({ album, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    albumName: '',
    artistName: '',
    year: '',
    genre: '',
    cover: ''
  });

  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (album) {
      setFormData({
        albumName: album.albumName || '',
        artistName: album.artistName || '',
        year: album.year || new Date().getFullYear().toString(),
        genre: album.genre || 'General',
        cover: album.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'
      });
    }
  }, [album]);

  if (!isOpen || !album) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.albumName.trim()) return;
    onSave(album, {
      albumName: formData.albumName.trim(),
      artistName: formData.artistName.trim(),
      year: formData.year.trim(),
      genre: formData.genre.trim(),
      cover: formData.cover.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1DB954]/20 text-[#1DB954]">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Editor de Álbum</h2>
              <p className="text-xs text-gray-400">Modifica metadatos en lote para todas las canciones del álbum</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Sección de Carátula y Metadatos Principales */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
            {/* Vista previa de Carátula */}
            <div className="relative group w-36 h-36 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10 shadow-lg">
              <img 
                src={formData.cover} 
                alt={formData.albumName}
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'; }}
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
              <div 
                onClick={() => setShowGallery(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer p-2 text-center"
              >
                <ImageIcon className="w-6 h-6 text-[#1DB954] mb-1" />
                <span className="text-[11px] font-bold text-white uppercase">Cambiar Imagen</span>
              </div>
            </div>

            {/* Campos Principales */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Nombre del Álbum *</label>
                <input 
                  type="text" 
                  name="albumName"
                  required
                  value={formData.albumName}
                  onChange={handleChange}
                  placeholder="Ej: Greatest Hits, Cafe Sessions, etc."
                  className="w-full px-3.5 py-2 bg-black/50 border border-white/20 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Artista / Grupo</label>
                <input 
                  type="text" 
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleChange}
                  placeholder="Ej: Varios Artistas, Lofi Beats"
                  className="w-full px-3.5 py-2 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowGallery(true)}
                className="w-full py-1.5 px-3 bg-white/10 hover:bg-[#1DB954]/20 hover:text-[#1DB954] text-xs font-bold text-gray-300 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Abrir Galería de Carátulas
              </button>
            </div>
          </div>

          {/* Fila de Año y Género */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1DB954]" /> Año de Lanzamiento
              </label>
              <input 
                type="text" 
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Ej: 2024"
                className="w-full px-3.5 py-2 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DB954] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#1DB954]" /> Género del Álbum
              </label>
              <select 
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-black/50 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DB954] font-bold"
              >
                {PRESET_GENRES.map(g => (
                  <option key={g} value={g} className="bg-[#181818] text-white">{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* URL Personalizada de Carátula */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">URL de Carátula Personalizada</label>
            <input 
              type="url" 
              name="cover"
              value={formData.cover}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-black/50 border border-white/20 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#1DB954]"
            />
          </div>

          {/* Lista de Pistas Afectadas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#1DB954]" />
                Canciones Incluidas ({album.tracks?.length || 0})
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Duración total: {formatDuration(album.totalDuration)}</span>
            </div>

            <div className="max-h-36 overflow-y-auto bg-black/40 rounded-xl border border-white/10 p-2 divide-y divide-white/5 custom-scrollbar">
              {album.tracks?.map((track, idx) => (
                <div key={track.id || idx} className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-white/5 rounded-lg transition">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-gray-500 font-mono text-[10px] w-5">{idx + 1}.</span>
                    <span className="font-bold text-white truncate">{track.title}</span>
                  </div>
                  <span className="text-gray-400 text-[10px] font-mono flex-shrink-0">{formatDuration(track.duration)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Botones */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-5 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-extrabold transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs shadow-lg shadow-[#1DB954]/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando Cambios...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios del Álbum
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Secundario para Galería de Carátulas */}
      {showGallery && (
        <MusicCoversGalleryModal 
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelectCover={(selectedUrl) => {
            setFormData(prev => ({ ...prev, cover: selectedUrl }));
            setShowGallery(false);
          }}
        />
      )}
    </div>
  );
}
