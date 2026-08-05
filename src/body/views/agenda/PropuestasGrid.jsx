import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateItem, getAllFromTable, crearItem } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function PropuestasGrid({ propuestas = [], onFormalizar }) {
    const dispatch = useDispatch();
    const [mostrarForm, setMostrarForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nuevaIdea, setNuevaIdea] = useState({
        nombreES: "",
        infoAdicional: "",
        fecha: "",
        horaInicio: "",
        nombreCliente: "",
        estado_proceso: "idea",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevaIdea((prev) => ({ ...prev, [name]: value }));
    };

    const handleGuardarIdea = async (e) => {
        e.preventDefault();
        if (!nuevaIdea.nombreES.trim()) {
            alert("Por favor ingresa al menos el nombre de la idea");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                nombreES: nuevaIdea.nombreES.trim(),
                nombreEN: nuevaIdea.nombreES.trim(),
                infoAdicional: nuevaIdea.infoAdicional.trim() || null,
                decripcion: nuevaIdea.infoAdicional.trim() || null,
                fecha: nuevaIdea.fecha ? nuevaIdea.fecha : null,
                horaInicio: nuevaIdea.horaInicio ? nuevaIdea.horaInicio : null,
                nombreCliente: nuevaIdea.nombreCliente.trim() || null,
                estado_proceso: nuevaIdea.estado_proceso || "idea",
                ejecutado: null,
                numeroPersonas: "1",
            };

            await dispatch(crearItem(payload, AGENDA));
            dispatch(getAllFromTable(AGENDA));

            setNuevaIdea({
                nombreES: "",
                infoAdicional: "",
                fecha: "",
                horaInicio: "",
                nombreCliente: "",
                estado_proceso: "idea",
            });
            setMostrarForm(false);
        } catch (error) {
            console.error("Error guardando la propuesta:", error);
            alert("No se pudo crear la propuesta.");
        } finally {
            setLoading(false);
        }
    };

    const handleConvertirAAgenda = async (item) => {
        try {
            await dispatch(
                updateItem(
                    item._id,
                    {
                        ejecutado: false,
                        estado_proceso: "confirmada",
                    },
                    AGENDA
                )
            );
            dispatch(getAllFromTable(AGENDA));
        } catch (error) {
            console.error("Error convirtiendo a agenda:", error);
        }
    };

    const getEstadoBadge = (estado) => {
        const map = {
            idea: "💡 Idea",
            propuesta_estructurada: "📝 Propuesta",
            pre_acuerdos: "🤝 Pre-acuerdo",
            confirmada: "✅ Confirmada",
        };
        return map[estado] || estado || "💡 Idea";
    };

    return (
        <div className="w-full space-y-1 p-0 m-0">
            {/* Encabezado denso */}
            <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-1 px-3 pt-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm">💡</span>
                    <h2 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        Propuestas e Ideas
                    </h2>
                    <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-extrabold">
                        {propuestas.length}
                    </span>
                </div>
                <Button
                    onClick={() => setMostrarForm(!mostrarForm)}
                    size="sm"
                    className="h-6 text-[10px] px-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold shadow-none border border-purple-200"
                >
                    {mostrarForm ? "✕ Cancelar" : "+ Crear"}
                </Button>
            </div>

            {/* Renglón de creación */}
            {mostrarForm && (
                <div className="px-2">
                    <form
                        onSubmit={handleGuardarIdea}
                        className="bg-purple-50 border border-purple-200 p-2 mb-2 flex flex-col gap-2 shadow-sm text-xs rounded"
                    >
                    <div className="font-bold text-purple-900 mb-1">Nueva Idea:</div>
                    
                    <input
                        type="text"
                        name="nombreES"
                        value={nuevaIdea.nombreES}
                        onChange={handleInputChange}
                        placeholder="Nombre de la idea... *"
                        className="w-full p-1.5 border border-gray-300 rounded bg-white outline-none focus:border-purple-500"
                        required
                    />

                    <div className="flex gap-2">
                        <input
                            type="date"
                            name="fecha"
                            value={nuevaIdea.fecha}
                            onChange={handleInputChange}
                            className="w-1/2 p-1.5 border border-gray-300 rounded bg-white text-gray-700"
                            title="Posible fecha"
                        />
                        <input
                            type="time"
                            name="horaInicio"
                            value={nuevaIdea.horaInicio}
                            onChange={handleInputChange}
                            className="w-1/2 p-1.5 border border-gray-300 rounded bg-white text-gray-700"
                            title="Posible hora"
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="nombreCliente"
                            value={nuevaIdea.nombreCliente}
                            onChange={handleInputChange}
                            placeholder="Cliente/Aliado..."
                            className="w-1/2 p-1.5 border border-gray-300 rounded bg-white outline-none focus:border-purple-500"
                        />
                        <select
                            name="estado_proceso"
                            value={nuevaIdea.estado_proceso}
                            onChange={handleInputChange}
                            className="w-1/2 p-1.5 border border-gray-300 rounded bg-white outline-none font-medium"
                        >
                            <option value="idea">💡 Idea</option>
                            <option value="propuesta_estructurada">📝 Propuesta</option>
                            <option value="pre_acuerdos">🤝 Pre-acuerdos</option>
                            <option value="confirmada">✅ Confirmada</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        name="infoAdicional"
                        value={nuevaIdea.infoAdicional}
                        onChange={handleInputChange}
                        placeholder="Descripción corta..."
                        className="w-full p-1.5 border border-gray-300 rounded bg-white outline-none focus:border-purple-500"
                    />

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-8 text-[11px] bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-sm mt-1"
                    >
                        {loading ? "Guardando..." : "Guardar Idea"}
                    </Button>
                </form>
                </div>
            )}

            {/* Lista de tarjetas sin padding horizontal para que toquen los bordes */}
            <div className="w-full space-y-[1px] pb-2">
                {propuestas.length === 0 ? (
                    <div className="w-full text-center py-4 text-[11px] text-gray-400">
                        No hay propuestas pendientes.
                    </div>
                ) : (
                    propuestas.map((item) => (
                        <div
                            key={item._id}
                            className="w-full bg-white border-y border-gray-800 hover:bg-purple-50 p-2.5 flex flex-col gap-2 shadow-sm text-xs h-auto overflow-visible transition-colors cursor-default"
                        >
                            {/* FILA SUPERIOR: Todo en un solo renglón */}
                            <div className="flex flex-nowrap items-center gap-2 w-full overflow-hidden">
                                <span 
                                    className="font-black text-gray-900 uppercase text-[11px] tracking-tight truncate flex-1"
                                    title={item.nombre || item.nombreES || "Sin Nombre"}
                                >
                                    {item.nombre || item.nombreES || "Sin Nombre"}
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {item.nombreCliente && (
                                        <span className="text-gray-700 font-semibold text-[10px] whitespace-nowrap">
                                            🤝 {item.nombreCliente.split(" ")[0]}
                                        </span>
                                    )}
                                    <span className="text-purple-700 text-[9px] font-extrabold uppercase whitespace-nowrap">
                                        {getEstadoBadge(item.estado_proceso)}
                                    </span>
                                    
                                    <span className="bg-gray-100 px-1 py-0.5 rounded border border-gray-300 text-[9px] font-bold text-gray-800 whitespace-nowrap">
                                        📅 {item.fecha || "S/F"}
                                    </span>

                                    <Button
                                        onClick={() => handleConvertirAAgenda(item)}
                                        size="sm"
                                        className="h-5 w-6 p-0 bg-black hover:bg-purple-700 text-white rounded shrink-0 flex items-center justify-center"
                                        title="Pasar a Agenda"
                                    >
                                        <ArrowRight size={12} />
                                    </Button>
                                </div>
                            </div>

                            {/* FILA INFERIOR: Descripción completa visible sin límites */}
                            {(item.infoAdicional || item.decripcion) && (
                                <div className="w-full pt-1 border-t border-gray-200 text-[11px] text-gray-600 font-medium break-words overflow-visible">
                                    {item.infoAdicional || item.decripcion}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PropuestasGrid;