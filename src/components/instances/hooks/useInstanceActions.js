import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updateItem, deleteItem } from '../../../redux/actions-Proveedores';
import { updateItem as updateMenuItem } from '../../../redux/actions';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

/**
 * Estados unificados para botones de acción
 */
export const BUTTON_STATES = {
  SAVE: 'save',
  SYNCING: 'syncing', 
  DONE: 'done',
  ERROR: 'error',
  MODIFIED: 'modified' // Nuevo estado para cambios no guardados
};

/**
 * Mapeo visual de estados de botones
 */
export const BUTTON_ICONS = {
  [BUTTON_STATES.SAVE]: '💾',
  [BUTTON_STATES.SYNCING]: '💾',
  [BUTTON_STATES.DONE]: '💾',
  [BUTTON_STATES.ERROR]: '💾',
  [BUTTON_STATES.MODIFIED]: '💾' // Mismo icono que save pero con diferentes estilos
};

/**
 * Configuración de colores y estilos para estados
 */
export const BUTTON_STYLES = {
  [BUTTON_STATES.SAVE]: {
    color: '#6b7280', // text-gray-500
    backgroundColor: '#f9fafb', // bg-gray-50
    cursor: 'pointer',
    opacity: 1
  },
  [BUTTON_STATES.MODIFIED]: {
    color: '#3b82f6', // text-blue-500
    backgroundColor: '#dbeafe', // bg-blue-50
    cursor: 'pointer',
    opacity: 1,
    animation: 'pulse 1s ease-in-out'
  },
  [BUTTON_STATES.SYNCING]: {
    color: '#f59e0b', // text-amber-500
    backgroundColor: '#fef3c7', // bg-amber-50
    cursor: 'not-allowed',
    opacity: 0.8,
    animation: 'spin 1s linear infinite'
  },
  [BUTTON_STATES.DONE]: {
    color: '#10b981', // text-emerald-500
    backgroundColor: '#d1fae5', // bg-emerald-50
    cursor: 'default',
    opacity: 1
  },
  [BUTTON_STATES.ERROR]: {
    color: '#ef4444', // text-red-500
    backgroundColor: '#fee2e2', // bg-red-50
    cursor: 'pointer',
    opacity: 1
  }
};

/**
 * Hook centralizado para acciones CRUD en componentes Instance
 * @param {string} itemId - ID del item
 * @param {string} entityType - Tipo de entidad (Menu, Staff, ItemsAlmacen, etc.)
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Funciones y estado de las acciones
 */
