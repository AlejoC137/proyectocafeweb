import { configureStore } from '@reduxjs/toolkit';
import legacyReducer from './reducer';
import employeeReducer from './slices/employeeSlice';

const rootReducer = (state, action) => {
  const legacyState = legacyReducer(state, action);
  const employeesState = employeeReducer(state?.employees, action);
  return {
    ...legacyState,
    employees: employeesState
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
