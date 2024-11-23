import { Label } from "@/components/ui/label";
import React from "react";
import { CardInstanceHome } from "@/components/ui/cardInstanceHome";

export function CardGridHome({ products, category }) {
  return (
    <div className=" p-2">


      {/* Contnedor de las tarjetas */}
      <div className="flex flex-col gap-4">
        {products.map((product, index) => (
          <CardInstanceHome key={index} product={product} />
        ))}
      </div>
    </div>
  );
}
