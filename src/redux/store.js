import { configureStore } from '@reduxjs/toolkit';
import legacyReducer from './reducer';
import employeeReducer from './slices/employeeSlice';
import models3dReducer from './slices/models3dSlice';
import modelReducer from './slices/modelSlice';

const rootReducer = (state, action) => {
  const legacyState = legacyReducer(state, action);
  const employeesState = employeeReducer(state?.employees, action);
  const models3dState = models3dReducer(state?.models3d, action);
  const modelState = modelReducer(state?.model, action);
  return {
    ...legacyState,
    employees: employeesState,
    models3d: models3dState,
    model: modelState
  };
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Supabase y jspdf usan Date/File — se ignoran solo esas rutas
        ignoredActions: ['GET_ALL_FROM_TABLE', 'SET_PREPROCESS_DATA'],
        ignoredPaths: ['preprocessData', 'employees.uploadedFile'],
      },
      immutableCheck: {
        // Solo desactivar en desarrollo para no impactar rendimiento en prod
        warnAfter: 128,
      },
    }),
});

export default store;
