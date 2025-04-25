"use client"

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function PicanteNotas({ formData, handlePreferenceChange, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100">
      <div className="p-6 max-w-md bg-white rounded shadow-md">
        <h2 className="text-xl font-bold flex items-center gap-2 text-center">🌶️ Nivel de Picante</h2>
        <Select onValueChange={(value) => handlePreferenceChange("Picante", Number.parseInt(value))}>
          <SelectTrigger className="bg-white border rounded-md px-3 py-2 mt-2">
            <SelectValue placeholder="Nivel de picante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Nada 😊</SelectItem>
            <SelectItem value="1">Moderado 🔥</SelectItem>
            <SelectItem value="2">Fuerte 🔥🔥</SelectItem>
          </SelectContent>
        </Select>
        <h3 className="font-semibold flex items-center gap-2 mt-4">📝 Notas Adicionales</h3>
        <Input
          placeholder="Notas adicionales"
          onChange={(e) => handlePreferenceChange("Notas", e.target.value)}
          className="mt-2"
        />
        <div className="flex justify-between mt-4">
          <button onClick={onBack} className="bg-gray-300 text-black py-2 px-4 rounded">
            ⬅️ Atrás
          </button>
          <button className="bg-primary text-white py-2 px-4 rounded">Finalizar ✅</button>
        </div>
      </div>
    </div>
  )
}
