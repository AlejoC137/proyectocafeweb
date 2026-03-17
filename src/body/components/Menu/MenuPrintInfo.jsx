function MenuPrintInfo({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: `<strong>Más sobre el menú.</strong>
En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados.

<strong>Desayuno:</strong> 8:00 am - 11:30 am.  <strong>Almuerzo:</strong> Cambia cada día, inicia a 12:30. 

<strong>Horario de atención:</strong> L-V: 8:00 a.m. – 7:00 p.m. | Sáb: 8:00 a.m. – 6:00 p.m. Domingo y festivo: Cerrado

<strong>WiFi:</strong> Proyecto_cafe | <strong>Contraseña:</strong> FreddieMercury <em>(El WiFi es gratis pero recomendamos un consumo mínimo de $10.000)</em>

<strong>Pregunta por promociones, especiales, eventos, talleres y el menú del día.</strong>`
    },
    EN: {
      Intro: `<strong>More about the menu.</strong>
At Proyecto Café we do everything possible to serve dishes and drinks with fresh and well-cared ingredients.

<strong>Breakfast:</strong> 8:00 am - 11:30 am. <strong>Lunch:</strong> Changes daily, starts at 12:30.

<strong>Opening hours:</strong> Mon-Fri: 8:00 a.m. – 7:00 p.m. | Sat: 8:00 a.m. – 6:00 p.m. Sunday and Holidays: Closed

<strong>WiFi:</strong> Proyecto_cafe | <strong>Password:</strong> FreddieMercury <em>(WiFi is free but we recommend a minimum consumption of $10.000)</em>

<strong>Ask about promotions, specials, events, workshops, and the daily menu.</strong>`
    }
  };

  const text = isEnglish ? infoFija.EN.Intro : infoFija.ES.Intro;

  return (
    <div
      className="text-md font-SpaceGrotesk whitespace-pre-line text-justify w-full leading-[1.15] tracking-tight"
      style={{ fontSize: '13px' }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

export default MenuPrintInfo;
