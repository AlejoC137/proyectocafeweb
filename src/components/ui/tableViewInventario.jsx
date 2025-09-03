import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem } from "../../redux/actions-Proveedores";
import { ESTATUS, BODEGA, CATEGORIES, ItemsAlmacen, ProduccionInterna, MenuItems, unidades } from "../../redux/actions-types";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";
import { parseCompLunch } from "../../utils/jsonUtils";

export function TableViewInventario({ products, currentType }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const Proveedores = useSelector((state) => state.Proveedores || []);
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterAlmacenamiento, setFilterAlmacenamiento] = useState("");
  const [filterProveedor, setFilterProveedor] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editingRows, setEditingRows] = useState({});

  // Obtener valores únicos para filtros
  const uniqueCategories = [...new Set(products.map(p => p.GRUPO).filter(Boolean))];
  const uniqueEstados = [...new Set(products.map(p => p.Estado).filter(Boolean))];
  const uniqueAlmacenamiento = [...new Set(products.map(p => {
    try {
      const almacen = typeof p.ALMACENAMIENTO === "string" ? JSON.parse(p.ALMACENAMIENTO) : p.ALMACENAMIENTO;
      return almacen?.ALMACENAMIENTO;
    } catch {
      return null;
    }
  }).filter(Boolean))];

  // Función para parsear objetos anidados de forma segura
  const parseNestedObject = (obj, fallback = {}) => {
    try {
      if (typeof obj === "string") {
        if (obj === "NaN" || obj === "null" || obj === "undefined" || !obj) {
          return fallback;
        }
        if (!obj.startsWith("{") && !obj.startsWith("[")) {
          return { ...fallback, valor: obj };
        }
        return JSON.parse(obj);
      }
      return obj || fallback;
    } catch (e) {
      console.warn("Invalid nested object JSON:", obj, e);
      return fallback;
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    let searchField = "";
    let categoryField = "";
    
    if (currentType === MenuItems) {
      searchField = `${product.NombreES || ""} ${product.NombreEN || ""} ${product.DescripcionMenuES || ""}`;
      categoryField = product.GRUPO;
    } else {
      searchField = product.Nombre_del_producto || "";
      categoryField = product.GRUPO;
    }
    
    const matchesSearch = !searchTerm || 
      searchField.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || categoryField === filterCategory;
    const matchesEstado = !filterEstado || product.Estado === filterEstado;
    
    let matchesAlmacenamiento = true;
    if (filterAlmacenamiento && currentType !== MenuItems) {
      try {
        const almacen = parseNestedObject(product.ALMACENAMIENTO);
        matchesAlmacenamiento = almacen?.ALMACENAMIENTO === filterAlmacenamiento;
      } catch {
        matchesAlmacenamiento = false;
      }
    }
    
    let matchesProveedor = true;
    if (filterProveedor && currentType === ItemsAlmacen) {
      matchesProveedor = product.Proveedor === filterProveedor;
    }
    
    return matchesSearch && matchesCategory && matchesEstado && matchesAlmacenamiento && matchesProveedor;
  });

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue = a[sortColumn] || "";
    let bValue = b[sortColumn] || "";
    
    // Manejar casos especiales para números y fechas
    if (sortColumn === "COSTO" || sortColumn === "precioUnitario" || sortColumn === "Merma" || sortColumn === "CANTIDAD") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortColumn === "FECHA_ACT") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortColumn === "STOCK") {
      // Para STOCK, ordenar por stock actual
      try {
        const stockA = parseNestedObject(a.STOCK);
        const stockB = parseNestedObject(b.STOCK);
        aValue = parseFloat(stockA?.actual) || 0;
        bValue = parseFloat(stockB?.actual) || 0;
      } catch {
        aValue = 0;
        bValue = 0;
      }
    } else if (sortColumn === "Proveedor") {
      // Para Proveedor, ordenar por nombre del proveedor
      const proveedorA = Proveedores.find(p => p._id === a.Proveedor);
      const proveedorB = Proveedores.find(p => p._id === b.Proveedor);
      aValue = proveedorA?.Nombre_Proveedor || "";
      bValue = proveedorB?.Nombre_Proveedor || "";
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
    if (sortColumn !== column) return <ChevronDown className="w-4 h-4 bg-opacity-50" />;
    return sortDirection === "asc" ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Función para manejar edición inline
  const handleCellEdit = (itemId, field, value, subField = null) => {
    setEditingRows(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: subField ? {
          ...(prev[itemId]?.[field] || parseNestedObject(products.find(p => p._id === itemId)?.[field])),
          [subField]: value
        } : value
      }
    }));
  };

  // Función para guardar cambios
  const handleSaveRow = async (item) => {
    const editedData = editingRows[item._id] || {};
    
    try {
      const updatedFields = { ...editedData };
      
      // Manejar objetos anidados
      if (editedData.STOCK) {
        updatedFields.STOCK = JSON.stringify(editedData.STOCK);
      }
      if (editedData.ALMACENAMIENTO) {
        updatedFields.ALMACENAMIENTO = JSON.stringify(editedData.ALMACENAMIENTO);
      }
      
      // Agregar fecha de actualización
      updatedFields.FECHA_ACT = new Date().toISOString().split("T")[0];
      
      await dispatch(updateItem(item._id, updatedFields, currentType));
      
      // Limpiar datos de edición para esta fila
      setEditingRows(prev => {
        const newState = { ...prev };
        delete newState[item._id];
        return newState;
      });
      
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
      try {
        await dispatch(deleteItem(item._id, currentType));
        alert("Ítem eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ítem:", error);
        alert("Hubo un error al eliminar el ítem.");
      }
    }
  };

  // Función para renderizar celdas editables
  const renderEditableCell = (item, field, type = "text", options = null, subField = null) => {
    let currentValue;
    
    if (subField) {
      const nestedObj = editingRows[item._id]?.[field] || parseNestedObject(item[field]);
      currentValue = nestedObj?.[subField] || "";
    } else {
      currentValue = editingRows[item._id]?.[field] !== undefined ? 
        editingRows[item._id][field] : (item[field] || "");
    }

    if (type === "select") {
      return (
        <select
          value={currentValue}
          onChange={(e) => handleCellEdit(item._id, field, e.target.value, subField)}
          className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900"
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        value={currentValue}
        onChange={(e) => handleCellEdit(item._id, field, e.target.value, subField)}
        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900"
        step={type === "number" ? "0.01" : undefined}
      />
    );
  };

  // Función para renderizar headers de la tabla
  const renderTableHeaders = () => {
    if (currentType === MenuItems) {
      return (
        <>
          <th className="px-3  py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("NombreES")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 border-gray-200 hover:text-blue-600">
              Nombre ES <SortIcon column="NombreES" />
            </button>
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("NombreEN")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Nombre EN <SortIcon column="NombreEN" />
            </button>
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Precio")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Precio <SortIcon column="Precio" />
            </button>
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("GRUPO")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Grupo <SortIcon column="GRUPO" />
            </button>
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("TipoES")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Tipo <SortIcon column="TipoES" />
            </button>
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Estado")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Estado <SortIcon column="Estado" />
            </button>
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            Comp. Almuerzo
          </th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
        </>
      );
    }

    // Headers para inventario (ItemsAlmacen y ProduccionInterna)
    return (
      <>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Nombre_del_producto")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Nombre <SortIcon column="Nombre_del_producto" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("CANTIDAD")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 border-gray-200 hover:text-blue-600">
            Cantidad <SortIcon column="CANTIDAD" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("UNIDADES")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Unidades <SortIcon column="UNIDADES" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("COSTO")} className=" bg-slate-100 text-gray-950 flex items-center gap-1  hover:text-blue-600">
            Costo <SortIcon column="COSTO" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold  border-r border-gray-200">
          <button onClick={() => handleSort("precioUnitario")} className="flex bg-slate-100 text-gray-950 items-center gap-1  hover:text-blue-600">
            Precio Unit. <SortIcon column="precioUnitario" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          Stock
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          Almacenamiento
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("GRUPO")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Grupo <SortIcon column="GRUPO" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Merma")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Merma % <SortIcon column="Merma" />
          </button>
        </th>
        {currentType === ItemsAlmacen && (
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Proveedor")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Proveedor <SortIcon column="Proveedor" />
            </button>
          </th>
        )}
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Estado")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Estado <SortIcon column="Estado" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("FECHA_ACT")} className=" bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Última Act. <SortIcon column="FECHA_ACT" />
          </button>
        </th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
      </>
    );
  };

  // Función para renderizar filas de la tabla
  const renderTableRows = () => {
    return sortedProducts.map((item, index) => {
      const isEditing = editingRows[item._id];
      
      if (currentType === MenuItems) {
        // Renderizar filas para MenuItems
        const lunchData = parseCompLunch(item.Comp_Lunch);
        
        return (
          <tr 
            key={item._id} 
            className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
          >
            {/* Nombre ES */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "NombreES") : 
                <span className="font-medium text-blue-800">{item.NombreES || "Sin nombre"}</span>
              }
            </td>

            {/* Nombre EN */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "NombreEN") : 
                <span className="text-gray-600">{item.NombreEN || "Sin nombre EN"}</span>
              }
            </td>

            {/* Precio */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "Precio", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>
              }
            </td>

            {/* Grupo */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "GRUPO") :
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>
              }
            </td>

            {/* Tipo */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "TipoES") : 
                <span className="text-gray-600">{item.TipoES || "Sin tipo"}</span>
              }
            </td>

            {/* Estado */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            </td>

            {/* Comp. Almuerzo */}
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {lunchData ? (
                  <>
                    <div className="font-medium text-purple-700 mb-1">{lunchData.fecha?.dia || "Sin fecha"}</div>
                    <div className="space-y-0.5 text-xs">
                      <div className="text-orange-700">🥗 {lunchData.entrada?.nombre || "N/A"}</div>
                      <div className="text-red-700">🥩 {lunchData.proteina?.nombre || "N/A"}</div>
                      <div className="text-yellow-700">🍚 {lunchData.carbohidrato?.nombre || "N/A"}</div>
                      {lunchData.lista && (
                        <div className="text-indigo-700 font-medium">
                          📝 {lunchData.lista.length} pedidos
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Sin composición</span>
                )}
              </div>
            </td>

            {/* Acciones */}
            <td className="px-3 py-2 text-xs">
              <div className="flex gap-1">
                {isEditing && (
                  <Button
                    onClick={() => handleSaveRow(item)}
                    className="bg-gray-100 hover:bg-green-600 text-green-800 px-2 py-1 text-xs h-6 border border-green-300"
                  >
                    💾
                  </Button>
                )}
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
          </tr>
        );
      }

      // Renderizar filas para inventario (ItemsAlmacen y ProduccionInterna)
      const stockData = parseNestedObject(item.STOCK, { minimo: "", maximo: "", actual: "" });
      const almacenamientoData = parseNestedObject(item.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });
      
      // Obtener nombre del proveedor
      const proveedor = currentType === ItemsAlmacen ? 
        Proveedores.find(p => p._id === item.Proveedor) : null;

      return (
        <tr 
          key={item._id} 
          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
        >
          {/* Nombre del producto */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Nombre_del_producto") : 
              <span className="font-medium text-blue-800">{item.Nombre_del_producto || "Sin nombre"}</span>
            }
          </td>

          {/* Cantidad */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "CANTIDAD", "number") : 
              <span className="font-mono">{item.CANTIDAD || "0"}</span>
            }
          </td>

          {/* Unidades */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "UNIDADES", "select", unidades) : 
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{item.UNIDADES || "N/A"}</span>
            }
          </td>

          {/* Costo */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "COSTO", "number") : 
              <span className="font-mono font-bold text-green-600">${parseFloat(item.COSTO || 0).toFixed(2)}</span>
            }
          </td>

          {/* Precio Unitario */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "precioUnitario", "number") : 
              <span className="font-mono font-bold text-purple-600">${parseFloat(item.precioUnitario || 0).toFixed(2)}</span>
            }
          </td>

          {/* Stock */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-8">Min:</span>
                {showEdit ? 
                  renderEditableCell(item, "STOCK", "number", null, "minimo") :
                  <span className="text-xs text-red-600">{stockData?.minimo || "0"}</span>
                }
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-8">Max:</span>
                {showEdit ? 
                  renderEditableCell(item, "STOCK", "number", null, "maximo") :
                  <span className="text-xs text-blue-600">{stockData?.maximo || "0"}</span>
                }
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-8">Act:</span>
                {showEdit ? 
                  renderEditableCell(item, "STOCK", "number", null, "actual") :
                  <span className="text-xs font-bold text-green-600">{stockData?.actual || "0"}</span>
                }
              </div>
            </div>
          </td>

          {/* Almacenamiento */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            <div className="space-y-1">
              <div>
                <span className="text-xs text-gray-500">Alm:</span>
                {showEdit ? 
                  renderEditableCell(item, "ALMACENAMIENTO", "select", BODEGA, "ALMACENAMIENTO") :
                  <div className="text-xs text-purple-700">{almacenamientoData?.ALMACENAMIENTO || "N/A"}</div>
                }
              </div>
              <div>
                <span className="text-xs text-gray-500">Bod:</span>
                {showEdit ? 
                  renderEditableCell(item, "ALMACENAMIENTO", "select", BODEGA, "BODEGA") :
                  <div className="text-xs text-orange-700">{almacenamientoData?.BODEGA || "N/A"}</div>
                }
              </div>
            </div>
          </td>

          {/* Grupo */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "GRUPO", "select", CATEGORIES) :
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>
            }
          </td>

          {/* Merma */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Merma", "number") : 
              <span className="font-mono text-yellow-600">{parseFloat(item.Merma || 0).toFixed(2)}%</span>
            }
          </td>

          {/* Proveedor (solo para ItemsAlmacen) */}
          {currentType === ItemsAlmacen && (
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                <select
                  value={editingRows[item._id]?.Proveedor || item.Proveedor || ""}
                  onChange={(e) => handleCellEdit(item._id, "Proveedor", e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                >
                  <option value="">Sin proveedor</option>
                  {Proveedores.map((prov) => (
                    <option key={prov._id} value={prov._id}>
                      {prov.Nombre_Proveedor}
                    </option>
                  ))}
                </select> :
                <span className="text-xs text-gray-700">{proveedor?.Nombre_Proveedor || "Sin proveedor"}</span>
              }
            </td>
          )}

          {/* Estado */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Estado", "select", ESTATUS.filter(status => {
                if (currentType === ProduccionInterna && status === "PC") return false;
                if (currentType === ItemsAlmacen && status === "PP") return false;
                return true;
              })) :
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" || item.Estado === "PP" || item.Estado === "PC"
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            }
          </td>

          {/* Fecha actualización */}
          <td className="px-3 py-2 border-r border-gray-100 text-xs">
            <span className="text-gray-600">{item.FECHA_ACT || "N/A"}</span>
          </td>

          {/* Acciones */}
          <td className="px-3 py-2 text-xs">
            <div className="flex gap-1">
              {isEditing && (
                <Button
                  onClick={() => handleSaveRow(item)}
                  className="bg-gray-100 hover:bg-green-600 text-green-800 px-2 py-1 text-xs h-6 border border-green-300"
                >
                  💾
                </Button>
              )}
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
        </tr>
      );
    });
  };

  return (
    <div className="w-full">
      {/* Panel de filtros tipo Excel */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
            >
              <option value="">Todos los grupos</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-green-500" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="border border-green-300 rounded px-3 py-1 text-sm bg-gray-100 text-gray-900"
            >
              <option value="">Todos los estados</option>
              {uniqueEstados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-500" />
            <select
              value={filterAlmacenamiento}
              onChange={(e) => setFilterAlmacenamiento(e.target.value)}
              className="border border-purple-300 rounded px-3 py-1 text-sm bg-gray-100 text-gray-900"
            >
              <option value="">Todos los almacenamientos</option>
              {uniqueAlmacenamiento.map(almacen => (
                <option key={almacen} value={almacen}>{almacen}</option>
              ))}
            </select>
          </div>

          {/* Filtro por proveedor - solo para ItemsAlmacen */}
          {currentType === ItemsAlmacen && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-500" />
              <select
                value={filterProveedor}
                onChange={(e) => setFilterProveedor(e.target.value)}
                className="border border-orange-300 rounded px-3 py-1 text-sm bg-gray-100 text-gray-900"
              >
                <option value="">Todos los proveedores</option>
                {Proveedores.map(proveedor => (
                  <option key={proveedor._id} value={proveedor._id}>{proveedor.Nombre_Proveedor}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Mostrando {sortedProducts.length} de {products.length} productos
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

      {/* Resumen tipo Excel */}
      <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Total productos:</span>
            <span className="ml-2 text-gray-900">{sortedProducts.length}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Grupos únicos:</span>
            <span className="ml-2 text-gray-900">{uniqueCategories.length}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Valor total:</span>
            <span className="ml-2 text-green-600 font-bold">
              ${sortedProducts.reduce((sum, p) => {
                const costo = parseFloat(p.COSTO || 0);
                const cantidad = parseFloat(p.CANTIDAD || 0);
                return sum + (costo * cantidad);
              }, 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Productos activos:</span>
            <span className="ml-2 text-green-600 font-bold">
              {sortedProducts.filter(p => p.Estado === "PC" || p.Estado === "PP" || p.Estado === "Activo").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
