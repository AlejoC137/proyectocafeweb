import supabase from "../../config/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import {
  INSERT_RECETAS_SUCCESS,
  INSERT_RECETAS_FAILURE,
  SET_PREPROCESS_DATA,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
  MENU,
  PRODUCCION,
} from "../actions-types";
import { getAllFromTable } from "./tableActions";
import { updateItem } from "./itemActions";

function validarUUID(uuid) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
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

export function procesarRecetaYEnviarASupabase() {
  return async (dispatch, getState) => {
    try {
      const state = getState();
      const recetasPreProcess = state.preProcess;

      for (let e = 0; e < recetasPreProcess.length; e++) {
        const recetaJson = recetasPreProcess[e];

        if (!recetaJson || typeof recetaJson !== 'object' || !recetaJson.receta) {
          throw new Error('El JSON de receta no tiene la estructura esperada');
        }

        const receta = recetaJson.receta;
        const recetaParaSupabase = {};
        recetaParaSupabase._id = uuidv4();

        dispatch(insertarRecetas([recetaParaSupabase]));
      }
    } catch (error) {
      console.error('Error al procesar la receta y enviar a Supabase:', error);
    }
  };
}

export function preProcess(jsonCompleto) {
  return async (dispatch) => {
    try {
      if (!jsonCompleto || !Array.isArray(jsonCompleto)) {
        throw new Error("El JSON proporcionado no tiene la estructura esperada");
      }

      const recetasProcesadas = jsonCompleto
        .filter(elemento => elemento.receta)
        .map(elemento => {
          const receta = elemento.receta;
          const nombreReceta = elemento["NombreES"].replace(/^\.+|\.+$/g, "");
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

export function sincronizarRecetasYProductos() {
  return async (dispatch, getState) => {
    try {
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

      for (const recipe of allRecipes) {
        if (recipe.forId) {
          const product = allProducts.find(p => p._id === recipe.forId);
          if (product && product.Receta !== recipe._id) {
            const productTable = allMenu.some(p => p._id === product._id) ? MENU : PRODUCCION;
            await dispatch(updateItem(product._id, { Receta: recipe._id }, productTable));
            updatesCounter++;
          }
        }
      }

      for (const recipe of allRecipes) {
        if (!recipe.forId) {
          const product = allProducts.find(p => (p.NombreES === recipe.legacyName || p.Nombre_del_producto === recipe.legacyName));
          if (product) {
            const recipeTable = allRecetasMenu.some(r => r._id === recipe._id) ? RECETAS_MENU : RECETAS_PRODUCCION;
            const productTable = allMenu.some(p => p._id === product._id) ? MENU : PRODUCCION;

            await dispatch(updateItem(recipe._id, { forId: product._id }, recipeTable));
            if (product.Receta !== recipe._id) {
              await dispatch(updateItem(product._id, { Receta: recipe._id }, productTable));
            }
            updatesCounter++;
          }
        }
      }

      for (const product of allProducts) {
        if (product.Receta && validarUUID(product.Receta)) {
          const recipeExists = allRecipes.some(r => r._id === product.Receta);
          if (!recipeExists) {
            const productTable = allMenu.some(p => p._id === product._id) ? MENU : PRODUCCION;
            await dispatch(updateItem(product._id, { Receta: null }, productTable));
            updatesCounter++;
          }
        }
      }

      alert(`Sincronización completada. Se realizaron ${updatesCounter} actualizaciones. Los datos se recargarán.`);

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

export function createRecipeForProduct(baseRecipeData, productId, productTable, recipeTable) {
  return async (dispatch) => {
    try {
      const newRecipeData = {
        ...baseRecipeData,
        _id: uuidv4(),
        forId: productId,
        actualizacion: new Date().toISOString(),
      };

      const { data: newRecipe, error: recipeError } = await supabase
        .from(recipeTable)
        .insert([newRecipeData])
        .select()
        .single();

      if (recipeError) {
        console.error("Error al crear la receta:", recipeError);
        throw new Error(`No se pudo crear la receta en ${recipeTable}: ${recipeError.message || recipeError.details || recipeError.hint || JSON.stringify(recipeError)}`);
      }
      const newRecipeId = newRecipe._id;

      const updatedProduct = await dispatch(updateItem(productId, { Receta: newRecipeId }, productTable));

      if (!updatedProduct) {
        throw new Error("La receta se creó, pero no se pudo actualizar el producto asociado.");
      }

      alert(`Receta "${newRecipe.legacyName || 'Nueva Receta'}" creada y enlazada correctamente.`);

      dispatch(getAllFromTable(recipeTable));
      dispatch(getAllFromTable(productTable));

      return newRecipe;
    } catch (error) {
      console.error("Error en el proceso de createRecipeForProduct:", error);
      alert(`Error: ${error.message}`);
      return null;
    }
  };
}

export const getRecepie = async (uuid, type) => {
  try {
    const { data, error } = await supabase
      .from(type)
      .select("*")
      .eq("_id", uuid)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener la receta:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error en la acción getRecepie:", error);
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

export function crearReceta(recetaData, productId) {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from('Recetas')
        .insert([recetaData])
        .select();

      if (error) {
        console.error("Error al crear la receta:", error);
        throw new Error("No se pudo crear la receta");
      }

      await dispatch(updateItem(productId, { Receta: data[0]._id }, "Menu"));

      dispatch({
        type: INSERT_RECETAS_SUCCESS,
        payload: data[0],
      });
      return data[0];
    } catch (error) {
      console.error("Error en la acción crearReceta:", error);
      throw error;
    }
  };
}
