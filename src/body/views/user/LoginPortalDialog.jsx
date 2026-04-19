import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { USER_PREFERENCES } from "../../../redux/actions-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Mail, ShieldCheck, Phone, AlertCircle } from "lucide-react";

export default function LoginPortalDialog({ open, onOpenChange, onLoginSuccess }) {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.allUserPreferences || []);
  
  const [loading, setLoading] = useState(false);
  const [accessInput, setAccessInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && allUsers.length === 0) {
      dispatch(getAllFromTable(USER_PREFERENCES));
    }
  }, [open, allUsers.length, dispatch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const term = accessInput.trim().toLowerCase();
    const user = allUsers.find(u =>
      (u.email && u.email.toLowerCase() === term) ||
      (u.phone && String(u.phone) === term)
    );

    if (user) {
      if (user.password && !showPassword) {
        setShowPassword(true);
        setLoading(false);
        return;
      }

      if (user.password && passwordInput !== user.password) {
        setError("Contraseña incorrecta.");
        setLoading(false);
        return;
      }

      // Success
      localStorage.setItem("userPortalId", user._id);
      onLoginSuccess(user);
      onOpenChange(false);
    } else {
      setError("No se encontró ningún usuario con ese correo o teléfono.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-3xl bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="bg-sage-green/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-2">
            <User className="w-6 h-6 text-sage-green" />
          </div>
          <DialogTitle className="text-2xl font-bold text-not-black font-SpaceGrotesk">Acceso de Usuario</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium">
            Ingresa para autocompletar tu inscripción
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-700 ml-1">Correo o Teléfono</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="ejemplo@correo.com"
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                required
                className="pl-12 py-6 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold"
                disabled={showPassword}
              />
              <Mail className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            </div>
          </div>

          {showPassword && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-sm font-bold text-gray-700 ml-1">Tu Contraseña</Label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="********"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="pl-12 py-6 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold"
                  autoFocus
                />
                <ShieldCheck className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="text-xs text-sage-green hover:underline font-black"
                >
                  Regresar
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 font-bold">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-sage-green hover:bg-sage-green/90 text-white py-8 text-lg font-black rounded-3xl shadow-xl shadow-sage-green/20 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Verificando..." : showPassword ? "Acceder" : "Continuar"}
          </Button>

          {!showPassword && (
            <p className="text-center text-[10px] text-gray-400 font-medium">
              Si ya te has inscrito antes, usa el mismo correo o teléfono móvil.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
