import { Label } from "@/components/ui/label";
import React from "react";
import { CardInstanceAgenda } from "@/components/ui/cardInstanceAgenda";

export function CardGridAgenda({ products, category }) {
  return (
    <div className="py-2 px-2">
      {/* Etiqueta de la categoría */}
      <div className="flex justify-center mb-2">
        <Label className="text-center text-lg font-bold truncate">{category.toUpperCase()}</Label>
      </div>

      {/* Contenedor de las tarjetas */}
      <div className="grid grid-cols-2 gap-2"> {/* Una columna con espacio entre las tarjetas */}
        {products.map((product, index) => (
          <CardInstanceAgenda key={index} product={product} />
        ))}
      </div>
    </div>
  );
}
