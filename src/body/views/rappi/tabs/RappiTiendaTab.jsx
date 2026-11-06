import React, { useState, useMemo } from "react";
import { formatCOP, precioRappiEfectivo, CANALES } from "../utils/rappiPricing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

/**
 * Pestaña 3: Mockup conceptual del Clon de Rappi / Tienda Delivery.
 * Muestra cómo se visualizarán los productos indexados en la Pestaña 1
 * en una interfaz de cara al cliente sin sobrecargar lógica de backend.
 */
export function RappiTiendaTab({ menu = [], config }) {
  const [canalActivo, setCanalActivo] = useState("RAPPI");
  const [search, setSearch] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState("TODOS");
  const [mockCarrito, setMockCarrito] = useState([]);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Filtrar productos marcados en la Pestaña 1 para el canal elegido
  const productosIndexados = useMemo(() => {
    return menu.filter((item) => {
      if (item.Estado !== "Activo") return false;
      if (canalActivo === "RAPPI" && !item.RAPPI) return false;
      if (canalActivo === "PROYECTO_1" && !item.PROYECTO_1) return false;
      if (canalActivo === "PROYECTO_2" && !item.PROYECTO_2) return false;
      return true;
    });
  }, [menu, canalActivo]);

  const grupos = useMemo(() => {
    const setG = new Set(productosIndexados.map((p) => p.GRUPO).filter(Boolean));
    return ["TODOS", ...Array.from(setG).sort()];
  }, [productosIndexados]);

  const visibleItems = useMemo(() => {
    return productosIndexados.filter((p) => {
      if (selectedGrupo !== "TODOS" && p.GRUPO !== selectedGrupo) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (p.NombreES || "").toLowerCase().includes(q) ||
          (p.DescripcionMenuES || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [productosIndexados, selectedGrupo, search]);

  const agregarDemo = (item) => {
    const precio = precioRappiEfectivo(item, config);
    setMockCarrito((prev) => {
      const existing = prev.find((x) => x._id === item._id);
      if (existing) {
        return prev.map((x) => (x._id === item._id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { _id: item._id, nombre: item.NombreES, precio, qty: 1 }];
    });
  };

  const totalDemo = mockCarrito.reduce((acc, i) => acc + i.precio * i.qty, 0);

  return (
    <div className="space-y-3">
      {/* Banner Mockup informativo */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white border border-orange-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Mockup: Clon de Rappi / Portal Delivery Proyecto Café
              </h3>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                Vista Previa UI
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Alimentado dinámicamente con los productos indexados en la <b>Pestaña 1</b> y los precios del moderador.
            </p>
          </div>
        </div>

        {/* Selector de Canal para el Mockup */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500">Canal:</span>
          {CANALES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCanalActivo(c.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                canalActivo === c.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame de la App Delivery (Mockup interactivo) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Catálogo de Productos */}
        <div className="lg:col-span-3 space-y-3">
          {/* Header estilo App de Delivery */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
                  ☕
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Proyecto Café Delivery</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Clock className="w-3 h-3" /> 20-35 min
                    </span>
                    <span>•</span>
                    <span>{productosIndexados.length} platillos en carta</span>
                  </div>
                </div>
              </div>

              {/* Buscador */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar en el menú..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
              {grupos.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrupo(g)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all border ${
                    selectedGrupo === g
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {g === "TODOS" ? "🍽️ Todos" : g}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cards tipo Rappi */}
          {visibleItems.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200 text-xs">
              No hay productos indexados a <b>{canalActivo}</b> en esta categoría. Márcalos en la <b>Pestaña 1</b> para que aparezcan aquí.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {visibleItems.map((prod) => {
                const precio = precioRappiEfectivo(prod, config);
                const inCart = mockCarrito.find((x) => x._id === prod._id);

                return (
                  <div
                    key={prod._id}
                    className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="flex gap-2.5">
                      {/* Imagen */}
                      <div className="w-20 h-20 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-100 relative">
                        {prod.Foto ? (
                          <img
                            src={prod.Foto}
                            alt={prod.NombreES}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-slate-400">
                            ☕
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-orange-600 font-bold uppercase block">
                          {prod.GRUPO}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs truncate" title={prod.NombreES}>
                          {prod.NombreES}
                        </h5>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                          {prod.DescripcionMenuES || "Elaboración artesanal fresca con insumos del recetario."}
                        </p>
                      </div>
                    </div>

                    {/* Precio y Acción */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCOP(precio)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => agregarDemo(prod)}
                        className="h-6 text-[10px] px-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-xs"
                      >
                        <Plus className="w-3 h-3 mr-0.5" />
                        {inCart ? `(${inCart.qty}) Añadir` : "Añadir"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Mockup del Carrito / Checkout */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-3 h-fit">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              <h4 className="font-bold text-slate-800 text-xs">Tu Pedido Demo</h4>
            </div>
            {mockCarrito.length > 0 && (
              <button
                onClick={() => setMockCarrito([])}
                className="text-[10px] text-slate-400 hover:text-red-500"
              >
                Vaciar
              </button>
            )}
          </div>

          {mockCarrito.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-1">
              <ShoppingBag className="w-6 h-6 mx-auto opacity-30" />
              <p>Haz clic en "Añadir" en cualquier producto para simular el flujo de pedido.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {mockCarrito.map((it) => (
                  <div key={it._id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                    <span className="truncate max-w-[120px] font-medium text-slate-700">
                      {it.qty}x {it.nombre}
                    </span>
                    <span className="font-bold text-slate-900">{formatCOP(it.precio * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Subtotal:</span>
                  <span>{formatCOP(totalDemo)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Envío:</span>
                  <span className="text-emerald-600 font-bold">Gratis</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-1 border-t border-slate-100">
                  <span>Total:</span>
                  <span className="text-orange-600">{formatCOP(totalDemo)}</span>
                </div>
              </div>

              <Button
                onClick={() => setShowDemoModal(true)}
                className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs mt-2"
              >
                Simular Pedido Rappi
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* Nota técnica */}
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-[10px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">ℹ️ Mockup del clon:</span>
            <p>
              Prototipo visual sin carga de backend adicional para enfocarse en la gestión y análisis financiero de las pestañas 1 y 2.
            </p>
          </div>
        </div>
      </div>

      {/* Modal simulador simple */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 shadow-xl max-w-sm w-full space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">¡Simulación de Pedido Completa!</h4>
            <p className="text-xs text-slate-500">
              Mockup completado exitosamente con los precios y productos indexados.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setShowDemoModal(false);
                setMockCarrito([]);
              }}
              className="w-full bg-slate-900 text-white font-bold h-8 text-xs"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RappiTiendaTab;
