import React, { useState, useEffect } from "react";

// **CORRECCIÓN APLICADA AQUÍ** (Error tipográfico en "Opción")
const categorias = [
  { key: "entrada", label: "Entrada" },
  { key: "proteina", label: "Proteína" },
  { key: "proteina_opcion_2", label: "Opción 2" },
  { key: "carbohidrato", label: "Carbohidrato" },
  { key: "acompanante", label: "Acompañante" },
  { key: "ensalada", label: "Ensalada" },
  { key: "bebida", label: "Bebida" },
];

const initialState = {
  fecha: { dia: "", fecha: "" },
  entrada: { nombre: "", descripcion: "" },
  proteina: { nombre: "", descripcion: "" },
  proteina_opcion_2: { nombre: "", descripcion: "" },
  carbohidrato: { nombre: "", descripcion: "" },
  acompanante: { nombre: "", descripcion: "" },
  ensalada: { nombre: "", descripcion: "" },
  bebida: { nombre: "", descripcion: "" },
};

function FormularioMenuAlmuerzo({ onMenuChange, initialData }) {
  const [form, setForm] = useState(initialData || initialState);

  useEffect(() => {
    setForm(initialData || initialState);
  }, [initialData]);

  useEffect(() => {
    if (onMenuChange) {
      onMenuChange(form);
    }
  }, [form, onMenuChange]);

  const handleCategoryChange = (categoria, campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor,
      },
    }));
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value; 

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
        
        <div className="bg-gray-50 rounded-md p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-gray-600">Fecha del Menú</h3>
            <input
              type="date"
              name="fecha"
              className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white w-full md:w-1/2"
              value={form.fecha?.fecha || ''} 
              onChange={handleDateChange}
            />
        </div>

        {categorias.map(({ key, label }) => (
          <div key={key} className="bg-gray-50 rounded-md p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-gray-600">{label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col font-medium text-gray-700">
                Nombre:
                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                  value={form[key]?.nombre || ''}
                  onChange={(e) => handleCategoryChange(key, "nombre", e.target.value)}
                  placeholder={`Nombre de ${label.toLowerCase()}`}
                />
              </label>
              <label className="flex flex-col font-medium text-gray-700">
                Descripción:
                <textarea
                  className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                  value={form[key]?.descripcion || ''}
                  onChange={(e) => handleCategoryChange(key, "descripcion", e.target.value)}
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