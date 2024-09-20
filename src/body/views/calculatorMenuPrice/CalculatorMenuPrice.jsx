import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllItems, getAllProducts } from "../../../redux/actions";

function CalculatorMenuPrice() {
  const dispatch = useDispatch();
  const [ingredientesCaso, setIngredientesCaso] = useState([]);
  const [porcentajeArbitrario, setPorcentajeArbitrario] = useState(45);
  const [resultado, setResultado] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const ingredientesRef = useSelector(state => state.items);
  const AllProducts = useSelector(state => state.menu);

  useEffect(() => {
    dispatch(getAllItems());
    dispatch(getAllProducts());
  }, [dispatch]);

  const productsWithRecipe = AllProducts.filter(product => product.receta && product.receta.ingredientes);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    const matchedItem = ingredientesRef.find(item => 
      item["Nombre del producto"].toLowerCase() === e.target.value.toLowerCase()
    );
    setSelectedItem(matchedItem || null);
  };

  const handleAddIngredient = () => {
    if (selectedItem) {
      const precioPorUnidad = selectedItem.COSTO / selectedItem.CANTIDAD;
      setIngredientesCaso([
        ...ingredientesCaso,
        { 
          id: selectedItem._id, 
          nombre: selectedItem["Nombre del producto"], 
          cantidad: 0, 
          unidades: selectedItem.UNIDADES,
          costoPorUnidad: precioPorUnidad 
        }
      ]);
      setSearchTerm("");  // Clear the search term after adding
      setSelectedItem(null);  // Clear the selected item
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredientes = ingredientesCaso.map((ingrediente, i) => {
      if (i === index) {
        return {
          ...ingrediente,
          [field]: value
        };
      }
      return ingrediente;
    });

    setIngredientesCaso(updatedIngredientes);
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    const product = productsWithRecipe.find(product => product._id === productId);
    setSelectedProduct(product);

    if (product && product.receta && product.receta.ingredientes) {
      const newIngredients = product.receta.ingredientes.map(ingredient => {
        const matchedItem = ingredientesRef.find(item => item._id === ingredient.id);
        if (matchedItem) {
          const precioPorUnidad = matchedItem.COSTO / matchedItem.CANTIDAD;
          return {
            id: matchedItem._id,
            nombre: matchedItem["Nombre del producto"],
            cantidad: ingredient.cantidad, 
            unidades: matchedItem.UNIDADES,
            costoPorUnidad: precioPorUnidad
          };
        }
        return null;
      }).filter(ingredient => ingredient !== null);

      setIngredientesCaso(prev => [...prev, ...newIngredients]);
    }
  };

  const calcularResultado = () => {
    const res = calcularVFV(porcentajeArbitrario, 4, ingredientesCaso, ingredientesRef);
    setResultado(res);
  };

  const calcularVFV = (porcentajeArbitrario, porciones, ingredientesCaso, ingredientesRef) => {
    let costoTotalPreparacion = 0;

    ingredientesCaso.forEach(ingredienteCaso => {
      const ingredienteRef = ingredientesRef.find(ref => ref._id === ingredienteCaso.id);
      if (ingredienteRef) {
        const precioPorUnidad = ingredienteRef.COSTO / ingredienteRef.CANTIDAD;
        costoTotalPreparacion += (ingredienteCaso.cantidad || 0) * (precioPorUnidad || 0);
      }
    });

    const costoCondimentos = costoTotalPreparacion * 0.05;
    costoTotalPreparacion += costoCondimentos;

    const costoPorcion = costoTotalPreparacion / porciones;

    const ppv = costoTotalPreparacion / (porcentajeArbitrario / 100);

    const indiceInflacionario = 0.10;
    const precioConInflacion = ppv + (ppv * indiceInflacionario);

    const impuestoConsumo = 0.08;
    const valorFinalVenta = precioConInflacion + (precioConInflacion * impuestoConsumo);

    const porcentajeCTPenVFV = (costoTotalPreparacion / valorFinalVenta) * 100;

    return {
      costoTotalPreparacion: Math.round(costoTotalPreparacion),
      ppv: Math.round(ppv),
      valorFinalVenta: Math.round(valorFinalVenta),
      porcentajeCTPenVFV: porcentajeCTPenVFV.toFixed(2)
    };
  };

  const copyToClipboard = () => {
    const textToCopy = `
Costo Total de Preparación (CTP): $${resultado.costoTotalPreparacion.toLocaleString()}
Precio Potencial de Venta (PPV): $${resultado.ppv.toLocaleString()}
Valor Final de Venta (VFV): $${resultado.valorFinalVenta.toLocaleString()}
Porcentaje del CTP en VFV: ${resultado.porcentajeCTPenVFV}%
    `;
    navigator.clipboard.writeText(textToCopy);
    alert('Resultados copiados al portapapeles');
  };

  const filteredSuggestions = searchTerm
    ? ingredientesRef.filter(item =>
        item["Nombre del producto"].toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Calculadora VFV</h1>
      <div className="mb-4">
        <label className="block text-lg mb-2">Porcentaje Arbitrario:</label>
        <input 
          type="number" 
          value={porcentajeArbitrario} 
          onChange={(e) => setPorcentajeArbitrario(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Ingredientes</h2>
        {ingredientesCaso.map((ingrediente, index) => (
          <div key={index} className="flex space-x-4 mb-4 items-center">
            <span className="flex-1">{ingrediente.nombre}</span>
            <input 
              type="number" 
              placeholder="Cantidad"
              value={ingrediente.cantidad || ''}  
              onChange={(e) => handleIngredientChange(index, 'cantidad', e.target.value)}
              className="border rounded p-2 w-1/4"
            />
            <span className="w-1/4 text-center">{ingrediente.unidades}</span>
            <span className="w-1/4 text-center">${ingrediente.costoPorUnidad.toFixed(2)} / {ingrediente.unidades}</span>
          </div>
        ))}
        <button 
          onClick={handleAddIngredient} 
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 mb-4"
          disabled={!selectedItem} 
        >
          Añadir Ingrediente
        </button>
        <div className="mb-4 relative">
          <label className="block text-lg mb-2">Buscar Ingrediente:</label>
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="border rounded p-2 w-full"
          />
          {filteredSuggestions.length > 0 && (
            <ul className="absolute bg-white border border-gray-300 rounded mt-1 w-full max-h-40 overflow-y-auto">
              {filteredSuggestions.map((item) => (
                <li
                  key={item._id}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => {
                    setSearchTerm(item["Nombre del producto"]);
                    setSelectedItem(item);
                  }}
                >
                  {item["Nombre del producto"]}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-lg mb-2">Seleccionar Producto:</label>
          <select 
            onChange={handleProductSelect} 
            className="border rounded p-2 w-full"
            defaultValue=""
          >
            <option value="" disabled>Selecciona un producto</option>
            {productsWithRecipe.map(product => (
              <option key={product._id} value={product._id}>{product.NombreES}</option>
            ))}
          </select>
        </div>
      </div>

      <button 
        onClick={calcularResultado} 
        className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 mt-4"
      >
        Calcular VFV
      </button>

      {resultado && (
        <div className="mt-6 w-full">
          <table className="table-auto w-full text-left border-collapse">
            <tbody>
              <tr>
                <td className="px-4 py-2 font-bold">Costo Total de Preparación:</td>
                <td className="px-4 py-2">$ {resultado.costoTotalPreparacion.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold">Precio Potencial de Venta (PPV):</td>
                <td className="px-4 py-2">$ {resultado.ppv.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold">Valor Final de Venta (VFV):</td>
                <td className="px-4 py-2">$ {resultado.valorFinalVenta.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-bold">Porcentaje del CTP en VFV:</td>
                <td className="px-4 py-2">{resultado.porcentajeCTPenVFV}%</td>
              </tr>
            </tbody>
          </table>
          <button 
            onClick={copyToClipboard} 
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Copiar al portapapeles
          </button>
        </div>
      )}
    </div>
  );
}

export default CalculatorMenuPrice;
