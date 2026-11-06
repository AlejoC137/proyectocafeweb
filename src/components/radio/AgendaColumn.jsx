import React from 'react';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgendaColumn({ currentEvent, agendaEvents = [], eventCarouselIdx = 0, setEventCarouselIdx }) {
  const navigate = useNavigate();
  const borderColor = "border-[#1F2937] dark:border-slate-700";
  const shadowColor = "shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] dark:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.4)]";
  const buttonHover = "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";

  return (
    <div className={`w-full flex-col flex border-[2.5px] ${borderColor} bg-white dark:bg-[#161722] text-black dark:text-white rounded-none ${shadowColor} transition-colors`}>

      {/* Header Cartelera Compacto */}
      <div className={`px-3 py-1.5 border-b-[2.5px] ${borderColor} bg-white dark:bg-[#1e1f2e] flex items-center justify-between`}>
        <h3 className="font-black uppercase tracking-wider text-base lg:text-lg flex items-center gap-1.5 truncate text-black dark:text-white" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          <Ticket className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
          <span className="truncate">Próximos Eventos</span>
        </h3>
        <button
          onClick={() => navigate('/EventosOffer')}
          className={`px-2 py-0.5 bg-white dark:bg-[#12131C] text-black dark:text-white border ${borderColor} text-[9px] font-black uppercase transition-all flex-shrink-0 hover:bg-black hover:text-white`}
        >
          Ver Todo
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 bg-cream-bg dark:bg-[#0d0e15] relative overflow-hidden flex flex-col group transition-colors">
        {currentEvent ? (
          <>
            {/* Imagen del Evento */}
            <div className={`w-full border-b-[2px] ${borderColor} relative overflow-hidden bg-white dark:bg-[#12131C] group flex-shrink-0 max-h-[240px]`}>
              {currentEvent.bannerIMG ? (
                <img
                  src={currentEvent.bannerIMG}
                  alt={currentEvent.nombreES || 'Evento'}
                  className="w-full h-full max-h-[240px] block object-cover transition-all duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gray-200 dark:bg-slate-800">
                  <Calendar className="w-8 h-8 opacity-20 dark:text-white" />
                </div>
              )}
            </div>

            {/* Lista de Eventos Compacta */}
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[280px] custom-scrollbar bg-cream-bg dark:bg-[#0d0e15] divide-y divide-black/15 dark:divide-slate-800">
              {agendaEvents.map((evt, idx) => {
                const isSelected = idx === eventCarouselIdx;
                return (
                  <div
                    key={evt._id || idx}
                    className={`group cursor-pointer p-2.5 flex flex-col gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-yellow-50 dark:bg-[#1e1f2e] opacity-100'
                        : 'bg-transparent opacity-75 hover:opacity-100 hover:bg-white/60 dark:hover:bg-[#181926]'
                    }`}
                    onClick={() => setEventCarouselIdx && setEventCarouselIdx(idx)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-black uppercase leading-tight text-black dark:text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {evt.nombreES || evt.nombre}
                      </h4>
                      {evt.fecha && (
                        <span className="px-1.5 py-0.5 bg-yellow-300 text-black text-[9px] font-black uppercase shrink-0 border border-black/30">
                          {new Date(evt.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>

                    {(evt.descripcionES || evt.descripcion) && (
                      <p className="text-[11px] text-gray-600 dark:text-slate-400 line-clamp-2 leading-snug">
                        {evt.descripcionES || evt.descripcion}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-[#12131C] border border-black/20 dark:border-slate-700 text-[9px] font-bold uppercase text-black dark:text-gray-300">
                        <Clock className="w-2.5 h-2.5 text-amber-500" />
                        {evt.horaInicio || 'TBD'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-[#12131C] border border-black/20 dark:border-slate-700 text-[9px] font-bold uppercase text-black dark:text-gray-300">
                        <MapPin className="w-2.5 h-2.5 text-red-500" />
                        Proyecto Café
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-black/50 dark:text-white/50 min-h-[200px]">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-black uppercase tracking-widest text-xs">Pronto nuevas experiencias.</p>
          </div>
        )}
      </div>

      {/* Botón Inferior Compacto */}
      <div className={`p-2.5 border-t-[2px] ${borderColor} bg-white dark:bg-[#161722] mt-auto`}>
        <button
          onClick={() => currentEvent && navigate(`/inscripcion/${currentEvent._id.substring(0, 8)}`)}
          disabled={!currentEvent}
          className={`w-full py-2 border-[2px] ${borderColor} bg-black dark:bg-[#1DB954] text-white dark:text-black text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:opacity-90 transition-all ${buttonHover} rounded-none disabled:opacity-50`}
        >
          Me Apunto
        </button>
      </div>

    </div>
  );
}
