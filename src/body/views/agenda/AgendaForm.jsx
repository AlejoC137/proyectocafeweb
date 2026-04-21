import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { crearItem, updateItem, getAllFromTable } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, X, Users, Plus, Trash2, FileText, ImageIcon, UploadCloud, Save } from "lucide-react";
import supabase from "@/config/supabaseClient";

function AgendaForm({ eventoToEdit = null, onClose = null }) {
  const dispatch = useDispatch();

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

  const handleServicioDescripcionChange = (servicioKey, value) => {
    setServicios((prev) => ({
      ...prev,
      [servicioKey]: { ...prev[servicioKey], descripcion: value },
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
    <Card className="w-full shadow-none border-none">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Calendar className="text-purple-600" size={20} /> Datos del Evento</h3>
            <div className="space-y-3">
              <div><Label>Nombre ES *</Label><input name="nombreES" type="text" value={formData.nombreES} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Fecha *</Label><input name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
                <div><Label>Personas</Label><input name="numeroPersonas" type="text" value={formData.numeroPersonas} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Inicio *</Label><input name="horaInicio" type="time" value={formData.horaInicio} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
                <div><Label>Fin *</Label><input name="horaFinal" type="time" value={formData.horaFinal} onChange={handleInputChange} className="w-full p-2 border rounded-md" required /></div>
              </div>
              <div><Label>Valor / Precio</Label><input name="valor" type="text" value={formData.valor} onChange={handleInputChange} placeholder="Ej: $50.000 o Gratis" className="w-full p-2 border rounded-md" /></div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 pt-2"><Users className="text-blue-600" size={20} /> Aliado / Organizador</h3>
            <div className="space-y-3">
              <div><Label>Nombre Aliado</Label><input name="nombreCliente" type="text" value={formData.nombreCliente} onChange={handleInputChange} className="w-full p-2 border rounded-md" /></div>
              <div className="flex gap-2">
                <input type="text" value={tempIG} onChange={(e) => setTempIG(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInstagramHandle())} className="flex-1 p-2 border rounded-md" placeholder="@instagram" />
                <Button type="button" onClick={addInstagramHandle} variant="outline" size="icon"><Plus size={18} /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.instagramsAliados.map(ig => (
                  <span key={ig} className="bg-pink-50 text-pink-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {ig} <X size={12} className="cursor-pointer" onClick={() => removeInstagramHandle(ig)} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Configuración y Banner */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><ImageIcon className="text-purple-600" size={20} /> Imagen y Diseño</h3>
            <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center bg-gray-50 relative min-h-[120px]">
              {isUploadingBanner ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" /> : 
                formData.bannerIMG ? (
                  <div className="relative w-full">
                    <img src={formData.bannerIMG} className="w-full h-24 object-cover rounded" alt="Banner" />
                    <button type="button" onClick={() => setFormData({...formData, bannerIMG: ""})} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"><Trash2 size={12} /></button>
                  </div>
                ) : (
                  <Label className="cursor-pointer text-blue-600 flex flex-col items-center">
                    <UploadCloud size={24} /> <span className="text-xs">Subir Banner</span>
                    <input type="file" className="hidden" onChange={handleBannerUpload} />
                  </Label>
                )
              }
            </div>

            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 pt-2"><FileText className="text-orange-600" size={20} /> Preguntas Formulario</h3>
            <div className="bg-gray-50 p-3 rounded border space-y-3">
              <input type="text" value={newPregunta.label} onChange={(e) => setNewPregunta({...newPregunta, label: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Nueva pregunta..." />
              <div className="flex gap-2">
                <select value={newPregunta.tipo} onChange={(e) => setNewPregunta({...newPregunta, tipo: e.target.value})} className="flex-1 p-1 border rounded text-xs">
                  <option value="texto">Texto</option>
                  <option value="numero">Número</option>
                </select>
                <Button type="button" onClick={handleAddPregunta} size="sm">Añadir</Button>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {preguntas.map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-xs bg-white p-1 px-2 border rounded">
                    <span>{i+1}. {p.label}</span>
                    <X size={12} className="text-red-400 cursor-pointer" onClick={() => setPreguntas(preguntas.filter(x => x.id !== p.id))} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="space-y-3">
          <Label className="text-base font-bold">Servicios Requeridos</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(servicios).map(key => (
              <div key={key} className="flex items-center gap-2 border p-2 rounded">
                <Checkbox checked={servicios[key].activo} onCheckedChange={() => handleServicioToggle(key)} />
                <span className="text-xs capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold h-12">
            <Save className="mr-2" /> {eventoToEdit ? "Actualizar Evento" : "Crear Evento"}
          </Button>
          {onClose && <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">Cancelar</Button>}
        </div>
      </form>
    </Card>
  );
}

export default AgendaForm;