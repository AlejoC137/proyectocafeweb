ACTÚA COMO: Arquitecto de Base de Datos e Inventario.

CONTEXTO: Acabamos de generar un JSON de "Receta de Producción". Ahora necesito crear el objeto correspondiente para la tabla de inventario "ProduccionInterna".

TU TAREA: Generar un único objeto JSON basado en el esquema de `ProduccionInterna_rows.csv` que represente el producto terminado de la receta anterior.

REGLAS DE MAPEO (IMPORTANTE):
1. "Nombre_del_producto": Debe ser IDÉNTICO al "legacyName" de la receta generada.
2. "CANTIDAD": Extrae SOLO el valor numérico del campo "rendimiento" de la receta.
3. "UNIDADES": Extrae la unidad (gr, ml, etc.) del campo "rendimiento".
4. "Receta": Déjalo estrictamente como null (La relación se hará manualmente).
5. "GRUPO": Infiérelo basado en el tipo de producto (ej: SALSAS, PROTEINAS, PRE-PRODUCCION, MASAS).
6. "STOCK": Usa estrictamente este string JSON por defecto: "{\"minimo\":0,\"maximo\":0,\"actual\":0}"
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
  "STOCK": "{\"minimo\":0,\"maximo\":0,\"actual\":0}",
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