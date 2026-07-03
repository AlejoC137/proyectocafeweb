import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { updateItem } from '../../../redux/actions-Proveedores';
import { VENTAS, MENU, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';
import { ArrowLeft, Calendar, FileText, Download, TrendingUp, Award, DollarSign, PieChart, BarChart2, BookOpen, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { LunchModal } from '../../../components/ui/CardGridInventarioMenuLunch';

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Parseador de fechas ultra seguro y libre de desfases de zonas horarias
const parseDateYearAndMonth = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleanStr = dateStr.trim();
    
    // Formato YYYY-MM-DD
    if (cleanStr.includes('-')) {
        const parts = cleanStr.split('-');
        if (parts[0].length === 4) {
            return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) };
        } else if (parts[2]?.length === 4) { // DD-MM-YYYY
            return { year: parseInt(parts[2], 10), month: parseInt(parts[1], 10) - 1, day: parseInt(parts[0], 10) };
        }
    } 
    // Formato DD/MM/YYYY o YYYY/MM/DD
    else if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts[2]?.length === 4) {
            return { year: parseInt(parts[2], 10), month: parseInt(parts[1], 10) - 1, day: parseInt(parts[0], 10) };
        } else if (parts[0].length === 4) {
            return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) };
        }
    }
    
    // Fallback nativo
    const d = new Date(cleanStr + 'T12:00:00');
    if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
    return null;
};

