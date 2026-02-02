import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearVenta, actualizarVenta, eliminarVenta } from "../../../redux/actions-VentasCompras";
import Pagar from "./Pagar";

// Íconos de lucide-react para acciones en línea de ítems
import { PlusCircle, MinusCircle, XCircle, BookOpen, Save, CreditCard, Trash2 } from 'lucide-react';

/**
 * Componente final para gestionar una mesa, con formato de moneda local,
 * íconos de emoji, y un diseño más robusto y legible.
 * @param {number} index - El número de la mesa.
 * @param {object} ventaActual - La venta existente para esta mesa (o null).
 * @param {function} onVentaChange - Callback para notificar al padre sobre cambios.
 */
function Mesa({ index, ventaActual, onVentaChange }) {
  const [formData, setFormData] = useState({ Cliente: '', Cajero: '' }); // REMOVED Tip
  const [orderItems, setOrderItems] = useState([]);
  const [ventaId, setVentaId] = useState(null);
  const [buttonState, setButtonState] = useState("save"); // 'save', 'syncing', 'done'
  const [showPagarModal, setShowPagarModal] = useState(false);

  const allMenu = useSelector((state) => state.allMenu || []);
  const dispatch = useDispatch();

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
  };

  useEffect(() => {
    if (ventaActual) {
      setFormData({
        Cliente: ventaActual.Cliente || '',
        Cajero: ventaActual.Cajero || '',
      });
      try {
        setOrderItems(JSON.parse(ventaActual.Productos || '[]'));
      } catch (e) {
        console.error("Error parsing Productos JSON:", e);
        setOrderItems([]);
      }
      setVentaId(ventaActual._id);
      setButtonState("done");
    } else {
      setFormData({ Cliente: '', Cajero: '' });
      setOrderItems([]);
      setVentaId(null);
      setButtonState("save");
    }
  }, [ventaActual]);

  const totalPago = useMemo(() => {
    const totalItems = orderItems.reduce((acc, item) => acc + (Number(item.Precio) * Number(item.quantity)), 0);
    return parseFloat(totalItems); // REMOVED Tip addition
  }, [orderItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setButtonState("save");
  };

  const handleOpenMesa = () => {
    setOrderItems([{ id: '', NombreES: '', Precio: 0, quantity: 1, matches: [] }]);
    setButtonState("save");
  };

  const handleAddItem = () => {
    setOrderItems(prev => [...prev, { id: '', NombreES: '', Precio: 0, quantity: 1, matches: [] }]);
    setButtonState("save");
  };

  const handleRemoveItem = (itemIndex) => {
    setOrderItems(prev => prev.filter((_, i) => i !== itemIndex));
    setButtonState("save");
  };

  const handleQuantityChange = (itemIndex, amount) => {
    const updatedItems = orderItems.map((item, i) => {
      if (i === itemIndex) {
        const currentQty = parseFloat(item.quantity) || 0;
        const newQuantity = Math.max(0, currentQty + amount);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setOrderItems(updatedItems);
    setButtonState("save");
  };

  const handleQuantityInputChange = (itemIndex, value) => {
    const updatedItems = orderItems.map((item, i) => {
      if (i === itemIndex) {
        const newQuantity = value === '' ? '' : parseFloat(value);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setOrderItems(updatedItems);
    setButtonState("save");
  };

  const handleIngredientChange = (itemIndex, value) => {
    const updatedItems = [...orderItems];
    updatedItems[itemIndex].NombreES = value;

    const normalizeText = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const matches = value ? allMenu.filter((option) =>
      normalizeText(option.NombreES).includes(normalizeText(value))
    ) : [];
    updatedItems[itemIndex].matches = matches;
    setOrderItems(updatedItems);
    setButtonState("save");
  };

  const handleIngredientSelect = (itemIndex, selectedOption) => {
    const updatedItems = [...orderItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      id: selectedOption._id,
      NombreES: selectedOption.NombreES,
      Precio: selectedOption.Precio,
      Receta: selectedOption.Receta,
      matches: [],
    };
    setOrderItems(updatedItems);
    setButtonState("save");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (buttonState !== 'save' || !window.confirm("¿Confirmar y guardar cambios?")) return;

    setButtonState("syncing");
    const ventaData = {
      ...formData,
      Tip: 0, // Ensure Tip is 0 just in case backend expects it
      Total_Ingreso: totalPago,
      Productos: JSON.stringify(orderItems),
      Mesa: index,
      Pagado: false,
    };

    try {
      if (ventaId) {
        await dispatch(actualizarVenta(ventaId, ventaData));
      } else {
        const nuevaVenta = await dispatch(crearVenta(ventaData));
        setVentaId(nuevaVenta._id);
      }
      setButtonState("done");
      onVentaChange();
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      setButtonState("save");
    }
  };

  const handleEliminar = async () => {
    if (!ventaId || !window.confirm("¿Está seguro de que desea ELIMINAR esta venta? Esta acción no se puede deshacer.")) return;

    try {
      await dispatch(eliminarVenta(ventaId));
      onVentaChange();
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
    }
  };

  const handlePaymentComplete = () => {
    setShowPagarModal(false);
    onVentaChange();
  };

  const handleRecetaClick = (item) => {
    if (item && item.Receta) {
      const url = `/receta/${item.Receta}`;
      window.open(url, '_blank');
    }
  };

  const isMesaInUse = !!ventaActual || orderItems.length > 0;
  // Compact border logic: Orange means "Unsaved changes"
  const cardBorderColor = buttonState === "save" && isMesaInUse ? 'border-orange-500' : 'border-slate-200';

  return (
    <div className={`bg-white  shadow-sm rounded-lg border-2 ${cardBorderColor} flex flex-col transition-all overflow-hidden h-full`}>
      {/* Header Compacto */}
      <div className="px-2 py-1  border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex  border-red-500 items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isMesaInUse ? 'bg-green-500' : 'bg-slate-300'}`}></span>
          <h2 className="text-base font-bold text-slate-700">Mesa {index}</h2>
        </div>
        <div className="w-1/2">
          <Input
            type="text"
            name="Cliente"
            placeholder="Cliente"
            value={formData.Cliente}
            onChange={handleInputChange}
            className="text-xs h-7 px-2"
            disabled={!isMesaInUse}
          />
        </div>
      </div>

      <div className="p-1 flex-grow bg-white relative overflow-y-auto">
        {!isMesaInUse ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-4">
            <Button onClick={handleOpenMesa} size="sm" variant="outline" className="h-8 text-xs">Abrir</Button>
          </div>
        ) : (
          <div className="space-y-1">
            {orderItems.map((item, itemIndex) => (
              <div key={itemIndex} className="flex gap-1 items-center">
                {/* Botón Receta Compacto */}
                <Button
                  onClick={() => handleRecetaClick(item)}
                  className="w-7 h-7 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 p-0 shrink-0"
                  disabled={!item.Receta}
                >
                  <BookOpen size={14} />
                </Button>

                {/* Input Producto con Dropdown */}
                <div className="flex-grow relative min-w-[80px]">
                  <Input
                    type="text"
                    placeholder="..."
                    value={item.NombreES}
                    onChange={(e) => handleIngredientChange(itemIndex, e.target.value)}
                    className="text-sm h-7 px-2 w-full"
                  />
                  {item.matches && item.matches.length > 0 && (
                    <ul className="absolute bg-white border rounded-sm shadow-xl max-h-32 overflow-y-auto z-50 w-full mt-0.5 text-xs">
                      {item.matches.map((match) => (
                        <li key={match._id} onClick={() => handleIngredientSelect(itemIndex, match)} className="p-1.5 hover:bg-slate-100 cursor-pointer border-b border-slate-50 last:border-0">{match.NombreES}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Cantidad Compacta (Solo Input) */}
                <div className="flex items-center">
                  <Input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleQuantityInputChange(itemIndex, e.target.value)}
                    className="w-12 h-7 text-center font-bold text-sm p-0 border-slate-200 focus:border-slate-400"
                  />
                </div>

                {/* Precio Compacto */}
                <span className="w-16 text-right font-medium text-slate-600 text-xs shrink-0 whitespace-nowrap">
                  {formatCurrency(item.Precio * (item.quantity || 1))}
                </span>

                {/* Eliminar Item */}
                <Button onClick={() => handleRemoveItem(itemIndex)} variant="ghost" className="text-red-400 hover:text-red-600 h-7 w-7 p-0 shrink-0"><XCircle size={16} /></Button>
              </div>
            ))}
            <div className="pt-1">
              <Button onClick={handleAddItem} variant="ghost" size="sm" className="w-full h-6 text-xs text-slate-400 border border-dashed border-slate-300 hover:bg-slate-50">+ Item</Button>
            </div>
          </div>
        )}
      </div>

      {isMesaInUse && (
        <div className="px-2 py-1 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          {/* Total Grande */}
          <div className="flex-grow">
            <span className="text-xl font-bold text-slate-800">{formatCurrency(totalPago)}</span>
          </div>

          {/* Botones Acción Footer Compactos */}
          <div className="flex gap-1">
            <Button onClick={handleSubmit} title="Guardar" className="w-9 h-9 bg-blue-500 hover:bg-blue-600 p-0" disabled={buttonState !== 'save'}>
              {buttonState === 'syncing' ? <div className="h-4 w-4 border-2 border-dashed rounded-full animate-spin border-white"></div> : <Save size={18} />}
            </Button>
            <Button onClick={() => setShowPagarModal(true)} title="Pagar" className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 p-0" disabled={buttonState !== 'done'}>
              <CreditCard size={18} />
            </Button>
            <Button onClick={handleEliminar} title="Eliminar" className="w-9 h-9 bg-red-100 hover:bg-red-200 text-red-600 p-0">
              <Trash2 size={18} />
            </Button>
          </div>
        </div>
      )}

      {showPagarModal && (
        <Pagar onClose={() => setShowPagarModal(false)} ventaId={ventaId} total={totalPago} onPaymentComplete={handlePaymentComplete} />
      )}
    </div>
  );
}

export default Mesa;