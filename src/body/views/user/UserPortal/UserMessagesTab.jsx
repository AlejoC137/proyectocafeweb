import React from "react";
import ContentCard from "@/components/ui/content-card";
import { Bell } from "lucide-react";

export function UserMessagesTab({
  messagesLoading,
  userMessages,
  handleMarkAsRead,
}) {
  return (
    <ContentCard title="Centro de Notificaciones" icon={<Bell className="text-purple-600" />} className="border-none shadow-xl">
      <div className="space-y-4 py-2">
        {messagesLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando mensajes...</div>
        ) : userMessages.length > 0 ? (
          userMessages.map((msg) => (
            <div
              key={msg._id}
              className={`p-6 rounded-3xl border transition-all ${
                msg.type === 'welcome' ? 'bg-emerald-50/50 border-emerald-100' :
                msg.type === 'promo' ? 'bg-amber-50/50 border-amber-100' :
                'bg-indigo-50/50 border-indigo-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    msg.type === 'welcome' ? 'bg-emerald-100 text-emerald-600' :
                    msg.type === 'promo' ? 'bg-amber-100 text-amber-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    <span className="text-lg">
                      {msg.type === 'welcome' ? '✨' : msg.type === 'promo' ? '🎁' : '💬'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{msg.title}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {new Date(msg.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {msg.userId === null && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Global</span>
                )}
                {!msg.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(msg._id)}
                    className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold hover:bg-blue-700 transition-colors"
                  >
                    Marcar como leído
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed pl-11">
                {msg.content}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
              <Bell className="opacity-10" size={32} />
            </div>
            <p className="font-bold text-lg">No tienes mensajes nuevos.</p>
            <p className="text-sm">Aquí verás anuncios, promociones y mensajes de bienvenida.</p>
          </div>
        )}
      </div>
    </ContentCard>
  );
}

export default UserMessagesTab;
