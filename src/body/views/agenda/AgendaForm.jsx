import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { crearItem, updateItem, getAllFromTable } from "@/redux/actions";
import { AGENDA, ALIADOS } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, X, Users, Plus, Trash2, FileText, UploadCloud, Save, Info, Clock, DollarSign, Edit3, Image as ImageIcon2 } from "lucide-react";
import supabase from "@/config/supabaseClient";

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-2 border-b pb-3 mb-4">
      {Icon && <Icon className="text-purple-600" size={20} />}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

function AgendaForm({ eventoToEdit = null, onClose = null }) {
  const dispatch = useDispatch();
  const allAliados = useSelector((state) => state.allAliados) || [];

  // Dynamic Form Builder State
  const [preguntas, setPreguntas] = useState([]);
  const [newPregunta, setNewPregunta] = useState({ label: '', tipo: 'texto', requerido: false });

  // Image Upload State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Instagram Aliados State
  const [tempIG, setTempIG] = useState("");

  // Estado principal del formulario
  const [formData, setFormData] = useState({
    nombreES: "",
    nombreEN: "",
    fecha: "",
    horaInicio: "",
    horaFinal: "",
    bannerIMG: "",
    linkInscripcion: "",
    infoAdicional: "",
    valor: "",
    autores: "",
    nombreCliente: "",
    emailCliente: "",
    telefonoCliente: "",
    numeroPersonas: 1,
    instagramsAliados: [],
    decripcion: "",
    estado: "pendiente",
    aliado_id: "",
  });

  // Estado para servicios
  const [servicios, setServicios] = useState({
    alimentos: { activo: false, descripcion: "" },
    mesas: { activo: false, descripcion: "" },
    audioVisual: { activo: false, descripcion: "" },
    otros: { activo: false, descripcion: "" },
  });

  useEffect(() => {
    dispatch(getAllFromTable(ALIADOS));
  }, [dispatch]);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (eventoToEdit) {
      setPreguntas(eventoToEdit.preguntas_personalizadas || []);
      setFormData({
        nombreES: eventoToEdit.nombreES || "",
        nombreEN: eventoToEdit.nombreEN || "",
        fecha: eventoToEdit.fecha || "",
        horaInicio: eventoToEdit.horaInicio || "",
        horaFinal: eventoToEdit.horaFinal || "",
        bannerIMG: eventoToEdit.bannerIMG || "",
        linkInscripcion: eventoToEdit.linkInscripcion || "",
        infoAdicional: eventoToEdit.infoAdicional || "",
        valor: eventoToEdit.valor || "",
        autores: eventoToEdit.autores || "",
        nombreCliente: eventoToEdit.nombreCliente || "",
        emailCliente: eventoToEdit.emailCliente || "",
        telefonoCliente: eventoToEdit.telefonoCliente || "",
        numeroPersonas: eventoToEdit.numeroPersonas || 1,
        decripcion: eventoToEdit.decripcion || eventoToEdit.descripcion || "",
        instagramsAliados: Array.isArray(eventoToEdit.instagramsAliados) ? eventoToEdit.instagramsAliados : (eventoToEdit.instagramsAliados ? [eventoToEdit.instagramsAliados] : []),
        estado: eventoToEdit.estado || "pendiente",
        aliado_id: eventoToEdit.aliado_id || "",
      });

      if (eventoToEdit.servicios) {
        try {
          const serviciosParsed =
            typeof eventoToEdit.servicios === "string"
              ? JSON.parse(eventoToEdit.servicios)
              : eventoToEdit.servicios;
          
          if (Array.isArray(serviciosParsed)) {
             const obj = { alimentos: { activo: false, descripcion: "" }, mesas: { activo: false, descripcion: "" }, audioVisual: { activo: false, descripcion: "" }, otros: { activo: false, descripcion: "" } };
             serviciosParsed.forEach(s => {
               if (s.alimentos !== undefined) { obj.alimentos.activo = !!s.alimentos; obj.alimentos.descripcion = s.alimentosDescripcion || ""; }
               if (s.mesas !== undefined) { obj.mesas.activo = !!s.mesas; obj.mesas.descripcion = s.mesasDescription || ""; }
               if (s.audioVisual !== undefined) { obj.audioVisual.activo = !!s.audioVisual; obj.audioVisual.descripcion = s.audioVisualDescription || ""; }
               if (s.otros !== undefined) { obj.otros.activo = !!s.otros; obj.otros.descripcion = s.otrosDescroptions || ""; }
             });
             setServicios(obj);
          } else {
            setServicios(serviciosParsed);
          }
        } catch (error) {
          console.error("Error al parsear servicios:", error);
        }
      }
    }
  }, [eventoToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "numeroPersonas") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      // Si es un nombre nuevo o no coincide, desvinculamos el ID
      setFormData((prev) => ({ ...prev, aliado_id: "" }));
    }
  };

  const handleServicioToggle = (servicioKey) => {
    setServicios((prev) => ({
      ...prev,
      [servicioKey]: {
        ...prev[servicioKey],
        activo: !prev[servicioKey].activo,
        descripcion: !prev[servicioKey].activo ? prev[servicioKey].descripcion : "",
      },
    }));
  };

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
      const uniqueName = `banner_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("Images_eventos").upload(uniqueName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("Images_eventos").getPublicUrl(uniqueName);
      setFormData(prev => ({ ...prev, bannerIMG: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Error subiendo imagen");
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

  const handleAddPregunta = () => {
    if (!newPregunta.label.trim()) return;
    setPreguntas([...preguntas, { ...newPregunta, id: Date.now().toString() }]);
    setNewPregunta({ label: '', tipo: 'texto', requerido: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombreES || !formData.fecha || !formData.horaInicio || !formData.horaFinal) {
      alert("Por favor completa los campos obligatorios"); return;
    }

    const buildServiciosForSupabase = (svc) => [
      { alimentos: !!svc.alimentos.activo, alimentosDescripcion: svc.alimentos.descripcion || "" },
      { mesas: !!svc.mesas.activo, mesasDescription: svc.mesas.descripcion || "" },
      { audioVisual: !!svc.audioVisual.activo, audioVisualDescription: svc.audioVisual.descripcion || "" },
      { otros: !!svc.otros.activo, otrosDescroptions: svc.otros.descripcion || "" },
    ];

    const eventoData = {
      ...formData,
      numeroPersonas: parseInt(formData.numeroPersonas) || 1,
      servicios: JSON.stringify(buildServiciosForSupabase(servicios)),
      preguntas_personalizadas: preguntas
    };

    try {
      if (eventoToEdit) {
        await dispatch(updateItem(eventoToEdit._id, eventoData, AGENDA));
        alert("Evento actualizado");
      } else {
        await dispatch(crearItem(eventoData, AGENDA));
        alert("Evento creado");
      }
      dispatch(getAllFromTable(AGENDA));
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  return (
    <div className="w-full bg-slate-50 p-4 md:p-6 rounded-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-6">
            
            <Section title="Datos Principales" icon={Edit3}>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-semibold">Nombre del Evento (ES) <span className="text-red-500">*</span></Label>
                  <input name="nombreES" type="text" value={formData.nombreES} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" required placeholder="Ej: Cata de Café Especial..." />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Estado del Evento</Label>
                  <select 
                    name="estado" 
                    value={formData.estado} 
                    onChange={handleInputChange} 
                    className={`mt-1 w-full p-2.5 border rounded-lg font-medium outline-none transition-colors ${
                      formData.estado === 'aprobado' ? 'bg-green-50 text-green-700 border-green-200' : 
                      formData.estado === 'desaprobado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    <option value="pendiente">Pendiente de Aprobación</option>
                    <option value="aprobado">Aprobado y Publicado</option>
                    <option value="desaprobado">Desaprobado / Cancelado</option>
                  </select>
                </div>
              </div>
            </Section>

            <Section title="Fecha y Horario" icon={Clock}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Label className="text-gray-700 font-semibold">Fecha del Evento <span className="text-red-500">*</span></Label>
                  <input name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" required />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Hora Inicio <span className="text-red-500">*</span></Label>
                  <input name="horaInicio" type="time" value={formData.horaInicio} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" required />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Hora Fin <span className="text-red-500">*</span></Label>
                  <input name="horaFinal" type="time" value={formData.horaFinal} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" required />
                </div>
              </div>
            </Section>

            <Section title="Detalles de Asistencia" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-semibold">Valor / Precio</Label>
                  <input name="valor" type="text" value={formData.valor} onChange={handleInputChange} placeholder="Ej: $50.000 o Gratis" className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Capacidad (Personas)</Label>
                  <input name="numeroPersonas" type="text" value={formData.numeroPersonas} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" />
                </div>
              </div>
            </Section>

          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">

            <Section title="Banner / Imagen Destacada" icon={ImageIcon2}>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative min-h-[180px]">
                {isUploadingBanner ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    <span className="text-sm text-gray-500">Subiendo imagen...</span>
                  </div>
                ) : formData.bannerIMG ? (
                    <div className="relative w-full group">
                      <img src={formData.bannerIMG} className="w-full h-40 object-cover rounded-lg shadow-sm" alt="Banner" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                         <button type="button" onClick={() => setFormData({...formData, bannerIMG: ""})} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-transform">
                           <Trash2 size={20} />
                         </button>
                      </div>
                    </div>
                  ) : (
                    <Label className="cursor-pointer text-purple-600 hover:text-purple-700 flex flex-col items-center gap-2">
                      <div className="bg-purple-100 p-4 rounded-full">
                        <UploadCloud size={28} />
                      </div>
                      <span className="text-sm font-medium">Haz clic para subir un banner</span>
                      <span className="text-xs text-gray-400">PNG, JPG, WEBP hasta 5MB</span>
                      <input type="file" className="hidden" onChange={handleBannerUpload} accept="image/*" />
                    </Label>
                  )
                }
              </div>
            </Section>

            <Section title="Organizador / Aliado" icon={Users}>
              <div className="space-y-4">
                
                <div className="relative">
                  <Label className="text-gray-700 font-semibold">Nombre del Organizador o Aliado</Label>
                  <input 
                    name="nombreCliente" 
                    type="text" 
                    value={formData.nombreCliente} 
                    onChange={handleNameChange} 
                    className={`mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow ${formData.aliado_id ? 'border-purple-400 bg-purple-50' : 'border-gray-300'}`} 
                    placeholder="Escribe para buscar un aliado o ingresa uno nuevo..."
                    list="aliados-list"
                  />
                  <datalist id="aliados-list">
                    {allAliados.map(a => (
                      <option key={a.id} value={a.nombre}>{a.categoria}</option>
                    ))}
                  </datalist>
                  {formData.aliado_id && <p className="text-xs text-purple-600 mt-1 font-medium">✓ Aliado de la base de datos vinculado automáticamente</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-semibold">Correo Electrónico</Label>
                    <input name="emailCliente" type="email" value={formData.emailCliente || ''} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold">Teléfono</Label>
                    <input name="telefonoCliente" type="text" value={formData.telefonoCliente || ''} onChange={handleInputChange} className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" />
                  </div>
                </div>

                <div className="pt-4 border-t mt-4">
                  <Label className="text-gray-700 font-semibold block mb-2">Cuentas de Instagram Asociadas</Label>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={tempIG} 
                      onChange={(e) => setTempIG(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInstagramHandle())} 
                      className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" 
                      placeholder="Ej: @cafereserva" 
                      list="instagrams-list"
                    />
                    <datalist id="instagrams-list">
                      {allAliados.filter(a => a.instagram).map(a => (
                        <option key={a.id} value={a.instagram.startsWith('@') ? a.instagram : `@${a.instagram}`}>
                          {a.nombre}
                        </option>
                      ))}
                    </datalist>
                    <Button type="button" onClick={addInstagramHandle} className="bg-purple-600 hover:bg-purple-700 h-[46px] px-4"><Plus size={18} className="mr-1"/> Añadir</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.instagramsAliados.length === 0 && <span className="text-sm text-gray-400 italic">No hay cuentas asociadas.</span>}
                    {formData.instagramsAliados.map(ig => (
                      <span key={ig} className="bg-pink-50 border border-pink-200 text-pink-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm">
                        {ig} <X size={14} className="cursor-pointer hover:text-pink-900" onClick={() => removeInstagramHandle(ig)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

          </div>
        </div>

        {/* FULL WIDTH SECTIONS */}
        <Section title="Servicios Requeridos para el Evento" icon={Info}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(servicios).map(key => (
              <label key={key} className={`flex items-center gap-3 border-2 p-4 rounded-xl cursor-pointer transition-all ${servicios[key].activo ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                <Checkbox checked={servicios[key].activo} onCheckedChange={() => handleServicioToggle(key)} className={servicios[key].activo ? 'text-purple-600' : ''} />
                <span className="text-sm font-semibold capitalize text-gray-700">{key}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Preguntas del Formulario de Inscripción" icon={FileText}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input type="text" value={newPregunta.label} onChange={(e) => setNewPregunta({...newPregunta, label: e.target.value})} className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="Escribe una nueva pregunta..." />
            <select value={newPregunta.tipo} onChange={(e) => setNewPregunta({...newPregunta, tipo: e.target.value})} className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow">
              <option value="texto">Respuesta de Texto</option>
              <option value="numero">Respuesta Numérica</option>
            </select>
            <Button type="button" onClick={handleAddPregunta} className="bg-orange-500 hover:bg-orange-600 text-white h-[46px] px-6"><Plus size={18} className="mr-1"/> Añadir Pregunta</Button>
          </div>
          
          <div className="space-y-3">
            {preguntas.length === 0 && <p className="text-sm text-gray-500 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">No hay preguntas personalizadas adicionales.</p>}
            {preguntas.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:border-orange-300 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="bg-orange-100 text-orange-700 font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">{i+1}</span>
                  <span className="font-semibold text-gray-700 text-sm md:text-base">{p.label}</span>
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md capitalize font-medium">{p.tipo}</span>
                </div>
                <button type="button" onClick={() => setPreguntas(preguntas.filter(x => x.id !== p.id))} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-4">
          <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 text-lg shadow-lg hover:shadow-xl transition-all rounded-xl">
            <Save className="mr-2" size={24} /> {eventoToEdit ? "Guardar Cambios" : "Publicar Evento"}
          </Button>
          {onClose && <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 text-lg font-medium border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</Button>}
        </div>
      </form>
    </div>
  );
}

export default AgendaForm;