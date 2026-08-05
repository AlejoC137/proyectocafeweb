import { createSlice } from '@reduxjs/toolkit';
import { parseIfcJson } from '../../utils/ifcJsonParser';

/**
 * Slice de Redux Toolkit para el Visor BIM 3D Dinámico
 * Inicializa en estado limpio para cargar datos reales desde JSON / Supabase.
 */
const initialState = {
  modelLoaded: false,
  // Estructura JSON BIM Paramétrica Dinámica
  bimData: null,
  // Modo de Cámara: 'orthographic' | 'perspective'
  cameraMode: 'orthographic',
  // Vistas Predefinidas: 'iso' | 'top' | 'front' | 'side' | 'inside'
  presetView: 'iso',
  // Estilo Visual: 'revitTechnical' | 'vibrantColors' | 'wireframe'
  visualStyle: 'revitTechnical',
  // Caja de Sección (Corte de Techo/Paredes) 0.1 a 1.0
  sectionCut: 1.0,
  showSectionBox: false,
  // Capas / Visibilidad de Capas dinámicas
  layers: {},
  // Elemento Seleccionado dinámico
  activePart: null,
  selectedElementInfo: null,
  colors: {},
  exportStatus: 'idle'
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    // Cargar y normalizar un paquete o archivo JSON BIM / ifcJSON dinámico
    loadBimJson: (state, action) => {
      if (!action.payload) return;

      try {
        const parsed = parseIfcJson(action.payload);
        if (!parsed || !parsed.nodes || parsed.nodes.length === 0) return;

        state.bimData = parsed;
        state.modelLoaded = true;

        // Poblar capas dinámicas a partir de las categorías y layers reales del JSON
        const dynamicLayers = {};
        const dynamicColors = {};

        if (Array.isArray(parsed.layers) && parsed.layers.length > 0) {
          parsed.layers.forEach((l) => {
            const key = l.id || (l.name ? l.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default');
            dynamicLayers[key] = true;
            if (l.color_hex) dynamicColors[key] = l.color_hex;
          });
        } else {
          parsed.nodes.forEach((n) => {
            const cat = n.category || n.layer || 'BIM_Elements';
            const key = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
            dynamicLayers[key] = true;
            if (n.color_hex) dynamicColors[key] = n.color_hex;
          });
        }

        state.layers = dynamicLayers;
        state.colors = dynamicColors;
        state.activePart = null;
        state.selectedElementInfo = null;
      } catch (err) {
        console.error('Error al parsear modelo 3D en loadBimJson:', err);
      }
    },
    clearModel: (state) => {
      state.bimData = null;
      state.modelLoaded = false;
      state.layers = {};
      state.activePart = null;
      state.selectedElementInfo = null;
      state.colors = {};
    },
    setCameraMode: (state, action) => {
      state.cameraMode = action.payload;
    },
    setPresetView: (state, action) => {
      state.presetView = action.payload;
    },
    setVisualStyle: (state, action) => {
      state.visualStyle = action.payload;
    },
    setSectionCut: (state, action) => {
      state.sectionCut = action.payload;
    },
    toggleSectionBox: (state) => {
      state.showSectionBox = !state.showSectionBox;
    },
    toggleLayer: (state, action) => {
      const layerKey = action.payload;
      if (state.layers[layerKey] !== undefined) {
        state.layers[layerKey] = !state.layers[layerKey];
      }
    },
    setAllLayers: (state, action) => {
      const visible = action.payload;
      Object.keys(state.layers).forEach((k) => {
        state.layers[k] = visible;
      });
    },
    setActivePart: (state, action) => {
      state.activePart = action.payload;
    },
    setSelectedElementInfo: (state, action) => {
      state.selectedElementInfo = action.payload;
    },
    setPartColor: (state, action) => {
      const { part, color } = action.payload;
      if (state.colors[part] !== undefined) {
        state.colors[part] = color;
      }
      const nodes = state.bimData?.nodes || state.bimData?.elements || [];
      const el = nodes.find((e) => e.element_id === part || e.id === part || e.category === part || e.layer === part);
      if (el) {
        if (el.color_hex) el.color_hex = color;
        if (el.color) el.color = color;
      }
    },
    setExportStatus: (state, action) => {
      state.exportStatus = action.payload;
    },
    resetModelConfig: (state) => {
      return { ...initialState };
    }
  }
});

export const {
  loadBimJson,
  clearModel,
  setCameraMode,
  setPresetView,
  setVisualStyle,
  setSectionCut,
  toggleSectionBox,
  toggleLayer,
  setAllLayers,
  setActivePart,
  setSelectedElementInfo,
  setPartColor,
  setExportStatus,
  resetModelConfig
} = modelSlice.actions;

export default modelSlice.reducer;
