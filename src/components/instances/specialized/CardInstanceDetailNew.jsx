import React from 'react';
import { DetailedInstanceCard } from '../base/InstanceCard';
import { ShoppingCart, Flame, Leaf, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente CardInstanceDetail refactorizado usando la nueva arquitectura
 * Modal/Card de detalles del producto con acciones integradas
 */
export function CardInstanceDetailNew({ product, onClose, onNext, isEnglish = false }) {
  
  // Helper para iconos de dieta y cuidado
  const renderIcons = () => {
    const dietWarning = product.DietaEN || product.DietaES;
    const careWarning = product.CuidadoEN || product.CuidadoES;
    const icons = [];
    
    if (dietWarning && dietWarning.includes("Vegetarian")) {
      icons.push(<Leaf key="vegetarian" className="h-6 w-6 text-green-500 mr-2" title="Vegetarian" />);
    } else if (dietWarning && dietWarning.includes("Vegan")) {
      icons.push(<Leaf key="vegan" className="h-6 w-6 text-green-700 mr-2" title="Vegan" />);
    } else if (dietWarning && dietWarning.includes("Meat")) {
      icons.push(<Flame key="meat" className="h-6 w-6 text-red-500 mr-2" title="Meat" />);
    }
    
    if (careWarning && careWarning.includes("Spice")) {
      icons.push(<Flame key="spicy" className="h-6 w-6 text-red-500 mr-2" title="Spicy" />);
    } else if (careWarning && careWarning.includes("Walnuts")) {
      icons.push(<AlertTriangle key="nuts" className="h-6 w-6 text-orange-500 mr-2" title="Contains Walnuts" />);
    }
    
    return icons;
  };

  // Contenido principal del card
  const cardContent = (
    <>
      {/* Imagen del producto */}
      {product.Foto && (
        <div className="relative w-full h-[300px] overflow-hidden rounded-lg mb-4">
          <img 
            src={product.Foto} 
            alt={product.NombreEN || product.NombreES} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}

      {/* Información del producto */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-gray-900">
          {product.NombreEN || product.NombreES}
        </h3>
        
        <p className="text-lg text-gray-600">
          {product.DescripcionMenuEN || product.DescripcionMenuES}
        </p>
        
        {/* Iconos de dieta y cuidado */}
        <div className="flex items-center mt-2">
          {renderIcons()}
        </div>
        
        {/* Precio y tiempo */}
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-gray-800">
            ${product.Precio}
          </p>
          <p className="text-gray-500">
            Tiempo aprox: {product.AproxTime} min 🕐
          </p>
        </div>
      </div>
    </>
  );

  // Acciones del footer
  const footerActions = (
    <div className="flex justify-between gap-4 w-full">
      {onClose && (
        <Button onClick={onClose} variant="outline" className="flex-1">
          Cerrar
        </Button>
      )}
      {onNext && (
        <Button onClick={onNext} variant="default" className="flex-1">
          Siguiente
        </Button>
      )}
    </div>
  );

  return (
    <DetailedInstanceCard
      title={null} // El título está en el contenido
      data={product}
      showActions={false}
      showStatusButtons={false}
      className="w-full max-w-lg"
      footerSlot={footerActions}
    >
      {cardContent}
    </DetailedInstanceCard>
  );
}
