// ARCHIVO: src/components/TaskActions.jsx

import React from 'react';
import { 
  CheckCircle2, Play, Eye, Flag, Copy, Trash2, X
} from 'lucide-react';

// Estados y Prioridades consistentes con la vista principal
const ESTADOS = {
    ASIGNADO: 'Asignado',
    ACEPTADO: 'Aceptado',
    EN_PROCESO: 'En proceso',
    PAUSADO: 'Pausado',
    POR_REVISION: 'Por revisión',
    TERMINADO: 'Terminado',
};

const PRIORIDADES = {
    ALTA: 'Alta',
    MEDIA_ALTA: 'Media-Alta',
    MEDIA: 'Media',
    MEDIA_BAJA: 'Media-Baja',
    BAJA: 'Baja'
};

const TaskActions = ({ 
  selectedRows, 
  data = [],
  updateMultipleTasks, 
  handleBulkDelete,
  handleDuplicateTasks,
  deselectAll 
}) => {
  // No renderizar nada si no hay filas seleccionadas o si los datos aún no están listos
  if (selectedRows.size === 0 || !data) return null;

  const selectedTasks = data.filter(task => selectedRows.has(task.id));

  // Función para obtener estadísticas de los estados
  const getStatusStats = () => {
    return selectedTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
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
              {/* CORRECCIÓN: Se usó 'EN_PROCESO' en lugar de 'EN_PROGRESO' */}
              <button onClick={() => updateMultipleTasks({ status: ESTADOS.EN_PROCESO })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
                <Play size={14} /> <span>Marcar como En Proceso</span>
              </button>
              {/* CORRECCIÓN: Se usó 'TERMINADO' en lugar de 'COMPLETADO' */}
              <button onClick={() => updateMultipleTasks({ status: ESTADOS.TERMINADO, Progress: 100 })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100">
                <CheckCircle2 size={14} /> <span>Marcar como Terminado</span>
              </button>
              {/* CORRECCIÓN: Se usó 'POR_REVISION' en lugar de 'EN_REVISION' */}
              <button onClick={() => updateMultipleTasks({ status: ESTADOS.POR_REVISION })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
                <Eye size={14} /> <span>Marcar para Revisión</span>
              </button>
            </div>
          </div>

          {/* Cambios de Prioridad */}
          <div className="space-y-2">
             <h4 className="text-sm font-medium text-gray-800">Cambiar Prioridad</h4>
            <div className="flex flex-col space-y-1">
              <button onClick={() => updateMultipleTasks({ Priority: PRIORIDADES.ALTA })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100">
                <Flag size={14} /> <span>Prioridad Alta</span>
              </button>
              <button onClick={() => updateMultipleTasks({ Priority: PRIORIDADES.MEDIA })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100">
                <Flag size={14} /> <span>Prioridad Media</span>
              </button>
              <button onClick={() => updateMultipleTasks({ Priority: PRIORIDADES.BAJA })} className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
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
      </div>
    </div>
  );
};

export default TaskActions;