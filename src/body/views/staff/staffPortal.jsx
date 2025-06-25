import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllFromTable, 
  // updateStaffPropinas
 } from "../../../redux/actions";
import { STAFF , WORKISUE , PRODUCCION , PROCEDE} from "../../../redux/actions-types";
import StaffInstance from "./staffInstance";
import StaffNomina from "./staffNomina";
import StaffShift from "./staffShift";
import StaffWorkIssues from "./staffWorkIssues";
import StaffIngresarPropina from "./staffIngresarPropina";

function StaffPortal() {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [ccInput, setCcInput] = useState("");
  const [staffFound, setStaffFound] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Para navegación entre vistas
  const [activeView, setActiveView] = useState(null);

  // Para propinas
  const [propinaInput, setPropinaInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(STAFF));
        await dispatch(getAllFromTable(WORKISUE));
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");
    setActiveView(null);
    const staff = allStaff.find((s) => String(s.CC) === ccInput.trim());
    if (staff) {
      setStaffFound(staff);
    } else {
      setStaffFound(null);
      setError("No se encontró personal con esa CC.");
    }
  };

  // Actualizar propinas
  const handlePropinaSubmit = (e) => {
    e.preventDefault();
    if (!staffFound) return;
    // dispatch(updateStaffPropinas(staffFound._id, Number(propinaInput)));
    setPropinaInput("");
    // Opcional: recargar staffFound desde redux si es necesario
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
           {/* Input para ingresar propina */}
          <form onSubmit={handlePropinaSubmit} className="mb-4 flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Ingresar propina"
              value={propinaInput}
              onChange={(e) => setPropinaInput(e.target.value.replace(/\D/g, ""))}
              className="border rounded px-2 py-1 flex-1"
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-1 rounded"
            >
              Actualizar Propina
            </button>
          </form>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ingrese CC"
          value={ccInput}
          onChange={(e) => setCcInput(e.target.value.replace(/\D/g, ""))}
          className="border rounded px-2 py-1 flex-1"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Buscar
        </button>
      </form>
      {loading && <div className="text-gray-500 mb-4">Cargando datos...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {staffFound && (
        <div>
     
          {/* Botones de navegación 2x2 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              className="bg-blue-600 text-white py-2 rounded"
              onClick={() => setActiveView("instance")}
            >
              Editar Información
            </button>
            <button
              className="bg-purple-600 text-white py-2 rounded"
              onClick={() => setActiveView("nomina")}
            >
              Ver Nómina
            </button>
            <button
              className="bg-yellow-600 text-white py-2 rounded"
              onClick={() => setActiveView("shift")}
            >
              Turnos
            </button>
            <button
              className="bg-red-600 text-white py-2 rounded"
              onClick={() => setActiveView("workissues")}
            >
              Work Issues
            </button>
          </div>
          {/* Renderizado condicional de vistas */}
          {activeView === "instance" && <StaffInstance staff={staffFound} editable />}
          {activeView === "nomina" && <StaffNomina staffId={staffFound._id} />}
          {activeView === "shift" && <StaffShift staffId={staffFound._id} />}
          {activeView === "workissues" && <StaffWorkIssues staffId={staffFound._id} />}
        </div>
      )}
    </div>
  );
}

export default StaffPortal;