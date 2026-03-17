import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/cardPrint";
import { ShoppingCart, Flame, Leaf, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CuidadoVariations from "./CuidadoVariations";

export function CardInstancePrint({ product, isEnglish }) {
  const [showDetail, setShowDetail] = useState(false);

  const formatPrice = (precio) => {
    if (precio >= 1000) {
      return `${precio / 1000}K`;
    }
    return precio;
  };

  const dietWarning = isEnglish ? product.DietaEN : product.DietaES;
  const careWarning = isEnglish ? product.CuidadoEN : product.CuidadoES;

  const renderIcons = () => {
    const icons = [];
    if (dietWarning === "Vegetarian" || dietWarning === "Vegetarino") {
      icons.push(<Leaf key="vegetarian" className="h-3 w-3 text-green-500 mr-1" title="Vegetarian" />);
    } else if (dietWarning === "Vegan" || dietWarning === "Vegano") {
      icons.push(<Leaf key="vegan" className="h-3 w-3 text-green-700 mr-1" title="Vegan" />);
    } else if (dietWarning === "Meat" || dietWarning === "Carnico") {
      icons.push(<Flame key="meat" className="h-3 w-3 text-red-500 mr-1" title="Meat" />);
    }

    if (careWarning === "Spice" || careWarning === "Picante") {
      icons.push(<Flame key="spicy" className="h-3 w-3 text-red-500 mr-1" title="Spicy" />);
    } else if (careWarning === "Walnuts" || careWarning === "Nueces") {
      icons.push(<AlertTriangle key="nuts" className="h-3 w-3 text-orange-500 mr-1" title="Contains Walnuts" />);
    }
    return icons;
  };

  return (
    <Card className="w-full overflow-hidden shadow-none border-none p-0 rounded-none bg-transparent" onClick={() => setShowDetail(true)}>
      <CardContent className="p-0 flex flex-col justify-between text-black font-light leading-none">
        <div className="flex justify-between items-end border-b-[0.5px] border-black border-dotted pb-[1px] mb-[1px]">
          <div className="flex items-center gap-1 overflow-hidden" >
            <h3 className="text-[10px] sm:text-[11px] font-bold font-SpaceGrotesk uppercase truncate">
              {isEnglish ? product.NombreEN : product.NombreES}
            </h3>
            <div className="scale-75 origin-left">
              <CuidadoVariations viewName={'MenuPrint'} product={product} isEnglish={isEnglish} />
            </div>
          </div>

          <span className="font-bold font-SpaceGrotesk ml-1 whitespace-nowrap text-[10px] sm:text-[11px]">
            ${formatPrice(product.Precio)}
          </span>
        </div>
        <div className="flex justify-between items-start mt-[1px]">
          <h3 className="font-medium line-clamp-2 font-SpaceGrotesk text-[8px] sm:text-[9px] leading-tight text-gray-800">
            {isEnglish ? product.DescripcionMenuEN : product.DescripcionMenuES}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
}