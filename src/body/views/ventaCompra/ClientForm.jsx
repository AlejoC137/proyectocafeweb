import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  UserPlus, Save, X, Mail, Phone, MapPin, Key,
  ChevronRight, ChevronLeft, AlertCircle, Ban, Utensils,
  Flame, Clipboard
} from "lucide-react";
import supabase from "../../../config/supabaseClient";
import { USER_PREFERENCES } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";

const ALERGENOS = ["Frutos secos 🥜", "Mariscos 🦐", "Gluten 🌾", "Cerdo 🐷"];
const COMIDA_NO_DESEADA = ["Cebolla 🧅", "Pepino 🥒", "Pimentón 🫑", "Plátano 🍌"];
const OPCIONES_DIETA = [
  "Vegano 🌱", "Vegetariano 🥗", "Sin Gluten 🌾", "Sin Lactosa 🥛",
  "Bajo en Carbohidratos 🍚", "Bajo en Calorías 📉", "Alto en Proteínas 💪"
];

export default function ClientForm({ onClose, initialData = "" }) {
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize with passed data if available
  const isEmail = initialData.includes("@");
  const isPhone = !isEmail && initialData.length > 0 && /^\d+$/.test(initialData);

  const [formData, setFormData] = useState({
    name: "",
    email: isEmail ? initialData : "",
    phone: isPhone ? initialData : "",
    address: "",
    password: "",
    preferenciasUsuario: {
      Alergies: {},
      noComo: [],
      primeDiet: [],
      meGusta: [],
      Picante: 0,
      Notas: "",
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (category, value) => {
    setFormData((prev) => ({
      ...prev,
      preferenciasUsuario: { ...prev.preferenciasUsuario, [category]: value },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Nombre y Correo son obligatorios.");
      setStep(0);
      return;
    }

    setLoading(true);
    try {
      const newClient = {
        _id: uuidv4(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone ? parseInt(formData.phone) : null,
        address: formData.address,
        password: formData.password,
        loyalty_points: 0,
        redeemed_points: 0,
        purchase_history: [],
        ordered_lunches: [],
        userPreferences: formData.preferenciasUsuario // El JSON con toda la dieta
      };

      const { error } = await supabase
        .from(USER_PREFERENCES)
        .insert([newClient]);

      if (error) throw error;

      alert("Cliente registrado exitosamente con perfil dietético.");
      await dispatch(getAllFromTable(USER_PREFERENCES));
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      alert("Error al registrar cliente: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const CheckboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
    </svg>
  );

  return (
    <Card className="w-full bg-white shadow-xl border-2 border-indigo-100 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="bg-indigo-50/50 border-b p-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-indigo-900">Registro de Cliente</CardTitle>
            <p className="text-[10px] text-indigo-500 font-medium">Paso {step + 1} de 4</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-5">

        {/* STEP 0: BASIC INFO */}
        {step === 0 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-slate-600">Nombre Completo *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Juan Perez" className="h-9 shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-600">Correo Electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="juan@ejemplo.com" className="h-9 pl-10 shadow-sm" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-600">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="phone" name="phone" type="number" value={formData.phone} onChange={handleChange} placeholder="3001234567" className="h-9 pl-10 shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-slate-600">Contraseña Administrador</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Clave para su cuenta" className="h-9 pl-10 shadow-sm" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-slate-600">Dirección de Entrega</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Carrera 10 # 20 - 30..." className="h-9 pl-10 shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: ALLERGIES & NO COMO */}
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div>
              <Label className="text-sm font-bold text-indigo-800 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" /> Alergias Alimentarias
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {ALERGENOS.map((al) => (
                  <div key={al} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                    <Checkbox
                      id={`al-${al}`}
                      checked={!!formData.preferenciasUsuario.Alergies[al]}
                      onCheckedChange={(checked) => {
                        handlePreferenceChange("Alergies", {
                          ...formData.preferenciasUsuario.Alergies,
                          [al]: checked,
                        })
                      }}
                    />
                    <Label htmlFor={`al-${al}`} className="text-xs">{al}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                <Ban className="w-4 h-4" /> Alimentos que NO desea
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {COMIDA_NO_DESEADA.map((no) => (
                  <div key={no} className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-100">
                    <Checkbox
                      id={`no-${no}`}
                      checked={formData.preferenciasUsuario.noComo.includes(no)}
                      onCheckedChange={(checked) => {
                        handlePreferenceChange(
                          "noComo",
                          checked
                            ? [...formData.preferenciasUsuario.noComo, no]
                            : formData.preferenciasUsuario.noComo.filter((f) => f !== no),
                        )
                      }}
                    />
                    <Label htmlFor={`no-${no}`} className="text-xs text-red-900">{no}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DIET & ME GUSTA */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                <Utensils className="w-4 h-4" /> Dieta Principal
              </Label>
              <Select
                value={formData.preferenciasUsuario.primeDiet[0] || ""}
                onValueChange={(value) => handlePreferenceChange("primeDiet", [value])}
              >
                <SelectTrigger className="h-10 bg-white border-indigo-200">
                  <SelectValue placeholder="Selecciona un tipo de dieta" />
                </SelectTrigger>
                <SelectContent>
                  {OPCIONES_DIETA.map((dieta) => (
                    <SelectItem key={dieta} value={dieta}>{dieta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                Me Gusta Mucho
              </Label>
              <Input
                placeholder="Ej. Aguacate, Cilantro..."
                value={formData.preferenciasUsuario.meGusta.join(", ")}
                onChange={(e) =>
                  handlePreferenceChange(
                    "meGusta",
                    e.target.value.split(",").map((item) => item.trim()).filter(i => i),
                  )
                }
                className="h-10 border-indigo-200"
              />
              <p className="text-[10px] text-slate-400 italic">Separa los ingredientes con comas</p>
            </div>
          </div>
        )}

        {/* STEP 3: SPICE & NOTES */}
        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-orange-700 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Tolerancia al Picante
              </Label>
              <Select
                value={String(formData.preferenciasUsuario.Picante)}
                onValueChange={(value) => handlePreferenceChange("Picante", parseInt(value))}
              >
                <SelectTrigger className="h-10 border-indigo-200">
                  <SelectValue placeholder="Nivel de picante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nada 😊</SelectItem>
                  <SelectItem value="1">Moderado 🔥</SelectItem>
                  <SelectItem value="2">Fuerte 🔥🔥</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                <Clipboard className="w-4 h-4" /> Notas Adicionales
              </Label>
              <Input
                placeholder="Observaciones de preparación..."
                value={formData.preferenciasUsuario.Notas}
                onChange={(e) => handlePreferenceChange("Notas", e.target.value)}
                className="h-12 border-indigo-200"
              />
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-indigo-50">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={prevStep} disabled={loading} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step < 3 ? (
              <Button type="button" size="sm" onClick={nextStep} className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2">
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-2" disabled={loading}>
                <Save className="w-4 h-4" />
                {loading ? "Registrando..." : "Finalizar y Guardar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
