import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { models3dService } from '../../services/models3dService';

// Thunks asíncronos
export const fetchModels3D = createAsyncThunk(
  'models3d/fetchModels3D',
  async (_, { rejectWithValue }) => {
    try {
      return await models3dService.getModels();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadModel3D = createAsyncThunk(
  'models3d/uploadModel3D',
  async (modelData, { rejectWithValue }) => {
    try {
      return await models3dService.createModel(modelData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveCustomization = createAsyncThunk(
  'models3d/saveCustomization',
  async (customData, { rejectWithValue }) => {
    try {
      return await models3dService.saveUserCustomization(customData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const models3dSlice = createSlice({
  name: 'models3d',
  initialState: {
    models: [],
    selectedModel: null,
    activeCustomization: {
      selected_colors: { base: '#d97706', secondary: '#451a03', accent: '#f59e0b', roughness: 0.4 },
      texture_settings: { rawStyle: 'flat', wireframe: false, roughness: 0.5 }
    },
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
    },
    updateActiveColor: (state, action) => {
      const { key, color } = action.payload;
      state.activeCustomization.selected_colors[key] = color;
    },
    updateTextureSetting: (state, action) => {
      const { key, value } = action.payload;
      state.activeCustomization.texture_settings[key] = value;
    },
    resetCustomization: (state) => {
      state.activeCustomization = {
        selected_colors: { base: '#d97706', secondary: '#451a03', accent: '#f59e0b', roughness: 0.4 },
        texture_settings: { rawStyle: 'flat', wireframe: false, roughness: 0.5 }
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModels3D.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels3D.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
        if (!state.selectedModel && action.payload.length > 0) {
          state.selectedModel = action.payload[0];
        }
      })
      .addCase(fetchModels3D.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadModel3D.fulfilled, (state, action) => {
        state.models.unshift(action.payload);
        state.selectedModel = action.payload;
      })
      .addCase(saveCustomization.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeCustomization.selected_colors = action.payload.selected_colors || state.activeCustomization.selected_colors;
          state.activeCustomization.texture_settings = action.payload.texture_settings || state.activeCustomization.texture_settings;
        }
      });
  }
});

export const {
  setSelectedModel,
  updateActiveColor,
  updateTextureSetting,
  resetCustomization
} = models3dSlice.actions;

export default models3dSlice.reducer;
