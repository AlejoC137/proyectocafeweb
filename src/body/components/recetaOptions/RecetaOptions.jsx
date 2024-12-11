

'use client';

import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getReceta, insertarRecetas, updateItem } from "../../../redux/actions";

const RecetaOptions = ({ id, Nombre_del_producto, currentType, receta }) => {
  const dispatch = useDispatch();
  const [recetaItems, setRecetaItems] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [helpVisible, setHelpVisible] = useState(false); // Controla la visibilidad de las opciones
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);

  const allOptions = useMemo(() => [...Items, ...Produccion], [Items, Produccion]);

  const handleFetchReceta = async () => {
    if (receta) {
      try {
        const fetchedReceta = await getReceta(receta);

        const recetaData = Object.entries(fetchedReceta || {})
          .filter(([key, value]) => key.startsWith("item") && value !== null)
          .reduce((acc, [key, value]) => {
            if (key.endsWith("Cuantity_Units")) {
              const parsedValue = JSON.parse(value);
              acc.push({
                type: parsedValue?.legacyName || "",
                quantity: parsedValue?.metric?.cuantity || "",
                units: parsedValue?.metric?.units || "/",
              });
            }
            return acc;
          }, []);

        setRecetaItems(recetaData);
      } catch (error) {
        console.error("Error al obtener la receta:", error);
      }
    }
  };

  const addItem = () => {
    const nextAvailableIndex = recetaItems.length;
    setRecetaItems([
      ...recetaItems,
      { type: "", quantity: "", units: "", index: nextAvailableIndex },
    ]);
    setDropdownVisible((prev) => ({ ...prev, [nextAvailableIndex]: true }));
  };

  const updateItemField = (index, field, value) => {
    setRecetaItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleInputChange = (index, value) => {
    updateItemField(index, "type", value);
    setDropdownVisible((prev) => ({ ...prev, [index]: true }));
  };

  const handleSelectOption = (index, option) => {
    updateItemField(index, "type", option.Nombre_del_producto);
    updateItemField(index, "units", option.UNIDADES || "/");
    setDropdownVisible((prev) => ({ ...prev, [index]: false }));
  };

  const handleBlur = (index) => {
    setTimeout(() => {
      setDropdownVisible((prev) => ({ ...prev, [index]: false }));
    }, 150); // Permite un breve retraso para que el clic en la lista sea registrado
  };

  const handleQuantityChange = (index, value) => {
    updateItemField(index, "quantity", value);
  };

  const handleSaveReceta = async () => {
    const recetaData = recetaItems.map((item, index) => ({
      [`item${index + 1}_Id`]: allOptions.find((option) => option.Nombre_del_producto === item.type)?._id || null,
      [`item${index + 1}_Cuantity_Units`]: JSON.stringify({
        metric: {
          cuantity: item.quantity || null,
          units: item.units || null,
        },
        imperial: {
          cuantity: null,
          units: null,
        },
        legacyName: item.type,
      }),
    }));
  
    const recetaPayload = {
      _id: receta || crypto.randomUUID(),
      legacyName: Nombre_del_producto,
      autor: "Autor por defecto",
      revisor: "Revisor por defecto",
      actualizacion: new Date().toISOString(),
      ...Object.assign({}, ...recetaData),
    };
  
    try {
      console.log(`Procesando receta con ID ${recetaPayload._id}`);
      await dispatch(insertarRecetas([recetaPayload]));
      alert(`Receta ${receta ? "actualizada" : "creada"} correctamente.`);
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      alert("Hubo un error al procesar la receta.");
    }
  };
  

  const toggleHelp = () => {
    if (!helpVisible) handleFetchReceta();
    setHelpVisible(!helpVisible);
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-md border border-gray-300">
      {/* Botones en la misma fila */}
      <div className="flex justify-between items-center">
        <button
          onClick={toggleHelp}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          📖
        </button>

        {helpVisible && (
          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Añadir Item
          </button>
        )}

        {helpVisible && (
          <button
            onClick={handleSaveReceta}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            {receta ? "Actualizar Receta" : "Crear Receta"}
          </button>
        )}
      </div>

      {/* Opciones de receta visibles según el estado de helpVisible */}
      {helpVisible &&
        recetaItems.map((item, index) => (
          <div key={index} className="flex gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={item.type}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                placeholder="Escribe para buscar..."
                className="p-2 border rounded bg-slate-200 w-full"
                disabled={!showEdit}
              />
              {dropdownVisible[index] && item.type && (
                <ul className="absolute bg-white border rounded mt-1 max-h-40 overflow-y-auto w-full z-10">
                  {allOptions
                    .filter((option) =>
                      option.Nombre_del_producto.toLowerCase().includes(item.type.toLowerCase())
                    )
                    .map((option) => (
                      <li
                        key={option._id}
                        onClick={() => handleSelectOption(index, option)}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                      >
                        {option.Nombre_del_producto}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <input
              type="number"
              placeholder="Cantidad"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(index, e.target.value)}
              className="w-24 p-2 border rounded bg-slate-200"
              disabled={!showEdit}
            />
            <div className="p-2 border rounded bg-gray-100 text-center">
              {item.units || "/"}
            </div>
          </div>
        ))}
    </div>
  );
};

export default RecetaOptions;
