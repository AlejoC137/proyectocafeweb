import { Label } from "@/components/ui/label";
import React, { useRef, useState } from 'react';
import { CardInstance } from "@/components/ui/cardInstance";
import { CardInstanceDetail } from "@/components/ui/cardInstanceDetail";

export function CardGrid({ products, isEnglish, category, filterKey }) {
  const containerRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleSwipeEnd = () => {
    const container = containerRef.current;
    const cardWidth = document.querySelector('.card')?.offsetWidth || 0;
    const cardMargin = parseInt(window.getComputedStyle(document.querySelector('.card'))?.marginRight, 10) || 0;
    const swipeDistance = cardWidth + cardMargin;

    const currentScroll = container.scrollLeft;
    const nearestCardIndex = Math.round(currentScroll / swipeDistance);

    container.scrollTo({
      left: nearestCardIndex * swipeDistance,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative">
      {selectedProduct && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
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
      <div className="flex justify-start overflow-hidden">
        <Label className="text-left text-lg font-bold truncate">
          {category && category.toUpperCase()} 
        </Label>
        <Label className="text-left text-lg font-bold truncate text-bol">
          →
        </Label>
      </div>
      <div className="container mx-auto">
        <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth gap-x-4">
          {products
            .filter((product) => product.TipoEN === filterKey && (product.Estado === "Activo"))
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
