import React from 'react';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgendaColumn({ currentEvent, agendaEvents = [], eventCarouselIdx = 0 }) {
  const navigate = useNavigate();
  const borderColor = "border-[#1F2937]";
  const shadowColor = "shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  return (
    <div className={`w-full flex-col flex border-[3px] ${borderColor} bg-white rounded-none ${shadowColor}`}>
      
      {/* Header Cartelera */}
      <div className={`p-4 border-b-[3px] ${borderColor} bg-pink-100 flex items-center justify-between`}>
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          <Ticket className="w-4 h-4" /> Próximos Eventos
        </h3>
        <button onClick={() => navigate('/EventosOffer')}
          className={`px-2 py-1 bg-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] ${buttonHover} text-[10px] font-black uppercase transition-all`}
        >
          Ver Todo
        </button>
      </div>

      {/* Contenido (Con imagen reducida) */}
      <div className="flex-1 bg-cream-bg relative overflow-hidden flex flex-col group">
        {currentEvent ? (
          <>
            {/* Imagen del Evento (Full Width 1:1 Bulletproof) */}
            <div className={`w-full pt-[100%] border-b-[3px] ${borderColor} relative overflow-hidden bg-white group flex-shrink-0`}>
              <div className="absolute inset-0">
                {currentEvent.bannerIMG ? (
                  <img src={currentEvent.bannerIMG} alt={currentEvent.nombreES} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Calendar className="w-12 h-12 opacity-20" />
                  </div>
                )}
              </div>
              {/* Etiqueta Flotante sobre la imagen */}
              <div className={`absolute top-4 right-4 bg-yellow-100 border-[3px] ${borderColor} px-4 py-2 shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] z-10`}>
                <span className="text-lg lg:text-xl font-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {currentEvent.fecha ? new Date(currentEvent.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Next'}
                </span>
              </div>
            </div>

            {/* Lista de Eventos */}
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[350px] custom-scrollbar bg-cream-bg">
              {agendaEvents.map((evt, idx) => {
                const isSelected = idx === eventCarouselIdx;
                return (
                  <div key={evt._id || idx} className={`p-4 border-b-[3px] ${borderColor} flex flex-col justify-between transition-colors ${isSelected ? 'bg-yellow-100 opacity-100' : 'bg-transparent opacity-50 hover:opacity-100'}`}>
                    <div>
                      <h4 className="text-2xl font-black uppercase leading-none tracking-tighter mb-4" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                        {evt.nombreES || evt.nombre}
                      </h4>
                      
                      <div className="flex flex-wrap gap-2 w-full">
                        <div className={`flex items-center gap-2 bg-white border-[2px] ${borderColor} p-2 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                          <Clock className="w-4 h-4 text-black" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{evt.horaInicio || 'TBD'}</span>
                        </div>
                        <div className={`flex items-center gap-2 bg-white border-[2px] ${borderColor} p-2 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                          <MapPin className="w-4 h-4 text-black" />
                          <span className="text-[10px] font-black uppercase tracking-widest">P. Café</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-black/50 min-h-[300px]">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-black uppercase tracking-widest text-sm">Pronto nuevas experiencias.</p>
          </div>
        )}
      </div>

      {/* Botón Inferior */}
      <div className={`p-4 border-t-[3px] ${borderColor} bg-white mt-auto`}>
        <button
          onClick={() => currentEvent && navigate(`/inscripcion/${currentEvent._id.substring(0, 8)}`)}
          disabled={!currentEvent}
          className={`w-full py-4 border-[3px] ${borderColor} bg-black text-white font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:bg-yellow-100 hover:text-black transition-all ${buttonHover} rounded-none disabled:opacity-50`}
        >
          Me Apunto
        </button>
      </div>

    </div>
  );
}
