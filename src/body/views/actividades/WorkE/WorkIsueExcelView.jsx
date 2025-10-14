// ARCHIVO: WorkIsueExcelView.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    Search, Download, Plus,
    XCircle, ArrowUpDown, Trash2, ChevronRight, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Componentes locales
import FormTask from './FormTask.jsx';
import TaskActions from './TaskActions.jsx';
import InlineActionsTask from './InlineActionsTask.jsx';
import TaskLog from './TaskLog.jsx';
import DatesManager from './DatesManager.jsx';

// Acciones de Redux y Tipos
import { getAllFromTable } from "../../../../redux/actions";
import { addTask, deleteTask, updateTask } from "../../../../redux/standaloneTaskActions";
import { AREAS } from '../../../../redux/actions-types.js';

// --- Constantes y Helpers ---
const ESTADOS = {
    ASIGNADO: 'Asignado',
    ACEPTADO: 'Aceptado',
    EN_PROCESO: 'En proceso',
    PAUSADO: 'Pausado',
    POR_REVISION: 'Por revisión',
    TERMINADO: 'Terminado',
};
const PRIORIDADES = ['Baja', 'Media-Baja', 'Media', 'Media-Alta', 'Alta'];

const getEstadoColor = (estado) => {
    const colors = {
        'Asignado': 'bg-slate-200 text-slate-800',
        'Aceptado': 'bg-sky-200 text-sky-900',
        'En proceso': 'bg-amber-200 text-amber-900',
        'Pausado': 'bg-orange-300 text-orange-900',
        'Por revisión': 'bg-indigo-200 text-indigo-900',
        'Terminado': 'bg-emerald-200 text-emerald-900',
    };
    return colors[estado] || 'bg-slate-100 text-slate-800';
};

const getPriorityColor = (priority) => {
    const colors = {
        'Baja': 'text-sky-700 bg-sky-100',
        'Media-Baja': 'text-emerald-700 bg-emerald-100',
        'Media': 'text-amber-700 bg-amber-100',
        'Media-Alta': 'text-orange-700 bg-orange-200',
        'Alta': 'text-red-700 bg-red-200 font-bold',
    };
    return colors[priority] || 'bg-slate-100 text-slate-800';
};

const initialColumns = [
    { key: 'Priority', label: 'Prioridad', width: 110, sortable: true },
    { key: 'entregableType', label: 'Área', width: 150, sortable: true },
    { key: 'task_description', label: 'Tarea / Espacio', width: 350, sortable: true },
    { key: 'acciones', label: 'Acciones de Tarea', width: 400, sortable: false },
    { key: 'status', label: 'Estado', width: 130, sortable: true },
    { key: 'Progress', label: 'Progreso', width: 150, sortable: true },
    { key: 'Responsable', label: 'Responsable', width: 160, sortable: true },
    { key: 'dates', label: 'Fechas y Bitácora', width: 280, sortable: true },
    { key: 'notes', label: 'Notas', width: 300, sortable: true },
];

