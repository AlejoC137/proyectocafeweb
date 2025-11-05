import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, deleteWorkIsue } from "@/redux/actions-WorkIsue";
import { PRODUCCION, PROCEDE } from "@/redux/actions-types";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import {
  Calendar,
  CalendarDays,
  Plus,
  Table as TableIcon,
  CalendarIcon,
  Trash2,
  Users,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function CalendarioProduccion() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allWorkIsue = useSelector((state) => state.allWorkIsue || []);

  const [viewMode, setViewMode] = useState("calendar"); // calendar, table
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Cargar eventos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable("WorkIsue"));
        await dispatch(getAllFromTable(PRODUCCION));
        await dispatch(getAllFromTable(PROCEDE));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleCreateWorkIssue = (fecha = null) => {
    // Abrir WorkIsueCreator en nueva pestaña con fecha pre-seleccionada
    if (fecha) {
      window.open(`/WorkIsueCreator?fecha=${fecha}`, "_blank");
    } else {
      window.open("/WorkIsueCreator", "_blank");
    }
  };

  const handleViewWorkIssue = (workIssue) => {
    // Navegar a la vista detallada del WorkIssue
    navigate(`/WorkIsue?id=${workIssue._id}`);
  };

  const handleDeleteWorkIssue = async (workIssue) => {
    if (
      window.confirm(`¿Estás seguro de eliminar el WorkIssue "${workIssue.Tittle}"?`)
    ) {
      await dispatch(deleteWorkIsue(workIssue._id));
      dispatch(getAllFromTable("WorkIsue"));
    }
  };

  // Handlers para navegación de calendario
  const changeMonth = (offset) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  const handlePrevMonth = () => changeMonth(-1);
  const handleNextMonth = () => changeMonth(1);
  const handleToday = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  /**
   * NUEVA FUNCIÓN: Extrae TODAS las fechas de un WorkIssue.
   * Maneja tanto 'date_asigmente' (string) como 'date_repiting' (array).
   * @returns {string[]} Un array de fechas en formato string ISO.
   */
  const getEventDates = (workIssue) => {
    try {
      const dates =
        typeof workIssue.Dates === "string"
          ? JSON.parse(workIssue.Dates)
          : workIssue.Dates;

      if (!dates) return [];

      let foundDates = [];

      // Caso 1: Tiene 'date_asigmente' (estructura antigua)
      if (dates.date_asigmente) {
        const fecha = dates.date_asigmente;
        if (typeof fecha === "string") {
          foundDates.push(fecha);
        } else if (fecha instanceof Date) {
          foundDates.push(fecha.toISOString());
        } else if (typeof fecha === "number") {
          foundDates.push(new Date(fecha).toISOString());
        }
        // Ignora si es array vacío [] u otro tipo
      }

      // Caso 2: Tiene 'date_repiting' (estructura nueva)
      if (Array.isArray(dates.date_repiting) && dates.date_repiting.length > 0) {
        const repitingDates = dates.date_repiting.map(fecha => {
          if (typeof fecha === "string") return fecha;
          if (fecha instanceof Date) return fecha.toISOString();
          if (typeof fecha === "number") return new Date(fecha).toISOString();
          // Soporte para objetos de fecha (ej. de un date picker)
          if (typeof fecha === 'object' && fecha !== null && fecha.$date) {
             return new Date(fecha.$date).toISOString();
          }
          return null; // Ignorar items inválidos
        }).filter(Boolean); // Limpiar nulos
        
        foundDates = foundDates.concat(repitingDates);
      }

      // Devolver fechas únicas
      return [...new Set(foundDates)];

    } catch (e) {
      console.error("Error parsing Dates JSON:", e, workIssue.Dates);
      return []; // Devuelve array vacío en caso de error de parseo
    }
  };


  // --- LÓGICA DE FILTRADO Y AGRUPACIÓN RECONSTRUIDA ---

  // 1. Generar una lista plana de todos los eventos (WorkIssue + fecha específica)
  //    y también coleccionar los que no tienen fecha.
  const allEvents = useMemo(() => {
    const eventsWithDate = [];
    const eventsWithoutDate = [];

    allWorkIsue.forEach(wi => {
      const dates = getEventDates(wi); // Esto devuelve un array de strings de fecha ISO

      if (dates.length > 0) {
        dates.forEach(dateStr => {
          eventsWithDate.push({
            workIssue: wi,
            date: dateStr,
            dateKey: dateStr ? dateStr.split("T")[0] : null // clave YYYY-MM-DD
          });
        });
      } else {
        // Si getEventDates devuelve [], es un item "Sin Fecha"
        eventsWithoutDate.push({
          workIssue: wi,
          date: null,
          dateKey: "Sin Fecha"
        });
      }
    });
    
    return { eventsWithDate, eventsWithoutDate };

  }, [allWorkIsue]);

  // 2. Filtrar los eventos que pertenecen al mes seleccionado
  //    y mantener siempre los eventos "Sin Fecha".
  const eventosFiltrados = useMemo(() => {
    if (!selectedMonth) return allEvents.eventsWithDate.concat(allEvents.eventsWithoutDate);

    const monthlyEvents = allEvents.eventsWithDate.filter(event => {
      return event.dateKey && event.dateKey.startsWith(selectedMonth);
    });

    // Devolvemos todos los eventos del mes + todos los eventos sin fecha
    return monthlyEvents.concat(allEvents.eventsWithoutDate);

  }, [allEvents, selectedMonth]);

  // 3. Agrupar los eventos filtrados por su clave de fecha (YYYY-MM-DD o "Sin Fecha")
  const workIssuesPorFecha = useMemo(() => {
    const grupos = {};
    
    eventosFiltrados.forEach(event => {
      const key = event.dateKey; // Esto ya es "YYYY-MM-DD" o "Sin Fecha"
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(event.workIssue);
    });

    // Desduplicar workIssues *dentro* de cada día/grupo
    Object.keys(grupos).forEach(key => {
         const uniqueWIs = new Map(grupos[key].map(wi => [wi._id, wi]));
         grupos[key] = Array.from(uniqueWIs.values());
    });
    
    return grupos;
  }, [eventosFiltrados]);

  // --- FIN DE LA RECONSTRUCCIÓN ---


  // --- STATS ACTUALIZADOS ---
  const totalWorkIssues = allWorkIsue.length;
  
  const workIssuesTodayCount = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    const eventsToday = allEvents.eventsWithDate.filter(event => event.dateKey === hoy);
    // Contar workIssues únicos de hoy
    const uniqueWIsToday = new Map(eventsToday.map(event => [event.workIssue._id, event.workIssue]));
    return uniqueWIsToday.size;
  }, [allEvents]);

  const workIssuesTerminados = allWorkIsue.filter((wi) => wi.Terminado).length;
  // --- FIN STATS ---


  // Nombres de los días de la semana
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Generar la cuadrícula del calendario
  const calendarGrid = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Añadir días de relleno del mes anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Añadir los días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      const dayWorkIssues = workIssuesPorFecha[dateStr] || [];
      days.push({
        day: i,
        dateStr: dateStr,
        workIssues: dayWorkIssues,
      });
    }
    return days;
  }, [selectedMonth, workIssuesPorFecha]);

  return (
    <PageLayout title="Calendario de Producción">
      {/* Estadísticas y controles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-blue-600">Total WorkIssues</p>
              <p className="text-2xl font-bold text-blue-800">{totalWorkIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-green-600">Hoy</p>
              <p className="text-2xl font-bold text-green-800">{workIssuesTodayCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-purple-600" size={20} />
            <div>
              <p className="text-sm text-purple-600">Terminados</p>
              <p className="text-2xl font-bold text-purple-800">
                {workIssuesTerminados}
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
            onClick={() => handleCreateWorkIssue()}
            className="
            text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
          >
            <Plus size={18} />
            Nuevo WorkIssue
          </Button>
        </div>
      </div>

      {/* Contenido según modo de vista */}
      <ContentCard noPadding>
        <div className="p-4">
          {/* Mensaje 'Sin WorkIssues' actualizado */}
          {eventosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                No hay WorkIssues programados para este mes
              </p>
              <p className="text-sm">
                Haz clic en "Nuevo WorkIssue" para crear uno
              </p>
            </div>
          ) : (
            <>
              {/* Vista de Calendario */}
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
                        className={`border rounded-lg p-2 min-h-[140px] ${
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
                                  handleCreateWorkIssue(day.dateStr);
                                }}
                                title={`Agregar WorkIssue el ${day.dateStr}`}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {/* 'day.workIssues' viene de 'workIssuesPorFecha' y está correcto */}
                              {day.workIssues.map((wi) => (
                                <div
                                  key={wi._id}
                                  className={`text-xs rounded cursor-pointer shadow-sm hover:shadow-md p-2 border ${
                                    wi.Terminado
                                      ? "bg-green-50 border-green-300"
                                      : "bg-blue-50 border-blue-300"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewWorkIssue(wi);
                                  }}
                                  title={`${wi.Tittle || "Sin título"} - ${wi.Categoria || ""}`}
                                >
                                  <p className="truncate font-semibold text-xs">
                                    {wi.Tittle || "Sin título"}
                                  </p>
                                  <p className="truncate text-gray-600 text-[10px] mt-1">
                                    <Users size={9} className="inline-block mr-1" />
                                    {wi.Ejecutor || "Sin asignar"}
                                  </p>
                                  {wi.Terminado && (
                                    <span className="text-[10px] text-green-700">
                                      ✅ Terminado
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* WorkIssues sin fecha */}
                  {workIssuesPorFecha["Sin Fecha"] && (
                    <section className="mt-8">
                      <h2 className="text-xl font-bold mb-4 text-gray-700 border-b-2 border-red-500 pb-2">
                        WorkIssues Sin Fecha Asignada
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workIssuesPorFecha["Sin Fecha"].map((wi) => (
                          <div
                            key={wi._id}
                            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleViewWorkIssue(wi)}
                          >
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                              {wi.Tittle || "Sin título"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              Categoría: {wi.Categoria || "N/A"}
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                              Este WorkIssue no tiene fecha asignada.
                            </p>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewWorkIssue(wi)}
                                className="flex-1 gap-1"
                              >
                                <Eye size={14} /> Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteWorkIssue(wi)}
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

              {/* Vista de Tabla (Actualizada para iterar 'eventosFiltrados') */}
              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="p-3 text-left font-semibold">Título</th>
                        <th className="p-3 text-left font-semibold">Fecha</th>
                        <th className="p-3 text-left font-semibold">Categoría</th>
                        <th className="p-3 text-left font-semibold">Ejecutor</th>
                        <th className="p-3 text-left font-semibold">Estado</th>
                        <th className="p-3 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Iteramos sobre 'eventosFiltrados' */}
                      {eventosFiltrados.map((event) => {
                        const wi = event.workIssue;
                        // Usamos una key única por si el mismo WI aparece en varias fechas
                        const rowKey = `${wi._id}-${event.dateKey}`; 
                        
                        return (
                          <tr
                            key={rowKey}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              <div className="font-semibold text-gray-800">
                                {wi.Tittle || "Sin título"}
                              </div>
                              {wi.Notas && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {wi.Notas.substring(0, 50)}...
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {/* Usamos la 'dateKey' del evento */}
                              {event.dateKey}
                            </td>
                            <td className="p-3">{wi.Categoria || "-"}</td>
                            <td className="p-3">{wi.Ejecutor || "-"}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  wi.Terminado
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {wi.Terminado ? "Terminado" : "Pendiente"}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewWorkIssue(wi)}
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteWorkIssue(wi)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </ContentCard>
    </PageLayout>
  );
}

export default CalendarioProduccion;