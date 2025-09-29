// ARCHIVO: src/components/TaskActions.jsx

import React from 'react';
import { 
  CheckCircle2, Play, Eye, Flag, Copy, Trash2, X, Users
} from 'lucide-react';

// Traemos los mismos estados para consistencia
const ESTADOS = {
  PENDIENTE: 'Pendiente', EN_PROCESO: 'En Progreso', COMPLETADO: 'Completado',
  EN_REVISION: 'En Revisión'
};

const PRIORITIES = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja'
};

const TaskActions = ({ 
  selectedRows, 
  data, 
  staff, 
  updateMultipleTasks, 
  handleBulkDelete,
  handleDuplicateTasks,
  deselectAll 
}) => {
  // No renderizar nada si no hay filas seleccionadas
  if (selectedRows.size === 0) return null;

  const selectedTasks = data.filter(task => selectedRows.has(task.id));

  // Función para obtener estadísticas de los estados de las tareas seleccionadas
  const getStatusStats = () => {
    const stats = selectedTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const statusStats = getStatusStats();

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-2xl border p-4 min-w-[700px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-800">{selectedRows.size}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {selectedRows.size} tarea{selectedRows.size > 1 ? 's' : ''} seleccionada{selectedRows.size > 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={deselectAll} className="text-gray-400 hover:text-gray-600 p-1" title="Deseleccionar todo">
            <X size={18} />
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex items-center space-x-4 mb-4 text-xs text-gray-600 border-t pt-3">
          {Object.entries(statusStats).map(([status, count]) => (
            <span key={status} className="flex items-center space-x-1.5">
              <span className="font-semibold">{status}:</span>
              <span>{count}</span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Cambios de Estado */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">Cambiar Estado</h4>
            <div className="flex flex-col space-y-1">
              <button onClick={() => updateMultipleTasks({ status: ESTADOS.EN_PROCESO })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
                <Play size={14} /> <span>Marcar como En Progreso</span>
              </button>
              <button onClick={() => updateMultipleTasks({ status: ESTADOS.COMPLETADO, Progress: 100 })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100">
                <CheckCircle2 size={14} /> <span>Marcar como Completado</span>
              </button>
              <button onClick={() => updateMultipleTasks({ status: ESTADOS.EN_REVISION })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
                <Eye size={14} /> <span>Marcar para Revisión</span>
              </button>
            </div>
          </div>

          {/* Cambios de Prioridad y Acciones */}
          <div className="space-y-2">
             <h4 className="text-sm font-medium text-gray-800">Cambiar Prioridad</h4>
            <div className="flex flex-col space-y-1">
              <button onClick={() => updateMultipleTasks({ Priority: PRIORITIES.ALTA })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100">
                <Flag size={14} /> <span>Prioridad Alta</span>
              </button>
              <button onClick={() => updateMultipleTasks({ Priority: PRIORITIES.MEDIA })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100">
                <Flag size={14} /> <span>Prioridad Media</span>
              </button>
              <button onClick={() => updateMultipleTasks({ Priority: PRIORITIES.BAJA })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                <Flag size={14} /> <span>Prioridad Baja</span>
              </button>
            </div>
          </div>

          {/* Otras Acciones */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">Otras Acciones</h4>
            <div className="flex flex-col space-y-1">
              <button onClick={handleDuplicateTasks} className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100">
                <Copy size={14} /> <span>Duplicar Tareas</span>
              </button>
              <button onClick={handleBulkDelete} className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100">
                <Trash2 size={14} /> <span>Eliminar Tareas</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Asignación rápida de responsables */}
        {staff && staff.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Asignar a:</h4>
            <div className="flex flex-wrap gap-2">
              {staff.map(member => (
                <button
                  key={member.id}
                  onClick={() => updateMultipleTasks({ staff_id: member.id })}
                  className="flex items-center space-x-2 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                >
                  <Users size={12} />
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskActions;