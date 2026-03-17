import { Label } from "@/components/ui/label";
import React from 'react';
import { CardInstancePrint } from "@/components/ui/cardInstancePrint";

export function CardGridPrint({ products, isEnglish, GRUPO, SUB_GRUPO, TITTLE }) {

  const filteredProducts = products.filter((product) => {
    const groupMatch = Array.isArray(GRUPO)
      ? GRUPO.includes(product.GRUPO)
      : product.GRUPO === GRUPO;

    return (
      groupMatch &&
      (product.Estado === "Activo" || product.Estado === "OK") &&
      (!SUB_GRUPO || product.SUB_GRUPO === SUB_GRUPO)
    );
  });

  if (filteredProducts.filter(p => p.PRINT === true).length === 0) {
    return null;
  }

  return (
    <div className="w-full relative">
      <div className="flex flex-col items-start gap-[2px]">
        <Label className="text-left flex text-[13px] leading-none mb-[1px] justify-center break-words w-full truncate font-SpaceGrotesk font-bold uppercase tracking-wider">
          {TITTLE ? TITTLE[isEnglish ? "EN" : "ES"] : String(GRUPO)}
        </Label>

        <div className="flex flex-col gap-[2px] w-full font-light">
          {filteredProducts
            .filter((product) => product.PRINT === true)
            .sort((a, b) => Number(a.Order) - Number(b.Order))
            .map((product) => (
              <div key={product._id} className="flex w-full">
                <CardInstancePrint product={product} isEnglish={isEnglish} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}