import React, { useEffect, useState, useCallback } from "react"; // 1. Importar useCallback
import { useDispatch } from "react-redux";
import { crearItem } from "../../../redux/actions-Proveedores"; // Asegúrate que la ruta sea correcta
import { MENU, MenuItems, CATEGORIES, SUB_CATEGORIES, TARDEO, TARDEO_ALMUERZO } from "../../../redux/actions-types";
import FormularioMenuAlmuerzo from "./FormularioMenuAlmuerzo";

/**
 * Componente para gestionar la creación de nuevos ítems de menú,
 * incluyendo un formulario anidado para los componentes del almuerzo.
 */
function AccionesRapidasMenuLunch({ currentType }) {
  const dispatch = useDispatch();

  // Define el estado inicial para un nuevo ítem de menú.
  const initialMenuItemData = {
    NombreES: "",
    NombreEN: "",
    DescripcionMenuES: "",
    DescripcionMenuEN: "",
    GRUPO: TARDEO,
    SUB_GRUPO: TARDEO_ALMUERZO,
    Precio: "",
    Comp_Lunch: "", // Este campo será poblado por el componente hijo.
    Foto: "",
    Estado: "Activo",
    PRINT: false,
    Order: "",
  };

  const [menuItemData, setMenuItemData] = useState(initialMenuItemData);
  const [formVisible, setFormVisible] = useState(false);

  /**
   * Maneja los cambios en los campos de input del formulario principal.
   */
  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Recibe los datos del formulario de almuerzo (hijo) y actualiza el estado del padre.
   * Se envuelve en useCallback para evitar que se cree en cada render, rompiendo el bucle infinito.
   */
  // 2. Envolver la función en useCallback
  const handleLunchDataChange = useCallback((lunchData) => {
    const lunchJsonString = JSON.stringify(lunchData, null, 2);
    
    setMenuItemData((prev) => ({
      ...prev,
      Comp_Lunch: lunchJsonString,
    }));
  }, []); // 3. El arreglo de dependencias está vacío porque la función no depende de ninguna prop o estado externo.

  /**
   * Envía la acción para crear un nuevo ítem de menú con todos los datos recolectados.
   */
  const handleCrearMenuItem = async () => {
    try {
      const menuItem = { ...menuItemData };

      Object.keys(menuItem).forEach(key => {
        if (menuItem[key] === "") {
          delete menuItem[key];
        }
      });

      await dispatch(crearItem(menuItem, MENU));
      alert("Ítem de menú creado correctamente.");
      setMenuItemData(initialMenuItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem de menú:", error);
      alert("Hubo un error al crear el ítem de menú.");
    }
  };

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <div className="flex justify-start">
        <button
          className="bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
          onClick={() => setFormVisible((prev) => !prev)}
        >
          {formVisible ? "CANCELAR CREACIÓN" : "CREAR NUEVO MENU LUNCH"}
        </button>
      </div>

      {formVisible && currentType === MenuItems && (
        <div className="bg-gray-50 p-6 rounded-lg mt-4 border border-gray-200">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Ítem de Menú</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <label className="text-sm text-gray-700 font-bold">
              Nombre en Español:
              <input
                type="text"
                name="NombreES"
                value={menuItemData.NombreES}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="border p-2 rounded-md w-full mt-1 bg-white font-light"
                placeholder="Ej: Bandeja Paisa"
              />
            </label>
            <label className="text-sm text-gray-700 font-bold">
              Precio:
              <input
                type="number"
                name="Precio"
                value={menuItemData.Precio}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="border p-2 rounded-md w-full mt-1 bg-white font-light"
                placeholder="Ej: 25000"
              />
            </label>
          </div>
          
          <FormularioMenuAlmuerzo onMenuChange={handleLunchDataChange} />

          

          <button
            className="bg-blue-500 text-white font-bold py-3 px-6 rounded-md mt-6 hover:bg-blue-600 transition-colors w-full text-lg"
            onClick={handleCrearMenuItem}
          >
            GUARDAR NUEVO ÍTEM DE MENÚ
          </button>
        </div>
      )}
    </div>
  );
}

export default AccionesRapidasMenuLunch;
