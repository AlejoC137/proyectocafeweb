import { Label } from "@/components/ui/label";
import React, { useRef, useState } from 'react';
import { CardInstance } from "@/components/ui/cardInstance";
import { CardInstanceDetail } from "@/components/ui/cardInstanceDetail";

// La prop 'TITTLE' ahora reemplaza a 'category' para mayor claridad.
export function CardGrid({ products, isEnglish, TITTLE, filterKey }) {

  console.log('TITTLE:', TITTLE);
  
  const containerRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ... (el resto de tus funciones como handleSwipeEnd se mantienen igual)

  return (
    <div className="relative">
      {selectedProduct && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
          <CardInstanceDetail 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            onNext={() => {
              // Navegación dentro de los productos filtrados
              const filteredProducts = products.filter(p => p.GRUPO === filterKey && p.Estado === "Activo");
              const currentIndex = filteredProducts.findIndex(p => p._id === selectedProduct._id);
              const nextProduct = filteredProducts[currentIndex + 1] || filteredProducts[0];
                setSelectedProduct(nextProduct);
              }}
              isEnglish={isEnglish} 
              />
            </div>
            )}
            
            <div className="flex justify-start items-center mb-2">
            <Label className="text-left text-lx font-LilitaOne font-bold truncate" style={{ fontSize: '25pt' }}>
              {/* Usa la prop TITTLE y selecciona el idioma correcto */}
          {TITTLE } 
        </Label>
        <Label className="text-left text-lg font-bold truncate mx-2">→</Label>
      </div>

      <div className="container mx-auto">
        <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth gap-x-4">
          {products
            // CAMBIO CLAVE: Se filtra por GRUPO en lugar de TipoEN
            .filter((product) => product.GRUPO === filterKey && (product.Estado === "Activo"))
            .map((product) => (
              <div key={product._id} className="snap-center flex-shrink-0 w-[260px]" onClick={() => setSelectedProduct(product)}>
                <CardInstance product={product} isEnglish={isEnglish} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
