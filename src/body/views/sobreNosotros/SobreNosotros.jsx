import React, { useState } from "react";

function SobreNosotros() {
  const [proyecto, setProyecto] = useState("");
  const [correo, setCorreo] = useState("");

  const handleSubmit = () => {
    if (!proyecto || !correo) {
      alert("Por favor completa ambos campos antes de enviar.");
      return;
    }
    const payload = { correo, proyecto };
    alert("¡Proyecto enviado!\nRevisaremos tu idea y te contactaremos al correo: " + correo);
    setProyecto("");
    setCorreo("");
  };

  return (
    <div className="flex flex-col w-full border-[3px] border-black bg-white rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Título centrado */}
      <div className="flex justify-center items-center p-6 bg-cream-bg border-b-[3px] border-black">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-black m-0" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          PROYECTO CAFÉ
        </h1>
      </div>

      {/* Contenido principal */}
      <div className="p-6 md:p-8 flex flex-col gap-10">
        {/* Información del café */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black border-b-[3px] border-black pb-2 inline-block self-start" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Nuestra Historia
          </h2>
          <p className="text-lg font-medium text-black leading-relaxed">
            Proyecto Café fue creado por Margarita Aguirre y su hijo Alejandro
            Patiño en septiembre de 2023. Actualmente, es un café orientado al
            estilo <strong className="font-black">American Dining</strong>, pero con la sazón casera y
            la calidad inigualable del café colombiano.
          </p>
          <div className="border-[3px] border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2">
            <img
              src="https://i.imgur.com/HbviaPK.jpeg"
              alt="Historia del café"
              className="object-cover w-full h-48 md:h-64 transition-transform duration-500 hover:scale-105"
            />
          </div>
        </section>

        {/* Misión e Input de Proyecto */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black border-b-[3px] border-black pb-2 inline-block self-start" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Nuestra Misión
          </h2>
          <p className="text-lg font-medium text-black leading-relaxed">
            Proyecto Café tiene como misión ser el punto intermedio entre sí
            mismo, el barrio, la ciudad y mucho más. Como punto de encuentro,
            permite el intercambio de ideas y da cobijo a proyectos que buscan
            crear un mundo mejor.
          </p>
          <div className="border-[3px] border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2 mb-4">
            <img
              src="https://i.imgur.com/s8x9tyZ_d.webp?maxwidth=520&shape=thumb&fidelity=high"
              alt="Misión del café"
              className="object-cover w-full h-48 md:h-64 transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div className="flex flex-col w-full mt-4 bg-gray-100 border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <label className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-6 text-center">¡Ahora queremos conocerte mejor!</label>
            <input
              type="text"
              placeholder="Cuéntanos cuál es tu proyecto..."
              value={proyecto}
              onChange={(e) => setProyecto(e.target.value)}
              className="p-3 mb-4 border-[3px] border-black rounded-none w-full font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-500"
            />
            <input
              type="email"
              placeholder="Tu correo electrónico..."
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="p-3 mb-6 border-[3px] border-black rounded-none w-full font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-500"
            />
            <button
              onClick={handleSubmit}
              className="bg-black text-white font-black uppercase tracking-widest px-6 py-3 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-white hover:text-black w-full"
            >
              Enviar Proyecto
            </button>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center border-t-[3px] border-black pt-6 font-black text-lg gap-4 text-center">
              <a href="https://instagram.com/proyecto__cafe" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors uppercase border-[3px] border-black p-2 bg-white w-full md:w-1/2">
                Instagram: @proyecto__cafe
              </a>
              <a href="mailto:cafeproyecto2023@gmail.com" className="hover:text-blue-600 transition-colors uppercase border-[3px] border-black p-2 bg-white w-full md:w-1/2">
                Email: cafeproyecto2023
              </a>
            </div>
          </div>
        </section>



        {/* Proveedores y WiFi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Vacía o extendemos WiFi (lo dejaré centrado o solo ocupando el espacio) */}

          <section className="flex flex-col gap-4 border-[3px] border-black p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-blue-100 justify-center">
            <h2 className="text-3xl font-black uppercase tracking-widest text-black border-b-[3px] border-black pb-1 inline-block self-center" style={{ fontFamily: "'First Bunny', sans-serif" }}>
              WiFi
            </h2>
            <div className="text-xl font-medium text-black text-center mt-4 border-[3px] border-black bg-white p-4">
              <p><strong className="font-black">Red:</strong> Proyecto_cafe</p>
              <p className="mt-2"><strong className="font-black">Contraseña:</strong> FreddieMercury</p>
            </div>
          </section>
        </div>



        {/* Ubicación original */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black border-b-[3px] border-black pb-2 inline-block self-start" style={{ fontFamily: "'First Bunny', sans-serif" }}>
            Ubicación
          </h2>
          <p className="text-lg font-medium text-black leading-relaxed">
            Estamos ubicados en el barrio Conquistadores, en la dirección: <br />
            <strong className="font-black text-xl">Transversal 39 #65D - 22</strong>
          </p>
          <div className="border-[3px] border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2">
            <img
              src="https://i.imgur.com/EaAb7Ts_d.webp?maxwidth=520&shape=thumb&fidelity=high"
              alt="Ubicación del café"
              className="object-cover w-full h-48 md:h-64 transition-transform duration-500 hover:scale-105"
            />
          </div>
          <div className="mt-4 flex">
            <a
              href="https://www.google.com/maps/place/Proyecto+Caf%C3%A9/@6.2410477,-75.5871304,17z/data=!3m1!4b1!4m6!3m5!1s0x8e4429336d7a85eb:0x34c36b6bff4d4a76!8m2!3d6.2410424!4d-75.5845555!16s%2Fg%2F11vf381k7k?entry=ttu&g_ep=EgoyMDI0MTExOS4yIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white font-black uppercase tracking-widest px-6 py-3 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-white hover:text-black inline-flex items-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Google Maps
            </a>
          </div>
        </section>



        {/* Contáctanos / Footer Final */}
        <footer className="flex flex-col justify-center items-center text-center border-t-[4px] border-black pt-8 pb-4 gap-2 mt-4 bg-yellow-400">
          <h4 className="font-black uppercase tracking-tighter text-3xl">| Proyecto Café |</h4>
          <h4 className="font-black text-xl">| Transversal 39 #65D - 22, Conquistadores |</h4>
          <h4 className="font-black text-xl">| +57 300 821 4593 @proyecto__cafe |</h4>
        </footer>
      </div>
    </div>
  );
}

export default SobreNosotros;
