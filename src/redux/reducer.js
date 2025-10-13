import {
    GET_ALL_FROM_TABLE,
    UPDATE_CURRENT_VIEW,
    STAFF,
    MENU,
    ITEMS,
    PRODUCCION,
    PROVEE,
    WORKISUE,
    PROCEDE,
    COMPRAS,
    UPDATE_ACTIVE_TAB,
    SET_USER_REG_STATE,
    UPDATE_SELECTED_VALUE,
    INSERT_RECETAS_SUCCESS,
    INSERT_RECETAS_FAILURE,
    SET_PREPROCESS_DATA,
    TODAYS_MENU,
    SCRAP,
    RECETAS_MENU,
    RECETAS_PRODUCCION,
    TOGGLE_SHOW_EDIT,
    RESET_EXPANDED_GROUPS,
    ADD_ORDER_ITEM,
    RECETAS_PROCEDIMIENTOS,
    AGENDA,
    ESP,
    ENG,
    SET_LANGUAGE,
    UPDATE_ITEM,
    // --- INICIO: ADICIONES ---
    SET_SELECTED_PROVIDER_ID, // Constante para mayor seguridad
    GET_MODELS_SUCCESS,
    GET_MODELS_FAILURE,
    CREATE_MODEL_SUCCESS,
    UPDATE_MODEL_SUCCESS,
    DELETE_MODEL_SUCCESS,
    // --- FIN: ADICIONES ---
} from './actions-types';

