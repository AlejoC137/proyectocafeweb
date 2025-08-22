import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { STAFF } from "../../../redux/actions-types";

const staffNomina = () => {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [resultados, setResultados] = useState([]);
  const [show, setShow] = useState({});
  const [modifiedShifts, setModifiedShifts] = useState({});

 const tarifas = {
    "AUXILIAR COCINA JN": 7528+(8489*0.1),
    "AUX PRODUCCION": 8489+(8489*0.1),
    "Barista SN": 9095+(8489*0.1),
    
  };

  useEffect(() => {
    dispatch(getAllFromTable(STAFF));
  }, [dispatch]);

  const handleCalcular = () => {
    const resultado = calcularHorasYPropinas(staff, fechaInicio, fechaFin);
    const valorPagarPorPersona = calcularValorPagar(
      resultado,
      tarifas,
      fechaInicio,
      fechaFin
    );
    setResultados(valorPagarPorPersona);

    // Initialize modifiedShifts
    const shiftsByPersona = {};
    valorPagarPorPersona.forEach((persona) => {
      shiftsByPersona[persona._id] = [...persona.turnos];
    });
    setModifiedShifts(shiftsByPersona);
  };

  function calcularHorasYPropinas(data, fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    return data
      .filter((persona) => persona.show === true)
      .map((persona) => {
        const turnosFiltrados = (persona.Turno_Pasados || [])
          .filter((turno) => {
            const fechaTurno = new Date(turno.turnoDate);
            return fechaTurno >= inicio && fechaTurno <= fin;
          })
          .map((turno, idx) => ({ ...turno, id: idx })); // Assign an id if not present

        const horasTrabajadas = turnosFiltrados.reduce((total, turno) => {
          const horaInicio = new Date(`${turno.turnoDate}T${turno.horaInicio}`);
          const horaSalida =
            turno.horaSalida === "PENDING"
              ? new Date()
              : new Date(`${turno.turnoDate}T${turno.horaSalida}`);
          return total + (horaSalida - horaInicio) / (1000 * 60 * 60);
        }, 0);

        const propinasFiltradas = (persona.Propinas_PP || []).filter(
          (propina) => {
            const fechaPropina = new Date(propina.tipDia);
            return fechaPropina >= inicio && fechaPropina <= fin;
          }
        );

        const totalPropinas = propinasFiltradas.reduce((total, propina) => {
          return total + parseFloat(propina.tipMonto);
        }, 0);

        return {
          _id: persona._id,
          nombre: `${persona.Nombre} ${persona.Apellido}`,
          horasTrabajadas: parseFloat(horasTrabajadas.toFixed(2)),
          totalPropinas: parseFloat((totalPropinas / 1000).toFixed(3)),
          cargo: persona.Cargo,
          turnos: turnosFiltrados,
          originalTurnos: persona.Turno_Pasados || [], // Keep original Turno_Pasados
        };
      });
  }

  function calcularValorPagar(resultado, tarifas, fechaInicio, fechaFin) {
    return resultado.map((persona) => {
      const tarifaHora = tarifas[persona.cargo] || 0;

      const valorPagaPorHoras = parseFloat(
        ((persona.horasTrabajadas * tarifaHora) / 1000).toFixed(3)
      );

      const totalNomina = parseFloat(
        (valorPagaPorHoras + persona.totalPropinas).toFixed(3)
      );

      return {
        ...persona,
        valorPagaPorHoras,
        totalNomina,
        periodo: `${fechaInicio} a ${fechaFin}`,
      };
    });
  }

  const handleToggleHistorial = (index) => {
    setShow((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleShiftFieldChange = (personaId, shiftIndex, field, value) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...prevShifts[personaId]];
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
      const personaShifts = [...prevShifts[personaId]];
      personaShifts.splice(shiftIndex, 1);
      return {
        ...prevShifts,
        [personaId]: personaShifts,
      };
    });
  };

  const handleAddShift = (personaId) => {
    setModifiedShifts((prevShifts) => {
      const personaShifts = [...prevShifts[personaId]];
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
    const updatedShifts = modifiedShifts[persona._id];
    // dispatch(updateLogStaff(persona._id, updatedShifts));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        Cálculo de Nómina y Propinas
      </h2>

      {/* Inputs para las fechas */}
      <div className="mb-4">
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

      {/* Mostrar resultados */}
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
              {resultados.map((persona, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="border px-4 py-2">{persona.nombre}</td>
                    <td className="border px-4 py-2">
                      {persona.horasTrabajadas}
                    </td>
                    <td className="border px-4 py-2">
                      {persona.totalPropinas}
                    </td>
                    <td className="border px-4 py-2">
                      {persona.valorPagaPorHoras}
                    </td>
                    <td className="border px-4 py-2">
                      {persona.totalNomina}
                    </td>
                    <td className="border px-4 py-2">{persona.periodo}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleToggleHistorial(index)}
                        className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-700"
                      >
                        {show[index] ? "Ocultar" : "🗂️"}
                      </button>
                    </td>
                  </tr>

                  {/* Mostrar historial de turnos si está desplegado */}
                  {show[index] && (
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
                            {modifiedShifts[persona._id]?.map((turno, idx) => (
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
                        {/* Add Shift Button */}
                        <button
                          onClick={() => handleAddShift(persona._id)}
                          className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-700 mt-2"
                        >
                          Add Shift
                        </button>
                        {/* Update Shifts Button */}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default staffNomina;
