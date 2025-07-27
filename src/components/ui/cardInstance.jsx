import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Flame, Leaf, AlertTriangle } from "lucide-react"; // Icons for diet and care warnings
import { Button } from "@/components/ui/button";
import { CardInstanceDetail } from "./cardInstanceDetail";
import { ENG, ESP } from "../../redux/actions-types";
// import {CardInstanceDetail} from "./CardInstanceDetail";

export function CardInstance({ product, isEnglish }) {


 const leng = isEnglish === ESP ? false : true;
 
  const [showDetail, setShowDetail] = useState(false);

  const dietWarning = leng ? product.DietaEN : product.DietaES;
  const careWarning = leng ? product.CuidadoEN : product.CuidadoES;

  const renderIcons = () => {
    const icons = [];
    if (dietWarning === "Vegetarian" || dietWarning === "Vegetarino") {
      icons.push(
        <Leaf key="vegetarian" className="h-4 w-4 text-green-500 mr-2" title="Vegetarian" />
      );
    } else if (dietWarning === "Vegan" || dietWarning === "Vegano") {
      icons.push(
        <Leaf key="vegan" className="h-4 w-4 text-green-700 mr-2" title="Vegan" />
      );
    } else if (dietWarning === "Meat" || dietWarning === "Carnico") {
      icons.push(
        <Flame key="meat" className="h-4 w-4 text-red-500 mr-2" title="Meat" />
      );
    }

    if (careWarning === "Spice" || careWarning === "Picante") {
      icons.push(
        <Flame key="spicy" className="h-4 w-4 text-red-500 mr-2" title="Spicy" />
      );
    } else if (careWarning === "Walnuts" || careWarning === "Nueces") {
      icons.push(
        <AlertTriangle
          key="nuts"
          className="h-4 w-4 text-orange-500 mr-2"
          title="Contains Walnuts"
        />
      );
    }
    return icons;
  };

  return (
    <>
        <Card
          className="w-[260px] h-full shadow-lg rounded-xl overflow-hidden border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo relative z-10"
          onClick={() => setShowDetail(true)}
        >
          <div className="relative h-[220px] w-full z-0 overflow-hidden">
            {product.Foto && (
              <img
                src={product.Foto}
                alt={leng ? product.NombreEN : product.NombreES}
                className="w-full h-full object-cover"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/70 rounded-full p-1"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
          <CardContent className="p-2 flex flex-col justify-between text-gray-900">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold truncate font-LilitaOne " >
                {leng ? product.NombreEN : product.NombreES}
              </h3> 
              <span className="text-lg font-semibold text-gray-800">${product.Precio}</span>
            </div>
                {/* <p className="text-sm text-gray-500 line-clamp-2">
                  {isEnglish ? product.DescripcionMenuEN : product.DescripcionMenuES}
                </p> */}
                {leng ? "Click for details..." : "Click para detalles..."}
                <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">{renderIcons()}</div>
              <span className="text-gray-500">{product.AproxTime} min 🕐</span>
            </div>
          </CardContent>
        </Card>
    </>
  );
}
