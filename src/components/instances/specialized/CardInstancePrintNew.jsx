import React, { useState } from 'react';
import { CompactInstanceCard } from '../base/InstanceCard';
import { usePrintDisplayCard } from '../hooks/useDisplayCard';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente CardInstancePrint refactorizado usando la nueva arquitectura
 * Versión optimizada para impresión con diseño compacto
 */
export function CardInstancePrintNew({ product, isEnglish = false }) {
  const [showDetail, setShowDetail] = useState(false);
  
  // Usar hook especializado para print
  const {
    localizedText,
    formattedPrice,
    hasPrice
  } = usePrintDisplayCard(product, isEnglish);

  // Botón de carrito (solo visual para print)
  const cartButton = (
    <Button variant="ghost" size="icon" className="absolute bg-white/70">
      <ShoppingCart className="h-5 w-5 text-gray-700" />
    </Button>
  );

  // Contenido optimizado para impresión
  const printContent = (
    <div className="flex flex-col justify-between text-gray-900 font-light h-full">
      {/* Header con nombre y precio */}
      <div className="flex justify-between items-center">
        <h3 className="text-10pt truncate border-b border-black w-full font-bold font-custom font-SpaceGrotesk">
          {localizedText.name}
        </h3>
        {hasPrice && (
          <span 
            className="font-semibold text-gray-800 font-SpaceGrotesk ml-2 flex-shrink-0" 
            style={{ fontSize: '12px' }}
          >
            ${formattedPrice}
          </span>
        )}
      </div>
      
      {/* Descripción */}
      {localizedText.description && (
        <div className="flex justify-between items-center mt-1">
          <h3 
            className="text-md font-medium line-clamp-2 font-SpaceGrotesk" 
            style={{ fontSize: '10px' }}
          >
            {localizedText.description}
          </h3>
        </div>
      )}
    </div>
  );

  return (
    <CompactInstanceCard
      data={product}
      onClick={() => setShowDetail(true)}
      showActions={false}
      showStatusButtons={false}
      className="w-full h-full overflow-hidden pt-0 pl-1 pr-1 shadow-none"
      contentClassName="p-0 flex flex-col justify-between text-gray-900 font-light relative"
      headerSlot={cartButton}
    >
      {printContent}
    </CompactInstanceCard>
  );
}
