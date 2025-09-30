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
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En Progreso',
    EN_REVISION: 'En Revisión',
    EN_DISCUSION: 'En Discusión',
    COMPLETADO: 'Completado',
    EN_DISENO: 'En Diseño',
};
const PRIORIDADES = ['Baja', 'Media-Baja', 'Media', 'Media-Alta', 'Alta'];

const getEstadoColor = (estado) => {
    const colors = {
        'Pendiente': 'bg-yellow-100 text-yellow-800', 'En Progreso': 'bg-blue-100 text-blue-800',
        'Completado': 'bg-green-100 text-green-800', 'En Revisión': 'bg-purple-100 text-purple-800',
        'En Discusión': 'bg-indigo-100 text-indigo-800', 'En Diseño': 'bg-pink-100 text-pink-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority) => {
    const colors = {
        'Baja': 'bg-blue-100', 'Media-Baja': 'bg-green-100',
        'Media': 'bg-yellow-100', 'Media-Alta': 'bg-orange-200',
        'Alta': 'bg-red-500 font-bold',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
};

const initialColumns = [
    { key: 'Priority', label: 'Prioridad', width: 100, sortable: true },
    { key: 'entregableType', label: 'Área', width: 150, sortable: true },
    { key: 'task_description', label: 'Tarea / Espacio', width: 350, sortable: true },
    { key: 'acciones', label: 'Acciones de Tarea', width: 400, sortable: false },
    { key: 'status', label: 'Estado', width: 120, sortable: true },
    { key: 'Progress', label: 'Progreso', width: 150, sortable: true },
    { key: 'Responsable', label: 'Responsable', width: 150, sortable: true },
    { key: 'dates', label: 'Fechas', width: 250, sortable: true },
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

    const processedData = useMemo(() => {
        return rawData.map(task => ({
            ...task,
            // CORRECCIÓN: Cambiar .name por .Nombre
            assigneeName: staff.find(s => s.id === task.Responsable)?.Nombre || 'Sin asignar',
        }));
    }, [rawData, staff]);

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
            return dispatch(addTask({ ...newTaskData, task_description: `${task.task_description} (Copia)`, status: 'Pendiente', Progress: 0 }));
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
            if (newWidth > 50) setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
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
            wch: Math.max(...dataToExport.map(row => (row[key] || "").toString().length), key.length)
        }));
        XLSX.writeFile(workbook, "Gestion_de_Tareas.xlsx");
    };

    return (
        <>
            <FormTask isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleAddTask} staff={staff} areas={AREAS} prioridades={PRIORIDADES} estados={ESTADOS}/>
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="bg-white shadow-sm border-b p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div><h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1><p className="text-gray-600">Vista de Hoja de Cálculo Interactiva</p></div>
                        <div className="flex items-center gap-2">
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Download size={16} /> Exportar</button>
                            <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> Nueva Tarea</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-2 bg-gray-50 rounded-lg border">
                        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda General</label><div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Buscar en toda la tabla..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-10 w-full p-2 border border-gray-300 rounded-lg" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label><select value={filters.Priority} onChange={(e) => setFilters(prev => ({ ...prev, Priority: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">Todas</option>{PRIORIDADES.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">Todos</option>{Object.values(ESTADOS).map(estado => (<option key={estado} value={estado}>{estado}</option>))}</select></div>
                        <div className="flex items-end"><button onClick={() => setFilters({ status: '', search: '', Priority: '' })} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 w-full"><XCircle size={16} /> Limpiar</button></div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="min-w-full">
                        <table className="w-full bg-white text-sm" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '48px' }} />
                                {initialColumns.map(col => (<col key={col.key} style={{ width: `${columnWidths[col.key]}px` }} />))}
                            </colgroup>
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                        <input type="checkbox" onChange={(e) => e.target.checked ? setSelectedRows(new Set(Object.values(groupedAndSortedItems).flat().map(i => i.id))) : deselectAll()} />
                                    </th>
                                    {initialColumns.map(col => (
                                        <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b relative group">
                                            <div className="flex items-center justify-between">
                                                {col.sortable ? (<button onClick={() => requestSort(col.key)} className="flex items-center gap-1 hover:text-gray-800">{col.label} <ArrowUpDown size={12} /></button>) : (<span>{col.label}</span>)}
                                            </div>
                                            <div onMouseDown={(e) => handleMouseDown(e, col.key)} className="absolute top-0 right-0 h-full w-2 cursor-col-resize bg-blue-300 opacity-0 group-hover:opacity-100" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Object.keys(groupedAndSortedItems).sort().map(groupName => (
                                    <React.Fragment key={groupName}>
                                        <tr className="bg-gray-200 sticky top-12 z-10 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                                            <td colSpan={initialColumns.length + 1} className="py-2 px-4 font-bold text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    {collapsedGroups.has(groupName) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                    {groupName} ({groupedAndSortedItems[groupName].length})
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsedGroups.has(groupName) && groupedAndSortedItems[groupName].map((item) => (
                                            <tr key={item.id} className={`hover:bg-gray-50 ${selectedRows.has(item.id) ? 'bg-blue-50' : ''}`}>
                                                <td className="px-4 py-2 border-r align-top"><input type="checkbox" checked={selectedRows.has(item.id)} onChange={() => handleSelectRow(item.id)} /></td>
                                                <td className={`px-4 py-2 border-r text-center align-top font-semibold ${getPriorityColor(item.Priority)}`}><EditableCell rowId={item.id} field="Priority" value={item.Priority} type="select" options={PRIORIDADES} onSave={updateCell} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="entregableType" value={item.entregableType} type="select" options={AREAS} onSave={updateCell} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="task_description" value={item.task_description} type="textarea" onSave={updateCell} /></td>
                                                <td className="p-0 border-r align-top"><InlineActionsTask task={item} onSave={updateCell} /></td>
                                                <td className="px-4 py-2 border-r text-center align-top"><EditableCell rowId={item.id} field="status" value={item.status} type="select" options={Object.values(ESTADOS)} onSave={updateCell} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="Progress" value={item.Progress} type="progress" onSave={updateCell} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="Responsable" value={item.Responsable} type="select-staff" options={staff} onSave={updateCell} /></td>
                                                <td className="px-4 py-2 border-r align-top">
                                                    <DatesManager task={item} onSave={updateCell} />
                                                    <TaskLog task={item} updateCell={updateCell} />
                                                </td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="notes" value={item.notes} type="textarea" onSave={updateCell} /></td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <TaskActions selectedRows={selectedRows} data={processedData} deselectAll={deselectAll} handleBulkDelete={handleBulkDelete} handleDuplicateTasks={handleDuplicateTasks} updateMultipleTasks={updateMultipleTasks}/>
            </div>
        </>
    );
};

// --- Componente de Celda Editable ---
const EditableCell = ({ rowId, field, value, type = 'text', options = [], onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        let finalValue = editValue;
        if (type === 'progress') finalValue = Math.max(0, Math.min(100, Number(finalValue) || 0));
        if (finalValue !== value) {
            let fieldsToUpdate = { [field]: finalValue };
            if (field === 'Progress' && finalValue === 100) fieldsToUpdate.status = 'Completado';
            onSave(rowId, fieldsToUpdate);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && type !== 'textarea') handleSave();
        else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        switch (type) {
            case 'progress':
                return <input type="number" min="0" max="100" value={editValue || 0} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-full p-1 border rounded focus:outline-none bg-transparent" autoFocus />;
            case 'select':
                return <select value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-full p-1 border rounded focus:outline-none bg-white" autoFocus><option value="">-- Seleccionar --</option>{options.map(o => (<option key={o} value={o}>{o}</option>))}</select>;
            case 'select-staff':
                // CORRECCIÓN: Cambiar m.name por m.Nombre
                return <select value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-full p-1 border rounded focus:outline-none bg-white" autoFocus><option value="">Sin asignar</option>{options.map(m => (<option key={m.id} value={m.id}>{m.Nombre}</option>))}</select>;
            default:
                return <textarea value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-full p-1 border rounded focus:outline-none" rows="3" autoFocus />;
        }
    }
    
    let displayValue = value || '-';
    if (type === 'select-staff') {
        const staffMember = options.find(s => s.id === value);
        // CORRECCIÓN: Cambiar staffMember.name por staffMember.Nombre
        displayValue = staffMember ? staffMember.Nombre : 'Sin asignar';
    }
    
    if (field === 'Progress') {
        const progress = Math.max(0, Math.min(100, Number(value) || 0));
        return <div className="w-full p-1 cursor-pointer" onClick={() => setIsEditing(true)}><div className="flex items-center"><span className="text-xs font-semibold mr-2 w-8">{progress}%</span><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div></div></div>;
    }

    if (field === 'status') {
        return <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${getEstadoColor(value)}`} onClick={() => setIsEditing(true)}>{value || '-'}</span>;
    }

    return <div className="cursor-pointer p-1 min-h-[28px] whitespace-pre-wrap" onClick={() => setIsEditing(true)}>{displayValue}</div>;
};

export default ProjectExcelView;