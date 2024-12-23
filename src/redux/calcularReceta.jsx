import { CARNICO,
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
 } from "./actions-types";

  
export async function recetaMariaPaula(
  ingredientes,
  currentType,
  id,
  source,
  porciones = 1,
  indiceInflacionario = 0.08,
  impoconsumo = 0.08,
  aplicarIVA = 0.05,
  // porcentajeCostoDirecto = 0.41,
) {
let porcentajeCostoDirecto;


console.log(currentType);

switch (currentType) {
  case value:
    
    break;
    case CARNICO:
      porcentajeCostoDirecto = 0.45;
      break;
    case LACTEO:
      porcentajeCostoDirecto = 0.35;
      break;
    case CAFE:
      porcentajeCostoDirecto = 0.50;
      break;
    case PANADERIA:
      porcentajeCostoDirecto = 0.30;
      break;
    case REPOSTERIA:
      porcentajeCostoDirecto = 0.40;
      break;
    case VERDURAS_FRUTAS:
      porcentajeCostoDirecto = 0.25;
      break;
    case BEBIDAS:
      porcentajeCostoDirecto = 0.55;
      break;
    case CONDIMENTOS_ESPECIAS_ADITIVOS:
      porcentajeCostoDirecto = 0.60;
      break;
    case GRANOS_CEREALES:
      porcentajeCostoDirecto = 0.20;
      break;
    case LIMPIEZA:
      porcentajeCostoDirecto = 0.15;
      break;
    case DOTACION:
      porcentajeCostoDirecto = 0.10;
      break;
    case CONCERVAS_FERMENTOS_PRECOCIDOS:
      porcentajeCostoDirecto = 0.35;
      break;
    case GUARNICION:
      porcentajeCostoDirecto = 0.25;
      break;
    case DESECHABLES:
      porcentajeCostoDirecto = 0.05;
      break;
    case ENLATADOS:
      porcentajeCostoDirecto = 0.30;
      break;
      default:
    porcentajeCostoDirecto = 0.41;
    

    break;
}

  try {
    // Inicializar la suma total
    let total = 0;

    // Calcular el costo total de los ingredientes
    for (const ingrediente of ingredientes) {
      const { field, precioUnitario, cuantity } = ingrediente;

      // Validar que precioUnitario y cuantity sean números válidos
      if (isNaN(precioUnitario) || precioUnitario === null) {
        throw new Error(`El campo ${field} tiene un precio unitario inválido: ${precioUnitario}`);
      }
      if (isNaN(cuantity) || cuantity === null) {
        throw new Error(`El campo ${field} tiene una cantidad inválida: ${cuantity}`);
      }

      // Convertir los valores a números y realizar la multiplicación
      const subtotal = parseFloat(precioUnitario) * parseFloat(cuantity);

      // Sumar al total
      total += subtotal;
    }

    // Agregar 5% de condimentos
    const condimentos = total * 0.05;
    total += condimentos;

    // Agregar 7% de margen de error
    const margenError = total * 0.07;
    total += margenError;

    // Dividir el costo total entre el número de porciones
    const costoPorPorcion = total / porciones;

    // Calcular el precio de venta (PPV)
    const montoRestante = (costoPorPorcion * porcentajeCostoDirecto) / 1;
    const precioPotenciaVenta = montoRestante + costoPorPorcion;

    // Agregar el índice inflacionario
    const inflacion = precioPotenciaVenta * indiceInflacionario;
    const ppvConInflacion = precioPotenciaVenta + inflacion;

    // Agregar impoconsumo
    const impoconsumoValor = ppvConInflacion * impoconsumo;
    let precioFinal = ppvConInflacion + impoconsumoValor;

    // Agregar IVA si aplica
    if (aplicarIVA) {
      const iva = precioFinal * aplicarIVA;
      precioFinal += iva;
    }

    // Retornar el precio final consolidado
    return {
      consolidado: Math.round(precioFinal), // Valor consolidado redondeado
      detalles: {
        totalIngredientes: total,
        condimentos,
        margenError,
        costoPorPorcion,
        precioPotenciaVenta,
        inflacion,
        impoconsumo: impoconsumoValor,
        precioFinal,
      },
    };
  } catch (error) {
    console.error("Error en recetaMariaPaula:", error.message);
    throw error; // Re-lanzar el error si es necesario manejarlo externamente
  }
}
