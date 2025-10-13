"use client"

import { useState } from "react"
import GeneralInfo from "./GeneralInfo"
import AlergiasNoComo from "./AlergiasNoComo"
import DietaMeGusta from "./DietaMeGusta"
import PicanteNotas from "./PicanteNotas"

export default function LunchByOrder() {
  const [formData, setFormData] = useState({
    email: "",
    telefono: "",
    nombre: "",
    direccion: "",
    servidoEnProyecto: false,
    preferenciasUsuario: {
      Alergias: {},
      dietaPrincipal: "",
      noComo: [],
      meGusta: [],
      Picante: 0,
      Notas: "",
    },
  })
  const [step, setStep] = useState(0)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handlePreferenceChange = (category, value) => {
    setFormData((prev) => ({
      ...prev,
      preferenciasUsuario: { ...prev.preferenciasUsuario, [category]: value },
    }))
  }

  // Función para manejar el envío final del formulario
  const handleSubmit = () => {
    console.log("Paquete de datos listo para enviar a Supabase:", formData)
    // Aquí iría la lógica para enviar los datos a Supabase
    // Ejemplo: const { data, error } = await supabase.from('pedidos').insert([formData]);
    alert("¡Pedido registrado! Revisa la consola para ver los datos.")
  }


  const components = [
    <GeneralInfo
      className=" w-screen items-center justify-center"
      formData={formData}
      handleChange={handleChange}
      setFormData={setFormData}
      onNext={() => setStep(1)}
    />,
    <AlergiasNoComo
      className=" w-screen items-center justify-center"
      formData={formData}
      handlePreferenceChange={handlePreferenceChange}
      onNext={() => setStep(2)}
      onBack={() => setStep(0)}
    />,
    <DietaMeGusta
      className=" w-screen items-center justify-center"
      formData={formData}
      handlePreferenceChange={handlePreferenceChange}
      onNext={() => setStep(3)}
      onBack={() => setStep(1)}
    />,
    <PicanteNotas
      className=" w-screen items-center justify-center"
      formData={formData}
      handlePreferenceChange={handlePreferenceChange}
      onBack={() => setStep(2)}
      onSubmit={handleSubmit} // Pasamos la función de envío al último paso
    />,
  ]

  return (
    <div className="flex items-center justify-center w-screen bg-gray-100">
      <div className="max-w-md mx-auto  bg-white rounded-xl shadow-md">
        {components[step]}
      </div>
    </div>
  )
}