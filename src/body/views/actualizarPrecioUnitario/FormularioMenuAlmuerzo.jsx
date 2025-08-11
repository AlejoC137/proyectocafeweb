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
  fecha: { dia: "", fecha: "" }, // Estructura solicitada
  entrada: { nombre: "", descripcion: "" },
  proteina: { nombre: "", descripcion: "" },
  carbohidrato: { nombre: "", descripcion: "" },
  acompanante: { nombre: "", descripcion: "" },
  ensalada: { nombre: "", descripcion: "" },
  bebida: { nombre: "", descripcion: "" },
};

/**
 * Formulario para capturar los componentes de un menú de almuerzo.
 * Comunica su estado completo, incluyendo el objeto de fecha, a un componente padre
 * a través de la prop `onMenuChange`.
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onMenuChange - Función callback para notificar cambios al padre.
 */
function FormularioMenuAlmuerzo({ onMenuChange }) {
  const [form, setForm] = useState(initialState);

  // useEffect se ejecuta cada vez que el estado 'form' cambia.
  useEffect(() => {
    // Si la función 'onMenuChange' fue pasada como prop, la llama con el estado actual.
    if (onMenuChange) {
      onMenuChange(form);
    }
  }, [form, onMenuChange]); // Dependencias del efecto.

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
   * Maneja el cambio en el input de fecha, calcula el día de la semana
   * y actualiza el estado.
   */
  const handleDateChange = (e) => {
    const selectedDate = e.target.value; // Formato: "YYYY-MM-DD"

    // Si la fecha se borra, resetea el estado de la fecha.
    if (!selectedDate) {
      setForm((prev) => ({ ...prev, fecha: { dia: "", fecha: "" } }));
      return;
    }

    // Se añade 'T00:00:00' para evitar problemas de zona horaria que podrían
    // resultar en el día incorrecto.
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    
    // Obtiene el nombre del día de la semana en español.
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
                value={form.fecha.fecha || ''} // Se enlaza al campo anidado 'fecha'
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
                  value={form[key].nombre}
                  onChange={(e) =>
                    handleCategoryChange(key, "nombre", e.target.value)
                  }
                  placeholder={`Nombre de ${label.toLowerCase()}`}
                />
              </label>
              <label className="flex flex-col font-medium text-gray-700">
                Descripción:
                <textarea
                  className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                  value={form[key].descripcion}
                  onChange={(e) =>
                    handleCategoryChange(key, "descripcion", e.target.value)
                  }
                  placeholder={`Descripción de ${label.toLowerCase()}`}
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
