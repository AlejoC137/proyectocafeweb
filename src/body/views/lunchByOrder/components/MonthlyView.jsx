import React from 'react';
import { TrendingUp, DollarSign, Calendar, Award, Search, Pencil, BookOpen, Plus, Edit } from 'lucide-react';

export const MonthlyView = ({
    lunchStats,
    filteredLunchStats,
    groupedStats,
    filteredGroupedStats,
    searchTermMonthly,
    setSearchTermMonthly,
    setLunchToEdit,
    setIsLunchModalOpen,
    handleCreateRecipe,
    navigate
}) => {
    return (
        <>
            {/* Tarjetas KPI Mensuales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Ingreso Total Almuerzos</p>
                        <p className="text-xl font-bold text-slate-800">{lunchStats.totalIngreso.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Costo Producción Total</p>
                        <p className="text-xl font-bold text-slate-800">{lunchStats.totalCosto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Total Platos Vendidos</p>
                        <p className="text-xl font-bold text-slate-800">{lunchStats.totalCantidad} almuerzos</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Award className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Plato Estrella</p>
                        <p className="text-sm font-bold text-slate-800 truncate" title={lunchStats.topLunch}>{lunchStats.topLunch}</p>
                    </div>
                </div>
            </div>

            {/* Tabla Detallada por Día */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-700">Bitácora Diaria del Almuerzo</h3>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-60">
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchTermMonthly}
                                onChange={(e) => setSearchTermMonthly(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 border rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                            />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 whitespace-nowrap">
                            Margen Promedio: {lunchStats.margenGeneral.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="py-3 px-4 font-bold text-slate-500 text-left">Día</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-left">Menú Programado</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Cant. Vendida</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-right">Ingreso Venta</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-right">Costo Producción</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-right">Utilidad Neta</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Margen %</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Gestión / Enlaces</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLunchStats.map((item, index) => {
                                const itemMargen = item.ingreso > 0 ? (item.utilidad / item.ingreso) * 100 : 0;
                                return (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-600">
                                            {String(item.dia).padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4 text-left font-semibold text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span>{item.nombre}</span>
                                                <button 
                                                    onClick={() => { setLunchToEdit(item.originalItem); setIsLunchModalOpen(true); }}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-all"
                                                    title="Editar datos del ítem del almuerzo"
                                                >
                                                    <Pencil size={11} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            {item.originalItem?.Comp_Lunch ? (
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span>{item.cantidad}</span>
                                                        <button 
                                                            onClick={() => navigate(`/CalendarioProduccion`)}
                                                            className="p-0.5 text-[9px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 border rounded"
                                                            title="Ver/Editar listado de clientes en el Calendario"
                                                        >
                                                            Clientes
                                                        </button>
                                                    </div>
                                                    {item.desgloseVersiones && Object.keys(item.desgloseVersiones).length > 0 && (
                                                        <div className="text-[10px] text-slate-500 font-normal mt-1 flex flex-col items-center">
                                                            {Object.entries(item.desgloseVersiones).map(([vName, vQty]) => (
                                                                <span key={vName}>{vName}: {vQty}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <span>{item.cantidad}</span>
                                                    {item.desgloseVersiones && Object.keys(item.desgloseVersiones).length > 0 && (
                                                        <div className="text-[10px] text-slate-500 font-normal mt-1 flex flex-col items-center">
                                                            {Object.entries(item.desgloseVersiones).map(([vName, vQty]) => (
                                                                <span key={vName}>{vName}: {vQty}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-green-600">
                                            {item.ingreso.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                                            {item.costoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                                            {item.utilidad.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                                itemMargen >= 50 ? 'bg-green-50 text-green-700 border border-green-150' : 
                                                itemMargen >= 30 ? 'bg-blue-50 text-blue-700 border border-blue-150' : 
                                                'bg-yellow-50 text-yellow-700 border border-yellow-150'
                                            }`}>
                                                {itemMargen.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {item.originalItem?.Receta ? (
                                                    <button 
                                                        onClick={() => navigate(`/receta/${item.originalItem.Receta}`)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-all"
                                                        title="Editar la receta de este almuerzo"
                                                    >
                                                        <BookOpen size={10} /> Receta
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateRecipe(item.originalItem._id, item.originalItem.NombreES)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 rounded-md transition-all"
                                                        title="Crear y asociar receta a este plato"
                                                    >
                                                        <Plus size={10} /> Crear Receta
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => { setLunchToEdit(item.originalItem); setIsLunchModalOpen(true); }}
                                                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition-all"
                                                    title="Componer componentes del menú"
                                                >
                                                    <Edit size={10} /> Creador
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredLunchStats.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-10 text-slate-400">
                                        No se encontraron almuerzos para los filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Consolidado Mensual Agrupado */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mt-6">
                <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700">Consolidado Mensual por Menú (Agrupado por Nombre)</h3>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {filteredGroupedStats.length} menús diferentes
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="py-3 px-4 font-bold text-slate-500 text-left">Menú / Almuerzo</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Días Servido</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Cant. Vendida</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-right">Ingresos Totales</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-right">Costo Total</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-right">Utilidad Neta</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Margen %</th>
                                <th className="py-3 px-4 font-bold text-slate-500 text-center">Gestión / Enlaces</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredGroupedStats.map((item, index) => {
                                const itemMargen = item.ingreso > 0 ? (item.utilidad / item.ingreso) * 100 : 0;
                                return (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-slate-800 text-left">
                                            <div className="flex items-center gap-2">
                                                <span>{item.nombre}</span>
                                                <button 
                                                    onClick={() => { setLunchToEdit(item.originalItem); setIsLunchModalOpen(true); }}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-all"
                                                    title="Editar componentes en el creador"
                                                >
                                                    <Pencil size={11} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                                            {item.diasServido}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span>{item.cantidad}</span>
                                                {item.desgloseVersiones && Object.keys(item.desgloseVersiones).length > 0 && (
                                                    <div className="text-[10px] text-slate-500 font-normal mt-1 flex flex-col items-center">
                                                        {Object.entries(item.desgloseVersiones).map(([vName, vQty]) => (
                                                            <span key={vName}>{vName}: {vQty}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-green-600">
                                            {item.ingreso.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                                            {item.costoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                                            {item.utilidad.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                                itemMargen >= 50 ? 'bg-green-50 text-green-700 border border-green-150' : 
                                                itemMargen >= 30 ? 'bg-blue-50 text-blue-700 border border-blue-150' : 
                                                'bg-yellow-50 text-yellow-700 border border-yellow-150'
                                            }`}>
                                                {itemMargen.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {item.originalItem?.Receta ? (
                                                    <button 
                                                        onClick={() => navigate(`/receta/${item.originalItem.Receta}`)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-all"
                                                    >
                                                        <BookOpen size={10} /> Receta
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateRecipe(item.originalItem._id, item.originalItem.NombreES)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 rounded-md transition-all"
                                                    >
                                                        <Plus size={10} /> Crear Receta
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => { setLunchToEdit(item.originalItem); setIsLunchModalOpen(true); }}
                                                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition-all"
                                                >
                                                    <Edit size={10} /> Creador
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};