// Clasificador de tipos de proteína
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
    const allMenu = useSelector(state => state.allMenu || []);
    const allRecetasMenu = useSelector(state => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector(state => state.allRecetasProduccion || []);

    // Local states
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState("mensual");

    // Modal del creador
    const [isLunchModalOpen, setIsLunchModalOpen] = useState(false);
    const [lunchToEdit, setLunchToEdit] = useState(null);

    useEffect(() => {
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(RECETAS_MENU));
        dispatch(getAllFromTable(RECETAS_PRODUCCION));
    }, [dispatch]);

    // Guardar cambios del almuerzo en el creador
    const handleSaveLunch = async (nombreES, compLunchData, productId) => {
        try {
            if (productId) {
                const fechaStr = compLunchData?.fechasSeleccionadas?.[0] || compLunchData?.fecha?.fecha;
                const diaSemana = fechaStr ? new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' }) : '';
                const compParaFecha = {
                    ...compLunchData,
                    fechasSeleccionadas: fechaStr ? [fechaStr] : [],
                    fecha: { fecha: fechaStr, dia: diaSemana }
                };
                const finalCompLunchData = JSON.stringify(compParaFecha);
                
                const updatedData = {
                    NombreES: nombreES,
                    Comp_Lunch: finalCompLunchData,
                };
                await dispatch(updateItem(productId, updatedData, MENU));
                await dispatch(getAllFromTable(MENU));
                alert('✅ ¡Almuerzo actualizado con éxito!');
            }
            setIsLunchModalOpen(false);
            setLunchToEdit(null);
        } catch (error) {
            alert('❌ Error al guardar el almuerzo.');
            console.error(error);
        }
    };

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
                    const parsed = parseDateYearAndMonth(dateStr);
                    return parsed && parsed.month === selectedMonth && parsed.year === selectedYear;
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
            } catch (e) {}

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
                utilidad: utilidad,
                originalItem: almuerzoHoy
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
                    utilidad: 0,
                    originalItem: item.originalItem
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

    // --- CÁLCULO DE VISTA ANUAL ---
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
            POLLO: { nombre: 'Pollo', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#0ea5e9' },
            CERDO: { nombre: 'Cerdo', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#f59e0b' },
            RES: { nombre: 'Res / Carne', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#ef4444' },
            OTROS: { nombre: 'Otros / Veggie', cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, color: '#10b981' }
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
                    const parsed = parseDateYearAndMonth(dateStr);
                    return parsed && parsed.year === selectedYear;
                });
            } catch (e) {
                return false;
            }
        });

        almuerzosDelAnio.forEach(item => {
            let cantidadVendida = 0;
            const precioVenta = parseFloat(item.Precio || 22000);
            
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

            try {
                const compLunchObj = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
                if (compLunchObj && Array.isArray(compLunchObj.lista)) {
                    compLunchObj.lista.forEach(version => {
                        if (version && Array.isArray(version.list)) {
                            const dateStr = version.date || compLunchObj.fecha?.fecha || compLunchObj.fechasSeleccionadas?.[0];
                            if (dateStr) {
                                const parsedDate = parseDateYearAndMonth(dateStr);
                                if (parsedDate && parsedDate.year === selectedYear) {
                                    const qty = version.list.length;
                                    cantidadVendida += qty;

                                    const val = qty * precioVenta;
                                    const cost = recetaValor * qty;
                                    const util = val - cost;

                                    const mIdx = parsedDate.month;
                                    if (mIdx >= 0 && mIdx < 12) {
                                        monthlyTrend[mIdx].cantidad += qty;
                                        monthlyTrend[mIdx].ingreso += val;
                                        monthlyTrend[mIdx].costo += cost;
                                        monthlyTrend[mIdx].utilidad += util;
                                    }
                                }
                            }
                        }
                    });
                }
            } catch (e) {}

            const protein = getProteinType(item.NombreES);
            const ingresoVenta = cantidadVendida * precioVenta;
            const costoTotal = recetaValor * cantidadVendida;
            const utilidad = ingresoVenta - costoTotal;

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

        doc.save(`analisis_almuerzos_${monthsNames[selectedMonth].toLowerCase()}_${selectedYear}.pdf`);
    };

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
                                        <th className="py-3 px-4 font-bold text-slate-500 text-center">Gestión / Enlaces</th>
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
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {item.originalItem?.Receta ? (
                                                            <button 
                                                                onClick={() => navigate(`/receta/${item.originalItem.Receta}`)}
                                                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-all"
                                                                title="Ir a la Receta de este almuerzo"
                                                            >
                                                                <BookOpen size={10} /> Receta
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-bold px-2.5">Sin Receta</span>
                                                        )}
                                                        <button 
                                                            onClick={() => { setLunchToEdit(item.originalItem); setIsLunchModalOpen(true); }}
                                                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition-all"
                                                            title="Editar componentes en el Creador"
                                                        >
                                                            <Edit size={10} /> Creador
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {lunchStats.stats.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center py-10 text-slate-400">
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
                                        <th className="py-3 px-4 font-bold text-slate-500 text-center">Gestión / Enlaces</th>
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
                                                            <span className="text-[10px] text-slate-400 font-bold px-2.5">Sin Receta</span>
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
            ) : (
                // --- VISTA ANUAL Y GRÁFICOS DE TENDENCIAS ---
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
                        {/* Top 8 Almuerzos */}
                        <div className="bg-white p-5 rounded-2xl border shadow-sm">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-amber-600" /> Top 8 Menús Más Vendidos
                            </h3>
                            <div className="space-y-3">
                                {annualStats.topMenus.map((m, idx) => {
                                    const percentWidth = (m.cantidad / maxTopLunchQty) * 100;
                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="w-5 text-xs font-bold text-slate-400 text-right">{idx + 1}.</span>
                                            <span className="w-1/3 text-xs font-bold text-slate-700 truncate">{m.nombre}</span>
                                            <div className="flex-grow bg-slate-100 h-5 rounded overflow-hidden flex items-center">
                                                <div 
                                                    style={{ width: `${percentWidth}%` }} 
                                                    className="h-full bg-amber-400/80 hover:bg-amber-400 rounded-r transition-all"
                                                ></div>
                                            </div>
                                            <span className="w-16 text-xs font-black text-slate-600 text-right">{m.cantidad} platos</span>
                                        </div>
                                    );
                                })}
                                {annualStats.topMenus.length === 0 && (
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
            )}

            {/* Modal Unificado del Creador de Almuerzos */}
            <LunchModal
                isOpen={isLunchModalOpen}
                onClose={() => { setIsLunchModalOpen(false); setLunchToEdit(null); }}
                onSave={handleSaveLunch}
                productToEdit={lunchToEdit}
            />
        </div>
    );
};

export default AnalisisAlmuerzo;
