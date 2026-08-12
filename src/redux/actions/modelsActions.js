import supabase from "../../config/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import {
  GET_MODELS_SUCCESS,
  GET_MODELS_FAILURE,
  CREATE_MODEL_SUCCESS,
  UPDATE_MODEL_SUCCESS,
  DELETE_MODEL_SUCCESS,
} from "../actions-types";

export const fetchModelsAction = () => async (dispatch) => {
  try {
    const { data, error } = await supabase.from('Model').select('*');
    if (error) throw error;

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

export const createModelAction = (newModelData) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('Model')
      .insert([{
        _id: uuidv4(),
        ...newModelData
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error details:", error);
      throw error;
    }

    if (data.costs && typeof data.costs === 'string') {
      try {
        data.costs = JSON.parse(data.costs);
      } catch (e) {
        console.error("Error parsing costs JSON:", e);
      }
    }

    dispatch({ type: CREATE_MODEL_SUCCESS, payload: data });
    alert("Modelo guardado correctamente.");
    return data;
  } catch (error) {
    console.error("Error creating model:", error);
    alert(`Error al guardar: ${error.message}`);
    return null;
  }
};

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
      try {
        data.costs = JSON.parse(data.costs);
      } catch(e) { }
    }

    dispatch({ type: UPDATE_MODEL_SUCCESS, payload: data });
    alert("Cambios guardados correctamente.");
  } catch (error) {
    console.error("Error updating model:", error);
    alert(`Error al actualizar: ${error.message}`);
  }
};

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
