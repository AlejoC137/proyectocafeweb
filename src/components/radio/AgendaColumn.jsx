import React from 'react';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgendaColumn({ currentEvent, agendaEvents = [], eventCarouselIdx = 0, setEventCarouselIdx }) {
  const navigate = useNavigate();
  const borderColor = "border-[#1F2937]";
  const shadowColor = "shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  return (
    <div className={`w-full flex-col flex border-[3px] ${borderColor} bg-white rounded-none ${shadowColor}`}>

      {/* Header Cartelera */}
      <div className={`px-3 py-2 border-b-[3px] border-[#1F2937] bg-white bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.15)_4px,rgba(31,41,55,0.15)_5px)] flex items-center justify-between`}>
        <h3 className="font-black uppercase tracking-widest text-xl lg:text-2xl flex items-center gap-2 mt-1 truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          <Ticket className="w-4 h-4 -mt-1 flex-shrink-0" /> <span className="truncate">Próximos Eventos</span>
        </h3>
        <button onClick={() => navigate('/EventosOffer')}
          className={`px-1.5 py-0.5 bg-white text-black border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] ${buttonHover} text-[8px] leading-none font-black uppercase transition-all flex-shrink-0`}
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
                const hatchBg = "bg-white bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(31,41,55,0.1)_4px,rgba(31,41,55,0.1)_5px)]";
                return (
                  <div key={evt._id || idx} className={`group cursor-pointer p-4 border-b-[3px] ${borderColor} flex gap-4 transition-colors ${isSelected ? `${hatchBg} opacity-100` : `bg-transparent opacity-60 hover:opacity-100 hover:${hatchBg}`}`}
                    onClick={() => setEventCarouselIdx && setEventCarouselIdx(idx)}>

                    {/* Columna Izquierda: Título y Badges */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <h4 className={`text-xl font-bold uppercase leading-none tracking-tighter mb-4 transition-all text-black ${isSelected ? '[text-shadow:1px_1px_0px_#FF0000]' : 'group-hover:[text-shadow:1.5px_1.5px_0px_#FF0000]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {evt.nombreES || evt.nombre}
                      </h4>

                      <div className="flex flex-wrap gap-2 w-full mt-auto">
                        <div className={`flex items-center gap-1 border-[2px] px-2 py-1 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-colors bg-white border-[#1F2937] text-black`}>
                          <Clock className={`w-3 h-3 transition-colors text-black ${isSelected ? 'drop-shadow-[0.7px_0.7px_0px_#FF0000]' : 'group-hover:drop-shadow-[0.7px_0.7px_0px_#FF0000]'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest transition-all text-black ${isSelected ? '[text-shadow:0.7px_0.7px_0px_#FF0000]' : 'group-hover:[text-shadow:0.7px_0.7px_0px_#FF0000]'}`}>{evt.horaInicio || 'TBD'}</span>
                        </div>
                        <div className={`flex items-center gap-1 border-[2px] px-2 py-1 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-colors bg-white border-[#1F2937] text-black`}>
                          <MapPin className={`w-3 h-3 transition-colors text-black ${isSelected ? 'drop-shadow-[0.7px_0.7px_0px_#FF0000]' : 'group-hover:drop-shadow-[0.7px_0.7px_0px_#FF0000]'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest transition-all text-black ${isSelected ? '[text-shadow:0.7px_0.7px_0px_#FF0000]' : 'group-hover:[text-shadow:0.7px_0.7px_0px_#FF0000]'}`}>Proyecto Café</span>
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Descripción (si existe) */}
                    {(evt.descripcionES || evt.descripcion) && (
                      <div className={`w-2/5 flex-shrink-0 border-l-[3px] ${borderColor} pl-4 flex items-center`}>
                        <p className={`text-[11px] lg:text-xs font-bold leading-tight line-clamp-4 transition-colors text-black`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {evt.descripcionES || evt.descripcion}
                        </p>
                      </div>
                    )}
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
