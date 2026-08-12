import React from "react";
import ContentCard from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ShieldCheck } from "lucide-react";

export function UserSettingsTab({
  editForm,
  setEditForm,
  handleUpdateProfile,
  isUpdating,
  currentUser,
  setActiveTab,
}) {
  return (
    <ContentCard title="Configuración de Perfil Personal" className="border-none shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-4">
        <div className="space-y-6">
          <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <User size={20} className="text-sage-green" /> Información Básica
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nombre Completo</label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="py-6 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Teléfono Móvil</label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="py-6 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Dirección Registrada</label>
              <Input
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="py-6 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <ShieldCheck size={20} className="text-amber-500" /> Seguridad de Acceso
          </h4>
          <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest pl-1">Contraseña Nueva</label>
              <Input
                type="password"
                placeholder="Ingresa nueva contraseña si deseas cambiarla"
                value={editForm.password || ""}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="py-6 rounded-2xl font-bold bg-white border-amber-100 focus:ring-amber-500"
              />
            </div>
            <p className="text-xs text-amber-700/70 font-medium leading-relaxed bg-white/50 p-4 rounded-xl">
              ⚠️ **Nota importante:** Tu contraseña te permite acceder a este portal y agiliza tus próximas inscripciones a eventos y compras. No la compartas con nadie.
            </p>
          </div>

          <div className="pt-6 flex gap-4">
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating}
              className="flex-1 bg-sage-green hover:bg-sage-green/90 text-white font-black py-7 rounded-3xl shadow-lg shadow-sage-green/20"
            >
              {isUpdating ? "Guardando..." : "Guardar Perfil"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setEditForm(currentUser); setActiveTab("overview"); }}
              disabled={isUpdating}
              className="font-bold py-7 rounded-3xl text-gray-500"
            >
              Descartar
            </Button>
          </div>
        </div>
      </div>
    </ContentCard>
  );
}

export default UserSettingsTab;
