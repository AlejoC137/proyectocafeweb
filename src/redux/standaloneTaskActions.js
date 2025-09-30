// ARCHIVO: standaloneTaskActions.js
// Este archivo es autónomo y no requiere otros archivos de tu proyecto para funcionar.
// Contiene la inicialización del cliente de Supabase y las acciones CRUD para las tareas.

import { createClient } from "@supabase/supabase-js";

// ========================================
// 1. CONFIGURACIÓN DEL CLIENTE DE SUPABASE
// ========================================

// Reemplaza estas variables con tus propias claves de Supabase o cárgalas desde un .env
import supabase from "../config/supabaseClient";


// ========================================
// 2. CONSTANTES Y CONFIGURACIONES
// ========================================

const TABLE_NAME = 'WorkIsue'; // Nombre de la tabla de tareas en Supabase
const ENTITY_NAME = 'tasks'; // Nombre de la entidad para los tipos de acción

// Definimos los tipos de acciones directamente para no importarlos
const actionTypes = {
  CREATE_TASKS_REQUEST: 'CREATE_TASKS_REQUEST',
  CREATE_TASKS_SUCCESS: 'CREATE_TASKS_SUCCESS',
  CREATE_TASKS_FAILURE: 'CREATE_TASKS_FAILURE',
  UPDATE_TASKS_REQUEST: 'UPDATE_TASKS_REQUEST',
  UPDATE_TASKS_SUCCESS: 'UPDATE_TASKS_SUCCESS',
  UPDATE_TASKS_FAILURE: 'UPDATE_TASKS_FAILURE',
  DELETE_TASKS_REQUEST: 'DELETE_TASKS_REQUEST',
  DELETE_TASKS_SUCCESS: 'DELETE_TASKS_SUCCESS',
  DELETE_TASKS_FAILURE: 'DELETE_TASKS_FAILURE',
};

// ========================================
// 3. TRANSFORMADORES Y HELPERS DE TAREAS
// (Adaptado desde WorkIsue_rows.csv)
// ========================================

/**
 * Devuelve un color según el estado de la tarea.
 * @param {string} status - El estado de la tarea (ej. 'Pendiente', 'En Progreso').
 */
const getTaskStatusColor = (status) => {
  const colors = {
    'Pendiente': 'gray',
    'En Progreso': 'blue',
    'En Revisión': 'yellow',
    'En Discusión': 'orange',
    'Completado': 'green',
    'En Diseño': 'purple',
    'Bloqueado': 'red',
  };
  return colors[status] || 'gray';
};

/**
 * Devuelve un color según la prioridad de la tarea.
 * @param {string} priority - La prioridad de la tarea (ej. 'Baja', 'Media', 'Alta').
 */
const getPriorityColor = (priority) => {
  const colors = {
    'Baja': 'green',
    'Media-Baja': 'teal',
    'Media': 'yellow',
    'Media-Alta': 'orange',
    'Alta': 'red',
    'Crítica': 'darkred', // Se añade por si se usa en el futuro
  };
  return colors[priority] || 'gray';
};

/**
 * Parsea una fecha en formato DD/MM/YYYY a un objeto Date.
 * @param {string} dateString - La fecha como string.
 * @returns {Date|null}
 */
const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // Formato: DD, MM, YYYY
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateString); // Intento de parseo nativo como fallback
};


/**
 * Verifica si una tarea está vencida.
 * @param {string} dueDate - La fecha de vencimiento.
 */
const isTaskOverdue = (dueDate) => {
  if (!dueDate) return false;
  const due = parseDate(dueDate);
  return due < new Date();
};

/**
 * Transforma los datos de una tarea desde el formato de Supabase al formato de la aplicación.
 * @param {object|object[]} data - El objeto o array de objetos de la tarea.
 */
