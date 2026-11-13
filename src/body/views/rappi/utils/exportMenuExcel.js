/**
 * Exportación a Excel del menú por canal y del análisis financiero.
 * Refleja exactamente la tabla visual de la página y destaca claramente
 * los productos pertenecientes a Proyecto 1 y Proyecto 2.
 * `xlsx` se importa dinámicamente para no inflar el bundle inicial.
 */
const fecha = () => new Date().toISOString().split("T")[0];

const autoWidth = (rows) => {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((k) => ({
    wch: Math.min(60, Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 3),
  }));
};

const appendSheet = (XLSX, wb, rows, name) => {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "Sin datos disponibles" }]);
  ws["!cols"] = autoWidth(rows.length ? rows : [{ Info: "Sin datos disponibles" }]);
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
};

/** Mapea una fila de analizarProducto() al formato exacto de la tabla de la página */
const mapFilaTablaVisual = (f, canalLabel = "Rappi") => {
  const canalesTexto = [
    f.RAPPI ? "Rappi" : null,
    f.PROYECTO_1 ? "Proyecto 1" : null,
    f.PROYECTO_2 ? "Proyecto 2" : null,
  ]
    .filter(Boolean)
    .join(" + ") || "Sin indexar";

  return {
    "Producto": f.nombre || "",
    "Grupo": f.grupo || "",
    "Subgrupo": f.subGrupo || "",
    "Rappi": f.RAPPI ? "SÍ" : "NO",
    "Proyecto 1": f.PROYECTO_1 ? "SÍ" : "NO",
    "Proyecto 2": f.PROYECTO_2 ? "SÍ" : "NO",
    "Canales Asignados": canalesTexto,
    "P. Local": Math.round(f.precioLocal || 0),
    [`P. ${canalLabel}`]: Math.round(f.precioRappi || 0),
    "Tipo Precio": f.precioManual ? "Manual" : "Auto",
    "Dif. %": Number((f.diferenciaPct || 0).toFixed(1)),
    "Costo (CMP+CMO)": Math.round(f.costo || 0),
    [`Neto ${canalLabel}`]: Math.round(f.neto || 0),
    [`Ganancia ${canalLabel}`]: Math.round(f.gananciaRappi || 0),
    "Margen %": Number((f.margenRappi || 0).toFixed(1)),
    "Tiene Receta": f.tieneReceta ? "SÍ" : "NO",
    "Estado": f.estado || "Activo",
  };
};

/**
 * @param {Array} filas - filas de analizarProducto()
 * @param {object} cfg - RappiConfig
 * @param {string} canalLabel - nombre del canal para el archivo
 */
