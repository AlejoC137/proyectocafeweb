import supabase from "../config/supabaseClient";
import {
  GET_ALL_FROM_TABLE,
  UPDATE_ACTIVE_TAB,
  SET_USER_REG_STATE,
  UPDATE_SELECTED_VALUE,
  INSERT_RECETAS_SUCCESS,
  INSERT_RECETAS_FAILURE
} from "./actions-types";

import axios from "axios";
import { v4 as uuidv4 } from 'uuid'; // Importar para generar UUIDs

// Acción para obtener todos los datos de una tabla
export function getAllFromTable(Table) {
  return async (dispatch) => {
    let { data, error } = await supabase
      .from(Table)
      .select('*');

    if (error) {
      console.error(error);
      return null;
    }

    return dispatch({
      type: GET_ALL_FROM_TABLE,
      payload: data,
      path: Table,
    });
  };
}

// Acción para arreglar las URLs
export function fixUrl(datos, campo, buscar, reemplazar) {
  return async (dispatch) => {
    try {
      const updatePromises = datos.map(async (cadaDato) => {
        if (cadaDato[campo] && cadaDato[campo].includes(buscar)) {
          const nuevaURL = cadaDato[campo].replace(buscar, reemplazar);
          const { data, error } = await supabase
            .from('Menu')
            .update({ [campo]: nuevaURL })
            .eq('_id', cadaDato._id);

          if (error) {
            console.error(`Error al actualizar el registro ${cadaDato.id}:`, error);
          }

          return data;
        }
        return null;
      });

      await Promise.all(updatePromises);
      console.log("Actualización completada");

    } catch (error) {
      console.error("Error en la función fixUrl:", error);
    }
  };
}

// Acción para actualizar la pestaña activa
export function updateActiveTab(option) {
  return async (dispatch) => {
    try {
      return dispatch({
        type: UPDATE_ACTIVE_TAB,
        payload: option,
      });
    } catch (error) {
      console.error("Error updating active tab:", error);
    }
  };
}

// Acción para actualizar el valor seleccionado
export function updateSelectedValue(value) {
  return async (dispatch) => {
    try {
      return dispatch({
        type: UPDATE_SELECTED_VALUE,
        payload: value,
      });
    } catch (error) {
      console.error("Error updating selected value:", error);
    }
  };
}

// Acción para actualizar el estado de registro del usuario
export function updateUserRegState(newState) {
  return async (dispatch) => {
    try {
      return dispatch({
        type: SET_USER_REG_STATE,
        payload: newState,
      });
    } catch (error) {
      console.error("Error updating user registration state:", error);
    }
  };
}

export function insertarRecetas(recetasData, upsert = false) {
  return async (dispatch) => {
    try {
      let data, error;

      if (upsert) {
        ({ data, error } = await supabase
          .from('Recetas')
          .upsert(recetasData)
          .select());
      } else {
        ({ data, error } = await supabase
          .from('Recetas')
          .insert(recetasData)
          .select());
      }

      if (error) {
        console.error("Error inserting/upserting recipes:", error);
        return dispatch({
          type: INSERT_RECETAS_FAILURE,
          payload: error.message,
        });
      }

      return dispatch({
        type: INSERT_RECETAS_SUCCESS,
        payload: data,
      });
    } catch (error) {
      console.error("Error in insertarRecetas:", error);
      return dispatch({
        type: INSERT_RECETAS_FAILURE,
        payload: error.message,
      });
    }
  };
}

// Función para procesar el JSON de receta y enviarlo a Supabase
export function procesarRecetaYEnviarASupabase(recetaJson) {
  return async (dispatch) => {
    try {
      // Verificar si el objeto receta y la propiedad 'receta' existen
      if (!recetaJson || typeof recetaJson !== 'object' || !recetaJson.receta) {
        throw new Error("El JSON de receta no tiene la estructura esperada");
      }

      // Extraer los datos del JSON de receta
      const receta = recetaJson.receta;

      // Inicializar el objeto que coincide con el esquema de la tabla en Supabase
      const recetaParaSupabase = {};

      // Generar un UUID para el campo _id si no existe
      recetaParaSupabase._id = uuidv4();

      // Validar y mapear los campos desde receta a las columnas de la tabla
      recetaParaSupabase.forId = validarUUID(receta.perteneceA) ? receta.perteneceA : null;
      recetaParaSupabase.rendimiento = {
        porcion: receta.rendimiento_porcion || null,
        cantidad: receta.rendimiento_cantidad || null,
        unidades: receta.rendimiento_unidades || null,
      };
      recetaParaSupabase.emplatado = receta.emplatado || null;
      recetaParaSupabase.autor = receta.escrito || null;
      recetaParaSupabase.revisor = receta.revisado || null;
      recetaParaSupabase.actualizacion = receta.actualizacion || new Date().toISOString();

      // Mapear notas a nota1, nota2, ..., nota10
      if (receta.notas && Array.isArray(receta.notas)) {
        for (let i = 0; i < 10; i++) {
          const notaKey = `nota${i + 1}`;
          recetaParaSupabase[notaKey] = receta.notas[i] || null;
        }
      }

      // Mapear preparación a proces1, proces2, ..., proces20
      if (receta.preparacion && Array.isArray(receta.preparacion)) {
        for (let i = 0; i < 20; i++) {
          const procesKey = `proces${i + 1}`;
          recetaParaSupabase[procesKey] = receta.preparacion[i] ? receta.preparacion[i].proceso : null;
        }
      }

      // Mapear ingredientes a item1_Id, item1_Cuantity_Units, etc.
      if (receta.ingredientes && Array.isArray(receta.ingredientes)) {
        for (let i = 0; i < 20; i++) {
          const ingrediente = receta.ingredientes[i];
          const itemIdKey = `item${i + 1}_Id`;
          const itemCuantityUnitsKey = `item${i + 1}_Cuantity_Units`;

          if (ingrediente) {
            recetaParaSupabase[itemIdKey] = validarUUID(ingrediente.id) ? ingrediente.id : null;
            recetaParaSupabase[itemCuantityUnitsKey] = {
              metric: {
                cuantity: ingrediente.cantidad || null,
                units: ingrediente.unidades || null,
              },
              imperial: {
                cuantity: null, // Puedes calcular las unidades imperiales si es necesario
                units: null,
              },
              legacyName: ingrediente.nombre || null,
            };
          } else {
            recetaParaSupabase[itemIdKey] = null;
            recetaParaSupabase[itemCuantityUnitsKey] = null;
          }
        }
      }

      // Llamar a la acción insertarRecetas para insertar los datos en Supabase
      dispatch(insertarRecetas([recetaParaSupabase]));

    } catch (error) {
      console.error('Error al procesar la receta y enviar a Supabase:', error);
    }
  };
}

// Función auxiliar para validar UUID
function validarUUID(uuid) {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}