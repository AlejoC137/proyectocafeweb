import React from "react";
import PageLayout from "@/components/ui/page-layout";
import ContentCard from "@/components/ui/content-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, ShieldCheck, Phone } from "lucide-react";
import ClientForm from "../../ventaCompra/ClientForm";

export function UserPortalLogin({
  loading,
  isRegistering,
  setIsRegistering,
  navigate,
  accessInput,
  setAccessInput,
  passwordInput,
  setPasswordInput,
  showPassword,
  setShowPassword,
  error,
  handleAccess,
}) {
  return (
    <PageLayout loading={loading}>
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="max-w-md w-full">
          {isRegistering ? (
            <ClientForm
              onClose={() => {
                setIsRegistering(false);
                navigate("/UserPortal");
              }}
              initialData={accessInput}
            />
          ) : (
            <ContentCard className="shadow-2xl border-sage-green/20">
              <div className="text-center mb-8">
                <div className="bg-sage-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-sage-green" />
                </div>
                <h2 className="text-2xl font-bold text-not-black font-SpaceGrotesk">Bienvenido a Proyecto Café</h2>
                <p className="text-gray-500 text-sm">Ingresa tus datos para gestionar tu información</p>
              </div>

              <form onSubmit={handleAccess} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Correo Electrónico o Teléfono</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="ejemplo@correo.com o 3001234567"
                      value={accessInput}
                      onChange={(e) => setAccessInput(e.target.value)}
                      required
                      className="pl-10"
                      disabled={showPassword}
                    />
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>

                {showPassword && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-medium text-gray-700">Contraseña</label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="********"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                        className="pl-10"
                        autoFocus
                      />
                      <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(false)}
                        className="text-xs text-sage-green hover:underline font-bold"
                      >
                        Regresar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const message = `hola soy , - ${accessInput} - puedes recordarme la clave de usuario ?`;
                          window.open(`https://wa.me/573008214593?text=${encodeURIComponent(message)}`, "_blank");
                        }}
                        className="text-[10px] text-gray-400 hover:text-sage-green font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> ¿Olvidaste tu clave?
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const message = `Hola soy ,  ${accessInput}  puedes recordarme la clave de usuario ?`;
                        window.open(`https://wa.me/573008214593?text=${encodeURIComponent(message)}`, "_blank");
                      }}
                      className="w-full text-xs text-sage-green hover:bg-sage-green/5 font-bold gap-2"
                    >
                      <Phone className="w-3 h-3" /> ¿Olvidaste tu contraseña? Escríbenos
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-sage-green hover:bg-sage-green/90 text-white py-6 text-lg font-bold shadow-lg shadow-sage-green/20"
                  disabled={loading}
                >
                  {loading ? "Verificando..." : showPassword ? "Acceder" : "Continuar"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t text-center space-y-4">
                <p className="text-xs text-gray-400 italic">
                  ¿No tienes cuenta aún?
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/UserPortal/Registro")}
                  className="w-full border-sage-green text-sage-green hover:bg-sage-green/5 font-bold"
                >
                  Crear mi cuenta ahora
                </Button>
              </div>
            </ContentCard>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default UserPortalLogin;
