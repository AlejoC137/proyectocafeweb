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
    <div className={`flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto ${className}`}>
      {/* Botones de categorías */}
      {categories.map(({ type, label, icon }) => {
        return (
          <button
            key={type}
            className={`rounded-lg font-bold flex items-center justify-center gap-1.5 py-1.5 px-3 transition-all duration-200 min-h-[2.4rem] text-xs sm:text-sm ${
              currentType === type 
                ? "bg-cobalt-blue text-white shadow-sm ring-2 ring-cobalt-blue/20" 
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
            onClick={() => onTypeChange(type)}
          >
            <span className="text-sm">{icon}</span>
            <span className="whitespace-nowrap">
              {label}
            </span>
          </button>
        );
      })}
      
      {/* Botón de edición */}
      {onToggleEdit && (
        <button
          className={`rounded-lg flex items-center justify-center gap-1.5 py-1.5 px-3 font-bold transition-all duration-200 min-h-[2.4rem] text-xs sm:text-sm ${
            showEdit 
              ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20" 
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
          }`}
          onClick={onToggleEdit}
        >
          <span>⚙️</span>
          <span className="whitespace-nowrap">
            Edición
          </span>
        </button>
      )}
      
      {/* Botón de acciones rápidas */}
      {onToggleActions && (
        <button
          className={`rounded-lg flex items-center justify-center gap-1.5 py-1.5 px-3 font-bold transition-all duration-200 min-h-[2.4rem] text-xs sm:text-sm ${
            showActions 
              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20" 
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
          }`}
          onClick={onToggleActions}
        >
          <span>⚡</span>
          <span className="whitespace-nowrap">
            Acciones
          </span>
        </button>
      )}
    </div>
  );
}

export default CategoryNavBar;
