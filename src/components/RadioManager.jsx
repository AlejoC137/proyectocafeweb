import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import { ArrowUp, ArrowDown, Trash2, Music, Loader2, ListMusic, Cloud } from 'lucide-react';

const MAX_PLAYLIST_SECONDS = 4 * 60 * 60; // 4 horas en segundos (14,400 s)

// Extractor Inteligente de Metadatos ID3 (Título, Artista, Carátula e Información de Audio)
const parseMp3Metadata = (file) => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target.result;
      const view = new DataView(buffer);

      let title = file.name.replace(/\.[^/.]+$/, "");
      let artist = '';
      let coverUrl = null;

      if (buffer.byteLength > 10 && view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
        const id3Size = (view.getUint8(6) << 21) | (view.getUint8(7) << 14) | (view.getUint8(8) << 7) | view.getUint8(9);
        let offset = 10;

        while (offset < id3Size + 10 && offset + 10 < buffer.byteLength) {
          const frameId = String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
          );

          const frameSize = (view.getUint8(offset + 4) << 24) |
                            (view.getUint8(offset + 5) << 16) |
                            (view.getUint8(offset + 6) << 8) |
                            view.getUint8(offset + 7);

          if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) break;

          const frameDataOffset = offset + 10;

          if (frameId === 'TIT2') {
            const bytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);
            const str = new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
            if (str) title = str;
          }

          if (frameId === 'TPE1') {
            const bytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);
            const str = new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
            if (str) artist = str;
          }

          if (frameId === 'APIC') {
            try {
              const bytes = new Uint8Array(buffer, frameDataOffset, frameSize);
              let imgOffset = 1;
              while (imgOffset < bytes.length && bytes[imgOffset] !== 0) imgOffset++;
              imgOffset += 2;

              let imageStart = imgOffset;
              for (let i = imgOffset; i < bytes.length - 1; i++) {
                if ((bytes[i] === 0xFF && bytes[i + 1] === 0xD8) || (bytes[i] === 0x89 && bytes[i + 1] === 0x50)) {
                  imageStart = i;
                  break;
                }
              }

              const imgBuffer = bytes.subarray(imageStart);
              const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
              coverUrl = URL.createObjectURL(blob);
            } catch (err) {
              console.log("No se pudo extraer carátula:", err);
            }
          }

          offset += 10 + frameSize;
        }
      }

      const audio = new Audio();
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        resolve({
          title,
          artist,
          cover: coverUrl,
          duration: Math.round(audio.duration || 0),
          objectUrl
        });
      };
      audio.onerror = () => resolve({ title, artist, cover: coverUrl, duration: 0, objectUrl });
    };

    reader.onerror = () => resolve({
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: '',
      cover: null,
      duration: 0,
      objectUrl
    });

    reader.readAsArrayBuffer(file.slice(0, 512 * 1024));
  });
};

