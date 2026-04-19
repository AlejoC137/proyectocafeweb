import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux"; // Added useSelector
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarPago } from "../../../redux/actions-VentasCompras";
import supabase from "../../../config/supabaseClient";
import { USER_PREFERENCES } from "../../../redux/actions-types";

// Conversión desde env o valores por defecto
const VAL_PUNTO = parseInt(import.meta.env.VITE_POINTS_REDEMPTION_VALUE) || 300;
const PUNTOS_POR_MIL = parseInt(import.meta.env.VITE_POINTS_VAL_FOR_1000) || 1;

function Pagar({ ventaId, onClose, total, onPaymentComplete, clientId, productos }) {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.allUserPreferences || []); // Get all users

  const currentUser = useMemo(() => {
    return allUsers.find(u => u._id === clientId);
  }, [allUsers, clientId]);

  const userPointsValue = useMemo(() => {
    if (!currentUser) return 0;
    return (currentUser.loyalty_points || 0) * VAL_PUNTO;
  }, [currentUser]);

  const [recibido, setRecibido] = useState("");
  const [metodo, setMetodo] = useState("");
  const [usePoints, setUsePoints] = useState(false); // Toggle para puntos parciales

  const pointsToUse = useMemo(() => {
    if (!currentUser || !currentUser.loyalty_points) return 0;
    // Máximo de puntos necesarios para cubrir el total
    const maxNeeded = Math.ceil(total / VAL_PUNTO);
    return Math.min(currentUser.loyalty_points, maxNeeded);
  }, [currentUser, total]);

  const monetaryDiscount = useMemo(() => {
    return usePoints ? pointsToUse * VAL_PUNTO : 0;
  }, [usePoints, pointsToUse]);

  const finalCashTotal = useMemo(() => {
    return Math.max(0, total - monetaryDiscount);
  }, [total, monetaryDiscount]);

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
  };

  const cambio = useMemo(() => {
    if (metodo !== "Efectivo" || !recibido) return 0;
    const recibidoNum = parseFloat(recibido) || 0;
    return recibidoNum - finalCashTotal;
  }, [recibido, finalCashTotal, metodo]);

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
      recibido: metodo === "Efectivo" ? parseFloat(recibido) : finalCashTotal,
      entregado: cambio > 0 ? cambio : 0,
      puntos_redimidos: usePoints ? pointsToUse : 0,
      descuento_puntos: monetaryDiscount
    };

    dispatch(actualizarPago(ventaId, pagoInfo))
      .then(async () => {
        // --- INTEGRACIÓN: Puntos de Lealtad y Purchase History ---
        if (clientId) {
          try {
            // 1. Puntos a ganar: solo sobre lo pagado en PLATA (no sobre lo cubierto con puntos)
            const earnedPoints = Math.floor(finalCashTotal / 1000) * PUNTOS_POR_MIL;
            
            // 2. Calcular nuevo saldo
            const currentPoints = currentUser?.loyalty_points || 0;
            const newPoints = Math.max(0, currentPoints + earnedPoints - (usePoints ? pointsToUse : 0));

            // 3. Preparar entrada de historial
            const newHistoryEntry = {
              date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
              total: total,
              method: metodo + (usePoints ? " + Puntos" : ""),
              discount: monetaryDiscount
            };

            let currentHistory = [];
            try {
              currentHistory = typeof currentUser.purchase_history === 'string' 
                ? JSON.parse(currentUser.purchase_history || '[]') 
                : (currentUser.purchase_history || []);
            } catch (e) {
              currentHistory = [];
            }

            const updatedHistory = [newHistoryEntry, ...currentHistory].slice(0, 50);

            // 4. Actualizar en DB
            await supabase
              .from(USER_PREFERENCES)
              .update({
                loyalty_points: newPoints,
                purchase_history: updatedHistory
              })
              .eq("_id", clientId);

            console.log(`Transacción completada. Cambio puntos: ${earnedPoints - pointsToDeduct}. Nuevo Saldo: ${newPoints}`);
          } catch (err) {
            console.error("Error actualizando perfil de cliente:", err);
          }
        }
        // --- FIN INTEGRACIÓN ---

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
    if (metodo === "Efectivo" && (parseFloat(recibido) || 0) < finalCashTotal) return true;
    return false;
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-4 border-b-2 border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-md">
            <h2 className="text-xl font-bold text-gray-800">Procesar Pago</h2>
            <Button onClick={onClose} variant="ghost" className="h-9 w-9 p-0 text-xl">❌</Button>
        </div>
        
        <div className="p-6 text-center border-b border-gray-100 bg-slate-50/30">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Monto a Cobrar</p>
            <div className="flex flex-col items-center">
              {usePoints && (
                <p className="text-sm text-gray-400 line-through font-medium">{formatCurrency(total)}</p>
              )}
              <p className="text-5xl font-extrabold text-gray-900 tracking-tight">
                {formatCurrency(finalCashTotal)}
              </p>
            </div>
        </div>

        <div className="px-6 py-4">
            {currentUser && currentUser.loyalty_points > 0 && (
              <div className={`mb-4 p-3 rounded-xl border-2 transition-all ${usePoints ? 'bg-purple-50 border-purple-200 shadow-inner' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Puntos Disponibles</p>
                      <p className="text-[10px] text-purple-600 font-medium">{currentUser.loyalty_points.toLocaleString()} pts (~{formatCurrency(userPointsValue)})</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setUsePoints(!usePoints)}
                    size="sm"
                    className={`h-8 px-4 rounded-full text-[10px] font-bold uppercase transition-all ${usePoints ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                  >
                    {usePoints ? 'Quitar Puntos' : 'Usar Puntos'}
                  </Button>
                </div>
                {usePoints && (
                  <div className="mt-2 pt-2 border-t border-purple-100 space-y-1 animate-in slide-in-from-top-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-purple-700 uppercase tracking-tighter">Descuento:</p>
                      <p className="text-[10px] font-black text-purple-800">-{pointsToUse} pts = {formatCurrency(monetaryDiscount)}</p>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <p className="text-[9px] font-medium text-purple-50">Quedarán:</p>
                      <p className="text-[9px] font-bold text-purple-900">{(currentUser.loyalty_points - pointsToUse).toLocaleString()} pts</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="font-semibold mb-3 text-center text-gray-500 text-xs italic">Elige método para el saldo restante</p>
            <div className="grid grid-cols-3 gap-2">
              {metodosDePago.map((m) => (
                <Button 
                  key={m.name} 
                  onClick={() => setMetodo(m.name)} 
                  className={`h-20 text-white text-xs flex flex-col items-center justify-center gap-1 transition-all rounded-xl ${m.color} ${metodo === m.name ? 'ring-4 ring-offset-2 ring-blue-500 shadow-xl scale-105' : 'opacity-90'}`}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <span className="font-bold uppercase tracking-tighter">{m.name}</span>
                </Button>
              ))}
            </div>
        </div>

        {metodo === "Efectivo" && (
           <div className="px-6 pb-6 bg-gray-50/70 border-t border-gray-100">
             <div className="grid grid-cols-2 gap-4 mt-4 text-center">
               <div className="space-y-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase">Recibido</label>
                 <Input
                   type="number"
                   value={recibido}
                   onChange={(e) => handleSetRecibido(e.target.value)}
                   className="h-10 text-lg text-center font-bold border-gray-200 focus:border-blue-400"
                   placeholder="0"
                 />
                 <div className="grid grid-cols-2 gap-1.5">
                   <Button onClick={() => handleSetRecibido(finalCashTotal)} variant="outline" className="col-span-2 h-7 text-[10px] uppercase font-bold bg-blue-50 hover:bg-blue-100 text-blue-600">
                     Paga Justo
                   </Button>
                   {Billetes.map((value) => (
                     <Button key={value} onClick={() => handleSetRecibido(value)} variant="outline" className="h-7 text-[9px] p-0 font-medium">
                       {formatCurrency(value)}
                     </Button>
                   ))}
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase">Cambio</label>
                 <div className={`h-10 flex items-center justify-center rounded-lg border-2 ${cambio < 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                   <span className="text-xl font-black">{formatCurrency(cambio)}</span>
                 </div>
               </div>
             </div>
           </div>
        )}

        <div className="p-4 grid grid-cols-2 gap-3 bg-gray-100 border-t border-gray-200 rounded-b-md">
          <Button onClick={onClose} variant="outline" className="h-11 text-xs font-bold uppercase bg-white hover:bg-gray-50">
            Cancelar
          </Button>
          <Button 
            onClick={handlePayment} 
            className="h-11 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95" 
            disabled={isConfirmDisabled()}
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default Pagar;