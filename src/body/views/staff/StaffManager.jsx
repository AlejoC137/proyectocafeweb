import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, setEmployees } from '../../../redux/slices/employeeSlice';
import { getAllFromTable } from '../../../redux/actions';
import { STAFF } from '../../../redux/actions-types';
import StaffTable from '../../components/staff/StaffTable';
import StaffCalendarView from '../../components/staff/StaffCalendarView';
import { Users, Filter, Plus, DollarSign, Calendar, List, Download, ChevronDown, Check } from 'lucide-react';
import { exportStaffToCSV, exportSingleStaffToCSV } from '../../../utils/staffCsvExport';

const StaffManager = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
    const [selectedIds, setSelectedIds] = useState([]);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);

    // Select both the new slice state AND potentially legacy state if needed
    const { list: employees, loading, error } = useSelector((state) => state.employees || { list: [] });
    // Fallback to legacy data source if the slice is empty (bridging logic)
    const legacyStaff = useSelector((state) => state.allStaff);

    const currentEmployees = useMemo(
        () => (employees.length > 0 ? employees : legacyStaff),
        [employees, legacyStaff]
    );

    const activeEmployees = useMemo(
        () => currentEmployees.filter((emp) => emp.Contratacion !== false && emp.Contratacion !== 'false'),
        [currentEmployees]
    );

    const inactiveEmployees = useMemo(
        () => currentEmployees.filter((emp) => emp.Contratacion === false || emp.Contratacion === 'false'),
        [currentEmployees]
    );

    const selectedEmployees = useMemo(
        () => currentEmployees.filter((emp) => selectedIds.includes(emp._id)),
        [currentEmployees, selectedIds]
    );

    useEffect(() => {
        // Sincronizar siempre que legacyStaff cambie
        if (legacyStaff.length > 0) {
            dispatch(setEmployees(legacyStaff));
        } else {
            // Si no hay nada en el legacy, lo pedimos para poblar allStaff
            dispatch(getAllFromTable(STAFF));
        }
    }, [dispatch, legacyStaff]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleSelect = (empId) => {
        setSelectedIds((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        );
    };

    const handleToggleSelectAll = (targetList) => {
        const targetIds = targetList.map((emp) => emp._id);
        const allSelected = targetIds.length > 0 && targetIds.every((id) => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...targetIds])));
        }
    };

    const handleExportSelected = () => {
        if (selectedEmployees.length === 1) {
            exportSingleStaffToCSV(selectedEmployees[0]);
        } else if (selectedEmployees.length > 1) {
            exportStaffToCSV(selectedEmployees, 'staff_seleccionados');
        }
        setShowExportMenu(false);
    };

    return (
        <div className="h-screen w-full bg-gray-50 flex flex-col font-SpaceGrotesk overflow-hidden">
            <div className="flex-none p-6 space-y-4 bg-white border-b shadow-sm z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-6 h-6 text-blue-600" />
                            Gestión de Empleados
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Administra el personal, turnos y nómina desde un solo lugar.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <List className="w-4 h-4" />
                                Lista
                            </button>
                            <button 
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <Calendar className="w-4 h-4" />
                                Horarios
                            </button>
                        </div>
                        
                        <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition text-sm">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </button>

                        {selectedEmployees.length > 0 && (
                            <button
                                onClick={handleExportSelected}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md transition font-medium text-sm"
                                title="Descargar CSV de los empleados seleccionados"
                            >
                                <Download className="w-4 h-4" />
                                CSV Seleccionados ({selectedEmployees.length})
                            </button>
                        )}

                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu((prev) => !prev)}
                                disabled={currentEmployees.length === 0}
                                className="flex items-center gap-2 px-3 py-1.5 border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition font-medium text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Exportar CSV
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                                    <button
                                        onClick={() => {
                                            exportStaffToCSV(currentEmployees, 'staff_todos');
                                            setShowExportMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                    >
                                        <span>Todos los empleados</span>
                                        <span className="text-xs font-semibold text-gray-400">{currentEmployees.length}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            exportStaffToCSV(activeEmployees, 'staff_activos');
                                            setShowExportMenu(false);
                                        }}
                                        disabled={activeEmployees.length === 0}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-between"
                                    >
                                        <span>Solo activos</span>
                                        <span className="text-xs font-semibold text-green-600">{activeEmployees.length}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            exportStaffToCSV(inactiveEmployees, 'staff_inactivos');
                                            setShowExportMenu(false);
                                        }}
                                        disabled={inactiveEmployees.length === 0}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-between"
                                    >
                                        <span>Solo inactivos</span>
                                        <span className="text-xs font-semibold text-gray-500">{inactiveEmployees.length}</span>
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                        onClick={handleExportSelected}
                                        disabled={selectedEmployees.length === 0}
                                        className="w-full px-4 py-2 text-left text-sm text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-40 disabled:text-gray-400 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Check className="w-3.5 h-3.5" />
                                            Seleccionados
                                        </span>
                                        <span className="text-xs font-semibold">{selectedEmployees.length}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => navigate('/StaffCreator')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Empleado
                        </button>
                        <button
                            onClick={() => navigate('/staff-manager/tips')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition font-medium text-sm"
                        >
                            <DollarSign className="w-4 h-4" />
                            Distribución Propinas
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full overflow-hidden p-6">
                {loading && employees.length === 0 ? (
                    <div className="flex justify-center h-full items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                            Error cargando empleados: {error}
                        </div>
                    </div>
                ) : viewMode === 'table' ? (
                    <StaffTable
                        employees={currentEmployees}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                    />
                ) : (
                    <StaffCalendarView employees={currentEmployees} />
                )}
            </div>
        </div>
    );
};

export default StaffManager;
