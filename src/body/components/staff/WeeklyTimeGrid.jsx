import React from 'react';
import { Clock, Check } from 'lucide-react';

const WeeklyTimeGrid = ({ schedule = {}, onChange, isEditing, staffColor }) => {
    const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    const hours = Array.from({ length: 25 }, (_, i) => i); // 0 to 24
    const PIXELS_PER_HOUR = 45; // Altura de cada hora en píxeles (un poco más grande para mejor tap-target)

    const timeToPixels = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h + m / 60) * PIXELS_PER_HOUR;
    };

    const handleTimeChange = (day, field, value) => {
        if (!isEditing) return;
        const updated = { ...schedule };
        if (!updated[day]) updated[day] = { descanso: false, inicio: '08:00', fin: '16:00' };
        updated[day][field] = value;
        onChange(updated);
    };

    const handleGlobalChange = (field, value) => {
        if (!isEditing) return;
        const updated = { ...schedule, [field]: value };
        onChange(updated);
    };

    const toggleBiweekly = (day, e) => {
        if (!isEditing) return;
        e.stopPropagation();
        const updated = { ...schedule };
        if (!updated[day]) updated[day] = { descanso: false, inicio: '08:00', fin: '16:00' };
        updated[day].biweekly = !updated[day].biweekly;
        onChange(updated);
    };

    const toggleDescanso = (day) => {
        if (!isEditing) return;
        const updated = { ...schedule };
        if (!updated[day]) {
            updated[day] = { descanso: true };
        } else {
            updated[day].descanso = !updated[day].descanso;
            if (!updated[day].descanso && !updated[day].inicio) {
                updated[day].inicio = '08:00';
                updated[day].fin = '16:00';
            }
        }
        onChange(updated);
    };

    const colorToUse = staffColor || '#3b82f6'; // Default blue
    // Generar un color claro para el fondo del bloque basado en el color seleccionado (aproximación)
    const bgColorToUse = `${colorToUse}30`; // 30% opacidad en hex

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[650px] font-sans">
            {/* Header / Leyenda */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Editor Visual de Horarios</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Define los turnos predeterminados de la semana.</p>
                    </div>
                </div>
                {isEditing && (
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        Modo Edición Activado
                    </div>
                )}
            </div>

            {/* Calendario Contenedor */}
            <div className="flex-1 overflow-y-auto overflow-x-auto relative flex bg-white">
                
                {/* Eje Y: Horas */}
                <div className="w-16 shrink-0 border-r border-slate-100 bg-slate-50/80 relative z-30">
                    <div className="h-12 border-b border-slate-100 sticky top-0 bg-slate-50/80 backdrop-blur-sm z-40"></div> {/* Espacio header dias */}
                    {hours.map(h => (
                        <div key={h} className="relative border-b border-slate-100 text-[10px] text-slate-500 font-medium text-right pr-2" style={{ height: `${PIXELS_PER_HOUR}px` }}>
                            <span className="absolute -top-[9px] right-2 bg-slate-50/80 px-1 rounded">{h === 24 ? '00:00' : `${String(h).padStart(2, '0')}:00`}</span>
                        </div>
                    ))}
                </div>

                {/* Eje X: Días */}
                <div className="flex-1 flex min-w-[700px]">
                    {days.map(day => {
                        const dayData = schedule?.[day] || { descanso: true };
                        const isOff = dayData.descanso;
                        const inicioStr = dayData.inicio || '08:00';
                        const finStr = dayData.fin || '16:00';
                        
                        let topPx = 0;
                        let heightPx = 0;
                        
                        if (!isOff) {
                            topPx = timeToPixels(inicioStr);
                            const finPx = timeToPixels(finStr);
                            heightPx = Math.max(finPx - topPx, PIXELS_PER_HOUR); // Mínimo 1 hora de altura
                        }

                        return (
                            <div key={day} className="flex-1 border-r border-slate-100 relative min-w-[100px] flex flex-col group">
                                {/* Header del Día */}
                                <div 
                                    className={`h-12 border-b border-slate-100 sticky top-0 z-20 flex flex-col items-center justify-center transition-colors backdrop-blur-sm ${isEditing ? 'cursor-pointer hover:bg-slate-100' : ''} ${!isOff ? 'bg-white/90' : 'bg-slate-50/90'}`} 
                                    onClick={() => toggleDescanso(day)}
                                >
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isOff ? 'text-slate-400' : 'text-slate-800'}`}>{day}</span>
                                    {isEditing && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className={`w-3 h-3 rounded flex items-center justify-center border ${isOff ? 'bg-slate-200 border-slate-300' : 'bg-blue-500 border-blue-600'}`}>
                                                {!isOff && <Check size={8} className="text-white stroke-[3]" />}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{isOff ? 'Libre' : 'Turno'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Grilla de líneas (Background) */}
                                <div className="relative flex-1" style={{ height: `${24 * PIXELS_PER_HOUR}px` }}>
                                    {hours.slice(0, 24).map(h => (
                                        <div key={h} className="border-b border-slate-50 absolute w-full" style={{ top: `${h * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}></div>
                                    ))}

                                    {/* Bloque de Turno */}
                                    {!isOff && (
                                        <div 
                                            className="absolute left-1 right-1 rounded-lg shadow-sm border overflow-hidden flex flex-col transition-all hover:shadow-md z-10"
                                            style={{
                                                top: `${topPx}px`,
                                                height: `${heightPx}px`,
                                                backgroundColor: bgColorToUse,
                                                borderColor: colorToUse,
                                                borderLeftWidth: '4px'
                                            }}
                                        >
                                            <div className="p-1.5 flex-1 flex flex-col">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-1 items-center justify-center h-full">
                                                        <div className="bg-white/80 backdrop-blur-sm rounded-md p-1 shadow-sm w-full flex flex-col gap-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                              <span className="text-[9px] font-bold text-slate-500 uppercase">In:</span>
                                                              <input 
                                                                  type="time" 
                                                                  value={inicioStr}
                                                                  onChange={(e) => handleTimeChange(day, 'inicio', e.target.value)}
                                                                  className="flex-1 text-[11px] font-black bg-transparent border-none p-0 text-center focus:ring-0 outline-none text-slate-800"
                                                              />
                                                            </div>
                                                            <div className="border-t border-slate-200/50 w-full"></div>
                                                            <div className="flex items-center justify-between gap-1">
                                                              <span className="text-[9px] font-bold text-slate-500 uppercase">Out:</span>
                                                              <input 
                                                                  type="time" 
                                                                  value={finStr}
                                                                  onChange={(e) => handleTimeChange(day, 'fin', e.target.value)}
                                                                  className="flex-1 text-[11px] font-black bg-transparent border-none p-0 text-center focus:ring-0 outline-none text-slate-800"
                                                              />
                                                            </div>
                                                            <div className="border-t border-slate-200/50 w-full my-0.5"></div>
                                                            <div className="flex flex-col gap-1 w-full">
                                                                <label className="flex items-center gap-1 justify-center text-[9px] font-bold text-slate-600 cursor-pointer w-full text-center hover:text-slate-800 transition-colors">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={dayData.biweekly || false}
                                                                        onChange={(e) => toggleBiweekly(day, e)}
                                                                        className="w-2.5 h-2.5"
                                                                    /> Cada 2 Sem
                                                                </label>
                                                                {dayData.biweekly && (
                                                                    <input 
                                                                        type="date"
                                                                        value={dayData.fechaInicio || ''}
                                                                        onChange={(e) => handleTimeChange(day, 'fechaInicio', e.target.value)}
                                                                        className="w-full text-[8px] bg-white border border-slate-200 rounded p-0.5 text-slate-600 outline-none focus:border-blue-500"
                                                                        title="Fecha de inicio para el ciclo de 2 semanas"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                        <span className="text-xs font-black text-slate-900 drop-shadow-sm">{inicioStr}</span>
                                                        <div className="w-0.5 h-3 bg-slate-900/30 my-0.5 rounded-full"></div>
                                                        <span className="text-xs font-black text-slate-900 drop-shadow-sm">{finStr}</span>
                                                        {dayData.biweekly && (
                                                            <div className="flex flex-col items-center mt-1">
                                                                <span className="text-[8px] bg-white/50 px-1 rounded font-bold border border-slate-300">Cada 2 sem</span>
                                                                {dayData.fechaInicio && <span className="text-[7px] text-slate-600 mt-0.5">{dayData.fechaInicio.slice(5)}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Capa clicable para añadir turno si está libre */}
                                    {isOff && isEditing && (
                                        <div 
                                            className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer bg-slate-100/50 transition-opacity"
                                            onClick={() => toggleDescanso(day)}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-400">
                                                    <span className="text-lg font-light leading-none">+</span>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">
                                                    Activar Turno
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyTimeGrid;
