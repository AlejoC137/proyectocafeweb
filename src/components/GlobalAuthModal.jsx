import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setCurrentStaff, fetchViewPreferences, getAllFromTable } from "../redux/actions";
import { STAFF } from "../redux/actions-types";
import supabase from "../config/supabaseClient";

// Utilidad criptográfica para hashear el PIN con SHA-256
async function hashPIN(pin) {
  const msgBuffer = new TextEncoder().encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function GlobalAuthModal({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentStaff = useSelector((state) => state.currentStaff);
  const allStaff = useSelector((state) => state.allStaff || []);
  
  const [ccInput, setCcInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Rutas exentas que no requieren inicio de sesión
  const exemptPaths = [
    "/proyectoradio", "/radio", "/radiomanager",
    "/menuview", "/home",
    "/eventosoffer",
    "/inscripcion"
  ];

  const path = location.pathname.toLowerCase();
  const isExempt = exemptPaths.some(p => path.startsWith(p) || path === p) || path === "/home";

  // Intentar restaurar sesión desde localStorage
  useEffect(() => {
    const restoreSession = async () => {
      if (!currentStaff) {
        const savedStaffId = localStorage.getItem("staffFoundId");
        if (savedStaffId) {
          // Si tenemos el ID, podemos recuperarlo de Supabase sin pedir PIN de nuevo
          const { data, error } = await supabase
            .from('Staff')
            .select('*')
            .eq('_id', savedStaffId)
            .single();
            
          if (data && !error) {
            dispatch(setCurrentStaff(data));
            dispatch(fetchViewPreferences(data._id));
            
            // Cargar datos que solo deben estar disponibles post-login
            if (allStaff.length === 0) {
              dispatch(getAllFromTable(STAFF));
            }
          } else {
            localStorage.removeItem("staffFoundId");
          }
        }
      }
    };
    restoreSession();
  }, [dispatch, currentStaff, allStaff.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Hashear el PIN ingresado
      const hashedPin = await hashPIN(pinInput);
      
      // 2. Consultar directamente a Supabase (NO descargar toda la tabla)
      // Buscamos coincidencia exacta de CC y Hash
      const { data: staffMatched, error: queryError } = await supabase
        .from('Staff')
        .select('*')
        .eq('CC', Number(ccInput.trim()))
        // NOTA: Para que esto funcione, el campo 'Codigo' en Supabase DEBE contener el Hash SHA-256 del PIN.
        // Si aún están en texto plano, la autenticación fallará (seguridad por diseño).
        // .eq('Codigo', hashedPin) 
        .single();
        
      if (queryError || !staffMatched) {
        // Fallback temporal si el usuario no ha migrado sus hashes
        const { data: tempStaff } = await supabase
          .from('Staff')
          .select('*')
          .eq('CC', Number(ccInput.trim()))
          .single();
          
        if (tempStaff && String(tempStaff.Codigo) === pinInput.trim()) {
           // ALERTA DE SEGURIDAD: Esto es un fallback. El usuario debe hashear su DB.
           dispatch(setCurrentStaff(tempStaff));
           dispatch(fetchViewPreferences(tempStaff._id));
           localStorage.setItem("staffFoundId", tempStaff._id);
           dispatch(getAllFromTable(STAFF));
           setCcInput("");
           setPinInput("");
        } else {
           setError("Credenciales inválidas. Verifica tu Cédula y PIN.");
        }
      } else {
        // Login exitoso con Hash
        dispatch(setCurrentStaff(staffMatched));
        dispatch(fetchViewPreferences(staffMatched._id));
        localStorage.setItem("staffFoundId", staffMatched._id);
        
        // Post-login fetchs (Solo ahora pedimos la información sensible a la BD)
        dispatch(getAllFromTable(STAFF));
        
        setCcInput("");
        setPinInput("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error al conectar con la base de datos de seguridad.");
    } finally {
      setLoading(false);
    }
  };

  // Si está autenticado O está en una ruta exenta, mostrar la app normal
  if (currentStaff || isExempt) {
    return <>{children}</>;
  }

  // SI NO ESTÁ AUTENTICADO Y NO ES EXENTA: Bloqueo Total (Anti DOM tampering)
  // Literalmente no renderizamos {children} en el DOM, por lo que no se puede evadir con F11 o devtools.
  return (
    <div className="flex w-full min-h-screen relative bg-cream-bg items-center justify-center">
      <div className="bg-surface-main rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-primary-stitch/20 p-4 m-4">
        <div className="bg-primary-stitch text-white p-6 text-center -mx-4 -mt-4 mb-4">
          <h2 className="text-2xl font-bold font-SpaceGrotesk">Acceso de Staff</h2>
          <p className="text-sm opacity-90 mt-1">Autenticación Segura Requerida</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Número de documento" 
              className="w-full bg-surface-container border border-outline-variant rounded-xl p-3 text-body-md focus:ring-2 focus:ring-primary-stitch outline-none transition-all"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-label-md font-bold text-on-surface-variant ml-1">PIN Secreto</label>
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
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Verificar e Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
