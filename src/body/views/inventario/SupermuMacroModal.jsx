import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Sparkles, X, CheckSquare, Square, ExternalLink, ArrowRight,
  TrendingUp, TrendingDown, RefreshCw, CheckCircle2, AlertTriangle,
  Search, Sliders, ChevronDown, Save, Eye, ArrowUpRight
} from "lucide-react";
import {
  getSupermuCatalog,
  autoMatchInventory,
  findCandidatesForItem,
  buildProposedStagedItem,
  parseUnitsAndQuantity
} from "../../../utils/supermuMatcher";
import { updateItem, getAllFromTable } from "../../../redux/actions";
import { ITEMS, ItemsAlmacen } from "../../../redux/actions-types";

export default function SupermuMacroModal({
  isOpen,
  onClose,
  inventoryItems = [],
  onSendToStaging = null // If provided, allows sending items to Col 3
}) {
  const dispatch = useDispatch();
  const [catalog, setCatalog] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.55); // 55%
  const [selectedMatchIds, setSelectedMatchIds] = useState(new Set());
  const [filterType, setFilterType] = useState("all"); // "all" | "cheaper" | "pricier" | "perfect" | "unmatched"
  const [searchTerm, setSearchTerm] = useState("");
  const [isSavingDirectly, setIsSavingDirectly] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [customMatches, setCustomMatches] = useState({}); // itemId -> chosen supermuProduct

  // Load catalog on mount
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingCatalog(true);

    getSupermuCatalog().then((data) => {
      if (isMounted) {
        setCatalog(data);
        setIsLoadingCatalog(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Run auto-match whenever catalog or inventory changes
  const matchResult = useMemo(() => {
    if (!catalog.length || !inventoryItems.length) {
      return { matches: [], unmatched: [], summary: {} };
    }
    const res = autoMatchInventory(inventoryItems, catalog, minConfidence);

    // Apply any manual custom selection overridden by user
    const updatedMatches = res.matches.map((m) => {
      const customProd = customMatches[m.item._id];
      if (customProd) {
        const proposed = buildProposedStagedItem(m.item, customProd);
        const oldCosto = Number(m.item.COSTO) || 0;
        const newCosto = proposed.COSTO;
        const diff = newCosto - oldCosto;
        const pctDiff = oldCosto > 0 ? ((diff / oldCosto) * 100).toFixed(1) : null;
        return {
          ...m,
          bestProduct: customProd,
          proposed,
          newCosto,
          diff,
          pctDiff,
          isUp: diff > 0,
          isDown: diff < 0
        };
      }
      return m;
    });

    return {
      ...res,
      matches: updatedMatches
    };
  }, [catalog, inventoryItems, minConfidence, customMatches]);

  // Default select all matches when first computed
  useEffect(() => {
    if (matchResult.matches.length > 0) {
      setSelectedMatchIds(new Set(matchResult.matches.map((m) => m.item._id)));
    }
  }, [matchResult.matches.length]);

  // Toggle selection for an item
  const handleToggleSelect = (id) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedMatchIds(new Set(filteredMatches.map((m) => m.item._id)));
  };

  const handleDeselectAll = () => {
    setSelectedMatchIds(new Set());
  };

  // Filtered rows
  const filteredMatches = useMemo(() => {
    let list = matchResult.matches || [];

    if (filterType === "cheaper") {
      list = list.filter((m) => m.isDown);
    } else if (filterType === "pricier") {
      list = list.filter((m) => m.isUp);
    } else if (filterType === "perfect") {
      list = list.filter((m) => m.score >= 90);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          (m.item.Nombre_del_producto || "").toLowerCase().includes(q) ||
          (m.bestProduct?.title || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [matchResult.matches, filterType, searchTerm]);

  // Handle alternative candidate selection
  const handleSelectAlternative = (itemId, prod) => {
    setCustomMatches((prev) => ({
      ...prev,
      [itemId]: prod
    }));
  };

  // Save selected directly to Supabase
  const handleSaveDirect = async () => {
    const selectedMatches = matchResult.matches.filter((m) =>
      selectedMatchIds.has(m.item._id)
    );

    if (selectedMatches.length === 0) {
      alert("No has seleccionado ningún ítem para sincronizar.");
      return;
    }

    const confirmMsg = `¿Deseas aplicar los precios de Supermú a los ${selectedMatches.length} productos seleccionados?\n\nEsta acción actualizará COSTO, CANTIDAD, UNIDADES, precioUnitario y registrará auditoría automática en el historial.`;
    if (!window.confirm(confirmMsg)) return;

    setIsSavingDirectly(true);
    setSaveProgress({ current: 0, total: selectedMatches.length });

    try {
      let done = 0;
      for (const m of selectedMatches) {
        const payload = {
          COSTO: Number(m.proposed.COSTO),
          CANTIDAD: Number(m.proposed.CANTIDAD),
          UNIDADES: m.proposed.UNIDADES,
          precioUnitario: Number(m.proposed.precioUnitario),
          FECHA_ACT: m.proposed.FECHA_ACT
        };

        await dispatch(
          updateItem(m.item._id, payload, ItemsAlmacen, {
            origen: "Macro Match Supermú",
            tipo: "automático",
            supermu_product_title: m.bestProduct.title,
            supermu_sku: m.bestProduct.sku
          })
        );

        done++;
        setSaveProgress({ current: done, total: selectedMatches.length });
      }

      await dispatch(getAllFromTable(ITEMS));
      alert(`¡Sincronización masiva exitosa!\nSe actualizaron ${done} ítems en Almacén.`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al guardar ítems: " + err.message);
    } finally {
      setIsSavingDirectly(false);
    }
  };

  // Send selected to Staging (Columna 3 de Gestión de Precios)
  const handleSendToStagingClick = () => {
    const selectedMatches = matchResult.matches.filter((m) =>
      selectedMatchIds.has(m.item._id)
    );

    if (selectedMatches.length === 0) {
      alert("Por favor selecciona al menos un ítem.");
      return;
    }

    if (onSendToStaging) {
      const stagedList = selectedMatches.map((m) => m.proposed);
      onSendToStaging(stagedList);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-slate-800 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md border border-rose-400/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide uppercase text-rose-200">
                  Macro Sincronizador Automático Supermú
                </h2>
                <span className="text-[10px] bg-rose-500/30 text-rose-200 font-bold px-2 py-0.5 rounded-full border border-rose-400/30">
                  2.661 Productos Shopify
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Coincide de forma inteligente los ítems de Almacén con los precios oficiales de Supermú por nombre y presentación.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoadingCatalog ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 text-rose-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">
              Cargando catálogo Supermú (2.661 productos)...
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 p-4 gap-3 bg-slate-50/50">
            {/* KPI Cards & Filters Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 flex-shrink-0">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total Ítems</div>
                  <div className="text-lg font-extrabold text-slate-800">{inventoryItems.length}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">100%</div>
              </div>

              <div
                onClick={() => setFilterType("all")}
                className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all ${
                  filterType === "all"
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200"
                    : "bg-white border-slate-200 hover:border-rose-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-rose-700 flex items-center justify-between">
                  <span>Coincidencias</span>
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="text-lg font-extrabold text-rose-600">{matchResult.matches.length}</div>
              </div>

              <div
                onClick={() => setFilterType("cheaper")}
                className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all ${
                  filterType === "cheaper"
                    ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
                    : "bg-white border-slate-200 hover:border-emerald-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-emerald-700 flex items-center justify-between">
                  <span>Bajan de Costo</span>
                  <TrendingDown className="h-3 w-3" />
                </div>
                <div className="text-lg font-extrabold text-emerald-600">{matchResult.summary.bajaron || 0}</div>
              </div>

              <div
                onClick={() => setFilterType("pricier")}
                className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all ${
                  filterType === "pricier"
                    ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
                    : "bg-white border-slate-200 hover:border-amber-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-amber-700 flex items-center justify-between">
                  <span>Suben de Costo</span>
                  <TrendingUp className="h-3 w-3" />
                </div>
                <div className="text-lg font-extrabold text-amber-600">{matchResult.summary.subieron || 0}</div>
              </div>

              <div
                onClick={() => setFilterType("perfect")}
                className={`p-3 rounded-xl border shadow-xs cursor-pointer transition-all ${
                  filterType === "perfect"
                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                    : "bg-white border-slate-200 hover:border-blue-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-blue-700 flex items-center justify-between">
                  <span>Match Alto (&gt;90%)</span>
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div className="text-lg font-extrabold text-blue-600">
                  {matchResult.matches.filter((m) => m.score >= 90).length}
                </div>
              </div>
            </div>

            {/* Filter and Sensitivity Controls */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre de ítem o producto Supermú..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  <Sliders className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-600">Sensibilidad:</span>
                  <input
                    type="range"
                    min="0.4"
                    max="0.8"
                    step="0.05"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-20 accent-rose-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-rose-600 min-w-[32px]">
                    {Math.round(minConfidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Seleccionar Todos ({filteredMatches.length})
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Deseleccionar
                </button>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Seleccionados: <strong>{selectedMatchIds.size}</strong>
                </span>
              </div>
            </div>

            {/* Results Table */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-0">
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={filteredMatches.length > 0 && filteredMatches.every((m) => selectedMatchIds.has(m.item._id))}
                          onChange={(e) => {
                            if (e.target.checked) handleSelectAll();
                            else handleDeselectAll();
                          }}
                          className="rounded accent-rose-600 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">Ítem en Almacén</th>
                      <th className="py-2.5 px-3">Producto Coincidente en Supermú</th>
                      <th className="py-2.5 px-3 text-right">Costo Actual</th>
                      <th className="py-2.5 px-3 text-right">Costo Supermú</th>
                      <th className="py-2.5 px-3 text-right">Variación</th>
                      <th className="py-2.5 px-3 text-center">Presentación</th>
                      <th className="py-2.5 px-3 text-center">Confianza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMatches.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          No se encontraron coincidencias con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredMatches.map((m) => {
                        const isSelected = selectedMatchIds.has(m.item._id);
                        const p = m.bestProduct;

                        return (
                          <tr
                            key={m.item._id}
                            className={`hover:bg-rose-50/30 transition-colors ${
                              isSelected ? "bg-rose-50/20" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(m.item._id)}
                                className="rounded accent-rose-600 cursor-pointer"
                              />
                            </td>

                            {/* Inventory Item */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800">{m.item.Nombre_del_producto}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium">{m.item.GRUPO || "Sin grupo"}</span>
                                <span>•</span>
                                <span>{m.item.CANTIDAD} {m.item.UNIDADES}</span>
                              </div>
                            </td>

                            {/* Supermu Match */}
                            <td className="py-2.5 px-3 max-w-[340px]">
                              <div className="flex items-center gap-2.5">
                                {p.image && (
                                  <img
                                    src={p.image}
                                    alt={p.title}
                                    className="w-9 h-9 object-contain rounded-md border border-slate-200 bg-white p-0.5 flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-900 truncate text-[11px]" title={p.title}>
                                      {p.title}
                                    </span>
                                    {p.url && (
                                      <a
                                        href={p.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-rose-600 flex-shrink-0"
                                        title="Abrir en Supermú"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>

                                  {/* If there are multiple candidates, allow switching */}
                                  {m.candidates && m.candidates.length > 1 && (
                                    <div className="mt-1">
                                      <select
                                        value={p.id}
                                        onChange={(e) => {
                                          const chosen = m.candidates.find(
                                            (c) => String(c.product.id) === e.target.value
                                          );
                                          if (chosen) handleSelectAlternative(m.item._id, chosen.product);
                                        }}
                                        className="text-[10px] p-0.5 border border-slate-200 rounded bg-slate-50 text-slate-700 max-w-full truncate"
                                      >
                                        {m.candidates.map((c) => (
                                          <option key={c.product.id} value={c.product.id}>
                                            {c.score}%: {c.product.title} (${new Intl.NumberFormat("es-CO").format(c.product.price)})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Old Cost */}
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              ${new Intl.NumberFormat("es-CO").format(m.oldCosto || 0)}
                            </td>

                            {/* New Cost */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ${new Intl.NumberFormat("es-CO").format(m.newCosto || 0)}
                            </td>

                            {/* Diff */}
                            <td className="py-2.5 px-3 text-right">
                              {m.diff !== 0 ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    m.isDown
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                                  }`}
                                >
                                  {m.isDown ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                  {m.isUp ? "+" : ""}${new Intl.NumberFormat("es-CO").format(m.diff)}
                                  {m.pctDiff && ` (${m.isUp ? "+" : ""}${m.pctDiff}%)`}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">= Sin cambio</span>
                              )}
                            </td>

                            {/* Presentation Parsed */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {m.proposed.CANTIDAD} {m.proposed.UNIDADES}
                              </span>
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                ${new Intl.NumberFormat("es-CO").format(m.proposed.precioUnitario)}/{m.proposed.UNIDADES}
                              </div>
                            </td>

                            {/* Match Confidence Score */}
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                                  m.score >= 90
                                    ? "bg-emerald-100 text-emerald-800"
                                    : m.score >= 70
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {m.score}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-shrink-0">
              <div className="text-xs text-slate-500">
                {isSavingDirectly ? (
                  <span className="font-bold text-rose-600 animate-pulse">
                    Guardando {saveProgress.current} de {saveProgress.total} ítems en Supabase...
                  </span>
                ) : (
                  <span>
                    <strong>{selectedMatchIds.size}</strong> ítems listos para sincronizar de un total de{" "}
                    <strong>{matchResult.matches.length}</strong> encontrados.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {onSendToStaging && (
                  <button
                    onClick={handleSendToStagingClick}
                    disabled={selectedMatchIds.size === 0 || isSavingDirectly}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    <span>Enviar a Revisión (Gestión de Precios)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={handleSaveDirect}
                  disabled={selectedMatchIds.size === 0 || isSavingDirectly}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {isSavingDirectly ? "Guardando..." : `Guardar Directamente (${selectedMatchIds.size})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
