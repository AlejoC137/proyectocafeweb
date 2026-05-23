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
        <div className="flex flex-col h-full font-sans bg-transparent">
            <main className="flex-1 overflow-auto p-1 sm:p-2">
                <div className="space-y-3 max-w-4xl mx-auto">
                    {/* Formulario de Creación */}
                    <form onSubmit={handleCreateSubmit} className="bg-surface-card p-2 rounded-lg border border-outline-variant shadow-sm flex flex-col gap-2">
                        <fieldset disabled={isLoading}>
                            <textarea
                                name="content"
                                value={newNota.content}
                                onChange={e => setNewNota({ ...newNota, content: e.target.value })}
                                placeholder="Escribe una nueva nota aquí..."
                                className="w-full p-2 border border-outline-variant bg-surface-main rounded-md resize-y text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none"
                                rows="2"
                                required
                            />
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    name="de"
                                    value={newNota.de}
                                    onChange={e => setNewNota({ ...newNota, de: e.target.value })}
                                    placeholder="De:"
                                    className="p-1.5 border border-outline-variant bg-surface-main rounded-md text-xs w-full flex-1 focus:ring-1 focus:ring-primary-stitch outline-none"
                                    required
                                />
                                <input
                                    type="text"
                                    name="para"
                                    value={newNota.para}
                                    onChange={e => setNewNota({ ...newNota, para: e.target.value })}
                                    placeholder="Para:"
                                    className="p-1.5 border border-outline-variant bg-surface-main rounded-md text-xs w-full flex-1 focus:ring-1 focus:ring-primary-stitch outline-none"
                                    required
                                />
                                <button type="submit" className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-white bg-primary-stitch rounded-md hover:brightness-110 disabled:bg-surface-variant disabled:text-outline transition-all active:scale-95">
                                    <Plus size={14} />
                                    <span>Nota</span>
                                </button>
                            </div>
                        </fieldset>
                    </form>

                    {/* Lista de Notas */}
                    {isLoading && <div className="text-center p-8">Cargando notas...</div>}

                    {!isLoading && notas.map((item) => (
                        <div key={item._id} className={`bg-surface-card border border-outline-variant rounded-lg shadow-sm p-2 space-y-1.5 ${item.done ? 'opacity-50 bg-surface-container' : ''}`}>
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!item.done}
                                    onChange={() => handleToggleDone(item._id, item.done)}
                                    className="h-4 w-4 mt-0.5 shrink-0 cursor-pointer accent-primary-stitch"
                                />
                                <p className={`w-full text-body-sm whitespace-pre-wrap leading-tight ${item.done ? 'line-through text-outline' : 'text-on-surface'}`}>
                                    {item.content}
                                </p>
                                <button onClick={() => handleDelete(item._id)} className="text-outline hover:bg-error-container hover:text-error p-1 rounded-md transition-colors shrink-0">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="pl-6 flex justify-between items-center text-[10px] text-on-surface-variant">
                                <span>De: <strong className="font-medium text-on-surface">{item.de}</strong></span>
                                <span>Para: <strong className="font-medium text-on-surface">{item.para}</strong></span>
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