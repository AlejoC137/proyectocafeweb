import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModelsAction, getAllFromTable, deleteModelAction } from '../../../redux/actions';
import { VENTAS, COMPRAS, MENU, ITEMS, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';
import ModeloContent from './ModeloContent';
import { jsPDF } from 'jspdf';

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Carga dinámica de JSZip desde CDN para evitar problemas de instalación local de npm
const loadJSZip = () => {
    return new Promise((resolve) => {
        if (window.JSZip) {
            resolve(window.JSZip);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        document.head.appendChild(script);
    });
};

const ModeloProyecto = () => {
    const dispatch = useDispatch();

    // Consumimos el estado de Redux
    const models = useSelector(state => state.models);
    const allVentas = useSelector(state => state.allVentas);
    const allCompras = useSelector(state => state.allCompras || []);
    const allMenu = useSelector(state => state.allMenu || []);
    const allItems = useSelector(state => state.allItems || []);
    const allProduccion = useSelector(state => state.allProduccion || []);
    const allRecetasMenu = useSelector(state => state.allRecetasMenu || []);
    const allRecetasProduccion = useSelector(state => state.allRecetasProduccion || []);
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
    const [zipping, setZipping] = useState(false);

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
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(ITEMS));
        dispatch(getAllFromTable(PRODUCCION));
        dispatch(getAllFromTable(RECETAS_MENU));
        dispatch(getAllFromTable(RECETAS_PRODUCCION));
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

    // Generar reporte ultra detallado para un mes en formato de texto Markdown
    const generateDetailedReport = (year, monthIndex) => {
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
        const productosMap = {};

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

            if (venta.Productos) {
                try {
                    const productos = JSON.parse(venta.Productos);
                    productos.forEach((producto) => {
                        if (!producto.NombreES) return;
                        const cantidad = parseFloat(producto.quantity || 0);

                        let price = parseFloat(producto.price || producto.valor || producto.precio || 0);
                        if (price === 0) {
                            const menuProduct = allMenu.find(m => m.NombreES === producto.NombreES);
                            if (menuProduct) {
                                price = parseFloat(menuProduct.Precio || 0);
                            }
                        }

                        if (productosMap[producto.NombreES]) {
                            productosMap[producto.NombreES].cantidad += cantidad;
                            productosMap[producto.NombreES].totalIngreso += (price * cantidad);
                        } else {
                            let recetaIdDefinitiva = producto.Receta || allMenu.find(menu => menu.NombreES === producto.NombreES)?.Receta || "N/A";

                            productosMap[producto.NombreES] = {
                                nombre: producto.NombreES,
                                cantidad: cantidad,
                                totalIngreso: (price * cantidad),
                                recetaId: recetaIdDefinitiva,
                                recetaValor: 0,
                                totalCosto: 0,
                                totalUtilidad: 0
                            };
                        }
                    });
                } catch (e) {}
            }
        });

        const productosVendidos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);

        // Calcular costo de recetas para cada producto vendido
        const productosVendidosConReceta = productosVendidos.map((producto) => {
            let consolidatedCost = 0;
            if (producto.recetaId !== "N/A") {
                const menuItem = allMenu.find((item) => item.Receta === producto.recetaId);
                if (menuItem) {
                    const recetaData = allRecetasMenu.find(r => r._id === menuItem.Receta) || allRecetasProduccion.find(r => r._id === menuItem.Receta);
                    if (recetaData && recetaData.costo) {
                        try {
                            const costData = typeof recetaData.costo === 'string' ? JSON.parse(recetaData.costo) : recetaData.costo;
                            if (typeof costData === 'number') {
                                consolidatedCost = costData;
                            } else if (costData) {
                                consolidatedCost = (Number(costData.vCMP) || 0) + (Number(costData.vCMO) || 0);
                            }
                        } catch (e) {}
                    }
                }
            }

            const totalCosto = consolidatedCost * producto.cantidad;
            return {
                ...producto,
                recetaValor: consolidatedCost,
                totalCosto: totalCosto,
                totalUtilidad: producto.totalIngreso - totalCosto
            };
        });

        // Filtrar compras del mes
        const comprasMes = allCompras.filter((compra) => {
            const compraDate = new Date(compra.Date);
            const dLocal = new Date(compraDate.valueOf() + compraDate.getTimezoneOffset() * 60000);
            return dLocal.getMonth() === monthIndex && dLocal.getFullYear() === year;
        });
        const totalComprasReales = comprasMes.reduce((acc, compra) => acc + parseFloat(compra.Valor || compra.Total || 0), 0);

        // Cargar modelo contable guardado
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
            } catch (e) {}
        }

        const totalCostos = costs.compras + costs.personal + costs.fijos + costs.impuestos + costs.otros;
        const utilidadNeta = totalIngreso - totalCostos;
        const margen = totalIngreso > 0 ? (utilidadNeta / totalIngreso) * 100 : 0;
        const promedioDiario = ventasMes.length > 0 ? totalIngreso / (new Set(ventasMes.map(v => v.Date))).size : 0;

        // Construir Markdown exacto al de descarga mensual individual
        let text = `# INFORME CONTABLE DE ${monthsNames[monthIndex].toUpperCase()} ${year}\n`;
        text += `Generado el: ${new Date().toLocaleString()}\n\n`;
        text += `## RESUMEN FINANCIERO\n`;
        text += `- **Ingresos Totales:** ${totalIngreso.toLocaleString('es-CO')}\n`;
        text += `- **Costos Totales:** ${totalCostos.toLocaleString('es-CO')}\n`;
        text += `- **Utilidad Neta:** ${utilidadNeta.toLocaleString('es-CO')}\n`;
        text += `- **Margen:** ${margen.toFixed(1)}%\n\n`;

        text += `## RESUMEN DEL MES (OPERATIVO)\n`;
        text += `- **Promedio Diario:** ${promedioDiario.toLocaleString('es-CO')}\n`;
        text += `- **Ventas en Efectivo:** ${efectivo.toLocaleString('es-CO')}\n`;
        text += `- **Ventas con Tarjeta:** ${tarjeta.toLocaleString('es-CO')}\n`;
        text += `- **Transferencias:** ${transferencia.toLocaleString('es-CO')}\n`;
        text += `- **Compras Reales:** ${totalComprasReales.toLocaleString('es-CO')}\n`;
        text += `- **Propinas:** ${totalTip.toLocaleString('es-CO')}\n\n`;

        if (productosVendidosConReceta.length > 0) {
            text += `## PRODUCTOS VENDIDOS\n`;
            text += `| Producto | Cantidad | Costo Unitario | Ingreso Total | Costo Total | Ganancia | Margen |\n`;
            text += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            productosVendidosConReceta.forEach(p => {
                const costoUnit = p.recetaValor || 0;
                const ganancia = p.totalUtilidad || 0;
                const margenProd = p.totalIngreso > 0 ? (ganancia / p.totalIngreso) * 100 : 0;
                text += `| ${p.nombre} | ${p.cantidad} | ${costoUnit.toLocaleString('es-CO')} | ${p.totalIngreso.toLocaleString('es-CO')} | ${p.totalCosto.toLocaleString('es-CO')} | ${ganancia.toLocaleString('es-CO')} | ${margenProd.toFixed(1)}% |\n`;
            });
            text += `\n`;
        }

        text += `### DETALLE DE COSTOS\n`;
        text += `- **Compras:** ${costs.compras.toLocaleString('es-CO')}\n`;
        text += `- **Personal:** ${costs.personal.toLocaleString('es-CO')}\n`;
        text += `- **Fijos:** ${costs.fijos.toLocaleString('es-CO')}\n`;
        text += `- **Impuestos:** ${costs.impuestos.toLocaleString('es-CO')}\n`;
        text += `- **Otros:** ${costs.otros.toLocaleString('es-CO')}\n`;

        return text;
    };

    const handleDownloadBulk = async (type = 'pdf') => {
        if (selectedMonths.length === 0) {
            alert("Por favor, selecciona al menos un mes.");
            return;
        }

        setZipping(true);
        try {
            const jszip = await loadJSZip();
            const zip = new jszip();

            selectedMonths.forEach(({ year, monthIndex }) => {
                const reportContent = generateDetailedReport(year, monthIndex);
                const fileNameBase = `informe_${monthsNames[monthIndex].toLowerCase()}_${year}`;

                if (type === 'md') {
                    // Agregar archivo markdown al ZIP
                    zip.file(`${fileNameBase}.md`, reportContent);
                } else {
                    // Generar PDF y cargarlo en formato binario al ZIP
                    const doc = new jsPDF();
                    doc.setFontSize(9);
                    const lines = doc.splitTextToSize(reportContent, 180);
                    doc.text(lines, 15, 15);
                    const pdfBuffer = doc.output('arraybuffer');
                    zip.file(`${fileNameBase}.pdf`, pdfBuffer);
                }
            });

            // Generar archivo ZIP y descargarlo
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `informes_contables_${selectedMonths.length}_meses.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al generar el archivo ZIP:", error);
            alert("Ocurrió un error al empaquetar los informes.");
        } finally {
            setZipping(false);
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
                                className={`px-3 py-1 text-xs rounded font-bold border transition ${isBulkMode ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                            >
                                {isBulkMode ? 'Cancelar Selección Múltiple' : 'Selección Múltiple (Descarga Masiva)'}
                            </button>
                        </div>
                        {isBulkMode && selectedMonths.length > 0 && (
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-xs text-amber-400 font-bold">{selectedMonths.length} seleccionados</span>
                                <button
                                    onClick={() => handleDownloadBulk('pdf')}
                                    disabled={zipping}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded font-bold transition disabled:opacity-50"
                                >
                                    {zipping ? 'Generando ZIP...' : '📥 Descargar ZIP (PDF)'}
                                </button>
                                <button
                                    onClick={() => handleDownloadBulk('md')}
                                    disabled={zipping}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded font-bold transition disabled:opacity-50"
                                >
                                    {zipping ? 'Generando ZIP...' : '📥 Descargar ZIP (MD)'}
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