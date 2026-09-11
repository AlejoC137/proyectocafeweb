import React from 'react';
import { Building2, UtensilsCrossed, BarChart3, Sliders, Scale, TrendingUp, Sparkles } from 'lucide-react';

export default function PlantaHeader({ activeTab, setActiveTab, utilidadNetaMensual }) {
  const tabs = [
    { id: 'resumen', label: '1. Tablero & Rendimientos', icon: BarChart3 },
    { id: 'cad', label: '2. Plano CAD & Equipos', icon: Building2 },
    { id: 'productos', label: '3. Los 10 Productos Top', icon: UtensilsCrossed },
    { id: 'ocupacion', label: '4. Ventas Hoy vs Gastos & Ocupación', icon: TrendingUp },
    { id: 'simulador', label: '5. Simulador Financiero', icon: Sliders },
    { id: 'contexto', label: '6. Business Context & Dossier IA', icon: Sparkles, highlight: true }
  ];

  return (
    <div className="bg-white border-2 border-black p-2.5 md:p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 bg-[#f97316] text-white font-bold text-[11px] uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Ingeniería de Producción
            </span>
            <span className="px-2 py-0.5 bg-[#10b981] text-white font-bold text-[11px] uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              CAD / BIM 3.2m × 3.1m
            </span>
            <span className="px-2 py-0.5 bg-purple-600 text-white font-bold text-[11px] uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Panadería + Repostería
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Planta de Producción: Panadería & Repostería
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Dimensionamiento físico de equipos, cuellos de botella (TOC) y viabilidad financiera.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#f4ece1] p-1.5 px-2.5 border-2 border-black shrink-0">
          <Scale className="w-5 h-5 text-[#f97316]" />
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-gray-600 leading-none">Utilidad Neta Proyectada</div>
            <div className="text-base md:text-lg font-black text-green-700 leading-tight">
              ${Math.round(utilidadNetaMensual || 0).toLocaleString('es-CO')} <span className="text-[10px] font-normal text-gray-600">/mes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-black/15">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 border-black transition-all ${
                isSelected 
                  ? 'bg-[#f97316] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
