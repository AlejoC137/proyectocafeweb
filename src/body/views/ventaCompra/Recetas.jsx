import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MENU, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION } from "../../../redux/actions-types";
import { getAllFromTable, createRecipeForProduct } from "../../../redux/actions"; // Importar la nueva acción
import RecetasStats from "./RecetasStats";

function Recetas() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // Seleccionar los datos del estado de Redux
  const allMenu = useSelector((state) => state.allMenu || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);

  // Estado local para el formulario de creación de recetas
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productType, setProductType] = useState(''); // 'Menu' o 'Produccion'

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
  }, [allMenu, allProduccion]);

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
            </label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={handleProductSelect}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">-- Seleccionar un producto --</option>
              {productsWithoutRecipe.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.NombreES || product.Nombre_del_producto} ({product.type})
                </option>
              ))}
            </select>
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
      <RecetasStats />
    </div>
  );
}

export default Recetas;