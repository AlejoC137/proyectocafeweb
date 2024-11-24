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
   frontPage : {  
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
  }
  ,
  agendaMes: {
    evento_1: {
      fecha: "2024-12-05",
      horaInicio: "10:00 AM",
      horaFinal: "02:00 PM",
      nombre: "Seminario de Innovación Tecnológica",
      autores: "Dr. Juan Pérez, Ing. Ana García",
      valor: "$50,000",
      bannerIMG: "https://via.placeholder.com/600x300?text=Seminario+Tecnología",
      linkInscripcion: "https://www.eventbrite.com/e/seminario-innovacion-tecnologica",
      infoAdicional: "Exploración de las últimas tendencias tecnológicas e impacto en la industria.",
    },
    evento_2: {
      fecha: "2024-12-10",
      horaInicio: "08:00 AM",
      horaFinal: "12:00 PM",
      nombre: "Maratón Anual de Emprendedores",
      autores: "Asociación de Jóvenes Empresarios",
      valor: "Entrada Libre",
      bannerIMG: "https://via.placeholder.com/600x300?text=Maratón+Emprendedores",
      linkInscripcion: "https://www.eventbrite.com/e/maraton-anual-de-emprendedores",
      infoAdicional: "Un evento para conectar emprendedores y promover ideas innovadoras.",
    },
    evento_3: {
      fecha: "2024-12-15",
      horaInicio: "06:00 PM",
      horaFinal: "10:00 PM",
      nombre: "Concierto de Música Clásica",
      autores: "Orquesta Filarmónica de Bogotá",
      valor: "$70,000",
      bannerIMG: "https://via.placeholder.com/600x300?text=Concierto+Música+Clásica",
      linkInscripcion: "https://www.eventbrite.com/e/concierto-musica-clasica",
      infoAdicional: "Una noche mágica con obras de Mozart, Beethoven y Tchaikovsky.",
    },
    evento_4: {
      fecha: "2024-12-20",
      horaInicio: "03:00 PM",
      horaFinal: "07:00 PM",
      nombre: "Taller de Cocina Internacional",
      autores: "Chef María López",
      valor: "$90,000",
      bannerIMG: "https://via.placeholder.com/600x300?text=Taller+Cocina",
      linkInscripcion: "https://www.eventbrite.com/e/taller-de-cocina-internacional",
      infoAdicional: "Aprende recetas de cocina italiana, japonesa y mexicana en un taller práctico.",
    },
    evento_5: {
      fecha: "2024-12-22",
      horaInicio: "09:00 AM",
      horaFinal: "05:00 PM",
      nombre: "Hackathon de Desarrollo de Software",
      autores: "TechLab Colombia",
      valor: "Entrada Libre",
      bannerIMG: "https://via.placeholder.com/600x300?text=Hackathon+Software",
      linkInscripcion: "https://www.eventbrite.com/e/hackathon-desarrollo-software",
      infoAdicional: "Compite con otros desarrolladores para resolver desafíos de programación.",
    },
    evento_6: {
      fecha: "2024-12-28",
      horaInicio: "04:00 PM",
      horaFinal: "08:00 PM",
      nombre: "Exposición de Arte Moderno",
      autores: "Galería Central",
      valor: "$20,000",
      bannerIMG: "https://via.placeholder.com/600x300?text=Exposición+Arte",
      linkInscripcion: "https://www.eventbrite.com/e/exposicion-arte-moderno",
      infoAdicional: "Descubre piezas únicas de artistas contemporáneos nacionales e internacionales.",
    },
    evento_7: {
      fecha: "2024-12-31",
      horaInicio: "09:00 PM",
      horaFinal: "12:30 AM",
      nombre: "Fiesta de Fin de Año",
      autores: "Hotel Bogotá Plaza",
      valor: "$150,000",
      bannerIMG: "https://via.placeholder.com/600x300?text=Fiesta+Fin+de+Año",
      linkInscripcion: "https://www.eventbrite.com/e/fiesta-de-fin-de-ano",
      infoAdicional: "Celebra el fin de año con música en vivo, cena especial y espectáculos de fuegos artificiales.",
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
