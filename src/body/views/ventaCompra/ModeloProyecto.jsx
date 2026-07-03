import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModelsAction, getAllFromTable, deleteModelAction } from '../../../redux/actions';
import { VENTAS, COMPRAS } from '../../../redux/actions-types';
import ModeloContent from './ModeloContent';
import { jsPDF } from 'jspdf';

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const ModeloProyecto = () => {
    const dispatch = useDispatch();

    // Consumimos el estado de Redux
    const models = useSelector(state => state.models);
    const allVentas = useSelector(state => state.allVentas);
    const allCompras = useSelector(state => state.allCompras || []);
    const loading = useSelector(state => state.modelsLoading);

    // Estado Local: Fecha seleccionada
    const { year: paramYear, month: paramMonth } = useParams();
    const navigate = useNavigate();
    const monthCols = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    // Estado Local: Fecha seleccionada (inicializada con URL o fecha actual)
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return {
            month: now.getMonth(),
            year: now.getFullYear()
        };
    });

    // Estados para descarga masiva
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState([]); // Array de { year, monthIndex }

    // Sincronizar URL con estado
    useEffect(() => {
        if (paramYear && paramMonth) {
            const monthIndex = monthCols.indexOf(paramMonth.toUpperCase());
            if (monthIndex !== -1) {
                setSelectedDate({ month: monthIndex, year: parseInt(paramYear) });
            }
        }
    }, [paramYear, paramMonth]);

    const handleNavigate = (y, mIndex) => {
        const mName = monthCols[mIndex];
        navigate(`/ModeloProyecto/${y}/${mName}`);
    };

    const handleMonthClick = (year, monthIndex) => {
        if (isBulkMode) {
            const isAlreadySelected = selectedMonths.some(sm => sm.year === year && sm.monthIndex === monthIndex);
            if (isAlreadySelected) {
                setSelectedMonths(selectedMonths.filter(sm => !(sm.year === year && sm.monthIndex === monthIndex)));
            } else {
                setSelectedMonths([...selectedMonths, { year, monthIndex }]);
            }
        } else {
            handleNavigate(year, monthIndex);
        }
    };

    useEffect(() => {
        dispatch(fetchModelsAction());
        dispatch(getAllFromTable(VENTAS));
        dispatch(getAllFromTable(COMPRAS));
    }, [dispatch]);

    // --- LÓGICA DE MATRIZ: Calcular Años Disponibles ---
    const years = useMemo(() => {
        const uniqueYears = new Set();
        const currentYear = new Date().getFullYear();
        uniqueYears.add(currentYear);

        // 1. Buscar años en las VENTAS (Formato MM/DD/AAAA)
        if (allVentas && Array.isArray(allVentas)) {
            allVentas.forEach(v => {
                if (v.Date) {
                    const parts = v.Date.split('/');
                    if (parts.length === 3) {
                        const y = parseInt(parts[2]);
                        if (!isNaN(y)) uniqueYears.add(y);
                    }
                }
            });
        }

        // 2. Buscar años en los MODELOS
        if (models && Array.isArray(models)) {
            models.forEach(m => {
                if (m.costs?.linkedYear) uniqueYears.add(parseInt(m.costs.linkedYear));
            });
        }

        return Array.from(uniqueYears).sort((a, b) => b - a);
    }, [allVentas, models]);

    const handleDeleteModel = async (e, modelId, modelName) => {
        e.stopPropagation();
        if (window.confirm(`¿Eliminar hoja de costos de "${modelName}"?`)) {
            dispatch(deleteModelAction(modelId));
        }
    };

    const handleDownloadBulk = (type = 'pdf') => {
        if (selectedMonths.length === 0) {
            alert("Por favor, selecciona al menos un mes.");
            return;
        }

        // Ordenar los meses seleccionados cronológicamente
        const sortedSelected = [...selectedMonths].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthIndex - b.monthIndex;
        });

        let markdownText = `# INFORME CONTABLE COMPILADO\n`;
        markdownText += `Generado el: ${new Date().toLocaleString()}\n`;
        markdownText += `Meses incluidos: ${sortedSelected.map(sm => `${monthsNames[sm.monthIndex]} ${sm.year}`).join(', ')}\n\n`;
        markdownText += `========================================================================\n\n`;

        sortedSelected.forEach(({ year, monthIndex }) => {
            // 1. Filtrar ventas reales
            const ventasMes = allVentas.filter((venta) => {
                if (!venta || !venta.Date) return false;
                const ventaDate = new Date(venta.Date);
                return ventaDate.getMonth() === monthIndex && ventaDate.getFullYear() === year;
            });

            let totalIngreso = 0;
            let totalTip = 0;
            let tarjeta = 0;
            let efectivo = 0;
            let transferencia = 0;

            ventasMes.forEach((venta) => {
                if (venta.Pagado) {
                    const ingresoVenta = parseFloat(venta.Total_Ingreso || 0);
                    totalIngreso += ingresoVenta;
                    totalTip += parseFloat(venta.Tip || 0);

                    if (venta.Pago_Info) {
                        try {
                            const pagos = JSON.parse(venta.Pago_Info);
                            if (pagos.metodo === "Tarjeta") tarjeta += ingresoVenta;
                            if (pagos.metodo === "Efectivo") efectivo += ingresoVenta;
                            if (pagos.metodo === "Transferencia") transferencia += ingresoVenta;
                        } catch (e) {}
                    }
                }
            });

            // 2. Filtrar compras reales
            const comprasMes = allCompras.filter((compra) => {
                const compraDate = new Date(compra.Date);
                const dLocal = new Date(compraDate.valueOf() + compraDate.getTimezoneOffset() * 60000);
                return dLocal.getMonth() === monthIndex && dLocal.getFullYear() === year;
            });
            const totalComprasReales = comprasMes.reduce((acc, compra) => acc + parseFloat(compra.Valor || compra.Total || 0), 0);

            // 3. Cargar modelo contable guardado
            const savedModel = models.find(m => {
                const mMonth = m.costs?.linkedMonth !== undefined ? m.costs.linkedMonth : m.month;
                const mYear = m.costs?.linkedYear !== undefined ? m.costs.linkedYear : m.year;
                return (mMonth == monthIndex && mYear == year) || m.name === `Contabilidad ${monthsNames[monthIndex]} ${year}`;
            });

            let costs = { compras: totalComprasReales, personal: 0, fijos: 0, impuestos: totalIngreso * 0.08, otros: 0 };
            if (savedModel && savedModel.costs) {
                try {
                    const costsData = typeof savedModel.costs === 'string' ? JSON.parse(savedModel.costs) : savedModel.costs;
                    
                    const calculateTotal = (items, type) => {
                        if (!items) return 0;
                        if (type === 'impuestos') {
                            return items.reduce((acc, item) => {
                                const val = item.type === 'percentage' ? (totalIngreso * (item.rate || 0) / 100) : (item.isAnnual ? (item.value || 0) / 12 : (item.value || 0));
                                return acc + val;
                            }, 0);
                        }
                        if (type === 'personal') {
                            return items.reduce((acc, item) => {
                                const val = item.totalValue !== undefined ? item.totalValue : ((item.weeklyHours || 0) * (item.hourlyRate || 0) * 4.33);
                                return acc + val;
                            }, 0);
                        }
                        return items.reduce((acc, item) => acc + Number(item.value || 0), 0);
                    };

                    costs.compras = calculateTotal(costsData.compras) || totalComprasReales;
                    costs.personal = calculateTotal(costsData.personal, 'personal');
                    costs.fijos = calculateTotal(costsData.fijos);
                    costs.impuestos = calculateTotal(costsData.impuestos || (costsData.impuesto ? JSON.parse(costsData.impuesto).impuestos : []), 'impuestos') || (totalIngreso * 0.08);
                    costs.otros = calculateTotal(costsData.otros);
                } catch (e) {
                    console.error("Error al procesar costos del mes para la descarga masiva", e);
                }
            }

            const totalCostos = costs.compras + costs.personal + costs.fijos + costs.impuestos + costs.otros;
            const utilidadNeta = totalIngreso - totalCostos;
            const margen = totalIngreso > 0 ? (utilidadNeta / totalIngreso) * 100 : 0;

            markdownText += `## ${monthsNames[monthIndex].toUpperCase()} ${year}\n`;
            markdownText += `### Resumen Financiero\n`;
            markdownText += `- **Ingresos Totales:** ${totalIngreso.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}\n`;
            markdownText += `- **Efectivo:** ${efectivo.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}\n`;
            markdownText += `- **Tarjeta:** ${tarjeta.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}\n`;
            markdownText += `- **Transferencia:** ${transferencia.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}\n`;
            markdownText += `- **Costos Totales:** ${totalCostos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}\n`;
            markdownText += `- **Utilidad Neta:** ${utilidadNeta.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}\n`;
            markdownText += `- **Margen de Utilidad:** ${margen.toFixed(1)}%\n\n`;

            markdownText += `### Detalle de Costos y Egresos\n`;
            markdownText += `| Categoría | Valor |\n`;
            markdownText += `| :--- | :--- |\n`;
            markdownText += `| Compras / Insumos | ${costs.compras.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} |\n`;
            markdownText += `| Personal / Nómina | ${costs.personal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} |\n`;
            markdownText += `| Costos Fijos | ${costs.fijos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} |\n`;
            markdownText += `| Impuestos | ${costs.impuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} |\n`;
            markdownText += `| Otros Costos | ${costs.otros.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} |\n`;
            markdownText += `\n---\n\n`;
        });

        if (type === 'md') {
            const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `informe_compilado_${sortedSelected.length}_meses.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            const doc = new jsPDF();
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(markdownText, 180);
            doc.text(lines, 15, 15);
            doc.save(`informe_compilado_${sortedSelected.length}_meses.pdf`);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen w-screen text-gray-500">Cargando datos...</div>;

    return (
        <div className="flex flex-col h-screen w-full bg-gray-100 overflow-hidden m-0 p-0">

            {/* --- HEADER & GRID DE NAVEGACIÓN --- */}
            <div className="bg-slate-900 text-white shadow-xl z-50 flex-shrink-0 w-full p-2">
                <div className="w-full overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navegador Contable</h2>
                            <button
                                onClick={() => {
                                    setIsBulkMode(!isBulkMode);
                                    setSelectedMonths([]);
                                }}
                                className={`px-3 py-1 text-xs rounded font-bold border transition ${isBulkMode ? 'bg-amber-550 text-white border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                            >
                                {isBulkMode ? 'Cancelar Selección Múltiple' : 'Selección Múltiple (Descarga Masiva)'}
                            </button>
                        </div>
                        {isBulkMode && selectedMonths.length > 0 && (
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-xs text-amber-400 font-bold">{selectedMonths.length} seleccionados</span>
                                <button
                                    onClick={() => handleDownloadBulk('pdf')}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded font-bold transition"
                                >
                                    📥 Descargar PDF
                                </button>
                                <button
                                    onClick={() => handleDownloadBulk('md')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded font-bold transition"
                                >
                                    📥 Descargar MD
                                </button>
                            </div>
                        )}
                    </div>

                    {years.map(year => (
                        <div key={year} className="flex w-full mb-1 last:mb-0 border-b border-slate-800 pb-1">
                            <div className="w-16 flex-shrink-0 flex items-center justify-center font-bold text-lg bg-slate-800 text-blue-400 rounded-l border-r border-slate-700">
                                {year}
                            </div>

                            <div className="flex-grow grid grid-cols-12 gap-px bg-slate-700 rounded-r overflow-hidden">
                                {monthCols.map((monthName, monthIndex) => {
                                    // Modelo guardado
                                    const savedModel = models.find(m => {
                                        if (parseInt(m.costs?.linkedYear) === year && parseInt(m.costs?.linkedMonth) === monthIndex) return true;
                                        if (m.year == year && m.month == monthIndex) return true;
                                        if (m.name === `Contabilidad ${monthsNames[monthIndex]} ${year}`) return true;
                                        return false;
                                    });

                                    // Ventas reales
                                    const hasSales = allVentas && allVentas.some(v => {
                                        if (!v || !v.Date) return false;
                                        const ventaDate = new Date(v.Date);
                                        if (isNaN(ventaDate.getTime())) return false;
                                        return ventaDate.getMonth() === monthIndex && ventaDate.getFullYear() === year;
                                    });

                                    const isSelected = selectedDate.month === monthIndex && selectedDate.year === year;
                                    const isBulkSelected = selectedMonths.some(sm => sm.year === year && sm.monthIndex === monthIndex);

                                    return (
                                        <button
                                            key={monthIndex}
                                            onClick={() => handleMonthClick(year, monthIndex)}
                                            className={`
                                                relative h-10 flex flex-col items-center justify-center text-[10px] transition-all
                                                ${isBulkSelected
                                                    ? 'bg-amber-600 text-white font-bold border-2 border-amber-300 shadow-inner'
                                                    : (isSelected
                                                        ? 'bg-blue-600 text-white font-bold shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]'
                                                        : (savedModel
                                                            ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'))
                                                }
                                            `}
                                        >
                                            <span className="uppercase tracking-wide">
                                                {isBulkSelected ? '✓ ' : ''}{monthName}
                                            </span>

                                            <div className="flex gap-1 mt-0.5">
                                                {savedModel && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm" title="Modelo Guardado"></span>}
                                                {hasSales && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm" title="Hay Ventas"></span>}
                                            </div>

                                            {savedModel && isSelected && !isBulkMode && (
                                                <div
                                                    onClick={(e) => handleDeleteModel(e, savedModel._id, savedModel.name)}
                                                    className="absolute top-0 right-0 p-1 hover:text-red-400 text-slate-300 cursor-pointer font-sans font-bold"
                                                >
                                                    ×
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- VISTA DE CONTENIDO --- */}
            <div className="flex-grow overflow-hidden w-screen h-screen bg-gray-50">
                <ModeloContent
                    targetMonth={selectedDate.month}
                    targetYear={selectedDate.year}
                />
            </div>
        </div>
    );
};

export default ModeloProyecto;