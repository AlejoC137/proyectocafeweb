// ARCHIVO: src/body/views/actividades/WorkE/FormTask.jsx

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

const initialState = {
  task_description: '',
  Responsable: '',
  entregableType: '',
  status: 'Asignado', // Un estado inicial más lógico
  notes: '',
  Progress: 0,
  Priority: 'Media',
  dates: JSON.stringify({
    assignDate: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    dueDate: '',
    logs: []
  })
};

const FormTask = ({ isOpen, onClose, onSubmit, staff, areas, prioridades, estados }) => {
  
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const formattedDate = today.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      // Reiniciar el formulario cada vez que se abre
      setFormData({
        ...initialState,
        dates: JSON.stringify({
          assignDate: formattedDate,
          dueDate: '',
          logs: [{
              date: today.toISOString(),
              user: 'Sistema',
              action: `Tarea creada con fecha de asignación ${formattedDate}`
          }]
        })
      });
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // Formatear la fecha a DD/MM/YYYY si es un input de tipo 'date'
    let finalValue = value;
    if (e.target.type === 'date' && value) {
        const [year, month, day] = value.split('-');
        finalValue = `${day}/${month}/${year}`;
    }

    setFormData(prev => {
        const currentDates = JSON.parse(prev.dates);
        const updatedDates = { ...currentDates, [name]: finalValue };
        return { ...prev, dates: JSON.stringify(updatedDates) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task_description) {
      alert("Por favor, completa la descripción de la tarea.");
      return;
    }
    onSubmit(formData);
    onClose();
  };

  // Convertir fechas DD/MM/YYYY a YYYY-MM-DD para el input tipo 'date'
  const toInputDate = (dateString) => {
      if (!dateString || typeof dateString !== 'string') return '';
      const parts = dateString.split('/');
      if (parts.length !== 3) return '';
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-down">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Crear Nueva Tarea</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="task_description" className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
              <textarea id="task_description" name="task_description" value={formData.task_description} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" required></textarea>
            </div>
            
            <div>
              <label htmlFor="entregableType" className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <select id="entregableType" name="entregableType" value={formData.entregableType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none">
                <option value="">-- Seleccionar Área --</option>
                {areas.map(area => (<option key={area} value={area}>{area}</option>))}
              </select>
            </div>

            <div>
              <label htmlFor="Responsable" className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <select id="Responsable" name="Responsable" value={formData.Responsable} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none">
                {/* **CORRECCIÓN: Mapear el array de objetos 'staff', usando el ID como valor.** */}
                <option value="">-- Seleccionar Responsable --</option>
                {staff.map(s => (<option key={s.id} value={s.id}>{s.Nombre}</option>))}
              </select>
            </div>

            <div>
              <label htmlFor="Priority" className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select id="Priority" name="Priority" value={formData.Priority} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none">
                {prioridades.map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>

            <div>
               <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
               <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none">
                 {Object.values(estados).map(s => (<option key={s} value={s}>{s}</option>))}
               </select>
            </div>
            
            <div>
               <label htmlFor="assignDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha Asignación</label>
               <input id="assignDate" name="assignDate" type="date" value={toInputDate(JSON.parse(formData.dates).assignDate)} onChange={handleDateChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" />
            </div>

            <div>
               <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
               <input id="dueDate" name="dueDate" type="date" value={toInputDate(JSON.parse(formData.dates).dueDate)} onChange={handleDateChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"></textarea>
            </div>
          </div>
          <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-2">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save size={16} />Guardar Tarea</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormTask;