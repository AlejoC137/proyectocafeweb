/**
 * Exportación a Excel del menú por canal y del análisis financiero.
 * `xlsx` se importa dinámicamente para no inflar el bundle inicial.
 */
const fecha = () => new Date().toISOString().split("T")[0];

const autoWidth = (rows) => {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((k) => ({
    wch: Math.min(60, Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2),
  }));
};

const appendSheet = (XLSX, wb, rows, name) => {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "Sin datos" }]);
  ws["!cols"] = autoWidth(rows);
  XLSX.utils.book_append_sheet(wb, ws, name);
};

/**
 * @param {Array} filas - filas de analizarProducto()
 * @param {object} cfg - RappiConfig
 * @param {string} canalLabel - nombre del canal para el archivo
 */
export async function exportMenuExcel(filas, cfg, canalLabel = "Rappi") {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // Hoja 1: formato para cargar en el portal del canal
  const menuCanal = filas.map((f) => ({
    SKU: f.id,
    Categoria: f.grupo || "",
    Subcategoria: f.subGrupo || "",
    Nombre: f.nombre || "",
    Descripcion: f.descripcion || "",
    Precio: Math.round(f.precioRappi),
    Foto: f.foto || "",
    Disponible: f.estado === "Activo" ? "SI" : "NO",
  }));
  appendSheet(XLSX, wb, menuCanal, `Menu ${canalLabel}`.slice(0, 31));

  // Hoja 2: análisis interno
  const interno = filas.map((f) => ({
    Nombre: f.nombre,
    Grupo: f.grupo || "",
    Subgrupo: f.subGrupo || "",
    "Precio Local": Math.round(f.precioLocal),
    [`Precio ${canalLabel}`]: Math.round(f.precioRappi),
    "Tipo Precio": f.precioManual ? "Manual" : "Auto",
    "Diferencia %": Number(f.diferenciaPct.toFixed(1)),
    "Costo (CMP+CMO)": Math.round(f.costo),
    Comision: Math.round(f.comision),
    Neto: Math.round(f.neto),
    "Ganancia Local": Math.round(f.gananciaLocal),
    [`Ganancia ${canalLabel}`]: Math.round(f.gananciaRappi),
    "Margen Local %": Number(f.margenLocal.toFixed(1)),
    [`Margen ${canalLabel} %`]: Number(f.margenRappi.toFixed(1)),
    "Tiene Receta": f.tieneReceta ? "SI" : "NO",
  }));
  appendSheet(XLSX, wb, interno, "Interno");

  // Hoja 3: configuración
  appendSheet(
    XLSX,
    wb,
    [
      { Parametro: "Canal", Valor: canalLabel },
      { Parametro: "Aumento %", Valor: cfg?.aumento_pct },
      { Parametro: "Redondeo", Valor: cfg?.redondeo },
      { Parametro: "Comisión %", Valor: cfg?.comision_pct },
      { Parametro: "IVA sobre comisión %", Valor: cfg?.iva_comision_pct },
      { Parametro: "Productos exportados", Valor: filas.length },
      { Parametro: "Fecha exportación", Valor: new Date().toLocaleString("es-CO") },
    ],
    "Config"
  );

  XLSX.writeFile(wb, `menu_${canalLabel.toLowerCase().replace(/\s+/g, "_")}_${fecha()}.xlsx`);
}

/** Exporta el análisis financiero de ventas (pestaña 2). */
export async function exportAnalisisExcel({ kpis, productos, ventas, periodoLabel }) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  appendSheet(
    XLSX,
    wb,
    Object.entries(kpis).map(([k, v]) => ({ Indicador: k, Valor: typeof v === "number" ? Math.round(v * 100) / 100 : v })),
    "Resumen"
  );
  appendSheet(
    XLSX,
    wb,
    productos.map((p) => ({
      Producto: p.nombre,
      Unidades: p.unidades,
      "Ingreso Bruto": Math.round(p.bruto),
      Comision: Math.round(p.comision),
      Neto: Math.round(p.neto),
      "Costo Unitario": Math.round(p.costoUnit),
      "Costo Total": Math.round(p.costoTotal),
      Ganancia: Math.round(p.ganancia),
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
      Total: Math.round(v.total),
      Comision: Math.round(v.comision),
      Neto: Math.round(v.neto),
      Costo: Math.round(v.costo),
      Ganancia: Math.round(v.ganancia),
    })),
    "Ventas"
  );

  XLSX.writeFile(wb, `analisis_rappi_${(periodoLabel || fecha()).replace(/[^\w-]+/g, "_")}.xlsx`);
}
