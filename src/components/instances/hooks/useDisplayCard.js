import { useMemo } from 'react';
import { Flame, Leaf, AlertTriangle } from 'lucide-react';

/**
 * Hook especializado para componentes de solo visualización
 * Contiene helpers comunes para formateo, iconos, etc.
 */
export const useDisplayCard = (product, options = {}) => {
  const {
    isEnglish = false,
    showIcons = true,
    showPrice = true,
    showTime = true,
    priceFormat = 'standard' // 'standard' | 'compact' | 'short'
  } = options;

  // Helper para formatear precios
  const formatPrice = useMemo(() => {
    if (!product?.Precio) return 'N/A';
    
    const price = parseFloat(product.Precio);
    
    switch(priceFormat) {
      case 'compact':
        if (price >= 1000) {
          return (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + "K";
        }
        return price.toString();
      
      case 'short':
        if (price >= 1000000) return `${(price/1000000).toFixed(1)}M`;
        if (price >= 1000) return `${(price/1000).toFixed(1)}K`;
        return price.toString();
      
      case 'standard':
      default:
        return price.toLocaleString();
    }
  }, [product?.Precio, priceFormat]);

  // Helper para obtener nombres según idioma
  const getLocalizedText = useMemo(() => {
    return {
      name: isEnglish ? (product?.NombreEN || product?.NombreES) : (product?.NombreES || product?.NombreEN),
      description: isEnglish ? (product?.DescripcionMenuEN || product?.DescripcionMenuES) : (product?.DescripcionMenuES || product?.DescripcionMenuEN),
      type: isEnglish ? (product?.TipoEN || product?.TipoES) : (product?.TipoES || product?.TipoEN),
      subType: isEnglish ? (product?.SubTipoEN || product?.SubTipoES) : (product?.SubTipoES || product?.SubTipoEN),
      diet: isEnglish ? product?.DietaEN : product?.DietaES,
      care: isEnglish ? product?.CuidadoEN : product?.CuidadoES
    };
  }, [product, isEnglish]);

  // Helper para renderizar iconos de dieta y cuidado
  const renderDietIcons = useMemo(() => {
    if (!showIcons) return [];
    
    const { diet, care } = getLocalizedText;
    const icons = [];
    
    // Iconos de dieta
    if (diet === "Vegetarian" || diet === "Vegetarino") {
      icons.push(
        <Leaf key="vegetarian" className="h-4 w-4 text-green-400 mr-2 drop-shadow-md" title="Vegetarian" />
      );
    } else if (diet === "Vegan" || diet === "Vegano") {
      icons.push(
        <Leaf key="vegan" className="h-4 w-4 text-green-300 mr-2 drop-shadow-md" title="Vegan" />
      );
    } else if (diet === "Meat" || diet === "Carnico") {
      icons.push(
        <Flame key="meat" className="h-4 w-4 text-red-400 mr-2 drop-shadow-md" title="Meat" />
      );
    }

    // Iconos de cuidado
    if (care === "Spice" || care === "Picante") {
      icons.push(
        <Flame key="spicy" className="h-4 w-4 text-red-400 mr-2 drop-shadow-md" title="Spicy" />
      );
    } else if (care === "Walnuts" || care === "Nueces") {
      icons.push(
        <AlertTriangle key="nuts" className="h-4 w-4 text-orange-400 mr-2 drop-shadow-md" title="Contains Walnuts" />
      );
    }

    return icons;
  }, [getLocalizedText, showIcons]);

  // Helper para formatear tiempo
  const formatTime = useMemo(() => {
    if (!showTime || !product?.AproxTime) return null;
    return `${product.AproxTime} min 🕐`;
  }, [product?.AproxTime, showTime]);

  // Helper para obtener imagen con fallback
  const getImageUrl = useMemo(() => {
    return product?.Foto || product?.bannerIMG || product?.foto || '/placeholder.svg';
  }, [product?.Foto, product?.bannerIMG, product?.foto]);

  // Helper para detectar si es evento (tiene fecha/hora)
  const isEvent = useMemo(() => {
    return !!(product?.fecha || product?.horaInicio || product?.linkInscripcion);
  }, [product?.fecha, product?.horaInicio, product?.linkInscripcion]);

  // Helper para detectar si es menú lunch (tiene Comp_Lunch)
  const isLunchMenu = useMemo(() => {
    return !!(product?.Comp_Lunch || product?.entrada || product?.proteina_op1);
  }, [product?.Comp_Lunch, product?.entrada, product?.proteina_op1]);

  // Helper para detectar tipo de producto
  const getProductType = useMemo(() => {
    if (isEvent) return 'event';
    if (isLunchMenu) return 'lunch';
    if (product?.GRUPO || product?.Nombre_del_producto) return 'inventory';
    return 'menu';
  }, [isEvent, isLunchMenu, product]);

  return {
    // Datos formateados
    localizedText: getLocalizedText,
    formattedPrice: formatPrice,
    formattedTime: formatTime,
    imageUrl: getImageUrl,
    
    // Componentes renderizados
    dietIcons: renderDietIcons,
    
    // Información de tipo
    productType: getProductType,
    isEvent,
    isLunchMenu,
    
    // Utilidades
    hasPrice: !!(product?.Precio || product?.precio),
    hasImage: !!(product?.Foto || product?.bannerIMG || product?.foto),
    hasDescription: !!(getLocalizedText.description),
    hasTime: !!(product?.AproxTime)
  };
};

/**
 * Hook especializado para productos de menú
 */
export const useMenuDisplayCard = (product, isEnglish = false) => {
  return useDisplayCard(product, {
    isEnglish,
    showIcons: true,
    showPrice: true,
    showTime: true,
    priceFormat: 'compact'
  });
};

/**
 * Hook especializado para eventos/agenda
 */
export const useEventDisplayCard = (product) => {
  return useDisplayCard(product, {
    showIcons: false,
    showPrice: false,
    showTime: false
  });
};

/**
 * Hook especializado para versiones de impresión
 */
export const usePrintDisplayCard = (product, isEnglish = false) => {
  return useDisplayCard(product, {
    isEnglish,
    showIcons: false,
    showPrice: true,
    showTime: false,
    priceFormat: 'short'
  });
};
