import supabase from "../config/supabaseClient";
import {
  GET_ALL_FROM_TABLE,
  UPDATE_ACTIVE_TAB
} from "./actions-types";

import axios from "axios";


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
};

export function fixUrl(datos, campo, buscar, reemplazar) {
  return async (dispatch) => {
    try {
      // Crear un array para las promesas de actualización
      const updatePromises = datos.map(async (cadaDato) => {
        // Verificar si el campo existe y contiene la cadena que estamos buscando
        if (cadaDato[campo] && cadaDato[campo].includes(buscar)) {
          // Reemplazar la parte de la URL
          const nuevaURL = cadaDato[campo].replace(buscar, reemplazar);

          // Hacer la actualización en Supabase para este dato en específico
          const { data, error } = await supabase
            .from('Menu') // Cambiar 'Menu' por la tabla correspondiente
            .update({ [campo]: nuevaURL })
            .eq('_id', cadaDato._id); // Asegúrate de usar la columna adecuada para identificar el registro

          if (error) {
            console.error(`Error al actualizar el registro ${cadaDato.id}:`, error);
          }

          return data; // Devolver los datos actualizados si la actualización fue exitosa
        }

        return null; // Si no se requiere actualización, devolver null
      });

      // Esperar que todas las promesas de actualización se completen
      await Promise.all(updatePromises);
      
      console.log("Actualización completada");

    } catch (error) {
      console.error("Error en la función fixUrl:", error);
    }
  };
}


export const updateActiveTab = (tab) => ({
  type: "UPDATE_ACTIVE_TAB",
  payload: tab,
});