// --- Componente Principal ---
const ProjectExcelView = () => {
    const dispatch = useDispatch();
    const [rawData, setRawData] = useState([]);
    const [staff, setStaff] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filters, setFilters] = useState({ status: '', search: '', Priority: '' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'Priority', direction: 'descending' });
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
    const [columnWidths, setColumnWidths] = useState(
        initialColumns.reduce((acc, col) => ({ ...acc, [col.key]: col.width }), {})
    );
    const resizingColumnRef = useRef(null);

    const fetchAllData = useCallback(async () => {
        const [tareasAction, staffAction] = await Promise.all([
            dispatch(getAllFromTable("WorkIsue")),
            dispatch(getAllFromTable("Staff"))
        ]);
        if (tareasAction?.payload) setRawData(tareasAction.payload);
        if (staffAction?.payload) setStaff(staffAction.payload);
    }, [dispatch]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    const processedData = useMemo(() => rawData.map(task => ({
        ...task,
        assigneeName: staff.find(s => s.id === task.Responsable)?.Nombre || 'Sin asignar',
    })), [rawData, staff]);

    const filteredData = useMemo(() => {
        let filtered = [...processedData];
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchLower))
            );
        }
        if (filters.status) filtered = filtered.filter(item => item.status === filters.status);
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

    const updateCell = (rowId, fieldsToUpdate) => {
        // ================= INICIO DE LA CORRECCIÓN =================
        // Si no hay un rowId, no podemos actualizar. Evita la llamada a la API.
        if (!rowId) {
            console.error("Intento de actualizar una fila sin ID. La operación fue abortada.");
            // Opcional: podrías mostrar una notificación al usuario.
            // alert("No se puede guardar el cambio porque la tarea aún no ha sido creada en el sistema.");
            return; 
        }
        // ================= FIN DE LA CORRECCIÓN =================

        const dataToUpdate = { ...fieldsToUpdate };
        ['acciones', 'dates'].forEach(field => {
            if (dataToUpdate[field] && typeof dataToUpdate[field] !== 'string') {
                dataToUpdate[field] = JSON.stringify(dataToUpdate[field]);
            }
        });
        dispatch(updateTask(rowId, dataToUpdate)).then(fetchAllData);
    };

    const handleAddTask = (taskData) => {
        dispatch(addTask(taskData)).then(fetchAllData);
        setIsFormOpen(false);
    };

    const handleBulkDelete = () => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedRows.size} tarea(s)?`)) {
            const promises = Array.from(selectedRows).map(taskId => dispatch(deleteTask(taskId)));
            Promise.all(promises).then(fetchAllData).then(() => setSelectedRows(new Set()));
        }
    };

    const handleDuplicateTasks = () => {
        const tasksToDuplicate = rawData.filter(task => selectedRows.has(task.id));
        const promises = tasksToDuplicate.map(task => {
            const { id, created_at, ...newTaskData } = task;
            return dispatch(addTask({ ...newTaskData, task_description: `${task.task_description} (Copia)`, status: 'Asignado', Progress: 0 }));
        });
        Promise.all(promises).then(fetchAllData).then(() => setSelectedRows(new Set()));
    };

    const updateMultipleTasks = (fieldsToUpdate) => {
        const promises = Array.from(selectedRows).map(taskId => dispatch(updateTask(taskId, fieldsToUpdate)));
        Promise.all(promises).then(fetchAllData).then(() => setSelectedRows(new Set()));
    };

    const deselectAll = () => setSelectedRows(new Set());

    const toggleGroup = (groupName) => setCollapsedGroups(prev => {
        const newSet = new Set(prev);
        newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName);
        return newSet;
    });

    const requestSort = (key) => {
        const direction = (sortConfig.key === key && sortConfig.direction === 'ascending') ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };

    const handleSelectRow = (rowId) => setSelectedRows(prev => {
        const newSelected = new Set(prev);
        newSelected.has(rowId) ? newSelected.delete(rowId) : newSelected.add(rowId);
        return newSelected;
    });

    const handleMouseDown = useCallback((e, columnKey) => {
        e.preventDefault();
        resizingColumnRef.current = { key: columnKey, startX: e.clientX, startWidth: columnWidths[columnKey] };
    }, [columnWidths]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingColumnRef.current) return;
            const { key, startX, startWidth } = resizingColumnRef.current;
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth > 60) setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
        };
        const handleMouseUp = () => resizingColumnRef.current = null;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const exportToExcel = () => {
        const dataToExport = Object.values(groupedAndSortedItems).flat().map(item => {
            let dates = {};
            if(item.dates && typeof item.dates === 'string') {
                try { dates = JSON.parse(item.dates); } catch(e) {}
            }
            return {
                'Prioridad': item.Priority || '-', 'Área': item.entregableType || 'N/A',
                'Tarea': item.task_description, 'Estado': item.status,
                'Progreso (%)': item.Progress || 0, 'Responsable': item.assigneeName || 'Sin Asignar',
                'Fecha Asignación': dates.assignDate || '-', 'Fecha Límite': dates.dueDate || '-',
                'Notas': item.notes || ''
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "WorkIsue");
        worksheet["!cols"] = Object.keys(dataToExport[0] || {}).map(key => ({
            wch: Math.max(...dataToExport.map(row => (row[key] || "").toString().length), key.length) + 2
        }));
        XLSX.writeFile(workbook, "Gestion_de_Tareas.xlsx");
    };

    return (
        <>
            <FormTask isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleAddTask} staff={staff} areas={AREAS} prioridades={PRIORIDADES} estados={ESTADOS}/>
            <div className="flex flex-col h-screen bg-slate-50 font-sans">
                {/* --- Cabecera y Filtros --- */}
                <header className="bg-white shadow-sm border-b border-slate-200 p-4 shrink-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Gestión de Tareas</h1>
                            <p className="text-sm text-slate-500">Vista de Hoja de Cálculo Interactiva</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"><Download size={16} /> Exportar</button>
                            <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200"><Plus size={16} /> Nueva Tarea</button>
                        </div>
                    </div>
                    {/* --- Barra de Filtros Responsiva --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Búsqueda General</label>
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Buscar en toda la tabla..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                            <select value={filters.Priority} onChange={(e) => setFilters(prev => ({ ...prev, Priority: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                                <option value="">Todas</option>
                                {PRIORIDADES.map(p => (<option key={p} value={p}>{p}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                            <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                                <option value="">Todos</option>
                                {Object.values(ESTADOS).map(estado => (<option key={estado} value={estado}>{estado}</option>))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={() => setFilters({ status: '', search: '', Priority: '' })} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 w-full transition-colors duration-200"><XCircle size={16} /> Limpiar</button>
                        </div>
                    </div>
                </header>

                {/* --- Contenedor de la Tabla con Scroll --- */}
                <main className="flex-1 overflow-auto p-4">
                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-md">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white text-sm" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '48px' }} />
                                    {initialColumns.map(col => (<col key={col.key} style={{ width: `${columnWidths[col.key]}px` }} />))}
                                </colgroup>
                                <thead className="bg-slate-100 sticky top-0 z-20">
                                    <tr className='border-b-2 border-slate-300'>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            <input type="checkbox" className='h-4 w-4' onChange={(e) => e.target.checked ? setSelectedRows(new Set(Object.values(groupedAndSortedItems).flat().map(i => i.id))) : deselectAll()} />
                                        </th>
                                        {initialColumns.map(col => (
                                            <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider relative group whitespace-nowrap">
                                                <div className="flex items-center justify-between">
                                                    {col.sortable ? (<button onClick={() => requestSort(col.key)} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">{col.label} <ArrowUpDown size={14} /></button>) : (<span>{col.label}</span>)}
                                                </div>
                                                <div onMouseDown={(e) => handleMouseDown(e, col.key)} className="absolute top-0 right-0 h-full w-2 cursor-col-resize bg-sky-400 opacity-0 group-hover:opacity-50 transition-opacity" />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {Object.keys(groupedAndSortedItems).sort().map(groupName => (
                                        <React.Fragment key={groupName}>
                                            {/* --- Fila de Grupo --- */}
                                            <tr className="bg-slate-200/70 backdrop-blur-sm sticky top-[49px] z-10 cursor-pointer border-y border-slate-300" onClick={() => toggleGroup(groupName)}>
                                                <td colSpan={initialColumns.length + 1} className="py-2 px-4 font-bold text-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        {collapsedGroups.has(groupName) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                        {groupName} <span className='font-normal text-slate-600'>({groupedAndSortedItems[groupName].length})</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* --- Filas de Tareas --- */}
                                            {!collapsedGroups.has(groupName) && groupedAndSortedItems[groupName].map((item) => (
                                                <tr key={item.id} className={`transition-colors duration-150 ${selectedRows.has(item.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-4 py-3 border-b border-slate-200 align-middle"><input className='h-4 w-4' type="checkbox" checked={selectedRows.has(item.id)} onChange={() => handleSelectRow(item.id)} /></td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle text-center"><EditableCell rowId={item.id} field="Priority" value={item.Priority} type="select" options={PRIORIDADES} onSave={updateCell(item.id)} /></td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle"><EditableCell rowId={item.id} field="entregableType" value={item.entregableType} type="select" options={AREAS} onSave={updateCell(item.id,"entregableType")} /></td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle"><EditableCell rowId={item.id} field="task_description" value={item.task_description} type="textarea" onSave={updateCell(item.id)} /></td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle"><InlineActionsTask task={item} onSave={updateCell(item.id)} /></td>
                                          <td>
  <EditableCell
    value={item.status}
    field="status"
    type="select"
    options={Object.values(ESTADOS)}
    onSave={(fieldsToUpdate) => updateCell(item.id, fieldsToUpdate)}
  />
</td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle"><EditableCell rowId={item.id} field="Progress" value={item.Progress} type="progress" onSave={updateCell(item.id)} /></td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle"><EditableCell rowId={item.id} field="Responsable" value={item.Responsable} type="select-staff" options={staff} onSave={updateCell(item.id)} /></td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle">
                                                    <DatesManager
  task={item}
  onSave={updateCell}
/>

                                                        <TaskLog task={item} updateCell={updateCell} />
                                                    </td>
                                                    <td className="px-2 py-3 border-b border-slate-200 align-middle"><EditableCell rowId={item.id} field="notes" value={item.notes} type="textarea" onSave={updateCell(item.id)} /></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
                <TaskActions selectedRows={selectedRows} data={processedData} deselectAll={deselectAll} handleBulkDelete={handleBulkDelete} handleDuplicateTasks={handleDuplicateTasks} updateMultipleTasks={updateMultipleTasks}/>
            </div>
        </>
    );
};

