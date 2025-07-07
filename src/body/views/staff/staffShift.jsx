import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem } from "../../../redux/actions-Staff";

function StaffShift({ staffId }) {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const staff = allStaff.find((s) => s._id === staffId);

  // Inicializar turnos desde Redux
  const [turnos, setTurnos] = useState(() => {
    if (!staff) return [];
    if (Array.isArray(staff.Turnos)) return staff.Turnos;
    if (typeof staff.Turnos === "string" && staff.Turnos.trim() !== "") {
      try {
        return JSON.parse(staff.Turnos);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [alerta, setAlerta] = useState("");

  // Detectar si hay un turno abierto (sin cerrar)
  const turnoAbierto =
    turnos.length > 0 && turnos[turnos.length - 1].horaCierre === "false";

  // Sincronizar turnos con Redux cuando cambie el staff
  useEffect(() => {
    if (!staff) return setTurnos([]);
    if (Array.isArray(staff.Turnos)) setTurnos(staff.Turnos);
    else if (typeof staff.Turnos === "string" && staff.Turnos.trim() !== "") {
      try {
        setTurnos(JSON.parse(staff.Turnos));
      } catch {
        setTurnos([]);
      }
    } else {
      setTurnos([]);
    }
  }, [staff]);

  // Limpiar alerta después de 3 segundos
  useEffect(() => {
    if (alerta) {
      const timer = setTimeout(() => setAlerta(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [alerta]);

  // Iniciar turno
  const iniciarTurno = async () => {
    if (turnoAbierto) {
      setAlerta("Ya hay un turno iniciado.");
      return;
    }
    const ahora = new Date();
    const nuevoTurno = {
      fecha: ahora.toISOString().split("T")[0],
      horaInicio: ahora.toTimeString().split(" ")[0].slice(0, 5),
      horaCierre: "false",
    };
    const nuevosTurnos = [...turnos, nuevoTurno];
    setTurnos(nuevosTurnos);

    await dispatch(
      updateItem(
        staffId,
        { Turnos: JSON.stringify(nuevosTurnos), Estado: true },
        "Staff"
      )
    );
    setAlerta("Turno iniciado correctamente.");
  };

  // Cerrar turno
  const cerrarTurno = async () => {
    if (!turnoAbierto) {
      setAlerta("Primero debes iniciar un turno.");
      return;
    }
    const cierre = new Date();
    const nuevosTurnos = turnos.map((t, idx, arr) => {
      if (idx === arr.length - 1 && t.horaCierre === "false") {
        return {
          ...t,
          horaCierre: cierre.toTimeString().split(" ")[0].slice(0, 5),
        };
      }
      return t;
    });
    setTurnos(nuevosTurnos);

    await dispatch(
      updateItem(
        staffId,
        { Turnos: JSON.stringify(nuevosTurnos), Estado: false },
        "Staff"
      )
    );
    setAlerta("Turno cerrado correctamente.");
  };

  return (
    <div>
      <h2 className="font-bold mb-2">Gestión de Turnos</h2>
      {alerta && (
        <div className="mb-2 p-2 bg-yellow-200 text-yellow-800 rounded">
          {alerta}
        </div>
      )}
      <button
        onClick={iniciarTurno}
        className={`bg-green-500 text-white px-4 py-1 rounded mr-2 ${
          turnoAbierto ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={turnoAbierto}
      >
        Iniciar Turno
      </button>
      <button
        onClick={cerrarTurno}
        className={`bg-red-500 text-white px-4 py-1 rounded ${
          !turnoAbierto ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={!turnoAbierto}
      >
        Cerrar Turno
      </button>

      <div className="mt-4">
        <h3 className="font-semibold mb-1">Historial de Turnos:</h3>
        <ul className="text-sm">
          {turnos.length === 0 && <li>No hay turnos registrados.</li>}
          {turnos.map((t, i) => (
            <li key={i}>
              {t.fecha} — {t.horaInicio} a {t.horaCierre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StaffShift;
