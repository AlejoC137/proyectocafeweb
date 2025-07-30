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
    // Si quieres cargar staff al montar, descomenta:
    dispatch(getAllFromTable(STAFF));
  }, [dispatch]);

  const handleCalcular = () => {
    const data = staff || [];
    const resultado = calcularHorasYPropinas(data, fechaInicio, fechaFin);
    const valorPagarPorPersona = calcularValorPagar(
      resultado,
      fechaInicio,
      fechaFin
    );
    setResultados(valorPagarPorPersona);

    // Inicializa los turnos editables para cada persona
    const shiftsByPersona = {};
    valorPagarPorPersona.forEach((persona, idx) => {
      // Usa persona._id si existe, si no, usa el índice
      const key = persona._id || idx;
      shiftsByPersona[key] = [...(persona.turnos || [])];
    });
    setModifiedShifts(shiftsByPersona);
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
          if (Array.isArray(parsed)) {
            turnos = parsed;
          } else if (typeof parsed === "object" && parsed !== null) {
            turnos = [parsed];
          }
        } catch {
          turnos = [
            {
              fecha: persona.Turnos,
              horaInicio: "08:00",
              horaCierre: "17:00",
            },
          ];
        }
      }
      const turnosNormalizados = turnos.map((t) => ({
        turnoDate: t.fecha || t.turnoDate || t.date || "",
        horaInicio: t.horaInicio || t.horaEntrada || t.hora || "08:00",
        horaSalida: t.horaCierre || t.horaSalida || t.horaFin || "17:00",
      }));

      const turnosFiltrados = turnosNormalizados.filter((turno) => {
        if (!turno.turnoDate) return false;
        const fechaTurno = new Date(turno.turnoDate);
        return fechaTurno >= inicio && fechaTurno <= fin;
      });

      const CompiladorHorasTrabajadas = (turnos) => {
        if (!Array.isArray(turnos) || turnos.length === 0) {
          return 0;
        }
        const totalHoras = turnos.reduce((acumulador, turno) => {
          if (
            !turno.horaInicio ||
            !turno.horaSalida ||
            turno.horaSalida === "PENDING"
          ) {
            return acumulador;
          }
          const [horaInicioStr, minutoInicioaStr] = turno.horaInicio.split(":");
          const [horaSalidaStr, minutoSalidaStr] = turno.horaSalida.split(":");
          const horasTurno =
            ((horaSalidaStr - horaInicioStr) * 60 +
              (minutoSalidaStr - minutoInicioaStr)) /
            60;
          return acumulador + horasTurno;
        }, 0);
        return totalHoras;
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
      } else if (typeof persona.Propinas === "number") {
        propinas = persona.Propinas;
      } else if (
        typeof persona.Propinas === "string" &&
        persona.Propinas.trim() &&
        !isNaN(Number(persona.Propinas))
      ) {
        propinas = Number(persona.Propinas);
      }

      return {
        _id: persona._id, // importante para identificar
        nombre: `${persona.Nombre} ${persona.Apellido}`,
        horasTrabajadas: parseFloat(horasTrabajadas.toFixed(2)),
        totalPropinas: parseFloat((propinas / 1000).toFixed(3)),
        cargo: persona.Cargo,
        turnos: turnosFiltrados,
        show: persona.Show !== false,
        Rate: persona.Rate,
      };
    });
  }

  function calcularValorPagar(resultado, fechaInicio, fechaFin) {
    return resultado.map((persona) => {
      const baseRate = Number(persona.Rate) > 0 ? Number(persona.Rate) : 0;
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

  const handleToggleHistorial = (index) => {
    setHistorialDesplegado((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  // --- CORREGIDOS: Siempre usa array vacío si no existe ---
  const handleShiftFieldChange = (personaId, shiftIndex, field, value) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...(prevShifts[personaId] || [])];
      personaShifts[shiftIndex] = {
        ...personaShifts[shiftIndex],
        [field]: value,
      };
      return {
        ...prevShifts,
        [personaId]: personaShifts,
      };
    });
  };

  const handleDeleteShift = (personaId, shiftIndex) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...(prevShifts[personaId] || [])];
      personaShifts.splice(shiftIndex, 1);
      return {
        ...prevShifts,
        [personaId]: personaShifts,
      };
    });
  };

  const handleAddShift = (personaId) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...(prevShifts[personaId] || [])];
      const newShift = {
        turnoDate: "",
        horaInicio: "",
        horaSalida: "",
      };
      personaShifts.push(newShift);
      return {
        ...prevShifts,
        [personaId]: personaShifts,
      };
    });
  };

  const handleUpdateShifts = (persona) => {
    // Aquí deberías hacer el dispatch a tu backend si lo necesitas
    dispatch(updateLogStaff(persona._id, modifiedShifts[persona._id]));
    // También puedes recalcular resultados si quieres ver los cambios reflejados
    setResultados((prev) =>
      prev.map((p) =>
        p._id === persona._id
          ? { ...p, turnos: modifiedShifts[persona._id] || [] }
          : p
      )
    );
  };

  return (
    <div className="flex-col w-full font-SpaceGrotesk text-notBlack min-h-screen flex items-center justify-center h-screen w-screen">
      <h2 className="text-xl font-semibold mb-4">Cálculo de Nómina y Propinas</h2>
      <div className="mb-4 ">
        <label className="block mb-2">Fecha de Inicio:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Fecha de Fin:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <button
        onClick={handleCalcular}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Calcular Nómina
      </button>
      {resultados.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Resultados:</h3>
          <table className="table-auto w-full border-collapse border">
            <thead>
              <tr>
                <th className="border px-4 py-2">Nombre</th>
                <th className="border px-4 py-2">Horas Trabajadas</th>
                <th className="border px-4 py-2">Total Propinas</th>
                <th className="border px-4 py-2">Pago por Horas</th>
                <th className="border px-4 py-2">Total Nómina</th>
                <th className="border px-4 py-2">Período</th>
                <th className="border px-4 py-2">Historial</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((persona, index) =>
                persona.show ? (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="border px-4 py-2">{persona.nombre}</td>
                      <td className="border px-4 py-2">{persona.horasTrabajadas}</td>
                      <td className="border px-4 py-2">{persona.totalPropinas}</td>
                      <td className="border px-4 py-2">{persona.valorPagaPorHoras}</td>
                      <td className="border px-4 py-2">{persona.totalNomina}</td>
                      <td className="border px-4 py-2">{persona.periodo}</td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => handleToggleHistorial(index)}
                          className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-700"
                        >
                          {historialDesplegado[index] ? "Ocultar" : "🗂️"}
                        </button>
                      </td>
                    </tr>
                    {historialDesplegado[index] && (
                      <tr>
                        <td colSpan="7" className="border px-4 py-2">
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
                              {(modifiedShifts[persona._id] || persona.turnos || []).map((turno, idx) => (
                                <tr key={idx}>
                                  <td className="border px-4 py-2">
                                    <input
                                      type="date"
                                      value={turno.turnoDate}
                                      onChange={(e) =>
                                        handleShiftFieldChange(
                                          persona._id,
                                          idx,
                                          "turnoDate",
                                          e.target.value
                                        )
                                      }
                                      className="border p-1 rounded w-full"
                                    />
                                  </td>
                                  <td className="border px-4 py-2">
                                    <input
                                      type="text"
                                      value={turno.horaInicio}
                                      onChange={(e) =>
                                        handleShiftFieldChange(
                                          persona._id,
                                          idx,
                                          "horaInicio",
                                          e.target.value
                                        )
                                      }
                                      className="border p-1 rounded w-full"
                                    />
                                  </td>
                                  <td className="border px-4 py-2">
                                    <input
                                      type="text"
                                      value={turno.horaSalida}
                                      onChange={(e) =>
                                        handleShiftFieldChange(
                                          persona._id,
                                          idx,
                                          "horaSalida",
                                          e.target.value
                                        )
                                      }
                                      className="border p-1 rounded w-full"
                                    />
                                  </td>
                                  <td className="border px-4 py-2">
                                    <button
                                      onClick={() =>
                                        handleDeleteShift(persona._id, idx)
                                      }
                                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-700 mr-2"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button
                            onClick={() => handleAddShift(persona._id)}
                            className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-700 mt-2"
                          >
                            Add Shift
                          </button>
                          <button
                            onClick={() => handleUpdateShifts(persona)}
                            className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-700 mt-2"
                          >
                            Update Shifts
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CalculoNomina;