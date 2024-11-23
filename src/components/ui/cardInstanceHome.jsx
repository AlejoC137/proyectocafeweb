import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react"; // Ícono de favorito
import { Button } from "@/components/ui/button";

export function CardInstanceHome({ product }) {
  return (
    <Card
      className="w-[190px] h-full shadow-lg rounded-xl overflow-hidden border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo"
    >
      {/* Nombre del producto */}
      <div className="p-2 bg-gray-100">
        <h3 className="text-lg font-bold text-gray-900 truncate">
          {product.nombre || "Especial del Día"}
        </h3>
      </div>

      {/* Imagen */}
      <div className="relative h-[160px] w-full">
        <img
          src={product.foto || "/default-image.jpg"}
          // alt={product.nombre || "Especial"}
          className="w-full h-full object-cover"
        />
        {/* Botón de favorito */}

      </div>

      {/* Contenido y descripción */}
      <CardContent className="p-2 flex flex-col gap- text-gray-900">
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
