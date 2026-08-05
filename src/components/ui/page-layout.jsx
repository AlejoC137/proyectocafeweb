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
  className = "",
  fullWidth = false
}) {
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`h-[calc(100vh-4.5rem)] w-full bg-transparent overflow-auto p-2 md:p-4 ${className}`}>
      <div className={`${fullWidth ? 'w-full max-w-none' : 'max-w-screen-2xl mx-auto'} h-full flex flex-col min-h-0`}>
        {/* Header unificado con título y acciones */}
        {(title || actions) && (
          <div className="flex flex-wrap items-center gap-4 mb-2 flex-shrink-0">
            {title && (
              <h1 className="text-2xl font-bold text-cobalt-blue mr-auto font-SpaceGrotesk">
                {title}
              </h1>
            )}
            {actions && (
              <div className="flex flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageLayout;
