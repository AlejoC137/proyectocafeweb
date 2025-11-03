import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, deleteItem } from "@/redux/actions";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AgendaForm from "./AgendaForm";

function Agenda() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allAgenda = useSelector((state) => state.allAgenda || []);

  const [viewMode, setViewMode] = useState("calendar"); // calendar, table, cards
  const [showForm, setShowForm] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Cargar eventos al montar el componente
  useEffect(() => {
    dispatch(getAllFromTable(AGENDA));
  }, [dispatch]);

  const handleCreateEvento = (fecha = null) => {
    // Abrir formulario en nueva pestaña con fecha pre-seleccionada
    if (fecha) {
      window.open(`/agendaForm/new?fecha=${fecha}`, "_blank");
    } else {
      window.open("/agendaForm/new", "_blank");
    }
  };

  const handleEditEvento = (evento) => {
    // Navegar al modal con el ID del evento
    navigate(`/evento/${evento._id}`);
  };

  const handleViewEvento = (evento) => {
    // Navegar al modal para ver detalles
    navigate(`/evento/${evento._id}`);
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

  // Handlers para navegación de calendario
  const changeMonth = (offset) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    // new Date(year, month - 1 + offset, 1) -> month - 1 porque JS Date es 0-index
    const newDate = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  const handlePrevMonth = () => changeMonth(-1);
  const handleNextMonth = () => changeMonth(1);
  const handleToday = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  const totalEventos = allAgenda.length;
  const eventosHoy = allAgenda.filter((evento) => {
    const hoy = new Date().toISOString().split("T")[0];
    return evento.fecha === hoy;
  }).length;

  // Filtrar eventos por mes seleccionado
  const eventosFiltrados = useMemo(() => {
    if (!selectedMonth) return allAgenda;
    return allAgenda.filter((evento) => evento.fecha?.startsWith(selectedMonth));
  }, [allAgenda, selectedMonth]);

  // Agrupar eventos por fecha para vista de calendario
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

  // Nombres de los días de la semana
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Generar la cuadrícula del calendario
  const calendarGrid = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number); // month es 1-12
    const firstDay = new Date(year, month - 1, 1); // 0-11 para month
    const firstDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Lunes...

    const daysInMonth = new Date(year, month, 0).getDate(); // Día 0 del *siguiente* mes

    const days = [];

    // 1. Añadir días de relleno (padding) del mes anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null); // Representa una celda vacía
    }

    // 2. Añadir los días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      const dayEvents = eventosPorFecha[dateStr] || [];
      days.push({
        day: i,
        dateStr: dateStr,
        events: dayEvents,
      });
    }
    return days;
  }, [selectedMonth, eventosPorFecha]);

  // Formato de fecha para el título (usado en la vista de lista anterior, mantenido por si acaso)
  const formatDate = (dateString) => {
    if (dateString === "Sin Fecha") return "Eventos Sin Fecha";
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <PageLayout title="Agenda de Eventos">
      {/* Estadísticas y controles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-blue-600">Total Eventos</p>
              <p className="text-2xl font-bold text-blue-800">{totalEventos}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-green-600">Eventos Hoy</p>
              <p className="text-2xl font-bold text-green-800">{eventosHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-purple-600" size={20} />
            <div>
              <p className="text-sm text-purple-600">Este Mes</p>
              <p className="text-2xl font-bold text-purple-800">
                {eventosFiltrados.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de vista y acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("calendar")}
            variant={viewMode === "calendar" ? "default" : "outline"}
            className="gap-2"
          >
            <CalendarIcon size={18} />
            Calendario
          </Button>
          <Button
            onClick={() => setViewMode("table")}
            variant={viewMode === "table" ? "default" : "outline"}
            className="gap-2"
          >
            <TableIcon size={18} />
            Tabla
          </Button>
          <Button
            onClick={() => setViewMode("cards")}
            variant={viewMode === "cards" ? "default" : "outline"}
            className="gap-2"
          >
            <Calendar size={18} />
            Tarjetas
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </Button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border rounded-md"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoy
          </Button>
          <Button
            onClick={handleCreateEvento}
                className="text-white flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700  hover:to-blue-700 hover:text-yellow-200 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                >
            <Plus size={18} />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Contenido según modo de vista */}
      <ContentCard noPadding>
        <div className="p-4">
          {eventosFiltrados.length === 0 &&
          !Object.keys(eventosPorFecha).includes("Sin Fecha") ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
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

              {/* Vista de Calendario (ACTUALIZADA) */}
              {viewMode === "calendar" && (
                <div className="space-y-4">
                  {/* Encabezados de días de la semana */}
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

                  {/* Cuadrícula de días del calendario */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarGrid.map((day, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-2 min-h-[140px] ${ // --- CAMBIO: Altura mínima aumentada
                          !day
                            ? "bg-gray-50"
                            : "bg-white transition-shadow hover:shadow-md"
                        }`}
                      >
                        {day && (
                          <>
                            {/* Barra de encabezado con día y botón de agregar */}
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
                            {/* --- INICIO BLOQUE MODIFICADO --- */}
                            <div className="space-y-2"> {/* Espaciado aumentado */}
                              {day.events.map((evento) => (
                                <div
                                  key={evento._id}
                                  className="text-xs rounded cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden h-14 border" // Altura fija, relativo
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewEvento(evento);
                                  }}
                                  title={`${evento.nombre} (${evento.horaInicio} - ${evento.horaFinal})`}
                                >
                                  {/* Imagen de Fondo */}
                                  {evento.bannerIMG && (
                                    <div
                                      className="absolute inset-0 w-full h-full bg-cover bg-center"
                                      style={{
                                        backgroundImage: `url(${evento.bannerIMG})`,
                                      }}
                                    ></div>
                                  )}

                                  {/* Capa Oscura para Legibilidad */}
                                  <div className="absolute inset-0 w-full h-full bg-black bg-opacity-60 hover:bg-opacity-50 transition-opacity"></div>

                                  {/* Contenido de Texto */}
                                  <div className="relative z-10 p-1.5 text-white">
                                    <p className="truncate font-semibold text-xs">
                                      {evento.nombre}
                                    </p>
                                    <p className="truncate text-gray-200 text-[11px] mt-1">
                                      <Clock
                                        size={10}
                                        className="inline-block mr-1"
                                      />
                                      {evento.horaInicio} - {evento.horaFinal}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* --- FIN BLOQUE MODIFICADO --- */}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Eventos sin fecha (si existen) */}
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
                        <th className="p-3 text-left font-semibold">
                          Personas
                        </th>
                        <th className="p-3 text-left font-semibold">Valor</th>
                        <th className="p-3 text-center font-semibold">
                          Acciones
                        </th>
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
                          <td className="p-3">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewEvento(evento)}
                              >
                                <Eye size={14} />
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

      {/* Diálogo del formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AgendaForm eventoToEdit={eventoToEdit} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

export default Agenda;