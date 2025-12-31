import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, setEmployees } from '../../../redux/slices/employeeSlice';
import { getAllFromTable } from '../../../redux/actions';
import { STAFF } from '../../../redux/actions-types';
import StaffTable from '../../components/staff/StaffTable';
import { Users, Filter, Plus } from 'lucide-react';

const StaffManager = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select both the new slice state AND potentially legacy state if needed
    const { list: employees, loading, error } = useSelector((state) => state.employees || { list: [] });
    // Fallback to legacy data source if the slice is empty (bridging logic)
    const legacyStaff = useSelector((state) => state.allStaff);

    useEffect(() => {
        // Sincronizar siempre que legacyStaff cambie
        if (legacyStaff.length > 0) {
            dispatch(setEmployees(legacyStaff));
        } else {
            // Si no hay nada en el legacy, lo pedimos para poblar allStaff
            dispatch(getAllFromTable(STAFF));
        }
    }, [dispatch, legacyStaff]);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-SpaceGrotesk">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            Gestión de Empleados
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Administra el personal, turnos y nómina desde un solo lugar.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition font-medium">
                            <Plus className="w-4 h-4" />
                            Nuevo Empleado
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading && employees.length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        Error cargando empleados: {error}
                    </div>
                ) : (
                    <StaffTable employees={employees.length > 0 ? employees : legacyStaff} />
                )}

            </div>
        </div>
    );
};

export default StaffManager;
