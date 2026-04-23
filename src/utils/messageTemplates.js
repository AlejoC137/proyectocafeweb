export const MESSAGE_TEMPLATES = {
  WELCOME: {
    title: "¡Bienvenido! \u2615",
    content: (name) => `¡Hola ${name || 'amigo'}! \u{1F31F} 

Nos emociona mucho que te hayas unido a nuestra comunidad. Al registrarte, has desbloqueado tu propio Portal de Cliente, donde podrás:

\u2022 Ver tus Puntos y redimirlos.
\u2022 Consultar tu historial de cafés favoritos.
\u2022 Inscribirte fácilmente a nuestros eventos y catas \u{1F3AB}
\u2022 Recibir ofertas especiales y promociones exclusivas \u{1F381}
\u2022 Notificaciones de nuevas funcionalidades de Proyecto Café Web.

Puedes ingresar con el siguiente enlace: 
https://proyectocafeweb.vercel.app/userPortal  

¡Te esperamos pronto!`,
    type: "welcome"
  },
  PROMO: {
    title: "Promoción \u{1F381}",
    content: `\u{1F381} *¡Gran Promoción de la Semana!*

Esta semana tenemos 2x1 en todos nuestros cafés de especialidad. ¡Te esperamos para compartir una taza inolvidable! \u2615\u2728`,
    type: "promo"
  },
  EVENT: {
    title: "Evento \u{1F377}",
    content: `\u{1F377} *Próximo Evento Especial*

¡Hola! Te invitamos a nuestro próximo evento especial. Ya puedes inscribirte desde tu portal de cliente con un solo clic. ¡No te quedes sin tu cupo!`,
    type: "announcement"
  },
  EVENT_REMINDER: {
    title: "Recordatorio de Evento \u23F0",
    content: (name, eventName, date, time) => `¡Hola ${name || 'asistente'}! \u2728

Este es un recordatorio de nuestro evento *${eventName}*.
\u{1F4C5} *Fecha:* ${date}
\u231A *Hora:* ${time}

¡Te esperamos con mucha emoción! \u2615`,
    type: "reminder"
  }
};
