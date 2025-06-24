function MenuAgenda({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: `Proyecto Café es una micro panadería, un almorzadero que quiere ser gourmet, una cafetería, un centro cultural, un parche de familia y amigos, una excusa para conversar con los cercanos. Quizás es también una forma de enmarcar sentimientos y tristezas. Es un lugar de elefantes y cosmonautas. Tal vez es una obra inacabable, algo bonito y propio. Todos los que han aportado y son parte del proyecto *son* el proyecto.

Sin más rodeos, el proyecto es la voluntad de efectuar las ideas en la realidad. Proyectemos todos juntos, con un café.

`
    },
    EN: {
      Intro: `Proyecto Café is a micro-bakery, a lunch spot with gourmet dreams, a café, a cultural hub, a hangout for family and friends, an excuse to sit and talk. Maybe it’s also a way to frame emotions and sorrows. It’s a place of elephants and cosmonauts. Maybe it’s a never-ending work in progress — something beautiful and ours. Everyone who has contributed and is part of this journey *is* the project.

Simply put, it’s about the will to turn ideas into reality. Let’s all design together, over a coffee.

`
    }
  };

  const text = isEnglish ? infoFija.EN.Intro : infoFija.ES.Intro;

  return (
    <div className="text-md font-SpaceGrotesk whitespace-pre-line" style={{ fontSize: '18px' }}>
      <div className="text-center mb-4">
        <h1 className="text-4xl font-SpaceGrotesk font-bold leading-tight">
          {isEnglish ? "This Month on Proyecto Café" : "Este Mes en Proyecto Café"}
        </h1>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default MenuAgenda;
