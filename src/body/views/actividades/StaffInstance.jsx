import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearComanda, actualizarComanda, eliminarComanda } from "../../../redux/actions-Comanda";
import Pagar from "./Pagar";
import Comanda from "./WorkE/ComandaExcelView";

function StaffInstance({ staff, ventas, reloadVentas }) {
  const [formData, setFormData] = useState({
    Dates: { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
    Terminado: false,
    Pagado: { pagadoFull: false, adelanto: "NoAplica" },
    Categoria: "",
    Ejecutor: staff._id,
    Procedimientos: "",
  });

  const [ComandaSaved, setComandaSaved] = useState(false);
  const [buttonState, setButtonState] = useState("save");
  const [isMesaInUse, setIsMesaInUse] = useState(false);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [ComandaId, setComandaId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const existingComanda = ventas.find(venta => venta.Ejecutor === staff._id && !venta.Terminado);
    if (existingComanda) {
      setFormData(existingComanda);
      setComandaSaved(true);
      setButtonState("done");
      setIsMesaInUse(true);
      setComandaId(existingComanda._id);
    }
  }, [ventas, staff._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("¿Está seguro de que desea guardar esta tarea?")) return;

    setComandaSaved(true);
    setButtonState("done");
    setIsMesaInUse(true);

    try {
      const existingComanda = ventas.find(venta => venta.Ejecutor === staff._id && !venta.Terminado);
      if (existingComanda) {
        const updatedComanda = await dispatch(actualizarComanda(existingComanda._id, formData));
        setComandaId(updatedComanda[0]._id);
        alert("Tarea actualizada correctamente");
      } else {
        const nuevaComanda = await dispatch(crearComanda(formData));
        setComandaId(nuevaComanda._id);
        alert("Tarea creada correctamente");
      }
      reloadVentas();
    } catch (error) {
      console.error("Error al crear/actualizar la tarea:", error);
      alert("Error al crear/actualizar la tarea");
    }
  };

  const handlePagar = () => {
    setShowPagarModal(true);
  };

  const handleClosePagarModal = () => {
    setShowPagarModal(false);
  };

  const handleEliminar = async () => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta tarea?")) return;

    try {
      const existingComanda = ventas.find(venta => venta.Ejecutor === staff._id && !venta.Terminado);
      if (existingComanda) {
        await dispatch(eliminarComanda(existingComanda._id));
        setIsMesaInUse(false);
        alert("Tarea eliminada correctamente");
        reloadVentas();
      }
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      alert("Error al eliminar la tarea");
    }
    setFormData({
      Dates: { isued: new Date().toISOString(), finished: "", date_asigmente: [] },
      Terminado: false,
      Pagado: { pagadoFull: false, adelanto: "NoAplica" },
      Categoria: "",
      Ejecutor: staff._id,
      Actividades: "",
    });
    setComandaSaved(false);
    setButtonState("save");
  };

  return (
    <div className={`bg-white shadow-md rounded-lg border p-1 grid grid-cols-4 gap-2 ${isMesaInUse ? 'bg-green-100' : ''}`} style={{ alignItems: 'start' }}>
      <div className="col-span-4 grid grid-cols-2 gap-2 align-top">
        <div className="flex items-center gap-2">
          <h3 className="flex-grow border rounded p-1 text-sm font-semibold">{`Staff#${staff._id}`}</h3>
          <label className="text-sm font-medium">Cliente:</label>
          <Input
            type="text"
            name="Cliente"
            value={formData.Cliente}
            onChange={handleChange}
            className="flex-grow border rounded p-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Cajero:</label>
          <Input
            type="text"
            name="Cajero"
            value={formData.Cajero}
            onChange={handleChange}
            className="flex-grow border rounded p-1 text-sm"
          />
        </div>
      </div>

      {/* <div className="col-span-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Nombre:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Nombre}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Apellido:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Apellido}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Cargo:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Cargo}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Cuenta:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Cuenta}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Rate:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Rate}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Propinas:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Propinas}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Turno State:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Turno_State}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Turnos:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Turnos}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Show:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Show ? "Sí" : "No"}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">CC:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.CC}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Estado:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Estado}</p>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium">Contratacion:</label>
          <p className="flex-grow border rounded p-1 text-sm">{staff.Contratacion ? "Sí" : "No"}</p>
        </div>
      </div> */}
<Comanda Comanda={formData} />

      <div className="col-span-4 flex gap-2 items-end">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium">Tip:</label>
          <Input
            type="text"
            name="Tip"
            value={formData.Tip}
            onChange={handleChange}
            className="flex-grow border rounded p-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium">Total$:</label>
          <Input
            type="text"
            name="Total_Ingreso"
            value={formData.Total_Ingreso}
            className="flex-grow border rounded p-1 text-sm"
            readOnly
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            className="w-[40px] bg-blue-500 text-white text-sm"
          >
            {buttonState === "save" && "💾"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && "✅"}
          </Button>
          <Button
            onClick={handlePagar}
            disabled={!ComandaSaved}
            className={`w-[40px] bg-green-500 text-white text-sm ${
              !ComandaSaved ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            💸
          </Button>
          <Button
            onClick={handleEliminar}
            disabled={!ComandaSaved}
            className={`w-[40px] bg-red-500 text-white text-sm ${
              !ComandaSaved ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            💥
          </Button>
        </div>
      </div>

      {showPagarModal && (
        <Pagar onClose={handleClosePagarModal} ventaId={ComandaId} total={totalPago} onPaymentComplete={handlePaymentComplete} />
      )}

      <div className="col-span-4">
      </div>
    </div>
  );
}

export default StaffInstance;
