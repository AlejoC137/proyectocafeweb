import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
// Se asume que tienes un componente Switch, común en librerías como shadcn/ui
import { Switch } from "@/components/ui/switch";
import { deleteCompra, updateCompra } from "../../../redux/actions-VentasCompras.js";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";

export function TableViewCompras({ products, proveedores, currentType }) {
  const dispatch = useDispatch();
  // El estado `showEdit` ahora controla si TODA la tabla es editable
  const showEdit = useSelector((state) => state.showEdit);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMedioDeCompra, setFilterMedioDeCompra] = useState("");
  const [filterMedioDePago, setFilterMedioDePago] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [sortColumn, setSortColumn] = useState("Date");
  const [sortDirection, setSortDirection] = useState("desc");
  // `editingRows` ahora solo almacena los cambios pendientes
  const [editingRows, setEditingRows] = useState({});

  const availableColumns = {
    Date: { label: "Fecha", key: "Date", default: true },
    Valor: { label: "Valor", key: "Valor", default: true },
    MedioDeCompra: { label: "Medio de Compra", key: "MedioDeCompra", default: true },
    MedioDePago: { label: "Medio de Pago", key: "MedioDePago", default: true },
    Comprador: { label: "Comprador", key: "Comprador", default: true },
    Pagado: { label: "Pagado", key: "Pagado", default: true },
    Categoria: { label: "Categoría", key: "Categoria", default: true },
    Proveedor_Id: { label: "Proveedor", key: "Proveedor_Id", default: true },
    Concepto: { label: "Concepto", key: "Concepto", default: true },
    acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
  };
  
  const proveedoresMap = useMemo(() => {
    if (!proveedores || proveedores.length === 0) return new Map();
    return new Map(proveedores.map(p => [p._id, p.Nombre_Proveedor]));
  }, [proveedores]);

  // Limpia los cambios pendientes si se desactiva el modo de edición global
  useEffect(() => {
    if (!showEdit) {
      setEditingRows({});
    }
  }, [showEdit]);
  
  const uniqueMediosDeCompra = [...new Set(products.map(p => p.MedioDeCompra).filter(Boolean))];
  const uniqueMediosDePago = [...new Set(products.map(p => p.MedioDePago).filter(Boolean))];
  const uniqueCategorias = [...new Set(products.map(p => p.Categoria).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const proveedorName = proveedoresMap.get(product.Proveedor_Id) || "";
    const searchField = `${product.Concepto || ""} ${product.Comprador || ""} ${proveedorName}`;
    const matchesSearch = !searchTerm || 
      (searchField && searchField.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch && 
           (!filterMedioDeCompra || product.MedioDeCompra === filterMedioDeCompra) &&
           (!filterMedioDePago || product.MedioDePago === filterMedioDePago) &&
           (!filterCategoria || product.Categoria === filterCategoria);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];
    
    if (sortColumn === "Proveedor_Id") {
      aValue = proveedoresMap.get(aValue) || '';
      bValue = proveedoresMap.get(bValue) || '';
    } else if (sortColumn === "Pagado") {
      aValue = aValue?.pagadoFull ? 1 : 0;
      bValue = bValue?.pagadoFull ? 1 : 0;
    } else if (sortColumn === "Valor") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortColumn === "Date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else {
        aValue = aValue || "";
        bValue = bValue || "";
    }
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (column) => {
    if (column === 'acciones') return;
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }) => {
    if (column === 'acciones') return null;
    if (sortColumn !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortDirection === "asc" ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleCellEdit = (itemId, field, value) => {
    setEditingRows(prev => {
        const currentItem = products.find(p => p._id === itemId);
        const currentItemEdits = prev[itemId] || {};
        let finalValue = value;

        if (field === 'Pagado') {
            const originalPagadoValue = currentItem?.Pagado;
            let originalPagadoObject = { pagadoFull: false, adelanto: "NoAplica" };

            if (typeof originalPagadoValue === 'string') {
                try {
                    originalPagadoObject = JSON.parse(originalPagadoValue);
                } catch (e) {
                    console.error("No se pudo interpretar el texto de Pagado:", originalPagadoValue);
                }
            } else if (typeof originalPagadoValue === 'object' && originalPagadoValue !== null) {
                originalPagadoObject = originalPagadoValue;
            }
            
            // El `value` del Switch ya es un booleano, simplificando la lógica
            finalValue = {
                ...originalPagadoObject,
                pagadoFull: value 
            };
        }

        return {
            ...prev,
            [itemId]: {
                ...currentItemEdits,
                [field]: finalValue
            }
        };
    });
  };

  const handleSaveRow = async (item) => {
    const editedData = editingRows[item._id] || {};
    if (Object.keys(editedData).length === 0) return;

    try {
      await dispatch(updateCompra(item._id, editedData));
      // Al guardar, elimina los cambios pendientes para esa fila
      setEditingRows(prev => {
        const newState = { ...prev };
        delete newState[item._id];
        return newState;
      });
    } catch (error) {
      console.error("Error al actualizar la compra:", error);
    }
  };

  const handleDeleteRow = async (item) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta compra?")) {
      try {
        await dispatch(deleteCompra(item._id));
      } catch (error) {
        console.error("Error al eliminar la compra:", error);
      }
    }
  };

  const renderEditableCell = (item, field) => {
    // Para el campo "Pagado", renderiza el nuevo componente Switch
    if (field === 'Pagado') {
        const editedValue = editingRows[item._id]?.Pagado;
        const currentValue = editedValue ?? item.Pagado;
        let pagadoFullValue = false;
        
        if (typeof currentValue === 'object' && currentValue !== null) {
          pagadoFullValue = currentValue.pagadoFull;
        } else if (typeof currentValue === 'string') {
          try {
            pagadoFullValue = JSON.parse(currentValue).pagadoFull;
          } catch (e) {}
        }

        return (
          <div className="flex items-center justify-start h-full">
            <Switch
              checked={pagadoFullValue}
              onCheckedChange={(newCheckedState) => {
                handleCellEdit(item._id, field, newCheckedState);
              }}
            />
          </div>
        );
    }
    
    if (field === 'Proveedor_Id') {
      const currentProviderId = editingRows[item._id]?.Proveedor_Id ?? item.Proveedor_Id ?? "";
      return (
        <select
          value={currentProviderId}
          onChange={(e) => handleCellEdit(item._id, field, e.target.value)}
          className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
        >
          <option value="">-- Seleccionar Proveedor --</option>
          {Array.isArray(proveedores) && proveedores.map(prov => (
            <option key={prov._id} value={prov._id}>{prov.Nombre_Proveedor}</option>
          ))}
        </select>
      );
    }

    const type = field === 'Valor' ? 'number' : 'text';
    const currentValue = editingRows[item._id]?.[field] ?? item[field] ?? "";
    return (
      <input
        type={type}
        value={currentValue}
        onChange={(e) => handleCellEdit(item._id, field, e.target.value)}
        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
      />
    );
  };
  
  const renderCellContent = (item, colKey) => {
    const value = item[colKey];
    if (colKey === 'Proveedor_Id') {
      return proveedoresMap.get(value) || 'N/A';
    }
    if (colKey === 'Pagado') {
      let pagadoObj = value;
      if (typeof value === 'string') {
          try {
              pagadoObj = JSON.parse(value);
          } catch(e) {
              return 'Inválido';
          }
      }
      return pagadoObj?.pagadoFull ? 'Sí' : 'No';
    }
    if (colKey === 'Valor') {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);
    }
    if (colKey === 'Date') {
        try {
            return new Date(value).toLocaleDateString('es-CO');
        } catch {
            return value;
        }
    }
    return value;
  }
  
  return (
    <div className="w-full">
      <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
        {/* Los filtros siguen funcionando igual */}
        <div className="flex flex-wrap gap-4 items-center">
            {/* ...código de filtros sin cambios... */}
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              {Object.entries(availableColumns)
               .filter(([, col]) => col.default)
               .map(([key, { label }]) => (
                <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  <button onClick={() => handleSort(key)} className="flex items-center gap-1">
                    {label} <SortIcon column={key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((item) => {
              const hasPendingChanges = editingRows[item._id] && Object.keys(editingRows[item._id]).length > 0;
              return (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  {Object.keys(availableColumns)
                   .filter(key => availableColumns[key].default)
                   .map(colKey => (
                    <td key={colKey} className="px-3 py-2 text-xs">
                      {colKey === "acciones" ? (
                        <div className="flex gap-1 items-center">
                          {/* Muestra Guardar/Cancelar solo si hay cambios en esa fila y el modo edición está activo */}
                          {showEdit && hasPendingChanges && (
                            <>
                              <Button onClick={() => handleSaveRow(item)} size="sm" className="bg-green-500 hover:bg-green-600">Guardar</Button>
                               <Button onClick={() => {
                                   const { [item._id]: _, ...rest } = editingRows;
                                   setEditingRows(rest);
                                }} variant="ghost" size="sm">Cancelar</Button>
                            </>
                          )}
                          {/* El botón de eliminar siempre es visible en modo edición */}
                          {showEdit && <Button onClick={() => handleDeleteRow(item)} variant="destructive" size="sm">Eliminar</Button>}
                        </div>
                      ) : (
                        // Lógica principal: si `showEdit` es true, muestra la celda editable
                        showEdit ? renderEditableCell(item, colKey) : renderCellContent(item, colKey)
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}