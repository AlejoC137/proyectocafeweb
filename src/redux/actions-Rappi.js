/**
 * Acciones del dominio Rappi / Canales de venta.
 * Las tablas y columnas se crean con:
 *   - src/supaBaseRows/alter_menu_add_canales.sql   (Menu.RAPPI, PROYECTO_1, PROYECTO_2, Precio_Rappi, Rappi_Info)
 *   - src/supaBaseRows/alter_ventas_add_canal.sql   (Ventas.Canal, Canal_Info)
 *   - src/supaBaseRows/create_rappi_config.sql      (RappiConfig)
 *   - src/supaBaseRows/create_pedidos_canal.sql     (PedidosCanal)
 *
 * Los thunks devuelven los datos directamente (estado local en los componentes)
 * para no acoplar el legacyReducer.
 */
import supabase from "../config/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { getAllFromTable, updateItem } from "./actions";
import { MENU, RAPPI_CONFIG, PEDIDOS_CANAL, CANAL_RAPPI } from "./actions-types";

export const DEFAULT_RAPPI_CONFIG = {
  canal: CANAL_RAPPI,
  aumento_pct: 25,
  redondeo: 100,
  comision_pct: 25,
  iva_comision_pct: 19,
  costo_envio: 0,
};

const LS_CONFIG_KEY = "rappiConfig_fallback";

const missingTable = (error) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|Could not find the table/i.test(error.message || ""));

const missingColumn = (error, col) =>
  !!error && new RegExp(col, "i").test(error.message || "") && /column|schema cache/i.test(error.message || "");

// ---------------------------------------------------------------------------
// Configuración del moderador
// ---------------------------------------------------------------------------
export function getRappiConfig(canal = CANAL_RAPPI) {
  return async () => {
    const { data, error } = await supabase.from(RAPPI_CONFIG).select("*").eq("canal", canal).maybeSingle();
    if (error || !data) {
      if (error && !missingTable(error)) console.error("Error leyendo RappiConfig:", error);
      try {
        const local = JSON.parse(localStorage.getItem(`${LS_CONFIG_KEY}_${canal}`) || "null");
        return { ...DEFAULT_RAPPI_CONFIG, canal, ...(local || {}), _fallback: !!error };
      } catch {
        return { ...DEFAULT_RAPPI_CONFIG, canal, _fallback: !!error };
      }
    }
    return { ...DEFAULT_RAPPI_CONFIG, ...data };
  };
}

export function updateRappiConfig(cfg, actualizadoPor = null) {
  return async () => {
    const { _fallback, ...clean } = cfg;
    const payload = {
      ...clean,
      aumento_pct: Number(clean.aumento_pct) || 0,
      redondeo: Number(clean.redondeo) || 1,
      comision_pct: Number(clean.comision_pct) || 0,
      iva_comision_pct: Number(clean.iva_comision_pct) || 0,
      costo_envio: Number(clean.costo_envio) || 0,
      actualizado: new Date().toISOString(),
      actualizado_por: actualizadoPor,
    };
    localStorage.setItem(`${LS_CONFIG_KEY}_${payload.canal}`, JSON.stringify(payload));
    const { data, error } = await supabase.from(RAPPI_CONFIG).upsert(payload, { onConflict: "canal" }).select();
    if (error) {
      console.warn("⚠️ No se pudo guardar RappiConfig en Supabase (guardado local). Ejecuta create_rappi_config.sql.", error);
      return { ...payload, _fallback: true };
    }
    return data?.[0] || payload;
  };
}

// ---------------------------------------------------------------------------
// Banderas de canal y precios Rappi sobre Menu
// ---------------------------------------------------------------------------
export function bulkUpdateMenu(ids = [], fields = {}, auditOrigen = "Rappi") {
  return async (dispatch) => {
    const results = [];
    for (const id of ids) {
      // updateItem registra historial_update automáticamente para Menu
      const r = await dispatch(updateItem(id, fields, MENU, { origen: auditOrigen, tipo: "canal" }));
      results.push(r);
    }
    await dispatch(getAllFromTable(MENU));
    const fallidos = results.filter((r) => !r).length;
    if (fallidos > 0) {
      console.warn(`⚠️ ${fallidos} productos no se actualizaron. ¿Ejecutaste alter_menu_add_canales.sql?`);
    }
    return { ok: results.length - fallidos, fallidos };
  };
}

