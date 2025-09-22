import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, updateLogStaff } from "../../../redux/actions";
import { STAFF } from "../../../redux/actions-types";

const CalculoNomina = () => {
  const dispatch = useDispatch();
  const staff = useSelector((state) => state.allStaff);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [resultados, setResultados] = useState([]);
  const [historialDesplegado, setHistorialDesplegado] = useState({});
  const [modifiedShifts, setModifiedShifts] = useState({});

  useEffect(() => {
    dispatch(getAllFromTable(STAFF));
  }, [dispatch]);

  const parseAndFormatCuenta = (cuentaString) => {
    if (typeof cuentaString !== "string" || !cuentaString.trim()) {
      return "N/A";
    }
    try {
      const validJsonString = cuentaString.replace(/(\w+):/g, '"$1":');
      const cuentaObj = JSON.parse(validJsonString);
      return `${cuentaObj.banco} - ${cuentaObj.tipo} - ${cuentaObj.numero}`;
    } catch (error) {
      return cuentaString;
    }
  };

  const realizarCalculoCompleto = (staffData, inicio, fin) => {
    if (!inicio || !fin) return;
    const resultado = calcularHorasYPropinas(staffData, inicio, fin);
    const valorPagarPorPersona = calcularValorPagar(resultado, inicio, fin);
    setResultados(valorPagarPorPersona);

    const shiftsByPersona = {};
    valorPagarPorPersona.forEach((persona) => {
      shiftsByPersona[persona._id] = [...(persona.turnos || [])];
    });
    setModifiedShifts(shiftsByPersona);
  };

  const handleCalcular = () => {
    realizarCalculoCompleto(staff, fechaInicio, fechaFin);
  };
  
  function calcularHorasYPropinas(data, fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    return data.map((persona) => {
      let turnos = [];
      if (Array.isArray(persona.Turnos)) {
        turnos = persona.Turnos;
      } else if (typeof persona.Turnos === "string" && persona.Turnos.trim()) {
        try {
          const parsed = JSON.parse(persona.Turnos);
          turnos = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          turnos = [];
        }
      }

      const turnosNormalizados = turnos.map((t) => ({
        turnoDate: t.fecha || t.turnoDate || t.date || "",
        horaInicio: t.horaInicio || t.horaEntrada || t.hora || "00:00",
        horaSalida: t.horaCierre || t.horaSalida || t.horaFin || "00:00",
      }));

      const turnosFiltrados = turnosNormalizados.filter((turno) => {
        if (!turno.turnoDate) return false;
        const fechaTurno = new Date(turno.turnoDate);
        return fechaTurno >= inicio && fechaTurno <= fin;
      });
      
      const CompiladorHorasTrabajadas = (turnos) => {
        if (!Array.isArray(turnos) || turnos.length === 0) return 0;
        
        return turnos.reduce((acumulador, turno) => {
          if (!turno.horaInicio || !turno.horaSalida || turno.horaSalida === "PENDING") {
            return acumulador;
          }
          const [horaInicioStr, minutoInicioStr] = turno.horaInicio.split(":");
          const [horaSalidaStr, minutoSalidaStr] = turno.horaSalida.split(":");
          
          const horasTurno =
            (parseInt(horaSalidaStr, 10) - parseInt(horaInicioStr, 10)) +
            (parseInt(minutoSalidaStr, 10) - parseInt(minutoInicioStr, 10)) / 60;
          
          return acumulador + (horasTurno > 0 ? horasTurno : 0);
        }, 0);
      };

      const horasTrabajadas = CompiladorHorasTrabajadas(turnosFiltrados);

      let propinas = 0;
      if (Array.isArray(persona.Propinas)) {
        propinas = persona.Propinas
          .filter((propina) => {
            const fechaPropina = new Date(propina.tipDia);
            return fechaPropina >= inicio && fechaPropina <= fin;
          })
          .reduce((total, propina) => total + parseFloat(propina.tipMonto), 0);
      }

      return {
        _id: persona._id,
        nombre: `${persona.Nombre} ${persona.Apellido}`,
        horasTrabajadas: parseFloat(horasTrabajadas.toFixed(2)),
        totalPropinas: parseFloat((propinas / 1000).toFixed(3)),
        cargo: persona.Cargo,
        turnos: turnosFiltrados,
        show: persona.Show !== false,
        Rate: persona.Rate,
        Cuenta: persona.Cuenta,
      };
    });
  }

  function calcularValorPagar(resultado, fechaInicio, fechaFin) {
    return resultado.map((persona) => {
      const baseRate = Number(persona.Rate) || 0;
      const pagoBase = persona.horasTrabajadas * baseRate;
      const seguridadSocial = pagoBase * 0.1;
      const totalNomina = parseFloat(
        (pagoBase + seguridadSocial + persona.totalPropinas).toFixed(3)
      );
      
      return {
        ...persona,
        valorPagaPorHoras: parseFloat((pagoBase + seguridadSocial).toFixed(3)),
        totalNomina,
        periodo: `${fechaInicio} a ${fechaFin}`,
      };
    });
  }

  const handleToggleHistorial = (personaId) => {
    setHistorialDesplegado((prevState) => ({
      ...prevState,
      [personaId]: !prevState[personaId],
    }));
  };

  const handleShiftFieldChange = (personaId, shiftIndex, field, value) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...(prevShifts[personaId] || [])];
      personaShifts[shiftIndex] = {
        ...personaShifts[shiftIndex],
        [field]: value,
      };
      return { ...prevShifts, [personaId]: personaShifts };
    });
  };

  const handleDeleteShift = (personaId, shiftIndex) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...(prevShifts[personaId] || [])];
      personaShifts.splice(shiftIndex, 1);
      return { ...prevShifts, [personaId]: personaShifts };
    });
  };

  const handleAddShift = (personaId) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...(prevShifts[personaId] || [])];
      const newShift = { turnoDate: "", horaInicio: "", horaSalida: "" };
      return { ...prevShifts, [personaId]: [...personaShifts, newShift] };
    });
  };

  const handleUpdateShifts = (persona) => {
    const updatedTurnos = modifiedShifts[persona._id];
    dispatch(updateLogStaff(persona._id, updatedTurnos));
    const staffActualizado = staff.map(p => 
      p._id === persona._id ? { ...p, Turnos: JSON.stringify(updatedTurnos) } : p
    );
    realizarCalculoCompleto(staffActualizado, fechaInicio, fechaFin);
  };

  return (
    <div className="flex-col w-full font-SpaceGrotesk text-notBlack min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-7xl"> {/* Aumentado el ancho máximo para más columnas */}
        <h2 className="text-2xl font-semibold mb-4 text-center">Cálculo de Nómina y Propinas</h2>
        <div className="flex justify-center gap-4 mb-4">
          <div>
            <label className="block mb-2">Fecha de Inicio:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Fecha de Fin:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={handleCalcular}
            className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
          >
            Calcular Nómina
          </button>
        </div>

        {resultados.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <h3 className="text-xl font-semibold mb-2">Resultados:</h3>
            <table className="table-auto w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Nombre</th>
                  <th className="border px-4 py-2">Horas Trab.</th>
                  <th className="border px-4 py-2">Rate</th> {/* <-- NUEVA COLUMNA */}
                  <th className="border px-4 py-2">Cuenta Bancaria</th>
                  <th className="border px-4 py-2">Pago por Horas</th>
                  <th className="border px-4 py-2">Total Nómina</th>
                  <th className="border px-4 py-2">Promedio/Hora (Check)</th> {/* <-- NUEVA COLUMNA */}
                  <th className="border px-4 py-2">Período</th>
                  <th className="border px-4 py-2">Historial</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((persona) => {
                    // --- NUEVO: Cálculo del valor de chequeo ---
                    const promedioHora = 
                        persona.horasTrabajadas > 0 
                        ? persona.totalNomina / persona.horasTrabajadas 
                        : 0;

                    return persona.show ? (
                    <React.Fragment key={persona._id}>
                      <tr>
                        <td className="border px-4 py-2">{persona.nombre}</td>
                        <td className="border px-4 py-2 text-center">{persona.horasTrabajadas}</td>
                        {/* --- NUEVO: Celda para el Rate --- */}
                        <td className="border px-4 py-2 text-right">
                            {(Number(persona.Rate) || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                        </td>
                        <td className="border px-4 py-2">{parseAndFormatCuenta(persona.Cuenta)}</td>
                        <td className="border px-4 py-2 text-right">{persona.valorPagaPorHoras.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                        <td className="border px-4 py-2 text-right">{persona.totalNomina.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                        {/* --- NUEVO: Celda para el valor de chequeo --- */}
                        <td className="border px-4 py-2 text-right font-bold">
                            {promedioHora.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                        </td>
                        <td className="border px-4 py-2">{persona.periodo}</td>
                        <td className="border px-4 py-2 text-center">
                          <button
                            onClick={() => handleToggleHistorial(persona._id)}
                            className="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-700"
                          >
                            {historialDesplegado[persona._id] ? "Ocultar" : "🗂️"}
                          </button>
                        </td>
                      </tr>
                      {historialDesplegado[persona._id] && (
                        <tr>
                          {/* --- CORREGIDO: Colspan actualizado a 9 --- */}
                          <td colSpan="9" className="border px-4 py-4 bg-gray-50">
                            <h4 className="font-semibold mb-2">Editar Turnos de {persona.nombre}</h4>
                            <table className="table-auto w-full border mt-2">
                              <thead>
                                <tr>
                                  <th className="border px-4 py-2">Fecha</th>
                                  <th className="border px-4 py-2">Hora Inicio</th>
                                  <th className="border px-4 py-2">Hora Salida</th>
                                  <th className="border px-4 py-2">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(modifiedShifts[persona._id] || []).map((turno, idx) => (
                                  <tr key={idx}>
                                    <td className="border px-2 py-1">
                                      <input type="date" value={turno.turnoDate.split('T')[0]} onChange={(e) => handleShiftFieldChange(persona._id, idx, "turnoDate", e.target.value)} className="border p-1 rounded w-full" />
                                    </td>
                                    <td className="border px-2 py-1">
                                      <input type="time" value={turno.horaInicio} onChange={(e) => handleShiftFieldChange(persona._id, idx, "horaInicio", e.target.value)} className="border p-1 rounded w-full" />
                                    </td>
                                    <td className="border px-2 py-1">
                                      <input type="time" value={turno.horaSalida} onChange={(e) => handleShiftFieldChange(persona._id, idx, "horaSalida", e.target.value)} className="border p-1 rounded w-full" />
                                    </td>
                                    <td className="border px-2 py-1 text-center">
                                      <button onClick={() => handleDeleteShift(persona._id, idx)} className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-700">
                                        Eliminar
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="mt-2">
                              <button onClick={() => handleAddShift(persona._id)} className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-700 mr-2">
                                Añadir Turno
                              </button>
                              <button onClick={() => handleUpdateShifts(persona)} className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-700">
                                Actualizar y Recalcular
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ) : null;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculoNomina;