import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    Search, Download, Plus,
    XCircle, ArrowUpDown, ChevronRight, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Componentes locales
import FormTask from './FormTask.jsx';
// Acciones de Redux y Tipos
import { getAllFromTable } from "../../../../redux/actions";
import { addTask, deleteTask, updateTask } from "../../../../redux/standaloneTaskActions";
import { AREAS } from '../../../../redux/actions-types.js';
import ProcedimientoModal from '../../ventaCompra/ProcedimientoModal.jsx';

// --- Constantes y Helpers (sin cambios) ---
const getEstadoColor = (estado) => {
    // ... (código sin cambios)
};
const getPriorityColor = (priority) => {
    // ... (código sin cambios)
};
// --- FIN Constantes y Helpers ---

// Ya no necesitamos initialColumns para definir anchos de tabla
const columnHeaders = [
    { key: 'Procedimientos', label: 'Procedimientos', sortable: true },
    { key: 'Ejecutor', label: 'Ejecutor', sortable: true },
    { key: 'Notas', label: 'Notas', sortable: true },
];

// --- Componente Principal ---
const WorkIsueStaff = () => {
    const dispatch = useDispatch();
    const [rawData, setRawData] = useState([]);
    const [staff, setStaff] = useState([]);
    const [procedimientos, setProcedimientos] = useState([]);
    const [recetasProduccion, setRecetasProduccion] = useState([]);
    const [filters, setFilters] = useState({ search: '', Priority: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'Priority', direction: 'descending' });
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());

    // --- Lógica de datos (sin cambios) ---
    const fetchAllData = useCallback(async () => {
        const [tareasAction, staffAction, ProcedimientoAction, RecetasProduccionAction] = await Promise.all([
            dispatch(getAllFromTable("WorkIsue")),
            dispatch(getAllFromTable("Staff")),
            dispatch(getAllFromTable("RecetasProcedimientos")),
            dispatch(getAllFromTable("RecetasProduccion"))
        ]);
        if (tareasAction?.payload) setRawData(tareasAction.payload);
        if (staffAction?.payload) setStaff(staffAction.payload);
        if (ProcedimientoAction?.payload) setProcedimientos(ProcedimientoAction.payload);
        if (RecetasProduccionAction?.payload) setRecetasProduccion(RecetasProduccionAction.payload);
    }, [dispatch]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const processedData = useMemo(() => rawData.map(task => ({
        ...task,
        assigneeName: staff.find(s => s._id === task.Ejecutor)?.Nombre || 'Sin asignar',
    })), [rawData, staff]);

    const filteredData = useMemo(() => {
        let filtered = [...processedData];
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchLower))
            );
        }
        if (filters.Priority) filtered = filtered.filter(item => item.Priority === filters.Priority);
        return filtered;
    }, [processedData, filters]);

    const groupedAndSortedItems = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems.reduce((acc, item) => {
            const groupName = item.entregableType || 'Tareas Generales';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(item);
            return acc;
        }, {});
    }, [filteredData, sortConfig]);

    const toggleGroup = (groupName) => setCollapsedGroups(prev => {
        const newSet = new Set(prev);
        newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName);
        return newSet;
    });

    const requestSort = (key) => {
        const direction = (sortConfig.key === key && sortConfig.direction === 'ascending') ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };
    // --- FIN Lógica de datos ---
    console.log(groupedAndSortedItems);

    return (
        <div className="flex flex-col h-full font-sans">
            <main className="flex-1 overflow-auto p-2">
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-md bg-white text-sm">

                    {/* --- INICIO: NUEVO HEADER CON FLEXBOX --- */}
                    <div className="flex bg-slate-100 border-b-2 border-slate-300 font-semibold text-xs text-slate-600 uppercase sticky top-0 z-20">
                        <div className="px-4 py-3 w-[120px] shrink-0"> {/* Ancho Mínimo Fijo */}
                            <button onClick={() => requestSort('Procedimientos')} className="flex items-center justify-center w-full gap-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 px-2 py-1.5 rounded shadow-sm text-xs transition-colors font-bold">
                                Tarea <ArrowUpDown size={14} />
                            </button>
                        </div>
                        <div className="px-4 py-3 w-[120px] shrink-0"> {/* Ancho Mínimo Fijo */}
                            <button onClick={() => requestSort('Ejecutor')} className="flex items-center justify-center w-full gap-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 px-2 py-1.5 rounded shadow-sm text-xs transition-colors font-bold">
                                Ejecutor <ArrowUpDown size={14} />
                            </button>
                        </div>
                        <div className="px-4 py-3 flex-1"> {/* Espacio Flexible */}
                            <button onClick={() => requestSort('Notas')} className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded shadow-sm text-xs transition-colors font-bold">
                                Título / Notas <ArrowUpDown size={14} />
                            </button>
                        </div>
                    </div>
                    {/* --- FIN: NUEVO HEADER --- */}

                    {/* --- INICIO: NUEVA LISTA DE TAREAS CON FLEXBOX --- */}
                    <div className="divide-y divide-slate-200">
                        {Object.keys(groupedAndSortedItems).sort().map(groupName => (
                            <div key={groupName}>
                                {/* Fila de Grupo */}
                                <div className="bg-slate-200/70 sticky top-[49px] z-10 cursor-pointer border-y border-slate-300" onClick={() => toggleGroup(groupName)}>
                                    <div className="py-2 px-4 font-bold text-slate-700 flex items-center gap-2">
                                        {collapsedGroups.has(groupName) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                        {groupName} <span className='font-normal text-slate-600'>({groupedAndSortedItems[groupName].length})</span>
                                    </div>
                                </div>

                                {/* Filas de Tareas */}
                                {!collapsedGroups.has(groupName) && groupedAndSortedItems[groupName].map((item) => (
                                    <div key={item._id} className='flex hover:bg-slate-50 border-b'>

                                        {/* === INICIO: CELDA DE PROCEDIMIENTO (SIN TÍTULO) === */}
                                        <div className="p-2 w-[120px] shrink-0 break-words align-top flex flex-col gap-1">
                                            {(() => {
                                                let parsedProcedimientos = [];
                                                try {
                                                    parsedProcedimientos = JSON.parse(item.Procedimientos);
                                                } catch (error) {
                                                    return <span className="text-slate-400 italic">N/A</span>;
                                                }

                                                if (!Array.isArray(parsedProcedimientos) || parsedProcedimientos.length === 0) {
                                                    return <span className="text-slate-400 italic">Sin Proc.</span>;
                                                }

                                                return parsedProcedimientos.map(procRef => {
                                                    const procedimientoId = procRef._id;
                                                    const tipo = procRef._tipo;

                                                    if (!procedimientoId) return null;

                                                    let dataItem = null;
                                                    let href = '';
                                                    let icon = '';

                                                    if (tipo === 'procedimiento') {
                                                        dataItem = procedimientos.find(p => p._id === procedimientoId);
                                                        href = `/ProcedimientoModal/${procedimientoId}`;
                                                        icon = '📕';
                                                    } else {
                                                        dataItem = recetasProduccion.find(r => r._id === procedimientoId);
                                                        href = `/receta/${procedimientoId}`;
                                                        icon = '📜';
                                                    }

                                                    if (!dataItem) {
                                                        return (
                                                            <span key={procedimientoId} className="text-red-500 italic text-xs">
                                                                ID no encontrado
                                                            </span>
                                                        );
                                                    }

                                                    // ===== CORRECCIÓN: Usar _name o el nombre del dataItem como fallback =====
                                                    const procedureName = procRef._name || dataItem.tittle || dataItem.Nombre || dataItem.Nombre_del_producto || "Sin Nombre";

                                                    return (
                                                        <a
                                                            key={procedimientoId}
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 p-1 px-1.5 rounded-md font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 text-xs"
                                                            title={procedureName}
                                                        >
                                                            {icon} {`${procedureName}`}
                                                        </a>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        {/* === FIN: CELDA DE PROCEDIMIENTO === */}

                                        <div className="p-2 w-[120px] shrink-0 break-words align-top">
                                            <StaticCell field="Ejecutor" value={item.Ejecutor} options={staff} type="select-staff" />
                                        </div>

                                        {/* === INICIO: CELDA DE TÍTULO Y NOTAS === */}
                                        <div className="p-2 flex-1 break-words align-top flex flex-col gap-1">
                                            {/* ===== TÍTULO DEL WORKISUE ===== */}
                                            <span className="font-semibold text-slate-800 break-words">
                                                {item.Tittle || "Sin Título"}
                                            </span>
                                            {/* ===== NOTAS DEL WORKISUE ===== */}
                                            <StaticCell field="Notas" value={item.Notas} />
                                        </div>
                                        {/* === FIN: CELDA DE TÍTULO Y NOTAS === */}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    {/* --- FIN: NUEVA LISTA --- */}

                </div>
            </main>
        </div>
    );
};


// --- Componente de Celda Estática (Solo Lectura) ---
const StaticCell = ({ field, value, type = 'text', options = [] }) => {
    let displayValue = value || (field === 'Notas' ? <span className="text-slate-400 italic">Sin Notas</span> : '-');

    if (type === 'select-staff') {
        const staffMember = options.find(s => s._id === value);
        displayValue = staffMember ? staffMember.Nombre : <span className="text-slate-400 italic">Sin asignar</span>;
    }

    // El 'displayValue' para las notas ya está manejado arriba
    // (si el valor es nulo, muestra "Sin Notas")
    return <div>{displayValue}</div>;
};
export default WorkIsueStaff;