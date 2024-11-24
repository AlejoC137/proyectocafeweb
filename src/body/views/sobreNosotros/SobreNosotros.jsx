import React from "react";

function SobreNosotros() {
  return (
    <div className="flex flex-col w-screen border bg-gray-50">
      {/* Título centrado */}
      <div className="flex justify-center items-center py-4 bg-gray-100">
        <h1 className="text-2xl font-bold">PROYECTO CAFÉ</h1>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Información del café */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Nuestra Historia</h2>
          <p className="text-base text-gray-700">
            Proyecto Café fue creado por Margarita Aguirre y su hijo Alejandro
            Patiño en septiembre de 2023. Actualmente, es un café orientado al
            estilo <strong>American Dining</strong>, pero con la sazón casera y
            la calidad inigualable del café colombiano.
          </p>
          <img
            src="https://i.imgur.com/HbviaPK.jpeg"
            alt="Historia del café"
            className="mt-4 rounded-md shadow-md object-cover w-full h-48" // Ajusta el ancho completo y una altura fija
          />
        </section>

        {/* Misión */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Nuestra Misión</h2>
          <p className="text-base text-gray-700">
            Proyecto Café tiene como misión ser el punto intermedio entre sí
            mismo, el barrio, la ciudad y mucho más. Como punto de encuentro,
            permite el intercambio de ideas y da cobijo a proyectos que buscan
            crear un mundo mejor.
          </p>
          <img
            src="https://i.imgur.com/s8x9tyZ_d.webp?maxwidth=520&shape=thumb&fidelity=high"
            alt="Misión del café"
            className="mt-4 rounded-md shadow-md object-cover w-full h-48" // Ajusta el ancho completo y una altura fija
          />
          <p className="text-base mt-4">Ahora queremos conocerte mejor:</p>
          <input
            type="text"
            placeholder="Cuéntanos cuál es tu proyecto"
            className="mt-2 p-2 border border-gray-300 rounded w-full"
          />
        </section>

        {/* Ubicación */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Ubicación</h2>
          <p className="text-base text-gray-700">
            Estamos ubicados en el barrio Conquistadores, en la dirección:{" "}
            <strong>Calle 35A #65D-22</strong>.
          </p>
          <img
            src="https://i.imgur.com/EaAb7Ts_d.webp?maxwidth=520&shape=thumb&fidelity=high"
            alt="Ubicación del café"
            className="mt-4 rounded-md shadow-md object-cover w-full h-48" // Ajusta el ancho completo y una altura fija
          />
          <p className="text-base text-gray-700 mt-2">
            Encuéntranos en{" "}
            <a
              href="https://www.google.com/maps/place/Proyecto+Caf%C3%A9/@6.2410477,-75.5871304,17z/data=!3m1!4b1!4m6!3m5!1s0x8e4429336d7a85eb:0x34c36b6bff4d4a76!8m2!3d6.2410424!4d-75.5845555!16s%2Fg%2F11vf381k7k?entry=ttu&g_ep=EgoyMDI0MTExOS4yIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Google Maps
            </a>
            .
          </p>
        </section>

        {/* Contacto */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Contáctanos</h2>
          <p className="text-base text-gray-700">
            Si deseas comunicarte con nosotros para servicios especiales,
            preguntas o propuestas, puedes escribirnos a nuestro correo:
          </p>
          <p className="text-base text-gray-700 font-semibold mt-2">
            cafeproyecto2023@gmail.com
          </p>
          <p className="text-base text-gray-700 mt-2">
            También puedes contactarnos por WhatsApp al número:{" "}
            <strong>3008214593</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}

export default SobreNosotros;
