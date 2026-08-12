import supabase from "../../config/supabaseClient";
import { SET_CURRENT_STAFF, STAFF, UPDATE_LOG_STAFF } from "../actions-types";
import { getAllFromTable } from "./tableActions";

export function setCurrentStaff(staff) {
  return {
    type: SET_CURRENT_STAFF,
    payload: staff,
  };
}

export const updateStaff = (staffData) => async (dispatch) => {
  try {
    const { _id, ...updates } = staffData;
    const { data, error } = await supabase
      .from(STAFF)
      .update(updates)
      .eq('_id', _id)
      .select();

    if (error) throw error;
    alert("Empleado actualizado correctamente.");
    dispatch(getAllFromTable(STAFF));
    return data;
  } catch (error) {
    console.error("Error updating staff:", error);
    alert(`Error al actualizar empleado: ${error.message}`);
  }
};

export const deleteStaff = (staffId) => async (dispatch) => {
  try {
    const { error } = await supabase
      .from(STAFF)
      .delete()
      .eq('_id', staffId);

    if (error) throw error;
    alert("Empleado eliminado correctamente.");
    dispatch(getAllFromTable(STAFF));
  } catch (error) {
    console.error("Error deleting staff:", error);
    alert(`Error al eliminar empleado: ${error.message}`);
  }
};

export const updateLogStaff = (personaId, updatedTurnoPasados) => {
  return async (dispatch) => {
    try {
      const turnosData = typeof updatedTurnoPasados === 'string'
        ? updatedTurnoPasados
        : JSON.stringify(updatedTurnoPasados);

      const { data, error } = await supabase
        .from('Staff')
        .update({ Turnos: turnosData })
        .eq('_id', personaId)
        .select();

      if (error) {
        console.error("❌ [updateLogStaff] Error de Supabase:", error);
        throw error;
      }

      dispatch({
        type: UPDATE_LOG_STAFF,
        payload: { personaId, updatedTurnoPasados },
      });

      try {
        const { showSuccessToast } = await import('../../utils/toast');
        showSuccessToast('💾 Turno actualizado correctamente');
      } catch (toastError) {
        console.warn("⚠️ [updateLogStaff] No se pudo mostrar toast:", toastError);
      }
      return true;
    } catch (error) {
      console.error('❌ [updateLogStaff] Error al actualizar turno:', error);
      return false;
    }
  };
};
