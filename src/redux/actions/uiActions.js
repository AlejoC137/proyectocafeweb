import supabase from "../../config/supabaseClient";
import {
  TOGGLE_SHOW_EDIT,
  UPDATE_ACTIVE_TAB,
  UPDATE_SELECTED_VALUE,
  SET_USER_REG_STATE,
  SET_LANGUAGE,
  SET_VIEW_PREFERENCES,
  VIEW_PREFERENCES_TABLE,
} from "../actions-types";

export const toggleShowEdit = () => {
  return (dispatch, getState) => {
    const currentShowEdit = getState().showEdit;
    dispatch({
      type: TOGGLE_SHOW_EDIT,
      payload: !currentShowEdit,
    });
  };
};

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

export const setLenguage = (language) => {
  return (dispatch) => {
    dispatch({
      type: SET_LANGUAGE,
      payload: language,
    });
  };
};

export const fetchViewPreferences = (userId) => {
  return async (dispatch) => {
    try {
      const id = userId || 'default_user';
      const { data, error } = await supabase
        .from(VIEW_PREFERENCES_TABLE)
        .select('preferences')
        .eq('user_id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          dispatch({ type: SET_VIEW_PREFERENCES, payload: {} });
          return;
        }
        console.error("Error fetching view preferences:", error);
        return;
      }

      if (data) {
        dispatch({ type: SET_VIEW_PREFERENCES, payload: data.preferences || {} });
      }
    } catch (err) {
      console.error("Failed to fetch view preferences", err);
    }
  };
};

export const updateViewPreference = (userId, moduleName, newPrefs) => {
  return async (dispatch, getState) => {
    try {
      const id = userId || 'default_user';
      const state = getState();
      const currentPreferences = state.viewPreferences || {};
      
      const updatedModulePrefs = {
        ...(currentPreferences[moduleName] || {}),
        ...newPrefs
      };
      
      const updatedPreferences = {
        ...currentPreferences,
        [moduleName]: updatedModulePrefs
      };

      dispatch({ type: SET_VIEW_PREFERENCES, payload: updatedPreferences });

      const { error } = await supabase
        .from(VIEW_PREFERENCES_TABLE)
        .upsert({
          user_id: id,
          preferences: updatedPreferences
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("Error updating view preferences in Supabase:", error);
      }
    } catch (err) {
      console.error("Failed to update view preference", err);
    }
  };
};
