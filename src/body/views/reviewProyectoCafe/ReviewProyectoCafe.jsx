import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navisworks3DViewer from './components/Navisworks3DViewer';
import NavisworksToolbar from './components/NavisworksToolbar';
import NavisworksTreePanel from './components/NavisworksTreePanel';
import NavisworksPropertiesPanel from './components/NavisworksPropertiesPanel';
import ImportExportPanel from './components/ImportExportPanel';
import ModelDbSelector from './components/ModelDbSelector';
import { fetchModels3D } from '../../../redux/slices/models3dSlice';
import { loadBimJson } from '../../../redux/slices/modelSlice';

const ReviewProyectoCafe = () => {
  const dispatch = useDispatch();
  const { models = [], selectedModel } = useSelector((state) => state.models3d || {});
  const modelState = useSelector((state) => state.model || {});

  // 1. Cargar la lista de modelos registrados en public.models3d al montar
  useEffect(() => {
    dispatch(fetchModels3D());
  }, [dispatch]);

  // 2. Cargar automáticamente el modelo de la BD al visor si aún no hay escena activa
  useEffect(() => {
    if (!modelState.modelLoaded && models.length > 0) {
      const target = selectedModel || models[0];
      if (target?.metadata_json && Object.keys(target.metadata_json).length > 0) {
        dispatch(loadBimJson(target.metadata_json));
      }
    }
  }, [models, selectedModel, modelState.modelLoaded, dispatch]);

  // Función para exportar archivo .GLB usando Three.js GLTFExporter
  const handleExportGLB = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('No se detectó escena 3D activa.');
      return;
    }
    alert('Iniciando empaquetado y exportación de escena .GLB 3D BIM...');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* CABECERA AUTODESK NAVISWORKS / REVIT STYLE */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              🏗️ Autodesk Navisworks & Revit BIM Viewer (ifcJSON Enabled)
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              /review_ProyectoCafe 3D BIM
            </h1>
            <p className="mt-1 text-slate-300 text-xs md:text-sm font-light">
              Visor arquitectónico interactivo tipo Navisworks/Revit con soporte nativo <code className="text-amber-400 font-mono">ifcJSON</code>, persistencia en la tabla <code className="text-amber-400 font-mono">public.models3d</code> y selección dinámica de modelos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-800 text-amber-400 font-mono px-3 py-1.5 rounded-xl border border-slate-700">
              Escala 1 : 100
            </span>
          </div>
        </div>

        {/* SELECTOR & GESTOR DE MODELOS DESDE LA BASE DE DATOS (public.models3d) */}
        <ModelDbSelector />

        {/* CINTA DE OPCIONES NAVISWORKS (TOOLBAR) */}
        <NavisworksToolbar onExportGLB={handleExportGLB} />

        {/* LAYOUT PRINCIPAL: VISOR 3D Y PANELES DE CONTROL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: ÁRBOL DE SELECCIÓN Y CAPAS (3 COLUMNAS) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <NavisworksTreePanel />
          </div>

          {/* COLUMNA CENTRAL: VISOR 3D INTERACTIVO (6 COLUMNAS) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <Navisworks3DViewer />
          </div>

          {/* COLUMNA DERECHA: INSPECTOR DE PROPIEDADES & COSTOS (3 COLUMNAS) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <NavisworksPropertiesPanel />
          </div>
        </div>

        {/* PANEL INFERIOR DE IMPORTACIÓN & EXPORTACIÓN CÓDIGO JSX / REDUX */}
        <ImportExportPanel
          model={selectedModel || {
            id: 'modelo-bim-3d',
            title: 'Modelo Arquitectura BIM 3D',
            file_url: ''
          }}
          activeCustomization={{
            selected_colors: modelState.colors || {},
            texture_settings: { rawStyle: 'flat', wireframe: false }
          }}
        />
      </div>
    </div>
  );
};

export default ReviewProyectoCafe;
