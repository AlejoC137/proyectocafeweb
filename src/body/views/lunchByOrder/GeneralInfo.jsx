"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function GeneralInfo({ formData, handleChange, setFormData, onNext }) {
  return (
    <div className="flex flex-col items-center justify-center  bg-gray-100">
      <div className="justify-center items-center p-6 max-w-md bg-white rounded shadow-md">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 text-center">📋 Información General</h2>
        <Input placeholder="Email 📧" name="email" onChange={handleChange} className="mt-2" />
        <Input placeholder="Teléfono 📱" name="telefono" onChange={handleChange} className="mt-2" />
        <Input placeholder="Nombre 👤" name="nombre" onChange={handleChange} className="mt-2" />
        <Input
          placeholder="Dirección 🏠"
          name="direccion"
          disabled={formData.servidoEnProyecto}
          onChange={handleChange}
          className="mt-2"
        />
        <div className="flex items-center gap-2 mt-2">
          <Switch
            checked={formData.servidoEnProyecto}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({
                ...prev,
                servidoEnProyecto: checked,
              }))
            }}
          />
          <Label>Servido en proyecto 🏢</Label>
        </div>
        <button onClick={onNext} className="mt-4 w-full bg-primary text-white py-2 rounded">
          Siguiente ➡️
        </button>
      </div>
    </div>
  )
}
