// Acciones generales
export const GET_ALL_FROM_TABLE = "GET_ALL_FROM_TABLE";
export const UPDATE_ACTIVE_TAB = "UPDATE_ACTIVE_TAB";
export const UPDATE_CURRENT_VIEW = "UPDATE_CURRENT_VIEW";
export const GET_BY_FILTER_VALUE = "GET_BY_FILTER_VALUE";
export const TODAYS_MENU = "TODAYS_MENU";

// Acciones relacionadas con el estado del usuario y selección
export const SET_USER_REG_STATE = "SET_USER_REG_STATE";  // Nueva acción
export const UPDATE_SELECTED_VALUE = "UPDATE_SELECTED_VALUE";  // Nueva acción
export const SET_SELECTED_PROVIDER_ID = "SET_SELECTED_PROVIDER_ID"; // Nueva acción para establecer el ID del proveedor seleccionado

// Vistas
export const HOME = "HOME";
export const SUPABASE = "SUPABASE";
export const AGENDA = "AGENDA";
export const NOSOTROS = "NOSOTROS";
export const MENUVIEW = "MENUVIEW";
export const LUNCH = "LUNCH";

// Tablas en Supabase
export const ITEMS = "ItemsAlmacen";
export const MENU = "Menu";
export const PRODUCCION = "ProduccionInterna";
export const STAFF = "Staff";
export const PROVEE = "Proveedores";
// Fuentes dd precios
export const FUENTES = []

// Categorieas 

// Areas

export const COCINA = 'COCINA'
export const BARRA = 'BARRA'
export const MESAS = 'MESAS'

export const AREAS = [ 
  COCINA,
  BARRA,
  MESAS,

]

// grupo

export const CARNICO = 'CARNICO'
export const LACTEO = 'LACTEO'
export const CAFE = 'CAFE'
export const PANADERIA = 'PANADERIA'
export const REPOSTERIA = 'REPOSTERIA'
export const VERDURAS_FRUTAS = 'VERDURAS_FRUTAS'
export const BEBIDAS = 'BEBIDAS'
export const CONDIMENTOS_ESPECIAS_ADITIVOS = 'CONDIMENTOS_ESPECIAS_ADITIVOS'
export const GUARNICION = "GUARNICION"
export const GRANOS_CEREALES = 'GRANOS_CEREALES'
export const LIMPIEZA = 'LIMPIEZA'
export const DOTACION = 'DOTACION'
export const CONCERVAS_FERMENTOS_PRECOCIDOS = 'CONCERVAS_FERMENTOS_PRECOCIDOS'
export const DESECHABLES = 'DESECHABLES'
export const ENLATADOS = 'ENLATADOS'


export const PC = 'PC'
export const PP = 'PP'
export const OK = 'OK'
export const NA = 'NA'

export const ESTATUS = [ 
  PC,
  PP,
  OK,
  NA


]


export const CATEGORIES = [
    CARNICO,
    LACTEO,
    CAFE,
    PANADERIA,
    REPOSTERIA,
    VERDURAS_FRUTAS,
    BEBIDAS,
    CONDIMENTOS_ESPECIAS_ADITIVOS,
    GRANOS_CEREALES,
    LIMPIEZA,
    DOTACION,
    CONCERVAS_FERMENTOS_PRECOCIDOS,
    GUARNICION,
    DESECHABLES,
    ENLATADOS
  ];

  export const gr = 'gr'
  export const kl = 'kl'
  export const ml = 'ml'
  export const li = 'li'
  export const un = 'un'

  



export const unidades = [
  gr,
  kl,
  ml,
  li,
  un,
  ];

export const ItemsAlmacen = "ItemsAlmacen"
export const ProduccionInterna = "ProduccionInterna"

// Acciones relacionadas con las recetas
export const INSERT_RECETAS_SUCCESS = "INSERT_RECETAS_SUCCESS";  // Nueva acción para éxito al insertar recetas
export const INSERT_RECETAS_FAILURE = "INSERT_RECETAS_FAILURE";  // Nueva acción para error al insertar recetas
export const SET_PREPROCESS_DATA = "SET_PREPROCESS_DATA";  // Nueva acción para error al insertar recetas
export const INSERT_ITEM_FAILURE  = "INSERT_ITEM_FAILURE ";  // Nueva acción para error al insertar recetas

export const TOGGLE_SHOW_EDIT =  'TOGGLE_SHOW_EDIT'; 

export const SCRAP  = "SCRAP ";  // Nueva acción para error al insertar recetas

export const RESET_EXPANDED_GROUPS = "RESET_EXPANDED_GROUPS"; // Nueva acción para restablecer la visibilidad de los grupos