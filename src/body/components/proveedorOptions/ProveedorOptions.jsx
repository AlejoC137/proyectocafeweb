import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions-Proveedores";
import { PROVEE } from "../../../redux/actions-types";

function ProveedorOptions({ selectedProveedor, onChange }) {
  const dispatch = useDispatch();
  const Proveedores = useSelector((state) => state.Proveedores || []);

  useEffect(() => {
    dispatch(getAllFromTable(PROVEE));
  }, [dispatch]);

  const handleProveedorChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    } else {
      console.error("onChange prop is not provided");
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-4">Seleccionar Proveedor</h2>
      <select
        value={selectedProveedor}
        onChange={handleProveedorChange}
        className="w-full p-2 mb-4 border rounded bg-slate-50"
      >
        <option value="">Seleccione un proveedor</option>
        {Proveedores.map((proveedor) => (
          <option key={proveedor._id} value={proveedor.Nombre_Proveedor}>
            {proveedor.Nombre_Proveedor}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProveedorOptions;

