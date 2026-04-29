/**
 * Prompt Template for Inventory Item Updates
 * Single unified prompt: if a link is provided in context → extract from it.
 * Otherwise → search the internet with full scoring & provider logic.
 */

export const generateInventoryUpdatePrompt = (
  items,
  selectedProviders = [],
  allProviders = [],
  forceSelectedProviders = false,
  singleProviderReturn = false,
  forceLowestUnitPrice = false
) => {
  const itemsList = items
    .map((i) => {
      const providerName =
        allProviders.find((p) => p._id === i.Proveedor)?.Nombre_Proveedor ||
        "No asignado";
      const marca = Array.isArray(i.MARCA) ? i.MARCA[0] : i.MARCA;
      return `- ID: ${i._id}
     - Nombre: ${i.Nombre_del_producto}
     - Categoría: ${i.GRUPO}
     - Proveedor Actual: ${providerName}
     - Marca Actual: ${marca}
     - Costo Actual: ${i.COSTO}
     - Cantidad Actual: ${i.CANTIDAD}
     - Unidades Actuales: ${i.UNIDADES}`;
    })
    .join("\n\n");

  const providersText =
    selectedProviders.length > 0
      ? selectedProviders
          .map((p) => `- ${p.Nombre_Proveedor} (${p.PAGINA_WEB || "Sin web"})`)
          .join("\n")
      : "No se especificaron proveedores preferidos.";

  return `ACTÚA COMO: Experto en Abastecimiento, Investigación de Mercado y Gestión de Inventarios Gastronómicos en Medellín, Colombia.

TU OBJETIVO:
Actualizar la información de los ítems suministrados (precio, presentación, marca, proveedor) y devolver un JSON que respete ESTRICTAMENTE la estructura de la tabla ItemsAlmacen.

---

## PASO 0 — DETECCIÓN DE MODO (OBLIGATORIO, EJECUTAR PRIMERO)

Antes de cualquier búsqueda, revisa si en el contexto de este mensaje (o en mensajes adjuntos) existe algún **enlace/URL/hipervínculo** asociado a alguno de los ítems.

### MODO A — Link detectado
- Si hay uno o más enlaces: extrae la información **exclusivamente** del contenido de ese enlace.
- **PRIORIDAD ABSOLUTA**: el link anula cualquier otra regla de búsqueda, proveedor preferido o precio más bajo.
- Por cada ítem con link: lee precio, presentación, marca y cantidad directamente de la URL.
- Si el link tiene múltiples opciones (500g vs 1kg), selecciona la que mejor coincida con el nombre del ítem o la presentación más cercana a la actual.
- Si el link no tiene precio visible, usa "0".
- Para ítems SIN link en el mismo prompt, aplica el MODO B.

### MODO B — Sin link (búsqueda en internet)
- Si no hay ningún enlace: busca activamente en internet el precio y presentación actual de cada ítem.
- Aplica todas las reglas de búsqueda, scoring y filtrado descritas a continuación.

---

## REGLAS MODO B — BÚSQUEDA EN INTERNET

### Alcance geográfico y logístico (CRÍTICO)
Busca proveedores que cumplan ESTRICTAMENTE:
1. Ubicación: Medellín o Área Metropolitana (Valle de Aburrá).
2. Domicilio: deben ofrecer entrega a domicilio.
3. Venta al por menor: deben vender cantidades unitarias (no solo grandes mayoristas).

### Fuentes preferidas
Prioriza la búsqueda en los siguientes proveedores seleccionados por el usuario:
${providersText}

Si no encuentras el producto en estos proveedores, busca en otros que cumplan el alcance geográfico.
${forceSelectedProviders ? "\n**RESTRICCIÓN ESTRICTA: SOLO busca y selecciona precios de los proveedores listados como fuentes preferidas. Ignora cualquier otro proveedor externo.**" : ""}

### Criterio de precio
${
  forceLowestUnitPrice
    ? `**PRIORIDAD MÁXIMA: PRECIO UNITARIO MÁS BAJO**
- Calcula precio unitario (Precio Total / Cantidad) para todas las opciones encontradas.
- Selecciona SIEMPRE la opción con menor costo por unidad, aunque cambie el proveedor o la marca.
- Si hay presentación institucional o de mayor tamaño con mejor precio por gramo/ml, elígela.`
    : `- El precio NO se elige al azar ni como promedio simple.
- Evalúa mínimo, promedio y máximo de mercado.
- Prefiere opciones coherentes con el mercado actual de Medellín.`
}

### Scoring matemático para elegir una opción
Variables:
- precioUnitario_i = costo_i / cantidad_i
- pmin = min(precioUnitario); pmax = max(precioUnitario)
- pn_i = (precioUnitario_i − pmin) / (pmax − pmin) — si pmax==pmin → 0.5
- pref_i = 1 si el proveedor es prioritario, 0 si no
- pavg = promedio(precioUnitario); ratio_i = precioUnitario_i / pavg
- caro_i = max(0, ratio_i − 1)

Puntaje: S_i = 60 × pref_i + 35 × (1 − pn_i) − 25 × caro_i

Selecciona la opción con mayor S_i.
Regla anti-extremos: si pref_i=1 y ratio_i ≥ 1.35, solo se elige si no existe opción no prioritaria con pn_i ≤ 0.25.
${singleProviderReturn ? "\n**RESTRICCIÓN DE UNIFICACIÓN: Si es posible y económicamente favorable, consolida TODOS los ítems en el MISMO proveedor (o la menor cantidad posible). Prioriza la unificación si la diferencia de precio total no es significativa.**" : ""}

### Instrucciones de búsqueda por ítem
1. Identifica el producto comercial más adecuado disponible en Medellín.
2. Determina el precio de mercado actual.
3. Identifica la presentación comercial (unidad y cantidad neta).
4. Prioriza opciones estándar y fáciles de reponer.
5. Da resultados con posibilidad de verificación — no alucines URLs ni precios. Si no encuentras el dato en la base de datos, búscalo en internet; si tampoco aparece con certeza, omite el ítem.
6. Los resultados deben expresarse en gramos (gr) siempre que sea posible.
7. Si un ítem no puede encontrarse con certeza en ningún proveedor, NO lo incluyas en el resultado.
8. **PROHIBIDO** inventar, alucinar o deducir precios, proveedores o marcas sin respaldo real y verificable.

---

## REGLAS DE FORMATO Y ESTRUCTURA (APLICAN A AMBOS MODOS)

### 1) STOCK y ALMACENAMIENTO
Devuélvelos como STRING con JSON serializado (NO como objeto anidado).
- STOCK default: "{\\"minimo\\":0,\\"maximo\\":0,\\"actual\\":0}"
- ALMACENAMIENTO default: "{\\"ALMACENAMIENTO\\":\\"\\",\\"BODEGA\\":\\"\\"}"
Si el ítem original trae estos campos, consérvalos tal cual.

### 2) Tipos de datos (RESPETAR ESTRICTAMENTE)
- CANTIDAD: String numérico (ej: "500", "1000")
- UNIDADES: String ("gr", "ml", "und", "kg", "lb", "un")
- COSTO: String sin puntos, comas ni símbolos (ej: "15000")
- precioUnitario: Number → (COSTO / CANTIDAD)
- _id: UUID — MANTENER ESTRICTAMENTE EL ORIGINAL DEL INPUT
- Proveedor: UUID o null — PROHIBIDO convertir a texto
- MARCA: Array de Strings (ej: ["Colanta"])

### 3) Integridad
- NO agregues campos extra (ej: NO "fuente_precio", NO "url", NO "notas").
- NO inventes IDs.
- Si un campo no se puede determinar, conserva el valor original del input o usa null.

---

## ESTRUCTURA DE SALIDA (OBLIGATORIA)

Entrega el resultado ÚNICAMENTE dentro de un bloque \`\`\`json ... \`\`\` (con el cajón de copiar en la esquina). Sin texto antes ni después del bloque.

\`\`\`json
[
  {
    "Nombre_del_producto": "string",
    "CANTIDAD": "string",
    "UNIDADES": "string",
    "COSTO": "string",
    "MARCA": ["string"],
    "_id": "uuid-original-del-input",
    "precioUnitario": 0
  }
]
\`\`\`

---

IMPORTANTE: Si en tu respuesta aparecen marcadores de cita como [cite: 5, 6] o [cite:#], elimínalos completamente.

ITEMS A INVESTIGAR:
${itemsList}
`;
};
