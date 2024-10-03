import {
  GET_ALL_FROM_TABLE,
  UPDATE_CURRENT_VIEW,
  STAFF,
  MENU,
  ITEMS,
  PRODUCCION,
  UPDATE_ACTIVE_TAB,
  SET_USER_REG_STATE,
  UPDATE_SELECTED_VALUE, // Nueva acción importada
} from './actions-types';

const initialState = {
  allStaff: [],
  allMenu: [],
  allItems: [],
  allProduccion: [],
  currentView: 'HOME',
  userRegState: 'notAuth',
  selectedValue: null, // Nuevo estado para el valor seleccionado
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload,
      };
    
    case SET_USER_REG_STATE:
      return {
        ...state,
        userRegState: action.payload,
      };

    case GET_ALL_FROM_TABLE:
      switch (action.path) {
        case STAFF:
          return {
            ...state,
            allStaff: action.payload,
          };
        case MENU:
          return {
            ...state,
            allMenu: action.payload,
          };
        case ITEMS:
          return {
            ...state,
            allItems: action.payload,
          };
        case PRODUCCION:
          return {
            ...state,
            allProduccion: action.payload,
          };
        default:
          return state;
      }

    case UPDATE_SELECTED_VALUE:
      return {
        ...state,
        selectedValue: action.payload,
      };

    default:
      return state;
  }
};

export default reducer;
