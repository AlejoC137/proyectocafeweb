import React from 'react';
import { TrendingUp, PieChart, Award, Search, BarChart2 } from 'lucide-react';

export const AnnualView = ({
    selectedYear,
    annualStats,
    maxMonthlyQty,
    totalProteinQty,
    searchTermAnnual,
    setSearchTermAnnual,
    filteredAnnualTopMenus,
    maxTopLunchQty,
    handleCreateRecipe,
    setLunchToEdit,
    setIsLunchModalOpen,
    navigate
}) => {
    return (
        <div className="space-y-6">
            {/* Fila superior de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tendencia mensual (SVG Line Chart) */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" /> Tendencia Mensual de Ventas ({selectedYear})
                        </h3>
                    </div>
                    <div className="relative w-full h-[220px] bg-slate-50/50 rounded-xl p-2 border">
                        <svg viewBox="0 0 500 200" className="w-full h-full">
                            {/* Grid Lines */}
                            <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="30" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
                            
                            {/* Draw Bars */}
                            {annualStats.monthlyTrend.map((m, idx) => {
                                const x = 45 + idx * 37;
                                const barHeight = maxMonthlyQty > 0 ? (m.cantidad / maxMonthlyQty) * 130 : 0;
                                const y = 170 - barHeight;
                                return (
                                    <g key={idx} className="group cursor-pointer">
                                        <rect 
                                            x={x - 10} 
                                            y={y} 
                                            width="20" 
                                            height={Math.max(barHeight, 3)} 
                                            fill="#10b981" 
                                            rx="3" 
                                            className="transition-all hover:fill-emerald-600" 
                                        />
                                        <text x={x} y="185" fontSize="8" fontWeight="bold" fill="#64748b" textAnchor="middle">{m.month}</text>
                                        <text x={x} y={y - 5} fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">{m.cantidad}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Distribución por proteína (Progress Breakdown) */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-blue-600" /> Distribución por Proteína ({selectedYear})
                    </h3>
                    <div className="space-y-4">
                        {annualStats.proteinSummary.map((p, idx) => {
                            const percentage = totalProteinQty > 0 ? (p.cantidad / totalProteinQty) * 100 : 0;
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                                            {p.nombre}
                                        </span>
                                        <span>{p.cantidad} platos ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            style={{ width: `${percentage}%`, backgroundColor: p.color }} 
                                            className="h-full rounded-full transition-all"
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Fila inferior de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking Completo de Menús */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-600" /> Ranking de Menús Vendidos ({selectedYear})
                        </h3>
                        <div className="relative w-full md:w-48">
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre..."
                                value={searchTermAnnual}
                                onChange={(e) => setSearchTermAnnual(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 border rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                        {filteredAnnualTopMenus.map((m, idx) => {
                            const percentWidth = maxTopLunchQty > 0 ? (m.cantidad / maxTopLunchQty) * 100 : 0;
                            return (
                                <div key={idx} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition">
                                    <span className="w-6 text-xs font-bold text-slate-450 text-right">{idx + 1}.</span>
                                    <span className="w-1/4 text-xs font-semibold text-slate-800 truncate" title={m.nombre}>{m.nombre}</span>
                                    <div className="flex-grow bg-slate-100 h-5 rounded overflow-hidden flex items-center">
                                        <div 
                                            style={{ width: `${percentWidth}%` }} 
                                            className="h-full bg-amber-400/80 hover:bg-amber-400 rounded-r transition-all"
                                        ></div>
                                    </div>
                                    <div className="w-auto flex flex-col items-end">
                                        <span className="text-xs font-black text-slate-650 text-right">{m.cantidad} platos</span>
                                        {m.desgloseVersiones && Object.keys(m.desgloseVersiones).length > 0 && (
                                            <div className="text-[9px] text-slate-500 font-normal mt-0.5 flex flex-col items-end">
                                                {Object.entries(m.desgloseVersiones).map(([vName, vQty]) => (
                                                    <span key={vName}>{vName}: {vQty}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {m.originalItem?.Receta ? (
                                            <button 
                                                onClick={() => navigate(`/receta/${m.originalItem.Receta}`)}
                                                className="px-2 py-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border rounded"
                                                title="Ver/Editar Receta"
                                            >
                                                Receta
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleCreateRecipe(m.originalItem._id, m.nombre)}
                                                className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border rounded"
                                                title="Crear Receta"
                                            >
                                                + Receta
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => { setLunchToEdit(m.originalItem); setIsLunchModalOpen(true); }}
                                            className="px-2 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border rounded"
                                            title="Editar componentes en el Creador"
                                        >
                                            Creador
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredAnnualTopMenus.length === 0 && (
                            <p className="text-center text-slate-400 py-10 text-xs">No hay datos de menú para mostrar.</p>
                        )}
                    </div>
                </div>

                {/* Análisis de Rentabilidad por Proteína */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-5 border-b bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-indigo-600" /> Rentabilidad y Utilidad por Proteína
                        </h3>
                    </div>
                    <div className="overflow-x-auto flex-grow">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="py-3 px-4 font-bold text-slate-500 text-left">Proteína</th>
                                    <th className="py-3 px-4 font-bold text-slate-500 text-center">Platos</th>
                                    <th className="py-3 px-4 font-bold text-slate-500 text-right">Ingresos</th>
                                    <th className="py-3 px-4 font-bold text-slate-500 text-right">Costo Total</th>
                                    <th className="py-3 px-4 font-bold text-slate-500 text-right">Utilidad</th>
                                    <th className="py-3 px-4 font-bold text-slate-500 text-center">Margen %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {annualStats.proteinSummary.map((item, index) => {
                                    const itemMargen = item.ingreso > 0 ? (item.utilidad / item.ingreso) * 100 : 0;
                                    return (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-slate-700 flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                {item.nombre}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                                                {item.cantidad}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-green-600">
                                                {item.ingreso.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                                                {item.costo.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                                                {item.utilidad.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700`}>
                                                    {itemMargen.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
