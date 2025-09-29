// ARCHIVO: src/components/InlineActionsTask.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Trash2 } from 'lucide-react';
import { updateTask } from '../../../../redux/standaloneTaskActions';
//import { updateTask } from '../store/actions/actions';
// Debounce para no llamar a la API en cada tecleo
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Componente Textarea que se auto-ajusta
const AutoResizingTextarea = ({ value, onChange, ...props }) => {
    const textAreaRef = useRef(null);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return <textarea ref={textAreaRef} value={value} onChange={onChange} {...props} />;
};

const InlineActionsTask = ({ task }) => {
  const dispatch = useDispatch();
  
  const [actions, setActions] = useState([]);
  const [newAction, setNewAction] = useState({ action: '', executer: '', lista: false });

  useEffect(() => {
    try {
      if (task.acciones && typeof task.acciones === 'string') {
        const parsedActions = JSON.parse(task.acciones);
        setActions(Array.isArray(parsedActions) ? parsedActions : []);
      } else {
        setActions([]);
      }
    } catch (error) {
      console.error("Error parsing task actions:", error);
      setActions([]);
    }
  }, [task.acciones]);

  const saveChangesToSupabase = useMemo(
    () => debounce((updatedActions) => {
      const actionsJsonString = JSON.stringify(updatedActions);
      dispatch(updateTask(task.id, { acciones: actionsJsonString }));
    }, 1000),
    [dispatch, task.id]
  );

  const handleActionChange = (index, field, value) => {
    const updatedActions = actions.map((act, i) => 
      i === index ? { ...act, [field]: value } : act
    );
    setActions(updatedActions);
    saveChangesToSupabase(updatedActions);
  };

  const handleNewActionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAction(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddAction = (e) => {
    e.preventDefault();
    if (!newAction.action || !newAction.executer) {
      alert('La acción y el ejecutor son requeridos.');
      return;
    }
    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    saveChangesToSupabase(updatedActions);
    setNewAction({ action: '', executer: '', lista: false });
  };

  const handleDeleteAction = (indexToDelete) => {
    const updatedActions = actions.filter((_, index) => index !== indexToDelete);
    setActions(updatedActions);
    saveChangesToSupabase(updatedActions);
  };

  return (
    <div className="p-2 space-y-2 bg-gray-50">
      {/* Lista de acciones existentes */}
      {actions.length > 0 && (
        <div className="space-y-1">
          {actions.map((act, index) => (
            <div key={index} className={`grid grid-cols-11 gap-x-2 items-start p-1 rounded ${act.lista ? 'bg-green-100 opacity-70' : ''}`}>
              <AutoResizingTextarea
                value={act.action}
                onChange={(e) => handleActionChange(index, 'action', e.target.value)}
                className={`col-span-6 p-1 border rounded text-xs bg-transparent resize-none overflow-hidden ${act.lista ? 'line-through' : ''}`}
                placeholder="Acción"
                rows="1"
              />
              <input
                type="text"
                value={act.executer}
                onChange={(e) => handleActionChange(index, 'executer', e.target.value)}
                className={`col-span-3 p-1 border rounded text-xs bg-transparent self-center ${act.lista ? 'line-through' : ''}`}
                placeholder="Ejecutor"
              />
              <div className="col-span-1 flex items-center justify-center self-center h-full">
                 <input
                    type="checkbox"
                    checked={!!act.lista}
                    onChange={(e) => handleActionChange(index, 'lista', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                 />
              </div>
              <div className="col-span-1 flex justify-end self-center">
                <button onClick={() => handleDeleteAction(index)} className="text-red-500 hover:text-red-700 p-1" title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar nueva acción */}
      <form onSubmit={handleAddAction} className="grid grid-cols-11 gap-x-2 items-center pt-2 border-t">
        <textarea
          name="action"
          value={newAction.action}
          onChange={handleNewActionChange}
          className="col-span-6 p-1 border rounded text-xs resize-none"
          placeholder="Nueva acción..."
          rows="1"
        />
        <input
          type="text"
          name="executer"
          value={newAction.executer}
          onChange={handleNewActionChange}
          className="col-span-3 p-1 border rounded text-xs"
          placeholder="Ejecutor..."
        />
        <div className="col-span-1 flex items-center justify-center">
           <input
              type="checkbox"
              name="lista"
              checked={newAction.lista}
              onChange={handleNewActionChange}
              className="h-4 w-4"
           />
        </div>
        <div className="col-span-1 flex justify-end">
          <button type="submit" className="text-green-600 hover:text-green-800 p-1" title="Agregar">
            <Plus size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InlineActionsTask;