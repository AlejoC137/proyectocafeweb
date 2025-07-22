import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function CardInstanceAgendaPrint({ event, isEnglish }) {
  // Combina la hora de inicio y fin en un solo string, ej: "10:00 AM - 02:00 PM"
  const timeRange = [event.horaInicio, event.horaFinal].filter(Boolean).join(" - ");

  return (
    <Card className="w-full h-full overflow-hidden p- shadow-none border-0">
      <CardContent className="p-1 flex flex-col justify-between text-black font-light h-full  border-b border-black">
        {/* Sección de Nombre y Fecha */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-bold font-SpaceGrotesk text-left flex-1 break-words">
            { isEnglish ? event.nombreES : event.nombreEN }
          </h3>
          {event.fecha && (
            <span className="font-semibold text-black-800 font-SpaceGrotesk text-xs whitespace-nowrap">
              {event.fecha}
            </span>
          )}
        </div>

        {/* Sección de detalles adicionales */}
        <div className="mt-auto pt-1">
          {/* Muestra el rango de hora si existe */}
          {timeRange && (
            <div className="flex items-center">
              <span className="text-xs text-black font-SpaceGrotesk">
                {isEnglish ? "Time:" : "Hora:"} {timeRange}
              </span>
            </div>
          )}

          {/* Muestra el lugar solo si existe en los datos */}
          {event.Lugar && (
            <div className="flex items-center mt-1">
              <span className="text-xs text-black font-SpaceGrotesk">
                {isEnglish ? "Place:" : "Lugar:"} {event.Lugar}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}