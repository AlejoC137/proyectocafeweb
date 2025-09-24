import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem } from "../../redux/actions-Proveedores";
import { MenuItems, ItemsAlmacen } from "../../redux/actions-types";
import { parseNestedObject } from "../../utils/jsonUtils"; // <-- Ahora esta importación funcionará

export const useInventarioState = (products, currentType, availableColumns) => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterEstado, setFilterEstado] = useState("");
    const [sortColumn, setSortColumn] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [editingRows, setEditingRows] = useState({});
    const [openRecipeRows, setOpenRecipeRows] = useState({});
    const [recetas, setRecetas] = useState({});
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({});
    const Proveedores = useSelector((state) => state.Proveedores || []);

    useEffect(() => {
        const defaultVisibleColumns = {};
        Object.entries(availableColumns).forEach(([key, column]) => {
            defaultVisibleColumns[key] = column.default;
        });
        setVisibleColumns(defaultVisibleColumns);
    }, [currentType, availableColumns]);

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };
    
    const handleSaveRow = async (item) => {
        const editedData = editingRows[item._id];
        if (!editedData || Object.keys(editedData).length === 0) return;

        try {
            const updatedFields = { ...editedData };
            if (updatedFields.STOCK) updatedFields.STOCK = JSON.stringify(updatedFields.STOCK);
            if (updatedFields.ALMACENAMIENTO) updatedFields.ALMACENAMIENTO = JSON.stringify(updatedFields.ALMACENAMIENTO);

            if (currentType !== MenuItems) {
                updatedFields.FECHA_ACT = new Date().toISOString().split("T")[0];
            }

            await dispatch(updateItem(item._id, updatedFields, currentType));
            setEditingRows(prev => {
                const newState = { ...prev };
                delete newState[item._id];
                return newState;
            });
        } catch (error) {
            console.error("Error al guardar:", error);
            alert(`Error al guardar: ${error.message}`);
        }
    };

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(product => {
            const name = product.NombreES || product.Nombre_del_producto || '';
            const group = product.GRUPO || '';
            const status = product.Estado || '';
            
            return name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                   (!filterCategory || group === filterCategory) &&
                   (!filterEstado || status === filterEstado);
        });

        if (sortColumn) {
            filtered.sort((a, b) => {
                let aValue = a[sortColumn] || '';
                let bValue = b[sortColumn] || '';
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [products, searchTerm, filterCategory, filterEstado, sortColumn, sortDirection]);

    return {
        searchTerm, setSearchTerm,
        filterCategory, setFilterCategory,
        filterEstado, setFilterEstado,
        sortColumn, sortDirection,
        editingRows, setEditingRows,
        openRecipeRows, setOpenRecipeRows,
        recetas, setRecetas,
        showColumnSelector, setShowColumnSelector,
        visibleColumns, setVisibleColumns,
        handleSort, handleSaveRow,
        filteredAndSortedProducts,
        Proveedores
    };
};