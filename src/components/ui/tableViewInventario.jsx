import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem, getRecepie } from "../../redux/actions-Proveedores";
import { ESTATUS, BODEGA, CATEGORIES, SUB_CATEGORIES, ItemsAlmacen, ProduccionInterna, MenuItems, unidades } from "../../redux/actions-types";
import { ChevronUp, ChevronDown, Filter, Search, Save } from "lucide-react";
import { parseCompLunch } from "../../utils/jsonUtils";
import CuidadoVariations from "./CuidadoVariations";

export function TableViewInventario({ products, currentType }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const Proveedores = useSelector((state) => state.Proveedores || []);

  const [editableProducts, setEditableProducts] = useState([]);

  // Estados para filtros, ordenamiento y UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterAlmacenamiento, setFilterAlmacenamiento] = useState("");
  const [filterProveedor, setFilterProveedor] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [recetas, setRecetas] = useState({});
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Función para parsear objetos anidados de forma segura
  const parseNestedObject = (obj, fallback = {}) => {
    try {
      if (typeof obj === "string") {
        if (!obj.trim()) return fallback;
        return JSON.parse(obj);
      }
      return obj || fallback;
    } catch (e) {
      return fallback;
    }
  };
  
  useEffect(() => {
    // Clona y prepara los productos para la edición, asegurando que los objetos anidados existan
    const clonedProducts = products.map(p => {
        const product = { ...p };
        product.STOCK = parseNestedObject(p.STOCK, { minimo: 0, maximo: 0, actual: 0 });
        product.ALMACENAMIENTO = parseNestedObject(p.ALMACENAMIENTO, { ALMACENAMIENTO: '', BODEGA: '' });
        return product;
    });
    setEditableProducts(clonedProducts);
  }, [products]);

  // Maneja los cambios en los inputs de la tabla cuando está en modo edición
  const handleChange = (index, name, value) => {
    const updatedProducts = [...editableProducts];
    const productToUpdate = updatedProducts[index];
    if (!productToUpdate) return;
    const keys = name.split(".");

    if (keys.length > 1) {
      productToUpdate[keys[0]] = {
        ...(productToUpdate[keys[0]] || {}),
        [keys[1]]: value,
      };
    } else {
      productToUpdate[name] = value;
    }
    setEditableProducts(updatedProducts);
  };

  // Actualización Optimista: cambia el estado en la UI instantáneamente y luego envía la petición
  const handleStatusChange = async (productId, newStatus) => {
    const originalProductsState = [...editableProducts];
    const productIndex = originalProductsState.findIndex(p => p._id === productId);
    if (productIndex === -1) return;

    // 1. Actualiza la UI de inmediato
    const newProductsState = originalProductsState.map(p => 
        p._id === productId ? { ...p, Estado: newStatus } : p
    );
    setEditableProducts(newProductsState);

    // 2. Envía la petición al servidor en segundo plano
    const payload = { Estado: newStatus };
    if (currentType !== MenuItems) {
        payload.FECHA_ACT = new Date().toISOString().split("T")[0];
    }
    
    try {
        await dispatch(updateItem(productId, payload, currentType));
    } catch (error) {
        // 3. Si falla, revierte el cambio y notifica al usuario.
        console.error("Error al actualizar el estado:", error);
        alert("❌ Falló la actualización. Revirtiendo el cambio.");
        setEditableProducts(originalProductsState);
    }
  };

  // Guarda todos los cambios realizados en la tabla
  const handleSaveAll = async () => {
    const originalProductsMap = new Map(products.map(p => [p._id, p]));
    const updatePromises = [];

    editableProducts.forEach(editedProduct => {
      const originalProduct = originalProductsMap.get(editedProduct._id);
      if (originalProduct && JSON.stringify(editedProduct) !== JSON.stringify(originalProduct)) {
        const payload = { ...editedProduct };
        if (payload.STOCK) payload.STOCK = JSON.stringify(payload.STOCK);
        if (payload.ALMACENAMIENTO) payload.ALMACENAMIENTO = JSON.stringify(payload.ALMACENAMIENTO);
        delete payload._id;
        delete payload.__v;

        if (currentType !== MenuItems) {
          payload.FECHA_ACT = new Date().toISOString().split("T")[0];
        }
        updatePromises.push(dispatch(updateItem(editedProduct._id, payload, currentType)));
      }
    });

    if (updatePromises.length > 0) {
      try {
        await Promise.all(updatePromises);
        alert(`✅ ${updatePromises.length} ítem(s) guardado(s) correctamente.`);
      } catch (error) {
        console.error("Error al guardar los cambios:", error);
        alert("❌ Ocurrió un error al guardar los cambios.");
      }
    } else {
      alert("ℹ️ No hay cambios para guardar.");
    }
  };

  // Define todas las columnas disponibles y su configuración según el tipo de inventario
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
          cuidadoES: { label: "Cuidado ES", key: "CuidadoES", default: true },
          cuidadoEN: { label: "Cuidado EN", key: "CuidadoEN", default: true },
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
          cantidad: { label: "Cantidad", key: "CANTIDAD", default: false },
          unidades: { label: "Unidades", key: "UNIDADES", default: false },
          costo: { label: "Costo", key: "COSTO", default: false },
          precioUnitario: { label: "Precio Unit.", key: "precioUnitario", default: false },
          stock: { label: "Stock", key: "STOCK", default: false },
          almacenamiento: { label: "Almacenamiento", key: "ALMACENAMIENTO", default: false },
          grupo: { label: "Grupo", key: "GRUPO", default: false },
          merma: { label: "Merma %", key: "Merma", default: false },
          proveedor: { label: "Proveedor", key: "Proveedor", default: false },
          estado: { label: "Estado", key: "Estado", default: true },
          fechaActualizacion: { label: "Última Act.", key: "FECHA_ACT", default: false },
          acciones: { label: "Acciones", key: "acciones", default: false, fixed: false }
        };
      case ProduccionInterna:
        return {
          nombre: { label: "Nombre", key: "Nombre_del_producto", default: true },
          cantidad: { label: "Cantidad", key: "CANTIDAD", default: false },
          unidades: { label: "Unidades", key: "UNIDADES", default: false },
          costo: { label: "Costo", key: "COSTO", default: false },
          precioUnitario: { label: "Precio Unit.", key: "precioUnitario", default: false },
          stock: { label: "Stock", key: "STOCK", default: false },
          almacenamiento: { label: "Almacenamiento", key: "ALMACENAMIENTO", default: false },
          grupo: { label: "Grupo", key: "GRUPO", default: false },
          merma: { label: "Merma %", key: "Merma", default: false },
          estado: { label: "Estado", key: "Estado", default: true },
          fechaActualizacion: { label: "Última Act.", key: "FECHA_ACT", default: false },
          acciones: { label: "Acciones", key: "acciones", default: false, fixed: true }
        };
      default:
        return {};
    }
  };

  const availableColumns = useMemo(() => getAvailableColumns(), [currentType]);

  useEffect(() => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => {
      defaultVisibleColumns[key] = column.default;
    });
    setVisibleColumns(defaultVisibleColumns);
  }, [availableColumns]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSelector && !event.target.closest('.column-selector-container')) {
        setShowColumnSelector(false);
      }
    };
    if (showColumnSelector) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSelector]);

  const toggleColumn = (columnKey) => setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));

  const toggleAllColumns = (show) => {
    const newVisibleColumns = {};
    Object.keys(availableColumns).forEach(key => { newVisibleColumns[key] = show; });
    setVisibleColumns(newVisibleColumns);
  };

  const resetToDefault = () => {
    const defaultVisibleColumns = {};
    Object.entries(availableColumns).forEach(([key, column]) => { defaultVisibleColumns[key] = column.default; });
    setVisibleColumns(defaultVisibleColumns);
  };

  const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.GRUPO).filter(Boolean))], [products]);
  const uniqueEstados = useMemo(() => [...new Set(products.map(p => p.Estado).filter(Boolean))], [products]);
  const uniqueAlmacenamiento = useMemo(() => [...new Set(products.map(p => parseNestedObject(p.ALMACENAMIENTO)?.ALMACENAMIENTO).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => {
    return (editableProducts || []).filter(product => {
      const searchField = currentType === MenuItems
        ? `${product.NombreES || ""} ${product.NombreEN || ""}`
        : product.Nombre_del_producto || "";
      
      const matchesSearch = !searchTerm || searchField.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || product.GRUPO === filterCategory;
      const matchesEstado = !filterEstado || product.Estado === filterEstado;

      let matchesAlmacenamiento = true;
      if (filterAlmacenamiento && currentType !== MenuItems) {
        const almacen = parseNestedObject(product.ALMACENAMIENTO);
        matchesAlmacenamiento = almacen?.ALMACENAMIENTO === filterAlmacenamiento;
      }
      
      let matchesProveedor = true;
      if (filterProveedor && currentType === ItemsAlmacen) {
        matchesProveedor = product.Proveedor === filterProveedor;
      }

      return matchesSearch && matchesCategory && matchesEstado && matchesAlmacenamiento && matchesProveedor;
    });
  }, [editableProducts, searchTerm, filterCategory, filterEstado, filterAlmacenamiento, filterProveedor, currentType]);

  const sortedProducts = useMemo(() => {
    const sortable = [...filteredProducts];
    sortable.sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        if (sortColumn === "STOCK") {
            aValue = parseNestedObject(a.STOCK, { actual: 0 }).actual;
            bValue = parseNestedObject(b.STOCK, { actual: 0 }).actual;
        } else if (sortColumn === "Proveedor") {
            const provA = Proveedores.find(p => p._id === a.Proveedor)?.Nombre_Proveedor || '';
            const provB = Proveedores.find(p => p._id === b.Proveedor)?.Nombre_Proveedor || '';
            aValue = provA;
            bValue = provB;
        }

        if (typeof aValue === 'string' && !isNaN(parseFloat(aValue)) && typeof bValue === 'string' && !isNaN(parseFloat(bValue))) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else {
            aValue = String(aValue || '').toLowerCase();
            bValue = String(bValue || '').toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    return sortable;
  }, [filteredProducts, sortColumn, sortDirection, Proveedores]);

  const handleSort = (column) => {
    setSortDirection(prev => (sortColumn === column && prev === 'asc' ? 'desc' : 'asc'));
    setSortColumn(column);
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${item.Nombre_del_producto || item.NombreES}"?`)) {
      await dispatch(deleteItem(item._id, currentType));
    }
  };

  const StatusButtonGroup = ({ item }) => {
    const statuses = ESTATUS.filter(s => {
      if (currentType === "ProduccionInterna" && s === "PC") return false;
      if (currentType === "ItemsAlmacen" && s === "PP") return false;
      return true;
    });
  
    const getStatusClass = (status, isActive) => {
        if (isActive) {
            return ((status === 'OK'  ? "bg-green-500 text-white" : "bg-red-500 text-white") ||( (status === 'PC' || status === 'PP')? "bg-red-500 text-white" : "bg-red-500 text-white"))
        }
        return "bg-gray-200 text-gray-700 hover:bg-gray-300";
    };

    return (
        <div className="flex gap-1">
            {statuses.map((status) => (
                <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(item._id, status)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${getStatusClass(status, item.Estado === status)}`}
                >
                    {status}
                </button>
            ))}
        </div>
    );
  };

  const renderEditableCell = (index, name, type = "text", options = []) => {
    const item = editableProducts[index];
    if (!item) return null;

    let currentValue = '';
    const keys = name.split('.');
    if (keys.length > 1) {
        currentValue = item[keys[0]] ? (item[keys[0]][keys[1]] ?? '') : '';
    } else {
        currentValue = item[name] ?? '';
    }
    
    const props = {
      value: currentValue,
      onChange: (e) => handleChange(index, name, type === 'checkbox' ? e.target.checked : e.target.value),
      className: "w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900"
    };

    if (type === 'checkbox') {
      return <input type="checkbox" checked={!!currentValue} onChange={props.onChange} className="h-4 w-4"/>
    }

    if (type === "select") {
      return (
        <select {...props}>
          <option value="">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
      );
    }
    
    return <input type={type} {...props} step={type === "number" ? "0.01" : undefined} />;
  };

  const renderTableHeaders = () => Object.entries(availableColumns)
    .filter(([key]) => visibleColumns[key])
    .map(([key, col]) => (
      <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
        <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-blue-600">
          {col.label} <SortIcon column={col.key} />
        </button>
      </th>
    ));
  
  const renderTableRows = () => {
    if (!sortedProducts) return null;

    return sortedProducts.map((item, index) => {
      const originalIndex = editableProducts.findIndex(p => p._id === item._id);
      if (originalIndex === -1) return null;

      const renderCellContent = (key) => {
        const col = availableColumns[key];
        switch (key) {
          case 'nombre':
          case 'nombreES':
          case 'nombreEN':
          case 'descripcionES':
          case 'descripcionEN':
          case 'tipoES':
          case 'tipoEN':
          case 'subTipoES':
          case 'subTipoEN':
          case 'dietaES':
          case 'dietaEN':
            return showEdit ? renderEditableCell(originalIndex, col.key) : <span className={key.includes('nombre') ? "font-medium text-blue-800" : ""}>{item[col.key]}</span>;
          
          case 'precio':
          case 'costo':
          case 'cantidad':
          case 'precioUnitario':
          case 'merma':
          case 'order':
            return showEdit ? renderEditableCell(originalIndex, col.key, "number") : <span>{item[col.key]}</span>;

          case 'cuidadoES':
          case 'cuidadoEN':
            return showEdit ? <CuidadoVariations isEnglish={key.includes('EN')} viewName={"Inventario"} product={item} /> : <span>{item[col.key]}</span>;
            
          case 'grupo':
            return showEdit ? renderEditableCell(originalIndex, col.key, "select", CATEGORIES.map(c => ({value: c, label: c}))) : <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO}</span>;

          case 'subGrupo':
            return showEdit ? renderEditableCell(originalIndex, col.key, "select", SUB_CATEGORIES.map(c => ({value: c, label: c}))) : <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.SUB_GRUPO}</span>;

          case 'proveedor':
            return showEdit ? renderEditableCell(originalIndex, col.key, "select", Proveedores.map(p => ({value: p._id, label: p.Nombre_Proveedor}))) : <span>{Proveedores.find(p => p._id === item.Proveedor)?.Nombre_Proveedor || 'N/A'}</span>;
          
          case 'unidades':
            return showEdit ? renderEditableCell(originalIndex, col.key, "select", unidades.map(u => ({value: u, label: u}))) : <span>{item[col.key]}</span>;

          case 'estado':
            return showEdit ? <StatusButtonGroup item={item} /> : <span className={`px-2 py-1 rounded-full text-xs ${item.Estado === 'OK' || item.Estado === 'PC' || item.Estado === 'PP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.Estado}</span>;
          
          case 'stock':
            return (
              <div className="space-y-1">
                <div>Min: {showEdit ? renderEditableCell(originalIndex, "STOCK.minimo", "number") : <span>{item.STOCK?.minimo || 0}</span>}</div>
                <div>Max: {showEdit ? renderEditableCell(originalIndex, "STOCK.maximo", "number") : <span>{item.STOCK?.maximo || 0}</span>}</div>
                <div>Act: {showEdit ? renderEditableCell(originalIndex, "STOCK.actual", "number") : <span className="font-bold">{item.STOCK?.actual || 0}</span>}</div>
              </div>
            );
          
          case 'almacenamiento':
            return (
              <div className="space-y-1">
                <div>Alm: {showEdit ? renderEditableCell(originalIndex, "ALMACENAMIENTO.ALMACENAMIENTO", "select", BODEGA.map(b => ({value: b, label: b}))) : <span>{item.ALMACENAMIENTO?.ALMACENAMIENTO}</span>}</div>
                <div>Bod: {showEdit ? renderEditableCell(originalIndex, "ALMACENAMIENTO.BODEGA", "select", BODEGA.map(b => ({value: b, label: b}))) : <span>{item.ALMACENAMIENTO?.BODEGA}</span>}</div>
              </div>
            );

          case 'print':
            return showEdit ? renderEditableCell(originalIndex, col.key, 'checkbox') : <span>{item.PRINT ? 'Sí' : 'No'}</span>;

          case 'foto':
            return item.Foto ? <a href={item.Foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver</a> : <span>No</span>;
            
          case 'composicionAlmuerzo':
            const lunchData = parseCompLunch(item.Comp_Lunch);
            return lunchData ? (
              <div>
                <div>{lunchData.entrada?.nombre}</div>
                <div>{lunchData.proteina?.nombre}</div>
                <div>{lunchData.carbohidrato?.nombre}</div>
              </div>
            ) : <span>N/A</span>;
            
          case 'fechaActualizacion':
            return <span>{item.FECHA_ACT}</span>;
            
          case 'acciones':
            return (
              <div className="flex gap-1">
                <Button onClick={() => handleDelete(item)} className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 text-xs h-6">🗑️</Button>
                {(currentType === ProduccionInterna || currentType === MenuItems) && item.Receta && (
                  <Button asChild className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6">
                    <a 
                      href={`/receta/${item.Receta}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      // APLICANDO LAS CLASES DIRECTAMENTE AL ENLACE PARA ELIMINAR CUALQUIER BORDE DE FOCO
                      className="flex items-center justify-center w-8  focus:outline-none focus-visible:ring-0" 
                    >
                      📕
                    </a>
                  </Button>
                )}
              </div>
            );
          default:
            return showEdit ? renderEditableCell(originalIndex, col.key) : <span>{item[col.key]}</span>;
        }
      };

      return (
        <tr key={item._id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
          {Object.keys(availableColumns)
            .filter(key => visibleColumns[key])
            .map(key => (
              <td key={key} className="px-3 py-2 text-xs align-top">
                {renderCellContent(key)}
              </td>
            ))}
        </tr>
      );
    });
  };

  return (
    <div className="w-full">
        {/* Panel de filtros y acciones */}
        <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500 bg-gray-50" />
                    <input type="text" placeholder="Buscar... " value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border bg-gray-50 border-gray-300 rounded px-3 py-1 text-sm" />
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border  bg-gray-50 border-gray-300 rounded px-3 py-1 text-sm">
                    <option value="">Todos los grupos</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="border bg-gray-50 border-gray-300 rounded px-3 py-1 text-sm">
                    <option  className="bg-gray-50" value="">Todos los estados</option>
                    {uniqueEstados.map(est => <option key={est} value={est}>{est}</option>)}
                </select>
                {currentType !== MenuItems && (
                     <select value={filterAlmacenamiento} onChange={(e) => setFilterAlmacenamiento(e.target.value)} className=" bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm">
                        <option value="">Todo Almacenamiento</option>
                        {uniqueAlmacenamiento.map(alm => <option key={alm} value={alm}>{alm}</option>)}
                    </select>
                )}
                 {currentType === ItemsAlmacen && (
                    <select value={filterProveedor} onChange={(e) => setFilterProveedor(e.target.value)} className=" bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm">
                        <option value="">Todos los proveedores</option>
                        {Proveedores.map(prov => <option key={prov._id} value={prov._id}>{prov.Nombre_Proveedor}</option>)}
                    </select>
                )}
                <Button onClick={() => setShowColumnSelector(true)} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm">📋 Columnas</Button>

                <div className="flex-grow"></div>
                
                {showEdit && (
                    <Button onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                    </Button>
                )}
            </div>
        </div>

        {/* Contenedor de la Tabla */}
        <div className="overflow-x-auto border bg-gray-50 border-gray-200 rounded-lg">
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

        {/* Modal para seleccionar columnas */}
        {showColumnSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 column-selector-container">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Personalizar Columnas</h3>
                        <button onClick={() => setShowColumnSelector(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <Button onClick={() => toggleAllColumns(true)} variant="outline">Mostrar Todas</Button>
                        <Button onClick={() => toggleAllColumns(false)} variant="outline">Ocultar Todas</Button>
                        <Button onClick={resetToDefault} variant="outline">Por Defecto</Button>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3">
                        {Object.entries(availableColumns).map(([key, column]) => (
                            <div key={key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`col-${key}`}
                                    checked={visibleColumns[key] || false}
                                    onChange={() => !column.fixed && toggleColumn(key)}
                                    disabled={column.fixed}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={`col-${key}`} className={`ml-2 text-sm ${column.fixed ? 'text-gray-500' : 'text-gray-700'}`}>
                                    {column.label} {column.fixed && '(fija)'}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}