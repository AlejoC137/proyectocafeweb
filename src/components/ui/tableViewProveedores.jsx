import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { deleteProveedor, updateProveedor, copiarAlPortapapeles } from "../../redux/actions-Proveedores";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";
import Procedimiento from "./Procedimiento";

export function TableViewProveedores({ products = [] }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const allItems = useSelector((state) => state.allItems || []);
  const allProveedores = useSelector((state) => state.Proveedores || []);
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editingRows, setEditingRows] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showProcessOrder, setShowProcessOrder] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null); // Nuevo estado

  // Definir todas las columnas disponibles para proveedores (incluyendo todas las de CardGridProveedores)
  const getAvailableColumns = () => {
    return {
      nombre: { label: "Nombre Proveedor", key: "Nombre_Proveedor", default: true },
      contactoNombre: { label: "Contacto Nombre", key: "Contacto_Nombre", default: true },
      contactoNumero: { label: "Contacto Número", key: "Contacto_Numero", default: true },
      direccion: { label: "Dirección", key: "Direccion", default: true },
      nitcc: { label: "NIT/CC", key: "NIT/CC", default: false },
      paginaWeb: { label: "Página Web", key: "PAGINA_WEB", default: false },
      pendientes: { label: "Pendientes de Compra", key: "pendientes", default: true },
      totalProductos: { label: "Total Productos", key: "totalProductos", default: false },
      acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
    };
  };

  const availableColumns = useMemo(() => getAvailableColumns(), []);

  // Inicializar columnas visibles
  useEffect(() => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => {
      defaultVisibleColumns[key] = column.default;
    });
    console.log('Initializing visible columns (Proveedores):', defaultVisibleColumns);
    setVisibleColumns(defaultVisibleColumns);
  }, [availableColumns]);

  // Debug log para ver el estado actual
  console.log('Current visibleColumns state (Proveedores):', visibleColumns);
  console.log('Available columns (Proveedores):', availableColumns);

  // Cerrar el selector de columnas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSelector && !event.target.closest('.column-selector-container')) {
        setShowColumnSelector(false);
      }
    };

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSelector]);

  // Funciones para manejar la visibilidad de columnas
  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const toggleAllColumns = (show) => {
    const newVisibleColumns = {};
    Object.keys(availableColumns).forEach(key => {
      newVisibleColumns[key] = show;
    });
    setVisibleColumns(newVisibleColumns);
  };

  const resetToDefault = () => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => {
      defaultVisibleColumns[key] = column.default;
    });
    setVisibleColumns(defaultVisibleColumns);
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const searchField = `${product.Nombre_Proveedor || ""} ${product.Contacto_Nombre || ""} ${product.Direccion || ""}`;
    const matchesSearch = !searchTerm || 
      searchField.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue = a[sortColumn] || "";
    let bValue = b[sortColumn] || "";
    
    // Manejar casos especiales para números
    if (sortColumn === "Contacto_Numero") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortDirection === "asc" ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Función para manejar edición inline
  const handleCellEdit = (itemId, field, value) => {
    setEditingRows(prev => {
      const existingEdits = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...existingEdits,
          [field]: value
        }
      };
    });
  };

  // Función para validar datos antes del guardado
  const validateRowData = (editedData) => {
    const errors = [];
    
    // Validar nombre del proveedor
    if (editedData.Nombre_Proveedor && editedData.Nombre_Proveedor.trim().length < 2) {
      errors.push('El nombre del proveedor debe tener al menos 2 caracteres');
    }
    
    // Validar número de contacto si está presente
    if (editedData.Contacto_Numero && editedData.Contacto_Numero.trim()) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(editedData.Contacto_Numero)) {
        errors.push('El número de contacto contiene caracteres inválidos');
      }
    }
    
    // Validar página web si está presente
    if (editedData.PAGINA_WEB && editedData.PAGINA_WEB.trim()) {
      try {
        new URL(editedData.PAGINA_WEB);
      } catch {
        errors.push('La página web debe ser una URL válida');
      }
    }
    
    return errors;
  };

  // Función para guardar cambios
  const handleSaveRow = async (item) => {
    const editedData = editingRows[item._id] || {};
    
    // Si no hay cambios, no hacer nada
    if (Object.keys(editedData).length === 0) {
      return;
    }
    
    // Validar datos antes del guardado
    const validationErrors = validateRowData(editedData);
    if (validationErrors.length > 0) {
      alert(`Errores de validación:\n- ${validationErrors.join('\n- ')}`);
      return;
    }
    
    try {
      const updatedFields = { ...editedData };
      
      // Limpiar campos vacíos
      Object.keys(updatedFields).forEach(key => {
        if (updatedFields[key] === '') {
          updatedFields[key] = null;
        } else if (typeof updatedFields[key] === 'string') {
          updatedFields[key] = updatedFields[key].trim();
        }
      });
      
      const result = await dispatch(updateProveedor(item._id, updatedFields));
      
      if (result) {
        // Limpiar datos de edición para esta fila
        setEditingRows(prev => {
          const newState = { ...prev };
          delete newState[item._id];
          return newState;
        });
        
        console.log('Proveedor actualizado correctamente');
      } else {
        throw new Error('No se pudo actualizar el proveedor');
      }
      
    } catch (error) {
      console.error("Error al actualizar el proveedor:", error);
      alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
    }
  };

  // Abrir modal y pasar proveedor seleccionado y sus pendientes
  const handleProcedimiento = (item) => {
    // Busca el proveedor completo en allProveedores por si products no tiene todos los campos
    const proveedorCompleto = allProveedores.find(p => p._id === item._id) || item;
    // Obtener los productos pendientes de compra para este proveedor
    const pendientes = allItems.filter(prod => prod.Proveedor === proveedorCompleto._id && prod.Estado === "PC");
    setSelectedProveedor({ ...proveedorCompleto, pendientes });
    setShowProcessOrder(true);
  };

  // Guardar cambios desde Procedimiento
  const handleSaveProcedimiento = async (data) => {
    try {
      await dispatch(updateProveedor(data._id, data));
      setShowProcessOrder(false);
      setSelectedProveedor(null);
    } catch (error) {
      alert("Error al guardar el proveedor");
    }
  };

  // Cerrar modal Procedimiento
  const handleCloseProcedimiento = () => {
    setShowProcessOrder(false);
    setSelectedProveedor(null);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al proveedor ${item.Nombre_Proveedor}?`)) {
      try {
        await dispatch(deleteProveedor(item._id));
        alert("Proveedor eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el proveedor:", error);
        alert("Hubo un error al eliminar el proveedor.");
      }
    }
  };

  // --- NUEVA FUNCIÓN: Copiar pendientes de compra agrupados por proveedor al portapapeles ---
  const handleCopyPending = async () => {
    // Agrupa los productos pendientes (Estado === "PC") por proveedor
    const pendientesPorProveedor = allProveedores.map(prov => {
      const pendientes = allItems.filter(
        item => item.Estado === "PC" && item.Proveedor === prov._id
      );
      if (pendientes.length === 0) return null;
      return {
        proveedor: prov,
        pendientes
      };
    }).filter(Boolean);

    if (pendientesPorProveedor.length === 0) {
      alert("No hay productos pendientes de compra para ningún proveedor.");
      return;
    }

    try {
      // Llama a la acción para copiar agrupado por proveedor
      await dispatch(copiarAlPortapapeles(pendientesPorProveedor, "PC", "Proveedor", allProveedores));
      alert("Pendientes de compra agrupados por proveedor copiados al portapapeles.");
    } catch (error) {
      console.error("Error al copiar:", error);
      alert("Hubo un error al copiar los pendientes.");
    }
  };

  // Función para renderizar celdas editables
  const renderEditableCell = (item, field, type = "text") => {
    const currentValue = editingRows[item._id]?.[field] !== undefined ? 
      editingRows[item._id][field] : (item[field] || "");

    return (
      <input
        type={type}
        value={currentValue}
        onChange={(e) => handleCellEdit(item._id, field, e.target.value)}
        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900"
      />
    );
  };

  // Función para renderizar headers de la tabla
  const renderTableHeaders = () => {
    const headers = [
      { key: 'nombre', content: (
        <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Nombre_Proveedor")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Nombre Proveedor <SortIcon column="Nombre_Proveedor" />
          </button>
        </th>
      )},
      { key: 'contactoNombre', content: (
        <th key="contactoNombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Contacto_Nombre")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Contacto Nombre <SortIcon column="Contacto_Nombre" />
          </button>
        </th>
      )},
      { key: 'contactoNumero', content: (
        <th key="contactoNumero" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Contacto_Numero")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Contacto Número <SortIcon column="Contacto_Numero" />
          </button>
        </th>
      )},
      { key: 'direccion', content: (
        <th key="direccion" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Direccion")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Dirección <SortIcon column="Direccion" />
          </button>
        </th>
      )},
      { key: 'nitcc', content: (
        <th key="nitcc" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("NIT/CC")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            NIT/CC <SortIcon column="NIT/CC" />
          </button>
        </th>
      )},
      { key: 'paginaWeb', content: (
        <th key="paginaWeb" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("PAGINA_WEB")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Página Web <SortIcon column="PAGINA_WEB" />
          </button>
        </th>
      )},
      { key: 'acciones', content: (
        <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
      )}
    ];
    
    return headers.filter(header => visibleColumns[header.key]).map(header => header.content);
  };

  // Función para renderizar filas de la tabla
  const renderTableRows = () => {
    const rows = [];

    sortedProducts.forEach((item, index) => {
      const isEditing = editingRows[item._id];

      // Obtener los productos asociados y pendientes de compra para este proveedor
      const asociados = allItems.filter(prod => prod.Proveedor === item._id);
      const pendientes = asociados.filter(prod => prod.Estado === "PC");

      const cells = [
        { key: 'nombre', content: (
          <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Nombre_Proveedor") : 
              <span className="font-medium text-blue-800">{item.Nombre_Proveedor || "Sin nombre"}</span>
            }
          </td>
        )},
        { key: 'contactoNombre', content: (
          <td key="contactoNombre" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Contacto_Nombre") : 
              <span className="text-gray-700">{item.Contacto_Nombre || "N/A"}</span>
            }
          </td>
        )},
        { key: 'contactoNumero', content: (
          <td key="contactoNumero" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Contacto_Numero", "tel") : 
              <span className="font-mono text-green-700">{item.Contacto_Numero || "N/A"}</span>
            }
          </td>
        )},
        { key: 'direccion', content: (
          <td key="direccion" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Direccion") : 
              <div className="text-gray-600 max-w-xs truncate" title={item.Direccion}>
                {item.Direccion || "Sin dirección"}
              </div>
            }
          </td>
        )},
        { key: 'nitcc', content: (
          <td key="nitcc" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "NIT/CC") : 
              <span className="font-mono text-purple-700">{item["NIT/CC"] || "N/A"}</span>
            }
          </td>
        )},
        { key: 'paginaWeb', content: (
          <td key="paginaWeb" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "PAGINA_WEB", "url") : 
              (item.PAGINA_WEB ? (
                <a href={item.PAGINA_WEB} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 truncate max-w-xs block">
                  🔗 Ver sitio
                </a>
              ) : (
                <span className="text-gray-400">Sin sitio web</span>
              ))
            }
          </td>
        )},
        { key: 'pendientes', content: (
          <td key="pendientes" className="px-3 py-2 border-r border-gray-100 text-xs">
            <span className="font-semibold text-orange-700">{pendientes.length}</span>
            {pendientes.length > 0 && (
              <Button
                onClick={async () => {
                  await dispatch(copiarAlPortapapeles(pendientes, "PC", "Proveedor", allProveedores));
                  alert("Pendientes de compra de este proveedor copiados al portapapeles.");
                }}
                className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 text-xs h-6 border border-yellow-600"
                title="Copiar pendientes de compra de este proveedor"
              >
                📋
              </Button>
            )}
          </td>
        )},
        { key: 'totalProductos', content: (
          <td key="totalProductos" className="px-3 py-2 border-r border-gray-100 text-xs">
            <span className="font-semibold text-blue-700">{asociados.length}</span>
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">
            <div className="flex gap-1">
              {isEditing && (
                <Button
                  onClick={() => handleSaveRow(item)}
                  className="bg-gray-100 hover:bg-green-600 text-green-800 px-2 py-1 text-xs h-6 border border-green-300"
                >
                  💾
                </Button>
              )}
              <Button
                onClick={() => handleProcedimiento(item)}
                className="bg-gray-100 hover:bg-red-600 text-red-800 px-2 py-1 text-xs h-6 border border-red-300"
              >
                Pedir
              </Button>
              {showEdit && (
                <Button
                  onClick={() => handleDelete(item)}
                  className="bg-gray-100 hover:bg-red-600 text-red-800 px-2 py-1 text-xs h-6 border border-red-300"
                >
                  🗑️
                </Button>
              )}
            </div>
          </td>
        )}
      ];
      
      rows.push(
        <tr 
          key={item._id} 
          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
        >
          {cells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content)}
        </tr>
      );
    });
    
    return rows;
  };

  return (
    <div className="w-full">
            {showProcessOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-8">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-screen-2xl h-[90vh] flex flex-col">
      <Procedimiento
        initialOrder={selectedProveedor}
        pendientes={selectedProveedor?.pendientes || []}
        onSave={handleSaveProcedimiento}
        onClose={handleCloseProcedimiento}
      />
    </div>
  </div>
)}

      {/* Panel de filtros tipo Excel */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botón para selector de columnas */}
          <Button
            onClick={() => setShowColumnSelector(true)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm border border-blue-300 flex items-center gap-2"
          >
            📋 Columnas
          </Button>
          {/* --- NUEVO BOTÓN: Copiar pendientes --- */}
          <Button
            onClick={handleCopyPending}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-sm border border-yellow-600 flex items-center gap-2"
          >
            📋 Copiar Pendientes
          </Button>
          <div className="text-sm text-gray-600">
            Mostrando {sortedProducts.length} de {products.length} proveedores
          </div>
        </div>
      </div>

      {/* Tabla estilo Excel */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full bg-white">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>

      {/* Modal independiente para selector de columnas */}
      {showColumnSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 column-selector-container">
            {/* Header del modal */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Personalizar Columnas</h3>
                  <p className="text-sm text-gray-600">Selecciona las columnas que deseas mostrar</p>
                </div>
              </div>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Controles rápidos */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => toggleAllColumns(true)}
                className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                ✅ Mostrar Todas
              </button>
              <button
                onClick={() => toggleAllColumns(false)}
                className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                ❌ Ocultar Todas
              </button>
              <button
                onClick={resetToDefault}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                🔄 Por Defecto
              </button>
            </div>
            
            {/* Lista de columnas */}
            <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
              {Object.entries(availableColumns).map(([key, column]) => (
                <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <label className="flex items-center space-x-3 cursor-pointer flex-1">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] || false}
                        onChange={() => !column.fixed && toggleColumn(key)}
                        disabled={column.fixed}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                      />
                      {column.fixed && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${
                        column.fixed ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {column.label}
                      </span>
                      {column.fixed && (
                        <div className="text-xs text-orange-600 mt-0.5">Columna fija - No se puede ocultar</div>
                      )}
                    </div>
                  </label>
                  <div className={`w-3 h-3 rounded-full ${
                    visibleColumns[key] ? 'bg-green-500' : 'bg-red-400'
                  }`} />
                </div>
              ))}
            </div>
            
            {/* Footer con estadísticas */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  <span className="font-medium text-blue-600">
                    {Object.values(visibleColumns).filter(Boolean).length}
                  </span>
                  <span> de </span>
                  <span className="font-medium">{Object.keys(availableColumns).length}</span>
                  <span> columnas visibles</span>
                </div>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen tipo Excel */}
      <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Total proveedores:</span>
            <span className="ml-2 text-gray-900">{sortedProducts.length}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Con sitio web:</span>
            <span className="ml-2 text-blue-600 font-bold">
              {sortedProducts.filter(p => p.PAGINA_WEB && String(p.PAGINA_WEB).trim()).length}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Con contacto:</span>
            <span className="ml-2 text-green-600 font-bold">
              {sortedProducts.filter(p => p.Contacto_Numero && String(p.Contacto_Numero).trim()).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
