import supabase from "../../config/supabaseClient";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  SCRAP,
  GET_ALL_FROM_TABLE,
  RESET_EXPANDED_GROUPS,
  ADD_ORDER_ITEM,
  RECETAS_PRODUCCION,
  PRODUCCION,
} from "../actions-types";
import { updateItem } from "./itemActions";

export function scrapAction(url, pointers) {
  return async (dispatch) => {
    try {
      const response = await axios(url);
      const html = response.data;
      const $ = cheerio.load(html);
      const resultData = {};

      pointers.forEach(({ title, key }) => {
        const results = [];
        $('.' + key, html).each(function () {
          const result = $(this).text().trim();
          if (result) results.push(result);
        });
        resultData[title] = results;
      });

      dispatch({
        type: SCRAP,
        payload: resultData,
      });
    } catch (err) {
      console.error('Error durante el scraping:', err);
    }
  };
}

export function getAllFromTable(Table) {
  return async (dispatch, getState) => {
    if (Table === 'Ventas' || Table === 'Compras') {
      let allData = [];
      let page = 0;
      const pageSize = 500;
      let useOrder = true;

      while (true) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        let query = supabase.from(Table).select('*').range(from, to);
        
        if (useOrder) {
          query = query.order('Date', { ascending: false });
        }

        let { data, error } = await query;

        if (error && useOrder) {
          console.warn(`Ordering by Date failed for ${Table}, retrying without order. Error:`, error.message || error);
          useOrder = false;
          query = supabase.from(Table).select('*').range(from, to);
          const retry = await query;
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error(`Error fetching paginated ${Table}:`, error.message || error);
          break;
        }

        if (data) allData = [...allData, ...data];
        if (!data || data.length < pageSize) break;
        page++;
      }

      return dispatch({
        type: GET_ALL_FROM_TABLE,
        payload: allData,
        path: Table,
      });
    }

    let { data, error } = await supabase
      .from(Table)
      .select('*');

    if (error) {
      console.error(error.message || error);
      return null;
    }

    return dispatch({
      type: GET_ALL_FROM_TABLE,
      payload: data,
      path: Table,
    });
  };
}

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
    } catch (error) {
      console.error("Error en la función fixUrl:", error);
    }
  };
}

export function copiarAlPortapapeles(items, estado) {
  return async () => {
    try {
      const elementosFiltrados = items.filter((item) => item.Estado === estado);

      if (elementosFiltrados.length === 0) {
        alert(`No se encontraron elementos con el estado "${estado}".`);
        return;
      }

      const textoParaCopiar = elementosFiltrados
        .map((item) => `- ${item.Nombre_del_producto}: ${item.CANTIDAD} ${item.UNIDADES}`)
        .join("\n");

      await navigator.clipboard.writeText(textoParaCopiar);

      alert(`Se han copiado ${elementosFiltrados.length} elementos con estado "${estado}" al portapapeles.`);
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
      alert("Hubo un error al copiar al portapapeles.");
    }
  };
}

export const getProveedor = async (uuid, type) => {
  try {
    const { data, error } = await supabase
      .from(type)
      .select("*")
      .eq("_id", uuid)
      .single();

    if (error) {
      console.error("Error al obtener el proveedor :", error);
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Error en la acción getProveedor:", error);
    return null;
  }
};

export const resetExpandedGroups = () => {
  return {
    type: RESET_EXPANDED_GROUPS,
  };
};

export const addOrderItem = (item) => ({
  type: ADD_ORDER_ITEM,
  payload: item,
});

export function sincronizarCostosProduccion() {
  return async (dispatch, getState) => {
    try {
      await dispatch(getAllFromTable(RECETAS_PRODUCCION));
      await dispatch(getAllFromTable(PRODUCCION));

      const state = getState();
      const { allRecetasProduccion, allProduccion } = state;
      let updatesCounter = 0;

      for (const item of allProduccion) {
        if (item.Receta) {
          const receta = allRecetasProduccion.find(r => r._id === item.Receta);

          if (receta) {
            let updates = {};
            let hasChanges = false;

            if (receta.costo !== undefined && receta.costo !== null) {
              let nuevoCosto = receta.costo;
              if (typeof nuevoCosto === 'string') nuevoCosto = parseFloat(nuevoCosto);

              const costoActual = parseFloat(item.COSTO) || 0;
              if (Math.abs(costoActual - nuevoCosto) > 0.01) {
                updates.COSTO = nuevoCosto;
                hasChanges = true;
              }
            }

            if (receta.rendimiento) {
              try {
                const rend = JSON.parse(receta.rendimiento);
                if (rend.cantidad) {
                  const nuevaCantidad = parseFloat(rend.cantidad);
                  const cantidadActual = parseFloat(item.CANTIDAD) || 0;
                  if (Math.abs(cantidadActual - nuevaCantidad) > 0.01) {
                    updates.CANTIDAD = nuevaCantidad;
                    hasChanges = true;
                  }
                }
                if (rend.unidades) {
                  if (item.UNIDADES !== rend.unidades) {
                    updates.UNIDADES = rend.unidades;
                    hasChanges = true;
                  }
                }
              } catch (e) {
                console.warn(`Error parseando rendimiento para receta ${receta._id}`, e);
              }
            }

            const finalCosto = updates.COSTO !== undefined ? updates.COSTO : (parseFloat(item.COSTO) || 0);
            const finalCantidad = updates.CANTIDAD !== undefined ? updates.CANTIDAD : (parseFloat(item.CANTIDAD) || 0);

            if (finalCantidad > 0) {
              const ajusteInflacionario = 1.04;
              let coor = parseFloat(item.COOR);
              if (isNaN(coor)) coor = 1;

              const nuevoPrecioUnitario = (finalCosto / finalCantidad) * ajusteInflacionario * coor;
              const precioUnitarioActual = parseFloat(item.precioUnitario) || 0;

              if (Math.abs(precioUnitarioActual - nuevoPrecioUnitario) > 0.0001) {
                updates.precioUnitario = parseFloat(nuevoPrecioUnitario.toFixed(2));
                hasChanges = true;
              }
            }

            if (hasChanges) {
              await dispatch(updateItem(item._id, updates, PRODUCCION));
              updatesCounter++;
            }
          }
        }
      }

      if (updatesCounter > 0) {
        alert(`Sincronización completada. Se actualizaron ${updatesCounter} ítems.`);
        dispatch(getAllFromTable(PRODUCCION));
      } else {
        alert("Sincronización completada. No se encontraron ítems desactualizados.");
      }
    } catch (error) {
      console.error("Error durante la sincronización de costos:", error);
      alert("Ocurrió un error al sincronizar costos.");
    }
  };
}

export const getOtherExpenses = (subGrupo) => {
  switch (subGrupo) {
    case 'CAFE_ESPRESSO':
      return [
        'f9bc7971-3120-46d6-b966-866bfb4f6b41',
        'f9bc7971-3120-46d6-b966-866bfb4f6b41',
      ];

    case 'POSTRES_INDIVIDUALES':
      return [
        {
          item_Id: 'gasto_empaque_postre',
          nombre: 'Empaque para llevar',
          originalQuantity: 1,
          unidades: 'Unidad',
          precioUnitario: 800,
          isChecked: true,
        }
      ];

    default:
      return [];
  }
};
