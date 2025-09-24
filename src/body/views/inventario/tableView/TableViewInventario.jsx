// src/components/inventario/tableView/TableViewInventario.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { deleteItem, updateItem, getRecepie } from "../../../redux/actions-Proveedores";
import { MenuItems, ItemsAlmacen, ProduccionInterna } from "../../../../redux/actions-types";

// Importa los nuevos subcomponentes
import { InventarioFilterBar } from "./InventarioFilterBar";
import { InventarioTableHead } from "./InventarioTableHead";
import { InventarioTableBody } from "./InventarioTableBody";
import { ColumnSelectorModal } from "./ColumnSelectorModal";
import { InventarioSummary } from "./InventarioSummary";

export function TableViewInventario({ products, currentType }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const Proveedores = useSelector((state) => state.Proveedores || []);

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

  const statusCycleOptions = useMemo(() => {
    if (currentType === MenuItems) return ['Activo', 'Inactivo', 'Suspendido'];
    if (currentType === ProduccionInterna) return ['PP', 'Activo', 'Inactivo'];
    return ['PC', 'Activo', 'Inactivo'];
  }, [currentType]);

  const getAvailableColumns = () => { /* ... Tu lógica de getAvailableColumns ... */ };
  const availableColumns = useMemo(getAvailableColumns, [currentType]);
  
  const tableHeaders = useMemo(() => {
    return Object.entries(availableColumns).map(([key, value]) => ({
      key,
      label: value.label,
      sortKey: value.key, // La clave real del dato para ordenar
      fixed: !!value.fixed,
    }));
  }, [availableColumns]);
  
  useEffect(() => {
    const defaultVisible = {};
    tableHeaders.forEach(header => {
      defaultVisible[header.key] = availableColumns[header.key]?.default ?? true;
    });
    setVisibleColumns(defaultVisible);
  }, [currentType, tableHeaders, availableColumns]);
  
  const parseNestedObject = (obj) => { /* ... Tu lógica de parseNestedObject ... */ };
  
  const filteredProducts = useMemo(() => { /* ... Tu lógica de filteredProducts ... */ }, [products, searchTerm, filterCategory, filterEstado, filterAlmacenamiento, filterProveedor]);
  const sortedProducts = useMemo(() => { /* ... Tu lógica de sortedProducts ... */ }, [filteredProducts, sortColumn, sortDirection, Proveedores]);
  
  const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.GRUPO).filter(Boolean))], [products]);
  const uniqueEstados = useMemo(() => [...new Set(products.map(p => p.Estado).filter(Boolean))], [products]);
  const uniqueAlmacenamiento = useMemo(() => { /* ... Tu lógica para uniqueAlmacenamiento ... */ }, [products]);
  
  const handleSort = (columnKey) => { /* ... Tu lógica de handleSort ... */ };
  const handleCellEdit = (itemId, field, value, subField = null) => { /* ... Tu lógica de handleCellEdit ... */ };
  const validateRowData = (data, type) => { /* ... Tu lógica de validateRowData ... */ };
  const handleSaveRow = async (item, overrideData = null) => { /* ... Tu lógica de handleSaveRow ... */ };
  const handleDelete = async (item) => { /* ... Tu lógica de handleDelete ... */ };
  const handleRecipeToggle = async (productId, recetaId = null) => { /* ... */ };
  const handleCreateReceta = async (recetaData, productId) => { /* ... */ };
  const handleSaveReceta = async (recetaData) => { /* ... */ };
  const toggleColumn = (key) => setVisibleColumns(p => ({ ...p, [key]: !p[key] }));
  const toggleAllColumns = (show) => { /* ... */ };
  const resetToDefault = () => { /* ... */ };
  
  const handlers = { handleCellEdit, handleSaveRow, handleDelete, handleRecipeToggle, handleCreateReceta, handleSaveReceta };

  return (
    <div className="w-full">
      <InventarioFilterBar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        uniqueCategories={uniqueCategories}
        filterEstado={filterEstado} setFilterEstado={setFilterEstado}
        uniqueEstados={uniqueEstados}
        filterAlmacenamiento={filterAlmacenamiento} setFilterAlmacenamiento={setFilterAlmacenamiento}
        uniqueAlmacenamiento={uniqueAlmacenamiento}
        currentType={currentType}
        filterProveedor={filterProveedor} setFilterProveedor={setFilterProveedor}
        Proveedores={Proveedores}
        setShowColumnSelector={setShowColumnSelector}
        sortedProductsCount={sortedProducts.length}
        totalProductsCount={products.length}
      />
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full bg-white">
          <InventarioTableHead
            headers={tableHeaders}
            visibleColumns={visibleColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
          />
          <InventarioTableBody
            sortedProducts={sortedProducts}
            currentType={currentType}
            visibleColumns={visibleColumns}
            showEdit={showEdit}
            editingRows={editingRows}
            openRecipeRows={openRecipeRows}
            recetas={recetas}
            Proveedores={Proveedores}
            statusCycleOptions={statusCycleOptions}
            handlers={handlers}
          />
        </table>
      </div>
      <ColumnSelectorModal
        show={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        availableColumns={availableColumns}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        toggleAllColumns={toggleAllColumns}
        resetToDefault={resetToDefault}
      />
      <InventarioSummary sortedProducts={sortedProducts} uniqueCategories={uniqueCategories} />
    </div>
  );
}