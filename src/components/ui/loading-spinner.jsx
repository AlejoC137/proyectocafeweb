import React from "react";

/**
 * Componente LoadingSpinner reutilizable siguiendo el patrón de VentaCompra
 * 
 * @param {string} message - Mensaje de carga personalizado
 * @param {string} size - Tamaño del spinner ('sm', 'md', 'lg')
 * @param {boolean} fullScreen - Si debe ocupar toda la pantalla
 */
function LoadingSpinner({ 
  message = "Cargando Datos...", 
  size = "md",
  fullScreen = true 
}) {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-4", 
    lg: "h-16 w-16 border-4"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl"
  };

  const containerClasses = fullScreen 
    ? "flex items-center justify-center h-screen bg-slate-100"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-dashed rounded-full animate-spin border-blue-500 mx-auto`}></div>
        <p className={`${textSizeClasses[size]} font-semibold text-gray-700 mt-4`}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
