import { Label } from "@/components/ui/label";
import React from "react";
import { CardInstanceAgenda } from "@/components/ui/cardInstanceAgenda";

export function CardGridAgenda({ products, category, onDelete }) {
  return (
    <div className="py-2 px-2">
      {/* Etiqueta de la categoría */}
      <div className="flex justify-center mb-2">
        <Label className="text-center text-lg font-bold truncate">{category.toUpperCase()}</Label>
      </div>

      {/* Contenedor de las tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product, index) => (
          <CardInstanceAgenda 
            key={product._id || index} 
            product={product}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