const initialState = {
    frontPage: {
        todaysEspecialBreackFast: {
            proteina_op1: 'Arroz especial con cerdo y soya',
            proteina_op2: 'Pollo a la plancha y arroz blanco',
            acompañante: 'Torta de chocolo',
            entrada: 'Crema de tomate',
            ensalada: 'Ensalada de cogollo',
            bebida: 'Jugo de piña',
            foto: 'https://www.recetasnestle.com.co/sites/default/files/2024-06/huevos-shakshuka-hierbas-pan_0.jpg', // Imagen de ejemplo
            precio: '20K',
        },
        todaysEspecialLunch: {
            proteina_op1: 'Pechuga de pollo al horno con hierbas',
            proteina_op2: 'Carne mechada con arroz integral',
            acompañante: 'Arepa de maíz amarillo',
            entrada: 'Sopa de vegetales',
            ensalada: 'Ensalada César',
            bebida: 'Limonada de coco',
            foto: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg', // Imagen de ejemplo
            precio: '30K',
        },
        monthEspecials: {
            especial_1: {
                nombre: 'Pizza Hawaiana',
                descripcion: 'Deliciosa pizza con piña, jamón y queso mozzarella.',
                foto: 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_1280.jpg', // Imagen de ejemplo
            },
            especial_2: {
                nombre: 'Hamburguesa Doble',
                descripcion: 'Jugosa hamburguesa doble carne con queso cheddar y papas fritas.',
                foto: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg', // Imagen de ejemplo
            },
            especial_3: {
                nombre: 'Ensalada Mediterránea',
                descripcion: 'Ensalada fresca con queso feta, aceitunas y vinagreta de limón.',
                foto: 'https://cdn.pixabay.com/photo/2016/08/11/09/01/food-1580534_1280.jpg', // Imagen de ejemplo
            },
            especial_4: {
                nombre: 'Tacos al Pastor',
                descripcion: 'Tacos tradicionales con carne de cerdo marinada y piña.',
                foto: 'https://cdn.pixabay.com/photo/2017/06/02/18/24/tacos-2368815_1280.jpg', // Imagen de ejemplo
            },
        },
    },

    allAgenda: [],
    allStaff: [],
    showEdit: false,
    allMenu: [],
    allItems: [],
    allProcedimientos: [],
    allRecetasMenu: [],
    allRecetasProduccion: [],
    allRecetasProcedimientos: [],
    allWorkIsue: [],
    currentLeng: ESP,
    allProduccion: [],
    Proveedores: [],
    allCompras: [],
    currentView: 'MENU',
    userRegState: 'notAuth',
    selectedValue: null,
    recetas: [],             // Estado para guardar las recetas insertadas
    preProcess: [],          // Estado para guardar las recetas insertadas
    recetaError: null,       // Estado para guardar el error en caso de fallo
    expandedGroups: {},      // Estado para controlar la visibilidad de los grupos
    selectedProviderId: null, // Estado para guardar el ID del proveedor seleccionado
    orderItems: [],          // Estado para guardar los ítems pedidos
    scrapedData: null,       // Propiedad inicializada para SCRAP

    // --- INICIO: ADICIONES DE ESTADO PARA MODELOS ---
    models: [],
    modelsLoading: true,
    modelsError: null,
    // --- FIN: ADICIONES DE ESTADO PARA MODELOS ---
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case SCRAP:
            return {
                ...state,
                scrapedData: action.payload,
            };
        case TOGGLE_SHOW_EDIT:
            return {
                ...state,
                showEdit: action.payload,
            };

        case SET_LANGUAGE:
            return {
                ...state,
                currentLeng: action.payload,
            };


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
                preProcess: action.payload,
            };

        case GET_ALL_FROM_TABLE:
            switch (action.path) {
                case STAFF:
                    return { ...state, allStaff: action.payload };
                case RECETAS_MENU:
                    return { ...state, allRecetasMenu: action.payload };
                case RECETAS_PRODUCCION:
                    return { ...state, allRecetasProduccion: action.payload };
                case RECETAS_PROCEDIMIENTOS:
                    return { ...state, allRecetasProcedimientos: action.payload };
                case PROVEE:
                    return { ...state, Proveedores: action.payload };
                case WORKISUE:
                    return { ...state, allWorkIsue: action.payload };
                case COMPRAS:
                    return { ...state, allCompras: action.payload };
                case MENU:
                    return { ...state, allMenu: action.payload };
                case ITEMS:
                    return { ...state, allItems: action.payload };
                case PRODUCCION:
                    return { ...state, allProduccion: action.payload };
                case PROCEDE:
                    return { ...state, allProcedimientos: action.payload };
                case AGENDA:
                    return { ...state, allAgenda: action.payload };
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
                recetas: [...state.recetas, ...action.payload], // Agregar recetas insertadas al estado
                recetaError: null,                              // Limpiar cualquier error previo
            };

        case INSERT_RECETAS_FAILURE:
            return {
                ...state,
                recetaError: action.payload,                    // Guardar el mensaje de error
            };

        case RESET_EXPANDED_GROUPS:
            return {
                ...state,
                expandedGroups: {}, // Restablecer la visibilidad de los grupos
            };

        case SET_SELECTED_PROVIDER_ID: // ANTES: 'SET_SELECTED_PROVIDER_ID'
            return {
                ...state,
                selectedProviderId: action.payload,
            };

        case ADD_ORDER_ITEM:
            return {
                ...state,
                orderItems: [...state.orderItems, action.payload], // Agregar ítem pedido al estado
            };
        case UPDATE_ITEM: {
            // Actualiza el array allItems con el item modificado
            const updatedItems = state.allItems.map(item =>
                item._id === action.payload._id
                    ? { ...item, ...action.payload }
                    : item
            );
            return {
                ...state,
                allItems: updatedItems,
            };
        }

        // --- INICIO: ADICIONES DE CASES PARA MODELOS ---
        case GET_MODELS_SUCCESS:
            return {
                ...state,
                models: action.payload,
                modelsLoading: false,
                modelsError: null,
            };

        case GET_MODELS_FAILURE:
            return {
                ...state,
                modelsLoading: false,
                modelsError: action.payload,
            };

        case CREATE_MODEL_SUCCESS:
            return {
                ...state,
                models: [action.payload, ...state.models],
            };

        case UPDATE_MODEL_SUCCESS:
            return {
                ...state,
                models: state.models.map(model =>
                    model._id === action.payload._id ? action.payload : model
                ),
            };

        case DELETE_MODEL_SUCCESS:
            return {
                ...state,
                models: state.models.filter(model => model._id !== action.payload),
            };
        // --- FIN: ADICIONES DE CASES PARA MODELOS ---

        default:
            return state;
    }
};

export default reducer;