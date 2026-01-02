# Prompt de Extracción: Producto a JSON (Schema ItemsAlmacen)



Actúa como un experto en extracción de datos y gestión de inventarios. Tu objetivo es analizar el contenido del enlace proporcionado y generar un objeto JSON que represente el producto, siguiendo estrictamente la estructura de datos y los tipos de columnas del archivo CSV de referencia.

**revisa el archivo cvs que el usuario entregara **

## Entrada

**Enlace del Producto: ejemplo , revisa si el usario entrego uno aparte , tambien revisa el archivo cvs que el usuario entregara **

https://supermu.com/products/entremuslo?_pos=7&_sid=65cfaace4&_ss=r



## Instrucciones de Formato

Genera **únicamente** el objeto JSON resultante. Asegúrate de cumplir con las siguientes reglas para mantener la compatibilidad con el CSV:



1.  **Formatos JSON Anidados:** Los campos `STOCK` y `ALMACENAMIENTO` deben ser **cadenas de texto** (strings) que contengan un JSON serializado, no objetos JSON anidados directamente. (Ejemplo: `"STOCK": "{\"minimo\":0...}"`).

2.  **Fechas:** Usa el formato `YYYY-MM-DD` para `FECHA_ACT`.

3.  **IDs:** Genera UUIDs v4 válidos para `_id`. Si no puedes determinar el `Proveedor`, genera un UUID temporal o usa `null`.

4.  **Valores por Defecto:** Usa los valores especificados en el esquema si la información no está disponible en el enlace.



## Esquema de Campos Requerido



El JSON debe contener exactamente las siguientes claves:



| Clave | Tipo | Descripción / Valor por Defecto |

| :--- | :--- | :--- |

| `Nombre_del_producto` | String | Nombre extraído del título del producto. |

| `Area` | String | Área sugerida (ej. "COCINA", "RESTAURANTE"). Infiérelo del producto. |

| `CANTIDAD` | Number | Cantidad neta del producto (ej. 500, 1000). Si no se menciona, intenta inferirlo del título o precio. |

| `UNIDADES` | String | Unidad de medida (ej. "gr", "kg", "und", "lb"). |

| `COSTO` | Number | Precio o costo extraído de la página. |

| `COOR` | Number | Valor fijo: `1.05`. |

| `FECHA_ACT` | String | Fecha actual (`YYYY-MM-DD`). |

| `STOCK` | String | Cadena JSON fija: `"{\"minimo\":0,\"maximo\":0,\"actual\":0}"`. |

| `GRUPO` | String | Categoría (ej. "CARNES", "VERDURAS_FRUTAS", "ABARROTES"). |

| `MARCA` | String | Marca del producto. Si no hay, usa `"[]"` o `null`. |

| `_id` | String | Generar un UUID único. |

| `precioUnitario` | Number | Precio por unidad. Si no aplica, repite el `COSTO`. |

| `Proveedor` | String | UUID del proveedor (o `null`). |

| `ALMACENAMIENTO` | String | Cadena JSON fija: `"{\"ALMACENAMIENTO\":\"\",\"BODEGA\":\"\"}"`. |

| `Merma` | Number | Porcentaje estimado (ej. 0). |

| `Estado` | String | Valor fijo: `"PC"`. |



## Ejemplo de Estructura de Salida (JSON)



