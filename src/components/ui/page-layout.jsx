import React from "react";
import LoadingSpinner from "./loading-spinner";

/**
 * Componente PageLayout reutilizable que unifica el diseño de todas las vistas
 * siguiendo el patrón establecido en VentaCompra.jsx
 * 
 * @param {string} title - Título principal de la página
 * @param {React.ReactNode} actions - Botones de acción del header
 * @param {React.ReactNode} children - Contenido principal de la página
 * @param {boolean} loading - Estado de carga
 * @param {string} className - Clases CSS adicionales
 */
function PageLayout({ 
  title, 
  actions, 
  children, 
  loading = false, 
  className = "" 
}) {
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`h-[calc(100vh-4.5rem)] w-screen bg-transparent dark:bg-transparent overflow-auto p-4 md:p-6 ${className}`}>
      <div className="max-w-screen-2xl mx-auto">
        {/* Header unificado con título y acciones */}
        {(title || actions) && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {title && (
              <h1 className="text-2xl font-bold text-cobalt-blue dark:text-white mr-auto font-SpaceGrotesk">
                {title}
              </h1>
            )}
            {actions && (
              <div className="flex flex-wrap items-center gap-4">
                {actions}
              </div>
            )}
          </div>
        )}
        
        {/* Contenido principal */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageLayout;
