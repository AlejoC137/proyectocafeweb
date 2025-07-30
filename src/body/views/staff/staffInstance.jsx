import React from "react";

function StaffInstance({ staff }) {
  if (!staff) return null;
  return (
    <div className="bg-red-500 -100 p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Información del Staff</h2>
      <div className="mb-1"><strong>_id:</strong> {staff._id}</div>
      <div className="mb-1"><strong>uuid:</strong> {staff.uuid}</div>
      <div className="mb-1"><strong>Propinas:</strong> {staff.Propinas}</div>
      <div className="mb-1"><strong>Turno_State:</strong> {staff.Turno_State}</div>
      <div className="mb-1"><strong>Turnos:</strong> {staff.Turnos}</div>
      <div className="mb-1"><strong>Nombre:</strong> {staff.Nombre}</div>
      <div className="mb-1"><strong>Apellido:</strong> {staff.Apellido}</div>
      <div className="mb-1"><strong>Cargo:</strong> {staff.Cargo}</div>
      <div className="mb-1"><strong>Cuenta:</strong> {staff.Cuenta}</div>
      <div className="mb-1"><strong>Rate:</strong> {staff.Rate}</div>
      <div className="mb-1"><strong>Show:</strong> {String(staff.Show)}</div>
      <div className="mb-1"><strong>CC:</strong> {staff.CC}</div>
      <div className="mb-1"><strong>Estado:</strong> {staff.Estado}</div>
      <div className="mb-1"><strong>Contratacion:</strong> {String(staff.Contratacion)}</div>
    </div>
  );
}

export default StaffInstance;