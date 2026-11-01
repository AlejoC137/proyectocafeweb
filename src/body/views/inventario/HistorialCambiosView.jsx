import React, { useState, useMemo } from "react";
import {
  History, Search, Filter, Calendar, Tag, ArrowRight,
  TrendingUp, TrendingDown, Layers, Sparkles, User,
  Clock, Package, CheckCircle2, SlidersHorizontal, RefreshCcw
} from "lucide-react";
import { parseHistoryEntries } from "../../../utils/historyUtils";

export default function HistorialCambiosView({ items = [], categorias = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("TODOS");
  const [selectedOrigen, setSelectedOrigen] = useState("TODOS");
  const [selectedTipo, setSelectedTipo] = useState("TODOS"); // "TODOS" | "manual" | "automático"
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filter items that have at least one history entry
  const itemsWithHistory = useMemo(() => {
    return items
      .map(item => {
        const parsed = parseHistoryEntries(item.historial_update);
        return {
          ...item,
          _historyEntries: parsed, // sorted newest first
          _historyCount: parsed.length
        };
      })
      .filter(item => item._historyCount > 0);
  }, [items]);

  // Unique origins present in history
  const availableOrigins = useMemo(() => {
    const set = new Set();
    itemsWithHistory.forEach(item => {
      item._historyEntries.forEach(entry => {
        if (entry.origen) set.add(entry.origen);
      });
    });
    return Array.from(set).sort();
  }, [itemsWithHistory]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return itemsWithHistory.filter(item => {
      const matchesSearch = item.Nombre_del_producto?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === "TODOS" || item.GRUPO === selectedGroup;

      const matchesOrigen = selectedOrigen === "TODOS" || item._historyEntries.some(e => e.origen === selectedOrigen);
      const matchesTipo = selectedTipo === "TODOS" || item._historyEntries.some(e => (e.tipo || "manual").toLowerCase() === selectedTipo.toLowerCase());

      return matchesSearch && matchesGroup && matchesOrigen && matchesTipo;
    });
  }, [itemsWithHistory, searchTerm, selectedGroup, selectedOrigen, selectedTipo]);

  // Keep selected product reference updated
  const activeProduct = useMemo(() => {
    if (!selectedProduct) return filteredProducts[0] || null;
    return itemsWithHistory.find(i => i._id === selectedProduct._id) || filteredProducts[0] || null;
  }, [selectedProduct, itemsWithHistory, filteredProducts]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalLogs = 0;
    let manualLogs = 0;
    let autoLogs = 0;

    itemsWithHistory.forEach(item => {
      item._historyEntries.forEach(e => {
        totalLogs++;
        if ((e.tipo || "").toLowerCase() === "automático") {
          autoLogs++;
        } else {
          manualLogs++;
        }
      });
    });

    return {
      totalProductsWithHistory: itemsWithHistory.length,
      totalLogs,
      manualLogs,
      autoLogs
    };
  }, [itemsWithHistory]);

  // Helper for price differences
  const getPriceDiff = (oldVal, newVal) => {
    const o = Number(oldVal);
    const n = Number(newVal);
    if (isNaN(o) || isNaN(n) || o === 0) return null;
    const diff = n - o;
    const pct = ((diff / o) * 100).toFixed(1);
    const isUp = diff > 0;
    return {
      diff,
      pct,
      isUp,
      formatted: `${isUp ? "+" : ""}$${new Intl.NumberFormat("es-CO").format(diff)} (${isUp ? "+" : ""}${pct}%)`
    };
  };

  const formatValue = (field, val) => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-400 italic">vacío</span>;
    if (field === "COSTO" || field === "precioUnitario") {
      const num = Number(val);
      if (!isNaN(num)) return `$${new Intl.NumberFormat("es-CO").format(num)}`;
    }
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-185px)] gap-3 text-xs">
      
      {/* Top Bar: KPIs & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* KPI Mini Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Con Historial</div>
              <div className="font-bold text-slate-800 text-xs">{stats.totalProductsWithHistory} ítems</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Logs</div>
              <div className="font-bold text-slate-800 text-xs">{stats.totalLogs} cambios</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <User className="h-4 w-4 text-amber-600" />
            <div>
              <div className="text-[10px] text-amber-600 font-bold uppercase">Manuales</div>
              <div className="font-bold text-amber-900 text-xs">{stats.manualLogs}</div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-[10px] text-purple-600 font-bold uppercase">Automáticos (IA)</div>
              <div className="font-bold text-purple-900 text-xs">{stats.autoLogs}</div>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 border border-slate-200 rounded-lg text-xs w-44 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Grupo */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="border border-slate-200 rounded-lg py-1 px-2 text-xs bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="TODOS">Todos los Grupos</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Origen */}
          <select
            value={selectedOrigen}
            onChange={(e) => setSelectedOrigen(e.target.value)}
            className="border border-slate-200 rounded-lg py-1 px-2 text-xs bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="TODOS">Todos los Orígenes</option>
            {availableOrigins.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>

          {/* Tipo */}
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="border border-slate-200 rounded-lg py-1 px-2 text-xs bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="TODOS">Tipo: Todos</option>
            <option value="manual">Manual</option>
            <option value="automático">Automático</option>
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Recargar datos"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Main 2-Column Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
        
        {/* Column 1: Items List with History (Width 4 of 12) */}
        <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <Package className="h-4 w-4 text-blue-600" />
              Productos con Cambios
            </span>
            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {filteredProducts.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="h-8 w-8 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs">No se encontraron productos con historial bajo los filtros actuales.</p>
              </div>
            ) : (
              filteredProducts.map(prod => {
                const isSelected = activeProduct?._id === prod._id;
                const latestLog = prod._historyEntries[0];
                const lastDate = latestLog?.fecha 
                  ? new Date(latestLog.fecha).toLocaleDateString("es-CO", { month: "short", day: "numeric" })
                  : "";

                return (
                  <div
                    key={prod._id}
                    onClick={() => setSelectedProduct(prod)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/90 border-blue-400 shadow-sm ring-1 ring-blue-300"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-[11px] truncate" title={prod.Nombre_del_producto}>
                          {prod.Nombre_del_producto}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                          <span className="bg-slate-100 px-1 rounded text-slate-600">{prod.GRUPO || "Sin grupo"}</span>
                          <span>•</span>
                          <span>{prod.UNIDADES}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-slate-800 text-[11px]">
                          ${new Intl.NumberFormat("es-CO").format(prod.COSTO || 0)}
                        </span>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                            {prod._historyCount} {prod._historyCount === 1 ? "log" : "logs"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Latest change pill */}
                    {latestLog && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100/80 flex items-center justify-between text-[9px] text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <Clock className="h-2.5 w-2.5 text-slate-400" />
                          {lastDate} ({latestLog.origen || "Manual"})
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] uppercase ${
                          (latestLog.tipo || "").toLowerCase() === "automático"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {latestLog.tipo || "Manual"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Detailed Timeline of Selected Product (Width 8 of 12) */}
        <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-0 overflow-hidden">
          {activeProduct ? (
            <>
              {/* Product Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
                      {activeProduct.GRUPO || "General"}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: {activeProduct._id}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {activeProduct.Nombre_del_producto}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Costo Actual</div>
                    <div className="text-sm font-extrabold text-blue-300">
                      ${new Intl.NumberFormat("es-CO").format(activeProduct.COSTO || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Precio Unitario</div>
                    <div className="text-sm font-extrabold text-white">
                      ${new Intl.NumberFormat("es-CO").format(activeProduct.precioUnitario || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Evolution Track */}
              <div className="bg-blue-50/60 border-b border-blue-100 px-4 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar text-[10px]">
                <span className="font-bold text-blue-800 uppercase flex items-center gap-1 flex-shrink-0">
                  <Layers className="h-3.5 w-3.5" />
                  Evolución en el Tiempo:
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {[...activeProduct._historyEntries].reverse().map((entry, idx) => {
                    const dateShort = entry.fecha ? new Date(entry.fecha).toLocaleDateString("es-CO", { month: "short", day: "numeric" }) : "";
                    const costoNuevo = entry.cambios?.COSTO?.nuevo;

                    return (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-slate-300">→</span>}
                        <div className="flex flex-col items-center bg-white border border-blue-200 rounded px-2 py-1 shadow-2xs">
                          <span className="font-bold text-slate-800">
                            {costoNuevo ? `$${new Intl.NumberFormat("es-CO").format(costoNuevo)}` : "Modif."}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {dateShort} ({entry.tipo || "manual"})
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Timeline of Logs */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
                <div className="relative border-l-2 border-blue-300 ml-4 pl-6 space-y-4">
                  {activeProduct._historyEntries.map((entry, index) => {
                    const dateStr = entry.fecha
                      ? new Date(entry.fecha).toLocaleString("es-CO", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })
                      : "Fecha no especificada";

                    const cambios = entry.cambios || {};
                    const changeKeys = Object.keys(cambios);
                    const logNumber = entry.logIndex || (activeProduct._historyEntries.length - index);
                    const isAuto = (entry.tipo || "").toLowerCase() === "automático";

                    return (
                      <div key={entry._id || index} className="relative group">
                        {/* Timeline Node Icon/Dot */}
                        <div className={`absolute -left-[33px] top-2 h-6 w-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-4 ring-white ${
                          isAuto ? "bg-purple-600" : "bg-blue-600"
                        }`}>
                          {logNumber}
                        </div>

                        {/* Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                                Log #{logNumber}
                              </span>
                              <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>{dateStr}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Origen badge */}
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[9px] border border-slate-200">
                                {entry.origen || "Manual"}
                              </span>

                              {/* Tipo badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                isAuto
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {isAuto ? "Automático" : "Manual"}
                              </span>
                            </div>
                          </div>

                          {/* Fields table */}
                          <div className="space-y-1.5">
                            {changeKeys.map((campo) => {
                              const changeData = cambios[campo] || {};
                              const anterior = changeData.anterior;
                              const nuevo = changeData.nuevo;
                              const diffInfo = (campo === "COSTO" || campo === "precioUnitario")
                                ? getPriceDiff(anterior, nuevo)
                                : null;

                              return (
                                <div
                                  key={campo}
                                  className="flex items-center justify-between text-xs bg-slate-50/80 p-2 rounded-lg border border-slate-100"
                                >
                                  <span className="font-bold text-slate-700 text-[10px] uppercase w-32 truncate flex items-center gap-1.5">
                                    <Tag className="h-3 w-3 text-blue-500" />
                                    {campo}
                                  </span>

                                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0 font-mono text-[11px]">
                                    <span className="text-slate-400 line-through truncate max-w-[140px] text-right">
                                      {formatValue(campo, anterior)}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                                    <span className="font-bold text-slate-900 truncate max-w-[140px] text-right">
                                      {formatValue(campo, nuevo)}
                                    </span>

                                    {diffInfo && (
                                      <span
                                        className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          diffInfo.isUp
                                            ? "bg-red-50 text-red-600 border border-red-200"
                                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                        }`}
                                      >
                                        {diffInfo.isUp ? (
                                          <TrendingUp className="h-2.5 w-2.5" />
                                        ) : (
                                          <TrendingDown className="h-2.5 w-2.5" />
                                        )}
                                        {diffInfo.formatted}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 space-y-2">
              <History className="h-12 w-12 opacity-30" />
              <p className="text-sm font-semibold text-slate-500">Selecciona un producto a la izquierda</p>
              <p className="text-xs text-slate-400 text-center max-w-sm">
                Podrás revisar su línea de tiempo completa, cada cambio registrado con fecha, origen y si fue automático o manual.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
