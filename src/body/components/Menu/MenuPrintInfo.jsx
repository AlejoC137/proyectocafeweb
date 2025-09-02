function MenuPrintInfo({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: // `Proyecto Café es una micropanadería, un almorzadero que quiere ser gourmet, un lugar donde se toma buen café; un lugar hecho entre familia y amigos. Quizás es también una forma de enmarcar mis sentimientos y tristezas. Es un lugar de elefantes y cosmonautas. Es una obra inacabable, algo bonito y propio. Todos los que han aportado son el proyecto; usted que lee esto también lo es. Concretamente, el proyecto es la voluntad de efectuar las ideas en la realidad. Hagamos proyectos juntos, con un café. Nuestra misión es apoyar los proyectos de las personas que tengan esta voluntad.

`<strong>Nuestro Equipo</strong>:
Margarita, Alejandro, Samantha, Juan, Isabela.

<strong>Horario de atención:</strong>
Lunes a viernes: 8:00 a.m. – 7:00 p.m.  
Sábado: 8:00 a.m. – 6:00 p.m.  
Domingo y festivo: Cerrado

<strong>WiFi:</strong> Proyecto_cafe  
<strong>Contraseña:</strong> FreddieMercury

<strong>Pregunta por promociones, especiales, eventos y el menú del día.</strong>`
    },
    EN: {
     Intro: // `Proyecto Café is a micro-bakery, a lunch spot that aspires to be gourmet, a place to drink good coffee; a place made among family and friends. Perhaps it is also a way of framing my feelings and sorrows. It is a place of elephants and cosmonauts. It is an endless work, something beautiful and my own. All who have contributed are the project; you who are reading this are too. Specifically, the project is the will to bring ideas into reality. Let's make projects together, with a coffee. Our mission is to support the projects of people who have this will.

`<strong>Our Team</strong>:  
Margarita, Alejandro, Samantha, Juan, Isabela.

<strong>Opening hours:</strong>  
Monday to Friday: 8:00 a.m. – 7:00 p.m.  
Saturday: 8:00 a.m. – 6:00 p.m.  
Sunday: Closed

<strong>WiFi:</strong> Proyecto_cafe  
<strong>Password:</strong> FreddieMercury

<strong>Ask about promotions, specials, events, and the daily menu.</strong>`
    }
  };

  const text = isEnglish ? infoFija.EN.Intro : infoFija.ES.Intro;

  return (
    <div
      className="text-md font-SpaceGrotesk whitespace-pre-line text-justify"
      style={{ fontSize: '18px' }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

export default MenuPrintInfo;
