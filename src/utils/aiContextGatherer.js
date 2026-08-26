/**
 * Captura el contexto de la aplicación según la ruta actual, estado global,
 * reglas del administrador e información multimodal ingerida.
 */

import { getAIRules, getAIKnowledge } from "./aiRulesKnowledgeManager";

const ROUTE_CONTEXT_MAP = {
  "/": {
    name: "Portal de Staff",
    description: "Pantalla principal de inicio de sesión y selección de módulos para el personal.",
    suggestedPrompts: [
      "¿Qué accesos principales hay en la plataforma?",
      "¿Cómo ingreso a la sección de inventario?",
      "¿Qué módulos requiere mi rol?"
    ]
  },
  "/MenuView": {
    name: "Menú Principal del Café",
    description: "Visualización y gestión del catálogo de productos a la venta (bebidas, postres, alimentos).",
    suggestedPrompts: [
      "¿Cuáles son las categorías del menú?",
      "¿Cómo agrego un nuevo producto al menú?",
      "¿Dónde consulto los precios de los productos?"
    ]
  },
  "/MenuLunch": {
    name: "Menú de Almuerzos",
    description: "Gestión de los menú de almuerzo diario, opciones ejecutivas y platos del día.",
    suggestedPrompts: [
      "¿Cómo configuro el menú de almuerzos de hoy?",
      "¿Cómo analizo el margen de costo por almuerzo?",
      "¿Dónde puedo registrar los menús especiales?"
    ]
  },
  "/LunchByOrder": {
    name: "Almuerzos por Pedido",
    description: "Módulo de gestión de pedidos de almuerzo por encargo y entregas.",
    suggestedPrompts: [
      "¿Cómo se registran los pedidos de almuerzo?",
      "¿Dónde veo la lista de pedidos pendientes?"
    ]
  },
  "/Inventario": {
    name: "Gestión de Inventario",
    description: "Módulo central de control de stock, insumos, cantidades disponibles y movimientos de almacén.",
    suggestedPrompts: [
      "¿Cómo registro una entrada o salida de inventario?",
      "¿Qué insumos están bajos en stock?",
      "¿Cómo ajusto las existencias de un ítem?"
    ]
  },
  "/GestionAlmacen": {
    name: "Gestión de Almacén",
    description: "Organización detallada de categorías, ubicaciones e insumos de almacenamiento.",
    suggestedPrompts: [
      "¿Cómo organizo las categorías del almacén?",
      "¿Dónde puedo crear un nuevo insumo?"
    ]
  },
  "/Recetas": {
    name: "Recetario & Fichas Técnicas",
    description: "Fichas técnicas de recetas, ingredientes, porciones y costeo de preparación.",
    suggestedPrompts: [
      "¿Cómo calculo el costo de producción de una receta?",
      "¿Cómo agrego un ingrediente a una receta existente?",
      "¿Dónde veo el margen de rentabilidad de la receta?"
    ]
  },
  "/VentaCompra": {
    name: "Ventas y Compras",
    description: "Registro y control financiero de transacciones de ventas diarias y compras realizadas.",
    suggestedPrompts: [
      "¿Cómo registro las ventas diarias?",
      "¿Dónde veo el resumen de facturación?",
      "¿Cómo registro una compra de materia prima?"
    ]
  },
  "/Gastos": {
    name: "Control de Gastos",
    description: "Módulo para registrar y categorizar los egresos y gastos operativos del negocio.",
    suggestedPrompts: [
      "¿Cómo clasifico un nuevo gasto operativo?",
      "¿Cuál es el total de gastos acumulados del mes?",
      "¿Dónde registro el pago de servicios públicos?"
    ]
  },
  "/Compras": {
    name: "Registro de Compras",
    description: "Historial y carga de facturas de compra e insumos adquiridos a proveedores.",
    suggestedPrompts: [
      "¿Cómo se asocia una compra a un proveedor?",
      "¿Dónde descargo el historial de compras?"
    ]
  },
  "/DiaResumen": {
    name: "Resumen del Día",
    description: "Vista analítica detallada del rendimiento financiero y ventas acumuladas en el día.",
    suggestedPrompts: [
      "¿Cuál es el balance general de hoy?",
      "¿Cuáles fueron los productos más vendidos hoy?",
      "¿Cómo exporto el resumen diario?"
    ]
  },
  "/MesResumen": {
    name: "Resumen Mensual",
    description: "Métricas consolidadas mensuales, ingresos, gastos y utilidad neta.",
    suggestedPrompts: [
      "¿Cómo comparo las ventas de este mes con el anterior?",
      "¿Cuál es la utilidad estimada del mes?"
    ]
  },
  "/Agenda": {
    name: "Agenda & Eventos",
    description: "Planificación de eventos, reservas, talleres y fechas especiales en el café.",
    suggestedPrompts: [
      "¿Cómo agendo un nuevo evento?",
      "¿Dónde veo la lista de inscritos a un taller?",
      "¿Cómo configuro la capacidad de un evento?"
    ]
  },
  "/Proveedores": {
    name: "Directorio de Proveedores",
    description: "Gestión de contactos de proveedores, insumos que despachan y cuentas por pagar.",
    suggestedPrompts: [
      "¿Cómo registro un nuevo proveedor?",
      "¿Dónde consulto los pagos pendientes a un proveedor?"
    ]
  },
  "/staff-manager": {
    name: "Gestión de Personal (Staff)",
    description: "Administración de empleados, turnos, propinas, consumo interno y turnos de trabajo.",
    suggestedPrompts: [
      "¿Cómo calculo el turno o nómina de un empleado?",
      "¿Dónde gestiono las propinas del staff?",
      "¿Cómo se registra el consumo de empleados?"
    ]
  },
  "/CalculoNomina": {
    name: "Cálculo de Nómina",
    description: "Cálculo automático de salarios, horas trabajadas y pagos de personal.",
    suggestedPrompts: [
      "¿Cómo se calcula el valor hora para la nómina?",
      "¿Dónde se exporta la nómina del periodo?"
    ]
  },
  "/Cotizaciones": {
    name: "Generador de Cotizaciones",
    description: "Creación y emisión de cotizaciones para clientes y eventos especiales.",
    suggestedPrompts: [
      "¿Cómo creo una cotización para un evento privado?",
      "¿Cómo aplico descuentos en una cotización?"
    ]
  },
  "/Aliados": {
    name: "Gestión de Aliados",
    description: "Red de marcas aliadas, comisiones y catálogo de productos en alianza.",
    suggestedPrompts: [
      "¿Cómo registro una marca aliada?",
      "¿Dónde consulto el reporte de ventas por aliado?"
    ]
  },
  "/bajas": {
    name: "Control de Bajas y Merma",
    description: "Registro de mermas, productos vencidos o roturas en inventario.",
    suggestedPrompts: [
      "¿Cómo registro la baja de un producto por vencimiento?",
      "¿Dónde veo el informe total de mermas?"
    ]
  }
};

