/**
 * Prompt Template for Inventory Item Updates
 * Defines the instructions for the AI to search for information and return structured JSON.
 */

export const generateInventoryUpdatePrompt = (items, selectedProviders = [], allProviders = [], forceSelectedProviders = false, singleProviderReturn = false, forceLowestUnitPrice = false) => {
  const itemsList = items.map(i => {
    // Resolve Provider Name from ID
    const providerName = allProviders.find(p => p._id === i.Proveedor)?.Nombre_Proveedor || 'No asignado';
    return `- ID: ${i._id}
     - Nombre: ${i.Nombre_del_producto}
     - Categoría: ${i.GRUPO}
     - Proveedor Actual: ${providerName}
     - Marca Actual: ${i.MARCA}
     - Costo Actual: ${i.COSTO}
     - Cantidad Actual: ${i.CANTIDAD}`;
  }).join('\n\n');

  const providerNames = selectedProviders.map(p => p.Nombre_Proveedor).join(', ');

  const providersText = selectedProviders.length > 0
    ? selectedProviders.map(p => `- ${p.Nombre_Proveedor} (${p.PAGINA_WEB || "Sin web"})`).join("\n")
    : "No se especificaron proveedores preferidos.";

  return `ACTÚA COMO: Experto en Abastecimiento, Investigación de Mercado y Gestión de Inventarios Gastronómicos en Medellín, Colombia.

    TU OBJETIVO
Buscar en internet información actualizada(precios de mercado en Medellín, Colombia, presentaciones comerciales, detalles técnicos) para los ítems suministrados y devolver un ** JSON ** que respete ESTRICTAMENTE la estructura de la tabla ItemsAlmacen.
## Proceso de búsqueda y lógica 
Lo principal es lograr actualizar el precio unitario, el costo, la marca y otras propiedades que están en la parte de abajo.

La misión final de este prompt y de este proceso es lograr determinar cuál es el valor actual del producto solicitado. 

Para eso, vamos a escoger entre las búsquedas y dar un dato exacto.

Así que no se vale retomar el mismo valor del mismo objeto a buscar. No sería el punto.

Lo importante sería buscar el producto y actualizar el valor. 


Es importante entender el criterio de las músicas. Si un objeto tiene un proveedor que no pudo ser encontrado, no debe averiguarse. Es decir, no adicione los resultados para los resultados que no han sido encontrados.

Necesito que revises si un objeto, si un objeto buscado está en otros proveedores que no sean el que tiene incluido, porque me está devolviendo elementos con plaza minorista de la página web, la cual sé que no tienes página web, o sea, si la entregaste será porque no la buscaste o alucinaste la búsqueda.

A lo que me refiero es solamente dar resultados comprobados y buscados en las páginas. Busca cada uno de los ítems en cada una de las páginas.

Dame resultados con posibilidad de verificación. 

  Los resultados deben estar siempre al máximo posible en gramos. No usar unidades en la medida de lo posible, solo usar gramos en la medida de lo posible. 
---

## JERARQUÍA DE DECISIÓN (CRÍTICO)

1. **ENLACES (LINKS) DIRECTOS**: 
   - Si junto con el prompt se proporciona un hipervínculo o URL específica: **ESTE ES EL PRODUCTO ELEGIDO.**
   - **TIENE PRIORIDAD ABSOLUTA** sobre cualquier otra regla de "precio más bajo", "forzar proveedor" o "proveedor preferido".
   - Saca la información Para ese único ítem (Precio, Presentación, Marca) directamente de ese link.

2. **REGLAS DE FILTRADO (Solo si NO hay link)**:
   - Si no hay link, aplica las reglas activas a continuación (Precio bajo, Proveedor específico, etc.).

---

## CRITERIO DE BÚSQUEDA Y SELECCIÓN DE PRECIO(OBLIGATORIO)

  ${forceLowestUnitPrice ? `
  **🚨 PRIORIDAD MÁXIMA: PRECIO UNITARIO MÁS BAJO 🚨**
  - Tu objetivo principal es encontrar la opción MÁS BARATA por unidad de medida (gramo, mililitro, unidad).
  - DEBES realizar cálculos de precio unitario (Precio Total / Cantidad) para todas las opciones encontradas.
  - Selecciona SIEMPRE la opción que ofrezca el menor costo por unidad, independientemente de la marca o si cambia el proveedor (a menos que se indique restricción de proveedor).
  - Si hay un envase "institucional" o de mayor tamaño que ofrezca mejor precio por gramo/ml, elígelo.
  ` : ""
    }

El precio NO se elige al azar ni como simple promedio.
Debes aplicar una lógica de priorización para seleccionar el precio final y la presentación comercial.

### Prioridad por proveedor
    - Los proveedores explícitamente mencionados o sugeridos en el prompt tienen mayor peso.
- Si un proveedor prioritario ofrece un precio razonable(dentro del rango de mercado), ese precio debe preferirse.
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

### Regla de transparencia interna(implícita)
Aunque solo se devuelva un precio final en el JSON, la decisión debe basarse en:
  - comparación real de opciones
    - evaluación de rangos de precios
      - aplicación estricta de prioridades

  ---

## SCORING MATEMÁTICO SIMPLIFICADO(PARA ELEGIR 1 OPCIÓN)

  Objetivo: escoger UNA opción(proveedor + presentación + costo) que maximice un puntaje.

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
  S_i = 60 * pref_i + 35 * (1 - pn_i) - 25 * caro_i

  Decisión:
  - Calcula S_i para todas las opciones.
- Selecciona la opción con mayor S_i.

Regla anti - extremos(opcional):
Si pref_i = 1 y ratio_i ≥ 1.35, solo se elige si no existe una opción no prioritaria con pn_i ≤ 0.25.

---

## ENTRADA  
Yo te enviaré ítems en formato SQL o CSV.

---

## ALCANCE GEOGRÁFICO Y LOGÍSTICO(CRÍTICO)
Busca proveedores que cumplan ESTRICTAMENTE:
  1) Ubicación: Medellín o Área Metropolitana(Valle de Aburrá).
2) Domicilio: deben ofrecer entrega a domicilio.
3) Venta al por menor: deben vender cantidades unitarias requeridas(no solo grandes mayoristas).

---

## FUENTES PREFERIDAS
Prioriza la búsqueda en los siguientes proveedores seleccionados por el usuario:
${providersText}

Si no encuentras el producto en estos proveedores, busca en otros que cumplan el alcance geográfico y logístico.

---

## INSTRUCCIONES DE BÚSQUEDA(POR ÍTEM)
  1) Identifica el producto comercial más adecuado disponible en Medellín, Colombia.
2) Determina el precio de mercado actual aproximado.
3) Identifica la presentación comercial(unidad y cantidad neta).
4) Prioriza opciones estándar y fáciles de reponer.

---

## REGLAS DE FORMATO Y ESTRUCTURA(ITEMSALMACEN)

### 1) STOCK y ALMACENAMIENTO(IMPORTANTE)
Devuélvelos como STRING que contiene JSON serializado(NO como objeto).
- STOCK default: "{\"minimo\":0,\"maximo\":0,\"actual\":0}"
    - ALMACENAMIENTO default: "{\"ALMACENAMIENTO\":\"\",\"BODEGA\":\"\"}"

Si el ítem original ya trae STOCK o ALMACENAMIENTO, consérvalos tal cual a menos que se te pida actualizarlos explícitamente.

### 2) Tipos de datos(RESPETAR)
    - CANTIDAD: String(ej: "500", "1000")
      - COSTO: String(ej: "15000")
        - precioUnitario: Number
          - UNIDADES: String("gr", "ml", "und", "kg", "lb", "un")
            - _id: UUID(MANTENER ESTRICTAMENTE EL ORIGINAL DEL INPUT)
              - Proveedor: UUID o null(MANTENER ESTRICTAMENTE EL ORIGINAL DEL INPUT; PROHIBIDO convertir a texto)

### 3) Integridad
    - NO agregues campos extra(por ejemplo: NO "fuente_precio").
- NO inventes IDs.
- Si un campo no se puede determinar, respeta el valor original del input o usa null / valor por defecto según aplique.

---

## ESTRUCTURA DE SALIDA(OBLIGATORIA)

Devuelve ÚNICAMENTE una lista(Array) de objetos JSON.
Cada objeto debe contener EXACTAMENTE estas claves(sin extras):

  [
    {
      "Nombre_del_producto": "string", // el nombre del producto elegido 
      "CANTIDAD": "string",
      "UNIDADES": "string",
      "COSTO": "string",
      "MARCA": ["string:nombre_de_la_marca"], // si no se puede determinar, se pondra el nombre del almacen o proeveedor
      "_id": "uuid-original-del-input",
      "precioUnitario": 0,
    }
  ]

 

ITEMS A INVESTIGAR:
${itemsList}
  `;

};
export const generateInventoryUpdatePromptLink = (items, selectedProviders = [], allProviders = [], forceSelectedProviders = false, singleProviderReturn = false, forceLowestUnitPrice = false) => {
  const itemsList = items.map(i => {
    // Resolve Provider Name from ID
    const providerName = allProviders.find(p => p._id === i.Proveedor)?.Nombre_Proveedor || 'No asignado';
    return `- ID: ${i._id}
     - Nombre: ${i.Nombre_del_producto}
     - Categoría: ${i.GRUPO}
     - Proveedor Actual: ${providerName}
     - Marca Actual: ${i.MARCA[0]}
     - Costo Actual: ${i.COSTO}
     - Cantidad Actual: ${i.CANTIDAD}`;
  }).join('\n\n');

  const providerNames = selectedProviders.map(p => p.Nombre_Proveedor).join(', ');

  const providersText = selectedProviders.length > 0
    ? selectedProviders.map(p => `- ${p.Nombre_Proveedor} (${p.PAGINA_WEB || "Sin web"})`).join("\n")
    : "No se especificaron proveedores preferidos.";

  return `ACTÚA COMO: Experto en Abastecimiento y Normalización de Datos de Inventario.

TU OBJETIVO:
Extraer información técnica y comercial de los ENLACES (LINKS) proporcionados por el usuario y generar un objeto JSON que respete ESTRICTAMENTE la estructura de la tabla ItemsAlmacen.

---

## FUENTE DE VERDAD
- La información DEBE salir exclusivamente del contenido del enlace proporcionado.
- Si el enlace no contiene precio, intenta inferirlo o usa "0".
- Si el enlace tiene opciones (ej: 500g vs 1kg), selecciona la opción principal o la que mejor coincida con el título del producto si se indica.

---

## REGLAS DE FORMATO Y ESTRUCTURA (CRÍTICO - ItemsAlmacen)

### 1) STOCK y ALMACENAMIENTO (IMPORTANTE)
Devuélvelos como STRING que contiene JSON serializado (NO como objeto).
- STOCK default: "{\\"minimo\\":0,\\"maximo\\":0,\\"actual\\":0}"
- ALMACENAMIENTO default: "{\\"ALMACENAMIENTO\\":\\"\\",\\"BODEGA\\":\\"\\"}"

### 2) Tipos de datos (RESPETAR)
- CANTIDAD: String (ej: "500", "1000") -> Extraer Numérico del peso/volumen.
- UNIDADES: String ("gr", "ml", "und", "kg", "lb", "un")
- COSTO: String (ej: "15000") -> Sin puntos, comas ni símbolos.
- precioUnitario: Number -> (Costo / Cantidad).
- _id: Generar un UUID v4 válido (si no se provee uno en el input).
- Proveedor: UUID o null.
- MARCA: Array de Strings (ej: ["Colanta"]).

### 3) Integridad
- NO agregues campos extra.
- NO inventes IDs si ya vienen dados.

---



INSTRUCCIONES FINALES:
• Dame solo el JSON, listo para copiar.
• No inventes datos que no estén en las reglas.

ITEMS A INVESTIGAR:
${itemsList}



## ESTRUCTURA DE SALIDA (OBLIGATORIA)

Devuelve ÚNICAMENTE una lista (Array) de objetos JSON.
Cada objeto debe contener EXACTAMENTE estas claves:

  [
    {
      "Nombre_del_producto": "string", // el nombre del producto elegido 
      "CANTIDAD": "string",
      "UNIDADES": "string",
      "COSTO": "string",
      "MARCA": ["string:nombre_de_la_marca"],
      "_id": "uuid-original-del-input",
      "precioUnitario": 0,
    }
  ]
Devuelve ÚNICAMENTE el array JSON solicitado.
NO uses markdown.
NO incluyas citas, referencias, contentReference ni texto adicional.

`;

};




