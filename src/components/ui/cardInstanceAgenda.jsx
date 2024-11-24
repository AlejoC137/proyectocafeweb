import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CardInstanceAgenda({ product }) {
  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo">
      {/* Imagen del banner */}
      <div className="relative h-[200px] w-full">
        <img
          src={product.bannerIMG || "/default-image.jpg"}
          alt={product.nombre || "Evento"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenido del evento */}
      <CardContent className="p-2 flex flex-col gap-1 text-gray-900">
        {/* Nombre del evento */}
        <h3 className="text-xl font-bold">{product.nombre || "Nombre del Evento"}</h3>

        {/* Fecha y hora */}
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Fecha:</span> {product.fecha}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Hora:</span> {product.horaInicio} - {product.horaFinal}
        </p>

        {/* Autores */}
        {/* <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Autores:</span> {product.autores || "No especificado"}
        </p> */}

        {/* Valor */}
        {/* <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Valor:</span> {product.valor || "Gratis"}
        </p> */}

        {/* Información adicional */}
        {/* <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Detalles:</span> {product.infoAdicional || "Información no disponible"}
        </p> */}

        {/* Botón de inscripción */}
        <div className="mt-2">
          <a href={product.linkInscripcion} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-blue-500 text-white hover:bg-blue-600">Inscribirse</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
