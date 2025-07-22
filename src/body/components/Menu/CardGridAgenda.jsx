import React from "react";
import { Label } from "@/components/ui/label"; // Importa Label para el título
import { CardInstanceAgendaPrint } from "../../../components/ui/cardInstanceAgendaPrint";

function CardGridAgenda({ isEnglish, data }) {
  // Asegurarse de que 'data' sea un array antes de intentar iterar sobre él
  if (!Array.isArray(data)) {
    return null; // O mostrar un mensaje de carga/error
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="flex flex-col items-start gap-1">
        {/* Título para la sección de agenda */}
        <Label className="text-left flex text-lg font-medium break-words w-full truncate font-SpaceGrotesk font-bold">
          AGENDA
        </Label>

        {/* Contenedor con scroll para la lista de eventos */}
        <div className="flex flex-col overflow-y-auto scrollbar-hide gap-0 w-full">
          {/* Itera sobre el array 'data' y renderiza una tarjeta para cada evento */}
          {data.map((event) => (
            <div key={event._id}>
              <CardInstanceAgendaPrint event={event} isEnglish={isEnglish} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CardGridAgenda;