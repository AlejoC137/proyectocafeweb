import React, { useState } from 'react';
import { CardInstance } from "@/components/ui/cardInstance";
import { CardInstanceDetail } from "@/components/ui/cardInstanceDetail";
import { TARDEO_ALMUERZO } from "../../redux/actions-types";
import { getCategoryMarquee } from "../../utils/categoryMarquees";

export function CardGrid({ products, isEnglish, TITTLE, filterKey, ICON }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const toggleVisibility = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full rounded-none">
      {selectedProduct && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-1 rounded-none ">
          <CardInstanceDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onNext={() => {
              const filteredProducts = products.filter(p => p.GRUPO === filterKey && p.Estado === "Activo" && p.SUB_GRUPO !== TARDEO_ALMUERZO);
              const currentIndex = filteredProducts.findIndex(p => p._id === selectedProduct._id);
              const nextProduct = filteredProducts[currentIndex + 1] || filteredProducts[0];
              setSelectedProduct(nextProduct);
            }}
            isEnglish={isEnglish}
          />
        </div>
      )}

      <button
        onClick={toggleVisibility}
        className="flex border-[3px] border-black justify-between items-center w-full text-left cursor-pointer bg-cream-bg p-1 hover:bg-black hover:text-white transition-colors duration-0 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[3px] hover:translate-x-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group relative z-10"
      >
        <div className="text-left text-xl md:text-3xl font-black uppercase tracking-widest m-0 flex items-center gap-3 rounded-none shrink-0" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          <span className="text-3xl md:text-4xl">{ICON}</span>
          <span className="pt-1">{TITTLE}</span>
        </div>

        {/* Cinta Rotatoria Descriptiva Continua */}
        <div className="flex-1 overflow-hidden mx-2 md:mx-4 h-full flex items-center  group-hover:opacity-100 transition-opacity" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black, black 5%, black 95%, transparent)' }}>
          <style>{`
            @keyframes marquee-seamless {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-seamless {
              display: flex;
              width: max-content;
              animation: marquee-seamless 6s linear infinite;
            }
          `}</style>
          <div className="animate-marquee-seamless text-[14px] md:text-sm font-black uppercase tracking-widest text-black">
            <span className="pr-16 shrink-0">{getCategoryMarquee(filterKey)}</span>
            <span className="pr-16 shrink-0">{getCategoryMarquee(filterKey)}</span>
            <span className="pr-16 shrink-0">{getCategoryMarquee(filterKey)}</span>
            <span className="pr-16 shrink-0">{getCategoryMarquee(filterKey)}</span>
          </div>
        </div>

        <div className="shrink-0">
          {isOpen ? (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="stroke-current stroke-[4] group-hover:text-white">
              <path d="M6 9l6 6 6-6" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          ) : (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="stroke-current stroke-[4] group-hover:text-white">
              <path d="M9 5l7 7-7 7" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="w-full mb-2 rounded-none mt-2">
          <div className="flex overflow-x-auto gap-1 w-full rounded-none pb-2 snap-x snap-mandatory drop-shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {products
              .filter(
                (product) =>
                  product.GRUPO === filterKey &&
                  product.Estado === "Activo" &&
                  product.SUB_GRUPO !== TARDEO_ALMUERZO
              )
              .map((product) => (
                <div key={product._id} className="min-w-[85vw] sm:min-w-[45vw] lg:min-w-[30vw] xl:min-w-[22vw] flex flex-shrink-0 justify-center rounded-none snap-start" onClick={() => setSelectedProduct(product)}>
                  <CardInstance product={product} isEnglish={isEnglish} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
