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
    content: (name, eventName, date, time, endTime, value, description, additionalInfo, allies, link, organizers) => {
      let msg = `¡Hola ${name || 'asistente'}! \u2728\n\n`;
      msg += `Este es un recordatorio de nuestro evento *${eventName}*.\n\n`;
      msg += `\u{1F4C5} *Fecha:* ${date}\n`;
      msg += `\u231A *Hora:* ${time}${endTime ? ` - ${endTime}` : ''}\n`;
      if (value) msg += `\u{1F4B5} *Valor:* ${value}\n`;
      if (description) msg += `\n*Descripción:* ${description}\n`;
      if (organizers) msg += `\n\u{1F465} *Organizado por:* ${organizers}\n`;
      if (allies && allies.length > 0) msg += `\n\u{1F91D} *Aliados:* ${allies.join(', ')}\n`;
      if (additionalInfo) msg += `\n\u2139\ufe0f *Info Adicional:* ${additionalInfo}\n`;
      if (link) msg += `\n\u{1F517} *Enlace:* ${link}\n`;
      msg += `\n¡Te esperamos con mucha emoción! \u2615`;
      return msg;
    },
    type: "reminder"
  }
};
