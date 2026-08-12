import React from "react";
import { Input } from "@/components/ui/input";

export function Step2TargetProductSelection({
  forcedRecipeId,
  targetSearchTerm,
  setTargetSearchTerm,
  targetProduct,
  setTargetProduct,
  targetSearchMatches,
  getProductName,
  parsedData,
  setParsedData,
}) {
  return (
    <div className="lg:col-span-1 border-r pr-6 flex flex-col gap-4">
      <h3 className="font-bold text-lg border-b pb-2">1. Validar Producto Destino</h3>

      {forcedRecipeId ? (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-orange-800 font-bold mb-2">Modo Edición Directa</p>
          <p className="text-sm text-orange-700">Has abierto el importador desde una receta existente. Los cambios se guardarán directamente en la receta actual.</p>
          <p className="mt-2 text-xs font-mono text-gray-500">ID: {forcedRecipeId}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">¿A qué producto del sistema pertenece esta receta?</p>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Buscar Producto:</label>
            <Input
              value={targetSearchTerm}
              onChange={(e) => { setTargetSearchTerm(e.target.value); setTargetProduct(null); }}
              placeholder="Ej: Hamburguesa Clásica"
              className={targetProduct ? "border-green-500 bg-green-50" : ""}
            />
            {targetProduct && (
              <div className="p-2 bg-green-100 text-green-800 rounded text-sm border border-green-300 flex justify-between items-center">
                <span>✓ {getProductName(targetProduct)}</span>
                <button onClick={() => { setTargetProduct(null); setTargetSearchTerm(""); }} className="text-xs text-red-500 hover:underline">Cambiar</button>
              </div>
            )}

            {!targetProduct && targetSearchMatches.length > 0 && (
              <ul className="border rounded-md shadow-sm max-h-40 overflow-y-auto bg-white divide-y">
                {targetSearchMatches.map(match => (
                  <li
                    key={match._id}
                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm flex flex-col"
                    onClick={() => { setTargetProduct(match); setTargetSearchTerm(getProductName(match)); }}
                  >
                    <span className="font-semibold">{getProductName(match)}</span>
                    <span className="text-xs text-gray-400">{match._table}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {parsedData?.name !== undefined && (
            <div className="mt-4 p-3 bg-gray-100 rounded border">
              <span className="text-xs text-gray-500 uppercase font-bold">Nombre en JSON (Editable):</span>
              <Input
                value={parsedData.name}
                onChange={(e) => setParsedData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 font-mono text-sm bg-white border-blue-200 focus:border-blue-500"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Step2TargetProductSelection;
