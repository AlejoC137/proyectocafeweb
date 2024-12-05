import React from "react";
import { CardInstanceInventario } from "@/components/ui/cardInstanceInventario";

export function CardGridInventario({ products }) {
  return (
    <div className="grid grid-cols-1 gap-4"> {/* Una columna con espacio entre las tarjetas */}
      {products.map((product, index) => (
        <CardInstanceInventario key={index} product={product} />
      ))}
    </div>
  );
}
