import React from "react";
import { ChefHat, Users, Clock, DollarSign, Unlock, Lock, FileJson, Printer, X } from "lucide-react";
import EditableText from "@/components/ui/EditableText";

export function RecetaHeader({
  receta,
  rendimientoDisplay,
  recetaSource,
  formatCurrency,
  updateInfoField,
  permanentEditMode,
  isUpdating,
  porcentaje,
  setPorcentaje,
  editShow,
  setEditShow,
  handleEnablePermanentEdit,
  handleCancelEdit,
  showPinInput,
  pinCode,
  setPinCode,
  handlePinVerification,
  setShowImportModal,
  handlePrintReceta,
  onClose,
  navigate,
}) {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 bg-white/10 rounded-lg flex-shrink-0">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold text-white truncate">
            <EditableText 
              value={receta.legacyName || ""} 
              onSave={(v) => updateInfoField("legacyName", v)}
              isEditable={permanentEditMode} 
              placeholder="Nombre de la receta..." 
              multiline={false} 
              disabled={isUpdating} 
            />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {rendimientoDisplay && (
              <span className="flex items-center gap-1 text-[9px] font-medium bg-white/15 text-white/80 px-2 py-0.5 rounded-full">
                <Users className="h-2.5 w-2.5" />{rendimientoDisplay}
              </span>
            )}
            {receta.ProcessTime > 0 && (
              <span className="flex items-center gap-1 text-[9px] font-medium bg-white/15 text-white/80 px-2 py-0.5 rounded-full">
                <Clock className="h-2.5 w-2.5" />{receta.ProcessTime} min
              </span>
            )}
            {recetaSource === "RecetasProduccion" && (
              <span className="text-[9px] font-bold bg-amber-500/80 text-white px-2 py-0.5 rounded-full">Producción</span>
            )}
            {receta.precioUnitario > 0 && (
              <span className="flex items-center gap-1 text-[9px] font-medium bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                <DollarSign className="h-2.5 w-2.5" />{formatCurrency(receta.precioUnitario)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Porcentaje */}
        <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1">
          <span className="text-[10px] text-white/70 font-medium">%</span>
          <input 
            type="number" 
            min={1} 
            value={porcentaje}
            onChange={(e) => setPorcentaje(Number(e.target.value))}
            className="w-14 h-6 text-xs text-center bg-white/10 text-white rounded border border-white/20 focus:outline-none focus:border-white/50" 
          />
        </div>

        {/* Edición simple */}
        <button 
          onClick={() => setEditShow(p => !p)} 
          disabled={permanentEditMode}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${editShow && !permanentEditMode ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white/80"} disabled:opacity-40`}
        >
          {editShow ? "✓ Ed. Simple" : "Editar"}
        </button>

        {/* Edición avanzada */}
        <button 
          onClick={permanentEditMode ? handleCancelEdit : handleEnablePermanentEdit} 
          disabled={isUpdating || (showPinInput && !permanentEditMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${permanentEditMode ? "bg-emerald-500 text-white" : "bg-amber-500/80 hover:bg-amber-500 text-white"} disabled:opacity-50`}
        >
          {permanentEditMode ? <><Unlock className="h-3 w-3" />Avanzado</> : <><Lock className="h-3 w-3" />Avanzado</>}
        </button>

        {showPinInput && !permanentEditMode && (
          <div className="flex items-center gap-1">
            <input 
              type="password" 
              placeholder="PIN" 
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").substring(0, 4))}
              onKeyDown={(e) => { if (e.key === "Enter") handlePinVerification(); }}
              maxLength={4} 
              autoFocus
              className="w-16 h-7 text-xs text-center bg-white/10 text-white border border-white/30 rounded focus:outline-none focus:border-white/60" 
            />
            <button 
              onClick={handlePinVerification} 
              disabled={pinCode.length !== 4}
              className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white text-xs rounded disabled:opacity-40"
            >
              OK
            </button>
          </div>
        )}

        {/* Import JSON */}
        <button 
          onClick={() => setShowImportModal(true)}
          className="p-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors" 
          title="Importar desde JSON"
        >
          <FileJson className="h-4 w-4" />
        </button>

        {/* Print */}
        <button 
          onClick={handlePrintReceta}
          className="p-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors" 
          title="Imprimir receta (PDF carta)"
        >
          <Printer className="h-4 w-4" />
        </button>

        {/* Close */}
        <button 
          onClick={onClose || (() => navigate(-1))}
          className="p-1.5 bg-white/10 hover:bg-red-500/70 text-white/80 hover:text-white rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default RecetaHeader;
