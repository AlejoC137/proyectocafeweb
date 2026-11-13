// ============================================================================
// PANEL FLOTANTE RECOLECTOR PARA ÉXITO (SIN PETICIONES EXTRA)
// ============================================================================
// CÓMO USARLO:
// 1. Abre https://www.exito.com/mercado/despensa en tu navegador.
// 2. Presiona F12 -> "Consola", pega este código y presiona Enter (solo 1 vez).
// 3. Aparecerá un cuadrito flotante abajo a la derecha que captura SOLO
//    cada página por la que vayas pasando (sin copiar ni pegar nada).
// 4. Cuando quieras terminar, haz clic en "⬇ Descargar JSON" y luego
//    ejecuta actualizar_datos.bat.
// ============================================================================

(() => {
  if (window.__exitoPanelActivo) {
    alert("El panel recolector de Éxito ya está activo en la esquina inferior derecha.");
    return;
  }
  window.__exitoPanelActivo = true;

  const STORAGE_KEY = "exito_recolector_productos_v1";
  const cargarGuardados = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return new Map(arr.map((p) => [p.url, p]));
    } catch {
      return new Map();
    }
  };
  const productos = cargarGuardados();
  const guardarStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(productos.values())));
  };

  const limpiarPrecio = (txt) => {
    if (!txt) return 0;
    const nums = String(txt).replace(/[^\d]/g, "");
    return nums ? parseInt(nums, 10) : 0;
  };

  const obtenerTexto = (el) => {
    if (!el) return "";
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const partes = [];
    let node;
    while ((node = w.nextNode())) {
      const t = node.nodeValue.trim();
      if (t) partes.push(t);
    }
    return partes.join("\n");
  };

  const encontrarCard = (a) => {
    let el = a;
    for (let i = 0; i < 7; i++) {
      if (!el.parentElement) break;
      const padre = el.parentElement;
      const linksP = padre.querySelectorAll('a[href*="/p"]').length;
      if (linksP > 3) break; // Ya subimos demasiado (es la grilla completa)
      el = padre;
      if (/\$\s*[\d.]+/.test(el.textContent || "")) {
        // Seguir un nivel más si aún no incluye "Vendido por"
        if (/Vendido por/i.test(el.textContent || "") || i >= 3) return el;
      }
    }
    return a.closest("article, li") || el;
  };

  const capturarPaginaActual = () => {
    const pActual = new URL(window.location.href).searchParams.get("page") || "0";
    const links = Array.from(document.querySelectorAll('a[href*="/p"]'));
    let nuevos = 0;

    for (const a of links) {
      const href = a.getAttribute("href") || "";
      const cleanHref = href.split("?")[0].split("#")[0];
      if (!cleanHref.endsWith("/p")) continue;
      const url = cleanHref.startsWith("http") ? cleanHref : `https://www.exito.com${cleanHref}`;
      if (productos.has(url)) continue;

      const card = encontrarCard(a);
      const texto = obtenerTexto(card);

      let title = (a.getAttribute("title") || "").trim();
      if (!title) {
        const h = card.querySelector("h2, h3, [data-fs-product-card-title], span");
        title = (h?.textContent || a.textContent || "").split("\n")[0].trim();
      }
      title = title.replace(/\((?:Gr|Ml|Cm3|Und|Kg)\s+a\s+\$[^)]+\)/gi, "").trim();
      if (!title || /ver \d+ ofertas/i.test(title)) continue;

      const imgEl = card.querySelector("img");
      const img = imgEl?.getAttribute("src") || imgEl?.getAttribute("data-src") || null;

      const textoSinUnidad = texto.replace(/\([^)]*\$[^)]*\)/g, " ");
      const preciosMatch = [...textoSinUnidad.matchAll(/\$\s*([\d.]+)/g)]
        .map((m) => limpiarPrecio(m[1]))
        .filter((n) => n >= 200);

      if (!preciosMatch.length) continue;
      const price = Math.min(...preciosMatch);
      const maxP = Math.max(...preciosMatch);
      const compare_at_price = maxP > price ? maxP : null;

      const discM = texto.match(/-?\s*(\d{1,2})\s*%/);
      const discount_percent = discM
        ? parseInt(discM[1], 10)
        : compare_at_price
        ? Math.round(((compare_at_price - price) / compare_at_price) * 100)
        : 0;

      const vendM = texto.match(/Vendido por:\s*([^\n]+)/i);
      const vendor = vendM ? vendM[1].trim() : "Exito";

      productos.set(url, {
        title,
        url,
        vendor,
        price,
        compare_at_price,
        discount_percent,
        image: img,
        tags: [`auto_page_${pActual}`],
      });
      nuevos++;
    }

    if (nuevos > 0) guardarStorage();
    return nuevos;
  };

  // Crear panel flotante
  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:999999;background:#111827;color:#fff;padding:12px 14px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.35);font-family:system-ui,sans-serif;font-size:13px;min-width:230px;border:1px solid #374151;";
  panel.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;color:#facc15;">🛒 Recolector Éxito</div>
    <div id="exito-rec-info" style="margin-bottom:10px;line-height:1.4;">Iniciando...</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <button id="exito-rec-cap" style="flex:1;padding:6px 8px;border:0;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;">➕ Capturar</button>
      <button id="exito-rec-dl" style="flex:1;padding:6px 8px;border:0;border-radius:6px;background:#16a34a;color:#fff;cursor:pointer;font-weight:600;">⬇ Descargar</button>
      <button id="exito-rec-clr" style="padding:6px 8px;border:0;border-radius:6px;background:#dc2626;color:#fff;cursor:pointer;" title="Limpiar memoria">🗑</button>
    </div>
  `;
  document.body.appendChild(panel);

  const infoEl = panel.querySelector("#exito-rec-info");
  const actualizarUI = (ultimos = 0) => {
    const p = new URL(window.location.href).searchParams.get("page") || "0";
    infoEl.innerHTML = `Página actual: <b>${p}</b> (+${ultimos} nuevos)<br>Total acumulado: <b>${productos.size}</b> productos`;
  };

  panel.querySelector("#exito-rec-cap").onclick = () => {
    const n = capturarPaginaActual();
    actualizarUI(n);
  };

  panel.querySelector("#exito-rec-dl").onclick = () => {
    const lista = Array.from(productos.values());
    const blob = new Blob([JSON.stringify(lista, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `exito_auto_${lista.length}_productos.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  panel.querySelector("#exito-rec-clr").onclick = () => {
    if (confirm("¿Vaciar los productos acumulados en el navegador?")) {
      productos.clear();
      localStorage.removeItem(STORAGE_KEY);
      actualizarUI(0);
    }
  };

  // Captura inicial y cada vez que cambie la página mientras navegas
  let ultimaUrl = "";
  setInterval(() => {
    const n = capturarPaginaActual();
    if (window.location.href !== ultimaUrl || n > 0) {
      ultimaUrl = window.location.href;
      actualizarUI(n);
    }
  }, 1500);
})();
