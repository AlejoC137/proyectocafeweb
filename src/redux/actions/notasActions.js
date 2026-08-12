import supabase from "../../config/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import {
  ADD_NOTA_SUCCESS,
  ADD_NOTA_FAILURE,
  UPDATE_NOTA_SUCCESS,
  UPDATE_NOTA_FAILURE,
  DELETE_NOTA_SUCCESS,
  DELETE_NOTA_FAILURE,
} from "../actions-types";

export const addNota = (notaData) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('Notas')
      .insert({ ...notaData, _id: uuidv4() })
      .select()
      .single();

    if (error) throw error;

    dispatch({ type: ADD_NOTA_SUCCESS, payload: data });
    return data;
  } catch (error) {
    console.error("Error al crear la nota:", error);
    dispatch({ type: ADD_NOTA_FAILURE, payload: error.message });
    return null;
  }
};

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
    return data;
  } catch (error) {
    console.error("Error al actualizar la nota:", error);
    dispatch({ type: UPDATE_NOTA_FAILURE, payload: error.message });
    return null;
  }
};

export const deleteNota = (notaId) => async (dispatch) => {
  try {
    const { error } = await supabase
      .from('Notas')
      .delete()
      .eq('_id', notaId);

    if (error) throw error;

    dispatch({ type: DELETE_NOTA_SUCCESS, payload: notaId });
    return notaId;
  } catch (error) {
    console.error("Error al eliminar la nota:", error);
    dispatch({ type: DELETE_NOTA_FAILURE, payload: error.message });
    return null;
  }
};
