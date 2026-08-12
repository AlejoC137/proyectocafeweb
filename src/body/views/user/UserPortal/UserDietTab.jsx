import React from "react";
import ContentCard from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Heart, Flame, FileText } from "lucide-react";

export function UserDietTab({
  dietForm,
  setDietForm,
  alergenosOptions,
  noComoOptions,
  dietOptions,
  handleUpdateProfile,
  isUpdating,
}) {
  return (
    <ContentCard title="Gestión de Perfil Alimenticio" className="border-none shadow-xl">
      <div className="space-y-10 py-4">
        <div className="bg-sage-green/5 p-6 rounded-3xl border border-sage-green/10">
          <h3 className="text-xl font-black text-sage-green mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" /> Alergias y Restricciones
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-black text-gray-600 uppercase tracking-widest pl-1">Alergias Conocidas</label>
              <div className="grid grid-cols-1 gap-4">
                {alergenosOptions.map(al => (
                  <div key={al} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 hover:border-sage-green transition-colors cursor-pointer">
                    <Checkbox
                      id={`al-${al}`}
                      checked={!!dietForm.Alergies[al]}
                      onCheckedChange={(checked) => setDietForm({
                        ...dietForm,
                        Alergies: { ...dietForm.Alergies, [al]: checked }
                      })}
                    />
                    <Label htmlFor={`al-${al}`} className="font-bold text-gray-700 cursor-pointer flex-1">{al}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black text-gray-600 uppercase tracking-widest pl-1">Ingredientes "No Como"</label>
              <div className="grid grid-cols-1 gap-4">
                {noComoOptions.map(nc => (
                  <div key={nc} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 hover:border-sage-green transition-colors cursor-pointer">
                    <Checkbox
                      id={`nc-${nc}`}
                      checked={dietForm.noComo.includes(nc)}
                      onCheckedChange={(checked) => {
                        const newNC = checked
                          ? [...dietForm.noComo, nc]
                          : dietForm.noComo.filter(i => i !== nc);
                        setDietForm({ ...dietForm, noComo: newNC });
                      }}
                    />
                    <Label htmlFor={`nc-${nc}`} className="font-bold text-gray-700 cursor-pointer flex-1">{nc}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-black text-cobalt-blue flex items-center gap-3">
              <Heart className="w-6 h-6" /> Dieta Principal
            </h3>
            <Select
              value={dietForm.primeDiet && dietForm.primeDiet[0] ? dietForm.primeDiet[0] : ""}
              onValueChange={(val) => setDietForm({ ...dietForm, primeDiet: [val] })}
            >
              <SelectTrigger className="w-full py-6 rounded-2xl font-bold bg-white border-gray-200 focus:ring-sage-green">
                <SelectValue placeholder="Selecciona tu dieta" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-sage-green/20">
                {dietOptions.map(d => (
                  <SelectItem key={d} value={d} className="font-bold py-3">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="pt-4 space-y-4">
              <h4 className="font-black text-amber-600 flex items-center gap-2">
                <Flame size={18} /> Nivel de Picante
              </h4>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setDietForm({ ...dietForm, Picante: n })}
                    className={`flex-1 py-3 rounded-xl font-black transition-all ${
                      dietForm.Picante >= n
                        ? "bg-amber-500 text-white shadow-md shadow-amber-200 scale-105"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-sage-green flex items-center gap-3">
              <FileText className="w-6 h-6" /> Notas Adicionales
            </h3>
            <textarea
              value={dietForm.Notas || ""}
              onChange={(e) => setDietForm({ ...dietForm, Notas: e.target.value })}
              className="w-full h-[180px] p-4 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-sage-green outline-none font-medium resize-none shadow-inner"
              placeholder="Escribe aquí cualquier otra preferencia, alergia no listada o detalle importante..."
            />
          </div>
        </div>

        <div className="pt-8 border-t flex justify-end">
          <Button
            onClick={handleUpdateProfile}
            disabled={isUpdating}
            className="bg-sage-green hover:bg-sage-green/90 text-white font-black px-12 py-7 rounded-3xl shadow-xl shadow-sage-green/30 text-lg transition-all hover:scale-105"
          >
            {isUpdating ? "Sincronizando..." : "Actualizar Perfil Alimenticio"}
          </Button>
        </div>
      </div>
    </ContentCard>
  );
}

export default UserDietTab;