export async function exportMenuExcel(filas, cfg, canalLabel = "Rappi") {
  const xlsxModule = await import("xlsx");
  const XLSX = xlsxModule.default || xlsxModule;
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------------------
  // Hoja 1: TABLA PRINCIPAL (Idéntica a la tabla visual que ve el usuario)
  // -------------------------------------------------------------------------
  const tablaPrincipal = filas.map((f) => mapFilaTablaVisual(f, canalLabel));
  appendSheet(XLSX, wb, tablaPrincipal, "Catálogo y Precios");

  // -------------------------------------------------------------------------
  // Hoja 2: SOLO PROYECTO 1 (Filtrada exclusivamente para Proyecto 1)
  // -------------------------------------------------------------------------
  const filasP1 = filas.filter((f) => f.PROYECTO_1);
  const tablaP1 = filasP1.map((f) => mapFilaTablaVisual(f, "P1"));
  appendSheet(
    XLSX,
    wb,
    tablaP1.length
      ? tablaP1
      : [{ Info: "No hay productos marcados en Proyecto 1 actualmente" }],
    "Solo Proyecto 1"
  );

  // -------------------------------------------------------------------------
  // Hoja 3: SOLO PROYECTO 2 (Filtrada exclusivamente para Proyecto 2)
  // -------------------------------------------------------------------------
  const filasP2 = filas.filter((f) => f.PROYECTO_2);
  const tablaP2 = filasP2.map((f) => mapFilaTablaVisual(f, "P2"));
  appendSheet(
    XLSX,
    wb,
    tablaP2.length
      ? tablaP2
      : [{ Info: "No hay productos marcados en Proyecto 2 actualmente" }],
    "Solo Proyecto 2"
  );

  // -------------------------------------------------------------------------
  // Hoja 4: PORTAL RAPPI (Formato de carga para portales aliados)
  // -------------------------------------------------------------------------
  const menuPortal = filas.map((f) => ({
    SKU: f.id,
    Categoria: f.grupo || "",
    Subcategoria: f.subGrupo || "",
    Nombre: f.nombre || "",
    Descripcion: f.descripcion || "",
    Precio: Math.round(f.precioRappi || 0),
    "En Rappi": f.RAPPI ? "SÍ" : "NO",
    "En Proyecto 1": f.PROYECTO_1 ? "SÍ" : "NO",
    "En Proyecto 2": f.PROYECTO_2 ? "SÍ" : "NO",
    Foto: f.foto || "",
    Disponible: f.estado === "Activo" ? "SÍ" : "NO",
  }));
  appendSheet(XLSX, wb, menuPortal, "Portal Rappi");

  // -------------------------------------------------------------------------
  // Hoja 5: RESUMEN Y CONFIGURACIÓN DEL MODERADOR
  // -------------------------------------------------------------------------
  const totalRappi = filas.filter((f) => f.RAPPI).length;
  const totalP1 = filas.filter((f) => f.PROYECTO_1).length;
  const totalP2 = filas.filter((f) => f.PROYECTO_2).length;

  appendSheet(
    XLSX,
    wb,
    [
      { Parametro: "Canal Seleccionado", Valor: canalLabel },
      { Parametro: "Total Productos Exportados", Valor: filas.length },
      { Parametro: "Total Indexados a Rappi", Valor: totalRappi },
      { Parametro: "Total en Proyecto 1", Valor: totalP1 },
      { Parametro: "Total en Proyecto 2", Valor: totalP2 },
      { Parametro: "Aumento % Configurado", Valor: `${cfg?.aumento_pct || 25}%` },
      { Parametro: "Múltiplo de Redondeo", Valor: `$ ${cfg?.redondeo || 100}` },
      { Parametro: "Comisión Rappi %", Valor: `${cfg?.comision_pct || 25}%` },
      { Parametro: "IVA sobre Comisión %", Valor: `${cfg?.iva_comision_pct || 19}%` },
      { Parametro: "Fecha y Hora de Exportación", Valor: new Date().toLocaleString("es-CO") },
    ],
    "Configuración"
  );

  XLSX.writeFile(wb, `menu_${canalLabel.toLowerCase().replace(/\s+/g, "_")}_${fecha()}.xlsx`);
}

/** Exporta el análisis financiero de ventas (pestaña 2). */
export async function exportAnalisisExcel({ kpis, productos, ventas, periodoLabel }) {
  const xlsxModule = await import("xlsx");
  const XLSX = xlsxModule.default || xlsxModule;
  const wb = XLSX.utils.book_new();

  appendSheet(
    XLSX,
    wb,
    Object.entries(kpis).map(([k, v]) => ({
      Indicador: k,
      Valor: typeof v === "number" ? Math.round(v * 100) / 100 : v,
    })),
    "Resumen Financiero"
  );

  appendSheet(
    XLSX,
    wb,
    productos.map((p) => ({
      Producto: p.nombre,
      Unidades: p.unidades,
      "Ingreso Bruto": Math.round(p.bruto),
      "Comisión Rappi": Math.round(p.comision),
      "Neto Recibido": Math.round(p.neto),
      "Costo Unitario": Math.round(p.costoUnit),
      "Costo Total Producción": Math.round(p.costoTotal),
      "Ganancia Neta": Math.round(p.ganancia),
      "Margen %": Number(p.margen.toFixed(1)),
    })),
    "Por Producto"
  );

  appendSheet(
    XLSX,
    wb,
    ventas.map((v) => ({
      Fecha: v.fecha,
      Hora: v.hora,
      Pedido: v.pedido || "",
      Productos: v.resumen,
      "Total Bruto": Math.round(v.total),
      "Comisión": Math.round(v.comision),
      "Neto": Math.round(v.neto),
      "Costo Producción": Math.round(v.costo),
      "Ganancia Neta": Math.round(v.ganancia),
    })),
    "Historial Ventas"
  );

  XLSX.writeFile(wb, `analisis_rappi_${(periodoLabel || fecha()).replace(/[^\w-]+/g, "_")}.xlsx`);
}
