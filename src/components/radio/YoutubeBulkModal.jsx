import React, { useState } from 'react';
import { X, Youtube, Sparkles, Loader2, CheckSquare, Square, Trash2, Plus, ExternalLink, ListPlus } from 'lucide-react';
import { parseBulkYoutubeInput, YOUTUBE_CATEGORIES } from '../../utils/youtubeHelpers';

export default function YoutubeBulkModal({ isOpen, onClose, onImport, categories = [], existingSongs = [] }) {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const [parsedTracks, setParsedTracks] = useState([]);
  const [globalCategory, setGlobalCategory] = useState('Lofi & Chill');
  const [isImporting, setIsImporting] = useState(false);
  const [omittedDuplicatesCount, setOmittedDuplicatesCount] = useState(0);

  if (!isOpen) return null;

  const availableCategories = categories.length > 0 ? categories : YOUTUBE_CATEGORIES.filter(c => c !== 'Todos');

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setParseStatus('Analizando enlaces y descartando duplicados...');
    setOmittedDuplicatesCount(0);
    try {
      const results = await parseBulkYoutubeInput(rawText, (current, total, msg) => {
        setParseStatus(msg || `Procesando video ${current} de ${total}...`);
      });

      // 1. Filtrar duplicados dentro del lote pegado y contra canciones existentes
      const uniqueResults = [];
      const seenKeys = new Set();
      let omittedCount = 0;

      for (const item of results) {
        const normTitle = (item.title || '').trim().toLowerCase();
        const vId = item.videoId || extractYoutubeId(item.url);
        const normUrl = item.url || '';

        const key = vId || normUrl || normTitle;

        // Repetición interna en el mismo lote
        if (key && seenKeys.has(key)) {
          omittedCount++;
          continue;
        }
        if (normTitle && normTitle.length > 3 && seenKeys.has(normTitle)) {
          omittedCount++;
          continue;
        }

        // Repetición contra biblioteca existente de Supabase / Radio
        const isDuplicateInLibrary = (existingSongs || []).some(existing => {
          const exId = existing.youtube_id || existing.videoId || extractYoutubeId(existing.youtube_url || existing.url);
          const exTitle = (existing.title || '').trim().toLowerCase();
          const exUrl = existing.youtube_url || existing.url;

          if (vId && exId && vId === exId) return true;
          if (normUrl && exUrl && normUrl === exUrl) return true;
          if (normTitle && exTitle && normTitle.length > 3 && normTitle === exTitle) return true;
          return false;
        });

        if (isDuplicateInLibrary) {
          omittedCount++;
          continue;
        }

        if (key) seenKeys.add(key);
        if (normTitle && normTitle.length > 3) seenKeys.add(normTitle);
        uniqueResults.push(item);
      }

      setOmittedDuplicatesCount(omittedCount);

      const formatted = uniqueResults.map((item, idx) => ({
        ...item,
        title: item.title?.trim() ? item.title : `Video YouTube ${idx + 1}`,
        artist: item.artist?.trim() ? item.artist : 'Canal de YouTube',
        cover: item.cover || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
        selected: true,
        category: globalCategory,
        tempId: `${item.videoId || idx}-${idx}-${Date.now()}`
      }));

      setParsedTracks(formatted);
    } catch (err) {
      console.error("Error al analizar enlaces de YouTube:", err);
    } finally {
      setIsParsing(false);
      setParseStatus('');
    }
  };

  const handleToggleSelectAll = () => {
    const allSelected = parsedTracks.every(t => t.selected);
    setParsedTracks(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const handleToggleSelect = (tempId) => {
    setParsedTracks(prev => prev.map(t => t.tempId === tempId ? { ...t, selected: !t.selected } : t));
  };

  const handleRemoveTrack = (tempId) => {
    setParsedTracks(prev => prev.filter(t => t.tempId !== tempId));
  };

  const handleTrackChange = (tempId, field, value) => {
    setParsedTracks(prev => prev.map(t => t.tempId === tempId ? { ...t, [field]: value } : t));
  };

  const handleApplyGlobalCategory = (cat) => {
    setGlobalCategory(cat);
    setParsedTracks(prev => prev.map(t => ({ ...t, category: cat })));
  };

  const handleConfirmImport = async () => {
    const selectedTracks = parsedTracks.filter(t => t.selected && t.title.trim());
    if (selectedTracks.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(selectedTracks);
      // Limpiar y cerrar
      setRawText('');
      setParsedTracks([]);
      onClose();
    } catch (err) {
      console.error("Error importando lista de YouTube:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = parsedTracks.filter(t => t.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-4xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500">
              <Youtube className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Importación Masiva y de Playlists de YouTube
              </h2>
              <p className="text-xs text-gray-400">Pega múltiples URLs o un enlace de Playlist completa para leerlos automáticamente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isParsing || isImporting}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpos del Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Paso 1: Entrada de Enlaces / Textarea */}
          <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
            <label className="block text-xs font-extrabold uppercase text-gray-300 tracking-wider">
              1. Pega enlaces de YouTube o la URL de una Playlist completa
            </label>
            
            <textarea 
              rows={4}
              placeholder="Ejemplos soportados:&#10;• https://www.youtube.com/playlist?list=PL...&#10;• https://www.youtube.com/watch?v=5qap5aO4i9A&#10;• https://youtu.be/21qNxnCS8MA (una URL por línea o bloque de texto)"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isParsing || isImporting}
              className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-red-500 placeholder-gray-500 custom-scrollbar resize-none"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-400">
                {isParsing ? (
                  <span className="text-red-400 font-bold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {parseStatus}
                  </span>
                ) : (
                  <span>Soporta URLs individuales, shorts, playlists y texto copiado directamente de YouTube.</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleParse}
                disabled={!rawText.trim() || isParsing || isImporting}
                className="py-2.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analizar Enlaces y Leer Nombres
              </button>
            </div>
          </div>

          {/* Paso 2: Vista previa y edición de videos detectados */}
          {parsedTracks.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 text-xs font-bold text-white hover:text-red-400 transition"
                  >
                    {parsedTracks.every(t => t.selected) ? (
                      <CheckSquare className="w-4 h-4 text-red-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    Seleccionar Todos ({selectedCount}/{parsedTracks.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 font-bold">Categoría global:</span>
                  <select 
                    value={globalCategory}
                    onChange={(e) => handleApplyGlobalCategory(e.target.value)}
                    className="px-3 py-1 bg-black/60 border border-white/20 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat} className="bg-[#181818]">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de elementos parseados */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {parsedTracks.map((track) => (
                  <div 
                    key={track.tempId} 
                    className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                      track.selected ? 'bg-white/5 border-white/20' : 'bg-black/20 border-white/5 opacity-60'
                    }`}
                  >
                    <button 
                      onClick={() => handleToggleSelect(track.tempId)}
                      className="text-gray-400 hover:text-white transition flex-shrink-0"
                    >
                      {track.selected ? (
                        <CheckSquare className="w-5 h-5 text-red-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                      <img 
                        src={track.cover || `https://img.youtube.com/vi/${track.videoId}/hqdefault.jpg`} 
                        alt={track.title}
                        onError={(e) => {
                          e.currentTarget.src = track.videoId 
                            ? `https://img.youtube.com/vi/${track.videoId}/0.jpg` 
                            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 w-full">
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-gray-400 font-bold uppercase">Título de la Canción</label>
                        <input 
                          type="text" 
                          value={track.title}
                          onChange={(e) => handleTrackChange(track.tempId, 'title', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/60 border border-white/20 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-gray-400 font-bold uppercase">Artista / Canal</label>
                        <input 
                          type="text" 
                          value={track.artist}
                          onChange={(e) => handleTrackChange(track.tempId, 'artist', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/60 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-gray-400 font-bold uppercase">Categoría</label>
                        <select 
                          value={track.category}
                          onChange={(e) => handleTrackChange(track.tempId, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 bg-black/60 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 font-bold"
                        >
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat} className="bg-[#181818]">{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-center">
                      <a 
                        href={track.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-red-400 transition"
                        title="Ver en YouTube"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleRemoveTrack(track.tempId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                        title="Quitar de la lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Botones */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#202020] flex items-center justify-between">
          <div className="text-xs text-gray-400 font-bold">
            {parsedTracks.length > 0 && (
              <span>{selectedCount} de {parsedTracks.length} videos listos para guardar</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="py-2.5 px-5 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-extrabold transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0 || isImporting}
              className="py-2.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando en Radio...
                </>
              ) : (
                <>
                  <ListPlus className="w-4 h-4" /> Importar {selectedCount} Videos Seleccionados
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
