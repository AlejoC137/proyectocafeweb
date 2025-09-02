import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Componente ActionButtonGroup para organizar botones de acción de forma consistente
 * 
 * @param {Array} buttons - Array de objetos con configuración de botones
 * @param {string} layout - Layout de los botones ('horizontal', 'vertical', 'grid')
 * @param {string} className - Clases CSS adicionales
 */
function ActionButtonGroup({ 
  buttons = [], 
  layout = "horizontal",
  className = "" 
}) {
  const layoutClasses = {
    horizontal: "flex flex-wrap items-center gap-4",
    vertical: "flex flex-col gap-3",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
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
          variant = "outline",
          size = "default",
          disabled = false,
          className: buttonClassName = "",
          ...otherProps
        } = button;

        return (
          <Button
            key={`action-button-${index}`}
            onClick={onClick}
            variant={variant}
            size={size}
            disabled={disabled}
            className={`gap-2 ${buttonClassName}`}
            {...otherProps}
          >
            {Icon && <Icon size={16} />}
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export default ActionButtonGroup;
