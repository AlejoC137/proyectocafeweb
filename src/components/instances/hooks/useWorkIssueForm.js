import { useState, useCallback, useMemo } from 'react';
import { useInstanceForm } from './useInstanceForm';
import { useDatesField, usePagadoField } from './useJSONField';

/**
 * Hook especializado para formularios de Work Issues
 * Maneja la complejidad de fechas, pagos, procedimientos y estados
 */
export const useWorkIssueForm = (initialData = {}, options = {}) => {
  const {
    includeAdvancedFields = true,
    validateProcedimientos = false
  } = options;

  // Usar el hook base de formulario
  const form = useInstanceForm(initialData, options);

  // Usar hooks especializados para campos JSON complejos
  const dates = useDatesField(initialData.Dates);
  const pagado = usePagadoField(initialData.Pagado);

  // Estado para procedimientos
  const [procedimientos, setProcedimientos] = useState(() => {
    try {
      return typeof initialData.Procedimientos === 'string'
        ? JSON.parse(initialData.Procedimientos)
        : initialData.Procedimientos || [];
    } catch {
      return [];
    }
  });

  // Función para agregar procedimiento
  const addProcedimiento = useCallback((procedimiento) => {
    setProcedimientos(prev => [...prev, procedimiento]);
  }, []);

  // Función para remover procedimiento
  const removeProcedimiento = useCallback((index) => {
    setProcedimientos(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Función para actualizar procedimiento
  const updateProcedimiento = useCallback((index, updatedProcedimiento) => {
    setProcedimientos(prev => prev.map((item, i) => 
      i === index ? updatedProcedimiento : item
    ));
  }, []);

  // Separar procedimientos por tipo
  const categorizedProcedimientos = useMemo(() => {
    if (!Array.isArray(procedimientos)) return { procedimientos: [], producciones: [] };
    
    return {
      procedimientos: procedimientos.filter(p => p._tipo === "procedimiento"),
      producciones: procedimientos.filter(p => p._tipo === "produccion")
    };
  }, [procedimientos]);

  // Función para manejar cambios en fechas
  const handleDateChange = useCallback((e) => {
    const { name, value } = e.target;
    dates.updateField(name, value);
  }, [dates]);

  // Función para manejar cambios en pagado
  const handlePagadoChange = useCallback((field, value) => {
    pagado.updateField(field, value);
  }, [pagado]);

  // Función para obtener datos completos para guardar
  const getWorkIssueData = useCallback(() => {
    return {
      ...form.formData,
      Dates: dates.stringifyValue || dates.value,
      Pagado: pagado.stringifyValue || pagado.value,
      Procedimientos: JSON.stringify(procedimientos)
    };
  }, [form.formData, dates, pagado, procedimientos]);

  // Validaciones específicas de work issues
  const validateWorkIssue = useCallback(() => {
    const errors = {};
    let isValid = true;

    // Validar campos requeridos
    if (!form.formData.Tittle || form.formData.Tittle.trim() === '') {
      errors.Tittle = 'El título es requerido';
      isValid = false;
    }

    if (!form.formData.Categoria || form.formData.Categoria === '') {
      errors.Categoria = 'La categoría es requerida';
      isValid = false;
    }

    if (!form.formData.Ejecutor || form.formData.Ejecutor === '') {
      errors.Ejecutor = 'El ejecutor es requerido';
      isValid = false;
    }

    // Validar fechas
    if (!dates.value.isued) {
      errors.Dates = 'La fecha de creación es requerida';
      isValid = false;
    }

    // Validar procedimientos si está habilitado
    if (validateProcedimientos && procedimientos.length === 0) {
      errors.Procedimientos = 'Debe agregar al menos un procedimiento';
      isValid = false;
    }

    return { isValid, errors };
  }, [form.formData, dates.value, procedimientos, validateProcedimientos]);

  // Función para marcar como terminado
  const markAsCompleted = useCallback(() => {
    form.updateFields({ Terminado: true });
    dates.updateField('finished', new Date().toISOString());
  }, [form, dates]);

  // Función para resetear work issue
  const resetWorkIssue = useCallback(() => {
    form.resetForm();
    dates.updateValue({
      isued: new Date().toISOString(),
      finished: "",
      date_asigmente: []
    });
    pagado.updateValue({
      pagadoFull: false,
      adelanto: "NoAplica",
      susceptible: false
    });
    setProcedimientos([]);
  }, [form, dates, pagado]);

  return {
    // Estado del formulario base
    ...form,
    
    // Estados especializados
    dates,
    pagado,
    procedimientos,
    categorizedProcedimientos,
    
    // Funciones de cambio
    handleDateChange,
    handlePagadoChange,
    
    // Gestión de procedimientos
    addProcedimiento,
    removeProcedimiento,
    updateProcedimiento,
    
    // Utilidades
    getWorkIssueData,
    validateWorkIssue,
    markAsCompleted,
    resetWorkIssue,
    
    // Estados derivados
    isCompleted: form.formData.Terminado,
    isPaid: pagado.value.pagadoFull,
    hasAdvance: pagado.value.adelanto && pagado.value.adelanto !== "NoAplica",
    hasProcedimientos: procedimientos.length > 0
  };
};

/**
 * Categorías disponibles para work issues
 */
export const WORK_ISSUE_CATEGORIES = [
  'COCINA',
  'CAFE', 
  'MESAS',
  'JARDINERIA',
  'TIENDA',
  'MANTENIMIENTO',
  'LIMPIEZA',
  'ADMINISTRACION'
];

/**
 * Estados específicos para work issues
 */
export const WORK_ISSUE_STATUS = {
  PENDING: 'PE',     // Pendiente
  IN_PROGRESS: 'PP', // En progreso
  COMPLETED: 'OK',   // Completado
  ERROR: 'ER'        // Error/Problema
};
