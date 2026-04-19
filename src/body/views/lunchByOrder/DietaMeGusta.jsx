"use client"

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function DietaMeGusta({ formData, handlePreferenceChange, onNext, onBack }) {
  const opcionesDieta = [
    "Vegano 🌱",
    "Vegetariano 🥗",
    "Sin Gluten 🌾",
    "Sin Lactosa 🥛",
    "Bajo en Carbohidratos 🍚",
    "Bajo en Calorías 📉",
    "Alto en Proteínas 💪",
  ]

  return (
    <div className="flex flex-col items-center justify-center  bg-gray-100">
      <div className="p-6 max-w-md bg-white rounded shadow-md">
        <Select 
          value={formData.preferenciasUsuario.primeDiet && formData.preferenciasUsuario.primeDiet[0] ? formData.preferenciasUsuario.primeDiet[0] : ""}
          onValueChange={(value) => handlePreferenceChange("primeDiet", [value])}
        >
          <SelectTrigger className="bg-white border rounded-md px-3 py-2 mt-2">
            <SelectValue placeholder="Selecciona una dieta" />
          </SelectTrigger>
          <SelectContent>
            {opcionesDieta.map((dieta) => (
              <SelectItem key={dieta} value={dieta}>
                {dieta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <h3 className="font-semibold flex items-center gap-2 mt-4">👍 Me Gusta</h3>
        <Input
          placeholder="Ejemplo: Cebolla, Ajo"
          onChange={(e) =>
            handlePreferenceChange(
              "meGusta",
              e.target.value.split(",").map((item) => item.trim()),
            )
          }
          className="mt-2"
        />
        <div className="flex justify-between mt-4">
          <button onClick={onBack} className="bg-gray-300 text-black py-2 px-4 rounded">
            ⬅️ Atrás
          </button>
          <button onClick={onNext} className="bg-primary text-white py-2 px-4 rounded">
            Siguiente ➡️
          </button>
        </div>
      </div>
    </div>
  )
}