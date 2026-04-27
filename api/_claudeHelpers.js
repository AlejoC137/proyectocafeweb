// Prefijo _ → Vercel no lo expone como ruta pública

export function buildSystemPrompt({ recipeType, porciones, itemsAlmacen, produccionInterna }) {
  const isEstandar = recipeType === "estandar";
  const typeLabel = isEstandar ? "Receta Estándar (Venta)" : "Receta de Producción (Pre-producción)";

  const schemaEstandar = `{
  "legacyName": "Nombre de la Receta",
  "emplatado": "Descripción del recipiente y presentación final",
  "rendimiento": "{\\"porcion\\":1,\\"cantidad\\":${porciones},\\"unidades\\":\\"<UNIDAD>\\"}",
  "nota1": "Nota técnica o tip",
  "nota2": null,
  "proces1": "Texto del paso 1",
  "proces2": "Texto del paso 2",
  "...": "Continúa hasta proces20 (null si no aplica)",
  "item1_Id": "<_id del ingrediente en ItemsAlmacen>",
  "item1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE>\\"}",
  "...": "Continúa hasta item30 (null si no aplica)",
  "producto_interno1_Id": "<_id del producto en ProduccionInterna>",
  "producto_interno1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE>\\"}",
  "...": "Continúa hasta producto_interno20 (null si no aplica)"
}`;

  const schemaProduccion = `{
  "legacyName": "Nombre de la Producción",
  "rendimiento": "{\\"porcion\\":1,\\"cantidad\\":${porciones},\\"unidades\\":\\"<UNIDAD>\\"}",
  "proces1": "Texto del paso 1",
  "...": "Continúa hasta proces20 (null si no aplica)",
  "item1_Id": "<_id del ingrediente en ItemsAlmacen>",
  "item1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE>\\"}",
  "...": "Continúa hasta item30 (null si no aplica)",
  "producto_interno1_Id": "<_id del producto en ProduccionInterna>",
  "producto_interno1_Cuantity_Units": "{\\"metric\\":{\\"cuantity\\":<CANT>,\\"units\\":\\"<UNI>\\"},\\"legacyName\\":\\"<NOMBRE>\\"}",
  "...": "Continúa hasta producto_interno20 (null si no aplica)"
}`;

  return `# PROMPT MAESTRO: ESTANDARIZACIÓN DE RECETAS

ACTÚA COMO: Un Chef Ejecutivo experto en estandarización de recetas y Arquitecto de Datos.

TU OBJETIVO: Procesar las fuentes proporcionadas, extraer una receta técnica detallada y formatearla en un JSON estricto, mapeando ingredientes a la base de datos provista.

## CONFIGURACIÓN DE ESTA CONSULTA — NO PREGUNTES, YA ESTÁ RESUELTA

- TIPO DE RECETA ELEGIDO: ${typeLabel}
- PORCIONES FINALES: ${porciones}
- Ajusta TODAS las cantidades de ingredientes para rendir ${porciones} porciones.
- En el campo "rendimiento", el valor de "cantidad" debe ser ${porciones}.

## REGLAS DE PROCESAMIENTO

1. ANÁLISIS DE FUENTES:
   - Procesa cada fuente según su nivel de importancia (ALTA > MEDIA > BAJA).
   - En caso de contradicción entre fuentes, prioriza la de mayor importancia.
   - Transcribe paso a paso las acciones, identificando ingredientes, cantidades, utensilios y tiempos.
   - Detecta claves visuales o de textura (ej: "cuando burbujee", "color dorado").

2. MAPEO DE INGREDIENTES (CRÍTICO):
   - Solo puedes usar ingredientes que existan en las listas ItemsAlmacen y ProduccionInterna de abajo.
   - Busca coincidencia en el campo Nombre_del_producto de cada lista.
   - Si existe exacto: extrae su _id y úsalo.
   - Si no existe exacto: busca el equivalente técnico más cercano (ej: "Azúcar" → busca "Azúcar blanca").
   - Si no hay equivalente posible: EXCLUYE el ingrediente de los campos itemX/producto_internoX, pero mencionalo en el texto del proceso.

3. FORMATO DE CANTIDADES — STRINGS CON JSON ESCAPADO:
   Los campos Cuantity_Units son STRINGS que contienen JSON. Formato obligatorio:
   "{\\"metric\\":{\\"cuantity\\":<VALOR_NUMERICO>,\\"units\\":\\"<UNIDAD>\\"},\\"legacyName\\":\\"<NOMBRE_EN_BD>\\"}"
   Unidades permitidas: "gr", "ml", "un", "pizca".

## BASE DE DATOS DE INGREDIENTES DISPONIBLES

ItemsAlmacen — usa sus _id para los campos item1_Id, item2_Id, etc.:
${JSON.stringify(itemsAlmacen)}

ProduccionInterna — usa sus _id para los campos producto_interno1_Id, etc.:
${JSON.stringify(produccionInterna)}

## INSTRUCCIONES FINALES DE SALIDA

- Tu respuesta debe ser ÚNICAMENTE el objeto JSON. Sin texto antes, sin texto después, sin bloques de código markdown.
- No inventes claves nuevas. Usa exactamente las claves del schema.
- Si un campo está vacío, usa null.
- Escapa correctamente las comillas en strings JSON anidados.

## SCHEMA DE SALIDA REQUERIDO

${isEstandar ? schemaEstandar : schemaProduccion}`;
}

export function buildUserMessage(sources) {
  const active = sources
    .filter((s) => s.enabled && s.content?.trim())
    .sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.importance] - { alta: 0, media: 1, baja: 2 }[b.importance]));

  if (!active.length) return "Procesa la receta con las fuentes disponibles.";

  return active
    .map((s) => `[IMPORTANCIA: ${s.importance.toUpperCase()}]\n${s.content.trim()}`)
    .join("\n\n---\n\n");
}

export function parseClaudeResponse(text) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return { result: JSON.parse(clean), parsed: true };
  } catch {
    return { result: clean, parsed: false };
  }
}
