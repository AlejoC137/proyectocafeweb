import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Info, User, UserCheck, Instagram } from "lucide-react";
import supabase from "@/config/supabaseClient";
import PageLayout from "@/components/ui/page-layout";
import { AGENDA, USER_PREFERENCES } from "@/redux/actions-types";
import LoginPortalDialog from "../user/LoginPortalDialog";
import { useSelector, useDispatch } from "react-redux";
import { getAllFromTable } from "@/redux/actions";

function InscripcionEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.allUserPreferences || []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evento, setEvento] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentAttendeesCount, setCurrentAttendeesCount] = useState(0);
  const [realId, setRealId] = useState(id);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);

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
        let resolveId = id;
        if (id.length < 36) {
          const { data: allIds } = await supabase.from(AGENDA).select('_id');
          const match = allIds?.find(e => e._id && e._id.toString().toLowerCase().startsWith(id.toLowerCase()));
          if (match) {
            resolveId = match._id;
            setRealId(match._id);
          } else {
            throw new Error(`Enlace roto: Evento corto no hallado (${id})`);
          }
        }

        if (resolveId.length < 36) {
          throw new Error("ID inválido detectado");
        }

        const { data, error } = await supabase
          .from(AGENDA)
          .select("*")
          .eq("_id", resolveId)
          .single();

        if (error) throw error;
        setEvento(data);

        const { count, error: countError } = await supabase
          .from("attendees")
          .select("*", { count: "exact", head: true })
          .eq("evento_id", resolveId);

        if (!countError) {
          setCurrentAttendeesCount(count || 0);
        }

        let hasFood = false;
        if (data.servicios) {
          try {
            const parsedSvc = typeof data.servicios === "string" ? JSON.parse(data.servicios) : data.servicios;
            if (Array.isArray(parsedSvc)) {
              hasFood = parsedSvc.some(s => s.alimentos === true);
            } else if (typeof parsedSvc === "object" && parsedSvc.alimentos) {
              hasFood = parsedSvc.alimentos.activo === true || parsedSvc.alimentos === true;
            }
          } catch (e) { }
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

  useEffect(() => {
    if (allUsers.length === 0) {
      dispatch(getAllFromTable(USER_PREFERENCES));
    }
  }, [dispatch, allUsers.length]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userPortalId");
    if (storedUserId && !loggedUser && allUsers.length > 0) {
      const user = allUsers.find(u => u._id === storedUserId);
      if (user) {
        handleLoginSuccess(user);
      }
    }
  }, [allUsers, loggedUser]);

  const handleLoginSuccess = (user) => {
    setLoggedUser(user);

    let dieta = "";
    if (user.userPreferences) {
      try {
        const parsed = typeof user.userPreferences === 'string'
          ? JSON.parse(user.userPreferences)
          : user.userPreferences;
        dieta = parsed.Notas || "";
      } catch (e) { }
    }

    setFormData(prev => ({
      ...prev,
      nombre: user.name || prev.nombre,
      email: user.email || prev.email,
      telefono: user.phone ? String(user.phone) : prev.telefono,
      dieta_especial: dieta || prev.dieta_especial,
      recordar_usuario: false, // User already has a portal account
      password: ""
    }));
  };

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

  const isFormValid = React.useMemo(() => {
    if (!formData.nombre || !formData.email) return false;
    if (evento?.preguntas_personalizadas) {
      for (let p of evento.preguntas_personalizadas) {
        if (p.requerido && !formData.respuestas[p.id]) return false;
      }
    }
    return true;
  }, [formData, evento]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email) {
      alert("Por favor completa tu nombre y correo electrónico.");
      return;
    }

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

      if (formData.recordar_usuario && formData.password) {
        // 1. Create Auth User
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
          // If user already exists in Auth, we might still want to try creating preference record 
          // or just link if they share email. For simplicity, we just continue if error is 'already exists'.
          if (!authError.message.includes("already registered")) {
            alert("Hubo un error al crear tu cuenta: " + authError.message);
          }
        }

        if (authData?.user) {
          authUserId = authData.user.id;
        }

        // 2. Create/Update USER_PREFERENCES record to make it manageble in Portal/CRM
        // We use email/phone as primary link if _id (uuid) is unknown yet
        const { data: existingPref } = await supabase
          .from("USER_PREFERENCES")
          .select("*")
          .or(`email.eq.${formData.email},phone.eq.${formData.telefono}`)
          .single();

        if (!existingPref) {
          // Create new preference record
          const newPrefId = authUserId || crypto.randomUUID();
          const { error: prefError } = await supabase
            .from("USER_PREFERENCES")
            .insert([{
              _id: newPrefId,
              name: formData.nombre,
              email: formData.email,
              phone: formData.telefono ? parseInt(formData.telefono) : null,
              password: formData.password, // Storing in plain text for the portal access as per existing system design
              loyalty_points: 0,
              acepta_promociones: formData.acepta_promociones,
              acepta_nuevos_eventos: formData.acepta_nuevos_eventos,
              userPreferences: JSON.stringify({
                Alergies: {},
                noComo: [],
                primeDiet: [],
                Picante: 0,
                Notas: formData.dieta_especial || ""
              })
            }]);
          if (prefError) console.error("Error creating user preferences:", prefError);
          authUserId = newPrefId;
        } else {
          // If it exists, update password if not set
          if (!existingPref.password) {
            await supabase
              .from("USER_PREFERENCES")
              .update({ password: formData.password })
              .eq("_id", existingPref._id);
          }
          authUserId = existingPref._id;
        }
      }

      const valorStr = (evento?.valor || "").toLowerCase();
      let estadoPago = "pendiente";
      if (!evento?.valor || valorStr.includes("gratis") || valorStr === "0") {
        estadoPago = "gratis";
      }

      const attendeeData = {
        evento_id: realId,
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
      alert("No pudimos completar tu inscripción.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Cargando...">
        <div className="flex items-center justify-center p-12 w-full h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
        </div>
      </PageLayout>
    );
  }

  if (!evento) {
    return (
      <PageLayout title="Evento no encontrado">
        <div className="flex flex-col items-center justify-center p-12 w-full text-center h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">El evento no existe o fue eliminado.</h2>
          <Button onClick={() => navigate("/Home")}>Volver al Inicio</Button>
        </div>
      </PageLayout>
    );
  }

  if (success) {
    return (
      <PageLayout title="¡Inscripción Exitosa!">
        <div className="flex flex-col items-center justify-center p-12 w-full max-w-2xl mx-auto text-center h-[70vh]">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-sage-green/10 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sage-green to-emerald-500"></div>

            <div className="bg-sage-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-10 h-10 text-sage-green" />
            </div>

            <h2 className="text-4xl font-black text-not-black mb-4 font-SpaceGrotesk">¡Inscripción Exitosa!</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Te has inscrito correctamente <span className="text-sage-green font-black">{formData.nombre}</span>.
              <br />
              <span className="text-sm font-medium mt-4 block text-gray-400">
                Revisa en tu cuenta el estado de tu inscripción y detalles del evento.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/UserPortal")} className="bg-sage-green hover:bg-sage-green/90 text-white px-8 py-4 rounded-2xl font-bold">
                Ver Mi Cuenta
              </Button>
              <Button variant="outline" onClick={() => navigate("/Home")} className="px-8 py-4 rounded-2xl font-bold border-gray-200">
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isFree = !evento.valor || evento.valor.toLowerCase().includes("gratis") || evento.valor === "0";

  return (
    // Aplicamos overflow-hidden a nivel de Layout para que nada se salga
    <PageLayout className="h-screen max-h-screen overflow-hidden !p-0">

      {/* Contenedor Principal: forzamos el alto de la pantalla menos el posible Header (ajustado a 4rem/64px aprox) */}
      <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-4 p-1.5 md:p-4 h-[calc(100vh-4.5rem)] overflow-hidden">

        {/* Lado Izquierdo: Imagen del Evento (Fija, sin scroll) */}
        {evento.bannerIMG && (
          <div className="hidden md:flex md:w-5/12 flex-col bg-white rounded-2xl shadow-2xl overflow-hidden flex-shrink-0 h-full">
            <div className="flex-1 overflow-hidden">
              <img
                src={evento.bannerIMG}
                alt={evento.nombreES}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Botones Sociales Desktop */}
            <div className="p-6 bg-white border-t border-gray-100 flex flex-wrap gap-4">
              {Array.isArray(evento.instagramsAliados) && evento.instagramsAliados.map((handle, idx) => (
                <a
                  key={idx}
                  href={`https://instagram.com/${handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-pink-100 border-2 border-[#1F2937] px-4 py-3 rounded-2xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] active:translate-y-[2px] active:shadow-none min-w-[140px]"
                >
                  <Instagram size={18} strokeWidth={3} /> {handle}
                </a>
              ))}
              <a
                href="https://instagram.com/proyecto__cafe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#ff6600]/10 border-2 border-[#ff6600] px-4 py-3 rounded-2xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_rgba(255,102,0,0.3)] active:translate-y-[2px] active:shadow-none"
              >
                <Instagram size={18} strokeWidth={3} /> @proyecto__cafe
              </a>
            </div>
          </div>
        )}

        {/* Lado Derecho: Card del Formulario (Contenedor del Scroll) */}
        <Card className="w-full md:flex-1 shadow-2xl border-0 rounded-2xl flex flex-col overflow-hidden h-full bg-white">
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* Este div es el que permite el scroll solo en el formulario */}
            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden relative">

              {/* Imagen en vista móvil, dentro del scroll */}
              {evento.bannerIMG && (
                <div className="block md:hidden w-full bg-black/5">
                  <img
                    src={evento.bannerIMG}
                    alt={evento.nombreES}
                    className="w-full h-auto object-contain max-h-[50vh]"
                  />
                </div>
              )}

              {/* Header del Formulario */}
              <CardHeader className="bg-gradient-to-r from-[#ff6600] to-[#ff9933] text-white p-1.5 sticky top-0 z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                <div className="flex items-center gap-3">
                  <Calendar size={24} className="flex-shrink-0" />
                  <CardTitle className="text-2xl md:text-3xl">{evento.nombreES}</CardTitle>
                </div>
                <CardDescription className="text-white/90 text-sm md:text-base flex-shrink-0 md:text-right m-0">
                  {evento.fecha ? new Date(evento.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : evento.fecha} | {evento.horaInicio} - {evento.horaFinal}
                </CardDescription>
              </CardHeader>

              {/* Redes Sociales en Móvil */}
              <div className="block md:hidden px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex flex-wrap gap-3">
                  {Array.isArray(evento.instagramsAliados) && evento.instagramsAliados.map((handle, idx) => (
                    <a
                      key={idx}
                      href={`https://instagram.com/${handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-pink-50 border-2 border-pink-200 px-3 py-2 rounded-xl font-bold text-xs min-w-[100px]"
                    >
                      <Instagram size={14} /> {handle}
                    </a>
                  ))}
                  <a
                    href="https://instagram.com/proyecto__cafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-50 border-2 border-orange-200 px-3 py-2 rounded-xl font-bold text-xs"
                  >
                    <Instagram size={14} /> @proyecto__cafe
                  </a>
                </div>
              </div>

              <CardContent className="p-4 md:p-8">
                {!isFree && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <Info className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <h4 className="font-semibold text-amber-800 text-sm">Costo: {evento.valor}</h4>
                      <p className="text-xs text-amber-700">Quedarás en estado "Pendiente" hasta confirmar pago.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pb-1">
                  {/* Datos Personales */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold border-b pb-1">Tus Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <Label htmlFor="nombre">Nombre Completo *</Label>
                        <input
                          id="nombre" name="nombre" type="text" required
                          value={formData.nombre} onChange={handleChange}
                          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none"
                          placeholder="Ej. Juan Pérez"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <input
                          id="email" name="email" type="email" required
                          value={formData.email} onChange={handleChange}
                          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none"
                          placeholder="juan@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
                        <input
                          id="telefono" name="telefono" type="tel"
                          value={formData.telefono} onChange={handleChange}
                          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6600] outline-none"
                          placeholder="+57 300..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info Adicional */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-semibold border-b pb-1">Información Adicional</h3>
                    <div className="space-y-1">
                      <Label htmlFor="como_nos_encontraste">¿Cómo supiste del evento?</Label>
                      <textarea
                        id="como_nos_encontraste" name="como_nos_encontraste"
                        value={formData.como_nos_encontraste} onChange={handleChange}
                        className="w-full p-2.5 border border-gray-300 rounded-xl h-20 resize-none outline-none focus:ring-2 focus:ring-[#ff6600]"
                        placeholder="Redes sociales, un amigo..."
                      />
                    </div>

                    {tieneAlimentos && (
                      <div className="space-y-1">
                        <Label htmlFor="dieta_especial" className="text-green-700 font-semibold">🍽️ Dieta Especial</Label>
                        <input
                          id="dieta_especial" name="dieta_especial" type="text"
                          value={formData.dieta_especial} onChange={handleChange}
                          className="w-full p-2.5 border border-green-200 bg-green-50 rounded-xl outline-none"
                          placeholder="Ej. Vegano, Alérgico..."
                        />
                      </div>
                    )}

                    {evento?.preguntas_personalizadas?.map(p => (
                      <div key={p.id} className="space-y-1">
                        <Label htmlFor={p.id}>{p.label} {p.requerido && <span className="text-red-500">*</span>}</Label>
                        {p.tipo === 'parrafo' ? (
                          <textarea
                            id={p.id} required={p.requerido}
                            value={formData.respuestas[p.id] || ''}
                            onChange={(e) => handleRespuestaChange(p.id, e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded-xl h-20 outline-none"
                          />
                        ) : (
                          <input
                            id={p.id} type={p.tipo === 'numero' ? 'number' : 'text'}
                            required={p.requerido}
                            value={formData.respuestas[p.id] || ''}
                            onChange={(e) => handleRespuestaChange(p.id, e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Consentimientos y Cuenta */}
                  <div className="bg-gray-50 p-1 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <h3 className="text-md font-semibold">Preferencias y Cuenta</h3>

                    <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="acepta_promociones"
                          checked={formData.acepta_promociones}
                          onCheckedChange={(v) => handleCheckboxChange("acepta_promociones", v)}
                        />
                        <Label htmlFor="acepta_promociones" className="text-xs cursor-pointer">Recibir promociones.</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="acepta_nuevos_eventos"
                          checked={formData.acepta_nuevos_eventos}
                          onCheckedChange={(v) => handleCheckboxChange("acepta_nuevos_eventos", v)}
                        />
                        <Label htmlFor="acepta_nuevos_eventos" className="text-xs cursor-pointer">Enterarme de futuros eventos.</Label>
                      </div>

                      {!loggedUser && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="recordar_usuario"
                            checked={formData.recordar_usuario}
                            onCheckedChange={(v) => handleCheckboxChange("recordar_usuario", v)}
                          />
                          <Label htmlFor="recordar_usuario" className="text-sm font-medium cursor-pointer">Crear cuenta para próximos eventos.</Label>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 border-t border-gray-200 ">

                      {!loggedUser && formData.recordar_usuario && (
                        <div className="mt-1 space-y-1">
                          <Label htmlFor="password">Establecer Contraseña Automática</Label>
                          <input
                            id="password" name="password" type="password"
                            required={formData.recordar_usuario}
                            value={formData.password} onChange={handleChange}
                            className="w-full md:w-1/2 p-1 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#ff6600]"
                            placeholder="Escribe un password (mín. 6 caracteres)"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </div>

            {/* Botón Final (Fijo, fuera del scroll, habilitado solo si isFormValid) */}
            <div className="p-1 md:p-3 bg-white border-t border-gray-100 flex-shrink-0 flex flex-col sm:flex-row gap-1.5">
              {!loggedUser && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLoginOpen(true)}
                  className="flex-1 py-3 border-sage-green text-sage-green hover:bg-sage-green/5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <User size={20} /> Inscribirme como Usuario
                </Button>
              )}

              {loggedUser && (
                <div className="flex-1 flex items-center justify-center gap-2 bg-sage-green/10 text-sage-green rounded-2xl px-4 py-2 border border-sage-green/20">
                  <UserCheck size={18} />
                  <span className="text-sm font-black truncate">Sesión: {loggedUser.name}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || !isFormValid}
                className={`py-3 text-white rounded-2xl font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl ${loggedUser ? 'flex-[2]' : 'flex-1'
                  } ${isFormValid ? 'bg-gradient-to-r from-[#ff6600] to-[#ff9933] hover:scale-[1.01]' : 'bg-gray-300'}`}
              >
                {submitting ? "Procesando..." : "Finalizar Inscripción"}
              </Button>
            </div>
          </form>
        </Card>

        <LoginPortalDialog
          open={isLoginOpen}
          onOpenChange={setIsLoginOpen}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </PageLayout>
  );
}

export default InscripcionEvento;
