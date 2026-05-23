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
import { getAllFromTable } from "../../../../redux/actions.js";
import { addTask, deleteTask, updateTask } from "../../../../redux/standaloneTaskActions.js";
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
const ComandaStaff = () => {
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
            dispatch(getAllFromTable("Comanda")),
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

    return (
        <div className="flex flex-col h-full font-sans bg-transparent">
            <main className="flex-1 overflow-auto p-1 sm:p-2">
                <div className="border border-outline-variant rounded-lg overflow-hidden shadow-sm bg-surface-card text-body-sm">

                    {/* --- INICIO: NUEVO HEADER CON FLEXBOX --- */}
                    <div className="flex bg-surface-main border-b border-outline-variant font-semibold text-[10px] text-on-surface-variant uppercase sticky top-0 z-20">
                        <div className="px-2 py-2 w-[100px] shrink-0"> {/* Ancho Mínimo Fijo Reducido */}
                            <button onClick={() => requestSort('Procedimientos')} className="flex items-center justify-center w-full gap-1 bg-surface-card text-on-surface border border-outline-variant hover:bg-surface-container px-1 py-1 rounded shadow-sm text-[10px] transition-colors font-bold">
                                Tarea <ArrowUpDown size={12} />
                            </button>
                        </div>
                        <div className="px-2 py-2 w-[100px] shrink-0"> {/* Ancho Mínimo Fijo Reducido */}
                            <button onClick={() => requestSort('Ejecutor')} className="flex items-center justify-center w-full gap-1 bg-surface-card text-on-surface border border-outline-variant hover:bg-surface-container px-1 py-1 rounded shadow-sm text-[10px] transition-colors font-bold">
                                Ejecutor <ArrowUpDown size={12} />
                            </button>
                        </div>
                        <div className="px-2 py-2 flex-1"> {/* Espacio Flexible */}
                            <button onClick={() => requestSort('Notas')} className="flex items-center gap-1 bg-surface-card text-on-surface border border-outline-variant hover:bg-surface-container px-2 py-1 rounded shadow-sm text-[10px] transition-colors font-bold">
                                Título / Notas <ArrowUpDown size={12} />
                            </button>
                        </div>
                    </div>
                    {/* --- FIN: NUEVO HEADER --- */}

                    {/* --- INICIO: NUEVA LISTA DE TAREAS CON FLEXBOX --- */}
                    <div className="divide-y divide-outline-variant">
                        {Object.keys(groupedAndSortedItems).sort().map(groupName => (
                            <div key={groupName}>
                                {/* Fila de Grupo */}
                                <div className="bg-surface-container sticky top-[37px] z-10 cursor-pointer border-y border-outline-variant" onClick={() => toggleGroup(groupName)}>
                                    <div className="py-1.5 px-3 font-bold text-primary-stitch flex items-center gap-1.5 text-xs">
                                        {collapsedGroups.has(groupName) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                        {groupName} <span className='font-normal text-on-surface-variant'>({groupedAndSortedItems[groupName].length})</span>
                                    </div>
                                </div>

                                {/* Filas de Tareas */}
                                {!collapsedGroups.has(groupName) && groupedAndSortedItems[groupName].map((item) => (
                                    <div key={item._id} className='flex hover:bg-surface-main border-b border-outline-variant/50'>

                                        {/* === INICIO: CELDA DE PROCEDIMIENTO (SIN TÍTULO) === */}
                                        <div className="p-1.5 w-[100px] shrink-0 break-words align-top flex flex-col gap-1 text-[11px]">
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
                                                            className="inline-flex items-center gap-1 p-0.5 px-1 rounded font-medium text-action-blue hover:text-primary-stitch hover:bg-primary-fixed-dim text-[10px] leading-tight"
                                                            title={procedureName}
                                                        >
                                                            {icon} {`${procedureName}`}
                                                        </a>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        {/* === FIN: CELDA DE PROCEDIMIENTO === */}

                                        <div className="p-1.5 w-[100px] shrink-0 break-words align-top text-[11px] text-on-surface">
                                            <StaticCell field="Ejecutor" value={item.Ejecutor} options={staff} type="select-staff" />
                                        </div>

                                        {/* === INICIO: CELDA DE TÍTULO Y NOTAS === */}
                                        <div className="p-1.5 flex-1 break-words align-top flex flex-col gap-0.5 text-[11px]">
                                            {/* ===== TÍTULO DEL Comanda ===== */}
                                            <span className="font-semibold text-on-surface break-words leading-tight">
                                                {item.Tittle || "Sin Título"}
                                            </span>
                                            {/* ===== NOTAS DEL Comanda ===== */}
                                            <div className="text-on-surface-variant leading-tight">
                                                <StaticCell field="Notas" value={item.Notas} />
                                            </div>
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
    let displayValue = value || (field === 'Notas' ? <span className="text-outline italic">Sin Notas</span> : '-');

    if (type === 'select-staff') {
        const staffMember = options.find(s => s._id === value);
        displayValue = staffMember ? staffMember.Nombre : <span className="text-outline italic">Sin asignar</span>;
    }

    return <div>{displayValue}</div>;
};
export default ComandaStaff;