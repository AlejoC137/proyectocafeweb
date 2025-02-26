import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, updateItem, getRecepie, trimRecepie } from "../../../redux/actions";
import { ProduccionInterna, MENU , PROCEDE} from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import { recetaMariaPaula } from "../../../redux/calcularReceta";

function RecepieOptionsProcedimientos({ product, receta, currentType }) {
  const dispatch = useDispatch();
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);
  const allOptions = [...Items, ...Produccion];
console.log(receta);

  const [recetaItems, setRecetaItems] = useState([]);
  const [productoInternoItems, setProductoInternoItems] = useState([]);
  const [legacyName, setLegacyName] = useState(product?.Nombre_del_producto || "");
  const [rendimiento, setRendimiento] = useState({ porcion: "", cantidad: "", unidades: "" });
  const [autor, setAutor] = useState("Autor por defecto");
  const [revisor, setRevisor] = useState("Revisor por defecto");
  const [totalIngredientes, setTotalIngredientes] = useState(0);
  const [proces, setProces] = useState(Array(20).fill("")); // Initialize 20 empty proces
  const [activeTab, setActiveTab] = useState("proces"); // State to manage active tab
  const [CalculoDetalles, setCalculoDetalles] = useState({}); // State to manage active tab
  const [costoDirecto, setCostoDirecto] = useState(); // State to manage active tab
  const [processTime, setProcessTime] = useState(receta?.ProcessTime); // State to manage active tab
  const [editvCMP, setEditvCMP] = useState(); // State to manage active tab

  useEffect(() => {
    if (receta && currentType === PROCEDE) {
      loadRecepie('RecetasProcedimientos');
    } 
  }, [receta, dispatch, editvCMP]);

  const loadRecepie = async (source) => {
    if (!receta) {
      console.error("Receta is undefined or missing _id");
      return;
    }

    const recepieData = await getRecepie(receta, source);
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

  const HandleSetEditvCMP = (e) => {
    setEditvCMP(e.target.value);
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

  const handleRemoveIngredient = async (index, source) => {
    const itemKey = source === 'Items' ? `item${index + 1}_Id` : `producto_interno${index + 1}_Id`;
    const cuantityKey = itemKey.replace("_Id", "_Cuantity_Units");

    if (showEdit) {
      const confirmRemove = window.confirm("¿Estás seguro de que deseas eliminar este ingrediente?");
      if (confirmRemove) {
        const updatedItems = source === 'Items' ? [...recetaItems] : [...productoInternoItems];
        await dispatch(updateItem(receta, { [itemKey]: null, [cuantityKey]: null }, "RecetasProcedimientos"));
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
    const resultad = recetaMariaPaula(items, product.GRUPO, (editvCMP ? `.${editvCMP}` : null), processTime);
    setCostoDirecto(resultad.detalles);
    setTotalIngredientes(resultad.consolidado);
    setCalculoDetalles(resultad.detalles);
  };

  const handleProcessTimeChange = (e) => {
    setProcessTime(e.target.value);
  };

  const handleSaveReceta = async () => {
    if (showEdit) {
      try {
        const recetaPayload = {
          _id: receta ? receta : product._id,
          legacyName: legacyName || "Sin nombre",
          costo: costoDirecto,
          ProcessTime: processTime,
          rendimiento: JSON.stringify(rendimiento),
          forId: product._id,
          autor,
          legacyName: product.NombreES,
          revisor,
          actualizacion: new Date().toISOString(),
          ...mapItemsToPayload(recetaItems),
          ...mapItemsToPayload(productoInternoItems),
          ...mapProcesToPayload(proces),
        };

        console.log("Objeto a enviar:", recetaPayload);

        if (receta) {
          // Update existing recipe
          await dispatch(updateItem(receta, recetaPayload, "RecetasProcedimientos"));
        } else {
          // Create new recipe
          await dispatch(crearItem(recetaPayload, "RecetasProcedimientos", product._id));
        }

        await dispatch(updateItem(product._id, { Receta: recetaPayload._id }, PROCEDE));
        alert("Receta guardada correctamente.");
      } catch (error) {
        console.error("Error al guardar la receta:", error);
        alert("Hubo un error al guardar la receta.");
      }
    }
  };

  const mapItemsToPayload = (items) => {
    const payload = {};
    let itemCounter = 1;
    let produccionCounter = 1;
    items.forEach((item) => {
      const keyPrefix = testIngridient(item.item_Id);
      const idx = keyPrefix === 'item' ? itemCounter++ : produccionCounter++;
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
          <div className=" bg-slate-50 flex gap-1">
            <input 
              onChange={HandleSetEditvCMP}
              className="bg-white border-black w-[80px] p-1 border rounded mb-2"
            />
            <h3 className="font-semibold mb-2 bg-slate-300 p-1 border rounded">%CMPi: {CalculoDetalles.pCMPInicial}%</h3>
            <h3 className="font-semibold mb-2 bg-slate-300 p-1 border rounded">%CMPr: {CalculoDetalles.pCMPReal}%</h3>
            <h3 className="font-semibold mb-2 bg-slate-300 p-1 border rounded">$CMP: {CalculoDetalles.vCMP}$</h3>
            <h3 className="font-semibold mb-2 bg-slate-300 p-1 border rounded">$IB: {CalculoDetalles.vIB}</h3>
            <h3 className="font-semibold mb-2 bg-slate-300 p-1 border rounded">%IB: {CalculoDetalles.pIB}%</h3>
          </div>
          <h3 className="font-semibold mb-2 bg-slate-300 p-1 border rounded text-center">$PVF: {totalIngredientes.toFixed(2)}</h3>
          {showEdit && (
            <button onClick={handleSaveReceta} className="px-4 py-2 bg-green-500 text-white rounded">
              Guardar Receta
            </button>
          )}
        </>
      )}

      {activeTab === "proces" && (
        <>
          <input
            type="text"
            placeholder={`${processTime}`}
            value={processTime}
            onChange={handleProcessTimeChange}
            className="w-full p-2 border rounded bg-slate-50"
            readOnly={!showEdit}
          />
          <h2 className="text-lg font-bold mb-4">{showEdit === false ? 'Procesos:' : "Editar Procesos:"}</h2>
          {showEdit && proces.map((proc, index) => (
            <div key={index} className="mb-4">
              <textarea
                placeholder={`Proceso ${index + 1}`}
                value={proc}
                onChange={(e) => handleProcesChange(index, e.target.value)}
                className="w-full p-2 border rounded bg-slate-50 resize-none"
                rows={3} // Controla el número inicial de líneas visibles
                readOnly={!showEdit}
                style={{
                  whiteSpace: 'pre-wrap', // Permite que el texto haga wrap
                  overflowWrap: 'break-word', // Asegura que el texto no desborde
                }}
              />
            </div>
          ))}
          {!showEdit && proces.map((proc, index) => (
            proc && (
              <div key={index} className="mb-4">
                <textarea
                  placeholder={`Proceso ${index + 1}`}
                  value={proc}
                  readOnly={!showEdit}
                  className="w-full p-2 border rounded bg-slate-50 resize-none"
                  rows={3}
                  style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                  }}
                />
              </div>
            )
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
export default RecepieOptionsProcedimientos;
