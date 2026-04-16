import React, { useState } from 'react';
import { Copy, Check, FileText, Share2, X } from 'lucide-react';

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

            text += `### DETALLE DE COSTOS\n`;
            text += `- **Compras:** ${data.costs.compras.toLocaleString('es-CO')}\n`;
            text += `- **Personal:** ${data.costs.personal.toLocaleString('es-CO')}\n`;
            text += `- **Fijos:** ${data.costs.fijos.toLocaleString('es-CO')}\n`;
            text += `- **Impuestos:** ${data.costs.impuestos.toLocaleString('es-CO')}\n`;
            text += `- **Otros:** ${data.costs.otros.toLocaleString('es-CO')}\n`;
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
                    Copiar Informe
                </span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
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
                        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Formato Markdown optimizado para chats y documentos.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`px-8 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    {copied ? (
                                        <>
                                            <Check size={18} />
                                            ¡Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={18} />
                                            Copiar Portapapeles
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportCopyButton;