// Función de subida con progreso % exacto en tiempo real usando XHR
const uploadFileWithProgress = (bucketName, filePath, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
    xhr.setRequestHeader('apikey', supabaseKey);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('Content-Type', 'audio/mp3');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true, bucket: bucketName });
      } else {
        let errMessage = `Error ${xhr.status}`;
        try {
          const res = JSON.parse(xhr.responseText);
          errMessage = res.message || res.error || errMessage;
        } catch (e) {}
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => reject(new Error("Error de conexión durante la subida."));
    xhr.send(file);
  });
};

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
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  
  // Submit State & % de Progreso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      let data = null;
      let error = null;

      const firstTry = await supabase
        .from('playlist_radio')
        .select('*')
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (firstTry.error && firstTry.error.message?.includes('order_index')) {
        const fallbackTry = await supabase
          .from('playlist_radio')
          .select('*')
          .order('id', { ascending: true });
        data = fallbackTry.data;
        error = fallbackTry.error;
      } else {
        data = firstTry.data;
        error = firstTry.error;
      }

      if (error) throw error;
      setSongs(data || []);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError("No se pudieron cargar las canciones: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPlaylistSeconds = songs.reduce((acc, item) => acc + (item.duration || 0), 0);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAudioFile(file);
      setUploadProgress("Leyendo metadatos ID3 del archivo MP3...");
      setUploadPercent(0);

      const meta = await parseMp3Metadata(file);
      setExtractedMetadata(meta);

      setFormData(prev => ({
        title: meta.title || prev.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: meta.artist || prev.artist || 'Artista Desconocido',
        cover: meta.cover || prev.cover || ''
      }));

      setUploadProgress('');
    }
  };

  const moveSongOrder = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= songs.length) return;

    const updated = [...songs];
    const itemToMove = updated[index];
    const itemTarget = updated[newIndex];

    updated[index] = itemTarget;
    updated[newIndex] = itemToMove;
    setSongs(updated);

    try {
      await supabase.from('playlist_radio').update({ order_index: newIndex }).eq('id', itemToMove.id);
      await supabase.from('playlist_radio').update({ order_index: index }).eq('id', itemTarget.id);
    } catch (err) {
      console.error("Error reordenando canciones:", err);
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
    setUploadPercent(0);
    setUploadProgress("Preparando archivo para la subida...");

    try {
      const durationSec = extractedMetadata?.duration || 180;

      if (totalPlaylistSeconds + durationSec > MAX_PLAYLIST_SECONDS) {
        throw new Error(`⚠️ Al agregar esta canción de ${formatTime(durationSec)} se superaría el límite máximo de 4 horas de la lista del día.`);
      }

      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir con porcentaje de progreso en tiempo real
      const possibleBuckets = ['radio', 'Radio', 'radio_mp3'];
      let targetBucket = null;
      let lastErr = null;

      for (const bName of possibleBuckets) {
        setUploadProgress(`Subiendo archivo a Supabase Storage (Bucket '${bName}')...`);
        try {
          await uploadFileWithProgress(bName, filePath, audioFile, (pct) => {
            setUploadPercent(pct);
          });
          targetBucket = bName;
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!targetBucket) {
        throw new Error(`Error en Supabase Storage (${lastErr?.message || 'Error de subida'}). Asegúrate de agregar una Política (Policy) en Supabase -> Storage -> Policies para permitir la subida de archivos al bucket 'Radio'.`);
      }

      setUploadProgress("Generando enlace público...");

      const { data: publicUrlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      const finalUrl = publicUrlData.publicUrl;

      if (!finalUrl) {
        throw new Error("No se pudo obtener el enlace público del archivo.");
      }

      setUploadProgress("Guardando registro en la base de datos...");

      const nextOrderIndex = songs.length;
      let insertPayload = {
        title: formData.title,
        artist: formData.artist,
        url: finalUrl,
        duration: durationSec,
        order_index: nextOrderIndex,
        cover: formData.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'
      };

      let { error: dbError } = await supabase.from('playlist_radio').insert([insertPayload]);

      if (dbError && dbError.message?.includes('order_index')) {
        delete insertPayload.order_index;
        const retry = await supabase.from('playlist_radio').insert([insertPayload]);
        dbError = retry.error;
      }
      
      if (dbError) throw new Error("Error guardando en base de datos: " + dbError.message);
      
      setSuccess("¡Canción subida y guardada exitosamente al 100%!");
      setFormData({ title: '', artist: '', cover: '' });
      setAudioFile(null);
      setExtractedMetadata(null);
      setUploadPercent(100);
      if (document.getElementById('audioFileInput')) {
        document.getElementById('audioFileInput').value = '';
      }
      
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
    if (!window.confirm("¿Seguro que deseas eliminar esta canción de la base de datos?")) return;
    try {
      const { error: dbError } = await supabase
        .from('playlist_radio')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;

      if (fileUrl && fileUrl.includes('storage')) {
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const isPlayList = fileUrl.includes('PlayLists/');
        const pathToRemove = isPlayList ? `PlayLists/${fileName}` : fileName;

        await supabase.storage.from('Radio').remove([pathToRemove]).catch(() => {
          supabase.storage.from('radio').remove([pathToRemove]);
        });
      }

      setSuccess("Canción eliminada de la base de datos.");
      fetchSongs();
    } catch (err) {
      console.error("Error deleting song:", err);
      setError("Error al eliminar: " + err.message);
    }
  };

  const handleSyncBucket = async () => {
    try {
      setSyncStatus('Sincronizando...');
      setError('');
      setSuccess('');
      
      const possibleBuckets = ['Radio', 'radio'];
      const foldersToTry = ['PlayLists', '']; 
      let allFiles = [];
      let foundBucket = null;
      let foundFolder = null;

      for (const b of possibleBuckets) {
        for (const folder of foldersToTry) {
          const { data, error } = await supabase.storage.from(b).list(folder, { limit: 100 });
          if (data && !error && data.length > 0) {
            foundBucket = b;
            foundFolder = folder;
            allFiles = data.filter(f => f.name.endsWith('.mp3'));
            if (allFiles.length > 0) break;
          }
        }
        if (allFiles.length > 0) break;
      }

      if (!foundBucket) {
        throw new Error("No se encontraron archivos MP3 en los buckets 'Radio' ni 'radio'.");
      }

      const { data: dbSongs } = await supabase.from('playlist_radio').select('url, title');
      const dbUrls = dbSongs ? dbSongs.map(s => s.url) : [];

      let addedCount = 0;
      
      for (const file of allFiles) {
        const filePath = foundFolder ? `${foundFolder}/${file.name}` : file.name;
        const { data: publicData } = supabase.storage.from(foundBucket).getPublicUrl(filePath);
        
        if (publicData && publicData.publicUrl && !dbUrls.includes(publicData.publicUrl)) {
          const title = file.name.replace('.mp3', '').replace(/_/g, ' ');
          
          await supabase.from('playlist_radio').insert([{
            title: title,
            artist: 'Sincronizado desde Storage',
            url: publicData.publicUrl,
            cover: 'https://images.unsplash.com/photo-1516280440502-8693c0663486?auto=format&fit=crop&q=80&w=400',
            duration: 0
          }]);
          
          addedCount++;
        }
      }

      if (addedCount > 0) {
        setSuccess(`¡Sincronización completada! Se añadieron ${addedCount} canciones.`);
        fetchSongs();
      } else {
        setSuccess("La base de datos ya está sincronizada.");
      }
      
    } catch (err) {
      console.error("Error sincronizando:", err);
      setError(err.message);
    } finally {
      setSyncStatus('');
    }
  };

  const quotaPercent = Math.min(100, Math.round((totalPlaylistSeconds / MAX_PLAYLIST_SECONDS) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto p-6 text-slate-800 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Administración de Radio (Transmisión Nube)</h1>
          <p className="text-sm text-slate-600">Indicador de Progreso en Tiempo Real • Metadatos ID3</p>
        </div>
      </div>
      
      {/* CUOTA DE 4 HORAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 mb-8">
        <div className="flex justify-between items-center text-xs font-bold mb-2 text-slate-800">
          <span>Bucle de Transmisión del Día (Máximo 4 horas)</span>
          <span className="font-mono text-amber-900">{formatTime(totalPlaylistSeconds)} / 4h 00m ({quotaPercent}%)</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all ${quotaPercent >= 90 ? 'bg-red-500' : 'bg-orange-600'}`}
            style={{ width: `${quotaPercent}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 relative text-xs font-semibold leading-relaxed">
          <span className="block sm:inline">{error}</span>
          <button className="absolute top-0 right-0 px-4 py-3 font-bold text-base" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 relative text-xs font-semibold">
          <span className="block sm:inline">{success}</span>
          <button className="absolute top-0 right-0 px-4 py-3 font-bold text-base" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Formulario */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-md border border-amber-200/80">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Subir Canción</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Archivo de Audio (MP3)</label>
              <input 
                id="audioFileInput"
                type="file" 
                accept="audio/*"
                onChange={handleFileChange}
                required
                className="w-full px-4 py-2 border border-dashed border-amber-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-100 file:text-orange-800 hover:file:bg-orange-200 cursor-pointer text-xs"
              />
            </div>

            {extractedMetadata && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                {extractedMetadata.cover ? (
                  <img src={extractedMetadata.cover} alt="ID3 Cover" className="w-10 h-10 rounded-lg object-cover border" />
                ) : (
                  <div className="w-10 h-10 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                )}
                <div className="text-xs truncate">
                  <p className="font-bold text-slate-800 truncate">{extractedMetadata.title}</p>
                  <p className="text-slate-500 truncate">{extractedMetadata.artist || 'Artista No Especificado'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Título</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleTextChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                placeholder="Ej. Mi Canción"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Artista</label>
              <input 
                type="text" 
                name="artist"
                value={formData.artist}
                onChange={handleTextChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                placeholder="Ej. Juanes"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">URL de Portada (Opcional)</label>
              <input 
                type="text" 
                name="cover"
                value={formData.cover}
                onChange={handleTextChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                placeholder="https://..."
              />
            </div>

            {isSubmitting && (
              <div className="w-full mt-2 bg-amber-50 border border-amber-200 p-3 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="truncate flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-orange-600 animate-spin" />
                    Subiendo...
                  </span>
                  <span className="font-mono text-orange-700 font-extrabold">{uploadPercent}%</span>
                </div>
                <div className="w-full bg-amber-200/80 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-amber-600 via-orange-600 to-orange-500 h-3 rounded-full transition-all duration-150"
                    style={{ width: `${uploadPercent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">{uploadProgress}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting || !audioFile}
              className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-orange-600 text-white rounded-xl font-bold hover:from-amber-800 hover:to-orange-700 transition disabled:opacity-50 flex justify-center items-center gap-2 text-xs shadow-md"
            >
              {isSubmitting ? `Subiendo (${uploadPercent}%)...` : 'Subir Canción'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Lista de Canciones */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-amber-200/80">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Playlist de Transmisión Supabase</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Cargando canciones desde Supabase...</p>
          ) : songs.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay canciones en tu base de datos Supabase todavía. ¡Sube tu primer archivo MP3!</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {songs.map((song, index) => (
                <li key={song.id} className="py-3 flex items-center justify-between group hover:bg-amber-50/60 rounded-xl px-3 transition">
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-xs font-mono font-bold text-amber-800 w-5 text-center">{index + 1}</span>
                    <img 
                      src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'} 
                      alt="cover" 
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-sm border border-amber-200"
                    />
                    <div className="truncate">
                      <h3 className="font-bold text-slate-800 text-sm truncate">{song.title}</h3>
                      <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button
                      onClick={() => moveSongOrder(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-slate-400 hover:text-orange-700 hover:bg-orange-100 rounded-lg disabled:opacity-30 transition"
                      title="Subir posición"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => moveSongOrder(index, 'down')}
                      disabled={index === songs.length - 1}
                      className="p-1.5 text-slate-400 hover:text-orange-700 hover:bg-orange-100 rounded-lg disabled:opacity-30 transition"
                      title="Bajar posición"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleDelete(song.id, song.url)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar de Supabase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