/**
 * Retorna el contexto formateado de forma asíncrona para el system prompt de DeepSeek
 */
export async function getApplicationContextAsync(pathname = "/", extraState = {}) {
  const cleanPath = pathname.split("?")[0];
  
  let matchedKey = Object.keys(ROUTE_CONTEXT_MAP).find(
    (key) => key !== "/" && cleanPath.toLowerCase().startsWith(key.toLowerCase())
  );

  if (!matchedKey && cleanPath === "/") {
    matchedKey = "/";
  }

  const routeInfo = ROUTE_CONTEXT_MAP[matchedKey] || {
    name: cleanPath.replace("/", "") || "Sección General",
    description: `El usuario está ubicado actualmente en la ruta '${cleanPath}'.`,
    suggestedPrompts: [
      "¿Para qué sirve esta sección?",
      "¿Cómo realizo una operación aquí?",
      "¿Dónde encuentro las opciones de configuración?"
    ]
  };

  const timestamp = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

  let contextString = `[INFORMACIÓN GENERAL]
- Sistema: Proyecto Café Web (Gestión Administrativa y Operativa de Café/Restaurante)
- Fecha y Hora actual: ${timestamp}
- Ruta actual en la app: "${cleanPath}"
- Nombre de la sección: "${routeInfo.name}"
- Descripción de la sección: "${routeInfo.description}"`;

  // Cargar Reglas Activas de Administrador
  try {
    const rules = await getAIRules();
    const activeRules = rules.filter((r) => r.is_active);
    if (activeRules.length > 0) {
      contextString += `\n\n[REGLAS Y DIRECTIVAS OBLIGATORIAS DEL ADMINISTRADOR]\n`;
      activeRules.forEach((rule, idx) => {
        contextString += `${idx + 1}. [${rule.category}] ${rule.title}: ${rule.content}\n`;
      });
    }
  } catch (e) {
    console.warn("No se pudieron cargar reglas para el contexto:", e);
  }

  // Cargar Conocimiento Ingerido
  try {
    const knowledgeList = await getAIKnowledge();
    if (knowledgeList.length > 0) {
      contextString += `\n\n[BASE DE CONOCIMIENTO INGERIDA (${knowledgeList.length} documentos)]\n`;
      knowledgeList.slice(0, 8).forEach((item, idx) => {
        contextString += `--- Documento ${idx + 1} (${item.type.toUpperCase()}): "${item.title}" ---\n${item.content.slice(0, 1000)}\n\n`;
      });
    }
  } catch (e) {
    console.warn("No se pudo cargar conocimiento ingerido para el contexto:", e);
  }

  if (extraState && Object.keys(extraState).length > 0) {
    contextString += `\n\n[DATOS DE ESTADO RELEVANTES]\n${JSON.stringify(extraState, null, 2)}`;
  }

  return {
    contextString,
    routeInfo,
    cleanPath
  };
}

/**
 * Versión síncrona de fallback
 */
export function getApplicationContext(pathname = "/", extraState = {}) {
  const cleanPath = pathname.split("?")[0];
  let matchedKey = Object.keys(ROUTE_CONTEXT_MAP).find(
    (key) => key !== "/" && cleanPath.toLowerCase().startsWith(key.toLowerCase())
  );
  if (!matchedKey && cleanPath === "/") matchedKey = "/";

  const routeInfo = ROUTE_CONTEXT_MAP[matchedKey] || {
    name: cleanPath.replace("/", "") || "Sección General",
    description: `El usuario está ubicado actualmente en la ruta '${cleanPath}'.`,
    suggestedPrompts: [
      "¿Para qué sirve esta sección?",
      "¿Cómo realizo una operación aquí?",
      "¿Dónde encuentro las opciones de configuración?"
    ]
  };

  return {
    contextString: `[INFORMACIÓN GENERAL]\nRuta: "${cleanPath}"\nSección: "${routeInfo.name}"`,
    routeInfo,
    cleanPath
  };
}
