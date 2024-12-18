import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, getRecepie, updateItem } from "../../../redux/actions"; // Importar la acción
import { ProduccionInterna } from "../../../redux/actions-types";

function RecepieOptions({ product , Receta }) {


console.log(Receta);


  const dispatch = useDispatch();


  // Ejecutar getRecepie solo si product.Receta existe


  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const allOptions = [...Items, ...Produccion];

  // Estado inicial para los campos
  const [recetaItems, setRecetaItems] = useState([]);
  const [productoInternoItems, setProductoInternoItems] = useState([]);
  const [legacyName, setLegacyName] = useState(product?.Nombre_del_producto || ""); // Nombre del producto principal
  const [rendimiento, setRendimiento] = useState({ porcion: "", cantidad: "", unidades: "" });
  const [autor, setAutor] = useState("Autor por defecto");
  const [revisor, setRevisor] = useState("Revisor por defecto");

    // Función para mapear los datos de la receta a recetaItems

  // Función para agregar un nuevo ingrediente
  const addIngredient = () => {
    setRecetaItems([...recetaItems, { name: "", item_Id: "", cuantity: "", units: "" }]);
  };

  // Función para manejar cambios en los campos de ingredientes
  const handleIngredientChange = (index, value) => {
    const updatedItems = [...recetaItems];
    updatedItems[index].name = value; // Actualiza el nombre visible del ingrediente

    // Buscar coincidencias basadas en el nombre ingresado
    const matches = allOptions.filter((option) =>
      option.Nombre_del_producto.toLowerCase().includes(value.toLowerCase())
    );

    updatedItems[index].matches = matches; // Guardar las coincidencias para mostrar en el menú desplegable
    setRecetaItems(updatedItems);
  };

  // Función para seleccionar un ingrediente del menú desplegable
  const handleIngredientSelect = (index, selectedOption) => {
    const updatedItems = [...recetaItems];
    updatedItems[index].name = selectedOption.Nombre_del_producto; // Mostrar el nombre seleccionado
    updatedItems[index].item_Id = selectedOption._id; // Guardar el UUID internamente
    updatedItems[index].units = selectedOption.UNIDADES || ""; // Completar las unidades automáticamente
    updatedItems[index].matches = []; // Limpiar las coincidencias después de seleccionar
    setRecetaItems(updatedItems);
  };

  // Función para eliminar un ingrediente
  const handleRemoveIngredient = (index) => {
    const updatedItems = recetaItems.filter((_, idx) => idx !== index);
    setRecetaItems(updatedItems);
  };

  // Guardar la receta
  const handleSaveReceta = async () => {
    try {
      const recetaPayload = {
        _id: crypto.randomUUID(), // Generar UUID único
        legacyName: legacyName || "Sin nombre",
        rendimiento: JSON.stringify(rendimiento),
        autor,
        revisor,
        actualizacion: new Date().toISOString(),
        ...mapItemsToPayload(recetaItems, "item"),
        ...mapItemsToPayload(productoInternoItems, "producto_interno"),
      };

      console.log("Objeto a enviar:", recetaPayload);

      await dispatch(crearItem(recetaPayload, "RecetasProduccion", product._id)); // Llamar a la acción
      await dispatch(updateItem( product._id, { Receta:recetaPayload._id} , ProduccionInterna) ); // Llamar a la acción
      alert("Receta creada correctamente.");
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      alert("Hubo un error al guardar la receta.");
    }
  };

  // Función para mapear items (ingredientes o productos internos) al formato requerido
  const mapItemsToPayload = (items, prefix) => {
    const payload = {};
    items.forEach((item, index) => {
      const idx = index + 1;
      payload[`${prefix}${idx}_Id`] = item.item_Id || null;
      payload[`${prefix}${idx}_Cuantity_Units`] = JSON.stringify({
        metric: { cuantity: item.cuantity || null, units: item.units || null },
      });
    });
    return payload;
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-4">Crear Nueva Receta</h2>

      <input
        type="text"
        placeholder="Nombre de la receta"
        value={legacyName}
        onChange={(e) => setLegacyName(e.target.value)}
        className="w-full p-2 mb-4 border rounded bg-slate-50"
      />

      {/* Rendimiento */}
      <div className="mb-4 bg-slate-50">
        <h3 className="font-semibold mb-2 bg-slate-50">Rendimiento</h3>
        <input
          type="text"
          placeholder="Porción"
          value={rendimiento.porcion}
          onChange={(e) => setRendimiento({ ...rendimiento, porcion: e.target.value })}
          className="p-2 border rounded mr-2 bg-slate-50"
        />
        {product.Receta?product.Rece:'no'}
        <input
          type="number"
          placeholder="Cantidad"
          value={rendimiento.cantidad}
          onChange={(e) => setRendimiento({ ...rendimiento, cantidad: e.target.value })}
          className="p-2 border rounded mr-2 bg-slate-50"
        />
        <input
          type="text"
          placeholder="Unidades"
          value={rendimiento.unidades}
          onChange={(e) => setRendimiento({ ...rendimiento, unidades: e.target.value })}
          className="p-2 border rounded bg-slate-50"
        />
      </div>
     

      {/* Ingredientes */}
      <div className="mb-4 bg-slate-50">
        <h3 className="font-semibold mb-2 bg-slate-50">Ingredientes</h3>
        {recetaItems.map((item, index) => (
          <div key={index} className="flex flex-col mb-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar ingrediente"
                value={item.name}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                className="p-2 border rounded flex-1 bg-slate-50"
              />
              <button
                onClick={() => handleRemoveIngredient(index)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                X
              </button>
            </div>
            {/* Mostrar coincidencias como un menú desplegable */}
            {item.matches && item.matches.length > 0 && (
              <ul className="border rounded bg-white max-h-40 overflow-y-auto">
                {item.matches.map((match) => (
                  <li
                    key={match._id}
                    onClick={() => handleIngredientSelect(index, match)}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {match.Nombre_del_producto}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                placeholder="Cantidad"
                value={item.cuantity}
                onChange={(e) => {
                  const updatedItems = [...recetaItems];
                  updatedItems[index].cuantity = e.target.value;
                  setRecetaItems(updatedItems);
                }}
                className="p-2 border rounded w-1/2 bg-slate-50"
              />
              <input
                type="text"
                placeholder="Unidades"
                value={item.units}
                readOnly
                className="p-2 border rounded w-1/2 bg-slate-50"
              />
            </div>
          </div>
        ))}
        <button onClick={addIngredient} className="px-4 py-2 bg-blue-500 text-white rounded">
          Añadir Ingrediente
        </button>
      </div>
      <div>{Receta ? "Receta cargada" : "No hay receta"}</div>
      {/* Botón Guardar */}
      <button onClick={handleSaveReceta} className="px-4 py-2 bg-green-500 text-white rounded">
        Guardar Receta
      </button>
    </div>
  );
}

export default RecepieOptions;
