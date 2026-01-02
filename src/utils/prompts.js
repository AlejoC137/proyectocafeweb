/**
 * Centralized Prompts Utility
 * Manages AI prompts for JSON generation across different entity types
 */

import { ITEMS, PRODUCCION, MENU } from '../redux/actions-types';

// Prompt for Items Almacen (Inventory Items)
// const PROMPT_ITEMS_ALMACEN = `# Prompt: ItemsAlmacen (Extracción/Actualización controlada)

// Actúa como experto en extracción de datos e inventarios. Tu trabajo es leer el enlace del producto y actualizar un registro de ItemsAlmacen sin romper el schema.

// ## ENTRADAS (pueden venir 1 o 2)
// 1) itemBase (opcional pero recomendado): un objeto/registro existente (desde SQL/CSV/JSON) con las columnas de ItemsAlmacen.
// 2) linkProducto: URL del producto a consultar.

// ## OBJETIVO
// - Si hay itemBase: SOLO actualizar estos campos (si logras obtenerlos del link):
//   - Nombre_del_producto
//   - CANTIDAD
//   - UNIDADES
//   - COSTO
//   - precioUnitario
//   - MARCA
//   - FECHA_ACT (poner fecha de hoy)
//   Todo lo demás se copia EXACTO desde itemBase.

// - Si NO hay itemBase: construir el objeto completo con valores por defecto, pero SIEMPRE respetando el schema.

// ## REGLAS CRÍTICAS (para evitar el bug)
// - Proveedor ES uuid (string). Si itemBase trae Proveedor, COPIA EXACTAMENTE el mismo valor. NO lo conviertas a texto, NO lo “interpretes”, NO lo reemplaces.
// - _id ES uuid (string). Si itemBase trae _id, COPIA EXACTAMENTE el mismo valor. NO lo cambies.
// - PROHIBIDO agregar llaves nuevas. En especial: NO existe "fuente_precio" aquí. Nunca la incluyas.

// ## OUTPUT
// Devuelve ÚNICAMENTE un objeto JSON (no array, no texto). Debe contener EXACTAMENTE estas claves y NINGUNA más:

// - Nombre_del_producto (string)
// - Area (string)
// - CANTIDAD (string)        <- aunque sea numérico, aquí va como texto por el schema (ej: "1000")
// - UNIDADES (string)        <- ej: "gr", "ml", "und", "kg", "lb", "un"
// - COSTO (string)           <- ej: "15000"
// - COOR (string)            <- valor fijo "1.05" (si itemBase trae otro, respeta el de itemBase)
// - FECHA_ACT (string)       <- "YYYY-MM-DD" (hoy)
// - STOCK (string)           <- JSON serializado (ver abajo)
// - GRUPO (string)
// - MARCA (array de strings) <- ej: ["Alpina"] o []
// - _id (string uuid)
// - precioUnitario (number)  <- número real
// - Proveedor (string uuid o null)
// - ALMACENAMIENTO (string)  <- JSON serializado (ver abajo)
// - Merma (string)           <- ej: "0"
// - Estado (string)          <- ej: "PC"

// ## FORMATO ESPECIAL (strings que contienen JSON serializado)
// 1) STOCK (string)
// Debe ser string con JSON serializado. Default:
// "{\\"minimo\\":0,\\"maximo\\":0,\\"actual\\":0}"
// Si itemBase trae STOCK, cópialo tal cual (a menos que te pidan actualizarlo explícitamente).

// 2) ALMACENAMIENTO (string)
// Debe ser string con JSON serializado. Default:
// "{\\"ALMACENAMIENTO\\":\\"\\",\\"BODEGA\\":\\"\\"}"
// Si itemBase trae ALMACENAMIENTO, cópialo tal cual (a menos que te pidan actualizarlo explícitamente).

// ## NORMALIZACIÓN
// - Si en el título aparece peso/volumen (ej: "500 g", "1kg", "750 ml"):
//   - CANTIDAD = "500" / "1000" / "750" (SIEMPRE string)
//   - UNIDADES = "gr" / "ml" / etc.
// - COSTO: extraer precio del link y guardarlo como string numérica sin símbolos ni separadores. Ej: "16950"
// - precioUnitario:
//   - Si CANTIDAD es válida y > 0: precioUnitario = (Number(COSTO) / Number(CANTIDAD))
//   - Redondear a 2 decimales.
//   - Si no hay CANTIDAD: precioUnitario = Number(COSTO)

// ## MARCA (array)
// - Si encuentras una marca: MARCA = ["Marca"]
// - Si no: MARCA = []

// ## VALORES POR DEFECTO (solo si NO hay itemBase)
// - Area: inferir (si es insumo cocina -> "COCINA", si es bebida -> "CAFE_BEBIDAS", si no estás seguro -> "COCINA")
// - GRUPO: inferir (ej: "CARNICO", "VERDURAS_FRUTAS", "LACTEO", "DESECHABLES"...)
// - COOR: "1.05"
// - FECHA_ACT: fecha de hoy "YYYY-MM-DD"
// - STOCK: "{\\"minimo\\":0,\\"maximo\\":0,\\"actual\\":0}"
// - ALMACENAMIENTO: "{\\"ALMACENAMIENTO\\":\\"\\",\\"BODEGA\\":\\"\\"}"
// - Merma: "0"
// - Estado: "PC"
// - _id: generar uuid v4
// - Proveedor: null

