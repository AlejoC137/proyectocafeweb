import React from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RecetaCostosCard({
  recetaSource,
  permanentEditMode,
  tiempoProceso,
  setTiempoProceso,
  costoManualCMP,
  setCostoManualCMP,
  costoProduccion,
  handleCalculateUnitValue,
  isUpdating,
  rendimientoCantidad,
  calculoDetalles,
  precioVentaFinal,
  formatCurrency,
}) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <DollarSign className="h-3 w-3" /> Cálculo de Costos
      </h4>

      {permanentEditMode && (
        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">Tiempo (min)</label>
            <Input type="number" value={tiempoProceso} onChange={(e) => setTiempoProceso(Number(e.target.value))} className="h-7 text-xs mt-0.5" />
          </div>
          {recetaSource !== "RecetasProduccion" && (
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">%CMP Manual</label>
              <Input type="number" value={costoManualCMP} onChange={(e) => setCostoManualCMP(e.target.value)} placeholder="Ej: 35" className="h-7 text-xs mt-0.5" />
            </div>
          )}
        </div>
      )}

      {recetaSource === "RecetasProduccion" ? (
        <div className="flex flex-col gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-700">Costo de Producción</span>
            <span className="text-base font-bold text-blue-700">{formatCurrency(costoProduccion)}</span>
          </div>
          {permanentEditMode && (
            <Button
              size="sm"
              onClick={handleCalculateUnitValue}
              disabled={isUpdating || !rendimientoCantidad || Number(rendimientoCantidad) <= 0}
              className="w-full h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`h-3 w-3 ${isUpdating ? "animate-spin" : ""}`} />
              Calcular y Guardar Valor x Unidad
            </Button>
          )}
        </div>
      ) : calculoDetalles ? (
        <div className="space-y-1">
          {[
            { label: "%CMP Establecido", value: `${calculoDetalles.pCMPInicial}%`, color: "bg-slate-100" },
            { label: "%CMP Real", value: `${calculoDetalles.pCMPReal}%`, color: "bg-slate-100" },
            { label: "Valor CMP", value: formatCurrency(calculoDetalles.vCMP), color: "bg-green-50" },
            { label: "Mano de Obra", value: formatCurrency(calculoDetalles.vCMO), color: "bg-green-50" },
            { label: "Utilidad Bruta", value: formatCurrency(calculoDetalles.vIB), color: "bg-green-50" },
            { label: "% Util. Bruta", value: `${calculoDetalles.pIB}%`, color: "bg-green-50" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`flex justify-between items-center px-2 py-1 rounded ${color}`}>
              <span className="text-[10px] text-slate-600">{label}</span>
              <span className="text-[10px] font-bold text-slate-800">{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
            <span className="text-xs font-bold text-amber-700">Precio Venta Final</span>
            <span className="text-base font-bold text-amber-700">{formatCurrency(precioVentaFinal)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic text-center py-2">Ajusta ingredientes para calcular.</p>
      )}
    </div>
  );
}

export default RecetaCostosCard;
