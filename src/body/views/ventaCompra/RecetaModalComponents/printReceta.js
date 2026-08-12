export const handlePrintReceta = ({
  receta,
  foto,
  ingredientesAjustados,
  produccionAjustada,
  calculoDetalles,
  precioVentaFinal,
  costoProduccion,
  recetaSource,
  formatCurrency,
}) => {
  if (!receta) return;
  const rendimientoData = receta.rendimiento ? (() => { try { return JSON.parse(receta.rendimiento); } catch { return null; } })() : null;
  const processSteps = Array.from({ length: 20 }, (_, i) => receta[`proces${i + 1}`]).filter(Boolean);
  const notes = Array.from({ length: 10 }, (_, i) => receta[`nota${i + 1}`]).filter(Boolean);

  const ingRows = ingredientesAjustados.map(ing =>
    `<tr><td>${ing.nombre}</td><td class="num">${ing.cantidad.toFixed(2)} ${ing.unidades}</td><td class="num">${formatCurrency(ing.cantidad * ing.precioUnitario)}</td></tr>`
  ).join("");
  const prodRows = produccionAjustada.map(p =>
    `<tr><td>${p.nombre}</td><td class="num">${p.cantidad.toFixed(2)} ${p.unidades}</td><td class="num">${formatCurrency(p.cantidad * p.precioUnitario)}</td></tr>`
  ).join("");

  const emplatadoHtml = (() => {
    try {
      const steps = JSON.parse(receta.emplatado || "");
      if (Array.isArray(steps)) return steps.map((s, i) => `<p><strong>${i + 1}.</strong> ${s.proceso}</p>`).join("");
    } catch { }
    return `<p>${receta.emplatado || ""}</p>`;
  })();

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receta: ${receta.legacyName}</title>
<style>
  @page{size:letter;margin:1.5cm 2cm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Georgia',serif;font-size:12px;color:#1a1a1a;line-height:1.6}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px}
  .header-left h1{font-size:25px;color:#1d4ed8;font-weight:700;letter-spacing:-0.3px}
  .badges{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
  .badge-blue{background:#dbeafe;color:#1d4ed8}
  .badge-gray{background:#f1f5f9;color:#475569}
  img{max-width:150px;max-height:150px;border-radius:6px;object-fit:cover}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:4px}
  h2{font-size:10.5px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin:16px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  thead th{background:#f0f4f8;padding:5px 7px;text-align:left;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
  thead th.num{text-align:right}
  td{padding:4px 7px;border-bottom:1px solid #f8fafc}
  td.num{text-align:right;font-family:monospace}
  .total-row td{background:#eff6ff;font-weight:700;font-size:12.5px}
  .process-step{display:flex;gap:8px;margin-bottom:6px}
  .step-num{font-weight:700;color:#1d4ed8;min-width:20px}
  .note-item{padding-left:12px;position:relative;margin-bottom:4px}
  .note-item::before{content:'•';position:absolute;left:0;color:#64748b}
  .footer{margin-top:20px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
  .cost-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:10px}
  .cost-box-label{font-size:10.5px;font-weight:700;text-transform:uppercase;color:#1d4ed8}
  .cost-box-value{font-size:16px;font-weight:700;color:#1d4ed8}
</style></head><body>
<div class="header">
  <div class="header-left">
    <h1>${receta.legacyName || "Sin nombre"}</h1>
    <div class="badges">
      ${rendimientoData ? `<span class="badge badge-blue">👥 ${rendimientoData.porcion || 1} porción(es) · ${rendimientoData.cantidad} ${rendimientoData.unidades}</span>` : ""}
      ${receta.ProcessTime ? `<span class="badge badge-gray">⏱ ${receta.ProcessTime} min</span>` : ""}
      ${receta.autor ? `<span class="badge badge-gray">👨‍🍳 ${receta.autor}</span>` : ""}
    </div>
  </div>
  ${foto ? `<img src="${foto}" alt="Foto del plato" />` : ""}
</div>

<div class="grid2">
  <div>
    ${ingRows ? `<h2>Ingredientes</h2><table><thead><tr><th>Ingrediente</th><th class="num">Cantidad</th><th class="num">Costo</th></tr></thead><tbody>${ingRows}</tbody></table>` : ""}
    ${prodRows ? `<h2>Producción Interna</h2><table><thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Costo</th></tr></thead><tbody>${prodRows}</tbody></table>` : ""}
    ${calculoDetalles ? `
    <h2>Análisis de Costos</h2>
    <table><tbody>
      <tr><td>%CMP Establecido</td><td class="num">${calculoDetalles.pCMPInicial}%</td></tr>
      <tr><td>%CMP Real</td><td class="num">${calculoDetalles.pCMPReal}%</td></tr>
      <tr><td>Valor CMP</td><td class="num">${formatCurrency(calculoDetalles.vCMP)}</td></tr>
      <tr><td>Mano de Obra</td><td class="num">${formatCurrency(calculoDetalles.vCMO)}</td></tr>
      <tr><td>Utilidad Bruta</td><td class="num">${formatCurrency(calculoDetalles.vIB)}</td></tr>
    </tbody></table>
    <div class="cost-box"><span class="cost-box-label">Precio de Venta</span><span class="cost-box-value">${formatCurrency(precioVentaFinal)}</span></div>
    ` : recetaSource === "RecetasProduccion" ? `
    <div class="cost-box"><span class="cost-box-label">Costo de Producción</span><span class="cost-box-value">${formatCurrency(costoProduccion)}</span></div>
    ` : ""}
  </div>
  <div>
    ${processSteps.length > 0 ? `<h2>Proceso de Preparación</h2>${processSteps.map((p, i) => `<div class="process-step"><span class="step-num">${i + 1}.</span><span>${p}</span></div>`).join("")}` : ""}
    ${notes.length > 0 ? `<h2>Notas del Chef</h2>${notes.map(n => `<div class="note-item">${n}</div>`).join("")}` : ""}
    ${receta.emplatado ? `<h2>Emplatado</h2>${emplatadoHtml}` : ""}
  </div>
</div>

<div class="footer">
  <span>ID Receta: ${receta._id}</span>
  <span>Generado: ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</span>
</div>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.documentElement.innerHTML = html;
  win.onload = () => { win.focus(); win.print(); };
};