export function toggleCanalProducto(menuId, campo, valor) {
  return bulkUpdateMenu([menuId], { [campo]: valor }, `Canales (${campo})`);
}

/**
 * Fija precios Rappi. `preciosById` = { [menuId]: precio | null }
 */
export function aplicarPreciosRappi(preciosById = {}) {
  return async (dispatch) => {
    let ok = 0;
    let fallidos = 0;
    for (const [id, precio] of Object.entries(preciosById)) {
      const r = await dispatch(
        updateItem(id, { Precio_Rappi: precio === null ? null : Math.round(precio) }, MENU, {
          origen: "Rappi (Moderador de precios)",
          tipo: "precio_rappi",
        })
      );
      if (r) ok++;
      else fallidos++;
    }
    await dispatch(getAllFromTable(MENU));
    return { ok, fallidos };
  };
}

// ---------------------------------------------------------------------------
// Ventas por canal
// ---------------------------------------------------------------------------
const parsePagoInfo = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

export const esVentaDeCanal = (venta, canal = CANAL_RAPPI) => {
  if (venta?.Canal) return venta.Canal === canal;
  // Compatibilidad: ventas sin columna Canal pagadas con método "Rappi"
  if (canal === CANAL_RAPPI) return parsePagoInfo(venta?.Pago_Info)?.metodo === "Rappi";
  return false;
};

async function fetchAllPaginated(buildQuery) {
  let all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const from = page * pageSize;
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: all, error };
    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
    page++;
  }
  return { data: all, error: null };
}

export function getVentasPorCanal(canal = CANAL_RAPPI) {
  return async () => {
    let { data, error } = await fetchAllPaginated(() => supabase.from("Ventas").select("*").eq("Canal", canal));

    let ventas = data || [];
    if (error && missingColumn(error, "Canal")) {
      console.warn("⚠️ La columna Ventas.Canal no existe. Filtrando por método de pago. Ejecuta alter_ventas_add_canal.sql.");
      const res = await fetchAllPaginated(() => supabase.from("Ventas").select("*"));
      ventas = (res.data || []).filter((v) => esVentaDeCanal(v, canal));
    } else if (error) {
      console.error("Error obteniendo ventas por canal:", error);
    } else if (canal === CANAL_RAPPI) {
      // Incluir ventas antiguas pagadas con método Rappi que aún quedaron como LOCAL
      const { data: legacy } = await fetchAllPaginated(() =>
        supabase.from("Ventas").select("*").ilike("Pago_Info", '%"metodo":"Rappi"%')
      );
      const ids = new Set(ventas.map((v) => v._id));
      (legacy || []).forEach((v) => {
        if (!ids.has(v._id)) ventas.push(v);
      });
    }
    return ventas;
  };
}

/**
 * Registra manualmente una venta de un canal externo (ej. pedido recibido en la tablet de Rappi).
 * venta = { productos: [{_id, NombreES, Precio, quantity, Receta, Foto}], fecha: Date, pedidoIdExterno, descuentoPromo, comisionPct, ivaComisionPct, canal }
 */
