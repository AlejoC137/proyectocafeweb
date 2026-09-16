// =========================================================
// MOTOR DE PROMPTS Y ESQUEMAS IA PARA FLYER STUDIO
// Genera prompts estructurados, valida y normaliza JSONs
// e integra kits de comunicación y copys multicanal.
// =========================================================

export const FLYER_FORMATS = {
  "9:16": {
    id: "9:16",
    name: "Historia / Reels / TikTok",
    category: "Móvil / Redes",
    width: 1080,
    height: 1920,
    aspectRatio: 9 / 16,
    icon: "📱",
    previewWidth: 360,
    previewHeight: 640,
    description: "Ideal para Instagram Stories, TikTok y estados móviles."
  },
  "1:1": {
    id: "1:1",
    name: "Post Cuadrado (Instagram/FB)",
    category: "Feed / Redes",
    width: 1080,
    height: 1080,
    aspectRatio: 1,
    icon: "⏹️",
    previewWidth: 460,
    previewHeight: 460,
    description: "Formato clásico para feed de Instagram, Twitter y Facebook."
  },
  "4:5": {
    id: "4:5",
    name: "Post Vertical Feed (Instagram)",
    category: "Feed / Redes",
    width: 1080,
    height: 1350,
    aspectRatio: 4 / 5,
    icon: "🖼️",
    previewWidth: 400,
    previewHeight: 500,
    description: "Máxima área visible en el feed de Instagram sin recortar."
  },
  "16:9": {
    id: "16:9",
    name: "Banner Web / Pantalla TV",
    category: "Web & Pantallas",
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    icon: "🖥️",
    previewWidth: 560,
    previewHeight: 315,
    description: "Para pantallas de cafetería, banners web y YouTube."
  },
  "letter": {
    id: "letter",
    name: "Flyer Físico Carta (Letter Print)",
    category: "Impresión Física",
    width: 1200,
    height: 1553,
    aspectRatio: 215.9 / 279.4,
    icon: "📄",
    previewWidth: 420,
    previewHeight: 544,
    printSize: "letter",
    description: "21.59 x 27.94 cm listo para imprimir en cafetería."
  }
};

export const EVENT_TYPES = [
  {
    id: "musica",
    name: "Concierto / Música en Vivo / DJ Set",
    icon: "🎵",
    vibe: "Enérgico, rítmico, acústico o underground",
    defaultBadge: "MÚSICA EN VIVO · ENTRADA LIBRE"
  },
  {
    id: "literatura",
    name: "Club de Lectura / Poesía / Tertulia",
    icon: "📚",
    vibe: "Íntimo, reflexivo, bohemio, literario y cafetero",
    defaultBadge: "CLUB DE LECTURA & CAFÉ"
  },
  {
    id: "barismo",
    name: "Cata de Café / Taller de Barismo",
    icon: "☕",
    vibe: "Especializado, sensorial, artesanal y educativo",
    defaultBadge: "EXPERIENCIA SENSORIAL · CATA"
  },
  {
    id: "social",
    name: "Evento Social / Comunitario / Sin Ánimo de Lucro",
    icon: "🤝",
    vibe: "Cálido, inclusivo, colaborativo y solidario",
    defaultBadge: "ENCUENTRO COMUNITARIO"
  },
  {
    id: "noche_cafe",
    name: "After Office / Noche de Café & Tragos",
    icon: "🍸",
    vibe: "Nocturno, sofisticado, relajado y festivo",
    defaultBadge: "SPECIAL NIGHT · 2X1 TRAGOS"
  },
  {
    id: "gastronomia",
    name: "Especial Gastronómico / Brunch",
    icon: "🥐",
    vibe: "Apetitoso, fresco, gourmet y acogedor",
    defaultBadge: "BRUNCH DE FIN DE SEMANA"
  }
];

