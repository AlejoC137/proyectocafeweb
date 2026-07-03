import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { VENTAS, MENU, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';
import { ArrowLeft, Calendar, FileText, Download, TrendingUp, Award, DollarSign, PieChart, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Clasificar tipos de proteína basados en el nombre
const getProteinType = (name) => {
    const n = name.toUpperCase();
    if (n.includes('POLLO') || n.includes('CHICKEN') || n.includes('MILANESA')) return 'POLLO';
    if (n.includes('CERDO') || n.includes('COSTILLA') || n.includes('CAÑON') || n.includes('CAÑÓN') || n.includes('LECHONA') || n.includes('TOCINETA')) return 'CERDO';
    if (n.includes('RES') || n.includes('CARNE') || n.includes('GOULASH') || n.includes('LOMO') || n.includes('BIFE') || n.includes('ASADO') || n.includes('PECHO') || n.includes('ALBONDIGAS') || n.includes('ALBÓNDIGAS')) return 'RES';
    return 'OTROS';
};

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
    const [activeTab, setActiveTab] = useState("mensual"); // "mensual" | "anual"

    useEffect(() => {
        dispatch(getAllFromTable(VENTAS));
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(RECETAS_MENU));
        dispatch(getAllFromTable(RECETAS_PRODUCCION));
    }, [dispatch]);

    // --- CÁLCULO DE VISTA MENSUAL ---
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

    const lunchStats = useMemo(() => {
        const stats = [];
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        let totalVentasQty = 0;
        let totalSalesVal = 0;
        let totalCostVal = 0;
        const popularityMap = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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

            if (!almuerzoHoy) continue;

            let cantidadVendida = 0;
            let totalIngreso = 0;

            try {
                const compLunchObj = typeof almuerzoHoy.Comp_Lunch === 'string' ? JSON.parse(almuerzoHoy.Comp_Lunch) : almuerzoHoy.Comp_Lunch;
                if (compLunchObj && Array.isArray(compLunchObj.lista)) {
                    compLunchObj.lista.forEach(version => {
                        if (version && Array.isArray(version.list)) {
                            cantidadVendida += version.list.length;
                        }
                    });
                }
            } catch (e) {
                console.error("Error al parsear pedidos de Comp_Lunch:", e);
            }

            const precioVenta = parseFloat(almuerzoHoy.Precio || 22000);
            totalIngreso = cantidadVendida * precioVenta;

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
    }, [almuerzosDelMes, allRecetasMenu, allRecetasProduccion, selectedMonth, selectedYear]);

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

    // --- CÁLCULO DE VISTA ANUAL / TENDENCIAS ---
    const annualStats = useMemo(() => {
        const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
            month: monthsNames[i].substring(0, 3),
            monthIndex: i,
            cantidad: 0,
            ingreso: 0,
            costo: 0,
            utilidad: 0
        }));

        const proteinSummary = {
            POLLO: { nombre: 'Pollo', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#38bdf8' },
            CERDO: { nombre: 'Cerdo', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#fbbf24' },
            RES: { nombre: 'Res / Carne', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#f87171' },
            OTROS: { nombre: 'Otros / Veggie', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#34d399' }
        };

        const topMenus = {};

        const almuerzosDelAnio = allMenu.filter(item => {
            if (item.SUB_GRUPO !== 'TARDEO_ALMUERZO') return false;
            try {
                const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                const dates = compLunch?.fechasSeleccionadas || [];
                const singleDate = compLunch?.fecha?.fecha;
                const allDates = [...dates];
                if (singleDate) allDates.push(singleDate);

                return allDates.some(dateStr => {
                    const d = new Date(dateStr + 'T00:00:00');
                    return d.getFullYear() === selectedYear;
                });
            } catch (e) {
                return false;
            }
        });

        almuerzosDelAnio.forEach(item => {
            let cantidadVendida = 0;
            try {
                const compLunchObj = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                if (compLunchObj && Array.isArray(compLunchObj.lista)) {
                    compLunchObj.lista.forEach(version => {
                        if (version && Array.isArray(version.list)) {
                            cantidadVendida += version.list.length;
                        }
                    });
                }
            } catch (e) {}

            const precioVenta = parseFloat(item.Precio || 22000);
            const ingresoVenta = cantidadVendida * precioVenta;

            let recetaValor = 0;
            if (item.Receta) {
                const recetaData = allRecetasMenu.find(r => r._id === item.Receta) || allRecetasProduccion.find(r => r._id === item.Receta);
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
            const utilidad = ingresoVenta - costoTotal;

            try {
                const compLunch = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                const dateStr = compLunch?.fecha?.fecha || compLunch?.fechasSeleccionadas?.[0];
                if (dateStr) {
                    const d = new Date(dateStr + 'T00:00:00');
                    const mIdx = d.getMonth();
                    if (mIdx >= 0 && mIdx < 12) {
                        monthlyTrend[mIdx].cantidad += cantidadVendida;
                        monthlyTrend[mIdx].ingreso += ingresoVenta;
                        monthlyTrend[mIdx].costo += costoTotal;
                        monthlyTrend[mIdx].utilidad += utilidad;
                    }
                }
            } catch (e) {}

            const protein = getProteinType(item.NombreES);
            proteinSummary[protein].cantidad += cantidadVendida;
            proteinSummary[protein].ingreso += ingresoVenta;
            proteinSummary[protein].costo += costoTotal;
            proteinSummary[protein].utilidad += utilidad;

            topMenus[item.NombreES] = (topMenus[item.NombreES] || 0) + cantidadVendida;
        });

        const sortedTopMenus = Object.entries(topMenus)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 8);

        return {
            monthlyTrend,
            proteinSummary: Object.values(proteinSummary),
            topMenus: sortedTopMenus
        };
    }, [allMenu, allRecetasMenu, allRecetasProduccion, selectedYear]);

    // -- GENERACIÓN DE PDF MENSUAL --
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

    // --- DETALLES DE ESCALA PARA GRÁFICOS SVG ---
    const maxMonthlyQty = Math.max(...annualStats.monthlyTrend.map(m => m.cantidad), 1);
    const maxTopLunchQty = Math.max(...annualStats.topMenus.map(m => m.cantidad), 1);
    const totalProteinQty = annualStats.proteinSummary.reduce((acc, p) => acc + p.cantidad, 0) || 1;

    return (
        <div className="p-6 bg-slate-50 min-h-screen w-full font-SpaceGrotesk">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/CalendarioProduccion')} 
                        className="p-2.5 bg-white border rounded-xl hover:bg-slate-100 transition shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Análisis Operativo de Almuerzos</h1>
                        <p className="text-sm text-slate-500">Supervisión de tendencias, rentabilidad y distribución de proteínas.</p>
                    </div>
                </div>

                {/* Controles de Selección */}
                <div className="flex items-center gap-2 flex-wrap">
                    {activeTab === "mensual" ? (
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
                    ) : (
                        <div className="flex bg-white border rounded-xl p-1 shadow-sm items-center">
                            <span className="text-xs font-bold text-slate-400 px-2">Año:</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent px-3 py-1.5 text-sm font-semibold focus:outline-none"
                            >
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab === "mensual" && (
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow"
                        >
                            <Download className="w-4 h-4" />
                            Descargar PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Pestañas de Navegación del Análisis */}
            <div className="flex border-b border-slate-200 mb-6 gap-4">
                <button
                    onClick={() => setActiveTab("mensual")}
                    className={`pb-3 font-bold text-sm transition-all relative ${activeTab === "mensual" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Vista Mensual
                </button>
                <button
                    onClick={() => setActiveTab("anual")}
                    className={`pb-3 font-bold text-sm transition-all relative ${activeTab === "anual" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    📈 Tendencias y Proteínas (Anual)
                </button>
            </div>

            {activeTab === "mensual" ? (
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
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                // --- VISTA ANUAL Y GRÁFICOS DE TENDENCIAS ---
                <div className="space-y-6">
                    {/* Fila superior de gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Tendencia mensual (SVG Line/Bar Chart) */}
                        <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" /> Tendencia Mensual de Ventas ({selectedYear})
                                </h3>
                            </div>
                            {/* Gráfico SVG de barras de tendencia */}
                            <div className="relative w-full h-[220px] flex items-end justify-between px-4 pb-6 pt-4 border-b border-l">
                                {annualStats.monthlyTrend.map((m, idx) => {
                                    const percentHeight = (m.cantidad / maxMonthlyQty) * 100;
                                    return (
                                        <div key={idx} className="flex flex-col items-center group flex-1">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-[200px] bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none z-50">
                                                {m.cantidad} platos (${m.ingreso.toLocaleString('es-CO')})
                                            </div>
                                            {/* Barra */}
                                            <div 
                                                style={{ height: `${Math.max(percentHeight, 4)}%` }} 
                                                className="w-[60%] max-w-[32px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all cursor-pointer shadow-sm relative"
                                            ></div>
                                            {/* Nombre de mes */}
                                            <span className="text-[9px] font-bold text-slate-500 uppercase mt-2">{m.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Distribución por proteína (Donut/Radial Chart) */}
                        <div className="bg-white p-5 rounded-2xl border shadow-sm">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                                <PieChart className="w-5 h-5 text-blue-600" /> Distribución por Proteína
                            </h3>
                            <div className="space-y-4">
                                {annualStats.proteinSummary.map((p, idx) => {
                                    const percentage = totalProteinQty > 0 ? (p.cantidad / totalProteinQty) * 100 : 0;
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>{p.nombre}</span>
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

                    {/* Fila inferior de gráficos (Top Menus y Tabla de Proteína) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top 8 Almuerzos del Año */}
                        <div className="bg-white p-5 rounded-2xl border shadow-sm">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-amber-600" /> Top 8 Menús Más Vendidos del Año
                            </h3>
                            <div className="space-y-3">
                                {annualStats.topMenus.map((m, idx) => {
                                    const percentWidth = (m.cantidad / maxTopLunchQty) * 100;
                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="w-5 text-xs font-bold text-slate-400 text-right">{idx + 1}.</span>
                                            <span className="w-1/3 text-xs font-bold text-slate-700 truncate">{m.nombre}</span>
                                            <div className="flex-grow bg-slate-150 h-5 rounded overflow-hidden flex items-center">
                                                <div 
                                                    style={{ width: `${percentWidth}%` }} 
                                                    className="h-full bg-amber-500/80 hover:bg-amber-500 rounded-r transition-all"
                                                ></div>
                                            </div>
                                            <span className="w-16 text-xs font-black text-slate-600 text-right">{m.cantidad} platos</span>
                                        </div>
                                    );
                                })}
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
            )}
        </div>
    );
};

export default AnalisisAlmuerzo;
