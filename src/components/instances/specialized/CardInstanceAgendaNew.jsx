import React from 'react';
import { ReadOnlyInstanceCard } from '../base/InstanceCard';
import { useEventDisplayCard } from '../hooks/useDisplayCard';
import { Button } from '@/components/ui/button';

/**
 * Componente CardInstanceAgenda refactorizado usando la nueva arquitectura
 * Card para mostrar eventos y actividades de la agenda
 */
export function CardInstanceAgendaNew({ product }) {
  
  // Usar hook especializado para eventos
  const {
    imageUrl,
    productType
  } = useEventDisplayCard(product);

  // Imagen del evento
  const eventImage = (
    <div className="relative h-[200px] w-full mb-4">
      <img
        src={imageUrl}
        alt={product.nombre || "Evento"}
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  );

  // Información del evento
  const eventInfo = (
    <div className="space-y-1 text-gray-900">
      {/* Fecha y hora */}
      {product.fecha && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Fecha:</span> {product.fecha}
        </p>
      )}
      
      {product.horaInicio && product.horaFinal && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Hora:</span> {product.horaInicio} - {product.horaFinal}
        </p>
      )}

      {/* Información adicional comentada - se puede activar si es necesaria */}
      {/* 
      {product.autores && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Autores:</span> {product.autores}
        </p>
      )}
      
      {product.valor && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Valor:</span> {product.valor}
        </p>
      )}
      
      {product.infoAdicional && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Detalles:</span> {product.infoAdicional}
        </p>
      )}
      */}
    </div>
  );

  // Botón de inscripción en el footer
  const inscriptionButton = product.linkInscripcion ? (
    <div className="w-full">
      <a 
        href={product.linkInscripcion} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full"
      >
        <Button className="w-full bg-blue-500 text-white hover:bg-blue-600">
          Inscribirse
        </Button>
      </a>
    </div>
  ) : null;

  return (
    <ReadOnlyInstanceCard
      title={product.nombre || "Nombre del Evento"}
      data={product}
      variant="default"
      className="w-full shadow-lg rounded-xl border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo"
      footerSlot={inscriptionButton}
    >
      {eventImage}
      {eventInfo}
    </ReadOnlyInstanceCard>
  );
}
