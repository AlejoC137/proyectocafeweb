import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, updateItem, getAllFromTable } from "@/redux/actions";
import { AGENDA, ALIADOS } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, ArrowLeft, Save, Plus, X, ImageIcon, UploadCloud, Trash2, FileText, Copy, CheckCircle2, MessageSquare } from "lucide-react";
import { MESSAGE_TEMPLATES } from "@/utils/messageTemplates";
import supabase from "@/config/supabaseClient";
import PageLayout from "../../../components/ui/page-layout";

function AgendaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const [realId, setRealId] = useState(id);
  const isNewEvent = id === "new";
  const [loading, setLoading] = useState(!isNewEvent);
  const [evento, setEvento] = useState(null);
  const allAliados = useSelector((state) => state.allAliados) || [];

  // Obtener parámetros desde URL si existen
  const fechaDesdeURL = searchParams.get("fecha");
  const aliadoIdDesdeURL = searchParams.get("aliado_id");

  // Dynamic Form Builder State
  const [preguntas, setPreguntas] = useState([]);
  const [newPregunta, setNewPregunta] = useState({ label: '', tipo: 'texto', requerido: false });

  // Image Upload State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Instagram Aliados State
  const [tempIG, setTempIG] = useState("");

  // Inscripciones Data
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Attendees Edit State
  const [editingAttendeeId, setEditingAttendeeId] = useState(null);
  const [editAttendeeData, setEditAttendeeData] = useState({});

  // Messaging State
  const [messageForm, setMessageForm] = useState({ title: "", content: "", type: "reminder" });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showMassiveMessage, setShowMassiveMessage] = useState(false);

  // Estado principal del formulario
  const [formData, setFormData] = useState({
    fecha: fechaDesdeURL || "",
    horaInicio: "",
    horaFinal: "",
    nombreES: "",
    nombreEN: "",
    nombreCliente: "",
    autores: "",
    valor: "",
    bannerIMG: "",
    linkInscripcion: "",
    infoAdicional: "",
    telefonoCliente: "",
    decripcion: "",
    emailCliente: "",
    numeroPersonas: 1,
    instagramsAliados: [],
    aliado_id: aliadoIdDesdeURL || null,
  });

  // Estado para servicios
  const [servicios, setServicios] = useState({
    alimentos: { activo: false, descripcion: "" },
    mesas: { activo: false, descripcion: "" },
    audioVisual: { activo: false, descripcion: "" },
    otros: { activo: false, descripcion: "" },
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    const fetchEvento = async () => {
      if (isNewEvent) return;
      
      setLoading(true);
      try {
        let resolveId = id;
        if (id.length < 36) {
          const { data: allIds, error: idsErr } = await supabase.from(AGENDA).select('_id');
          if (idsErr) throw idsErr;

          const match = allIds?.find(e => e._id && e._id.toString().toLowerCase().startsWith(id.toLowerCase()));
          if (match) {
            resolveId = match._id;
            setRealId(match._id);
          } else {
            throw new Error(`No se encontró un evento que coincida con el ID corto: ${id}`);
          }
        }

        if (resolveId.length < 36) {
          throw new Error("Invalid UUID format resolved");
        }

        const { data, error } = await supabase
          .from(AGENDA)
          .select("*")
          .eq("_id", resolveId)
          .single();

        if (error) throw error;
        if (!data) {
          alert("Evento no encontrado");
          navigate("/Agenda");
          return;
        }

        setEvento(data);
        setPreguntas(data.preguntas_personalizadas || []);
        
        // Cargar datos al formulario
        setFormData({
          nombreES: data.nombreES || "",
          fecha: data.fecha || "",
          horaInicio: data.horaInicio || "",
          horaFinal: data.horaFinal || "",
          nombreCliente: data.nombreCliente || "",
          emailCliente: data.emailCliente || "",
          telefonoCliente: data.telefonoCliente || "",
          numeroPersonas: data.numeroPersonas || 1,
          bannerIMG: data.bannerIMG || "",
          linkInscripcion: data.linkInscripcion || "",
          infoAdicional: data.infoAdicional || "",
          valor: data.valor || "",
          autores: data.autores || "",
          nombreEN: data.nombreEN || "",
          decripcion: data.decripcion || data.descripcion || "",
          instagramsAliados: Array.isArray(data.instagramsAliados) ? data.instagramsAliados : (data.instagramsAliados ? [data.instagramsAliados] : []),
          estado: data.estado || "pendiente",
          aliado_id: data.aliado_id || null,
        });

        const parseServiciosToState = (raw) => {
            let parsed = raw;
            if (!parsed) return null;
            try {
              if (typeof parsed === "string") parsed = JSON.parse(parsed);
            } catch (e) {
              console.warn("No se pudo parsear servicios desde string:", e);
            }

            if (Array.isArray(parsed)) {
              const obj = {
                alimentos: { activo: false, descripcion: "" },
                mesas: { activo: false, descripcion: "" },
                audioVisual: { activo: false, descripcion: "" },
                otros: { activo: false, descripcion: "" },
              };

              parsed.forEach((item) => {
                if (item.alimentos !== undefined) {
                  obj.alimentos.activo = !!item.alimentos;
                  obj.alimentos.descripcion = item.alimentosDescripcion || "";
                }
                if (item.mesas !== undefined) {
                  obj.mesas.activo = !!item.mesas;
                  obj.mesas.descripcion = item.mesasDescription || "";
                }
                if (item.audioVisual !== undefined) {
                  obj.audioVisual.activo = !!item.audioVisual;
                  obj.audioVisual.descripcion = item.audioVisualDescription || "";
                }
                if (item.otros !== undefined) {
                  obj.otros.activo = !!item.otros;
                  obj.otros.descripcion = item.otrosDescroptions || item.otrosDescription || "";
                }
              });

              return obj;
            }

            if (typeof parsed === "object") {
              return {
                alimentos: {
                  activo: !!(parsed.alimentos && parsed.alimentos.activo) || !!parsed.alimentos,
                  descripcion: parsed.alimentos?.descripcion || parsed.alimentosDescripcion || "",
                },
                mesas: {
                  activo: !!(parsed.mesas && parsed.mesas.activo) || !!parsed.mesas,
                  descripcion: parsed.mesas?.descripcion || parsed.mesasDescription || "",
                },
                audioVisual: {
                  activo: !!(parsed.audioVisual && parsed.audioVisual.activo) || !!parsed.audioVisual,
                  descripcion: parsed.audioVisual?.descripcion || parsed.audioVisualDescription || "",
                },
                otros: {
                  activo: !!(parsed.otros && parsed.otros.activo) || !!parsed.otros,
                  descripcion: parsed.otros?.descripcion || parsed.otrosDescroptions || parsed.otrosDescription || "",
                },
              };
            }

            return null;
          };

          const serviciosState = parseServiciosToState(data.servicios);
          if (serviciosState) setServicios(serviciosState);
      } catch (err) {
        console.error("Error al cargar evento:", err);
        alert("Error al cargar el evento");
        navigate("/Agenda");
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id, isNewEvent, navigate]);

  useEffect(() => {
    dispatch(getAllFromTable(ALIADOS));
  }, [dispatch]);

  
  useEffect(() => {
    if (!isNewEvent) {
      setLoadingAttendees(true);
      const fetchAttendees = async () => {
        let resolveId = realId;
        if (resolveId.length < 36) {
          const { data: allIds } = await supabase.from(AGENDA).select('_id');
          const match = allIds?.find(e => e._id && e._id.toString().toLowerCase().startsWith(resolveId.toLowerCase()));
          if (match) {
            resolveId = match._id;
            setRealId(resolveId);
          }
        }

        if (resolveId.length >= 36) {
          const { data, error } = await supabase.from('attendees').select('*').eq('evento_id', resolveId);
          if (!error && data) setAttendees(data);
        }
        setLoadingAttendees(false);
      };
      fetchAttendees();
    }
  }, [id, isNewEvent, realId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "numeroPersonas") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, nombreCliente: value }));

    const aliado = allAliados.find((a) => a.nombre.toLowerCase() === value.toLowerCase());
    
    if (aliado) {
      setFormData((prev) => ({
        ...prev,
        aliado_id: aliado.id,
        emailCliente: aliado.email || prev.emailCliente,
        telefonoCliente: aliado.telefono || prev.telefonoCliente,
      }));
      if (aliado.instagram) {
        const handle = aliado.instagram.trim().startsWith('@') ? aliado.instagram.trim() : `@${aliado.instagram.trim()}`;
        setFormData((prev) => {
          if (!prev.instagramsAliados.includes(handle)) {
            return { ...prev, instagramsAliados: [...prev.instagramsAliados, handle] };
          }
          return prev;
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, aliado_id: null }));
    }
  };

  const handleServicioToggle = (servicioKey) => {
    setServicios(prev => ({
      ...prev,
      [servicioKey]: {
        ...prev[servicioKey],
        activo: !prev[servicioKey].activo,
        descripcion: !prev[servicioKey].activo ? prev[servicioKey].descripcion : "",
      }
    }));
  };

  const handleServicioDescripcionChange = (servicioKey, value) => {
    setServicios(prev => ({
      ...prev,
      [servicioKey]: {
        ...prev[servicioKey],
        descripcion: value,
      }
    }));
  };

  // Subir imagen al bucket
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      if (formData.bannerIMG && formData.bannerIMG.includes("Images_eventos")) {
        const urlParts = formData.bannerIMG.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from("Images_eventos").remove([fileName]);
      }

      const fileExt = file.name.split('.').pop();
      const uniqueName = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("Images_eventos").upload(uniqueName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("Images_eventos").getPublicUrl(uniqueName);
      setFormData(prev => ({ ...prev, bannerIMG: publicUrl }));

    } catch (err) {
      console.error("Error subiendo la imagen", err);
      alert("Hubo un error al subir la imagen del banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!formData.bannerIMG) return;
    setIsUploadingBanner(true);
    try {
      if (formData.bannerIMG.includes("Images_eventos")) {
        const urlParts = formData.bannerIMG.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from("Images_eventos").remove([fileName]);
      }
      setFormData(prev => ({ ...prev, bannerIMG: "" }));
    } catch (e) {
      console.error(e);
      alert("Error eliminando imagen");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const addInstagramHandle = () => {
    if (!tempIG.trim()) return;
    const handle = tempIG.trim().startsWith('@') ? tempIG.trim() : `@${tempIG.trim()}`;
    if (!formData.instagramsAliados.includes(handle)) {
      setFormData(prev => ({ ...prev, instagramsAliados: [...prev.instagramsAliados, handle] }));
    }
    setTempIG("");
  };

  const removeInstagramHandle = (handle) => {
    setFormData(prev => ({ ...prev, instagramsAliados: prev.instagramsAliados.filter(h => h !== handle) }));
  };

  // Manejo de Preguntas Personalizadas
  const handleAddPregunta = () => {
    if (!newPregunta.label.trim()) return;
    setPreguntas([...preguntas, { ...newPregunta, id: Date.now().toString() }]);
    setNewPregunta({ label: '', tipo: 'texto', requerido: false });
  };
  const handleRemovePregunta = (pid) => setPreguntas(preguntas.filter(p => p.id !== pid));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombreES || !formData.fecha || !formData.horaInicio || !formData.horaFinal) {
      alert("Por favor completa todos los campos obligatorios (nombreES, fecha y horarios)");
      return;
    }

    const buildServiciosForSupabase = (svc) => {
      return [
        { alimentos: !!svc.alimentos.activo, alimentosDescripcion: svc.alimentos.descripcion || "" },
        { mesas: !!svc.mesas.activo, mesasDescription: svc.mesas.descripcion || "" },
        { audioVisual: !!svc.audioVisual.activo, audioVisualDescription: svc.audioVisual.descripcion || "" },
        { otros: !!svc.otros.activo, otrosDescroptions: svc.otros.descripcion || "" },
      ];
    };

    const eventoData = {
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFinal: formData.horaFinal,
      nombreES: formData.nombreES,
      nombreEN: formData.nombreEN || "",
      autores: formData.autores || "",
      valor: formData.valor || "",
      bannerIMG: formData.bannerIMG || "",
      linkInscripcion: formData.linkInscripcion || "",
      infoAdicional: formData.infoAdicional || "",
      decripcion: formData.decripcion || "",
      nombreCliente: formData.nombreCliente || "",
      emailCliente: formData.emailCliente || "",
      telefonoCliente: formData.telefonoCliente || "",
      aliado_id: formData.aliado_id || null,
      numeroPersonas: parseInt(formData.numeroPersonas) || 1,
      instagramsAliados: formData.instagramsAliados || [],
      servicios: JSON.stringify(buildServiciosForSupabase(servicios)),
      preguntas_personalizadas: preguntas
    };

    try {
      if (isNewEvent) {
        await dispatch(crearItem(eventoData, AGENDA));
        alert("Evento creado exitosamente");
      } else {
        await dispatch(updateItem(realId, eventoData, AGENDA));
        alert("Evento actualizado exitosamente");
      }
      
      dispatch(getAllFromTable(AGENDA));
      navigate("/Agenda");
    } catch (error) {
      console.error("Error al guardar evento:", error);
      alert("Error al guardar el evento");
    }
  };

  
  const updatePaymentStatus = async (attendeeId, checked) => {
    const newStatus = checked ? 'pagado' : 'pendiente';
    const { error } = await supabase.from('attendees').update({ estado_pago: newStatus }).eq('id', attendeeId);
    if (!error) setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, estado_pago: newStatus } : a));
  };
  const copyInscriptionLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/inscripcion/${id}`);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  };
  const startEditAttendee = (a) => {
    setEditingAttendeeId(a.id);
    setEditAttendeeData({ nombre: a.nombre, email: a.email, telefono: a.telefono });
  };
  const saveEditAttendee = async (aid) => {
    const { error } = await supabase.from('attendees').update(editAttendeeData).eq('id', aid);
    if (!error) {
      setAttendees(prev => prev.map(a => a.id === aid ? { ...a, ...editAttendeeData } : a));
      setEditingAttendeeId(null);
    } else {
      alert("Error al actualizar asistente");
    }
  };
  const deleteAttendee = async (aid) => {
    if (window.confirm("¿Estás seguro que deseas eliminar permanentemente a este asistente?")) {
      const { error } = await supabase.from('attendees').delete().eq('id', aid);
      if (!error) {
        setAttendees(prev => prev.filter(a => a.id !== aid));
      } else {
        alert("Error al eliminar asistente");
      }
    }
  };

  const handleWhatsAppMessage = (a) => {
    if (!a || !a.telefono) {
      alert("El asistente no tiene un número de teléfono registrado.");
      return;
    }

    let content = "";
    if (typeof messageForm.content === 'function') {
      content = messageForm.content(
        a.nombre,
        formData.nombreES,
        formData.fecha,
        formData.horaInicio,
        formData.horaFinal,
        formData.valor,
        formData.decripcion,
        formData.infoAdicional,
        formData.instagramsAliados,
        formData.linkInscripcion,
        formData.autores
      );
    } else {
      content = (messageForm.content || "")
        .replace(/{nombre}/g, a.nombre)
        .replace(/{evento}/g, formData.nombreES)
        .replace(/{fecha}/g, formData.fecha)
        .replace(/{hora}/g, formData.horaInicio)
        .replace(/{horaFin}/g, formData.horaFinal)
        .replace(/{valor}/g, formData.valor)
        .replace(/{descripcion}/g, formData.decripcion)
        .replace(/{info}/g, formData.infoAdicional)
        .replace(/{aliados}/g, formData.instagramsAliados?.join(', ') || "")
        .replace(/{link}/g, formData.linkInscripcion || "")
        .replace(/{autores}/g, formData.autores || "");
    }

    const textToEncode = content || `Hola ${a.nombre}, te escribimos de Proyecto Café para recordarte el evento ${formData.nombreES}, el día ${formData.fecha} a las ${formData.horaInicio} en Proyecto Café.`;
    const fullText = encodeURIComponent(textToEncode);

    let phone = String(a.telefono).replace(/\D/g, '');
    if (phone.length === 10) phone = '57' + phone;

    window.open(`https://wa.me/${phone}?text=${fullText}`, "_blank");
  };

  const handleCancel = () => {
    if (window.confirm("¿Estás seguro de cancelar? Los cambios no guardados se perderán.")) {
      navigate("/Agenda");
    }
  };

  if (loading) {
    return (
      <PageLayout title="Cargando...">
        <div className="flex items-center justify-center p-12 w-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={isNewEvent ? "Nuevo Evento" : "Editar Evento"}>
      <div className="w-full">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {isNewEvent ? "Crear Nuevo Evento" : `Editando: ${evento?.nombreES || evento?.nombre}`}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-sm"
                >
                  <Save size={18} className="mr-2" />
                  {isNewEvent ? "Crear Evento" : "Guardar Cambios"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="text-white hover:bg-white/20"
                  title="Volver / Cancelar"
                >
                  <ArrowLeft size={24} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna Izquierda: Formulario Principal */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-purple-600" size={20} />
                    Información del Evento
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre del Evento *</Label>
                      <input name="nombreES" type="text" value={formData.nombreES} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre Alternativo</Label>
                      <input name="nombreEN" type="text" value={formData.nombreEN} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha *</Label>
                      <input name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Inicio *</Label>
                      <input name="horaInicio" type="time" value={formData.horaInicio} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Final *</Label>
                      <input name="horaFinal" type="time" value={formData.horaFinal} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <input name="valor" type="text" value={formData.valor} onChange={handleInputChange} placeholder="Ej: $50,000 o Gratis" className="w-full p-2 border rounded-md" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="text-blue-600" size={20} /> Información del Aliado / Organizador
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <Label>Nombre del Aliado</Label>
                      <input 
                        name="nombreCliente" 
                        type="text" 
                        value={formData.nombreCliente} 
                        onChange={handleNameChange} 
                        className={`w-full p-2 border rounded-md outline-none transition-shadow ${formData.aliado_id ? 'border-purple-400 bg-purple-50 focus:ring-2 focus:ring-purple-500' : 'focus:ring-2 focus:ring-purple-500'}`} 
                        placeholder="Escribe para buscar o ingresar uno nuevo..."
                        list="aliados-list-page"
                      />
                      <datalist id="aliados-list-page">
                        {allAliados.map(a => (
                          <option key={a.id} value={a.nombre}>{a.categoria}</option>
                        ))}
                      </datalist>
                      {formData.aliado_id && <p className="text-xs text-purple-600 mt-1 font-medium">✓ Aliado vinculado</p>}
                    </div>
                    <div className="space-y-2"><Label>Email del Aliado</Label><input name="emailCliente" type="email" value={formData.emailCliente} onChange={handleInputChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none" /></div>
                    <div className="space-y-2"><Label>Teléfono del Aliado</Label><input name="telefonoCliente" type="tel" value={formData.telefonoCliente} onChange={handleInputChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none" /></div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label>Instagrams de los Aliados</Label>
                      <div className="flex gap-2 mb-2">
                        <input 
                          type="text" 
                          value={tempIG} 
                          onChange={(e) => setTempIG(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInstagramHandle())} 
                          className="flex-1 p-2 border rounded-md" 
                          placeholder="@usuario" 
                          list="instagrams-list-page"
                        />
                        <datalist id="instagrams-list-page">
                          {allAliados.filter(a => a.instagram).map(a => (
                            <option key={a.id} value={a.instagram.startsWith('@') ? a.instagram : `@${a.instagram}`}>
                              {a.nombre}
                            </option>
                          ))}
                        </datalist>
                        <Button type="button" onClick={addInstagramHandle} variant="outline" className="border-blue-600 text-blue-600"><Plus size={16} /></Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.instagramsAliados.map((handle, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-pink-50 text-pink-700 px-3 py-1 rounded-full border border-pink-200 text-sm font-semibold">
                            {handle}
                            <button type="button" onClick={() => removeInstagramHandle(handle)}><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2 pt-2"><Label>Organizadores Secundarios</Label><input name="autores" type="text" value={formData.autores} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Servicios Requeridos</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={servicios.alimentos.activo} onCheckedChange={() => handleServicioToggle("alimentos")} />
                        <Label className="font-medium cursor-pointer">🍽️ Alimentos</Label>
                      </div>
                      {servicios.alimentos.activo && (<textarea value={servicios.alimentos.descripcion} onChange={(e) => handleServicioDescripcionChange("alimentos", e.target.value)} className="w-full p-2 border rounded-md text-sm" rows="1" />)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 flex items-center space-x-2"><Checkbox checked={servicios.mesas.activo} onCheckedChange={() => handleServicioToggle("mesas")} /><Label>Mesas</Label></div>
                      <div className="border rounded-lg p-4 flex items-center space-x-2"><Checkbox checked={servicios.audioVisual.activo} onCheckedChange={() => handleServicioToggle("audioVisual")} /><Label>Audio Visual</Label></div>
                      <div className="border rounded-lg p-4 flex items-center space-x-2"><Checkbox checked={servicios.otros.activo} onCheckedChange={() => handleServicioToggle("otros")} /><Label>Otros</Label></div>
                    </div>
                  </div>
                </div>


              </form>

              {/* Columna Derecha: Configuración Extra */}
              <div className="space-y-8">
                {/* Banner Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ImageIcon className="text-purple-600" size={20} /> Imagen del Evento
                  </h3>
                  <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center bg-gray-50 relative min-h-[200px]">
                    {isUploadingBanner && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-md">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    )}
                    {formData.bannerIMG ? (
                      <div className="relative w-full group">
                        <img src={formData.bannerIMG} alt="Banner" className="w-full h-48 object-cover rounded-md border" />
                        <button type="button" onClick={handleRemoveBanner} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-md">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="text-gray-400 mb-2" size={48} />
                        <Label className="cursor-pointer text-blue-600 hover:underline font-semibold">
                          Subir Banner
                          <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                        </Label>
                        <span className="text-xs text-gray-400 mt-1">Soporta JPG, PNG</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>O URL externa de Imagen</Label>
                    <input name="bannerIMG" type="url" value={formData.bannerIMG} onChange={handleInputChange} className="w-full p-2 border rounded-md" placeholder="https://..." />
                  </div>
                </div>

                {/* Preguntas Dinámicas */}
                <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="text-purple-600" size={20} /> Formulario de Inscripción
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                    <div>
                      <Label>Pregunta Adicional</Label>
                      <input type="text" value={newPregunta.label} onChange={(e) => setNewPregunta({ ...newPregunta, label: e.target.value })} className="w-full p-2 border rounded mt-1" placeholder="Ej. ¿Qué talla de camiseta eres?" />
                    </div>
                    <div className="flex gap-4">
                      <select value={newPregunta.tipo} onChange={(e) => setNewPregunta({ ...newPregunta, tipo: e.target.value })} className="flex-1 p-2 border rounded bg-white">
                        <option value="texto">Texto Corto</option>
                        <option value="parrafo">Párrafo</option>
                        <option value="numero">Número</option>
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={newPregunta.requerido} onCheckedChange={(checked) => setNewPregunta({ ...newPregunta, requerido: checked })} />
                        <span className="text-sm">Obligatorio</span>
                      </label>
                    </div>
                    <Button type="button" onClick={handleAddPregunta} className="w-full bg-gray-900 text-white"><Plus size={16} className="mr-2" /> Agregar Pregunta</Button>
                  </div>

                  <div className="space-y-2">
                    {preguntas.map((p, idx) => (
                      <div key={p.id} className="bg-white p-3 rounded border flex items-center justify-between">
                        <span className="text-sm font-medium">{idx + 1}. {p.label}</span>
                        <button type="button" onClick={() => handleRemovePregunta(p.id)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Otros campos */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2"><Label>Link de Inscripción externo</Label><input name="linkInscripcion" type="url" value={formData.linkInscripcion} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                  <div className="space-y-2"><Label>Número de Personas</Label><input name="numeroPersonas" type="text" inputMode="numeric" value={formData.numeroPersonas} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                  <div className="space-y-2"><Label>Descripción (Pública)</Label><textarea name="decripcion" value={formData.decripcion} onChange={handleInputChange} className="w-full p-2 border rounded-md" rows="2" /></div>
                  <div className="space-y-2"><Label>Información Adicional (Interna)</Label><textarea name="infoAdicional" value={formData.infoAdicional} onChange={handleInputChange} className="w-full p-2 border rounded-md" rows="3" /></div>
                </div>
              </div>

              {/* UI DE INSCRIPCIONES (Añadido en la parte inferior) */}
              {!isNewEvent && (
                <div className="col-span-1 lg:col-span-2 space-y-6 mt-8 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-bold">Asistentes Inscritos</h3>
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">Total: {attendees.length}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowMassiveMessage(!showMassiveMessage)}
                        variant={showMassiveMessage ? "secondary" : "default"}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        <MessageSquare size={18} /> Redactar WhatsApp
                      </Button>
                      <Button type="button" onClick={copyInscriptionLink} className="flex items-center gap-2 text-sm bg-[#ff6600] text-white hover:bg-[#e65c00] transition shadow-md px-5 py-2 rounded-xl font-semibold">
                        {copiedLink ? <CheckCircle2 size={18} /> : <Copy size={18} />} {copiedLink ? "¡Copiado!" : "Copiar Enlace Público"}
                      </Button>
                    </div>
                  </div>

                  {showMassiveMessage && (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-2xl animate-in slide-in-from-top-2">
                      <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Preparar Comunicación WhatsApp
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label>Contenido del Mensaje</Label>
                            <textarea
                              placeholder="Escribe el mensaje para los asistentes..."
                              value={typeof messageForm.content === 'function' ? messageForm.content('{nombre}', formData.nombreES, formData.fecha, formData.horaInicio, formData.horaFinal, formData.valor, formData.decripcion, formData.infoAdicional, formData.instagramsAliados, formData.linkInscripcion, formData.autores) : messageForm.content}
                              onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                              className="w-full p-2 border rounded-md text-sm bg-white min-h-[120px]"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label>Plantillas Rápidas</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMessageForm({
                                title: MESSAGE_TEMPLATES.EVENT_REMINDER.title,
                                content: MESSAGE_TEMPLATES.EVENT_REMINDER.content,
                                type: "reminder"
                              })}
                              className="border-green-200 text-green-700 hover:bg-green-100"
                            >
                              Recordatorio de Evento
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMessageForm({
                                title: MESSAGE_TEMPLATES.EVENT.title,
                                content: MESSAGE_TEMPLATES.EVENT.content,
                                type: "announcement"
                              })}
                              className="border-green-200 text-green-700 hover:bg-green-100"
                            >
                              Anuncio Gral
                            </Button>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-green-100 mt-4">
                            <p className="text-xs text-gray-500">
                              <b>Instrucciones:</b> El mensaje redactado arriba se enviará cuando hagas clic en el icono de WhatsApp al lado de cada asistente en la tabla de abajo.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loadingAttendees ? (
                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
                  ) : attendees.length === 0 ? (
                    <div className="text-center p-12 bg-gray-50 border rounded-lg">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <h4 className="text-lg font-medium text-gray-900">Aún no hay inscripciones</h4>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-xl shadow-sm">
                      <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="bg-gray-100/80 text-gray-700 uppercase text-xs border-b">
                          <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Contacto</th>
                            <th className="px-4 py-3">Respuestas & Extra</th>
                            <th className="px-4 py-3 text-center">Pago</th>
                            <th className="px-4 py-3 text-center">Mensaje</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendees.map((a) => {
                            const isEditing = editingAttendeeId === a.id;
                            return (
                              <tr key={a.id} className={`border-b hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                                <td className="px-4 py-3 align-top">
                                  {isEditing ? <input value={editAttendeeData.nombre} onChange={(e) => setEditAttendeeData({ ...editAttendeeData, nombre: e.target.value })} className="border p-1 w-full text-sm rounded" /> : <p className="font-medium text-gray-900">{a.nombre}</p>}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {isEditing ? (
                                    <div className="space-y-1">
                                      <input value={editAttendeeData.email} onChange={(e) => setEditAttendeeData({ ...editAttendeeData, email: e.target.value })} className="border p-1 w-full text-sm rounded mb-1" placeholder="Email" />
                                      <input value={editAttendeeData.telefono || ''} onChange={(e) => setEditAttendeeData({ ...editAttendeeData, telefono: e.target.value })} className="border p-1 w-full text-sm rounded" placeholder="Teléfono" />
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      <a href={`mailto:${a.email}`} className="text-blue-600 hover:underline">{a.email}</a>
                                      {a.telefono && <span className="text-gray-500">{a.telefono}</span>}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top text-gray-600">
                                  {a.respuestas_personalizadas && Object.keys(a.respuestas_personalizadas).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(a.respuestas_personalizadas).map(([k, v]) => (
                                        <p key={k} className="text-xs border-b pb-1 last:border-0"><span className="font-medium text-gray-800">{k}:</span> {v}</p>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic text-xs">Sin respuestas</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top text-center">
                                  <label className="flex items-center justify-center cursor-pointer">
                                    <Checkbox checked={a.estado_pago === 'pagado'} onCheckedChange={(checked) => updatePaymentStatus(a.id, checked)} />
                                  </label>
                                </td>
                                <td className="px-4 py-3 align-top text-center">
                                  <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-100 hover:text-green-800" onClick={() => handleWhatsAppMessage(a)} title="Enviar WhatsApp al número registrado">
                                    <MessageSquare size={18} />
                                  </Button>
                                </td>
                                <td className="px-4 py-3 align-top text-center">
                                  <div className="flex justify-center items-center gap-2">
                                    {isEditing ? (
                                      <Button size="sm" variant="default" onClick={() => saveEditAttendee(a.id)} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
                                    ) : (
                                      <Button size="sm" variant="ghost" onClick={() => startEditAttendee(a)} className="text-blue-600 hover:bg-blue-50">Editar</Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => deleteAttendee(a.id)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default AgendaFormPage;
