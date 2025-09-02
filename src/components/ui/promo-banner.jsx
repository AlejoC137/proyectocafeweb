import React from "react";
import { Coffee, Percent } from "lucide-react";

/**
 * Componente PromoBanner para mostrar promociones especiales
 * siguiendo la estética de cafetería sugerida por Gemini
 * 
 * @param {string} title - Título de la promoción
 * @param {string} subtitle - Subtítulo o descripción
 * @param {string} discount - Porcentaje de descuento
 * @param {string} className - Clases CSS adicionales
 */
function PromoBanner({ 
  title = "COFFEE DAY OFF", 
  subtitle = "Descuento especial en todos nuestros cafés",
  discount = "20%",
  className = ""
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-sage-green to-cobalt-blue p-6 md:p-8 shadow-xl ${className}`}>
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 opacity-10">
        <Coffee size={120} className="text-white" />
      </div>
      <div className="absolute bottom-0 left-0 opacity-5">
        <div className="w-32 h-32 bg-white rounded-full transform -translate-x-8 translate-y-8"></div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 rounded-full p-3">
            <Coffee className="text-white" size={24} />
          </div>
          <div className="bg-terracotta-pink rounded-lg px-3 py-1">
            <span className="text-white font-bold text-sm flex items-center gap-1">
              <Percent size={16} />
              {discount}
            </span>
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white font-SpaceGrotesk mb-2">
          {title}
        </h2>
        <p className="text-white/90 text-base md:text-lg font-PlaywriteDE font-bold mb-6">
          {subtitle}
        </p>
        
        <button className="bg-white text-cobalt-blue font-bold font-PlaywriteDE px-6 py-3 rounded-lg hover:bg-cream-bg transition-colors shadow-lg">
          ¡Aprovecha la oferta!
        </button>
      </div>
    </div>
  );
}

export default PromoBanner;
