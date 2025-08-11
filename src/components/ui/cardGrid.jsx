import { Label } from "@/components/ui/label";
import React, { useRef, useState } from 'react';
import { CardInstance } from "@/components/ui/cardInstance";
import { CardInstanceDetail } from "@/components/ui/cardInstanceDetail";
import { TARDEO_ALMUERZO } from "../../redux/actions-types";

// La prop 'TITTLE' ahora reemplaza a 'category' para mayor claridad.
export function CardGrid({ products, isEnglish, TITTLE, filterKey, ICON }) {
  const containerRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Estado para controlar si la sección está abierta o cerrada. Por defecto, está abierta.
  const [isOpen, setIsOpen] = useState(true);

  // Función para cambiar el estado de visibilidad
  const toggleVisibility = () => {
    setIsOpen(!isOpen);
  };

  

  return (
    <div className="relative overflow-y-hidden">
      {selectedProduct && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-40 p-4">
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
      
      {/* El título ahora es un botón que controla la visibilidad */}
      <button 
        onClick={toggleVisibility} 
        className="flex border-black border justify-start items-center mb-1 w-full text-left cursor-pointer"
      style={{ backgroundColor: "#fff" }}
      >
  

          <Label
            className="text-left text-2xl font-SpaceGrotesk font-bold truncate m-0 cursor-pointer flex items-center gap-2"
            
          >
            <span>{TITTLE} {ICON}</span>
            {isOpen ? (
            // Flecha hacia abajo (abierto)
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            // Flecha hacia la derecha (cerrado)
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </Label>
      </button>
      {isOpen && (
        <div className="container mx-auto">
          <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide snap-x  snap-mandatory scroll-smooth gap-x-4">
            {products
              .filter(
                (product) =>
                  product.GRUPO === filterKey &&
                  product.Estado === "Activo" &&
                  product.SUB_GRUPO !== TARDEO_ALMUERZO // <-- Agregado este filtro
              )
              .map((product) => (
                <div key={product._id} className="snap-center  flex-shrink-0 w-[280px]" onClick={() => setSelectedProduct(product)}>
                  <CardInstance product={product} isEnglish={isEnglish} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
