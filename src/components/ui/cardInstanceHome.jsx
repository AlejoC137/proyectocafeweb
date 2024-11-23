import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react"; // Ícono de favorito

export function CardInstanceHome({ product }) {
  return (
    <Card
      className="w-full h-[48vh] shadow-lg rounded-xl overflow-hidden border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo"
    >
      {/* Nombre del producto */}
      <div className="p-2 bg-gray-100">
        <h3 className="text-xl font-bold text-gray-900 truncate">{product.nombre || "Especial del Día"}</h3>
      </div>

      {/* Imagen */}
      <div className="relative h-[25vh] w-full">
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

      {/* Contenido y descripción */}
      <CardContent className="p-2 flex flex-col gap-0.5 text-gray-900">
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Entrada:</span> {product.entrada}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Proteína 1:</span> {product.proteina_op1}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Proteína 2:</span> {product.proteina_op2}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Acompañante:</span> {product.acompañante}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Bebida:</span> {product.bebida}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Ensalada:</span> {product.ensalada}
        </p>

        {/* Precio */}
        <div className="mt-2 text-right">
          <span className="text-lg font-semibold text-gray-800">{product.precio || "N/A"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
