import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { crearItem, updateItem, getAllFromTable } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, ArrowLeft, Save } from "lucide-react";
import supabase from "@/config/supabaseClient";
import PageLayout from "../../../components/ui/page-layout";

function AgendaModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isNewEvent = id === "new";
  const [loading, setLoading] = useState(!isNewEvent);
  const [evento, setEvento] = useState(null);

  // Estado principal del formulario
  const [formData, setFormData] = useState({
    fecha: "",
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
    nombreEN: "",
    telefonoCliente: "",
    decripcion: "",
    emailCliente: "",
    numeroPersonas: 1,
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
        const { data, error } = await supabase
          .from(AGENDA)
          .select("*")
          .eq("_id", id)
          .single();

        if (error) throw error;
        if (!data) {
          alert("Evento no encontrado");
          navigate("/Agenda");
          return;
        }

        setEvento(data);
        
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
        });

        const parseServiciosToState = (raw) => {
            // raw puede ser string, array o ya objeto
            let parsed = raw;
            if (!parsed) return null;
            try {
              if (typeof parsed === "string") parsed = JSON.parse(parsed);
            } catch (e) {
              console.warn("No se pudo parsear servicios desde string:", e);
            }

            // Si es un array con objetos como [{alimentos:true, alimentosDescripcion: "..."}, ...]
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

            // Si es un objeto con las mismas claves que usamos en estado (compatibilidad)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombreES || !formData.fecha || !formData.horaInicio || !formData.horaFinal) {
      alert("Por favor completa todos los campos obligatorios (nombreES, fecha y horarios)");
      return;
    }

    const buildServiciosForSupabase = (svc) => {
      // Convierte el estado de servicios a un array de objetos esperado por la tabla
      return [
        { alimentos: !!svc.alimentos.activo, alimentosDescripcion: svc.alimentos.descripcion || "" },
        { mesas: !!svc.mesas.activo, mesasDescription: svc.mesas.descripcion || "" },
        { audioVisual: !!svc.audioVisual.activo, audioVisualDescription: svc.audioVisual.descripcion || "" },
        { otros: !!svc.otros.activo, otrosDescroptions: svc.otros.descripcion || "" },
      ];
    };

    const eventoData = {
      // Campos que deben coincidir con la tabla de Supabase
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
      emailCliente: formData.emailCliente || "",
      servicios: JSON.stringify(buildServiciosForSupabase(servicios)),
      // Campos adicionales que la UI usa pero no necesariamente están en la tabla
      telefonoCliente: formData.telefonoCliente || "",
      numeroPersonas: parseInt(formData.numeroPersonas) || 1,
    };

    try {
      if (isNewEvent) {
        // Crear nuevo evento
        await dispatch(crearItem(eventoData, AGENDA));
        alert("Evento creado exitosamente");
      } else {
        // Actualizar evento existente
        await dispatch(updateItem(id, eventoData, AGENDA));
        alert("Evento actualizado exitosamente");
      }
      
      dispatch(getAllFromTable(AGENDA));
      navigate("/Agenda");
    } catch (error) {
      console.error("Error al guardar evento:", error);
      alert("Error al guardar el evento");
    }
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
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {isNewEvent ? "Crear Nuevo Evento" : `Editando: ${evento?.nombreES}`}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft size={24} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica del evento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="text-purple-600" size={20} />
                  Información del Evento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreES">Nombre del Evento *</Label>
                    <input
                      id="nombreES"
                      name="nombreES"
                      type="text"
                      value={formData.nombreES}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombreEN">Nombre Idioma Alternativo</Label>
                    <input
                      id="nombreEN"
                      name="nombreEN"
                      type="text"
                      value={formData.nombreEN}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora Inicio *</Label>
                    <input
                      id="horaInicio"
                      name="horaInicio"
                      type="time"
                      value={formData.horaInicio}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horaFinal">Hora Final *</Label>
                    <input
                      id="horaFinal"
                      name="horaFinal"
                      type="time"
                      value={formData.horaFinal}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroPersonas">Número de Personas</Label>
                    <input
                      id="numeroPersonas"
                      name="numeroPersonas"
                      type="number"
                      min="1"
                      value={formData.numeroPersonas}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <input
                      id="valor"
                      name="valor"
                      type="text"
                      value={formData.valor}
                      onChange={handleInputChange}
                      placeholder="Ej: $50,000 o Gratis"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="text-blue-600" size={20} />
                  Información de Contacto
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreCliente">Nombre del Cliente</Label>
                    <input
                      id="nombreCliente"
                      name="nombreCliente"
                      type="text"
                      value={formData.nombreCliente}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailCliente">Email</Label>
                    <input
                      id="emailCliente"
                      name="emailCliente"
                      type="email"
                      value={formData.emailCliente}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefonoCliente">Teléfono</Label>
                    <input
                      id="telefonoCliente"
                      name="telefonoCliente"
                      type="tel"
                      value={formData.telefonoCliente}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autores">Autores/Organizadores</Label>
                    <input
                      id="autores"
                      name="autores"
                      type="text"
                      value={formData.autores}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Servicios requeridos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Servicios Requeridos</h3>
                
                <div className="space-y-4">
                  {/* Alimentos */}
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alimentos"
                        checked={servicios.alimentos.activo}
                        onCheckedChange={() => handleServicioToggle("alimentos")}
                      />
                      <Label htmlFor="alimentos" className="font-medium cursor-pointer">
                        🍽️ Alimentos
                      </Label>
                    </div>
                    {servicios.alimentos.activo && (
                      <textarea
                        placeholder="¿Quieres desayuno completo o algo para picar? Describe tus necesidades..."
                        value={servicios.alimentos.descripcion}
                        onChange={(e) => handleServicioDescripcionChange("alimentos", e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        rows="2"
                      />
                    )}
                  </div>

                  {/* Mesas */}
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mesas"
                        checked={servicios.mesas.activo}
                        onCheckedChange={() => handleServicioToggle("mesas")}
                      />
                      <Label htmlFor="mesas" className="font-medium cursor-pointer">
                        🪑 Mesas y Sillas
                      </Label>
                    </div>
                    {servicios.mesas.activo && (
                      <textarea
                        placeholder="¿Cuántas mesas necesitas? ¿Dónde quieres ubicarte?"
                        value={servicios.mesas.descripcion}
                        onChange={(e) => handleServicioDescripcionChange("mesas", e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        rows="2"
                      />
                    )}
                  </div>

                  {/* Audio Visual */}
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="audioVisual"
                        checked={servicios.audioVisual.activo}
                        onCheckedChange={() => handleServicioToggle("audioVisual")}
                      />
                      <Label htmlFor="audioVisual" className="font-medium cursor-pointer">
                        📺 Audio Visual
                      </Label>
                    </div>
                    {servicios.audioVisual.activo && (
                      <textarea
                        placeholder="¿Necesitas televisión, sonido, proyector, micrófono?"
                        value={servicios.audioVisual.descripcion}
                        onChange={(e) => handleServicioDescripcionChange("audioVisual", e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        rows="2"
                      />
                    )}
                  </div>

                  {/* Otros */}
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="otros"
                        checked={servicios.otros.activo}
                        onCheckedChange={() => handleServicioToggle("otros")}
                      />
                      <Label htmlFor="otros" className="font-medium cursor-pointer">
                        ✨ Otros Servicios
                      </Label>
                    </div>
                    {servicios.otros.activo && (
                      <textarea
                        placeholder="A la orden, cuéntanos qué más necesitas..."
                        value={servicios.otros.descripcion}
                        onChange={(e) => handleServicioDescripcionChange("otros", e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        rows="2"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="decripcion">Descripción (decripcion)</Label>
                  <textarea
                    id="decripcion"
                    name="decripcion"
                    value={formData.decripcion}
                    onChange={handleInputChange}
                    placeholder="Descripción del evento..."
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerIMG">URL de Imagen Banner</Label>
                  <input
                    id="bannerIMG"
                    name="bannerIMG"
                    type="url"
                    value={formData.bannerIMG}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkInscripcion">Link de Inscripción</Label>
                  <input
                    id="linkInscripcion"
                    name="linkInscripcion"
                    type="url"
                    value={formData.linkInscripcion}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="infoAdicional">Información Adicional</Label>
                  <textarea
                    id="infoAdicional"
                    name="infoAdicional"
                    value={formData.infoAdicional}
                    onChange={handleInputChange}
                    placeholder="Cualquier detalle adicional sobre el evento..."
                    className="w-full p-2 border rounded-md"
                    rows="4"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4 border-t">
                <Button 
                  type="submit" 
                className="text-white flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700  hover:to-blue-700 hover:text-yellow-200 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Save size={18} />
                  {isNewEvent ? "Crear Evento" : "Guardar Cambios"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default AgendaModal;
