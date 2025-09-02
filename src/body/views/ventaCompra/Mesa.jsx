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
  const [formData, setFormData] = useState({ Cliente: '', Cajero: '', Tip: '0' });
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
        Tip: ventaActual.Tip || '0',
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
      setFormData({ Cliente: '', Cajero: '', Tip: '0' });
      setOrderItems([]);
      setVentaId(null);
      setButtonState("save");
    }
  }, [ventaActual]);

  const totalPago = useMemo(() => {
    const totalItems = orderItems.reduce((acc, item) => acc + (Number(item.Precio) * Number(item.quantity)), 0);
    return (parseFloat(totalItems) + parseFloat(formData.Tip || 0));
  }, [orderItems, formData.Tip]);

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
        const newQuantity = Math.max(1, (item.quantity || 1) + amount);
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
    const matches = value ? allMenu.filter((option) =>
      option.NombreES.toLowerCase().includes(value.toLowerCase())
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
  
  // <-- LÓGICA RESTAURADA A LA VERSIÓN ORIGINAL -->
  const handleRecetaClick = (item) => {
    if (item && item.Receta) {
      const url = `/receta/${item.Receta}`;
      window.open(url, '_blank');
    }
  };

  const isMesaInUse = !!ventaActual || orderItems.length > 0;
  const cardBorderColor = buttonState === "save" && isMesaInUse ? 'border-orange-500' : 'border-gray-300';

  return (
    <div className={`bg-white shadow-md rounded-lg border-2 ${cardBorderColor} flex flex-col transition-all`}>
      <div className="p-3 border-b-2 border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-md">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Mesa {index}</h2>
          <span className={`h-3 w-3 rounded-full ${isMesaInUse ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
        </div>
        <div className="w-1/2">
          <Input 
            type="text" 
            name="Cliente" 
            placeholder="Nombre Cliente"
            value={formData.Cliente} 
            onChange={handleInputChange} 
            className="text-sm h-9"
            disabled={!isMesaInUse}
          />
        </div>
      </div>

      <div className="p-3 flex-grow bg-white min-h-[250px] relative">
        {!isMesaInUse ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="font-semibold text-lg">Mesa Libre</p>
                <Button onClick={handleOpenMesa} className="mt-4">Abrir Mesa</Button>
            </div>
        ) : (
            <div className="space-y-2">
                {orderItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex gap-2 items-center">
                        <Button onClick={() => handleRecetaClick(item)} className="w-10 h-10 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!item.Receta}>
                          <BookOpen size={20} />
                        </Button>
                        <div className="flex-grow relative">
                            <Input 
                                type="text"
                                placeholder="Buscar producto..."
                                value={item.NombreES}
                                onChange={(e) => handleIngredientChange(itemIndex, e.target.value)}
                                className="text-base h-10"
                            />
                             {item.matches && item.matches.length > 0 && (
                              <ul className="absolute bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto z-20 w-full mt-1">
                                {item.matches.map((match) => (
                                  <li key={match._id} onClick={() => handleIngredientSelect(itemIndex, match)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">{match.NombreES}</li>
                                ))}
                              </ul>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button onClick={() => handleQuantityChange(itemIndex, -1)} variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-800"><MinusCircle size={20} /></Button>
                            <span className="font-bold w-6 text-center text-lg">{item.quantity || 1}</span>
                            <Button onClick={() => handleQuantityChange(itemIndex, 1)} variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-800"><PlusCircle size={20} /></Button>
                        </div>
                        <span className="w-24 text-right font-medium text-gray-700 text-base">{formatCurrency(item.Precio * (item.quantity || 1))}</span>
                        <Button onClick={() => handleRemoveItem(itemIndex)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-9 w-9"><XCircle size={20} /></Button>
                    </div>
                ))}
                <Button onClick={handleAddItem} variant="outline" className="w-full mt-2 border-dashed h-10">Añadir Producto</Button>
            </div>
        )}
      </div>

      {isMesaInUse && (
        <div className="p-3 border-t-2 border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-md">
            <div className="flex items-center gap-2">
                <label className="font-semibold text-sm">Propina:</label>
                <Input 
                    name="Tip"
                    type="number" 
                    value={formData.Tip}
                    onChange={handleInputChange} 
                    className="w-24 h-10 text-base"
                    placeholder="0"
                />
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">TOTAL</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalPago)}</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSubmit} title="Guardar Cambios" className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={buttonState !== 'save'}>
                  {buttonState === 'syncing' ? <div className="h-6 w-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : <Save size={24} />}
                </Button>
                <Button onClick={() => setShowPagarModal(true)} title="Pagar" className="w-12 h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={buttonState !== 'done'}>
                  <CreditCard size={24} />
                </Button>
                <Button onClick={handleEliminar} title="Eliminar Venta" className="w-12 h-12 bg-red-600 hover:bg-red-700">
                  <Trash2 size={24} />
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