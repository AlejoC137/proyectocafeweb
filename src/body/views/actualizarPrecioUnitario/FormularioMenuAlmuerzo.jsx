import React, { useState, useEffect, useRef } from "react";
import MultiDatePicker from "../../../components/ui/MultiDatePicker";

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
  fechasSeleccionadas: [], // Nuevo arreglo para fechas múltiples
  fecha: { dia: "", fecha: "" }, // Mantener retrocompatibilidad por ahora
  proteina_clasificacion: "", // POLLO, CERDO, RES, OTROS
  entrada: { nombre: "", descripcion: "" },
  proteina: { nombre: "", descripcion: "" },
  proteina_opcion_2: { nombre: "", descripcion: "" },
  carbohidrato: { nombre: "", descripcion: "" },
  acompanante: { nombre: "", descripcion: "" },
  ensalada: { nombre: "", descripcion: "" },
  bebida: { nombre: "", descripcion: "" },
  lista: [],
  parentId: ""
};

function FormularioMenuAlmuerzo({ onMenuChange, initialData, availableLunches = [], currentProductId = null, nombreES = "" }) {
  
  const [form, setForm] = useState(() => {
    let loadedData = initialData ? { ...initialData } : { ...initialState };
    if (loadedData.fecha?.fecha && (!loadedData.fechasSeleccionadas || loadedData.fechasSeleccionadas.length === 0)) {
      loadedData.fechasSeleccionadas = [loadedData.fecha.fecha];
    }
    return loadedData;
  });

  useEffect(() => {
    // Si viene con una fecha singular de un registro antiguo, la ponemos en el arreglo
    let loadedData = initialData ? { ...initialData } : { ...initialState };
    if (loadedData.fecha?.fecha && (!loadedData.fechasSeleccionadas || loadedData.fechasSeleccionadas.length === 0)) {
      loadedData.fechasSeleccionadas = [loadedData.fecha.fecha];
    }
    
    setForm(prevForm => {
      if (JSON.stringify(prevForm) === JSON.stringify(loadedData)) {
        return prevForm;
      }
      return loadedData;
    });
  }, [initialData]);

  const onMenuChangeRef = useRef(onMenuChange);
  useEffect(() => {
    onMenuChangeRef.current = onMenuChange;
  });

  useEffect(() => {
    if (onMenuChangeRef.current) {
      onMenuChangeRef.current(form);
    }
  }, [form]);

  const handleCategoryChange = (categoria, campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor,
      },
    }));
  };

  const handleFechasMultiplesChange = (nuevasFechas) => {
    setForm(prev => {
      // Mantenemos retrocompatibilidad con la primera fecha si existe
      const primeraFecha = nuevasFechas.length > 0 ? nuevasFechas[0] : "";
      const diaSemana = primeraFecha 
        ? new Date(primeraFecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })
        : '';
        
      return {
        ...prev,
        fechasSeleccionadas: nuevasFechas,
        fecha: {
          fecha: primeraFecha,
          dia: diaSemana
        }
      };
    });
  };
  
  return (
    <div className="bg-white p-6">
      <div className="space-y-6">
        
        <div className="bg-gray-50 rounded-md p-4 border flex flex-col md:flex-row gap-6 items-start">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-600">Fechas del Menú</h3>
            <p className="text-xs text-gray-500 mb-3 max-w-[280px]">Selecciona uno o más días. Se creará/actualizará un almuerzo independiente para cada fecha seleccionada.</p>
            <MultiDatePicker 
              selectedDates={form.fechasSeleccionadas || []} 
              onChange={handleFechasMultiplesChange} 
            />
          </div>
          
          {form.fechasSeleccionadas?.length > 0 && (
             <div className="flex-1">
               <h4 className="text-sm font-bold text-gray-700 mb-2">Fechas Seleccionadas ({form.fechasSeleccionadas.length}):</h4>
               <div className="flex flex-wrap gap-2">
                 {form.fechasSeleccionadas.map(f => (
                   <span key={f} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium border border-blue-200">
                     {f}
                   </span>
                 ))}
               </div>
             </div>
          )}
        </div>

        {/* Clasificación de Proteína */}
        <div className="bg-gray-50 rounded-md p-4 border">
          <h3 className="text-lg font-semibold mb-1 text-gray-600">Clasificación Principal</h3>
          <p className="text-xs text-gray-500 mb-3">Define la categoría de proteína para reportes y análisis (POLLO, CERDO, RES, OTROS).</p>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <label className="flex flex-col font-medium text-gray-700 flex-grow w-full md:w-auto">
              Proteína Principal:
              <select
                className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                value={form.proteina_clasificacion || ""}
                onChange={(e) => setForm(prev => ({ ...prev, proteina_clasificacion: e.target.value }))}
              >
                <option value="">-- Seleccionar / Otro --</option>
                <option value="POLLO">POLLO</option>
                <option value="CERDO">CERDO</option>
                <option value="RES">RES</option>
                <option value="OTROS">OTROS</option>
              </select>
            </label>
            <button
              onClick={() => {
                const n = (nombreES || "").toUpperCase();
                let tipo = 'OTROS';
                if (n.includes('POLLO') || n.includes('CHICKEN') || n.includes('MILANESA')) tipo = 'POLLO';
                else if (n.includes('CERDO') || n.includes('COSTILLA') || n.includes('CAÑON') || n.includes('CAÑÓN') || n.includes('LECHONA') || n.includes('TOCINETA')) tipo = 'CERDO';
                else if (n.includes('RES') || n.includes('CARNE') || n.includes('GOULASH') || n.includes('LOMO') || n.includes('BIFE') || n.includes('ASADO') || n.includes('PECHO') || n.includes('ALBONDIGAS') || n.includes('ALBÓNDIGAS')) tipo = 'RES';
                
                setForm(prev => ({ ...prev, proteina_clasificacion: tipo }));
              }}
              type="button"
              className="w-full md:w-auto bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 font-bold py-2 px-4 rounded transition-colors h-[42px]"
            >
              Inferir del Nombre
            </button>
          </div>
        </div>

        {/* Relación de Platos Hermanos / Variación */}
        <div className="bg-gray-50 rounded-md p-4 border">
          <h3 className="text-lg font-semibold mb-1 text-gray-600">Relación de Variación (Platos Hermanos)</h3>
          <p className="text-xs text-gray-500 mb-3">Si este almuerzo es una variación de otro (ej. otra versión de "Arroz con Pollo"), selecciona el plato base para agruparlos en el catálogo.</p>
          <label className="flex flex-col font-medium text-gray-700">
            Plato Base / Principal:
            <select
              className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
              value={form.parentId || ""}
              onChange={(e) => setForm(prev => ({ ...prev, parentId: e.target.value }))}
            >
              <option value="">-- Este es un plato base independiente --</option>
              {availableLunches
                .filter(item => item._id !== currentProductId)
                .map(item => (
                  <option key={item._id} value={item._id}>
                    {item.NombreES}
                  </option>
                ))}
            </select>
          </label>
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
                  value={form?.[key]?.nombre || ''}
                  onChange={(e) => handleCategoryChange(key, "nombre", e.target.value)}
                  placeholder={`Nombre de ${label.toLowerCase()}`}
                />
              </label>
              <label className="flex flex-col font-medium text-gray-700">
                Descripción:
                <textarea
                  className="border border-gray-300 rounded px-3 py-2 mt-1 bg-white"
                  value={form?.[key]?.descripcion || ''}
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