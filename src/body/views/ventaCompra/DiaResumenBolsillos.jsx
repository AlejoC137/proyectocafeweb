import React, { useMemo, useState } from "react";
import { calculateFinancialPockets } from "./bolsillos/pocketEngine";

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `$ ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(num)}`;
};

const formatQty = (value) => {
  const num = Number(value) || 0;
  return num % 1 === 0 ? String(num) : num.toFixed(2);
};

const GRUPO_META = {
  CAFE: { label: "Café", icon: "☕", badge: "bg-amber-100 text-amber-900 border-amber-200", bar: "bg-amber-500" },
  LACTEO: { label: "Lácteos", icon: "🥛", badge: "bg-sky-100 text-sky-900 border-sky-200", bar: "bg-sky-500" },
  PANADERIA: { label: "Panadería", icon: "🥐", badge: "bg-orange-100 text-orange-900 border-orange-200", bar: "bg-orange-500" },
  REPOSTERIA: { label: "Repostería", icon: "🍰", badge: "bg-pink-100 text-pink-900 border-pink-200", bar: "bg-pink-500" },
  BEBIDAS: { label: "Bebidas", icon: "🥤", badge: "bg-cyan-100 text-cyan-900 border-cyan-200", bar: "bg-cyan-500" },
  CARNICO: { label: "Cárnicos", icon: "🥩", badge: "bg-rose-100 text-rose-900 border-rose-200", bar: "bg-rose-500" },
  VERDURAS_FRUTAS: { label: "Verduras y Frutas", icon: "🥗", badge: "bg-emerald-100 text-emerald-900 border-emerald-200", bar: "bg-emerald-500" },
  HELADOS: { label: "Helados", icon: "🍦", badge: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200", bar: "bg-fuchsia-500" },
  GRANOS_CEREALES: { label: "Granos y Cereales", icon: "🌾", badge: "bg-yellow-100 text-yellow-900 border-yellow-200", bar: "bg-yellow-500" },
  CONDIMENTOS_ESPECIAS_ADITIVOS: { label: "Condimentos y Aditivos", icon: "🧂", badge: "bg-lime-100 text-lime-900 border-lime-200", bar: "bg-lime-500" },
  CONCERVAS_FERMENTOS_PRECOCIDOS: { label: "Conservas y Precocidos", icon: "🫙", badge: "bg-teal-100 text-teal-900 border-teal-200", bar: "bg-teal-500" },
  GUARNICION: { label: "Guarniciones", icon: "🍟", badge: "bg-indigo-100 text-indigo-900 border-indigo-200", bar: "bg-indigo-500" },
  DESECHABLES: { label: "Desechables y Empaques", icon: "🥡", badge: "bg-stone-100 text-stone-800 border-stone-300", bar: "bg-stone-500" },
  LIMPIEZA: { label: "Limpieza", icon: "🧼", badge: "bg-blue-100 text-blue-900 border-blue-200", bar: "bg-blue-500" },
  OTROS: { label: "Otros", icon: "📦", badge: "bg-gray-100 text-gray-800 border-gray-200", bar: "bg-gray-500" },
};

const getGrupoMeta = (rawGrupo) => {
  const key = String(rawGrupo || "OTROS").toUpperCase().trim();
  if (GRUPO_META[key]) return { key, ...GRUPO_META[key] };
  return {
    key,
    label: key.replace(/_/g, " "),
    icon: "📦",
    badge: "bg-gray-100 text-gray-800 border-gray-200",
    bar: "bg-slate-500",
  };
};

function DiaResumenBolsillos({
  ventas,
  consumoStaff = [],
  totalIngreso,
  targetDate,
  periodParams = null,
  periodLabel = "del Día",
  allStaff,
  allMenu,
  allRecetasMenu,
  allRecetasProduccion,
  allItems,
  allProduccion,
  loadingCatalogs,
}) {
  const [viewMode, setViewMode] = useState("grupo"); // "grupo" | "item"
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

  const effectivePeriodParams = useMemo(() => {
    if (periodParams) return periodParams;
    return targetDate ? { periodType: "day", targetDate } : null;
  }, [periodParams, targetDate]);

  const isMultiDayMode = effectivePeriodParams?.periodType && effectivePeriodParams.periodType !== "day";

  const pocketResult = useMemo(() => {
    return calculateFinancialPockets({
      ventas: ventas || [],
      consumoStaff: consumoStaff || [],
      allStaff: allStaff || [],
      allMenu: allMenu || [],
      allRecetasMenu: allRecetasMenu || [],
      allRecetasProduccion: allRecetasProduccion || [],
      allItems: allItems || [],
      allProduccion: allProduccion || [],
      periodParams: effectivePeriodParams,
    });
  }, [ventas, consumoStaff, allStaff, allMenu, allRecetasMenu, allRecetasProduccion, allItems, allProduccion, effectivePeriodParams]);

  const nominaData = pocketResult.nomina || {
    totalNomina: 0,
    totalPagoBase: 0,
    totalSeguridadSocial: 0,
    totalHoras: 0,
    colaboradoresCount: 0,
    tieneTurnosAbiertos: false,
    detalle: [],
  };

  const filteredNominaDetalle = useMemo(() => {
    const list = nominaData.detalle || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    if ("nomina".includes(q) || "nómina".includes(q) || "personal".includes(q) || "staff".includes(q)) {
      return list;
    }
    return list.filter(
      (emp) =>
        emp.nombre?.toLowerCase().includes(q) ||
        emp.cargo?.toLowerCase().includes(q) ||
        emp.origen?.toLowerCase().includes(q)
    );
  }, [nominaData.detalle, search]);

  const totalNominaFiltrada = useMemo(
    () => filteredNominaDetalle.reduce((acc, emp) => acc + (emp.totalNomina || 0), 0),
    [filteredNominaDetalle]
  );

  const filteredInsumos = useMemo(() => {
    const list = pocketResult.insumosRestock || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((ins) => {
      const meta = getGrupoMeta(ins.grupo);
      return (
        ins.nombre?.toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q) ||
        meta.key.toLowerCase().includes(q) ||
        (ins.productosAsociados || []).some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [pocketResult.insumosRestock, search]);

  const totalGuardarInsumos = useMemo(
    () => filteredInsumos.reduce((acc, ins) => acc + (ins.dineroRestock || 0), 0),
    [filteredInsumos]
  );

  const totalGuardar = totalGuardarInsumos + totalNominaFiltrada;

  const groupedByGrupo = useMemo(() => {
    const map = {};
    filteredInsumos.forEach((ins) => {
      const meta = getGrupoMeta(ins.grupo);
      if (!map[meta.key]) {
        map[meta.key] = {
          ...meta,
          totalDinero: 0,
          items: [],
        };
      }
      map[meta.key].totalDinero += ins.dineroRestock || 0;
      map[meta.key].items.push(ins);
    });

    return Object.values(map)
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => (b.dineroRestock || 0) - (a.dineroRestock || 0)),
        pct: totalGuardar > 0 ? (g.totalDinero / totalGuardar) * 100 : 0,
      }))
      .sort((a, b) => b.totalDinero - a.totalDinero);
  }, [filteredInsumos, totalGuardar]);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loadingCatalogs) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
        <div className="h-9 w-9 rounded-full border-4 border-gray-200 border-t-amber-600 animate-spin" />
        <p className="text-sm font-medium">
          Cargando recetas, insumos y nómina para calcular bolsillos...
        </p>
      </div>
    );
  }

  const pctSobreVentas = totalIngreso > 0 ? (totalGuardar / totalIngreso) * 100 : 0;
  const pctNominaSobreVentas = totalIngreso > 0 ? (totalNominaFiltrada / totalIngreso) * 100 : 0;
  const pctNominaSobreGuardar = totalGuardar > 0 ? (totalNominaFiltrada / totalGuardar) * 100 : 0;
  const totalGruposActivos = groupedByGrupo.length + (filteredNominaDetalle.length > 0 ? 1 : 0);
  const isNominaExpanded = expandedGroups.__NOMINA__ ?? true;

  return (
    <div className="space-y-6">
      {/* Resumen de Bolsillos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold uppercase text-amber-800">
            Total a Guardar (Re-stock + Nómina)
          </p>
          <p className="text-2xl font-bold text-amber-900 mt-1">
            {formatCurrency(totalGuardar)}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {pctSobreVentas.toFixed(1)}% de los ingresos pagados {periodLabel.toLowerCase()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs font-semibold uppercase text-blue-800">
            👥 Nómina a Guardar {periodLabel}
          </p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {formatCurrency(totalNominaFiltrada)}
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            {filteredNominaDetalle.length}{" "}
            {filteredNominaDetalle.length === 1 ? "colaborador" : "colaboradores"} ·{" "}
            {formatQty(nominaData.totalHoras)} h ({pctNominaSobreVentas.toFixed(1)}% s/ venta)
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-600">
            Re-stock Insumos ({groupedByGrupo.length} grupos)
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {formatCurrency(totalGuardarInsumos)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalGruposActivos} bolsillos activos en total
          </p>
        </div>

        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-semibold uppercase text-emerald-800">
            Ítems / Insumos Consumidos
          </p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">
            {filteredInsumos.length}
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Calculado desde las recetas de ventas pagadas
          </p>
        </div>
      </div>

      {/* Controles de Vista y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 w-fit">
          <button
            type="button"
            onClick={() => setViewMode("grupo")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === "grupo"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Por Grupo ({totalGruposActivos})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("item")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === "item"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Por Ítem / Insumo ({filteredInsumos.length})
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por insumo, grupo, producto o nómina..."
          className="w-full sm:w-80 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Contenido */}
      {filteredInsumos.length === 0 && filteredNominaDetalle.length === 0 ? (
        <div className="py-10 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No hay insumos ni nómina calculados para este día
          {search ? ` con el filtro "${search}"` : ""}.
        </div>
      ) : viewMode === "grupo" ? (
        <div className="space-y-3">
          {/* Bolsillo de Nómina del Día */}
          {filteredNominaDetalle.length > 0 && (
            <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleGroup("__NOMINA__")}
                className="w-full px-4 py-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100/80 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">👥</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-blue-950 text-sm">
                        Nómina {periodLabel} (Base + 10% Seg. Social)
                      </span>
                      <span className="text-xs text-blue-700">
                        ({filteredNominaDetalle.length}{" "}
                        {filteredNominaDetalle.length === 1 ? "persona" : "personas"})
                      </span>
                      {nominaData.tieneTurnosAbiertos && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Hay turnos sin cerrar
                        </span>
                      )}
                    </div>
                    <div className="w-40 sm:w-56 h-1.5 bg-blue-200 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(100, pctNominaSobreGuardar)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-bold text-blue-950">
                      {formatCurrency(totalNominaFiltrada)}
                    </p>
                    <p className="text-xs text-blue-700">
                      {pctNominaSobreGuardar.toFixed(1)}% del total a guardar
                    </p>
                  </div>
                  <span className="text-blue-500 text-xs">
                    {isNominaExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {isNominaExpanded && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-t border-blue-100">
                    <thead>
                      <tr className="bg-white text-xs text-gray-500 uppercase border-b border-gray-100">
                        <th className="py-2 px-4 text-left font-semibold">Colaborador</th>
                        <th className="py-2 px-4 text-left font-semibold">Turno / Origen</th>
                        <th className="py-2 px-4 text-right font-semibold">Horas</th>
                        <th className="py-2 px-4 text-right font-semibold">Base + Seg. Soc. (10%)</th>
                        <th className="py-2 px-4 text-right font-semibold">Guardar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredNominaDetalle.map((emp) => (
                        <tr key={emp.id} className="hover:bg-blue-50/40">
                          <td className="py-2.5 px-4">
                            <p className="font-medium text-gray-800">{emp.nombre}</p>
                            <p className="text-xs text-gray-500">
                              {emp.cargo} · {formatCurrency(emp.rate)}/h
                            </p>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">
                            <span className="block font-medium text-gray-700">
                              {isMultiDayMode
                                ? `${emp.turnosCount} ${emp.turnosCount === 1 ? "turno" : "turnos"}`
                                : emp.horario || "—"}
                            </span>
                            <span
                              className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                emp.turnoAbierto
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {emp.origen}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-700 whitespace-nowrap">
                            {formatQty(emp.horas)} h
                          </td>
                          <td className="py-2.5 px-4 text-right text-xs text-gray-600 whitespace-nowrap">
                            {formatCurrency(emp.pagoBase)} + {formatCurrency(emp.seguridadSocial)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-blue-800 whitespace-nowrap">
                            {formatCurrency(emp.totalNomina)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {groupedByGrupo.map((grupo) => {
            const isExpanded = expandedGroups[grupo.key] ?? true;
            return (
              <div
                key={grupo.key}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(grupo.key)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{grupo.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">
                          {grupo.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({grupo.items.length} {grupo.items.length === 1 ? "ítem" : "ítems"})
                        </span>
                      </div>
                      <div className="w-40 sm:w-56 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full ${grupo.bar} rounded-full`}
                          style={{ width: `${Math.min(100, grupo.pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">
                        {formatCurrency(grupo.totalDinero)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {grupo.pct.toFixed(1)}% del total a guardar
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-t border-gray-200">
                      <thead>
                        <tr className="bg-white text-xs text-gray-500 uppercase border-b border-gray-100">
                          <th className="py-2 px-4 text-left font-semibold">Ítem / Insumo</th>
                          <th className="py-2 px-4 text-right font-semibold">Gastado</th>
                          <th className="py-2 px-4 text-left font-semibold">Usado en</th>
                          <th className="py-2 px-4 text-right font-semibold">Guardar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {grupo.items.map((ins) => (
                          <tr key={ins.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-4 font-medium text-gray-800">
                              {ins.nombre}
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-600 whitespace-nowrap">
                              {formatQty(ins.cantidadAReponer)} {ins.unidad}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-gray-500">
                              {(ins.productosAsociados || []).join(", ")}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-amber-800 whitespace-nowrap">
                              {formatCurrency(ins.dineroRestock)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                  Ítem / Insumo
                </th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                  Grupo
                </th>
                <th className="py-3 px-4 border-b text-right text-sm font-medium text-gray-700">
                  Cantidad Gastada
                </th>
                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">
                  Usado en
                </th>
                <th className="py-3 px-4 border-b text-right text-sm font-medium text-gray-700">
                  Dinero a Guardar
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInsumos.map((ins) => {
                const meta = getGrupoMeta(ins.grupo);
                return (
                  <tr key={ins.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 border-b text-sm font-medium text-gray-800">
                      {ins.nombre}
                    </td>
                    <td className="py-3 px-4 border-b text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.badge}`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-right text-gray-600 whitespace-nowrap">
                      {formatQty(ins.cantidadAReponer)} {ins.unidad}
                    </td>
                    <td className="py-3 px-4 border-b text-xs text-gray-500">
                      {(ins.productosAsociados || []).join(", ")}
                    </td>
                    <td className="py-3 px-4 border-b text-sm text-right font-bold text-amber-800 whitespace-nowrap">
                      {formatCurrency(ins.dineroRestock)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td colSpan={4} className="py-2.5 px-4 text-sm text-gray-700 text-right">
                  Subtotal Re-stock Insumos:
                </td>
                <td className="py-2.5 px-4 text-sm text-right text-gray-800 whitespace-nowrap">
                  {formatCurrency(totalGuardarInsumos)}
                </td>
              </tr>
              <tr className="bg-blue-50 font-semibold border-t border-blue-100">
                <td colSpan={4} className="py-2.5 px-4 text-sm text-blue-900 text-right">
                  👥 Nómina a Guardar {periodLabel} ({filteredNominaDetalle.length}{" "}
                  {filteredNominaDetalle.length === 1 ? "colaborador" : "colaboradores"}):
                </td>
                <td className="py-2.5 px-4 text-sm text-right text-blue-900 whitespace-nowrap">
                  {formatCurrency(totalNominaFiltrada)}
                </td>
              </tr>
              <tr className="bg-amber-50 font-bold border-t border-amber-200">
                <td colSpan={4} className="py-3 px-4 text-sm text-amber-900 text-right">
                  Total a Guardar en Bolsillos (Re-stock + Nómina):
                </td>
                <td className="py-3 px-4 text-sm text-right text-amber-900 whitespace-nowrap">
                  {formatCurrency(totalGuardar)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default DiaResumenBolsillos;
