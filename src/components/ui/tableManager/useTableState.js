import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { MenuItems, Comanda } from "../../../redux/actions-types";
import { 
  getAvailableColumns 
} from "./tableColumns";
import {
  getSearchField,
  getCategoryField,
  getStatusField,
  parseNestedObject,
  getUniqueCategories,
  getUniqueSubGroups,
  getUniqueTipos
} from "./tableUtils";

export const useTableState = ({ products, currentType }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
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

  const availableColumns = useMemo(() => getAvailableColumns(currentType, filterSubGrupo), [currentType, filterSubGrupo]);

  // Inicializar columnas visibles al cambiar el tipo
  useEffect(() => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => {
      defaultVisibleColumns[key] = column.default;
    });
    setVisibleColumns(defaultVisibleColumns);
  }, [availableColumns]);

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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const uniqueGrupos = useMemo(() => getUniqueCategories(products, currentType), [products, currentType]);
  const uniqueSubGrupos = useMemo(() => getUniqueSubGroups(products, currentType), [products, currentType]);
  const uniqueTipos = useMemo(() => getUniqueTipos(products, currentType), [products, currentType]);
  
  const uniqueEstados = useMemo(() => {
    if (currentType === Comanda) return ["Terminado", "Pendiente"];
    return [...new Set(products.map(p => p.Estado).filter(Boolean))];
  }, [products, currentType]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchField = getSearchField(product, currentType);
      const matchesSearch = !debouncedSearchTerm ||
        (searchField && searchField.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      
      const grupoField = getCategoryField(product, currentType);
      const matchesGrupo = !filterGrupo || grupoField === filterGrupo;

      const statusField = getStatusField(product, currentType);
      const matchesStatus = !filterStatus || statusField === filterStatus;
      
      let matchesSubGrupo = true;
      let matchesTipo = true;
      
      if (currentType === MenuItems) {
        matchesSubGrupo = !filterSubGrupo || 
          (product.SUB_GRUPO && product.SUB_GRUPO.includes(filterSubGrupo));
        matchesTipo = !filterTipo || product.TipoES === filterTipo;
      }
      
      return matchesSearch && matchesGrupo && matchesStatus && matchesSubGrupo && matchesTipo;
    });
  }, [products, currentType, debouncedSearchTerm, filterGrupo, filterStatus, filterSubGrupo, filterTipo]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (!sortColumn) return 0;
      
      let aValue;
      let bValue;

      if (currentType === Comanda && (sortColumn === "Dates.isued" || sortColumn === "Pagado.pagadoFull")) {
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

      if (sortColumn === "Rate" || sortColumn === "CC" || sortColumn === "Precio") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortColumn === "Dates" && currentType !== Comanda) { 
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredProducts, sortColumn, sortDirection, currentType]);

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

  return {
    searchTerm, setSearchTerm, debouncedSearchTerm,
    filterGrupo, setFilterGrupo,
    filterSubGrupo, setFilterSubGrupo,
    filterTipo, setFilterTipo,
    filterStatus, setFilterStatus,
    sortColumn, sortDirection, handleSort,
    editingRows, setEditingRows, handleCellEdit,
    openRecipeModals, setOpenRecipeModals,
    recetas, setRecetas,
    showColumnSelector, setShowColumnSelector,
    visibleColumns, availableColumns,
    toggleColumn, toggleAllColumns, resetToDefault,
    uniqueGrupos, uniqueSubGrupos, uniqueTipos, uniqueEstados,
    sortedProducts
  };
};
