import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, deleteComanda } from "@/redux/actions-Comanda";
import { getAllFromTable as getAllStaff } from "@/redux/actions";
import { PRODUCCION, PROCEDE, MENU, TARDEO_ALMUERZO, STAFF } from "@/redux/actions-types";
import PageLayout from "../../../components/ui/page-layout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ComandaCreator from "./ComandaCreator";
import {
  Calendar,
  CalendarDays,
  Plus,
  Table as TableIcon,
  CalendarIcon,
  Trash2,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function CalendarioProduccion() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allComanda = useSelector((state) => state.allComanda || []);
  const allMenu = useSelector((state) => state.allMenu || []);
  const allStaff = useSelector((state) => state.allStaff || []);

  const [viewMode, setViewMode] = useState("calendar"); // calendar (mes), week, table
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  
  // Nuevo estado para el Panel Izquierdo (Día Permanente)
  const [selectedDayForPanel, setSelectedDayForPanel] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorInitialDate, setCreatorInitialDate] = useState(null);

  // Cargar eventos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable("Comanda"));
        await dispatch(getAllFromTable(PRODUCCION));
        await dispatch(getAllFromTable(PROCEDE));
        await dispatch(getAllFromTable(MENU));
        await dispatch(getAllStaff(STAFF));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleCreateComanda = (fecha = null) => {
    setCreatorInitialDate(fecha);
    setIsCreatorOpen(true);
  };

  const handleViewComanda = (Comanda) => {
    navigate(`/comanda/${Comanda._id}`);
  };

  const handleDeleteComanda = async (Comanda) => {
    if (window.confirm(`¿Estás seguro de eliminar la Comanda "${Comanda.Tittle}"?`)) {
      await dispatch(deleteComanda(Comanda._id));
      dispatch(getAllFromTable("Comanda"));
    }
  };

  // Handlers para navegación
  const changeMonth = (offset) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  const handlePrevMonth = () => {
    if (viewMode === "week" && selectedDayForPanel !== "Sin Fecha") {
      const date = new Date(selectedDayForPanel + "T12:00:00");
      date.setDate(date.getDate() - 7);
      const newDateStr = date.toISOString().split("T")[0];
      setSelectedDayForPanel(newDateStr);
      setSelectedMonth(newDateStr.slice(0, 7));
    } else {
      changeMonth(-1);
    }
  };

  const handleNextMonth = () => {
    if (viewMode === "week" && selectedDayForPanel !== "Sin Fecha") {
      const date = new Date(selectedDayForPanel + "T12:00:00");
      date.setDate(date.getDate() + 7);
      const newDateStr = date.toISOString().split("T")[0];
      setSelectedDayForPanel(newDateStr);
      setSelectedMonth(newDateStr.slice(0, 7));
    } else {
      changeMonth(1);
    }
  };

  const handleToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedMonth(todayStr.slice(0, 7));
    setSelectedDayForPanel(todayStr);
  };

  const getEventDates = (Comanda) => {
    try {
      const dates = typeof Comanda.Dates === "string" ? JSON.parse(Comanda.Dates) : Comanda.Dates;
      if (!dates) return [];
      let foundDates = [];
      if (dates.date_asigmente) {
        const fecha = dates.date_asigmente;
        if (typeof fecha === "string") foundDates.push(fecha);
        else if (fecha instanceof Date) foundDates.push(fecha.toISOString());
        else if (typeof fecha === "number") foundDates.push(new Date(fecha).toISOString());
      }
      if (dates.EjecutionDate) {
        const fecha = dates.EjecutionDate;
        if (typeof fecha === "string") foundDates.push(fecha);
        else if (fecha instanceof Date) foundDates.push(fecha.toISOString());
        else if (typeof fecha === "number") foundDates.push(new Date(fecha).toISOString());
      }
      // Fallback a isued si no hay EjecutionDate ni date_asigmente
      if (foundDates.length === 0 && dates.isued) {
        const fecha = dates.isued;
        if (typeof fecha === "string") foundDates.push(fecha);
        else if (fecha instanceof Date) foundDates.push(fecha.toISOString());
        else if (typeof fecha === "number") foundDates.push(new Date(fecha).toISOString());
      }
      
      if (Array.isArray(dates.date_repiting) && dates.date_repiting.length > 0) {
        const repitingDates = dates.date_repiting.map(fecha => {
          if (typeof fecha === "string") return fecha;
          if (fecha instanceof Date) return fecha.toISOString();
          if (typeof fecha === "number") return new Date(fecha).toISOString();
          if (typeof fecha === 'object' && fecha !== null && fecha.$date) return new Date(fecha.$date).toISOString();
          return null;
        }).filter(Boolean);
        foundDates = foundDates.concat(repitingDates);
      }
      return [...new Set(foundDates)];
    } catch (e) {
      return [];
    }
  };

  const allEvents = useMemo(() => {
    const eventsWithDate = [];
    const eventsWithoutDate = [];

    const almuerzos = allMenu.filter(item => item.SUB_GRUPO === TARDEO_ALMUERZO);
    almuerzos.forEach(almuerzo => {
      try {
        const compLunchObj = (typeof almuerzo.Comp_Lunch === 'string') ? JSON.parse(almuerzo.Comp_Lunch) : almuerzo.Comp_Lunch;
        if (compLunchObj?.fecha?.fecha) {
           const dateStr = compLunchObj.fecha.fecha;
           eventsWithDate.push({
             item: almuerzo,
             type: 'almuerzo',
             date: dateStr,
             dateKey: dateStr
           });
        }
      } catch (e) {}
    });

    allComanda.forEach(wi => {
      const dates = getEventDates(wi);
      if (dates.length > 0) {
        dates.forEach(dateStr => {
          eventsWithDate.push({
            item: wi,
            type: 'Comanda',
            date: dateStr,
            dateKey: dateStr ? dateStr.split("T")[0] : null
          });
        });
      } else {
        eventsWithoutDate.push({ item: wi, type: 'Comanda', date: null, dateKey: "Sin Fecha" });
      }
    });
    return { eventsWithDate, eventsWithoutDate };
  }, [allComanda, allMenu]);

  // Modificado: Traemos más eventos de lo que requiere un solo mes para soportar la vista semanal si desborda
  const eventosPorFecha = useMemo(() => {
    const grupos = {};
    const events = allEvents.eventsWithDate.concat(allEvents.eventsWithoutDate);
    events.forEach(event => {
      const key = event.dateKey;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(event);
    });
    Object.keys(grupos).forEach(key => {
         const uniqueEvents = new Map();
         grupos[key].forEach(event => uniqueEvents.set(`${event.type}_${event.item._id}`, event));
         grupos[key] = Array.from(uniqueEvents.values());
    });
    return grupos;
  }, [allEvents]);

  // STATS
  const totalComandas = allComanda.length;
  const ComandasTodayCount = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return (eventosPorFecha[hoy] || []).filter(e => e.type === 'Comanda').length;
  }, [eventosPorFecha]);
  const ComandasTerminados = allComanda.filter((wi) => wi.Terminado).length;

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Generar cuadrícula MES
  const calendarGrid = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      // Días vacíos previos (opcionalmente podríamos mostrar los días del mes pasado)
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, dateStr: dateStr, events: eventosPorFecha[dateStr] || [] });
    }
    return days;
  }, [selectedMonth, eventosPorFecha]);

  // Generar cuadrícula SEMANA (basada en el selectedDayForPanel)
  const weekGrid = useMemo(() => {
    if (!selectedDayForPanel || selectedDayForPanel === "Sin Fecha") return [];
    const dateObj = new Date(selectedDayForPanel + "T12:00:00"); // forzar mediodía para evitar saltos de zona horaria
    const dayOfWeek = dateObj.getDay();
    const startDate = new Date(dateObj);
    startDate.setDate(dateObj.getDate() - dayOfWeek); // Ir al domingo
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];
      days.push({ day: current.getDate(), dateStr: dateStr, events: eventosPorFecha[dateStr] || [] });
    }
    return days;
  }, [selectedDayForPanel, eventosPorFecha]);

  // Eventos del día seleccionado para el Panel Izquierdo
  const selectedDayEvents = selectedDayForPanel === "Sin Fecha" ? (eventosPorFecha["Sin Fecha"] || []) : (eventosPorFecha[selectedDayForPanel] || []);

  const renderEventCard = (event) => {
    if (event.type === 'almuerzo') {
      const alm = event.item;
      let proteina = 'N/A';
      try {
          const compLunchData = (typeof alm.Comp_Lunch === 'string') ? JSON.parse(alm.Comp_Lunch) : alm.Comp_Lunch;
          proteina = compLunchData?.proteina?.nombre || 'N/A';
      } catch (error) {}
      return (
        <div key={`alm_${alm._id}`} className="rounded-md px-2 py-1 border-l-[3px] bg-orange-50/80 border-orange-400 hover:bg-orange-100 transition-colors shadow-sm mb-1">
          <p className="truncate font-semibold text-[10px] text-slate-800 leading-tight">🍲 {alm.NombreES}</p>
          <p className="truncate text-[9px] text-slate-500 leading-tight">🥩 {proteina}</p>
        </div>
      );
    }
    const wi = event.item;
    
    // Buscar nombre del staff
    const staffObj = allStaff.find(s => s._id === wi.Ejecutor) || allStaff.find(s => `${s.Nombre} ${s.Apellido}` === wi.Ejecutor);
    const ejecutorName = staffObj ? staffObj.Nombre : (wi.Ejecutor?.split(' ')[0] || "Sin asig.");

    return (
      <div
        key={`wi_${wi._id}`}
        className={`rounded-md cursor-pointer px-2 py-1 border-l-[3px] transition-colors shadow-sm mb-1 group relative ${
          wi.Terminado ? "bg-emerald-50/80 border-emerald-400 hover:bg-emerald-100" : "bg-blue-50/80 border-blue-400 hover:bg-blue-100"
        }`}
        onClick={(e) => { e.stopPropagation(); handleViewComanda(wi); }}
      >
        <p className="truncate font-medium text-[10px] text-slate-800 leading-tight">{wi.Tittle || "Sin título"}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="truncate flex items-center gap-1 text-[9px] text-slate-500">
            <Users size={8} /> {ejecutorName}
          </span>
          <button onClick={(e) => { e.stopPropagation(); handleDeleteComanda(wi); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    );
  };

  // Renderer Panel Izquierdo Card (Más detallada)
  const renderLeftPanelEventCard = (event) => {
    if (event.type === 'almuerzo') {
      const alm = event.item;
      let proteina = 'N/A';
      try {
          const compLunchData = (typeof alm.Comp_Lunch === 'string') ? JSON.parse(alm.Comp_Lunch) : alm.Comp_Lunch;
          proteina = compLunchData?.proteina?.nombre || 'N/A';
      } catch (error) {}
      return (
        <div key={`alm_${alm._id}_left`} className="rounded-lg p-3 border-l-4 bg-orange-50 border-orange-400 shadow-sm flex flex-col gap-1">
          <div className="flex items-start justify-between">
            <p className="font-bold text-xs text-slate-800">🍲 Almuerzo: {alm.NombreES}</p>
          </div>
          <p className="text-[11px] font-medium text-slate-600">🥩 {proteina}</p>
          <span className="inline-block mt-1 bg-orange-100 text-orange-700 text-[9px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">Manager</span>
        </div>
      );
    }
    const wi = event.item;
    return (
      <div key={`wi_${wi._id}_left`} className={`rounded-lg cursor-pointer p-3 border-l-4 shadow-sm flex flex-col gap-1 transition-all ${wi.Terminado ? "bg-emerald-50 border-emerald-400 hover:bg-emerald-100" : "bg-white border-blue-400 hover:bg-blue-50"}`} onClick={() => handleViewComanda(wi)}>
        <div className="flex justify-between items-start">
          <p className="font-bold text-xs text-slate-800 leading-tight">{wi.Tittle || "Sin título"}</p>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleViewComanda(wi); }} className="text-slate-400 hover:text-blue-600 p-1"><Eye size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteComanda(wi); }} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={12} /></button>
          </div>
        </div>
        {wi.Categoria && <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">{wi.Categoria}</span>}
        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
          <Users size={12} /> {(() => {
            const staffObj = allStaff.find(s => s._id === wi.Ejecutor) || allStaff.find(s => `${s.Nombre} ${s.Apellido}` === wi.Ejecutor);
            return staffObj ? `${staffObj.Nombre} ${staffObj.Apellido}` : (wi.Ejecutor || "Sin asignar");
          })()}
        </span>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] w-full bg-slate-200 p-2 overflow-hidden flex flex-col gap-2">
      
      {/* Top Bar Ultra Compacta */}
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">Prod. Dashboard</h1>
          <div className="flex gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
             <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-blue-500"/> Hoy: <span className="text-slate-800">{ComandasTodayCount}</span></span>
             <span className="flex items-center gap-1.5 border-l border-slate-200 pl-4"><Calendar size={14} className="text-slate-400"/> Tot: <span className="text-slate-800">{totalComandas}</span></span>
             <span className="flex items-center gap-1.5 border-l border-slate-200 pl-4 text-emerald-600"><CalendarIcon size={14}/> Term: <span className="text-emerald-700">{ComandasTerminados}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Controles Mes */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
            <button onClick={handlePrevMonth} className="px-2 h-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-1 h-full bg-transparent border-x border-slate-200 text-xs font-bold text-slate-700 focus:outline-none w-[110px]"
            />
            <button onClick={handleNextMonth} className="px-2 h-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3 text-xs rounded-lg border-slate-200 font-bold bg-white text-slate-600 shadow-sm">
            HOY
          </Button>

          {/* Toggle Vista */}
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg ml-2 border border-slate-200/60">
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${viewMode === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Mes</button>
            <button onClick={() => setViewMode("week")} className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${viewMode === "week" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Semana</button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${viewMode === "table" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Tabla</button>
          </div>

          <Button size="sm" onClick={() => handleCreateComanda()} className="h-8 ml-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm text-xs font-bold gap-1 border-0">
            <Plus size={14} /> NUEVA COMANDA
          </Button>
        </div>
      </div>

      {/* Main Content Split - TV Dashboard Style */}
      <div className="flex gap-2 flex-1 min-h-0"> {/* min-h-0 es crucial para flex child scrolling */}
        
        {/* Panel Izquierdo: DÍA SELECCIONADO (permanente) */}
        <div className="w-[28%] bg-slate-50 rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="bg-slate-800 text-white p-3 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-0.5">Agenda del Día</h2>
              <p className="text-sm font-medium">
                {selectedDayForPanel === "Sin Fecha" ? "Tareas Sin Fecha Asignada" : new Date(selectedDayForPanel + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {selectedDayForPanel !== "Sin Fecha" && (
              <button onClick={() => handleCreateComanda(selectedDayForPanel)} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex justify-center items-center text-white transition-colors">
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar bg-slate-100/50">
             {selectedDayEvents.length === 0 ? (
               <div className="text-center py-10 text-slate-400">
                 <CalendarDays size={32} className="mx-auto mb-2 opacity-50"/>
                 <p className="text-xs font-medium">No hay eventos programados.</p>
               </div>
             ) : (
               selectedDayEvents.map(renderLeftPanelEventCard)
             )}
          </div>
          {/* Botón Sin Fecha Permanente abajo */}
          <button 
            onClick={() => setSelectedDayForPanel("Sin Fecha")}
            className={`shrink-0 p-3 text-xs font-bold uppercase tracking-wider text-center border-t border-slate-200 transition-colors ${selectedDayForPanel === "Sin Fecha" ? "bg-amber-100 text-amber-800 border-t-amber-200" : "bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            Ver Tareas Sin Fecha ({eventosPorFecha["Sin Fecha"]?.length || 0})
          </button>
        </div>

        {/* Panel Derecho: CALENDARIO (Mes / Semana / Tabla) */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-w-0">
           
           {viewMode === "calendar" && (
             <div className="flex flex-col h-full">
               <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
                 {dayNames.map((day) => (
                   <div key={day} className="py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">{day}</div>
                 ))}
               </div>
               <div className="grid grid-cols-7 bg-slate-100 gap-px flex-1 overflow-y-auto no-scrollbar">
                 {calendarGrid.map((day, index) => (
                   <div
                     key={index}
                     onClick={() => day && setSelectedDayForPanel(day.dateStr)}
                     className={`relative flex flex-col transition-colors cursor-pointer ${
                       !day ? "bg-slate-50/50" : 
                       day.dateStr === selectedDayForPanel ? "bg-blue-50/30 ring-2 ring-inset ring-blue-400 z-10" : "bg-white hover:bg-slate-50"
                     }`}
                     style={{ minHeight: '90px' }} // Altura comprimida
                   >
                     {day && (
                       <div className="flex flex-col h-full p-1.5 overflow-hidden">
                         <div className="flex items-center justify-between mb-1 shrink-0">
                           <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${day.dateStr === new Date().toISOString().split('T')[0] ? "bg-blue-600 text-white" : "text-slate-600"}`}>
                             {day.day}
                           </span>
                         </div>
                         <div className="flex-1 overflow-y-auto no-scrollbar space-y-px">
                           {day.events.map(renderEventCard)}
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}

           {viewMode === "week" && (
             <div className="flex flex-col h-full">
               <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
                 {weekGrid.map((day, index) => (
                   <div key={index} className="py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0 flex flex-col">
                     <span>{dayNames[index]}</span>
                     <span className={`text-xs mt-0.5 ${day.dateStr === new Date().toISOString().split('T')[0] ? "text-blue-600" : "text-slate-800"}`}>{day.day}</span>
                   </div>
                 ))}
               </div>
               <div className="grid grid-cols-7 grid-rows-1 bg-slate-100 gap-px flex-1 overflow-hidden">
                 {weekGrid.map((day, index) => (
                   <div
                     key={index}
                     onClick={() => setSelectedDayForPanel(day.dateStr)}
                     className={`relative flex flex-col h-full overflow-hidden cursor-pointer transition-colors ${day.dateStr === selectedDayForPanel ? "bg-blue-50/30 ring-2 ring-inset ring-blue-400 z-10" : "bg-white hover:bg-slate-50"}`}
                   >
                     <div className="flex-1 overflow-y-auto p-1.5 no-scrollbar space-y-1">
                       {day.events.map((event) => (
                          // Variante un poco más grande del renderEventCard para la semana
                          <div key={`${event.type}_${event.item._id}_wk`} className={`rounded-md p-1.5 border-l-[3px] shadow-sm flex flex-col gap-0.5 ${event.type === 'almuerzo' ? 'bg-orange-50 border-orange-400' : (event.item.Terminado ? 'bg-emerald-50 border-emerald-400' : 'bg-blue-50 border-blue-400')}`} onClick={(e) => { e.stopPropagation(); if (event.type === 'Comanda') handleViewComanda(event.item); }}>
                            <p className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">
                              {event.type === 'almuerzo' ? `🍲 ${event.item.NombreES}` : event.item.Tittle}
                            </p>
                            {event.type === 'Comanda' && event.item.Categoria && <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">{event.item.Categoria}</span>}
                          </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {viewMode === "table" && (
             <div className="overflow-auto flex-1 p-0 bg-white">
               {/* Tabla simplificada reutilizando lógica pero compacta */}
               <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="p-3">Título</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Tipo / Cat</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Eventos ordenados plana */}
                    {Object.values(eventosPorFecha).flat().slice(0, 100).map((event, idx) => {
                       const isAlmuerzo = event.type === 'almuerzo';
                       const item = event.item;
                       return (
                         <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => !isAlmuerzo && handleViewComanda(item)}>
                           <td className="p-3 font-semibold text-slate-800">{isAlmuerzo ? `🍲 ${item.NombreES}` : (item.Tittle || "Sin título")}</td>
                           <td className="p-3 font-medium text-slate-600">{event.dateKey}</td>
                           <td className="p-3 text-slate-500">{isAlmuerzo ? "Almuerzo" : (item.Categoria || "-")}</td>
                           <td className="p-3">
                             {isAlmuerzo ? <span className="text-orange-600 font-bold">Fijo</span> : (
                               <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${item.Terminado ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                 {item.Terminado ? "Terminado" : "Pend."}
                               </span>
                             )}
                           </td>
                         </tr>
                       )
                    })}
                  </tbody>
               </table>
             </div>
           )}

        </div>
      </div>

      <Dialog open={isCreatorOpen} onOpenChange={setIsCreatorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {isCreatorOpen && (
            <ComandaCreator initialFecha={creatorInitialDate} isModal={true} onClose={() => { setIsCreatorOpen(false); dispatch(getAllFromTable("Comanda")); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarioProduccion;
