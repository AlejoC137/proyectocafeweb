import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { crearItem, updateItem, getAllFromTable } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, ArrowLeft, Save, Copy, CheckCircle2, Edit2, Trash2, Plus, GripVertical, FileText, CheckCircle, X, ImageIcon, UploadCloud } from "lucide-react";
import supabase from "@/config/supabaseClient";
import PageLayout from "../../../components/ui/page-layout";

function AgendaModal() {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [realId, setRealId] = useState(id); // Para mantener el UUID real completo en base de datos

  const isNewEvent = id === "new";
  const [loading, setLoading] = useState(!isNewEvent);
  const [evento, setEvento] = useState(null);

  // Inscripciones Data
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Attendees Edit State
  const [editingAttendeeId, setEditingAttendeeId] = useState(null);
  const [editAttendeeData, setEditAttendeeData] = useState({});

  // Image Upload State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Dynamic Form Builder State
  const [preguntas, setPreguntas] = useState([]);
  const [newPregunta, setNewPregunta] = useState({ label: '', tipo: 'texto', requerido: false });

  // Estado principal del formulario (Evento)
  const [formData, setFormData] = useState({
    fecha: "", horaInicio: "", horaFinal: "", nombreES: "", nombreEN: "",
    nombreCliente: "", autores: "", valor: "", bannerIMG: "", linkInscripcion: "",
    infoAdicional: "", telefonoCliente: "", decripcion: "", emailCliente: "", numeroPersonas: 1,
  });

  // Estado para servicios
  const [servicios, setServicios] = useState({
    alimentos: { activo: false, descripcion: "" },
    mesas: { activo: false, descripcion: "" },
    audioVisual: { activo: false, descripcion: "" },
    otros: { activo: false, descripcion: "" },
  });

  useEffect(() => {
    const fetchEvento = async () => {
      if (isNewEvent) return;

      setLoading(true);
      try {
        let resolveId = id;
        // Búsqueda inteligente: si el id es corto, buscamos a qué UUID pertenece
        if (id.length < 36) {
          const { data: allIds } = await supabase.from(AGENDA).select('_id');
          const match = allIds?.find(e => e._id.startsWith(id));
          if (match) {
            resolveId = match._id;
            setRealId(match._id);
          }
        }

        const { data, error } = await supabase.from(AGENDA).select("*").eq("_id", resolveId).single();
        if (error) throw error;
        if (!data) {
          alert("Evento no encontrado"); navigate("/Agenda"); return;
        }

        setEvento(data);
        setPreguntas(data.preguntas_personalizadas || []);

        setFormData({
          nombreES: data.nombreES || "", fecha: data.fecha || "", horaInicio: data.horaInicio || "",
          horaFinal: data.horaFinal || "", nombreCliente: data.nombreCliente || "", emailCliente: data.emailCliente || "",
          telefonoCliente: data.telefonoCliente || "", numeroPersonas: data.numeroPersonas || 1, bannerIMG: data.bannerIMG || "",
          linkInscripcion: data.linkInscripcion || "", infoAdicional: data.infoAdicional || "", valor: data.valor || "",
          autores: data.autores || "", nombreEN: data.nombreEN || "", decripcion: data.decripcion || data.descripcion || "",
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
              alimentos: { activo: false, descripcion: "" }, mesas: { activo: false, descripcion: "" },
              audioVisual: { activo: false, descripcion: "" }, otros: { activo: false, descripcion: "" },
            };
            parsed.forEach((item) => {
              if (item.alimentos !== undefined) { obj.alimentos.activo = !!item.alimentos; obj.alimentos.descripcion = item.alimentosDescripcion || ""; }
              if (item.mesas !== undefined) { obj.mesas.activo = !!item.mesas; obj.mesas.descripcion = item.mesasDescription || ""; }
              if (item.audioVisual !== undefined) { obj.audioVisual.activo = !!item.audioVisual; obj.audioVisual.descripcion = item.audioVisualDescription || ""; }
              if (item.otros !== undefined) { obj.otros.activo = !!item.otros; obj.otros.descripcion = item.otrosDescroptions || item.otrosDescription || ""; }
            });
            return obj;
          }

          if (typeof parsed === "object") {
            return {
              alimentos: { activo: !!(parsed.alimentos && parsed.alimentos.activo) || !!parsed.alimentos, descripcion: parsed.alimentos?.descripcion || parsed.alimentosDescripcion || "" },
              mesas: { activo: !!(parsed.mesas && parsed.mesas.activo) || !!parsed.mesas, descripcion: parsed.mesas?.descripcion || parsed.mesasDescription || "" },
              audioVisual: { activo: !!(parsed.audioVisual && parsed.audioVisual.activo) || !!parsed.audioVisual, descripcion: parsed.audioVisual?.descripcion || parsed.audioVisualDescription || "" },
              otros: { activo: !!(parsed.otros && parsed.otros.activo) || !!parsed.otros, descripcion: parsed.otros?.descripcion || parsed.otrosDescroptions || parsed.otrosDescription || "" },
            };
          }
          return null;
        };

        const serviciosState = parseServiciosToState(data.servicios);
        if (serviciosState) setServicios(serviciosState);
      } catch (err) {
        console.error("Error al cargar evento:", err);
        alert("Error al cargar el evento"); navigate("/Agenda");
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id, isNewEvent, navigate]);

  useEffect(() => {
    if (!isNewEvent) {
      setLoadingAttendees(true);
      const fetchAttendees = async () => {
        let resolveId = realId;
        // Misma lógica de búsqueda inteligente por si realId no se ha establecido todavía (condición de carrera)
        if (resolveId.length < 36) {
          const { data: allIds } = await supabase.from(AGENDA).select('_id');
          const match = allIds?.find(e => e._id.startsWith(resolveId));
          if (match) resolveId = match._id;
        }

        const { data, error } = await supabase.from('attendees').select('*').eq('evento_id', resolveId);
        if (!error && data) setAttendees(data);
        setLoadingAttendees(false);
      };
      fetchAttendees();
    }
  }, [id, isNewEvent, realId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Restricción para forzar que numeroPersonas sea estrictamente numérico
    if (name === "numeroPersonas") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServicioToggle = (servicioKey) => {
    setServicios(prev => ({
      ...prev, [servicioKey]: { ...prev[servicioKey], activo: !prev[servicioKey].activo, descripcion: !prev[servicioKey].activo ? prev[servicioKey].descripcion : "" }
    }));
  };

  const handleServicioDescripcionChange = (servicioKey, value) => {
    setServicios(prev => ({ ...prev, [servicioKey]: { ...prev[servicioKey], descripcion: value } }));
  };

  // Subir imagen al bucket
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      // Si ya hay una imagen en ese bucket, intentamos eliminarla primero
      if (formData.bannerIMG && formData.bannerIMG.includes("Images_eventos")) {
        const urlParts = formData.bannerIMG.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from("Images_eventos").remove([fileName]);
      }

      // Subimos la nueva imagen
      const fileExt = file.name.split('.').pop();
      const uniqueName = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("Images_eventos").upload(uniqueName, file);

      if (uploadError) throw uploadError;

      // Obtenemos su URL pública
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

  // Guardar datos generales del evento
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombreES || !formData.fecha || !formData.horaInicio || !formData.horaFinal) {
      alert("Por favor completa todos los campos obligatorios (nombreES, fecha y horarios)"); return;
    }

    const buildServiciosForSupabase = (svc) => [
      { alimentos: !!svc.alimentos.activo, alimentosDescripcion: svc.alimentos.descripcion || "" },
      { mesas: !!svc.mesas.activo, mesasDescription: svc.mesas.descripcion || "" },
      { audioVisual: !!svc.audioVisual.activo, audioVisualDescription: svc.audioVisual.descripcion || "" },
      { otros: !!svc.otros.activo, otrosDescroptions: svc.otros.descripcion || "" },
    ];

    const eventoData = {
      fecha: formData.fecha, horaInicio: formData.horaInicio, horaFinal: formData.horaFinal, nombreES: formData.nombreES,
      nombreEN: formData.nombreEN || "", autores: formData.autores || "", valor: formData.valor || "", bannerIMG: formData.bannerIMG || "",
      linkInscripcion: formData.linkInscripcion || "", infoAdicional: formData.infoAdicional || "", decripcion: formData.decripcion || "",
      emailCliente: formData.emailCliente || "", telefonoCliente: formData.telefonoCliente || "", numeroPersonas: parseInt(formData.numeroPersonas) || 1,
      servicios: JSON.stringify(buildServiciosForSupabase(servicios)),
      preguntas_personalizadas: preguntas // Guardamos las preguntas dinámicas
    };

    try {
      if (isNewEvent) {
        await dispatch(crearItem(eventoData, AGENDA));
        alert("Evento Creado. Revise el calendario");
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

  // Manejo de Preguntas Personalizadas
  const handleAddPregunta = () => {
    if (!newPregunta.label.trim()) return;
    setPreguntas([...preguntas, { ...newPregunta, id: Date.now().toString() }]);
    setNewPregunta({ label: '', tipo: 'texto', requerido: false });
  };
  const handleRemovePregunta = (pid) => setPreguntas(preguntas.filter(p => p.id !== pid));

  // Manejo de Inscripciones (Edit/Delete)
  const handleCancel = () => { if (window.confirm("¿Estás seguro de cancelar? Los cambios no guardados se perderán.")) navigate("/Agenda"); };
  const updatePaymentStatus = async (attendeeId, checked) => {
    const newStatus = checked ? 'pagado' : 'pendiente';
    const { error } = await supabase.from('attendees').update({ estado_pago: newStatus }).eq('id', attendeeId);
    if (!error) setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, estado_pago: newStatus } : a));
  };
  const copyInscriptionLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/share?id=${id}`);
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

  if (loading) return (
    <PageLayout title="Cargando...">
      <div className="flex items-center justify-center p-12 w-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
    </PageLayout>
  );

  return (
    <PageLayout title={isNewEvent ? "Nuevo Evento" : "Editar Evento"}>
      <div className="max-w-[1200px] mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{isNewEvent ? "Crear Nuevo Evento" : `Editando: ${evento?.nombreES}`}</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel} className="text-white hover:bg-white/20"><ArrowLeft size={24} /></Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={tab || "detalles"} onValueChange={(t) => navigate(`/evento/${id}/${t}`, { replace: true })} className="w-full">
              <div className="p-4 border-b bg-gray-50/50">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                  <TabsTrigger value="detalles">Detalles del Evento</TabsTrigger>
                  <TabsTrigger value="diseño" disabled={isNewEvent}>Diseño del Formulario</TabsTrigger>
                  <TabsTrigger value="inscripciones" disabled={isNewEvent}>
                    Manejador de Inscripciones {!isNewEvent && <span className="ml-2 bg-purple-100 text-purple-700 py-0.5 px-2 rounded-full text-xs">{attendees.length}</span>}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Detalles del Evento */}
              <TabsContent value="detalles" className="p-6 m-0 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* ... Información Básica ... */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Calendar className="text-purple-600" size={20} /> Información del Evento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nombre del Evento *</Label><input name="nombreES" type="text" value={formData.nombreES} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
                      <div className="space-y-2"><Label>Nombre Alternativo</Label><input name="nombreEN" type="text" value={formData.nombreEN} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                      <div className="space-y-2"><Label>Fecha *</Label><input name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
                      <div className="space-y-2"><Label>Hora Inicio *</Label><input name="horaInicio" type="time" value={formData.horaInicio} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
                      <div className="space-y-2"><Label>Hora Final *</Label><input name="horaFinal" type="time" value={formData.horaFinal} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
                      <div className="space-y-2"><Label>Valor</Label><input name="valor" type="text" value={formData.valor} onChange={handleInputChange} placeholder="Ej: $50,000 o Gratis" className="w-full p-2 border rounded-md" /></div>
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Servicios Requeridos</h3>
                    <div className="space-y-4">
                      {/* Alimentos */}
                      <div className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={servicios.alimentos.activo} onCheckedChange={() => handleServicioToggle("alimentos")} />
                          <Label className="font-medium cursor-pointer">🍽️ Alimentos</Label>
                        </div>
                        {servicios.alimentos.activo && (<textarea value={servicios.alimentos.descripcion} onChange={(e) => handleServicioDescripcionChange("alimentos", e.target.value)} className="w-full p-2 border rounded-md text-sm" rows="1" />)}
                      </div>
                      {/* Otros servicios */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 flex items-center space-x-2"><Checkbox checked={servicios.mesas.activo} onCheckedChange={() => handleServicioToggle("mesas")} /><Label>Mesas</Label></div>
                        <div className="border rounded-lg p-4 flex items-center space-x-2"><Checkbox checked={servicios.audioVisual.activo} onCheckedChange={() => handleServicioToggle("audioVisual")} /><Label>Audio Visual</Label></div>
                        <div className="border rounded-lg p-4 flex items-center space-x-2"><Checkbox checked={servicios.otros.activo} onCheckedChange={() => handleServicioToggle("otros")} /><Label>Otros</Label></div>
                      </div>
                    </div>
                  </div>

                  {/* Detalles del Administrador / Auxiliares */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="text-blue-600" size={20} /> Información de Contacto / Extras
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nombre del Cliente</Label><input name="nombreCliente" type="text" value={formData.nombreCliente} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                      <div className="space-y-2"><Label>Email Cliente</Label><input name="emailCliente" type="email" value={formData.emailCliente} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                      <div className="space-y-2"><Label>Teléfono Cliente</Label><input name="telefonoCliente" type="tel" value={formData.telefonoCliente} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
                      <div className="space-y-2"><Label>Autores/Organizadores</Label><input name="autores" type="text" value={formData.autores} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>

                      <div className="space-y-2">
                        <Label>Imagen Banner del Evento</Label>
                        <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center bg-gray-50 relative">
                          {isUploadingBanner && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-md">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                          )}
                          {formData.bannerIMG ? (
                            <div className="relative w-full group">
                              <img src={formData.bannerIMG} alt="Banner" className="w-full h-32 object-cover rounded-md border" />
                              <button type="button" onClick={handleRemoveBanner} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition shadow-md">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="text-gray-400 mb-2" size={28} />
                              <Label className="cursor-pointer text-blue-600 hover:underline font-semibold text-sm">
                                <UploadCloud className="inline mr-1 mb-0.5" size={16} /> Subir Imagen
                                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                              </Label>
                              <span className="text-xs text-gray-400 mt-1">Soporta JPG, PNG (Max 10MB)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Link de Inscripción externo</Label>
                        <input name="linkInscripcion" type="url" value={formData.linkInscripcion} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                      </div>
                      <div className="space-y-2">
                        <Label>Número de Personas</Label>
                        <input name="numeroPersonas" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.numeroPersonas} onChange={handleInputChange} className="w-full p-2 border rounded-md" placeholder="Ej: 50" />
                      </div>
                      <div className="space-y-2"><Label>Descripción (Pública)</Label><textarea name="decripcion" value={formData.decripcion} onChange={handleInputChange} className="w-full p-2 border rounded-md" rows="2" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Información Adicional (infoAdicional)</Label>
                      <textarea name="infoAdicional" value={formData.infoAdicional} onChange={handleInputChange} className="w-full p-2 border rounded-md" rows="3" />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <Button type="submit" className="text-white flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 transition"><Save size={18} className="mr-2" />{isNewEvent ? "Crear Evento" : "Guardar Cambios"}</Button>
                  </div>
                </form>
              </TabsContent>

              {/* TAB 2: Diseño de Formulario */}
              {!isNewEvent && (
                <TabsContent value="diseño" className="p-6 m-0 bg-gray-50/50 min-h-[600px]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Generador (Izquierda) */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="text-purple-600" /> Constructor de Preguntas</h3>
                        <p className="text-sm text-gray-500 mb-6">Añade información extra que quieras pedir a los asistentes de este evento (Ej. Talla de Camiseta, Nivel de Inglés, Empresa).</p>

                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                          <div>
                            <Label>Título de la pregunta</Label>
                            <input type="text" value={newPregunta.label} onChange={(e) => setNewPregunta({ ...newPregunta, label: e.target.value })} className="w-full p-2 border rounded mt-1" placeholder="Ej. ¿Cuál es tu nivel de inglés?" />
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label>Tipo de Respuesta</Label>
                              <select value={newPregunta.tipo} onChange={(e) => setNewPregunta({ ...newPregunta, tipo: e.target.value })} className="w-full p-2 border rounded mt-1 bg-white">
                                <option value="texto">Texto Corto</option>
                                <option value="parrafo">Párrafo (Largo)</option>
                                <option value="numero">Número</option>
                              </select>
                            </div>
                            <div className="flex items-end pb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox checked={newPregunta.requerido} onCheckedChange={(checked) => setNewPregunta({ ...newPregunta, requerido: checked })} />
                                <span className="text-sm font-medium">Obligatorio</span>
                              </label>
                            </div>
                          </div>
                          <Button onClick={handleAddPregunta} className="w-full bg-gray-900 text-white hover:bg-gray-800"><Plus size={16} className="mr-2" /> Agregar al formulario</Button>
                        </div>
                      </div>

                      {/* Lista de Preguntas */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700">Tus preguntas configuradas:</h4>
                        {preguntas.length === 0 ? (
                          <div className="text-sm text-gray-500 text-center py-6 border-2 border-dashed rounded-lg">No hay preguntas adicionales añadidas.</div>
                        ) : (
                          preguntas.map((p, idx) => (
                            <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center bg-gray-100 text-gray-500 rounded-full h-6 w-6 text-xs font-bold">{idx + 1}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{p.label}</p>
                                  <p className="text-xs text-gray-500 capitalize">{p.tipo} • {p.requerido ? 'Obligatorio' : 'Opcional'}</p>
                                </div>
                              </div>
                              <button onClick={() => handleRemovePregunta(p.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                            </div>
                          ))
                        )}
                      </div>
                      {(preguntas.length > 0 || evento) && (
                        <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-4">Guardar Diseño del Formulario</Button>
                      )}
                    </div>

                    {/* Previsualización (Derecha) */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative">
                      <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl flex items-center">
                        <span className="animate-pulse h-2 w-2 bg-blue-600 rounded-full mr-2"></span> PREVIEW EN VIVO
                      </div>
                      <h2 className="text-2xl font-bold mb-6 text-[#ff6600]">Formulario de {evento?.nombreES}</h2>
                      <div className="space-y-5 opacity-70 pointer-events-none">
                        <div><Label>Nombre Completo *</Label><input className="w-full p-2 border rounded-md" disabled placeholder="Datos Fijos..." /></div>
                        <div><Label>Celular / E-mail *</Label><input className="w-full p-2 border rounded-md" disabled /></div>
                        {servicios.alimentos?.activo && (
                          <div className="bg-green-50 p-3 rounded border border-green-100"><Label className="text-green-800">Dieta Especial / Vegana</Label><input className="w-full p-2 border rounded-md" disabled placeholder="Solo aparece porque hay Alimentos activos" /></div>
                        )}
                        <hr />
                        {preguntas.length > 0 && <h3 className="font-semibold text-gray-800">Preguntas del Evento</h3>}
                        {preguntas.map(p => (
                          <div key={p.id}>
                            <Label>{p.label} {p.requerido && '*'}</Label>
                            {p.tipo === 'parrafo' ? <textarea className="w-full p-2 border rounded-md" disabled /> : <input type={p.tipo === 'numero' ? 'number' : 'text'} className="w-full p-2 border rounded-md" disabled />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB 3: Manejador de Inscripciones */}
              {!isNewEvent && (
                <TabsContent value="inscripciones" className="p-6 m-0">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold">Asistentes Inscritos</h3>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">Total: {attendees.length}</div>
                      </div>
                      <Button type="button" onClick={copyInscriptionLink} className="flex items-center gap-2 text-sm bg-[#ff6600] text-white hover:bg-[#e65c00] transition shadow-md px-5 py-2 rounded-xl font-semibold">
                        {copiedLink ? <CheckCircle2 size={18} /> : <Copy size={18} />} {copiedLink ? "¡Copiado!" : "Copiar Enlace Público"}
                      </Button>
                    </div>

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
                                        {a.telefono && <span className="text-gray-500 text-xs">{a.telefono}</span>}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    {/* Mostrar respuestas dinámicas y dietas extra */}
                                    <div className="space-y-1">
                                      {a.dieta_especial && <div className="text-xs text-amber-600"><span className="font-bold">Dieta:</span> {a.dieta_especial}</div>}
                                      {a.respuestas_personalizadas && Object.entries(a.respuestas_personalizadas).map(([qId, ans]) => {
                                        const originalQ = preguntas.find(p => p.id === qId);
                                        return originalQ ? <div key={qId} className="text-xs text-gray-700"><span className="font-bold">{originalQ.label}:</span> {ans}</div> : null;
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <div className="flex justify-center items-center h-full pt-1">
                                      {a.estado_pago === 'gratis' ? <span className="bg-gray-200 px-2 py-1 rounded text-xs font-medium">Gratis</span> : (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <Checkbox checked={a.estado_pago === 'pagado'} onCheckedChange={(checked) => updatePaymentStatus(a.id, checked)} />
                                          <span className={`text-xs font-semibold ${a.estado_pago === 'pagado' ? 'text-green-600' : 'text-amber-600'}`}>{a.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}</span>
                                        </label>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center align-top">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-2 pt-1">
                                        <Button size="sm" onClick={() => saveEditAttendee(a.id)} className="bg-green-600 h-7 w-7 p-0"><CheckCircle size={14} /></Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingAttendeeId(null)} className="h-7 w-7 p-0"><X size={14} /></Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2 pt-1">
                                        <button title="Editar" onClick={() => startEditAttendee(a)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                                        <button title="Eliminar" onClick={() => deleteAttendee(a.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default AgendaModal;
