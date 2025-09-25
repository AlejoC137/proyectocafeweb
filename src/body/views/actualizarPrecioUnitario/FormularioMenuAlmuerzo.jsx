import React, { useState, useEffect } from "react";

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
  lista: []
};

function FormularioMenuAlmuerzo({ onMenuChange, initialData }) {
  const [form, setForm] = useState(initialState);

  // --- CORRECCIÓN APLICADA AQUÍ ---
  useEffect(() => {
    // Este efecto se ejecutará cada vez que 'initialData' cambie.
    if (initialData) {
      // Fusionamos el estado inicial base con los datos que llegan (initialData).
      // Esto asegura que si a initialData le falta alguna propiedad (ej. 'ensalada'),
      // el formulario no se rompa y tome la propiedad vacía de 'initialState'.
      setForm({ ...initialState, ...initialData });
    }
  }, []); // <-- CAMBIO CLAVE: Reaccionamos a los cambios en initialData.

  useEffect(() => {
    // Notificamos al componente padre (el Modal) cada vez que el formulario cambia.
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

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    const diaSemana = new Date(nuevaFecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
    setForm(prev => ({
      ...prev,
      fecha: {
        fecha: nuevaFecha,
        dia: diaSemana
      }
    }));
  };

  const fechaMenu = form.fecha?.fecha || '';
  
  return (
    <div className="bg-white p-6">
      <div className="space-y-6">
        
        <div className="bg-gray-50 rounded-md p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-gray-600">Fecha del Menú</h3>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white w-full md:w-1/2"
              value={fechaMenu} 
              onChange={handleFechaChange} // Permitimos cambiar la fecha si es necesario
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