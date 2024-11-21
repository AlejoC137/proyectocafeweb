import {
  GET_ALL_FROM_TABLE,
  UPDATE_CURRENT_VIEW,
  STAFF,
  MENU,
  ITEMS,
  PRODUCCION,
  UPDATE_ACTIVE_TAB,
  SET_USER_REG_STATE,
  UPDATE_SELECTED_VALUE,
  INSERT_RECETAS_SUCCESS,    // Nueva acción importada
  INSERT_RECETAS_FAILURE,     // Nueva acción importada
  SET_PREPROCESS_DATA,
  TODAYS_MENU
} from './actions-types';

const initialState = {
frontPage:{  
  todaysEspecialBreackFast: {
            proteina_op1:'Arroz especial con cerdo y soya',
            proteona_op2:'Pollo a la plancha y arroz blanco',
            acompañante: 'Torta de chocolo',
            entrada:'Crema de tomate',
            ensalada:'Ensalada de cogollo',
            foto:'',
            precio:'20K'
  },
  todaysEspecialLunch: {
            proteina_op1:'Arroz especial con cerdo y soya',
            proteona_op2:'Pollo a la plancha y arroz blanco',
            acompañante: 'Torta de chocolo',
            entrada:'Crema de tomate',
            ensalada:'Ensalada de cogollo',
            foto:'',
            precio:'20K'
  },
  monthEspecials: {
            especial_1:{nombre:'',descripcion:'',foto:''},
            especial_2:{nombre:'',descripcion:'',foto:''},
            especial_3:{nombre:'',descripcion:'',foto:''},
            especial_4:{nombre:'',descripcion:'',foto:''},

  },
},
  allStaff: [],
  allMenu: [],
  allItems: [],
  currentLeng: 'ESP',
  allProduccion: [],
  currentView: 'MENUVIEW',
  userRegState: 'notAuth',
  selectedValue: null,
  recetas: [],              // Estado para guardar las recetas insertadas
  preProcess : [],              // Estado para guardar las recetas insertadas
  recetaError: null,        // Estado para guardar el error en caso de fallo
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ACTIVE_TAB:
      return {
        ...state,
        currentView: action.payload,
      };
    
    case SET_USER_REG_STATE:
      return {
        ...state,
        userRegState: action.payload,
      };
    case SET_PREPROCESS_DATA:
      return {
        ...state,
        preProcess : action.payload,
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

    case INSERT_RECETAS_SUCCESS:
      return {
        ...state,
        recetas: [...state.recetas, ...action.payload],  // Agregar recetas insertadas al estado
        recetaError: null,                               // Limpiar cualquier error previo
      };

    case INSERT_RECETAS_FAILURE:
      return {
        ...state,
        recetaError: action.payload,                     // Guardar el mensaje de error
      };

    default:
      return state;
  }
};

export default reducer;
