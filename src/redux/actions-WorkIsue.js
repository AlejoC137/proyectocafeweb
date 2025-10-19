import { v4 as uuidv4 } from 'uuid';
import supabase from "../config/supabaseClient";
import { GET_ALL_FROM_TABLE } from './actions-types';

export function crearItem(itemData, type, forId) {
  console.log(itemData);
  
  return async (dispatch) => {
    try {
      // Generar un objeto base con UUID
      let nuevoItem = {
        _id: uuidv4(),
        ...itemData,
      };

      if (type === "RecetasProduccion") { 
        nuevoItem = {
          ...nuevoItem,
          forId: forId
        };
      }

      // Si el tipo NO es 'Recetas', agregar FECHA_ACT
      if (type !== 'RecetasProduccion') {
        nuevoItem = {
          ...nuevoItem,
          actualizacion: new Date().toISOString().split("T")[0], // Fecha actual
        };
      }

      // Insertar el nuevo ítem en Supabase
      const { data, error } = await supabase
        .from(type)
        .insert([nuevoItem])
        .select();

      if (error) {
        console.error("Error al crear el ítem:", error);
        throw new Error("No se pudo crear el ítem");
      }

      // Despachar la acción para actualizar el estado global
      dispatch({
        type: "CREAR_ITEM_SUCCESS",
        payload: data[0], // El nuevo ítem creado
      });

      console.log("Ítem creado correctamente:", data[0]);
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearItem:", error);
      throw error;
    }
  };
}

export function crearWorkIsue(workIsueData) {
  console.log(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  
  return async (dispatch) => {
    console.log(workIsueData);
    
    try {
      // Generar un objeto base con UUID
      const nuevoWorkIsue = {
        _id: uuidv4(),
        ...workIsueData,
        Dates: { isued: new Date().toISOString(), finished: "", date_asigmente: [] }, // Fecha y hora actual
      };

      // Insertar el nuevo  en Supabase
      const { data, error } = await supabase
        .from("WorkIsue")
        .insert([nuevoWorkIsue])
        .select();

      if (error) {
        console.error("Error al crear el :", error);
        throw new Error("No se pudo crear el ");
      }

      // Despachar la acción para actualizar el estado global
      dispatch({
        type: "CREAR_WORKISUE_SUCCESS",
        payload: data[0], // El nuevo  creado
      });

      console.log(" creado correctamente:", data[0]);
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearWorkIsue:", error);
      throw error;
    }
  };
}

export function deleteWorkIsue(itemId , type) {
  const table = type === MenuItems ? MENU : type 
  return async (dispatch) => {
    try {
      // Llamada a Supabase para eliminar el registro
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", itemId); // Filtrar por el ID del ítem

      if (error) {
        console.error("Error al eliminar el ítem:", error);
        throw new Error("No se pudo eliminar el ítem");
      }

      // Si es necesario, despacha una acción para actualizar el estado global
      dispatch({
        type: "DELETE_ITEM_SUCCESS",
        payload: itemId, // Enviar el ID del ítem eliminado
      });

      console.log(`Ítem con ID ${itemId} eliminado correctamente.`);
    } catch (error) {
      console.error("Error en la acción deleteItem:", error);
      throw error;
    }
  };
}

export function crearCompra(compraData) {
  console.log(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  
  return async (dispatch) => {
    try {
      // Generar un objeto base con UUID
      const nuevaCompra = {
        _id: uuidv4(),
        ...compraData,
        // Date: new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }), // Fecha y hora actual
        // Mesa: ventaData.Mesa, // Agregar el campo Mesa
      };

      // Insertar la nueva venta en Supabase
      const { data, error } = await supabase
        .from("Compras")
        .insert([nuevaCompra])
        .select();

      if (error) {
        console.error("Error al crear la compra:", error);
        throw new Error("No se pudo crear la venta");
      }

      // Despachar la acción para actualizar el estado global
      dispatch({
        type: "CREAR_COMPRA_SUCCESS",
        payload: data[0], // La nueva venta creada
      });

      console.log("Venta creada correctamente:", data[0]);
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearVenta:", error);
      throw error;
    }
  };
}

export function actualizarWorkIsue(workIsueId, updatedFields) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("")
        .update(updatedFields)
        .eq("_id", workIsueId)
        .select();

      if (error) {
        console.error('Error al actualizar el :', error);
        return null;
      }

      console.log(' actualizado correctamente:', data);
      return data;
    } catch (error) {
      console.error('Error en la acción actualizarWorkIsue:', error);
    }
  };
}

export function eliminarWorkIsue(workIsueId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("")
        .delete()
        .eq("_id", workIsueId)
        .select();

      if (error) {
        console.error('Error al eliminar el :', error);
        return null;
      }

      console.log(' eliminado correctamente:', data);
      return data;
    } catch (error) {
      console.error('Error en la acción eliminarWorkIsue:', error);
    }
  };
}

export function actualizarPago(workIsueId, pagoInfo) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("")
        .update({
          Pagado: true,
          Pago_Info: pagoInfo,
        })
        .eq("_id", workIsueId)
        .select();

      if (error) {
        console.error('Error al actualizar el pago:', error);
        return null;
      }

      console.log('Pago actualizado correctamente:', data);
      return data;
    } catch (error) {
      console.error('Error en la acción actualizarPago:', error);
    }
  };
}

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