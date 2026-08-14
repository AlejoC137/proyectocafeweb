import React, { useState, useEffect } from 'react';
import { X, Save, Music, Image, Sparkles, Tag, Calendar, Disc, Hash, Clock, Plus } from 'lucide-react';
import MusicCoversGalleryModal from './MusicCoversGalleryModal';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1516280440502-8693c0663486?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1445985543468-b42169244793?auto=format&fit=crop&q=80&w=400&h=400',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400&h=400'
];

const INITIAL_GENRES = ['Lofi', 'Jazz', 'Pop', 'Rock', 'Ambient', 'Electrónica', 'Hip-Hop', 'Clásica', 'Indie', 'Reggae', 'General', 'Salsa', 'Bossa Nova'];
const PRESET_MOODS = ['Chill & Relax', 'Estudio & Café', 'Noche & Calma', 'Energético & Fiesta', 'Romántico & Acústico', 'Ambiente General'];

export default function RadioEditModal({ song, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: '',
    mood: '',
    cover: '',
    url: '',
    duration: 180,
    order_index: 0
  });

  const [availableGenres, setAvailableGenres] = useState(INITIAL_GENRES);
  const [showCustomGenreInput, setShowCustomGenreInput] = useState(false);
  const [newGenreInput, setNewGenreInput] = useState('');
  const [showMusicGallery, setShowMusicGallery] = useState(false);

  useEffect(() => {
    if (song) {
      const currentGenre = song.genre || 'General';
      setFormData({
        title: song.title || '',
        artist: song.artist || '',
        album: song.album || 'Sencillo',
        genre: currentGenre,
        year: song.year || new Date().getFullYear().toString(),
        mood: song.mood || 'Chill & Relax',
        cover: song.cover || '',
        url: song.url || '',
        duration: song.duration || 180,
        order_index: song.order_index ?? 0
      });

      // Incluir género de la canción si no está en la lista inicial
      if (currentGenre && !availableGenres.includes(currentGenre)) {
        setAvailableGenres(prev => [...prev, currentGenre]);
      }
    }
  }, [song]);

  if (!isOpen || !song) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomGenre = () => {
    const trimmed = newGenreInput.trim();
    if (trimmed) {
      if (!availableGenres.includes(trimmed)) {
        setAvailableGenres(prev => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, genre: trimmed }));
      setNewGenreInput('');
      setShowCustomGenreInput(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(song.id, {
      ...formData,
      duration: Number(formData.duration) || 0,
      order_index: Number(formData.order_index) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1DB954]/20 text-[#1DB954]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Editar Canción</h2>
              <p className="text-xs text-gray-400">Modifica metadatos estilo Spotify para la radio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Fila Vista Previa Portada + Título + Artista */}
          <div className="flex flex-col sm:flex-row gap-5 items-start bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="relative group flex-shrink-0">
              <img 
                src={formData.cover || PRESET_COVERS[0]} 
                alt="Portada" 
                onError={(e) => { e.currentTarget.src = PRESET_COVERS[0]; }}
                className="w-28 h-28 rounded-xl object-cover shadow-lg border border-white/10 bg-black/40"
              />
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#1DB954]" /> Título del Tema *
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
                  placeholder="Ej. Midnight City"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#1DB954]" /> Artista / Grupo *
                </label>
                <input 
                  type="text" 
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
                  placeholder="Ej. M83"
                />
              </div>
            </div>
          </div>

          {/* Fila Álbum y Género Dinámico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-gray-400" /> Álbum
              </label>
              <input 
                type="text" 
                name="album"
                value={formData.album}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
                placeholder="Ej. Hurry Up, We're Dreaming"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" /> Género
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomGenreInput(!showCustomGenreInput)}
                  className="text-[11px] font-bold text-[#1DB954] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Crear Género
                </button>
              </div>

              {/* Input principal de género (se puede escribir cualquier género personalizado) */}
              <input 
                type="text" 
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
                placeholder="Escribe o selecciona un género..."
              />

              {/* Formulario rápido para crear nuevo género */}
              {showCustomGenreInput && (
                <div className="flex gap-2 mt-2 animate-fade-in">
                  <input 
                    type="text"
                    value={newGenreInput}
                    onChange={(e) => setNewGenreInput(e.target.value)}
                    placeholder="Nuevo género (ej: Cyberpunk, Tango, Trap...)"
                    className="flex-1 bg-black/60 border border-[#1DB954]/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGenre();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGenre}
                    className="px-3 py-1.5 rounded-lg bg-[#1DB954] text-black font-bold text-xs hover:bg-[#1ed760] transition"
                  >
                    Añadir
                  </button>
                </div>
              )}

              {/* Chips rápidos de géneros creados y presets */}
              <div className="flex flex-wrap gap-1 mt-2.5 max-h-24 overflow-y-auto custom-scrollbar">
                {availableGenres.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, genre: g }))}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition ${formData.genre === g ? 'bg-[#1DB954] text-black border-[#1DB954] font-extrabold shadow-sm scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fila Año y Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Año de Lanzamiento
              </label>
              <input 
                type="text" 
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
                placeholder="Ej. 2024"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mood / Ambiente
              </label>
              <input 
                type="text" 
                name="mood"
                value={formData.mood}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition mb-1"
                placeholder="Ej: Chill, Noche, Fiesta..."
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {PRESET_MOODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, mood: m }))}
                    className={`text-[9px] px-2 py-0.5 rounded-full border transition ${formData.mood === m ? 'bg-amber-400 text-black font-extrabold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fila Duración y Posición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Duración (segundos)
              </label>
              <input 
                type="number" 
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-gray-400" /> Posición de Orden (`order_index`)
              </label>
              <input 
                type="number" 
                name="order_index"
                value={formData.order_index}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition"
              />
            </div>
          </div>

          {/* URL de Portada con Presets y Galería musicCovers */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-gray-400" /> Imagen de Portada
              </label>
              <button 
                type="button"
                onClick={() => setShowMusicGallery(true)}
                className="text-[11px] font-extrabold text-[#1DB954] hover:underline flex items-center gap-1 bg-[#1DB954]/10 px-2.5 py-0.5 rounded-full border border-[#1DB954]/30"
              >
                <Image className="w-3 h-3" /> Galería musicCovers
              </button>
            </div>

            <input 
              type="text" 
              name="cover"
              value={formData.cover}
              onChange={handleChange}
              className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] transition mb-2"
              placeholder="https://..."
            />
            <p className="text-[11px] text-gray-400 mb-2">Selecciona una imagen prediseñada de Spotify Radio:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {PRESET_COVERS.map((cUrl, idx) => (
                <img 
                  key={idx}
                  src={cUrl}
                  alt={`preset-${idx}`}
                  onClick={() => setFormData(p => ({ ...p, cover: cUrl }))}
                  className={`w-10 h-10 rounded-lg object-cover cursor-pointer border-2 transition ${formData.cover === cUrl ? 'border-[#1DB954] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {/* URL de Audio */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              URL Directa de Audio (Supabase Storage / Enlace Público)
            </label>
            <input 
              type="text" 
              name="url"
              value={formData.url}
              onChange={handleChange}
              required
              className="w-full bg-[#121212] border border-white/15 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-[#1DB954] transition"
            />
          </div>

          {/* Footer Modal con Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1DB954] hover:bg-[#1ed760] text-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>

      {/* Modal Galería de Carátulas musicCovers */}
      <MusicCoversGalleryModal 
        isOpen={showMusicGallery}
        onClose={() => setShowMusicGallery(false)}
        currentCoverUrl={formData.cover}
        onSelectCover={(selectedUrl) => {
          setFormData(prev => ({ ...prev, cover: selectedUrl }));
          setShowMusicGallery(false);
        }}
      />
    </div>
  );
}
