import { useState, useCallback, useEffect } from 'react';

/**
 * Hook centralizado para manejo de formularios en componentes Instance
 * @param {Object} initialData - Datos iniciales del formulario
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y funciones del formulario
 */
export const useInstanceForm = (initialData = {}, options = {}) => {
  const {
    validateOnChange = false,
    resetOnSave = false,
    autoSave = false,
    autoSaveDelay = 2000
  } = options;

  // Estado principal del formulario
  const [formData, setFormData] = useState(initialData);
  const [originalData, setOriginalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Actualizar cuando cambien los datos iniciales
  useEffect(() => {
    setFormData(initialData);
    setOriginalData(initialData);
    setIsDirty(false);
  }, [initialData]);

  // Función genérica para cambios de input
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: finalValue };
      setIsDirty(JSON.stringify(updated) !== JSON.stringify(originalData));
      return updated;
    });

    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors, originalData]);

  // Función para cambios en campos anidados (como STOCK, DATES, etc.)
  const handleNestedChange = useCallback((objectName, fieldName, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [objectName]: {
          ...prev[objectName],
          [fieldName]: value
        }
      };
      setIsDirty(JSON.stringify(updated) !== JSON.stringify(originalData));
      return updated;
    });
  }, [originalData]);

  // Función para actualizar múltiples campos a la vez
  const updateFields = useCallback((updates) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      setIsDirty(JSON.stringify(updated) !== JSON.stringify(originalData));
      return updated;
    });
  }, [originalData]);

  // Función para resetear el formulario
  const resetForm = useCallback(() => {
    setFormData(originalData);
    setErrors({});
    setIsDirty(false);
  }, [originalData]);

  // Función para validar campos requeridos
  const validateRequired = useCallback((requiredFields = []) => {
    const newErrors = {};
    let valid = true;

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        newErrors[field] = 'Este campo es requerido';
        valid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(valid);
    return valid;
  }, [formData]);

  // Función para obtener solo los campos que han cambiado
  const getChangedFields = useCallback(() => {
    const changes = {};
    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
        changes[key] = formData[key];
      }
    });
    return changes;
  }, [formData, originalData]);

  // Función para marcar el formulario como guardado
  const markAsSaved = useCallback(() => {
    setOriginalData(formData);
    setIsDirty(false);
    setErrors({});
  }, [formData]);

  return {
    // Estado
    formData,
    errors,
    isDirty,
    isValid,
    
    // Funciones de cambio
    handleChange,
    handleNestedChange,
    updateFields,
    
    // Utilidades
    resetForm,
    validateRequired,
    getChangedFields,
    markAsSaved,
    
    // Estado original para comparaciones
    originalData
  };
};

/**
 * Hook especializado para formularios de inventario
 */
export const useInventoryForm = (initialData) => {
  const form = useInstanceForm(initialData);
  
  // Validaciones específicas de inventario
  const validateInventory = useCallback(() => {
    const requiredFields = ['Nombre_del_producto', 'CANTIDAD', 'UNIDADES', 'COSTO'];
    return form.validateRequired(requiredFields);
  }, [form]);

  return {
    ...form,
    validateInventory
  };
};

/**
 * Hook especializado para formularios de menú
 */
export const useMenuForm = (initialData) => {
  const form = useInstanceForm(initialData);
  
  // Validaciones específicas de menú
  const validateMenu = useCallback(() => {
    const requiredFields = ['NombreES', 'NombreEN', 'Precio'];
    return form.validateRequired(requiredFields);
  }, [form]);

  return {
    ...form,
    validateMenu
  };
};

/**
 * Hook especializado para formularios de staff
 */
export const useStaffForm = (initialData) => {
  const form = useInstanceForm(initialData);
  
  // Validaciones específicas de staff
  const validateStaff = useCallback(() => {
    const requiredFields = ['Nombre', 'Apellido', 'Cargo'];
    return form.validateRequired(requiredFields);
  }, [form]);

  return {
    ...form,
    validateStaff
  };
};
