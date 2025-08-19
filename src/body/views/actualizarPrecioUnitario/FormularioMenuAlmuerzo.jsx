import React, { useState, useEffect } from "react";

// Define las categorías del menú para iterar y crear el formulario.
const categorias = [
  { key: "entrada", label: "Entrada" },
  { key: "proteina", label: "Proteína" },
  { key: "carbohidrato", label: "Carbohidrato" },
  { key: "acompanante", label: "Acompañante" },
  { key: "ensalada", label: "Ensalada" },
  { key: "bebida", label: "Bebida" },
];

// Define el estado inicial, con el campo 'fecha' como un objeto.
const initialState = {
  fecha: { dia: "", fecha: "" },
  entrada: { nombre: "", descripcion: "" },
  proteina: { nombre: "", descripcion: "" },
  carbohidrato: { nombre: "", descripcion: "" },
  acompanante: { nombre: "", descripcion: "" },
  ensalada: { nombre: "", descripcion: "" },
  bebida: { nombre: "", descripcion: "" },
};

/**
 * Formulario para capturar los componentes de un menú de almuerzo.
 * Acepta `initialData` para pre-llenar los campos del formulario.
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onMenuChange - Callback para notificar cambios al padre.
 * @param {Object} [props.initialData] - Datos iniciales para rellenar el formulario.
 */
function FormularioMenuAlmuerzo({ onMenuChange, initialData }) {
  // El estado se inicializa con initialData si existe, si no, con el estado vacío.
  const [form, setForm] = useState(initialData || initialState);

  // Este efecto sincroniza el estado del formulario si la prop initialData cambia.
  useEffect(() => {
    // Si se proveen nuevos datos iniciales, se actualiza el estado del formulario.
    // Esto asegura que si el usuario selecciona otro ítem, el formulario muestre los datos correctos.
    setForm(initialData || initialState);
  }, [initialData]);

  // Este efecto notifica al componente padre cada vez que el estado 'form' cambia.
  useEffect(() => {
    if (onMenuChange) {
      onMenuChange(form);
    }
  }, [form, onMenuChange]);

  /**
   * Actualiza el estado de los campos anidados (categorías del menú).
   */
  const handleCategoryChange = (categoria, campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor,
      },
    }));
  };

  /**
   * Maneja el cambio en el input de fecha, calcula el día de la semana y actualiza el estado.
   */
  const handleDateChange = (e) => {
    const selectedDate = e.target.value; // Formato: "YYYY-MM-DD"

    if (!selectedDate) {
      setForm((prev) => ({ ...prev, fecha: { dia: "", fecha: "" } }));
      return;
    }
    
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const dayOfWeek = dateObj.toLocaleDateString('es-CO', { weekday: 'long' });

    setForm((prev) => ({
      ...prev,
      fecha: {
        dia: dayOfWeek,
        fecha: selectedDate,
      },
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg mt-6 border">
      <h2 className="text-xl font-bold mb-6 text-gray-700">Componentes del Menú del Día</h2>
      <div className="space-y-6">
        
        {/* Sección para el selector de fecha */}
        <div className="bg-gray-50 rounded-md p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-gray-600">Fecha del Menú</h3>
            <input
                type="date"
                name="fecha"
                className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white w-full md:w-1/2"
                // Aseguramos que el valor sea el correcto o un string vacío si no existe
                value={form.fecha?.fecha || ''} 
                onChange={handleDateChange}
            />
        </div>

        {/* Mapeo de las categorías existentes */}
        {categorias.map(({ key, label }) => (
          <div key={key} className="bg-gray-50 rounded-md p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-gray-600">{label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col font-medium text-gray-700">
                Nombre:
                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                  // Usamos optional chaining (?.) y '||' para más seguridad
                  value={form[key]?.nombre || ''}
                  onChange={(e) =>
                    handleCategoryChange(key, "nombre", e.target.value)
                  }
                  // El placeholder muestra el dato inicial o un texto genérico
                  placeholder={
                    initialData?.[key]?.nombre || `Nombre de ${label.toLowerCase()}`
                  }
                />
              </label>
              <label className="flex flex-col font-medium text-gray-700">
                Descripción:
                <textarea
                  className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                  value={form[key]?.descripcion || ''}
                  onChange={(e) =>
                    handleCategoryChange(key, "descripcion", e.target.value)
                  }
                  // El placeholder muestra el dato inicial o un texto genérico
                  placeholder={
                    initialData?.[key]?.descripcion || `Descripción de ${label.toLowerCase()}`
                  }
                  rows={2}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FormularioMenuAlmuerzo;