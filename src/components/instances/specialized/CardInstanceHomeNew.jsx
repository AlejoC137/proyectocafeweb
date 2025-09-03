import React from 'react';
import { ReadOnlyInstanceCard } from '../base/InstanceCard';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

/**
 * Componente CardInstanceHome refactorizado usando la nueva arquitectura
 * Card para mostrar el especial del día con información detallada
 */
export function CardInstanceHomeNew({ product }) {
  
  // Botón de favorito para el header
  const favoriteButton = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="bg-white/70 rounded-full p-1"
    >
      <Heart className="h-5 w-5 text-gray-700" />
    </Button>
  );

  // Imagen del producto
  const productImage = (
    <div className="relative h-[25vh] w-full mb-4">
      <img
        src={product.foto || "/default-image.jpg"}
        alt={product.nombre || "Especial"}
        className="w-full h-full object-cover rounded-lg"
      />
      {/* Botón de favorito superpuesto */}
      <div className="absolute top-2 right-2">
        {favoriteButton}
      </div>
    </div>
  );

  // Contenido detallado del menú
  const menuContent = (
    <div className="space-y-2 text-gray-900">
      <div className="grid grid-cols-1 gap-2">
        <div className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Entrada:</span> {product.entrada}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Proteína 1:</span> {product.proteina_op1}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Proteína 2:</span> {product.proteina_op2}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Acompañante:</span> {product.acompañante}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Bebida:</span> {product.bebida}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Ensalada:</span> {product.ensalada}
        </div>
      </div>
    </div>
  );

  // Precio en el footer
  const priceFooter = (
    <div className="text-right border-t pt-2">
      <span className="text-lg font-semibold text-gray-800">
        {product.precio || "N/A"}
      </span>
    </div>
  );

  return (
    <ReadOnlyInstanceCard
      title={product.nombre || "Especial del Día"}
      data={product}
      variant="detailed"
      className="w-full h-[48vh] border-r-4 border-r-ladrillo border-b-4 border-b-ladrillo"
      headerClassName="bg-gray-100 p-2 -m-4 mb-4"
      footerSlot={priceFooter}
    >
      {productImage}
      {menuContent}
    </ReadOnlyInstanceCard>
  );
}
