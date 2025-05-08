import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/cardPrint";
import { ShoppingCart, Flame, Leaf, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CardInstancePrint({ product, isEnglish }) {
  const [showDetail, setShowDetail] = useState(false);

  const dietWarning = isEnglish ? product.DietaEN : product.DietaES;
  const careWarning = isEnglish ? product.CuidadoEN : product.CuidadoES;

  const renderIcons = () => {
    const icons = [];
    if (dietWarning === "Vegetarian" || dietWarning === "Vegetarino") {
      icons.push(<Leaf key="vegetarian" className="h-4 w-4 text-green-500 mr-2" title="Vegetarian" />);
    } else if (dietWarning === "Vegan" || dietWarning === "Vegano") {
      icons.push(<Leaf key="vegan" className="h-4 w-4 text-green-700 mr-2" title="Vegan" />);
    } else if (dietWarning === "Meat" || dietWarning === "Carnico") {
      icons.push(<Flame key="meat" className="h-4 w-4 text-red-500 mr-2" title="Meat" />);
    }

    if (careWarning === "Spice" || careWarning === "Picante") {
      icons.push(<Flame key="spicy" className="h-4 w-4 text-red-500 mr-2" title="Spicy" />);
    } else if (careWarning === "Walnuts" || careWarning === "Nueces") {
      icons.push(<AlertTriangle key="nuts" className="h-4 w-4 text-orange-500 mr-2" title="Contains Walnuts" />);
    }
    return icons;
  };

  return (
    <Card className="w-full h-full overflow-hidden pt-1 pl-1 pr-1 shadow-none" onClick={() => setShowDetail(true)}>
      <div className="relative z-0 overflow-hidden">
        <Button variant="ghost" size="icon" className="absolute bg-white/70">
          <ShoppingCart className="h-5 w-5 text-gray-700" />
        </Button>
      </div>
      <CardContent className="p-1 flex flex-col justify-between text-gray-900 font-light">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium truncate font-SpaceGrotesk" style={{ fontSize: '13px' }}>
            {isEnglish ? product.NombreEN : product.NombreES}
          </h3>
          <span className="font-semibold text-gray-800 font-SpaceGrotesk" style={{ fontSize: '12px' }}>${product.Precio}</span>
        </div>
        
        {/* <div className="flex items-center">{renderIcons()}</div> */}
      </CardContent>
    </Card>
  );
}
