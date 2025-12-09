import supabase from "../config/supabaseClient";
import {
  GET_ALL_FROM_TABLE,
  UPDATE_ACTIVE_TAB,
  SET_USER_REG_STATE,
  UPDATE_SELECTED_VALUE,
  INSERT_RECETAS_SUCCESS,
  INSERT_RECETAS_FAILURE,
  INSERT_ITEM_FAILURE,
  SET_PREPROCESS_DATA,
  SCRAP,
  ItemsAlmacen,
  TOGGLE_SHOW_EDIT,
  ProduccionInterna,
  RESET_EXPANDED_GROUPS,
  ADD_ORDER_ITEM,
  AGENDA,
  ITEMS,
  SET_LANGUAGE,
  ESP,
  ENG,
  MenuItems,
  MENU,
  PRODUCCION,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
  GET_MODELS_SUCCESS,
  GET_MODELS_FAILURE,
  UPDATE_MODEL_SUCCESS,
  CREATE_MODEL_SUCCESS,
  DELETE_MODEL_SUCCESS,
  CREATE_RECIPE_FOR_PRODUCT_SUCCESS,

  // --- INICIO: NUEVAS CONSTANTES PARA NOTAS ---
  ADD_NOTA_SUCCESS,
  ADD_NOTA_FAILURE,
  UPDATE_NOTA_SUCCESS,
  UPDATE_NOTA_FAILURE,
  DELETE_NOTA_SUCCESS,
  DELETE_NOTA_FAILURE,
  // --- FIN: NUEVAS CONSTANTES PARA NOTAS ---

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
                  legacyName: ingrediente.nombre
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
                  legacyName: ingrediente.nombre
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
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

export function actualizarPrecioUnitario(items, type) {
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

  // Validar si alguno de los valores necesarios es "NaN" (literal string "NaN" check is legacy, but keeping it)
  if (item.COSTO === "NaN" || item.CANTIDAD === "NaN") {
    console.error("No se puede calcular el valor porque uno de los parámetros es NaN:", item);
    return 0; // Better safe return than string error message potentially
  }

  // Calcular el precio unitario si todos los valores son válidos
  const costo = parseFloat(item.COSTO);
  const cantidad = parseFloat(item.CANTIDAD);
  let coor = parseFloat(item.COOR);

  // Si coor no es un número válido (ej. falta en Producción), usar 1
  if (isNaN(coor)) {
    coor = 1;
  }

  if (!cantidad || cantidad === 0) return 0;

  precioUnitario = (costo / cantidad) * ajusteInflacionario * coor;

  return parseFloat(precioUnitario.toFixed(2));
}

export function copiarAlPortapapeles(items, estado,) {
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

export function deleteItem(itemId, type) {
  const table = type === MenuItems ? MENU : type
  return async (dispatch) => {
    try {
      // Llamada a Supabase para eliminar el registro
      const { error } = await supabase
        .from(table)
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

// =================================================================================
// --- INICIO: ACCIONES CRUD PARA NOTAS ---
// =================================================================================

/**
 * Crea una nueva nota en la base de datos.
 * @param {object} notaData - Los datos para la nueva nota.
 */
export const addNota = (notaData) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('Notas')
      .insert({ ...notaData, _id: uuidv4() })
      .select()
      .single();

    if (error) throw error;

    dispatch({ type: ADD_NOTA_SUCCESS, payload: data });
    console.log("Nota creada exitosamente:", data);
    return data;
  } catch (error) {
    console.error("Error al crear la nota:", error);
    dispatch({ type: ADD_NOTA_FAILURE, payload: error.message });
    return null;
  }
};

/**
 * Actualiza una nota existente.
 * @param {string} notaId - El ID de la nota a actualizar.
 * @param {object} updatedFields - Los campos a actualizar.
 */
export const updateNota = (notaId, updatedFields) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('Notas')
      .update(updatedFields)
      .eq('_id', notaId)
      .select()
      .single();

    if (error) throw error;

    dispatch({ type: UPDATE_NOTA_SUCCESS, payload: data });
    console.log("Nota actualizada exitosamente:", data);
    return data;
  } catch (error) {
    console.error("Error al actualizar la nota:", error);
    dispatch({ type: UPDATE_NOTA_FAILURE, payload: error.message });
    return null;
  }
};

/**
 * Elimina una nota.
 * @param {string} notaId - El ID de la nota a eliminar.
 */
export const deleteNota = (notaId) => async (dispatch) => {
  try {
    const { error } = await supabase
      .from('Notas')
      .delete()
      .eq('_id', notaId);

    if (error) throw error;

    dispatch({ type: DELETE_NOTA_SUCCESS, payload: notaId });
    console.log(`Nota con ID ${notaId} eliminada correctamente.`);
    return notaId;
  } catch (error) {
    console.error("Error al eliminar la nota:", error);
    dispatch({ type: DELETE_NOTA_FAILURE, payload: error.message });
    return null;
  }
};

// =================================================================================
// --- FIN: ACCIONES CRUD PARA NOTAS ---
// =================================================================================


// --- NUEVA FUNCIÓN DE SINCRONIZACIÓN ---
export function sincronizarRecetasYProductos() {
  return async (dispatch, getState) => {
    try {
      console.log("Iniciando sincronización de recetas y productos...");
      const state = getState();
      const {
        allRecetasMenu,
        allRecetasProduccion,
        allMenu,
        allProduccion,
      } = state;

      const allRecipes = [...allRecetasMenu, ...allRecetasProduccion];
      const allProducts = [...allMenu, ...allProduccion];
      let updatesCounter = 0;

      // --- PASO 1: Asegurar que los productos referencien de vuelta a su receta ---
      for (const recipe of allRecipes) {
        if (recipe.forId) {
          const product = allProducts.find(p => p._id === recipe.forId);
          if (product && product.Receta !== recipe._id) {
            const productTable = allMenu.some(p => p._id === product._id) ? MENU : PRODUCCION;
            console.log(`SINCRONIZANDO: El producto "${product.NombreES || product.Nombre_del_producto}" ahora apuntará a la receta "${recipe.legacyName}".`);
            await dispatch(updateItem(product._id, { Receta: recipe._id }, productTable));
            updatesCounter++;
          }
        }
      }

      // --- PASO 2: Enlazar recetas huérfanas a productos por coincidencia de nombre ---
      for (const recipe of allRecipes) {
        if (!recipe.forId) {
          const product = allProducts.find(p => (p.NombreES === recipe.legacyName || p.Nombre_del_producto === recipe.legacyName));
          if (product) {
            const recipeTable = allRecetasMenu.some(r => r._id === recipe._id) ? RECETAS_MENU : RECETAS_PRODUCCION;
            const productTable = allMenu.some(p => p._id === product._id) ? MENU : PRODUCCION;

            console.log(`SINCRONIZANDO: La receta huérfana "${recipe.legacyName}" se enlazará con el producto "${product.NombreES || product.Nombre_del_producto}".`);

            // Actualizar receta con forId y producto con Receta ID
            await dispatch(updateItem(recipe._id, { forId: product._id }, recipeTable));
            if (product.Receta !== recipe._id) {
              await dispatch(updateItem(product._id, { Receta: recipe._id }, productTable));
            }
            updatesCounter++;
          }
        }
      }

      // --- PASO 3: Limpiar enlaces de productos a recetas que ya no existen ---
      for (const product of allProducts) {
        if (product.Receta && validarUUID(product.Receta)) {
          const recipeExists = allRecipes.some(r => r._id === product.Receta);
          if (!recipeExists) {
            const productTable = allMenu.some(p => p._id === product._id) ? MENU : PRODUCCION;
            console.log(`LIMPIANDO: El producto "${product.NombreES || product.Nombre_del_producto}" apuntaba a una receta eliminada. Se limpiará el enlace.`);
            await dispatch(updateItem(product._id, { Receta: null }, productTable));
            updatesCounter++;
          }
        }
      }

      alert(`Sincronización completada. Se realizaron ${updatesCounter} actualizaciones. Los datos se recargarán.`);

      // Recargar todos los datos para reflejar los cambios en la UI
      dispatch(getAllFromTable(RECETAS_MENU));
      dispatch(getAllFromTable(RECETAS_PRODUCCION));
      dispatch(getAllFromTable(MENU));
      dispatch(getAllFromTable(PRODUCCION));

    } catch (error) {
      console.error("Error durante la sincronización:", error);
      alert("Ocurrió un error durante la sincronización. Revisa la consola para más detalles.");
    }
  };
}

// --- INICIO: NUEVA FUNCIÓN PARA CREAR Y ASIGNAR RECETAS ---
/**
 * Crea una nueva receta, la asocia a un producto y actualiza el producto con el ID de la nueva receta.
 * @param {object} baseRecipeData - Datos base para la nueva receta (ej. legacyName, autor).
 * @param {string} productId - El UUID del producto al que se asociará la receta.
 * @param {string} productTable - La tabla del producto ('Menu' o 'ProduccionInterna').
 * @param {string} recipeTable - La tabla de la receta ('Recetas' o 'RecetasProduccion').
 */
export function createRecipeForProduct(baseRecipeData, productId, productTable, recipeTable) {
  return async (dispatch) => {
    try {
      console.log(`Creando receta para el producto ID: ${productId} en la tabla ${productTable}`);

      // 1. Preparar los datos de la nueva receta
      const newRecipeData = {
        ...baseRecipeData,
        _id: uuidv4(), // Asignar un nuevo UUID
        forId: productId, // Enlazar con el producto
        actualizacion: new Date().toISOString(), // Establecer fecha de actualización
      };

      // 2. Insertar la nueva receta en la tabla correspondiente
      const { data: newRecipe, error: recipeError } = await supabase
        .from(recipeTable)
        .insert([newRecipeData])
        .select()
        .single(); // .single() para obtener el objeto directamente

      if (recipeError) {
        console.error("Error al crear la receta:", recipeError);
        throw new Error("No se pudo crear la receta en la base de datos.");
      }

      console.log("Receta creada correctamente:", newRecipe);
      const newRecipeId = newRecipe._id;

      // 3. Actualizar el producto para que apunte a la nueva receta
      const updatedProduct = await dispatch(updateItem(productId, { Receta: newRecipeId }, productTable));

      if (!updatedProduct) {
        // Si `updateItem` falla, se podría considerar revertir la creación de la receta,
        // pero por ahora solo lanzamos un error para notificar el problema.
        throw new Error("La receta se creó, pero no se pudo actualizar el producto asociado.");
      }

      console.log(`Producto ${productId} actualizado para enlazar a la nueva receta ${newRecipeId}`);

      // 4. Notificar y recargar los datos para mantener la UI sincronizada
      alert(`Receta "${newRecipe.legacyName || 'Nueva Receta'}" creada y enlazada correctamente.`);

      dispatch(getAllFromTable(recipeTable));
      dispatch(getAllFromTable(productTable));

      return newRecipe; // Devolver la receta creada por si se necesita

    } catch (error) {
      console.error("Error en el proceso de createRecipeForProduct:", error);
      alert(`Error: ${error.message}`);
      return null;
    }
  };
}
// --- FIN: NUEVA FUNCIÓN ---

export const getRecepie = async (uuid, type) => {
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
    return data;
  } catch (error) {
    console.error("Error en la acción getProveedor:", error);
    return null;
  }
};

