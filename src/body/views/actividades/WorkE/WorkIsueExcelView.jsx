import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    Search, Download, Plus,
    XCircle, ArrowUpDown, Trash2, ChevronRight, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

import FormTask from './FormTask.jsx';
import TaskActions from './TaskActions.jsx';
import InlineActionsTask from './InlineActionsTask.jsx';
//import {
//    getAllFromTable,
//    updateTask,
//    addTask,
//    deleteTask
//} from '../store/actions/actions';



import { getAllFromTable } from "../../../../redux/actions";
import { addTask, deleteTask, updateTask } from "../../../../redux/standaloneTaskActions";
import TaskLog from './TaskLog.jsx';
import DatesManager from './DatesManager.jsx';

const ESTADOS = {
    PENDIENTE: 'Pendiente', EN_PROCESO: 'En Progreso', COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado', EN_REVISION: 'En Revisión', BLOQUEADO: 'Bloqueado',
    APROBACION_REQUERIDA: 'Aprobación Requerida', EN_DISENO: 'En Diseño', EN_DISCUSION: 'En Discusión'
};

const getEstadoColor = (estado) => {
    const colors = {
        'Pendiente': 'bg-yellow-100 text-yellow-800', 'En Progreso': 'bg-blue-100 text-blue-800',
        'Completado': 'bg-green-100 text-green-800', 'Cancelado': 'bg-red-100 text-red-800',
        'En Revisión': 'bg-purple-100 text-purple-800', 'Bloqueado': 'bg-gray-400 text-white',
        'Aprobación Requerida': 'bg-orange-100 text-orange-800', 'En Diseño': 'bg-pink-100 text-pink-800',
        'En Discusión': 'bg-indigo-100 text-indigo-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority) => {
    const colors = {
        'Baja': 'bg-blue-100 text-blue-800',
        'Media-Baja': 'bg-green-100 text-green-800',
        'Media': 'bg-yellow-100 text-yellow-800',
        'Media-Alta': 'bg-orange-200 text-orange-900',
        'Alta': 'bg-red-500 text-white font-bold',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
};

// --- NUEVO: Definición centralizada de las columnas ---
const initialColumns = [
    { key: 'Priority', label: 'Prioridad', width: 75, sortable: true },
    { key: 'stage_id', label: 'Etapa', width: 75, sortable: true },
    { key: 'task_description', label: 'Tarea / Espacio', width: 350, sortable: true },
    { key: 'inline_actions', label: 'Acciones de Tarea', width: 500, sortable: false },
    { key: 'status', label: 'Estado', width: 75, sortable: true },
    { key: 'Progress', label: 'Progreso', width: 100, sortable: true },
    { key: 'staff_id', label: 'Responsable', width: 90, sortable: true },
    { key: 'entregable_id', label: 'Entregable', width: 120, sortable: true },
    { key: 'dates', label: 'Fechas', width: 250, sortable: true },
    { key: 'notes', label: 'Notas', width: 300, sortable: true },
];

const ProjectExcelView = () => {
    const dispatch = useDispatch();

    // --- ESTADOS ---
    const [data, setData] = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stages, setStages] = useState([]);
    const [entregables, setEntregables] = useState([]);

    const [Priorities, setPriorities] = useState([
        { id: "Baja", name: "Baja" }, { id: "Media-Baja", name: "Media-Baja" },
        { id: "Media", name: "Media" }, { id: "Media-Alta", name: "Media-Alta" },
        { id: "Alta", name: "Alta" },
    ]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filters, setFilters] = useState({ project_id: '', stage_id: '', staff_id: '', status: '', search: '' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'task_description', direction: 'ascending' });
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());

    // --- NUEVO: Estados y Refs para el redimensionamiento de columnas ---
    const [columnWidths, setColumnWidths] = useState(
        initialColumns.reduce((acc, col) => ({ ...acc, [col.key]: col.width }), {})
    );
    const resizingColumnRef = useRef(null);

    // --- FETCHING DE DATOS ---
    const fetchTasks = async () => {
        const tareasAction = await dispatch(getAllFromTable("WorkIsue"));
        if (tareasAction?.payload) setData(tareasAction.payload);
        console.log(data)
    };

    useEffect(() => {
        const fetchAllData = async () => {
            const [proyectosAction, staffAction, stagesAction, entregablesAction] = await Promise.all([
                dispatch(getAllFromTable("Proyectos")),
                dispatch(getAllFromTable("Staff")),
                dispatch(getAllFromTable("Stage")),
                dispatch(getAllFromTable("Entregables_template"))
            ]);
            if (proyectosAction?.payload) setProyectos(proyectosAction.payload);
            if (staffAction?.payload) setStaff(staffAction.payload);
            if (stagesAction?.payload) setStages(stagesAction.payload);
            if (entregablesAction?.payload) setEntregables(entregablesAction.payload);
        };
        fetchAllData();
        fetchTasks();

        console.log()
    }, [dispatch]);

    // --- MEMOS PARA FILTRADO, ORDENACIÓN Y AGRUPACIÓN ---
    const filteredData = useMemo(() => {
        let filtered = [...data];
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchLower))
            );
        }
        if (filters.project_id) filtered = filtered.filter(item => item.project_id === filters.project_id);
        if (filters.stage_id) filtered = filtered.filter(item => item.stage_id === filters.stage_id);
        if (filters.staff_id) filtered = filtered.filter(item => item.staff_id === filters.staff_id);
        if (filters.status) filtered = filtered.filter(item => item.status === filters.status);
        return filtered;
    }, [data, filters]);

    const groupedAndSortedItems = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const getValue = (item, key) => {
                    let value = item[key] || '';
                    switch (key) {
                        case 'project_id': return proyectos.find(p => p.id === value)?.name || value;
                        case 'staff_id': return staff.find(s => s.id === value)?.name || value;
                        case 'stage_id': return stages.find(s => s.id === value)?.name || value;
                        case 'entregable_id': return entregables.find(e => e.id === value)?.entregable_nombre || value;
                        case 'dates': return item.dates ? JSON.parse(item.dates).dueDate || '' : '';
                        case 'Progress': return Number(value || 0);
                        default: return value;
                    }
                };
                const aValue = getValue(a, sortConfig.key);
                const bValue = getValue(b, sortConfig.key);
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems.reduce((acc, item) => {
            const projectName = proyectos.find(p => p.id === item.project_id)?.name || 'Tareas sin Proyecto';
            if (!acc[projectName]) acc[projectName] = [];
            acc[projectName].push(item);
            return acc;
        }, {});
    }, [filteredData, sortConfig, proyectos, staff, stages, entregables]);

    // --- LÓGICA DE LA UI (GRUPOS, ORDENACIÓN, SELECCIÓN) ---
    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName);
            return newSet;
        });
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectRow = (rowId) => {
        setSelectedRows(prev => {
            const newSelected = new Set(prev);
            newSelected.has(rowId) ? newSelected.delete(rowId) : newSelected.add(rowId);
            return newSelected;
        });
    };

    // --- ACCIONES CRUD ---
    const handleAddTask = (taskData) => {
        const sanitizedTaskData = { ...taskData };
        ['project_id', 'staff_id', 'stage_id', 'entregable_id'].forEach(field => {
            if (sanitizedTaskData[field] === '') sanitizedTaskData[field] = null;
        });
        dispatch(addTask(sanitizedTaskData)).then(fetchTasks);
        setIsFormOpen(false);
    };

    const handleDeleteTask = (taskId, taskDescription) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la tarea?\n\n"${taskDescription}"`)) {
            dispatch(deleteTask(taskId)).then(fetchTasks);
        }
    };

    const updateCell = (rowId, fieldsToUpdate) => {
        dispatch(updateTask(rowId, fieldsToUpdate)).then(() => {
            setData(prevData => prevData.map(item => item.id === rowId ? { ...item, ...fieldsToUpdate } : item));
        });
    };

    const updateMultipleTasks = (fieldsToUpdate) => {
        const promises = Array.from(selectedRows).map(taskId => dispatch(updateTask(taskId, fieldsToUpdate)));
        Promise.all(promises).then(() => {
            fetchTasks();
            deselectAll();
        });
    };

    const handleBulkDelete = () => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedRows.size} tarea(s)?`)) {
            const promises = Array.from(selectedRows).map(taskId => dispatch(deleteTask(taskId)));
            Promise.all(promises).then(() => {
                fetchTasks();
                deselectAll();
            });
        }
    };

    const handleDuplicateTasks = () => {
        const tasksToDuplicate = data.filter(task => selectedRows.has(task.id));
        const promises = tasksToDuplicate.map(task => {
            const { id, created_at, ...newTaskData } = task;
            return dispatch(addTask({
                ...newTaskData,
                task_description: `${task.task_description} (Copia)`,
                status: ESTADOS.PENDIENTE,
                Progress: 0
            }));
        });
        Promise.all(promises).then(() => {
            fetchTasks();
            deselectAll();
        });
    };

    const deselectAll = () => setSelectedRows(new Set());

    // --- COMPONENTE DE CELDA EDITABLE (SIN CAMBIOS) ---
    const EditableCell = ({ rowId, field, value, type = 'text', options = [] }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editValue, setEditValue] = useState(value);

        const handleSave = () => {
            let finalValue = editValue;
            if (type === 'progress') {
                finalValue = Math.max(0, Math.min(100, Number(finalValue) || 0));
            }
            if (finalValue !== value) {
                let fieldsToUpdate = { [field]: finalValue };
                if (field === 'Progress' && finalValue === 100) {
                    fieldsToUpdate.status = 'Completado';
                }
                updateCell(rowId, fieldsToUpdate);
            }
            setIsEditing(false);
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && type !== 'textarea') handleSave();
            else if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
        };

        if (isEditing) {
            switch (type) {
                case 'progress':
                    return <input type="number" min="0" max="100" value={editValue || 0} onChange={(e) => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyPress} className="w-full p-1 border rounded focus:outline-none bg-transparent" autoFocus />;
                case 'select': case 'status-select': case 'priority-select':
                    return <select value={editValue || ''} onChange={(e) => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyPress} className="w-full p-1 border rounded focus:outline-none bg-white" autoFocus><option value="">-- Seleccionar --</option>{options.map(option => (<option key={option.id} value={option.id}>{option.name}</option>))}</select>;
                case 'entregable-select':
                    return <select value={editValue || ''} onChange={(e) => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyPress} className="w-full p-1 border rounded focus:outline-none" autoFocus><option value="">-- Seleccionar --</option>{options.map(option => (<option key={option.id} value={option.id}>{option.entregable_nombre}</option>))}</select>;
                default:
                    return <textarea value={editValue || ''} onChange={(e) => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyPress} className="w-full p-1 border rounded focus:outline-none" rows="3" autoFocus />;
            }
        }

        const displayValue = (field, val) => {
            switch (field) {
                case 'project_id': return proyectos.find(p => p.id === val)?.name || val || '-';
                case 'staff_id': return staff.find(s => s.id === val)?.name || val || '-';
                case 'stage_id': return stages.find(s => s.id === val)?.name || val || '-';
                case 'entregable_id': return entregables.find(e => e.id === val)?.entregable_nombre || val || '-';
                default: return val || '-';
            }
        };

        if (field === 'Progress') {
            const progress = Math.max(0, Math.min(100, Number(value) || 0));
            return (
                <div className="w-full p-1 cursor-pointer" onClick={() => setIsEditing(true)}>
                    <div className="flex items-center">
                        <span className="text-xs font-semibold mr-2 w-8">{progress}%</span>
                        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                    </div>
                </div>
            );
        }
        if (field === 'status') {
            return <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${getEstadoColor(value)}`} onClick={() => setIsEditing(true)}>{value || '-'}</span>;
        }
        if (field === 'Priority') {
            return <div className="cursor-pointer p-1 min-h-[28px]" onClick={() => setIsEditing(true)}>{value || '-'}</div>;
        }

        return <div className="cursor-pointer p-1 min-h-[28px]" onClick={() => setIsEditing(true)}>{displayValue(field, value)}</div>;
    };

    // --- NUEVO: Lógica para redimensionar columnas ---
    const handleMouseDown = useCallback((e, columnKey) => {
        e.preventDefault();
        resizingColumnRef.current = {
            key: columnKey,
            startX: e.clientX,
            startWidth: columnWidths[columnKey],
        };
    }, [columnWidths]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingColumnRef.current) return;
            const { key, startX, startWidth } = resizingColumnRef.current;
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth > 50) { // Ancho mínimo de 50px
                setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
            }
        };

        const handleMouseUp = () => {
            resizingColumnRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const exportToExcel = () => {
        const dataToExport = Object.values(groupedAndSortedItems).flat().map(item => {
            const dates = item.dates ? JSON.parse(item.dates) : {};
            return {
                'Proyecto': proyectos.find(p => p.id === item.project_id)?.name || 'N/A',
                'Prioridad': item.Priority || '-',
                'Etapa': stages.find(s => s.id === item.stage_id)?.name || '-',
                'Tarea': item.task_description,
                'Estado': item.status,
                'Progreso (%)': item.Progress || 0,
                'Responsable': staff.find(s => s.id === item.staff_id)?.name || 'Sin Asignar',
                'Entregable': entregables.find(e => e.id === item.entregable_id)?.entregable_nombre || '-',
                'Fecha Asignación': dates.assignDate || '-',
                'Fecha Límite': dates.dueDate || '-',
                'Notas': item.notes || ''
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "WorkIsue");
        const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({
            wch: Math.max(...dataToExport.map(row => row[key]?.toString().length || 10), key.length)
        }));
        worksheet["!cols"] = colWidths;
        XLSX.writeFile(workbook, "Gestion_de_Tareas.xlsx");
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <>
            <FormTask isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleAddTask} proyectos={proyectos} staff={staff} stages={stages} entregables={entregables} estados={ESTADOS} />
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="bg-white shadow-sm border-b p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div><h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1><p className="text-gray-600">Vista de Hoja de Cálculo Interactiva</p></div>
                        <div className="flex items-center gap-2">
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Download size={16} /> Exportar</button>
                            <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> Nueva Tarea</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-6 gap-4 p-2 bg-gray-50 rounded-lg border">
                        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda General</label><div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Buscar en toda la tabla..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-10 w-full p-2 border border-gray-300 rounded-lg" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label><select value={filters.stage_id} onChange={(e) => setFilters(prev => ({ ...prev, stage_id: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">Todas</option>{stages.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label><select value={filters.staff_id} onChange={(e) => setFilters(prev => ({ ...prev, staff_id: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">Todos</option>{staff.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">Todos</option>{Object.values(ESTADOS).map(estado => (<option key={estado} value={estado}>{estado}</option>))}</select></div>
                        <div className="flex items-end"><button onClick={() => setFilters({ project_id: '', stage_id: '', staff_id: '', status: '', search: '' })} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 w-full"><XCircle size={16} /> Limpiar</button></div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="min-w-full">
                        <table className="w-full bg-white text-sm" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '48px' }} /> {/* Checkbox */}
                                {initialColumns.map(col => (
                                    <col key={col.key} style={{ width: `${columnWidths[col.key]}px` }} />
                                ))}
                            </colgroup>
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                        <input type="checkbox" onChange={(e) => e.target.checked ? setSelectedRows(new Set(Object.values(groupedAndSortedItems).flat().map(i => i.id))) : deselectAll()} />
                                    </th>
                                    {initialColumns.map(col => (
                                        <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b relative group">
                                            <div className="flex items-center justify-between">
                                                {col.sortable ? (
                                                    <button onClick={() => requestSort(col.key)} className="flex items-center gap-1 hover:text-gray-800">
                                                        {col.label} <ArrowUpDown size={12} />
                                                    </button>
                                                ) : (
                                                    <span>{col.label}</span>
                                                )}
                                            </div>
                                            <div
                                                onMouseDown={(e) => handleMouseDown(e, col.key)}
                                                className="absolute top-0 right-0 h-full w-2 cursor-col-resize bg-blue-300 opacity-0 group-hover:opacity-100"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Object.keys(groupedAndSortedItems).sort().map(projectName => (
                                    <React.Fragment key={projectName}>
                                        <tr className="bg-gray-200 sticky top-12 z-10 cursor-pointer" onClick={() => toggleGroup(projectName)}>
                                            <td colSpan={initialColumns.length + 1} className="py-2 px-4 font-bold text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    {collapsedGroups.has(projectName) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                    {projectName} ({groupedAndSortedItems[projectName].length})
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsedGroups.has(projectName) && groupedAndSortedItems[projectName].map((item) => (
                                            <tr key={item.id} className={`hover:bg-gray-50 ${selectedRows.has(item.id) ? 'bg-blue-50' : ''}`}>
                                                <td className="px-4 py-2 border-r align-top"><input type="checkbox" checked={selectedRows.has(item.id)} onChange={() => handleSelectRow(item.id)} /></td>
                                                <td className={`px-4 py-2 border-r text-center align-top ${getPriorityColor(item.Priority)}`}><EditableCell rowId={item.id} field="Priority" value={item.Priority} type="priority-select" options={Priorities} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="stage_id" value={item.stage_id} type="select" options={stages} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="task_description" value={item.task_description} type="textarea" /></td>
                                                <td className="p-0 border-r align-top"><InlineActionsTask task={item} /></td>
                                                <td className="px-4 py-2 border-r text-center align-top"><EditableCell rowId={item.id} field="status" value={item.status} type="status-select" options={Object.keys(ESTADOS).map(k => ({ id: ESTADOS[k], name: ESTADOS[k] }))} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="Progress" value={item.Progress} type="progress" /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="staff_id" value={item.staff_id} type="select" options={staff} /></td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="entregable_id" value={item.entregable_id} type="entregable-select" options={entregables} /></td>
                                                <td className="px-4 py-2 border-r align-top">
                                                    <DatesManager task={item} onSave={updateCell} />
                                                    <TaskLog task={item} proyectos={proyectos} staff={staff} stages={stages} entregables={entregables} updateCell={updateCell} />
                                                </td>
                                                <td className="px-4 py-2 border-r align-top"><EditableCell rowId={item.id} field="notes" value={item.notes} type="textarea" /></td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <TaskActions
                    selectedRows={selectedRows} data={filteredData} staff={staff}
                    updateMultipleTasks={updateMultipleTasks} handleBulkDelete={handleBulkDelete}
                    handleDuplicateTasks={handleDuplicateTasks} deselectAll={deselectAll}
                />
            </div>
        </>
    );
};

export default ProjectExcelView;