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
  ENLATADOS,
  DESAYUNO
} from "./actions-types";

// Valor fijo por unidad de tiempo


const COSTO_POR_TIEMPO_MANODEOBRA = 150;
const COSTO_POR_TIEMPO_SERVICIOS = 150;
const COSTO_POR_TIEMPO = COSTO_POR_TIEMPO_SERVICIOS + COSTO_POR_TIEMPO_MANODEOBRA;



export function recetaMariaPaula(
  ingredientes,
  currentType,
  porcentajeCostoDirectoEdit,
  tiempo,
  id,
  source,
  porciones = 1,
  indiceInflacionario = 0.08,
  impoconsumo = 0.08,
  aplicarIVA = 0.05,
) {
  let porcentajeCostoDirecto;

  if (porcentajeCostoDirectoEdit) {
    porcentajeCostoDirecto = porcentajeCostoDirectoEdit;
  } else {
    switch (currentType) {
      case CARNICO: porcentajeCostoDirecto = 0.45; break;
      case LACTEO: porcentajeCostoDirecto = 0.35; break;
      case CAFE: porcentajeCostoDirecto = 0.35; break;
      case PANADERIA: porcentajeCostoDirecto = 0.30; break;
      case REPOSTERIA: porcentajeCostoDirecto = 0.40; break;
      case VERDURAS_FRUTAS: porcentajeCostoDirecto = 0.25; break;
      case BEBIDAS: porcentajeCostoDirecto = 0.40; break;
      case CONDIMENTOS_ESPECIAS_ADITIVOS: porcentajeCostoDirecto = 0.60; break;
      case GRANOS_CEREALES: porcentajeCostoDirecto = 0.20; break;
      case LIMPIEZA: porcentajeCostoDirecto = 0.15; break;
      case DOTACION: porcentajeCostoDirecto = 0.10; break;
      case CONCERVAS_FERMENTOS_PRECOCIDOS: porcentajeCostoDirecto = 0.35; break;
      case GUARNICION: porcentajeCostoDirecto = 0.25; break;
      case DESECHABLES: porcentajeCostoDirecto = 0.05; break;
      case ENLATADOS: porcentajeCostoDirecto = 0.30; break;
      case DESAYUNO: porcentajeCostoDirecto = 0.35; break;
      default: porcentajeCostoDirecto = 0.35; break;
    }
  }

  try {
    let total = 0;

    // Calcular el costo total de los ingredientes
    for (const ingrediente of ingredientes) {
      const { field, precioUnitario, cuantity } = ingrediente;

      if (isNaN(precioUnitario) || precioUnitario === null) {
        throw new Error(`El campo ${field} tiene un precio unitario inválido: ${precioUnitario}`);
      }
      if (isNaN(cuantity) || cuantity === null) {
        throw new Error(`El campo ${field} tiene una cantidad inválida: ${cuantity}`);
      }

      const subtotal = parseFloat(precioUnitario) * parseFloat(cuantity);
      total += subtotal;
    }

    // Agregar costo del tiempo
    const costoTiempo = tiempo * COSTO_POR_TIEMPO;
    // total += costoTiempo;

    // Agregar 5% de condimentos
    const condimentos = total * 0.05;
    total += condimentos;

    // Agregar 7% de margen de error
    const margenError = total * 0.07;
    total += margenError;

    // Calcular el Costo Materia Prima (CMP)
    const CMP = total / porciones;

    const PPV = CMP / (porcentajeCostoDirecto);
    const PPVii = PPV + PPV * indiceInflacionario;
    const IB = PPV - CMP - costoTiempo;
    // const IB = PPV - CMP;

    // Agregar impoconsumo
    const impoconsumoValor = PPVii * impoconsumo;
    let precioFinal = PPVii + impoconsumoValor;

    // Agregar IVA si aplica
    if (aplicarIVA) {
      const iva = precioFinal * aplicarIVA;
      precioFinal += iva;
    }

    let pCostoReal = CMP / PPVii;

    // Retornar el precio final consolidado
    return {
      consolidado: Math.round(precioFinal),
      detalles: {
        vIB: Number(IB.toFixed(0)),
        pIB: Number((IB / precioFinal).toFixed(2)),
        vCMP: Number(CMP.toFixed(0)),
        pCMPInicial: Number(porcentajeCostoDirecto),
        pCMPReal: Number(pCostoReal.toFixed(2)),
        PPVii: Number(PPVii.toFixed(0)),
        costoTiempo:costoTiempo// Detalle del costo del tiempo
      },
    };
  } catch (error) {
    console.error("Error en recetaMariaPaula:", error.message);
    throw error;
  }
}
