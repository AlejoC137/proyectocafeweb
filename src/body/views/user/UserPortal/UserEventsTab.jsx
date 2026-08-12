import React from "react";
import ContentCard from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Utensils, Phone } from "lucide-react";

export function UserEventsTab({ userEvents, navigate }) {
  return (
    <ContentCard title="Mis Inscripciones a Eventos" className="border-none shadow-xl">
      <div className="space-y-6">
        {userEvents.length > 0 ? (
          userEvents.map((reg) => (
            <div
              key={reg._id}
              onClick={() => navigate(`/EventosOffer?id=${reg.agenda?._id}`)}
              className="flex flex-col md:flex-row gap-6 p-6 border rounded-3xl hover:border-sage-green/40 hover:shadow-lg transition-all group cursor-pointer"
            >
              {reg.agenda?.bannerIMG ? (
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 shadow-md">
                  <img src={reg.agenda.bannerIMG} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="Banner Evento" />
                </div>
              ) : (
                <div className="w-full md:w-48 h-32 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Calendar size={32} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-2xl text-not-black font-SpaceGrotesk">{reg.agenda?.nombreES || "Evento Especial"}</h3>
                  <span className={`text-[10px] px-4 py-1.5 rounded-full font-black tracking-widest ${
                    reg.estado_pago === 'pagado' || reg.estado_pago === 'gratis'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {reg.estado_pago.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2 font-bold"><Calendar size={18} className="text-sage-green" /> {reg.agenda?.fecha || 'Próximamente'}</p>
                  <p className="flex items-center gap-2 font-bold"><User size={18} className="text-sage-green" /> {reg.nombre}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {reg.dieta_especial && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black flex items-center gap-1 border border-emerald-100">
                      <Utensils size={10} /> DIETA: {reg.dieta_especial}
                    </span>
                  )}
                  {reg.telefono && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black flex items-center gap-1 border border-blue-100">
                      <Phone size={10} /> {reg.telefono}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 text-gray-400">
            <Calendar className="mx-auto mb-4 opacity-10" size={64} />
            <p className="font-bold text-lg">No tienes eventos registrados actualmente.</p>
            <Button onClick={() => navigate("/EventosOffer")} className="mt-4 bg-sage-green text-white font-bold">Ver próximos eventos</Button>
          </div>
        )}
      </div>
    </ContentCard>
  );
}

export default UserEventsTab;
