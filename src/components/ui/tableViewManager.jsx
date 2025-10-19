import React, { useState, useEffect, useMemo } from "react";
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
import { parseCompLunch, safeJsonStringify } from "../../utils/jsonUtils";
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
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});

  // Función para manejar objetos anidados de forma segura (usada en WorkIsue)
  const parseNestedObject = (obj, fallback = {}) => {
    try {
      if (typeof obj === "string") {
        if (obj === "NaN" || obj === "null" || obj === "undefined" || !obj) {
          return fallback;
        }
        // Si no empieza con { o [, no es un JSON válido
        if (!obj.startsWith("{") && !obj.startsWith("[")) {
           // Devolver el fallback, pero quizás registrar el valor
           console.warn("Valor no JSON en campo anidado:", obj);
           return fallback;
        }
        return JSON.parse(obj);
      }
      return obj || fallback;
    } catch (e) {
      console.warn("Invalid nested object JSON:", obj, e);
      // Si falla el parseo, devolver el string original en un campo para no perderlo
      return { ...fallback, _raw: obj };
    }
  };


  // Definir todas las columnas disponibles según el tipo
  const getAvailableColumns = () => {
    switch(currentType) {
      case MenuItems:
        const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
        
        if (isLunchOnly) {
          return {
            nombre: { label: "Nombre", key: "NombreES", default: true },
            fecha: { label: "Fecha", key: "fecha", default: true },
            entrada: { label: "Entrada", key: "entrada", default: true },
            proteina: { label: "Proteína", key: "proteina", default: true },
            opcion2: { label: "Opción 2", key: "opcion2", default: true },
            carbohidrato: { label: "Carbohidrato", key: "carbohidrato", default: true },
            acompanante: { label: "Acompañante", key: "acompanante", default: true },
            ensalada: { label: "Ensalada", key: "ensalada", default: true },
            bebida: { label: "Bebida", key: "bebida", default: true },
            pedidos: { label: "Pedidos", key: "pedidos", default: true },
            precio: { label: "Precio", key: "Precio", default: true },
            estado: { label: "Estado", key: "Estado", default: true },
            acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
          };
        }
        
        return {
          nombreES: { label: "Nombre ES", key: "NombreES", default: true },
          nombreEN: { label: "Nombre EN", key: "NombreEN", default: true },
          descripcionES: { label: "Descripción ES", key: "DescripcionMenuES", default: false },
          descripcionEN: { label: "Descripción EN", key: "DescripcionMenuEN", default: false },
          precio: { label: "Precio", key: "Precio", default: true },
          grupo: { label: "Grupo", key: "GRUPO", default: true },
          subGrupo: { label: "SUB_GRUPO", key: "SUB_GRUPO", default: true },
          tipoES: { label: "Tipo ES", key: "TipoES", default: false },
          tipoEN: { label: "Tipo EN", key: "TipoEN", default: false },
          foto: { label: "Foto", key: "Foto", default: false },
          print: { label: "PRINT", key: "PRINT", default: true },
          estado: { label: "Estado", key: "Estado", default: true },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      
      case Staff:
        return {
          nombre: { label: "Nombre", key: "Nombre", default: true },
          apellido: { label: "Apellido", key: "Apellido", default: true },
          cargo: { label: "Cargo", key: "Cargo", default: true },
          cc: { label: "CC", key: "CC", default: true },
          rate: { label: "Rate", key: "Rate", default: true },
          estado: { label: "Estado", key: "Estado", default: true },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      
      // --- MODIFICACIÓN WORKISUE ---
      case WorkIsue:
        return {
          titulo: { label: "Título", key: "Tittle", default: true },
          categoria: { label: "Categoría", key: "Categoria", default: true },
          ejecutor: { label: "Ejecutor", key: "Ejecutor", default: true },
          fechaCreacion: { label: "Creado", key: "Dates.isued", default: true },
          fechaFin: { label: "Finalizado", key: "Dates.finished", default: false },
          dateAsigmente: { label: "Asignado", key: "Dates.date_asigmente", default: false }, 
          procedimientos: { label: "Procedimientos", key: "Procedimientos", default: false },
          pagado: { label: "Pagado", key: "Pagado.pagadoFull", default: true },
          notas: { label: "Notas", key: "Notas", default: false },
          estado: { label: "Estado", key: "Terminado", default: true }, // Usamos 'Terminado' (boolean) para el estado
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      // --- FIN MODIFICACIÓN ---
        
      case Procedimientos:
        return {
          titulo: { label: "Título", key: "tittle", default: true },
          categoria: { label: "Categoría", key: "Categoria", default: true },
          DescripcionGeneral: { label: "DescripcionGeneral", key: "DescripcionGeneral", default: false },
          estado: { label: "Estado", key: "Estado", default: true },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      
      default:
        return {};
    }
  };

  const availableColumns = useMemo(() => getAvailableColumns(), [currentType, filterSubGrupo]);

  // Inicializar columnas visibles al cambiar el tipo
  useEffect(() => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => {
      defaultVisibleColumns[key] = column.default;
    });
    console.log('Initializing visible columns:', defaultVisibleColumns);
    setVisibleColumns(defaultVisibleColumns);
  }, [availableColumns]);

  // Debug log para ver el estado actual
  console.log('Current visibleColumns state:', visibleColumns);
  console.log('Available columns:', availableColumns);

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
        return `${product.Tittle || ""} ${product.Categoria || ""} ${product.Notas || ""}`; // Incluimos Categoria y Notas en búsqueda
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

  // Función para obtener el campo de estado
  const getStatusField = (product) => {
    switch(currentType) {
        case WorkIsue:
            // Convertir boolean 'Terminado' a string "Terminado" / "Pendiente"
            return product.Terminado ? "Terminado" : "Pendiente";
        default:
            return product.Estado;
    }
  };


  const uniqueGrupos = getUniqueCategories();
  const uniqueSubGrupos = getUniqueSubGroups();
  const uniqueTipos = getUniqueTipos();
  // Modificado para que los estados de WorkIsue sean "Terminado" y "Pendiente"
  const uniqueEstados = currentType === WorkIsue 
    ? ["Terminado", "Pendiente"]
    : [...new Set(products.map(p => p.Estado).filter(Boolean))];

  
  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const searchField = getSearchField(product);
    const matchesSearch = !searchTerm || 
      (searchField && searchField.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const grupoField = getCategoryField(product);
    const matchesGrupo = !filterGrupo || grupoField === filterGrupo;

    // Usar la nueva función de estado
    const statusField = getStatusField(product);
    const matchesStatus = !filterStatus || statusField === filterStatus;
    
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
    
    let aValue;
    let bValue;

    // --- MODIFICACIÓN SORTING WORKISUE ---
    // Manejar ordenamiento de campos anidados de WorkIsue
    if (currentType === WorkIsue && (sortColumn === "Dates.isued" || sortColumn === "Pagado.pagadoFull")) {
        if (sortColumn === "Dates.isued") {
            aValue = new Date(parseNestedObject(a.Dates, {isued: null}).isued || 0);
            bValue = new Date(parseNestedObject(b.Dates, {isued: null}).isued || 0);
        } else if (sortColumn === "Pagado.pagadoFull") {
            aValue = parseNestedObject(a.Pagado, {pagadoFull: false}).pagadoFull;
            bValue = parseNestedObject(b.Pagado, {pagadoFull: false}).pagadoFull;
        }
    } else {
         aValue = a[sortColumn] || "";
         bValue = b[sortColumn] || "";
    }
    // --- FIN MODIFICACIÓN ---

    // Manejar casos especiales para fechas y números
    if (sortColumn === "Rate" || sortColumn === "CC" || sortColumn === "Precio") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortColumn === "Dates" && currentType !== WorkIsue) { // Evitar doble manejo
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
          ...(prev[itemId]?.[field] || {}), // Mantener otros sub-campos si existen
          [subField]: value
        } : value
      }
    }));
  };

  // Función específica para manejar edición de Comp_Lunch
  const handleCompLunchEdit = (itemId, component, field, value) => {
    // Obtener los datos actuales de Comp_Lunch
    const currentItem = products.find(p => p._id === itemId);
    const currentCompLunch = parseCompLunch(currentItem?.Comp_Lunch) || {};
    
    // Crear la nueva estructura
    const updatedCompLunch = {
      ...currentCompLunch,
      [component]: {
        ...currentCompLunch[component],
        [field]: value
      }
    };

    // Actualizar el estado de edición
    setEditingRows(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        Comp_Lunch: safeJsonStringify(updatedCompLunch, false)
      }
    }));
  };

  // Función para validar datos antes del guardado
  const validateRowData = (editedData, currentType) => {
    const errors = [];
    
    // Validaciones según el tipo
    if (currentType === Staff) {
      if (editedData.Nombre && editedData.Nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      if (editedData.Rate !== undefined && (isNaN(parseFloat(editedData.Rate)) || parseFloat(editedData.Rate) < 0)) {
        errors.push('La tarifa debe ser un número válido mayor o igual a 0');
      }
    } else if (currentType === WorkIsue) {
      if (editedData.Tittle && editedData.Tittle.trim().length < 2) {
        errors.push('El título debe tener al menos 2 caracteres');
      }
    } else if (currentType === Procedimientos) {
      if (editedData.tittle && editedData.tittle.trim().length < 2) {
        errors.push('El título debe tener al menos 2 caracteres');
      }
    } else if (currentType === MenuItems) {
      if (editedData.NombreES && editedData.NombreES.trim().length < 2) {
        errors.push('El nombre en español debe tener al menos 2 caracteres');
      }
      if (editedData.Precio !== undefined && (isNaN(parseFloat(editedData.Precio)) || parseFloat(editedData.Precio) <= 0)) {
        errors.push('El precio debe ser un número válido mayor que 0');
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
    const validationErrors = validateRowData(editedData, currentType);
    if (validationErrors.length > 0) {
      alert(`Errores de validación:\n- ${validationErrors.join('\n- ')}`);
      return;
    }
    
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
        // Convertir Rate a número si está presente
        if (editedData.Rate !== undefined && editedData.Rate !== '') {
          updatedFields.Rate = parseFloat(editedData.Rate) || 0;
        }
      } 
      
      // --- MODIFICACIÓN GUARDADO WORKISUE ---
      else if (currentType === WorkIsue) {
        // Para WorkIsue, manejar objetos JSON anidados
        const originalItem = products.find(p => p._id === item._id);

        // 1. Manejar 'Dates'
        if (editedData.Dates) {
          // Parsear el string original
          const originalDates = parseNestedObject(originalItem.Dates, { isued: "", finished: "", date_asigmente: [] });
          
          // Manejar el string JSON de bitácora
          if (editedData.Dates.date_asigmente_str) {
            try {
              // Intenta parsear el string que vino del textarea
              editedData.Dates.date_asigmente = JSON.parse(editedData.Dates.date_asigmente_str);
            } catch (e) {
              console.warn("Invalid JSON for bitacora", editedData.Dates.date_asigmente_str);
              alert("El formato JSON de la bitácora es inválido. No se guardará ese campo.");
              delete editedData.Dates.date_asigmente_str;
            }
            delete editedData.Dates.date_asigmente_str; // Limpiar el campo temporal
          }
          
          // Mergear los cambios (que están en editedData.Dates)
          const newDates = { ...originalDates, ...editedData.Dates };
          
          // Stringify para la API
          updatedFields.Dates = JSON.stringify(newDates);
        }

        // 2. Manejar 'Pagado'
        if (editedData.Pagado) {
          // Parsear el string original
          const originalPagado = parseNestedObject(originalItem.Pagado, { pagadoFull: false });
          
          // Convertir 'pagadoFull' (que viene como string "true" o "false") a boolean
          if (editedData.Pagado.pagadoFull !== undefined) {
             editedData.Pagado.pagadoFull = editedData.Pagado.pagadoFull === "true";
          }

          // Mergear
          const newPagado = { ...originalPagado, ...editedData.Pagado };
          
          // Stringify
          updatedFields.Pagado = JSON.stringify(newPagado);
        }

        // 3. Manejar 'Terminado' (Estado)
        if (editedData.Terminado !== undefined) {
            updatedFields.Terminado = editedData.Terminado === "true"; // Convertir string a boolean
        }

        // 4. AÑADIDO: Manejar 'Procedimientos' (desde el campo temporal _str)
        if (editedData.Procedimientos_str !== undefined) {
          try {
              // Validar que es un JSON válido
              JSON.parse(editedData.Procedimientos_str);
              updatedFields.Procedimientos = editedData.Procedimientos_str; // Asignar al campo real
          } catch (e) {
              console.warn("Invalid JSON for Procedimientos", editedData.Procedimientos_str);
              alert("El formato JSON de Procedimientos es inválido. No se guardará ese campo.");
          }
          // Limpiar el campo temporal del objeto final
          delete updatedFields.Procedimientos_str; 
          delete editedData.Procedimientos_str; // También del original por si acaso
        }

      } 
      // --- FIN MODIFICACIÓN ---

      else if (currentType === MenuItems) {
        // Para MenuItems, convertir precio a número
        if (editedData.Precio !== undefined && editedData.Precio !== '') {
          updatedFields.Precio = parseFloat(editedData.Precio) || 0;
        }
      }
      
      // Limpiar campos vacíos
      Object.keys(updatedFields).forEach(key => {
        // No limpiar campos booleanos o numéricos
        if (typeof updatedFields[key] === 'string' && updatedFields[key].trim() === '') {
           // Excepción para campos JSON que pueden ser string vacíos pero significar algo
           if (key !== 'Dates' && key !== 'Pagado' && key !== 'Comp_Lunch' && key !== 'Procedimientos') {
             updatedFields[key] = null;
           }
        }
      });
      
      // Llamar a updateItem según el tipo
      const tableType = currentType === MenuItems ? "Menu" : currentType;
      console.log("Saving item...", { id: item._id, fields: updatedFields, table: tableType });
      const result = await dispatch(updateItem(item._id, updatedFields, tableType));
      
      if (result) {
        // Limpiar datos de edición para esta fila
        setEditingRows(prev => {
          const newState = { ...prev };
          delete newState[item._id];
          return newState;
        });
        
        console.log('Ítem actualizado correctamente');
      } else {
        throw new Error('No se pudo actualizar el ítem');
      }
      
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
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

  // (parseNestedObject se movió arriba para ser usada por getAvailableColumns)

  // Función para renderizar celdas editables
  const renderEditableCell = (item, field, type = "text", options = null, subField = null) => {
    
    let currentValue;
    if (subField) {
        // Para campos anidados (ej: Dates.isued)
        // 1. Mirar si hay un valor editado en 'editingRows'
        let parentInEditing = editingRows[item._id]?.[field];
        // 2. Si no, parsear el valor original
        let parentOriginal = parseNestedObject(item[field], {});

        currentValue = (parentInEditing && parentInEditing[subField] !== undefined) 
            ? parentInEditing[subField] 
            : parentOriginal[subField];

    } else {
        // Para campos simples (ej: Tittle)
        currentValue = (editingRows[item._id]?.[field] !== undefined) 
            ? editingRows[item._id][field] 
            : item[field];
    }

    // Normalizar valor para el input
    currentValue = currentValue === null || currentValue === undefined ? "" : currentValue;

    // --- MODIFICACIÓN: Manejar booleanos para select
    // Si el tipo es select y las opciones son ["true", "false"], convertir el valor booleano a string
    if (type === "select" && Array.isArray(options) && options.includes("true") && options.includes("false")) {
        currentValue = String(currentValue);
    }
    // --- FIN MODIFICACIÓN ---

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
              {/* Para 'true'/'false', mostrar etiquetas amigables */}
              {option === "true" ? (field === "Terminado" ? "Terminado" : "Pagado") : 
               option === "false" ? "Pendiente" : 
               option}
            </option>
          ))}
        </select>
      );
    }

    // Formatear valor de fecha
    if (type === "date") {
         currentValue = (currentValue || "").split('T')[0]; // Formato YYYY-MM-DD
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
    const headers = [];
    
    switch(currentType) {
      case MenuItems:
        // (Sin cambios)
        const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
        
        if (isLunchOnly) {
          // Headers para vista de almuerzos
          const lunchHeaders = [
            { key: 'nombre', content: (
              <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("NombreES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 border-gray-200 hover:text-blue-600">
                  Nombre <SortIcon column="NombreES" />
                </button>
              </th>
            )},
            { key: 'fecha', content: (
              <th key="fecha" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Fecha</th>
            )},
            { key: 'entrada', content: (
              <th key="entrada" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Entrada</th>
            )},
            { key: 'proteina', content: (
              <th key="proteina" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Proteína</th>
            )},
            { key: 'opcion2', content: (
              <th key="opcion2" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Opción 2</th>
            )},
            { key: 'carbohidrato', content: (
              <th key="carbohidrato" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Carbohidrato</th>
            )},
            { key: 'acompanante', content: (
              <th key="acompanante" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Acompañante</th>
            )},
            { key: 'ensalada', content: (
              <th key="ensalada" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Ensalada</th>
            )},
            { key: 'bebida', content: (
              <th key="bebida" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Bebida</th>
            )},
            { key: 'pedidos', content: (
              <th key="pedidos" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Pedidos</th>
            )},
            { key: 'precio', content: (
              <th key="precio" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Precio")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                  Precio <SortIcon column="Precio" />
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
            { key: 'acciones', content: (
              <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
            )}
          ];
          
          return lunchHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
        }
        
        // Headers para vista normal de MenuItems
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
          { key: 'descripcionES', content: (
            <th key="descripcionES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Descripción ES
            </th>
          )},
          { key: 'descripcionEN', content: (
            <th key="descripcionEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Descripción EN
            </th>
          )},
          { key: 'precio', content: (
            <th key="precio" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Precio")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Precio <SortIcon column="Precio" />
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
              SUB_GRUPO
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
              Tipo EN
            </th>
          )},
          { key: 'foto', content: (
            <th key="foto" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              Foto
            </th>
          )},
          { key: 'print', content: (
            <th key="print" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              PRINT
            </th>
          )},
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon column="Estado" />
              </button>
            </th>
          )},
          { key: 'acciones', content: (
            <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          )}
        ];
        
        return menuHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      case Staff:
        // (Sin cambios)
        const staffHeaders = [
          { key: 'nombre', content: (
            <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Nombre")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Nombre <SortIcon column="Nombre" />
              </button>
            </th>
          )},
          { key: 'apellido', content: (
            <th key="apellido" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Apellido")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Apellido <SortIcon column="Apellido" />
              </button>
            </th>
          )},
          { key: 'cargo', content: (
            <th key="cargo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Cargo")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Cargo <SortIcon column="Cargo" />
              </button>
            </th>
          )},
          { key: 'cc', content: (
            <th key="cc" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("CC")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                CC <SortIcon column="CC" />
              </button>
            </th>
          )},
          { key: 'rate', content: (
            <th key="rate" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Rate")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Rate <SortIcon column="Rate" />
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
          { key: 'acciones', content: (
            <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          )}
        ];
        
        return staffHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      // --- MODIFICACIÓN WORKISUE HEADERS ---
      case WorkIsue:
        const workIssueHeaders = [
          { key: 'titulo', content: (
            <th key="titulo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Tittle")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Título <SortIcon column="Tittle" />
              </button>
            </th>
          )},
          { key: 'categoria', content: (
            <th key="categoria" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Categoria")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Categoría <SortIcon column="Categoria" />
              </button>
            </th>
          )},
 
          { key: 'ejecutor', content: (
            <th key="ejecutor" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Ejecutor")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Ejecutor <SortIcon column="Ejecutor" />
              </button>
            </th>
          )},
          { key: 'fechaCreacion', content: (
            <th key="fechaCreacion" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Dates.isued")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Creado <SortIcon column="Dates.isued" />
              </button>
            </th>
          )},
          { key: 'fechaFin', content: (
            <th key="fechaFin" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Finalizado</th>
          )},
          // CORREGIDO: key 'dateAsigmente'
          { key: 'dateAsigmente', content: (
            <th key="dateAsigmente" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Bitácora</th>
          )},
          // AÑADIDO: header 'procedimientos'
          { key: 'procedimientos', content: (
            <th key="procedimientos" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Procedimientos</th>
          )},
          { key: 'pagado', content: (
            <th key="pagado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Pagado.pagadoFull")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Pagado <SortIcon column="Pagado.pagadoFull" />
              </button>
            </th>
          )},
           { key: 'notas', content: (
            <th key="notas" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Notas</th>
          )},
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Terminado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon column="Terminado" />
              </button>
            </th>
          )},
          { key: 'acciones', content: (
            <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          )}
        ];
        
        return workIssueHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      // --- FIN MODIFICACIÓN ---
        
      case Procedimientos:
        // (Sin cambios)
        const procedimientosHeaders = [
          { key: 'titulo', content: (
            <th key="titulo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("tittle")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Título <SortIcon column="tittle" />
              </button>
            </th>
          )},
          { key: 'categoria', content: (
            <th key="categoria" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Categoria")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Categoría <SortIcon column="Categoria" />
              </button>
            </th>
          )},
          { key: 'DescripcionGeneral', content: (
            <th key="DescripcionGeneral" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("DescripcionGeneral")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                DescripcionGeneral <SortIcon column="DescripcionGeneral" />
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
          { key: 'acciones', content: (
            <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
          )}
        ];
        
        return procedimientosHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      default:
        return [<th key="default" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Sin columnas definidas</th>];
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
    const cells = [];
    
    switch(currentType) {
      case MenuItems:
        // (Sin cambios)
        const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
        
        if (isLunchOnly) {
          // Parsear la información del almuerzo usando la función utilitaria
          const lunchData = parseCompLunch(item.Comp_Lunch);
          
          const lunchCells = [
            { key: 'nombre', content: (
              <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
                {showEdit ? renderEditableCell(item, "NombreES") : 
                  <span className="font-medium text-blue-800">{item.NombreES || "Sin nombre"}</span>
                }
              </td>
            )},
            { key: 'fecha', content: (
              <td key="fecha" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.fecha?.dia || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "fecha", "dia", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Día"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.fecha?.fecha || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "fecha", "fecha", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Fecha"
                      />
                    </>
                  ) : (
                    lunchData?.fecha ? (
                      <>
                        <div className="font-medium text-purple-700">{lunchData.fecha.dia}</div>
                        <div className="text-gray-500">{lunchData.fecha.fecha}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">Sin fecha</span>
                    )
                  )}
                </div>
              </td>
            )},
            { key: 'entrada', content: (
              <td key="entrada" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.entrada?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "entrada", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre entrada"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.entrada?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "entrada", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción entrada"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-orange-700">{lunchData?.entrada?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.entrada?.descripcion}>
                        {lunchData?.entrada?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'proteina', content: (
              <td key="proteina" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "proteina", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre proteína"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "proteina", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción proteína"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-red-700">{lunchData?.proteina?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.proteina?.descripcion}>
                        {lunchData?.proteina?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'opcion2', content: (
              <td key="opcion2" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina_opcion_2?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "proteina_opcion_2", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre opción 2"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina_opcion_2?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "proteina_opcion_2", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción opción 2"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-purple-700">{lunchData?.proteina_opcion_2?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.proteina_opcion_2?.descripcion}>
                        {lunchData?.proteina_opcion_2?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'carbohidrato', content: (
              <td key="carbohidrato" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.carbohidrato?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "carbohidrato", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre carbohidrato"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.carbohidrato?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "carbohidrato", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción carbohidrato"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-yellow-700">{lunchData?.carbohidrato?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.carbohidrato?.descripcion}>
                        {lunchData?.carbohidrato?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'acompanante', content: (
              <td key="acompanante" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.acompanante?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "acompanante", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre acompañante"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.acompanante?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "acompanante", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción acompañante"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-green-700">{lunchData?.acompanante?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.acompanante?.descripcion}>
                        {lunchData?.acompanante?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'ensalada', content: (
              <td key="ensalada" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.ensalada?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "ensalada", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre ensalada"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.ensalada?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "ensalada", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción ensalada"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-cyan-700">{lunchData?.ensalada?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.ensalada?.descripcion}>
                        {lunchData?.ensalada?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'bebida', content: (
              <td key="bebida" className="px-3 py-2 border-r border-gray-100 text-xs">
                <div className="text-xs">
                  {showEdit ? (
                    <>
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.bebida?.nombre || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "bebida", "nombre", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                        placeholder="Nombre bebida"
                      />
                      <input
                        type="text"
                        value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.bebida?.descripcion || ""}
                        onChange={(e) => handleCompLunchEdit(item._id, "bebida", "descripcion", e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                        placeholder="Descripción bebida"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-teal-700">{lunchData?.bebida?.nombre || "N/A"}</div>
                      <div className="text-gray-500 truncate max-w-24" title={lunchData?.bebida?.descripcion}>
                        {lunchData?.bebida?.descripcion || ""}
                      </div>
                    </>
                  )}
                </div>
              </td>
            )},
            { key: 'pedidos', content: (
              <td key="pedidos" className="px-3 py-2 border-r border-gray-100 text-xs">
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
            )},
            { key: 'precio', content: (
              <td key="precio" className="px-3 py-2 border-r border-gray-100 text-xs">
                {showEdit ? renderEditableCell(item, "Precio", "number") : 
                  <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}
              </td>
            )},
            { key: 'estado', content: (
              <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.Estado === "Activo" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {item.Estado || "Sin estado"}
                </span>
              </td>
            )},
            { key: 'acciones', content: (
              <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
            )}
          ];
          
          return lunchCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
        }
        
        // Celdas para vista normal de MenuItems
        const menuCells = [
          { key: 'nombreES', content: (
            <td key="nombreES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "NombreES") : <span className="font-medium">{item.NombreES || "Sin nombre"}</span>}
            </td>
          )},
          { key: 'nombreEN', content: (
            <td key="nombreEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "NombreEN") : <span className="text-gray-600">{item.NombreEN || "Sin nombre EN"}</span>}
            </td>
          )},
          { key: 'descripcionES', content: (
            <td key="descripcionES" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
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
          )},
          { key: 'descripcionEN', content: (
            <td key="descripcionEN" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
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
          )},
          { key: 'precio', content: (
            <td key="precio" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Precio", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}
            </td>
          )},
          { key: 'grupo', content: (
            <td key="grupo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "GRUPO", "select", CATEGORIES) :
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>}
            </td>
          )},
          { key: 'subGrupo', content: (
            <td key="subGrupo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "SUB_GRUPO", "select", SUB_CATEGORIES) :
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{item.SUB_GRUPO || "Sin sub-grupo"}</span>}
            </td>
          )},
          { key: 'tipoES', content: (
            <td key="tipoES" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "TipoES") : <span className="text-gray-600">{item.TipoES || "Sin tipo"}</span>}
            </td>
          )},
          { key: 'tipoEN', content: (
            <td key="tipoEN" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "TipoEN") : <span className="text-gray-600">{item.TipoEN || "Sin tipo EN"}</span>}
            </td>
          )},
          { key: 'foto', content: (
            <td key="foto" className="px-3 py-2 border-r border-gray-100 text-xs max-w-20">
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
          )},
          { key: 'print', content: (
            <td key="print" className="px-3 py-2 border-r border-gray-100 text-xs">
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
          )},
          { key: 'estado', content: (
            <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
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
          )},
          { key: 'acciones', content: (
            <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          )}
        ];
        
        return menuCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
      
      case Staff:
        // (Sin cambios)
        const cuentaData = parseNestedObject(item.Cuenta, {});
        const contactoData = parseNestedObject(item.infoContacto, {});
        
        const staffCells = [
          { key: 'nombre', content: (
            <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Nombre") : 
                <span className="font-medium text-blue-800">{item.Nombre || "Sin nombre"}</span>}
            </td>
          )},
          { key: 'apellido', content: (
            <td key="apellido" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Apellido") : 
                <span className="font-medium text-gray-700">{item.Apellido || "Sin apellido"}</span>}
            </td>
          )},
          { key: 'cargo', content: (
            <td key="cargo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Cargo") :
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.Cargo || "Sin cargo"}</span>}
            </td>
          )},
          { key: 'cc', content: (
            <td key="cc" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "CC", "number") : 
                <span className="font-mono text-gray-600">{item.CC || "N/A"}</span>}
            </td>
          )},
          { key: 'rate', content: (
            <td key="rate" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Rate", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Rate || 0).toFixed(2)}</span>}
            </td>
          )},
          { key: 'estado', content: (
            <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Estado", "select", ESTATUS) :
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.Estado === "Activo" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {item.Estado || "Sin estado"}
                </span>
              }
            </td>
          )},
          { key: 'acciones', content: (
            <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          )}
        ];
        
        return staffCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
      
      // --- MODIFICACIÓN WORKISUE CELDAS ---
      case WorkIsue: { 
        // Parsear objetos JSON anidados
        const datesData = parseNestedObject(item.Dates, { isued: "", finished: "", date_asigmente: [] });
        const pagadoData = parseNestedObject(item.Pagado, { pagadoFull: false });
        // AÑADIDO: Parsear 'Procedimientos' (que es un string JSON de un array)
        const procedimientosData = parseNestedObject(item.Procedimientos, []);


        const workIssueCells = [
          { key: 'titulo', content: (
            <td key="titulo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Tittle") : 
                <span className="font-medium text-blue-800">{item.Tittle || "Sin título"}</span>}
            </td>
          )},
          { key: 'categoria', content: (
            <td key="categoria" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Categoria", "select", ["COCINA", "BAR", "ADMIN", "GENERAL", "MANTENIMIENTO"]) :
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">{item.Categoria || "Sin categoría"}</span>}
            </td>
          )},
         
          { key: 'ejecutor', content: (
            <td key="ejecutor" className="px-3 py-2 border-r border-gray-100 text-xs">
               {/* Asumimos que 'staff' es una lista de strings o se edita como texto */
                 /* Si 'staff' se carga en el estado global, se puede pasar a 'options' */
               }
              {showEdit ? renderEditableCell(item, "Ejecutor") : 
                <span className="text-gray-700">{item.Ejecutor || "N/A"}</span>}
            </td>
          )},
          { key: 'fechaCreacion', content: (
            <td key="fechaCreacion" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Dates", "date", null, "isued") : 
                <span className="text-gray-600">
                  {datesData.isued ? new Date(datesData.isued).toLocaleDateString() : "Sin fecha"}
                </span>}
            </td>
          )},
          { key: 'fechaFin', content: (
            <td key="fechaFin" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Dates", "date", null, "finished") : 
                <span className="text-gray-600">
                  {datesData.finished ? new Date(datesData.finished).toLocaleDateString() : "Pendiente"}
                </span>}
            </td>
          )},
          { key: 'dateAsigmente', content: (
            <td key="dateAsigmente" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Dates", "date", null, "finished") : 
                <span className="text-gray-600">
                  {datesData.finished ? new Date(datesData.finished).toLocaleDateString() : "Pendiente"}
                </span>}
            </td>
          )},
          // CORREGIDO: key 'dateAsigmente'
   
          // AÑADIDO: Celda 'procedimientos'
          { key: 'procedimientos', content: (
            <td key="procedimientos" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
              {/* Editar array/objeto JSON como string */}
              {showEdit ? (
                <textarea
                  value={
                    editingRows[item._id]?.Procedimientos_str !== undefined
                      ? editingRows[item._id].Procedimientos_str
                      // El original es un string, así que lo usamos directamente
                      : (item.Procedimientos || "[]") 
                  }
                  onChange={(e) => {
                    handleCellEdit(item._id, "Procedimientos_str", e.target.value); // Usar un campo temporal
                  }}
                  className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 font-mono"
                  rows={2}
                />
              ) : (
                <span className="text-gray-600 font-mono text-xs truncate" title={item.Procedimientos}>
                  {item.Procedimientos || "[]"}
                </span>
              )}
            </td>
          )},
          { key: 'pagado', content: (
            <td key="pagado" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Pagado", "select", ["true", "false"], "pagadoFull") : 
                <span className={`px-2 py-1 rounded-full text-xs ${
                  pagadoData.pagadoFull ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {pagadoData.pagadoFull ? "Pagado" : "Pendiente"}
                </span>}
            </td>
          )},
          { key: 'notas', content: (
            <td key="notas" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
              {showEdit ? (
                <textarea
                  value={editingRows[item._id]?.Notas !== undefined ? editingRows[item._id].Notas : (item.Notas || "")}
                  onChange={(e) => handleCellEdit(item._id, "Notas", e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                  rows={2}
                />
              ) : (
                <span className="text-gray-600 truncate" title={item.Notas}>{item.Notas || "Sin notas"}</span>
              )}
            </td>
          )},
          { key: 'estado', content: (
            <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
               {/* Usamos 'Terminado' (boolean) como campo de estado */}
              {showEdit ? renderEditableCell(item, "Terminado", "select", ["true", "false"]) :
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.Terminado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {item.Terminado ? "Terminado" : "Pendiente"}
                </span>}
            </td>
          )},
          { key: 'acciones', content: (
            <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          )}
        ];
        
        return workIssueCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
      } // Cerrar el case
      // --- FIN MODIFICACIÓN ---
        
      case Procedimientos:
        // (Sin cambios)
        const procedimientosCells = [
          { key: 'titulo', content: (
            <td key="titulo" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "tittle") : 
                <span className="font-medium text-blue-800">{item.tittle || "Sin título"}</span>}
            </td>
          )},
          { key: 'categoria', content: (
            <td key="categoria" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Categoria") :
                <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs">{item.Categoria || "Sin categoría"}</span>}
            </td>
          )},
          { key: 'DescripcionGeneral', content: (
            <td key="DescripcionGeneral" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "DescripcionGeneral") : 
                <div className="max-w-48 truncate" title={item.DescripcionGeneral}>
                  <span className="text-gray-600">{item.DescripcionGeneral || "Sin descripción"}</span>
                </div>}
            </td>
          )},
          { key: 'estado', content: (
            <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            </td>
          )},
          { key: 'acciones', content: (
            <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          )}
        ];
        
        return procedimientosCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
      
      default:
        return [<td key="default" className="px-3 py-2 text-xs">Tipo no soportado</td>];
    }
  };

  // Función para renderizar botones de acción
  const renderActionButtons = (item, isEditing) => (
    <div className="flex gap-1">
      {/* Botón de Receta: visible para MenuItems y Procedimientos (o WorkIsue si tiene receta) */}
      {(currentType === MenuItems || currentType === Procedimientos) && (
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
              <option value="">{currentType === WorkIsue ? "Todas las Categorías" : "Todos los Grupos"}</option>
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

          {/* Botón para selector de columnas */}
          <Button
            onClick={() => setShowColumnSelector(true)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm border border-blue-300 flex items-center gap-2"
          >
            📋 Columnas
          </Button>

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

      {/* Modal para selector de columnas */}
      {showColumnSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 column-selector-container">
          <div className="bg-white rounded-lg p-6 max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Seleccionar Columnas</h3>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Controles rápidos */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => toggleAllColumns(true)}
                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
              >
                Mostrar Todas
              </button>
              <button
                onClick={() => toggleAllColumns(false)}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Ocultar Todas
              </button>
              <button
                onClick={resetToDefault}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                Por Defecto
              </button>
            </div>
            
            {/* Lista de columnas */}
            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded p-3">
              {Object.entries(availableColumns).map(([key, column]) => (
                <div key={key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <label className="flex items-center space-x-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key] || false}
                      onChange={() => !column.fixed && toggleColumn(key)}
                      disabled={column.fixed}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${
                      column.fixed ? 'text-gray-500 font-medium' : 'text-gray-700'
                    }`}>
                      {column.label}
                      {column.fixed && <span className="ml-1 text-xs">(fijo)</span>}
                    </span>
                  </label>
                  {column.fixed && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Requerido</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  {Object.values(visibleColumns).filter(Boolean).length} de {Object.keys(availableColumns).length} columnas visibles
                </span>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen tipo Excel */}
  
    </div>
  );
}