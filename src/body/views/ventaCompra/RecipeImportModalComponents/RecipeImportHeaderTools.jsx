import React from "react";
import { Button } from "@/components/ui/button";
import { MENU, PRODUCCION } from "../../../../redux/actions-types";
import AccionesRapidas from '../../actualizarPrecioUnitario/AccionesRapidas';

export function RecipeImportHeaderTools({
  showQuickActions,
  setShowQuickActions,
  quickActionType,
  setQuickActionType,
}) {
  return (
    <div className="bg-gray-50 border-b p-2 flex flex-col gap-2">
      <div className="flex justify-between items-center px-4">
        <span className="text-sm font-semibold text-gray-600">¿Necesitas crear productos nuevos?</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          {showQuickActions ? "Ocultar Herramientas" : "Mostrar Herramientas de Creación"}
        </Button>
      </div>

      {showQuickActions && (
        <div className="p-4 bg-white border-t animate-in slide-in-from-top-2 duration-200">
          <div className="mb-4 flex items-center gap-4">
            <label className="text-sm font-bold text-gray-700">Tipo de Producto a Gestionar:</label>
            <select
              value={quickActionType}
              onChange={(e) => setQuickActionType(e.target.value)}
              className="border rounded p-1 text-sm bg-gray-50"
            >
              <option value={MENU}>Menú (Venta)</option>
              <option value={PRODUCCION}>Producción Interna</option>
              <option value="ITEMS">Insumos (Almacén)</option>
            </select>
          </div>
          <div className="border rounded-md p-2 bg-slate-50">
            <AccionesRapidas currentType={quickActionType} />
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeImportHeaderTools;
