import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, getRecepie, trimRecepie, updateItem } from "../../../redux/actions.js";
import { ProduccionInterna , MENU } from "../../../redux/actions-types.js";
import { recetaMariaPaula } from "../../../redux/calcularReceta.jsx";

function RecepieOptionsMenu({ product, Receta , currentType, onSaveReceta, onCreateReceta }) {
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
  const [totalIngredientes, setTotalIngredientes] = useState(0);
  const [proces, setProces] = useState(Array(20).fill("")); // Initialize 20 empty proces
  const [activeTab, setActiveTab] = useState("receta"); // State to manage active tab

  useEffect(() => {
    
    
    if (Receta && currentType === MENU) {
      loadRecepie('Recetas');
    } 
   
  }, [Receta]);

  const loadRecepie = async (source) => {
    const recepieData = await getRecepie(Receta._id, source);
    if (recepieData) {
      const trimmedRecepie = trimRecepie(allOptions, recepieData);
      setRecetaItems(trimmedRecepie.filter(item => item.source === 'Items'));
      setProductoInternoItems(trimmedRecepie.filter(item => item.source === 'Produccion'));
      setLegacyName(recepieData.legacyName || "");
      setRendimiento(JSON.parse(recepieData.rendimiento) || { porcion: "", cantidad: "", unidades: "" });
      setAutor(recepieData.autor || "Autor por defecto");
      setRevisor(recepieData.revisor || "Revisor por defecto");
      setProces(Array.from({ length: 20 }, (_, i) => recepieData[`proces${i + 1}`] || ""));
      calculateTotalIngredientes(trimmedRecepie);
    }
  };

  const addIngredient = () => {
    if (showEdit) {
      setRecetaItems([...recetaItems, { name: "", item_Id: "", cuantity: "", units: "", source: "Items", precioUnitario: 0 }]);
    }
  };

  const handleIngredientChange = (index, value, source) => {
    if (showEdit) {
      const updatedItems = source === 'Items' ? [...recetaItems] : [...productoInternoItems];
      updatedItems[index].name = value;
      const matches = allOptions.filter((option) =>
        option.Nombre_del_producto.toLowerCase().includes(value.toLowerCase())
      );
      updatedItems[index].matches = matches;
      source === 'Items' ? setRecetaItems(updatedItems) : setProductoInternoItems(updatedItems);
    }
  };

  const handleIngredientSelect = (index, selectedOption, source) => {
    if (showEdit) {
      const updatedItems = source === 'Items' ? [...recetaItems] : [...productoInternoItems];
      updatedItems[index].name = selectedOption.Nombre_del_producto;
      updatedItems[index].item_Id = selectedOption._id;
      updatedItems[index].units = selectedOption.UNIDADES || "";
      updatedItems[index].precioUnitario = selectedOption.precioUnitario || 0;
      updatedItems[index].matches = [];
      updatedItems[index].source = source;
      source === 'Items' ? setRecetaItems(updatedItems) : setProductoInternoItems(updatedItems);
      calculateTotalIngredientes([...recetaItems, ...productoInternoItems]);
    }
  };

  const findPrecioUnitario = (itemId) => {
    const matchedItem = allOptions.find(option => option._id === itemId);
    return matchedItem ? matchedItem.precioUnitario : 0;
  };

  const handleRemoveIngredient = async (index, source) => {
    if (showEdit) {
      const confirmRemove = window.confirm("¿Estás seguro de que deseas eliminar este ingrediente?");
      if (confirmRemove) {
        const updatedItems = source === 'Items' ? [...recetaItems] : [...productoInternoItems];
        updatedItems.splice(index, 1);
        updatedItems.push({ name: "", item_Id: null, cuantity: null, units: null, source, precioUnitario: 0 });
        source === 'Items' ? setRecetaItems(updatedItems) : setProductoInternoItems(updatedItems);

        let preFix = source === 'Items' ? 'item' : 'producto_interno';
        await dispatch(updateItem(Receta._id, { [`${preFix}${index + 1}_Id`]: null, [`${preFix}${index + 1}_Cuantity_Units`]: null }, "Recetas"));
        calculateTotalIngredientes([...recetaItems, ...productoInternoItems]);
      }
    }
  };

  const handleCuantityChange = (index, value, source) => {
    if (showEdit) {
      const updatedItems = source === 'Items' ? [...recetaItems] : [...productoInternoItems];
      updatedItems[index].cuantity = value;
      source === 'Items' ? setRecetaItems(updatedItems) : setProductoInternoItems(updatedItems);
      calculateTotalIngredientes([...recetaItems, ...productoInternoItems]);
    }
  };

  const testIngridient = (itemId) => {
    return Items.some(item => item._id === itemId) ? 'item' : 'producto_interno';
  };

  const calculateTotalIngredientes = (items) => {
    const total = items.reduce((acc, item) => {
      return acc + (item.precioUnitario * item.cuantity || 0);
    }, 0);
    setTotalIngredientes(total);
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
          ...mapItemsToPayload(recetaItems),
          ...mapItemsToPayload(productoInternoItems),
          ...mapProcesToPayload(proces),
        };

        console.log("Objeto a enviar:", recetaPayload);

        if (Receta) {
          // Update existing recipe
          await dispatch(updateItem(Receta._id, recetaPayload, "Recetas"));
        } else {
          // Create new recipe
          await dispatch(crearItem(recetaPayload, "Recetas", product._id));
        }

        await dispatch(updateItem(product._id, { Receta: recetaPayload._id }, ProduccionInterna));
        alert("Receta guardada correctamente.");
      } catch (error) {
        console.error("Error al guardar la receta:", error);
        alert("Hubo un error al guardar la receta.");
      }
    }
  };

  const handleCreateReceta = async () => {
    if (showEdit) {
      try {
        const recetaPayload = {
          _id: crypto.randomUUID(),
          legacyName: legacyName || "Sin nombre",
          rendimiento: JSON.stringify(rendimiento),
          autor,
          revisor,
          actualizacion: new Date().toISOString(),
          ...mapItemsToPayload(recetaItems),
          ...mapItemsToPayload(productoInternoItems),
          ...mapProcesToPayload(proces),
        };

        console.log("Objeto a enviar:", recetaPayload);

        // Create new recipe
        await onCreateReceta(recetaPayload, product._id);
        alert("Receta creada correctamente.");
      } catch (error) {
        console.error("Error al crear la receta:", error);
        alert("Hubo un error al crear la receta.");
      }
    }
  };

  const mapItemsToPayload = (items) => {
    const payload = {};
    items.forEach((item, index) => {
      const idx = index + 1;
      const keyPrefix = testIngridient(item.item_Id);
      payload[`${keyPrefix}${idx}_Id`] = item.item_Id || null;
      payload[`${keyPrefix}${idx}_Cuantity_Units`] = item.item_Id
        ? JSON.stringify({
            metric: { cuantity: item.cuantity || null, units: item.units || null },
          })
        : null;
    });
    return payload;
  };

  const mapProcesToPayload = (proces) => {
    const payload = {};
    proces.forEach((proc, index) => {
      payload[`proces${index + 1}`] = proc || null;
    });
    return payload;
  };

  const handleCalculateReceta = async () => {
    try {
      const result = await recetaMariaPaula([...recetaItems, ...productoInternoItems], product);
      alert(`El valor de la receta es: ${result.consolidado}`);
    } catch (error) {
      console.error("Error al calcular la receta:", error);
      alert("Hubo un error al calcular la receta.");
    }
  };

  const handleProcesChange = (index, value) => {
    if (showEdit) {
      const updatedProces = [...proces];
      updatedProces[index] = value;
      setProces(updatedProces);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <div className="flex mb-4">
        <button
          className={`px-4 py-2 ${activeTab === "receta" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("receta")}
        >
          Receta
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "proces" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("proces")}
        >
          Procesos
        </button>
      </div>

      {activeTab === "receta" && (
        <>
          <h2 className="text-lg font-bold mb-4">{showEdit === false ? 'Receta:' : "Editar Receta:"}</h2>
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
              <div key={index} className="flex flex-col mb-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar ingrediente"
                    value={item.name}
                    onChange={(e) => handleIngredientChange(index, e.target.value, 'Items')}
                    className="p-2 border rounded flex-1 bg-slate-50"
                    readOnly={!showEdit}
                  />
                  {showEdit && (
                    <button
                      onClick={() => handleRemoveIngredient(index, 'Items')}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      X
                    </button>
                  )}
                </div>
                {item.matches && item.matches.length > 0 && (
                  <ul className="border rounded bg-white max-h-40 overflow-y-auto">
                    {item.matches.map((match) => (
                      <li
                        key={match._id}
                        onClick={() => handleIngredientSelect(index, match, 'Items')}
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
                    value={item.cuantity || ""}
                    onChange={(e) => handleCuantityChange(index, e.target.value, 'Items')}
                    className="p-2 border rounded w-1/4 bg-slate-50"
                    readOnly={!showEdit}
                  />
                  <input
                    type="text"
                    placeholder="Unidades"
                    value={item.units || ""}
                    readOnly
                    className="p-2 border rounded w-1/4 bg-slate-50"
                  />
                  <input
                    type="text"
                    placeholder="Precio Unitario"
                    value={item.precioUnitario || ""}
                    readOnly
                    className="p-2 border rounded w-1/4 bg-slate-50"
                  />
                  <input
                    type="text"
                    placeholder="Subtotal"
                    value={(item.precioUnitario * item.cuantity).toFixed(2) || ""}
                    readOnly
                    className="p-2 border rounded w-1/4 bg-slate-50"
                  />
                </div>
              </div>
            ))}
            {productoInternoItems.map((item, index) => (
              <div key={index} className="flex flex-col mb-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar ingrediente"
                    value={item.name}
                    onChange={(e) => handleIngredientChange(index, e.target.value, 'Produccion')}
                    className="p-2 border rounded flex-1 bg-slate-50"
                    readOnly={!showEdit}
                  />
                  {showEdit && (
                    <button
                      onClick={() => handleRemoveIngredient(index, 'Produccion')}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      X
                    </button>
                  )}
                </div>
                {item.matches && item.matches.length > 0 && (
                  <ul className="border rounded bg-white max-h-40 overflow-y-auto">
                    {item.matches.map((match) => (
                      <li
                        key={match._id}
                        onClick={() => handleIngredientSelect(index, match, 'Produccion')}
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
                    value={item.cuantity || ""}
                    onChange={(e) => handleCuantityChange(index, e.target.value, 'Produccion')}
                    className="p-2 border rounded w-1/4 bg-slate-50"
                    readOnly={!showEdit}
                  />
                  <input
                    type="text"
                    placeholder="Unidades"
                    value={item.units || ""}
                    readOnly
                    className="p-2 border rounded w-1/4 bg-slate-50"
                  />
                  <input
                    type="text"
                    placeholder="Precio Unitario"
                    value={item.precioUnitario || ""}
                    readOnly
                    className="p-2 border rounded w-1/4 bg-slate-50"
                  />
                  <input
                    type="text"
                    placeholder="Subtotal"
                    value={(item.precioUnitario * item.cuantity).toFixed(2) || ""}
                    readOnly
                    className="p-2 border rounded w-1/4 bg-slate-50"
                  />
                </div>
              </div>
            ))}
            {showEdit && (
              <button onClick={addIngredient} className="px-4 py-2 bg-blue-500 text-white rounded">
                Añadir Ingrediente
              </button>
            )}
          </div>
          <div className="mb-4 bg-slate-50">
            <h3 className="font-semibold mb-2 bg-slate-50">Total Ingredientes: {totalIngredientes.toFixed(2)}</h3>
          </div>
          {showEdit && (
            <button onClick={handleSaveReceta} className="px-4 py-2 bg-green-500 text-white rounded">
              Guardar Receta
            </button>
          )}
          {/* {showEdit && !Receta && (
            <button onClick={handleCreateReceta} className="px-4 py-2 bg-blue-500 text-white rounded">
              Crear Receta
            </button>
          )} */}
          {/* <button onClick={handleCalculateReceta} className="px-4 py-2 bg-orange-500 text-white rounded mt-4">
            Calcular Receta
          </button> */}
        </>
      )}

      {activeTab === "proces" && (
        <>
          <h2 className="text-lg font-bold mb-4">{showEdit === false ? 'Procesos:' : "Editar Procesos:"}</h2>
          {proces.map((proc, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                placeholder={`Proceso ${index + 1}`}
                value={proc}
                onChange={(e) => handleProcesChange(index, e.target.value)}
                className="w-full p-2 border rounded bg-slate-50"
                readOnly={!showEdit}
              />
            </div>
          ))}
          {showEdit && (
            <button onClick={handleSaveReceta} className="px-4 py-2 bg-green-500 text-white rounded">
              Guardar Procesos
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default RecepieOptionsMenu;
