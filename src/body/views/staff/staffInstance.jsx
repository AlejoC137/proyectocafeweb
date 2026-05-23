import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateStaff } from "../../../redux/actions";

function StaffInstance({ staff, editable }) {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const [unlockedForEdit, setUnlockedForEdit] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData(staff);
    }
  }, [staff]);

  if (!staff) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(updateStaff(formData));
      setIsEditing(false);
      setUnlockedForEdit(false);
    } catch (error) {
      console.error("Error al guardar info del staff:", error);
    }
  };

  const handleEditClick = () => {
    if (staff.isAdmin || unlockedForEdit) {
      setIsEditing(true);
    } else {
      setShowAdminPinPrompt(true);
      setAdminError("");
      setAdminPin("");
    }
  };

  const handleAdminAuth = () => {
    const admin = allStaff.find(s => s.isAdmin && String(s.Codigo) === adminPin.trim());
    if (admin) {
      setUnlockedForEdit(true);
      setIsEditing(true);
      setShowAdminPinPrompt(false);
    } else {
      setAdminError("PIN de administrador inválido.");
    }
  };

  const renderField = (label, name, type = "text") => {
    if (!editable || !isEditing) {
      return (
        <div className="mb-2">
          <strong className="text-on-surface-variant mr-2 inline-block w-32">{label}:</strong>
          <span className="text-on-surface">
            {typeof formData[name] === "boolean"
              ? formData[name]
                ? "Sí"
                : "No"
              : formData[name] || "-"}
          </span>
        </div>
      );
    }

    if (type === "checkbox") {
      return (
        <div className="mb-3 flex items-center gap-2">
          <strong className="text-on-surface-variant w-1/3">{label}:</strong>
          <input
            type="checkbox"
            name={name}
            checked={formData[name] || false}
            onChange={handleChange}
            className="w-5 h-5 accent-primary-stitch"
          />
        </div>
      );
    }

    return (
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <strong className="text-on-surface-variant w-full sm:w-1/3">{label}:</strong>
        <input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          className="flex-1 bg-surface-main border border-outline-variant rounded-lg p-2 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none"
        />
      </div>
    );
  };

  return (
    <div className="bg-surface-main p-4 md:p-6 rounded-xl border border-outline-variant shadow-sm w-full">
      <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
        <h2 className="font-headline-sm text-primary-stitch">Información del Staff</h2>
        <div className="flex items-center gap-2">
          {adminError && <span className="text-error text-xs mr-2">{adminError}</span>}
          {editable && !isEditing && !showAdminPinPrompt && (
            <button
              onClick={handleEditClick}
              className="px-3 py-1.5 bg-secondary-stitch text-white rounded-lg text-sm font-label-md hover:brightness-110 active:scale-95 transition-all"
            >
              Editar
            </button>
          )}
          {showAdminPinPrompt && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="PIN Admin"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                className="bg-surface-main border border-outline-variant rounded-lg p-1.5 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none w-28"
              />
              <button
                onClick={handleAdminAuth}
                className="px-3 py-1.5 bg-primary-stitch text-white rounded-lg text-sm font-label-md hover:brightness-110 active:scale-95 transition-all"
              >
                Verificar
              </button>
              <button
                onClick={() => {
                  setShowAdminPinPrompt(false);
                  setAdminError("");
                }}
                className="px-3 py-1.5 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-label-md hover:bg-surface-container active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-body-sm md:text-body-md">
        <div className="mb-4 pb-2 border-b border-outline-variant/50 text-xs text-outline font-mono">
          <strong>_id:</strong> {staff._id}
        </div>

        {renderField("Nombre", "Nombre")}
        {renderField("Apellido", "Apellido")}
        {renderField("Cédula (CC)", "CC")}

        {editable && isEditing ? (
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <strong className="text-on-surface-variant w-full sm:w-1/3">Cargo:</strong>
            <select
              name="Cargo"
              value={formData.Cargo || ""}
              onChange={handleChange}
              className="flex-1 bg-surface-main border border-outline-variant rounded-lg p-2 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none"
            >
              <option value="">Seleccione...</option>
              <option value="MANAGER">MANAGER</option>
              <option value="MESERO">MESERO</option>
              <option value="COCINA">COCINA</option>
              <option value="BARRA">BARRA</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>
          </div>
        ) : (
          renderField("Cargo", "Cargo")
        )}

        {editable && isEditing ? (
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <strong className="text-on-surface-variant w-full sm:w-1/3">Estado:</strong>
            <select
              name="Estado"
              value={formData.Estado || ""}
              onChange={handleChange}
              className="flex-1 bg-surface-main border border-outline-variant rounded-lg p-2 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none"
            >
              <option value="">Seleccione...</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="VACACIONES">VACACIONES</option>
            </select>
          </div>
        ) : (
          renderField("Estado", "Estado")
        )}

        {renderField("PIN / Código", "Codigo")}
        {renderField("Rate (Base)", "Rate", "number")}
        {renderField("Admin", "isAdmin", "checkbox")}
        {renderField("Mostrar Sistema", "Show", "checkbox")}
        {renderField("Contratación", "Contratacion", "checkbox")}
      </div>

      {editable && isEditing && (
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData(staff);
              setUnlockedForEdit(false);
            }}
            className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg font-label-md hover:bg-surface-container active:scale-95 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-success-sage text-white rounded-lg font-label-md hover:brightness-110 active:scale-95 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
}

export default StaffInstance;