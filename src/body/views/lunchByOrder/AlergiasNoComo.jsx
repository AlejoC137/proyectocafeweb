"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function AlergiasNoComo({ formData, handlePreferenceChange, onNext, onBack }) {
  const alergenos = ["Frutos secos 🥜", "Mariscos 🦐", "Gluten 🌾", "Cerdo 🐷"]
  const comidaNoDeseada = ["Cebolla 🧅", "Pepino 🥒", "Pimentón 🫑", "Plátano 🍌"]

  return (
    <div className="flex items-center justify-center  bg-gray-100">
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold flex justify-center items-center gap-2 mb-6">⚠️ Alergias</h2>
        <div className="grid grid-cols-2 gap-6 w-full">
          {alergenos.map((alergia) => (
            <div key={alergia} className="flex items-center justify-center gap-4">
              <Switch
                checked={!!formData.preferenciasUsuario.Alergias[alergia]}
                onCheckedChange={(checked) => {
                  handlePreferenceChange("Alergias", {
                    ...formData.preferenciasUsuario.Alergias,
                    [alergia]: checked,
                  })
                }}
              />
              <Label>{alergia}</Label>
            </div>
          ))}
        </div>
        <h3 className="font-semibold flex justify-center items-center gap-2 mt-8 mb-4 text-lg">❌ No Como</h3>
        <div className="grid grid-cols-2 gap-6 w-full">
          {comidaNoDeseada.map((comida) => (
            <div key={comida} className="flex items-center justify-center gap-4">
              <Checkbox
                id={`food-${comida}`}
                checked={formData.preferenciasUsuario.noComo.includes(comida)}
                onCheckedChange={(checked) => {
                  handlePreferenceChange(
                    "noComo",
                    checked
                      ? [...formData.preferenciasUsuario.noComo, comida]
                      : formData.preferenciasUsuario.noComo.filter((f) => f !== comida),
                  )
                }}
                className="appearance-none w-8 h-8 rounded-full border border-gray-300 bg-white checked:bg-black checked:border-black focus:ring-primary focus:ring-2 flex items-center justify-center"
              >
                {formData.preferenciasUsuario.noComo.includes(comida) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </Checkbox>
              <Label htmlFor={`food-${comida}`}>{comida}</Label>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-8 w-full">
          <button onClick={onBack} className="bg-gray-300 text-black py-3 px-6 rounded">
            ⬅️ Atrás
          </button>
          <button onClick={onNext} className="bg-primary text-white py-3 px-6 rounded">
            Siguiente ➡️
          </button>
        </div>
      </div>
    </div>
  )
}
