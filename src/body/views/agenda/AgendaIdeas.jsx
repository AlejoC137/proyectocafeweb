import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, updateItem, getAllFromTable } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";

export function AgendaIdeas({ propuestas = [], onFormalizar }) {
  const dispatch = useDispatch();
  const allAgenda = useSelector((state) => state.allAgenda || []);

  useEffect(() => {
    dispatch(getAllFromTable(AGENDA));
  }, [dispatch]);

  const displayedPropuestas = propuestas.length > 0 
    ? propuestas 
    : allAgenda.filter(e => e.ejecutado === null || e.ejecutado === undefined);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nuevaIdea, setNuevaIdea] = useState({
    nombreES: "",
    infoAdicional: "",
    fecha: "",
    horaInicio: "",
    nombreCliente: "",
    estado_proceso: "idea",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaIdea((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar usando SOLAMENTE columnas reales de la tabla "Agenda"
  const handleGuardarIdea = async (e) => {
    e.preventDefault();
    if (!nuevaIdea.nombreES.trim()) {
      alert("Por favor ingresa al menos el nombre de la idea");
      return;
    }

    try {
      setLoading(true);

      // Mapeo exacto según tu CREATE TABLE
      const payload = {
        nombreES: nuevaIdea.nombreES.trim(),
        nombreEN: nuevaIdea.nombreES.trim(),
        infoAdicional: nuevaIdea.infoAdicional.trim() || null,
        decripcion: nuevaIdea.infoAdicional.trim() || null,
        fecha: nuevaIdea.fecha ? nuevaIdea.fecha : null,
        horaInicio: nuevaIdea.horaInicio ? nuevaIdea.horaInicio : null,
        nombreCliente: nuevaIdea.nombreCliente.trim() || null,
        estado_proceso: nuevaIdea.estado_proceso || "idea",
        ejecutado: null, // Asigna como propuesta/idea
        numeroPersonas: "1", // Tu esquema define numeroPersonas como text
      };

      await dispatch(crearItem(payload, AGENDA));
      dispatch(getAllFromTable(AGENDA));

      setNuevaIdea({
        nombreES: "",
        infoAdicional: "",
        fecha: "",
        horaInicio: "",
        nombreCliente: "",
        estado_proceso: "idea",
      });
      setMostrarForm(false);
    } catch (error) {
      console.error("Error guardando la propuesta:", error);
      alert("No se pudo crear la propuesta. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoProcesoChange = async (id, nuevoEstado) => {
    await dispatch(updateItem(id, { estado_proceso: nuevoEstado }, AGENDA));
    dispatch(getAllFromTable(AGENDA));
  };

  const handleConvertirAAgenda = async (item) => {
    try {
      await dispatch(
        updateItem(
          item._id,
          {
            ejecutado: false, // Pasa de null a false para ir al calendario
            estado_proceso: "confirmada",
          },
          AGENDA
        )
      );
      dispatch(getAllFromTable(AGENDA));
    } catch (error) {
      console.error("Error convirtiendo a agenda:", error);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h2 className="text-base font-bold text-gray-800">
            Propuestas e Ideas de Eventos
          </h2>
          <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
            {displayedPropuestas.length}
          </span>
        </div>

        <Button
          onClick={() => setMostrarForm(!mostrarForm)}
          size="sm"
          className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1 px-3 rounded-md shadow-sm"
        >
          {mostrarForm ? "✕ Cancelar" : "+ Nueva Idea"}
        </Button>
      </div>

      {/* Renglón de creación */}
      {mostrarForm && (
        <form
          onSubmit={handleGuardarIdea}
          className="bg-purple-50/90 border border-purple-200 rounded-xl p-3 shadow-sm text-xs space-y-2"
        >
          <div className="font-bold text-purple-900">Crear Renglón de Idea:</div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Nombre (ES) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombreES"
                value={nuevaIdea.nombreES}
                onChange={handleInputChange}
                placeholder="Nombre del evento..."
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-xs outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Posible Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={nuevaIdea.fecha}
                onChange={handleInputChange}
                className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Posible Hora
              </label>
              <input
                type="time"
                name="horaInicio"
                value={nuevaIdea.horaInicio}
                onChange={handleInputChange}
                className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Posible Aliado
              </label>
              <input
                type="text"
                name="nombreCliente"
                value={nuevaIdea.nombreCliente}
                onChange={handleInputChange}
                placeholder="Aliado / Cliente..."
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Estado Proceso
              </label>
              <select
                name="estado_proceso"
                value={nuevaIdea.estado_proceso}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-xs font-medium"
              >
                <option value="idea">💡 Idea</option>
                <option value="propuesta_estructurada">📝 Propuesta</option>
                <option value="pre_acuerdos">🤝 Pre-acuerdos</option>
                <option value="confirmada">✅ Confirmada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center pt-1">
            <div className="md:col-span-4">
              <input
                type="text"
                name="infoAdicional"
                value={nuevaIdea.infoAdicional}
                onChange={handleInputChange}
                placeholder="Descripción o detalles adicionales..."
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-xs outline-none"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md"
            >
              {loading ? "Guardando..." : "Guardar Idea"}
            </Button>
          </div>
        </form>
      )}

      {/* Tabla de propuestas */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              <th className="p-3">Nombre / Propuesta</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Posible Fecha / Hora</th>
              <th className="p-3">Posible Aliado</th>
              <th className="p-3">Estado Proceso</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {displayedPropuestas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No hay propuestas pendientes.
                </td>
              </tr>
            ) : (
              displayedPropuestas.map((item) => (
                <tr key={item._id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="p-3 font-bold text-gray-800">
                    {item.nombreES || item.nombreEN || "Sin Nombre"}
                  </td>

                  <td className="p-3 text-gray-600 max-w-[200px] truncate" title={item.infoAdicional || item.decripcion}>
                    {item.infoAdicional || item.decripcion || "-"}
                  </td>

                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    <div>📅 {item.fecha || "Por definir"}</div>
                    <div className="text-[10px] text-gray-400">🕒 {item.horaInicio || "Por definir"}</div>
                  </td>

                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    🤝 {item.nombreCliente || "Sin asignar"}
                  </td>

                  <td className="p-3">
                    <select
                      value={item.estado_proceso || "idea"}
                      onChange={(e) => handleEstadoProcesoChange(item._id, e.target.value)}
                      className="text-xs p-1.5 border border-gray-200 rounded bg-white font-medium text-gray-700 outline-none"
                    >
                      <option value="idea">💡 Idea</option>
                      <option value="propuesta_estructurada">📝 Propuesta Estructurada</option>
                      <option value="pre_acuerdos">🤝 Pre-acuerdos</option>
                      <option value="confirmada">✅ Confirmada</option>
                    </select>
                  </td>

                  <td className="p-3 text-center">
                    <Button
                      onClick={() => handleConvertirAAgenda(item)}
                      size="sm"
                      className="text-[11px] h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-3 rounded-md shadow-sm whitespace-nowrap"
                    >
                      📅 Pasar a Agenda
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AgendaIdeas;