import React, { useState, useEffect, useMemo } from "react";
import {
  Store, Calendar, Globe, Plus, ArrowRight, CheckCircle2,
  Clock, TrendingUp, TrendingDown, Search, Sparkles, AlertTriangle,
  RefreshCcw, Terminal, FileJson, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  parseExtractToProducts,
  matchDetectedProductToAlmacen,
  buildStagedFromHistoricalRow,
  fetchCapturasByProveedor,
  fetchProductosByCaptura,
  fetchItemTimeSeries,
  saveProviderCapture,
  safeNumber,
} from "../../../utils/providerSnapshotUtils";

export default function ProveedorHistorialView({
  proveedores = [],
  items = [],
  onSendToStaging,
}) {
  const [selectedProveedorId, setSelectedProveedorId] = useState("TODOS");
  const [capturas, setCapturas] = useState([]);
  const [selectedCaptura, setSelectedCaptura] = useState(null);
  const [capturaProductos, setCapturaProductos] = useState([]);
  const [loadingCapturas, setLoadingCapturas] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [tableMissingError, setTableMissingError] = useState(false);

  // Serie de precios por producto en el tiempo
  const [selectedItemIdForSeries, setSelectedItemIdForSeries] = useState("");
  const [timeSeries, setTimeSeries] = useState([]);

  // Formulario de nueva captura
  const [showNewForm, setShowNewForm] = useState(false);
  const [formProveedorId, setFormProveedorId] = useState("");
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().slice(0, 16));
  const [formMetodo, setFormMetodo] = useState("agent-reach");
  const [formUrl, setFormUrl] = useState("");
  const [formNotas, setFormNotas] = useState("");
  const [formRawExtract, setFormRawExtract] = useState("");
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isSavingCapture, setIsSavingCapture] = useState(false);

  const proveedoresSorted = useMemo(() => {
    return [...proveedores].sort((a, b) => {
      const webA = (a.PAGINA_WEB || "").trim() ? 0 : 1;
      const webB = (b.PAGINA_WEB || "").trim() ? 0 : 1;
      if (webA !== webB) return webA - webB;
      return (a.Nombre_Proveedor || "").localeCompare(b.Nombre_Proveedor || "");
    });
  }, [proveedores]);

  const proveedorMap = useMemo(() => {
    const map = {};
    proveedores.forEach((p) => {
      map[p._id] = p;
    });
    return map;
  }, [proveedores]);

  const itemMap = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      map[i._id] = i;
    });
    return map;
  }, [items]);

  const loadCapturas = async (provId = selectedProveedorId) => {
    setLoadingCapturas(true);
    setTableMissingError(false);
    try {
      const data = await fetchCapturasByProveedor(provId);
      setCapturas(data);
      if (data.length > 0) {
        setSelectedCaptura((prev) =>
          prev && data.some((c) => c._id === prev._id) ? prev : data[0]
        );
      } else {
        setSelectedCaptura(null);
        setCapturaProductos([]);
      }
    } catch (err) {
      if (err?.code === "42P01" || err?.message?.includes("CapturasProveedor")) {
        setTableMissingError(true);
      } else {
        console.error("Error cargando capturas:", err);
      }
      setCapturas([]);
    } finally {
      setLoadingCapturas(false);
    }
  };

  useEffect(() => {
    loadCapturas(selectedProveedorId);
  }, [selectedProveedorId]);

  useEffect(() => {
    if (!selectedCaptura?._id) {
      setCapturaProductos([]);
      return;
    }
    setLoadingProductos(true);
    fetchProductosByCaptura(selectedCaptura._id)
      .then((rows) => setCapturaProductos(rows))
      .catch((err) => console.error("Error cargando productos de captura:", err))
      .finally(() => setLoadingProductos(false));
  }, [selectedCaptura?._id]);

  useEffect(() => {
    if (!selectedItemIdForSeries) {
      setTimeSeries([]);
      return;
    }
    fetchItemTimeSeries(selectedProveedorId, selectedItemIdForSeries)
      .then((rows) => setTimeSeries(rows))
      .catch((err) => console.error("Error cargando serie de precios:", err));
  }, [selectedItemIdForSeries, selectedProveedorId]);

  const handleSelectFormProveedor = (provId) => {
    setFormProveedorId(provId);
    const prov = proveedorMap[provId];
    setFormUrl((prov?.PAGINA_WEB || "").trim());
  };

  const handleParsePreview = () => {
    const rawProducts = parseExtractToProducts(formRawExtract);
    const enriched = rawProducts.map((p, idx) => {
      const match = matchDetectedProductToAlmacen(p.nombre_detectado, items);
      return {
        ...p,
        _idx: idx,
        item_id: match?.item?._id || "",
        _matchScore: match?.score || 0,
      };
    });
    setParsedPreview(enriched);
  };

  const handleSaveNewCapture = async () => {
    if (!formProveedorId) return alert("Selecciona un proveedor.");
    if (parsedPreview.length === 0) return alert("Procesa al menos 1 producto antes de guardar.");

    setIsSavingCapture(true);
    try {
      const saved = await saveProviderCapture({
        proveedorId: formProveedorId,
        fechaCaptura: formFecha,
        urlFuente: formUrl,
        metodo: formMetodo,
        extractoRaw: formRawExtract,
        notas: formNotas,
        productos: parsedPreview,
      });
      setShowNewForm(false);
      setFormRawExtract("");
      setParsedPreview([]);
      setSelectedProveedorId(formProveedorId);
      await loadCapturas(formProveedorId);
      setSelectedCaptura(saved);
    } catch (err) {
      console.error("Error guardando captura:", err);
      alert("Error al guardar en Supabase: " + (err?.message || "Verifica la migración SQL."));
    } finally {
      setIsSavingCapture(false);
    }
  };

  const handleSendCaptureToStaging = () => {
    if (!onSendToStaging || !selectedCaptura) return;
    const provName = proveedorMap[selectedCaptura.proveedor_id]?.Nombre_Proveedor || "Proveedor";

    const staged = capturaProductos
      .filter((row) => row.item_id && itemMap[row.item_id])
      .map((row) =>
        buildStagedFromHistoricalRow(
          itemMap[row.item_id],
          { ...row, _metodo: selectedCaptura.metodo },
          provName
        )
      );

    if (staged.length === 0) {
      alert("No hay productos en esta captura vinculados a un ítem de ItemsAlmacen.");
      return;
    }

    onSendToStaging(staged);
  };

  const matchedCountInCapture = capturaProductos.filter((r) => r.item_id && itemMap[r.item_id]).length;

  return (
    <div className="flex flex-col gap-3 min-h-[calc(100vh-195px)] text-xs">
      {tableMissingError && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Falta crear las tablas de historial en Supabase</p>
            <p className="text-[11px] mt-0.5">
              Ejecuta el script <code className="bg-amber-100 px-1 rounded">src/supaBaseRows/create_historial_precios_proveedor.sql</code> en el SQL Editor de Supabase para habilitar{" "}
              <strong>CapturasProveedor</strong> y <strong>PreciosHistoricosProducto</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Top Bar: Selector de Proveedor + Botón Nueva Captura */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Store className="h-4 w-4 text-indigo-600" />
          <span className="font-bold text-slate-700">Proveedor / Tienda:</span>
          <select
            className="h-8 text-xs border border-slate-300 rounded-lg px-2 bg-white font-medium min-w-[240px]"
            value={selectedProveedorId}
            onChange={(e) => setSelectedProveedorId(e.target.value)}
          >
            <option value="TODOS">Todos los proveedores</option>
            {proveedoresSorted.map((p) => (
              <option key={p._id} value={p._id}>
                {p.Nombre_Proveedor} {p.PAGINA_WEB?.trim() ? `(${p.PAGINA_WEB.trim()})` : ""}
              </option>
            ))}
          </select>

          {selectedProveedorId !== "TODOS" && proveedorMap[selectedProveedorId]?.PAGINA_WEB?.trim() && (
            <a
              href={proveedorMap[selectedProveedorId].PAGINA_WEB.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200"
            >
              <Globe className="h-3 w-3" />
              {proveedorMap[selectedProveedorId].PAGINA_WEB.trim()}
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCapturas(selectedProveedorId)}
            className="h-8 text-xs"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
            Recargar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (selectedProveedorId !== "TODOS") {
                handleSelectFormProveedor(selectedProveedorId);
              }
              setShowNewForm((v) => !v);
            }}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {showNewForm ? "Cerrar Captura" : "Registrar Captura (Agent Reach / Screenshot)"}
          </Button>
        </div>
      </div>

      {/* Modal / Panel inline para registrar nueva captura de precios */}
      {showNewForm && (
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-indigo-600" />
              Nuevo Momento en el Tiempo (Captura de Proveedor)
            </h3>
            <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-mono">
              CLI: python scraper/agent_reach_sync.py --proveedor-id {formProveedorId || "<uuid>"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Proveedor</label>
              <select
                className="w-full h-8 text-xs border border-slate-300 rounded-md px-2 bg-white"
                value={formProveedorId}
                onChange={(e) => handleSelectFormProveedor(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {proveedoresSorted.map((p) => (
                  <option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Fecha / Hora</label>
              <Input
                type="datetime-local"
                className="h-8 text-xs bg-white"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Método</label>
              <select
                className="w-full h-8 text-xs border border-slate-300 rounded-md px-2 bg-white"
                value={formMetodo}
                onChange={(e) => setFormMetodo(e.target.value)}
              >
                <option value="agent-reach">Agent Reach (Web/Extracto)</option>
                <option value="screenshot">Screenshot (Visión / OCR)</option>
                <option value="supermu_json">Catálogo Supermú JSON</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">URL Fuente</label>
              <Input
                className="h-8 text-xs bg-white"
                placeholder="https://..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Pega aquí el resultado de Agent Reach (JSON o texto/Markdown con precios) o el JSON extraído del Screenshot
            </label>
            <Textarea
              rows={4}
              className="text-xs font-mono bg-white"
              placeholder='Ej: [{"nombre":"Queso Mozzarella 500gr","precio":21400}] o líneas tipo "Queso Mozzarella 500gr - $21.400"'
              value={formRawExtract}
              onChange={(e) => setFormRawExtract(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Input
              className="h-8 text-xs bg-white max-w-md"
              placeholder="Notas opcionales (ej. Promoción fin de semana)"
              value={formNotas}
              onChange={(e) => setFormNotas(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleParsePreview} className="h-8 text-xs">
                <FileJson className="h-3.5 w-3.5 mr-1" />
                Detectar Productos ({parsedPreview.length})
              </Button>
              <Button
                size="sm"
                disabled={isSavingCapture || parsedPreview.length === 0 || !formProveedorId}
                onClick={handleSaveNewCapture}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSavingCapture ? "Guardando..." : "Guardar Momento en Supabase"}
              </Button>
            </div>
          </div>

          {parsedPreview.length > 0 && (
            <div className="bg-white border border-indigo-200 rounded-lg max-h-48 overflow-y-auto p-2">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-1 px-1">Detectado</th>
                    <th className="py-1 px-1">Precio</th>
                    <th className="py-1 px-1">Cant/Und</th>
                    <th className="py-1 px-1">P. Unitario</th>
                    <th className="py-1 px-1">Empate en Almacén</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPreview.map((row) => (
                    <tr key={row._idx} className="border-b last:border-0">
                      <td className="py-1 px-1 font-medium">{row.nombre_detectado}</td>
                      <td className="py-1 px-1 font-mono">${new Intl.NumberFormat("es-CO").format(row.precio_total)}</td>
                      <td className="py-1 px-1">{row.cantidad} {row.unidad}</td>
                      <td className="py-1 px-1 font-mono">${row.precio_unitario}</td>
                      <td className="py-1 px-1">
                        <select
                          className="h-6 text-[10px] border rounded px-1 max-w-[200px]"
                          value={row.item_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedPreview((prev) =>
                              prev.map((r) => (r._idx === row._idx ? { ...r, item_id: val } : r))
                            );
                          }}
                        >
                          <option value="">-- Sin empatar --</option>
                          {items.map((it) => (
                            <option key={it._id} value={it._id}>{it.Nombre_del_producto}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main 3-panel body: Timeline | Capture Detail | Item Price Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Col 1: Capturas en el tiempo (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              Capturas ({capturas.length})
            </h3>
          </div>

          {loadingCapturas ? (
            <div className="text-slate-400 text-center py-8">Cargando historial...</div>
          ) : capturas.length === 0 ? (
            <div className="text-slate-400 text-center py-8 px-2">
              No hay capturas registradas para este filtro todavía.
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {capturas.map((cap) => {
                const isActive = selectedCaptura?._id === cap._id;
                const provName = proveedorMap[cap.proveedor_id]?.Nombre_Proveedor || "Proveedor";
                return (
                  <button
                    key={cap._id}
                    type="button"
                    onClick={() => setSelectedCaptura(cap)}
                    className={`w-full text-left p-2 rounded-lg border transition-all ${
                      isActive
                        ? "bg-indigo-50 border-indigo-400 shadow-xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-800 truncate">{provName}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          cap.estado === "aplicado"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {cap.estado}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(cap.fecha_captura).toLocaleString("es-CO")}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-600">
                      <span className="bg-white px-1.5 py-0.2 rounded border">{cap.metodo}</span>
                      <span><strong>{cap.total_productos}</strong> productos</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Col 2: Productos detectados en la captura seleccionada (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                Detalle de Captura
              </h3>
              {selectedCaptura && (
                <p className="text-[10px] text-slate-500 truncate max-w-[360px]">
                  {selectedCaptura.url_fuente || "Sin URL"}
                </p>
              )}
            </div>

            {selectedCaptura && (
              <Button
                size="sm"
                disabled={matchedCountInCapture === 0}
                onClick={handleSendCaptureToStaging}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Llevar {matchedCountInCapture} a Actualización Masiva
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {loadingProductos ? (
            <div className="text-slate-400 text-center py-8">Cargando productos...</div>
          ) : !selectedCaptura ? (
            <div className="text-slate-400 text-center py-8">Selecciona una captura de la izquierda.</div>
          ) : (
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-slate-50 border-b text-slate-500">
                  <tr className="text-left">
                    <th className="py-1.5 px-1.5">Producto Detectado</th>
                    <th className="py-1.5 px-1.5">Precio / Und</th>
                    <th className="py-1.5 px-1.5">Almacén Actual</th>
                    <th className="py-1.5 px-1.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {capturaProductos.map((row) => {
                    const inv = row.item_id ? itemMap[row.item_id] : null;
                    const invUnit = inv ? safeNumber(inv.precioUnitario, 0) : 0;
                    const diffUnit = invUnit > 0 ? row.precio_unitario - invUnit : 0;

                    return (
                      <tr
                        key={row._id}
                        onClick={() => row.item_id && setSelectedItemIdForSeries(row.item_id)}
                        className={`border-b last:border-0 cursor-pointer hover:bg-indigo-50/40 ${
                          selectedItemIdForSeries === row.item_id && row.item_id ? "bg-indigo-50/70" : ""
                        }`}
                      >
                        <td className="py-1.5 px-1.5">
                          <div className="font-semibold text-slate-800">{row.nombre_detectado}</div>
                          <div className="text-[10px] text-slate-400">
                            {row.cantidad} {row.unidad}
                          </div>
                        </td>
                        <td className="py-1.5 px-1.5 font-mono">
                          <div className="font-bold">${new Intl.NumberFormat("es-CO").format(row.precio_total)}</div>
                          <div className="text-[10px] text-slate-500">${row.precio_unitario}/{row.unidad}</div>
                        </td>
                        <td className="py-1.5 px-1.5">
                          {inv ? (
                            <div>
                              <div className="font-medium text-indigo-700 truncate max-w-[160px]">
                                {inv.Nombre_del_producto}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                ${new Intl.NumberFormat("es-CO").format(safeNumber(inv.COSTO, 0))} (${invUnit}/u)
                                {diffUnit !== 0 && (
                                  <span className={diffUnit > 0 ? "text-red-600 ml-1" : "text-emerald-600 ml-1"}>
                                    {diffUnit > 0 ? "▲" : "▼"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin empatar</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1.5">
                          {row.aplicado_a_almacen ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Aplicado
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Col 3: Comportamiento en el tiempo del producto seleccionado (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col min-h-[300px]">
          <div className="pb-1.5 border-b mb-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
              Comportamiento en el Tiempo
            </h3>
            <select
              className="mt-1.5 w-full h-7 text-[11px] border border-slate-300 rounded px-1.5 bg-white"
              value={selectedItemIdForSeries}
              onChange={(e) => setSelectedItemIdForSeries(e.target.value)}
            >
              <option value="">Selecciona un ítem de almacén...</option>
              {items.map((it) => (
                <option key={it._id} value={it._id}>{it.Nombre_del_producto}</option>
              ))}
            </select>
          </div>

          {!selectedItemIdForSeries ? (
            <div className="text-slate-400 text-center py-8 px-2">
              Haz clic en un producto empatado o elígelo arriba para ver su historial de precios indexado por fecha.
            </div>
          ) : timeSeries.length === 0 ? (
            <div className="text-slate-400 text-center py-8 px-2">
              Sin registros históricos en capturas de proveedor para este ítem.
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {timeSeries.map((pt, idx) => {
                const prev = idx > 0 ? timeSeries[idx - 1] : null;
                const diff = prev ? pt.precio_unitario - prev.precio_unitario : 0;
                const provName = proveedorMap[pt.proveedor_id]?.Nombre_Proveedor || "Proveedor";
                return (
                  <div key={pt._id} className="p-2 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(pt.fecha_captura).toLocaleDateString("es-CO")}</span>
                      <span className="font-bold text-slate-700 truncate max-w-[110px]">{provName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold font-mono text-slate-800">
                        ${new Intl.NumberFormat("es-CO").format(pt.precio_total)}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700">
                        ${pt.precio_unitario}/{pt.unidad}
                        {diff !== 0 && (
                          <span className={diff > 0 ? "text-red-600 ml-1" : "text-emerald-600 ml-1"}>
                            ({diff > 0 ? "+" : ""}{diff.toFixed(1)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
