import { jsPDF } from 'jspdf';

const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Parseador de fechas ultra seguro y libre de desfases de zonas horarias
export const parseDateYearAndMonth = (dateStr) => {
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
export const getProteinType = (item) => {
    try {
        const comp = typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch;
        if (comp?.proteina_clasificacion) return comp.proteina_clasificacion;
    } catch(e) {}

    const name = item?.NombreES || "";
    const n = name.toUpperCase();
    if (n.includes('POLLO') || n.includes('CHICKEN') || n.includes('MILANESA')) return 'POLLO';
    if (n.includes('CERDO') || n.includes('COSTILLA') || n.includes('CAÑON') || n.includes('CAÑÓN') || n.includes('LECHONA') || n.includes('TOCINETA')) return 'CERDO';
    if (n.includes('RES') || n.includes('CARNE') || n.includes('GOULASH') || n.includes('LOMO') || n.includes('BIFE') || n.includes('ASADO') || n.includes('PECHO') || n.includes('ALBONDIGAS') || n.includes('ALBÓNDIGAS')) return 'RES';
    if (n.includes('PESCADO') || n.includes('SALMON') || n.includes('SALMÓN') || n.includes('TRUCHA') || n.includes('MOJARRA') || n.includes('ATUN') || n.includes('ATÚN') || n.includes('BAGRE')) return 'PESCADO';
    if (n.includes('VEGETARIANO') || n.includes('VEGANO') || n.includes('VEGGIE') || n.includes('LENTEJA') || n.includes('GARBANZO') || n.includes('SOYA') || n.includes('TOFU')) return 'VEGETARIANO';
    return 'OTROS';
};

export const handleDownloadPDF = (selectedMonth, selectedYear, lunchStats, groupedStats) => {
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
