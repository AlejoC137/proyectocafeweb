import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Info } from "lucide-react";
import supabase from "@/config/supabaseClient";
import PageLayout from "@/components/ui/page-layout";
import { AGENDA } from "@/redux/actions-types";

function InscripcionEvento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evento, setEvento] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentAttendeesCount, setCurrentAttendeesCount] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    como_nos_encontraste: "",
    dieta_especial: "",
    acepta_promociones: false,
    acepta_nuevos_eventos: false,
    recordar_usuario: false,
    password: "",
    respuestas: {},
  });

  const [tieneAlimentos, setTieneAlimentos] = useState(false);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const { data, error } = await supabase
          .from(AGENDA)
          .select("*")
          .eq("_id", id)
          .single();

        if (error) throw error;
        setEvento(data);

        // Fetch attendees count
        const { count, error: countError } = await supabase
          .from("attendees")
          .select("*", { count: "exact", head: true })
          .eq("evento_id", id);
          
        if (!countError) {
          setCurrentAttendeesCount(count || 0);
        }

        // Parsear servicios para ver si hay alimentos seleccionados
        let hasFood = false;
        if (data.servicios) {
          try {
            const parsedSvc = typeof data.servicios === "string" ? JSON.parse(data.servicios) : data.servicios;
            if (Array.isArray(parsedSvc)) {
              hasFood = parsedSvc.some(s => s.alimentos === true);
            } else if (typeof parsedSvc === "object" && parsedSvc.alimentos) {
              hasFood = parsedSvc.alimentos.activo === true || parsedSvc.alimentos === true;
            }
          } catch(e) {}
        }
        setTieneAlimentos(hasFood);

      } catch (err) {
        console.error("Error fetching event:", err);
        setEvento(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleRespuestaChange = (idPregunta, valor) => {
    setFormData((prev) => ({
      ...prev,
      respuestas: {
        ...prev.respuestas,
        [idPregunta]: valor
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email) {
      alert("Por favor completa tu nombre y correo electrónico.");
      return;
    }

    // Validar preguntas requeridas
    if (evento?.preguntas_personalizadas) {
      for (let p of evento.preguntas_personalizadas) {
        if (p.requerido && !formData.respuestas[p.id]) {
          alert(`La pregunta "${p.label}" es obligatoria.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      let authUserId = null;

      // Handle user registration if requested
      if (formData.recordar_usuario && formData.password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.nombre,
            }
          }
        });

        if (authError) {
          console.error("Error creating user account:", authError);
          // Omitimos la alerta si es un error de email de Supabase, porque la inscripción de asistente aún puede proceder.
          if (!authError.message.includes("email")) {
             alert("Hubo un error al crear tu cuenta de usuario. Sin embargo, tu inscripción se completará.");
          }
        } else if (authData?.user) {
          authUserId = authData.user.id;
        }
      }

      // Determine payment status based on event price
      const valorStr = (evento?.valor || "").toLowerCase();
      let estadoPago = "pendiente";
      if (!evento?.valor || valorStr.includes("gratis") || valorStr === "0") {
        estadoPago = "gratis";
      }

      const attendeeData = {
        evento_id: id,
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        como_nos_encontraste: formData.como_nos_encontraste,
        dieta_especial: formData.dieta_especial,
        acepta_promociones: formData.acepta_promociones,
        acepta_nuevos_eventos: formData.acepta_nuevos_eventos,
        estado_pago: estadoPago,
        usuario_id: authUserId,
        respuestas_personalizadas: formData.respuestas,
      };

      const { error: insertError } = await supabase
        .from("attendees")
        .insert([attendeeData]);

      if (insertError) throw insertError;

      setSuccess(true);
    } catch (err) {
      console.error("Error submitting inscription:", err);
      alert("No pudimos completar tu inscripción. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Cargando...">
        <div className="flex items-center justify-center p-12 w-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
        </div>
      </PageLayout>
    );
  }

  if (!evento) {
    return (
      <PageLayout title="Evento no encontrado">
        <div className="flex flex-col items-center justify-center p-12 w-full text-center">
          <h2 className="text-2xl font-bold mb-4">El evento no existe o fue eliminado.</h2>
          <Button onClick={() => navigate("/Home")}>Volver al Inicio</Button>
        </div>
      </PageLayout>
    );
  }

  const isFull = evento.numeroPersonas && currentAttendeesCount >= parseInt(evento.numeroPersonas, 10);

  if (isFull && !success) {
    return (
      <PageLayout title="Evento Agotado">
        <div className="flex flex-col items-center justify-center p-12 w-full max-w-2xl mx-auto text-center">
          <div className="bg-red-50 p-8 rounded-2xl shadow-sm border border-red-200">
            <h2 className="text-3xl font-bold text-red-700 mb-4">¡Cupos Agotados!</h2>
            <p className="text-lg text-gray-700 mb-6">
              Lo sentimos, el evento <strong>{evento.nombreES}</strong> ya ha alcanzado su límite máximo de {evento.numeroPersonas} inscripciones.
            </p>
            <Button onClick={() => navigate("/Home")} className="bg-gray-800 hover:bg-gray-900 border-none text-white">
              Explorar otros eventos
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (success) {
    return (
      <PageLayout title="¡Inscripción Exitosa!">
        <div className="flex flex-col items-center justify-center p-12 w-full max-w-2xl mx-auto text-center">
          <div className="bg-green-100 p-8 rounded-2xl shadow-sm border border-green-200">
            <h2 className="text-3xl font-bold text-green-700 mb-4">¡Gracias por inscribirte!</h2>
            <p className="text-lg text-gray-700 mb-6">
              Has sido registrado exitosamente para el evento <strong>{evento.nombreES}</strong>.
            </p>
            <Button onClick={() => navigate("/Home")} className="bg-[#ff6600] hover:bg-[#e65c00]">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isFree = !evento.valor || evento.valor.toLowerCase().includes("gratis") || evento.valor === "0";

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto p-0 md:p-4 w-full">
        <Card className="shadow-2xl border-0 overflow-hidden rounded-none md:rounded-2xl">
          {evento.bannerIMG && (
            <div className="w-full bg-white flex items-center justify-center border-b">
              <img 
                src={evento.bannerIMG} 
                alt={`Banner de ${evento.nombreES}`} 
                className="w-full h-auto object-contain" 
              />
            </div>
          )}
          <CardHeader className="bg-gradient-to-r from-[#ff6600] to-[#ff9933] text-white p-8">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={28} />
              <CardTitle className="text-3xl">{evento.nombreES}</CardTitle>
            </div>
            <CardDescription className="text-white/90 text-lg">
              {evento.fecha} | {evento.horaInicio} - {evento.horaFinal}
            </CardDescription>
            {evento.decripcion && (
              <p className="mt-4 text-white/80">{evento.decripcion}</p>
            )}
          </CardHeader>
          <CardContent className="p-8 bg-white">
            {!isFree && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <Info className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-amber-800">Costo del Evento: {evento.valor}</h4>
                  <p className="text-sm text-amber-700 mt-1">Este evento tiene un costo. Al registrarte quedarás en estado "Pendiente" hasta que confirmes tu pago con el organizador.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Personales */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-xl font-semibold border-b pb-2">Tus Datos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <input
                        id="nombre" name="nombre" type="text" required
                        value={formData.nombre} onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent outline-none transition"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <input
                        id="email" name="email" type="email" required
                        value={formData.email} onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent outline-none transition"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
                      <input
                        id="telefono" name="telefono" type="tel"
                        value={formData.telefono} onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent outline-none transition"
                        placeholder="+57 300 000 0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-xl font-semibold border-b pb-2">Información Adicional</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="como_nos_encontraste">¿Cómo supiste del evento?</Label>
                    <textarea
                      id="como_nos_encontraste" name="como_nos_encontraste"
                      value={formData.como_nos_encontraste} onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none transition resize-none h-24"
                      placeholder="Redes sociales, un amigo, etc..."
                    />
                  </div>

                  {tieneAlimentos && (
                    <div className="space-y-2">
                      <Label htmlFor="dieta_especial" className="text-green-700 font-semibold flex items-center gap-2">🍽️ Dieta Especial / Vegana</Label>
                      <input
                        id="dieta_especial" name="dieta_especial" type="text"
                        value={formData.dieta_especial} onChange={handleChange}
                        className="w-full p-3 border border-green-200 bg-green-50 rounded-xl focus:ring-2 focus:ring-green-400 outline-none transition"
                        placeholder="Ej. Vegano, Intolerante a la lactosa, Ninguna..."
                      />
                    </div>
                  )}

                  {evento?.preguntas_personalizadas && evento.preguntas_personalizadas.length > 0 && (
                    <div className="pt-4 border-t mt-6 space-y-4">
                       <h3 className="text-xl font-semibold border-b pb-2">Preguntas del Organizador</h3>
                       {evento.preguntas_personalizadas.map(p => (
                         <div key={p.id} className="space-y-2">
                           <Label htmlFor={p.id}>{p.label} {p.requerido && <span className="text-red-500">*</span>}</Label>
                           {p.tipo === 'parrafo' ? (
                             <textarea 
                               id={p.id} required={p.requerido}
                               value={formData.respuestas[p.id] || ''} onChange={(e) => handleRespuestaChange(p.id, e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none transition resize-none h-24"
                             />
                           ) : p.tipo === 'numero' ? (
                             <input 
                               id={p.id} type="number" required={p.requerido}
                               value={formData.respuestas[p.id] || ''} onChange={(e) => handleRespuestaChange(p.id, e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none transition"
                             />
                           ) : (
                             <input 
                               id={p.id} type="text" required={p.requerido}
                               value={formData.respuestas[p.id] || ''} onChange={(e) => handleRespuestaChange(p.id, e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none transition"
                             />
                           )}
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                {/* Consentimientos */}
                <div className="space-y-4 md:col-span-2 mt-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">Preferencias y Cuenta</h3>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acepta_promociones"
                      checked={formData.acepta_promociones}
                      onCheckedChange={(checked) => handleCheckboxChange("acepta_promociones", checked)}
                    />
                    <Label htmlFor="acepta_promociones" className="font-normal cursor-pointer pt-0.5">
                      Deseo recibir promociones y descuentos especiales.
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acepta_nuevos_eventos"
                      checked={formData.acepta_nuevos_eventos}
                      onCheckedChange={(checked) => handleCheckboxChange("acepta_nuevos_eventos", checked)}
                    />
                    <Label htmlFor="acepta_nuevos_eventos" className="font-normal cursor-pointer pt-0.5">
                      Quiero enterarme de futuros eventos y actividades.
                    </Label>
                  </div>

                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex items-start space-x-3 mb-4">
                      <Checkbox
                        id="recordar_usuario"
                        checked={formData.recordar_usuario}
                        onCheckedChange={(checked) => handleCheckboxChange("recordar_usuario", checked)}
                      />
                      <Label htmlFor="recordar_usuario" className="font-medium cursor-pointer pt-0.5">
                        Crear una cuenta para recordar mis datos en el futuro.
                      </Label>
                    </div>

                    {formData.recordar_usuario && (
                      <div className="ml-7 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="password">Establece una contraseña</Label>
                        <input
                          id="password" name="password" type="password" required={formData.recordar_usuario}
                          value={formData.password} onChange={handleChange}
                          className="w-full md:w-1/2 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none transition"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <p className="text-xs text-gray-500">Usaremos tu correo ({formData.email || '...'}) para iniciar sesión.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-6 text-lg bg-[#ff6600] hover:bg-[#e65c00] text-white rounded-xl shadow-md transition-all font-bold"
                >
                  {submitting ? "Procesando inscripción..." : "Finalizar Inscripción"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default InscripcionEvento;
