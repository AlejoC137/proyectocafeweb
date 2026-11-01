import React, { useState, useMemo } from "react";
import { History, X, Calendar, ArrowRight, TrendingUp, TrendingDown, Clock, Tag, ArrowDownUp, Layers } from "lucide-react";
import { parseHistoryEntries } from "../../../utils/historyUtils";

export default function HistorialItemModal({ item, onClose }) {
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" (más reciente primero) o "asc" (cronológico)

  if (!item) return null;

  // Entries parsed from historial_update
  const rawEntries = useMemo(() => parseHistoryEntries(item.historial_update), [item.historial_update]);

  const entries = useMemo(() => {
    if (sortOrder === "asc") {
      return [...rawEntries].reverse();
    }
    return rawEntries;
  }, [rawEntries, sortOrder]);

  // Extract chronological price evolution from all logs
  const priceTimeline = useMemo(() => {
    const ascLogs = [...rawEntries].reverse();
    const timeline = [];
    ascLogs.forEach((log) => {
      if (log.cambios?.COSTO) {
        timeline.push({
          logIndex: log.logIndex,
          fecha: log.fecha,
          costoAnterior: log.cambios.COSTO.anterior,
          costoNuevo: log.cambios.COSTO.nuevo,
          origen: log.origen
        });
      }
    });
    return timeline;
  }, [rawEntries]);

  const formatValue = (field, val) => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-400 italic">vacío</span>;
    if (field === "COSTO" || field === "precioUnitario") {
      const num = Number(val);
      if (!isNaN(num)) {
        return `$${new Intl.NumberFormat("es-CO").format(num)}`;
      }
    }
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
    return String(val);
  };

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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 flex-shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Historial de Cambios en el Tiempo
                </h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-mono">
                  {rawEntries.length} {rawEntries.length === 1 ? "log" : "logs acumulados"}
                </span>
              </div>
              <p className="text-sm text-blue-200 font-semibold truncate max-w-[420px]" title={item.Nombre_del_producto}>
                {item.Nombre_del_producto}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status summary bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap gap-4 text-xs items-center justify-between text-slate-600">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1.5">Costo Actual:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                ${new Intl.NumberFormat("es-CO").format(item.COSTO || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1.5">Precio Unitario:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                ${new Intl.NumberFormat("es-CO").format(item.precioUnitario || 0)}
              </span>
            </div>
          </div>

          {/* Sort order toggle */}
          {rawEntries.length > 1 && (
            <button
              onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
              title="Cambiar orden cronológico"
            >
              <ArrowDownUp className="h-3 w-3" />
              <span>{sortOrder === "desc" ? "Más reciente primero" : "Más antiguo primero (cronológico)"}</span>
            </button>
          )}
        </div>

        {/* Mini Price Evolution Timeline Bar (if at least 2 price points) */}
        {priceTimeline.length >= 2 && (
          <div className="bg-blue-50/50 border-b border-blue-100 px-5 py-2 flex items-center gap-2 text-[10px] overflow-x-auto custom-scrollbar">
            <span className="text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
              <Layers className="h-3 w-3" />
              Evolución:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {priceTimeline.map((pt, idx) => {
                const dateShort = pt.fecha ? new Date(pt.fecha).toLocaleDateString("es-CO", { month: "short", day: "numeric" }) : "";
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300">→</span>}
                    <div className="flex flex-col items-center bg-white border border-blue-200 rounded px-1.5 py-0.5 shadow-2xs">
                      <span className="font-bold text-slate-800">${new Intl.NumberFormat("es-CO").format(pt.costoNuevo || 0)}</span>
                      <span className="text-[9px] text-slate-400">{dateShort} (Log #{pt.logIndex})</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Entries list with vertical timeline connector */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
          {entries.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center text-slate-400 space-y-2.5">
              <Clock className="h-12 w-12 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">Sin historial registrado en Supabase</p>
              <p className="text-xs text-slate-400 max-w-sm text-center leading-relaxed">
                Cada vez que modifiques precios o datos de este ítem y presiones <strong>"Guardar Todo"</strong>, se agregará un <strong>nuevo log independiente</strong> a la columna <code className="bg-slate-200 text-slate-700 px-1 rounded">historial_update</code> acumulando el histórico en el tiempo.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-blue-200 ml-4 pl-5 space-y-4">
              {entries.map((entry, index) => {
                const dateStr = entry.fecha
                  ? new Date(entry.fecha).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })
                  : "Fecha no especificada";

                const cambios = entry.cambios || {};
                const changeKeys = Object.keys(cambios);
                const logNumber = entry.logIndex || (entries.length - index);

                return (
                  <div key={entry._id || index} className="relative group">
                    {/* Timeline Node Icon/Dot */}
                    <div className="absolute -left-[29px] top-1.5 h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-4 ring-white">
                      {logNumber}
                    </div>

                    {/* Log Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-2 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                            Log #{logNumber}
                          </span>
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {entry.origen && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-mono border border-slate-200">
                            {entry.origen}
                          </span>
                        )}
                      </div>

                      {/* Changes List */}
                      {changeKeys.length === 0 && entry.raw ? (
                        <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded">
                          {String(entry.raw)}
                        </div>
                      ) : (
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
                                <span className="font-bold text-slate-700 text-[10px] uppercase w-28 truncate flex items-center gap-1">
                                  <Tag className="h-2.5 w-2.5 text-blue-500" />
                                  {campo}
                                </span>

                                <div className="flex items-center gap-2 flex-1 justify-end min-w-0 font-mono text-[11px]">
                                  <span className="text-slate-400 line-through truncate max-w-[120px] text-right">
                                    {formatValue(campo, anterior)}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                                  <span className="font-bold text-slate-900 truncate max-w-[120px] text-right">
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center text-xs text-slate-500">
          <span>
            Cada log representa una actualización guardada con su fecha y valores previos.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
