import React from "react";
import { 
  UtensilsCrossed, 
  FileText, 
  Users, 
  Wrench, 
  Settings, 
  Zap,
  Package,
  ChefHat 
} from "lucide-react";

/**
 * Componente CategoryNavBar reutilizable para navegación de categorías
 * Reemplaza los bloques de botones fijos con diseño consistente
 * 
 * @param {Array} categories - Array de categorías con {type, label, icon}
 * @param {string} currentType - Tipo actualmente seleccionado
 * @param {Function} onTypeChange - Función callback para cambio de tipo
 * @param {boolean} showEdit - Estado del modo edición
 * @param {Function} onToggleEdit - Función callback para toggle edición
 * @param {boolean} showActions - Estado de acciones rápidas
 * @param {Function} onToggleActions - Función callback para toggle acciones
 * @param {string} className - Clases CSS adicionales
 */
function CategoryNavBar({ 
  categories = [],
  currentType,
  onTypeChange,
  showEdit = false,
  onToggleEdit,
  showActions = false,
  onToggleActions,
  className = ""
}) {
  // Mapeo de iconos por defecto (compatible con versiones anteriores)
  const defaultIcons = {
    "🗺️": UtensilsCrossed,
    "📝": FileText, 
    "👩‍🚀": Users,
    "🧹": Wrench,
    "🛒": Package,
    "🥘": ChefHat
  };

  // Calcular el número total de botones para distribuir el ancho equitativamente
  const totalButtons = categories.length + (onToggleEdit ? 1 : 0) + (onToggleActions ? 1 : 0);
  const buttonWidth = totalButtons > 0 ? `${100 / totalButtons}%` : '100%';

  return (
    <div className={`flex justify-center align-top gap-2 p-3 fixed top-18 left-0 right-0 bg-cream-bg/95 backdrop-blur-sm border-b border-sage-green z-40 shadow-sm ${className}`}>
      {/* Botones de categorías */}
      {categories.map(({ type, label, icon }) => {
        const IconComponent = defaultIcons[icon] || UtensilsCrossed;
        
        return (
          <button
            key={type}
            style={{ width: buttonWidth }}
            className={`rounded-lg font-PlaywriteDE font-bold flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 min-h-[3.5rem] ${
              currentType === type 
                ? "bg-cobalt-blue text-white shadow-md" 
                : "bg-white text-gray-700 hover:bg-sage-green/20 hover:text-sage-green border border-light-leaf"
            }`}
            onClick={() => onTypeChange(type)}
          >
            <IconComponent size={16} className="mb-1 flex-shrink-0" />
            <span className="text-xs leading-tight text-center break-words hyphens-auto" style={{ wordBreak: 'break-word' }}>
              {label}
            </span>
          </button>
        );
      })}
      
      {/* Botón de edición */}
      {onToggleEdit && (
        <button
          style={{ width: buttonWidth }}
          className={`rounded-lg flex flex-col items-center justify-center py-2 px-1 font-PlaywriteDE font-bold transition-all duration-200 min-h-[3.5rem] ${
            showEdit 
              ? "bg-terracotta-pink text-white shadow-md" 
              : "bg-sage-green text-white hover:bg-sage-green/80 shadow-sm"
          }`}
          onClick={onToggleEdit}
        >
          <Settings size={16} className="mb-1 flex-shrink-0" />
          <span className="text-xs leading-tight text-center break-words hyphens-auto" style={{ wordBreak: 'break-word' }}>
            Edición
          </span>
        </button>
      )}
      
      {/* Botón de acciones rápidas */}
      {onToggleActions && (
        <button
          style={{ width: buttonWidth }}
          className={`rounded-lg flex flex-col items-center justify-center py-2 px-1 font-PlaywriteDE font-bold transition-all duration-200 min-h-[3.5rem] ${
            showActions 
              ? "bg-terracotta-pink text-white shadow-md" 
              : "bg-sage-green text-white hover:bg-sage-green/80 shadow-sm"
          }`}
          onClick={onToggleActions}
        >
          <Zap size={16} className="mb-1 flex-shrink-0" />
          <span className="text-xs leading-tight text-center break-words hyphens-auto" style={{ wordBreak: 'break-word' }}>
            Acciones
          </span>
        </button>
      )}
    </div>
  );
}

export default CategoryNavBar;
