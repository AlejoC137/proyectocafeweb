import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react"; // Ícono de favorito
import { Button } from "@/components/ui/button";

export function CardInstanceHome({ product }) {
  return (
    <Card
      className="w-[190px] h-full shadow-lg rounded-xl overflow-hidden border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo"
    >
      {/* Imagen */}
      <div className="relative h-[180px] w-full">
        <img
          src={product.foto || "/default-image.jpg"}
          alt={product.nombre || "Especial"}
          className="w-full h-full object-cover"
        />
        {/* Botón de favorito */}
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/70 rounded-full p-1">
          <Heart className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Contenido */}
      <CardContent className="p-2 flex flex-col justify-between text-gray-900">
        {/* Título y precio */}
        <div className="flex justify-between items-center">
          <h3 className="text-md font-bold truncate">{product.nombre || "Especial del Día"}</h3>
          <span className="text-lg font-semibold text-gray-800">{product.precio || "N/A"}</span>
        </div>

        {/* Descripción */}
        <p className="text-sm text-gray-500 line-clamp-2">
          {`Proteína 1: ${product.proteina_op1} | Proteína 2: ${product.proteina_op2} | Acompañante: ${product.acompañante}`}
        </p>

        {/* Entrada y ensalada */}
        <p className="text-xs text-gray-500 line-clamp-2">
          {`Entrada: ${product.entrada} | Ensalada: ${product.ensalada}`}
        </p>
      </CardContent>
    </Card>
  );
}
