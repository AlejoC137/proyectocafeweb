import React from "react";
import ContentCard from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";
import { Calendar, Utensils, History, ChevronRight, Mail, Phone, MapPin } from "lucide-react";

export function UserOverviewTab({
  userMessages,
  userEvents,
  userSales,
  currentUser,
  setActiveTab,
  navigate,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Banner de Bienvenida o Mensaje Importante */}
      {userMessages.length > 0 && userMessages[0] && (
        <div
          onClick={() => setActiveTab("messages")}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1 rounded-3xl shadow-xl cursor-pointer hover:scale-[1.01] transition-all"
        >
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-[22px] text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl animate-bounce">
                <span className="text-2xl">
                  {userMessages[0].type === 'welcome' ? '✨' : userMessages[0].type === 'promo' ? '🎁' : '💬'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mensaje Reciente</p>
                <h3 style={{ fontFamily: "'First Bunny', sans-serif" }} className="text-xl font-bold font-SpaceGrotesk">{userMessages[0].title}</h3>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 opacity-50" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ContentCard title="Próximos Eventos" icon={<Calendar className="text-sage-green" />} className="h-full border-none shadow-lg">
          {userEvents.length > 0 ? (
            <div className="space-y-4 pt-2">
              {userEvents.slice(0, 3).map((reg) => (
                <div
                  key={reg._id}
                  onClick={() => navigate(`/EventosOffer?id=${reg.agenda?._id}`)}
                  className="flex justify-between items-center p-4 bg-sage-green/5 rounded-2xl border border-sage-green/10 hover:border-sage-green/30 transition-all cursor-pointer hover:scale-[1.01] shadow-sm"
                >
                  <div>
                    <p className="font-bold text-not-black">{reg.agenda?.nombreES || "Evento Especial"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-gray-400" />
                      <p className="text-[10px] text-gray-500 font-medium">{reg.agenda?.fecha || "Pendiente"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${
                    reg.estado_pago === 'pagado' || reg.estado_pago === 'gratis'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {reg.estado_pago}
                  </span>
                </div>
              ))}
              {userEvents.length > 3 && (
                <button onClick={() => setActiveTab("events")} className="group flex items-center justify-center gap-2 text-xs text-sage-green font-black hover:underline w-full py-2">
                  Ver todos los eventos <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                <Calendar className="opacity-20" size={32} />
              </div>
              <p className="font-medium">No tienes inscripciones activas.</p>
              <Button variant="link" onClick={() => navigate("/EventosOffer")} className="text-sage-green font-bold">Ver agenda de eventos</Button>
            </div>
          )}
        </ContentCard>

        <ContentCard title="Compras Recientes" icon={<History className="text-terracotta-accent" />} className="h-full border-none shadow-lg">
          {userSales.length > 0 ? (
            <div className="space-y-4 pt-2">
              {userSales.slice(0, 3).map((sale) => (
                <div key={sale._id} className="p-4 bg-terracotta-accent/5 border border-terracotta-accent/10 rounded-2xl hover:border-terracotta-accent/30 transition-all">
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-gray-600">{sale.Date}</span>
                    <span className="text-terracotta-accent font-black">$ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Utensils size={12} className="text-gray-400" />
                    <p className="text-[10px] text-gray-500 font-medium truncate">
                      {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin detalle"}
                    </p>
                  </div>
                </div>
              ))}
              <button onClick={() => setActiveTab("history")} className="group flex items-center justify-center gap-2 text-xs text-terracotta-accent font-black hover:underline w-full py-2">
                Ver historial de compras <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                <History className="opacity-20" size={32} />
              </div>
              <p className="font-medium">Aún no hay compras registradas.</p>
            </div>
          )}
        </ContentCard>
      </div>

      <ContentCard title="Resumen de Perfil" className="border-none shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group p-5 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all">
            <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5 text-sage-green" />
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Email</p>
            <p className="font-bold text-not-black truncate">{currentUser.email || 'No registrado'}</p>
          </div>
          <div className="group p-5 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all">
            <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5 text-sage-green" />
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Teléfono</p>
            <p className="font-bold text-not-black">{currentUser.phone || 'No registrado'}</p>
          </div>
          <div className="group p-5 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all md:col-span-2 lg:col-span-1">
            <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-sage-green" />
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Dirección</p>
            <p className="font-bold text-not-black truncate">{currentUser.address || 'No registrada'}</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-sage-green/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs font-bold text-gray-500">Cuenta Verificada</p>
          </div>
          <Button variant="ghost" onClick={() => setActiveTab("settings")} className="text-sage-green font-black gap-2">
            Editar Perfil <ChevronRight size={14} />
          </Button>
        </div>
      </ContentCard>
    </div>
  );
}

export default UserOverviewTab;
