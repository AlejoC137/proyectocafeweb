import React from "react";
import { Card, CardContent } from "@/components/ui/card";

// ✅ Versión mínima: título + link a ProcedimientoModal en nueva pestaña
export function CardGridProcedimientos_Instance({ item, product }) {
  const title = (item?.tittle ?? item?.title ?? "").trim() || "Sin título";

  // Usamos el id de receta proporcionado por product.recipeId; si no existe,
  // caemos a item.Receta o al _id del item.
  const procedimientoId = product?.recipeId || item?.Receta || item?._id || "";

  return (
    <Card className="w-full shadow-md rounded-lg border border-gray-200">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-800 truncate">{title}</div>

        {procedimientoId ? (
          <a
            href={`/ProcedimientoModal/${procedimientoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 font-medium text-blue-600 hover:text-blue-800"
            title="Ver Procedimiento"
          >
            📕
          </a>
        ) : (
          <span className="p-2 text-gray-400 cursor-not-allowed" title="Sin procedimiento asignado">
            📕
          </span>
        )}
      </CardContent>
    </Card>
  );
}
