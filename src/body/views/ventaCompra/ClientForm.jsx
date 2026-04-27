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
import { MESSAGE_TEMPLATES } from "../../../utils/messageTemplates";
import { getAllFromTable } from "../../../redux/actions";

const ALERGENOS = ["Frutos secos 🥜", "Mariscos 🦐", "Gluten 🌾", "Cerdo 🐷"];
const COMIDA_NO_DESEADA = ["Cebolla 🧅", "Pepino 🥒", "Pimentón 🫑", "Plátano 🍌"];
const OPCIONES_DIETA = [
  "Sin preferencia", "Vegano 🌱", "Vegetariano 🥗", "Sin Gluten 🌾", "Sin Lactosa 🥛",
  "Bajo en Carbohidratos 🍚", "Bajo en Calorías 📉", "Alto en Proteínas 💪"
];

export default function ClientForm({ onClose, initialData = "" }) {
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      acepta_promociones: false,
      acepta_nuevos_eventos: false,
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
        acepta_promociones: formData.preferenciasUsuario.acepta_promociones,
        acepta_nuevos_eventos: formData.preferenciasUsuario.acepta_nuevos_eventos,
        userPreferences: formData.preferenciasUsuario // El JSON con toda la dieta
      };

      const { error } = await supabase
        .from(USER_PREFERENCES)
        .insert([newClient]);

      if (error) throw error;
      
      // Auto-send welcome message
      try {
        await supabase
          .from("UserMessages")
          .insert({
            title: MESSAGE_TEMPLATES.WELCOME.title,
            content: MESSAGE_TEMPLATES.WELCOME.content(formData.name),
            type: MESSAGE_TEMPLATES.WELCOME.type,
            userId: newClient._id,
            created_at: new Date().toISOString(),
          });
      } catch (msgError) {
        console.error("Error sending auto-welcome message:", msgError);
      }

      await dispatch(getAllFromTable(USER_PREFERENCES));
      setIsSuccess(true); // Show success screen instead of alert
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

  const handleWhatsAppWelcome = () => {
    if (!formData.phone) return;
    const content = MESSAGE_TEMPLATES.WELCOME.content(formData.name);
    // Encode the content to preserve emojis and formatting.
    const fullText = encodeURIComponent(content);
    let phone = String(formData.phone).replace(/\D/g, '');
    if (phone.length === 10) phone = '57' + phone;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${fullText}`, "_blank");
  };

  return (
    <Card className="w-full bg-white shadow-xl border-2 border-indigo-100 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="bg-indigo-50/50 border-b p-1 flex flex-row items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="bg-indigo-600 p-1 rounded-lg text-white">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-indigo-900">Registro de Cliente</CardTitle>
            <p className="text-[10px] text-indigo-500 font-medium">Paso {step + 1} de 4</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-1 hover:bg-red-50 hover:text-red-500">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-1">

        {isSuccess ? (
          <div className="py-1 flex flex-col items-center text-center space-y-1 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">¡Registro Exitoso!</h3>
              <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-1">
                {formData.name} ha sido registrado correctamente en el sistema.
              </p>
            </div>
            
            <div className="flex flex-col gap-1 w-full pt-1">
              {formData.phone && (
                <Button 
                  onClick={handleWhatsAppWelcome}
                  className="bg-green-600 hover:bg-green-700 text-white w-full gap-1 py-1 text-lg"
                >
                  <MessageSquare className="w-5 h-5" /> Enviar Bienvenida por WhatsApp
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Cerrar Ventana
              </Button>
            </div>
          </div>
        ) : (
          <>

        {/* STEP 0: BASIC INFO */}
        {step === 0 && (
          <div className="space-y-1 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-bold text-slate-600">Nombre Completo *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Juan Perez" className="h-9 shadow-sm" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-bold text-slate-600">Correo Electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="juan@ejemplo.com" className="h-9 pl-1 shadow-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-600">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="phone" name="phone" type="number" value={formData.phone} onChange={handleChange} placeholder="3001234567" className="h-9 pl-1 shadow-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-bold text-slate-600">Contraseña</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Clave para su cuenta" className="h-9 pl-1 shadow-sm" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-bold text-slate-600">Dirección de Entrega</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Carrera 10 # 20 - 30..." className="h-9 pl-1 shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: SPICE & DIET */}
        {step === 1 && (
          <div className="space-y-1 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-orange-700 flex items-center gap-1">
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

            <div className="space-y-1 pt-1">
              <Label className="text-sm font-bold text-indigo-800 flex items-center gap-1">
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
          </div>
        )}

        {/* STEP 2: ALLERGIES & NO COMO */}
        {step === 2 && (
          <div className="space-y-1 animate-in slide-in-from-right-4 duration-300">
            <div>
              <Label className="text-sm font-bold text-indigo-800 flex items-center gap-1 mb-1">
                <AlertCircle className="w-4 h-4" /> Alergias Alimentarias
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {ALERGENOS.map((al) => (
                  <div key={al} className="flex items-center gap-1 p-1 bg-slate-50 rounded-md border border-slate-100">
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

            <div className="pt-1">
              <Label className="text-sm font-bold text-red-700 flex items-center gap-1 mb-1">
                <Ban className="w-4 h-4" /> Alimentos que NO desea
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {COMIDA_NO_DESEADA.map((no) => (
                  <div key={no} className="flex items-center gap-1 p-1 bg-red-50 rounded-md border border-red-100">
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

        {/* STEP 3: ADDITIONAL NOTES */}
        {step === 3 && (
          <div className="space-y-1 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <Clipboard className="w-4 h-4" /> Notas Adicionales
              </Label>
              <Input
                placeholder="Observaciones de preparación, gustos específicos o cualquier otro detalle..."
                value={formData.preferenciasUsuario.Notas}
                onChange={(e) => handlePreferenceChange("Notas", e.target.value)}
                className="h-20 border-indigo-200"
              />
              <p className="text-[10px] text-slate-400 italic">Escribe aquí cualquier otra preferencia que no hayamos cubierto.</p>
            </div>
            <div className="space-y-1 pt-1 border-t border-indigo-50 mt-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comunicación</Label>
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center space-x-1 bg-indigo-50/30 p-1 rounded-lg border border-indigo-100/50">
                  <Checkbox 
                    id="acepta_promociones" 
                    checked={formData.preferenciasUsuario.acepta_promociones}
                    onCheckedChange={(checked) => handlePreferenceChange("acepta_promociones", checked)}
                  />
                  <Label htmlFor="acepta_promociones" className="text-xs cursor-pointer font-medium text-slate-700">Deseo recibir promociones y descuentos 🎁</Label>
                </div>
                <div className="flex items-center space-x-1 bg-indigo-50/30 p-1 rounded-lg border border-indigo-100/50">
                  <Checkbox 
                    id="acepta_nuevos_eventos" 
                    checked={formData.preferenciasUsuario.acepta_nuevos_eventos}
                    onCheckedChange={(checked) => handlePreferenceChange("acepta_nuevos_eventos", checked)}
                  />
                  <Label htmlFor="acepta_nuevos_eventos" className="text-xs cursor-pointer font-medium text-slate-700">Enterarme de futuros eventos y catas 🍷</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-indigo-50">
          <div className="flex gap-1">
            {step > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={prevStep} disabled={loading} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </Button>
            )}
          </div>

          <div className="flex gap-1">
            {step < 3 ? (
              <Button type="button" size="sm" onClick={nextStep} className="bg-indigo-600 text-white hover:bg-indigo-700 gap-1">
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" disabled={loading}>
                <Save className="w-4 h-4" />
                {loading ? "Registrando..." : "Finalizar y Guardar"}
              </Button>
            )}
          </div>
        </div>
      </>
    )}
  </CardContent>
    </Card>
  );
}
