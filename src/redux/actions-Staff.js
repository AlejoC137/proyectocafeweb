// actions.js
import supabase from "../config/supabaseClient";
import {
  GET_ALL_FROM_TABLE,
  UPDATE_ACTIVE_TAB,
  SET_USER_REG_STATE,
  UPDATE_SELECTED_VALUE,
  INSERT_RECETAS_SUCCESS,
  INSERT_RECETAS_FAILURE,
  INSERT_ITEM_FAILURE ,
  SET_PREPROCESS_DATA,
  SCRAP,
  ItemsAlmacen,
  TOGGLE_SHOW_EDIT,
  ProduccionInterna,
  RESET_EXPANDED_GROUPS,
  ADD_ORDER_ITEM
  
} from "./actions-types";

import axios from "axios";
import { v4 as uuidv4 } from 'uuid'; // Importar para generar UUIDs
import * as cheerio from "cheerio";

export function scrapAction(url, pointers) {
  return async (dispatch) => {
    try {
      const response = await axios(url);
      const html = response.data;
      const $ = cheerio.load(html); // Ejemplo de uso
      const resultData = {}; // Objeto para almacenar todos los resultados

      // Iterar sobre los pointers para buscar datos específicos
      pointers.forEach(({ title, key }) => {
        const results = [];

        // Buscar cada elemento basado en el selector `key` (clase CSS) y agregarlo al array
        $('.' + key, html).each(function () {
          const result = $(this).text().trim();
          if (result) results.push(result);
        });

        // Agregar los resultados al objeto con la clave definida en `title`
        resultData[title] = results;
      });

      // Despachar los datos recopilados a Redux
      dispatch({
        type: SCRAP,
        payload: resultData,
      });

      console.log('Datos extraídos:', resultData);
    } catch (err) {
      console.error('Error durante el scraping:', err);
    }
  };
}

export const toggleShowEdit = () => {
  return (dispatch, getState) => {
    const currentShowEdit = getState().showEdit; // Obtener el valor actual
    dispatch({
      type: TOGGLE_SHOW_EDIT,
      payload: !currentShowEdit, // Alternar el estado
    });
  };
};

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

