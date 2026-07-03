import React, { useState } from 'react';
import { Copy, Check, FileText, Share2, X, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const ReportCopyButton = ({ title, data, type }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateMarkdown = () => {
        let text = `# INFORME: ${title.toUpperCase()}\n`;
        text += `Generado el: ${new Date().toLocaleString()}\n\n`;

        if (type === 'financial-audit') {
            text += `| Producto | Costo | Precio | Margen |\n`;
            text += `| :--- | :--- | :--- | :--- |\n`;
            data.forEach(item => {
                text += `| ${item.nombre} | ${item.costo.toLocaleString('es-CO')} | ${item.precioVenta.toLocaleString('es-CO')} | ${item.margin.toFixed(1)}% |\n`;
            });
        } 
        else if (type === 'model-content') {
            text += `## RESUMEN FINANCIERO\n`;
            text += `- **Ingresos Totales:** ${data.income.toLocaleString('es-CO')}\n`;
            text += `- **Costos Totales:** ${data.costs.total.toLocaleString('es-CO')}\n`;
            text += `- **Utilidad Neta:** ${data.utility.toLocaleString('es-CO')}\n`;
            text += `- **Margen:** ${data.margin.toFixed(1)}%\n\n`;

            if (data.stats) {
                text += `## RESUMEN DEL MES (OPERATIVO)\n`;
                text += `- **Promedio Diario:** ${data.stats.promedioDiario.toLocaleString('es-CO')}\n`;
                text += `- **Ventas en Efectivo:** ${data.stats.efectivo.toLocaleString('es-CO')}\n`;
                text += `- **Ventas con Tarjeta:** ${data.stats.tarjeta.toLocaleString('es-CO')}\n`;
                text += `- **Transferencias:** ${data.stats.transferencia.toLocaleString('es-CO')}\n`;
                text += `- **Compras Reales:** ${data.stats.comprasReales.toLocaleString('es-CO')}\n`;
                text += `- **Propinas:** ${data.stats.propina.toLocaleString('es-CO')}\n\n`;
            }

            if (data.productos && data.productos.length > 0) {
                text += `## PRODUCTOS VENDIDOS\n`;
                text += `| Producto | Cantidad | Costo Unitario | Ingreso Total | Costo Total | Ganancia | Margen |\n`;
                text += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
                data.productos.forEach(p => {
                    const costoUnit = p.recetaValor || 0;
                    const ganancia = p.totalUtilidad || 0;
                    const margenProd = p.totalIngreso > 0 ? (ganancia / p.totalIngreso) * 100 : 0;
                    text += `| ${p.nombre} | ${p.cantidad} | ${costoUnit.toLocaleString('es-CO')} | ${p.totalIngreso.toLocaleString('es-CO')} | ${p.totalCosto.toLocaleString('es-CO')} | ${ganancia.toLocaleString('es-CO')} | ${margenProd.toFixed(1)}% |\n`;
                });
                text += `\n`;
            }

            text += `### DETALLE DE COSTOS\n`;
            text += `- **Compras:** ${data.costs.compras.toLocaleString('es-CO')}\n`;
            text += `- **Personal:** ${data.costs.personal.toLocaleString('es-CO')}\n`;
            text += `- **Fijos:** ${data.costs.fijos.toLocaleString('es-CO')}\n`;
            text += `- **Impuestos:** ${data.costs.impuestos.toLocaleString('es-CO')}\n`;
            text += `- **Otros:** ${data.costs.otros.toLocaleString('es-CO')}\n`;
        }
        else if (type === 'gastos-materiales') {
            const total = data.reduce((acc, curr) => acc + curr.totalCost, 0);
            text += `## EXPLOSIÓN DE INSUMOS\n`;
            text += `- **Total Ingredientes Diferentes:** ${data.length}\n`;
            text += `- **Costo Estimado Global:** ${total.toLocaleString('es-CO')}\n\n`;

            text += `### DESGLOSE DE MATERIALES\n`;
            text += `| Ingrediente | Cantidad Total | Unidad | Costo Estimado |\n`;
            text += `| :--- | :--- | :--- | :--- |\n`;
            data.forEach(item => {
                text += `| ${item.name} | ${item.totalQuantity.toLocaleString('es-CO', {maximumFractionDigits: 2})} | ${item.unit} | ${item.totalCost > 0 ? item.totalCost.toLocaleString('es-CO') : '0'} |\n`;
            });
        }
        else if (type === 'generic') {
            text += `${data}\n`;
        }

        return text;
    };

    const handleCopy = () => {
        const text = generateMarkdown();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDownloadMD = () => {
        const text = generateMarkdown();
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const text = generateMarkdown();
        
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 15, 15);
        
        doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[100] p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 group flex items-center gap-2"
                title="Generar Informe para Copiar"
            >
                <Share2 size={24} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap">
                    Exportar / Copiar
                </span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3 text-slate-800">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <h3 className="font-bold text-lg">Informe de {title}</h3>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal content - Preview */}
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 font-mono text-xs">
                            <pre className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm whitespace-pre-wrap text-slate-700 leading-relaxed">
                                {generateMarkdown()}
                            </pre>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 flex flex-col gap-4">
                            <p className="text-sm text-slate-500 font-medium">
                                💡 Para usar en NotebookLM o ChatGPT, se recomienda descargar el archivo <span className="font-bold text-slate-800">Markdown (.md)</span>.
                            </p>
                            <div className="flex flex-wrap gap-3 items-center justify-between w-full">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Cerrar
                                </button>
                                
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    >
                                        <Download size={16} />
                                        PDF
                                    </button>

                                    <button
                                        onClick={handleDownloadMD}
                                        className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                                    >
                                        <Download size={16} />
                                        MD (LLM)
                                    </button>

                                    <button
                                        onClick={handleCopy}
                                        className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={18} />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={18} />
                                                Copiar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportCopyButton;
