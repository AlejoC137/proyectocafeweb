import React from 'react';
import { CompactInstanceCard } from '../base/InstanceCard';
import { useEventDisplayCard } from '../hooks/useDisplayCard';

/**
 * Componente CardInstanceAgendaPrint refactorizado usando la nueva arquitectura
 * Versión optimizada para impresión de eventos de agenda
 */
export function CardInstanceAgendaPrintNew({ event, isEnglish = false }) {
  
  // Usar hook especializado para eventos
  const { localizedText } = useEventDisplayCard(event);

  // Combinar hora de inicio y fin
  const timeRange = [event.horaInicio, event.horaFinal]
    .filter(Boolean)
    .join(" - ");

  // Contenido optimizado para impresión de eventos
  const printEventContent = (
    <div className="flex flex-col justify-between text-black font-light h-full">
      {/* Header con nombre y fecha */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-sm font-bold font-SpaceGrotesk text-left flex-1 break-words">
          {isEnglish ? (event.nombreES || event.nombre) : (event.nombreEN || event.nombre)}
        </h3>
        {event.fecha && (
          <span className="font-semibold text-black-800 font-SpaceGrotesk text-xs whitespace-nowrap">
            {event.fecha}
          </span>
        )}
      </div>

      {/* Detalles adicionales */}
      <div className="mt-auto pt-1">
        {/* Rango de hora */}
        {timeRange && (
          <div className="flex items-center">
            <span className="text-xs text-black font-SpaceGrotesk">
              {isEnglish ? "Time:" : "Hora:"} {timeRange}
            </span>
          </div>
        )}

        {/* Lugar del evento */}
        {event.Lugar && (
          <div className="flex items-center mt-1">
            <span className="text-xs text-black font-SpaceGrotesk">
              {isEnglish ? "Place:" : "Lugar:"} {event.Lugar}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <CompactInstanceCard
      title={null} // El título está en el contenido
      data={event}
      showActions={false}
      showStatusButtons={false}
      className="w-full h-full overflow-hidden p-0 shadow-none border-0"
      contentClassName="p-1 flex flex-col justify-between text-black font-light h-full border-b border-black"
    >
      {printEventContent}
    </CompactInstanceCard>
  );
}