// ## RESTRICCIONES DE SALIDA
// - Devuelve SOLO el JSON.
// - NO explicaciones.
// - NO agregar campos extra.
// `;



// Prompt for Produccion Interna (Internal Production Items)
const PROMPT_PRODUCCION_INTERNA = `ACTÚA COMO: Arquitecto de Base de Datos e Inventario.

CONTEXTO: Acabamos de generar un JSON de "Receta de Producción". Ahora necesito crear el objeto correspondiente para la tabla de inventario "ProduccionInterna".

TU TAREA: Generar un único objeto JSON basado en el esquema de \`ProduccionInterna_rows.csv\` que represente el producto terminado de la receta anterior.

REGLAS DE MAPEO (IMPORTANTE):
1. "Nombre_del_producto": Debe ser IDÉNTICO al "legacyName" de la receta generada.
2. "CANTIDAD": Extrae SOLO el valor numérico del campo "rendimiento" de la receta.
3. "UNIDADES": Extrae la unidad (gr, ml, etc.) del campo "rendimiento".
4. "Receta": Déjalo estrictamente como null (La relación se hará manualmente).
5. "GRUPO": Infiérelo basado en el tipo de producto (ej: SALSAS, PROTEINAS, PRE-PRODUCCION, MASAS).
6. "STOCK": Usa estrictamente este string JSON por defecto: "{\\"minimo\\":0,\\"maximo\\":0,\\"actual\\":0}"
7. "Estado": Por defecto "OK".
8. "COSTO": Pon 0 (se calculará después por sistema).
9. "FECHA_ACT": Usa la fecha de hoy (AAAA-MM-DD).

ESQUEMA DE SALIDA (JSON ESTRICTO):
{
  "Nombre_del_producto": "Texto",
  "Estado": "OK",
  "CANTIDAD": Numero,
  "UNIDADES": "Texto",
  "COSTO": 0,
  "COOR": null,
  "FECHA_ACT": "Fecha",
  "STOCK": "{\\"minimo\\":0,\\"maximo\\":0,\\"actual\\":0}",
  "GRUPO": "Texto Inferido",
  "_id": "Generar UUID",
  "precioUnitario": 0,
  "Area": null,
  "MARCA": "[]",
  "Proveedor": null,
  "Receta": null,
  "Merma": 0
}

INSTRUCCIÓN FINALES:
• Dame solo el JSON, listo para copiar.
• No inventes datos que no estén en las reglas.
`;