```json

{

  "Nombre_del_producto": "Entremuslo de Pollo",

  "Area": "COCINA",

  "CANTIDAD": 1000,

  "UNIDADES": "gr",

  "COSTO": 15000,

  "COOR": 1.05,

  "FECHA_ACT": "2025-12-08",

  "STOCK": "{\"minimo\":0,\"maximo\":0,\"actual\":0}",

  "GRUPO": "CARNES",

  "MARCA": "[]",

  "_id": "550e8400-e29b-41d4-a716-446655440000",

  "precioUnitario": 15,

  "Proveedor": "7c9e6679-7425-40de-944b-e07fc1f90ae7",

  "ALMACENAMIENTO": "{\"ALMACENAMIENTO\":\"\",\"BODEGA\":\"\"}",

  "Merma": 0,

  "Estado": "PC"

}



// Acciones generales
export const GET_ALL_FROM_TABLE = "GET_ALL_FROM_TABLE";
export const UPDATE_ACTIVE_TAB = "UPDATE_ACTIVE_TAB";
export const UPDATE_CURRENT_VIEW = "UPDATE_CURRENT_VIEW";
export const GET_BY_FILTER_VALUE = "GET_BY_FILTER_VALUE";
export const TODAYS_MENU = "TODAYS_MENU";
export const MENUHEAD = "MENUHEAD";

// Acciones relacionadas con el estado del usuario y selección
export const SET_USER_REG_STATE = "SET_USER_REG_STATE";  // Nueva acción
export const UPDATE_SELECTED_VALUE = "UPDATE_SELECTED_VALUE";  // Nueva acción
export const SET_SELECTED_PROVIDER_ID = "SET_SELECTED_PROVIDER_ID"; // Nueva acción para establecer el ID del proveedor seleccionado
export const UPDATE_LOG_STAFF = "UPDATE_LOG_STAFF"; // Nueva acción para actualizar el registro del personal
// Vistas
export const HOME = "HOME";
export const SUPABASE = "SUPABASE";
export const AGENDA = "Agenda";
export const NOSOTROS = "NOSOTROS";
export const MENUVIEW = "MENUVIEW";
export const LUNCH = "LUNCH";
export const UPDATE_ITEM = "UPDATE_ITEM";

export const RECETAS_MENU = "Recetas";
export const RECETAS = "RECETAS";
export const MODEL = "Model";
// Tablas en Supabase
export const ITEMS = "ItemsAlmacen";
export const MENU = "Menu";
export const WORKISUE = "WorkIsue";
export const PRODUCCION = "ProduccionInterna";
export const STAFF = "Staff";
export const RECETAS_PRODUCCION = "RecetasProduccion";
export const PROCEDE = "Procedimientos";
export const RECETAS_PROCEDIMIENTOS = "RecetasProcedimientos";
export const PROVEE = "Proveedores";
export const COMPRAS = "Compras";
// Fuentes dd precios
export const FUENTES = []

// Categorieas 
export const GET_MODELS_SUCCESS = 'GET_MODELS_SUCCESS';
export const GET_MODELS_FAILURE = 'GET_MODELS_FAILURE';
export const UPDATE_MODEL_SUCCESS = 'UPDATE_MODEL_SUCCESS';
export const CREATE_MODEL_SUCCESS = 'CREATE_MODEL_SUCCESS';
export const DELETE_MODEL_SUCCESS = 'DELETE_MODEL_SUCCESS';
// Areas

export const COCINA = 'COCINA'
export const BARRA = 'BARRA'
export const MESAS = 'MESAS'
export const LIBROS_TIENDA = 'LIBROS_TIENDA'
export const JARDINERIA = 'JARDINERIA'
export const BAÑO = 'BAÑO'
export const DESPACHO = 'DESPACHO'

export const AREAS = [
  COCINA,
  BARRA,
  MESAS,
  JARDINERIA,
  LIBROS_TIENDA,
  BAÑO,
  DESPACHO,
  "PRODUCCION"
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
export const TARDEO = 'TARDEO'
export const DESAYUNO = 'DESAYUNO'
export const GRANOS = 'GRANOS'
export const HARINAS = 'HARINAS'
export const ADICIONES = 'ADICIONES'

export const CATEGORIES = [ //GRUPO
  CAFE,
  DESAYUNO,
  BEBIDAS,
  PANADERIA,
  REPOSTERIA,
  TARDEO,
  ADICIONES,
  CARNICO,
  LACTEO,
  VERDURAS_FRUTAS,
  CONDIMENTOS_ESPECIAS_ADITIVOS,
  GRANOS_CEREALES,
  LIMPIEZA,
  DOTACION,
  CONCERVAS_FERMENTOS_PRECOCIDOS,
  GUARNICION,
  DESECHABLES,
  ENLATADOS,
  GRANOS,
  HARINAS
];



export const CATEGORIES_t = {
  CAFE: { es: "Café", en: "Coffee", icon: "☕" },
  DESAYUNO: { es: "Desayuno", en: "Breakfast", icon: "🥞" },
  BEBIDAS: { es: "Bebidas", en: "Drinks", icon: "🍹" },
  PANADERIA: { es: "Panadería", en: "Bakery", icon: "🥐" },
  REPOSTERIA: { es: "Repostería", en: "Pastry", icon: "🍰" },
  TARDEO: { es: "Tardeo", en: "Afternoon Snack", icon: "🥪" },
  ADICIONES: { es: "Adiciones", en: "Add-ons", icon: "🥚" },
  CARNICO: { es: "Cárnico", en: "Meat", icon: "☕" },
  LACTEO: { es: "Lácteo", en: "Dairy", icon: "🐄" },
  VERDURAS_FRUTAS: { es: "Verduras y Frutas", en: "Fruits and Vegetables", icon: "🐄" },
  CONDIMENTOS_ESPECIAS_ADITIVOS: { es: "Condimentos, Especias y Aditivos", en: "Condiments, Spices and Additives", icon: "🧂" },
  GRANOS_CEREALES: { es: "Granos y Cereales", en: "Grains and Cereals", icon: "🌰" },
  LIMPIEZA: { es: "Limpieza", en: "Cleaning", icon: "🧼" },
  DOTACION: { es: "Dotación", en: "Equipment", icon: "📇" },
  CONCERVAS_FERMENTOS_PRECOCIDOS: { es: "Conservas, Fermentos y Precocidos", en: "Preserves, Ferments and Precooked", icon: "🍯" },
  GUARNICION: { es: "Guarnición", en: "Side Dish", icon: "🍟" },
  DESECHABLES: { es: "Desechables", en: "Disposables", icon: "🥡" },
  ENLATADOS: { es: "Enlatados", en: "Canned Goods", icon: "🥫" },
  GRANOS: { es: "Granos", en: "Grains", icon: "🥜" },
  HARINAS: { es: "Harinas", en: "Flours", icon: "🌾" }
};

export const CAFE_ESPRESSO = 'CAFE_ESPRESSO'
export const CAFE_METODOS = 'CAFE_METODOS'
export const BEBIDAS_FRIAS = 'BEBIDAS_FRIAS'
export const BEBIDAS_CALIENTES = 'BEBIDAS_CALIENTES'
export const DESAYUNO_DULCE = 'DESAYUNO_DULCE'
export const DESAYUNO_SALADO = 'DESAYUNO_SALADO'
export const ADICIONES_COMIDAS = 'ADICIONES_COMIDAS'
export const ADICIONES_BEBIDAS = 'ADICIONES_BEBIDAS'
export const PANADERIA_REPOSTERIA_DULCE = 'PANADERIA_REPOSTERIA_DULCE'
export const PANADERIA_REPOSTERIA_SALADA = 'PANADERIA_REPOSTERIA_SALADA'
export const TARDEO_ALMUERZO = 'TARDEO_ALMUERZO'


export const SUB_CATEGORIES = [ //GRUPO
  CAFE_ESPRESSO,
  CAFE_METODOS,
  TARDEO_ALMUERZO,
  BEBIDAS_FRIAS,
  BEBIDAS_CALIENTES,
  DESAYUNO_DULCE,
  DESAYUNO_SALADO,
  ADICIONES_COMIDAS,
  ADICIONES_BEBIDAS,
  PANADERIA_REPOSTERIA_DULCE,
  PANADERIA_REPOSTERIA_SALADA
];



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




export const gr = 'gr'
export const kl = 'kl'
export const ml = 'ml'
export const li = 'li'
export const un = 'un'
export const srv = 'srv'
export const SET_LANGUAGE = 'SET_LANGUAGE'





export const unidades = [
  gr,
  kl,
  ml,
  li,
  un,
  srv,
];

export const ItemsAlmacen = "ItemsAlmacen"
export const ProduccionInterna = "ProduccionInterna"
export const MenuItems = "MenuItems"

export const Staff = "Staff"
export const Procedimientos = "Procedimientos"
export const WorkIsue = "WorkIsue"

// Acciones relacionadas con las recetas
export const INSERT_RECETAS_SUCCESS = "INSERT_RECETAS_SUCCESS";  // Nueva acción para éxito al insertar recetas
export const INSERT_RECETAS_FAILURE = "INSERT_RECETAS_FAILURE";  // Nueva acción para error al insertar recetas
export const SET_PREPROCESS_DATA = "SET_PREPROCESS_DATA";  // Nueva acción para error al insertar recetas
export const INSERT_ITEM_FAILURE = "INSERT_ITEM_FAILURE ";  // Nueva acción para error al insertar recetas

export const TOGGLE_SHOW_EDIT = 'TOGGLE_SHOW_EDIT';

export const SCRAP = "SCRAP ";  // Nueva acción para error al insertar recetas

export const RESET_EXPANDED_GROUPS = "RESET_EXPANDED_GROUPS"; // Nueva acción para restablecer la visibilidad de los grupos

export const ADD_ORDER_ITEM = 'ADD_ORDER_ITEM';



export const REFRIGERACION_COCINA = 'REFRIGERACION_COCINA'
export const CONGELACION_COCINA = 'CONGELACION_COCINA'

export const REFRIGERACION_BEBIDAS = 'REFRIGERACION_BEBIDAS'
export const REFRIGERACION_FRUTAS = 'REFRIGERACION_FRUTAS'

export const REFRIGERACION_BARRA = 'REFRIGERACION_BARRA'
export const CONGELACION_BARRA = 'CONGELACION_BARRA'

export const REFRIGERACION_PRODUCCION = 'REFRIGERACION_PRODUCCION'
export const CONGELACION_PRODUCCION = 'CONGELACION_PRODUCCION'

export const REPISA_COCINA = 'REPISA_COCINA'
export const CANASTA_INFERIOR_COCINA = 'CANASTA_INFERIOR_COCINA'

export const REPISA_EMPACADO = 'REPISA_EMPACADO'
export const CANASTA_INFERIOR_EMPACADO = 'CANASTA_INFERIOR_EMPACADO'

export const REPISA_DESPACHO = 'REPISA_DESPACHO'
export const CANASTA_INFERIOR_DESPACHO = 'CANASTA_INFERIOR_DESPACHO'

export const REPISA_BARRA = 'REPISA_BARRA'
export const CANASTA_INFERIOR_BARRA = 'CANASTA_INFERIOR_BARRA'
export const PAPELERIA = 'PAPELERIA'

export const FRUTERA = 'FRUTERA'
export const NO_APLICA = 'NO_APLICA'
export const ESP = 'ESP'
export const ENG = 'ENG'



export const BODEGA = [
  REFRIGERACION_COCINA,
  CONGELACION_COCINA,
  REFRIGERACION_BEBIDAS,
  REFRIGERACION_FRUTAS,
  REFRIGERACION_BARRA,
  CONGELACION_BARRA,
  REFRIGERACION_PRODUCCION,
  CONGELACION_PRODUCCION,
  REPISA_COCINA,
  CANASTA_INFERIOR_COCINA,
  REPISA_EMPACADO,
  CANASTA_INFERIOR_EMPACADO,
  REPISA_DESPACHO,
  CANASTA_INFERIOR_DESPACHO,
  REPISA_BARRA,
  CANASTA_INFERIOR_BARRA,
  PAPELERIA,
  FRUTERA,
  NO_APLICA,
];

export const VENTAS = 'Ventas'

export const SMMV_COL_2025_HORA = 6189
export const SMMV_COL_2025_MINU = SMMV_COL_2025_HORA / 60
export const CREATE_RECIPE_FOR_PRODUCT_SUCCESS = "CREATE_RECIPE_FOR_PRODUCT_SUCCESS"; // <-- AÑADIR ESTA LÍNEA

export const BARISTA = 'BARISTA'
export const DESPACHADOR = 'DESPACHADOR'
export const AUX_PRODUCCION = 'AUX_PRODUCCION'
export const COCINERO = 'COCINERO'
export const EVENTOS = 'EVENTOS'
export const REDES = 'REDES'
export const MANAGER = 'MANAGER'

export const ROLES = [
  BARISTA,
  DESPACHADOR,
  AUX_PRODUCCION,
  COCINERO,
  EVENTOS,
  REDES,
  MANAGER
]


// --- INICIO: ACCIONES CRUD PARA NOTAS ---
export const ADD_NOTA_SUCCESS = "ADD_NOTA_SUCCESS";
export const ADD_NOTA_FAILURE = "ADD_NOTA_FAILURE";
export const UPDATE_NOTA_SUCCESS = "UPDATE_NOTA_SUCCESS";
export const UPDATE_NOTA_FAILURE = "UPDATE_NOTA_FAILURE";
export const DELETE_NOTA_SUCCESS = "DELETE_NOTA_SUCCESS";
export const DELETE_NOTA_FAILURE = "DELETE_NOTA_FAILURE";
// --- FIN: ACCIONES CRUD PARA NOTAS ---
export const UPDATE_COMPRA_SUCCESS = "UPDATE_COMPRA_SUCCESS";