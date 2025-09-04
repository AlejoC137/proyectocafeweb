import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem, getRecepie } from "../../redux/actions-Proveedores";
import { ESTATUS, BODEGA, CATEGORIES, SUB_CATEGORIES, ItemsAlmacen, ProduccionInterna, MenuItems, unidades } from "../../redux/actions-types";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";
import { parseCompLunch } from "../../utils/jsonUtils";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";

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
  const [openRecipeRows, setOpenRecipeRows] = useState({});
  const [recetas, setRecetas] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});

  // Definir todas las columnas disponibles según el tipo
  const getAvailableColumns = () => {
    switch(currentType) {
      case MenuItems:
        return {
          nombreES: { label: "Nombre ES", key: "NombreES", default: true },
          nombreEN: { label: "Nombre EN", key: "NombreEN", default: true },
          precio: { label: "Precio", key: "Precio", default: true },
          descripcionES: { label: "Descripción ES", key: "DescripcionMenuES", default: false },
          descripcionEN: { label: "Descripción EN", key: "DescripcionMenuEN", default: false },
          tipoES: { label: "Tipo ES", key: "TipoES", default: true },
          tipoEN: { label: "Tipo EN", key: "TipoEN", default: false },
          subTipoES: { label: "SubTipo ES", key: "SubTipoES", default: false },
          subTipoEN: { label: "SubTipo EN", key: "SubTipoEN", default: false },
          dietaES: { label: "Dieta ES", key: "DietaES", default: false },
          dietaEN: { label: "Dieta EN", key: "DietaEN", default: false },
          cuidadoES: { label: "Cuidado ES", key: "CuidadoES", default: false },
          cuidadoEN: { label: "Cuidado EN", key: "CuidadoEN", default: false },
          grupo: { label: "Grupo", key: "GRUPO", default: true },
          subGrupo: { label: "Sub Grupo", key: "SUB_GRUPO", default: false },
          order: { label: "Order", key: "Order", default: false },
          print: { label: "Print", key: "PRINT", default: true },
          estado: { label: "Estado", key: "Estado", default: true },
          foto: { label: "Foto", key: "Foto", default: false },
          composicionAlmuerzo: { label: "Comp. Almuerzo", key: "Comp_Lunch", default: true },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      
      case ItemsAlmacen:
        return {
          nombre: { label: "Nombre", key: "Nombre_del_producto", default: true },
          cantidad: { label: "Cantidad", key: "CANTIDAD", default: true },
          unidades: { label: "Unidades", key: "UNIDADES", default: true },
          costo: { label: "Costo", key: "COSTO", default: true },
          precioUnitario: { label: "Precio Unit.", key: "precioUnitario", default: true },
          stock: { label: "Stock", key: "STOCK", default: true },
          almacenamiento: { label: "Almacenamiento", key: "ALMACENAMIENTO", default: false },
          grupo: { label: "Grupo", key: "GRUPO", default: true },
          merma: { label: "Merma %", key: "Merma", default: false },
          proveedor: { label: "Proveedor", key: "Proveedor", default: true },
          estado: { label: "Estado", key: "Estado", default: true },
          fechaActualizacion: { label: "Última Act.", key: "FECHA_ACT", default: false },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      
      case ProduccionInterna:
        return {
          nombre: { label: "Nombre", key: "Nombre_del_producto", default: true },
          cantidad: { label: "Cantidad", key: "CANTIDAD", default: true },
          unidades: { label: "Unidades", key: "UNIDADES", default: true },
          costo: { label: "Costo", key: "COSTO", default: true },
          precioUnitario: { label: "Precio Unit.", key: "precioUnitario", default: true },
          stock: { label: "Stock", key: "STOCK", default: true },
          almacenamiento: { label: "Almacenamiento", key: "ALMACENAMIENTO", default: false },
          grupo: { label: "Grupo", key: "GRUPO", default: true },
          merma: { label: "Merma %", key: "Merma", default: false },
          estado: { label: "Estado", key: "Estado", default: true },
          fechaActualizacion: { label: "Última Act.", key: "FECHA_ACT", default: false },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      
      default:
        return {};
    }
  };

  const availableColumns = useMemo(() => getAvailableColumns(), [currentType]);

  // Inicializar columnas visibles al cambiar el tipo
  useEffect(() => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => {
      defaultVisibleColumns[key] = column.default;
    });
    console.log('Initializing visible columns (Inventario):', defaultVisibleColumns);
    setVisibleColumns(defaultVisibleColumns);
  }, [availableColumns]);

  // Debug log para ver el estado actual
  console.log('Current visibleColumns state (Inventario):', visibleColumns);
  console.log('Available columns (Inventario):', availableColumns);

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

  // Función para manejar las filas de recetas expandibles
  const handleRecipeToggle = async (productId, recetaId = null) => {
    setOpenRecipeRows(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    if (recetaId && !recetas[productId] && !openRecipeRows[productId]) {
      try {
        const recetaType = currentType === MenuItems ? "Recetas" : "RecetasProduccion";
        const receta = await getRecepie(recetaId, recetaType);
        setRecetas(prev => ({
          ...prev,
          [productId]: receta
        }));
      } catch (error) {
        console.error("Error al cargar receta:", error);
      }
    }
  };

  // Función para crear recetas (similar a las tarjetas)
  const handleCreateReceta = async (recetaData, productId) => {
    try {
      const actionType = currentType === MenuItems ? "Menu" : currentType;
      await dispatch(updateItem(productId, { Receta: recetaData._id }, actionType));
      setRecetas(prev => ({
        ...prev,
        [productId]: recetaData
      }));
      alert("Receta creada correctamente.");
    } catch (error) {
      console.error("Error al crear la receta:", error);
      alert("Hubo un error al crear la receta.");
    }
  };

  // Función para guardar recetas (para MenuItems)
  const handleSaveReceta = async (recetaData) => {
    try {
      // Esta función se usa principalmente para MenuItems
      alert("Receta guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      alert("Hubo un error al guardar la receta.");
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
      const menuHeaders = [
        { key: 'nombreES', content: (
          <th key="nombreES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("NombreES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Nombre ES <SortIcon column="NombreES" />
            </button>
          </th>
        )},
        { key: 'nombreEN', content: (
          <th key="nombreEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("NombreEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Nombre EN <SortIcon column="NombreEN" />
            </button>
          </th>
        )},
        { key: 'precio', content: (
          <th key="precio" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Precio")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Precio <SortIcon column="Precio" />
            </button>
          </th>
        )},
        { key: 'descripcionES', content: (
          <th key="descripcionES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("DescripcionMenuES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Descripción ES <SortIcon column="DescripcionMenuES" />
            </button>
          </th>
        )},
        { key: 'descripcionEN', content: (
          <th key="descripcionEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("DescripcionMenuEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Descripción EN <SortIcon column="DescripcionMenuEN" />
            </button>
          </th>
        )},
        { key: 'tipoES', content: (
          <th key="tipoES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("TipoES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Tipo ES <SortIcon column="TipoES" />
            </button>
          </th>
        )},
        { key: 'tipoEN', content: (
          <th key="tipoEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("TipoEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Tipo EN <SortIcon column="TipoEN" />
            </button>
          </th>
        )},
        { key: 'subTipoES', content: (
          <th key="subTipoES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("SubTipoES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              SubTipo ES <SortIcon column="SubTipoES" />
            </button>
          </th>
        )},
        { key: 'subTipoEN', content: (
          <th key="subTipoEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("SubTipoEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              SubTipo EN <SortIcon column="SubTipoEN" />
            </button>
          </th>
        )},
        { key: 'dietaES', content: (
          <th key="dietaES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("DietaES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Dieta ES <SortIcon column="DietaES" />
            </button>
          </th>
        )},
        { key: 'dietaEN', content: (
          <th key="dietaEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("DietaEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Dieta EN <SortIcon column="DietaEN" />
            </button>
          </th>
        )},
        { key: 'cuidadoES', content: (
          <th key="cuidadoES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("CuidadoES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Cuidado ES <SortIcon column="CuidadoES" />
            </button>
          </th>
        )},
        { key: 'cuidadoEN', content: (
          <th key="cuidadoEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("CuidadoEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Cuidado EN <SortIcon column="CuidadoEN" />
            </button>
          </th>
        )},
        { key: 'grupo', content: (
          <th key="grupo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("GRUPO")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Grupo <SortIcon column="GRUPO" />
            </button>
          </th>
        )},
        { key: 'subGrupo', content: (
          <th key="subGrupo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("SUB_GRUPO")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Sub Grupo <SortIcon column="SUB_GRUPO" />
            </button>
          </th>
        )},
        { key: 'order', content: (
          <th key="order" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Order")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Order <SortIcon column="Order" />
            </button>
          </th>
        )},
        { key: 'print', content: (
          <th key="print" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("PRINT")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Print <SortIcon column="PRINT" />
            </button>
          </th>
        )},
        { key: 'estado', content: (
          <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Estado <SortIcon column="Estado" />
            </button>
          </th>
        )},
        { key: 'foto', content: (
          <th key="foto" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            Foto
          </th>
        )},
        { key: 'composicionAlmuerzo', content: (
          <th key="composicionAlmuerzo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            Comp. Almuerzo
          </th>
        )},
        { key: 'acciones', content: (
          <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
        )}
      ];
      
      return menuHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
    }

    // Headers para inventario (ItemsAlmacen y ProduccionInterna)
    const inventoryHeaders = [
      { key: 'nombre', content: (
        <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Nombre_del_producto")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Nombre <SortIcon column="Nombre_del_producto" />
          </button>
        </th>
      )},
      { key: 'cantidad', content: (
        <th key="cantidad" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("CANTIDAD")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Cantidad <SortIcon column="CANTIDAD" />
          </button>
        </th>
      )},
      { key: 'unidades', content: (
        <th key="unidades" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("UNIDADES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Unidades <SortIcon column="UNIDADES" />
          </button>
        </th>
      )},
      { key: 'costo', content: (
        <th key="costo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("COSTO")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Costo <SortIcon column="COSTO" />
          </button>
        </th>
      )},
      { key: 'precioUnitario', content: (
        <th key="precioUnitario" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("precioUnitario")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Precio Unit. <SortIcon column="precioUnitario" />
          </button>
        </th>
      )},
      { key: 'stock', content: (
        <th key="stock" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("STOCK")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Stock <SortIcon column="STOCK" />
          </button>
        </th>
      )},
      { key: 'almacenamiento', content: (
        <th key="almacenamiento" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          Almacenamiento
        </th>
      )},
      { key: 'grupo', content: (
        <th key="grupo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("GRUPO")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Grupo <SortIcon column="GRUPO" />
          </button>
        </th>
      )},
      { key: 'merma', content: (
        <th key="merma" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Merma")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Merma % <SortIcon column="Merma" />
          </button>
        </th>
      )}
    ];
    
    // Agregar proveedor solo para ItemsAlmacen
    if (currentType === ItemsAlmacen) {
      inventoryHeaders.push({
        key: 'proveedor', content: (
          <th key="proveedor" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
            <button onClick={() => handleSort("Proveedor")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
              Proveedor <SortIcon column="Proveedor" />
            </button>
          </th>
        )
      });
    }
    
    // Agregar estado y fecha actualización
    inventoryHeaders.push(
      { key: 'estado', content: (
        <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Estado <SortIcon column="Estado" />
          </button>
        </th>
      )},
      { key: 'fechaActualizacion', content: (
        <th key="fechaActualizacion" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
          <button onClick={() => handleSort("FECHA_ACT")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
            Última Act. <SortIcon column="FECHA_ACT" />
          </button>
        </th>
      )},
      { key: 'acciones', content: (
        <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
      )}
    );
    
    return inventoryHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
  };

  // Función para renderizar filas de la tabla
  const renderTableRows = () => {
    const rows = [];
    
    sortedProducts.forEach((item, index) => {
      const isEditing = editingRows[item._id];
      const isRecipeOpen = openRecipeRows[item._id];
      
      if (currentType === MenuItems) {
        // Renderizar filas para MenuItems
        const lunchData = parseCompLunch(item.Comp_Lunch);
        
        const menuCells = [
          { key: 'nombreES', content: (
            <td key="nombreES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "NombreES") : 
                <span className="font-medium text-blue-800">{item.NombreES || "Sin nombre"}</span>
              }
            </td>
          )},
          { key: 'nombreEN', content: (
            <td key="nombreEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "NombreEN") : 
                <span className="text-gray-600">{item.NombreEN || "Sin nombre EN"}</span>
              }
            </td>
          )},
          { key: 'precio', content: (
            <td key="precio" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "Precio", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>
              }
            </td>
          )},
          { key: 'descripcionES', content: (
            <td key="descripcionES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "DescripcionMenuES") : 
                <div className="text-gray-600 max-w-xs truncate" title={item.DescripcionMenuES}>
                  {item.DescripcionMenuES || "Sin descripción"}
                </div>
              }
            </td>
          )},
          { key: 'descripcionEN', content: (
            <td key="descripcionEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "DescripcionMenuEN") : 
                <div className="text-gray-600 max-w-xs truncate" title={item.DescripcionMenuEN}>
                  {item.DescripcionMenuEN || "Sin descripción EN"}
                </div>
              }
            </td>
          )},
          { key: 'tipoES', content: (
            <td key="tipoES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "TipoES") : 
                <span className="text-gray-600">{item.TipoES || "Sin tipo ES"}</span>
              }
            </td>
          )},
          { key: 'tipoEN', content: (
            <td key="tipoEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "TipoEN") : 
                <span className="text-gray-600">{item.TipoEN || "Sin tipo EN"}</span>
              }
            </td>
          )},
          { key: 'subTipoES', content: (
            <td key="subTipoES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "SubTipoES") : 
                <span className="text-gray-600">{item.SubTipoES || "Sin subtipo ES"}</span>
              }
            </td>
          )},
          { key: 'subTipoEN', content: (
            <td key="subTipoEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "SubTipoEN") : 
                <span className="text-gray-600">{item.SubTipoEN || "Sin subtipo EN"}</span>
              }
            </td>
          )},
          { key: 'dietaES', content: (
            <td key="dietaES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "DietaES") : 
                <span className="text-green-600">{item.DietaES || "Sin dieta ES"}</span>
              }
            </td>
          )},
          { key: 'dietaEN', content: (
            <td key="dietaEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "DietaEN") : 
                <span className="text-green-600">{item.DietaEN || "Sin dieta EN"}</span>
              }
            </td>
          )},
          { key: 'cuidadoES', content: (
            <td key="cuidadoES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "CuidadoES") : 
                <span className="text-orange-600">{item.CuidadoES || "Sin cuidado ES"}</span>
              }
            </td>
          )},
          { key: 'cuidadoEN', content: (
            <td key="cuidadoEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "CuidadoEN") : 
                <span className="text-orange-600">{item.CuidadoEN || "Sin cuidado EN"}</span>
              }
            </td>
          )},
          { key: 'grupo', content: (
            <td key="grupo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "GRUPO", "select", CATEGORIES) :
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>
              }
            </td>
          )},
          { key: 'subGrupo', content: (
            <td key="subGrupo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "SUB_GRUPO", "select", SUB_CATEGORIES) : 
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.SUB_GRUPO || "Sin subgrupo"}</span>
              }
            </td>
          )},
          { key: 'order', content: (
            <td key="order" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? 
                renderEditableCell(item, "Order", "number") : 
                <span className="font-mono text-gray-700">{item.Order || "0"}</span>
              }
            </td>
          )},
          { key: 'print', content: (
            <td key="print" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? (
                <button
                  onClick={() => {
                    const newValue = !item.PRINT;
                    handleCellEdit(item._id, "PRINT", newValue);
                    handleSaveRow(item); // Auto-guardar al cambiar
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                    item.PRINT === true 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {item.PRINT === true ? "✓ SÍ" : "✗ NO"}
                </button>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.PRINT === true 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {item.PRINT === true ? "SÍ" : "NO"}
                </span>
              )}
            </td>
          )},
          { key: 'estado', content: (
            <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? (
                <select
                  value={editingRows[item._id]?.Estado || item.Estado || ""}
                  onChange={(e) => {
                    handleCellEdit(item._id, "Estado", e.target.value);
                    handleSaveRow(item); // Auto-guardar al cambiar
                  }}
                  className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-2 focus:ring-blue-500 ${
                    (editingRows[item._id]?.Estado || item.Estado) === "Activo" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.Estado === "Activo" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {item.Estado || "Sin estado"}
                </span>
              )}
            </td>
          )},
          { key: 'foto', content: (
            <td key="foto" className="px-3 py-2 border-r border-gray-100 text-xs">
              {item.Foto ? (
                <a href={item.Foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                  🖼️ Ver
                </a>
              ) : (
                <span className="text-gray-400">Sin foto</span>
              )}
            </td>
          )},
          { key: 'composicionAlmuerzo', content: (
            <td key="composicionAlmuerzo" className="px-3 py-2 border-r border-gray-100 text-xs">
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
          )},
          { key: 'acciones', content: (
            <td key="acciones" className="px-3 py-2 text-xs">
              <div className="flex gap-1">
                <Button
                  onClick={() => handleRecipeToggle(item._id, item.Receta)}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6 border border-yellow-300"
                >
                  {openRecipeRows[item._id] ? '📖' : '📕'}
                </Button>
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
          )}
        ];
        
        rows.push(
          <tr 
            key={item._id} 
            className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
          >
            {menuCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content)}
          </tr>
        );
        
        // Agregar fila de receta si está abierta
        if (isRecipeOpen) {
          const visibleColumnsCount = Object.values(visibleColumns).filter(Boolean).length;
          rows.push(
            <tr key={`${item._id}-recipe`} className="bg-yellow-50">
              <td colSpan={visibleColumnsCount} className="px-3 py-4 border-b border-gray-200">
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <RecepieOptionsMenu 
                    product={item} 
                    Receta={recetas[item._id]} 
                    currentType={currentType}
                    onSaveReceta={handleSaveReceta}
                    onCreateReceta={handleCreateReceta}
                  />
                </div>
              </td>
            </tr>
          );
        }
        
        return;
      }

      // Renderizar filas para inventario (ItemsAlmacen y ProduccionInterna)
      const stockData = parseNestedObject(item.STOCK, { minimo: "", maximo: "", actual: "" });
      const almacenamientoData = parseNestedObject(item.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });
      
      // Obtener nombre del proveedor
      const proveedor = currentType === ItemsAlmacen ? 
        Proveedores.find(p => p._id === item.Proveedor) : null;

      const inventoryCells = [
        { key: 'nombre', content: (
          <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Nombre_del_producto") : 
              <span className="font-medium text-blue-800">{item.Nombre_del_producto || "Sin nombre"}</span>
            }
          </td>
        )},
        { key: 'cantidad', content: (
          <td key="cantidad" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "CANTIDAD", "number") : 
              <span className="font-mono">{item.CANTIDAD || "0"}</span>
            }
          </td>
        )},
        { key: 'unidades', content: (
          <td key="unidades" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "UNIDADES", "select", unidades) : 
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{item.UNIDADES || "N/A"}</span>
            }
          </td>
        )},
        { key: 'costo', content: (
          <td key="costo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "COSTO", "number") : 
              <span className="font-mono font-bold text-green-600">${parseFloat(item.COSTO || 0).toFixed(2)}</span>
            }
          </td>
        )},
        { key: 'precioUnitario', content: (
          <td key="precioUnitario" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "precioUnitario", "number") : 
              <span className="font-mono font-bold text-purple-600">${parseFloat(item.precioUnitario || 0).toFixed(2)}</span>
            }
          </td>
        )},
        { key: 'stock', content: (
          <td key="stock" className="px-3 py-2 border-r border-gray-100 text-xs">
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
        )},
        { key: 'almacenamiento', content: (
          <td key="almacenamiento" className="px-3 py-2 border-r border-gray-100 text-xs">
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
        )},
        { key: 'grupo', content: (
          <td key="grupo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "GRUPO", "select", CATEGORIES) :
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>
            }
          </td>
        )},
        { key: 'merma', content: (
          <td key="merma" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? 
              renderEditableCell(item, "Merma", "number") : 
              <span className="font-mono text-yellow-600">{parseFloat(item.Merma || 0).toFixed(2)}%</span>
            }
          </td>
        )}
      ];
      
      // Agregar proveedor solo para ItemsAlmacen
      if (currentType === ItemsAlmacen) {
        inventoryCells.push({
          key: 'proveedor', content: (
            <td key="proveedor" className="px-3 py-2 border-r border-gray-100 text-xs">
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
          )
        });
      }
      
      // Agregar estado y fecha actualización
      inventoryCells.push(
        { key: 'estado', content: (
          <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
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
        )},
        { key: 'fechaActualizacion', content: (
          <td key="fechaActualizacion" className="px-3 py-2 border-r border-gray-100 text-xs">
            <span className="text-gray-600">{item.FECHA_ACT || "N/A"}</span>
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">
            <div className="flex gap-1">
              {(currentType === ProduccionInterna || currentType === MenuItems) && (
                <Button
                  onClick={() => handleRecipeToggle(item._id, item.Receta)}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6 border border-yellow-300"
                >
                  {openRecipeRows[item._id] ? '📖' : '📕'}
                </Button>
              )}
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
        )}
      );

      rows.push(
        <tr 
          key={item._id} 
          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
        >
          {inventoryCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content)}
        </tr>
      );
      
      // Agregar fila de receta si está abierta para productos de inventario
      if (isRecipeOpen && (currentType === ProduccionInterna || currentType === MenuItems)) {
        const visibleColumnsCount = Object.values(visibleColumns).filter(Boolean).length;
        rows.push(
          <tr key={`${item._id}-recipe`} className="bg-yellow-50">
            <td colSpan={visibleColumnsCount} className="px-3 py-4 border-b border-gray-200">
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                {currentType === MenuItems ? (
                  <RecepieOptionsMenu 
                    product={item} 
                    Receta={recetas[item._id]} 
                    currentType={currentType}
                    onSaveReceta={handleSaveReceta}
                    onCreateReceta={handleCreateReceta}
                  />
                ) : (
                  <RecepieOptions 
                    product={item} 
                    Receta={recetas[item._id]} 
                    currentType={currentType}
                    onCreateReceta={handleCreateReceta}
                  />
                )}
              </div>
            </td>
          </tr>
        );
      }
    });
    
    return rows;
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

          {/* Botón para selector de columnas */}
          <Button
            onClick={() => setShowColumnSelector(true)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm border border-blue-300 flex items-center gap-2"
          >
            📋 Columnas
          </Button>

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
