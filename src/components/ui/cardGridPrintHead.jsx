import { Label } from "@/components/ui/label";
import React from 'react';
import { CardInstancePrintHead } from "@/components/ui/cardInstancePrintHead";

export function CardGridPrintHead({ products, isEnglish, GRUPO, SUB_GRUPO, TITTLE }) {
  
  // Lógica de filtrado simplificada y corregida.
  const filteredProducts = products.filter((product) => {
    const groupMatch = Array.isArray(GRUPO)
      ? GRUPO.includes(product.GRUPO)
      : product.GRUPO === GRUPO;

    return (
      groupMatch &&
      product.Estado === "Activo" &&
      (!SUB_GRUPO || product.SUB_GRUPO === SUB_GRUPO)
    );
  });

  // Si no hay productos en esta categoría, no renderiza nada.
  if (filteredProducts.filter(p => p.PRINT === true).length === 0) {
    return null;
  }

  return (
    // CONTENEDOR CORREGIDO:
    // Se eliminaron 'h-full', 'overflow-hidden' y el 'style' para la altura.
    // Ahora el componente crecerá verticalmente según su contenido.
    <div className="w-full relative">
      <div className="flex flex-col items-start gap-1">
        <Label className="text-left flex text-lg justify-center break-words w-full truncate font-SpaceGrotesk font-bold">
          {/* {TITTLE ? TITTLE[isEnglish ? "EN" : "ES"].toUpperCase() : String(GRUPO).toUpperCase()} */}
        </Label>
        
        {/* LISTA CORREGIDA: Se eliminó 'overflow-y-auto' y 'scrollbar-hide'. */}
        <div className="flex flex-col gap-1 w-full font-light">
          {filteredProducts
            .filter((product) => product.PRINT === true)
            .sort((a, b) => Number(a.Order) - Number(b.Order))
            .map((product) => (
              <div key={product._id} className="flex w-full">
                <CardInstancePrintHead product={product} isEnglish={isEnglish} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}