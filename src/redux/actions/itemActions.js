import { buildUpdatedHistory } from '../../utils/historyUtils';
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

export function updateItem(itemId, updatedFields, type, auditMeta = null) {
  const table = type === MenuItems ? MENU : type;
  return async (dispatch, getState) => {
    try {
      const payload = { ...updatedFields };

      // Tablas que soportan historial acumulado: ItemsAlmacen y Menu
      const isAlmacen = table === ITEMS || table === ItemsAlmacen || table === 'ItemsAlmacen';
      const isMenu = table === MENU || table === MenuItems || table === 'Menu';

      if ((isAlmacen || isMenu) && !payload.historial_update) {
        const state = (typeof getState === 'function') ? getState() : {};
        const stateList = isMenu ? (state.allMenu || []) : (state.allItems || []);
        let original = stateList.find(i => i._id === itemId);

        if (!original) {
          const { data: dbItem } = await supabase.from(table).select('*').eq('_id', itemId).maybeSingle();
          original = dbItem;
        }

        if (original) {
          const cambios = {};
          const ignoredKeys = ["_id", "historial_update", "FECHA_ACT", "createdAt", "updatedAt", "campos_parseados", "id", "Order"];

          Object.keys(payload).forEach(key => {
            if (key.startsWith('_') || ignoredKeys.includes(key)) return;

            let oldVal = original[key];
            let newVal = payload[key];

            const isOldNum = !isNaN(oldVal) && oldVal !== "" && oldVal !== null && typeof oldVal !== 'object';
            const isNewNum = !isNaN(newVal) && newVal !== "" && newVal !== null && typeof newVal !== 'object';

            let different = false;
            if (isOldNum && isNewNum) {
              if (Number(oldVal) !== Number(newVal)) different = true;
            } else {
              const strOld = (oldVal === null || oldVal === undefined) ? "" : String(oldVal).trim();
              const strNew = (newVal === null || newVal === undefined) ? "" : String(newVal).trim();
              if (strOld !== strNew) different = true;
            }

            if (different) {
              cambios[key] = {
                anterior: oldVal !== undefined ? oldVal : null,
                nuevo: newVal
              };
            }
          });

          if (Object.keys(cambios).length > 0) {
            const meta = auditMeta || {
              origen: isMenu ? "Menú (Manual)" : "Inventario (Manual)",
              tipo: "manual"
            };
            payload.historial_update = buildUpdatedHistory(original.historial_update, cambios, meta);
            if (isAlmacen && !payload.FECHA_ACT) {
              payload.FECHA_ACT = new Date().toISOString().split('T')[0];
            }
          }
        }
      }

      let { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('_id', itemId)
        .select();

      // Tolerancia si la columna historial_update aún no ha sido creada en la tabla Menu de Supabase
      if (error && error.message && error.message.includes('historial_update') && payload.historial_update) {
        console.warn('⚠️ La columna historial_update no existe en la tabla ' + table + '. Ejecuta alter_menu_add_historial.sql en Supabase. Guardando sin historial.');
        const fallback = { ...payload };
        delete fallback.historial_update;
        const retryResult = await supabase
          .from(table)
          .update(fallback)
          .eq('_id', itemId)
          .select();
        data = retryResult.data;
        error = retryResult.error;
      }

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
