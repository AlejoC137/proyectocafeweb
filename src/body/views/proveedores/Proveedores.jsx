import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, toggleShowEdit } from "../../../redux/actions";
import { PROVEE } from "../../../redux/actions-types";
import { CardGridProveedores } from "@/components/ui/CardGridProveedores";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";

function Proveedores() {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efecto para cargar los datos iniciales de los proveedores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await dispatch(getAllFromTable(PROVEE));
      } catch (err) {
        console.error("Error al cargar los datos:", err);
        setError("No se pudieron cargar los proveedores. Por favor, intente de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  // Función para alternar el modo de edición
  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  // Renderiza el contenido principal basado en el estado (carga, error o éxito)
  const renderContent = () => {
    if (loading) {
      return <div className="text-center mt-10 text-gray-600">Cargando proveedores...</div>;
    }
    if (error) {
      return <div className="text-center mt-10 text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
    }
    return <CardGridProveedores />;
  };

  return (
    <div className="flex flex-col w-screen p-4" style={{ paddingBottom: '120px' }}>
      <header className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Proveedores</h1>
        <button
          onClick={handleToggleShowEdit}
          className={`px-4 py-2 text-white rounded-md font-semibold transition-colors shadow-sm hover:shadow-md ${
            showEdit ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {showEdit ? "🔒 Desactivar Edición" : "✏️ Activar Edición"}
        </button>
      </header>

      {/* Componente para agregar nuevos proveedores */}
      <AccionesRapidas currentType={PROVEE} />

      {/* Contenido principal */}
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}

export default Proveedores;