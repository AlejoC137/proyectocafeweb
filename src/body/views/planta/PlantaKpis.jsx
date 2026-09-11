import React, { useState } from 'react';
import { UtensilsCrossed, DollarSign, Clock, TrendingUp, ChevronRight } from 'lucide-react';

export default function PlantaKpis({ 
  mixProduccion, 
  horasTurno, 
  eficienciaOEE, 
  costoFijoPorDia, 
  totalCostosFijosMes, 
  diasMes, 
  analisisProductos, 
  onSelectProducto,
  onNavigateToOcupacion
}) {
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  const productosFiltrados = (analisisProductos || []).filter(p => {
    if (filtroCategoria === 'TODOS') return true;
    return p.categoria === filtroCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Producción Diaria (Mix)</span>
            <UtensilsCrossed className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl md:text-3xl font-black mt-2">
            {mixProduccion.unidadesTotales || 0} <span className="text-sm font-medium text-gray-500">uds / día</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Turno de {horasTurno} horas • OEE al {Math.round((eficienciaOEE || 0.85) * 100)}%
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Facturación Diaria</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black mt-2 text-green-700">
            ${(mixProduccion.ingresoDiarioTotal || 0).toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${(mixProduccion.ingresoMensual || 0).toLocaleString('es-CO')} / mes ({diasMes} días)
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Costos Fijos Operativos</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black mt-2 text-red-600">
            ${Math.round(costoFijoPorDia || 0).toLocaleString('es-CO')} <span className="text-xs font-medium text-gray-500">/ día</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${(totalCostosFijosMes || 0).toLocaleString('es-CO')} / mes (Arriendo, nómina, gas, luz)
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Punto de Equilibrio</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black mt-2 text-blue-700">
            {mixProduccion.diasBreakEven || 0} <span className="text-sm font-medium text-gray-500">días / mes</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            A partir del día {Math.ceil(Number(mixProduccion.diasBreakEven || 0))} todo es margen libre
          </div>
        </div>
      </div>

      {/* Banner Ejecutivo: Ventas Hoy vs Gastos de Planta */}
      {onNavigateToOcupacion && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 border-2 border-black p-5 text-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-black/30 border border-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-emerald-300">
              📊 Análisis de Capacidad Ociosa & Punto de Equilibrio
            </div>
            <h3 className="text-lg md:text-xl font-black tracking-tight">
              ¿Cuánto vendes hoy vs cuánto necesitas para pagar Arriendo y Nómina?
            </h3>
            <p className="text-xs md:text-sm text-emerald-100 max-w-2xl">
              Proyecto Café hoy ocupa el <span className="font-black text-amber-300">~22% de la planta</span>. Tienes un <span className="font-black text-emerald-300">~78% de capacidad libre</span> para vender a restaurantes, eventos o vitrinas B2B y multiplicar tu utilidad neta.
            </p>
          </div>
          <button
            onClick={onNavigateToOcupacion}
            className="shrink-0 px-5 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black border-2 border-black font-black text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[2px] active:translate-y-[2px]"
          >
            <span>Ver Comparativa & Proyecciones</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tarjeta Destacada: Tarta Vasca */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#f97316] text-white flex items-center justify-center font-bold text-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              🍰
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black">
                Análisis Focalizado: ¿Cuántas Tartas Vascas produce esta Planta de 10 m²?
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                Dimensionamiento físico exacto según tu horno doble cámara (70x85 cm) y batidora planetaria de 6 Litros.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const tv = (analisisProductos || []).find(p => p.id === 'tarta-basca');
              if (tv) onSelectProducto(tv);
            }}
            className="px-4 py-2 bg-white border-2 border-black font-bold text-xs uppercase hover:bg-orange-100 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Ver Ficha Técnica Completa <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-black/10">
          <div className="bg-white p-3 border border-black">
            <div className="text-xs text-gray-500 font-bold uppercase">Por Hornada (2 Cámaras)</div>
            <div className="text-xl font-black text-gray-800 mt-1">8 Tartas Vascas</div>
            <div className="text-xs text-gray-500">4 moldes Ø20 cm por nivel refractario</div>
          </div>

          <div className="bg-white p-3 border border-black">
            <div className="text-xs text-gray-500 font-bold uppercase">Tanda Batidora (6 Litros)</div>
            <div className="text-xl font-black text-blue-600 mt-1">4 Tartas Vascas</div>
            <div className="text-xs text-gray-500">~3.8 kg mezcla por batido de 15 min</div>
          </div>

          <div className="bg-white p-3 border border-black">
            <div className="text-xs text-gray-500 font-bold uppercase">Capacidad Máx. Turno 8h</div>
            <div className="text-xl font-black text-[#f97316] mt-1">64 a 72 Tartas / día</div>
            <div className="text-xs text-gray-500">Dedicando 100% de la planta a este producto</div>
          </div>

          <div className="bg-white p-3 border border-black">
            <div className="text-xs text-gray-500 font-bold uppercase">Margen por Tarta ($15.000)</div>
            <div className="text-xl font-black text-green-700 mt-1">$10.000 COP (67%)</div>
            <div className="text-xs text-gray-500">Costo insumos: $4.300 + Empaque: $700</div>
          </div>
        </div>
      </div>

      {/* Tabla Resumen de Rendimiento de los 10 Productos */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">
              Matriz de Rendimientos y Techos de Producción Diaria (10 Productos)
            </h3>
            <p className="text-xs text-gray-500">
              Capacidad calculada según el cuello de botella físico de cada equipo en el plano de 3.2m × 3.1m.
            </p>
          </div>

          <div className="flex gap-2">
            {['TODOS', 'PANADERIA', 'REPOSTERIA'].map(cat => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`px-3 py-1 text-xs font-bold border border-black ${
                  filtroCategoria === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black text-xs font-black uppercase text-gray-700">
              <th className="p-3">Producto</th>
              <th className="p-3">Grupo</th>
              <th className="p-3 text-right">Precio Venta</th>
              <th className="p-3 text-right">Costo Insumo</th>
              <th className="p-3 text-right">Margen Bruto</th>
              <th className="p-3 text-center">Batch Horno</th>
              <th className="p-3">Cuello de Botella</th>
              <th className="p-3 text-right">Techo 8h (Uds)</th>
              <th className="p-3 text-right">Utilidad Máx/Día</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {productosFiltrados.map((p) => (
              <tr 
                key={p.id}
                onClick={() => onSelectProducto(p)}
                className="hover:bg-amber-50/60 cursor-pointer transition-colors"
              >
                <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-base">{p.categoria === 'REPOSTERIA' ? '🍰' : '🥐'}</span>
                  {p.nombre}
                </td>
                <td className="p-3 text-xs">
                  <span className={`px-2 py-0.5 font-bold ${
                    p.categoria === 'REPOSTERIA' ? 'bg-pink-100 text-pink-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.categoria}
                  </span>
                </td>
                <td className="p-3 text-right font-bold">${(p.precioVentaCOP || 0).toLocaleString('es-CO')}</td>
                <td className="p-3 text-right text-gray-600">${(p.costoVarUnitario || 0).toLocaleString('es-CO')}</td>
                <td className="p-3 text-right font-bold text-green-700">
                  {p.margenPorcentaje || 0}% <span className="text-xs text-gray-500 font-normal">(${(p.margenUnitarioCOP || 0).toLocaleString('es-CO')})</span>
                </td>
                <td className="p-3 text-center font-mono">{p.unidadesPorHorneada || 0} uds</td>
                <td className="p-3 text-xs text-orange-700 font-semibold">{p.equipoLimitante}</td>
                <td className="p-3 text-right font-black text-gray-900">{p.unidadesNetasTurno || 0} uds</td>
                <td className="p-3 text-right font-black text-green-700">
                  ${(p.margenContribucionTurnoCOP || 0).toLocaleString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
