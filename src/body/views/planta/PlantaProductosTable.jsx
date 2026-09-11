import React from 'react';
import { Layers } from 'lucide-react';

export default function PlantaProductosTable({ 
  analisisProductos = [], 
  productoSeleccionado, 
  setProductoSeleccionado, 
  horasTurno = 8 
}) {
  // Asegurar que productoSeleccionado sea el objeto enriquecido de analisisProductos
  const prod = analisisProductos.find(p => p.id === productoSeleccionado?.id) || analisisProductos[0] || productoSeleccionado || {};

  const precioVenta = prod.precioVentaCOP || 0;
  const costoMateriaPrima = prod.costoMateriaPrimaCOP || 0;
  const costoEmpaque = prod.costoEmpaqueCOP || 0;
  const costoVarUnitario = prod.costoVarUnitario || (costoMateriaPrima + costoEmpaque);
  const margenUnitario = prod.margenUnitarioCOP ?? (precioVenta - costoVarUnitario);
  const margenPorc = prod.margenPorcentaje ?? (precioVenta > 0 ? Math.round((margenUnitario / precioVenta) * 100) : 0);
  const unidadesNetas = prod.unidadesNetasTurno || 0;
  const margenTurno = prod.margenContribucionTurnoCOP || (unidadesNetas * margenUnitario);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Lista lateral de selección */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase text-gray-600 mb-2">Selecciona un Producto</div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {analisisProductos.map(p => {
              const isSel = prod.id === p.id;
              const pMargen = p.margenPorcentaje ?? 0;
              return (
                <div
                  key={p.id}
                  onClick={() => setProductoSeleccionado(p)}
                  className={`p-2.5 border-2 border-black cursor-pointer transition-all flex items-center justify-between ${
                    isSel ? 'bg-[#f97316] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-orange-50 text-gray-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{p.nombre}</div>
                    <div className={`text-[10px] font-mono ${isSel ? 'text-white/80' : 'text-gray-500'}`}>
                      {p.categoria} • ${(p.precioVentaCOP || 0).toLocaleString('es-CO')}
                    </div>
                  </div>
                  <span className={`text-xs font-black px-1.5 py-0.5 border border-black ${
                    isSel ? 'bg-white text-black' : 'bg-green-100 text-green-800'
                  }`}>
                    {pMargen}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ficha técnica del producto seleccionado */}
      <div className="lg:col-span-8 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold border border-black ${
                prod.categoria === 'REPOSTERIA' ? 'bg-pink-200 text-pink-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {prod.categoria || 'PRODUCTO'}
              </span>
              <span className="text-xs font-mono text-gray-500">Peso aprox: {prod.pesoGramo || 0}g</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mt-1">{prod.nombre || 'Producto'}</h2>
            <p className="text-xs text-gray-600 mt-0.5">{prod.descripcion || ''}</p>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-gray-500 uppercase">Precio en Vitrina</div>
            <div className="text-2xl font-black text-gray-900">
              ${precioVenta.toLocaleString('es-CO')}
            </div>
          </div>
        </div>

        {/* Métricas Financieras Unitarias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 p-3 border border-black">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Materia Prima (BOM)</div>
            <div className="text-lg font-black text-gray-900">
              ${costoMateriaPrima.toLocaleString('es-CO')}
            </div>
          </div>

          <div className="bg-gray-50 p-3 border border-black">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Empaque & Insumos</div>
            <div className="text-lg font-black text-gray-900">
              ${costoEmpaque.toLocaleString('es-CO')}
            </div>
          </div>

          <div className="bg-green-50 p-3 border border-green-600 text-green-950">
            <div className="text-[10px] font-bold uppercase">Margen Bruto Unitario</div>
            <div className="text-lg font-black text-green-700">
              ${margenUnitario.toLocaleString('es-CO')}
            </div>
          </div>

          <div className="bg-green-50 p-3 border border-green-600 text-green-950">
            <div className="text-[10px] font-bold uppercase">Rentabilidad Bruta</div>
            <div className="text-lg font-black text-green-700">
              {margenPorc}%
            </div>
          </div>
        </div>

        {/* Flujo de Proceso en Planta */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#f97316]" />
            Ruta de Fabricación en la Planta (3.2m × 3.1m)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200">
              <div className="font-bold text-blue-900 flex items-center gap-1 mb-1">
                <span>1. Batido / Amasado</span>
              </div>
              <div>Equipo: <b>Batidora Planetaria 6L</b></div>
              <div>Tanda máx: <b>{prod.unidadesPorBatido || 0} uds</b></div>
              <div>Tiempo ciclo: <b>{prod.tiempoBatidoMin || 0} min</b></div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200">
              <div className="font-bold text-orange-900 flex items-center gap-1 mb-1">
                <span>2. Cocción / Horneado</span>
              </div>
              <div>Equipo: <b>Horno Doble Cámara Pizza</b></div>
              <div>Tanda máx: <b>{prod.unidadesPorHorneada || 0} uds</b></div>
              <div>Tiempo: <b>{prod.tiempoHorneadoMin || 0} min @ {prod.temperaturaHornoC || 180}°C</b></div>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200">
              <div className="font-bold text-cyan-900 flex items-center gap-1 mb-1">
                <span>3. Asentado / Frío</span>
              </div>
              <div>Equipo: <b>Nevera 70x70 / Mesón Inox</b></div>
              <div>Reposo: <b>{prod.tiempoEnfriadoMin || 0} min</b></div>
              <div>Merma estimada: <b>{Math.round((prod.mermaPorcentaje || 0) * 100)}%</b></div>
            </div>
          </div>
        </div>

        {/* Capacidad Diaria Monoproducto */}
        <div className="p-4 bg-[#fbf9f4] border-2 border-black">
          <div className="text-xs font-bold text-gray-600 uppercase mb-1">
            Potencial Diario Monoproducto (Turno de {horasTurno} horas)
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {unidadesNetas} unidades netas / día
            </div>
            <div className="text-sm md:text-base font-black text-green-700">
              Margen Diario: ${margenTurno.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Restricción crítica identificada: <b>{prod.equipoLimitante || 'Equipamiento en línea'}</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
