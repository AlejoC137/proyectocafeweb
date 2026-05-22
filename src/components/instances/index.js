/**
 * @fileoverview Punto de entrada unificado para la arquitectura Instance
 * Exporta todos los hooks, componentes base y especializados
 */

// ==================== HOOKS ====================
export {
  useJSONField,
  useStockField,
  useAlmacenamientoField,
  useDatesField,
  usePagadoField
} from './hooks/useJSONField';

export {
  useInstanceForm,
  useInventoryForm,
  useMenuForm,
  useStaffForm,
  useComandaForm
} from './hooks/useInstanceForm';

export {
  useInstanceActions,
  useInventoryActions,
  useMenuActions,
  useStaffActions,
  BUTTON_STATES,
  BUTTON_ICONS
} from './hooks/useInstanceActions';

// ==================== COMPONENTES BASE ====================
export {
  ActionButtons,
  CompactActionButtons,
  LabeledActionButtons,
  VerticalActionButtons,
  InventoryActionButtons,
  MenuActionButtons
} from './base/ActionButtons';

export {
  StatusButtons,
  CompactStatusButtons,
  GridStatusButtons,
  VerticalStatusButtons,
  InventoryStatusButtons,
  ProductionStatusButtons,
  MenuStatusButtons,
  StaffStatusButtons
} from './base/StatusButtons';

export {
  InstanceCard,
  CompactInstanceCard,
  DetailedInstanceCard,
  DisplayInstanceCard,
  EditableInstanceCard,
  ReadOnlyInstanceCard,
  CollapsibleInstanceCard,
  InventoryInstanceCard,
  MenuInstanceCard,
  StaffInstanceCard,
  ComandaInstanceCard
} from './base/InstanceCard';

// ==================== COMPONENTES ESPECIALIZADOS ====================
export { CardInstanceNew } from './specialized/CardInstanceNew';
export { CardInstanceDetailNew } from './specialized/CardInstanceDetailNew';
export { CardInstanceHomeNew } from './specialized/CardInstanceHomeNew';
export { CardInstancePrintNew } from './specialized/CardInstancePrintNew';
export { CardInstanceAgendaNew } from './specialized/CardInstanceAgendaNew';
export { CardInstanceAgendaPrintNew } from './specialized/CardInstanceAgendaPrintNew';
export { InventoryInstanceNew } from './specialized/InventoryInstanceNew';

// ==================== COMPONENTES CRUD COMPLEJOS (PHASE 3) ====================
export { MenuInstanceNew } from './specialized/MenuInstanceNew';
export { StaffInstanceNew, StaffGridInstanceNew } from './specialized/StaffInstanceNew';
export { ComandaInstanceNew, ComandaGridInstanceNew } from './specialized/ComandaInstanceNew';
export { MenuLunchInstanceNew } from './specialized/MenuLunchInstanceNew';
export { ProcedimientosGridInstanceNew } from './specialized/ProcedimientosGridInstanceNew';

// ==================== HOOKS DE DISPLAY ====================
export {
  useDisplayCard,
  useMenuDisplayCard,
  useEventDisplayCard,
  usePrintDisplayCard
} from './hooks/useDisplayCard';

// ==================== UTILIDADES ====================

/**
 * Función helper para crear un componente Instance personalizado
 * @param {string} entityType - Tipo de entidad
 * @param {Object} defaultProps - Props por defecto
 * @returns {Function} - Componente Instance personalizado
 */
export const createInstanceComponent = (entityType, defaultProps = {}) => {
  return (props) => {
    const mergedProps = {
      entityType,
      ...defaultProps,
      ...props
    };
    
    return <InstanceCard {...mergedProps} />;
  };
};

/**
 * Mapeo de tipos de entidad a configuraciones por defecto
 */
export const ENTITY_CONFIGS = {
  'Menu': {
    showStatusButtons: true,
    variant: 'default',
    statusLabels: {
      'PP': 'En Preparación',
      'OK': 'Disponible',
      'PE': 'Pendiente',
      'PC': 'Por Confirmar',
      'ER': 'No Disponible'
    }
  },
  'ItemsAlmacen': {
    showStatusButtons: true,
    variant: 'detailed',
    statusLabels: {
      'PP': 'En Proceso',
      'OK': 'Disponible', 
      'PE': 'Pendiente',
      'ER': 'Agotado'
    }
  },
  'Staff': {
    showStatusButtons: true,
    variant: 'detailed',
    statusLabels: {
      'PP': 'En Turno',
      'OK': 'Disponible',
      'PE': 'Programado',
      'ER': 'No Disponible'
    }
  },
  'Comanda': {
    showStatusButtons: true,
    variant: 'default',
    collapsible: true
  },
  'ProduccionInterna': {
    showStatusButtons: true,
    variant: 'detailed',
    statusLabels: {
      'PP': 'En Producción',
      'OK': 'Listo',
      'PE': 'Programado', 
      'ER': 'Error'
    }
  }
};

/**
 * Hook para obtener configuración por defecto de una entidad
 */
export const useEntityConfig = (entityType) => {
  return ENTITY_CONFIGS[entityType] || {};
};
