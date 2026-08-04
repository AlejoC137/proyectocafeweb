import { createSlice } from '@reduxjs/toolkit';

/**
 * Slice de Redux Toolkit para el Visor BIM/Navisworks Proyecto Café 3D
 */
const initialState = {
  modelLoaded: true,
  // Modo de Cámara: 'orthographic' (Axonométrica/Isométrica Navisworks) | 'perspective' (Perspectiva)
  cameraMode: 'orthographic',
  // Vistas Predefinidas: 'iso' | 'top' | 'front' | 'side' | 'inside'
  presetView: 'iso',
  // Estilo Visual: 'revitTechnical' (Plano Técnico Líneas Negras) | 'vibrantColors' | 'wireframe'
  visualStyle: 'revitTechnical',
  // Caja de Sección (Corte de Techo/Paredes) 0.1 a 1.0
  sectionCut: 1.0,
  showSectionBox: true,
  // Capas / Visibilidad de Capas del Proyecto Café (BIM Navisworks)
  layers: {
    walls: true,         // Paredes y Envolvente
    kitchen: true,       // Cocina, Estanterías y Extractor
    menu: true,          // Menú Superior ($500.000)
    tableros: true,      // Tableros Marcador ($300.000)
    lavaplato: true,     // Lava Platos ($2.000.000)
    furniture: true,     // Mesas, Sillas y Barra
    plants: true,        // Plantas y Decoración Exterior
    annotations: true    // Etiquetas / Callouts 3D de Precios
  },
  // Pieza / Elemento Seleccionado
  activePart: 'menu',
  selectedElementInfo: {
    id: 'menu-1',
    name: 'Menú Superior',
    detail: 'Hecho a medida',
    price: '$500.000',
    category: 'Mobiliario Especial'
  },
  // Colores por Capa/Elemento
  colors: {
    base: '#f8fafc',       // Blanco Técnico Revit
    walls: '#0f172a',      // Negro/Gris Líneas
    kitchen: '#334155',    // Acero Inoxidable / Gris
    menu: '#3b82f6',       // Azul Resaltado (como el marco azul de la foto)
    tableros: '#d97706',   // Madera Formica
    lavaplato: '#0284c7',  // Azul Célula
    furniture: '#475569',
    plants: '#16a34a'
  },
  exportStatus: 'idle'
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setCameraMode: (state, action) => {
      state.cameraMode = action.payload; // 'orthographic' | 'perspective'
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
