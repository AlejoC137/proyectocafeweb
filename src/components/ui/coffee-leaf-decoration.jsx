import React from "react";

/**
 * Componente decorativo de hojas de café
 * inspirado en las ilustraciones sugeridas por Gemini
 * 
 * @param {string} position - Posición del decorado ('top-left', 'top-right', 'bottom-left', 'bottom-right')
 * @param {string} size - Tamaño del decorado ('sm', 'md', 'lg')
 * @param {string} className - Clases CSS adicionales
 */
function CoffeeLeafDecoration({ 
  position = "top-right", 
  size = "md",
  className = ""
}) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  const positionClasses = {
    "top-left": "top-0 left-0 -translate-x-2 -translate-y-2",
    "top-right": "top-0 right-0 translate-x-2 -translate-y-2", 
    "bottom-left": "bottom-0 left-0 -translate-x-2 translate-y-2",
    "bottom-right": "bottom-0 right-0 translate-x-2 translate-y-2"
  };

  return (
    <div className={`absolute ${positionClasses[position]} ${sizeClasses[size]} opacity-10 pointer-events-none ${className}`}>
      {/* SVG de hoja de café estilizada */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full text-sage-green"
        fill="currentColor"
      >
        {/* Hoja principal */}
        <path d="M20 50 Q30 20, 50 30 Q70 20, 80 50 Q70 80, 50 70 Q30 80, 20 50 Z" />
        {/* Vena central */}
        <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        {/* Venas secundarias */}
        <line x1="35" y1="40" x2="45" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <line x1="35" y1="60" x2="45" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <line x1="55" y1="40" x2="65" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <line x1="55" y1="60" x2="65" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  );
}

export default CoffeeLeafDecoration;
