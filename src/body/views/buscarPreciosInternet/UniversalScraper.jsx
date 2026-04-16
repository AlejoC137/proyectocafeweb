import React, { useState, useEffect } from 'react';
import { Search, Globe, FileText, Download, Play, Settings, Database, CheckCircle2, AlertCircle, Loader2, ChevronRight, Copy, Terminal, Trash2, Cpu, ListChecks, ArrowRightCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as cheerio from 'cheerio';

const PRESETS = [
    { name: 'SuperMu', url: 'https://supermu.com/collections/carnes-pollo-y-pescado-1', item: '.product-card', title: 'a[href*="/products/"]:not(.absolute-stretch)', price: '.price', desc: '.product-card__info' },
    { name: 'Éxito', url: 'https://www.exito.com', item: 'article', title: 'h3', price: '.price-tag', desc: '.product-description' },
    { name: 'Universal', url: '', item: '.product, article, .item', title: 'h2, h3, .title', price: '.price, .amount', desc: '.desc, .summary' }
];

const UniversalScraper = ({ allItems }) => {
    const [urlList, setUrlList] = useState('');
    const [manualHtml, setManualHtml] = useState('');
    const [useManual, setUseManual] = useState(false);
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [results, setResults] = useState([]);
    const [showConfig, setShowConfig] = useState(false);
    const [currentProgress, setCurrentProgress] = useState({ url: '', page: 0 });

    const [config, setConfig] = useState({
        itemSelector: '.product-card',
        nameSelector: 'a[href*="/products/"]:not(.absolute-stretch)',
        priceSelector: '.price',
        descSelector: '.product-card__info',
        autoPage: true,
        maxPages: 20,
        delay: 800
    });

    const addLog = (message, type = 'info') => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setLogs(prev => [{ id, message, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    };

    const applyPreset = (preset) => {
        setConfig({
            ...config,
            itemSelector: preset.item,
            nameSelector: preset.title,
            priceSelector: preset.price,
            descSelector: preset.desc
        });
        setUrlList(prev => prev ? prev + '\n' + preset.url : preset.url);
        addLog(`Plantilla '${preset.name}' cargada`, 'success');
    };

    const processHtml = (html, pageNum = 1) => {
        const $ = cheerio.load(html);
        const items = $(config.itemSelector);
        const data = [];
        
        items.each((idx, el) => {
            const name = $(el).find(config.nameSelector).first().text().trim();
            const price = $(el).find(config.priceSelector).first().text().trim();
            const desc = $(el).find(config.descSelector).first().text().trim();
            if (name) data.push({ name, price, desc, page: pageNum });
        });
        return data;
    };

    const startBulkScraping = async () => {
        if (!useManual && !urlList) {
            addLog('Ingresa al menos una URL', 'error');
            return;
        }

        setStatus('loading');
        setResults([]);
        setLogs([]);
        addLog(`Iniciando motor de extracción masiva...`, 'info');

        try {
            if (useManual) {
                const data = processHtml(manualHtml);
                setResults(data);
                addLog(`Procesados ${data.length} elementos manualmente`, 'success');
            } else {
                const urls = urlList.split('\n').map(u => u.trim()).filter(u => u);
                let allCollectedData = [];

                for (const baseUrl of urls) {
                    addLog(`>>> Procesando Colección: ${baseUrl}`, 'info');
                    let page = 1;
                    let hasMore = true;

                    while (hasMore && page <= config.maxPages) {
                        setCurrentProgress({ url: baseUrl, page });
                        const targetUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}`;
                        addLog(`Escaneando página ${page}...`, 'info');

                        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                        const response = await fetch(proxyUrl);
                        if (!response.ok) {
                            addLog(`Fin de colección o error en página ${page}`, 'warning');
                            break;
                        }

                        const html = await response.text();
                        const pageData = processHtml(html, page);

                        if (pageData.length === 0) {
                            addLog(`No se encontraron más productos. Fin de esta colección.`, 'success');
                            hasMore = false;
                        } else {
                            allCollectedData = [...allCollectedData, ...pageData];
                            addLog(`Encontrados ${pageData.length} productos en página ${page}`, 'success');
                            
                            if (!config.autoPage) break;
                            page++;
                            await new Promise(r => setTimeout(r, config.delay));
                        }
                    }
                }
                setResults(allCollectedData);
            }
            setStatus('success');
            addLog(`¡Extracción masiva completada! Total: ${allCollectedData?.length || results.length} productos.`, 'success');
        } catch (error) {
            setStatus('error');
            addLog(`Fallo: ${error.message}`, 'error');
        }
    };

    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        // Limpiamos caracteres no numéricos excepto punto y coma
        let clean = priceStr.replace(/[^\d.,]/g, '');
        
        // Lógica simple para COP: Si hay puntos, suelen ser separadores de miles
        // Si hay una coma al final con 2 dígitos, es decimal.
        if (clean.includes('.') && clean.includes(',')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.includes(',')) {
            clean = clean.replace(',', '.');
        } else if (clean.includes('.')) {
            // Si tiene 3 dígitos después del punto, probablemente es separador de miles
            const parts = clean.split('.');
            if (parts[parts.length - 1].length === 3) {
                clean = clean.replace(/\./g, '');
            }
        }
        return parseFloat(clean) || 0;
    };

    const generateMarkdown = () => {
        let md = `# Reporte Consolidado de Inteligencia de Mercado\n`;
        md += `**Fecha de Extracción:** ${new Date().toLocaleString()}\n`;
        md += `**Total de productos:** ${results.length}\n\n---\n\n`;

        results.forEach((item, i) => {
            md += `### ${i + 1}. ${item.name}\n`;
            if (item.price) md += `- **Precio:** ${item.price}\n`;
            if (item.desc) md += `- **Detalle:** ${item.desc}\n`;
            md += `\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `catalogo_completo_${new Date().getTime()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header / Hero */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800"
            >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                            <ListChecks size={14} /> Sistema Multi-Colección
                        </div>
                        <h1 className="text-5xl font-black leading-none tracking-tight">
                            Scraping de <span className="text-indigo-400 font-outline-2">Alto Rendimiento</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-lg">
                            Pega una lista de colecciones y deja que el sistema extraiga cada página automáticamente hasta el final.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {PRESETS.map(p => (
                            <button 
                                key={p.name}
                                onClick={() => applyPreset(p)}
                                className="px-6 py-4 rounded-3xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black transition-all hover:scale-105 active:scale-95 text-xs"
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel de Inputs */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-800 text-2xl tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <ArrowRightCircle />
                                </div>
                                Cola de URLs
                            </h3>
                            <button 
                                onClick={() => setShowConfig(!showConfig)}
                                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                <Settings size={14} className="inline mr-2" /> {showConfig ? 'Ocultar Config' : 'Ajustes'}
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Lista de Colecciones (Una por línea)</label>
                                <textarea 
                                    className="w-full h-48 p-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all text-slate-700 font-medium custom-scrollbar"
                                    value={urlList}
                                    onChange={(e) => setUrlList(e.target.value)}
                                    placeholder="https://supermu.com/collections/frutas-y-verduras..."
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={startBulkScraping}
                                    disabled={status === 'loading'}
                                    className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Play fill="white" />}
                                    {status === 'loading' ? 'Procesando Granel...' : 'Iniciar Extracción Masiva'}
                                </button>
                                {results.length > 0 && (
                                    <button 
                                        onClick={generateMarkdown}
                                        className="py-5 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-500/20 animate-pulse transition-all"
                                    >
                                        <Download />
                                    </button>
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {showConfig && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-50 overflow-hidden"
                                >
                                    {Object.entries(config).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</label>
                                            {typeof value === 'boolean' ? (
                                                <button 
                                                    onClick={() => setConfig({...config, [key]: !value})}
                                                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    {value ? 'Activado' : 'Desactivado'}
                                                </button>
                                            ) : (
                                                <input 
                                                    type={typeof value === 'number' ? 'number' : 'text'}
                                                    value={value}
                                                    onChange={(e) => setConfig({...config, [key]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-indigo-50 text-xs font-bold"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tabla de Resultados Maestra */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden min-h-[400px]">
                        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 text-xl tracking-tighter uppercase">Fila de Productos Actual ({results.length})</h3>
                            {status === 'loading' && (
                                <div className="text-[10px] font-black text-indigo-500 animate-bounce">
                                    Pág {currentProgress.page}...
                                </div>
                            )}
                        </div>
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            {results.length === 0 ? (
                                <div className="py-32 flex flex-col items-center opacity-10">
                                    <Database size={100} strokeWidth={0.5} />
                                    <p className="font-black uppercase tracking-[1em] mt-6 text-xs">Vacio</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-white/90 backdrop-blur sticky top-0">
                                        <tr>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Item</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Información</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {results.map((r, i) => {
                                            const foundItem = allItems?.find(item => 
                                                r.name.toLowerCase().includes(item.Nombre_del_producto.toLowerCase()) ||
                                                item.Nombre_del_producto.toLowerCase().includes(r.name.toLowerCase())
                                            );
                                            
                                            const currentPriceNum = parsePrice(r.price);
                                            const dbPriceNum = foundItem ? parseFloat(foundItem.COSTO) : null;
                                            
                                            let trend = null;
                                            if (dbPriceNum && currentPriceNum) {
                                                if (currentPriceNum > dbPriceNum) trend = 'up';
                                                else if (currentPriceNum < dbPriceNum) trend = 'down';
                                                else trend = 'same';
                                            }

                                            return (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-10 py-6 text-xs font-black text-slate-200">#{(i+1).toString().padStart(4, '0')}</td>
                                                    <td className="px-10 py-6">
                                                        <div className="text-sm font-black text-slate-700 line-clamp-1">{r.name}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Pág {r.page} {foundItem && <span className="text-indigo-400 ml-2">• Matcheado: {foundItem.Nombre_del_producto}</span>}</div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 ${
                                                                trend === 'up' ? 'bg-rose-50 text-rose-600' :
                                                                trend === 'down' ? 'bg-emerald-50 text-emerald-600' :
                                                                'bg-indigo-50 text-indigo-600'
                                                            }`}>
                                                                {r.price}
                                                                {trend === 'up' && <TrendingUp size={14} />}
                                                                {trend === 'down' && <TrendingDown size={14} />}
                                                            </span>
                                                            {foundItem && dbPriceNum > 0 && (
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                    DB: ${dbPriceNum.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Logs */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border-4 border-slate-800 h-[800px] flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex gap-2">
                                <div className="w-4 h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500/40"></div>
                                <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">System Logs</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            {logs.map(l => (
                                <div key={l.id} className="font-mono text-[10px] leading-relaxed border-l-2 border-slate-800 pl-4 py-1">
                                    <div className="text-slate-700 text-[8px] mb-1">{l.time}</div>
                                    <div className={`${
                                        l.type === 'error' ? 'text-rose-400' : 
                                        l.type === 'success' ? 'text-emerald-400' : 
                                        l.type === 'warning' ? 'text-amber-400' : 'text-slate-400'
                                    }`}>
                                        <span className="opacity-30 mr-2">❯</span>
                                        {l.message}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {status === 'loading' && (
                            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                                Escaneando colectivos... No cierres esta pestaña.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniversalScraper;
