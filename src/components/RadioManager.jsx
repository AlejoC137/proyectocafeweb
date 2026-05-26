import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';

export default function RadioManager() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    cover: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  
  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('playlist_radio')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      setSongs(data || []);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError("No se pudieron cargar las canciones: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Opcional: auto-rellenar título con el nombre del archivo
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
      setAudioFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      setError("Debes seleccionar un archivo de audio (MP3).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setUploadProgress("Preparando archivo...");

    try {
      // 1. Crear un nombre único para evitar colisiones
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploadProgress("Subiendo archivo a Supabase...");

      // 2. Subir el archivo al bucket "radio_mp3"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('radio_mp3')
        .upload(filePath, audioFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error("Error subiendo el archivo: " + uploadError.message);
      }

      setUploadProgress("Generando enlace público...");

      // 3. Obtener la URL pública del archivo subido
      const { data: publicUrlData } = supabase.storage
        .from('radio_mp3')
        .getPublicUrl(filePath);

      const finalUrl = publicUrlData.publicUrl;

      if (!finalUrl) {
        throw new Error("No se pudo obtener el enlace público del archivo.");
      }

      setUploadProgress("Guardando datos en la base de datos...");

      // 4. Guardar los datos en la tabla playlist_radio
      const { error: dbError } = await supabase
        .from('playlist_radio')
        .insert([
          {
            title: formData.title,
            artist: formData.artist,
            url: finalUrl,
            cover: formData.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'
          }
        ]);
      
      if (dbError) throw new Error("Error guardando en base de datos: " + dbError.message);
      
      // Éxito
      setSuccess("¡Canción añadida con éxito!");
      setFormData({ title: '', artist: '', cover: '' });
      setAudioFile(null);
      // Resetear el input file visualmente
      document.getElementById('audioFileInput').value = '';
      
      fetchSongs();
    } catch (err) {
      console.error("Error global en submit:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (id, fileUrl) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta canción?")) return;
    try {
      // 1. Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('playlist_radio')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;

      // 2. Intentar eliminar el archivo físico del bucket para no gastar espacio
      if (fileUrl && fileUrl.includes('radio_mp3')) {
        // Extraer el nombre del archivo de la URL
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // No bloqueamos si esto falla, pero lo intentamos
        await supabase.storage.from('radio_mp3').remove([fileName]).catch(e => console.log("No se pudo borrar archivo físico:", e));
      }

      setSuccess("Canción eliminada.");
      fetchSongs();
    } catch (err) {
      console.error("Error deleting song:", err);
      setError("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 text-darker-on-cream">
      <h1 className="text-3xl font-bold mb-8">Administración de Radio (Storage Propio)</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{error}</span>
          <button className="absolute top-0 right-0 px-4 py-3" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{success}</span>
          <button className="absolute top-0 right-0 px-4 py-3" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Formulario */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Subir Canción Nueva</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input de Archivo Físico */}
            <div>
              <label className="block text-sm font-medium mb-1">Archivo de Audio (MP3/WAV)</label>
              <input 
                id="audioFileInput"
                type="file" 
                accept="audio/*"
                onChange={handleFileChange}
                required
                className="w-full px-4 py-2 border border-dashed rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleTextChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="Ej. Mi Canción"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Artista</label>
              <input 
                type="text" 
                name="artist"
                value={formData.artist}
                onChange={handleTextChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="Ej. Juanes"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">URL de Portada (Opcional)</label>
              <input 
                type="text" 
                name="cover"
                value={formData.cover}
                onChange={handleTextChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>

            {isSubmitting && (
              <div className="text-sm text-orange-600 font-medium animate-pulse text-center">
                {uploadProgress}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting || !audioFile}
              className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Subiendo...
                </>
              ) : 'Subir Archivo'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Lista de Canciones */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Playlist Actual</h2>
          {loading ? (
            <p className="text-gray-500">Cargando canciones...</p>
          ) : songs.length === 0 ? (
            <p className="text-gray-500">No hay canciones en la lista. ¡Sube la primera!</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {songs.map((song) => (
                <li key={song.id} className="py-4 flex items-center justify-between group hover:bg-slate-50 rounded-lg px-2 -mx-2 transition">
                  <div className="flex items-center gap-4 truncate">
                    <img 
                      src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'} 
                      alt="cover" 
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm"
                    />
                    <div className="truncate">
                      <h3 className="font-semibold text-gray-800 truncate">{song.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5" title={song.url}>
                        {song.url.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(song.id, song.url)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                    title="Eliminar de BD y Storage"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
