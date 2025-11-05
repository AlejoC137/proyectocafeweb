import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Componente ActionButtonGroup para organizar botones de acción de forma consistente
 *  * @param {Array} buttons - Array de objetos con configuración de botones
 * @param {string} layout - Layout de los botones ('horizontal', 'vertical', 'grid')
 * @param {string} className - Clases CSS adicionales
 */
function ActionButtonGroup({ 
  buttons = [], 
  // CAMBIO 1: El layout por defecto ahora es 'grid'
  layout = "grid",
  className = "" 
}) {
  const layoutClasses = {
    horizontal: "flex flex-wrap items-center gap-4",
    vertical: "flex flex-col gap-3",
    // CAMBIO 2: Simplificado para que siempre sean 2 columnas
    grid: "grid grid-cols-2 gap-3"
  };

  if (!buttons || buttons.length === 0) {
    return null;
  }

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {buttons.map((button, index) => {
        const {
          label,
          icon: Icon,
          onClick,
          variant = "secondary", 
          size = "lg",
          disabled = false,
          className: buttonClassName = "",
          ...otherProps
        } = button;

        // Ajustar el tamaño del icono según el tamaño del botón
        const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

        return (
          <Button
            key={`action-button-${index}`}
            onClick={onClick}
            variant={variant}
            size={size}
            disabled={disabled}
            // CAMBIO 3: Quitamos 'w-full' y 'justify-start'
            className={`gap-2 ${buttonClassName}`}
            {...otherProps}
          >
            {/* * INICIO DE LA CORRECCIÓN
              * * Comprueba si 'Icon' es un string (un emoji) o una función/componente.
              * Si es string, lo renderiza tal cual (como texto).
              * Si es un componente, lo renderiza como un componente React.
              */
            }
          	{Icon && (typeof Icon === 'string' ? Icon : <Icon className={iconSize} />)}
          	{/* FIN DE LA CORRECCIÓN */}

          	{label}
      	  </Button>
    	  );
      })}
    </div>
  );
}

export default ActionButtonGroup;