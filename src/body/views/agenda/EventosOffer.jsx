import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllFromTable } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import PageLayout from "@/components/ui/page-layout";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Users,
    Utensils,
    MonitorPlay,
    Info,
    X,
    Play,
    Ticket,
    Instagram,
    Share2,
    Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import supabase from "@/config/supabaseClient";

export default function EventosOffer() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const allAgenda = useSelector((state) => state.allAgenda || []);

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [attendeeCounts, setAttendeeCounts] = useState({});
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProposalOpen, setIsProposalOpen] = useState(false);
    const [proposalForm, setProposalForm] = useState({
        presentacion: "",
        descripcion: "",
    });
    const [copiedShare, setCopiedShare] = useState(false);

    // Border color constant (not pure black)
    const borderColor = "border-[#1F2937]";
    const shadowColor = "shadow-[#1F2937]";

    // Cargar datos
    useEffect(() => {
        dispatch(getAllFromTable(AGENDA));
        const fetchCounts = async () => {
            const { data, error } = await supabase.from('attendees').select('evento_id');
            if (data && !error) {
                const counts = {};
                data.forEach(a => {
                    counts[a.evento_id] = (counts[a.evento_id] || 0) + 1;
                });
                setAttendeeCounts(counts);
            }
        };
        fetchCounts();
    }, [dispatch]);

    // Manejar ID desde la URL
    useEffect(() => {
        const eventId = searchParams.get("id");
        if (eventId && allAgenda.length > 0) {
            const found = allAgenda.find(e => e._id === eventId || (e._id && e._id.toString().startsWith(eventId)));
            if (found) {
                setSelectedEvent(found);
                setIsModalOpen(true);
            }
        }
    }, [searchParams, allAgenda]);

    const changeMonth = (offset) => {
        const [year, month] = selectedMonth.split("-").map(Number);
        const newDate = new Date(year, month - 1 + offset, 1);
        setSelectedMonth(newDate.toISOString().slice(0, 7));
    };

    const eventosFiltrados = useMemo(() => {
        return allAgenda
            .filter((evento) => {
                const matchesMonth = evento.fecha?.startsWith(selectedMonth);
                const matchesStatus = evento.estado === 'aprobado' || !evento.estado;
                return matchesMonth && matchesStatus;
            })
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }, [allAgenda, selectedMonth]);

    const handleEventClick = (evento) => {
        setSelectedEvent(evento);
        setIsModalOpen(true);
        setSearchParams({ id: evento._id.substring(0, 8) });
    };

    const handleModalClose = (open) => {
        setIsModalOpen(open);
        if (!open) {
            setSearchParams({});
        }
    };

    const getServiciosFlags = (servicios) => {
        let hasFood = false;
        let hasAV = false;
        if (servicios) {
            try {
                const parsed = typeof servicios === "string" ? JSON.parse(servicios) : servicios;
                if (Array.isArray(parsed)) {
                    hasFood = parsed.some(s => s.alimentos === true);
                    hasAV = parsed.some(s => s.audioVisual === true);
                } else if (typeof parsed === "object") {
                    hasFood = parsed.alimentos?.activo || parsed.alimentos === true;
                    hasAV = parsed.audioVisual?.activo || parsed.audioVisual === true;
                }
            } catch (e) { }
        }
        return { hasFood, hasAV };
    };

    const handleProposalSubmit = (e) => {
        e.preventDefault();
        const text = `¡Hola! Quiero proponer un evento para Proyecto Café.%0A%0A*Presentación:* ${encodeURIComponent(proposalForm.presentacion)}%0A*¿De qué se trata el evento?:* ${encodeURIComponent(proposalForm.descripcion)}`;
        window.open(`https://wa.me/573008214593?text=${text}`, "_blank");
        setIsProposalOpen(false);
        setProposalForm({ presentacion: "", descripcion: "" });
    };

    const handleSharePage = () => {
        const url = window.location.origin + "/EventosOffer";
        navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
    };

    const handleShareEvent = (event) => {
        const url = window.location.origin + "/EventosOffer?id=" + event._id.substring(0, 8);
        navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
    };

    const monthName = useMemo(() => {
        const [year, month] = selectedMonth.split("-");
        const date = new Date(year, month - 1);
        return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    return (
        <PageLayout className="bg-cream-bg min-h-screen text-[#1F2937]">
            <div className="w-full flex flex-col gap-0 px-4 md:px-8 py-6">

                {/* Marquee Header Estilo MenuView */}
                <section className={`w-full bg-yellow-100 border-[3px] ${borderColor} py-2 rounded-none shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] mb-8 overflow-hidden flex items-center h-12 box-border relative z-10`}>
                    <style>{`
            @keyframes marquee-events {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-events {
              display: flex;
              width: max-content;
              animation: marquee-events 15s linear infinite;
            }
          `}</style>
                    <div className="animate-marquee-events text-lg md:text-2xl font-black uppercase tracking-[0.2em] whitespace-nowrap flex items-center" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                        <span className="px-12">• CARTELERA DE EXPERIENCIAS •</span>
                        <span className="px-12">• CARTELERA DE EXPERIENCIAS •</span>
                        <span className="px-12">• CARTELERA DE EXPERIENCIAS •</span>
                        <span className="px-12">• CARTELERA DE EXPERIENCIAS •</span>
                    </div>
                </section>

                {/* Mes Selector Neobrutalista */}
                <div className={`flex flex-wrap justify-between items-center mb-10 gap-4 bg-white border-[3px] ${borderColor} p-4 rounded-none shadow-[6px_6px_0px_0px_rgba(31,41,55,1)]`}>
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                            EVENTOS {monthName}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSharePage}
                            className={`hidden md:flex items-center gap-2 px-4 border-[3px] ${borderColor} bg-blue-100 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-12 text-xs font-black uppercase`}
                        >
                            <Share2 size={18} strokeWidth={3} />
                            {copiedShare ? "¡Copiado!" : "Compartir Cartelera"}
                        </button>
                        <button
                            onClick={() => changeMonth(-1)}
                            className={`p-2 border-[3px] ${borderColor} bg-white shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:bg-black hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-12 w-12 flex items-center justify-center`}
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => changeMonth(1)}
                            className={`p-2 border-[3px] ${borderColor} bg-white shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:bg-black hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-12 w-12 flex items-center justify-center`}
                        >
                            <ChevronRight size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Grid de Posters Neobrutalista */}
                {eventosFiltrados.length === 0 ? (
                    <div className={`text-center py-10 bg-pink-100 border-[3px] ${borderColor} shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] rounded-none`}>
                        <h3 className="text-3xl font-black uppercase mb-4" style={{ fontFamily: "'First Bunny', sans-serif" }}>Cerrado por el momento</h3>
                        <p className="text-lg font-black opacity-60">Pronto tendremos nuevas funciones para {monthName}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {eventosFiltrados.map((event) => {
                            const { hasFood } = getServiciosFlags(event.servicios);
                            return (
                                <div
                                    key={event._id}
                                    className={`group relative flex flex-col bg-white border-[3px] ${borderColor} rounded-none shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] cursor-pointer overflow-hidden`}
                                    onClick={() => handleEventClick(event)}
                                >
                                    {/* Imagen del Poster */}
                                    <div className={`relative w-full aspect-[3/4] border-b-[3px] ${borderColor} overflow-hidden`}>
                                        {event.bannerIMG ? (
                                            <img src={event.bannerIMG} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full bg-sage-green/20 flex items-center justify-center">
                                                <Play size={48} className="opacity-20" />
                                            </div>
                                        )}

                                        {/* Badge de Fecha (Showtime) */}
                                        <div className={`absolute top-4 left-4 bg-yellow-100 border-[3px] ${borderColor} px-3 py-1 font-black text-[10px] sm:text-xs uppercase shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] leading-tight flex flex-col items-center`}>
                                            <span className="opacity-60">{event.fecha ? new Date(event.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }) : ''}</span>
                                            <span>{event.fecha ? new Date(event.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Next'}</span>
                                        </div>

                                        {hasFood && (
                                            <div className={`absolute top-4 right-4 bg-white border-[3px] ${borderColor} p-2 shadow-[3px_3px_0px_0px_rgba(31,41,55,1)]`}>
                                                <Utensils size={18} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info de la Tarjeta */}
                                    <div className="p-5 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <h3 className="text-xl font-black uppercase tracking-tight leading-none" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                                                {event.nombreES || event.nombre}
                                            </h3>
                                        </div>
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-black text-xs uppercase opacity-70">
                                                <Clock size={14} strokeWidth={3} />
                                                <span>{event.horaInicio}</span>
                                            </div>
                                            <div className="text-lg font-black tracking-tighter">
                                                {event.valor === "0" || !event.valor ? 'Gratis' : event.valor}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal Estilo Neobrutalista */}
                <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
                    <DialogContent className={`max-w-[1400px] w-[95vw] p-0 overflow-hidden rounded-none border-[3px] ${borderColor} shadow-[10px_10px_0px_0px_rgba(31,41,55,1)] bg-white`}>
                        {selectedEvent && (
                            <div className="flex flex-col md:flex-row max-h-[90vh]">
                                {/* Poster del Modal */}
                                <div className={`flex-1 relative border-b-[3px] md:border-b-0 md:border-r-[3px] ${borderColor} min-h-[300px] bg-gray-50`}>
                                    {selectedEvent.bannerIMG ? (
                                        <img src={selectedEvent.bannerIMG} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Ticket size={80} className="opacity-10" />
                                        </div>
                                    )}
                                </div>

                                {/* Detalles del Modal */}
                                <div className="md:w-[670px] flex-shrink-0 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                                    <div className="mb-6">
                                        <span className="bg-yellow-100 border-[2px] border-[#1F2937] px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]">
                                            Información del Evento
                                        </span>
                                    </div>

                                    <h2 className="text-4xl md:text-5xl font-black uppercase leading-none mb-8" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                                        {selectedEvent.nombreES || selectedEvent.nombre}
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                        <div className={`p-4 border-[3px] ${borderColor} bg-pink-100 shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]`}>
                                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Fecha y Hora</p>
                                            <p className="text-lg font-black uppercase flex items-center gap-2">
                                                <CalendarIcon size={18} strokeWidth={3} /> {selectedEvent.fecha ? new Date(selectedEvent.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : selectedEvent.fecha} <span className="opacity-30">|</span> {selectedEvent.horaInicio}
                                            </p>
                                        </div>
                                        <div className={`p-4 border-[3px] ${borderColor} bg-yellow-100 shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]`}>
                                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Inversión</p>
                                            <p className="text-lg font-black uppercase flex items-center gap-2">
                                                <Ticket size={18} strokeWidth={3} /> {selectedEvent.valor === "0" || !selectedEvent.valor ? 'GRATIS' : selectedEvent.valor}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-10">
                                        <h4 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
                                            <Info size={16} strokeWidth={3} /> Sinopsis
                                        </h4>
                                        <p className="text-lg font-bold leading-tight">
                                            {selectedEvent.descripcion || selectedEvent.decripcion || "Únete a este increíble evento y vive una experiencia única en Proyecto Café. Un espacio diseñado para compartir, aprender y disfrutar."}
                                        </p>
                                    </div>

                                    <div className="mt-auto space-y-6">
                                        <div className="flex flex-wrap gap-3">
                                            {getServiciosFlags(selectedEvent.servicios).hasFood && (
                                                <div className={`flex items-center gap-2 bg-cream-bg border-[2px] ${borderColor} px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                                                    <Utensils size={14} strokeWidth={3} /> Alimentos
                                                </div>
                                            )}
                                            {getServiciosFlags(selectedEvent.servicios).hasAV && (
                                                <div className={`flex items-center gap-2 bg-cream-bg border-[2px] ${borderColor} px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                                                    <MonitorPlay size={14} strokeWidth={3} /> Proyección
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-2 bg-cream-bg border-[2px] ${borderColor} px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                                                <Users size={14} strokeWidth={3} /> {attendeeCounts[selectedEvent._id] || 0} Confirmados
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    selectedEvent.linkInscripcion
                                                        ? window.open(selectedEvent.linkInscripcion, "_blank")
                                                        : navigate(`/inscripcion/${selectedEvent._id.substring(0, 8)}`)
                                                }}
                                                className={`flex-grow bg-black text-white py-6 text-xl font-black uppercase border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(165,184,161,1)] hover:bg-sage-green hover:text-black transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px]`}
                                            >
                                                ¡INSCRIBIRME!
                                            </button>
                                            <button
                                                onClick={() => handleShareEvent(selectedEvent)}
                                                className={`bg-white border-[3px] ${borderColor} p-6 shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center`}
                                                title="Compartir este evento"
                                            >
                                                <Share2 size={24} strokeWidth={3} className={copiedShare ? "text-green-600" : ""} />
                                            </button>
                                        </div>

                                        {/* Redes Sociales */}
                                        <div className="flex flex-wrap gap-4 pt-2">
                                            {Array.isArray(selectedEvent.instagramsAliados) && selectedEvent.instagramsAliados.map((handle, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`https://instagram.com/${handle.replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex-1 flex items-center justify-center gap-2 bg-pink-100 border-[3px] ${borderColor} py-3 px-4 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all`}
                                                >
                                                    <Instagram size={16} strokeWidth={3} /> {handle}
                                                </a>
                                            ))}
                                            <a
                                                href="https://instagram.com/proyecto__cafe"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex-1 flex items-center justify-center gap-2 bg-[#ff6600]/10 border-[3px] border-[#ff6600] py-3 px-4 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,102,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all`}
                                            >
                                                <Instagram size={16} strokeWidth={3} /> @proyecto__cafe
                                            </a>


                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal Proponer Evento */}
                <Dialog open={isProposalOpen} onOpenChange={setIsProposalOpen}>
                    <DialogContent className={`max-w-2xl p-0 overflow-hidden rounded-none border-[3px] ${borderColor} shadow-[10px_10px_0px_0px_rgba(31,41,55,1)] bg-white`}>
                        <div className="p-8 md:p-12">
                            <h2 className="text-3xl md:text-5xl font-black uppercase mb-8" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                                Proponer un Evento
                            </h2>
                            <form onSubmit={handleProposalSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">Una pequeña presentación</label>
                                    <textarea
                                        required
                                        className={`w-full p-4 border-[3px] ${borderColor} rounded-none shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all min-h-[100px] font-bold`}
                                        placeholder="Cuéntanos quién eres..."
                                        value={proposalForm.presentacion}
                                        onChange={(e) => setProposalForm(prev => ({ ...prev, presentacion: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-60">¿De qué se trata el evento?</label>
                                    <textarea
                                        required
                                        className={`w-full p-4 border-[3px] ${borderColor} rounded-none shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all min-h-[150px] font-bold`}
                                        placeholder="Cuéntanos tu idea para Proyecto Café..."
                                        value={proposalForm.descripcion}
                                        onChange={(e) => setProposalForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`w-full bg-black text-white py-6 text-xl font-black uppercase border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(165,184,161,1)] hover:bg-sage-green hover:text-black transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] mt-4`}
                                >
                                    ENVIAR POR WHATSAPP
                                </button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Botón Flotante Neobrutalista */}
                <button
                    onClick={() => setIsProposalOpen(true)}
                    className={`fixed bottom-8 right-8 z-50 py-3 px-6 bg-yellow-100 border-[3px] ${borderColor} shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] transition-all flex items-center gap-3 group`}
                >
                    <span className="text-sm md:text-lg font-black uppercase" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                        Quiero proponer un evento
                    </span>
                    <div className={`p-1 border-[2px] ${borderColor} bg-white group-hover:bg-black group-hover:text-white transition-colors`}>
                        <Ticket size={20} strokeWidth={3} />
                    </div>
                </button>

            </div>
        </PageLayout>
    );
}
