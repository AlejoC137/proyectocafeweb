import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Formulario para editar el procedimiento de compra de un proveedor.
 * Incluye lógica para pre-llenar el pedido basado en una lista de productos pendientes
 * y permite la edición en línea de dichos pendientes.
 */
const Procedimiento = ({ initialOrder, pendientes = [], onSave, onClose }) => {
  // --- ESTADOS ---
  const [orderData, setOrderData] = useState({});
  const [editedPendientes, setEditedPendientes] = useState([]);

  // --- VALORES POR DEFECTO Y PARSERS (MEMOIZED) ---
  const defaultOrderProcess = useMemo(() => ({
    cantidadDeCompra: { cantidad: "", unidad: "", frecuencia: "" },
    procedimiento: "",
    notas: "",
    auto: false,
    autoPedido: ""
  }), []);

  const defaultOrder = useMemo(() => ({
    _id: '', Nombre_Proveedor: '', Contacto_Nombre: '', Contacto_Numero: '',
    Direccion: '', 'NIT/CC': '', PAGINA_WEB: '', orderProcess: defaultOrderProcess,
  }), [defaultOrderProcess]);

  const parseOrderProcess = (orderProcess) => {
    if (!orderProcess) return { ...defaultOrderProcess };
    if (typeof orderProcess === "string") {
      try {
        return { ...defaultOrderProcess, ...JSON.parse(orderProcess) };
      } catch (e) {
        console.error("Error al parsear orderProcess JSON:", e);
        return { ...defaultOrderProcess };
      }
    }
    return { ...defaultOrderProcess, ...orderProcess };
  };

  // --- SINCRONIZACIÓN DE ESTADOS Y PROPS ---
  useEffect(() => {
    setEditedPendientes(structuredClone(pendientes));
  }, [pendientes]);

  // Genera el texto del pedido (`procedimiento`) a partir de los pendientes *editados*.
  const pendientesTextoEditado = useMemo(() => {
    if (!editedPendientes || editedPendientes.length === 0) return "";
    return editedPendientes
      .map(p => {
        const nombre = p.Nombre_del_producto || "";
        const marca = p.MARCA || "";
        const cantidad = p.CANTIDAD || "";
        const unidades = p.UNIDADES || "";
        const infoPrincipal = `${nombre}${marca ? ` ${marca}` : ""}`.trim();
        const infoCantidad = `${cantidad}${unidades ? ` ${unidades}` : ""}`.trim();
        if (!infoPrincipal) return null;
        return `• ${infoPrincipal}${infoCantidad ? ` (${infoCantidad})` : ""}`;
      })
      .filter(Boolean)
      .join('\n');
  }, [editedPendientes]);
  
  useEffect(() => {
    const parsedOrderProcess = parseOrderProcess(initialOrder?.orderProcess);
    if ((!parsedOrderProcess.procedimiento || parsedOrderProcess.procedimiento.trim() === "") && pendientesTextoEditado) {
      parsedOrderProcess.procedimiento = pendientesTextoEditado;
    }
    setOrderData({
      ...defaultOrder,
      ...initialOrder,
      orderProcess: parsedOrderProcess
    });
    // eslint-disable-next-line
  }, [initialOrder, pendientesTextoEditado, defaultOrder]);

  // --- HANDLERS ---
  const handlePendienteChange = (index, field, value) => {
    const updatedPendientes = [...editedPendientes];
    updatedPendientes[index][field] = value;
    setEditedPendientes(updatedPendientes);
  };

  const handleOrderProcessChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrderData(prev => ({ ...prev, orderProcess: { ...prev.orderProcess, [name]: type === "checkbox" ? checked : value }}));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(orderData);
  };

  // --- VALORES DERIVADOS (MEMOIZED) ---
  const whatsAppLink = useMemo(() => {
    const numero = orderData.Contacto_Numero?.toString().replace(/\D/g, "");
    const procedimiento = orderData.orderProcess?.procedimiento;
    if (numero && procedimiento) {
      const nombreContacto = orderData.Contacto_Nombre || '';
      const saludo = nombreContacto ? `Hola ${nombreContacto}, ` : 'Hola, ';
      const peticion = 'puedes porfavor enviarme lo siguiente:';
      const mensaje = `${saludo}${peticion}\n\n${procedimiento}`;
      const textoCodificado = encodeURIComponent(mensaje);
      return `https://wa.me/57${numero}?text=${textoCodificado}`;
    }
    return "";
  }, [orderData.Contacto_Numero, orderData.Contacto_Nombre, orderData.orderProcess?.procedimiento]);

  const op = orderData.orderProcess || defaultOrderProcess;

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-lg font-sans">
      <h2 className="p-6 text-2xl font-bold text-gray-800 border-b">
        Editar Procedimiento del Proveedor
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna 1: Información del proveedor */}
            <div className="space-y-4 p-4 border rounded-lg bg-white h-fit">
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Proveedor</h3>
              <div>
                <Label className="text-xs font-semibold text-gray-500">PROVEEDOR</Label>
                <div className="mt-1 text-gray-900">{orderData.Nombre_Proveedor || 'N/A'}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500">CONTACTO</Label>
                <div className="mt-1 text-gray-900">{orderData.Contacto_Nombre || 'N/A'}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500">NÚMERO DE CONTACTO</Label>
                <div className="mt-1 text-gray-900">{orderData.Contacto_Numero || 'N/A'}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500">NIT/CC</Label>
                <div className="mt-1 text-gray-900">{orderData['NIT/CC'] || 'N/A'}</div>
              </div>
            </div>
            {/* Columna 2: Pendientes */}
            <div>
              {editedPendientes.length > 0 && (
                <div className="space-y-4 p-4 border rounded-lg bg-white h-fit">
                  <h3 className="font-semibold text-lg text-gray-700 mb-2">Pendientes de Compra</h3>
                  {editedPendientes.map((p, index) => (
                    <div key={p._id || index} className="p-3 bg-gray-100 rounded-md space-y-2">
                      <Label className="font-bold text-gray-800">{p.Nombre_del_producto}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Marca"
                          value={p.MARCA || ""}
                          onChange={(e) => handlePendienteChange(index, "MARCA", e.target.value)}
                        />
                        <Input
                          placeholder="Cantidad"
                          type="number"
                          value={p.CANTIDAD || ""}
                          onChange={(e) => handlePendienteChange(index, "CANTIDAD", e.target.value)}
                        />
                        <Input
                          placeholder="Unidades"
                          value={p.UNIDADES || ""}
                          onChange={(e) => handlePendienteChange(index, "UNIDADES", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Columna 3: Proceso de compra y WhatsApp */}
            <div>
              <div className="space-y-6 h-full flex flex-col">
                <h3 className="font-semibold text-lg text-gray-700">Proceso de Compra</h3>
                <div>
                  <Label htmlFor="procedimiento" className="block mb-2 font-medium">Descripción del Pedido</Label>
                  <Textarea
                    id="procedimiento"
                    name="procedimiento"
                    value={op.procedimiento || ""}
                    onChange={handleOrderProcessChange}
                    placeholder="El texto del pedido aparecerá aquí basado en los pendientes. También puedes editarlo manualmente."
                    rows="7"
                  />
                </div>
                <div>
                  <Label htmlFor="notas" className="block mb-2 font-medium">Notas</Label>
                  <Textarea id="notas" name="notas" value={op.notas || ""} onChange={handleOrderProcessChange} placeholder="Notas adicionales sobre el pedido o la entrega." rows="2" />
                </div>
                <div>
                  <Label className="block mb-2 font-medium">Link de Pedido (Auto-generado)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={whatsAppLink}
                      readOnly
                      placeholder="Se genera con el número de contacto y la descripción del pedido"
                      className="flex-grow bg-gray-100 cursor-not-allowed"
                    />
                    <a
                      href={whatsAppLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center px-4 py-2 text-white rounded-md whitespace-nowrap
                        ${whatsAppLink ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed pointer-events-none'}
                        transition-colors duration-200`}
                      aria-disabled={!whatsAppLink}
                      tabIndex={whatsAppLink ? 0 : -1}
                      style={{
                        minWidth: 140,
                        justifyContent: "center"
                      }}
                      onClick={e => !whatsAppLink && e.preventDefault()}
                    >
                      Ir a WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer fijo con botones */}
        <div className="flex gap-4 justify-end p-6 border-t bg-white rounded-b-lg mt-auto">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Procedimiento;