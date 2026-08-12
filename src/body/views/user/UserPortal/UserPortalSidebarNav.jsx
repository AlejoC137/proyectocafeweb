import React from "react";
import ContentCard from "@/components/ui/content-card";
import { TrendingUp, Calendar, Bell, Utensils, History, Settings, ChevronRight, QrCode, Gift, Heart } from "lucide-react";

export function UserPortalSidebarNav({
  activeTab,
  setActiveTab,
  userMessages,
  currentUser,
}) {
  const navItems = [
    { id: "overview", label: "Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "events", label: "Eventos", icon: <Calendar className="w-4 h-4" /> },
    {
      id: "messages", label: "Mensajes", icon: (
        <div className="relative">
          <Bell className="w-4 h-4" />
          {userMessages.some(m => !m.isRead) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          )}
        </div>
      )
    },
    { id: "diet", label: "Alimentación", icon: <Utensils className="w-4 h-4" /> },
    { id: "history", label: "Compras", icon: <History className="w-4 h-4" /> },
    { id: "settings", label: "Perfil", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="lg:col-span-1 space-y-6">
      <ContentCard className="p-2 border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <nav className="flex flex-col gap-1">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-sage-green text-white shadow-lg shadow-sage-green/30 translate-x-2"
                  : "text-gray-500 hover:bg-sage-green/5 hover:text-sage-green"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>
      </ContentCard>

      <div className="bg-gradient-to-br from-cobalt-blue to-blue-600 p-8 rounded-3xl text-white shadow-2xl overflow-hidden relative group cursor-pointer transition-transform hover:scale-[1.02]">
        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
          <QrCode size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Loyalty Card</span>
          </div>
          <p className="text-sm opacity-80 font-bold uppercase tracking-tighter">Puntos de Lealtad</p>
          <h2 className="text-5xl font-black mt-2 font-SpaceGrotesk">{currentUser.loyalty_points || 0}</h2>
          <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-end">
            <div>
              <p className="text-[10px] opacity-70 uppercase font-black">Tu saldo actual</p>
              <p className="text-xl font-black">
                ${new Intl.NumberFormat('es-CO').format((currentUser.loyalty_points || 0) * (parseInt(import.meta.env.VITE_POINTS_REDEMPTION_VALUE) || 1))} <span className="text-[10px] opacity-60">COP</span>
              </p>
            </div>
            <div className="animate-pulse">
              <Heart className="w-6 h-6 fill-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPortalSidebarNav;