export const trimRecepie = (items, recepie) => {
  const buscarPorId = (id) => {
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
    const precioUnitario1 = resultadoBusqueda ? (Number(resultadoBusqueda.precioUnitario) || 0) : 0;

    return {
      name: resultadoBusqueda ? resultadoBusqueda.Nombre_del_producto : "",
      key: key,
      field: key,
      item_Id: idValor,
      precioUnitario: precioUnitario1,
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

/**
 * OBSOLETA: Esta función usa nombres de tablas fijos ('Recetas', 'Menu'). 
 * Se recomienda usar `createRecipeForProduct` para mayor flexibilidad.
 */
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

export const setLenguage = (language) => {
  return (dispatch) => {
    dispatch({
      type: SET_LANGUAGE,
      payload: language,
    });
  };
};

import { UPDATE_LOG_STAFF } from './actions-types'; // 👈 Import your action type

export const updateLogStaff = (personaId, updatedTurnoPasados) => {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from('Staff')
        .update({ Turnos: updatedTurnoPasados })
        .eq('_id', personaId)
        .select();

      if (error) {
        throw error;
      }

      dispatch({
        type: UPDATE_LOG_STAFF,
        payload: { personaId, updatedTurnoPasados },
      });


      // Importar utilidades de toast centralizadas
      const { showSuccessToast } = await import('../utils/toast');
      showSuccessToast('💾 Turno actualizado correctamente');

      return true; // Éxito
    } catch (error) {
      console.error('Error updating shift log:', error.message);
      return false; // Fallo
    }
  };
};


// =================================================================================
// --- INICIO: ACCIONES PARA MODELOS DE NEGOCIO ---
// =================================================================================

// Suponiendo que tienes estos action-types definidos


/**
 * Obtiene todos los modelos de negocio desde Supabase.
 */
export const fetchModelsAction = () => async (dispatch) => {
  try {
    const { data, error } = await supabase.from('Model').select('*');
    if (error) throw error;

    // Parsea el campo 'costs' si es un string JSON
    const parsedData = data.map(model => {
      if (model.costs && typeof model.costs === 'string') {
        try {
          return { ...model, costs: JSON.parse(model.costs) };
        } catch (e) {
          console.error("Error parsing costs for model:", model._id, e);
          return { ...model, costs: {} };
        }
      }
      return model;
    });

    dispatch({ type: GET_MODELS_SUCCESS, payload: parsedData });
  } catch (error) {
    console.error("Error fetching models:", error);
    dispatch({ type: GET_MODELS_FAILURE, payload: error.message });
  }
};

/**
 * Crea un nuevo modelo de negocio.
 * @param {object} newModelData - Los datos para el nuevo modelo.
 */
export const createModelAction = (newModelData) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('Model')
      .insert([newModelData])
      .select()
      .single(); // Devuelve un solo objeto

    if (error) throw error;

    // Asegurarse de que los costos estén parseados si es necesario
    if (data.costs && typeof data.costs === 'string') {
      data.costs = JSON.parse(data.costs);
    }

    dispatch({ type: CREATE_MODEL_SUCCESS, payload: data });
    return data; // Devuelve el modelo creado
  } catch (error) {
    console.error("Error creating model:", error);
    // Aquí podrías despachar una acción de error si lo necesitas
    return null;
  }
};

