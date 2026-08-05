import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getAllFromTable, deleteItem, updateItem } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { CardGridAgenda } from "@/components/ui/cardGridAgenda";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import {
  Calendar,
  CalendarDays,
  Plus,
  Table as TableIcon,
  CalendarIcon,
  Edit,
  Trash2,
  Users,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Utensils,
  MonitorPlay,
  Link2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AgendaForm from "./AgendaForm";
import { PropuestasGrid } from "./PropuestasGrid";
import supabase from "@/config/supabaseClient";
import { EventImporter } from "./EventImporter";

function Agenda() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allAgenda = useSelector((state) => state.allAgenda || []);

  const { year, month } = useParams();
  const [viewMode, setViewMode] = useState("calendar"); // calendar, table, cards
  const [showForm, setShowForm] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState(null);

  // Inicializar mes desde URL o la fecha actual
  const initialMonth = (year && month) ? `${year}-${month}` : new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [attendeeCounts, setAttendeeCounts] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Cargar eventos y asistentes al montar el componente
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

  // Actualización automática: si un evento en calendario (ejecutado === false) ya pasó su fecha, el sistema o admin lo pasa a true
  useEffect(() => {
    if (!allAgenda.length) return;
    const hoy = new Date().toISOString().slice(0, 10);

    allAgenda.forEach((evento) => {
      if (evento.ejecutado === false && evento.fecha && evento.fecha < hoy) {
        dispatch(updateItem(evento._id, { ejecutado: true }, AGENDA));
      }
    });
  }, [allAgenda, dispatch]);

  const handleCreateEvento = (fecha = null) => {
    if (fecha) {
      window.open(`/agendaForm/new?fecha=${fecha}`, "_blank");
    } else {
      window.open("/agendaForm/new", "_blank");
    }
  };

  const handleEditEvento = (evento) => {
    navigate(`/agendaForm/${evento._id.substring(0, 8)}`);
  };

  const handleViewEvento = (evento) => {
    navigate(`/agendaForm/${evento._id.substring(0, 8)}`);
  };

  const handleDeleteEvento = async (evento) => {
    if (
      window.confirm(`¿Estás seguro de eliminar el evento "${evento.nombre}"?`)
    ) {
      await dispatch(deleteItem(evento._id, AGENDA));
      dispatch(getAllFromTable(AGENDA));
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEventoToEdit(null);
    dispatch(getAllFromTable(AGENDA));
  };

  const handleVolverAIdea = async (evento) => {
    if (window.confirm(`¿Estás seguro de devolver "${evento.nombre || evento.nombreES || 'este evento'}" a la lista de ideas?`)) {
      try {
        await dispatch(updateItem(evento._id, { ejecutado: null, estado_proceso: "idea" }, AGENDA));
        dispatch(getAllFromTable(AGENDA));
      } catch (error) {
        console.error("Error devolviendo a idea:", error);
      }
    }
  };

  const changeMonth = (offset) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const newDate = new Date(y, m - 1 + offset, 1);
    const newMonthStr = newDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonthStr);

    const [newYear, newMonth] = newMonthStr.split("-");
    navigate(`/Agenda/${newYear}/${newMonth}`);
  };

  useEffect(() => {
    if (year && month) {
      const monthStr = `${year}-${month}`;
      if (selectedMonth !== monthStr) {
        setSelectedMonth(monthStr);
      }
    }
  }, [year, month]);

  const handleStatusChange = async (evento, nuevoEstado) => {
    try {
      await dispatch(updateItem(evento._id, { estado: nuevoEstado }, AGENDA));
      dispatch(getAllFromTable(AGENDA));
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handlePrevMonth = () => changeMonth(-1);
  const handleNextMonth = () => changeMonth(1);

  const handleToday = () => {
    const today = new Date().toISOString().slice(0, 7);
    setSelectedMonth(today);
    const [y, m] = today.split("-");
    navigate(`/Agenda/${y}/${m}`);
  };

  // Filtrado 1: Propuestas pendientes para el cuadro izquierdo (ejecutado === null o undefined)
  const propuestasPendientes = useMemo(() => {
    return allAgenda.filter((e) => e.ejecutado === null || e.ejecutado === undefined);
  }, [allAgenda]);

  // Filtrado 2: Eventos asignados a calendario o ejecutados (ejecutado !== null) y las ideas (null) que tengan fecha asignada
  const eventosEnCalendario = useMemo(() => {
    return allAgenda.filter((e) => {
      const isIdea = e.ejecutado === null || e.ejecutado === undefined;
      if (isIdea) {
        return !!e.fecha; // Mostrar ideas solo si tienen fecha
      }
      return true;
    });
  }, [allAgenda]);

  // Filtrar por mes seleccionado para las vistas del panel derecho
  const eventosFiltrados = useMemo(() => {
    if (!selectedMonth) return eventosEnCalendario;
    return eventosEnCalendario.filter((evento) => evento.fecha?.startsWith(selectedMonth));
  }, [eventosEnCalendario, selectedMonth]);

  const eventosPorFecha = useMemo(() => {
    const grupos = {};
    eventosFiltrados.forEach((evento) => {
      const fecha = evento.fecha || "Sin Fecha";
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(evento);
    });
    return grupos;
  }, [eventosFiltrados]);

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const calendarGrid = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();

    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayEvents = eventosPorFecha[dateStr] || [];
      days.push({
        day: i,
        dateStr: dateStr,
        events: dayEvents,
      });
    }
    return days;
  }, [selectedMonth, eventosPorFecha]);

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/EventosOffer`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // LOG PRINCIPAL DE CONTROL
  console.log("=== RENDERIZANDO AGENDA COMPLETA ===", {
    modoVista: viewMode,
    mesSeleccionado: selectedMonth,
    propuestasInIzquierda: propuestasPendientes.length,
    eventosInDerecha: eventosFiltrados.length
  });

  return (
    <PageLayout title="Agenda de Eventos">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* RECTÁNGULO ROJO: PANEL IZQUIERDO DE PROPUESTAS */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <ContentCard noPadding>
            <PropuestasGrid
              propuestas={propuestasPendientes}
              onFormalizar={(item) => handleViewEvento(item)}
            />
          </ContentCard>
        </div>

        {/* RECTÁNGULO AZUL: PANEL DERECHO DE CALENDARIO Y VISTAS */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Controles de vista y acciones */}
          {/* Controles de vista y acciones */}
          <div className="flex w-full overflow-x-auto pb-2 mb-2 custom-scrollbar">
            <div className="flex w-full min-w-max items-center justify-between gap-4">
              
              {/* Botones de vistas y enlaces */}
              <div className="flex gap-2 items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <Button
                  onClick={() => setViewMode("calendar")}
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size="sm"
                  className={`gap-1.5 h-8 px-3 ${viewMode === "calendar" ? "" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <CalendarIcon size={16} />
                  Calendario
                </Button>
                <Button
                  onClick={() => setViewMode("table")}
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className={`gap-1.5 h-8 px-3 ${viewMode === "table" ? "" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <TableIcon size={16} />
                  Tabla
                </Button>
                <Button
                  onClick={() => setViewMode("cards")}
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  className={`gap-1.5 h-8 px-3 ${viewMode === "cards" ? "" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <Calendar size={16} />
                  Tarjetas
                </Button>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <Button
                  onClick={() => navigate("/Aliados")}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 px-3 text-orange-600 hover:bg-orange-50"
                >
                  <Users size={16} />
                  Aliados
                </Button>
                <Button
                  onClick={handleCopyPublicLink}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 px-3 text-blue-600 hover:bg-blue-50"
                >
                  {copiedLink ? <CheckCircle2 size={16} /> : <Link2 size={16} />}
                  {copiedLink ? "¡Copiado!" : "Público"}
                </Button>
              </div>

              {/* Controles de fecha y Nuevo Evento */}
              <div className="flex gap-2 items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-1 h-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    title="Mes anterior"
                    className="h-6 w-6 text-gray-500 hover:text-gray-900"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedMonth(val);
                      if (val) {
                        const [y, m] = val.split("-");
                        navigate(`/Agenda/${y}/${m}`);
                      }
                    }}
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none w-32 text-center"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    title="Mes siguiente"
                    className="h-6 w-6 text-gray-500 hover:text-gray-900"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
                
                <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3 text-sm font-medium">
                  Hoy
                </Button>
                
                <Button
                  onClick={() => handleCreateEvento()}
                  size="sm"
                  className="h-8 px-4 text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-colors duration-200 font-bold shadow-sm gap-1.5"
                >
                  <Plus size={16} />
                  Nuevo Evento
                </Button>
              </div>
            </div>
          </div>

          <ContentCard noPadding>
            <div className="p-4">
              {eventosFiltrados.length === 0 &&
                !Object.keys(eventosPorFecha).includes("Sin Fecha") ? (
                <div className="text-center py-12 text-slate-500">
                  <Calendar size={48} className="mx-auto mb-0 opacity-50" />
                  <p className="text-lg font-medium">
                    No hay eventos programados para este mes
                  </p>
                  <p className="text-sm">
                    Haz clic en "Nuevo Evento" para crear uno
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista de Tarjetas */}
                  {viewMode === "cards" && (
                    <CardGridAgenda
                      products={eventosFiltrados}
                      category="Eventos"
                      onDelete={handleDeleteEvento}
                    />
                  )}

                  {/* Vista de Calendario */}
                  {viewMode === "calendar" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-600">
                        {dayNames.map((day) => (
                          <div
                            key={day}
                            className="p-2 bg-gray-100 rounded-md shadow-sm"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {calendarGrid.map((day, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-2 min-h-[140px] ${!day
                              ? "bg-gray-50"
                              : "bg-white transition-shadow hover:shadow-md"
                              }`}
                          >
                            {day && (
                              <>
                                <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                                  <span className="font-bold text-gray-800 text-sm">
                                    {day.day}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 hover:bg-purple-100 text-purple-600 hover:text-purple-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateEvento(day.dateStr);
                                    }}
                                    title={`Agregar evento el ${day.dateStr}`}
                                  >
                                    <Plus size={14} />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {day.events.map((evento) => {
                                    let hasFood = false;
                                    let hasAudioVisual = false;
                                    if (evento.servicios) {
                                      try {
                                        const parsedSvc = typeof evento.servicios === "string" ? JSON.parse(evento.servicios) : evento.servicios;
                                        if (Array.isArray(parsedSvc)) {
                                          hasFood = parsedSvc.some(s => s.alimentos === true);
                                          hasAudioVisual = parsedSvc.some(s => s.audioVisual === true);
                                        } else if (typeof parsedSvc === "object" && parsedSvc !== null) {
                                          hasFood = parsedSvc.alimentos?.activo === true || parsedSvc.alimentos === true;
                                          hasAudioVisual = parsedSvc.audioVisual?.activo === true || parsedSvc.audioVisual === true;
                                        }
                                      } catch (e) { }
                                    }

                                    const isIdea = evento.ejecutado === null || evento.ejecutado === undefined;
                                    return (
                                      <div
                                        key={evento._id}
                                        className={`text-xs rounded cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden h-16 border flex flex-col justify-between group ${evento.ejecutado === true ? "opacity-75" : ""
                                          } ${isIdea ? "border-gray-400 border-dashed" : "border-transparent"}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewEvento(evento);
                                        }}
                                        title={`${evento.nombreES || evento.nombre || "Evento"} (${evento.horaInicio} - ${evento.horaFinal})`}
                                      >
                                        {evento.bannerIMG && (
                                          <div
                                            className={`absolute inset-0 w-full h-full bg-cover bg-center transition-transform group-hover:scale-105 ${isIdea ? "grayscale" : ""}`}
                                            style={{ backgroundImage: `url(${evento.bannerIMG})` }}
                                          ></div>
                                        )}

                                        <div className={`absolute inset-0 w-full h-full transition-opacity ${
                                          isIdea ? "bg-gray-600 bg-opacity-80 hover:bg-opacity-70" : "bg-black bg-opacity-60 hover:bg-opacity-50"
                                        }`}></div>

                                        <div className="relative z-10 p-1.5 text-white flex-1 flex flex-col justify-between">
                                          <div className="flex items-center justify-between">
                                            <p className="truncate font-bold text-xs drop-shadow-md flex items-center gap-1">
                                              {isIdea && <span title="Idea/Propuesta">💡</span>}
                                              {evento.nombreES || evento.nombre || "Sin Nombre"}
                                            </p>
                                            {evento.ejecutado === true && (
                                              <span className="text-[9px] bg-green-500/80 text-white px-1 rounded font-bold">
                                                ✓
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between mt-1">
                                            <p className="truncate text-gray-200 text-[10px] drop-shadow-md flex items-center font-medium">
                                              <Clock size={10} className="mr-0.5" />
                                              {evento.horaInicio}
                                            </p>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {hasFood && <Utensils size={10} className="text-orange-300 drop-shadow-md" title="Alimentos" />}
                                              {hasAudioVisual && <MonitorPlay size={10} className="text-blue-300 drop-shadow-md" title="Música / Audiovisual" />}
                                              <span className="flex items-center bg-white/20 backdrop-blur-sm px-1 py-0.5 rounded text-[9px] font-bold border border-white/20" title="Inscritos">
                                                <Users size={9} className="mr-0.5" />
                                                {attendeeCounts[evento._id] || 0}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Eventos sin fecha */}
                      {eventosPorFecha["Sin Fecha"] && (
                        <section className="mt-8">
                          <h2 className="text-xl font-bold mb-4 text-gray-700 border-b-2 border-red-500 pb-2">
                            Eventos Sin Fecha Asignada
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {eventosPorFecha["Sin Fecha"].map(evento => (
                              <div
                                key={evento._id}
                                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => handleViewEvento(evento)}
                              >
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{evento.nombre}</h3>
                                <p className="text-sm text-gray-500 mb-3">Este evento no tiene fecha.</p>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewEvento(evento)}
                                    className="flex-1 gap-1"
                                  >
                                    <Eye size={14} /> Ver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteEvento(evento)}
                                    className="flex-1 gap-1"
                                  >
                                    <Trash2 size={14} /> Eliminar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  {/* Vista de Tabla */}
                  {viewMode === "table" && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="p-3 text-left font-semibold">Evento</th>
                            <th className="p-3 text-left font-semibold">Fecha</th>
                            <th className="p-3 text-left font-semibold">Horario</th>
                            <th className="p-3 text-left font-semibold">Cliente</th>
                            <th className="p-3 text-left font-semibold">Personas</th>
                            <th className="p-3 text-left font-semibold">Valor</th>
                            <th className="p-3 text-center font-semibold">Ejecutado</th>
                            <th className="p-3 text-center font-semibold">Estado</th>
                            <th className="p-3 text-center font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventosFiltrados.map((evento) => (
                            <tr
                              key={evento._id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">
                                <div className="font-semibold text-gray-800">
                                  {evento.nombre}
                                </div>
                                {evento.infoAdicional && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {evento.infoAdicional.substring(0, 50)}...
                                  </div>
                                )}
                              </td>
                              <td className="p-3">{evento.fecha || "Sin Fecha"}</td>
                              <td className="p-3">
                                {evento.horaInicio} - {evento.horaFinal}
                              </td>
                              <td className="p-3">
                                <div>{evento.nombreCliente || "-"}</div>
                                {evento.telefonoCliente && (
                                  <div className="text-xs text-gray-500">
                                    {evento.telefonoCliente}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {evento.numeroPersonas || "-"}
                              </td>
                              <td className="p-3">{evento.valor || "-"}</td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!evento.ejecutado}
                                  onChange={async (e) => {
                                    await dispatch(
                                      updateItem(evento._id, { ejecutado: e.target.checked }, AGENDA)
                                    );
                                    dispatch(getAllFromTable(AGENDA));
                                  }}
                                  className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={evento.estado || "pendiente"}
                                  onChange={(e) => handleStatusChange(evento, e.target.value)}
                                  className={`text-xs p-1 border rounded font-bold ${evento.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                                    evento.estado === 'desaprobado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="aprobado">Aprobado</option>
                                  <option value="desaprobado">Desaprobado</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 justify-center">
                                  {evento.ejecutado !== null && evento.ejecutado !== undefined && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      onClick={() => handleVolverAIdea(evento)}
                                      title="Devolver a Ideas"
                                    >
                                      💡
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewEvento(evento)}
                                    title="Ver / Editar detalles"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteEvento(evento)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </ContentCard>
        </div>

      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AgendaForm eventoToEdit={eventoToEdit} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>

      <EventImporter />
    </PageLayout>
  );
}

export default Agenda;