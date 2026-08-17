import React, { useState, useRef } from 'react';
import { X, Upload, Disc, Music, Tag, Smile, Save, Loader2, FileAudio, Image as ImageIcon, Layers, FolderPlus } from 'lucide-react';
import { parseMp3Metadata } from '../../utils/id3Parser';
import { MOOD_PRESETS } from './AlbumEditModal';
import { TWO_LAYER_GENRES_MAP, PARENT_GENRES, parseTwoLayerGenre, formatTwoLayerGenre } from '../../utils/genreHelpers';
import MusicCoversGalleryModal from './MusicCoversGalleryModal';
import { uploadAudioFilesBatchInParallel } from '../../utils/radioUploadHelper';
import { uploadCoverImageToSupabase } from '../../utils/coverUploadHelper';
import supabase from '../../config/supabaseClient';

export default function CreateAlbumModal({ isOpen, onClose, onAlbumCreated }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [parsedTracks, setParsedTracks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Modal de Galería musicCovers
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const coverFileInputRef = useRef(null);

  // Formulario del Álbum en 2 Capas
  const [albumName, setAlbumName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [parentGenre, setParentGenre] = useState('Hip Hop');
  const [subGenre, setSubGenre] = useState('Rap');
  const [mood, setMood] = useState('Chill & Relax');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [coverUrl, setCoverUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const availableSubGenres = TWO_LAYER_GENRES_MAP[parentGenre] || ['General', 'Clásico', 'Suave', 'Pesado', 'Nacional', 'Urbano'];

  const handleFilesSelected = async (filesArray) => {
    const validFiles = Array.from(filesArray || []).filter(f => f.name.match(/\.(mp3|flac|wav|m4a|aac|ogg|webm)$/i));
    if (validFiles.length === 0) {
      setErrorMsg('Selecciona archivos de audio válidos (.mp3, .m4a, .flac, .wav)');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setProcessingStatus(`Analizando metadatos de ${validFiles.length} canciones en paralelo...`);

    try {
      // Análisis de metadatos en paralelo
      const parsedResults = await Promise.all(validFiles.map(async (file) => {
        const meta = await parseMp3Metadata(file);
        return {
          file,
          meta,
          title: meta.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: meta.artist || 'Artista Desconocido',
          duration: meta.duration || 180,
          cover: meta.cover
        };
      }));

      let detectedAlbum = '';
      let detectedArtist = '';
      let detectedGenre = '';
      let detectedCover = '';
      let detectedYear = '';

      for (const item of parsedResults) {
        const meta = item.meta;
        if (!detectedAlbum && meta.album && meta.album !== 'Sencillo') detectedAlbum = meta.album;
        if (!detectedArtist && meta.artist && meta.artist !== 'Artista Desconocido') detectedArtist = meta.artist;
        if (!detectedGenre && meta.genre && meta.genre !== 'General') detectedGenre = meta.genre;
        if (!detectedCover && meta.cover) detectedCover = meta.cover;
        if (!detectedYear && meta.year) detectedYear = meta.year;
      }

      setSelectedFiles(validFiles);
      setParsedTracks(parsedResults);

      // Auto-llenar campos del álbum con los metadatos adquiridos
      if (detectedAlbum) setAlbumName(detectedAlbum);
      else if (validFiles.length > 0) setAlbumName(validFiles[0].name.split(/[-_]/)[0]?.trim() || 'Nuevo Álbum');
      if (detectedArtist) setArtistName(detectedArtist);
      if (detectedYear) setYear(detectedYear);
      if (detectedCover) setCoverUrl(detectedCover);
      else setCoverUrl('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400');

      if (detectedGenre) {
        const parsed = parseTwoLayerGenre(detectedGenre);
        setParentGenre(parsed.parent || 'Hip Hop');
        setSubGenre(parsed.sub || 'Rap');
      }

    } catch (err) {
      console.error("Error procesando metadatos MP3:", err);
      setErrorMsg("No se pudieron leer completamente los metadatos de los MP3.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadedUrl = await uploadCoverImageToSupabase(file, albumName, artistName);
      if (uploadedUrl) {
        setCoverUrl(uploadedUrl);
      }
    }
  };

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    if (!albumName.trim() || parsedTracks.length === 0) {
      setErrorMsg('Ingresa el nombre del álbum y agrega al menos una canción.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      let finalCover = coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400';
      const combinedGenre = formatTwoLayerGenre(parentGenre, subGenre);

      setProcessingStatus(`Subiendo ${parsedTracks.length} canciones en paralelo (3 simultáneas)...`);

      // Subida concurrente en paralelo (3 a la vez)
      const uploadedTracks = await uploadAudioFilesBatchInParallel(
        parsedTracks, 
        3, 
        (overallPct) => {
          setProcessingStatus(`Subiendo pistas en paralelo: ${overallPct}% completado...`);
        }
      );

      const songRecordsToInsert = uploadedTracks.map((item, i) => {
        let validCover = (item.cover && !item.cover.startsWith('data:')) 
          ? item.cover 
          : ((coverUrl && !coverUrl.startsWith('data:')) ? coverUrl : finalCover);

        return {
          title: item.title.trim(),
          artist: artistName.trim() || item.artist || 'Varios',
          album: albumName.trim(),
          genre: combinedGenre,
          mood: mood.trim(),
          year: year.trim(),
          cover: validCover,
          duration: Math.round(item.duration || 180),
          url: item.publicUrl,
          order_index: i
        };
      });

      setProcessingStatus(`Guardando ${songRecordsToInsert.length} canciones en la base de datos...`);

      // Inserción Masiva (Bulk Insert) en Supabase
      let { error: dbErr } = await supabase
        .from('playlist_radio')
        .insert(songRecordsToInsert.map(s => ({
          title: s.title,
          artist: s.artist,
          album: s.album,
          genre: s.genre,
          mood: s.mood,
          year: s.year,
          cover: s.cover,
          duration: s.duration,
          url: s.url,
          order_index: s.order_index
        })));

      if (dbErr) {
        console.warn("Fallo en bulk insert completo, reintentando con campos esenciales:", dbErr.message);
        // Fallback 1: Reintento masivo con campos estándar
        let retry = await supabase.from('playlist_radio').insert(songRecordsToInsert.map(s => ({
          title: s.title,
          artist: s.artist,
          album: s.album,
          genre: s.genre,
          url: s.url,
          cover: s.cover
        })));

        if (retry.error) {
          // Fallback 2: Reintento masivo con campos mínimos
          await supabase.from('playlist_radio').insert(songRecordsToInsert.map(s => ({
            title: s.title,
            artist: s.artist,
            url: s.url,
            cover: s.cover
          })));
        }
      }

      const insertedSongs = songRecordsToInsert.map((songRecord, i) => ({
        ...songRecord,
        id: `album-track-${Date.now()}-${i}`
      }));

      if (onAlbumCreated) {
        onAlbumCreated(insertedSongs);
      }

      onClose();
    } catch (err) {
      console.error("Error al crear el álbum:", err);
      setErrorMsg("Error al guardar el álbum en Supabase: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl border-[3.5px] border-black dark:border-slate-700 bg-white dark:bg-[#12131C] text-black dark:text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-[3px] border-black dark:border-slate-700 bg-[#1DB954] text-black font-black uppercase tracking-wider text-sm">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 animate-spin-slow" />
            <span>Crear Nuevo Álbum desde MP3</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition rounded-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 border-[2px] border-black bg-red-100 text-red-700 font-bold text-xs uppercase">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Zona de Carga de Archivos (Drag & Drop) */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-[3px] border-dashed border-black dark:border-slate-600 bg-cream-bg dark:bg-[#0d0e15] p-6 text-center transition hover:border-[#1DB954] cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              multiple
              accept="audio/*"
              id="albumMp3Upload"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <label htmlFor="albumMp3Upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-[#1DB954] animate-bounce" />
              <p className="text-xs font-black uppercase tracking-wider">
                Arrastra aquí tus archivos MP3 o haz clic para seleccionarlos
              </p>
              <p className="text-[10px] font-bold text-black/60 dark:text-slate-400 uppercase">
                Extraeremos automáticamente los metadatos (Título, Artista, Álbum, Año, Género y Portada)
              </p>
            </label>
          </div>

          {isProcessing && (
            <div className="p-3 border-[2px] border-black bg-yellow-100 dark:bg-yellow-950 text-black dark:text-yellow-200 text-xs font-black uppercase flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-black dark:text-yellow-400" />
              <span>{processingStatus}</span>
            </div>
          )}

          {/* Formulario de Metadatos Adquiridos del Álbum */}
          {parsedTracks.length > 0 && (
            <form onSubmit={handleSaveAlbum} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 p-3 border-[2.5px] border-black dark:border-slate-700 bg-emerald-50 dark:bg-[#091f14]">
                
                {/* Portada interactiva: clic para cambiar o subir */}
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <input
                    type="file"
                    ref={coverFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFileUpload}
                  />
                  <div
                    onClick={() => setShowGalleryModal(true)}
                    className="w-24 h-24 border-[2.5px] border-black overflow-hidden bg-black relative group cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    title="Haz clic para seleccionar carátula de la galería o subir nueva"
                  >
                    <img
                      src={coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400'}
                      alt="Portada del Álbum"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition p-1 text-center">
                      <ImageIcon className="w-5 h-5 text-white mb-1" />
                      <span className="text-[8px] font-black uppercase text-white leading-tight">Cambiar Portada</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-1.5 py-0.5 border border-black bg-white hover:bg-black hover:text-white text-[8px] font-extrabold uppercase transition"
                    >
                      📁 Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGalleryModal(true)}
                      className="px-1.5 py-0.5 border border-black bg-yellow-300 hover:bg-yellow-400 text-black text-[8px] font-extrabold uppercase transition"
                    >
                      🖼️ Galería
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {/* Nombre del Álbum */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Disc className="w-3 h-3 text-purple-600" /> Nombre del Álbum:
                    </label>
                    <input
                      type="text"
                      value={albumName}
                      onChange={(e) => setAlbumName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none focus:border-[#1DB954] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      required
                    />
                  </div>

                  {/* Artista Principal */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Music className="w-3 h-3 text-purple-600" /> Artista Principal:
                    </label>
                    <input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none focus:border-[#1DB954] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>

                  {/* Género Capa 1 libre y editable */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-600" /> 1. Género Principal (Sobrescribible):
                    </label>
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

                  {/* Género Capa 2 libre y editable */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" /> 2. Sub-género / Estilo (Sobrescribible):
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={subGenre}
                        onChange={(e) => setSubGenre(e.target.value)}
                        placeholder="Ej. Rap, Argentino, Suave..."
                        className="w-full px-2 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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

                  {/* Mood / Ambiente */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Smile className="w-3 h-3 text-amber-500" /> Mood / Ambiente:
                    </label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full px-2.5 py-1.5 border-[2px] border-black dark:border-slate-600 bg-white dark:bg-[#1a1b26] text-xs font-bold uppercase outline-none cursor-pointer rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {MOOD_PRESETS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Canciones Adquiridas */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Canciones Extraídas ({parsedTracks.length}):</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">✓ Metadatos Adquiridos</span>
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 border-[2px] border-black dark:border-slate-700 p-2 bg-white dark:bg-[#151622]">
                  {parsedTracks.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 border border-black/20 dark:border-white/10 text-xs font-bold bg-cream-bg dark:bg-[#1e1f2e]">
                      <div className="flex items-center gap-2 truncate">
                        <FileAudio className="w-4 h-4 text-[#1DB954] flex-shrink-0" />
                        <span className="font-mono text-[10px] w-4">{idx + 1}.</span>
                        <span className="truncate uppercase">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-70 ml-2">{Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Guardar Álbum Completo */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t-[2px] border-black dark:border-slate-700">
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
                  className="px-6 py-2.5 border-[2.5px] border-black bg-[#1DB954] text-black font-black uppercase text-xs hover:bg-emerald-400 transition rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando Álbum en Supabase...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Guardar Álbum en Base de Datos
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
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
