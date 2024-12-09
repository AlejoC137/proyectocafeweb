'use client';

import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { insertarRecetas } from "../../../redux/actions";

const RecetaOptions = ({id, Nombre_del_producto}) => {
  const dispatch = useDispatch();
  const [recetaItems, setRecetaItems] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);

  const allOptions = useMemo(() => [...Items, ...Produccion], [Items, Produccion]);

  const addItem = () => {
    setRecetaItems([...recetaItems, { type: "", quantity: "", units: "" }]);
    setDropdownVisible((prev) => ({ ...prev, [recetaItems.length]: true }));
  };

  const updateItem = (index, field, value) => {
    setRecetaItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleInputChange = (index, value) => {
    updateItem(index, "type", value);
    setDropdownVisible((prev) => ({ ...prev, [index]: true }));

    const selectedOption = allOptions.find(
      (option) =>
        option.Nombre_del_producto.toLowerCase() === value.toLowerCase()
    );

    updateItem(index, "units", selectedOption ? selectedOption.UNIDADES || "/" : "/");
  };

  const handleSelectOption = (index, option) => {
    updateItem(index, "type", option.Nombre_del_producto);
    updateItem(index, "units", option.UNIDADES || "/");
    setDropdownVisible((prev) => ({ ...prev, [index]: false }));
  };

  const handleQuantityChange = (index, value) => {
    updateItem(index, "quantity", value);
  };

  const handleUpdateReceta = () => {
    // Procesar los datos para cumplir con el esquema requerido
    const recetaData = recetaItems.map((item, index) => ({
      [`item${index + 1}_Id`]: allOptions.find((option) => option.Nombre_del_producto === item.type)?._id || null,
      [`item${index + 1}_Cuantity_Units`]: {
        metric: {
          cuantity: item.quantity || null,
          units: item.units || null,
        },
        imperial: {
          cuantity: null,
          units: null,
        },
        legacyName: item.type,
      },
    }));

    const recetaPayload = {
      _id: crypto.randomUUID(), // Generar un UUID único
      legacyName: Nombre_del_producto, // Generar un UUID único
    //   forId: id, // Generar un UUID único
      autor: "Autor por defecto", // Puedes personalizar esto
      revisor: "Revisor por defecto", // Puedes personalizar esto
      actualizacion: new Date().toISOString(),
      ...Object.assign({}, ...recetaData), // Convertir el array de objetos en un solo objeto
    };

    // Despachar la acción para insertar las recetas
    dispatch(insertarRecetas([recetaPayload]));
    alert("Receta actualizada correctamente.");
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-md border border-gray-300">
      <button
        onClick={addItem}
        className="self-start px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Añadir Item
      </button>

      {recetaItems.map((item, index) => (
        <div key={index} className="flex gap-4 items-center">
          {/* Campo de texto con autocompletar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={item.type}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder="Escribe para buscar..."
              className="p-2 border rounded bg-slate-200 w-full"
              onFocus={() => setDropdownVisible((prev) => ({ ...prev, [index]: true }))}
              onBlur={() =>
                setTimeout(() => setDropdownVisible((prev) => ({ ...prev, [index]: false })), 150)
              }
            />
            {/* Mostrar sugerencias */}
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

          {/* Campo para cantidad */}
          <input
            type="number"
            placeholder="Cantidad"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(index, e.target.value)}
            className="w-24 p-2 border rounded bg-slate-200"
          />

          {/* Mostrar unidad correspondiente */}
          <div className="p-2 border rounded bg-gray-100 text-center">
            {item.units || "/"}
          </div>
        </div>
      ))}

      {/* Botón para actualizar receta */}
      <button
        onClick={handleUpdateReceta}
        className="self-start px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors mt-4"
      >
        Actualizar Receta
      </button>
    </div>
  );
};

export default RecetaOptions;
