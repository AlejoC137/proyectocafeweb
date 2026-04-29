import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, updateItem, actualizarPrecioUnitario, calcularPrecioUnitario } from "../../../redux/actions";
import { ITEMS, CATEGORIES, unidades, BODEGA, ESTATUS, PROVEE } from "../../../redux/actions-types";
import { X, Package, BookOpen, Edit, Save, Loader2, FileJson, Copy, Check, RefreshCw, Printer, Tag, MapPin, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyPromptToClipboard } from "../../../utils/prompts";

const ItemsModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);

  const items = useSelector((state) => state.allItems || []);
  const proveedores = useSelector((state) => state.Proveedores || []);
  const [editableItem, setEditableItem] = useState(null);
  const [displayItem, setDisplayItem] = useState(null);

  const safeJsonParse = (jsonString, fallback) => {
    if (jsonString && typeof jsonString === "string") {
      try { return JSON.parse(jsonString); } catch (e) { console.warn("[safeJsonParse] Error:", e.message); }
    }
    return fallback;
  };

  const itemToEditable = (item) => {
    const parsedStock = safeJsonParse(item.STOCK, { minimo: 0, maximo: 0, actual: 0 });
    const parsedAlmacen = safeJsonParse(item.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });
    return {
      ...item,
      stock_minimo: parsedStock.minimo ?? 0,
      stock_maximo: parsedStock.maximo ?? 0,
      stock_actual: parsedStock.actual ?? 0,
      almacenamiento_ALMACENAMIENTO: parsedAlmacen.ALMACENAMIENTO ?? "",
      almacenamiento_BODEGA: parsedAlmacen.BODEGA ?? "",
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const promises = [];
      if (items.length === 0) promises.push(dispatch(getAllFromTable(ITEMS)));
      if (proveedores.length === 0) promises.push(dispatch(getAllFromTable(PROVEE)));
      try { await Promise.all(promises); }
      catch (error) { console.error("[ItemsModal] Error loading data:", error); }
      finally { setLoading(false); }
    };
    loadData();
  }, [dispatch, items.length, proveedores.length]);

  const originalItem = useMemo(() => {
    if (items.length > 0 && id) return items.find((i) => i._id === id);
    return null;
  }, [items, id]);

  useEffect(() => {
    if (originalItem && !displayItem) {
      setDisplayItem(originalItem);
      setEditableItem(itemToEditable(originalItem));
    }
  }, [originalItem]);

  const handleClose = () => navigate(-1);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableItem((prev) => ({ ...prev, [name]: value }));
  };
  const handleCancel = () => {
    if (displayItem) setEditableItem(itemToEditable(displayItem));
    setIsEditing(false);
    setShowJsonImport(false);
    setJsonText("");
  };

  const mergeJsonIntoItem = (base, rawJson) => {
    const parsed = JSON.parse(rawJson);
    const next = { ...base };
    const specialFields = new Set(["_id", "STOCK", "ALMACENAMIENTO", "Proveedor", "historial_update", "createdAt", "updatedAt"]);
    Object.keys(parsed).forEach((k) => {
      if (!specialFields.has(k) && parsed[k] !== null && parsed[k] !== undefined) next[k] = parsed[k];
    });
    if (parsed.STOCK !== undefined) {
      let s = parsed.STOCK;
      if (typeof s === "string") { try { s = JSON.parse(s); } catch { } }
      if (s && typeof s === "object") {
        if (s.minimo !== undefined) next.stock_minimo = s.minimo;
        if (s.maximo !== undefined) next.stock_maximo = s.maximo;
        if (s.actual !== undefined) next.stock_actual = s.actual;
      }
    }
    if (parsed.ALMACENAMIENTO !== undefined) {
      let a = parsed.ALMACENAMIENTO;
      if (typeof a === "string") { try { a = JSON.parse(a); } catch { } }
      if (a && typeof a === "object") {
        if (a.ALMACENAMIENTO !== undefined) next.almacenamiento_ALMACENAMIENTO = a.ALMACENAMIENTO;
        if (a.BODEGA !== undefined) next.almacenamiento_BODEGA = a.BODEGA;
      }
    }
    if ("Proveedor" in parsed) {
      if (parsed.Proveedor === null) {
        next.Proveedor = null;
      } else if (proveedores.find((p) => p._id === parsed.Proveedor)) {
        next.Proveedor = parsed.Proveedor;
      } else {
        const match = proveedores.find((p) => p.Nombre_Proveedor.toLowerCase().includes(String(parsed.Proveedor).toLowerCase()));
        if (match) next.Proveedor = match._id;
      }
    }
    return next;
  };

  const handleSave = async () => {
    if (!editableItem) return;
    setIsSaving(true);
    try {
      let base = { ...editableItem };
      if (jsonText.trim()) {
        try {
          base = mergeJsonIntoItem(base, jsonText);
          setEditableItem(base);
        } catch (e) {
          alert("El JSON tiene errores de sintaxis: " + e.message);
          setIsSaving(false);
          return;
        }
      }
      const stockData = { minimo: Number(base.stock_minimo) || 0, maximo: Number(base.stock_maximo) || 0, actual: Number(base.stock_actual) || 0 };
      const almacenamientoData = { ALMACENAMIENTO: base.almacenamiento_ALMACENAMIENTO || "", BODEGA: base.almacenamiento_BODEGA || "" };
      const precioUnitarioCalculado = calcularPrecioUnitario({
        COSTO: Number(base.COSTO) || 0, CANTIDAD: Number(base.CANTIDAD) || 1,
        COOR: Number(base.COOR) || 1.05, Merma: Number(base.Merma) || 0,
      });
      const payload = {
        ...base, STOCK: JSON.stringify(stockData), ALMACENAMIENTO: JSON.stringify(almacenamientoData),
        precioUnitario: precioUnitarioCalculado, FECHA_ACT: new Date().toISOString().split("T")[0],
      };
      delete payload.stock_minimo; delete payload.stock_maximo; delete payload.stock_actual;
      delete payload.almacenamiento_ALMACENAMIENTO; delete payload.almacenamiento_BODEGA;

      console.log("[handleSave] Payload → Supabase:", { ...payload });
      const result = await Promise.resolve(dispatch(updateItem(id, payload, ITEMS)));
      console.log("[handleSave] Respuesta BD:", result);

      if (result && result.length > 0) {
        const savedData = result[0];
        setDisplayItem(savedData);
        setEditableItem(itemToEditable(savedData));
        setIsEditing(false); setShowJsonImport(false); setJsonText("");
        dispatch(getAllFromTable(ITEMS));
      } else {
        console.error("[handleSave] ❌ BD retornó:", result);
        throw new Error("La base de datos no confirmó el cambio.");
      }
    } catch (error) {
      console.error("[handleSave] Error:", error);
      alert(`Error al guardar: ${error.message}`);
    } finally { setIsSaving(false); }
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setEditableItem((prev) => {
        const next = { ...prev };
        const specialFields = new Set(["_id", "STOCK", "ALMACENAMIENTO", "Proveedor", "historial_update", "createdAt", "updatedAt"]);
        Object.keys(parsed).forEach((k) => {
          if (!specialFields.has(k) && parsed[k] !== null && parsed[k] !== undefined) next[k] = parsed[k];
        });
        if (parsed.STOCK !== undefined) {
          let s = parsed.STOCK;
          if (typeof s === "string") { try { s = JSON.parse(s); } catch { } }
          if (s && typeof s === "object") {
            if (s.minimo !== undefined) next.stock_minimo = s.minimo;
            if (s.maximo !== undefined) next.stock_maximo = s.maximo;
            if (s.actual !== undefined) next.stock_actual = s.actual;
          }
        }
        if (parsed.ALMACENAMIENTO !== undefined) {
          let a = parsed.ALMACENAMIENTO;
          if (typeof a === "string") { try { a = JSON.parse(a); } catch { } }
          if (a && typeof a === "object") {
            if (a.ALMACENAMIENTO !== undefined) next.almacenamiento_ALMACENAMIENTO = a.ALMACENAMIENTO;
            if (a.BODEGA !== undefined) next.almacenamiento_BODEGA = a.BODEGA;
          }
        }
        if ("Proveedor" in parsed) {
          if (parsed.Proveedor === null) { next.Proveedor = null; }
          else if (proveedores.find((p) => p._id === parsed.Proveedor)) { next.Proveedor = parsed.Proveedor; }
          else {
            const match = proveedores.find((p) => p.Nombre_Proveedor.toLowerCase().includes(String(parsed.Proveedor).toLowerCase()));
            if (match) next.Proveedor = match._id;
          }
        }
        return next;
      });
    } catch (e) { alert("Error al leer JSON: " + e.message); }
  };

  const handleCopyPrompt = async () => { await copyPromptToClipboard(ITEMS, setPromptCopied); };

  const handleRecalculate = async () => {
    if (!displayItem) return;
    if (!window.confirm("¿Recalcular el precio unitario basado en los valores actuales de Costo, Cantidad, Merma y COOR?")) return;
    setIsSaving(true);
    try {
      dispatch(actualizarPrecioUnitario([displayItem], ITEMS));
      dispatch(getAllFromTable(ITEMS));
    } catch (error) {
      console.error("[handleRecalculate] Error:", error);
      alert("Error al recalcular precio unitario.");
    } finally { setIsSaving(false); }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value || 0);

  const handlePrint = () => {
    const item = displayItem;
    if (!item) return;
    const provName = proveedores.find((p) => p._id === item.Proveedor)?.Nombre_Proveedor || "N/A";
    const stock = safeJsonParse(item.STOCK, { minimo: 0, maximo: 0, actual: 0 });
    const almacen = safeJsonParse(item.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${item.Nombre_del_producto}</title>
<style>
  @page{size:letter;margin:2cm}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;line-height:1.6}
  .header{border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start}
  h1{font-size:22px;color:#1d4ed8;font-weight:700;margin-bottom:4px}
  .badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase}
  .badge-blue{background:#dbeafe;color:#1d4ed8}
  .badge-green{background:#dcfce7;color:#15803d}
  .badge-gray{background:#f1f5f9;color:#475569}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
  .stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center}
  .stat-label{font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600}
  .stat-value{font-size:15px;font-weight:700;color:#1d4ed8;margin-top:2px}
  .section{margin-bottom:16px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse}
  tr:nth-child(even) td{background:#f8fafc}
  td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:10.5px}
  td:first-child{font-weight:600;color:#475569;width:40%}
  .footer{margin-top:24px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
</style></head><body>
<div class="header">
  <div>
    <h1>${item.Nombre_del_producto}</h1>
    <div class="badges">
      <span class="badge badge-blue">${item.GRUPO || "Sin grupo"}</span>
      <span class="badge badge-green">${item.Estado || "N/A"}</span>
      ${item.MARCA ? `<span class="badge badge-gray">${Array.isArray(item.MARCA) ? item.MARCA[0] : item.MARCA}</span>` : ""}
    </div>
  </div>
  <div style="text-align:right;font-size:10px;color:#64748b">
    <div>${item.FECHA_ACT || ""}</div>
    <div style="margin-top:4px;font-size:9px">${provName}</div>
  </div>
</div>
<div class="stats">
  <div class="stat-card"><div class="stat-label">Costo Total</div><div class="stat-value">${formatCurrency(item.COSTO)}</div></div>
  <div class="stat-card"><div class="stat-label">Precio Unitario</div><div class="stat-value">${formatCurrency(item.precioUnitario)}</div></div>
  <div class="stat-card"><div class="stat-label">Stock Actual</div><div class="stat-value">${stock.actual}</div></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div>
    <div class="section-title">Costos e Inventario</div>
    <table>
      <tr><td>Cantidad Base</td><td>${item.CANTIDAD} ${item.UNIDADES}</td></tr>
      <tr><td>Costo Total</td><td>${formatCurrency(item.COSTO)}</td></tr>
      <tr><td>Factor COOR</td><td>${item.COOR}</td></tr>
      <tr><td>Merma</td><td>${item.Merma}%</td></tr>
      <tr><td>Precio Unitario</td><td><strong>${formatCurrency(item.precioUnitario)}</strong></td></tr>
    </table>
  </div>
  <div>
    <div class="section-title">Stock y Ubicación</div>
    <table>
      <tr><td>Stock Mínimo</td><td>${stock.minimo}</td></tr>
      <tr><td>Stock Máximo</td><td>${stock.maximo}</td></tr>
      <tr><td>Stock Actual</td><td><strong>${stock.actual}</strong></td></tr>
      <tr><td>Almacenamiento</td><td>${almacen.ALMACENAMIENTO || "N/A"}</td></tr>
      <tr><td>Bodega</td><td>${almacen.BODEGA || "N/A"}</td></tr>
    </table>
  </div>
</div>
<div class="footer">
  <span>ID: ${item._id}</span>
  <span>Generado: ${new Date().toLocaleDateString("es-CO")}</span>
</div>
</body></html>`;
    const win = window.open("", "_blank");
    win.document.documentElement.innerHTML = html;
    win.onload = () => { win.focus(); win.print(); };
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const InfoRow = ({ label, value, highlight = false }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 w-1/2">{label}</span>
      <span className={`text-xs font-semibold text-right ${highlight ? "text-blue-700 text-sm" : "text-slate-800"}`}>{value ?? "N/A"}</span>
    </div>
  );

  const SectionCard = ({ title, icon: Icon, color = "blue", children }) => {
    const colors = {
      blue: "border-l-blue-500 bg-blue-50/30",
      green: "border-l-emerald-500 bg-emerald-50/30",
      amber: "border-l-amber-500 bg-amber-50/30",
      purple: "border-l-purple-500 bg-purple-50/30",
    };
    const iconColors = { blue: "text-blue-500", green: "text-emerald-500", amber: "text-amber-500", purple: "text-purple-500" };
    return (
      <div className={`border-l-4 rounded-r-lg p-3 ${colors[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-3.5 w-3.5 ${iconColors[color]}`} />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        </div>
        {children}
      </div>
    );
  };

  const FormField = ({ label, name, type = "text", isReadOnly = false, options = null }) => {
    const value = editableItem?.[name] ?? "";
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        {options ? (
          <select name={name} value={value} onChange={handleChange} disabled={isSaving || isReadOnly}
            className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:bg-slate-100">
            <option value="">Seleccionar...</option>
            {options.map((opt) => (
              <option key={opt._id || opt} value={opt._id || opt}>{opt.Nombre_Proveedor || opt}</option>
            ))}
          </select>
        ) : (
          <Input name={name} type={type} value={value} onChange={handleChange}
            disabled={isSaving || isReadOnly} readOnly={isReadOnly}
            className={`h-8 text-xs ${isReadOnly ? "bg-slate-100 text-slate-400" : ""}`} />
        )}
      </div>
    );
  };

  // ─── View mode content ────────────────────────────────────────────────────

  const viewContent = () => {
    if (!displayItem) return null;
    const provName = proveedores.find((p) => p._id === displayItem.Proveedor)?.Nombre_Proveedor || "N/A";
    const stock = safeJsonParse(displayItem.STOCK, { minimo: 0, maximo: 0, actual: 0 });
    const almacen = safeJsonParse(displayItem.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });
    return (
      <div className="space-y-3 p-4">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Costo Total", value: formatCurrency(displayItem.COSTO), color: "bg-blue-600" },
            { label: "Precio Unitario", value: formatCurrency(displayItem.precioUnitario), color: "bg-emerald-600" },
            { label: "Stock Actual", value: stock.actual, color: "bg-amber-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-2.5 text-center shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{s.label}</div>
              <div className={`text-sm font-bold ${s.color.replace("bg-", "text-")}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* General */}
          <SectionCard title="Información General" icon={Tag} color="blue">
            <InfoRow label="Proveedor" value={provName} />
            <InfoRow label="Grupo" value={displayItem.GRUPO} />
            <InfoRow label="Estado" value={displayItem.Estado} />
            <InfoRow label="Marca" value={Array.isArray(displayItem.MARCA) ? displayItem.MARCA.join(", ") : displayItem.MARCA} />
          </SectionCard>

          {/* Costos */}
          <SectionCard title="Costos e Inventario" icon={DollarSign} color="green">
            <InfoRow label="Cantidad Base" value={`${displayItem.CANTIDAD} ${displayItem.UNIDADES}`} />
            <InfoRow label="Costo Total" value={formatCurrency(displayItem.COSTO)} highlight />
            <InfoRow label="Factor COOR" value={displayItem.COOR} />
            <InfoRow label="Merma" value={`${displayItem.Merma}%`} />
            <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs font-medium text-slate-500 w-1/2">Precio Unitario</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-emerald-700">{formatCurrency(displayItem.precioUnitario)}</span>
                <button onClick={handleRecalculate} disabled={isSaving}
                  className="p-0.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Recalcular">
                  <RefreshCw className={`h-3 w-3 ${isSaving ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Stock */}
          <SectionCard title="Control de Stock" icon={BarChart3} color="amber">
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { label: "Mínimo", value: stock.minimo },
                { label: "Máximo", value: stock.maximo },
                { label: "Actual", value: stock.actual },
              ].map((s) => (
                <div key={s.label} className="text-center bg-white rounded p-2 border border-amber-100">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">{s.label}</div>
                  <div className="text-base font-bold text-slate-700">{s.value}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Ubicación */}
          <SectionCard title="Ubicación Física" icon={MapPin} color="purple">
            <InfoRow label="Almacenamiento" value={almacen.ALMACENAMIENTO || "N/A"} />
            <InfoRow label="Bodega" value={almacen.BODEGA || "N/A"} />
          </SectionCard>
        </div>

        {/* Recipe link */}
        {displayItem.recipeId && (
          <a href={`/receta/${displayItem.recipeId}`}
            className="flex items-center justify-center gap-2 w-full p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors text-sm font-medium">
            <BookOpen className="h-4 w-4" /> Ver Receta Asociada
          </a>
        )}

        {/* Footer meta */}
        <div className="flex justify-between text-[9px] text-slate-300 pt-1 px-1">
          <span>ID: {displayItem._id}</span>
          <span>Act: {displayItem.FECHA_ACT || "N/A"}</span>
        </div>
      </div>
    );
  };

  // ─── Edit mode content ────────────────────────────────────────────────────

  const editContent = () => (
    <div className="p-4 space-y-4">
      <SectionCard title="Información General" icon={Tag} color="blue">
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2"><FormField label="Nombre del Producto" name="Nombre_del_producto" /></div>
          <FormField label="Grupo" name="GRUPO" options={CATEGORIES} />
          <FormField label="Estado" name="Estado" options={ESTATUS} />
          <div className="col-span-2"><FormField label="Proveedor" name="Proveedor" options={proveedores} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Costos e Inventario" icon={DollarSign} color="green">
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FormField label="Cantidad Base" name="CANTIDAD" type="number" />
          <FormField label="Unidad" name="UNIDADES" options={unidades} />
          <FormField label="Costo Total" name="COSTO" type="number" />
          <FormField label="Factor COOR" name="COOR" type="number" />
          <FormField label="Merma (%)" name="Merma" type="number" />
          <FormField label="Precio Unitario" name="precioUnitario" isReadOnly />
        </div>
      </SectionCard>

      <SectionCard title="Control de Stock" icon={BarChart3} color="amber">
        <div className="grid grid-cols-3 gap-3 mt-2">
          <FormField label="Mínimo" name="stock_minimo" type="number" />
          <FormField label="Máximo" name="stock_maximo" type="number" />
          <FormField label="Actual" name="stock_actual" type="number" />
        </div>
      </SectionCard>

      <SectionCard title="Ubicación Física" icon={MapPin} color="purple">
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FormField label="Almacenamiento" name="almacenamiento_ALMACENAMIENTO" options={BODEGA} />
          <FormField label="Bodega" name="almacenamiento_BODEGA" options={BODEGA} />
        </div>
      </SectionCard>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-white w-full ${showJsonImport ? "max-w-5xl" : "max-w-xl"} transition-all duration-300 rounded-xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {isEditing ? "Editando Item" : (displayItem?.Nombre_del_producto || "Detalles del Item")}
              </h2>
              {!isEditing && displayItem && (
                <div className="flex items-center gap-2 mt-0.5">
                  {displayItem.GRUPO && (
                    <span className="text-[9px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">{displayItem.GRUPO}</span>
                  )}
                  {displayItem.Estado && (
                    <span className="text-[9px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">{displayItem.Estado}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isEditing && displayItem && (
              <>
                <button onClick={handlePrint}
                  className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors" title="Imprimir / PDF">
                  <Printer className="h-4 w-4" />
                </button>
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors text-xs font-medium">
                  <Edit className="h-3.5 w-3.5" /> Editar
                </button>
              </>
            )}
            <button onClick={handleClose}
              className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-sm text-slate-500">Cargando...</span>
            </div>
          ) : !displayItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Package className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">Item no encontrado</p>
              <p className="font-mono text-xs text-slate-300 mt-1">ID: {id}</p>
            </div>
          ) : (
            <div className={`flex-1 flex min-h-0 ${showJsonImport ? "divide-x divide-slate-100" : ""}`}>
              {/* Main content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isEditing ? editContent() : viewContent()}
              </div>

              {/* JSON Import panel */}
              {showJsonImport && isEditing && (
                <div className="w-80 flex-shrink-0 flex flex-col bg-slate-50">
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">Importar JSON</span>
                    </div>
                    <button onClick={handleCopyPrompt}
                      className="flex items-center gap-1 text-[10px] border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 rounded transition-colors">
                      {promptCopied ? <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Copiado</span></>
                        : <><Copy className="h-3 w-3 text-slate-500" /><span className="text-slate-500">Prompt</span></>}
                    </button>
                  </div>
                  <textarea
                    className="flex-1 w-full p-3 text-[10px] font-mono bg-white border-0 focus:outline-none resize-none"
                    placeholder={'{ "COSTO": "15000", "CANTIDAD": "500"... }'}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                  />
                  <div className="p-3 border-t border-slate-200">
                    <Button size="sm" onClick={handleParseJson}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                      Aplicar al Formulario
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (edit mode only) */}
        {isEditing && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <button onClick={() => setShowJsonImport(!showJsonImport)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${showJsonImport ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              <FileJson className="h-3.5 w-3.5" />
              {showJsonImport ? "Ocultar JSON" : "Importar JSON"}
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="text-xs h-8">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 min-w-[110px]">
                {isSaving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Guardando...</>
                  : <><Save className="h-3.5 w-3.5 mr-1.5" />Guardar Cambios</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsModal;
