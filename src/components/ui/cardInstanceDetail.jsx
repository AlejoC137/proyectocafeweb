import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Flame, Leaf, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CardInstanceDetail({ product, onClose, onNext }) {
  const dietWarning = product.DietaEN || product.DietaES;
  const careWarning = product.CuidadoEN || product.CuidadoES;

  const renderIcons = () => {
    const icons = [];
    if (dietWarning && dietWarning.includes("Vegetarian")) {
      icons.push(<Leaf key="vegetarian" className="h-6 w-6 text-green-500 mr-2" title="Vegetarian" />);
    } else if (dietWarning && dietWarning.includes("Vegan")) {
      icons.push(<Leaf key="vegan" className="h-6 w-6 text-green-700 mr-2" title="Vegan" />);
    } else if (dietWarning && dietWarning.includes("Meat")) {
      icons.push(<Flame key="meat" className="h-6 w-6 text-red-500 mr-2" title="Meat" />);
    }
    if (careWarning && careWarning.includes("Spice")) {
      icons.push(<Flame key="spicy" className="h-6 w-6 text-red-500 mr-2" title="Spicy" />);
    } else if (careWarning && careWarning.includes("Walnuts")) {
      icons.push(<AlertTriangle key="nuts" className="h-6 w-6 text-orange-500 mr-2" title="Contains Walnuts" />);
    }
    return icons;
  };

  return (
    <Card className="w-full max-w-lg shadow-lg rounded-xl overflow-hidden border border-gray-300 p-4">
      <div className="relative w-full h-[300px] overflow-hidden">
        {product.Foto && <img src={product.Foto} alt={product.NombreEN || product.NombreES} className="w-full h-full object-cover" />}
      </div>
      <CardContent className="p-4 text-gray-900">
        <h3 className="text-2xl font-bold">{product.NombreEN || product.NombreES}</h3>
        <p className="text-lg text-gray-600">{product.DescripcionMenuEN || product.DescripcionMenuES}</p>
        <div className="flex items-center mt-2">{renderIcons()}</div>
        <p className="text-xl font-semibold text-gray-800 mt-2">${product.Precio}</p>
        <p className="text-gray-500">Tiempo aprox: {product.AproxTime} min 🕐</p>
        <div className="flex justify-between mt-4">
          <Button onClick={onClose} variant="outline">Cerrar</Button>
          <Button onClick={onNext} variant="default">Siguiente</Button>
        </div>
      </CardContent>
    </Card>
  );
}
