
import React, { useState, useEffect, useRef } from 'react';
// Corregido: Se ajusta la ruta de importación asumiendo que supabaseClient.js está en la carpeta 'src'
import { supabase } from '../../../supabaseClient'; 
import { Users, PartyPopper, Check, Send, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Componentes UI Reutilizables (basados en tu stack) ---

// Un componente Input genérico para mantener la consistencia
const Input = ({ id, type, placeholder, value, onChange, required = false, min }) => (
  <input
    id={id}
    name={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    min={min}
    className="w-full px-4 py-2 border border-softGrey rounded-lg focus:ring-2 focus:ring-ladrillo focus:border-ladrillo transition duration-200 font-SpaceGrotesk"
  />
);

// Un componente Select genérico
const Select = ({ id, value, onChange, required = false, children }) => (
    <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 border border-softGrey rounded-lg focus:ring-2 focus:ring-ladrillo focus:border-ladrillo transition duration-200 bg-white font-SpaceGrotesk"
    >
        {children}
    </select>
);

// --- Componente Principal de la Agenda ---

const Agenda = () => {
  // Ref para el contenedor del mensaje de éxito que se convertirá en PDF
  const successRef = useRef();
  // Estado para controlar el estado del envío (idle, loading, success, error)
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    eventType: '',
    attendees: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    equipment: [],
    foodService: 'Solo bebidas (café, tés, jugos)',
    comments: ''
  });

  // Efecto para establecer la fecha mínima en el selector a hoy
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
      dateInput.setAttribute('min', today);
    }
  }, []);

  // Manejador para cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        equipment: checked
          ? [...prev.equipment, value]
          : prev.equipment.filter(item => item !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejador para el envío del formulario a Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('loading'); // Inicia el estado de carga

    const reservationData = {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        event_type: formData.eventType,
        attendees: parseInt(formData.attendees, 10),
        event_date: formData.eventDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        equipment: formData.equipment,
        food_service: formData.foodService,
        comments: formData.comments,
        status: 'pending'
    };

    try {
        const { error } = await supabase.from('event_reservations').insert([reservationData]);
        if (error) throw error;
        setSubmissionStatus('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error submitting to Supabase:', error);
        setSubmissionStatus('error');
    }
  };

  // Manejador para descargar el comprobante en PDF
  const handleDownloadPDF = () => {
    const input = successRef.current;
    html2canvas(input, { scale: 2 }) // Aumenta la escala para mejor calidad
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`comprobante-reserva-${formData.fullName.replace(/\s/g, '_')}.pdf`);
      });
  };

  // --- Renderizado Condicional ---

  if (submissionStatus === 'success') {
    return (
      <div className="w-full bg-cream min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div>
          <div ref={successRef} className="max-w-4xl w-full text-center bg-white p-8 sm:p-12 rounded-2xl shadow-lg border-l-8 border-greenish">
            <Check size={60} className="mx-auto text-greenish" />
            <h2 className="font-LilitaOne text-3xl sm:text-4xl text-notBlack mt-4 mb-4">¡Solicitud Enviada!</h2>
            <p className="font-SpaceGrotesk text-lg text-gray-700 mt-2">
              Gracias, <span className="font-bold text-ladrillo">{formData.fullName}</span>. Hemos recibido tu solicitud.
            </p>
            <p className="font-SpaceGrotesk text-base text-gray-600 mt-2">
              Te contactaremos pronto para confirmar los detalles.
            </p>
            <div className="mt-6 border-t pt-4 text-left text-sm text-gray-500">
                <p><strong>Evento:</strong> {formData.eventType}</p>
                <p><strong>Fecha:</strong> {formData.eventDate}</p>
                <p><strong>Asistentes:</strong> {formData.attendees}</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <button
              onClick={handleDownloadPDF}
              className="bg-lilaDark text-white font-SpaceGrotesk font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <Download size={20} />
              Descargar Comprobante
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submissionStatus === 'error') {
     return (
      <div className="w-full bg-cream min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full text-center bg-white p-8 sm:p-12 rounded-2xl shadow-lg border-l-8 border-pureRed">
          <h2 className="font-LilitaOne text-3xl sm:text-4xl text-notBlack mb-4">¡Oops! Algo salió mal.</h2>
          <p className="font-SpaceGrotesk text-lg text-gray-700 mt-2">
            No pudimos procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.
          </p>
           <button
            onClick={() => setSubmissionStatus('idle')}
            className="mt-8 bg-lilaDark text-white font-SpaceGrotesk font-bold py-3 px-8 rounded-lg hover:bg-opacity-90"
          >
            Volver al formulario
          </button>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="w-full bg-cream flex justify-center p-4 sm:p-8">
      <div className="container max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative h-48 sm:h-64">
            <img
              src="https://placehold.co/1024x400/e3a18b/2d2823?text=Tu+Caf%C3%A9"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1024x400/e3a18b/FFFFFF?text=Espacio+para+Eventos'; }}
              alt="Interior del café"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="text-center text-cream">
                <h1 className="text-4xl sm:text-5xl font-LilitaOne">Agenda tu Evento</h1>
                <p className="mt-2 text-lg font-SpaceGrotesk max-w-2xl">El espacio perfecto para tus momentos especiales.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            {/* Sección 1: Datos de Contacto */}
            <fieldset className="space-y-6 border-l-4 border-ladrillo pl-6">
              <legend className="text-2xl font-LilitaOne text-ladrillo mb-4 flex items-center gap-3"><Users />1. Tus Datos</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="fullName" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Nombre Completo *</label>
                    <Input id="fullName" type="text" placeholder="Tu nombre y apellido" value={formData.fullName} onChange={handleChange} required />
                 </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Teléfono (WhatsApp) *</label>
                    <Input id="phone" type="tel" placeholder="Ej: 300 123 4567" value={formData.phone} onChange={handleChange} required />
                 </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Correo Electrónico *</label>
                <Input id="email" type="email" placeholder="tu.correo@ejemplo.com" value={formData.email} onChange={handleChange} required />
              </div>
            </fieldset>

            {/* Sección 2: Detalles del Evento */}
            <fieldset className="space-y-6 border-l-4 border-ladrillo pl-6">
              <legend className="text-2xl font-LilitaOne text-ladrillo mb-4 flex items-center gap-3"><PartyPopper />2. Detalles del Evento</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventType" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Tipo de Evento *</label>
                  <Select id="eventType" value={formData.eventType} onChange={handleChange} required>
                    <option value="" disabled>Selecciona una opción</option>
                    <option>Cumpleaños</option>
                    <option>Reunión de Trabajo</option>
                    <option>Taller / Capacitación</option>
                    <option>Otro</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="attendees" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Nº de Asistentes *</label>
                  <Input id="attendees" type="number" placeholder="Ej: 15" value={formData.attendees} onChange={handleChange} min="1" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Fecha *</label>
                  <Input id="eventDate" type="date" value={formData.eventDate} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Hora de Inicio *</label>
                  <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-bold font-SpaceGrotesk text-notBlack mb-1">Hora de Fin *</label>
                  <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
                </div>
              </div>
            </fieldset>
            
            {/* Botón de envío con estado de carga */}
            <div className="pt-6 border-t border-softGrey">
              <div className="mt-8 text-center">
                <button 
                    type="submit" 
                    disabled={submissionStatus === 'loading'}
                    className="w-full md:w-auto bg-ladrillo text-white font-LilitaOne text-xl py-3 px-12 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-4 focus:ring-ladrillo focus:ring-opacity-50 transform hover:scale-105 transition-transform duration-200 disabled:bg-softGrey disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {submissionStatus === 'loading' ? 'Enviando...' : 'Enviar Solicitud'}
                  {submissionStatus !== 'loading' && <Send size={20} />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
