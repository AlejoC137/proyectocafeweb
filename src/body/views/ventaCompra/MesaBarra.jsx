import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearVenta, actualizarVenta, eliminarVenta } from "../../../redux/actions-VentasCompras";
import RecetaModal from "./RecetaModal";
import Pagar from "./Pagar";
import { PlusCircle, MinusCircle, XCircle, BookOpen, Save, CreditCard, Trash2 } from 'lucide-react';

/**
 * Componente MesaBarra corregido. Ahora incluye un botón para iniciar
 * una nueva comanda cuando la barra está vacía.
 * @param {number} index - El número de la mesa/barra.
 * @param {Array} ventas - Lista de ventas activas.
 * @param {function} reloadVentas - Callback para recargar las ventas.
 */
function MesaBarra({ index, ventas, reloadVentas }) {
  // --- ESTADOS DEL COMPONENTE ---
  const [formData, setFormData] = useState({ Cliente: '', Cajero: '', Tip: '0' });
  const [orderItems, setOrderItems] = useState([]);
  const [ventaId, setVentaId] = useState(null);
  const [buttonState, setButtonState] = useState("save"); // 'save', 'syncing', 'done'
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState(null);

  const allMenu = useSelector((state) => state.allMenu || []);
  const dispatch = useDispatch();

  // --- EFECTOS ---

  // Carga los datos de una venta existente cuando el componente se monta o las ventas cambian
  useEffect(() => {
    const ventaActual = ventas.find(v => v.Mesa === index && !v.Pagado);
    if (ventaActual) {
      setFormData({
        Cliente: ventaActual.Cliente || '',
        Cajero: ventaActual.Cajero || '',
        Tip: ventaActual.Tip || '0',
      });
      try {
        setOrderItems(JSON.parse(ventaActual.Productos || '[]'));
      } catch (e) {
        console.error("Error al parsear productos:", e);
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
  }, [ventas, index]);

  // --- CÁLCULOS MEMORIZADOS ---

  const totalPago = useMemo(() => {
    const totalItems = orderItems.reduce((acc, item) => acc + (Number(item.Precio) * Number(item.quantity)), 0);
    return (parseFloat(totalItems) + parseFloat(formData.Tip || 0));
  }, [orderItems, formData.Tip]);

  const isMesaInUse = !!ventaId || orderItems.length > 0;

  // --- FUNCIONES Y MANEJADORES ---

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
  };

  // *** NUEVA FUNCIÓN ***: Inicia una nueva comanda añadiendo un item vacío.
  const handleOpenBarra = () => {
    setOrderItems([{ id: '', NombreES: '', Precio: 0, quantity: 1, matches: [] }]);
    setButtonState("save");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    const matches = value ? allMenu.filter(option => option.NombreES.toLowerCase().includes(value.toLowerCase())) : [];
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
        Foto: selectedOption.Foto,
        matches: [],
    };
    setOrderItems(updatedItems);
    setButtonState("save");
  };

  const handleSubmit = async () => {
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
      reloadVentas();
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      alert("Error al guardar la venta.");
      setButtonState("save");
    }
  };
  
  const handleEliminar = async () => {
    if (!ventaId || !window.confirm("¿Está seguro de que desea ELIMINAR esta venta?")) return;
    try {
      await dispatch(eliminarVenta(ventaId));
      reloadVentas();
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      alert("Error al eliminar la venta.");
    }
  };

  const handlePaymentComplete = () => {
    setShowPagarModal(false);
    reloadVentas();
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  const cardBgColor = isMesaInUse ? 'bg-green-50' : 'bg-white';
  const cardBorderColor = buttonState === "save" && isMesaInUse ? 'border-orange-500' : 'border-gray-300';

  return (
    <div className={`shadow-md rounded-lg border-2 ${cardBorderColor} p-2 space-y-3 transition-all ${cardBgColor}`}>
      {/* --- CABECERA CON DATOS PRINCIPALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <div className="md:col-span-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-800">{`Mesa#${index}`}</h3>
            <span className={`h-3 w-3 rounded-full ${isMesaInUse ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
        </div>
        <Input name="Cliente" placeholder="Cliente" value={formData.Cliente} onChange={handleInputChange} className="md:col-span-2 h-9" disabled={!isMesaInUse} />
        <Input name="Cajero" placeholder="Cajero" value={formData.Cajero} onChange={handleInputChange} className="md:col-span-2 h-9" disabled={!isMesaInUse} />
        <div className="flex items-center gap-1 md:col-span-2">
            <label className="text-sm font-medium">Propina:</label>
            <Input name="Tip" type="number" value={formData.Tip} onChange={handleInputChange} className="flex-grow h-9" placeholder="0" disabled={!isMesaInUse} />
        </div>
        <div className="text-right md:col-span-2">
            <p className="text-sm text-gray-500 font-medium">TOTAL</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPago)}</p>
        </div>
        <div className="flex gap-2 justify-end md:col-span-3">
            <Button onClick={handleSubmit} title="Guardar Cambios" className="w-10 h-10 bg-blue-500 hover:bg-blue-600" disabled={buttonState !== 'save' || !isMesaInUse}>
                {buttonState === 'syncing' ? <div className="h-5 w-5 border-2 border-dashed rounded-full animate-spin border-white"></div> : <Save size={20} />}
            </Button>
            <Button onClick={() => setShowPagarModal(true)} title="Pagar" className="w-10 h-10 bg-green-600 hover:bg-green-700" disabled={buttonState !== 'done'}><CreditCard size={20} /></Button>
            <Button onClick={handleEliminar} title="Eliminar Venta" className="w-10 h-10 bg-red-600 hover:bg-red-700" disabled={!ventaId}><Trash2 size={20} /></Button>
        </div>
      </div>

      {/* --- *** CORRECCIÓN APLICADA AQUÍ *** --- */}
      {/* Muestra la lista de items si la mesa está en uso, o el botón para abrirla si no lo está. */}
      {isMesaInUse ? (
        <div className="space-y-2 border-t pt-3">
          {orderItems.map((item, itemIndex) => (
            <div key={itemIndex} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-6 relative">
                <Input type="text" placeholder="Buscar producto..." value={item.NombreES} onChange={(e) => handleIngredientChange(itemIndex, e.target.value)} className="text-base h-10" />
                {item.matches && item.matches.length > 0 && (
                  <ul className="absolute bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto z-20 w-full mt-1">
                    {item.matches.map((match) => ( <li key={match._id} onClick={() => handleIngredientSelect(itemIndex, match)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">{match.NombreES}</li> ))}
                  </ul>
                )}
              </div>
              <div className="col-span-5 md:col-span-2 flex items-center gap-1 justify-center">
                <Button onClick={() => handleQuantityChange(itemIndex, -1)} variant="ghost" size="icon" className="h-9 w-9"><MinusCircle size={20} /></Button>
                <span className="font-bold w-6 text-center text-lg">{item.quantity || 1}</span>
                <Button onClick={() => handleQuantityChange(itemIndex, 1)} variant="ghost" size="icon" className="h-9 w-9"><PlusCircle size={20} /></Button>
              </div>
              <span className="col-span-4 md:col-span-2 text-right font-medium text-gray-700">{formatCurrency(item.Precio * (item.quantity || 1))}</span>
              <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1">
                <Button onClick={() => setSelectedReceta(item)} className="bg-yellow-500 text-white h-9 w-9" size="icon"><BookOpen size={20} /></Button>
                <Button onClick={() => handleRemoveItem(itemIndex)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-9 w-9"><XCircle size={20} /></Button>
              </div>
            </div>
          ))}
          <Button onClick={handleAddItem} variant="outline" className="w-full mt-2 border-dashed h-10">Añadir Producto</Button>
        </div>
      ) : (
        <div className="border-t border-gray-200 mt-2 pt-3 text-center">
            <Button onClick={handleOpenBarra} variant="secondary">
                <PlusCircle className="mr-2 h-4 w-4" />
                Abrir Comanda en Barra
            </Button>
        </div>
      )}
      
      {/* --- MODALES --- */}
      {selectedReceta && <RecetaModal item={selectedReceta} onClose={() => setSelectedReceta(null)} />}
      {showPagarModal && <Pagar onClose={() => setShowPagarModal(false)} ventaId={ventaId} total={totalPago} onPaymentComplete={handlePaymentComplete} />}
    </div>
  );
}

export default MesaBarra;