/**
 * Actualiza un modelo de negocio existente.
 * @param {string} modelId - El ID del modelo a actualizar.
 * @param {object} updatedData - Los campos a actualizar.
 */
export const updateModelAction = (modelId, updatedData) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('Model')
      .update(updatedData)
      .eq('_id', modelId)
      .select()
      .single();

    if (error) throw error;

    if (data.costs && typeof data.costs === 'string') {
      data.costs = JSON.parse(data.costs);
    }

    dispatch({ type: UPDATE_MODEL_SUCCESS, payload: data });
  } catch (error) {
    console.error("Error updating model:", error);
  }
};

/**
 * Elimina un modelo de negocio.
 * @param {string} modelId - El ID del modelo a eliminar.
 */
export const deleteModelAction = (modelId) => async (dispatch) => {
  try {
    const { error } = await supabase
      .from('Model')
      .delete()
      .eq('_id', modelId);

    if (error) throw error;

    dispatch({ type: DELETE_MODEL_SUCCESS, payload: modelId });
  } catch (error) {
    console.error("Error deleting model:", error);
  }
};

// =================================================================================
// --- FIN: ACCIONES PARA MODELOS DE NEGOCIO ---
// =================================================================================



// --- NUEVA FUNCIÓN DE SINCRONIZACIÓN DE COSTOS DE PRODUCCIÓN ---
export function sincronizarCostosProduccion() {
  return async (dispatch, getState) => {
    try {
      console.log("Iniciando sincronización de COSTOS de producción con recetas...");

      // Asegurar datos frescos
      await dispatch(getAllFromTable(RECETAS_PRODUCCION));
      await dispatch(getAllFromTable(PRODUCCION));

      const state = getState();
      const {
        allRecetasProduccion,
        allProduccion,
      } = state;

      let updatesCounter = 0;

      for (const item of allProduccion) {
        // Verificar si el item tiene una receta asignada
        if (item.Receta) {
          const receta = allRecetasProduccion.find(r => r._id === item.Receta);

          if (receta) {
            let updates = {};
            let hasChanges = false;

            // 1. SINCRONIZAR COSTO
            if (receta.costo !== undefined && receta.costo !== null) {
              let nuevoCosto = receta.costo;
              if (typeof nuevoCosto === 'string') nuevoCosto = parseFloat(nuevoCosto);

              const costoActual = parseFloat(item.COSTO) || 0;
              // Tolerancia pequeña para flotantes
              if (Math.abs(costoActual - nuevoCosto) > 0.01) {
                updates.COSTO = nuevoCosto;
                hasChanges = true;
              }
            }

            // 2. SINCRONIZAR CANTIDAD Y UNIDADES (RENDIMIENTO)
            if (receta.rendimiento) {
              try {
                const rend = JSON.parse(receta.rendimiento);
                // Cantidad
                if (rend.cantidad) {
                  const nuevaCantidad = parseFloat(rend.cantidad);
                  const cantidadActual = parseFloat(item.CANTIDAD) || 0;
                  if (Math.abs(cantidadActual - nuevaCantidad) > 0.01) {
                    updates.CANTIDAD = nuevaCantidad;
                    hasChanges = true;
                  }
                }
                // Unidades
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

            // 3. RECALCULAR PRECIO UNITARIO
            // Usamos los valores nuevos si existen, o los actuales del item
            const finalCosto = updates.COSTO !== undefined ? updates.COSTO : (parseFloat(item.COSTO) || 0);
            const finalCantidad = updates.CANTIDAD !== undefined ? updates.CANTIDAD : (parseFloat(item.CANTIDAD) || 0);

            if (finalCantidad > 0) {
              // Usamos la misma lógica que calcularPrecioUnitario: (costo / cantidad) * 1.04 * (coor || 1)
              // En producción interna no solemos tener COOR, así que asumimos 1. 
              // NOTA: Si el usuario quiere STRICTLY costo/cantidad, debemos quitar el 1.04. 
              // Pero para consistencia con "Recalcular Precios" (botón rojo), dejaremos el 1.04.
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

            // APLICAR ACTUALIZACIONES
            if (hasChanges) {
              console.log(`SINCRONIZANDO: Item "${item.Nombre_del_producto}" actualizaciones:`, updates);
              await dispatch(updateItem(item._id, updates, PRODUCCION));
              updatesCounter++;
            }
          }
        }
      }

      if (updatesCounter > 0) {
        alert(`Sincronización completada. Se actualizaron ${updatesCounter} ítems.`);
        // Recargar datos
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
// ruta/a/tu/proyecto/utils/getOtherExpenses.js

/**
 * Devuelve un array de objetos de gastos adicionales basado en el SUB_GRUPO del producto.
 * Cada objeto tiene una estructura similar a un ingrediente para facilitar su integración.
 * @param {string} subGrupo - El valor del campo SUB_GRUPO del item del menú.
 * @returns {Array<Object>} - Un array de objetos de gastos.
 */
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

    // Agrega más 'case' para otros SUB_GRUPOs según necesites
    // ...

    default:
      // Si el SUB_GRUPO no tiene gastos asociados, devuelve un array vacío.
      return [];
  }
};