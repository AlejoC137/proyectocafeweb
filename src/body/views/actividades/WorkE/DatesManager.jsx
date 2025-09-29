import React, { useState, useEffect } from 'react';

// Helper para convertir el formato DD/MM/YYYY a YYYY-MM-DD, que es el que necesita el input de tipo "date".
const toInputDate = (dmyString) => {
  if (!dmyString || typeof dmyString !== 'string' || dmyString.split('/').length !== 3) {
    return ''; // Retorna un string vacío si el formato es inválido o no existe
  }
  const [day, month, year] = dmyString.split('/');
  // Asegura que el mes y el día tengan dos dígitos (ej: 09 en vez de 9)
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Helper para convertir el formato YYYY-MM-DD (del input) de vuelta a DD/MM/YYYY para guardarlo.
const toDisplayDate = (ymdString) => {
  if (!ymdString || typeof ymdString !== 'string' || ymdString.split('-').length !== 3) {
    return ''; // Retorna un string vacío si el formato es inválido
  }
  const [year, month, day] = ymdString.split('-');
  return `${day}/${month}/${year}`;
};


const DatesManager = ({ task, onSave }) => {
  
  const parseDates = (datesJson) => {
    try {
      // Si no hay JSON o no es un string, devuelve una estructura por defecto
      if (!datesJson || typeof datesJson !== 'string') {
          return { assignDate: '', dueDate: '', logs: [] };
      }
      const parsed = JSON.parse(datesJson);
      // Asegura que las propiedades existan y que logs sea un array
      return {
          assignDate: parsed.assignDate || '',
          dueDate: parsed.dueDate || '',
          logs: Array.isArray(parsed.logs) ? parsed.logs : []
      };
    } catch (error) {
      console.error("Error parsing dates JSON in DatesManager:", error);
      return { assignDate: '', dueDate: '', logs: [] };
    }
  };

  // El estado local maneja las fechas de la tarea actual, inicializado de forma segura
  const [dates, setDates] = useState(() => parseDates(task.dates));

  // Sincroniza el estado si la tarea que se pasa como prop cambia desde el exterior
  useEffect(() => {
    setDates(parseDates(task.dates));
  }, [task.dates]);


  const handleDateChange = (e) => {
    const { name, value } = e.target; // 'value' del input date viene en formato "YYYY-MM-DD"
    
    // Convierte la fecha al formato DD/MM/YYYY antes de guardarla
    const displayDate = toDisplayDate(value);

    // Crea el objeto de datos actualizado, asegurándose de mantener los logs existentes
    const currentFullDateObject = parseDates(task.dates);
    const updatedDates = { 
        ...currentFullDateObject, 
        [name]: displayDate 
    };
    
    // Llama a la función onSave del componente padre para persistir el cambio inmediatamente
    // CORRECCIÓN: La clave debe ser 'dates' (mayúscula) para coincidir con el nombre de la columna en la BD.
    onSave(task.id, { dates: JSON.stringify(updatedDates) });
  };

  return (
    <div className="flex flex-col gap-1 text-xs p-1">
      <div className="flex items-center justify-between">
        <label htmlFor={`assignDate-${task.id}`} className="font-semibold text-gray-600 mr-2 whitespace-nowrap">Asig:</label>
        <input
          id={`assignDate-${task.id}`}
          name="assignDate"
          type="date"
          value={toInputDate(dates.assignDate)}
          onChange={handleDateChange}
          className="p-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor={`dueDate-${task.id}`} className="font-semibold text-gray-600 mr-2 whitespace-nowrap">Límite:</label>
        <input
          id={`dueDate-${task.id}`}
          name="dueDate"
          type="date"
          value={toInputDate(dates.dueDate)}
          onChange={handleDateChange}
          className="p-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
        />
      </div>
    </div>
  );
};

export default DatesManager;