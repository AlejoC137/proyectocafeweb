import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllFromTable } from '@/redux/actions';
import { ALIADOS } from '@/redux/actions-types';
import supabase from '@/config/supabaseClient';
import PageLayout from '@/components/ui/page-layout';
import { formatUrl } from '@/utils/urlUtils';
import * as XLSX from 'xlsx';
import {
  Search, Plus, Save, Trash2, ArrowUp, ArrowDown,
  Download, RefreshCw, CheckCircle2, AlertCircle, LayoutGrid,
  RotateCcw, X, ExternalLink
} from 'lucide-react';

const CATEGORIAS_OPTIONS = [
  'Patrocinado',
  'Aliado Sin Ánimo de Lucro',
  'Aliado Con Ánimo de Lucro'
];

const ESTADOS_OPTIONS = [
  'Prospecto',
  'En Negociación',
  'Activo',
  'Inactivo'
];

function AliadosExcelView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allAliadosRedux = useSelector(state => state.allAliados) || [];

  // Local state for editable grid data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Tracking modified or newly added rows: Map of rowId -> modified row object
  const [editedRows, setEditedRows] = useState({});
  const [notification, setNotification] = useState(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  // Ref to focus first cell of new row
  const firstInputRef = useRef(null);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Initial fetch from Redux / Supabase
  useEffect(() => {
    dispatch(getAllFromTable(ALIADOS));
  }, [dispatch]);

  // Synchronize Redux store into local rows state while preserving un-saved active edits
  useEffect(() => {
    setRows(prevRows => {
      // Keep only newly added rows that haven't been saved yet (starts with new_ and is in editedRows)
      const unsavedNewRows = prevRows.filter(
        r => String(r.id).startsWith('new_') && editedRows[r.id]
      );
      
      const syncedFromRedux = allAliadosRedux.map(item => {
        // If user has unsaved edits on an existing row, preserve those edits
        if (editedRows[item.id]) {
          return { ...item, ...editedRows[item.id] };
        }
        return { ...item };
      });

      return [...unsavedNewRows, ...syncedFromRedux];
    });
  }, [allAliadosRedux]);

  const handleRefresh = async () => {
    setLoading(true);
    await dispatch(getAllFromTable(ALIADOS));
    setEditedRows({});
    setSelectedIds(new Set());
    setLoading(false);
    showToast('Datos sincronizados desde el servidor');
  };

  // Cell change handler
  const handleCellChange = (id, field, value) => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          setEditedRows(prev => ({
            ...prev,
            [id]: updatedRow
          }));
          return updatedRow;
        }
        return row;
      })
    );
  };

  // Add new empty row at top
  const handleAddRow = () => {
    const newId = `new_${Date.now()}`;
    const newRow = {
      id: newId,
      nombre: '',
      categoria: 'Patrocinado',
      estado_proceso: 'Prospecto',
      nombre_contacto: '',
      email: '',
      telefono: '',
      instagram: '',
      sitio_web: '',
      password: '',
      brand_description: '',
      target_audience: '',
      expected_value: '',
      notas: ''
    };

    setRows(prev => [newRow, ...prev]);
    setEditedRows(prev => ({ ...prev, [newId]: newRow }));
    
    // Auto focus new input after render
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);

    showToast('Nueva fila agregada. Ingresa el Nombre y haz clic en Guardar.', 'info');
  };

  // Revert/Cancel changes for a row
  const handleRevertRow = (id) => {
    if (String(id).startsWith('new_')) {
      // Remove temporary new row
      setRows(prev => prev.filter(r => r.id !== id));
      setEditedRows(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('Fila cancelada');
      return;
    }

    // Revert existing row to original Redux value
    const originalRow = allAliadosRedux.find(r => r.id === id);
    if (originalRow) {
      setRows(prev => prev.map(r => (r.id === id ? { ...originalRow } : r)));
    }
    setEditedRows(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast('Cambios deshechos para esta fila', 'info');
  };

  // Save single row to Supabase
  const handleSaveRow = async (id) => {
    const rowToSave = rows.find(r => r.id === id);
    if (!rowToSave) return;

    if (!rowToSave.nombre || !rowToSave.nombre.trim()) {
      alert('El campo "Nombre" es obligatorio.');
      return;
    }

    setSavingId(id);
    try {
      const formattedInstagram = rowToSave.instagram ? (
        rowToSave.instagram.trim().startsWith('@') ? rowToSave.instagram.trim() : `@${rowToSave.instagram.trim()}`
      ) : '';

      const dataToSubmit = {
        nombre: rowToSave.nombre.trim(),
        categoria: rowToSave.categoria || 'Patrocinado',
        estado_proceso: rowToSave.estado_proceso || 'Prospecto',
        nombre_contacto: rowToSave.nombre_contacto ? rowToSave.nombre_contacto.trim() : '',
        email: rowToSave.email ? rowToSave.email.trim() : '',
        telefono: rowToSave.telefono ? rowToSave.telefono.trim() : '',
        instagram: formattedInstagram,
        sitio_web: formatUrl(rowToSave.sitio_web),
        password: rowToSave.password ? rowToSave.password.trim() : '',
        brand_description: rowToSave.brand_description || '',
        target_audience: rowToSave.target_audience || '',
        expected_value: rowToSave.expected_value || '',
        notas: rowToSave.notas || ''
      };

      if (String(id).startsWith('new_')) {
        // INSERT into Supabase
        const { data, error } = await supabase.from(ALIADOS).insert([dataToSubmit]).select();
        if (error) throw error;

        const insertedRecord = data && data[0];
        
        // Remove temporary ID from editedRows & replace in rows
        setEditedRows(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

        if (insertedRecord) {
          setRows(prev => prev.map(r => (r.id === id ? insertedRecord : r)));
        } else {
          setRows(prev => prev.filter(r => r.id !== id));
        }

        showToast(`Aliado "${dataToSubmit.nombre}" creado con éxito`);
      } else {
        // UPDATE in Supabase
        const { error } = await supabase.from(ALIADOS).update(dataToSubmit).eq('id', id);
        if (error) throw error;

        // Remove from edited state
        setEditedRows(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

        showToast(`Aliado "${dataToSubmit.nombre}" actualizado`);
      }

      // Reload Redux store to maintain sync
      dispatch(getAllFromTable(ALIADOS));
    } catch (err) {
      console.error('Error saving row:', err);
      alert(`Error al guardar: ${err.message || 'Error desconocido'}`);
    } finally {
      setSavingId(null);
    }
  };

  // Save all modified rows
  const handleSaveAll = async () => {
    const editedIds = Object.keys(editedRows);
    if (editedIds.length === 0) {
      showToast('No hay cambios pendientes por guardar', 'info');
      return;
    }

    // Check required fields
    for (const id of editedIds) {
      const row = rows.find(r => r.id == id);
      if (!row || !row.nombre || !row.nombre.trim()) {
        alert('Hay filas sin Nombre. Por favor completa el Nombre antes de guardar.');
        return;
      }
    }

    setIsBulkSaving(true);
    try {
      for (const id of editedIds) {
        await handleSaveRow(id);
      }
      showToast('Todos los cambios han sido guardados con éxito');
    } catch (err) {
      console.error('Error bulk saving:', err);
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Delete single row
  const handleDeleteRow = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el aliado "${nombre || 'Sin nombre'}"?`)) {
      return;
    }

    if (String(id).startsWith('new_')) {
      setRows(prev => prev.filter(r => r.id !== id));
      setEditedRows(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('Fila eliminada');
      return;
    }

    try {
      const { error } = await supabase.from(ALIADOS).delete().eq('id', id);
      if (error) throw error;

      showToast(`Aliado eliminado correctamente`);
      setRows(prev => prev.filter(r => r.id !== id));
      setEditedRows(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      dispatch(getAllFromTable(ALIADOS));
    } catch (err) {
      console.error('Error deleting row:', err);
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`¿Estás seguro de eliminar los ${selectedIds.size} aliados seleccionados?`)) {
      return;
    }

    const idsArray = Array.from(selectedIds);
    const realIds = idsArray.filter(id => !String(id).startsWith('new_'));
    
    try {
      if (realIds.length > 0) {
        const { error } = await supabase.from(ALIADOS).delete().in('id', realIds);
        if (error) throw error;
      }

      setRows(prev => prev.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setEditedRows(prev => {
        const next = { ...prev };
        idsArray.forEach(id => delete next[id]);
        return next;
      });
      showToast(`${idsArray.length} aliados eliminados con éxito`);
      dispatch(getAllFromTable(ALIADOS));
    } catch (err) {
      console.error('Error in bulk delete:', err);
      alert(`Error al eliminar seleccionados: ${err.message}`);
    }
  };

  // Key press shortcuts for cell inputs
  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveRow(id);
    } else if (e.key === 'Escape') {
      handleRevertRow(id);
    }
  };

  // Selection toggle
  const toggleSelectRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (filteredData) => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(r => r.id)));
    }
  };

  // Export filtered rows to Excel (.xlsx)
  const handleExportExcel = () => {
    if (processedRows.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const exportData = processedRows.map(row => ({
      'ID': String(row.id).startsWith('new_') ? 'Nuevo' : row.id,
      'Nombre Aliado': row.nombre || '',
      'Categoría': row.categoria || '',
      'Estado Proceso': row.estado_proceso || '',
      'Nombre Contacto': row.nombre_contacto || '',
      'Email': row.email || '',
      'Teléfono / WA': row.telefono || '',
      'Instagram': row.instagram || '',
      'Sitio Web': row.sitio_web || '',
      'Contraseña Portal': row.password || '',
      'Descripción Marca': row.brand_description || '',
      'Público Objetivo': row.target_audience || '',
      'Valor Esperado': row.expected_value || '',
      'Notas Internas': row.notas || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-adjust column widths
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 4, 15)
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aliados');
    
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Aliados_Eventos_${dateStr}.xlsx`);
    showToast('Archivo Excel generado y descargado', 'success');
  };

  // Sort handler
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Computed statistics
  const stats = useMemo(() => {
    return {
      total: rows.length,
      activos: rows.filter(r => r.estado_proceso === 'Activo').length,
      prospectos: rows.filter(r => r.estado_proceso === 'Prospecto').length,
      negociacion: rows.filter(r => r.estado_proceso === 'En Negociación').length,
      inactivos: rows.filter(r => r.estado_proceso === 'Inactivo').length,
    };
  }, [rows]);

  // Filter and Sort Data
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Text search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        (r.nombre || '').toLowerCase().includes(term) ||
        (r.email || '').toLowerCase().includes(term) ||
        (r.telefono || '').toLowerCase().includes(term) ||
        (r.instagram || '').toLowerCase().includes(term) ||
        (r.nombre_contacto || '').toLowerCase().includes(term) ||
        (r.categoria || '').toLowerCase().includes(term) ||
        (r.notas || '').toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(r => r.categoria === categoryFilter);
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(r => r.estado_proceso === statusFilter);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = (a[sortConfig.key] || '').toString().toLowerCase();
        const valB = (b[sortConfig.key] || '').toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rows, searchTerm, categoryFilter, statusFilter, sortConfig]);

  const pendingChangesCount = Object.keys(editedRows).length;

  return (
    <PageLayout
      title="Base de Datos de Aliados - Vista Excel"
      fullWidth={true}
      className="h-[calc(100vh-4.5rem)] flex flex-col overflow-hidden"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/Aliados')}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <LayoutGrid size={16} /> Vista Tarjetas
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            title="Recargar desde base de datos"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} /> Exportar (.xlsx)
          </button>

          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> + Nuevo Aliado
          </button>

          {pendingChangesCount > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isBulkSaving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md animate-pulse"
            >
              <Save size={18} /> {isBulkSaving ? 'Guardando...' : `Guardar Todos (${pendingChangesCount})`}
            </button>
          )}
        </div>
      }
    >
      {/* Toast notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all ${
          notification.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
          notification.type === 'info' ? 'bg-blue-900 text-blue-100 border-blue-700' :
          'bg-red-900 text-red-100 border-red-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3 flex-shrink-0">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Aliados</span>
          <span className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</span>
        </div>
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">Activos</span>
          <span className="text-2xl font-bold text-emerald-800 mt-1">{stats.activos}</span>
        </div>
        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-amber-700 tracking-wider">Prospectos</span>
          <span className="text-2xl font-bold text-amber-800 mt-1">{stats.prospectos}</span>
        </div>
        <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-blue-700 tracking-wider">En Negociación</span>
          <span className="text-2xl font-bold text-blue-800 mt-1">{stats.negociacion}</span>
        </div>
        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-rose-700 tracking-wider">Inactivos</span>
          <span className="text-2xl font-bold text-rose-800 mt-1">{stats.inactivos}</span>
        </div>
      </div>

      {/* Filters and Controls Header */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-2 mb-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono, instagram, contacto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-2 w-full border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las Categorías</option>
              {CATEGORIAS_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los Estados</option>
              {ESTADOS_OPTIONS.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {(searchTerm || categoryFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                }}
                className="text-xs text-rose-600 hover:underline px-2 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Selected rows actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 bg-amber-50/50 p-2 rounded-lg">
            <span className="text-xs font-semibold text-amber-800">
              {selectedIds.size} {selectedIds.size === 1 ? 'aliado seleccionado' : 'aliados seleccionados'}
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
            >
              <Trash2 size={14} /> Eliminar seleccionados
            </button>
          </div>
        )}
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1 min-h-0 relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-emerald-900 text-emerald-50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-2 border-b border-r border-emerald-800 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={processedRows.length > 0 && selectedIds.size === processedRows.length}
                    onChange={() => toggleSelectAll(processedRows)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>

                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[180px] cursor-pointer select-none" onClick={() => handleSort('nombre')}>
                  <div className="flex items-center justify-between">
                    <span>Nombre *</span>
                    {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>

                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[160px] cursor-pointer select-none" onClick={() => handleSort('categoria')}>
                  <div className="flex items-center justify-between">
                    <span>Categoría</span>
                    {sortConfig.key === 'categoria' && (sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>

                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[140px] cursor-pointer select-none" onClick={() => handleSort('estado_proceso')}>
                  <div className="flex items-center justify-between">
                    <span>Estado Proceso</span>
                    {sortConfig.key === 'estado_proceso' && (sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>

                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[150px] cursor-pointer select-none" onClick={() => handleSort('nombre_contacto')}>
                  <div className="flex items-center justify-between">
                    <span>Contacto</span>
                    {sortConfig.key === 'nombre_contacto' && (sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>

                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[180px] cursor-pointer select-none" onClick={() => handleSort('email')}>
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>

                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[140px]">Teléfono</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[130px]">Instagram</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[170px]">Sitio Web</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[130px]">Contraseña Portal</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[200px]">Descripción Marca</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[200px]">Público Objetivo</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[200px]">Valor Esperado</th>
                <th className="p-2.5 border-b border-r border-emerald-800 font-semibold min-w-[200px]">Notas Internas</th>
                <th className="p-2.5 border-b border-emerald-800 font-semibold w-28 text-center sticky right-0 bg-emerald-950 z-30">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {processedRows.length > 0 ? (
                processedRows.map((row, idx) => {
                  const isModified = Boolean(editedRows[row.id]);
                  const isNew = String(row.id).startsWith('new_');
                  const isSavingThis = savingId === row.id;
                  const isSelected = selectedIds.has(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={`border-b transition-colors relative ${
                        isNew ? 'bg-blue-50/80 border-l-4 border-l-blue-500 hover:bg-blue-100/70' :
                        isModified ? 'bg-amber-50/80 border-l-4 border-l-amber-500 hover:bg-amber-100/70' :
                        isSelected ? 'bg-emerald-50/50' :
                        idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="p-2 border-r border-gray-200 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Nombre */}
                      <td className="p-1 border-r border-gray-200">
                        <input
                          ref={idx === 0 && isNew ? firstInputRef : null}
                          type="text"
                          value={row.nombre || ''}
                          onChange={e => handleCellChange(row.id, 'nombre', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Nombre del aliado *"
                          className={`w-full px-2 py-1 bg-transparent border rounded outline-none text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 ${
                            !row.nombre ? 'border-red-300 bg-red-50/50' : 'border-transparent hover:border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Categoría */}
                      <td className="p-1 border-r border-gray-200">
                        <select
                          value={row.categoria || 'Patrocinado'}
                          onChange={e => handleCellChange(row.id, 'categoria', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded outline-none text-xs focus:bg-white"
                        >
                          {CATEGORIAS_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* Estado Proceso */}
                      <td className="p-1 border-r border-gray-200">
                        <select
                          value={row.estado_proceso || 'Prospecto'}
                          onChange={e => handleCellChange(row.id, 'estado_proceso', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          className={`w-full px-1.5 py-1 border rounded outline-none text-xs font-semibold focus:bg-white ${
                            row.estado_proceso === 'Activo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            row.estado_proceso === 'Prospecto' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            row.estado_proceso === 'En Negociación' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {ESTADOS_OPTIONS.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>

                      {/* Contacto */}
                      <td className="p-1 border-r border-gray-200">
                        <input
                          type="text"
                          value={row.nombre_contacto || ''}
                          onChange={e => handleCellChange(row.id, 'nombre_contacto', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Nombre contacto"
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs"
                        />
                      </td>

                      {/* Email */}
                      <td className="p-1 border-r border-gray-200">
                        <input
                          type="email"
                          value={row.email || ''}
                          onChange={e => handleCellChange(row.id, 'email', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="correo@ejemplo.com"
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs"
                        />
                      </td>

                      {/* Teléfono */}
                      <td className="p-1 border-r border-gray-200">
                        <input
                          type="text"
                          value={row.telefono || ''}
                          onChange={e => handleCellChange(row.id, 'telefono', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="+57 300..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs"
                        />
                      </td>

                      {/* Instagram */}
                      <td className="p-1 border-r border-gray-200">
                        <input
                          type="text"
                          value={row.instagram || ''}
                          onChange={e => handleCellChange(row.id, 'instagram', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          onBlur={e => {
                            if (e.target.value && !e.target.value.startsWith('@')) {
                              handleCellChange(row.id, 'instagram', `@${e.target.value.trim()}`);
                            }
                          }}
                          placeholder="@usuario"
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs text-blue-600 font-medium"
                        />
                      </td>

                      {/* Sitio Web */}
                      <td className="p-1 border-r border-gray-200">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={row.sitio_web || ''}
                            onChange={e => handleCellChange(row.id, 'sitio_web', e.target.value)}
                            onKeyDown={e => handleKeyDown(e, row.id)}
                            onBlur={e => {
                              if (e.target.value) {
                                handleCellChange(row.id, 'sitio_web', formatUrl(e.target.value));
                              }
                            }}
                            placeholder="https://..."
                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs text-emerald-700"
                          />
                          {row.sitio_web && (
                            <a
                              href={formatUrl(row.sitio_web)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-400 hover:text-emerald-600 px-1"
                              title="Abrir enlace"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Contraseña Portal */}
                      <td className="p-1 border-r border-gray-200">
                        <input
                          type="text"
                          value={row.password || ''}
                          onChange={e => handleCellChange(row.id, 'password', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Contraseña..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs font-mono text-gray-600"
                        />
                      </td>

                      {/* Descripción Marca */}
                      <td className="p-1 border-r border-gray-200">
                        <textarea
                          rows="1"
                          value={row.brand_description || ''}
                          onChange={e => handleCellChange(row.id, 'brand_description', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Descripción..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
                        />
                      </td>

                      {/* Público Objetivo */}
                      <td className="p-1 border-r border-gray-200">
                        <textarea
                          rows="1"
                          value={row.target_audience || ''}
                          onChange={e => handleCellChange(row.id, 'target_audience', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Público..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
                        />
                      </td>

                      {/* Valor Esperado */}
                      <td className="p-1 border-r border-gray-200">
                        <textarea
                          rows="1"
                          value={row.expected_value || ''}
                          onChange={e => handleCellChange(row.id, 'expected_value', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Expectativas..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
                        />
                      </td>

                      {/* Notas Internas */}
                      <td className="p-1 border-r border-gray-200">
                        <textarea
                          rows="1"
                          value={row.notas || ''}
                          onChange={e => handleCellChange(row.id, 'notas', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, row.id)}
                          placeholder="Notas de acuerdo..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
                        />
                      </td>

                      {/* Actions Column */}
                      <td className="p-1.5 text-center sticky right-0 bg-white shadow-sm">
                        <div className="flex items-center justify-center gap-1">
                          {isModified ? (
                            <>
                              <button
                                onClick={() => handleSaveRow(row.id)}
                                disabled={isSavingThis}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                                title="Guardar cambios (Enter)"
                              >
                                <Save size={14} className={isSavingThis ? 'animate-spin' : ''} />
                              </button>
                              <button
                                onClick={() => handleRevertRow(row.id)}
                                className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                                title="Deshacer cambios (Esc)"
                              >
                                <RotateCcw size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteRow(row.id, row.nombre)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Eliminar aliado"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="15" className="p-8 text-center text-gray-400 italic bg-white">
                    No se encontraron aliados que coincidan con la búsqueda.
                  </td>
                </tr>
              )}

              {/* Row button to quickly add a new ally / row */}
              <tr 
                onClick={handleAddRow} 
                className="bg-emerald-50/60 hover:bg-emerald-100/80 cursor-pointer text-emerald-800 font-medium border-t-2 border-emerald-200 transition-colors group"
              >
                <td className="p-2.5 text-center text-emerald-600">
                  <Plus size={16} className="mx-auto group-hover:scale-110 transition-transform" />
                </td>
                <td colSpan="13" className="p-2.5 text-xs text-emerald-800 font-semibold">
                  + Hacer clic aquí para añadir una nueva celda / aliado a la tabla
                </td>
                <td className="p-2 text-center sticky right-0 bg-emerald-100/90 shadow-sm">
                  <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded font-medium">+ Añadir</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-gray-50 border-t border-gray-200 p-2.5 px-4 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-4">
            <span>
              Mostrando <span className="font-semibold text-gray-700">{processedRows.length}</span> de <span className="font-semibold text-gray-700">{rows.length}</span> aliados
            </span>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus size={14} /> + Añadir Celda / Aliado
            </button>
          </div>
          {pendingChangesCount > 0 && (
            <div className="text-amber-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              {pendingChangesCount} fila(s) con cambios no guardados
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default AliadosExcelView;
