import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable } from "../../../redux/actions";
import { STAFF, WORKISUE } from "../../../redux/actions-types";
import StaffInstance from "./staffInstance";
import StaffShift from "./staffShift";
import StaffWorkIssues from "./staffWorkIssues";

function StaffPortal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [ccInput, setCcInput] = useState("");
  const [staffFound, setStaffFound] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState(null);
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
    const staff = allStaff.find((s) =>
      String(s.CC).startsWith(ccInput.trim())
    );
    if (staff) {
      setStaffFound(staff);
      setCcInput("");
    } else {
      setStaffFound(null);
      setError("No se encontró personal con esos primeros 4 dígitos de CC.");
    }
  };

  const handlePropinaSubmit = (e) => {
    e.preventDefault();
    if (!staffFound) return;
    setPropinaInput("");
  };

  const handleGoToNomina = () => {
    navigate("/CalculoNomina");
  };

  return (
    <div className="min-h-screen flex items-center justify-center h-screen w-screen">
      <div className="p-4 max-w-[450px] w-full mx-auto font-SpaceGrotesk text-notBlack bg-cream rounded-lg shadow-md">
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Ingrese CC"
            value={ccInput}
            onChange={(e) => setCcInput(e.target.value.replace(/\D/g, ""))}
            className="border border-softGrey rounded-lg px-3 py-2 text-[12pt] flex-1"
          />
          <button
            type="submit"
            className="bg-lilaDark text-white px-4 py-2 rounded-xl shadow"
          >
            Buscar
          </button>
        </form>

        {loading && (
          <div className="text-muted-foreground mb-2">Cargando datos...</div>
        )}
        {error && <div className="text-pureRed mb-2">{error}</div>}

        {/* Propina siempre visible */}
        <form onSubmit={handlePropinaSubmit} className="mb-4 flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Ingresar propina"
            value={propinaInput}
            onChange={(e) => setPropinaInput(e.target.value.replace(/\D/g, ""))}
            className="border border-softGrey rounded-lg px-3 py-2 text-[12pt] flex-1"
          />
          <button
            type="submit"
            className="bg-greenish text-white px-4 py-2 rounded-xl shadow"
          >
            Actualizar Propina
          </button>
        </form>

        {/* Botones generales */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            className="bg-ladrillo text-white py-3 rounded-2xl shadow-md"
            onClick={() => setActiveView("workissues")}
          >
            🛠️ Work Issues
          </button>
          <button
            className="bg-notBlack text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/Manager")}
          >
            🧠 Manager
          </button>
          <button
            className="bg-indigo-600 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/Inventario")}
          >
            📦 Inventario
          </button>
          <button
            className="bg-sky-600 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/MenuPrint")}
          >
            🖨️ Menu Print
          </button>
          
          <button
            className="bg-pink-600 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/VentaCompra")}
          >
            💰 Venta / Compra
          </button>
          <button
            className="bg-teal-600 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/Proveedores")}
          >
            📇 Proveedores
          </button>
        </div>

        {staffFound && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                // className="bg-blue-600 text-white py-3 rounded-2xl shadow-md"
                            className="bg-sky-600 text-white py-3 rounded-2xl shadow-md"

                onClick={() => setActiveView("instance")}
              >
                ✏️ Editar Información
              </button>


              <button
                className="bg-yellow-500 text-white py-3 rounded-2xl shadow-md"

                onClick={() => setActiveView("shift")}
              >
                🕒 Turnos
              </button>
              <button
                className="bg-green-500 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/Gastos")}
              >
                💵 Gastos
              </button>

              {staffFound.isAdmin && (
                <button
                  className="bg-purple-500 text-white py-3 rounded-2xl shadow-md"
                  onClick={handleGoToNomina}
                >
                  📊 Ver Nómina
                </button>
              )}

              {staffFound.isAdmin && (
                <button
                  className="bg-purple-500 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/DiaResumen")}
                >
                  📆 Ver resumen del día
                </button>
              )}
              {staffFound.isAdmin && (
                <button
                  className="bg-purple-500 text-white py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/MesResumen")}
                >
                  📅 Ver resumen del mes
                </button>
              )}
            </div>
            {activeView === "instance" && (
              <StaffInstance staff={staffFound} editable />
            )}
            {activeView === "shift" && (
              <StaffShift staffId={staffFound._id} estaffid={staffFound._id} />
            )}
          </div>
        )}

        {/* Work issues disponibles siempre */}
        {activeView === "workissues" && (
          <StaffWorkIssues staffId={staffFound ? staffFound._id : null} />
        )}
      </div>
    </div>
  );
}

export default StaffPortal;
