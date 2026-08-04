import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllFromTable, setCurrentStaff, fetchViewPreferences } from "../redux/actions";
import { STAFF } from "../redux/actions-types";

export default function GlobalAuthModal({ children }) {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const currentStaff = useSelector((state) => state.currentStaff);
  
  const [ccInput, setCcInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Restore staff from localStorage and fetch allStaff on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        if (allStaff.length === 0) {
          await dispatch(getAllFromTable(STAFF));
        }
      } catch (err) {
        console.error("Error fetching staff for auth:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [dispatch, allStaff.length]);

  // Restore session
  useEffect(() => {
    if (allStaff.length > 0 && !currentStaff) {
      const savedStaffId = localStorage.getItem("staffFoundId");
      if (savedStaffId) {
        const staff = allStaff.find((s) => s._id === savedStaffId);
        if (staff) {
          dispatch(setCurrentStaff(staff));
          dispatch(fetchViewPreferences(staff._id));
        }
      }
    }
  }, [allStaff, currentStaff, dispatch]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    const staff = allStaff.find((s) => String(s.CC).startsWith(ccInput.trim()));
    if (staff) {
      if (staff.Codigo && String(staff.Codigo) !== pinInput.trim()) {
        setError("PIN incorrecto.");
        return;
      }
      dispatch(setCurrentStaff(staff));
      dispatch(fetchViewPreferences(staff._id));
      localStorage.setItem("staffFoundId", staff._id);
      setCcInput("");
      setPinInput("");
    } else {
      setError("No se encontró personal con esos primeros dígitos de CC.");
    }
  };

  if (currentStaff) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background App - visually blurred and inactive */}
      <div className="absolute inset-0 pointer-events-none filter blur-sm opacity-60 select-none z-0">
        {children}
      </div>

      {/* Auth Modal Overlay */}
      <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="bg-surface-main rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-primary-stitch/20 pointer-events-auto">
          <div className="bg-primary-stitch text-white p-6 text-center">
            <h2 className="text-2xl font-bold font-SpaceGrotesk">Acceso de Staff</h2>
            <p className="text-sm opacity-90 mt-1">Ingresa tus credenciales para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm border border-error/20 text-center font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-label-md font-bold text-on-surface-variant ml-1">Cédula (CC)</label>
              <input 
                type="text" 
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                placeholder="Primeros dígitos" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl p-3 text-body-md focus:ring-2 focus:ring-primary-stitch outline-none transition-all"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-label-md font-bold text-on-surface-variant ml-1">PIN / Código</label>
              <input 
                type="password" 
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="******" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl p-3 text-body-md focus:ring-2 focus:ring-primary-stitch outline-none transition-all"
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-stitch text-white py-3 rounded-xl font-label-lg font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center h-12"
            >
              {loading && allStaff.length === 0 ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Ingresar al Sistema"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
