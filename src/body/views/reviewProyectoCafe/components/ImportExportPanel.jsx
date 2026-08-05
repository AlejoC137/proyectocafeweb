import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadBimJson } from '../../../../redux/slices/modelSlice';

/**
 * Panel de Gestión, Importación y Exportación de Formatos 3D Web
 */
const ImportExportPanel = ({ model, activeCustomization, onImportConfig }) => {
  const dispatch = useDispatch();
  const bimData = useSelector((state) => state.model?.bimData);

  const [activeTab, setActiveTab] = useState('jsx'); // 'jsx' | 'json' | 'redux'
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);

  // 1. Generar Código JSX embebible
  const generateJSXCode = () => {
    const colors = activeCustomization?.selected_colors || {};
    const textures = activeCustomization?.texture_settings || { rawStyle: 'flat', wireframe: false };
    
    return `// =========================================================
// Componente React Visor 3D Interactivo
// Creado desde /review_ProyectoCafe
// =========================================================
import React from 'react';
import ThreeViewer from './ThreeViewer';

export default function Interactive3DModel() {
  const modelConfig = {
    title: "${model?.title || 'Modelo BIM 3D'}",
    fileUrl: "${model?.file_url || ''}",
    colors: ${JSON.stringify(colors, null, 2)},
    textureSettings: ${JSON.stringify(textures, null, 2)}
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-3">{modelConfig.title}</h2>
      <ThreeViewer 
        colors={modelConfig.colors}
        textureSettings={modelConfig.textureSettings}
      />
    </div>
  );
}`;
  };

  // 2. Generar JSON Paramétrico
  const generateJSONConfig = () => {
    if (bimData) {
      return JSON.stringify(bimData, null, 2);
    }
    const config = {
      model_id: model?.id || 'bim-3d-model',
      title: model?.title || 'Modelo 3D BIM',
      description: model?.description || 'Modelo interactivo estilizado de bajo peso',
      file_url: model?.file_url || '',
      selected_colors: activeCustomization?.selected_colors || {},
      texture_settings: activeCustomization?.texture_settings || {},
      exported_at: new Date().toISOString()
    };
    return JSON.stringify(config, null, 2);
  };

  // 3. Generar Código Redux State / Slice
  const generateReduxCode = () => {
    return `// Snippet para Redux Store / Slice
import { createSlice } from '@reduxjs/toolkit';

const model3dSlice = createSlice({
  name: 'activeModel3D',
  initialState: {
    id: "${model?.id || 'demo-3d'}",
    title: "${model?.title || 'Modelo BIM 3D'}",
    fileUrl: "${model?.file_url || ''}",
    colors: ${JSON.stringify(activeCustomization?.selected_colors || {}, null, 2)},
    textureSettings: ${JSON.stringify(activeCustomization?.texture_settings || {}, null, 2)}
  },
  reducers: {
    set3DColors: (state, action) => {
      state.colors = { ...state.colors, ...action.payload };
    }
  }
});

export default model3dSlice.reducer;`;
  };

  const getActiveCode = () => {
    if (activeTab === 'jsx') return generateJSXCode();
    if (activeTab === 'json') return generateJSONConfig();
    return generateReduxCode();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([generateJSONConfig()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelo_3d_${model?.id || 'bim'}_config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      dispatch(loadBimJson(parsed));
      if (onImportConfig) {
        onImportConfig(parsed);
      }
      setImportText('');
      alert('¡Modelo 3D BIM importado y cargado en el visor!');
    } catch (err) {
      setImportError('El formato introducido no es un JSON válido: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            ⚡ Exportar & Importar Configuración Web 3D
          </h3>
          <p className="text-xs text-slate-400">
            Genera código listo para copiar e implementar en React, Redux o descarga el archivo JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            💾 Descargar .JSON
          </button>
        </div>
      </div>

      {/* Pestañas de Selector de Código */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('jsx')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'jsx' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚛️ Componente React (JSX)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'json' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          📄 JSON Paramétrico
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('redux')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'redux' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🗃️ Redux State Code
        </button>
      </div>

      {/* Visor de Código */}
      <div className="relative">
        <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-amber-200 overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
          {getActiveCode()}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 shadow-sm transition-all cursor-pointer"
        >
          {copied ? '✅ ¡Copiado!' : '📋 Copiar Código'}
        </button>
      </div>

      {/* Formulario de Importación Rápida JSON */}
      <form onSubmit={handleImportSubmit} className="pt-2 border-t border-slate-800 flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>📥 Importar Configuración JSON Externa</span>
          {importError && <span className="text-red-400 text-xs font-normal">{importError}</span>}
        </label>
        <textarea
          rows={3}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Pega aquí un JSON de configuración 3D o paquete de Supabase..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 transition-all"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!importText.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            🚀 Cargar & Aplicar Configuración 3D
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportExportPanel;
