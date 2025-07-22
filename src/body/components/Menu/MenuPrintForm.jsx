import { useState } from "react";


export function FormularioMenuPrintInfo({ onSubmit }) {
  const [formData, setFormData] = useState({
    IntroES: "",
    IntroEN: "",
    HorarioES: "",
    HorarioEN: "",
    Wifi: "",
    Contraseña: "",
    Equipo: "",
    ExtrasES: "",
    ExtrasEN: "",
    AgradecimientosES: "",
    AgradecimientosEN: ""
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block font-bold">Intro Español:</label>
        <textarea
          name="IntroES"
          value={formData.IntroES}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
          rows={5}
        />
      </div>
      <div>
        <label className="block font-bold">Intro Inglés:</label>
        <textarea
          name="IntroEN"
          value={formData.IntroEN}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
          rows={5}
        />
      </div>
      <div>
        <label className="block font-bold">Horario Español:</label>
        <textarea
          name="HorarioES"
          value={formData.HorarioES}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <div>
        <label className="block font-bold">Horario Inglés:</label>
        <textarea
          name="HorarioEN"
          value={formData.HorarioEN}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold">WiFi:</label>
          <input
            type="text"
            name="Wifi"
            value={formData.Wifi}
            onChange={handleChange}
            className="border w-full p-2 rounded bg-slate-100"
          />
        </div>
        <div>
          <label className="block font-bold">Contraseña:</label>
          <input
            type="text"
            name="Contraseña"
            value={formData.Contraseña}
            onChange={handleChange}
            className="border w-full p-2 rounded bg-slate-100"
          />
        </div>
      </div>
      <div>
        <label className="block font-bold">Equipo:</label>
        <input
          type="text"
          name="Equipo"
          value={formData.Equipo}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <div>
        <label className="block font-bold">Extras Español:</label>
        <textarea
          name="ExtrasES"
          value={formData.ExtrasES}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <div>
        <label className="block font-bold">Extras Inglés:</label>
        <textarea
          name="ExtrasEN"
          value={formData.ExtrasEN}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <div>
        <label className="block font-bold">Agradecimientos Español:</label>
        <textarea
          name="AgradecimientosES"
          value={formData.AgradecimientosES}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <div>
        <label className="block font-bold">Agradecimientos Inglés:</label>
        <textarea
          name="AgradecimientosEN"
          value={formData.AgradecimientosEN}
          onChange={handleChange}
          className="border w-full p-2 rounded bg-slate-100"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Guardar Información
      </button>
    </form>
  );
}

export default FormularioMenuPrintInfo;
