import {
  GET_ALL_FROM_TABLE,
  UPDATE_CURRENT_VIEW,
  STAFF,
  MENU,
  ITEMS,
  PRODUCCION,
  UPDATE_ACTIVE_TAB
} from './actions-types';

const initialState = {
  allStaff: [],
  allMenu: [],
  allItems: [],
  allProduccion: [],
  currentView: 'HOME', // Estado inicial del currentView (o vista actual)
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    
    case UPDATE_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload, // Actualiza la vista actual (currentView) según el payload
      };

    case GET_ALL_FROM_TABLE:
      switch (action.path) {
        case STAFF:
          return {
            ...state,
            allStaff: action.payload, // Actualiza el estado para STAFF
          };
        case MENU:
          return {
            ...state,
            allMenu: action.payload, // Actualiza el estado para MENU
          };
        case ITEMS:
          return {
            ...state,
            allItems: action.payload, // Actualiza el estado para ITEMS
          };
        case PRODUCCION:
          return {
            ...state,
            allProduccion: action.payload, // Actualiza el estado para PRODUCCION
          };
          

          
   
      }

    default:
      return state; // Devuelve el estado actual si la acción no es reconocida
  }
};

export default reducer;
