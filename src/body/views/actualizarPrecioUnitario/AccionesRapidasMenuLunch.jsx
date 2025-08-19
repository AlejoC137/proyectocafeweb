import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { crearItem } from "../../../redux/actions-Proveedores";
import { MENU, MenuItems, TARDEO, TARDEO_ALMUERZO } from "../../../redux/actions-types";
import FormularioMenuAlmuerzo from "./FormularioMenuAlmuerzo";

function AccionesRapidasMenuLunch({ currentType }) {
  const dispatch = useDispatch();

  const initialMenuItemData = {
    NombreES: "",
    NombreEN: "",
    DescripcionMenuES: "",
    DescripcionMenuEN: "",
    GRUPO: TARDEO,
    SUB_GRUPO: TARDEO_ALMUERZO,
    Precio: "",
    Comp_Lunch: "",
    Foto: "",
    Estado: "Activo",
    PRINT: false,
    Order: "",
  };

  const [menuItemData, setMenuItemData] = useState(initialMenuItemData);
  const [formVisible, setFormVisible] = useState(false);

  // --- 1. NUEVO ESTADO PARA EL TEXTAREA DEL JSON ---
  const [jsonInput, setJsonInput] = useState("");

  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLunchDataChange = useCallback((lunchData) => {
    const lunchJsonString = JSON.stringify(lunchData, null, 2);
    setMenuItemData((prev) => ({ ...prev, Comp_Lunch: lunchJsonString }));
  }, []);

  // --- 2. NUEVA FUNCIÓN PARA PARSEAR Y CARGAR EL JSON ---
  const handleJsonParse = () => {
    if (!jsonInput.trim()) {
      alert("El campo de JSON está vacío.");
      return;
    }
    try {
      const parsedData = JSON.parse(jsonInput);

      // Si Comp_Lunch viene como objeto, lo convertimos a string para el estado.
      if (parsedData.Comp_Lunch && typeof parsedData.Comp_Lunch === 'object') {
        parsedData.Comp_Lunch = JSON.stringify(parsedData.Comp_Lunch, null, 2);
      }

      // Unimos los datos parseados con el estado inicial para asegurar todos los campos
      const newData = { ...initialMenuItemData, ...parsedData };
      setMenuItemData(newData);

      alert("Formulario llenado correctamente desde el JSON.");
      console.log("Datos cargados desde JSON:", newData);
      
    } catch (error) {
      console.error("Error al parsear el JSON:", error);
      alert("El texto introducido no es un JSON válido. Por favor, revísalo.");
    }
  };

 /**
 * Envía la acción para crear un nuevo ítem de menú con todos los datos recolectados.
 */
const handleCrearMenuItem = async () => {
  try {
    // 1. Crea una copia del estado actual del formulario.
    const menuItem = { ...menuItemData };

    // 2. Limpia el objeto: elimina campos que estén vacíos.
    Object.keys(menuItem).forEach(key => {
      if (menuItem[key] === "") {
        delete menuItem[key];
      }
    });

    // 3. Despacha la acción de Redux para crear el ítem en la base de datos.
    await dispatch(crearItem(menuItem, MENU));
    
    // 4. Si todo sale bien, notifica al usuario y resetea el formulario.
    alert("Ítem de menú creado correctamente.");
    setMenuItemData(initialMenuItemData); // Vuelve al estado inicial
    setFormVisible(false); // Oculta el formulario

  } catch (error) {
    // 5. Si ocurre un error, lo muestra en consola y notifica al usuario.
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
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Menú</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <label className="text-sm text-gray-700 font-bold">
              Nombre en Español:
              <input
                type="text" name="NombreES" value={menuItemData.NombreES}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="border p-2 rounded-md w-full mt-1 bg-white font-light"
                placeholder="Ej: Bandeja Paisa"
              />
            </label>
            <label className="text-sm text-gray-700 font-bold">
              Precio:
              <input
                type="number" name="Precio" value={menuItemData.Precio}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="border p-2 rounded-md w-full mt-1 bg-white font-light"
                placeholder="Ej: 25000"
              />
            </label>
          </div>
          
          <FormularioMenuAlmuerzo onMenuChange={handleLunchDataChange} />
          
          {/* --- 3. NUEVA SECCIÓN EN EL FORMULARIO PARA PEGAR EL JSON --- */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h4 className="text-lg font-semibold mb-2 text-gray-700">Alternativa: Cargar desde JSON</h4>
            <p className="text-sm text-gray-500 mb-2">
              Pega el JSON de un ítem de menú existente para pre-llenar todos los campos.
            </p>
            <textarea
              className="border p-2 rounded-md w-full h-40 font-mono text-sm bg-gray-900 text-green-400"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "NombreES": "Plato desde JSON", "Precio": 30000, "Comp_Lunch": { ... } }'
            />
            <button
              onClick={handleJsonParse}
              className="bg-purple-500 text-white font-bold py-2 px-4 rounded-md mt-2 hover:bg-purple-600 transition-colors"
            >
              Llenar Formulario con JSON
            </button>
          </div>
          
          <button
            className="bg-blue-500 text-white font-bold py-3 px-6 rounded-md mt-8 hover:bg-blue-600 transition-colors w-full text-lg"
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