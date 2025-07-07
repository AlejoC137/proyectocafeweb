function MenuPrintInfo({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: `Proyecto Café es una micro panadería, un almorzadero que quiere ser gourmet, un lugar donde se toma buen café, un lugar hecho entre familia y amigos. Quizás es también una forma de enmarcar mis sentimientos y tristezas. Es un lugar de elefantes y cosmonautas. Es una obra inacabable, algo bonito y propio. Todos los que han aportado <strong>son</strong> el proyecto, ud que lee esto tambien lo es. Concretamente, el proyecto es la voluntad de efectuar las ideas en la realidad. hagamos proyectos juntos, con un café.

      <strong>Nuestro Equipo</strong>:
      Margarita, Alejandro, Juan, Isabela.

<strong>Horario de atención:</strong>
Lunes a viernes: 8:00 a.m. – 7:00 p.m.  
Sábado: 8:00 a.m. – 6:00 p.m.  
Domingo: 9:00 a.m. – 2:00 p.m.

<strong>WiFi:</strong> Proyecto_cafe
<strong>Contraseña:</strong> FreddieMercury

<strong>Pregunta por promociones, especiales, eventos y el menú del día.</strong>`
    },
    EN: {
      Intro: `Proyecto Café is a micro-bakery, a lunch spot with gourmet ambitions, a place to enjoy good coffee, a space built by family and friends. Perhaps it’s also a way to frame my feelings and sorrows. It’s a place of elephants and cosmonauts. It’s an endless work in progress — something beautiful and our own. Everyone who has contributed <strong>is</strong> the project, and you reading this are too. Simply put, the project is the will to make ideas real. Let’s build things together, over a coffee.

<strong>Our Team</strong>:  
Margarita, Alejandro, Juan, Isabela.

<strong>Opening hours:</strong>  
Monday to Friday: 8:00 a.m. – 7:00 p.m.  
Saturday: 8:00 a.m. – 6:00 p.m.  
Sunday: 9:00 a.m. – 2:00 p.m.

<strong>WiFi:</strong> Proyecto_cafe  
<strong>Password:</strong> FreddieMercury

<strong>Ask about promotions, specials, events, and the daily menu.</strong>`
    }
  };

  const text = isEnglish ? infoFija.EN.Intro : infoFija.ES.Intro;

  return (
    <div
      className="text-md font-SpaceGrotesk whitespace-pre-line"
      style={{ fontSize: '18px' }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

export default MenuPrintInfo;
