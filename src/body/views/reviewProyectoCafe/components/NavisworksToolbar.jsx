import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadBimJson,
  clearModel,
  setCameraMode,
  setVisualStyle,
  setSectionCut
} from '../../../../redux/slices/modelSlice';
import { uploadModel3D, fetchModels3D } from '../../../../redux/slices/models3dSlice';
import { parseIfcJson } from '../../../../utils/ifcJsonParser';

/**
 * Cinta de Opciones / Toolbar Autodesk Navisworks con Carga Dinámica de JSON & ifcJSON
 */
const NavisworksToolbar = ({ onExportGLB }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { cameraMode, visualStyle, sectionCut, bimData } = useSelector(
    (state) => state.model || {}
  );

  // Cargar archivo JSON o ifcJSON seleccionado por el usuario desde su disco
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const textContent = await file.text();
      const parsed = parseIfcJson(textContent);

      if (!parsed || !parsed.nodes || parsed.nodes.length === 0) {
        alert('El archivo JSON no contiene una estructura 3D BIM ni ifcJSON válida.');
        return;
      }

      // 1. Cargar en el visor 3D Redux (modelSlice)
      dispatch(loadBimJson(parsed));

      // 2. Persistir automáticamente en la base de datos public.models3d
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const fileUrl = `data:application/json;base64,${btoa(encodeURIComponent(JSON.stringify(parsed)))}`;

      try {
        await dispatch(
          uploadModel3D({
            title: title,
            description: `Modelo ${parsed.metadata?.is_ifc_json ? 'ifcJSON 4.0' : '3D BIM'} cargado desde archivo local`,
            file_url: fileUrl,
            metadata_json: parsed
          })
        ).unwrap();

        dispatch(fetchModels3D());
        alert(`¡Modelo "${title}" (${parsed.nodes.length} nodos) cargado en el visor y guardado en public.models3d!`);
      } catch (saveErr) {
        console.warn('El modelo se cargó en el visor pero falló la persistencia en BD:', saveErr);
        alert(`¡Modelo "${title}" cargado en el visor (${parsed.nodes.length} nodos 3D)!`);
      }
    } catch (err) {
      alert('Error al leer el archivo JSON/ifcJSON: ' + err.message);
    }
    e.target.value = ''; // Reset input
  };

  const handleClear = () => {
    if (window.confirm('¿Deseas limpiar la escena y eliminar los datos cargados?')) {
      dispatch(clearModel());
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
      {/* 1. SECTOR CÁMARA (ISOMÉTRICA VS PERSPECTIVA) */}
      <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">
          🎥 Proyección:
        </span>
        <button
          type="button"
          onClick={() => dispatch(setCameraMode('orthographic'))}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            cameraMode === 'orthographic'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          📐 Isométrica (CAD)
        </button>
        <button
          type="button"
          onClick={() => dispatch(setCameraMode('perspective'))}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            cameraMode === 'perspective'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          👁️ Perspectiva 3D
        </button>
      </div>

      {/* 2. SECTOR ESTILO VISUAL REVIT */}
      <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-400 pl-1 uppercase tracking-wider">
          🎨 Estilo:
        </span>
        <button
          type="button"
          onClick={() => dispatch(setVisualStyle('revitTechnical'))}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            visualStyle === 'revitTechnical'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
          title="Fondo Claro con Líneas Negras Resaltadas estilo Revit / Navisworks"
        >
          ✏️ Líneas Revit
        </button>
        <button
          type="button"
          onClick={() => dispatch(setVisualStyle('vibrantColors'))}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            visualStyle === 'vibrantColors'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          🌈 Sólidos
        </button>
      </div>

      {/* 3. PLANO DE CORTE (SECTION BOX SLIDER) */}
      <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 flex-1 max-w-xs">
        <span className="text-xs font-bold text-amber-400 pl-1 whitespace-nowrap">
          ✂️ Corte:
        </span>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          value={sectionCut || 1.0}
          onChange={(e) => dispatch(setSectionCut(parseFloat(e.target.value)))}
          className="w-full accent-amber-500 cursor-pointer"
        />
        <span className="text-xs font-mono text-slate-400 min-w-[35px]">
          {Math.round((sectionCut || 1.0) * 100)}%
        </span>
      </div>

      {/* 4. BOTONES CARGAR JSON/IFCJSON, LIMPIAR Y EXPORTAR GLB */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Cargar archivo .json o ifcJSON con estructura 3D BIM"
        >
          📥 Cargar JSON / ifcJSON
        </button>

        {bimData && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2.5 bg-red-950/60 hover:bg-red-900 text-red-200 font-bold rounded-xl text-xs border border-red-800/80 transition-all flex items-center gap-1 cursor-pointer"
            title="Limpiar la escena 3D"
          >
            🗑️ Limpiar
          </button>
        )}

        <button
          type="button"
          onClick={onExportGLB}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider border border-slate-700 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          📦 Exportar .GLB
        </button>
      </div>
    </div>
  );
};

export default NavisworksToolbar;
