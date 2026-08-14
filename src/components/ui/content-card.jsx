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
 * @param {boolean} scrollable - Si el contenido del card debe tener scroll vertical independiente
 * @param {string} bodyClassName - Clases CSS adicionales para el contenedor interno del cuerpo
 */
function ContentCard({ 
  children, 
  title, 
  actions, 
  className = "",
  noPadding = false,
  scrollable = false,
  bodyClassName = ""
}) {
  const paddingClass = noPadding ? "" : "p-2.5 sm:p-3";

  return (
    <div className={`relative bg-white rounded-xl shadow-md border border-light-leaf flex flex-col flex-1 min-h-0 ${className}`}>
      {/* Decoración sutil de hojas */}
      <CoffeeLeafDecoration position="top-right" size="sm" />
      {/* Header del card si hay título o acciones */}
      {(title || actions) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-light-leaf bg-gradient-to-r from-light-leaf/30 to-transparent flex-shrink-0">
          {title && (
            <h2 className="text-sm md:text-base font-bold text-cobalt-blue font-SpaceGrotesk">
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
      <div className={`flex-1 flex flex-col min-h-0 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'} ${paddingClass} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default ContentCard;
