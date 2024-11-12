'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Flame, Leaf, AlertTriangle } from "lucide-react" // Icons for diet and care warnings
import { Button } from "@/components/ui/button"

export function CardInstance({ product, isEnglish }) {
  // Determinar qué advertencias se deben mostrar basado en la dieta y cuidados
  const dietWarning = isEnglish ? product.DietaEN : product.DietaES;
  const careWarning = isEnglish ? product.CuidadoEN : product.CuidadoES;

  // Función para obtener íconos basados en las advertencias
  const renderIcons = () => {
    const icons = [];

    // Verificar advertencias dietarias
    if (dietWarning === 'Vegetarian' || dietWarning === 'Vegetarino') {
      icons.push(<Leaf key="vegetarian" className="h-4 w-4 text-green-500 mr-2" title="Vegetarian" />);
    } else if (dietWarning === 'Vegan' || dietWarning === 'Vegano') {
      icons.push(<Leaf key="vegan" className="h-4 w-4 text-green-700 mr-2" title="Vegan" />);
    } else if (dietWarning === 'Meat' || dietWarning === 'Carnico') {
      icons.push(<Flame key="meat" className="h-4 w-4 text-red-500 mr-2" title="Meat" />);
    }

    // Verificar advertencias de cuidados
    if (careWarning === 'Spice' || careWarning === 'Picante') {
      icons.push(<Flame key="spicy" className="h-4 w-4 text-red-500 mr-2" title="Spicy" />);
    } else if (careWarning === 'Walnuts' || careWarning === 'Nueces') {
      icons.push(<AlertTriangle key="nuts" className="h-4 w-4 text-orange-500 mr-2" title="Contains Walnuts" />);
    }

    return icons;
  };

  return (
    <Card className="w-[260px] h-full shadow-lg rounded-xl overflow-hidden 
    border-r-4 border-r-ladrillo
    border-b-4 border-b-ladrillo
    "    
    >  {/* Set height to 100% */}
      {/* Sección de la imagen */}
      <div className="relative h-[220px] w-full">
        <img
          src={product.Foto}
          alt={isEnglish ? product.NombreEN : product.NombreES}
          className="w-full h-full object-cover"
        />
        {/* Ícono de favorito */}
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/70 rounded-full p-1">
          <Heart className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Sección del contenido */}
      <CardContent className="p-2 flex flex-col justify-between text-gray-900">
        {/* Nombre y precio en la misma línea */}
        <div className="flex justify-between items-center">
          <h3 className="text-md font-bold truncate">{isEnglish ? product.NombreEN : product.NombreES}</h3>
          <span className="text-lg font-semibold text-gray-800">${product.Precio}</span>
        </div>

        {/* Descripción */}
        <p className="text-sm text-gray-500 line-clamp-2">
          {isEnglish ? product.DescripcionMenuEN : product.DescripcionMenuES}
        </p>

        {/* Sección de advertencias (dietarias y de cuidado) */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            {renderIcons()}
          </div>
          <span className="text-gray-500">{product.AproxTime} min 🕐</span>
        </div>
      </CardContent>
    </Card>
  )
}
