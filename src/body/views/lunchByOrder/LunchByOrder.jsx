"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Utensils, Save, AlertCircle } from "lucide-react"
import supabase from "../../../config/supabaseClient"
import { USER_PREFERENCES } from "../../../redux/actions-types"
import { getAllFromTable } from "../../../redux/actions"

// Reutilizamos los componentes de pasos aquí o inyectamos la lógica simplificada
import AlergiasNoComo from "./AlergiasNoComo"
import DietaMeGusta from "./DietaMeGusta"
import PicanteNotas from "./PicanteNotas"

export default function LunchByOrder() {
  const dispatch = useDispatch()
  const allUsers = useSelector((state) => state.allUserPreferences || [])
  const [email, setEmail] = useState("")
  const [step, setStep] = useState(0) // 0: Buscar, 1: Alergias, 2: Dieta, 3: Picante
  const [foundUser, setFoundUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    preferenciasUsuario: {
      Alergias: {},
      dietaPrincipal: "",
      noComo: [],
      meGusta: [],
      Picante: 0,
      Notas: "",
    },
  })

  const handleSearch = () => {
    const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (user) {
      setFoundUser(user)
      setFormData({
        preferenciasUsuario: typeof user.userPreferences === 'string' 
          ? JSON.parse(user.userPreferences || '{}') 
          : (user.userPreferences || { Alergias: {}, dietaPrincipal: "", noComo: [], meGusta: [], Picante: 0, Notas: "" })
      })
      setStep(1)
    } else {
      alert("No se encontró un usuario con ese correo. Por favor regístrate primero en el portal de staff o con el cajero.")
    }
  }

  const handlePreferenceChange = (category, value) => {
    setFormData((prev) => ({
      ...prev,
      preferenciasUsuario: { ...prev.preferenciasUsuario, [category]: value },
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from(USER_PREFERENCES)
        .update({
          userPreferences: formData.preferenciasUsuario
        })
        .eq("_id", foundUser._id)

      if (error) throw error
      
      alert("Preferencias actualizadas correctamente ✅")
      await dispatch(getAllFromTable(USER_PREFERENCES))
      setStep(0)
      setEmail("")
      setFoundUser(null)
    } catch (err) {
      console.error("Error actualizando preferencias:", err)
      alert("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full bg-slate-50 p-4">
      <Card className="max-w-md w-full shadow-lg border-2 border-emerald-100">
        <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            <CardTitle>Preferencias de Almuerzo</CardTitle>
          </div>
          <p className="text-xs text-emerald-100">Ajusta tu perfil dietético para tus pedidos</p>
        </CardHeader>
        <CardContent className="p-6">
          
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ingresa tu correo para empezar</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="email@ejemplo.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-800">Si eres nuevo, solicita tu registro en caja para empezar a ganar puntos y personalizar tu almuerzo.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <AlergiasNoComo 
              formData={formData} 
              handlePreferenceChange={handlePreferenceChange} 
              onNext={() => setStep(2)} 
              onBack={() => setStep(0)} 
            />
          )}

          {step === 2 && (
            <DietaMeGusta 
              formData={formData} 
              handlePreferenceChange={handlePreferenceChange} 
              onNext={() => setStep(3)} 
              onBack={() => setStep(1)} 
            />
          )}

          {step === 3 && (
            <PicanteNotas 
              formData={formData} 
              handlePreferenceChange={handlePreferenceChange} 
              onBack={() => setStep(2)} 
              onSubmit={handleSubmit}
            />
          )}

        </CardContent>
      </Card>
    </div>
  )
}