'use client'

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";

const RecetaOptions = () => {
  const [recetaItems, setRecetaItems] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);

  const allOptions = useMemo(() => [...Items, ...Produccion], [Items, Produccion]);

  const addItem = () => {
    setRecetaItems([...recetaItems, { type: "", quantity: "", units: "" }]);
    setDropdownVisible((prev) => ({ ...prev, [recetaItems.length]: true })); // Mostrar dropdown para el nuevo campo
  };

  const updateItem = (index, field, value) => {
    setRecetaItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleInputChange = (index, value) => {
    updateItem(index, "type", value);
    setDropdownVisible((prev) => ({ ...prev, [index]: true })); // Mostrar sugerencias al escribir

    const selectedOption = allOptions.find(
      (option) =>
        option.Nombre_del_producto.toLowerCase() === value.toLowerCase()
    );

    updateItem(index, "units", selectedOption ? selectedOption.UNIDADES || "/" : "/");
  };

  const handleSelectOption = (index, option) => {
    updateItem(index, "type", option.Nombre_del_producto);
    updateItem(index, "units", option.UNIDADES || "/");
    setDropdownVisible((prev) => ({ ...prev, [index]: false })); // Ocultar dropdown después de seleccionar
  };

  const handleQuantityChange = (index, value) => {
    updateItem(index, "quantity", value);
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
              onFocus={() => setDropdownVisible((prev) => ({ ...prev, [index]: true }))} // Mostrar dropdown al enfocar
              onBlur={() =>
                setTimeout(() => setDropdownVisible((prev) => ({ ...prev, [index]: false })), 150)
              } // Ocultar dropdown después de un breve retraso
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
    </div>
  );
};

export default RecetaOptions;
