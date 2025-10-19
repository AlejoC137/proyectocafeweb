import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Search, Download,
  XCircle, ArrowUpDown, Trash2, ChevronUp, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Acciones y tipos
import { getAllFromTable, actualizarWorkIsue, deleteWorkIsue } from '../../../../redux/actions-WorkIsue.js';

// --- Constantes y Helpers (Necesarios para la UI de las propiedades) ---
const ESTADOS = [
  { value: false, label: 'Pendiente' },
  { value: true, label: 'Terminado' },
];

const PAGADO_ESTADOS = [
  { value: false, label: 'No Pagado' },
  { value: true, label: 'Pagado Completo' },
];

const TIPO_PROCEDIMIENTO = [
  { value: 'produccion', label: 'Producción' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

// --- Helpers de Normalización y Acceso ---

/**
 * Parsea de forma segura un string JSON.
 * @param {string} str - El string JSON a parsear.
 * @param {*} [defaultValue=null] - El valor a devolver si el parseo falla.
 * @returns {object | array | null} - El objeto/array parseado o el valor por defecto.
 */
const safeJsonParse = (str, defaultValue = null) => {
  if (typeof str !== 'string' || !str) {
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(str);
    // Maneja el caso en que el string sea "null" o "[]" pero queramos un objeto para anidación
    if (parsed === null && defaultValue !== null) return defaultValue;
    if (Array.isArray(parsed) && Array.isArray(defaultValue)) return parsed;
    if (typeof parsed === 'object' && !Array.isArray(parsed) && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) return parsed;
    
    // Fallback para tipos mixtos
    if (parsed) return parsed;
    
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Obtiene un valor anidado de un objeto usando un string "dot.notation".
 * @param {object} obj - El objeto fuente.
 * @param {string} path - El string de ruta (ej: "Dates.isued").
 * @returns {*} - El valor encontrado o undefined.
 */
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

// --- Columnas ---
// Define las columnas de la tabla. 'key' usa "dot.notation" para acceder a datos anidados.
const COLUMNS_CONFIG = [
  { key: 'Categoria', label: 'Categoría', width: 150, sortable: true, type: 'text' },
  { key: 'Tittle', label: 'Título', width: 320, sortable: true, type: 'text' },
  // Propiedades anidadas de 'Procedimientos'
  { key: 'Procedimientos.0._tipo', label: 'Procedimiento', width: 150, sortable: false, type: 'select', options: TIPO_PROCEDIMIENTO },
  
  // --- MODIFICACIÓN: Columnas de 'Dates' separadas ---
  { key: 'Dates.isued', label: 'Fecha Creación', width: 180, sortable: true, type: 'date' },
  { key: 'Dates.finished', label: 'Fecha Finalizado', width: 180, sortable: true, type: 'date' },
  { key: 'Dates.date_asigmente', label: 'Bitácora', width: 250, sortable: false, type: 'textarea' }, // Usar textarea para editar el JSON del array
  // --- Fin Modificación ---

  { key: 'Ejecutor', label: 'Ejecutor', width: 180, sortable: true, type: 'select', optionsKey: 'staff' }, // 'optionsKey' buscará en el estado
  { key: 'Terminado', label: 'Terminado', width: 120, sortable: true, type: 'boolean' },
  // Propiedad anidada de 'Pagado'
  { key: 'Pagado.pagadoFull', label: 'Pagado', width: 120, sortable: true, type: 'boolean', options: PAGADO_ESTADOS },
  { key: 'Notas', label: 'Notas', width: 320, sortable: true, type: 'textarea' },
];


// --- Componente Celda Editable ---

/**
 * Componente de celda individual que maneja su propio estado de edición.
 * Guarda al perder el foco (onBlur) o al presionar Enter.
 * MODIFICADO: Ahora maneja valores 'array' convirtiéndolos a/desde string JSON.
 */
const EditableCell = ({ value, taskId, fieldKey, onSave, type = 'text', options = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // MODIFICACIÓN 1: Stringify arrays (como 'date_asigmente') para el estado local
  const [currentValue, setCurrentValue] = useState(
    Array.isArray(value) ? JSON.stringify(value) : value
  );
  
  const inputRef = useRef(null);

  // MODIFICACIÓN 2: Stringify arrays cuando el prop 'value' (externo) cambia
  useEffect(() => {
    setCurrentValue(Array.isArray(value) ? JSON.stringify(value) : value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  // MODIFICACIÓN 3: Parsear arrays de vuelta antes de guardar
  const handleSave = () => {
    setIsEditing(false);
    
    let finalValue = currentValue;
    // Valor original (stringificado si era array) para comparación
    const originalValueAsString = Array.isArray(value) ? JSON.stringify(value) : value;

    // Si el valor original era un array, intentar parsear el string editado
    if (Array.isArray(value)) {
      try {
        finalValue = JSON.parse(currentValue);
      } catch (e) {
        console.error("Error al parsear JSON, revirtiendo.", e);
        setCurrentValue(originalValueAsString); // Revertir al valor original stringificado
        return; // No guardar
      }
    }

    // Comparar el string actual con el string original
    if (currentValue !== originalValueAsString) {
      onSave(taskId, fieldKey, finalValue); // Enviar el valor parseado (finalValue)
    }
  };

  const handleChange = (e) => {
    const { value: newValue, type: inputType, checked } = e.target;
    setCurrentValue(inputType === 'checkbox' ? checked : newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(Array.isArray(value) ? JSON.stringify(value) : value); // Revertir
    }
  };

  // Guardado inmediato para checkboxes
  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setCurrentValue(checked);
    onSave(taskId, fieldKey, checked); // Guardar inmediatamente
    setIsEditing(false); // Salir del modo edición
  };

  const handleSelectChange = (e) => {
    setCurrentValue(e.target.value);
    onSave(taskId, fieldKey, e.target.value); // Guardar inmediatamente
    setIsEditing(false); // Salir del modo edición
  };

  // MODIFICACIÓN 4: Mostrar arrays como strings JSON en el modo display
  const renderDisplayValue = () => {
    if (type === 'boolean') {
      const option = options.find(o => o.value === value);
      return option ? option.label : (value ? 'Sí' : 'No');
    }
    if (type === 'date') {
      // Manejar fechas vacías o inválidas
      return value ? new Date(value).toLocaleDateString() : <span className="text-gray-400 italic">N/A</span>;
    }
    if (type === 'select') {
      const option = options.find(o => o.value === value);
      return option ? option.label : value || <span className="text-gray-400 italic">N/A</span>;
    }
    // Nuevo:
    if (Array.isArray(value)) {
      return <span className="text-xs font-mono">{JSON.stringify(value)}</span>; // Mostrar el array como string
    }
    return value || <span className="text-gray-400 italic">Vacío</span>;
  };

  if (isEditing) {
    switch (type) {
      case 'boolean':
        // ... (sin cambios)
        if (options && options.length > 0) {
          return (
            <select
              ref={inputRef}
              value={currentValue === null || currentValue === undefined ? '' : currentValue}
              onChange={handleSelectChange}
              onBlur={handleSave} 
              className="w-full p-1 border border-blue-500 rounded"
            >
              {options.map(opt => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }
        return ( 
          <input
            type="checkbox"
            checked={!!currentValue}
            onChange={handleCheckboxChange} 
            onBlur={() => setIsEditing(false)} 
            className="m-auto"
          />
        );
      case 'select':
        return (
          <select
            ref={inputRef}
            value={currentValue || ''}
            onChange={handleSelectChange} 
            onBlur={() => setIsEditing(false)} 
            className="w-full p-1 border border-blue-500 rounded"
          >
            <option value="">Seleccionar...</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            ref={inputRef}
            type="date"
            value={currentValue ? currentValue.split('T')[0] : ''} // Formato YYYY-MM-DD
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-blue-500 rounded"
          />
        );
      case 'textarea':
        return (
          <textarea
            ref={inputRef}
            value={currentValue || ''} // 'currentValue' ya es un string (incluso si es array)
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full h-24 p-1 border border-blue-500 rounded font-mono text-xs" // Añadido font-mono para JSON
          />
        );
      default: // 'text'
        return (
          <input
            ref={inputRef}
            type="text"
            value={currentValue || ''} // 'currentValue' ya es un string (incluso si es array)
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-blue-500 rounded"
          />
        );
    }
  }

  return (
    <div 
      className="cursor-pointer p-2 min-h-[42px] w-full flex items-center rounded-md hover:bg-slate-100 whitespace-pre-wrap"
      onClick={() => setIsEditing(true)}
      title="Clic para editar"
    >
      {renderDisplayValue()}
    </div>
  );
};


// --- Componente Principal ---
const WorkIsueExcelView = () => {
  const dispatch = useDispatch();
  
  // Estado para los datos crudos de la API
  const [rawData, setRawData] = useState([]);
  const [staff, setStaff] = useState([]);

  // Estado para la UI
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'Categoria', direction: 'ascending' });

  // Opciones dinámicas para selects
  const dynamicOptions = useMemo(() => ({
    staff: staff.map(s => ({ value: s.Nombre, label: s.Nombre })),
    // Aquí se podrían agregar más opciones dinámicas si fuesen necesarias
  }), [staff]);


  // --- Data Fetching ---
  const fetchAllData = useCallback(async () => {
    console.log("Fetching all data...");
    const [tareasAction, staffAction] = await Promise.all([
      dispatch(getAllFromTable('WorkIsue')),
      dispatch(getAllFromTable('Staff')),
    ]);
    if (tareasAction?.payload) setRawData(tareasAction.payload);
    if (staffAction?.payload) setStaff(staffAction.payload);
  }, [dispatch]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- Normalización y Procesamiento de Datos ---

  // 1. Normaliza los datos crudos (parsea JSON strings)
  const processedData = useMemo(() => {
    return rawData.map(item => ({
      ...item,
      // Parsea los campos JSON string a objetos
      Dates: safeJsonParse(item.Dates, { isued: null, finished: null, date_asigmente: [] }),
      Pagado: safeJsonParse(item.Pagado, { pagadoFull: false, adelanto: "NoAplica", susceptible: false }),
      Procedimientos: safeJsonParse(item.Procedimientos, []), // Espera un array
    }));
  }, [rawData]);

  // 2. Filtra y Ordena los datos normalizados
  const sortedAndFilteredData = useMemo(() => {
    let aData = [...processedData];

    // Filtrado
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      aData = aData.filter(item => {
        // Busca en todas las claves definidas en las columnas
        return COLUMNS_CONFIG.some(col => {
          const value = getNestedValue(item, col.key);
          // Convertir arrays a string para búsqueda
          const stringValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
          return stringValue.toLowerCase().includes(lowerSearch);
        });
      });
    }

    // Ordenamiento
    if (sortConfig.key) {
      aData.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        let comparison = 0;
        if (aValue > bValue) {
          comparison = 1;
        } else if (aValue < bValue) {
          comparison = -1;
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return aData;
  }, [processedData, searchTerm, sortConfig]);

  // --- Manejadores de Eventos ---

  /**
   * Maneja la actualización de una celda.
   * Reconstruye el JSON string padre si el campo es anidado.
   * No necesita cambios, ya que EditableCell ahora envía el 'newValue'
   * (ej: un array parseado) que esta función espera.
   */
  const handleUpdateTask = async (taskId, fieldKey, newValue) => {
    const taskToUpdate = rawData.find(t => t._id === taskId);
    if (!taskToUpdate) return;

    let updateData = {};
    
    // Comprobar si es un campo anidado (ej: "Dates.isued")
    if (fieldKey.includes('.')) {
      const [parentKey, childKey] = fieldKey.split('.'); // "Dates", "isued"
      let childIndex = null;
      
      // Manejar arrays anidados (ej: "Procedimientos.0._tipo")
      let realChildKey = childKey;
      if (!isNaN(Number(parentKey[parentKey.length -1]))){
         const parts = fieldKey.split('.');
         realChildKey = parts.pop(); // "_tipo"
         parentKey = parts.shift(); // "Procedimientos"
         childIndex = parts.pop(); // "0"
      }


      // 1. Obtener el string JSON original del padre
      const originalParentString = taskToUpdate[parentKey]; 
      
      // 2. Parsearlo a un objeto/array
      const isArray = Array.isArray(safeJsonParse(originalParentString, []));
      const parentObject = safeJsonParse(originalParentString, isArray ? [] : {});
      
      // 3. Modificar el valor anidado
      if (childIndex !== null && Array.isArray(parentObject)) {
         // Es un array: "Procedimientos.0._tipo"
         if(parentObject[childIndex]) {
            parentObject[childIndex][realChildKey] = newValue;
         }
      } else if (!isArray) {
        // Es un objeto: "Dates.isued" o "Dates.date_asigmente"
        // 'newValue' para 'date_asigmente' ya es un array (parseado por EditableCell)
        parentObject[realChildKey] = newValue;
      }
      
      // 4. Volver a convertir el objeto padre a string JSON
      updateData[parentKey] = JSON.stringify(parentObject);

    } else {
      // Es un campo simple (ej: "Tittle")
      updateData[fieldKey] = newValue;
    }

    // 5. Despachar la acción de actualización
    console.log("Actualizando Tarea:", taskId, "Data:", updateData);
    await dispatch(actualizarWorkIsue(taskId, updateData));
    
    // 6. Refrescar los datos para mostrar el cambio
    await fetchAllData();
  };

  /**
   * Maneja la eliminación de una tarea
   */
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      await dispatch(deleteWorkIsue(taskId));
      await fetchAllData(); // Refrescar
    }
  };

  /**
   * Maneja el clic en el encabezado para ordenar
   */
  const requestSort = (key) => {
    if (!key) return;
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  /**
   * Maneja la exportación a Excel
   */
  const handleExport = () => {
    // 1. Aplanar los datos para que coincidan con las columnas
    const dataToExport = sortedAndFilteredData.map(task => {
      let flatTask = {};
      COLUMNS_CONFIG.forEach(col => {
        let value = getNestedValue(task, col.key);
        // Stringify arrays para Excel
        if (Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        flatTask[col.label] = value;
      });
      return flatTask;
    });

    // 2. Crear la hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // (Opcional) Ajustar anchos de columna
    const colWidths = COLUMNS_CONFIG.map(col => ({ wch: col.width / 8 })); // Aproximación
    ws['!cols'] = colWidths;

    // 3. Crear el libro y guardar
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WorkIsues');
    XLSX.writeFile(wb, 'WorkIsues_Export.xlsx');
  };

  /**
   * Obtiene las opciones correctas para un select (estáticas o dinámicas)
   */
  const getCellOptions = (col) => {
    if (col.options) return col.options; // Opciones estáticas
    if (col.optionsKey) return dynamicOptions[col.optionsKey] || []; // Opciones dinámicas (ej: staff)
    
    // Caso especial para 'Terminado'
    if (col.key === 'Terminado') return ESTADOS;
    
    return [];
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      
      {/* --- Toolbar --- */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en la tabla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8 py-2 border rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {searchTerm && (
              <XCircle 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-red-600 cursor-pointer"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar a Excel
        </button>
      </div>

      {/* --- Vista de Tabla / Excel --- */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 border-collapse">
          {/* --- Encabezado --- */}
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {/* Encabezados de Columnas */}
              {COLUMNS_CONFIG.map((col) => (
                <th
                  key={col.key}
                  style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                  onClick={() => col.sortable && requestSort(col.key)}
                >
                  <div className="flex items-center justify-between">
                    {col.label}
                    {col.sortable && (
                      <span className="ml-1">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'ascending' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-300" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {/* Columna de Acciones */}
              <th 
                style={{ width: '80px' }}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acción
              </th>
            </tr>
          </thead>

          {/* --- Cuerpo de la Tabla --- */}
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredData.length > 0 ? (
              sortedAndFilteredData.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50 align-top">
                  {/* Celdas de Datos */}
                  {COLUMNS_CONFIG.map((col) => (
                    <td 
                      key={col.key} 
                      className="px-1 py-1 whitespace-normal text-sm text-gray-900 border-r border-gray-100 align-top"
                      style={{ maxWidth: `${col.width}px` }}
                    >
                      <EditableCell
                        value={getNestedValue(task, col.key)}
                        taskId={task._id}
                        fieldKey={col.key}
                        onSave={handleUpdateTask}
                        type={col.type}
                        options={getCellOptions(col)}
                      />
                    </td>
                  ))}
                  {/* Celda de Acciones */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium border-r border-gray-100 align-top">
                    <div className="flex items-center justify-center h-[42px]">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar Tarea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={COLUMNS_CONFIG.length + 1} className="text-center py-10 text-gray-500">
                  {searchTerm ? 'No se encontraron resultados.' : 'No hay datos para mostrar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkIsueExcelView;