// =========================================================
// WIZARD ASISTIDO PARA GENERACIÓN CON IA Y PROMPTS
// Conexión con Eventos (Agenda), Aliados y Estéticas Canva/Adobe
// =========================================================

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  Layers,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  Code,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "../../../../config/supabaseClient";
import {
  FLYER_FORMATS,
  EVENT_TYPES,
  AESTHETIC_KITS,
  buildFlyerAiPrompt,
  parseAndValidateFlyerJson,
  generateSmartCopiesFromData
} from "./flyerAiPromptEngine";
import { STARTER_TEMPLATES } from "./FlyerTemplates";

export default function FlyerPromptWizardModal({
  isOpen,
  onClose,
  currentFormat = "9:16",
  onApplyFlyer = () => {}
}) {
  const [step, setStep] = useState(1); // 1: Formato | 2: Datos Evento | 3: Estética | 4: IA Prompt & JSON
  
  // Paso 1: Formato
  const [selectedFormat, setSelectedFormat] = useState(currentFormat);

  // Paso 2: Datos de Evento
  const [agendaEvents, setAgendaEvents] = useState([]);
  const [selectedAgendaId, setSelectedAgendaId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [eventType, setEventType] = useState("musica");
  const [participants, setParticipants] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("Proyecto Café");
  const [price, setPrice] = useState("Entrada Libre");
  const [socials, setSocials] = useState("@proyectocafe");
  const [registrationLink, setRegistrationLink] = useState("");
  const [allies, setAllies] = useState("Proyecto Café");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Paso 3: Estética
  const [selectedAesthetic, setSelectedAesthetic] = useState("vintage_editorial");

  // Paso 4: Prompt & JSON
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      setSelectedFormat(currentFormat);
      setStep(1);
      setValidationError("");
    }
  }, [isOpen, currentFormat]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("Agenda")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(30);

      if (!error && data) {
        setAgendaEvents(data);
      }
    } catch (err) {
      console.error("Error al cargar eventos de Agenda:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSelectAgendaEvent = (eventId) => {
    setSelectedAgendaId(eventId);
    const ev = agendaEvents.find((e) => String(e._id) === String(eventId));
    if (!ev) return;

    setTitle(ev.nombre || "");
    setDate(ev.fecha || "");
    setTime(ev.horaInicio ? `${ev.horaInicio} a ${ev.horaFinal || ''}` : "");
    setParticipants(ev.autores || ev.nombreCliente || "");
    setSubtitle(ev.infoAdicional ? ev.infoAdicional.substring(0, 100) : "");
    setPrice(ev.valor || "Entrada Libre");
    setRegistrationLink(ev.linkInscripcion || "");
    if (ev.bannerIMG) {
      setBackgroundImageUrl(ev.bannerIMG);
    }
  };

  // Generar el prompt al avanzar al paso 4
  useEffect(() => {
    if (step === 4) {
      const prompt = buildFlyerAiPrompt({
        formatId: selectedFormat,
        eventType,
        aestheticId: selectedAesthetic,
        title,
        subtitle,
        participants,
        date,
        time,
        venue,
        price,
        socials,
        registrationLink,
        allies,
        additionalNotes,
        backgroundImageUrl
      });
      setGeneratedPrompt(prompt);
    }
  }, [step, selectedFormat, eventType, selectedAesthetic, title, subtitle, participants, date, time, venue, price, socials, registrationLink, allies, additionalNotes, backgroundImageUrl]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleLoadInstantStarterTemplate = () => {
    // Buscar plantilla adecuada
    let templateKey = "story_vintage_music";
    if (selectedFormat === "1:1") templateKey = "post_warm_reading";
    else if (selectedFormat === "4:5") templateKey = "portrait_swiss_coffee";
    else if (selectedFormat === "16:9") templateKey = "banner_cyber_neon";
    else if (selectedFormat === "letter") templateKey = "letter_retro_brunch";

    const starter = STARTER_TEMPLATES[templateKey] || STARTER_TEMPLATES["story_vintage_music"];

    // Adaptar con datos del formulario si existen
    const adaptedElements = starter.elements.map((el) => {
      if (el.id.includes("title") && title) return { ...el, text: title.toUpperCase() };
      if (el.id.includes("sub") && subtitle) return { ...el, text: subtitle };
      if (el.id.includes("price") && price) return { ...el, text: price };
      return el;
    });

    const smartCopies = generateSmartCopiesFromData({
      title: title || starter.name,
      subtitle: subtitle || "Evento Especial",
      date: date || "Próximo Fin de Semana",
      time: time || "7:00 PM",
      venue,
      price,
      participants,
      socials,
      link: registrationLink || "https://proyectocafe.com"
    });

    onApplyFlyer({
      canvas: {
        ...starter.canvas,
        format: selectedFormat,
        width: FLYER_FORMATS[selectedFormat]?.width || 1080,
        height: FLYER_FORMATS[selectedFormat]?.height || 1920,
        backgroundImageUrl: backgroundImageUrl || starter.canvas.backgroundImageUrl
      },
      elements: adaptedElements,
      copies: smartCopies
    });

    onClose();
  };

  const handleApplyJson = () => {
    setValidationError("");
    try {
      const parsedData = parseAndValidateFlyerJson(jsonInput);
      
      // Si la IA no devolvió copys o están vacíos, generamos copys inteligentes de respaldo
      if (!parsedData.copies || !parsedData.copies.instagram_post) {
        parsedData.copies = generateSmartCopiesFromData({
          title,
          subtitle,
          date,
          time,
          venue,
          price,
          participants,
          socials,
          link: registrationLink
        });
      }

      onApplyFlyer(parsedData);
      onClose();
    } catch (err) {
      setValidationError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[#fcf8f2] border-4 border-black rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-yellow-300 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-yellow-300 rounded-lg border-2 border-black flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-wide text-black">
                Asistente de Creación de Flyers con IA
              </h2>
              <p className="text-xs font-bold text-black/80">
                Paso {step} de 4: {step === 1 ? "Selecciona el Formato" : step === 2 ? "Información del Evento" : step === 3 ? "Estética & Estilo Visual" : "Prompt IA & Carga de Flyer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-400 hover:bg-red-500 border-2 border-black rounded-md flex items-center justify-center font-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 bg-zinc-200 border-b-2 border-black text-xs font-black uppercase tracking-wider">
          <div className={`p-2.5 text-center border-r-2 border-black ${step === 1 ? "bg-white text-black" : "text-zinc-500"}`}>
            1. Formato
          </div>
          <div className={`p-2.5 text-center border-r-2 border-black ${step === 2 ? "bg-white text-black" : "text-zinc-500"}`}>
            2. Evento
          </div>
          <div className={`p-2.5 text-center border-r-2 border-black ${step === 3 ? "bg-white text-black" : "text-zinc-500"}`}>
            3. Estética
          </div>
          <div className={`p-2.5 text-center ${step === 4 ? "bg-white text-black" : "text-zinc-500"}`}>
            4. Prompt & IA
          </div>
        </div>

        {/* Step Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-[#faf7f2]">
          
          {/* PASO 1: Formato */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-black text-sm uppercase italic text-zinc-800">
                Elige el tamaño y destino de tu flyer:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(FLYER_FORMATS).map((f) => {
                  const isSelected = selectedFormat === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`p-4 border-3 border-black rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{f.icon}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/10">
                            {f.category}
                          </span>
                        </div>
                        <h4 className="font-black text-sm uppercase text-black mb-1">
                          {f.name}
                        </h4>
                        <p className="text-xs font-bold text-zinc-600 mb-2">
                          {f.description}
                        </p>
                      </div>
                      <div className="font-mono text-[11px] font-bold text-zinc-500">
                        {f.width} × {f.height} px ({f.id})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2: Datos del Evento */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Importar desde Agenda de Proyecto Café */}
              <div className="p-3 bg-yellow-200 border-2 border-black rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-black shrink-0" />
                  <div>
                    <span className="font-black text-xs uppercase block text-black">
                      Importar Evento Existente del Calendario:
                    </span>
                    <span className="text-[11px] font-bold text-zinc-700">
                      Autocompleta título, fechas, participantes y foto
                    </span>
                  </div>
                </div>
                <select
                  value={selectedAgendaId}
                  onChange={(e) => handleSelectAgendaEvent(e.target.value)}
                  className="w-full sm:w-64 h-9 px-2 border-2 border-black rounded font-bold text-xs bg-white cursor-pointer"
                >
                  <option value="">-- Seleccionar de Agenda --</option>
                  {agendaEvents.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.fecha} · {ev.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Formulario de Datos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Título Principal del Evento *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Noche de Jazz & Café de Origen"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Tipo / Categoría de Evento
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full h-9 px-2 border-2 border-black rounded font-bold text-xs bg-white cursor-pointer"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.icon} {et.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Subtítulo / Frase Gancho
                  </label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ej. Una velada acústica íntima entre tazas y notas musicales"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Artistas / Ponentes / Invitados
                  </label>
                  <Input
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="Ej. Trío Melao, Barista Juan Gómez"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Fecha y Hora
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="Ej. Viernes 24 Oct"
                      className="border-2 border-black font-bold text-xs bg-white h-9 flex-1"
                    />
                    <Input
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="Ej. 7:00 PM"
                      className="border-2 border-black font-bold text-xs bg-white h-9 w-28"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Costo / Cover / Entrada
                  </label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej. Entrada Libre · Consumo Mínimo"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Lugar / Cafetería
                  </label>
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ej. Proyecto Café Central"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Redes Sociales & Contacto
                  </label>
                  <Input
                    value={socials}
                    onChange={(e) => setSocials(e.target.value)}
                    placeholder="@proyectocafe"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    Aliados / Patrocinadores
                  </label>
                  <Input
                    value={allies}
                    onChange={(e) => setAllies(e.target.value)}
                    placeholder="Ej. Proyecto Café · Alianza Cultural"
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-black uppercase text-zinc-800 block mb-1">
                    URL de Foto de Fondo (Opcional)
                  </label>
                  <Input
                    value={backgroundImageUrl}
                    onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="border-2 border-black font-bold text-xs bg-white h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Estética y Colores */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-black text-sm uppercase italic text-zinc-800">
                Selecciona la Identidad Visual & Paquete Estético:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AESTHETIC_KITS.map((ak) => {
                  const isSelected = selectedAesthetic === ak.id;
                  return (
                    <div
                      key={ak.id}
                      onClick={() => setSelectedAesthetic(ak.id)}
                      className={`p-4 border-3 border-black rounded-lg cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{ak.icon}</span>
                          <h4 className="font-black text-sm uppercase text-black">
                            {ak.name}
                          </h4>
                        </div>
                        <p className="text-xs font-bold text-zinc-600 mb-3">
                          {ak.description}
                        </p>
                      </div>

                      {/* Color Palette Preview Pills */}
                      <div className="flex items-center gap-1.5 p-2 bg-black/5 rounded border border-black/20">
                        <span className="text-[10px] font-black uppercase text-zinc-600 mr-1">
                          Paleta:
                        </span>
                        <div
                          className="w-5 h-5 rounded-full border border-black shadow-xs"
                          style={{ backgroundColor: ak.colors.background }}
                          title="Fondo"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black shadow-xs"
                          style={{ backgroundColor: ak.colors.accent }}
                          title="Acento"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black shadow-xs"
                          style={{ backgroundColor: ak.colors.badgeBg }}
                          title="Insignia"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black shadow-xs"
                          style={{ backgroundColor: ak.colors.textPrimary }}
                          title="Texto"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4: Prompt IA & JSON Importer */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              
              {/* Opción Rápida: Plantilla Instantánea */}
              <div className="p-4 bg-green-100 border-3 border-black rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2.5">
                  <Zap size={22} className="text-black" />
                  <div>
                    <h4 className="font-black text-xs uppercase text-black">
                      ¿Quieres el flyer de inmediato sin esperar a una IA externa?
                    </h4>
                    <p className="text-[11px] font-bold text-zinc-700">
                      Carga la plantilla profesional preconfigurada con tus datos en 1 solo clic.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleLoadInstantStarterTemplate}
                  className="bg-green-400 hover:bg-green-500 text-black font-black uppercase text-xs h-9 px-4 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] shrink-0"
                >
                  ⚡ Cargar Flyer Instantáneo
                </Button>
              </div>

              {/* Bloque Prompt para IA */}
              <div className="border-2 border-black rounded-lg overflow-hidden bg-white">
                <div className="p-3 bg-zinc-100 border-b-2 border-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code size={16} />
                    <span className="font-black text-xs uppercase text-black">
                      Prompt Generado para ChatGPT / Gemini / Claude:
                    </span>
                  </div>
                  <Button
                    onClick={handleCopyPrompt}
                    className={`h-7 px-3 text-[10px] font-black uppercase border-2 border-black rounded ${
                      copiedPrompt ? "bg-green-400 text-black" : "bg-yellow-300 hover:bg-yellow-400 text-black"
                    }`}
                  >
                    {copiedPrompt ? (
                      <>
                        <Check size={12} className="mr-1" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="mr-1" />
                        Copiar Prompt
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  value={generatedPrompt}
                  readOnly
                  rows={6}
                  className="w-full p-3 font-mono text-[11px] text-zinc-700 bg-zinc-50 focus:outline-none resize-none"
                />
              </div>

              {/* Bloque Importar JSON devuelto por la IA */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-zinc-800">
                  Pega aquí el JSON devuelto por la IA:
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setValidationError("");
                  }}
                  placeholder='{"canvas": { ... }, "elements": [ ... ], "copies": { ... }}'
                  rows={8}
                  className="w-full p-3 font-mono text-xs border-2 border-black rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
                />

                {validationError && (
                  <div className="p-3 bg-red-100 border-2 border-red-500 rounded-lg flex items-center gap-2 text-xs font-bold text-red-700">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 bg-zinc-100 border-t-4 border-black flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                className="bg-white hover:bg-zinc-200 text-black border-2 border-black font-black uppercase text-xs h-9 px-4 flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Anterior</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs h-9 px-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
              >
                <span>Siguiente</span>
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                onClick={handleApplyJson}
                disabled={!jsonInput.trim()}
                className="bg-green-400 hover:bg-green-500 text-black border-2 border-black font-black uppercase text-xs h-9 px-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-2"
              >
                <Sparkles size={16} />
                <span>⚡ Aplicar Flyer al Lienzo</span>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
