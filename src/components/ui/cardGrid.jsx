import { Label } from "@/components/ui/label";
import React, { useRef } from 'react';
import { CardInstance } from "@/components/ui/cardInstance";

export function CardGrid({ products, isEnglish, category }) {

  const containerRef = useRef(null);

  const handleSwipeEnd = () => {
    const container = containerRef.current;
    const cardWidth = document.querySelector('.card').offsetWidth;
    const cardMargin = parseInt(window.getComputedStyle(document.querySelector('.card')).marginRight, 10);
    const swipeDistance = cardWidth + cardMargin;

    const currentScroll = container.scrollLeft;
    const nearestCardIndex = Math.round(currentScroll / swipeDistance);

    container.scrollTo({
      left: nearestCardIndex * swipeDistance,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Label aligned to the left */}
      <div className="w-full flex justify-start">
        <Label className="text-left text-lg font-bold truncate">
          {category}
        </Label>
      </div>

      <div className="container mx-auto">
        {/* Horizontal scroll with added gap between cards */}
        <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth gap-x-4">  {/* Agregamos gap-x-4 */}
          {products.map((product) => (
            <div key={product._id} className="snap-center flex-shrink-0 w-[260px]">
              <CardInstance product={product} isEnglish={isEnglish} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}


