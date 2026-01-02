/**
 * Prompt Template for Inventory Item Updates
 * Defines the instructions for the AI to search for information and return structured JSON.
 */

export const generateInventoryUpdatePrompt = (items, selectedProviders = [], forceSelectedProviders = false, singleProviderReturn = false) => {
  const itemsList = items.map(item => {
    // Prepare raw fields that might contain escaped JSON
    const stockRaw = item.STOCK ? JSON.stringify(item.STOCK) : "null";
    const storageRaw = item.ALMACENAMIENTO ? JSON.stringify(item.ALMACENAMIENTO) : "null";
    const brandRaw = item.MARCA ? JSON.stringify(item.MARCA) : "null";

    return `- ID: ${item._id}
  Nombre Actual: ${item.Nombre_del_producto}
  Marca (Raw): ${brandRaw}
  Proveedor: ${item.Proveedor || "N/A"}
  Stock (Raw): ${stockRaw}
  Almacenamiento (Raw): ${storageRaw}`;
  }).join("\n\n");

  const providersText = selectedProviders.length > 0
    ? selectedProviders.map(p => `- ${p.Nombre_Proveedor} (${p.PAGINA_WEB || "Sin web"})`).join("\n")
    : "No se especificaron proveedores preferidos.";

  return `ACTÚA COMO: Experto en Abastecimiento, Investigación de Mercado y Gestión de Inventarios Gastronómicos en Medellín, Colombia.

TU OBJETIVO  
Buscar en internet información actualizada (precios de mercado en Medellín, Colombia, presentaciones comerciales, detalles técnicos) para los ítems suministrados y devolver un **JSON** que respete ESTRICTAMENTE la estructura de la tabla ItemsAlmacen.

---

## CRITERIO DE BÚSQUEDA Y SELECCIÓN DE PRECIO (OBLIGATORIO)

El precio NO se elige al azar ni como simple promedio.  
Debes aplicar una lógica de priorización para seleccionar el precio final y la presentación comercial.

### Prioridad por proveedor
- Los proveedores explícitamente mencionados o sugeridos en el prompt tienen mayor peso.
- Si un proveedor prioritario ofrece un precio razonable (dentro del rango de mercado), ese precio debe preferirse.
${forceSelectedProviders ? "**- RESTRICCIÓN ESTRICTA: SOLO debes buscar y seleccionar precios de los proveedores listados como 'FUENTES PREFERIDAS'. Ignora cualquier otro proveedor externo.**" : ""}

### Comparación de precios
Evalúa múltiples opciones del mercado e identifica:
- Precio más barato
- Precio promedio
- Precio más caro

### Regla de equilibrio
- Si un proveedor prioritario es significativamente más caro que opciones equivalentes, NO se selecciona automáticamente.
- En ese caso, compara alternativas y elige la opción con mejor equilibrio entre:
  - Disponibilidad
  - Proveedor confiable
  - Precio competitivo

### Orden de decisión
1) Cercanía a proveedores prioritarios  
2) Precio más competitivo dentro de ese grupo  
3) Si el grupo prioritario es claramente más caro, elegir una alternativa más barata del mercado general

### Coherencia de mercado
- El precio debe ser coherente con el mercado actual de Medellín, Colombia.
- Evita extremos irreales salvo justificación clara.
${singleProviderReturn ? "**- RESTRICCIÓN DE UNIFICACIÓN: Si es posible y económicamente favorable, intenta que TODOS los ítems provengan del MISMO PROVEEDOR (o la menor cantidad posible de proveedores). Prioriza la consolidación de la orden en un solo lugar si la diferencia de precio total no es significativa.**" : ""}

### Regla de transparencia interna (implícita)
Aunque solo se devuelva un precio final en el JSON, la decisión debe basarse en:
- comparación real de opciones
- evaluación de rangos de precios
- aplicación estricta de prioridades

---

## SCORING MATEMÁTICO SIMPLIFICADO (PARA ELEGIR 1 OPCIÓN)

Objetivo: escoger UNA opción (proveedor + presentación + costo) que maximice un puntaje.

Variables:
- precioUnitario_i = costo_i / cantidad_i
- pmin = min(precioUnitario)
- pmax = max(precioUnitario)
- pn_i = (precioUnitario_i - pmin) / (pmax - pmin)  
  (si pmax == pmin, pn_i = 0.5)
- pref_i = 1 si el proveedor es prioritario, 0 si no
- pavg = promedio(precioUnitario)
- ratio_i = precioUnitario_i / pavg
- caro_i = max(0, ratio_i - 1)

Puntaje:
S_i = 60*pref_i + 35*(1 - pn_i) - 25*caro_i

Decisión:
- Calcula S_i para todas las opciones.
- Selecciona la opción con mayor S_i.

Regla anti-extremos (opcional):
Si pref_i = 1 y ratio_i ≥ 1.35, solo se elige si no existe una opción no prioritaria con pn_i ≤ 0.25.

---

## ENTRADA  
Yo te enviaré ítems en formato SQL o CSV.

---

## ALCANCE GEOGRÁFICO Y LOGÍSTICO (CRÍTICO)
Busca proveedores que cumplan ESTRICTAMENTE:
1) Ubicación: Medellín o Área Metropolitana (Valle de Aburrá).
2) Domicilio: deben ofrecer entrega a domicilio.
3) Venta al por menor: deben vender cantidades unitarias requeridas (no solo grandes mayoristas).

---

## FUENTES PREFERIDAS
Prioriza la búsqueda en los siguientes proveedores seleccionados por el usuario:
${providersText}

Si no encuentras el producto en estos proveedores, busca en otros que cumplan el alcance geográfico y logístico.

---

## INSTRUCCIONES DE BÚSQUEDA (POR ÍTEM)
1) Identifica el producto comercial más adecuado disponible en Medellín, Colombia.
2) Determina el precio de mercado actual aproximado.
3) Identifica la presentación comercial (unidad y cantidad neta).
4) Prioriza opciones estándar y fáciles de reponer.

---

## REGLAS DE FORMATO Y ESTRUCTURA (ITEMSALMACEN)

### 1) STOCK y ALMACENAMIENTO (IMPORTANTE)
Devuélvelos como STRING que contiene JSON serializado (NO como objeto).
- STOCK default: "{\"minimo\":0,\"maximo\":0,\"actual\":0}"
- ALMACENAMIENTO default: "{\"ALMACENAMIENTO\":\"\",\"BODEGA\":\"\"}"

Si el ítem original ya trae STOCK o ALMACENAMIENTO, consérvalos tal cual a menos que se te pida actualizarlos explícitamente.

### 2) Tipos de datos (RESPETAR)
- CANTIDAD: String (ej: "500", "1000")
- COSTO: String (ej: "15000")
- precioUnitario: Number
- UNIDADES: String ("gr", "ml", "und", "kg", "lb", "un")
- _id: UUID (MANTENER ESTRICTAMENTE EL ORIGINAL DEL INPUT)
- Proveedor: UUID o null (MANTENER ESTRICTAMENTE EL ORIGINAL DEL INPUT; PROHIBIDO convertir a texto)

### 3) Integridad
- NO agregues campos extra (por ejemplo: NO "fuente_precio").
- NO inventes IDs.
- Si un campo no se puede determinar, respeta el valor original del input o usa null/valor por defecto según aplique.

---

## ESTRUCTURA DE SALIDA (OBLIGATORIA)

Devuelve ÚNICAMENTE una lista (Array) de objetos JSON.
Cada objeto debe contener EXACTAMENTE estas claves (sin extras):

[
  {
    "Nombre_del_producto": "string",
    "CANTIDAD": "string",
    "UNIDADES": "string",
    "COSTO": "string",
    "MARCA": ["string:nombre_de_la_marca"],
    "_id": "uuid-original-del-input",
    "precioUnitario": 0,
  }
]

 

ITEMS A INVESTIGAR:
${itemsList}
`;

};
