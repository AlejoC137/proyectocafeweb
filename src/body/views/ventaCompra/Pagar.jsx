import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarPago } from "../../../redux/actions-VentasCompras";

function Pagar({ ventaId, onClose, total, onPaymentComplete }) {
  const dispatch = useDispatch();
  const [recibido, setRecibido] = useState(0);
  const [metodo, setMetodo] = useState("");
  const totalAPagar = total; // Ejemplo de total a pagar, reemplazar con el valor real
  const cambio = recibido ? (parseFloat(recibido) - totalAPagar).toFixed(0) : "";

  const Billetes = [10000, 20000, 50000, 100000];

  const handlePayment = () => {
    const pagoInfo = {
      metodo,
      hora: new Date().toISOString(),
      recibido: parseFloat(recibido),
      entregado: 0,
    };

    dispatch(actualizarPago(ventaId, pagoInfo))
      .then(() => {
        console.log(`Pago realizado con ${metodo} para la venta ${ventaId}`);
        onClose();
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      })
      .catch((error) => {
        console.error("Error al actualizar el pago:", error);
      });
  };

  const handleRecibidoChange = (e) => {
    setRecibido(e.target.value);
  };

  const handleRecibidoButton = (value) => {
    setRecibido(value);
  };

  const isConfirmDisabled = () => {
    if (!metodo) return true;
    if (metodo === "Efectivo" && parseFloat(recibido) < totalAPagar) return true;
    return false;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow-lg w-1/3">
        <h2 className="text-lg font-semibold mb-4 text-center bg-gray-200 p-2 rounded">
          TOTAL A PAGAR: {formatNumber(total)} {'$'}
        </h2>
        <h2 className="text-lg font-semibold mb-4">Selecciona el método de pago</h2>
        <div className="flex gap-2 mb-4">
          <Button onClick={() => setMetodo("Efectivo")} className="bg-green-500 text-white flex-1">
            Efectivo
          </Button>
          <Button onClick={() => setMetodo("Tarjeta")} className="bg-blue-500 text-white flex-1">
            Tarjeta
          </Button>
          <Button onClick={() => setMetodo("Transferencia")} className="bg-yellow-500 text-white flex-1">
            Transferencia
          </Button>
        </div>

        {metodo === "Efectivo" && (
          <div className="mt-4">
            <div className="flex gap-2 mb-2">
              <div className="flex-1 p">
                <label className="block text-sm font-medium">Cantidad recibida:</label>
                <Input
                  type="number"
                  value={recibido}
                  onChange={handleRecibidoChange}
                  className="w-full border rounded p-1 text-sm"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Billetes.map((value) => (
                    <Button
                      key={value}
                      onClick={() => handleRecibidoButton(value)}
                      className="bg-gray-300 text-black"
                    >
                      {formatNumber(value)}
                    </Button>
                  ))}
                </div>

                                <div className="grid grid-cols-1 gap-2 mt-2">

                    <Button
                      key={total}
                      onClick={() => handleRecibidoButton(total)}
                      className="bg-gray-300 text-black"
                    >
                     Completo: {formatNumber(total)}
                    </Button>

              </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">Cambio:</label>
                <Input
                  type="text"
                  value={formatNumber(cambio)}
                  readOnly
                  className="w-full border rounded p-1 text-sm"
                />
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handlePayment}
            className="bg-green-500 text-white flex-1"
            disabled={isConfirmDisabled()}
          >
            Confirmar Pago
          </Button>
          <Button onClick={onClose} className="bg-red-500 text-white flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Pagar;
