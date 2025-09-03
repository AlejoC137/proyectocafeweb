import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem, getRecepie } from "../../redux/actions-Proveedores";
import { 
  ESTATUS, 
  CATEGORIES, 
  SUB_CATEGORIES, 
  Staff, 
  WorkIsue, 
  Procedimientos, 
  MenuItems 
} from "../../redux/actions-types";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";
import { parseCompLunch } from "../../utils/jsonUtils";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";

export function TableViewManager({ products, currentType }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState(
    currentType === MenuItems ? "TARDEO" : ""
  ); 
  const [filterSubGrupo, setFilterSubGrupo] = useState(
    currentType === MenuItems ? "TARDEO_ALMUERZO" : ""
  );
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editingRows, setEditingRows] = useState({});
  const [openRecipeModals, setOpenRecipeModals] = useState({});
  const [recetas, setRecetas] = useState({});

  // Obtener categorías únicas según el tipo
  const getUniqueCategories = () => {
    switch(currentType) {
      case Staff:
        return [...new Set(products.map(p => p.Cargo).filter(Boolean))];
      case WorkIsue:
        return [...new Set(products.map(p => p.Categoria).filter(Boolean))];
      case Procedimientos:
        return [...new Set(products.map(p => p.Categoria).filter(Boolean))];
      case MenuItems:
        return [...new Set(products.map(p => p.GRUPO).filter(Boolean))];
      default:
        return [];
    }
  };

  // Obtener SUB_GRUPO únicos para MenuItems
  const getUniqueSubGroups = () => {
    if (currentType === MenuItems) {
      return [...new Set(products.map(p => p.SUB_GRUPO).filter(Boolean))];
    }
    return [];
  };

  // Obtener tipos únicos para MenuItems
  const getUniqueTipos = () => {
    if (currentType === MenuItems) {
      return [...new Set(products.map(p => p.TipoES).filter(Boolean))];
    }
    return [];
  };

  // Función para obtener el campo de búsqueda según el tipo
  const getSearchField = (product) => {
    switch(currentType) {
      case Staff:
        return `${product.Nombre || ""} ${product.Apellido || ""}`;
      case WorkIsue:
        return product.Tittle;
      case Procedimientos:
        return product.tittle;
      case MenuItems:
        return `${product.NombreES || ""} ${product.NombreEN || ""} ${product.DescripcionMenuES || ""}`;
      default:
        return "";
    }
  };

  // Función para obtener el campo de categoría según el tipo
  const getCategoryField = (product) => {
    switch(currentType) {
      case Staff:
        return product.Cargo;
      case WorkIsue:
        return product.Categoria;
      case Procedimientos:
        return product.Categoria;
      case MenuItems:
        return product.GRUPO;
      default:
        return "";
    }
  };

  const uniqueGrupos = getUniqueCategories();
  const uniqueSubGrupos = getUniqueSubGroups();
  const uniqueTipos = getUniqueTipos();
  const uniqueEstados = [...new Set(products.map(p => p.Estado).filter(Boolean))];
  
  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const searchField = getSearchField(product);
    const matchesSearch = !searchTerm || 
      (searchField && searchField.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const grupoField = getCategoryField(product);
    const matchesGrupo = !filterGrupo || grupoField === filterGrupo;
    const matchesStatus = !filterStatus || product.Estado === filterStatus;
    
    // Filtros específicos para MenuItems
    let matchesSubGrupo = true;
    let matchesTipo = true;
    
    if (currentType === MenuItems) {
      matchesSubGrupo = !filterSubGrupo || 
        (product.SUB_GRUPO && product.SUB_GRUPO.includes(filterSubGrupo));
      matchesTipo = !filterTipo || product.TipoES === filterTipo;
    }
    
    return matchesSearch && matchesGrupo && matchesStatus && matchesSubGrupo && matchesTipo;
  });

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue = a[sortColumn] || "";
    let bValue = b[sortColumn] || "";
    
    // Manejar casos especiales para fechas y números
    if (sortColumn === "Rate" || sortColumn === "CC" || sortColumn === "Precio") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortColumn.includes("Date") || sortColumn === "Dates") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
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
  const handleCellEdit = (itemId, field, value, subField = null) => {
    setEditingRows(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: subField ? {
          ...(prev[itemId]?.[field] || {}),
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
      
      // Manejar campos especiales según el tipo
      if (currentType === Staff) {
        // Para Staff, manejar objetos anidados
        if (editedData.Cuenta) {
          updatedFields.Cuenta = JSON.stringify(editedData.Cuenta);
        }
        if (editedData.infoContacto) {
          updatedFields.infoContacto = JSON.stringify(editedData.infoContacto);
        }
      } else if (currentType === WorkIsue) {
        // Para WorkIsue, manejar fechas y objetos
        if (editedData.Dates) {
          updatedFields.Dates = editedData.Dates;
        }
        if (editedData.Pagado) {
          updatedFields.Pagado = editedData.Pagado;
        }
      } else if (currentType === MenuItems) {
        // Para MenuItems, usar la acción correcta
        await dispatch(updateItem(item._id, updatedFields, "Menu"));
      } else {
        // Para otros tipos
        await dispatch(updateItem(item._id, updatedFields, currentType));
      }
      
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

  // Función para manejar el modal de recetas
  const handleRecipeModal = async (productId, recetaId = null) => {
    setOpenRecipeModals(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    if (recetaId && !recetas[productId]) {
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

  // Función para manejar objetos anidados de forma segura
  const parseNestedObject = (obj, fallback = {}) => {
    try {
      if (typeof obj === "string") {
        if (obj === "NaN" || obj === "null" || obj === "undefined" || !obj) {
          return fallback;
        }
        // Si no empieza con { o [, crear un objeto simple
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

  // Función para renderizar celdas editables
  const renderEditableCell = (item, field, type = "text", options = null, subField = null) => {
    const currentValue = subField ? 
      (editingRows[item._id]?.[field]?.[subField] || item[field]?.[subField] || "") :
      (editingRows[item._id]?.[field] || item[field] || "");

    if (type === "select") {
      return (
        <select
          value={currentValue}
          onChange={(e) => handleCellEdit(item._id, field, e.target.value, subField)}
          className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
        >
          <option  value="">Seleccionar...</option>
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
        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
      />
    );
  };

  // Función para renderizar columnas según el tipo
  const renderTableHeaders = () => {
    switch(currentType) {
      case MenuItems:
        // Determinar si estamos mostrando solo almuerzos
        const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
        
        if (isLunchOnly) {
          return (
            <>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("NombreES")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 border-gray-200 hover:text-blue-600">
                  Nombre <SortIcon column="NombreES" />
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Fecha</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Entrada</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Proteína</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Opción 2</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Carbohidrato</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Acompañante</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Ensalada</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Bebida</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Pedidos</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Precio")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                  Precio <SortIcon column="Precio" />
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Estado")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                  Estado <SortIcon column="Estado" />
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
            </>
          );
        }
        
        return (
          <>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("NombreES")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Nombre ES <SortIcon column="NombreES" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("NombreEN")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Nombre EN <SortIcon column="NombreEN" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Descripción ES
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Descripción EN
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Precio")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Precio <SortIcon column="Precio" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("GRUPO")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Grupo <SortIcon column="GRUPO" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              SUB_GRUPO
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("TipoES")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Tipo ES <SortIcon column="TipoES" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Tipo EN
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Foto
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              PRINT
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon column="Estado" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          </>
        );
      
      case Staff:
        return (
          <>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Nombre")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Nombre <SortIcon column="Nombre" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Apellido")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Apellido <SortIcon column="Apellido" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Cargo")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Cargo <SortIcon column="Cargo" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("CC")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                CC <SortIcon column="CC" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Rate")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Rate <SortIcon column="Rate" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon column="Estado" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          </>
        );
      
      case WorkIsue:
        return (
          <>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Tittle")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Título <SortIcon column="Tittle" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Categoria")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Categoría <SortIcon column="Categoria" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Prioridad")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Prioridad <SortIcon column="Prioridad" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Dates")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Fechas <SortIcon column="Dates" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon column="Estado" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          </>
        );
      
      case Procedimientos:
        return (
          <>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("tittle")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Título <SortIcon column="tittle" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Categoria")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Categoría <SortIcon column="Categoria" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Descripción")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Descripción <SortIcon column="Descripción" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="  bg-slate-100 text-gray-950  flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon column="Estado" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          </>
        );
      
      default:
        return <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Sin columnas definidas</th>;
    }
  };

  // Función para renderizar filas según el tipo
  const renderTableRows = () => {
    return sortedProducts.map((item, index) => {
      const isEditing = editingRows[item._id];

      return (
        <tr 
          key={item._id} 
          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
        >
          {renderTableCells(item, isEditing)}
        </tr>
      );
    });
  };

  // Función para renderizar celdas según el tipo
  const renderTableCells = (item, isEditing) => {
    switch(currentType) {
      case MenuItems:
        // Determinar si estamos mostrando solo almuerzos
        const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
        
        if (isLunchOnly) {
          // Parsear la información del almuerzo usando la función utilitaria
          const lunchData = parseCompLunch(item.Comp_Lunch);
          
          return (
            <>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                {showEdit ? renderEditableCell(item, "NombreES") : 
                  <span className="font-medium text-blue-800">{item.NombreES || "Sin nombre"}</span>
                }
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {lunchData?.fecha ? (
                    <>
                      <div className="font-medium text-purple-700">{lunchData.fecha.dia}</div>
                      <div className="text-gray-500">{lunchData.fecha.fecha}</div>
                    </>
                  ) : (
                    <span className="text-gray-400">Sin fecha</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-orange-700">{lunchData?.entrada?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.entrada?.descripcion}>
                    {lunchData?.entrada?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-red-700">{lunchData?.proteina?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.proteina?.descripcion}>
                    {lunchData?.proteina?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-purple-700">{lunchData?.proteina_opcion_2?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.proteina_opcion_2?.descripcion}>
                    {lunchData?.proteina_opcion_2?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-yellow-700">{lunchData?.carbohidrato?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.carbohidrato?.descripcion}>
                    {lunchData?.carbohidrato?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-green-700">{lunchData?.acompanante?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.acompanante?.descripcion}>
                    {lunchData?.acompanante?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-cyan-700">{lunchData?.ensalada?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.ensalada?.descripcion}>
                    {lunchData?.ensalada?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  <div className="font-medium text-teal-700">{lunchData?.bebida?.nombre || "N/A"}</div>
                  <div className="text-gray-500 truncate max-w-24" title={lunchData?.bebida?.descripcion}>
                    {lunchData?.bebida?.descripcion || ""}
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {lunchData?.lista ? (
                    <>
                      <div className="font-medium text-indigo-700">{lunchData.lista.length} pedidos</div>
                      <div className="text-green-600">
                        {lunchData.lista.filter(p => p.pagado).length} pagados
                      </div>
                      <div className="text-red-600">
                        {lunchData.lista.filter(p => !p.pagado).length} pendientes
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">Sin pedidos</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                {showEdit ? renderEditableCell(item, "Precio", "number") : 
                  <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-xs">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.Estado === "Activo" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {item.Estado || "Sin estado"}
                </span>
              </td>
              <td className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
            </>
          );
        }
        
        return (
          <>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "NombreES") : <span className="font-medium">{item.NombreES || "Sin nombre"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "NombreEN") : <span className="text-gray-600">{item.NombreEN || "Sin nombre EN"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
              {showEdit ? (
                <textarea
                  value={editingRows[item._id]?.DescripcionMenuES || item.DescripcionMenuES || ""}
                  onChange={(e) => handleCellEdit(item._id, "DescripcionMenuES", e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 resize-none"
                  rows={2}
                />
              ) : (
                <div className="text-xs text-gray-600 max-w-32 truncate" title={item.DescripcionMenuES}>
                  {item.DescripcionMenuES || "Sin descripción"}
                </div>
              )}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
              {showEdit ? (
                <textarea
                  value={editingRows[item._id]?.DescripcionMenuEN || item.DescripcionMenuEN || ""}
                  onChange={(e) => handleCellEdit(item._id, "DescripcionMenuEN", e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 resize-none"
                  rows={2}
                />
              ) : (
                <div className="text-xs text-gray-600 max-w-32 truncate" title={item.DescripcionMenuEN}>
                  {item.DescripcionMenuEN || "Sin descripción EN"}
                </div>
              )}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Precio", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "GRUPO", "select", CATEGORIES) :
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "SUB_GRUPO", "select", SUB_CATEGORIES) :
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{item.SUB_GRUPO || "Sin sub-grupo"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "TipoES") : <span className="text-gray-600">{item.TipoES || "Sin tipo"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "TipoEN") : <span className="text-gray-600">{item.TipoEN || "Sin tipo EN"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs max-w-20">
              {showEdit ? (
                <input
                  type="url"
                  value={editingRows[item._id]?.Foto || item.Foto || ""}
                  onChange={(e) => handleCellEdit(item._id, "Foto", e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                  placeholder="URL de imagen"
                />
              ) : (
                item.Foto ? (
                  <a href={item.Foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                    🖼️
                  </a>
                ) : (
                  <span className="text-gray-400">Sin foto</span>
                )
              )}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <button
                onClick={() => {
                  const newPrint = !item.PRINT;
                  handleCellEdit(item._id, "PRINT", newPrint);
                  // Guardar inmediatamente el cambio
                  dispatch(updateItem(item._id, { PRINT: newPrint }, "Menu"));
                }}
                className={`px-2 py-1 rounded text-xs ${
                  item.PRINT
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {item.PRINT ? "SÍ" : "NO"}
              </button>
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <button
                onClick={() => {
                  const newEstado = item.Estado === "Activo" ? "Inactivo" : "Activo";
                  handleCellEdit(item._id, "Estado", newEstado);
                  // Guardar inmediatamente el cambio
                  dispatch(updateItem(item._id, { Estado: newEstado }, "Menu"));
                }}
                className={`px-2 py-1 rounded-full text-xs ${
                  item.Estado === "Activo"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.Estado || "Sin estado"}
              </button>
            </td>
            <td className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          </>
        );
      
      case Staff:
        const cuentaData = parseNestedObject(item.Cuenta, {});
        const contactoData = parseNestedObject(item.infoContacto, {});
        
        return (
          <>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Nombre") : 
                <span className="font-medium text-blue-800">{item.Nombre || "Sin nombre"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Apellido") : 
                <span className="font-medium text-gray-700">{item.Apellido || "Sin apellido"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Cargo") :
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.Cargo || "Sin cargo"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "CC", "number") : 
                <span className="font-mono text-gray-600">{item.CC || "N/A"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Rate", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Rate || 0).toFixed(2)}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            </td>
            <td className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          </>
        );
      
      case WorkIsue:
        return (
          <>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Tittle") : 
                <span className="font-medium text-blue-800">{item.Tittle || "Sin título"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Categoria") :
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">{item.Categoria || "Sin categoría"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Prioridad", "select", ["Alta", "Media", "Baja"]) :
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.Prioridad === "Alta" ? "bg-red-100 text-red-800" :
                  item.Prioridad === "Media" ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {item.Prioridad || "Sin prioridad"}
                </span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Dates", "date") : 
                <span className="text-gray-600">
                  {item.Dates ? new Date(item.Dates).toLocaleDateString() : "Sin fecha"}
                </span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" || item.Estado === "Completado"
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            </td>
            <td className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          </>
        );
      
      case Procedimientos:
        return (
          <>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "tittle") : 
                <span className="font-medium text-blue-800">{item.tittle || "Sin título"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Categoria") :
                <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs">{item.Categoria || "Sin categoría"}</span>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Descripción") : 
                <div className="max-w-48 truncate" title={item.Descripción}>
                  <span className="text-gray-600">{item.Descripción || "Sin descripción"}</span>
                </div>}
            </td>
            <td className="px-3 py-2 border-r border-gray-100 text-xs">
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            </td>
            <td className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          </>
        );
      
      default:
        return <td className="px-3 py-2 text-xs">Tipo no soportado</td>;
    }
  };

  // Función para renderizar botones de acción
  const renderActionButtons = (item, isEditing) => (
    <div className="flex gap-1">
      {currentType === MenuItems && (
        <Button
          onClick={() => handleRecipeModal(item._id, item.Receta)}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6 border border-yellow-300"
        >
          {openRecipeModals[item._id] ? '📖' : '📕'}
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
  );

  return (
    <div className="w-full">
      {/* Panel de filtros tipo Excel */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="  bg-slate-100 text-gray-950  flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={`Buscar ${currentType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm bg-gray-100"
            />
          </div>
          
          <div className="  bg-slate-100 text-gray-950  flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los grupos</option>
              {uniqueGrupos.map(grupo => (
                <option key={grupo} value={grupo}>{grupo}</option>
              ))}
            </select>
          </div>

          {/* Filtros adicionales para MenuItems */}
          {currentType === MenuItems && (
            <>
              <div className="  bg-slate-100 text-gray-950  flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" />
                <select
                  value={filterSubGrupo}
                  onChange={(e) => setFilterSubGrupo(e.target.value)}
                  className="border border-orange-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
                >
                  <option value="">Todos los sub-grupos</option>
                  {uniqueSubGrupos.map(subGrupo => (
                    <option key={subGrupo} value={subGrupo}>{subGrupo}</option>
                  ))}
                </select>
              </div>
              
              <div className="  bg-slate-100 text-gray-950  flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-500" />
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="border border-purple-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
                >
                  <option value="">Todos los tipos</option>
                  {uniqueTipos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="  bg-slate-100 text-gray-950  flex items-center gap-2">
            <Filter className="w-4 h-4 text-green-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-green-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
            >
              <option value="">Todos los estados</option>
              {uniqueEstados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando {sortedProducts.length} de {products.length} elementos
            {currentType === MenuItems && filterSubGrupo && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Filtro: {filterSubGrupo}
              </span>
            )}
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

      {/* Modales de recetas */}
      {Object.entries(openRecipeModals).map(([productId, isOpen]) => {
        if (!isOpen) return null;
        
        const product = products.find(p => p._id === productId);
        const receta = recetas[productId];
        
        return (
          <div key={productId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Receta para: {product?.NombreES || product?.Nombre || product?.Tittle || product?.tittle}
                </h3>
                <Button
                  onClick={() => handleRecipeModal(productId)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              {currentType === MenuItems ? (
                <RecepieOptionsMenu 
                  product={product} 
                  Receta={receta} 
                  currentType={currentType}
                />
              ) : (
                <RecepieOptions 
                  product={product} 
                  Receta={receta} 
                  currentType={currentType}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Resumen tipo Excel */}
  
    </div>
  );
}
