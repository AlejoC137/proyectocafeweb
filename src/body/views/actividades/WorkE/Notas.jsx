import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Trash2 } from 'lucide-react';
import { addNota, updateNota, deleteNota, getAllFromTable } from "../../../../redux/actions.js";

// --- INICIO: FUNCIONES AUXILIARES ---

// 1. Helper para formatear fechas de forma segura y legible
const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    // Verifica si la fecha es válida
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// --- FIN: FUNCIONES AUXILIARES ---


const Notas = () => {
    const dispatch = useDispatch();
    const [notas, setNotas] = useState([]);
    const [newNota, setNewNota] = useState({ content: '', de: '', para: '' });
    const [isLoading, setIsLoading] = useState(true);

    // --- LÓGICA DE DATOS ---
    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const notasAction = await dispatch(getAllFromTable("Notas"));
            const payload = notasAction?.payload || [];

            if (payload.length > 0) {
                // Ordena las notas por la fecha de creación, de más reciente a más antigua
                const sortedPayload = payload.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setNotas(sortedPayload);
            } else {
                setNotas([]);
            }
        } catch (error) {
            console.error("Error al cargar las notas:", error);
            alert("No se pudieron cargar las notas.");
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- MANEJADORES DE EVENTOS ---
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!newNota.content || !newNota.de || !newNota.para) {
            alert("Todos los campos son obligatorios.");
            return;
        }
        setIsLoading(true);

        // Crea el objeto de la nueva nota, incluyendo la fecha actual con el nombre correcto
        const notaToCreate = {
            ...newNota,
            done: false,
            created_at: new Date().toISOString() // CORREGIDO: Usar created_at
        };

        try {
            await dispatch(addNota(notaToCreate));
            setNewNota({ content: '', de: '', para: '' }); // Limpia el formulario
            await fetchAllData(); // Recarga las notas para mostrar la nueva
        } catch (error) {
            alert(`Error al crear la nota: ${error.message}`);
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            // Actualización optimista: elimina la nota de la UI inmediatamente
            setNotas(prevNotas => prevNotas.filter(nota => nota._id !== id));
            try {
                await dispatch(deleteNota(id));
            } catch (error) {
                alert(`Error al eliminar la nota: ${error.message}`);
                // Si hay un error, revierte el cambio recargando los datos del servidor
                fetchAllData();
            }
        }
    };

    const handleToggleDone = async (id, currentDoneStatus) => {
        const newDoneStatus = !currentDoneStatus;
        // Actualización optimista: cambia el estado 'done' en la UI
        setNotas(prevNotas =>
            prevNotas.map(nota => (nota._id === id ? { ...nota, done: newDoneStatus } : nota))
        );
        try {
            await dispatch(updateNota(id, { done: newDoneStatus }));
        } catch (error) {
            alert(`Error al actualizar la nota: ${error.message}`);
            // Si hay un error, revierte el cambio
            fetchAllData();
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="flex flex-col h-full font-sans">
            <main className="flex-1 overflow-auto p-2">
                <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Formulario de Creación */}
                    <form onSubmit={handleCreateSubmit} className="bg-white p-3 rounded-lg border border-sky-300 shadow-sm">
                        <fieldset disabled={isLoading}>
                            <textarea
                                name="content"
                                value={newNota.content}
                                onChange={e => setNewNota({ ...newNota, content: e.target.value })}
                                placeholder="Escribe una nueva nota aquí..."
                                className="w-full p-2 border rounded-md resize-y text-base"
                                rows="3"
                                required
                            />
                            <div className="mt-2 flex items-center gap-3">
                                <input
                                    type="text"
                                    name="de"
                                    value={newNota.de}
                                    onChange={e => setNewNota({ ...newNota, de: e.target.value })}
                                    placeholder="De:"
                                    className="p-2 border rounded-md text-sm w-full flex-1"
                                    required
                                />
                                <input
                                    type="text"
                                    name="para"
                                    value={newNota.para}
                                    onChange={e => setNewNota({ ...newNota, para: e.target.value })}
                                    placeholder="Para:"
                                    className="p-2 border rounded-md text-sm w-full flex-1"
                                    required
                                />
                                <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-400">
                                    <Plus size={16} />
                                    <span>Nota</span>
                                </button>
                            </div>
                        </fieldset>
                    </form>

                    {/* Lista de Notas */}
                    {isLoading && <div className="text-center p-8">Cargando notas...</div>}

                    {!isLoading && notas.map((item) => (
                        <div key={item._id} className={`bg-white border rounded-lg shadow-sm p-3 space-y-2 ${item.done ? 'opacity-60 bg-slate-50' : ''}`}>
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={!!item.done}
                                    onChange={() => handleToggleDone(item._id, item.done)}
                                    className="h-5 w-5 mt-1 shrink-0 cursor-pointer"
                                />
                                <p className={`w-full text-base whitespace-pre-wrap ${item.done ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                    {item.content}
                                </p>
                                <button onClick={() => handleDelete(item._id)} className="text-slate-400 hover:text-red-600 shrink-0">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="pl-8 flex justify-between items-center text-xs text-slate-500">
                                <span>De: <strong className="font-medium text-slate-600">{item.de}</strong></span>
                                <span>Para: <strong className="font-medium text-slate-600">{item.para}</strong></span>
                                {/* CORREGIDO: Muestra la fecha usando created_at */}
                                <span>{formatDate(item.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Notas;