export const AESTHETIC_KITS = [
  {
    id: "vintage_editorial",
    name: "Café Vintage & Editorial",
    icon: "📜",
    description: "Tipografías Serif elegantes, tonos café tostado, crema y sepia. Estilo revista clásica.",
    fonts: {
      title: "'Playfair Display', serif",
      subtitle: "'Montserrat', sans-serif",
      body: "'Space Grotesk', sans-serif"
    },
    colors: {
      background: "#1c140e",
      cardBg: "rgba(38, 28, 20, 0.85)",
      textPrimary: "#fcf8f2",
      textSecondary: "#d6c7b2",
      accent: "#c59b27",
      badgeBg: "#c59b27",
      badgeText: "#1c140e",
      borderColor: "#4a3525"
    }
  },
  {
    id: "cyber_neon",
    name: "Cyber Neon Underground",
    icon: "⚡",
    description: "Contrastes agresivos, fondo negro noche, acentos magenta/cian eléctrico y fuentes ultra-bold.",
    fonts: {
      title: "'Space Grotesk', sans-serif",
      subtitle: "'Space Grotesk', sans-serif",
      body: "'Space Grotesk', sans-serif"
    },
    colors: {
      background: "#0d0d12",
      cardBg: "rgba(22, 22, 32, 0.88)",
      textPrimary: "#ffffff",
      textSecondary: "#00f0ff",
      accent: "#ff007f",
      badgeBg: "#ff007f",
      badgeText: "#ffffff",
      borderColor: "#00f0ff"
    }
  },
  {
    id: "swiss_bauhaus",
    name: "Minimalista Suizo (Bauhaus)",
    icon: "📐",
    description: "Grilla asimétrica limpia, contrastes en negro, blanco roto y toques rojo carmín.",
    fonts: {
      title: "'Space Grotesk', sans-serif",
      subtitle: "'Montserrat', sans-serif",
      body: "'Space Grotesk', sans-serif"
    },
    colors: {
      background: "#f4f2ec",
      cardBg: "#ffffff",
      textPrimary: "#111111",
      textSecondary: "#555555",
      accent: "#d90429",
      badgeBg: "#111111",
      badgeText: "#f4f2ec",
      borderColor: "#111111"
    }
  },
  {
    id: "warm_organic",
    name: "Orgánico & Botánico Cálido",
    icon: "🌿",
    description: "Tonos tierra, verde salvia, terracota y bordes redondeados. Muy natural y cercano.",
    fonts: {
      title: "'Playfair Display', serif",
      subtitle: "'Montserrat', sans-serif",
      body: "'Space Grotesk', sans-serif"
    },
    colors: {
      background: "#283618",
      cardBg: "rgba(40, 54, 24, 0.85)",
      textPrimary: "#fefae0",
      textSecondary: "#dda15e",
      accent: "#bc6c25",
      badgeBg: "#dda15e",
      badgeText: "#283618",
      borderColor: "#606c38"
    }
  },
  {
    id: "modern_retro",
    name: "Modern Retro Groove",
    icon: "🎷",
    description: "Vibraciones cálidas de los 70s, amarillo mostaza, naranja tostado y tipografía funky.",
    fonts: {
      title: "'Lilita One', cursive",
      subtitle: "'Space Grotesk', sans-serif",
      body: "'Montserrat', sans-serif"
    },
    colors: {
      background: "#2b1c10",
      cardBg: "#3b2615",
      textPrimary: "#f9bc60",
      textSecondary: "#e16162",
      accent: "#004643",
      badgeBg: "#f9bc60",
      badgeText: "#2b1c10",
      borderColor: "#abd1c6"
    }
  }
];

