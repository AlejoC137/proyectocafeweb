import React from "react";
function StaffShift({ staffId }) {
  return (
    <div>
      <h2 className="font-bold mb-2">Gestión de Turnos</h2>
      <button className="bg-green-500 text-white px-4 py-1 rounded mr-2">Iniciar Turno</button>
      <button className="bg-red-500 text-white px-4 py-1 rounded">Cerrar Turno</button>
    </div>
  );
}
export default StaffShift;