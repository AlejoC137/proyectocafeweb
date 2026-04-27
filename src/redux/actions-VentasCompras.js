import { v4 as uuidv4 } from 'uuid';
import supabase from "../config/supabaseClient";
import { GET_ALL_FROM_TABLE, UPDATE_COMPRA_SUCCESS } from './actions-types';

export function crearItem(itemData, type, forId) {
  return async (dispatch) => {
    try {
      let nuevoItem = {
        _id: uuidv4(),
        ...itemData,
      };

      if (type === "RecetasProduccion") {
        nuevoItem = { ...nuevoItem, forId };
      }

      if (type !== 'RecetasProduccion') {
        nuevoItem = {
          ...nuevoItem,
          actualizacion: new Date().toISOString().split("T")[0],
        };
      }

      const { data, error } = await supabase.from(type).insert([nuevoItem]).select();

      if (error) {
        console.error("Error al crear el ítem:", error);
        throw new Error("No se pudo crear el ítem");
      }

      dispatch({ type: "CREAR_ITEM_SUCCESS", payload: data[0] });
      return data[0];
    } catch (error) {
      console.error("Error en crearItem:", error);
      throw error;
    }
  };
}

export function crearVenta(ventaData) {
  const currentDate = new Date();
  const ADate = currentDate.toLocaleDateString("en-US", { timeZone: "America/Bogota" });
  const ATime = currentDate.toLocaleTimeString("en-US", { timeZone: "America/Bogota" });

  return async (dispatch) => {
    try {
      const nuevaVenta = {
        _id: uuidv4(),
        ...ventaData,
        Date: ADate,
        Time: ATime,
        Mesa: ventaData.Mesa,
      };

      const { data, error } = await supabase.from("Ventas").insert([nuevaVenta]).select();

      if (error) {
        console.error("Error al crear la venta:", error);
        throw new Error("No se pudo crear la venta");
      }

      dispatch({ type: "CREAR_VENTA_SUCCESS", payload: data[0] });
      return data[0];
    } catch (error) {
      console.error("Error en crearVenta:", error);
      throw error;
    }
  };
}

export function crearCompra(compraData) {
  return async (dispatch) => {
    try {
      const nuevaCompra = { _id: uuidv4(), ...compraData };

      const { data, error } = await supabase.from("Compras").insert([nuevaCompra]).select();

      if (error) {
        console.error("Error al crear la compra:", error);
        throw new Error("No se pudo crear la compra");
      }

      dispatch({ type: "CREAR_COMPRA_SUCCESS", payload: data[0] });
      return data[0];
    } catch (error) {
      console.error("Error en crearCompra:", error);
      throw error;
    }
  };
}

export function actualizarVenta(ventaId, updatedFields) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Ventas").update(updatedFields).eq("_id", ventaId).select();

      if (error) {
        console.error('Error al actualizar la venta:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en actualizarVenta:', error);
    }
  };
}

export function eliminarVenta(ventaId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Ventas").delete().eq("_id", ventaId).select();

      if (error) {
        console.error('Error al eliminar la venta:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en eliminarVenta:', error);
    }
  };
}

export function actualizarPago(ventaId, pagoInfo) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .update({ Pagado: true, Pago_Info: pagoInfo })
        .eq("_id", ventaId)
        .select();

      if (error) {
        console.error('Error al actualizar el pago:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en actualizarPago:', error);
    }
  };
}

export function getAllCompras() {
  return async (dispatch) => {
    const { data, error } = await supabase.from('Compras').select('*');

    if (error) {
      console.error(error);
      return null;
    }

    return dispatch({ type: GET_ALL_FROM_TABLE, payload: data, path: 'Compras' });
  };
}

export function updateCompra(compraId, updatedFields) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Compras").update(updatedFields).eq("_id", compraId).select();

      if (error) {
        console.error('Error al actualizar la compra:', error);
        return null;
      }

      dispatch({ type: UPDATE_COMPRA_SUCCESS, payload: data[0] });
      return data;
    } catch (error) {
      console.error('Error en updateCompra:', error);
    }
  };
}

export function deleteCompra(compraId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from("Compras").delete().eq("_id", compraId).select();

      if (error) {
        console.error('Error al eliminar la compra:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en deleteCompra:', error);
    }
  };
}
