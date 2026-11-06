import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateRappiConfig, aplicarPreciosRappi } from "@/redux/actions-Rappi";
import {
  precioRappiSugerido,
  precioPorMargenObjetivo,
  formatCOP,
  formatPct,
} from "../utils/rappiPricing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Percent,
  Calculator,
  Save,
  CheckCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function ModeradorPrecioPanel({
  config,
  onConfigChange,
  items = [],
  selectedIds = new Set(),
  onApplied,
}) {
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [targetMargin, setTargetMargin] = useState(30);

  const localConfig = config || {
    aumento_pct: 25,
    redondeo: 100,
    comision_pct: 25,
    iva_comision_pct: 19,
  };

  const handleChange = (field, val) => {
    const numVal = field === "redondeo" ? Number(val) : parseFloat(val) || 0;
    const updated = { ...localConfig, [field]: numVal };
    if (onConfigChange) onConfigChange(updated);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await dispatch(updateRappiConfig(localConfig));
      alert("Configuración de moderador guardada correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToSelection = async (clearManual = false) => {
    const targetItems = selectedIds.size > 0
      ? items.filter((i) => selectedIds.has(i.id))
      : items;

    if (!targetItems.length) {
      alert("No hay productos seleccionados para aplicar cambios.");
      return;
    }

    const confirmMsg = clearManual
      ? `¿Restaurar ${targetItems.length} productos a precio automático calculado por fórmula?`
      : `¿Fijar el precio calculado para ${targetItems.length} productos en Rappi?`;

    if (!window.confirm(confirmMsg)) return;

    setApplying(true);
    try {
      const preciosMap = {};
      targetItems.forEach((item) => {
        preciosMap[item.id] = clearManual
          ? null
          : precioRappiSugerido(item.precioLocal, localConfig);
      });

      const res = await dispatch(aplicarPreciosRappi(preciosMap));
      if (res?.fallidos > 0) {
        alert(`Se actualizaron ${res.ok} productos. Fallaron ${res.fallidos} (verifica migración SQL).`);
      } else {
        alert(`Precios actualizados con éxito para ${res.ok} productos.`);
      }
      if (onApplied) onApplied();
    } catch (err) {
      console.error(err);
      alert("Error al aplicar precios.");
    } finally {
      setApplying(false);
    }
  };

  // Preview de impacto en un ítem de ejemplo o promedio
  const muestra = items[0] || { precioLocal: 20000, costo: 7000 };
  const sugeridoMuestra = precioRappiSugerido(muestra.precioLocal || 20000, localConfig);
  const comisionMuestra = sugeridoMuestra * (localConfig.comision_pct / 100) * (1 + localConfig.iva_comision_pct / 100);
  const netoMuestra = sugeridoMuestra - comisionMuestra;
  const margenMuestra = sugeridoMuestra > 0 ? ((netoMuestra - (muestra.costo || 7000)) / sugeridoMuestra) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white border border-orange-200 rounded-xl p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Moderador de Precios y Comisiones Rappi
              <span className="text-[10px] font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                Formula en vivo
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Ajusta el margen y el valor de venta en Rappi compensando la comisión de la plataforma.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white/80 border border-slate-200"
          title={collapsed ? "Expandir panel" : "Minimizar panel"}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 pt-3 border-t border-orange-100 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* % Aumento */}
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                % Aumento s/ Local
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  value={localConfig.aumento_pct}
                  onChange={(e) => handleChange("aumento_pct", e.target.value)}
                  className="h-7 text-xs font-bold"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Redondeo */}
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Múltiplo de Redondeo
              </label>
              <select
                value={localConfig.redondeo}
                onChange={(e) => handleChange("redondeo", e.target.value)}
                className="h-7 w-full text-xs font-bold border border-input rounded-md px-2 bg-white"
              >
                <option value={100}>$ 100</option>
                <option value={500}>$ 500</option>
                <option value={1000}>$ 1.000</option>
                <option value={1}>Sin redondeo</option>
              </select>
            </div>

            {/* % Comisión Rappi */}
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Comisión Rappi (%)
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.1"
                  value={localConfig.comision_pct}
                  onChange={(e) => handleChange("comision_pct", e.target.value)}
                  className="h-7 text-xs font-bold"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* IVA Comisión */}
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                IVA s/ Comisión (%)
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  value={localConfig.iva_comision_pct}
                  onChange={(e) => handleChange("iva_comision_pct", e.target.value)}
                  className="h-7 text-xs font-bold"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Barra de Simulación rápida */}
          <div className="bg-white/90 rounded-lg p-2.5 border border-orange-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="text-[11px] text-slate-600">
                <span>Simulación para producto de {formatCOP(muestra.precioLocal || 20000)} (costo {formatCOP(muestra.costo || 7000)}):</span>
                <span className="font-bold text-slate-800 ml-1">
                  P. Rappi: {formatCOP(sugeridoMuestra)} → Neto: {formatCOP(netoMuestra)} → Margen Neto: {formatPct(margenMuestra)}
                </span>
              </div>
            </div>

            {/* Calculador de margen objetivo */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Precio p/ Margen Obj:</span>
              <Input
                type="number"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className="h-6 w-14 text-[11px] font-bold"
              />
              <span className="text-slate-400">% =</span>
              <span className="font-bold text-emerald-700">
                {formatCOP(precioPorMargenObjetivo(muestra.costo || 7000, targetMargin, localConfig) || 0)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-slate-500">
              {selectedIds.size > 0 ? (
                <span>
                  Seleccionados: <b>{selectedIds.size}</b> producto(s)
                </span>
              ) : (
                <span>Sin selección: se aplicará a todos los productos</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving || applying}
                onClick={handleSaveConfig}
                className="h-7 text-xs bg-white text-slate-700 hover:bg-slate-50"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Guardar Config
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving || applying}
                onClick={() => handleApplyToSelection(true)}
                className="h-7 text-xs bg-white text-slate-600 hover:bg-slate-50 border-slate-300"
                title="Limpia el precio manual para que use la fórmula automática"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Auto Fórmula
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={saving || applying}
                onClick={() => handleApplyToSelection(false)}
                className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Fijar Precios ({selectedIds.size > 0 ? selectedIds.size : "Todos"})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeradorPrecioPanel;
