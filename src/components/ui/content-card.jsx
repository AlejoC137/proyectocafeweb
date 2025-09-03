import React from "react";
import CoffeeLeafDecoration from "./coffee-leaf-decoration";

/**
 * Componente ContentCard para crear contenedores de contenido consistentes
 * siguiendo el patrón visual de VentaCompra
 * 
 * @param {React.ReactNode} children - Contenido del card
 * @param {string} title - Título opcional del card
 * @param {React.ReactNode} actions - Acciones opcionales en el header
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} noPadding - Si debe eliminar el padding interno
 */
function ContentCard({ 
  children, 
  title, 
  actions, 
  className = "",
  noPadding = false
}) {
  const paddingClass = noPadding ? "" : "p-4 md:p-6";

  return (
    <div className={`relative bg-white rounded-xl shadow-lg border border-light-leaf overflow-hidden ${className}`}>
      {/* Decoración sutil de hojas */}
      <CoffeeLeafDecoration position="top-right" size="sm" />
      {/* Header del card si hay título o acciones */}
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-light-leaf bg-gradient-to-r from-light-leaf/30 to-transparent">
          {title && (
            <h2 className="text-lg font-bold text-cobalt-blue font-SpaceGrotesk">
              {title}
            </h2>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Contenido principal */}
      <div className={paddingClass}>
        {children}
      </div>
    </div>
  );
}

export default ContentCard;