// Prompt Maestro for Recipes
const PROMPT_RECETAS_MAESTRO = `# PROMPT MAESTRO: ESTANDARIZACIÓN DE RECETAS

**ACTÚA COMO:** Un Chef Ejecutivo experto en estandarización de recetas y Arquitecto de Datos.

**TU OBJETIVO:** Procesar un video (enlace o archivo) para extraer una receta técnica detallada y formatearla en un JSON estricto, mapeando ingredientes a una base de datos específica.

## 1. FASE DE INICIO (INTERACCIÓN OBLIGATORIA)
ANTES de procesar cualquier información, debes hacerme la siguiente pregunta y ESPERAR mi respuesta:
> "¿Deseas generar una 'Receta Estándar' (Venta) o una 'Receta de Producción' (Pre-producción)?"

## 2. REGLAS DE PROCESAMIENTO (CEREBRO DEL CHEF)
1.  **Análisis del Video:**
    * Transcribe paso a paso las acciones.
    * Identifica ingredientes, cantidades, utensilios y tiempos.
    * Detecta "Claves Visuales" (ej: "cuando burbujee", "color dorado", "textura de napa").

2.  **Mapeo de Ingredientes (CRÍTICO):**
    * Solo puedes usar ingredientes que existan en las listas **ItemsAlmacen** y **ProduccionInterna** (que se asume tienes en contexto).
    * **Lógica de Coincidencia:** Busca el ingrediente mencionado en el campo \`Nombre_del_producto\` de las listas.
        * **Si existe:** Extrae su \`_id\` y úsalo.
        * **Si no existe exacto:** Busca el equivalente técnico más cercano (ej: "Azúcar" -> "Azúcar blanca refinada").
        * **Si no hay equivalente:** EXCLUYE el ingrediente de la lista de ítems (pero mantenlo mencionado en el texto del proceso).

3.  **Formato de Cantidades (Objetos dentro de Objetos):**
    * Los campos de cantidad (\`itemX_Cuantity_Units\`) deben ser **STRINGS** que contengan un JSON válido.
    * **ESTRUCTURA OBLIGATORIA:** Debes incluir el campo \`legacyName\` (el nombre del producto tal cual aparece en tu base de datos o el nombre genérico si no mapeó) dentro de este objeto.
    * Formato exacto del string:
        \`"{\\"metric\\":{\\"cuantity\\":<VALOR>,\\"units\\":\\"<UNIDAD>\\"},\\"legacyName\\":\\"<NOMBRE_DEL_PRODUCTO>\\"}"\`
    * Unidades permitidas: "gr", "ml", "un" (unidades), "pizca".

## 3. ESTRUCTURAS DE SALIDA (JSON SCHEMAS)
Dependiendo de mi elección, genera UN SOLO objeto JSON plano con las siguientes claves. No inventes claves nuevas.

### OPCIÓN A: SI ELIJO "RECETA ESTÁNDAR"
Usa este esquema (basado en \`Recetas_rows.csv\`):

\`\`\`json
{
  "legacyName": "Nombre de la Receta",
  "emplatado": "Descripción del recipiente y presentación final",
  "rendimiento": "{\\"porcion\\":1,\\"cantidad\\":<CANTIDAD_TOTAL>,\\"unidades\\":\\"<UNIDAD>\\"}",
  "nota1": "Nota técnica o tip (si aplica)",
  "nota2": "...",
  "proces1": "Texto del paso 1...",
  "proces2": "Texto del paso 2...",
  "proces20": null,
  "item1_Id": "<_id DEL INGREDIENTE EN ALMACEN>",
  "item1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE_PRODUCTO>\\"}",
  "item2_Id": "...",
  "item2_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE_PRODUCTO>\\"}",
  "item30_Id": null,
  "item30_Cuantity_Units": null,
  "producto_interno1_Id": "<_id DE PRODUCCION INTERNA>",
  "producto_interno1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE_PRODUCTO>\\"}",
  "producto_interno20_Id": null,
  "producto_interno20_Cuantity_Units": null
}
\`\`\`

### OPCIÓN B: SI ELIJO "RECETA DE PRODUCCIÓN"

Usa este esquema (basado en \`Recetas Produccion_rows.csv\`):

\`\`\`json
{
  "legacyName": "Nombre de la Producción",
  "rendimiento": "{\\"porcion\\":1,\\"cantidad\\":<CANTIDAD_TOTAL>,\\"unidades\\":\\"<UNIDAD>\\"}",
  "proces1": "Texto del paso 1...",
  "proces2": "Texto del paso 2...",
  "proces20": null,
  "item1_Id": "<_id DEL INGREDIENTE EN ALMACEN>",
  "item1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE_PRODUCTO>\\"}",
  "item30_Id": null,
  "item30_Cuantity_Units": null,
  "producto_interno1_Id": "<_id DE PRODUCCION INTERNA>",
  "producto_interno1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE_PRODUCTO>\\"}",
  "producto_interno20_Id": null,
  "producto_interno20_Cuantity_Units": null
}
\`\`\`

## 4. INSTRUCCIONES FINALES

  * Tu salida debe ser **UNICAMENTE** el código JSON.
  * No uses bloques de texto antes o después del JSON.
  * Asegúrate de escapar correctamente las comillas dentro de los strings JSON anidados (ej: \`\\"legacyName\\"\`).
  * Si un campo está vacío, usa \`null\` o una cadena vacía \`""\` según corresponda, pero mantén la estructura.
  * ¡Estoy listo! Pregúntame qué tipo de receta deseo generar.
`;

/**
 * Get the appropriate prompt based on entity type
 * @param {string} type - Entity type constant (ITEMS, PRODUCCION, MENU, etc.)
 * @returns {string} The prompt text
 */
export function getPromptByType(type) {
  // Normalize type
  const normalizedType = typeof type === 'string' ? type : '';

  // Map type to prompt
  switch (normalizedType) {
    case ITEMS:
    case 'ItemsAlmacen':
    case 'ITEMS':
      return PROMPT_ITEMS_ALMACEN;

    case PRODUCCION:
    case 'ProduccionInterna':
    case 'PRODUCCION':
      return PROMPT_PRODUCCION_INTERNA;

    case MENU:
    case 'MenuItems':
    case 'MENU':
      // For now, reuse Items prompt for Menu items
      // Can be customized later if needed
      return PROMPT_ITEMS_ALMACEN;

    case 'RECETAS_MENU':
    case 'RECETAS_PRODUCCION':
    case 'RECETAS':
      return PROMPT_RECETAS_MAESTRO;

    default:
      console.warn(`Unknown prompt type: ${type}, defaulting to Items prompt`);
      return PROMPT_ITEMS_ALMACEN;
  }
}

/**
 * Copy prompt to clipboard and provide visual feedback
 * @param {string} type - Entity type
 * @param {Function} setPromptCopied - State setter for copied feedback
 * @returns {Promise<boolean>} Success status
 */
export async function copyPromptToClipboard(type, setPromptCopied) {
  try {
    const promptContent = getPromptByType(type);
    await navigator.clipboard.writeText(promptContent);

    // Show "Copied" feedback
    if (setPromptCopied) {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }

    return true;
  } catch (err) {
    console.error('Failed to copy prompt:', err);
    alert('Error al copiar el prompt');
    return false;
  }
}
