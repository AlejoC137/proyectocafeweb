import React, { useState, useEffect, useMemo } from 'react';
import { Save, X } from 'lucide-react';

const initialState = {
  task_description: '',
  project_id: '',
  staff_id: '',
  entregableType: '',
  status: 'Pendiente',
  notes: '',
  stage_id: '',
  entregable_id: '',
  Progress: 0,
  dates: JSON.stringify({
    assignDate: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    dueDate: '',
    logs: []
  })
};

const FormTask = ({ isOpen, onClose, onSubmit, proyectos, staff, stages, entregables, estados }) => {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      // Reset form with today's assignDate when opened
      const resetState = {
        ...initialState,
        dates: JSON.stringify({
            assignDate: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            dueDate: '',
            logs: []
        })
      };
      if (proyectos.length > 0) {
        resetState.project_id = proyectos[0].id;
      }
      if (stages.length > 0) {
        resetState.stage_id = stages[0].id;
      }
      setFormData(resetState);
    }
  }, [isOpen, proyectos, stages]);

  const filteredEntregables = useMemo(() => {
    if (!formData.stage_id || !entregables) return [];
    return entregables.filter(e => e.Stage_id === formData.stage_id);
  }, [formData.stage_id, entregables]);
  
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseInt(value, 10) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const currentDates = JSON.parse(prev.dates);
        const updatedDates = { ...currentDates, [name]: value };
        return { ...prev, dates: JSON.stringify(updatedDates) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task_description || !formData.project_id) {
      alert("Por favor, completa la descripción de la tarea y selecciona un proyecto.");
      return;
    }
    onSubmit(formData);
    onClose();
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
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">Proyecto <span className="text-red-500">*</span></label>
              <select id="project_id" name="project_id" value={formData.project_id} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" required>
                {proyectos.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="staff_id" className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <select id="staff_id" name="staff_id" value={formData.staff_id} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none">
                <option value="">-- Sin Asignar --</option>
                {staff.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="stage_id" className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select id="stage_id" name="stage_id" value={formData.stage_id} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none">
                {stages.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
             <div>
              <label htmlFor="entregable_id" className="block text-sm font-medium text-gray-700 mb-1">Entregable</label>
              <select id="entregable_id" name="entregable_id" value={formData.entregable_id} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" disabled={filteredEntregables.length === 0}>
                <option value="">(Opcional)</option>
                {filteredEntregables.map(e => (<option key={e.id} value={e.id}>{e.entregable_nombre}</option>))}
              </select>
            </div>
             <div>
                <label htmlFor="assignDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha Asignación</label>
                <input id="assignDate" name="assignDate" type="text" value={JSON.parse(formData.dates).assignDate} onChange={handleDateChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" placeholder="DD/MM/YYYY" />
            </div>
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
                <input id="dueDate" name="dueDate" type="text" value={JSON.parse(formData.dates).dueDate} onChange={handleDateChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" placeholder="DD/MM/YYYY" />
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