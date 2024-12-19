import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, getRecepie, trimRecepie, updateItem } from "../../../redux/actions";
import { ProduccionInterna } from "../../../redux/actions-types";

function RecepieOptions({ product, Receta }) {
  const dispatch = useDispatch();
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);
  const allOptions = [...Items, ...Produccion];

  const [recetaItems, setRecetaItems] = useState([]);
  const [productoInternoItems, setProductoInternoItems] = useState([]);
  const [legacyName, setLegacyName] = useState(product?.Nombre_del_producto || "");
  const [rendimiento, setRendimiento] = useState({ porcion: "", cantidad: "", unidades: "" });
  const [autor, setAutor] = useState("Autor por defecto");
  const [revisor, setRevisor] = useState("Revisor por defecto");

  useEffect(() => {
    if (Receta) {
      loadRecepie();
    }
  }, [Receta]);

  const loadRecepie = async () => {
    const recepieData = await getRecepie(Receta._id, "RecetasProduccion");
    if (recepieData) {
      const trimmedRecepie = trimRecepie(allOptions, recepieData);
      setRecetaItems(trimmedRecepie);
      setLegacyName(recepieData.legacyName || "");
      setRendimiento(JSON.parse(recepieData.rendimiento) || { porcion: "", cantidad: "", unidades: "" });
      setAutor(recepieData.autor || "Autor por defecto");
      setRevisor(recepieData.revisor || "Revisor por defecto");
    }
  };

  const addIngredient = () => {
    if (showEdit) {
      setRecetaItems([...recetaItems, { name: "", item_Id: "", cuantity: "", units: "" }]);
    }
  };

  const handleIngredientChange = (index, value) => {
    if (showEdit) {
      const updatedItems = [...recetaItems];
      updatedItems[index].name = value;
      const matches = allOptions.filter((option) =>
        option.Nombre_del_producto.toLowerCase().includes(value.toLowerCase())
      );
      updatedItems[index].matches = matches;
      setRecetaItems(updatedItems);
    }
  };

  const handleIngredientSelect = (index, selectedOption) => {
    if (showEdit) {
      const updatedItems = [...recetaItems];
      updatedItems[index].name = selectedOption.Nombre_del_producto;
      updatedItems[index].item_Id = selectedOption._id;
      updatedItems[index].units = selectedOption.UNIDADES || "";
      updatedItems[index].matches = [];
      setRecetaItems(updatedItems);
    }
  };

  const handleRemoveIngredient = (index) => {
    if (showEdit) {
      const updatedItems = recetaItems.filter((_, idx) => idx !== index);
      const reorganizedItems = reorganizeRecepie(updatedItems, recetaItems.length);
      setRecetaItems(reorganizedItems);
    }
  };

  // Function to reorganize the recipe ingredients
  const reorganizeRecepie = (recepie, originalLength) => {
    const updatedRecepie = [...recepie];
    for (let i = 0; i < originalLength; i++) {
      if (!updatedRecepie[i]) {
        updatedRecepie.push({ name: "", item_Id: "", cuantity: "", units: "" });
      }
    }
    return updatedRecepie;
  };

  const handleSaveReceta = async () => {
    if (showEdit) {
      try {
        const recetaPayload = {
          _id: Receta ? Receta._id : crypto.randomUUID(),
          legacyName: legacyName || "Sin nombre",
          rendimiento: JSON.stringify(rendimiento),
          autor,
          revisor,
          actualizacion: new Date().toISOString(),
          ...mapItemsToPayload(recetaItems, "item"),
          ...mapItemsToPayload(productoInternoItems, "producto_interno"),
        };

        console.log("Objeto a enviar:", recetaPayload);

        if (Receta) {
          // Update existing recipe
          await dispatch(updateItem(Receta._id, recetaPayload, "RecetasProduccion"));
        } else {
          // Create new recipe
          await dispatch(crearItem(recetaPayload, "RecetasProduccion", product._id));
        }

        await dispatch(updateItem(product._id, { Receta: recetaPayload._id }, ProduccionInterna));
        alert("Receta guardada correctamente.");
      } catch (error) {
        console.error("Error al guardar la receta:", error);
        alert("Hubo un error al guardar la receta.");
      }
    }
  };

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
      <h2 className="text-lg font-bold mb-4">{showEdit === false ? 'Receta:':"Editar Receta:"}</h2>
      <input
        type="text"
        placeholder="Nombre de la receta"
        value={legacyName}
        onChange={(e) => showEdit && setLegacyName(e.target.value)}
        className="w-full p-2 mb-4 border rounded bg-slate-50"
        readOnly={!showEdit}
      />
      <div className="mb-4 bg-slate-50">
        <h3 className="font-semibold mb-2 bg-slate-50">Rendimiento</h3>
        <input
          type="text"
          placeholder="Porción"
          value={rendimiento.porcion}
          onChange={(e) => showEdit && setRendimiento({ ...rendimiento, porcion: e.target.value })}
          className="p-2 border rounded mr-2 bg-slate-50"
          readOnly={!showEdit}
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={rendimiento.cantidad}
          onChange={(e) => showEdit && setRendimiento({ ...rendimiento, cantidad: e.target.value })}
          className="p-2 border rounded mr-2 bg-slate-50"
          readOnly={!showEdit}
        />
        <input
          type="text"
          placeholder="Unidades"
          value={rendimiento.unidades}
          onChange={(e) => showEdit && setRendimiento({ ...rendimiento, unidades: e.target.value })}
          className="p-2 border rounded bg-slate-50"
          readOnly={!showEdit}
        />
      </div>
      <div className="mb-4 bg-slate-50">
        <h3 className="font-semibold mb-2 bg-slate-50">Ingredientes</h3>
        {recetaItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2 mb-2 bg-slate-50">
            <input
              type="text"
              placeholder="Buscar ingrediente"
              value={item.name}
              onChange={(e) => handleIngredientChange(index, e.target.value)}
              className="p-2 border rounded flex-1 w-1/3 bg-slate-50"
              readOnly={!showEdit}
            />
            <input
              type="number"
              placeholder="Cantidad"
              value={item.cuantity}
              onChange={(e) => {
                if (showEdit) {
                  const updatedItems = [...recetaItems];
                  updatedItems[index].cuantity = e.target.value;
                  setRecetaItems(updatedItems);
                }
              }}
              className="p-2 border rounded w-1/6 bg-slate-50"
              readOnly={!showEdit}
            />
            <input
              type="text"
              placeholder="Unidades"
              value={item.units}
              readOnly
              className="p-2 border rounded w-1/6 bg-slate-50"
            />
            {showEdit && (
              <button
                onClick={() => handleRemoveIngredient(index)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                X
              </button>
            )}
          </div>
        ))}
        {showEdit && (
          <button onClick={addIngredient} className="px-4 py-2 bg-blue-500 text-white rounded">
            Añadir Ingrediente
          </button>
        )}
      </div>
      {showEdit && (
        <button onClick={handleSaveReceta} className="px-4 py-2 bg-green-500 text-white rounded">
          Guardar Receta
        </button>
      )}
    </div>
  );
}

export default RecepieOptions;

