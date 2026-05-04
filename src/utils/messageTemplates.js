export const MESSAGE_TEMPLATES = {
  WELCOME: {
    title: "¡Bienvenido! \u2615",
    content: (name) => ` ¡${name || 'amigo'}!\u2B50\n\nNos emociona mucho que te hayas unido a nuestra comunidad. Al registrarte, has desbloqueado tu propio Portal de Cliente, donde podrás:\n\n• Ver tus Puntos y redimirlos.\n• Consultar tu historial de cafés favoritos.\n• Inscribirte fácilmente a nuestros eventos y catas \uD83D\uDDD3\n• Recibir ofertas especiales y promociones exclusivas \uD83C\uDF81\n• Notificaciones de nuevas funcionalidades de Proyecto Café Web.\n\nPuedes ingresar con el siguiente enlace:\nhttps://proyectocafeweb.vercel.app/userPortal\n\n¡Te esperamos pronto!`,
    type: "welcome"
  },
  PROMO: {
    title: "Promoción \uD83C\uDF81",
    content: `\uD83C\uDF81 *¡Gran Promoción de la Semana!*\n\nEsta semana tenemos 2x1 en todos nuestros cafés de especialidad. ¡Te esperamos para compartir una taza inolvidable! \u2615 \u2728`,
    type: "promo"
  },
  EVENT: {
    title: "Evento \uD83C\uDF77",
    content: `\uD83C\uDF77 *Próximo Evento Especial!*\n\n¡Hola! Te invitamos a nuestro próximo evento especial. Ya puedes inscribirte desde tu portal de cliente con un solo clic. ¡No te quedes sin tu cupo!`,
    type: "announcement"
  },
  EVENT_REMINDER: {
    title: "Recordatorio de Evento \u23F0",
    content: (name, eventName, date, time, endTime, value, description, additionalInfo, allies, link, organizers) => {
      let msg = `¡Hola ${name || 'asistente'}! \u2728\n\n`;
      msg += `Este es un recordatorio de nuestro evento *${eventName}*.\n\n`;
      msg += `\uD83D\uDCC5 *Fecha:* ${date}\n`;
      msg += `\u231A *Hora:* ${time}${endTime ? ` - ${endTime}` : ''}\n`;
      if (value) msg += `\uD83D\uDCB5 *Valor:* ${value}\n`;
      if (description) msg += `\n*Descripción:* ${description}\n`;
      if (organizers) msg += `\n\uD83D\uDC65 *Organizado por:* ${organizers}\n`;
      if (allies && allies.length > 0) msg += `\n\uD83E\uDD1D *Aliados:* ${allies.join(', ')}\n`;
      if (additionalInfo) msg += `\n\u2139\uFE0F *Info Adicional:* ${additionalInfo}\n`;
      if (link) msg += `\n\uD83D\uDD17 *Enlace:* ${link}\n`;
      msg += `\n¡Te esperamos con mucha emoción! \u2615`;
      return msg;
    },
    type: "reminder"
  }
};

