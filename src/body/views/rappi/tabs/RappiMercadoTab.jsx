import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  analizarProducto,
  formatCOP,
  formatPct,
  colorMargen,
} from "../utils/rappiPricing";
import {
  BENCHMARK_METADATA,
  getMarketBenchmark,
  clasificarPosicionMercado,
} from "../data/rappiMarketBenchmarks";
import { aplicarPreciosRappi } from "@/redux/actions-Rappi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Store,
  Loader2,
} from "lucide-react";

const STATUS_BADGE = {
  BARATO: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ALINEADO: "bg-slate-100 text-slate-700 border-slate-200",
  CARO: "bg-rose-100 text-rose-800 border-rose-200",
  SIN_DATA: "bg-slate-50 text-slate-400 border-slate-200",
};

export function RappiMercadoTab({
  menu = [],
  recetasMenu = [],
  recetasProduccion = [],
  config,
}) {
  const dispatch = useDispatch();

  const [search, setSearch] = useState("");
  const [filterSubGrupo, setFilterSubGrupo] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS"); // TODOS | BARATO | ALINEADO | CARO
  const [sortCol, setSortCol] = useState("diffPct");
  const [sortDir, setSortDir] = useState("asc");
  const [savingId, setSavingId] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Comisión efectiva actual
  const comisionEfectivaPct = useMemo(() => {
    const c = Number(config?.comision_pct || 25);
    const iva = Number(config?.iva_comision_pct || 19);
    return c * (1 + iva / 100);
  }, [config]);

  const aumentoActualPct = Number(config?.aumento_pct || 25);
  const netoSobreLocalPct = useMemo(() => {
    return (1 + aumentoActualPct / 100) * (1 - comisionEfectivaPct / 100) * 100;
  }, [aumentoActualPct, comisionEfectivaPct]);

  const aumentoBreakEvenPct = useMemo(() => {
    const factorNeto = 1 - comisionEfectivaPct / 100;
    return factorNeto > 0 ? (1 / factorNeto - 1) * 100 : 0;
  }, [comisionEfectivaPct]);

  // Productos activos habilitados para Rappi enriquecidos con benchmark de mercado
  const rows = useMemo(() => {
    return menu
      .filter(
        (m) =>
          m.Estado === "Activo" &&
          Boolean(m.RAPPI || m.PROYECTO_1 || m.PROYECTO_2)
      )
      .map((m) => {
        const base = analizarProducto(m, config, recetasMenu, recetasProduccion);
        const benchmark = getMarketBenchmark(base.nombre);
        const pos = clasificarPosicionMercado(base.precioRappi, benchmark);
        return {
          ...base,
          subGrupoClean: base.subGrupo || "SIN_GRUPO",
          benchmark,
          status: pos.status,
          diffPct: pos.diffPct,
          statusLabel: pos.label,
          sugerido: benchmark?.sugerido ?? null,
        };
      });
  }, [menu, config, recetasMenu, recetasProduccion]);

  // Alertas de higiene de catálogo (SIN_GRUPO y duplicados)
  const hygiene = useMemo(() => {
    const sinGrupo = rows.filter((r) => !r.subGrupo);
    const nameCounts = {};
    rows.forEach((r) => {
      const k = (r.nombre || "").trim().toLowerCase();
      nameCounts[k] = (nameCounts[k] || 0) + 1;
    });
    const duplicados = Object.entries(nameCounts)
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));
    return { sinGrupo, duplicados };
  }, [rows]);

  // KPIs globales
  const kpis = useMemo(() => {
    const conRef = rows.filter((r) => r.status !== "SIN_DATA");
    const baratos = conRef.filter((r) => r.status === "BARATO");
    const alineados = conRef.filter((r) => r.status === "ALINEADO");
    const caros = conRef.filter((r) => r.status === "CARO");
    const avgDiff =
      conRef.length > 0
        ? conRef.reduce((acc, r) => acc + (r.diffPct || 0), 0) / conRef.length
        : 0;
    return {
      total: rows.length,
      baratos: baratos.length,
      alineados: alineados.length,
      caros: caros.length,
      avgDiff,
    };
  }, [rows]);

  // Resumen por categoría (SUB_GRUPO)
  const categorySummary = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const g = r.subGrupoClean;
      if (!map[g]) {
        map[g] = {
          subGrupo: g,
          count: 0,
          sumLocal: 0,
          sumRappi: 0,
          sumMarket: 0,
          marketCount: 0,
          baratos: 0,
          caros: 0,
        };
      }
      map[g].count += 1;
      map[g].sumLocal += r.precioLocal;
      map[g].sumRappi += r.precioRappi;
      if (r.benchmark?.avg) {
        map[g].sumMarket += r.benchmark.avg;
        map[g].marketCount += 1;
      }
      if (r.status === "BARATO") map[g].baratos += 1;
      if (r.status === "CARO") map[g].caros += 1;
    });
    return Object.values(map)
      .map((c) => {
        const avgLocal = c.count ? c.sumLocal / c.count : 0;
        const avgRappi = c.count ? c.sumRappi / c.count : 0;
        const avgMarket = c.marketCount ? c.sumMarket / c.marketCount : 0;
        const diffPct = avgMarket > 0 ? ((avgRappi - avgMarket) / avgMarket) * 100 : 0;
        return { ...c, avgLocal, avgRappi, avgMarket, diffPct };
      })
      .sort((a, b) => a.diffPct - b.diffPct);
  }, [rows]);

  // Filtrado y ordenamiento de la tabla
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterSubGrupo && r.subGrupoClean !== filterSubGrupo) return false;
      if (filterStatus !== "TODOS" && r.status !== filterStatus) return false;
      if (q) {
        const inName = (r.nombre || "").toLowerCase().includes(q);
        const inSub = (r.subGrupoClean || "").toLowerCase().includes(q);
        const inNote = (r.benchmark?.nota || "").toLowerCase().includes(q);
        if (!inName && !inSub && !inNote) return false;
      }
      return true;
    });
  }, [rows, filterSubGrupo, filterStatus, search]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (sortCol === "marketAvg") {
        av = a.benchmark?.avg ?? 0;
        bv = b.benchmark?.avg ?? 0;
      }
      if (sortCol === "nombre" || sortCol === "subGrupoClean") {
        av = String(av || "").toLowerCase();
        bv = String(bv || "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const na = Number.isFinite(Number(av)) ? Number(av) : -999999;
      const nb = Number.isFinite(Number(bv)) ? Number(bv) : -999999;
      return sortDir === "asc" ? na - nb : nb - na;
    });
  }, [filteredRows, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "nombre" || col === "diffPct" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-orange-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-orange-600" />
    );
  };

  const handleApplySuggested = async (row) => {
    if (!row.sugerido) return;
    setSavingId(row.id);
    try {
      await dispatch(aplicarPreciosRappi({ [row.id]: row.sugerido }));
    } finally {
      setSavingId(null);
    }
  };

  const handleResetManual = async (row) => {
    setSavingId(row.id);
    try {
      await dispatch(aplicarPreciosRappi({ [row.id]: null }));
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkApplyFiltered = async () => {
    const targets = sortedRows.filter(
      (r) => r.sugerido && r.sugerido !== r.precioRappi
    );
    if (!targets.length) return;
    const confirmed = window.confirm(
      `¿Aplicar el precio sugerido de mercado como Precio_Rappi manual a ${targets.length} productos filtrados?`
    );
    if (!confirmed) return;

    setBulkSaving(true);
    try {
      const payload = {};
      targets.forEach((r) => {
        payload[r.id] = r.sugerido;
      });
      await dispatch(aplicarPreciosRappi(payload));
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Banner de contexto + Matemática de comisión */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50/70 to-white border border-orange-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-orange-800 font-semibold text-base">
              <Store className="w-5 h-5 text-orange-600" />
              <span>Benchmark de Mercado — Rappi {BENCHMARK_METADATA.ciudad}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Levantamiento: <strong>{BENCHMARK_METADATA.fecha}</strong> · Referentes:{" "}
              {BENCHMARK_METADATA.competidores.slice(0, 8).join(", ")} y otros.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-white border border-orange-200 rounded-lg px-3 py-1.5">
              <span className="text-slate-500">Comisión efectiva: </span>
              <strong className="text-orange-700">{formatPct(comisionEfectivaPct)}</strong>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg px-3 py-1.5">
              <span className="text-slate-500">Con +{aumentoActualPct}% recibes: </span>
              <strong className="text-amber-700">{formatPct(netoSobreLocalPct)}</strong>
              <span className="text-slate-400"> del precio local</span>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg px-3 py-1.5">
              <span className="text-slate-500">Break-even neto: </span>
              <strong className="text-slate-800">+{formatPct(aumentoBreakEvenPct)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus("TODOS")}
          className={`text-left p-4 rounded-xl border transition-all ${
            filterStatus === "TODOS"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-80">
            <span>Catálogo Rappi Evaluado</span>
            <Info className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold mt-1">{kpis.total}</div>
          <div className="text-xs mt-1 opacity-75">
            Brecha prom.: {kpis.avgDiff >= 0 ? "+" : ""}
            {formatPct(kpis.avgDiff)} vs. MDE
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterStatus((s) => (s === "BARATO" ? "TODOS" : "BARATO"))
          }
          className={`text-left p-4 rounded-xl border transition-all ${
            filterStatus === "BARATO"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white border-emerald-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={filterStatus === "BARATO" ? "text-emerald-100" : "text-emerald-700 font-medium"}>
              Debajo del Mercado (&le;-10%)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-1">{kpis.baratos}</div>
          <div className={`text-xs mt-1 ${filterStatus === "BARATO" ? "text-emerald-100" : "text-slate-500"}`}>
            Oportunidad para subir margen
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterStatus((s) => (s === "ALINEADO" ? "TODOS" : "ALINEADO"))
          }
          className={`text-left p-4 rounded-xl border transition-all ${
            filterStatus === "ALINEADO"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={filterStatus === "ALINEADO" ? "text-blue-100" : "text-slate-600 font-medium"}>
              Alineados (±10%)
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-1">{kpis.alineados}</div>
          <div className={`text-xs mt-1 ${filterStatus === "ALINEADO" ? "text-blue-100" : "text-slate-500"}`}>
            Competitivos en Rappi MDE
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterStatus((s) => (s === "CARO" ? "TODOS" : "CARO"))
          }
          className={`text-left p-4 rounded-xl border transition-all ${
            filterStatus === "CARO"
              ? "bg-rose-600 text-white border-rose-600 shadow-md"
              : "bg-white border-rose-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={filterStatus === "CARO" ? "text-rose-100" : "text-rose-700 font-medium"}>
              Arriba del Mercado (&ge;+10%)
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold mt-1">{kpis.caros}</div>
          <div className={`text-xs mt-1 ${filterStatus === "CARO" ? "text-rose-100" : "text-slate-500"}`}>
            Revisar riesgo de conversión
          </div>
        </button>
      </div>

      {/* Alertas de higiene de catálogo */}
      {(hygiene.sinGrupo.length > 0 || hygiene.duplicados.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Higiene de catálogo detectada:</strong>{" "}
              {hygiene.sinGrupo.length > 0 && (
                <span>
                  <strong>{hygiene.sinGrupo.length}</strong> productos sin categoría (
                  {hygiene.sinGrupo.map((i) => i.nombre).join(", ")}).{" "}
                </span>
              )}
              {hygiene.duplicados.length > 0 && (
                <span>
                  Duplicados:{" "}
                  {hygiene.duplicados
                    .map((d) => `${d.name} (×${d.count})`)
                    .join(", ")}
                  .
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumen por Categoría (clic para filtrar) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Resumen por Categoría (clic en una categoría para filtrar)
          </h3>
          {filterSubGrupo && (
            <button
              type="button"
              onClick={() => setFilterSubGrupo("")}
              className="text-xs text-orange-600 hover:underline font-medium"
            >
              Ver todas las categorías
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left">
                <th className="py-2 pr-3 font-medium">Categoría</th>
                <th className="py-2 px-2 text-center font-medium">Ítems</th>
                <th className="py-2 px-2 text-right font-medium">Prom. Local</th>
                <th className="py-2 px-2 text-right font-medium">Prom. Rappi</th>
                <th className="py-2 px-2 text-right font-medium">Prom. Mercado MDE</th>
                <th className="py-2 px-2 text-right font-medium">Brecha</th>
                <th className="py-2 pl-2 text-right font-medium">Distribución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorySummary.map((c) => {
                const isSelected = filterSubGrupo === c.subGrupo;
                const diffColor =
                  c.diffPct <= -10
                    ? "text-emerald-700 bg-emerald-50"
                    : c.diffPct >= 10
                    ? "text-rose-700 bg-rose-50"
                    : "text-slate-700 bg-slate-100";
                return (
                  <tr
                    key={c.subGrupo}
                    onClick={() =>
                      setFilterSubGrupo((prev) =>
                        prev === c.subGrupo ? "" : c.subGrupo
                      )
                    }
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-orange-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {c.subGrupo.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">{c.count}</td>
                    <td className="py-2 px-2 text-right text-slate-600">
                      {formatCOP(c.avgLocal)}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-800">
                      {formatCOP(c.avgRappi)}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-700">
                      {c.avgMarket ? formatCOP(c.avgMarket) : "—"}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold ${diffColor}`}
                      >
                        {c.diffPct >= 0 ? "+" : ""}
                        {formatPct(c.diffPct)}
                      </span>
                    </td>
                    <td className="py-2 pl-2 text-right text-[11px] text-slate-500">
                      {c.baratos > 0 && (
                        <span className="text-emerald-700 mr-2">
                          ↓{c.baratos} subir
                        </span>
                      )}
                      {c.caros > 0 && (
                        <span className="text-rose-700">↑{c.caros} revisar</span>
                      )}
                      {c.baratos === 0 && c.caros === 0 && (
                        <span className="text-slate-400">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de filtros + acción masiva */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto, categoría o nota..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <select
            value={filterSubGrupo}
            onChange={(e) => setFilterSubGrupo(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
          >
            <option value="">Todas las categorías</option>
            {categorySummary.map((c) => (
              <option key={c.subGrupo} value={c.subGrupo}>
                {c.subGrupo.replace(/_/g, " ")} ({c.count})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="BARATO">Debajo del mercado (Subir)</option>
            <option value="ALINEADO">Alineados (±10%)</option>
            <option value="CARO">Arriba del mercado (Revisar)</option>
          </select>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={bulkSaving || sortedRows.length === 0}
          onClick={handleBulkApplyFiltered}
          className="border-orange-300 text-orange-700 hover:bg-orange-50 h-9 text-xs gap-1.5"
        >
          {bulkSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Aplicar sugeridos a filtrados ({sortedRows.filter((r) => r.sugerido && r.sugerido !== r.precioRappi).length})
        </Button>
      </div>

      {/* Tabla detallada por producto */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th
                  onClick={() => handleSort("nombre")}
                  className="py-2.5 px-3 text-left font-semibold cursor-pointer hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1">
                    Producto <SortIcon col="nombre" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("precioLocal")}
                  className="py-2.5 px-2 text-right font-semibold cursor-pointer hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Local <SortIcon col="precioLocal" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("precioRappi")}
                  className="py-2.5 px-2 text-right font-semibold cursor-pointer hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Rappi Actual <SortIcon col="precioRappi" />
                  </span>
                </th>
                <th className="py-2.5 px-2 text-right font-semibold">
                  Rango MDE
                </th>
                <th
                  onClick={() => handleSort("marketAvg")}
                  className="py-2.5 px-2 text-right font-semibold cursor-pointer hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Prom. MDE <SortIcon col="marketAvg" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("diffPct")}
                  className="py-2.5 px-2 text-center font-semibold cursor-pointer hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1 justify-center">
                    vs. Mercado <SortIcon col="diffPct" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("margenRappi")}
                  className="py-2.5 px-2 text-center font-semibold cursor-pointer hover:text-slate-900"
                >
                  <span className="inline-flex items-center gap-1 justify-center">
                    Margen <SortIcon col="margenRappi" />
                  </span>
                </th>
                <th className="py-2.5 px-2 text-right font-semibold">
                  Sugerido
                </th>
                <th className="py-2.5 px-3 text-left font-semibold">
                  Nota Mercado
                </th>
                <th className="py-2.5 px-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((row) => {
                const isSaving = savingId === row.id;
                const alreadySuggested =
                  row.sugerido && row.precioRappi === row.sugerido;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">
                        {row.nombre}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.subGrupoClean.replace(/_/g, " ")}
                        {row.PROYECTO_2 && (
                          <span className="ml-1.5 px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[10px]">
                            P2
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">
                      {formatCOP(row.precioLocal)}
                    </td>

                    <td className="py-2.5 px-2 text-right tabular-nums">
                      <div className="font-semibold text-slate-900">
                        {formatCOP(row.precioRappi)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.precioManual ? "Manual" : `Auto +${aumentoActualPct}%`}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-right text-slate-500 tabular-nums whitespace-nowrap">
                      {row.benchmark
                        ? `${formatCOP(row.benchmark.min)} – ${formatCOP(row.benchmark.max)}`
                        : "—"}
                    </td>

                    <td className="py-2.5 px-2 text-right font-semibold text-slate-800 tabular-nums">
                      {row.benchmark ? formatCOP(row.benchmark.avg) : "—"}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border font-semibold tabular-nums ${
                          STATUS_BADGE[row.status]
                        }`}
                      >
                        {row.diffPct !== null
                          ? `${row.diffPct >= 0 ? "+" : ""}${formatPct(row.diffPct)}`
                          : "—"}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-medium tabular-nums ${colorMargen(
                          row.margenRappi,
                          row.tieneReceta && row.costo > 0
                        )}`}
                      >
                        {row.tieneReceta && row.costo > 0
                          ? formatPct(row.margenRappi)
                          : "N/D"}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-right font-bold text-orange-700 tabular-nums">
                      {row.sugerido ? formatCOP(row.sugerido) : "—"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 max-w-[220px]">
                      {row.benchmark?.nota || "Sin referencia directa"}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {row.sugerido && !alreadySuggested && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSaving}
                            onClick={() => handleApplySuggested(row)}
                            className="h-7 px-2 text-[11px] border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            {isSaving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Aplicar"
                            )}
                          </Button>
                        )}
                        {alreadySuggested && (
                          <span className="text-[11px] text-emerald-600 font-medium px-1.5">
                            ✓ Aplicado
                          </span>
                        )}
                        {row.precioManual && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => handleResetManual(row)}
                            title="Volver al cálculo automático"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="py-10 text-center text-slate-400 text-sm"
                  >
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RappiMercadoTab;
