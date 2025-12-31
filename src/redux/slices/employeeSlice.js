import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// --- Thunks (Async Actions) ---
// Simula el fetch. En producción, reemplazar con la llamada real a supabase o axios.
// Como el proyecto ya tiene acciones para traer staff, podríamos reusarlas o hacer una nueva.
// Vamos a usar la misma lógica de "getAllFromTable" pero encapsulada aquí para la demo.
export const fetchEmployees = createAsyncThunk(
    'employees/fetchEmployees',
    async (_, { rejectWithValue }) => {
        try {
            // Aquí idealmente llamarías a tu servicio. Por ahora simulamos/reusamos el endpoint 'Staff'
            // Si tienes un servicio existente:
            // const response = await getDataFromSupabase('Staff');
            // return response;

            // NOTA: Para no romper el flujo existente, este slice quizás deba leer 
            // del estado global o hacer su propio fetch. Haremos fetch propio si es posible.
            // Asumiremos que el frontend tiene acceso a la instancia de supabase o axios.

            // Retornamos un array vacío por ahora para conectar la UI, esperando que se integre con la data real.
            return [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    list: [],            // Lista de empleados (Staff)
    selectedEmployee: null, // Empleado seleccionado para el modal
    loading: false,
    error: null,
};

const employeeSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        setEmployees: (state, action) => {
            // Aquí normalizamos la data si viene cruda (strings JSON)
            state.list = action.payload.map(emp => ({
                ...emp,
                // Intentar parsear JSONs si vienen como strings
                Turnos: typeof emp.Turnos === 'string' ? safeJsonParse(emp.Turnos, []) : emp.Turnos,
                Cuenta: typeof emp.Cuenta === 'string' ? safeJsonParse(emp.Cuenta, {}) : emp.Cuenta,
                infoContacto: typeof emp.infoContacto === 'string' ? safeJsonParse(emp.infoContacto, {}) : emp.infoContacto
            }));
        },
        selectEmployee: (state, action) => {
            state.selectedEmployee = action.payload;
        },
        clearSelection: (state) => {
            state.selectedEmployee = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                // Reusamos la lógica de setEmployees
                employeeSlice.caseReducers.setEmployees(state, action);
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Helper para parsear JSON sin romper la app
const safeJsonParse = (str, fallback) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
};

export const { setEmployees, selectEmployee, clearSelection } = employeeSlice.actions;
export default employeeSlice.reducer;
