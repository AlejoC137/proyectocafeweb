import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MENU, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION } from "../../../redux/actions-types";
import { getAllFromTable, createRecipeForProduct } from "../../../redux/actions";
import RecetasStats from "./RecetasStats";
import MacroAgregador from "./MacroAgregador";

function Recetas() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // Seleccionar los datos del estado de Redux
  const allMenu = useSelector((state) => state.allMenu || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);

  // Estado local para el formulario de creación de recetas
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productType, setProductType] = useState(''); // 'Menu' o 'Produccion'
  const [showMacroAgregador, setShowMacroAgregador] = useState(false);

  // Searchable Dropdown States
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Carga los datos de Redux en paralelo
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(RECETAS_PRODUCCION)),
          dispatch(getAllFromTable(RECETAS_MENU)),
        ]);
      } catch (error) {
        console.error("Error al cargar todos los datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dispatch]); // Usar dispatch como dependencia

  // Memorizar la lista de productos que no tienen una receta asignada
  const productsWithoutRecipe = useMemo(() => {
    const menuItems = allMenu
      .filter((item) => !item.Receta)
      .map((item) => ({ ...item, type: 'Menu' }));
    const produccionItems = allProduccion
      .filter((item) => !item.Receta)
      .map((item) => ({ ...item, type: 'Produccion' }));
    return [...menuItems, ...produccionItems];
    return [...menuItems, ...produccionItems];
  }, [allMenu, allProduccion]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      // If query is empty but we have a selection, show all (or handle behavior preference)
      // Usually cleaner to show all if they just clicked in
      return productsWithoutRecipe;
    }
    const lower = searchTerm.toLowerCase();
    return productsWithoutRecipe.filter(product =>
      (product.NombreES || product.Nombre_del_producto || "").toLowerCase().includes(lower)
    );
  }, [productsWithoutRecipe, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (selectedProductId) {
      setSelectedProductId('');
      setProductType('');
    }
  };

  const selectProduct = (product) => {
    setSelectedProductId(product._id);
    setProductType(product.type);
    setSearchTerm(product.NombreES || product.Nombre_del_producto);
    setIsDropdownOpen(false);
  };

  const handleProductSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selectedProduct = productsWithoutRecipe.find((p) => p._id === selectedId);
      setSelectedProductId(selectedProduct._id);
      setProductType(selectedProduct.type);
    } else {
      setSelectedProductId('');
      setProductType('');
    }
  };

  const handleCreateRecipe = () => {
    if (!selectedProductId || !productType) {
      alert("Por favor, seleccione un producto para asignarle una nueva receta.");
      return;
    }

    const selectedProduct = productsWithoutRecipe.find((p) => p._id === selectedProductId);

    // Determinar las tablas correctas según el tipo de producto
    const recipeTable = productType === 'Menu' ? RECETAS_MENU : RECETAS_PRODUCCION;
    const productTable = productType === 'Menu' ? MENU : PRODUCCION;

    // Datos base para la nueva receta. Puedes expandir esto según tus necesidades.
    const baseRecipeData = {
      legacyName: selectedProduct.NombreES || selectedProduct.Nombre_del_producto,
      autor: "Sistema Automático",
      revisor: "Pendiente",
    };

    // Despachar la acción para crear la receta y enlazarla al producto
    dispatch(createRecipeForProduct(baseRecipeData, selectedProductId, productTable, recipeTable));

    // Limpiar el selector después de la creación
    setSelectedProductId('');
    setProductType('');
    setSearchTerm(''); // Clear search term as well
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando datos...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      <div className="mb-8 p-4 border rounded-lg bg-white shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Crear y Asignar Nueva Receta</h2>
        <div className="flex items-end space-x-4">
          <div className="flex-grow">
            <label htmlFor="product-select" className="block text-sm font-medium text-gray-700">
              Seleccione un Producto (sin receta asignada)
              Seleccione un Producto (sin receta asignada)
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsDropdownOpen(true)}
              // Optional: onBlur could close it, but usually needs delay to allow click
              // keeping it simple for now, relying on selection to close
              />
              {isDropdownOpen && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 max-h-60 overflow-y-auto shadow-lg rounded-md mt-1">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <li
                        key={product._id}
                        onClick={() => selectProduct(product)}
                        className="px-4 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
                      >
                        {product.NombreES || product.Nombre_del_producto} <span className="text-gray-500 text-xs ml-2">({product.type})</span>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-gray-500 text-sm">No se encontraron productos</li>
                  )}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={handleCreateRecipe}
            disabled={!selectedProductId || loading}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Crear y Asignar Receta
          </button>
        </div>
      </div>
      <div className="flex justify-end mb-4 sticky top-4 z-10">
        <button
          onClick={() => setShowMacroAgregador(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
        >
          🔍 Macroagregador de Ingredientes
        </button>
      </div>

      <RecetasStats />
      {showMacroAgregador && <MacroAgregador onClose={() => setShowMacroAgregador(false)} />}
    </div >
  );
}

export default Recetas;