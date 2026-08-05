import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModels3D, uploadModel3D, setSelectedModel } from '../../../../redux/slices/models3dSlice';
import { loadBimJson } from '../../../../redux/slices/modelSlice';
import { parseIfcJson, isIfcJson } from '../../../../utils/ifcJsonParser';

/**
 * Componente Selector y Gestor de Modelos 3D de la Base de Datos (public.models3d)
 * Permite seleccionar, guardar e importar modelos con ifcJSON / BIM a Supabase.
 */
const ModelDbSelector = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { models = [], selectedModel, loading } = useSelector((state) => state.models3d || {});
  const { bimData } = useSelector((state) => state.model || {});

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewNodesCount, setPreviewNodesCount] = useState(null);

  // Manejar el cambio de selección en la lista desplegable de modelos
  const handleSelectModel = (e) => {
    const modelId = e.target.value;
    if (!modelId) return;

    const found = models.find((m) => String(m.id) === String(modelId));
    if (found) {
      dispatch(setSelectedModel(found));

      // Cargar en el visor 3D Redux (modelSlice)
      if (found.metadata_json && Object.keys(found.metadata_json).length > 0) {
        dispatch(loadBimJson(found.metadata_json));
      } else if (found.file_url && (found.file_url.endsWith('.json') || found.file_url.includes('json'))) {
        fetch(found.file_url)
          .then((res) => res.json())
          .then((data) => dispatch(loadBimJson(data)))
          .catch((err) => console.error('Error cargando URL de modelo 3D:', err));
      }
    }
  };

  // Manejar selección de archivo para subir a public.models3d
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseIfcJson(event.target.result);
        if (parsed && parsed.nodes) {
          setPreviewNodesCount(parsed.nodes.length);
        }
      } catch (err) {
        setPreviewNodesCount(null);
      }
    };
    reader.readAsText(file);
  };

  // Guardar/Subir nuevo modelo a la tabla public.models3d
  const handleSaveToDb = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Por favor ingresa un título para el modelo.');
      return;
    }

    setUploading(true);
    try {
      let metadataJson = {};
      let fileUrl = '';

      if (selectedFile) {
        const textContent = await selectedFile.text();
        const parsed = parseIfcJson(textContent);
        metadataJson = parsed || JSON.parse(textContent);
        fileUrl = `data:application/json;base64,${btoa(encodeURIComponent(JSON.stringify(metadataJson)))}`;
      } else if (bimData) {
        metadataJson = bimData;
        fileUrl = `json-embedded://${Date.now()}`;
      } else {
        alert('Selecciona un archivo JSON/ifcJSON o carga un modelo en el visor primero.');
        setUploading(false);
        return;
      }

      const createdModel = await dispatch(
        uploadModel3D({
          title: newTitle,
          description: newDescription || 'Modelo cargado en public.models3d',
          file_url: fileUrl,
          metadata_json: metadataJson
        })
      ).unwrap();

      dispatch(loadBimJson(createdModel.metadata_json));
      alert(`¡Modelo "${newTitle}" guardado exitosamente en la base de datos public.models3d!`);
      setShowUploadModal(false);
      setNewTitle('');
      setNewDescription('');
      setSelectedFile(null);
      setPreviewNodesCount(null);
      dispatch(fetchModels3D());
    } catch (err) {
      alert('Error guardando en la base de datos public.models3d: ' + err);
    } finally {
      setUploading(false);
    }
  };

  const activeModelTitle = selectedModel?.title || bimData?.project_name || 'Modelo Actual 3D';
  const isIfc = isIfcJson(selectedModel?.metadata_json || bimData);
  const nodeCount = bimData?.nodes?.length || selectedModel?.metadata_json?.nodes?.length || 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* SECTOR SELECCIÓN DE MODELO DESDE LA BD */}
      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗄️</span>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Base de Datos public.models3d
            </div>
            <div className="text-[11px] text-slate-400">
              {models.length} {models.length === 1 ? 'modelo registrado' : 'modelos registrados'}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <select
            value={selectedModel?.id || ''}
            onChange={handleSelectModel}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-700 text-amber-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
          >
            <option value="">-- Seleccionar modelo cargado en BD --</option>
            {models.map((m) => {
              const nodes = m.metadata_json?.nodes?.length || m.metadata_json?.elements?.length || 0;
              const hasIfc = isIfcJson(m.metadata_json);
              return (
                <option key={m.id} value={m.id}>
                  {hasIfc ? '🏗️ [ifcJSON] ' : '📦 [3D BIM] '}
                  {m.title} ({nodes} nodos)
                </option>
              );
            })}
          </select>
        </div>

        <button
          type="button"
          onClick={() => dispatch(fetchModels3D())}
          title="Recargar lista desde la base de datos Supabase"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-all cursor-pointer"
        >
          🔄
        </button>
      </div>

      {/* SECTOR BADGE MODELO ACTIVO & BOTÓN GUARDAR / SUBIR */}
      <div className="flex items-center gap-3 justify-between md:justify-end">
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${isIfc ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="font-semibold text-slate-200 max-w-[160px] truncate">
            {activeModelTitle}
          </span>
          <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono">
            {isIfc ? 'ifcJSON' : 'BIM 3D'} ({nodeCount})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          💾 Guardar en public.models3d
        </button>
      </div>

      {/* MODAL PARA SUBIR / GUARDAR MODELO EN LA BD */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                💾 Guardar Nuevo Modelo en public.models3d
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToDb} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título del Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Fachada Principal Proyecto Café (ifcJSON)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles de la estructura 3D, elementos BIM o especificaciones..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Archivo JSON o ifcJSON (.json)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    📁 {selectedFile ? selectedFile.name : 'Seleccionar Archivo .json'}
                  </button>
                  {previewNodesCount !== null && (
                    <span className="text-xs font-mono text-emerald-400">
                      ✅ {previewNodesCount} Nodos BIM Detectados
                    </span>
                  )}
                </div>
                {!selectedFile && bimData && (
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    💡 Si no seleccionas archivo, se guardará la escena 3D cargada actualmente ({bimData.nodes?.length || 0} nodos).
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg"
                >
                  {uploading ? 'Guardando...' : '🚀 Guardar en BD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelDbSelector;
