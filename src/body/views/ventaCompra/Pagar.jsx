import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarPago } from "../../../redux/actions-VentasCompras";

function Pagar({ ventaId, onClose, total, onPaymentComplete }) {
  const dispatch = useDispatch();
  const [recibido, setRecibido] = useState("");
  const [metodo, setMetodo] = useState("");

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
  };

  const cambio = useMemo(() => {
    if (metodo !== "Efectivo" || !recibido) return 0;
    const recibidoNum = parseFloat(recibido) || 0;
    const totalNum = parseFloat(total) || 0;
    return recibidoNum - totalNum;
  }, [recibido, total, metodo]);

  const Billetes = [5000, 10000, 20000, 50000, 100000];
  const metodosDePago = [
    { name: 'Efectivo', icon: '💵', color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Tarjeta', icon: '💳', color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Transferencia', icon: '📱', color: 'bg-yellow-500 hover:bg-yellow-600' },
  ];

  const handlePayment = () => {
    if (isConfirmDisabled()) return;

    const pagoInfo = {
      metodo,
      hora: new Date().toISOString(),
      recibido: metodo === "Efectivo" ? parseFloat(recibido) : total,
      entregado: cambio > 0 ? cambio : 0,
    };

    dispatch(actualizarPago(ventaId, pagoInfo))
      .then(() => {
        alert("Pago realizado con éxito");
        if (onPaymentComplete) {
          onPaymentComplete();
        }
        onClose();
      })
      .catch((error) => {
        console.error("Error al actualizar el pago:", error);
        alert("Error al procesar el pago");
      });
  };
  
  const handleSetRecibido = (value) => {
    setRecibido(value);
  };

  const isConfirmDisabled = () => {
    if (!metodo) return true;
    if (metodo === "Efectivo" && (parseFloat(recibido) || 0) < total) return true;
    return false;
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-4 border-b-2 border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-md">
            <h2 className="text-xl font-bold text-gray-800">Procesar Pago</h2>
            <Button onClick={onClose} variant="ghost" className="h-9 w-9 p-0 text-xl">❌</Button>
        </div>
        
        <div className="p-6 text-center">
            <p className="text-sm text-gray-500 font-medium">TOTAL A PAGAR</p>
            <p className="text-5xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>

        <div className="px-6 pb-6">
            <p className="font-semibold mb-3 text-center text-gray-600">Selecciona el método de pago</p>
            <div className="grid grid-cols-3 gap-3">
              {metodosDePago.map((m) => (
                <Button key={m.name} onClick={() => setMetodo(m.name)} className={`h-20 text-white text-base flex flex-col gap-1 transition-all ${m.color} ${metodo === m.name ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`}>
                  <span className="text-3xl">{m.icon}</span>
                  {m.name}
                </Button>
              ))}
            </div>
        </div>

        {metodo === "Efectivo" && (
          <div className="px-6 pb-6 bg-gray-50/70 border-t">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad Recibida:</label>
                <Input
                  type="number"
                  value={recibido}
                  onChange={(e) => handleSetRecibido(e.target.value)}
                  className="h-12 text-lg text-center"
                  placeholder="0"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button onClick={() => handleSetRecibido(total)} variant="outline" className="col-span-2 bg-blue-100 hover:bg-blue-200">
                    Justo
                  </Button>
                  {Billetes.map((value) => (
                    <Button key={value} onClick={() => handleSetRecibido(value)} variant="outline">
                      {formatCurrency(value)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium mb-1">Cambio:</label>
                <div className={`h-12 flex items-center justify-center rounded-md ${cambio < 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'}`}>
                  <span className="text-2xl font-bold">{formatCurrency(cambio)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 grid grid-cols-2 gap-3 bg-gray-100 border-t-2 border-gray-200 rounded-b-md">
          <Button onClick={onClose} variant="outline" className="h-12 text-base bg-white">
            Cancelar
          </Button>
          <Button onClick={handlePayment} className="h-12 text-base bg-green-600 hover:bg-green-700 disabled:opacity-50" disabled={isConfirmDisabled()}>
            Confirmar Pago
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default Pagar;