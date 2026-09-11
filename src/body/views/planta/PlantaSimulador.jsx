import React from 'react';
import { Sliders, TrendingUp, Info } from 'lucide-react';

export default function PlantaSimulador({
  horasTurno,
  setHorasTurno,
  eficienciaOEE,
  setEficienciaOEE,
  diasMes,
  setDiasMes,
  costosFijos,
  setCostosFijos,
  totalCostosFijosMes,
  costoFijoPorDia,
  mixProduccion
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controles de Simulación */}
        <div className="lg:col-span-5 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
            <Sliders className="w-5 h-5 text-[#f97316]" />
            <h3 className="text-lg font-black text-gray-900">Variables Operativas de Planta</h3>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Horas de Turno Diario</span>
              <span className="font-mono text-orange-600 font-black">{horasTurno} Horas</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="16" 
              step="1" 
              value={horasTurno} 
              onChange={e => setHorasTurno(Number(e.target.value))}
              className="w-full accent-[#f97316] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>4h (Medio turno)</span>
              <span>8h (Estándar)</span>
              <span>16h (Doble turno)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Eficiencia OEE (Disponibilidad × Rendimiento × Calidad)</span>
              <span className="font-mono text-green-600 font-black">{Math.round((eficienciaOEE || 0.85) * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.50" 
              max="0.98" 
              step="0.05" 
              value={eficienciaOEE} 
              onChange={e => setEficienciaOEE(Number(e.target.value))}
              className="w-full accent-[#10b981] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Días Laborales por Mes</span>
              <span className="font-mono text-blue-600 font-black">{diasMes} Días</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="30" 
              step="1" 
              value={diasMes} 
              onChange={e => setDiasMes(Number(e.target.value))}
              className="w-full accent-[#3b82f6] cursor-pointer"
            />
          </div>

          {/* Edición de Costos Fijos */}
          <div className="pt-4 border-t-2 border-black space-y-2">
            <div className="text-xs font-black uppercase text-gray-700">Costos Fijos Mensuales (COP)</div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Arriendo Planta (10 m²):</span>
                <input 
                  type="number" 
                  value={costosFijos.arriendo10m2} 
                  onChange={e => setCostosFijos({...costosFijos, arriendo10m2: Number(e.target.value)})}
                  className="w-28 text-right p-1 border border-black font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nómina Panadero/Pastelero:</span>
                <input 
                  type="number" 
                  value={costosFijos.nominaPanaderoPastelero} 
                  onChange={e => setCostosFijos({...costosFijos, nominaPanaderoPastelero: Number(e.target.value)})}
                  className="w-28 text-right p-1 border border-black font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gas Propano Pipetas:</span>
                <input 
                  type="number" 
                  value={costosFijos.gasPropanoPipetas} 
                  onChange={e => setCostosFijos({...costosFijos, gasPropanoPipetas: Number(e.target.value)})}
                  className="w-28 text-right p-1 border border-black font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Electricidad Comercial:</span>
                <input 
                  type="number" 
                  value={costosFijos.electricidadComercial} 
                  onChange={e => setCostosFijos({...costosFijos, electricidadComercial: Number(e.target.value)})}
                  className="w-28 text-right p-1 border border-black font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Aseo, BPM & Mantenimiento:</span>
                <input 
                  type="number" 
                  value={costosFijos.mantenimientoAseoBPM} 
                  onChange={e => setCostosFijos({...costosFijos, mantenimientoAseoBPM: Number(e.target.value)})}
                  className="w-28 text-right p-1 border border-black font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-black font-black text-sm text-red-600">
              <span>Total Costo Fijo Mes:</span>
              <span className="font-mono">${(totalCostosFijosMes || 0).toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Estado de Resultados Proyectado */}
        <div className="lg:col-span-7 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-black text-gray-900">Estado de Resultados: ¿Cuánto Vale vs Cuánto Produce?</h3>
            </div>
            <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 font-bold border border-green-800">
              Mix Multi-producto
            </span>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center p-2.5 bg-gray-50 border border-gray-300">
              <span className="font-bold text-gray-700">(+) Ingreso Bruto Mensual:</span>
              <span className="font-black text-base text-gray-900">
                ${(mixProduccion.ingresoMensual || 0).toLocaleString('es-CO')} COP
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-red-50/50 border border-red-200 text-red-900">
              <span>(-) Costos Variables (Materia Prima + Empaque):</span>
              <span className="font-bold">
                -${(mixProduccion.costoVarMensual || 0).toLocaleString('es-CO')} COP
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-amber-50 border border-amber-300 font-bold text-amber-950">
              <span>(=) Margen de Contribución Bruto:</span>
              <span className="font-black text-base">
                ${(mixProduccion.margenBrutoMensual || 0).toLocaleString('es-CO')} COP
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-red-50 border border-red-300 text-red-900">
              <span>(-) Costos Fijos de Operación (OPEX 10 m²):</span>
              <span className="font-bold">
                -${(totalCostosFijosMes || 0).toLocaleString('es-CO')} COP
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-green-100 border-2 border-black font-sans shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="text-xs font-black uppercase text-green-900">(=) Utilidad Operativa Neta Mensual</div>
                <div className="text-xs text-green-800 font-normal">Beneficio neto libre de gastos de planta</div>
              </div>
              <div className="text-2xl md:text-3xl font-black text-green-800 font-mono">
                ${(mixProduccion.utilidadNetaMensual || 0).toLocaleString('es-CO')} COP
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 text-xs text-orange-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1">
              <Info className="w-4 h-4 text-orange-600" />
              Conclusión de Ingeniería Económica:
            </div>
            <p>
              Tener la planta abierta cuesta <b>${(totalCostosFijosMes || 0).toLocaleString('es-CO')} COP/mes</b> (${Math.round(costoFijoPorDia || 0).toLocaleString('es-CO')} COP/día). 
              Operando a 1 solo turno de {horasTurno} horas y produciendo la canasta de vitrina ({mixProduccion.unidadesTotales || 0} piezas/día), 
              la planta genera <b>${(mixProduccion.margenBrutoDiario || 0).toLocaleString('es-CO')} COP de margen diario</b>, 
              lo que permite pagar los costos fijos en tan solo <b>{mixProduccion.diasBreakEven || 0} días</b> de trabajo al mes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