export function registrarVentaCanal(venta) {
  return async () => {
    const fecha = venta.fecha ? new Date(venta.fecha) : new Date();
    const ADate = fecha.toLocaleDateString("en-US", { timeZone: "America/Bogota" });
    const ATime = fecha.toLocaleTimeString("en-US", { timeZone: "America/Bogota" });
    const canal = venta.canal || CANAL_RAPPI;

    const bruto = venta.productos.reduce((acc, p) => acc + Number(p.Precio || 0) * Number(p.quantity || 0), 0);
    const descuento = Number(venta.descuentoPromo || 0);
    const total = Math.max(0, bruto - descuento);
    const comisionValor = Math.round(total * (Number(venta.comisionPct || 0) / 100) * (1 + Number(venta.ivaComisionPct || 0) / 100));

    const metodo = canal === CANAL_RAPPI ? "Rappi" : canal;
    const row = {
      _id: uuidv4(),
      Date: ADate,
      Time: ATime,
      Total_Ingreso: total,
      Productos: venta.productos, // se envía como objeto (compatible con columnas text o jsonb)
      Cliente: venta.cliente || metodo,
      Pagado: true,
      Cajero: venta.cajero || null,
      Mesa: venta.mesa || 900, // Mesa >= 100: no ocupa mesas físicas en VentaCompra
      Pago_Info: { metodo, hora: fecha.toISOString(), recibido: 0, entregado: 0 },
      Canal: canal,
      Canal_Info: {
        pedidoIdExterno: venta.pedidoIdExterno || null,
        comisionPct: Number(venta.comisionPct || 0),
        ivaComision: Number(venta.ivaComisionPct || 0),
        comisionValor,
        descuentoPromo: descuento,
        costoEnvio: Number(venta.costoEnvio || 0),
        netoRecibido: total - comisionValor,
      },
    };

    let { data, error } = await supabase.from("Ventas").insert([row]).select();
    if (error && (missingColumn(error, "Canal") || missingColumn(error, "Canal_Info"))) {
      console.warn("⚠️ Columnas Canal/Canal_Info no existen en Ventas. Guardando sin ellas.");
      const { Canal, Canal_Info, ...rest } = row;
      ({ data, error } = await supabase.from("Ventas").insert([rest]).select());
    }
    if (error) {
      console.error("Error registrando venta de canal:", error);
      throw error;
    }
    return data?.[0];
  };
}

// ---------------------------------------------------------------------------
// Pedidos de la tienda propia (clon tipo Rappi)
// ---------------------------------------------------------------------------
export const ESTADOS_PEDIDO = ["NUEVO", "ACEPTADO", "EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO"];

export function getPedidosCanal({ soloActivos = false } = {}) {
  return async () => {
    let q = supabase.from(PEDIDOS_CANAL).select("*").order("created_at", { ascending: false }).limit(300);
    if (soloActivos) q = q.not("estado", "in", "(ENTREGADO,CANCELADO)");
    const { data, error } = await q;
    if (error) {
      if (missingTable(error)) {
        return { pedidos: [], missingTable: true };
      }
      console.error("Error obteniendo pedidos:", error);
      return { pedidos: [], error };
    }
    return { pedidos: data || [] };
  };
}

export function crearPedidoCanal(pedido) {
  return async () => {
    const row = {
      _id: uuidv4(),
      canal: pedido.canal || CANAL_RAPPI,
      cliente: pedido.cliente,
      productos: pedido.productos,
      subtotal: pedido.subtotal,
      envio: pedido.envio || 0,
      total: pedido.total,
      metodo_pago: pedido.metodo_pago || null,
      estado: "NUEVO",
      historial_estados: [{ estado: "NUEVO", fecha: new Date().toISOString(), por: pedido.creadoPor || "cliente" }],
    };
    const { data, error } = await supabase.from(PEDIDOS_CANAL).insert([row]).select();
    if (error) {
      console.error("Error creando pedido:", error);
      throw error;
    }
    return data?.[0];
  };
}

export function actualizarEstadoPedido(pedido, nuevoEstado, por = null) {
  return async (dispatch) => {
    const historial = Array.isArray(pedido.historial_estados) ? pedido.historial_estados : [];
    const payload = {
      estado: nuevoEstado,
      historial_estados: [...historial, { estado: nuevoEstado, fecha: new Date().toISOString(), por }],
    };

    // Al entregar se convierte en una venta del canal correspondiente
    if (nuevoEstado === "ENTREGADO" && !pedido.venta_id) {
      const venta = await dispatch(convertirPedidoEnVenta(pedido));
      if (venta?._id) payload.venta_id = venta._id;
    }

    const { data, error } = await supabase.from(PEDIDOS_CANAL).update(payload).eq("_id", pedido._id).select();
    if (error) {
      console.error("Error actualizando estado del pedido:", error);
      throw error;
    }
    return data?.[0];
  };
}

export function convertirPedidoEnVenta(pedido, config = null) {
  return async (dispatch) => {
    return dispatch(
      registrarVentaCanal({
        canal: pedido.canal,
        productos: pedido.productos,
        cliente: pedido.cliente?.nombre,
        pedidoIdExterno: pedido._id,
        costoEnvio: pedido.envio,
        comisionPct: config?.comision_pct ?? 0, // tienda propia: sin comisión por defecto
        ivaComisionPct: config?.iva_comision_pct ?? 0,
        mesa: 901,
      })
    );
  };
}