// Acción para actualizar un ítem en Supabase


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
export function procesarRecetaYEnviarASupabase() {
  return async (dispatch, getState) => {
    try {
      const state = getState();
      const recetasPreProcess = state.preProcess;

      for (let e = 0; e < recetasPreProcess.length; e++) {

        const recetaJson = recetasPreProcess[e];

        // Verificar si el objeto receta y la propiedad 'receta' existen
        if (!recetaJson || typeof recetaJson !== 'object' || !recetaJson.receta) {
          throw new Error('El JSON de receta no tiene la estructura esperada');
        }

        // Extraer los datos del JSON de receta
        const receta = recetaJson.receta;

        // Inicializar el objeto que coincide con el esquema de la tabla en Supabase
        const recetaParaSupabase = {};

        // Generar un UUID para el campo _id si no existe
        recetaParaSupabase._id = uuidv4();

        // Buscar el ID del menú
        const menuItem = state.allMenu.find(item => item['NombreES'] === receta['nombre']);
        recetaParaSupabase.forId = menuItem && validarUUID(menuItem._id) ? menuItem._id : null;
        recetaParaSupabase.legacyName = receta.nombre;

        recetaParaSupabase.rendimiento = {
          porcion:  receta.rendimiento_porcion || null,
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

        // Mapear ingredientes a item1_Id, item1_Cuantity_Units, etc. o producto_interno
        if (receta.ingredientes && Array.isArray(receta.ingredientes)) {
          for (let i = 0; i < 20; i++) {
            const ingrediente = receta.ingredientes[i];
            const itemIdKey = `item${i + 1}_Id`;
            const itemCuantityUnitsKey = `item${i + 1}_Cuantity_Units`;
            const productoInternoIdKey = `producto_interno${i + 1}_Id`;
            const productoInternoCuantityUnitsKey = `producto_interno${i + 1}_Cuantity_Units`;

            if (ingrediente) {
              // Buscar el ID en el estado local usando el nombre legado (legacyName)
              const ingredienteEnItems = state.allItems.find(item => item['Nombre_del_producto'] === ingrediente.nombre);
              const ingredienteEnProduccion = state.allProduccion.find(item => item['Nombre_del_producto'] === ingrediente.nombre);

              if (ingredienteEnItems) {
                recetaParaSupabase[itemIdKey] = validarUUID(ingredienteEnItems._id) ? ingredienteEnItems._id : null;
                recetaParaSupabase[itemCuantityUnitsKey] = {
                  metric: {
                    cuantity: ingrediente.cantidad || null,
                    units: ingrediente.unidades || null,
                  },
                  imperial: {
                    cuantity: null, // Puedes calcular las unidades imperiales si es necesario
                    units: null,
                  }, 
                  legacyName:ingrediente.nombre
                };
              } else if (ingredienteEnProduccion) {
                recetaParaSupabase[productoInternoIdKey] = validarUUID(ingredienteEnProduccion._id) ? ingredienteEnProduccion._id : null;
                recetaParaSupabase[productoInternoCuantityUnitsKey] = {
                  metric: {
                    cuantity: ingrediente.cantidad || null,
                    units: ingrediente.unidades || null,
                  },
                  imperial: {
                    cuantity: null, // Puedes calcular las unidades imperiales si es necesario
                    units: null,
                  },
                  legacyName:ingrediente.nombre
                };
              }
              recetaParaSupabase.legacyName = receta.nombre;
            } else {
              recetaParaSupabase[itemIdKey] = null;
              recetaParaSupabase[itemCuantityUnitsKey] = null;
              recetaParaSupabase[productoInternoIdKey] = null;
              recetaParaSupabase[productoInternoCuantityUnitsKey] = null;
            }
          }
        }

        // Llamar a la acción insertarRecetas para insertar los datos en Supabase
        dispatch(insertarRecetas([recetaParaSupabase]));
  //  console.log(recetaParaSupabase);
   
      }
    } catch (error) {
      console.error('Error al procesar la receta y enviar a Supabase:', error);
    }
  };
}

export function preProcess(jsonCompleto) {
  return async (dispatch) => {
    try {
      // Verificar si el objeto es válido
      if (!jsonCompleto || !Array.isArray(jsonCompleto)) {
        throw new Error("El JSON proporcionado no tiene la estructura esperada");
      }

      const recetasProcesadas = jsonCompleto
        .filter(elemento => elemento.receta) // Filtrar elementos que tienen una propiedad 'receta'
        .map(elemento => {
          const receta = elemento.receta;
          const nombreReceta = elemento["NombreES"].replace(/^\.+|\.+$/g, ""); // Remover puntos al principio y al final
          return {
            receta: {
              ...receta,
              nombre: nombreReceta,
            }
          };
        });

      dispatch({
        type: SET_PREPROCESS_DATA,
        payload: recetasProcesadas,
      });
    } catch (error) {
      console.error('Error al preprocesar las recetas:', error);
    }
  };
}

function validarUUID(uuid) {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

export function actualizarPrecioUnitario(items,type) {
  return async (dispatch) => {
    try {
      for (let item of items) {
        // Calcular el precio unitario basado en la lógica proporcionada
        const precioUnitario = calcularPrecioUnitario(item);

        // Validar que el precio unitario sea un número válido
        if (isNaN(precioUnitario) || precioUnitario === null) {
          console.error(`Error al calcular el precio unitario para el item con _id: ${item._id}`);
          continue; // Saltar a la siguiente iteración si el precio no es válido
        }

        // Log para verificar los datos antes de la actualización
        console.log(`Actualizando el item con _id: ${item._id}, precioUnitario: ${precioUnitario}`);

        // Actualizar el valor unitario en el item correspondiente usando update()
        let { data, error } = await supabase
          .from(type) // Nombre correcto de la tabla
          .update({
            precioUnitario: precioUnitario,
          })
          .eq('_id', item._id) // Filtrar la fila donde _id coincida
          .select(); // Retornar los datos actualizados

        // Manejar el error de Supabase si existe
        if (error) {
          console.error(`Error al actualizar el item con _id: ${item._id}`, error);
        } else {
          console.log(`Item actualizado correctamente: ${item._id}`, data);
        }
      }
    } catch (error) {
      console.error('Error en la función actualizarPrecioUnitario:', error);
    }
  };
}

function calcularPrecioUnitario(item) {
  let precioUnitario;
  const ajusteInflacionario = 1.04;

  // Validar si alguno de los valores necesarios es "NaN"
  if (item.COSTO === "NaN" || item.CANTIDAD === "NaN" || item.COOR === "NaN") {
    console.error("No se puede calcular el valor porque uno de los parámetros es NaN:", item);
    return "No se puede calcular el valor porque uno de los parámetros es NaN";
  }

  // Calcular el precio unitario si todos los valores son válidos
  const costo = parseFloat(item.COSTO);
  const cantidad = parseFloat(item.CANTIDAD);
  const coor = parseFloat(item.COOR);

  precioUnitario = (costo / cantidad) * ajusteInflacionario * ( coor ? coor : 0);

  return parseFloat(precioUnitario.toFixed(2));
}

export function copiarAlPortapapeles(items, estado , ) {
  return async () => {
    try {
      // Filtrar los elementos que coincidan con el estado
      const elementosFiltrados = items.filter((item) => item.Estado === estado);

      if (elementosFiltrados.length === 0) {
        alert(`No se encontraron elementos con el estado "${estado}".`);
        return;
      }

      // Crear una representación en texto de los elementos
      const textoParaCopiar = elementosFiltrados
        .map((item) => `- ${item.Nombre_del_producto}: ${item.CANTIDAD} ${item.UNIDADES}`)
        .join("\n");

      // Copiar al portapapeles
      await navigator.clipboard.writeText(textoParaCopiar);

      alert(`Se han copiado ${elementosFiltrados.length} elementos con estado "${estado}" al portapapeles.`);
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
      alert("Hubo un error al copiar al portapapeles.");
    }
  };
}

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

export function updateItem(itemId, updatedFields, type) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from(type)
        .update(updatedFields)
        .eq('_id', itemId)
        .select();

      if (error) {
        console.error('Error al actualizar el ítem:', error);
        return null;
      }

      console.log('Ítem actualizado correctamente:', data);
      return data;
    } catch (error) {
      console.error('Error en la acción updateItem:', error);
    }
  };
}

