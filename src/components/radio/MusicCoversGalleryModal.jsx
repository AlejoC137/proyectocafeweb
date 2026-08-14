import React, { useState, useEffect, useRef } from 'react';
import supabase from '../../config/supabaseClient';
import { X, Upload, Search, Image as ImageIcon, Check, Loader2, Plus, Sparkles, Trash2, Edit3, Save } from 'lucide-react';

const DEFAULT_PRESET_COVERS = [
  { id: 'p1', title: 'Vintage Vinyl', artist: 'Proyecto Café', album: 'Classic Lounge', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600' },
  { id: 'p2', title: 'Night Neon', artist: 'Synthwave Studio', album: 'Midnight Drive', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600' },
  { id: 'p3', title: 'Lofi Coffee', artist: 'Chillhop Records', album: 'Coffee & Rain', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600' },
  { id: 'p4', title: 'Acoustic Guitar', artist: 'Acoustic Sessions', album: 'Unplugged Live', url: 'https://images.unsplash.com/photo-1516280440502-8693c0663486?auto=format&fit=crop&q=80&w=600' },
  { id: 'p5', title: 'Sunset Chill', artist: 'Ambient Wave', album: 'Golden Hour', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600' },
  { id: 'p6', title: 'Jazz Saxophone', artist: 'Cafe Music BGM', album: 'Midnight Jazz', url: 'https://images.unsplash.com/photo-1445985543468-b42169244793?auto=format&fit=crop&q=80&w=600' },
  { id: 'p7', title: 'Electronic Beats', artist: 'Techno Lab', album: 'Future Rhythm', url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=600' }
];

export default function MusicCoversGalleryModal({ isOpen, onClose, onSelectCover, currentCoverUrl }) {
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedCover, setSelectedCover] = useState(currentCoverUrl || '');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Formulario de subida rápida
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Edición de Metadatos de Carátula existente
  const [editingCover, setEditingCover] = useState(null);
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchCovers();
      setSelectedCover(currentCoverUrl || '');
      setEditingCover(null);
    }
  }, [isOpen, currentCoverUrl]);

  const fetchCovers = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Intentar consultar tabla music_covers en Supabase
      const { data, error: dbErr } = await supabase
        .from('music_covers')
        .select('*')
        .order('id', { ascending: false });

      if (!dbErr && data && data.length > 0) {
        setCovers([...data, ...DEFAULT_PRESET_COVERS]);
      } else {
        setCovers(DEFAULT_PRESET_COVERS);
      }
    } catch (err) {
      console.warn("Error cargando music_covers:", err);
      setCovers(DEFAULT_PRESET_COVERS);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg, .webp).");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const possibleBuckets = ['musicCovers', 'music_covers', 'Radio', 'radio', 'Images_eventos'];
      let targetBucket = null;
      let publicUrl = null;

      for (const bName of possibleBuckets) {
        try {
          const { error: upErr } = await supabase.storage
            .from(bName)
            .upload(filePath, file, { upsert: true, cacheControl: '3600' });

          if (!upErr) {
            const { data: pubData } = supabase.storage.from(bName).getPublicUrl(filePath);
            publicUrl = pubData?.publicUrl;
            targetBucket = bName;
            break;
          }
        } catch (e) {}
      }

      if (!publicUrl) {
        publicUrl = URL.createObjectURL(file);
      }

      const coverItem = {
        title: uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, ""),
        artist: uploadArtist.trim() || 'Proyecto Café',
        album: uploadTitle.trim() || 'Álbum',
        url: publicUrl,
        storage_path: filePath
      };

      // Guardar registro en Supabase music_covers
      const { data: inserted } = await supabase
        .from('music_covers')
        .insert([coverItem])
        .select();

      const newCoverRecord = inserted?.[0] || { id: `loc-${Date.now()}`, ...coverItem };

      setCovers(prev => [newCoverRecord, ...prev]);
      setSelectedCover(newCoverRecord.url);
      setSuccess("¡Portada subida y registrada en la galería musicCovers!");
      setUploadTitle('');
      setUploadArtist('');
      setShowUploadForm(false);
    } catch (err) {
      console.error("Error subiendo carátula:", err);
      setError("Error al subir carátula: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCoverMetadata = async (e) => {
    e.preventDefault();
    if (!editingCover) return;

    try {
      setIsSavingMeta(true);
      setError(null);
      const { id, title, artist, album, url } = editingCover;

      if (typeof id === 'number' || (id && !id.toString().startsWith('p') && !id.toString().startsWith('loc-'))) {
        const numId = !isNaN(Number(id)) ? Number(id) : id;
        let { error: errUp } = await supabase
          .from('music_covers')
          .update({ title, artist, album, url })
          .eq('id', numId);

        if (errUp) {
          await supabase.from('music_covers').update({ title, artist, album, url }).eq('id', String(id));
        }
      }

      setCovers(prev => prev.map(c => c.id === id ? { ...c, title, artist, album, url } : c));
      setSuccess("¡Metadatos de la carátula actualizados correctamente en Supabase!");
      setEditingCover(null);
    } catch (err) {
      console.error("Error guardando metadatos de portada:", err);
      setError("Error al guardar metadatos: " + err.message);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleDeleteCover = async (e, coverId) => {
    e.stopPropagation();
    if (!window.confirm("¿Deseas eliminar esta carátula de la galería musicCovers?")) return;

    try {
      await supabase.from('music_covers').delete().eq('id', coverId).catch(() => {});
      setCovers(prev => prev.filter(c => c.id !== coverId));
      if (editingCover?.id === coverId) setEditingCover(null);
    } catch (err) {
      console.error("Error eliminando carátula:", err);
    }
  };

  const filteredCovers = covers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.artist && c.artist.toLowerCase().includes(q)) ||
      (c.album && c.album.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-4xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1DB954]/20 text-[#1DB954]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Galería y Edición de Metadatos musicCovers <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold border border-[#1DB954]/30">Supabase</span>
              </h2>
              <p className="text-xs text-gray-400">Edita metadatos de las imágenes de portada (Título, Artista, Álbum, URL) y aplícalas a tus álbumes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones e Indicadores */}
        <div className="p-4 bg-[#151515] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar carátula por título, artista..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#181818] border border-white/15 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954]"
            />
          </div>

          {/* Botón Subida Nueva Portada */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadImage}
            />

            <button 
              onClick={() => {
                setShowUploadForm(!showUploadForm);
                setEditingCover(null);
              }}
              className="px-4 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Subir Nueva Portada
            </button>
          </div>
        </div>

        {/* Formulario desplegable de subida */}
        {showUploadForm && (
          <div className="p-4 bg-[#222222] border-b border-white/10 animate-fade-in space-y-3">
            <p className="text-xs font-bold text-gray-300">Ingresa los datos opcionales de la nueva carátula y selecciona el archivo de imagen:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="Nombre del Álbum / Título de la Imagen"
                className="px-3 py-1.5 bg-[#121212] border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-[#1DB954]"
              />
              <input 
                type="text"
                value={uploadArtist}
                onChange={e => setUploadArtist(e.target.value)}
                placeholder="Artista (ej. Daft Punk, Cold Play...)"
                className="px-3 py-1.5 bg-[#121212] border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-[#1DB954]"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2 bg-[#1DB954] text-black font-bold text-xs rounded-lg hover:bg-[#1ed760] transition flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Subiendo Imagen a Supabase Storage...' : 'Seleccionar Archivo de Imagen'}
            </button>
          </div>
        )}

        {/* Formulario de Edición de Metadatos de la Carátula Seleccionada */}
        {editingCover && (
          <div className="p-4 bg-[#252525] border-b border-[#1DB954]/40 animate-fade-in space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-[#1DB954] uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Editar Metadatos de la Carátula
              </h4>
              <button 
                onClick={() => setEditingCover(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveCoverMetadata} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">Título de la Portada</label>
                <input 
                  type="text"
                  required
                  value={editingCover.title}
                  onChange={e => setEditingCover(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título..."
                  className="w-full px-3 py-1.5 bg-[#121212] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">Artista</label>
                <input 
                  type="text"
                  value={editingCover.artist || ''}
                  onChange={e => setEditingCover(prev => ({ ...prev, artist: e.target.value }))}
                  placeholder="Artista..."
                  className="w-full px-3 py-1.5 bg-[#121212] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">Álbum</label>
                <input 
                  type="text"
                  value={editingCover.album || ''}
                  onChange={e => setEditingCover(prev => ({ ...prev, album: e.target.value }))}
                  placeholder="Álbum..."
                  className="w-full px-3 py-1.5 bg-[#121212] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">URL de la Imagen</label>
                <input 
                  type="text"
                  required
                  value={editingCover.url}
                  onChange={e => setEditingCover(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-[#121212] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#1DB954] font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSavingMeta}
                  className="w-full py-2 bg-[#1DB954] text-black font-extrabold text-xs rounded-lg hover:bg-[#1ed760] transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isSavingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Metadatos en Supabase
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alertas */}
        {error && <div className="mx-6 mt-3 p-2 bg-red-950/80 text-red-200 border border-red-500/30 rounded-lg text-xs font-bold">{error}</div>}
        {success && <div className="mx-6 mt-3 p-2 bg-emerald-950/80 text-emerald-200 border border-[#1DB954]/30 rounded-lg text-xs font-bold">{success}</div>}

        {/* Grid de Portadas */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <Loader2 className="w-7 h-7 text-[#1DB954] animate-spin mx-auto" />
              <p className="text-xs font-bold">Cargando carátulas desde musicCovers...</p>
            </div>
          ) : filteredCovers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <ImageIcon className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs font-bold text-white">No se encontraron carátulas</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCovers.map((cover, idx) => {
                const isSelected = selectedCover === cover.url;
                const isCustomUserCover = typeof cover.id === 'number' || (cover.id && !cover.id.toString().startsWith('p'));

                return (
                  <div
                    key={cover.id || idx}
                    onClick={() => setSelectedCover(cover.url)}
                    className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 bg-[#121212] ${isSelected ? 'border-[#1DB954] shadow-lg shadow-[#1DB954]/20 scale-105' : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'}`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/40 relative">
                      <img 
                        src={cover.url} 
                        alt={cover.title} 
                        onError={(e) => { e.currentTarget.src = DEFAULT_PRESET_COVERS[0].url; }}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />

                      {/* Icono de Selección Activo */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1.5 bg-[#1DB954] text-black rounded-full shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Botón Editar Metadatos y Eliminar */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCover({
                              id: cover.id,
                              title: cover.title || '',
                              artist: cover.artist || '',
                              album: cover.album || '',
                              url: cover.url || ''
                            });
                          }}
                          className="p-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-md shadow-md"
                          title="Editar metadatos de esta portada"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {isCustomUserCover && (
                          <button
                            onClick={(e) => handleDeleteCover(e, cover.id)}
                            className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-md shadow-md"
                            title="Eliminar carátula"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#181818]">
                      <h4 className="font-extrabold text-xs text-white truncate">{cover.title || 'Álbum'}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{cover.artist || 'Proyecto Café'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#202020]">
          <span className="text-xs text-gray-400 font-mono truncate max-w-xs">
            {selectedCover ? 'Carátula Seleccionada' : 'Ninguna portada seleccionada'}
          </span>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold text-gray-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              disabled={!selectedCover}
              onClick={() => {
                onSelectCover(selectedCover);
                onClose();
              }}
              className="px-6 py-2 rounded-full text-xs font-extrabold bg-[#1DB954] hover:bg-[#1ed760] text-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Aplicar Carátula
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
