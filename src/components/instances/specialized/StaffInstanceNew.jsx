import React from 'react';
import { StaffInstanceCard } from '../base/InstanceCard';
import { useStaffForm } from '../hooks/useInstanceForm';
import { useStaffActions } from '../hooks/useInstanceActions';
import { useJSONField } from '../hooks/useJSONField';

/**
 * Componente StaffInstance refactorizado usando la nueva arquitectura
 * CRUD completo para gestión de staff con campos anidados JSON
 */
export function StaffInstanceNew({ staff, displayMode = 'full' }) {
  
  // Usar hooks de la nueva arquitectura
  const { formData, handleChange, isDirty, markAsSaved } = useStaffForm(staff);
  const { 
    handleUpdate, 
    handleDelete, 
    handleStatusChange,
    buttonState,
    canSave 
  } = useStaffActions(staff._id, {
    onSuccess: () => markAsSaved(),
    reloadOnSuccess: false,
    showAlerts: true
  });

  // Usar hooks para campos JSON anidados
  const cuentaBancaria = useJSONField(staff.Cuenta, { banco: "", tipo: "", numero: "" });
  const infoContacto = useJSONField(staff.infoContacto, { nombreDeContacto: "", numeroDeContacto: "" });

  // Función para guardar con datos JSON formateados
  const onSave = async () => {
    const updatedData = {
      ...formData,
      Cuenta: cuentaBancaria.stringifyValue,
      infoContacto: infoContacto.stringifyValue
    };
    
    await handleUpdate(updatedData);
  };

  // Renderizado simple para displayMode = 'simple'
  if (displayMode === 'simple') {
    return (
      <div className="bg-red-500 p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-2 text-white">Información del Staff</h2>
        <div className="space-y-1 text-white">
          <div><strong>ID:</strong> {staff._id}</div>
          <div><strong>UUID:</strong> {staff.uuid}</div>
          <div><strong>Propinas:</strong> {staff.Propinas}</div>
          <div><strong>Turno State:</strong> {staff.Turno_State}</div>
          <div><strong>Turnos:</strong> {staff.Turnos}</div>
          <div><strong>Nombre:</strong> {staff.Nombre}</div>
          <div><strong>Apellido:</strong> {staff.Apellido}</div>
          <div><strong>Cargo:</strong> {staff.Cargo}</div>
          <div><strong>Cuenta:</strong> {staff.Cuenta}</div>
          <div><strong>Rate:</strong> {staff.Rate}</div>
          <div><strong>Show:</strong> {String(staff.Show)}</div>
          <div><strong>CC:</strong> {staff.CC}</div>
          <div><strong>Estado:</strong> {staff.Estado}</div>
          <div><strong>Contratacion:</strong> {String(staff.Contratacion)}</div>
        </div>
      </div>
    );
  }

  // Formulario completo de staff
  const staffForm = (
    <div className="space-y-4">
      
      {/* Información básica */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          Nombre:
          <input
            type="text"
            name="Nombre"
            value={formData.Nombre}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Apellido:
          <input
            type="text"
            name="Apellido"
            value={formData.Apellido}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
      </div>

      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          Cargo:
          <input
            type="text"
            name="Cargo"
            value={formData.Cargo}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
      </div>

      {/* Información de contacto */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          CC:
          <input
            type="number"
            name="CC"
            value={formData.CC}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Celular:
          <input
            type="text"
            name="Celular"
            value={formData.Celular}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
      </div>

      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          Dirección:
          <input
            type="text"
            name="Direccion"
            value={formData.Direccion}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Rate:
          <input
            type="number"
            name="Rate"
            value={formData.Rate}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
          Show:
          <input
            type="checkbox"
            name="Show"
            checked={formData.Show}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
          Contratacion:
          <input
            type="checkbox"
            name="Contratacion"
            checked={formData.Contratacion}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
          Es Admin:
          <input
            type="checkbox"
            name="isAdmin"
            checked={formData.isAdmin}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1"
          />
        </label>
      </div>

      {/* Cuenta bancaria anidada */}
      <div className="border rounded p-3 bg-gray-50">
        <span className="text-sm text-gray-800 font-medium mb-2 block">Cuenta Bancaria:</span>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Banco"
            value={cuentaBancaria.value.banco}
            onChange={(e) => cuentaBancaria.updateField('banco', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="Tipo"
            value={cuentaBancaria.value.tipo}
            onChange={(e) => cuentaBancaria.updateField('tipo', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="Número"
            value={cuentaBancaria.value.numero}
            onChange={(e) => cuentaBancaria.updateField('numero', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 flex-1"
          />
        </div>
      </div>

      {/* Contacto de emergencia anidado */}
      <div className="border rounded p-3 bg-gray-50">
        <span className="text-sm text-gray-800 font-medium mb-2 block">Contacto de Emergencia:</span>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Nombre de Contacto"
            value={infoContacto.value.nombreDeContacto}
            onChange={(e) => infoContacto.updateField('nombreDeContacto', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="Número de Contacto"
            value={infoContacto.value.numeroDeContacto}
            onChange={(e) => infoContacto.updateField('numeroDeContacto', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 flex-1"
          />
        </div>
      </div>
    </div>
  );

  return (
    <StaffInstanceCard
      title={`${formData.Nombre} ${formData.Apellido}`}
      subtitle={`${formData.Cargo} - Rate: $${formData.Rate}`}
      data={staff}
      buttonState={buttonState}
      onSave={onSave}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      showActions={true}
      showStatusButtons={true}
      className="w-full"
    >
      {staffForm}
    </StaffInstanceCard>
  );
}
