import React from 'react';
import { ESTATUS } from '../../../redux/actions-types';

/**
 * Filtros de estado según tipo de entidad
 * Centraliza qué estados son válidos para cada tipo
 */
const STATUS_FILTERS = {
  'ProduccionInterna': (statuses) => statuses.filter(status => status !== 'PC'),
  'ItemsAlmacen': (statuses) => statuses.filter(status => status !== 'PP'),
  'Menu': (statuses) => statuses, // Todos los estados
  'Staff': (statuses) => statuses.filter(status => status !== 'PC'),
  'WorkIssue': (statuses) => statuses.filter(status => status !== 'PC'),
  'Procedimientos': (statuses) => statuses.filter(status => status !== 'PC'),
  'default': (statuses) => statuses
};

/**
 * Mapeo de colores por estado
 */
const STATUS_COLORS = {
  'PP': 'bg-blue-500 hover:bg-blue-600',      // En proceso
  'PC': 'bg-orange-500 hover:bg-orange-600',  // Por confirmar  
  'OK': 'bg-green-500 hover:bg-green-600',    // Completado
  'PE': 'bg-yellow-500 hover:bg-yellow-600',  // Pendiente
  'ER': 'bg-red-500 hover:bg-red-600',        // Error
  'default': 'bg-gray-300 hover:bg-gray-400'
};

/**
 * Componente de botones de estado estandarizados
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} - Botones de estado renderizados
 */
export const StatusButtons = ({
  // Estado actual
  currentStatus,
  
  // Configuración
  entityType = 'default',
  allowedStatuses = ESTATUS,
  
  // Acciones
  onStatusChange,
  
  // UI
  disabled = false,
  size = 'default',
  layout = 'horizontal', // 'horizontal' | 'vertical' | 'grid'
  showLabels = true,
  compact = false,
  
  // Personalización
  className = '',
  statusLabels = {}, // Mapeo personalizado de labels
  customColors = {}  // Colores personalizados por estado
}) => {
  
  // Obtener estados filtrados según el tipo de entidad
  const filteredStatuses = React.useMemo(() => {
    const filter = STATUS_FILTERS[entityType] || STATUS_FILTERS.default;
    return filter(allowedStatuses);
  }, [entityType, allowedStatuses]);

  // Función para obtener el color de un estado
  const getStatusColor = (status) => {
    return customColors[status] || STATUS_COLORS[status] || STATUS_COLORS.default;
  };

  // Función para obtener el label de un estado
  const getStatusLabel = (status) => {
    return statusLabels[status] || status;
  };

  // Función para obtener las clases del botón según si está activo
  const getButtonClasses = (status) => {
    const baseClasses = 'text-white font-medium transition-all duration-200 rounded';
    const sizeClasses = {
      'sm': 'px-2 py-1 text-xs',
      'default': 'px-3 py-2 text-sm',
      'lg': 'px-4 py-3 text-base'
    }[size];
    
    const isActive = currentStatus === status;
    const colorClasses = isActive 
      ? getStatusColor(status)
      : 'bg-gray-300 hover:bg-gray-400';
    
    const activeClasses = isActive 
      ? 'ring-2 ring-offset-2 ring-blue-300 shadow-lg transform scale-105'
      : '';
    
    return `${baseClasses} ${sizeClasses} ${colorClasses} ${activeClasses}`;
  };

  // Clases del contenedor según el layout
  const getContainerClasses = () => {
    const base = 'flex';
    
    switch(layout) {
      case 'vertical':
        return `${base} flex-col gap-1`;
      case 'grid':
        return `${base} flex-wrap gap-1`;
      case 'horizontal':
      default:
        return `${base} gap-2 ${compact ? 'gap-1' : 'gap-2'}`;
    }
  };

  if (filteredStatuses.length === 0) {
    return null;
  }

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      {filteredStatuses.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange?.(status)}
          disabled={disabled}
          className={getButtonClasses(status)}
          title={`Cambiar estado a: ${getStatusLabel(status)}`}
          aria-pressed={currentStatus === status}
        >
          {showLabels ? getStatusLabel(status) : status}
        </button>
      ))}
    </div>
  );
};

/**
 * Componente compacto de estados
 */
export const CompactStatusButtons = (props) => (
  <StatusButtons {...props} size="sm" compact={true} />
);

/**
 * Componente de estados en grid para muchas opciones
 */
export const GridStatusButtons = (props) => (
  <StatusButtons {...props} layout="grid" />
);

/**
 * Componente vertical de estados
 */
export const VerticalStatusButtons = (props) => (
  <StatusButtons {...props} layout="vertical" />
);

/**
 * Preset para inventario
 */
export const InventoryStatusButtons = (props) => (
  <StatusButtons 
    {...props} 
    entityType="ItemsAlmacen"
    size="sm"
    statusLabels={{
      'PP': 'En Proceso',
      'OK': 'Disponible', 
      'PE': 'Pendiente',
      'ER': 'Agotado'
    }}
  />
);

/**
 * Preset para producción interna  
 */
export const ProductionStatusButtons = (props) => (
  <StatusButtons 
    {...props} 
    entityType="ProduccionInterna"
    size="sm"
    statusLabels={{
      'PP': 'En Producción',
      'OK': 'Listo',
      'PE': 'Programado', 
      'ER': 'Error'
    }}
  />
);

/**
 * Preset para menú
 */
export const MenuStatusButtons = (props) => (
  <StatusButtons 
    {...props} 
    entityType="Menu"
    statusLabels={{
      'PP': 'En Preparación',
      'OK': 'Disponible',
      'PE': 'Pendiente',
      'PC': 'Por Confirmar',
      'ER': 'No Disponible'
    }}
  />
);

/**
 * Preset para staff
 */
export const StaffStatusButtons = (props) => (
  <StatusButtons 
    {...props} 
    entityType="Staff"
    statusLabels={{
      'PP': 'En Turno',
      'OK': 'Disponible',
      'PE': 'Programado',
      'ER': 'No Disponible'
    }}
  />
);