export function deleteItem(itemId , type) {
  return async (dispatch) => {
    try {
      // Llamada a Supabase para eliminar el registro
      const { error } = await supabase
        .from(type)
        .delete()
        .eq("_id", itemId); // Filtrar por el ID del ítem

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

export const getRecepie = async (uuid, type) => {
  // console.log(uuid, type);
  
  try {
    const { data, error } = await supabase
      .from(type)
      .select("*")
      .eq("_id", uuid)
      .single();

    if (error) {
      console.error("Error al obtener la receta:", error);
      throw new Error(error.message);
    }
// console.log(data);

    return data;
  } catch (error) {
    console.error("Error en la acción getRecepie:", error);
    return null;
  }
};
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
// console.log(data);

    return data;
  } catch (error) {
    console.error("Error en la acción getProveedor:", error);
    return null;
  }
};

export const trimRecepie = (items, recepie) => {
  // console.log(recepie);
  const buscarPorId = (id) => {
    // console.log(items.find((item) => item._id === id) || null)
    return items.find((item) => item._id === id) || null;
  };
  const clavesFiltradas = Object.keys(recepie).filter(
    (key) =>
      (key.startsWith("item") || key.startsWith("producto_interno")) &&
      (validarUUID(recepie[key]) || (typeof recepie[key] === 'object' && recepie[key] !== null && Object.values(recepie[key]).some(value => value !== "")))
  );
  const resultado = clavesFiltradas.map((key) => {
    
    const idValor = recepie[key];
    const cuantityKey = key.replace("_Id", "_Cuantity_Units");
    const cuantityValor = recepie[cuantityKey]
      ? JSON.parse(recepie[cuantityKey]).metric.cuantity
      : null;
      const unitsValor = recepie[cuantityKey]
      ? JSON.parse(recepie[cuantityKey]).metric.units
      : null;
      const resultadoBusqueda = buscarPorId(idValor);
      const precioUnitario1 = resultadoBusqueda.precioUnitario
    
    return {
      name: resultadoBusqueda ? resultadoBusqueda.Nombre_del_producto : "",
      key:key,
      item_Id: idValor,
      precioUnitario :precioUnitario1,
      cuantity: cuantityValor || "",
      units: unitsValor || "",
      source: resultadoBusqueda ? (items.some(item => item._id === idValor) ? 'Items' : 'Produccion') : null
    };
  });
  return resultado;

};

export const resetExpandedGroups = () => {
  return {
    type: RESET_EXPANDED_GROUPS,
  };
};

export function crearReceta(recetaData, productId) {
  return async (dispatch) => {
    try {
      // Insertar la nueva receta en Supabase
      const { data, error } = await supabase
        .from('Recetas')
        .insert([recetaData])
        .select();

      if (error) {
        console.error("Error al crear la receta:", error);
        throw new Error("No se pudo crear la receta");
      }

      // Actualizar el producto con la nueva receta
      await dispatch(updateItem(productId, { Receta: data[0]._id }, "Menu"));

      // Despachar la acción para actualizar el estado global
      dispatch({
        type: INSERT_RECETAS_SUCCESS,
        payload: data[0], // La nueva receta creada
      });

      console.log("Receta creada correctamente:", data[0]);
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearReceta:", error);
      throw error;
    }
  };
}

export const addOrderItem = (item) => ({
  type: ADD_ORDER_ITEM,
  payload: item,
});