// --- Componente de Celda Editable Mejorado ---
const EditableCell = ({ rowId, field, value, type = 'text', options = [], onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        let finalValue = editValue;
        if (type === 'progress') finalValue = Math.max(0, Math.min(100, Number(finalValue) || 0));
        if (finalValue !== value) {
            let fieldsToUpdate = { [field]: finalValue };
            if (field === 'Progress' && finalValue === 100) fieldsToUpdate.status = 'Terminado';
            if (field === 'Progress' && finalValue < 100 && value === 100) fieldsToUpdate.status = 'En proceso';
            updateCell(rowId, fieldsToUpdate);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };
    
    if (isEditing) {
        const commonProps = {
            value: editValue || '',
            onChange: e => setEditValue(e.target.value),
            onBlur: handleSave,
            onKeyDown: handleKeyDown,
            className: "w-full p-2 border border-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white",
            autoFocus: true,
        };
        switch (type) {
            case 'progress':
                return <input type="number" min="0" max="100" {...commonProps} />;
            case 'select':
                return <select {...commonProps}><option value="">-- Seleccionar --</option>{options.map(o => (<option key={o} value={o}>{o}</option>))}</select>;
            case 'select-staff':
                return <select {...commonProps}><option value="">Sin asignar</option>{options.map(m => (<option key={m.id} value={m.id}>{m.Nombre}</option>))}</select>;
            default:
                return <textarea {...commonProps} rows="3" />;
        }
    }
    
    let displayValue = value || '-';
    let displayClasses = "cursor-pointer p-2 min-h-[52px] w-full flex items-center rounded-md hover:bg-slate-100 whitespace-pre-wrap";

    if (type === 'select-staff') {
        const staffMember = options.find(s => s.id === value);
        displayValue = staffMember ? staffMember.Nombre : <span className="text-slate-400 italic">Sin asignar</span>;
    }
    
    if (field === 'Progress') {
        const progress = Math.max(0, Math.min(100, Number(value) || 0));
        return (
            <div className="w-full p-2 cursor-pointer rounded-md hover:bg-slate-100 h-full flex items-center" onClick={() => setIsEditing(true)}>
                <div className="flex items-center gap-2 w-full">
                    <span className="text-xs font-semibold text-slate-600 w-9 text-right">{progress}%</span>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                        <div className="bg-sky-500 h-3 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (field === 'status' || field === 'Priority') {
        const colorClass = field === 'status' ? getEstadoColor(value) : getPriorityColor(value);
        return (
            <div className='w-full h-full flex justify-center items-center' onClick={() => setIsEditing(true)}>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${colorClass}`}>
                    {value || '-'}
                </span>
            </div>
        );
    }
    
    return <div className={displayClasses} onClick={() => setIsEditing(true)}><div>{displayValue}</div></div>;
};

export default ProjectExcelView;