export function buildFlyerAiPrompt({
  formatId = "9:16",
  eventType = "musica",
  aestheticId = "vintage_editorial",
  title = "",
  subtitle = "",
  participants = "",
  date = "",
  time = "",
  venue = "Proyecto Café",
  price = "Entrada Libre",
  socials = "@proyectocafe",
  registrationLink = "",
  allies = "",
  additionalNotes = "",
  backgroundImageUrl = ""
}) {
  const format = FLYER_FORMATS[formatId] || FLYER_FORMATS["9:16"];
  const event = EVENT_TYPES.find((e) => e.id === eventType) || EVENT_TYPES[0];
  const aesthetic = AESTHETIC_KITS.find((a) => a.id === aestheticId) || AESTHETIC_KITS[0];

  return `Actúa como un Diseñador Gráfico de Élite y Director de Arte estilo Canva Pro & Adobe Studio.
Tu misión es diseñar un Flyer Espectacular para el evento de cafetería cultural y redactar el paquete de copys y comunicación promocional multicanal.

==================================================
1. PARÁMETROS DEL LIENZO:
- Formato: ${format.name} (${format.id})
- Resolución nominal: ${format.width}px de ancho por ${format.height}px de alto.
- Tipo de Evento: ${event.name} (${event.vibe})
- Estética Visual Elegida: ${aesthetic.name} (${aesthetic.description})
- Paleta sugerida: Fondo principal: ${aesthetic.colors.background}, Acento: ${aesthetic.colors.accent}, Texto: ${aesthetic.colors.textPrimary}

==================================================
2. INFORMACIÓN DEL EVENTO:
- Título Principal: "${title || 'Noche Cultural Proyecto Café'}"
- Subtítulo / Frase gancho: "${subtitle || 'Una experiencia única entre granos y letras'}"
- Participantes / Artistas / Ponentes: "${participants || 'Artistas Invitados'}"
- Fecha: "${date || 'Viernes 24 de Octubre'}"
- Hora: "${time || '7:00 PM'}"
- Lugar / Cafetería: "${venue}"
- Costo / Cover: "${price}"
- Redes Sociales: "${socials}"
- Link de Inscripción: "${registrationLink || 'https://proyectocafe.com'}"
- Aliados / Patrocinadores: "${allies || 'Proyecto Café'}"
${backgroundImageUrl ? `- Imagen de Fondo Solicitada: "${backgroundImageUrl}"` : ''}
${additionalNotes ? `- Notas Especiales del Organizador: "${additionalNotes}"` : ''}

==================================================
3. REGLAS DE DISEÑO Y JERARQUÍA OBLIGATORIAS:
1. JERARQUÍA TIPOGRÁFICA CLARA:
   - El Título debe ser enorme y dominante (fontSize entre 56 y 90 dependiendo del texto).
   - El Badge superior (insignia de categoría) debe estar cerca del tope y centrado.
   - La Píldora de Fecha y Hora debe destacar con fondo de contraste o tipografía negrita legible.
   - El bloque de Participantes / Invitados debe estar bien organizado sin solaparse.
   - El Pie de página debe contener las Redes Sociales y Aliados.
2. COORDENADAS COHERENTES:
   - Todas las coordenadas x, y deben estar dentro de 0 a ${format.width} en horizontal y 0 a ${format.height} en vertical.
   - Centrado horizontal: Para textos centrados, usa x: ${Math.round(format.width / 2)} con style.textAlign: "center".
   - Distribuye verticalmente los elementos de arriba a abajo con suficiente espacio para respirar (padding).
3. ELEMENTOS VECTORIALES Y VISUALES:
   - Incluye badges con bordes redondeados y fondos elegantes.
   - Si aplica, incluye un bloque "qr_code" con el link de inscripción.

==================================================
4. COMUNICACIÓN Y COPYS MULTICANAL OBLIGATORIOS:
Debes redactar:
1. "instagram_post": Copy completo con gancho inicial, descripción atractiva, fecha/hora/lugar, llamado a la acción y 10-15 hashtags relevantes.
2. "instagram_story": Texto corto y directo (máx 3 frases) pensado para poner en sticker de texto o encuesta de Stories.
3. "whatsapp_message": Mensaje con formato de WhatsApp (negritas con *asteriscos*, emojis, viñetas y enlace directo listo para reenviar a listas o grupos).
4. "whatsapp_status": Texto ultra-corto de 1-2 líneas con gancho para el estado de WhatsApp.

==================================================
5. FORMATO DE SALIDA (DEVUELVE EXCLUSIVAMENTE EL SIGUIENTE JSON, SIN INTRODUCCIONES NI TEXTO ADICIONAL):

{
  "canvas": {
    "format": "${format.id}",
    "width": ${format.width},
    "height": ${format.height},
    "backgroundColor": "${aesthetic.colors.background}",
    "backgroundOverlay": "rgba(0,0,0,0.35)",
    "backgroundImageUrl": "${backgroundImageUrl || ''}",
    "aesthetic": "${aesthetic.id}"
  },
  "elements": [
    {
      "id": "badge_top",
      "type": "badge",
      "text": "${event.defaultBadge}",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.08)},
      "style": {
        "backgroundColor": "${aesthetic.colors.badgeBg}",
        "color": "${aesthetic.colors.badgeText}",
        "fontSize": 22,
        "fontWeight": "700",
        "borderRadius": 24,
        "paddingX": 28,
        "paddingY": 10,
        "letterSpacing": 2,
        "textTransform": "uppercase"
      }
    },
    {
      "id": "title_main",
      "type": "text",
      "text": "${title || 'TÍTULO DEL EVENTO'}",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.22)},
      "style": {
        "fontSize": 72,
        "fontFamily": "${aesthetic.fonts.title}",
        "fontWeight": "900",
        "color": "${aesthetic.colors.textPrimary}",
        "textAlign": "center",
        "maxWidth": ${Math.round(format.width * 0.9)},
        "textTransform": "uppercase",
        "lineHeight": 1.1
      }
    },
    {
      "id": "subtitle",
      "type": "text",
      "text": "${subtitle || 'Subtítulo o descripción envolvente'}",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.36)},
      "style": {
        "fontSize": 28,
        "fontFamily": "${aesthetic.fonts.subtitle}",
        "fontWeight": "500",
        "color": "${aesthetic.colors.textSecondary}",
        "textAlign": "center",
        "maxWidth": ${Math.round(format.width * 0.85)}
      }
    },
    {
      "id": "card_datetime",
      "type": "container",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.52)},
      "style": {
        "backgroundColor": "${aesthetic.colors.cardBg}",
        "borderColor": "${aesthetic.colors.borderColor}",
        "borderWidth": 2,
        "borderRadius": 16,
        "paddingX": 40,
        "paddingY": 20,
        "maxWidth": ${Math.round(format.width * 0.85)}
      },
      "badgeText": "FECHA & HORARIO",
      "primaryText": "${date || 'VIERNES 24 OCT'} · ${time || '7:00 PM'}",
      "secondaryText": "📍 ${venue}"
    },
    {
      "id": "participants_block",
      "type": "text",
      "text": "Invitados Especiales: ${participants || 'Por confirmar'}",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.68)},
      "style": {
        "fontSize": 26,
        "fontFamily": "${aesthetic.fonts.body}",
        "fontWeight": "600",
        "color": "${aesthetic.colors.textPrimary}",
        "textAlign": "center",
        "maxWidth": ${Math.round(format.width * 0.85)}
      }
    },
    {
      "id": "price_badge",
      "type": "badge",
      "text": "${price}",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.78)},
      "style": {
        "backgroundColor": "${aesthetic.colors.accent}",
        "color": "#ffffff",
        "fontSize": 24,
        "fontWeight": "800",
        "borderRadius": 12,
        "paddingX": 32,
        "paddingY": 12
      }
    },
    {
      "id": "footer_info",
      "type": "footer",
      "x": ${Math.round(format.width / 2)},
      "y": ${Math.round(format.height * 0.91)},
      "socials": "${socials}",
      "allies": "${allies || 'Proyecto Café'}",
      "style": {
        "color": "${aesthetic.colors.textSecondary}",
        "fontSize": 22,
        "textAlign": "center"
      }
    }
  ],
  "copies": {
    "instagram_post": "Escribe aquí el copy completo para el feed de Instagram...",
    "instagram_story": "Texto breve para historia de Instagram...",
    "whatsapp_message": "Mensaje completo de WhatsApp con *negritas* y viñetas...",
    "whatsapp_status": "Texto corto de 1 línea para estado de WhatsApp..."
  }
}`;
}

export function parseAndValidateFlyerJson(rawInput) {
  if (!rawInput || typeof rawInput !== "string") {
    throw new Error("El contenido ingresado está vacío.");
  }

  let cleaned = rawInput.trim();

  // Limpiar bloques markdown ```json ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    cleaned = cleaned.trim();
  }

  // Si hay texto antes o después del JSON, extraer entre el primer { y el último }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    try {
      const fixedCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
      parsed = JSON.parse(fixedCommas);
    } catch (err2) {
      throw new Error(`El JSON devuelto por la IA no tiene un formato válido: ${err.message}`);
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("El JSON no es un objeto válido.");
  }

  const canvas = parsed.canvas || {};
  const formatId = canvas.format || "9:16";
  const preset = FLYER_FORMATS[formatId] || FLYER_FORMATS["9:16"];

  const normalizedCanvas = {
    format: formatId,
    width: Number(canvas.width) || preset.width,
    height: Number(canvas.height) || preset.height,
    backgroundColor: canvas.backgroundColor || "#1c140e",
    backgroundOverlay: canvas.backgroundOverlay ?? "rgba(0,0,0,0.35)",
    backgroundImageUrl: canvas.backgroundImageUrl || "",
    backgroundBlur: Number(canvas.backgroundBlur) || 0,
    aesthetic: canvas.aesthetic || "vintage_editorial"
  };

  const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
  const normalizedElements = elements.map((el, index) => {
    return {
      id: el.id || `element_${index + 1}_${Date.now()}`,
      type: el.type || "text",
      text: el.text || "",
      x: typeof el.x === "number" ? el.x : Math.round(normalizedCanvas.width / 2),
      y: typeof el.y === "number" ? el.y : 150 * (index + 1),
      width: el.width || undefined,
      height: el.height || undefined,
      rotation: el.rotation || 0,
      zIndex: el.zIndex ?? (index + 1),
      style: {
        fontSize: el.style?.fontSize || 28,
        fontFamily: el.style?.fontFamily || "'Space Grotesk', sans-serif",
        fontWeight: el.style?.fontWeight || "normal",
        color: el.style?.color || "#ffffff",
        textAlign: el.style?.textAlign || "center",
        backgroundColor: el.style?.backgroundColor || "transparent",
        borderColor: el.style?.borderColor || "transparent",
        borderWidth: el.style?.borderWidth || 0,
        borderRadius: el.style?.borderRadius || 0,
        paddingX: el.style?.paddingX || 0,
        paddingY: el.style?.paddingY || 0,
        letterSpacing: el.style?.letterSpacing || 0,
        textTransform: el.style?.textTransform || "none",
        maxWidth: el.style?.maxWidth || Math.round(normalizedCanvas.width * 0.9),
        lineHeight: el.style?.lineHeight || 1.2,
        ...(el.style || {})
      },
      badgeText: el.badgeText,
      primaryText: el.primaryText,
      secondaryText: el.secondaryText,
      socials: el.socials,
      allies: el.allies,
      imageUrl: el.imageUrl,
      link: el.link
    };
  });

  const copies = parsed.copies || {};
  const normalizedCopies = {
    instagram_post: copies.instagram_post || "",
    instagram_story: copies.instagram_story || "",
    whatsapp_message: copies.whatsapp_message || "",
    whatsapp_status: copies.whatsapp_status || ""
  };

  return {
    canvas: normalizedCanvas,
    elements: normalizedElements,
    copies: normalizedCopies
  };
}

