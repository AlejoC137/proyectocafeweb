import React, { useState, useEffect } from 'react';
import { Plus, X, Save, CalendarDays } from 'lucide-react';

const TaskLog = ({ task, onSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const parseDates = (datesJson) => {
        try {
            if (!datesJson || typeof datesJson !== 'string') {
                return { assignDate: '', dueDate: '', logs: [] };
            }
            const parsed = JSON.parse(datesJson);
            if (!Array.isArray(parsed.logs)) {
                parsed.logs = [];
            }
            return parsed;
        } catch (error) {
            console.error("Error parsing dates JSON:", error, datesJson);
            return { assignDate: '', dueDate: '', logs: [] };
        }
    };

    // SOLUCIÓN: Se inicializa el estado de forma perezosa para que solo se ejecute una vez.
    const [dates, setDates] = useState(() => parseDates(task.dates));
    const [newEvent, setNewEvent] = useState('');

    // SOLUCIÓN: Se usa useEffect para sincronizar el estado si la prop 'task.dates' cambia.
    useEffect(() => {
        if (isModalOpen) { // Solo actualiza si el modal está abierto para optimizar
            setDates(parseDates(task.dates));
        }
    }, [task.dates, isModalOpen]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDates(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLog = (e) => {
        e.preventDefault();
        if (!newEvent.trim()) return;
        const newLog = {
            date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            event: newEvent
        };
        setDates(prev => ({
            ...prev,
            logs: [...(prev.logs || []), newLog]
        }));
        setNewEvent('');
    };
    
    const handleSave = () => {
        onSave(task.id, { dates: JSON.stringify(dates) });
        setIsModalOpen(false);
    };

    const logsCount = parseDates(task.dates).logs.length;

    return (
        <>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="text-blue-600 hover:underline text-xs flex items-center gap-1 w-full justify-center p-1 rounded-md hover:bg-blue-50"
              title="Gestionar Fechas y Bitácora"
            >
                <CalendarDays size={14}/> 
                <span>Bitácora ({logsCount})</span>
            </button>
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16 p-4 animate-fade-in-down">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Gestionar Fechas y Bitácora: <span className="text-blue-600">{task.task_description}</span></h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                           
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Bitácora de Eventos</h3>
                                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 mb-4 bg-gray-50">
                                    {dates.logs && dates.logs.length > 0 ? (
                                        dates.logs.slice().reverse().map((log, index) => (
                                            <div key={index} className="text-sm p-1.5 border-b last:border-b-0">
                                                <span className="font-semibold text-gray-600">{log.date}: </span>
                                                <span className="text-gray-700">{log.event}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center p-4">No hay eventos en la bitácora.</p>
                                    )}
                                </div>
                                <form onSubmit={handleAddLog} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newEvent} 
                                        onChange={(e) => setNewEvent(e.target.value)} 
                                        className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none"
                                        placeholder="Añadir nuevo evento..."
                                    />
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                        <Plus size={16} /> Añadir
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-2">Cancelar</button>
                            <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Save size={16} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskLog;