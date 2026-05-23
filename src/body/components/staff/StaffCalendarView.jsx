import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid } from 'lucide-react';

const StaffCalendarView = ({ employees }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

    const activeStaff = employees.filter(emp => emp.Contratacion !== false && emp.Contratacion !== "false" && emp.Nombre);

    const getStaffOnShift = (dateStr) => {
        if (!dateStr) return [];
        const dateObj = new Date(dateStr + "T12:00:00");
        const dayNamesObj = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
        const dayOfWeek = dayNamesObj[dateObj.getDay()];
        
        return activeStaff.map(staff => {
            let turnosSet = {};
            if (typeof staff.TurnosSet === 'string' && staff.TurnosSet.trim().startsWith('{')) {
                try { turnosSet = JSON.parse(staff.TurnosSet); } catch (e) {}
            } else if (typeof staff.TurnosSet === 'object' && staff.TurnosSet !== null) {
                turnosSet = staff.TurnosSet;
            }
            const schedule = turnosSet[dayOfWeek];
            if (!schedule || schedule.descanso) return null;

            if (schedule.biweekly && schedule.fechaInicio) {
                const inicioDate = new Date(schedule.fechaInicio + "T12:00:00");
                const diffTime = Math.abs(dateObj - inicioDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const diffWeeks = Math.floor(diffDays / 7);
                if (diffWeeks % 2 !== 0) return null;
            }

            return {
                ...staff,
                shift: schedule
            };
        }).filter(Boolean);
    };

    // Calendar generation logic
    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        if (viewMode === 'month') {
            const firstDayOfMonth = new Date(year, month, 1);
            const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Adjust so Monday is the first column
            let offset = startingDayOfWeek - 1;
            if (offset < 0) offset = 6; 

            const grid = [];
            let currentDay = 1;

            // Typically 5 or 6 rows
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < offset) {
                        grid.push(null);
                    } else if (currentDay > daysInMonth) {
                        grid.push(null);
                    } else {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
                        grid.push({
                            day: currentDay,
                            dateStr: dateStr,
                            staff: getStaffOnShift(dateStr)
                        });
                        currentDay++;
                    }
                }
            }
            return grid;
        } else {
            // Week View
            const currentDayOfWeek = currentDate.getDay();
            let offset = currentDayOfWeek - 1;
            if (offset < 0) offset = 6;
            
            const firstDayOfWeek = new Date(currentDate);
            firstDayOfWeek.setDate(currentDate.getDate() - offset);
            
            const grid = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(firstDayOfWeek);
                d.setDate(firstDayOfWeek.getDate() + i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                grid.push({
                    day: d.getDate(),
                    month: d.getMonth() + 1,
                    dateStr: dateStr,
                    staff: getStaffOnShift(dateStr)
                });
            }
            return grid;
        }
    }, [currentDate, viewMode, activeStaff]);

    // Navigation
    const nextPeriod = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') {
            d.setMonth(d.getMonth() + 1);
        } else {
            d.setDate(d.getDate() + 7);
        }
        setCurrentDate(d);
    };

    const prevPeriod = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') {
            d.setMonth(d.getMonth() - 1);
        } else {
            d.setDate(d.getDate() - 7);
        }
        setCurrentDate(d);
    };

    const goToday = () => {
        setCurrentDate(new Date());
    };

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const renderMonthLabel = () => {
        if (viewMode === 'month') {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else {
            return `Semana del ${calendarGrid[0]?.day} ${monthNames[calendarGrid[0]?.month - 1].slice(0,3)} al ${calendarGrid[6]?.day} ${monthNames[calendarGrid[6]?.month - 1].slice(0,3)} ${currentDate.getFullYear()}`;
        }
    };

    // Rendering Staff Pill
    const renderStaffPill = (staffItem) => (
        <div 
            key={staffItem._id} 
            className="text-[9px] px-1.5 py-0.5 rounded shadow-sm text-white font-medium flex items-center justify-between gap-1 overflow-hidden shrink-0 border border-black/10 transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: staffItem.Color || '#3b82f6' }}
            title={`${staffItem.Nombre} ${staffItem.Apellido || ''}`}
        >
            <span className="truncate">{staffItem.Nombre}</span>
            <span className="opacity-90 shrink-0 font-bold tracking-tight">{staffItem.shift.inicio} - {staffItem.shift.fin}</span>
        </div>
    );

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col font-sans">
            {/* Toolbar */}
            <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-800 text-lg capitalize">{renderMonthLabel()}</h3>
                    <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <button onClick={prevPeriod} className="px-2 py-1.5 hover:bg-slate-50 transition-colors text-slate-600 border-r border-slate-200"><ChevronLeft size={18} /></button>
                        <button onClick={goToday} className="px-3 py-1.5 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 border-r border-slate-200">Hoy</button>
                        <button onClick={nextPeriod} className="px-2 py-1.5 hover:bg-slate-50 transition-colors text-slate-600"><ChevronRight size={18} /></button>
                    </div>
                </div>
                
                <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => setViewMode('month')} 
                        className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold transition-colors ${viewMode === 'month' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Grid size={14} /> Mes
                    </button>
                    <button 
                        onClick={() => setViewMode('week')} 
                        className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold border-l border-slate-200 transition-colors ${viewMode === 'week' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <CalendarIcon size={14} /> Semana
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 overflow-auto bg-slate-100 p-0.5">
                <div className="min-w-[800px] h-full flex flex-col">
                    {/* Headers (Days of week) */}
                    <div className="grid grid-cols-7 gap-px mb-0.5 shrink-0">
                        {dayNames.map(d => (
                            <div key={d} className="bg-white py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Month View Grid */}
                    {viewMode === 'month' && (
                        <div className="grid grid-cols-7 auto-rows-fr gap-px flex-1">
                            {calendarGrid.map((dayData, i) => (
                                <div key={i} className={`bg-white p-1.5 flex flex-col gap-1 ${!dayData ? 'opacity-40 bg-slate-50/50' : 'hover:bg-blue-50/10 transition-colors'} min-h-[110px]`}>
                                    {dayData && (
                                        <>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${dayData.dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                                    {dayData.day}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">{dayData.staff.length}</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-0.5 pb-1">
                                                {dayData.staff.map(renderStaffPill)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Week View Grid */}
                    {viewMode === 'week' && (
                        <div className="grid grid-cols-7 gap-px flex-1">
                            {calendarGrid.map((dayData, i) => (
                                <div key={i} className="bg-white p-2 flex flex-col gap-2 min-h-[300px]">
                                    <div className="flex flex-col items-center justify-center py-2 border-b border-slate-100 mb-1">
                                        <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-full ${dayData.dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800'}`}>
                                            {dayData.day}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Total: {dayData.staff.length}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1 pb-2">
                                        {dayData.staff.length === 0 ? (
                                            <div className="text-center text-[10px] text-slate-400 font-medium py-4 bg-slate-50 rounded border border-slate-100 border-dashed">Sin turnos asignados</div>
                                        ) : (
                                            dayData.staff.map(staffItem => (
                                                <div 
                                                    key={staffItem._id} 
                                                    className="px-2 py-1.5 rounded-md shadow-sm border border-black/5 flex flex-col gap-0.5 relative overflow-hidden transition-transform hover:scale-[1.02]"
                                                    style={{ backgroundColor: `${staffItem.Color || '#3b82f6'}15`, borderLeft: `4px solid ${staffItem.Color || '#3b82f6'}` }}
                                                >
                                                    <span className="text-xs font-bold text-slate-800 truncate">{staffItem.Nombre} {staffItem.Apellido || ''}</span>
                                                    <span className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                                                        <span className="bg-white/50 px-1 rounded">{staffItem.shift.inicio} - {staffItem.shift.fin}</span>
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffCalendarView;