export function generateSmartCopiesFromData({
  title = "Evento en Proyecto Café",
  subtitle = "",
  date = "Próximamente",
  time = "",
  venue = "Proyecto Café",
  price = "Entrada Libre",
  participants = "",
  socials = "@proyectocafe",
  link = "https://proyectocafe.com"
}) {
  const dateTimeStr = time ? `${date} a las ${time}` : date;

  const instagram_post = `☕✨ ¡UNA NUEVA EXPERIENCIA TE ESPERA EN PROYECTO CAFÉ! ✨☕

${title.toUpperCase()}
${subtitle ? `\n"${subtitle}"\n` : ''}
Los mejores momentos se viven alrededor de una buena taza de café y grandes historias. Prepárate para una velada inolvidable llena de aroma, cultura y buena vibra.${participants ? `\n\n👤 Invitados especiales: ${participants}` : ''}

🗓️ CUÁNDO: ${dateTimeStr}
📍 DÓNDE: ${venue}
🎟️ ENTRADA: ${price}

🔗 Reserva tu lugar y conoce más detalles en el enlace de nuestra biografía o escribe un DM directo.

¡Los cupos son limitados! Etiqueta en los comentarios con quién vas a venir 👇👇

---
#ProyectoCafe #CafeDeEspecialidad #EventosCulturales #CoffeeLovers #Medellin #CulturaCafetera #AgendaCultural #CafeYArte`;

  const instagram_story = `🔥 ¡ESTE ${date.toUpperCase()} EN PROYECTO CAFÉ! 🔥
☕ ${title}
🕒 ${time || 'Hora por confirmar'} | 📍 ${venue}
🎟️ ${price}

¡Toca el sticker del enlace para registrarte antes de que se agoten los cupos! 👇`;

  const whatsapp_message = `*¡Hola! Te invitamos a una noche especial en Proyecto Café ☕✨*

📌 *${title}*
_${subtitle || 'Una cita imperdible con el café y la cultura'}_
${participants ? `\n*Invitados:* ${participants}` : ''}
📅 *Fecha:* ${date}
⏰ *Hora:* ${time || 'Por confirmar'}
📍 *Lugar:* ${venue}
🎟️ *Entrada:* ${price}

🔗 *Reserva o inscríbete aquí:*
${link}

¡Pasa la voz a tus amigos y ven a disfrutar del mejor café! Si necesitas más información, respóndenos a este mensaje.`;

  const whatsapp_status = `☕✨ ${title} este ${date} en Proyecto Café (${venue}). Entrada: ${price}. ¡Desliza o escribe al DM para reservar tu cupo! 🎟️👇`;

  return {
    instagram_post,
    instagram_story,
    whatsapp_message,
    whatsapp_status
  };
}
