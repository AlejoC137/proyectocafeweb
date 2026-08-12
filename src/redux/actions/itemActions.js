import supabase from "../../config/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { MenuItems, MENU } from "../actions-types";

export function calcularPrecioUnitario(item) {
  let precioUnitario;
  const ajusteInflacionario = 1.04;

  if (item.COSTO === "NaN" || item.CANTIDAD === "NaN") {
    console.error("No se puede calcular el valor porque uno de los parámetros es NaN:", item);
    return 0;
  }

  const costo = parseFloat(item.COSTO);
  const cantidad = parseFloat(item.CANTIDAD);
  let coor = parseFloat(item.COOR);
  let merma = parseFloat(item.Merma) || 0;

  if (isNaN(coor)) {
    coor = 1;
  }

  if (!cantidad || cantidad === 0) return 0;

  const mermaDecimal = merma > 1 ? merma / 100 : merma;
  const rendimiento = cantidad - (cantidad * mermaDecimal);

  if (rendimiento <= 0) return 0;

  precioUnitario = (costo / rendimiento) * ajusteInflacionario * coor;

  return parseFloat(precioUnitario.toFixed(2));
}

export function actualizarPrecioUnitario(items, type) {
  return async (dispatch) => {
    try {
      for (let item of items) {
        const precioUnitario = calcularPrecioUnitario(item);

        if (isNaN(precioUnitario) || precioUnitario === null) {
          console.error(`Error al calcular el precio unitario para el item con _id: ${item._id}`);
          continue;
        }

        let { data, error } = await supabase
          .from(type)
          .update({
            precioUnitario: precioUnitario,
          })
          .eq('_id', item._id)
          .select();

        if (error) {
          console.error(`Error al actualizar el item con _id: ${item._id}`, error);
        }
      }
    } catch (error) {
      console.error('Error en la función actualizarPrecioUnitario:', error);
    }
  };
}

export function crearItem(itemData, type, forId) {
  return async (dispatch) => {
    try {
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

      const { data, error } = await supabase
        .from(type)
        .insert([nuevoItem])
        .select();

      if (error) {
        console.error("Error al crear el ítem:", error);
        throw new Error("No se pudo crear el ítem");
      }

      dispatch({
        type: "CREAR_ITEM_SUCCESS",
        payload: data[0],
      });
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearItem:", error);
      throw error;
    }
  };
}

export function updateItem(itemId, updatedFields, type) {
  const table = type === MenuItems ? MENU : type;
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updatedFields)
        .eq('_id', itemId)
        .select();

      if (error) {
        console.error('Error al actualizar el ítem:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error en la acción updateItem:', error);
    }
  };
}

export function deleteItem(itemId, type) {
  const table = type === MenuItems ? MENU : type;
  return async (dispatch) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("_id", itemId);

      if (error) {
        console.error("Error al eliminar el ítem:", error);
        throw new Error("No se pudo eliminar el ítem");
      }

      dispatch({
        type: "DELETE_ITEM_SUCCESS",
        payload: itemId,
      });
    } catch (error) {
      console.error("Error en la acción deleteItem:", error);
      throw error;
    }
  };
}
