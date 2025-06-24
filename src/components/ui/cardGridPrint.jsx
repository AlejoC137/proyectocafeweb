import { Label } from "@/components/ui/label";
import React, { useRef, useState } from 'react';
import { CardInstancePrint } from "@/components/ui/cardInstancePrint";
import { CardInstanceDetail } from "@/components/ui/cardInstanceDetail";

export function CardGridPrint({ products, isEnglish, GRUPO, SUB_GRUPO,TITTLE, filterKey, withDividerValue }) {
  const containerRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);



  const filteredProducts = Array.isArray(GRUPO)
    ? products.filter((product) => 
        GRUPO.includes(product.GRUPO) && 
        product.Estado === "Activo" && 
        (!SUB_GRUPO || product.SUB_GRUPO === SUB_GRUPO)
      )
    : products.filter((product) => 
        product.GRUPO === filterKey && 
        product.Estado === "Activo" && 
        (!SUB_GRUPO || product.SUB_GRUPO === SUB_GRUPO)
      );

  return (
    <div className={`
    ${withDividerValue === 1 ? "w-full" : `w-1/${withDividerValue}`}
    h-full relative 
    overflow-hidden`}>
      {/* {selectedProduct && (
        <div className="fixed inset-0 flex justify-center items-center overflow-hidden ">
          <CardInstanceDetail 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            onNext={() => {
              const currentIndex = products.findIndex(p => p._id === selectedProduct._id);
              const nextProduct = products[currentIndex + 1] || products[0];
              setSelectedProduct(nextProduct);
            }}
          />
        </div>
      )} */}
      <div className="flex flex-col items-start gap-1">
        <Label className="text-left text-lg font-medium break-words w-full font-LilitaOne  ">
          {/* {Array.isArray(GRUPO) ? GRUPO.join(' & ').toUpperCase() : GRUPO.toUpperCase()}{' '} */}
          {TITTLE ? TITTLE[isEnglish ? "EN" : "ES"].toUpperCase() : GRUPO.toUpperCase()} 
        </Label>
        
        <div ref={containerRef} className="flex flex-col overflow-y-auto scrollbar-hide snap-y snap-mandatory scroll-smooth gap-1 w-full font-light">
          {filteredProducts
            .filter((product) => product.PRINT === true)
            .map((product) => (
              <div key={product._id} className="snap-center flex w-full " onClick={() => setSelectedProduct(product)}>
                <CardInstancePrint product={product} isEnglish={isEnglish} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
