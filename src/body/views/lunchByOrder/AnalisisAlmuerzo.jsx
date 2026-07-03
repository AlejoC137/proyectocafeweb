import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { VENTAS, MENU, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';
import { ArrowLeft, Calendar, FileText, Download, TrendingUp, Award, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const AnalisisAlmuerzo = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux selectors
    const allVentas = useSelector(state => state.allVentas || []);
    const allMenu = useSelector(state => state.allMenu || []);
    const allRecetasMenu = useSelector(state => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector(state => state.allRecetasProduccion || []);

    // Local states
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        dispatch(getAllFromTable(VENTAS));
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(RECETAS_MENU));
        dispatch(getAllFromTable(RECETAS_PRODUCCION));
    }, [dispatch]);

    // Filtrar almuerzos programados del mes seleccionado
    const almuerzosDelMes = useMemo(() => {
        return allMenu.filter(item => {
            if (item.SUB_GRUPO !== 'TARDEO_ALMUERZO') return false;
            try {
                const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                const dates = compLunch?.fechasSeleccionadas || [];
                const singleDate = compLunch?.fecha?.fecha;

                const allDates = [...dates];
                if (singleDate) allDates.push(singleDate);

                return allDates.some(dateStr => {
                    const d = new Date(dateStr + 'T00:00:00');
                    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                });
            } catch (e) {
                return false;
            }
        });
    }, [allMenu, selectedMonth, selectedYear]);

    // Calcular datos de almuerzos por día
    const lunchStats = useMemo(() => {
        const stats = [];
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        let totalVentasQty = 0;
        let totalSalesVal = 0;
        let totalCostVal = 0;
        const popularityMap = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Buscar almuerzo programado en este día
            const almuerzoHoy = almuerzosDelMes.find(item => {
                try {
                    const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                    const dates = compLunch?.fechasSeleccionadas || [];
                    const singleDate = compLunch?.fecha?.fecha;
                    return dates.includes(dateString) || singleDate === dateString;
                } catch (e) {
                    return false;
                }
            });

            if (!almuerzoHoy) continue; // No hubo almuerzo programado este día

            let cantidadVendida = 0;
            let totalIngreso = 0;

            try {
                const compLunchObj = typeof almuerzoHoy.Comp_Lunch === 'string' ? JSON.parse(almuerzoHoy.Comp_Lunch) : almuerzoHoy.Comp_Lunch;
                if (compLunchObj && Array.isArray(compLunchObj.lista)) {
                    compLunchObj.lista.forEach(version => {
                        if (version && Array.isArray(version.list)) {
                            // Sumamos todos los pedidos registrados en esta versión del día
                            cantidadVendida += version.list.length;
                        }
                    });
                }
            } catch (e) {
                console.error("Error al parsear pedidos de Comp_Lunch:", e);
            }

            const precioVenta = parseFloat(almuerzoHoy.Precio || 22000);
            totalIngreso = cantidadVendida * precioVenta;

            // Costo de receta del almuerzo programado
            let recetaValor = 0;
            if (almuerzoHoy.Receta) {
                const recetaData = allRecetasMenu.find(r => r._id === almuerzoHoy.Receta) || allRecetasProduccion.find(r => r._id === almuerzoHoy.Receta);
                if (recetaData && recetaData.costo) {
                    try {
                        const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;
                        if (typeof costData === 'number') {
                            recetaValor = costData;
                        } else if (costData) {
                            recetaValor = (Number(costData.vCMP) || 0) + (Number(costData.vCMO) || 0);
                        }
                    } catch (e) {}
                }
            }

            const costoTotal = recetaValor * cantidadVendida;
            const utilidad = totalIngreso - costoTotal;

            totalVentasQty += cantidadVendida;
            totalSalesVal += totalIngreso;
            totalCostVal += costoTotal;

            if (cantidadVendida > 0) {
                popularityMap[almuerzoHoy.NombreES] = (popularityMap[almuerzoHoy.NombreES] || 0) + cantidadVendida;
            }

            stats.push({
                fecha: dateString,
                dia: day,
                nombre: almuerzoHoy.NombreES,
                cantidad: cantidadVendida,
                ingreso: totalIngreso,
                costoUnitario: recetaValor,
                costoTotal: costoTotal,
                utilidad: utilidad
            });
        }

        // Determinar el almuerzo más vendido
        let topLunchName = "N/A";
        let topLunchQty = 0;
        Object.entries(popularityMap).forEach(([name, qty]) => {
            if (qty > topLunchQty) {
                topLunchQty = qty;
                topLunchName = name;
            }
        });

        return {
            stats: stats.sort((a, b) => a.dia - b.dia),
            totalCantidad: totalVentasQty,
            totalIngreso: totalSalesVal,
            totalCosto: totalCostVal,
            utilidadNeta: totalSalesVal - totalCostVal,
            margenGeneral: totalSalesVal > 0 ? ((totalSalesVal - totalCostVal) / totalSalesVal) * 100 : 0,
            topLunch: `${topLunchName} (${topLunchQty} vendidos)`
        };
    }, [almuerzosDelMes, allVentas, allRecetasMenu, allRecetasProduccion, selectedMonth, selectedYear]);

    // Agrupación de almuerzos por nombre durante el mes
    const groupedStats = useMemo(() => {
        const groups = {};
        lunchStats.stats.forEach(item => {
            if (!groups[item.nombre]) {
                groups[item.nombre] = {
                    nombre: item.nombre,
                    diasServido: 0,
                    cantidad: 0,
                    ingreso: 0,
                    costoTotal: 0,
                    utilidad: 0
                };
            }
            groups[item.nombre].diasServido += 1;
            groups[item.nombre].cantidad += item.cantidad;
            groups[item.nombre].ingreso += item.ingreso;
            groups[item.nombre].costoTotal += item.costoTotal;
            groups[item.nombre].utilidad += item.utilidad;
        });
        return Object.values(groups).sort((a, b) => b.cantidad - a.cantidad);
    }, [lunchStats.stats]);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`Análisis de Almuerzos - ${monthsNames[selectedMonth].toUpperCase()} ${selectedYear}`, 15, 15);
        
        doc.setFontSize(10);
        let currentY = 25;
        doc.text(`Total Almuerzos Vendidos: ${lunchStats.totalCantidad}`, 15, currentY);
        doc.text(`Ingreso Total Almuerzos: ${lunchStats.totalIngreso.toLocaleString('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0})}`, 15, currentY + 6);
        doc.text(`Costo Producción Total: ${lunchStats.totalCosto.toLocaleString('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0})}`, 15, currentY + 12);
        doc.text(`Utilidad Neta Almuerzos: ${lunchStats.utilidadNeta.toLocaleString('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0})}`, 15, currentY + 18);
        doc.text(`Margen General: ${lunchStats.margenGeneral.toFixed(1)}%`, 15, currentY + 24);
        doc.text(`Almuerzo Estrella: ${lunchStats.topLunch}`, 15, currentY + 30);

        currentY += 40;
        doc.text(`RESUMEN CONSOLIDADO (AGRUPADO POR MENÚ):`, 15, currentY);
        currentY += 8;

        doc.setFontSize(8);
        doc.text(`Nombre Almuerzo                                  | Días | Cant. | Ingresos      | Costo Total   | Utilidad`, 15, currentY);
        doc.line(15, currentY + 2, 195, currentY + 2);
        currentY += 6;

        groupedStats.forEach(item => {
            if (currentY > 280) {
                doc.addPage();
                currentY = 15;
            }
            const paddedName = item.nombre.padEnd(45, ' ').substring(0, 45);
            doc.text(`${paddedName} | ${String(item.diasServido).padStart(4, ' ')} | ${String(item.cantidad).padStart(5, ' ')} | ${item.ingreso.toLocaleString('es-CO').padStart(13, ' ')} | ${item.costoTotal.toLocaleString('es-CO').padStart(13, ' ')} | ${item.utilidad.toLocaleString('es-CO').padStart(13, ' ')}`, 15, currentY);
            currentY += 5;
        });

        currentY += 12;
        if (currentY > 260) {
            doc.addPage();
            currentY = 15;
        }
        doc.setFontSize(10);
        doc.text(`DESGLOSE DIARIO DETALLADO:`, 15, currentY);
        currentY += 8;

        doc.setFontSize(8);
        doc.text(`Día   | Nombre Almuerzo                                  | Cant. | Ingresos      | Costo Total   | Utilidad`, 15, currentY);
        doc.line(15, currentY + 2, 195, currentY + 2);
        currentY += 6;

        lunchStats.stats.forEach(item => {
            if (currentY > 280) {
                doc.addPage();
                currentY = 15;
            }
            const paddedName = item.nombre.padEnd(45, ' ').substring(0, 45);
            doc.text(`${String(item.dia).padStart(2, '0')}    | ${paddedName} | ${String(item.cantidad).padStart(5, ' ')} | ${item.ingreso.toLocaleString('es-CO').padStart(13, ' ')} | ${item.costoTotal.toLocaleString('es-CO').padStart(13, ' ')} | ${item.utilidad.toLocaleString('es-CO').padStart(13, ' ')}`, 15, currentY);
            currentY += 5;
        });

        doc.save(`analisis_almuerzos_${monthsNames[selectedMonth].toLowerCase()}_${selectedYear}.pdf`);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen w-full font-SpaceGrotesk">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 bg-white border rounded-xl hover:bg-slate-100 transition shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Análisis Mensual de Almuerzos</h1>
                        <p className="text-sm text-slate-500">Detalle de platos preparados, cantidades vendidas y rentabilidad diaria.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-white border rounded-xl p-1 shadow-sm items-center">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent px-3 py-1.5 text-sm font-semibold focus:outline-none"
                        >
                            {monthsNames.map((name, index) => (
                                <option key={index} value={index}>{name}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent px-3 py-1.5 text-sm font-semibold focus:outline-none border-l"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </button>
                </div>
            </div>

            {/* Tarjetas KPI */}
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

            {/* Tabla Detallada */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700">Bitácora Diaria del Almuerzo</h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        Margen Promedio: {lunchStats.margenGeneral.toFixed(1)}%
                    </span>
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lunchStats.stats.map((item, index) => {
                                const itemMargen = item.ingreso > 0 ? (item.utilidad / item.ingreso) * 100 : 0;
                                return (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-600">
                                            {String(item.dia).padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                                            {item.nombre}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            {item.cantidad}
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
                                    </tr>
                                );
                            })}
                            {lunchStats.stats.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-slate-400">
                                        No se encontraron almuerzos programados o ventas para este mes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
            </div>

            {/* Consolidado Mensual Agrupado */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mt-6">
                <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700">Consolidado Mensual por Menú (Agrupado por Nombre)</h3>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {groupedStats.length} menús diferentes
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groupedStats.map((item, index) => {
                                const itemMargen = item.ingreso > 0 ? (item.utilidad / item.ingreso) * 100 : 0;
                                return (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                                            {item.nombre}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                                            {item.diasServido}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            {item.cantidad}
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
                                    </tr>
                                );
                            })}
                            {groupedStats.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-slate-400">
                                        No hay datos agrupados para mostrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalisisAlmuerzo;
