import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  ExternalLink, RefreshCcw, CheckCircle2, ArrowRight,
  TrendingUp, TrendingDown, Package, Search, Sparkles, X,
  AlertCircle, DollarSign, Database, ShoppingBag
} from "lucide-react";
import { updateItem, getAllFromTable } from "../../../redux/actions";
import { ITEMS, ItemsAlmacen } from "../../../redux/actions-types";
import SupermuMacroModal from "./SupermuMacroModal";

export default function SupermuSyncView({ items = [], onSendToStaging = null }) {
  const dispatch = useDispatch();
  const [productToSync, setProductToSync] = useState(null);
  const [matchedItemId, setMatchedItemId] = useState("");
  const [syncCosto, setSyncCosto] = useState(0);
  const [syncCantidad, setSyncCantidad] = useState(1);
  const [syncUnidades, setSyncUnidades] = useState("und");
  const [isSaving, setIsSaving] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [showMacroModal, setShowMacroModal] = useState(false);

  // Listen for messages from the Supermú iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "SUPERMU_SYNC_PRODUCT") {
        const prod = event.data.product;
        setProductToSync(prod);
        setSyncCosto(Number(prod.price) || 0);

        // Try to infer quantity and units from title (e.g. "500gr", "1kg", "1000ml")
        const title = prod.title || "";
        const gramsMatch = title.match(/(\d+)\s*(gr|g|gramos)/i);
        const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|kilos)/i);
        const mlMatch = title.match(/(\d+)\s*(ml|cc)/i);
        const undMatch = title.match(/(\d+)\s*(und|unid|unidades)/i);

        if (gramsMatch) {
          setSyncCantidad(Number(gramsMatch[1]));
          setSyncUnidades("gr");
        } else if (kgMatch) {
          setSyncCantidad(Number(kgMatch[1]) * 1000);
          setSyncUnidades("gr");
        } else if (mlMatch) {
          setSyncCantidad(Number(mlMatch[1]));
          setSyncUnidades("ml");
        } else if (undMatch) {
          setSyncCantidad(Number(undMatch[1]));
          setSyncUnidades("und");
        } else if (prod.grams && prod.grams > 0) {
          setSyncCantidad(Number(prod.grams));
          setSyncUnidades("gr");
        } else {
          setSyncCantidad(1);
          setSyncUnidades("und");
        }

        // Smart auto-match: find product in inventory with closest title
        const cleanTokens = title
          .toLowerCase()
          .replace(/[^\w\s]/gi, " ")
          .split(/\s+/)
          .filter(t => t.length > 2 && !["de", "la", "el", "los", "las", "con", "por", "para", "und", "gr", "supermu"].includes(t));

        let bestMatch = null;
        let bestScore = 0;

        items.forEach(invItem => {
          const invName = (invItem.Nombre_del_producto || "").toLowerCase();
          let score = 0;
          cleanTokens.forEach(t => {
            if (invName.includes(t)) score += t.length;
          });
          if (score > bestScore) {
            bestScore = score;
            bestMatch = invItem;
          }
        });

        if (bestMatch && bestScore >= 4) {
          setMatchedItemId(bestMatch._id);
        } else {
          setMatchedItemId("");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [items]);

  // Selected item from inventory
  const selectedInventoryItem = useMemo(() => {
    return items.find(i => i._id === matchedItemId) || null;
  }, [items, matchedItemId]);

  // Filtered inventory options for the selector
  const filteredInventoryOptions = useMemo(() => {
    if (!itemSearch) return items.slice(0, 50);
    const q = itemSearch.toLowerCase();
    return items.filter(i => (i.Nombre_del_producto || "").toLowerCase().includes(q)).slice(0, 50);
  }, [items, itemSearch]);

  // Unit price calculation
  const calculatedUnitPrice = useMemo(() => {
    const c = Number(syncCosto);
    const q = Number(syncCantidad);
    if (!q || q <= 0 || isNaN(c)) return c;
    return Math.round((c / q) * 100) / 100;
  }, [syncCosto, syncCantidad]);

  // Price diff comparison
  const priceDiff = useMemo(() => {
    if (!selectedInventoryItem) return null;
    const oldCosto = Number(selectedInventoryItem.COSTO);
    const newCosto = Number(syncCosto);
    if (isNaN(oldCosto) || isNaN(newCosto) || oldCosto === 0) return null;
    const diff = newCosto - oldCosto;
    const pct = ((diff / oldCosto) * 100).toFixed(1);
    const isUp = diff > 0;
    return {
      diff,
      pct,
      isUp,
      formatted: `${isUp ? "+" : ""}$${new Intl.NumberFormat("es-CO").format(diff)} (${isUp ? "+" : ""}${pct}%)`
    };
  }, [selectedInventoryItem, syncCosto]);

  // Handle Sync Save
  const handleConfirmSync = async () => {
    if (!selectedInventoryItem) {
      alert("Por favor selecciona un producto del inventario para sincronizar.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        COSTO: Number(syncCosto),
        CANTIDAD: Number(syncCantidad),
        UNIDADES: syncUnidades,
        precioUnitario: calculatedUnitPrice,
        FECHA_ACT: new Date().toISOString().split("T")[0]
      };

      await dispatch(updateItem(selectedInventoryItem._id, payload, ItemsAlmacen, {
        origen: "Supermú Catálogo Directo",
        tipo: "automático"
      }));

      await dispatch(getAllFromTable(ITEMS));
      alert(`¡Sincronización exitosa!\n\nProducto: ${selectedInventoryItem.Nombre_del_producto}\nNuevo Costo: $${new Intl.NumberFormat("es-CO").format(syncCosto)}\n\nEl cambio se guardó en el inventario y se registró en su historial.`);
      setProductToSync(null);
    } catch (e) {
      console.error(e);
      alert("Error al sincronizar producto: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-185px)] gap-2">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 px-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            Mú
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-xs">Catálogo Directo Supermú</h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                2.661 productos extraídos
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Haz clic en <strong>"Sincronizar a Inventario"</strong> en cualquier producto para actualizar precios automáticamente registrando el log.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMacroModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-700 hover:to-amber-700 text-white rounded-lg text-xs font-extrabold shadow-sm hover:shadow transition-all"
            title="Comparar y sincronizar masivamente todo el almacén con Supermú"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Macro Match Automático</span>
          </button>

          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Recargar iframe"
          >
            <RefreshCcw className="h-3 w-3" />
            Recargar
          </button>

          <button
            onClick={() => window.open("/supermu_viewer/index.html", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <span>Abrir en Pestaña Externa</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Embedded Supermú Viewer iframe */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
        <iframe
          key={iframeKey}
          src="/supermu_viewer/index.html"
          title="Supermú Viewer"
          className="w-full h-full border-0"
        />
      </div>

      {/* Direct Sync Modal */}
      {productToSync && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                    Sincronización Directa de Precio
                  </h3>
                  <p className="text-xs text-slate-300 truncate max-w-[380px]">
                    Supermú ➔ Base de Datos Inventario
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProductToSync(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              
              {/* Product Extracted from Supermú */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 flex gap-3 items-center">
                {productToSync.image && (
                  <img
                    src={productToSync.image}
                    alt={productToSync.title}
                    className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-rose-200 flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Producto Supermú (Shopify)</div>
                  <div className="font-bold text-slate-900 text-xs truncate" title={productToSync.title}>
                    {productToSync.title}
                  </div>
                  <div className="text-sm font-extrabold text-rose-600 mt-0.5">
                    ${new Intl.NumberFormat("es-CO").format(productToSync.price || 0)} COP
                  </div>
                </div>
              </div>

              {/* Match with Inventory Item */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Vincular con Producto del Inventario</span>
                  {selectedInventoryItem && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Vinculado
                    </span>
                  )}
                </label>

                {/* Search in Inventory */}
                <div className="relative mb-1">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre en inventario..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <select
                  value={matchedItemId}
                  onChange={(e) => setMatchedItemId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- Selecciona el ítem del inventario --</option>
                  {filteredInventoryOptions.map(invItem => (
                    <option key={invItem._id} value={invItem._id}>
                      {invItem.Nombre_del_producto} (Costo actual: ${new Intl.NumberFormat("es-CO").format(invItem.COSTO || 0)} - {invItem.GRUPO})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Diff Card */}
              {selectedInventoryItem && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Comparación de Costos</div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400">Costo Actual en BD</div>
                      <div className="text-xs font-bold text-slate-600 line-through">
                        ${new Intl.NumberFormat("es-CO").format(selectedInventoryItem.COSTO || 0)}
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-300" />

                    <div>
                      <div className="text-[10px] text-rose-600 font-bold">Nuevo Costo Supermú</div>
                      <div className="text-sm font-black text-rose-700">
                        ${new Intl.NumberFormat("es-CO").format(syncCosto || 0)}
                      </div>
                    </div>

                    {priceDiff && (
                      <div className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                        priceDiff.isUp ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}>
                        {priceDiff.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {priceDiff.formatted}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Edit parameters before save */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Costo ($)</label>
                  <input
                    type="number"
                    value={syncCosto}
                    onChange={(e) => setSyncCosto(Number(e.target.value))}
                    className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={syncCantidad}
                    onChange={(e) => setSyncCantidad(Number(e.target.value))}
                    className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unidades</label>
                  <input
                    type="text"
                    value={syncUnidades}
                    onChange={(e) => setSyncUnidades(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center"
                    placeholder="gr, ml, und..."
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <span>
                  Al guardar, se actualizará el ítem en Supabase y se registrará un nuevo log acumulado con origen <strong>"Supermú Catálogo Directo"</strong> y tipo <strong>"automático"</strong>.
                </span>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
              <button
                onClick={() => setProductToSync(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedInventoryItem || isSaving}
                onClick={handleConfirmSync}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? "Guardando..." : "Confirmar y Sincronizar"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Supermú Macro Matching Modal */}
      <SupermuMacroModal
        isOpen={showMacroModal}
        onClose={() => setShowMacroModal(false)}
        inventoryItems={items}
        onSendToStaging={onSendToStaging}
      />

    </div>
  );
}
