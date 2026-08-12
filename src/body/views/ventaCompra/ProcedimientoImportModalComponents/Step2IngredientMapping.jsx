import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Step2IngredientMapping({
  parsedData,
  ingredientSelections,
  ingredientSearchTerms,
  getMatches,
  getProductName,
  handleSearchIngredient,
  handleSelectIngredient,
  handleManualChange,
  handleDeleteManual,
  handleAddManualIngredient,
}) {
  return (
    <div className="lg:col-span-1 flex flex-col border-r pr-6">
      <h3 className="font-bold text-lg border-b pb-2 mb-4">1. Validar Insumos ({parsedData?.ingredients?.length})</h3>
      <div className="space-y-3 pr-2 overflow-y-auto max-h-[500px]">
        {parsedData?.ingredients.map((ing) => {
          const selected = ingredientSelections[ing.index];
          const searchTerm = ingredientSearchTerms[ing.index] || "";
          const matches = getMatches(searchTerm);
          const isMapped = !!selected;
          const isManual = ing.isManual;

          return (
            <div key={ing.index} className={`p-3 rounded-md border ${isMapped ? "bg-white border-green-200 shadow-sm" : "bg-red-50 border-red-200"}`}>
              <div className="flex flex-col gap-2">
                <div>
                  {isManual ? (
                    <div className="flex gap-1 mb-1">
                      <Input
                        placeholder="Cant"
                        className="h-7 text-xs w-16"
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => handleManualChange(ing.index, 'quantity', e.target.value)}
                      />
                      <Input
                        placeholder="Und"
                        className="h-7 text-xs flex-1"
                        value={ing.units}
                        onChange={(e) => handleManualChange(ing.index, 'units', e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-800 break-words">{ing.legacyName}</p>
                      <p className="text-xs text-gray-500">{ing.quantity} {ing.units}</p>
                    </>
                  )}
                </div>
                <div className="text-gray-400 text-center">↓</div>
                <div className="relative">
                  {selected ? (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-300">
                      <div>
                        <p className="text-xs font-semibold text-green-900 break-words">{getProductName(selected)}</p>
                        <p className="text-[10px] text-green-600">{selected.__type === "producto_interno" ? "Producción" : "Insumo"}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleSelectIngredient(ing.index, null)}>✕</Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder={isManual ? "Buscar prod. sistema..." : "Buscar..."}
                        value={searchTerm}
                        onChange={(e) => handleSearchIngredient(ing.index, e.target.value)}
                        className="h-8 text-xs"
                      />
                      {matches.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {matches.map(m => (
                            <li
                              key={m._id}
                              className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0"
                              onClick={() => handleSelectIngredient(ing.index, m)}
                            >
                              {getProductName(m)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {isManual && (
                  <div className="text-right mt-1">
                    <button onClick={() => handleDeleteManual(ing.index)} className="text-xs text-red-500 hover:text-red-700 underline">Quitar</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddManualIngredient}
          className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 text-gray-500 mt-2"
        >
          + Agregar Insumo Manual
        </Button>
      </div>
    </div>
  );
}

export default Step2IngredientMapping;
