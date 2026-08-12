import React from "react";
import ContentCard from "@/components/ui/content-card";
import { History } from "lucide-react";

export function UserHistoryTab({ userSales }) {
  return (
    <ContentCard title="Historial Completo de Consumos" className="border-none shadow-xl">
      <div className="overflow-hidden rounded-3xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 font-black">
              <tr>
                <th className="px-6 py-5 tracking-widest leading-none">Fecha / Hora</th>
                <th className="px-6 py-5 tracking-widest leading-none">Ítems Consumidos</th>
                <th className="px-6 py-5 text-right tracking-widest leading-none">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {userSales.map((sale) => (
                <tr key={sale._id} className="hover:bg-sage-green/5 transition-colors group">
                  <td className="px-6 py-5 font-bold text-gray-600 whitespace-nowrap">{sale.Date}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-not-black max-w-sm">
                      {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin detalle"}
                    </p>
                    {sale.Mesa && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Servicio en {sale.Mesa}</span>}
                  </td>
                  <td className="px-6 py-5 text-right font-black text-sage-green text-lg">
                    $ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}
                  </td>
                </tr>
              ))}
              {userSales.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-gray-400">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                      <History className="opacity-10" size={32} />
                    </div>
                    <p className="font-bold">Aún no tienes movimientos registrados en el sistema.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ContentCard>
  );
}

export default UserHistoryTab;