export const useInstanceActions = (itemId, entityType, options = {}) => {
  const {
    onSuccess,
    onError,
    confirmDelete = true,
    reloadOnSuccess = false,
    showAlerts = false, // Cambiado a false por defecto para mejor UX
    autoResetTime = 2000,
    optimisticUpdate = true, // Nuevo: actualización optimista
    showToasts = true // Nuevo: mostrar toasts en lugar de alerts
  } = options;

  const dispatch = useDispatch();
  const [buttonState, setButtonState] = useState(BUTTON_STATES.SAVE);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [optimisticData, setOptimisticData] = useState(null);

  // Función para seleccionar la acción de update correcta según el tipo
  const getUpdateAction = useCallback((type) => {
    // Algunos tipos usan actions diferentes
    switch(type) {
      case 'Menu':
      case 'Menu':
        return updateMenuItem;
      case 'Staff':
      case 'ItemsAlmacen':
      case 'ProduccionInterna':
      case 'Procedimientos':
      case 'WorkIssue':
      default:
        return updateItem;
    }
  }, []);

  // Función para seleccionar la acción de delete correcta según el tipo
  const getDeleteAction = useCallback((type) => {
    // Todos usan la misma función de delete por ahora
    return deleteItem;
  }, []);

  /**
   * Función centralizada para actualizar un item
   */
  const handleUpdate = useCallback(async (updatedData, customType = null) => {
    if (!itemId) {
      console.error('No itemId provided for update');
      return false;
    }

    setButtonState(BUTTON_STATES.SYNCING);
    setIsLoading(true);
    setLastAction('update');

    try {
      const typeToUse = customType || entityType;
      const updateAction = getUpdateAction(typeToUse);
      
      // Agregar fecha de actualización automática
      const dataWithTimestamp = {
        ...updatedData,
        FECHA_ACT: new Date().toISOString().split("T")[0]
      };

      await dispatch(updateAction(itemId, dataWithTimestamp, typeToUse));
      
      setButtonState(BUTTON_STATES.DONE);
      setHasChanges(false);
      
      // Toast suave en lugar de alert molesto
      if (showToasts) {
        showSuccessToast('💾 Guardado correctamente');
      }
      
      if (onSuccess) {
        onSuccess('update', dataWithTimestamp);
      }

      // NUNCA hacer reload automático - mejor UX
      if (reloadOnSuccess) {
        console.warn('reloadOnSuccess está deshabilitado para mejor UX');
      }

      // Resetear estado después del tiempo configurado
      setTimeout(() => setButtonState(BUTTON_STATES.SAVE), autoResetTime);
      
      return true;
    } catch (error) {
      console.error('Error al actualizar el ítem:', error);
      setButtonState(BUTTON_STATES.ERROR);
      
      if (showToasts) {
        showErrorToast('💾 Error al guardar: ' + (error.message || 'Error desconocido'));
      } else if (showAlerts) {
        alert('Error al actualizar el ítem');
      }
      
      if (onError) {
        onError('update', error);
      }

      // Resetear estado después de 3 segundos
      setTimeout(() => setButtonState(BUTTON_STATES.SAVE), 3000);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [itemId, entityType, dispatch, getUpdateAction, onSuccess, onError, showAlerts, showToasts, autoResetTime]);

  /**
   * Función centralizada para eliminar un item
   */
  const handleDelete = useCallback(async (customType = null) => {
    if (!itemId) {
      console.error('No itemId provided for delete');
      return false;
    }

    if (confirmDelete && !window.confirm('¿Estás seguro de que deseas eliminar este ítem?')) {
      return false;
    }

    setButtonState(BUTTON_STATES.SYNCING);
    setIsLoading(true);
    setLastAction('delete');

    try {
      const typeToUse = customType || entityType;
      const deleteAction = getDeleteAction(typeToUse);
      
      await dispatch(deleteAction(itemId, typeToUse));
      
      setButtonState(BUTTON_STATES.DONE);
      
      if (showAlerts) {
        alert('Ítem eliminado correctamente');
      }
      
      if (onSuccess) {
        onSuccess('delete', itemId);
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar el ítem:', error);
      setButtonState(BUTTON_STATES.ERROR);
      
      if (showAlerts) {
        alert('Hubo un error al eliminar el ítem');
      }
      
      if (onError) {
        onError('delete', error);
      }

      // Resetear estado después de 3 segundos
      setTimeout(() => setButtonState(BUTTON_STATES.SAVE), 3000);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [itemId, entityType, dispatch, confirmDelete, getDeleteAction, onSuccess, onError, showAlerts]);

  /**
   * Función para cambiar estado/status de un item
   */
  const handleStatusChange = useCallback(async (newStatus, customType = null) => {
    if (!itemId) {
      console.error('No itemId provided for status change');
      return false;
    }

    setButtonState(BUTTON_STATES.SYNCING);
    setIsLoading(true);
    setLastAction('statusChange');

    try {
      const typeToUse = customType || entityType;
      const updateAction = getUpdateAction(typeToUse);
      
      await dispatch(updateAction(itemId, { Estado: newStatus }, typeToUse));
      
      setButtonState(BUTTON_STATES.DONE);
      
      if (onSuccess) {
        onSuccess('statusChange', newStatus);
      }

      // Resetear estado después de 1 segundo para status changes
      setTimeout(() => setButtonState(BUTTON_STATES.SAVE), 1000);
      
      return true;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setButtonState(BUTTON_STATES.ERROR);
      
      if (onError) {
        onError('statusChange', error);
      }

      setTimeout(() => setButtonState(BUTTON_STATES.SAVE), 3000);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [itemId, entityType, dispatch, getUpdateAction, onSuccess, onError]);

  /**
   * Función para marcar que hay cambios pendientes
   */
  const markAsModified = useCallback((newData = null) => {
    setHasChanges(true);
    setButtonState(BUTTON_STATES.MODIFIED);
    if (newData) {
      setOptimisticData(newData);
    }
  }, []);

  /**
   * Función para verificar si hay cambios comparando datos
   */
  const detectChanges = useCallback((currentData, originalData) => {
    if (!originalData) {
      setOriginalData(currentData);
      return false;
    }
    
    // Comparación profunda simple (excluyendo campos auto-generados)
    const fieldsToIgnore = ['FECHA_ACT', '_id', '__v', 'updatedAt', 'createdAt'];
    
    const cleanCurrent = Object.keys(currentData)
      .filter(key => !fieldsToIgnore.includes(key))
      .reduce((obj, key) => {
        obj[key] = currentData[key];
        return obj;
      }, {});
    
    const cleanOriginal = Object.keys(originalData)
      .filter(key => !fieldsToIgnore.includes(key))
      .reduce((obj, key) => {
        obj[key] = originalData[key];
        return obj;
      }, {});
    
    const hasChanges = JSON.stringify(cleanCurrent) !== JSON.stringify(cleanOriginal);
    
    if (hasChanges && buttonState === BUTTON_STATES.SAVE) {
      markAsModified(currentData);
    } else if (!hasChanges && buttonState === BUTTON_STATES.MODIFIED) {
      setButtonState(BUTTON_STATES.SAVE);
      setHasChanges(false);
    }
    
    return hasChanges;
  }, [buttonState, markAsModified]);

  /**
   * Función para resetear el estado del botón manualmente
   */
  const resetButtonState = useCallback(() => {
    setButtonState(BUTTON_STATES.SAVE);
    setHasChanges(false);
    setOptimisticData(null);
  }, []);

  /**
   * Función para obtener el estilo del botón según el estado
   */
  const getButtonStyle = useCallback(() => {
    return BUTTON_STYLES[buttonState] || BUTTON_STYLES[BUTTON_STATES.SAVE];
  }, [buttonState]);

  /**
   * Función para obtener el icono actual del botón según el estado
   */
  const getButtonIcon = useCallback((action = 'save') => {
    if (action === 'delete') {
      return {
        [BUTTON_STATES.SAVE]: '💾',
        [BUTTON_STATES.SYNCING]: '💾',
        [BUTTON_STATES.DONE]: '💾',
        [BUTTON_STATES.ERROR]: '💾'
      }[buttonState];
    }
    
    return BUTTON_ICONS[buttonState];
  }, [buttonState]);

  return {
    // Estado
    buttonState,
    isLoading,
    lastAction,
    hasChanges,
    originalData,
    optimisticData,
    
    // Acciones principales
    handleUpdate,
    handleDelete,
    handleStatusChange,
    
    // Utilidades
    resetButtonState,
    getButtonIcon,
    getButtonStyle,
    markAsModified,
    detectChanges,
    
    // Estados de verificación
    canSave: buttonState === BUTTON_STATES.SAVE && !isLoading,
    canDelete: !isLoading,
    isWorking: isLoading || buttonState === BUTTON_STATES.SYNCING,
    isDirty: hasChanges || buttonState === BUTTON_STATES.MODIFIED
  };
};

/**
 * Hook especializado para acciones de inventario
 * Incluye lógica específica como cálculo de precio unitario
 */
export const useInventoryActions = (itemId, options = {}) => {
  const actions = useInstanceActions(itemId, 'ItemsAlmacen', options);
  
  const handleInventoryUpdate = useCallback(async (updatedData) => {
    // Agregar cálculos específicos de inventario
    const dataWithCalculations = {
      ...updatedData,
      COOR: "1.05", // Coeficiente estándar
      // Aquí se pueden agregar más cálculos específicos
    };
    
    return actions.handleUpdate(dataWithCalculations);
  }, [actions]);

  return {
    ...actions,
    handleUpdate: handleInventoryUpdate
  };
};

/**
 * Hook especializado para acciones de menú
 */
export const useMenuActions = (itemId, options = {}) => {
  return useInstanceActions(itemId, 'Menu', options);
};

/**
 * Hook especializado para acciones de staff
 */
export const useStaffActions = (itemId, options = {}) => {
  return useInstanceActions(itemId, 'Staff', options);
};
