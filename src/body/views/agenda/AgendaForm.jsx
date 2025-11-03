import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { crearItem, updateItem } from "@/redux/actions";
import { AGENDA } from "@/redux/actions-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, X } from "lucide-react"; // Se eliminaron Users y Clock

function AgendaForm({ eventoToEdit = null, onClose = null }) {
  const dispatch = useDispatch();

  // Estado principal del formulario adaptado a Agenda_rows.csv
  const [formData, setFormData] = useState({
    nombreES: "", // Cambiado de 'nombre'
    nombreEN: "", // Añadido
    fecha: "",
    horaInicio: "",
    horaFinal: "",
    bannerIMG: "",
    linkInscripcion: "",
    infoAdicional: "", // Corresponde a la descripción en español
    valor: "",
    autores: "",
    // Campos eliminados: nombreCliente, emailCliente, telefonoCliente, numeroPersonas
  });

  // Estado para servicios (se mantiene igual)
  const [servicios, setServicios] = useState({
    alimentos: { activo: false, descripcion: "" },
    mesas: { activo: false, descripcion: "" },
    audioVisual: { activo: false, descripcion: "" },
    otros: { activo: false, descripcion: "" },
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (eventoToEdit) {
      setFormData({
        nombreES: eventoToEdit.nombreES || "", // Adaptado
        nombreEN: eventoToEdit.nombreEN || "", // Adaptado
        fecha: eventoToEdit.fecha || "",
        horaInicio: eventoToEdit.horaInicio || "",
        horaFinal: eventoToEdit.horaFinal || "",
        bannerIMG: eventoToEdit.bannerIMG || "",
        linkInscripcion: eventoToEdit.linkInscripcion || "",
        infoAdicional: eventoToEdit.infoAdicional || "",
        valor: eventoToEdit.valor || "",
        autores: eventoToEdit.autores || "",
        // Campos eliminados
      });

      // Cargar servicios si existen
      if (eventoToEdit.servicios) {
        try {
          const serviciosParsed =
            typeof eventoToEdit.servicios === "string"
              ? JSON.parse(eventoToEdit.servicios)
              : eventoToEdit.servicios;
          setServicios(serviciosParsed);
        } catch (error) {
          console.error("Error al parsear servicios:", error);
          // Inicializar servicios por defecto si hay error
          setServicios({
             alimentos: { activo: false, descripcion: "" },
             mesas: { activo: false, descripcion: "" },
             audioVisual: { activo: false, descripcion: "" },
             otros: { activo: false, descripcion: "" },
          });
        }
      }
    }
  }, [eventoToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServicioToggle = (servicioKey) => {
    setServicios((prev) => ({
      ...prev,
      [servicioKey]: {
        ...prev[servicioKey],
        activo: !prev[servicioKey].activo,
        descripcion: !prev[servicioKey].activo
          ? prev[servicioKey].descripcion
          : "",
      },
    }));
  };

  const handleServicioDescripcionChange = (servicioKey, value) => {
    setServicios((prev) => ({
      ...prev,
      [servicioKey]: {
        ...prev[servicioKey],
        descripcion: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (
      !formData.nombreES || // Adaptado
      !formData.fecha ||
      !formData.horaInicio ||
      !formData.horaFinal
    ) {
      alert(
        "Por favor completa todos los campos obligatorios (nombre, fecha y horarios)"
      );
      return;
    }

    const eventoData = {
      ...formData,
      servicios: JSON.stringify(servicios),
      // Se eliminó numeroPersonas
    };

    try {
      if (eventoToEdit) {
        // Actualizar evento existente
        await dispatch(updateItem(eventoToEdit._id, eventoData, AGENDA));
        alert("Evento actualizado exitosamente");
      } else {
        // Crear nuevo evento
        await dispatch(crearItem(eventoData, AGENDA));
        alert("Evento creado exitosamente");

        // Limpiar formulario
        setFormData({
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
        });
        setServicios({
          alimentos: { activo: false, descripcion: "" },
          mesas: { activo: false, descripcion: "" },
          audioVisual: { activo: false, descripcion: "" },
          otros: { activo: false, descripcion: "" },
        });
      }

      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      alert("Error al guardar el evento");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {eventoToEdit ? "Editar Evento" : "Solicitud de Evento"}
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X size={24} />
            </Button>
          )}
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
                <Label htmlFor="nombreES">Nombre del Evento (ES) *</Label>
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
                <Label htmlFor="nombreEN">Nombre del Evento (EN)</Label>
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

          {/* Sección de Información de Contacto eliminada */}

          {/* Servicios requeridos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Servicios Requeridos
            </h3>

            <div className="space-y-4">
              {/* Alimentos */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alimentos"
                    checked={servicios.alimentos.activo}
                    onCheckedChange={() => handleServicioToggle("alimentos")}
                  />
                  <Label
                    htmlFor="alimentos"
                    className="font-medium cursor-pointer"
                  >
                    🍽️ Alimentos
                  </Label>
                </div>
                {servicios.alimentos.activo && (
                  <textarea
                    placeholder="¿Quieres desayuno completo o algo para picar? Describe tus necesidades..."
                    value={servicios.alimentos.descripcion}
                    onChange={(e) =>
                      handleServicioDescripcionChange("alimentos", e.target.value)
                    }
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
                  <Label
                    htmlFor="mesas"
                    className="font-medium cursor-pointer"
                  >
                    🪑 Mesas y Sillas
                  </Label>
                </div>
                {servicios.mesas.activo && (
                  <textarea
                    placeholder="¿Cuántas mesas necesitas? ¿Dónde quieres ubicarte?"
                    value={servicios.mesas.descripcion}
                    onChange={(e) =>
                      handleServicioDescripcionChange("mesas", e.target.value)
                    }
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
                    onCheckedChange={() =>
                      handleServicioToggle("audioVisual")
                    }
                  />
                  <Label
                    htmlFor="audioVisual"
                    className="font-medium cursor-pointer"
                  >
                    📺 Audio Visual
                  </Label>
                </div>
                {servicios.audioVisual.activo && (
                  <textarea
                    placeholder="¿Necesitas televisión, sonido, proyector, micrófono?"
                    value={servicios.audioVisual.descripcion}
                    onChange={(e) =>
                      handleServicioDescripcionChange(
                        "audioVisual",
                        e.target.value
                      )
                    }
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
                  <Label
                    htmlFor="otros"
                    className="font-medium cursor-pointer"
                  >
                    ✨ Otros Servicios
                  </Label>
                </div>
                {servicios.otros.activo && (
                  <textarea
                    placeholder="A la orden, cuéntanos qué más necesitas..."
                    value={servicios.otros.descripcion}
                    onChange={(e) =>
                      handleServicioDescripcionChange("otros", e.target.value)
                    }
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
              <Label htmlFor="infoAdicional">Información Adicional (Descripción)</Label>
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
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {eventoToEdit ? "Actualizar Evento" : "Crear Evento"}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AgendaForm;