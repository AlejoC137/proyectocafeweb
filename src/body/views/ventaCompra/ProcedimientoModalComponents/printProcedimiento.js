export const handlePrintProcedimiento = ({
  receta,
  menuItem,
  foto,
  ingredientesAjustados,
  produccionAjustada,
}) => {
  if (!receta) return;
  const processSteps = Array.from({ length: 20 }, (_, i) => receta[`proces${i + 1}`]).filter(Boolean);
  const notes = Array.from({ length: 10 }, (_, i) => receta[`nota${i + 1}`]).filter(Boolean);
  const ingRows = ingredientesAjustados.map(ing =>
    `<tr><td>${ing.nombre}</td><td class="num">${ing.cantidad.toFixed(2)} ${ing.unidades}</td></tr>`
  ).join("");
  const prodRows = produccionAjustada.map(p =>
    `<tr><td>${p.nombre}</td><td class="num">${p.cantidad.toFixed(2)} ${p.unidades}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Procedimiento: ${menuItem?.tittle || receta.legacyName}</title>
<style>
  @page{size:letter;margin:1.5cm 2cm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Georgia',serif;font-size:10.5px;color:#1a1a1a;line-height:1.6}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #475569;padding-bottom:12px;margin-bottom:16px}
  .header-left h1{font-size:22px;color:#1e293b;font-weight:700}
  .badge{display:inline-block;padding:1px 8px;border-radius:10px;font-size:9px;font-weight:700;background:#f1f5f9;color:#475569}
  img{max-width:130px;max-height:130px;border-radius:6px;object-fit:cover}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:4px}
  h2{font-size:9px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin:14px 0 6px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  thead th{background:#f0f4f8;padding:4px 6px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase}
  thead th.num{text-align:right}
  td{padding:3px 6px;border-bottom:1px solid #f8fafc}
  td.num{text-align:right;font-family:monospace}
  .process-step{display:flex;gap:6px;margin-bottom:5px}
  .step-num{font-weight:700;color:#475569;min-width:16px}
  .note-item{padding-left:10px;position:relative;margin-bottom:3px}
  .note-item::before{content:'•';position:absolute;left:0;color:#64748b}
  .footer{margin-top:16px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:8.5px;color:#94a3b8;display:flex;justify-content:space-between}
</style></head><body>
<div class="header">
  <div class="header-left">
    <h1>${menuItem?.tittle || receta.legacyName || "Sin nombre"}</h1>
    <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap">
      ${receta.ProcessTime ? `<span class="badge">⏱ ${receta.ProcessTime} min</span>` : ""}
      ${receta.autor ? `<span class="badge">✍ ${receta.autor}</span>` : ""}
    </div>
  </div>
  ${foto ? `<img src="${foto}" alt="Imagen" />` : ""}
</div>
<div class="grid2">
  <div>
    ${ingRows ? `<h2>Insumos</h2><table><thead><tr><th>Ingrediente</th><th class="num">Cantidad</th></tr></thead><tbody>${ingRows}</tbody></table>` : ""}
    ${prodRows ? `<h2>Producción Interna</h2><table><thead><tr><th>Producto</th><th class="num">Cantidad</th></tr></thead><tbody>${prodRows}</tbody></table>` : ""}
  </div>
  <div>
    ${processSteps.length > 0 ? `<h2>Proceso</h2>${processSteps.map((p, i) => `<div class="process-step"><span class="step-num">${i + 1}.</span><span>${p}</span></div>`).join("")}` : ""}
    ${notes.length > 0 ? `<h2>Notas</h2>${notes.map(n => `<div class="note-item">${n}</div>`).join("")}` : ""}
    ${receta.emplatado ? `<h2>Observaciones Finales</h2><p style="font-size:10px">${receta.emplatado}</p>` : ""}
  </div>
</div>
<div class="footer">
  <span>ID: ${receta._id}</span>
  <span>Generado: ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</span>
</div>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.documentElement.innerHTML = html;
  win.onload = () => { win.focus(); win.print(); };
};
