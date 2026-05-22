import { v4 as uuidv4 } from 'uuid';
import supabase from "../config/supabaseClient";
import { GET_ALL_FROM_TABLE } from './actions-types';

export function crearItem(itemData, type, forId) {
  
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
          // actualizacion: new Date().toISOString().split("T")[0], // Fecha actual
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
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearItem:", error);
      throw error;
    }
  };
}

export function crearComanda(ComandaData) {
  
  return async (dispatch) => {
    try {
      // Generar un objeto base con UUID
      const nuevoComanda = {
        _id: uuidv4(),
        ...ComandaData,
        Date: new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }), // Fecha y hora actual
        Mesa: ComandaData.Mesa, // Agregar el campo Mesa
      };

      // Insertar el nuevo Comanda en Supabase
      const { data, error } = await supabase
        .from("Comanda")
        .insert([nuevoComanda])
        .select();

      if (error) {
        console.error("Error al crear el Comanda:", error);
        throw new Error("No se pudo crear el Comanda");
      }

      // Despachar la acción para actualizar el estado global
      dispatch({
        type: "CREAR_Comanda_SUCCESS",
        payload: data[0], // El nuevo Comanda creado
      });
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearComanda:", error);
      throw error;
    }
  };
}

export function crearCompra(compraData) {
  
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
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearVenta:", error);
      throw error;
    }
  };
}

export function actualizarComanda(ComandaId, updatedFields) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Comanda")
        .update(updatedFields)
        .eq("_id", ComandaId)
        .select();

      if (error) {
        console.error('Error al actualizar el Comanda:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error en la acción actualizarComanda:', error);
    }
  };
}

export function eliminarComanda(ComandaId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Comanda")
        .delete()
        .eq("_id", ComandaId)
        .select();

      if (error) {
        console.error('Error al eliminar el Comanda:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error en la acción eliminarComanda:', error);
    }
  };
}

export function actualizarPago(ComandaId, pagoInfo) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Comanda")
        .update({
          Pagado: true,
          Pago_Info: pagoInfo,
        })
        .eq("_id", ComandaId)
        .select();

      if (error) {
        console.error('Error al actualizar el pago:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error en la acción actualizarPago:', error);
    }
  };
}

export const crearProcedimiento = (procedimientoData) => {
  return async (dispatch) => {
    try {
      const nuevoProcedimiento = {
        _id: uuidv4(),
        ...procedimientoData,
      };

      const { data, error } = await supabase
        .from('Procedimientos')
        .insert([nuevoProcedimiento])
        .select();

      if (error) {
        console.error("Error al crear el procedimiento:", error);
        throw new Error("No se pudo crear el procedimiento");
      }

      dispatch({
        type: "CREAR_PROCEDIMIENTO_SUCCESS",
        payload: data[0],
      });
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearProcedimiento:", error);
      throw error;
    }
  };
};

export function actualizarProcedimiento(procedimientoId, updatedFields) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Procedimientos")
        .update(updatedFields)
        .eq("_id", procedimientoId)
        .select();

      if (error) {
        console.error('Error al actualizar el procedimiento:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error en la acción actualizarProcedimiento:', error);
    }
  };
}

export function eliminarProcedimiento(procedimientoId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Procedimientos")
        .delete()
        .eq("_id", procedimientoId)
        .select();

      if (error) {
        console.error('Error al eliminar el procedimiento:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error en la acción eliminarProcedimiento:', error);
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