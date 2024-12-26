'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  actualizarPrecioUnitario,
  calcularPrecioProduct,
  getReceta,
  insertarRecetas,
  toggleShowEdit,
  updateItem,
} from "../../../redux/actions";

const RecetaOptions = ({ id, Nombre_del_producto, currentType, receta }) => {
  const dispatch = useDispatch();
  const [recetaItems, setRecetaItems] = useState([]);
  const [precioUnitarioCal, setPrecioUnitarioCal] = useState();
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [helpVisible, setHelpVisible] = useState(false);
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);

  const allOptions = useMemo(() => [...Items, ...Produccion], [Items, Produccion]);

  useEffect(() => {
    if (receta !== null) {
      handleFetchReceta();
    }
  }, [receta]);

  const handleFetchReceta = async () => {
    if (!receta) {
      console.warn("No se proporcionó un UUID de receta.");
      return;
    }
  
    try {
      // Obtiene la receta desde el backend o estado
      const fetchedReceta = await getReceta(receta);
      if (!fetchedReceta) {
        console.warn("No se encontró una receta con el UUID proporcionado.");
        return;
      }
  
      // Procesa los datos de la receta
      const recetaData = Object.entries(fetchedReceta)
        .filter(([key, value]) => key.startsWith("item") && value !== null) // Filtra solo las claves relevantes
        .map(([key, value]) => {
          if (key.endsWith("Cuantity_Units")) {
            const parsedValue = JSON.parse(value); // Parse JSON para obtener datos estructurados
            return {
              type: parsedValue?.legacyName || "",
              quantity: parsedValue?.metric?.cuantity || "",
              units: parsedValue?.metric?.units || "/",
            };
          }
          return null;
        })
        .filter((item) => item !== null); // Filtra elementos nulos generados
  
      // Registra los datos procesados en la consola
      console.log("Datos procesados de la receta:", recetaData);
  
      // Actualiza el estado con los datos procesados
      setRecetaItems(recetaData);
    } catch (error) {
      console.error("Error al obtener la receta:", error);
    }
  };
  

  const handleFetchRecetasUUID = async () => {
    if (receta) {
      try {
        const fetchedRecetaUUID = await getReceta(receta);
        if (!fetchedRecetaUUID) {
          console.error("No se encontró una receta con este UUID.");
          return;
        }

        const filteredIds = Object.entries(fetchedRecetaUUID)
          .filter(([key, value]) => key.endsWith("_Id") && value !== null)
          .map(([key, value]) => ({ field: key, value }));

        const updatedFilteredIds = filteredIds.map((idObj) => {
          const matchedOption = allOptions.find((option) => option._id === idObj.value);
          const cuantityField = `${idObj.field.replace("_Id", "_Cuantity_Units")}`;
          const cuantityValue = fetchedRecetaUUID[cuantityField]
            ? JSON.parse(fetchedRecetaUUID[cuantityField])?.metric?.cuantity || null
            : null;

          return {
            ...idObj,
            precioUnitario: matchedOption ? matchedOption.precioUnitario || null : null,
            cuantity: cuantityValue,
          };
        });

        calcularPrecioProduct(updatedFilteredIds, id, currentType);
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

    const matchedOption = allOptions.find(
      (option) => option.Nombre_del_producto.toLowerCase() === value.toLowerCase()
    );
    if (matchedOption) {
      updateItemField(index, "units", matchedOption.UNIDADES || "/");
    }
  };

  const handleSelectOption = (index, option) => {
    updateItemField(index, "type", option.Nombre_del_producto);
    updateItemField(index, "units", option.UNIDADES || "/");
    setDropdownVisible((prev) => ({ ...prev, [index]: false }));
  };

  const handleBlur = (index) => {
    setTimeout(() => {
      setDropdownVisible((prev) => ({ ...prev, [index]: false }));
    }, 150);
  };

  const handleQuantityChange = (index, value) => {
    updateItemField(index, "quantity", value);
  };

  const reSetItem = (receta, ref) => {
    const filteredItems = receta.filter((_, index) => index !== ref && _.type !== null);
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      index: index,
    }));
    while (reorderedItems.length < receta.length) {
      reorderedItems.push({ type: null, quantity: null, units: null });
    }
    return reorderedItems;
  };

  const handleRemoveItem = (index) => {
    setRecetaItems((prev) => reSetItem(prev, index));
  };

  const handleUpdateItems = async () => {
    try {
      const updatedItems = recetaItems.map((item) => ({
        id: allOptions.find((opt) => opt.Nombre_del_producto === item.type)?._id || null,
        type: item.type,
        quantity: item.quantity,
        units: item.units,
      }));
  
      console.log("Datos enviados para la actualización:", { updatedItems });
  
      const response = await dispatch(updateItem(id, { updatedItems }, currentType));
      if (!response.success) {
        console.error("Error en la respuesta:", response.message);
        return;
      }
  
      alert("Ítems actualizados correctamente.");
    } catch (error) {
      console.error("Error al actualizar los ítems:", error);
      alert("Hubo un error al actualizar los ítems.");
    }
  };
  

  const toggleHelp = async () => {
    if (receta) {
      setHelpVisible(!helpVisible);
    } else {
      await handleSaveReceta();
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-md border border-gray-300">
      <div className="flex justify-between items-center">
        <button
          onClick={toggleHelp}
          className={`px-4 py-2 rounded hover:bg-yellow-600 transition-colors ${
            receta ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-yellow-500 text-white"
          }`}
          disabled={!!receta}
        >
        </button>

        <button
          onClick={handleFetchRecetasUUID}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          💰
        </button>

        {helpVisible && (
          <button
            onClick={handleSaveReceta}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            {receta && "Actualizar Receta"  }
          </button>
        )}

        {recetaItems.length > 0 && (
          <button
            onClick={handleUpdateItems}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Actualizar Ítems
          </button>
        )}

        {receta !== null && (
          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Añadir Item
          </button>
        )}
      </div>

      {showEdit &&
        recetaItems.map((item, index) => (
          <div key={index} className="flex gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={item.type || ""}
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
              value={item.quantity || ""}
              onChange={(e) => handleQuantityChange(index, e.target.value)}
              className="w-24 p-2 border rounded bg-slate-200"
              disabled={!showEdit}
            />
            <div className="p-2 border rounded bg-gray-100 text-center">
              {item.units || "/"}
            </div>
            <button
              onClick={() => handleRemoveItem(index)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              ❌
            </button>
          </div>
        ))}
    </div>
  );
};

export default RecetaOptions;
  