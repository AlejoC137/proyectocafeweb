import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Download, Plus, XCircle, ArrowUpDown, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

// Se asume que estas acciones existen y funcionan como en el ejemplo
import { crearWorkIsue, actualizarWorkIsue, eliminarWorkIsue } from "../../../redux/actions-WorkIsue";
import { getAllFromTable,  } from '../../../redux/actions-Staff'; 
import {  } from '../../../redux/actions-WorkIsue';
import { STAFF, WORKISUE } from '../../../redux/actions-types';

// --- Sub-componente: Formulario Modal ---
const WorkIsueForm = ({ isOpen, onClose, onSubmit, staff, workIsueToEdit }) => {
  const defaultWorkIsue = {
    Tittle: "",
    Dates: { isued: new Date().toISOString().split('T')[0], finished: "" },
    Terminado: false,
    Pagado: { pagadoFull: 'false', adelanto: "" },
    Categoria: "",
    Ejecutor: null,
    Notas: "",
    Procedimientos: [],
  };

  const [formData, setFormData] = useState(defaultWorkIsue);

  useEffect(() => {
    if (workIsueToEdit) {
      setFormData(workIsueToEdit);
    } else {
      setFormData(defaultWorkIsue);
    }
  }, [workIsueToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{workIsueToEdit ? 'Editar Tarea' : 'Nueva Tarea de Trabajo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="Tittle" placeholder="Título" value={formData.Tittle} onChange={handleChange} className="p-2 border rounded col-span-2" required />
            <select name="Categoria" value={formData.Categoria} onChange={handleChange} className="p-2 border rounded">
              <option value="">-- Categoría --</option>
              {['COCINA', 'CAFE', 'MESAS', 'JARDINERIA', 'TIENDA'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select name="Ejecutor" value={formData.Ejecutor || ''} onChange={handleChange} className="p-2 border rounded">
              <option value="">-- Ejecutor --</option>
              {staff.map(s => <option key={s._id} value={s._id}>{s.Nombre} {s.Apellido}</option>)}
            </select>
            <div>
              <label className="text-sm">Fecha Creación</label>
              <input type="date" value={formData.Dates.isued} onChange={e => handleNestedChange('Dates', 'isued', e.target.value)} className="p-2 border rounded w-full" />
            </div>
            <div>
              <label className="text-sm">Fecha Fin</label>
              <input type="date" value={formData.Dates.finished} onChange={e => handleNestedChange('Dates', 'finished', e.target.value)} className="p-2 border rounded w-full" />
            </div>
            <textarea name="Notas" placeholder="Notas" value={formData.Notas} onChange={handleChange} className="p-2 border rounded col-span-2" rows="3"></textarea>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Sub-componente: Acciones en Lote ---
const WorkIsueBulkActions = ({ selectedRows, staff, updateMultiple, handleDelete, deselectAll }) => {
    if (selectedRows.size === 0) return null;
  
    return (
      <div className="sticky bottom-0 left-0 right-0 z-20 bg-gray-800 text-white p-4 shadow-lg flex items-center justify-between">
        <p>{selectedRows.size} fila(s) seleccionada(s)</p>
        <div className="flex items-center gap-4">
          <select 
            onChange={(e) => updateMultiple({ 'Ejecutor': e.target.value })}
            className="p-2 border rounded bg-gray-700 text-white"
          >
            <option value="">Asignar a...</option>
            {staff.map(s => <option key={s._id} value={s._id}>{s.Nombre} {s.Apellido}</option>)}
          </select>
          <button onClick={() => updateMultiple({ 'Terminado': true })} className="px-4 py-2 bg-green-600 rounded">Marcar como Terminado</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 rounded">Eliminar Seleccionados</button>
          <button onClick={deselectAll} className="p-2 hover:bg-gray-600 rounded-full"><XCircle size={20} /></button>
        </div>
      </div>
    );
};


// --- VISTA PRINCIPAL ---
const WorkIsueExcelView = () => {
    const dispatch = useDispatch();
    
    // Estados del componente
    const allWorkIsues = useSelector(state => state.allWorkIsues || []);
    const allStaff = useSelector(state => state.allStaff || []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filters, setFilters] = useState({ Categoria: '', Ejecutor: '', Terminado: '', search: '' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'Tittle', direction: 'ascending' });
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  
    // Carga de datos inicial
    const fetchData = () => {
        dispatch(getAllFromTable(WORKISUE));  
        dispatch(getAllFromTable(STAFF));
    };

    useEffect(() => {
        fetchData();
    }, [dispatch]);
  
    // Lógica de filtrado, ordenamiento y agrupación
    const filteredData = useMemo(() => {
        return allWorkIsues.filter(item => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = filters.search ? Object.values(item).some(val => String(val).toLowerCase().includes(searchLower)) : true;
            const matchesCategoria = filters.Categoria ? item.Categoria === filters.Categoria : true;
            const matchesEjecutor = filters.Ejecutor ? item.Ejecutor === filters.Ejecutor : true;
            const matchesTerminado = filters.Terminado ? String(item.Terminado) === filters.Terminado : true;
            return matchesSearch && matchesCategoria && matchesEjecutor && matchesTerminado;
        });
    }, [allWorkIsues, filters]);
  
    const groupedAndSortedItems = useMemo(() => {
      let sortableItems = [...filteredData];
      if (sortConfig.key) {
        sortableItems.sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        });
      }
      return sortableItems.reduce((acc, item) => {
        const groupName = item.Categoria || 'Sin Categoría';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(item);
        return acc;
      }, {});
    }, [filteredData, sortConfig]);
  
    // Manejadores de eventos
    const requestSort = (key) => {
      let direction = 'ascending';
      if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
      setSortConfig({ key, direction });
    };

    const handleSelectRow = (rowId) => {
        setSelectedRows(prev => {
          const newSet = new Set(prev);
          if (newSet.has(rowId)) newSet.delete(rowId);
          else newSet.add(rowId);
          return newSet;
        });
    };

    const toggleGroup = (groupName) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) newSet.delete(groupName);
            else newSet.add(groupName);
            return newSet;
        });
    };
  
    // --- Lógica CRUD ---
    const handleAddOrUpdate = (formData) => {
        if (formData._id) {
            dispatch(actualizarWorkIsue(formData._id, formData)).then(fetchData);
        } else {
            dispatch(crearWorkIsue(formData)).then(fetchData);
        }
    };
    
    const handleDelete = (id) => {
        if (window.confirm('¿Seguro que quieres eliminar esta tarea?')) {
            dispatch(eliminarWorkIsue(id)).then(fetchData);
        }
    };

    const updateCell = (id, field, value) => {
        const workIssue = allWorkIsues.find(wi => wi._id === id);
        let updatedData = { ...workIssue };

        // Manejar objetos anidados
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            updatedData[parent] = { ...updatedData[parent], [child]: value };
        } else {
            updatedData[field] = value;
        }
        
        dispatch(actualizarWorkIsue(id, updatedData));
    };
    
    // --- Lógica de Acciones en Lote ---
    const handleBulkUpdate = (fieldsToUpdate) => {
        const promises = Array.from(selectedRows).map(id => dispatch(actualizarWorkIsue(id, fieldsToUpdate)));
        Promise.all(promises).then(() => {
            fetchData();
            setSelectedRows(new Set());
        });
    };

    const handleBulkDelete = () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedRows.size} tareas?`)) {
            const promises = Array.from(selectedRows).map(id => dispatch(eliminarWorkIsue(id)));
            Promise.all(promises).then(() => {
                fetchData();
                setSelectedRows(new Set());
            });
        }
    };
    
    // --- Sub-componente: Celda Editable ---
    const EditableCell = ({ id, field, value, type = 'text', options = [] }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editValue, setEditValue] = useState(value);
      
        useEffect(() => setEditValue(value), [value]);

        const handleSave = () => {
          if (editValue !== value) {
            updateCell(id, field, editValue);
          }
          setIsEditing(false);
        };
      
        const renderEditing = () => {
          switch (type) {
            case 'select':
              return (
                <select value={editValue || ''} onChange={(e) => setEditValue(e.target.value)} onBlur={handleSave} autoFocus className="w-full p-1 border rounded">
                  <option value="">-- Seleccionar --</option>
                  {options.map(opt => <option key={opt.key} value={opt.value}>{opt.label}</option>)}
                </select>
              );
            case 'boolean':
              return (
                <select value={String(editValue)} onChange={(e) => setEditValue(e.target.value === 'true')} onBlur={handleSave} autoFocus className="w-full p-1 border rounded">
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              );
            case 'date':
                return <input type="date" value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} autoFocus className="w-full p-1 border rounded" />
            default:
              return <input type="text" value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} autoFocus className="w-full p-1 border rounded" />;
          }
        };

        const renderDisplay = () => {
            let displayValue = value;
            if (field === 'Ejecutor') {
                const staffMember = allStaff.find(s => s._id === value);
                displayValue = staffMember ? `${staffMember.Nombre} ${staffMember.Apellido}` : 'N/A';
            }
            if (type === 'boolean') {
                return <span className={`px-2 py-1 text-xs rounded-full ${value ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{value ? 'Sí' : 'No'}</span>;
            }
            return <div className="p-1 min-h-[28px]">{displayValue || '-'}</div>;
        };

        return <div className="cursor-pointer" onClick={() => setIsEditing(true)}>{isEditing ? renderEditing() : renderDisplay()}</div>;
    };
    
    const exportToExcel = () => {
        const dataToExport = Object.values(groupedAndSortedItems).flat().map(item => ({
            'Título': item.Tittle,
            'Categoría': item.Categoria,
            'Ejecutor': allStaff.find(s => s._id === item.Ejecutor)?.Nombre || 'N/A',
            'Fecha Creación': item.Dates?.isued,
            'Fecha Fin': item.Dates?.finished,
            'Terminado': item.Terminado ? 'Sí' : 'No',
            'Pagado': item.Pagado?.pagadoFull === 'true' ? 'Sí' : 'No',
            'Adelanto': item.Pagado?.adelanto,
            'Notas': item.Notas
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas de Trabajo");
        XLSX.writeFile(workbook, "WorkIssues.xlsx");
    };


    return (
        <>
            <WorkIsueForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleAddOrUpdate} staff={allStaff} />
            <div className="flex flex-col h-screen bg-gray-50">
                {/* --- Cabecera y Filtros --- */}
                <div className="bg-white shadow-sm border-b p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div><h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas de Trabajo</h1></div>
                        <div className="flex items-center gap-2">
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Download size={16} /> Exportar</button>
                            <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16} /> Nueva Tarea</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-2 bg-gray-50 rounded-lg border">
                        <div className="col-span-2"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Buscar..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} className="pl-10 w-full p-2 border rounded-lg"/></div></div>
                        <select value={filters.Categoria} onChange={e => setFilters(p => ({ ...p, Categoria: e.target.value }))} className="w-full p-2 border rounded-lg"><option value="">Toda Categoría</option>{['COCINA', 'CAFE', 'MESAS', 'JARDINERIA', 'TIENDA'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={filters.Ejecutor} onChange={e => setFilters(p => ({ ...p, Ejecutor: e.target.value }))} className="w-full p-2 border rounded-lg"><option value="">Todo Ejecutor</option>{allStaff.map(s => <option key={s._id} value={s._id}>{s.Nombre}</option>)}</select>
                        <select value={filters.Terminado} onChange={e => setFilters(p => ({ ...p, Terminado: e.target.value }))} className="w-full p-2 border rounded-lg"><option value="">Todo Estado</option><option value="true">Terminado</option><option value="false">Pendiente</option></select>
                    </div>
                </div>

                {/* --- Tabla de Datos --- */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full bg-white text-sm table-fixed">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-2 border-b w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedRows(new Set(Object.values(groupedAndSortedItems).flat().map(i => i._id))) : setSelectedRows(new Set())} /></th>
                                <th className="p-2 text-left border-b w-48"><button onClick={() => requestSort('Tittle')} className="flex items-center gap-1 font-bold">Título <ArrowUpDown size={12} /></button></th>
                                <th className="p-2 text-left border-b w-32"><button onClick={() => requestSort('Ejecutor')} className="flex items-center gap-1 font-bold">Ejecutor <ArrowUpDown size={12} /></button></th>
                                <th className="p-2 text-left border-b w-32"><button onClick={() => requestSort('Dates.isued')} className="flex items-center gap-1 font-bold">Creación <ArrowUpDown size={12} /></button></th>
                                <th className="p-2 text-left border-b w-32"><button onClick={() => requestSort('Dates.finished')} className="flex items-center gap-1 font-bold">Finalización <ArrowUpDown size={12} /></button></th>
                                <th className="p-2 text-left border-b w-28"><button onClick={() => requestSort('Terminado')} className="flex items-center gap-1 font-bold">Terminado <ArrowUpDown size={12} /></button></th>
                                <th className="p-2 text-left border-b w-28"><button onClick={() => requestSort('Pagado.pagadoFull')} className="flex items-center gap-1 font-bold">Pagado <ArrowUpDown size={12} /></button></th>
                                <th className="p-2 text-left border-b w-28">Adelanto</th>
                                <th className="p-2 text-left border-b w-64">Notas</th>
                                <th className="p-2 text-center border-b w-20">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(groupedAndSortedItems).map(groupName => (
                                <React.Fragment key={groupName}>
                                    <tr className="bg-gray-200 sticky top-12 z-10 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                                        <td colSpan="10" className="py-2 px-4 font-bold text-gray-700">
                                            <div className="flex items-center gap-2">{collapsedGroups.has(groupName) ? <ChevronRight size={16} /> : <ChevronDown size={16} />} {groupName} ({groupedAndSortedItems[groupName].length})</div>
                                        </td>
                                    </tr>
                                    {!collapsedGroups.has(groupName) && groupedAndSortedItems[groupName].map(item => (
                                        <tr key={item._id} className={`hover:bg-gray-50 ${selectedRows.has(item._id) ? 'bg-blue-50' : ''}`}>
                                            <td className="p-2 border-b text-center"><input type="checkbox" checked={selectedRows.has(item._id)} onChange={() => handleSelectRow(item._id)} /></td>
                                            <td className="p-0 border-b"><EditableCell id={item._id} field="Tittle" value={item.Tittle} /></td>
                                            <td className="p-0 border-b"><EditableCell id={item._id} field="Ejecutor" value={item.Ejecutor} type="select" options={allStaff.map(s => ({ key: s._id, value: s._id, label: `${s.Nombre} ${s.Apellido}` }))} /></td>
                                            <td className="p-0 border-b"><EditableCell id={item._id} field="Dates.isued" value={item.Dates?.isued} type="date"/></td>
                                            <td className="p-0 border-b"><EditableCell id={item._id} field="Dates.finished" value={item.Dates?.finished} type="date"/></td>
                                            <td className="p-2 border-b text-center"><EditableCell id={item._id} field="Terminado" value={item.Terminado} type="boolean"/></td>
                                            <td className="p-2 border-b text-center"><EditableCell id={item._id} field="Pagado.pagadoFull" value={item.Pagado?.pagadoFull === 'true'} type="boolean"/></td>
                                            <td className="p-0 border-b"><EditableCell id={item._id} field="Pagado.adelanto" value={item.Pagado?.adelanto} /></td>
                                            <td className="p-0 border-b"><EditableCell id={item._id} field="Notas" value={item.Notas} /></td>
                                            <td className="p-2 border-b text-center"><button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Barra de Acciones en Lote --- */}
                <WorkIsueBulkActions 
                    selectedRows={selectedRows}
                    staff={allStaff}
                    updateMultiple={handleBulkUpdate}
                    handleDelete={handleBulkDelete}
                    deselectAll={() => setSelectedRows(new Set())}
                />
            </div>
        </>
    );
};

export default WorkIsueExcelView;