const taskTransformer = (data) => {
  const transformItem = (item) => {
    // **FIX: Parsear campos JSON de forma segura, verificando si no están vacíos**
    let acciones = [];
    if (item.acciones && typeof item.acciones === 'string') {
        try {
            acciones = JSON.parse(item.acciones);
        } catch (e) {
            console.error(`Error parsing 'acciones' for item ID ${item.id}:`, e);
            acciones = []; // Fallback a array vacío si hay error
        }
    } else {
        acciones = item.acciones || [];
    }

    let dates = {};
    if (item.dates && typeof item.dates === 'string') {
        try {
            dates = JSON.parse(item.dates);
        } catch (e) {
            console.error(`Error parsing 'dates' for item ID ${item.id}:`, e);
            dates = {}; // Fallback a objeto vacío si hay error
        }
    } else {
        dates = item.dates || {};
    }

    const assignees = Array.isArray(acciones) ? acciones.map(a => a.executer).join(', ') : '';

    return {
      ...item,
      // Renombrar campos para consistencia
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      entregableType: item.entregableType || '',
      taskDescription: item.task_description || '',
      progress: item.Progress || 0,
      
      // Campos derivados y transformados
      displayName: item.entregableType ? `${item.entregableType}: ${item.task_description}` : item.task_description || `${item.id}`,
      statusColor: getTaskStatusColor(item.status),
      priorityColor: getPriorityColor(item.Priority),
      
      // Manejo de fechas
      assignDate: dates.assignDate || null,
      dueDate: dates.dueDate || null,
      isOverdue: isTaskOverdue(dates.dueDate),
      
      // Manejo de 'acciones' como asignados
      assigneeName: assignees || 'Sin asignar',
      actions: acciones, // Mantener el array de acciones completo
    };
  };

  return Array.isArray(data) ? data.map(transformItem) : transformItem(data);
};

// ========================================
// 4. LÓGICA DE LAS ACCIONES CRUD
// ========================================

// Query de selección simple
const SELECT_QUERY = '*';

// --- ACCIÓN DE CREAR ---

const createRequest = () => ({
  type: actionTypes.CREATE_TASKS_REQUEST,
});

const createSuccess = (data) => ({
  type: actionTypes.CREATE_TASKS_SUCCESS,
  payload: taskTransformer(data),
});

const createFailure = (error) => ({
  type: actionTypes.CREATE_TASKS_FAILURE,
  payload: error,
});

/**
 * Crea una nueva tarea en la base de datos.
 * @param {object} taskData - Los datos para la nueva tarea.
 */
const create = (taskData) => {
  return async (dispatch) => {
    dispatch(createRequest());
    try {
      const { data: result, error } = await supabase
        .from(TABLE_NAME)
        .insert([taskData])
        .select(SELECT_QUERY)
        .single();

      if (error) throw error;

      dispatch(createSuccess(result));
      return { success: true, data: taskTransformer(result) };
    } catch (error) {
      console.error(`Error creando en ${TABLE_NAME}:`, error);
      dispatch(createFailure(error.message));
      return { success: false, error: error.message };
    }
  };
};


// --- ACCIÓN DE ACTUALIZAR ---

const updateRequest = () => ({
  type: actionTypes.UPDATE_TASKS_REQUEST,
});

const updateSuccess = (data) => ({
  type: actionTypes.UPDATE_TASKS_SUCCESS,
  payload: taskTransformer(data),
});

const updateFailure = (error) => ({
  type: actionTypes.UPDATE_TASKS_FAILURE,
  payload: error,
});

/**
 * Actualiza una tarea existente por su ID.
 * @param {string|number} taskId - El ID de la tarea a actualizar.
 * @param {object} taskData - Los campos a actualizar.
 */
const update = (taskId, taskData) => {
  return async (dispatch) => {
    dispatch(updateRequest());
    try {
      const { data: result, error } = await supabase
        .from(TABLE_NAME)
        .update(taskData)
        .eq('id', taskId)
        .select(SELECT_QUERY)
        .single();

      if (error) throw error;

      dispatch(updateSuccess(result));
      return { success: true, data: taskTransformer(result) };
    } catch (error) {
      console.error(`Error actualizando en ${TABLE_NAME}:`, error);
      dispatch(updateFailure(error.message));
      return { success: false, error: error.message };
    }
  };
};


// --- ACCIÓN DE ELIMINAR ---

const deleteRequest = () => ({
  type: actionTypes.DELETE_TASKS_REQUEST,
});

const deleteSuccess = (id) => ({
  type: actionTypes.DELETE_TASKS_SUCCESS,
  payload: id,
});

const deleteFailure = (error) => ({
  type: actionTypes.DELETE_TASKS_FAILURE,
  payload: error,
});

/**
 * Elimina una tarea por su ID.
 * @param {string|number} taskId - El ID de la tarea a eliminar.
 */
const deleteRecord = (taskId) => {
  return async (dispatch) => {
    dispatch(deleteRequest());
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      dispatch(deleteSuccess(taskId));
      return { success: true, id: taskId };
    } catch (error) {
      console.error(`Error eliminando en ${TABLE_NAME}:`, error);
      dispatch(deleteFailure(error.message));
      return { success: false, error: error.message };
    }
  };
};


// ========================================
// 5. EXPORTACIONES FINALES
// ========================================

// Exportamos las acciones con nombres claros y listos para usar
export const addTask = create;
export const updateTask = update;
export const deleteTask = deleteRecord;

// Para compatibilidad con código existente que pueda usar estos nombres
export const updateTaskData = update;
export const deleteTaskData = deleteTask;