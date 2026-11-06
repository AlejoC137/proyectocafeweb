import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { registrarVentaCanal } from "@/redux/actions-Rappi";
import { formatCOP } from "../utils/rappiPricing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X, ShoppingBag, Loader2 } from "lucide-react";

export function RegistrarVentaRappiModal({
  isOpen,
  onClose,
  menuItems = [],
  config,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemsEnVenta, setItemsEnVenta] = useState([]);
  const [pedidoId, setPedidoId] = useState("");
  const [cliente, setCliente] = useState("Cliente Rappi");
  const [descuento, setDescuento] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const found = menuItems.find((m) => m._id === selectedProductId);
    if (!found) return;

    const precioVenta = found.Precio_Rappi || found.Precio || 0;
    setItemsEnVenta((prev) => [
      ...prev,
      {
        _id: found._id,
        NombreES: found.NombreES,
        Precio: Number(precioVenta),
        quantity: 1,
        Receta: found.Receta || null,
        Foto: found.Foto || null,
      },
    ]);
    setSelectedProductId("");
  };

  const handleQuantityChange = (idx, q) => {
    const qty = Math.max(1, parseInt(q) || 1);
    setItemsEnVenta((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveItem = (idx) => {
    setItemsEnVenta((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = itemsEnVenta.reduce(
    (acc, p) => acc + (Number(p.Precio) || 0) * (Number(p.quantity) || 1),
    0
  );
  const total = Math.max(0, subtotal - (Number(descuento) || 0));

  const handleSave = async () => {
    if (!itemsEnVenta.length) {
      alert("Agrega al menos un producto a la venta.");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        registrarVentaCanal({
          canal: "RAPPI",
          productos: itemsEnVenta,
          pedidoIdExterno: pedidoId || `RAPPI-${Date.now().toString().slice(-6)}`,
          cliente,
          descuentoPromo: Number(descuento) || 0,
          comisionPct: config?.comision_pct ?? 25,
          ivaComisionPct: config?.iva_comision_pct ?? 19,
        })
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al registrar venta de Rappi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-orange-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Registrar Pedido / Venta de Rappi
              </h3>
              <p className="text-[10px] text-slate-500">
                Ingresa los productos recibidos en la tablet de Rappi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                ID Pedido Rappi
              </label>
              <Input
                type="text"
                placeholder="Ej: #94821"
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Cliente / Notas
              </label>
              <Input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Selector de producto */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1.5">
              Agregar Producto del Menú
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 h-8 text-xs border border-input rounded-md px-2 bg-white"
              >
                <option value="">Selecciona un producto...</option>
                {menuItems.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.NombreES} — {formatCOP(m.Precio_Rappi || m.Precio)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                onClick={handleAddProduct}
                disabled={!selectedProductId}
                className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Agregar
              </Button>
            </div>
          </div>

          {/* Lista de productos agregados */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Detalle del Pedido ({itemsEnVenta.length})
            </span>
            {itemsEnVenta.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Aún no has agregado productos a este pedido.
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {itemsEnVenta.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="font-bold text-slate-800 block truncate">
                        {item.NombreES}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatCOP(item.Precio)} c/u
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        className="h-7 w-14 text-center text-xs font-bold"
                      />
                      <span className="font-bold text-slate-900 w-20 text-right">
                        {formatCOP(item.Precio * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Descuentos / Promociones */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-600">Descuento o cupón Rappi ($):</span>
            <Input
              type="number"
              min="0"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              className="h-7 w-28 text-right font-bold text-xs"
            />
          </div>

          {/* Resumen Total */}
          <div className="bg-orange-50/80 p-2.5 rounded-lg border border-orange-200 flex justify-between items-center">
            <span className="font-bold text-slate-700">Total Ingreso Rappi:</span>
            <span className="text-base font-extrabold text-orange-600">
              {formatCOP(total)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="h-8 text-xs">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !itemsEnVenta.length}
            className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Guardar Venta
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RegistrarVentaRappiModal;
