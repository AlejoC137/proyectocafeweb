// =========================================================
// PLANTILLAS PREFABRICADAS DE ALTA CALIDAD PARA FLYER STUDIO
// Diseños equilibrados listos para usar en 1 clic
// =========================================================

export const STARTER_TEMPLATES = {
  // 1. Historia 9:16 - Concierto Acústico & Café (Vintage Editorial)
  "story_vintage_music": {
    name: "Historia · Noche Acústica & Café",
    category: "Música / 9:16",
    canvas: {
      format: "9:16",
      width: 1080,
      height: 1920,
      backgroundColor: "#1c140e",
      backgroundOverlay: "rgba(0,0,0,0.45)",
      backgroundImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80",
      aesthetic: "vintage_editorial"
    },
    elements: [
      {
        id: "badge_cat",
        type: "badge",
        text: "MÚSICA EN VIVO · EXPERIENCIA ÍNTIMA",
        x: 540,
        y: 180,
        style: {
          backgroundColor: "#c59b27",
          color: "#1c140e",
          fontSize: 24,
          fontWeight: "800",
          borderRadius: 30,
          paddingX: 32,
          paddingY: 12,
          letterSpacing: 3,
          textTransform: "uppercase"
        }
      },
      {
        id: "main_title",
        type: "text",
        text: "ACÚSTICOS\nDEL CAFÉ",
        x: 540,
        y: 380,
        style: {
          fontSize: 88,
          fontFamily: "'Playfair Display', serif",
          fontWeight: "900",
          color: "#fcf8f2",
          textAlign: "center",
          lineHeight: 1.05,
          textTransform: "uppercase",
          letterSpacing: 2
        }
      },
      {
        id: "subtitle",
        type: "text",
        text: "Una velada de cuerdas, voces y aromas selectos",
        x: 540,
        y: 570,
        style: {
          fontSize: 32,
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: "400",
          color: "#d6c7b2",
          textAlign: "center"
        }
      },
      {
        id: "card_datetime",
        type: "container",
        x: 540,
        y: 840,
        width: 820,
        style: {
          backgroundColor: "rgba(35, 25, 18, 0.85)",
          borderColor: "#c59b27",
          borderWidth: 2,
          borderRadius: 20,
          paddingX: 45,
          paddingY: 25
        },
        badgeText: "FECHA Y HORA",
        primaryText: "SÁBADO 25 OCTUBRE · 7:30 PM",
        secondaryText: "📍 Proyecto Café Central"
      },
      {
        id: "participants",
        type: "text",
        text: "ARTISTAS INVITADOS:\nLaura Gómez (Voz & Guitarra) · Dúo Carmesí",
        x: 540,
        y: 1140,
        style: {
          fontSize: 32,
          fontFamily: "'Playfair Display', serif",
          fontWeight: "700",
          color: "#fcf8f2",
          textAlign: "center",
          lineHeight: 1.3
        }
      },
      {
        id: "price_pill",
        type: "badge",
        text: "ENTRADA LIBRE · CONSUMO MÍNIMO",
        x: 540,
        y: 1380,
        style: {
          backgroundColor: "#c59b27",
          color: "#1c140e",
          fontSize: 26,
          fontWeight: "900",
          borderRadius: 16,
          paddingX: 36,
          paddingY: 14
        }
      },
      {
        id: "footer",
        type: "footer",
        x: 540,
        y: 1720,
        socials: "@proyectocafe",
        allies: "Proyecto Café · Alianza Cultural",
        style: {
          color: "#d6c7b2",
          fontSize: 24,
          textAlign: "center"
        }
      }
    ],
    copies: {
      instagram_post: `☕🎶 ¡La música y el café se unen este sábado! 🎶☕\n\nLlega una nueva edición de *Acústicos del Café* en Proyecto Café Central. Ven a disfrutar de una velada íntima con la voz de Laura Gómez y el Dúo Carmesí mientras pruebas nuestros métodos de filtrado y carta especial.\n\n🗓️ Sábado 25 de Octubre\n⏰ 7:30 PM\n📍 Proyecto Café Central\n🎟️ Entrada Libre (Consumo Mínimo)\n\n¡Los cupos son limitados por aforo! Llega temprano para asegurar tu mesa favorita.\n\n#ProyectoCafe #MusicaEnVivo #CafeEspecial #NochesDeCafe #MedellinCultural`,
      instagram_story: `🎸 SÁBADO 25 OCT · 7:30 PM\n☕ ACÚSTICOS DEL CAFÉ en vivo con Laura Gómez & Dúo Carmesí.\n🎟️ Entrada libre.\n¡Te esperamos para una noche mágica! 🌙✨`,
      whatsapp_message: `*¡Hola! Te invitamos a Acústicos del Café ☕🎶*\n\nEste *Sábado 25 de Octubre* tendremos música en vivo con Laura Gómez y Dúo Carmesí en Proyecto Café Central.\n\n⏰ *Hora:* 7:30 PM\n📍 *Lugar:* Proyecto Café Central\n🎟️ *Entrada:* Libre (consumo mínimo)\n\n¡Invita a tus amigos y vive el mejor ambiente cultural de la ciudad!`,
      whatsapp_status: `☕🎶 Acústicos del Café este Sábado 25 Oct a las 7:30 PM en Proyecto Café. ¡Entrada libre! 🎸✨`
    }
  },

  // 2. Post Cuadrado 1:1 - Club de Lectura & Poesía (Warm Organic)
  "post_warm_reading": {
    name: "Post 1:1 · Club de Lectura & Poesía",
    category: "Literatura / 1:1",
    canvas: {
      format: "1:1",
      width: 1080,
      height: 1080,
      backgroundColor: "#283618",
      backgroundOverlay: "rgba(20, 28, 12, 0.5)",
      backgroundImageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1080&q=80",
      aesthetic: "warm_organic"
    },
    elements: [
      {
        id: "badge_reading",
        type: "badge",
        text: "CLUB DE LECTURA & CAFÉ",
        x: 540,
        y: 110,
        style: {
          backgroundColor: "#dda15e",
          color: "#283618",
          fontSize: 22,
          fontWeight: "800",
          borderRadius: 24,
          paddingX: 28,
          paddingY: 10,
          letterSpacing: 2
        }
      },
      {
        id: "title_reading",
        type: "text",
        text: "LETRAS & AROMAS",
        x: 540,
        y: 250,
        style: {
          fontSize: 70,
          fontFamily: "'Playfair Display', serif",
          fontWeight: "900",
          color: "#fefae0",
          textAlign: "center",
          letterSpacing: 1
        }
      },
      {
        id: "sub_reading",
        type: "text",
        text: "Tertulia literaria: 'El realismo mágico y la memoria'",
        x: 540,
        y: 360,
        style: {
          fontSize: 26,
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: "500",
          color: "#dda15e",
          textAlign: "center"
        }
      },
      {
        id: "datetime_box",
        type: "container",
        x: 540,
        y: 520,
        width: 840,
        style: {
          backgroundColor: "rgba(40, 54, 24, 0.9)",
          borderColor: "#dda15e",
          borderWidth: 2,
          borderRadius: 16,
          paddingX: 35,
          paddingY: 20
        },
        badgeText: "CITA LITERARIA",
        primaryText: "JUEVES 30 OCTUBRE · 6:30 PM",
        secondaryText: "📍 Proyecto Café - Sala de Lectura"
      },
      {
        id: "moderator",
        type: "text",
        text: "Modera: Prof. Carlos Restrepo · Invitados Abiertos",
        x: 540,
        y: 720,
        style: {
          fontSize: 24,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: "600",
          color: "#fefae0",
          textAlign: "center"
        }
      },
      {
        id: "pill_cost",
        type: "badge",
        text: "ENTRADA GRATUITA · CAFÉ DE BIENVENIDA",
        x: 540,
        y: 840,
        style: {
          backgroundColor: "#bc6c25",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: "800",
          borderRadius: 12,
          paddingX: 28,
          paddingY: 10
        }
      },
      {
        id: "footer_post",
        type: "footer",
        x: 540,
        y: 980,
        socials: "@proyectocafe",
        allies: "Proyecto Café · Editorial Común",
        style: {
          color: "#dda15e",
          fontSize: 20,
          textAlign: "center"
        }
      }
    ],
    copies: {
      instagram_post: `📖☕ ¿Qué mejor combinación que un buen café y una conversación enriquecedora? ☕📖\n\nTe esperamos en nuestra próxima tertulia literaria *Letras & Aromas*, donde conversaremos sobre 'El realismo mágico y la memoria'. Una charla abierta para lectores, soñadores y amantes del café de especialidad.\n\n🗓️ Jueves 30 de Octubre | 6:30 PM\n📍 Proyecto Café - Sala de Lectura\n🎟️ Entrada Gratuita (incluye degustación)\n\nComenta 'LEER' o ingresa al link de la bio para registrar tu asistencia.\n\n#ClubDeLectura #ProyectoCafe #CulturaLiteraria #CafeYLibros #Medellin`,
      instagram_story: `📚 TERTULIA LITERARIA este Jueves 30 a las 6:30 PM.\n☕ Conversación, libros y café de especialidad.\n🎟️ Entrada libre con café de bienvenida. ¡Desliza para inscribirte!`,
      whatsapp_message: `*Club de Lectura en Proyecto Café 📚☕*\n\nTe invitamos este *Jueves 30 de Octubre a las 6:30 PM* a nuestra tertulia *Letras & Aromas*.\n\n📍 *Lugar:* Proyecto Café - Sala de Lectura\n🎟️ *Entrada:* Gratuita con café de bienvenida\n\n¡Trae tu libro favorito o simplemente ven a escuchar y compartir!`,
      whatsapp_status: `📖☕ Club de Lectura este Jueves 30 Oct, 6:30 PM en Proyecto Café. ¡Entrada libre! 📚✨`
    }
  },

  // 3. Post Vertical 4:5 - Cata & Taller de Barismo (Bauhaus Suizo)
  "portrait_swiss_coffee": {
    name: "Retrato 4:5 · Taller & Cata de Café",
    category: "Barismo / 4:5",
    canvas: {
      format: "4:5",
      width: 1080,
      height: 1350,
      backgroundColor: "#f4f2ec",
      backgroundOverlay: "rgba(244, 242, 236, 0.1)",
      backgroundImageUrl: "",
      aesthetic: "swiss_bauhaus"
    },
    elements: [
      {
        id: "badge_swiss",
        type: "badge",
        text: "WORKSHOP · MASTERCLASS SENSORIAL",
        x: 540,
        y: 120,
        style: {
          backgroundColor: "#111111",
          color: "#f4f2ec",
          fontSize: 22,
          fontWeight: "800",
          borderRadius: 8,
          paddingX: 30,
          paddingY: 10,
          letterSpacing: 2
        }
      },
      {
        id: "title_swiss",
        type: "text",
        text: "EL ARTE DE LA CATA",
        x: 540,
        y: 260,
        style: {
          fontSize: 76,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: "900",
          color: "#111111",
          textAlign: "center",
          letterSpacing: -1,
          lineHeight: 1.05
        }
      },
      {
        id: "subtitle_swiss",
        type: "text",
        text: "Aprende a calibrar tu paladar con 5 perfiles de origen colombiano",
        x: 540,
        y: 380,
        style: {
          fontSize: 28,
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: "600",
          color: "#d90429",
          textAlign: "center"
        }
      },
      {
        id: "datetime_swiss",
        type: "container",
        x: 540,
        y: 560,
        width: 840,
        style: {
          backgroundColor: "#ffffff",
          borderColor: "#111111",
          borderWidth: 3,
          borderRadius: 12,
          paddingX: 40,
          paddingY: 25
        },
        badgeText: "HORARIO DE FORMACIÓN",
        primaryText: "DOMINGO 2 NOVIEMBRE · 10:00 AM",
        secondaryText: "📍 Laboratorio de Tueste · Proyecto Café"
      },
      {
        id: "instructor",
        type: "text",
        text: "Dirigido por: Barista Q-Grader Certificado\nIncluye: Kit de muestras de café de especialidad + Certificado",
        x: 540,
        y: 780,
        style: {
          fontSize: 26,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: "600",
          color: "#333333",
          textAlign: "center",
          lineHeight: 1.4
        }
      },
      {
        id: "price_swiss",
        type: "badge",
        text: "INVERSIÓN: $65.000 COP · CUPO MÁXIMO 12 PERSONAS",
        x: 540,
        y: 980,
        style: {
          backgroundColor: "#d90429",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: "800",
          borderRadius: 8,
          paddingX: 32,
          paddingY: 14
        }
      },
      {
        id: "footer_swiss",
        type: "footer",
        x: 540,
        y: 1220,
        socials: "@proyectocafe · proyectocafe.com",
        allies: "Proyecto Café · Academia de Baristas",
        style: {
          color: "#111111",
          fontSize: 22,
          textAlign: "center"
        }
      }
    ],
    copies: {
      instagram_post: `☕👅 ¿Quieres entrenar tu sentido del gusto como un profesional? 👅☕\n\nTe presentamos nuestro *Taller & Masterclass Sensorial: El Arte de la Cata*. Descubriremos juntos las notas aromáticas de 5 orígenes excepcionales de Colombia guiados por nuestro barista certificado Q-Grader.\n\n🗓️ Domingo 2 de Noviembre | 10:00 AM a 1:00 PM\n📍 Laboratorio de Tueste · Proyecto Café\n🎟️ Inversión: $65.000 COP (Incluye café para llevar y certificado)\n⚠️ Únicamente 12 cupos disponibles para atención personalizada.\n\nReserva en el link de nuestra biografía antes de agotar plazas.\n\n#CataDeCafe #BarismoColombia #CafeEspecial #QGrader #ProyectoCafe #TallerDeCafe`,
      instagram_story: `☕ MASTERCLASS DE CATA DE CAFÉ\n🗓️ Domingo 2 Noviembre · 10:00 AM\n📍 Proyecto Café\n⚡ Solo 12 cupos. ¡Toca el enlace para apartar tu lugar!`,
      whatsapp_message: `*Taller Exclusivo de Cata de Café en Proyecto Café ☕✨*\n\nAprende a identificar perfiles sensoriales, acidez, cuerpo y notas aromáticas en una sesión práctica de 3 horas.\n\n📅 *Fecha:* Domingo 2 de Noviembre\n⏰ *Hora:* 10:00 AM\n📍 *Lugar:* Laboratorio Proyecto Café\n🎟️ *Inversión:* $65.000 COP (Cupos limitados a 12 participantes)\n\n¿Quieres apartar tu cupo? Responde a este mensaje o ingresa al link oficial.`,
      whatsapp_status: `☕ Masterclass sensorial de cata de café este Domingo 2 Nov en Proyecto Café. ¡Cupos limitados! 🎟️ Escríbenos para reservar.`
    }
  },

  // 4. Banner 16:9 - Noche de Tragos & Jazz (Cyber Neon)
  "banner_cyber_neon": {
    name: "Banner 16:9 · Night Club & Special Drinks",
    category: "Nocturno / 16:9",
    canvas: {
      format: "16:9",
      width: 1920,
      height: 1080,
      backgroundColor: "#0d0d12",
      backgroundOverlay: "rgba(13, 13, 18, 0.4)",
      backgroundImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80",
      aesthetic: "cyber_neon"
    },
    elements: [
      {
        id: "badge_neon",
        type: "badge",
        text: "AFTER HOURS · COCKTAILS & VINYL",
        x: 960,
        y: 120,
        style: {
          backgroundColor: "#ff007f",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: "800",
          borderRadius: 24,
          paddingX: 36,
          paddingY: 12,
          letterSpacing: 3
        }
      },
      {
        id: "title_neon",
        type: "text",
        text: "NOCHES NEÓN & CAFÉ",
        x: 960,
        y: 280,
        style: {
          fontSize: 92,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: "900",
          color: "#ffffff",
          textAlign: "center",
          letterSpacing: 2
        }
      },
      {
        id: "subtitle_neon",
        type: "text",
        text: "Coctelería de autor con cold brew · DJ Set en vinilo · 2x1 en cócteles seleccionados",
        x: 960,
        y: 420,
        style: {
          fontSize: 32,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: "600",
          color: "#00f0ff",
          textAlign: "center"
        }
      },
      {
        id: "datetime_neon",
        type: "container",
        x: 960,
        y: 590,
        width: 1100,
        style: {
          backgroundColor: "rgba(22, 22, 32, 0.9)",
          borderColor: "#00f0ff",
          borderWidth: 2,
          borderRadius: 18,
          paddingX: 50,
          paddingY: 20
        },
        badgeText: "HORARIO ESPECIAL",
        primaryText: "TODOS LOS VIERNES Y SÁBADOS · 8:00 PM A CIERRE",
        secondaryText: "📍 Proyecto Café Rooftop & Terraza"
      },
      {
        id: "footer_neon",
        type: "footer",
        x: 960,
        y: 940,
        socials: "@proyectocafe · Entrada Libre",
        allies: "Proyecto Café · Coctelería de Autor",
        style: {
          color: "#ffffff",
          fontSize: 26,
          textAlign: "center"
        }
      }
    ],
    copies: {
      instagram_post: `🍸⚡ Cuando cae la noche, el café se transforma en ritmo y coctelería ⚡🍸\n\nVen a vivir nuestras *Noches Neón & Café* en la terraza de Proyecto Café. Prueba nuestros cócteles infusionados con cold brew mientras disfrutas de la mejor selección musical en vinilos.\n\n🗓️ Viernes y Sábados desde las 8:00 PM\n📍 Proyecto Café Terraza\n🍹 2x1 en Gin & Espresso Tonic hasta las 10:00 PM\n🎟️ Entrada Libre\n\n¡La mejor energía del fin de semana está aquí!\n\n#AfterOffice #NochesDeCafe #CocteleriaDeCafe #ColdBrewCocktails #ProyectoCafe`,
      instagram_story: `⚡ VIERNES Y SÁBADO DESDE LAS 8 PM 🍸\nNoches Neón: Cocteles de café + vinilos en la terraza.\n¡2x1 de 8 a 10 PM! Te esperamos.`,
      whatsapp_message: `*¡Plan de fin de semana en Proyecto Café! 🍸⚡*\n\nLlegan las *Noches Neón & Café*:\n🎧 Música en vinilo\n🍹 Cócteles con cold brew (2x1 hasta las 10 PM)\n📍 Proyecto Café Terraza\n🎟️ Entrada libre\n\n¡Ven a compartir con nosotros!`,
      whatsapp_status: `🍸⚡ Noches Neón & Cócteles de café este fin de semana en Proyecto Café. 2x1 de 8 a 10 PM. ¡Entrada libre!`
    }
  },

  // 5. Formato Carta (Print Letter) - Brunch & Almuerzos de Fin de Semana (Modern Retro)
  "letter_retro_brunch": {
    name: "Flyer Carta Impreso · Especial Brunch",
    category: "Gastronomía / Carta",
    canvas: {
      format: "letter",
      width: 1200,
      height: 1553,
      backgroundColor: "#2b1c10",
      backgroundOverlay: "rgba(43, 28, 16, 0.4)",
      backgroundImageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80",
      aesthetic: "modern_retro"
    },
    elements: [
      {
        id: "badge_brunch",
        type: "badge",
        text: "SÁBADOS & DOMINGOS · MENÚ DE TEMPORADA",
        x: 600,
        y: 140,
        style: {
          backgroundColor: "#f9bc60",
          color: "#2b1c10",
          fontSize: 24,
          fontWeight: "800",
          borderRadius: 20,
          paddingX: 36,
          paddingY: 12,
          letterSpacing: 2
        }
      },
      {
        id: "title_brunch",
        type: "text",
        text: "EL BRUNCH DEL CAFÉ",
        x: 600,
        y: 290,
        style: {
          fontSize: 84,
          fontFamily: "'Lilita One', cursive",
          fontWeight: "normal",
          color: "#f9bc60",
          textAlign: "center",
          letterSpacing: 1
        }
      },
      {
        id: "sub_brunch",
        type: "text",
        text: "Tostadas artesanales, mimosas con fruta local y café de origen ilimitado",
        x: 600,
        y: 410,
        style: {
          fontSize: 30,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: "600",
          color: "#e16162",
          textAlign: "center"
        }
      },
      {
        id: "datetime_brunch",
        type: "container",
        x: 600,
        y: 620,
        width: 880,
        style: {
          backgroundColor: "#3b2615",
          borderColor: "#abd1c6",
          borderWidth: 3,
          borderRadius: 20,
          paddingX: 50,
          paddingY: 25
        },
        badgeText: "SERVICIO DE BRUNCH",
        primaryText: "SÁBADOS Y DOMINGOS · 9:00 AM A 2:00 PM",
        secondaryText: "📍 Proyecto Café Principal"
      },
      {
        id: "menu_highlights",
        type: "text",
        text: "✨ Tostada Brioche con Huevo Poché y Aguacate\n✨ Waffles de Masa Madre con Frutos Rojos\n✨ Bowl de Acai y Granola Casera\n✨ Café Filtrado en Métodos Manuales",
        x: 600,
        y: 890,
        style: {
          fontSize: 28,
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: "500",
          color: "#fcf8f2",
          textAlign: "center",
          lineHeight: 1.6
        }
      },
      {
        id: "price_brunch",
        type: "badge",
        text: "OPCIONES DESDE $22.000 COP · RESERVA TU MESA",
        x: 600,
        y: 1140,
        style: {
          backgroundColor: "#004643",
          color: "#f9bc60",
          fontSize: 26,
          fontWeight: "800",
          borderRadius: 14,
          paddingX: 38,
          paddingY: 14
        }
      },
      {
        id: "footer_brunch",
        type: "footer",
        x: 600,
        y: 1400,
        socials: "@proyectocafe · Tel: 300 123 4567",
        allies: "Proyecto Café · Panadería Artesanal",
        style: {
          color: "#abd1c6",
          fontSize: 24,
          textAlign: "center"
        }
      }
    ],
    copies: {
      instagram_post: `🥐☕ Los fines de semana se hicieron para disfrutar sin prisa ☕🥐\n\nVen a vivir la experiencia de nuestro *Brunch del Café*. Panadería artesanal horneada cada mañana, tostadas brioche, bowls frescos y por supuesto, el mejor café de Colombia preparado en métodos especiales.\n\n🗓️ Sábados y Domingos | 9:00 AM a 2:00 PM\n📍 Proyecto Café Principal\n\n¿Con quién te gustaría desayunar este fin de semana? Etiquétal@ en comentarios 👇\n\n#BrunchMedellin #ProyectoCafe #CafeDeOrigen #DesayunosMedellin #CoffeeAndBrunch`,
      instagram_story: `🥐 EL BRUNCH DEL CAFÉ ✨\nSábados y Domingos de 9 AM a 2 PM.\n¡Tostadas de masa madre, mimosas y café especial! Desliza para ver la carta.`,
      whatsapp_message: `*¡Fin de semana de Brunch en Proyecto Café! 🥐☕*\n\nTe esperamos sábados y domingos de 9:00 AM a 2:00 PM con nuestra carta especial de brunch y café de origen ilimitado.\n\n📍 Proyecto Café Principal\nReservas al 300 123 4567 o por este medio.`,
      whatsapp_status: `🥐☕ Especial de Brunch este fin de semana en Proyecto Café (9 AM - 2 PM). ¡Ven a consentirte!`
    }
  }
};
