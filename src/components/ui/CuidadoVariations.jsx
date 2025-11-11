import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../redux/actions'; // Asegúrate que la ruta sea correcta

// --- Opciones disponibles para el editor ---
const OPCIONES_DISPONIBLES = {
  ES: {
    alergies: [
        { type: "Nueces", icon: "nuts" }, 
        { type: "Lácteo", icon: "dairy" }, 
        { type: "Gluten", icon: "gluten" }
    ],
    spice: [
        { type: "Picante", icon: "spicy", level: 1 }
    ], // Nivel inicial 1 para ser visible
    variations: [
        { type: "En Hielo", icon: "iced", extra: 500 }, 
        { type: "Leche Almendra", icon: "almond-milk", extra: 2000 }]
  },
  EN: {
    alergies: [
        { type: "Nuts", icon: "nuts" }, 
        { type: "Dairy", icon: "dairy" }, 
        { type: "Gluten", icon: "gluten" }
    ],
    spice: [
        { type: "Spicy", icon: "spicy", level: 1 }
    ], // Start level at 1 to be visible
    variations: [
        { type: "Iced", icon: "iced", extra: 500 },
        { type: "Almond Milk", icon: "almond-milk", extra: 2000 }
    ]
  }
};

// --- Componente principal ---
export default function CuidadoVariations({ showEdit,product, viewName, isEnglish: isEnglishProp = false }) {
  console.log(showEdit);
  
  const dispatch = useDispatch();
  const [isEnglish, setIsEnglish] = useState(isEnglishProp);
  const [editableCuidado, setEditableCuidado] = useState({ alergies: [], spice: [], variations: [] });

  useEffect(() => {
    setIsEnglish(isEnglishProp);
  }, [isEnglishProp]);

  const getIcon = (icon) => {
    const iconMap = {
      nuts: "🥜", 
      dairy: "🥛", 
      gluten: "🌾", 
      spicy: "🌶️", 
      iced: "🧊", 
      "almond-milk": "🌰" 
    };
    return iconMap[icon] || "";
  };
  
  // Efecto para inicializar el estado editable desde el producto
  useEffect(() => {
    const langKey = isEnglish ? 'CuidadoEN' : 'CuidadoES';
    const dataString = product[langKey];
    
    if (dataString && dataString.trim().startsWith('{')) {
      try {
        setEditableCuidado(JSON.parse(dataString));
      } catch (error) {
        console.error("Error parsing Cuidado data:", error);
        setEditableCuidado({ alergies: [], spice: [], variations: [] });
      }
    } else {
      setEditableCuidado({ alergies: [], spice: [], variations: [] });
    }
  }, [product, isEnglish]);


  // ========= VISTA DE EDITOR PARA EL INVENTARIO =========
  if (viewName === "Inventario") {
    const options = isEnglish ? OPCIONES_DISPONIBLES.EN : OPCIONES_DISPONIBLES.ES;
    
    const handleToggle = (category, item) => {
        // No permitir toggles si no está en modo edición
        if (!showEdit) return;

        const currentCategory = editableCuidado[category] || [];
        const isPresent = currentCategory.some(i => i.type === item.type);

        let newCategory;
        if (isPresent) {
          newCategory = currentCategory.filter(i => i.type !== item.type);
        } else {
          newCategory = [...currentCategory, item];
        }
        setEditableCuidado({ ...editableCuidado, [category]: newCategory });
    };

    const handleLevelChange = (e) => {
      // No permitir cambios si no está en modo edición
      if (!showEdit) return;
      const newLevel = parseInt(e.target.value, 10) || 1;
      if (editableCuidado.spice && editableCuidado.spice.length > 0) {
        const updatedSpice = [{ ...editableCuidado.spice[0], level: newLevel }];
        setEditableCuidado({ ...editableCuidado, spice: updatedSpice });
      }
    };

    // 👇 NUEVA FUNCIÓN PARA MANEJAR EL CAMBIO DE COSTO EXTRA 👇
    const handleExtraChange = (itemType, newExtraValue) => {
    // No permitir cambios si no está en modo edición
    if (!showEdit) return;
    const updatedVariations = (editableCuidado.variations || []).map(variation => {
      if (variation.type === itemType) {
        return { ...variation, extra: parseInt(newExtraValue, 10) || 0 };
      }
      return variation;
    });
    setEditableCuidado({ ...editableCuidado, variations: updatedVariations });
    };

    const handleSave = () => {
      const dataString = JSON.stringify(editableCuidado);
      const langKey = isEnglish ? 'CuidadoEN' : 'CuidadoES';
      dispatch(updateItem(product._id, { [langKey]: dataString }, "Menu"));
      alert('¡Guardado!');
    };

    return (
      <div className="border p-1 rounded-lg bg-slate-50 mt-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-sm">{isEnglish ? 'Care / Variations' : 'Cuidados / Variaciones'}</h4>
          <button
            onClick={() => showEdit && setIsEnglish(!isEnglish)}
            disabled={!showEdit}
            className={`text-xs px-2 py-1 rounded ${!showEdit ? 'bg-gray-100 text-gray-400' : 'bg-gray-200'}`}>
            {isEnglish ? 'Switch to Spanish' : 'Cambiar a Inglés'}
          </button>
        </div>

        {Object.keys(options).map(category => (
          <div key={category} className="mb-">
            <h5 className="font-semibold text-xs capitalize">{category}</h5>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {options[category].map(item => {
                const isChecked = editableCuidado[category]?.some(i => i.type === item.type);
                return (
                  <React.Fragment key={item.type}>
                    {/* Si estamos en modo edición renderizamos checkbox + texto; si no, solo icono (sin interacción) */}
                    {showEdit ? (
                      <>
                        <label className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-pointer transition-all ${isChecked ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                          <input
                            disabled={!showEdit}
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={() => handleToggle(category, item)}
                          />
                          {getIcon(item.icon)} {item.type}
                        </label>

                        {category === 'spice' && isChecked && (
                          <input
                            disabled={!showEdit}
                            type="number"
                            min="1" max="5"
                            value={editableCuidado.spice[0]?.level || 1}
                            onChange={handleLevelChange}
                            className="w-12 text-center bg-white text-xs border border-gray-300 rounded-md p-1"
                          />
                        )}

                        {category === 'variations' && isChecked && (
                          <input
                            disabled={!showEdit}
                            type="number"
                            step="100"
                            min="0"
                            placeholder="Extra"
                            value={editableCuidado.variations?.find(v => v.type === item.type)?.extra || 0}
                            onChange={(e) => handleExtraChange(item.type, e.target.value)}
                            className="w-16 text-center bg-white text-xs border border-gray-300 rounded-md p-1"
                          />
                        )}
                      </>
                    ) : (
                      // Modo sólo lectura (sin interacción): mostrar sólo el icono
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isChecked ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {getIcon(item.icon)}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
        
        {showEdit && (
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white p-2 rounded-md mt-3 text-sm font-bold hover:bg-blue-700"
          >
            Guardar Cambios
          </button>
        )}
      </div>
    );
  }

  // ========= VISTA DE SOLO LECTURA PARA MenuPrint =========
  if (viewName === "MenuPrint") {
    const langKey = isEnglish ? 'CuidadoEN' : 'CuidadoES';
    const dataString = product[langKey];
    
    if (!dataString || !dataString.trim().startsWith('{')) return null;

    try {
      const data = JSON.parse(dataString);
      const categoryTitles = isEnglish 
        ? { alergies: 'Allergy', spice: 'Spice Level', variations: 'Variation' }
        : { alergies: 'Alergia', spice: 'Picante Nivel', variations: 'Variación' };

      const allItems = Object.keys(data).flatMap(category => {
        if (!data[category] || data[category].length === 0) return [];
        const title = categoryTitles[category];
        
        return data[category].map(item => {
          if (category === 'spice') {
            return item.level > 0 ? ` ${item.level} ${getIcon(item.icon)}` : null;
          }
          if (category === 'variations') {
            // 👇 CAMBIO: Añade el costo extra si es mayor a 0 👇
            const extraText = item.extra > 0 ? ` +${item.extra}` : '';
            return ` ${item.type}${extraText} ${getIcon(item.icon)}`;
          }
          return ` ${item.type} ${getIcon(item.icon)}`;
        }).filter(Boolean); // Filtra los items nulos (como el picante con nivel 0)
      });

      if (allItems.length === 0) return null;

      return (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs font-custom font-SpaceGrotesk text-gray-600 ml-2">
          {allItems.map((text, index) => (
            <span key={index} className="flex items-center gap-1 whitespace-nowrap">{text}</span>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error rendering Cuidado data for MenuPrint:", error);
      return null;
    }
  }

  return null;
}