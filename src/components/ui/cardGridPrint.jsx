import { Label } from "@/components/ui/label";
import React, { useRef, useState } from 'react';
import { CardInstancePrint } from "@/components/ui/cardInstancePrint";
import { CardInstanceDetail } from "@/components/ui/cardInstanceDetail";

export function CardGridPrint({ products, isEnglish, category, filterKey, withDividerValue }) {
  const containerRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);



  const filteredProducts = Array.isArray(category)
    ? products.filter((product) => category.includes(product.GRUPO) && product.Estado === "Activo")
    : products.filter((product) => product.GRUPO === filterKey && product.Estado === "Activo");

  return (
    <div className={`
    w-1/${withDividerValue}
    h-full relative 
    overflow-hidden`}>
      {selectedProduct && (
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
      )}
      <div className="flex flex-col items-start gap-1">
        <Label className="text-left text-lg font-medium break-words w-full font-SpaceGrotesk">
          {Array.isArray(category) ? category.join(' & ').toUpperCase() : category.toUpperCase()} 
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
