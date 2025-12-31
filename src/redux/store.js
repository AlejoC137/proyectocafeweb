import { configureStore } from '@reduxjs/toolkit';
import legacyReducer from './reducer';
import employeeReducer from './slices/employeeSlice';

// Manual reducer composition to support legacy root reducer + new slices
const rootReducer = (state, action) => {
  // 1. Ejecutar el reducer legacy (mantiene el estado base)
  const legacyState = legacyReducer(state, action);

  // 2. Ejecutar el reducer del slice de empleados
  // La clave 'employees' en el estado será manejada por este slice
  const employeesState = employeeReducer(state?.employees, action);

  // 3. Retornar el estado combinado
  return {
    ...legacyState,
    employees: employeesState
  };
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export default store;
