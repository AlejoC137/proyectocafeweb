import {
    GET_ALL_FROM_TABLE,
    ITEMS,
MENU,
PRODUCCION,
STAFF,
} from "./actions-types";

const initialState = {
    allStaff:[],
    allMenu:[],
    allItems:[],
    allProduccion:[],
  
};

const reducer = (state = initialState, action) => {
    
  switch (action.type) {
      case GET_ALL_FROM_TABLE:

        if (action.path === ITEMS){
            return {
                ...state,
                allItems: action.payload,
            }
        }
        if (action.path === MENU){
            return {
                ...state,
                allMenu: action.payload,
            }
        }
        if (action.path === PRODUCCION){
            return {
                ...state,
                allProduccion: action.payload,
            }
        }
        if (action.path === STAFF){
            return {
                ...state,
                allStaff: action.payload,
            }
        }
        





          
      default:
          return state;
  }
};

export default reducer;
