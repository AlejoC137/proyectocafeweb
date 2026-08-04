import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ThreeViewer from './components/ThreeViewer';
import ImportExportPanel from './components/ImportExportPanel';
import {
  fetchModels3D,
  uploadModel3D,
  saveCustomization,
  setSelectedModel,
  updateActiveColor,
  updateTextureSetting
} from '../../../redux/slices/models3dSlice';

const ReviewProyectoCafe = () => {
  const dispatch = useDispatch();
  const { models, selectedModel, activeCustomization, loading, error } = useSelector((state) => state.models3d || {});

  const [activePart, setActivePart] = useState('base');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', file_url: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  // Cargar modelos 3D al montar
  useEffect(() => {
    dispatch(fetchModels3D());
  }, [dispatch]);

  // Manejar cambio de color en la pieza seleccionada
  const handleColorChange = (key, value) => {
    dispatch(updateActiveColor({ key, color: value }));
  };

  // Manejar guardado en Supabase / Backend API
  const handleSaveToDB = async () => {
    setSaveStatus('guardando');
    try {
      await dispatch(
        saveCustomization({
          model_id: selectedModel?.id || 'demo-3d-model',
          user_id: 'user_review_cafe',
          selected_colors: activeCustomization.selected_colors,
          texture_settings: activeCustomization.texture_settings
        })
      ).unwrap();

      setSaveStatus('éxito');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error al guardar personalización:', err);
      setSaveStatus('error');
    }
  };

  // Manejar Subida de Nuevo Modelo
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        uploadModel3D({
          title: uploadForm.title,
          description: uploadForm.description,
          file: selectedFile,
          file_url: uploadForm.file_url,
          metadata_json: {
            created_by: 'ReviewProyectoCafe',
            initial_colors: activeCustomization.selected_colors
          }
        })
      ).unwrap();

      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', file_url: '' });
      setSelectedFile(null);
      alert('¡Modelo 3D registrado con éxito!');
    } catch (err) {
      alert(`Error al subir modelo: ${err}`);
    }
  };

  // Manejar importación desde JSON en el panel
  const handleImportConfig = (config) => {
    if (config.selected_colors) {
      Object.entries(config.selected_colors).forEach(([k, v]) => {
        dispatch(updateActiveColor({ key: k, color: v }));
      });
    }
    if (config.texture_settings) {
      Object.entries(config.texture_settings).forEach(([k, v]) => {
        dispatch(updateTextureSetting({ key: k, value: v }));
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Cabecera / Hero Banner */}
        <div className="relative bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-900/20 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
                ☕ Visor & Gestión 3D Interactiva
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                /review_ProyectoCafe
              </h1>
              <p className="mt-2 text-slate-300 text-sm md:text-base max-w-2xl font-light">
                Modelado 3D interactivo de bajo peso para la web. Personaliza colores, texturas crudas estilizadas, guarda variaciones en la base de datos y genera código exportable en React Redux.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs md:text-sm border border-slate-700 shadow-lg transition-all flex items-center gap-2"
              >
                📤 Subir Modelo .GLB / JSON
              </button>
              
              <button
                type="button"
                onClick={handleSaveToDB}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs md:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                {saveStatus === 'guardando' ? '⏳ Guardando...' : saveStatus === 'éxito' ? '✅ ¡Guardado!' : '💾 Guardar en DB'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid Principal: Visor 3D y Controles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Visor 3D y Personalizador (7 Columnas) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Visor 3D */}
            <ThreeViewer
              colors={activeCustomization?.selected_colors}
              textureSettings={activeCustomization?.texture_settings}
              onPartSelect={(part) => setActivePart(part)}
              activePart={activePart}
            />

            {/* Panel de Personalización de Materiales y Colores */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  🎨 Paleta & Texturas Crudas Estilizadas
                </h3>
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono">
                  Pieza activa: <strong className="text-amber-400 capitalize">{activePart}</strong>
                </span>
              </div>

              {/* Controles de Colores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Color Base */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300">Color Base Principal</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={activeCustomization?.selected_colors?.base || '#d97706'}
                      onChange={(e) => handleColorChange('base', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-amber-400">
                      {activeCustomization?.selected_colors?.base || '#d97706'}
                    </span>
                  </div>
                </div>

                {/* Color Secundario */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300">Color Secundario (Cuerpo)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={activeCustomization?.selected_colors?.secondary || '#451a03'}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-amber-400">
                      {activeCustomization?.selected_colors?.secondary || '#451a03'}
                    </span>
                  </div>
                </div>

                {/* Color Acento */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300">Color Acento / Botones</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={activeCustomization?.selected_colors?.accent || '#f59e0b'}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-amber-400">
                      {activeCustomization?.selected_colors?.accent || '#f59e0b'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Ajustes de Acabado de Textura (Flat Raw Shading vs Smooth vs Wireframe) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Estilo Crudo / Flat Shading</div>
                    <div className="text-[11px] text-slate-400">Aspecto de bajo peso estilizado low-poly</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        updateTextureSetting({
                          key: 'rawStyle',
                          value: activeCustomization?.texture_settings?.rawStyle === 'flat' ? 'smooth' : 'flat'
                        })
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeCustomization?.texture_settings?.rawStyle === 'flat'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {activeCustomization?.texture_settings?.rawStyle === 'flat' ? 'ON (Flat)' : 'OFF (Smooth)'}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Modo Estructura Wireframe</div>
                    <div className="text-[11px] text-slate-400">Ver maya y polígonos del modelo</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        updateTextureSetting({
                          key: 'wireframe',
                          value: !activeCustomization?.texture_settings?.wireframe
                        })
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeCustomization?.texture_settings?.wireframe
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {activeCustomization?.texture_settings?.wireframe ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Columna Derecha: Galería de Modelos y Estado BD (5 Columnas) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Galería de Modelos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-base font-bold text-white flex items-center justify-between">
                <span>📦 Galería de Modelos 3D</span>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400">
                  {models?.length || 1} Modelo(s)
                </span>
              </h3>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Cargando modelos 3D...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Modelo Predeterminado Interactivo */}
                  <div
                    onClick={() =>
                      dispatch(
                        setSelectedModel({
                          id: 'demo-cafe-machine',
                          title: 'Máquina Espresso Estilizada (Low-Poly)',
                          description: 'Modelo interactivo predeterminado de bajo peso.',
                          file_url: 'https://proyectocafeweb.vercel.app/models/cafe.glb'
                        })
                      )
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedModel?.id === 'demo-cafe-machine' || !selectedModel
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-white">Máquina Espresso Estilizada</div>
                      <div className="text-xs text-slate-400 mt-0.5">Modelo WebGL nativo de bajo peso</div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg">
                      Activo
                    </span>
                  </div>

                  {/* Modelos desde BD / Backend */}
                  {models &&
                    models.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => dispatch(setSelectedModel(m))}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedModel?.id === m.id
                            ? 'bg-amber-950/30 border-amber-500/50 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{m.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                            {m.description || m.file_url}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(m.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Info de Base de Datos y APIs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-200">🛠️ Arquitectura Backend Configurada</h3>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✔</span> Tabla <code className="text-amber-300">models3d</code> y <code className="text-amber-300">user_customizations</code> listas en Supabase.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✔</span> Endpoints Express: <code className="text-slate-300">POST /api/models/upload</code>, <code className="text-slate-300">GET /api/models</code>, <code className="text-slate-300">PUT /api/models/:id/customize</code>.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✔</span> Integración con Multer + Supabase Storage bucket <code className="text-amber-300">models3d-assets</code>.
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Panel Inferior de Importación & Exportación de Código */}
        <ImportExportPanel
          model={selectedModel || { id: 'demo-cafe', title: 'Máquina Espresso Estilizada' }}
          activeCustomization={activeCustomization}
          onImportConfig={handleImportConfig}
        />

      </div>

      {/* Modal para Subir Modelo 3D */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400">📤 Subir Nuevo Modelo 3D (.GLB / JSON)</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-300">Título del Modelo</label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="ej. Taza de Café Artesanal 3D"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Descripción</label>
                <textarea
                  rows={2}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Descripción corta del modelo o geometría..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Archivo 3D (.glb / .gltf / .json)</label>
                <input
                  type="file"
                  accept=".glb,.gltf,.json"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">o URL Externa Directa (.glb)</label>
                <input
                  type="url"
                  value={uploadForm.file_url}
                  onChange={(e) => setUploadForm({ ...uploadForm, file_url: e.target.value })}
                  placeholder="https://ejemplo.com/modelo.glb"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Subir y Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewProyectoCafe;
