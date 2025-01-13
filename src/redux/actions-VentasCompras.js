import { v4 as uuidv4 } from 'uuid';
import supabase from "../config/supabaseClient";

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

export function crearVenta(ventaData) {
  console.log(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  
  return async (dispatch) => {
    try {
      // Generar un objeto base con UUID
      const nuevaVenta = {
        _id: uuidv4(),
        ...ventaData,
        Date: new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }), // Fecha y hora actual
        Mesa: ventaData.Mesa, // Agregar el campo Mesa
      };

      // Insertar la nueva venta en Supabase
      const { data, error } = await supabase
        .from("Ventas")
        .insert([nuevaVenta])
        .select();

      if (error) {
        console.error("Error al crear la venta:", error);
        throw new Error("No se pudo crear la venta");
      }

      // Despachar la acción para actualizar el estado global
      dispatch({
        type: "CREAR_VENTA_SUCCESS",
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

export function actualizarVenta(ventaId, updatedFields) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .update(updatedFields)
        .eq("_id", ventaId)
        .select();

      if (error) {
        console.error('Error al actualizar la venta:', error);
        return null;
      }

      console.log('Venta actualizada correctamente:', data);
      return data;
    } catch (error) {
      console.error('Error en la acción actualizarVenta:', error);
    }
  };
}

export function eliminarVenta(ventaId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .delete()
        .eq("_id", ventaId)
        .select();

      if (error) {
        console.error('Error al eliminar la venta:', error);
        return null;
      }

      console.log('Venta eliminada correctamente:', data);
      return data;
    } catch (error) {
      console.error('Error en la acción eliminarVenta:', error);
    }
  };
}

export function actualizarPago(ventaId, pagoInfo) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .update({
          Pagado: true,
          Pago_Info: pagoInfo,
        })
        .eq("_id", ventaId)
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