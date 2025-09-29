// ARCHIVO: standaloneTaskActions.js
// Este archivo es autónomo y no requiere otros archivos de tu proyecto para funcionar.
// Contiene la inicialización del cliente de Supabase y las acciones CRUD para las tareas.

import { createClient } from "@supabase/supabase-js";

// ========================================
// 1. CONFIGURACIÓN DEL CLIENTE DE SUPABASE
// (Copiado desde src/config/supabaseClient.js)
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
// (Copiado desde src/store/actions/taskActions.js)
// ========================================

const getTaskStatusColor = (status) => {
  const colors = {
    'Pendiente': 'gray',
    'En Progreso': 'blue',
    'En Diseño': 'purple',
    'Aprobación Requerida': 'orange',
    'Bloqueado': 'red',
    'Completo': 'green',
  };
  return colors[status] || 'gray';
};

const getPriorityColor = (priority) => {
  const colors = {
    'Baja': 'green',
    'Media': 'yellow',
    'Alta': 'orange',
    'Crítica': 'red',
  };
  return colors[priority] || 'gray';
};

const isTaskOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const taskTransformer = (data) => {
  const transformItem = (item) => ({
    // Transformaciones genéricas
    ...item,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    displayName: item.name || item.title || `${item.id}`,
    // Transformaciones específicas de tareas
    statusColor: getTaskStatusColor(item.status),
    priorityColor: getPriorityColor(item.priority),
    isOverdue: isTaskOverdue(item.due_date),
    projectName: item.projects?.name || 'Sin proyecto',
    assigneeName: item.staff?.name || 'Sin asignar',
    stageName: item.stages?.name || 'Sin etapa',
    taskDescription: item.task_description || item.description || '',
  });

  return Array.isArray(data) ? data.map(transformItem) : transformItem(data);
};

// ========================================
// 4. LÓGICA DE LAS ACCIONES CRUD
// (Adaptado desde src/store/actions/crudActions.js)
// ========================================

// Query de selección con relaciones para obtener datos completos
const SELECT_QUERY = '*, projects(id,name), staff(_id,name), stages(id,name)';

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
      return { success: true, data: result };
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
      return { success: true, data: result };
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