import {
    GET_ALL_FROM_TABLE,
    UPDATE_ACTIVE_TAB,
    STAFF,
    MENU,
    ITEMS,
    PRODUCCION,

  } from './actions-types';
  
  const initialState = {
    allStaff: [],
    allMenu: [],
    allItems: [],
    allProduccion: [],
    activeTab: "Bookings",
  };
  
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case UPDATE_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload,
      };


      case GET_ALL_FROM_TABLE:
        if (action.path === STAFF) {
          return {
            ...state,
            allStaff: action.payload,
          };
        }
        if (action.path === MENU) {
          return {
            ...state,
            allMenu: action.payload,
          };
        }
        if (action.path === ITEMS) {
          return {
            ...state,
            allItems: action.payload,
          };
        }
        if (action.path === PRODUCCION) {
          return {
            ...state,
            allProduccion: action.payload,
          };
        }
        return state;
  
      default:
        return state;
    }
  };
  
  export default reducer;
  