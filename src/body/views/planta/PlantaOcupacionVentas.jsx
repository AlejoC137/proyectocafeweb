import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2, 
  Sparkles, Sliders, ArrowUpRight, Scale, Clock, RefreshCw, 
  PieChart, Building2, Flame, UtensilsCrossed, HelpCircle
} from 'lucide-react';

export default function PlantaOcupacionVentas({
  analisisProductos = [],
  costosFijos = {},
  setCostosFijos,
  totalCostosFijosMes = 4850000,
  diasMes = 26,
  horasTurno = 8,
  eficienciaOEE = 0.85,
  ventasRealesDb = null,
  onRecargarVentas
}) {
  // Estado para modo de ventas: 'real' (cargado de la BD) o 'simulado' (ajuste manual del usuario)
  const [modoVentas, setModoVentas] = useState('simulado');
  
  // Venta diaria promedio configurable por el usuario (default basada en promedio real de Proyecto Café)
  const [ventaDiariaSimulada, setVentaDiariaSimulada] = useState(130000); // $130.000 COP/día (~$3.380.000 COP/mes)
  const [mostrarEditorGastos, setMostrarEditorGastos] = useState(false);

  // Venta diaria activa según el modo seleccionado
  const ventaDiariaActiva = useMemo(() => {
    if (modoVentas === 'real' && ventasRealesDb?.promedioDiario) {
      return ventasRealesDb.promedioDiario;
    }
    return ventaDiariaSimulada;
  }, [modoVentas, ventasRealesDb, ventaDiariaSimulada]);

  // Venta mensual activa
  const ventaMensualActiva = useMemo(() => {
    return ventaDiariaActiva * diasMes;
  }, [ventaDiariaActiva, diasMes]);

  // Margen de contribución promedio de los 10 productos de panadería y repostería
  const { margenContribucionPctPromedio, precioPromedioUnitario, costoVarUnitarioPromedio } = useMemo(() => {
    if (!analisisProductos || analisisProductos.length === 0) {
      return { margenContribucionPctPromedio: 0.65, precioPromedioUnitario: 12500, costoVarUnitarioPromedio: 4375 };
    }
    const totalPrecio = analisisProductos.reduce((sum, p) => sum + (p.precioVentaCOP || 0), 0);
    const totalCostoVar = analisisProductos.reduce((sum, p) => sum + (p.costoVarUnitario || 0), 0);
    const totalMargen = totalPrecio - totalCostoVar;

    const pct = totalPrecio > 0 ? totalMargen / totalPrecio : 0.65;
    const precioProm = totalPrecio / analisisProductos.length;
    const costoProm = totalCostoVar / analisisProductos.length;

    return {
      margenContribucionPctPromedio: pct,
      precioPromedioUnitario: Math.round(precioProm),
      costoVarUnitarioPromedio: Math.round(costoProm)
    };
  }, [analisisProductos]);

  // Capacidad Máxima Teórica de la Planta con los equipos del plano CAD
  // Si se reparte la producción equilibradamente entre los 10 productos
  const { 
    capacidadMaxUnidadesDia, 
    capacidadMaxVentasDia, 
    capacidadMaxVentasMes,
    capacidadMaxMargenMes
  } = useMemo(() => {
    if (!analisisProductos || analisisProductos.length === 0) {
      return { 
        capacidadMaxUnidadesDia: 120, 
        capacidadMaxVentasDia: 1500000, 
        capacidadMaxVentasMes: 39000000,
        capacidadMaxMargenMes: 25350000
      };
    }

    // Suma de la capacidad diaria de cada producto si se produce en un mix balanceado
    const totalCapacidadMix = analisisProductos.reduce((sum, p) => {
      return sum + (p.unidadesNetasTurno || 20);
    }, 0);

    // En un turno de 8h el horno y batidora pueden procesar en mix aproximadamente 90 a 140 unidades combinadas
    const unidadesMaxTurno = Math.round(totalCapacidadMix / 1.6);
    const ventasMaxDia = unidadesMaxTurno * precioPromedioUnitario;
    const ventasMaxMes = ventasMaxDia * diasMes;
    const margenMaxMes = ventasMaxMes * margenContribucionPctPromedio;

    return {
      capacidadMaxUnidadesDia: unidadesMaxTurno,
      capacidadMaxVentasDia: ventasMaxDia,
      capacidadMaxVentasMes: ventasMaxMes,
      capacidadMaxMargenMes: margenMaxMes
    };
  }, [analisisProductos, precioPromedioUnitario, diasMes, margenContribucionPctPromedio]);

  // Cálculos del Punto de Equilibrio (Break-Even)
  const costoFijoDiario = totalCostosFijosMes / (diasMes || 1);
  const ventasPuntoEquilibrioMes = totalCostosFijosMes / (margenContribucionPctPromedio || 0.65);
  const ventasPuntoEquilibrioDia = ventasPuntoEquilibrioMes / (diasMes || 1);
  const unidadesPuntoEquilibrioDia = Math.ceil(ventasPuntoEquilibrioDia / (precioPromedioUnitario || 12500));

  // Métricas del Escenario Actual (Ventas Hoy)
  const unidadesVendidasDiaHoy = Math.round(ventaDiariaActiva / (precioPromedioUnitario || 12500));
  const costoVarMensualHoy = ventaMensualActiva * (1 - margenContribucionPctPromedio);
  const margenContribucionMensualHoy = ventaMensualActiva * margenContribucionPctPromedio;
  const utilidadNetaMensualHoy = margenContribucionMensualHoy - totalCostosFijosMes;
  const brechaPuntoEquilibrioMes = ventaMensualActiva - ventasPuntoEquilibrioMes;
  const diasParaPagarGastos = margenContribucionMensualHoy > 0 
    ? ((totalCostosFijosMes / (margenContribucionMensualHoy / diasMes))).toFixed(1)
    : 'N/A';

  // % de Ocupación actual de la planta
  const porcentajeOcupacion = Math.min(100, Math.max(1, Math.round((unidadesVendidasDiaHoy / capacidadMaxUnidadesDia) * 100)));
  const porcentajeCapacidadLibre = Math.max(0, 100 - porcentajeOcupacion);

  // Cuánto Más Puedo Producir (Capacidad Ociosa en %, Unidades y Plata)
  const unidadesAdicionalesDia = Math.max(0, capacidadMaxUnidadesDia - unidadesVendidasDiaHoy);
  const unidadesAdicionalesMes = unidadesAdicionalesDia * diasMes;
  const plataAdicionalVentasMes = Math.max(0, capacidadMaxVentasMes - ventaMensualActiva);
  // Como los costos fijos (arriendo y empleado) ya están pagados, cada peso adicional aporta 100% de su margen de contribución:
  const utilidadAdicionalMes = plataAdicionalVentasMes * margenContribucionPctPromedio;
  const factorMultiplicadorCrecimiento = (capacidadMaxVentasMes / (ventaMensualActiva || 1)).toFixed(1);

  // Escenarios para la Matriz de Proyección
  const escenarios = [
    {
      id: 'actual',
      nombre: '1. Ventas Hoy (Proyecto Café)',
      subtitulo: 'Volumen actual despachado',
      ocupacionPct: porcentajeOcupacion,
      unidadesDia: unidadesVendidasDiaHoy,
      ventasDia: ventaDiariaActiva,
      ventasMes: ventaMensualActiva,
      gastosFijos: totalCostosFijosMes,
      costoVarMes: costoVarMensualHoy,
      utilidadNeta: utilidadNetaMensualHoy,
      color: utilidadNetaMensualHoy >= 0 ? 'bg-emerald-50 border-emerald-600 text-emerald-950' : 'bg-red-50 border-red-600 text-red-950',
      badge: utilidadNetaMensualHoy >= 0 ? 'En Ganancia' : 'Déficit Planta'
    },
    {
      id: 'breakeven',
      nombre: '2. Punto de Equilibrio (Break-Even)',
      subtitulo: 'Arriendo + Empleado 100% Cubiertos',
      ocupacionPct: Math.round((unidadesPuntoEquilibrioDia / capacidadMaxUnidadesDia) * 100),
      unidadesDia: unidadesPuntoEquilibrioDia,
      ventasDia: ventasPuntoEquilibrioDia,
      ventasMes: ventasPuntoEquilibrioMes,
      gastosFijos: totalCostosFijosMes,
      costoVarMes: ventasPuntoEquilibrioMes * (1 - margenContribucionPctPromedio),
      utilidadNeta: 0,
      color: 'bg-blue-50 border-blue-600 text-blue-950',
      badge: 'Meta Supervivencia'
    },
    {
      id: 'optimo',
      nombre: '3. Meta Crecimiento (65% Ocupación)',
      subtitulo: 'Vitrinas café + Pedidos B2B / Eventos',
      ocupacionPct: 65,
      unidadesDia: Math.round(capacidadMaxUnidadesDia * 0.65),
      ventasDia: capacidadMaxVentasDia * 0.65,
      ventasMes: capacidadMaxVentasMes * 0.65,
      gastosFijos: totalCostosFijosMes,
      costoVarMes: (capacidadMaxVentasMes * 0.65) * (1 - margenContribucionPctPromedio),
      utilidadNeta: (capacidadMaxVentasMes * 0.65 * margenContribucionPctPromedio) - totalCostosFijosMes,
      color: 'bg-amber-50 border-amber-600 text-amber-950',
      badge: 'Escenario Recomendado'
    },
    {
      id: 'maximo',
      nombre: '4. Capacidad Máxima (100% Planta CAD)',
      subtitulo: 'Techo físico total de hornos y batidoras',
      ocupacionPct: 100,
      unidadesDia: capacidadMaxUnidadesDia,
      ventasDia: capacidadMaxVentasDia,
      ventasMes: capacidadMaxVentasMes,
      gastosFijos: totalCostosFijosMes,
      costoVarMes: capacidadMaxVentasMes * (1 - margenContribucionPctPromedio),
      utilidadNeta: capacidadMaxMargenMes - totalCostosFijosMes,
      color: 'bg-purple-50 border-purple-600 text-purple-950',
      badge: 'Techo Físico (100%)'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Banner Superior de Diagnóstico Financiero Ejecutivo */}
      <div className="bg-white border-2 border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                Análisis de Viabilidad & Capacidad
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                utilidadNetaMensualHoy >= 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-700' : 'bg-red-100 text-red-800 border-red-700'
              }`}>
                {utilidadNetaMensualHoy >= 0 ? '✓ Gastos Cubiertos' : '⚠ Por Debajo del Punto de Equilibrio'}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 mt-1">
              ¿Cuánto Vendo Hoy vs Cuánto Necesito para Pagar la Planta (Arriendo + Empleado)?
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Comparativa matemática en tiempo real entre tus ventas de Proyecto Café, los costos fijos del obrador y el porcentaje de ocupación física de los equipos.
            </p>
          </div>

          {/* Selector de Modo de Ventas */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 border border-black shrink-0">
            <span className="text-[10px] font-bold uppercase text-gray-600">Fuente de Ventas:</span>
            <button
              onClick={() => setModoVentas('simulado')}
              className={`px-2.5 py-1 text-xs font-bold border transition-all ${
                modoVentas === 'simulado'
                  ? 'bg-[#f97316] text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Simulación Libre
            </button>
            <button
              onClick={() => {
                setModoVentas('real');
                if (onRecargarVentas) onRecargarVentas();
              }}
              className={`px-2.5 py-1 text-xs font-bold border transition-all flex items-center gap-1 ${
                modoVentas === 'real'
                  ? 'bg-emerald-600 text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              BD Ventas Café
            </button>
          </div>
        </div>

        {/* 4 Tarjetas Clave: Ventas Hoy, Gastos Planta, Punto Equilibrio, Ocupación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {/* Card 1: Ventas Hoy */}
          <div className="bg-[#faf8f5] p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase">
              <span>Ventas Hoy en Café</span>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900 mt-1">
              ${Math.round(ventaMensualActiva).toLocaleString('es-CO')} <span className="text-xs font-normal text-gray-500">/mes</span>
            </div>
            <div className="text-[11px] text-gray-600 font-mono mt-0.5">
              ${Math.round(ventaDiariaActiva).toLocaleString('es-CO')} / día (~{unidadesVendidasDiaHoy} piezas/día)
            </div>
          </div>

          {/* Card 2: Gastos Fijos Planta */}
          <div className="bg-red-50/70 p-3 border-2 border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,0.3)]">
            <div className="flex items-center justify-between text-xs font-bold text-red-800 uppercase">
              <span>Gastos Fijos Planta</span>
              <Building2 className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-red-700 mt-1">
              ${Math.round(totalCostosFijosMes).toLocaleString('es-CO')} <span className="text-xs font-normal text-red-600">/mes</span>
            </div>
            <div className="text-[11px] text-red-800 font-mono mt-0.5">
              Arriendo ${(costosFijos.arriendo10m2 || 1200000).toLocaleString('es-CO')} + Empleado ${(costosFijos.nominaPanaderoPastelero || 2200000).toLocaleString('es-CO')}
            </div>
          </div>

          {/* Card 3: Punto de Equilibrio */}
          <div className="bg-blue-50/70 p-3 border-2 border-blue-600 shadow-[2px_2px_0px_0px_rgba(37,99,235,0.3)]">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase">
              <span>Punto de Equilibrio</span>
              <Scale className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-xl md:text-2xl font-black text-blue-800 mt-1">
              ${Math.round(ventasPuntoEquilibrioMes).toLocaleString('es-CO')} <span className="text-xs font-normal text-blue-600">/mes</span>
            </div>
            <div className="text-[11px] text-blue-900 font-mono mt-0.5">
              Debes vender <b>${Math.round(ventasPuntoEquilibrioDia).toLocaleString('es-CO')} / día</b> ({unidadesPuntoEquilibrioDia} piezas)
            </div>
          </div>

          {/* Card 4: % Ocupación de Planta */}
          <div className="bg-emerald-50/70 p-3 border-2 border-emerald-600 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase">
              <span>% Ocupación de Planta</span>
              <PieChart className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-700 mt-1">
              {porcentajeOcupacion}% <span className="text-xs font-normal text-emerald-800">ocupada</span>
            </div>
            <div className="text-[11px] text-emerald-900 font-mono mt-0.5">
              Capacidad Libre: <b>{porcentajeCapacidadLibre}% ociosa</b> ({unidadesAdicionalesDia} uds/día)
            </div>
          </div>
        </div>

        {/* Barra Termómetro Visual: Ventas Hoy vs Punto de Equilibrio vs Capacidad Máxima */}
        <div className="mt-4 p-3 bg-gray-50 border border-black/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-gray-800">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              Termómetro de Capacidad & Cobertura de Gastos:
            </span>
            <span className="font-mono text-gray-600">
              Punto de Equilibrio: <b>${Math.round(ventasPuntoEquilibrioMes).toLocaleString('es-CO')} COP/mes</b>
            </span>
          </div>

          <div className="relative w-full h-8 bg-gray-200 border-2 border-black overflow-hidden flex">
            {/* Segmento Ventas Actuales */}
            <div 
              style={{ width: `${Math.min(100, (ventaMensualActiva / capacidadMaxVentasMes) * 100)}%` }}
              className={`h-full flex items-center justify-end pr-2 font-mono font-bold text-[10px] text-white transition-all ${
                utilidadNetaMensualHoy >= 0 ? 'bg-emerald-600' : 'bg-orange-600'
              }`}
            >
              Hoy: {porcentajeOcupacion}%
            </div>

            {/* Marcador Punto de Equilibrio */}
            <div 
              style={{ left: `${Math.min(98, (ventasPuntoEquilibrioMes / capacidadMaxVentasMes) * 100)}%` }}
              className="absolute inset-y-0 w-1 bg-blue-700 z-10"
              title="Punto de Equilibrio (Cubre 100% de costos fijos)"
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>$0 (Sin ventas)</span>
            <span className="text-blue-700 font-bold">▲ Meta de Equilibrio: ${Math.round(ventasPuntoEquilibrioMes / 1000000)}M COP</span>
            <span className="text-purple-700 font-bold">Techo Máximo CAD: ${Math.round(capacidadMaxVentasMes / 1000000)}M COP/mes</span>
          </div>

          {/* Diagnóstico de la Brecha */}
          <div className={`p-2 border text-xs font-bold flex items-center justify-between ${
            brechaPuntoEquilibrioMes >= 0
              ? 'bg-emerald-100/90 text-emerald-900 border-emerald-500'
              : 'bg-red-100/90 text-red-900 border-red-500'
          }`}>
            <div className="flex items-center gap-1.5">
              {brechaPuntoEquilibrioMes >= 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>
                {brechaPuntoEquilibrioMes >= 0
                  ? `¡Felicidades! Superas el punto de equilibrio por $${Math.round(brechaPuntoEquilibrioMes).toLocaleString('es-CO')} COP/mes. Todo el arriendo y el empleado están 100% cubiertos.`
                  : `Te faltan $${Math.round(Math.abs(brechaPuntoEquilibrioMes)).toLocaleString('es-CO')} COP/mes ($${Math.round(Math.abs(ventasPuntoEquilibrioDia - ventaDiariaActiva)).toLocaleString('es-CO')}/día) para cubrir la totalidad del arriendo y el empleado.`
                }
              </span>
            </div>
            <span className="font-mono text-sm font-black whitespace-nowrap ml-2">
              Utilidad Neta: ${Math.round(utilidadNetaMensualHoy).toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN ESTRELLA: ¿CUÁNTO MÁS PUEDO PRODUCIR? (Capacidad Ociosa & Oportunidad) */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
          <Sparkles className="w-5 h-5 text-purple-700" />
          <h3 className="text-base md:text-lg font-black text-gray-900">
            Potencial Oculto: ¿Cuánto Más Puede Producir la Planta con los Equipos Actuales?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {/* 1. Margen en Porcentaje */}
          <div className="bg-white p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold text-gray-500 uppercase">Margen en Porcentaje</div>
            <div className="text-2xl md:text-3xl font-black text-purple-700 mt-1">
              +{porcentajeCapacidadLibre}% Libre
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-tight">
              Tu planta está al <b>{porcentajeOcupacion}% de uso</b>. Tienes margen para multiplicar tus ventas por <b>{factorMultiplicadorCrecimiento}x</b> sin pagar un solo peso más de arriendo ni comprar otro horno.
            </p>
          </div>

          {/* 2. Margen en Unidades */}
          <div className="bg-white p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold text-gray-500 uppercase">Margen en Unidades Físicas</div>
            <div className="text-2xl md:text-3xl font-black text-indigo-700 mt-1">
              +{unidadesAdicionalesDia} uds / día
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-tight">
              Hoy produces ~{unidadesVendidasDiaHoy} uds/día. La capacidad instalada de tu horno y batidora permite hornear hasta <b>{capacidadMaxUnidadesDia} uds/día</b> (+{unidadesAdicionalesMes.toLocaleString('es-CO')} uds/mes adicionales).
            </p>
          </div>

          {/* 3. Margen en Plata ($ COP) */}
          <div className="bg-white p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold text-gray-500 uppercase">Margen en Plata ($ COP)</div>
            <div className="text-2xl md:text-3xl font-black text-emerald-700 mt-1">
              +${Math.round(utilidadAdicionalMes).toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-tight">
              Utilidad neta mensual adicional libre. Como el arriendo ($1.2M) y la nómina ($2.2M) ya son fijos, <b>el {Math.round(margenContribucionPctPromedio * 100)}% de cada peso nuevo va directo al bolsillo</b>.
            </p>
          </div>
        </div>
      </div>

      {/* SIMULADOR INTERACTIVO RÁPIDO: Slider de Ventas Diarias */}
      <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/20">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-black uppercase text-gray-900">
              Simulador Deslizante: ¿Qué pasa si aumento mis ventas diarias?
            </h4>
          </div>
          <div className="font-mono text-sm font-black text-orange-700 bg-orange-50 px-2 py-0.5 border border-orange-300">
            Venta Simulada: ${Number(ventaDiariaSimulada).toLocaleString('es-CO')} COP / día
          </div>
        </div>

        <div>
          <input 
            type="range"
            min="40000"
            max={capacidadMaxVentasDia}
            step="10000"
            value={ventaDiariaSimulada}
            onChange={(e) => {
              setModoVentas('simulado');
              setVentaDiariaSimulada(Number(e.target.value));
            }}
            className="w-full accent-[#f97316] cursor-pointer h-2 bg-gray-200 rounded"
          />
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
            <span>$40.000 / día (Mínimo)</span>
            <span className="text-blue-700 font-bold">Punto Eq: ${Math.round(ventasPuntoEquilibrioDia).toLocaleString('es-CO')}</span>
            <span className="text-emerald-700 font-bold">Techo 100%: ${Math.round(capacidadMaxVentasDia).toLocaleString('es-CO')} / día</span>
          </div>
        </div>

        {/* Atajos rápidos de incremento */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">Probar escenario:</span>
          {[
            { label: 'Ventas de Hoy ($130k)', val: 130000 },
            { label: 'Punto Equilibrio ($290k)', val: Math.round(ventasPuntoEquilibrioDia) },
            { label: 'Doble de Ventas ($260k)', val: 260000 },
            { label: '50% Ocupación ($600k)', val: Math.round(capacidadMaxVentasDia * 0.5) },
            { label: 'Techo 100% ($1.2M)', val: Math.round(capacidadMaxVentasDia) }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setModoVentas('simulado');
                setVentaDiariaSimulada(item.val);
              }}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold border transition-colors ${
                Math.abs(ventaDiariaSimulada - item.val) < 5000
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-black'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* MATRIZ DE PROYECCIÓN: 4 ESCENARIOS COMPARATIVOS */}
      <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase">
              Matriz de Proyección Comparativa: 4 Escenarios de Planta
            </h3>
            <p className="text-xs text-gray-500">
              Compara desde tu situación hoy hasta el potencial de ventas a terceros o eventos especiales.
            </p>
          </div>
          <button
            onClick={() => setMostrarEditorGastos(!mostrarEditorGastos)}
            className="px-2.5 py-1 text-xs font-bold border border-black bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            {mostrarEditorGastos ? 'Ocultar Gastos' : 'Ajustar Gastos Planta'}
          </button>
        </div>

        {/* Panel Desplegable para Ajustar Arriendo y Empleado */}
        {mostrarEditorGastos && (
          <div className="p-3 mb-4 bg-amber-50/80 border border-amber-300 space-y-2 text-xs">
            <div className="font-black text-amber-950 uppercase text-[11px]">
              Ajustar Costos Fijos de la Planta (Arriendo, Empleado, Servicios):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block">Arriendo Planta (10m²):</label>
                <input 
                  type="number" 
                  value={costosFijos.arriendo10m2 || 1200000}
                  onChange={e => setCostosFijos && setCostosFijos({ ...costosFijos, arriendo10m2: Number(e.target.value) })}
                  className="w-full p-1 border border-black font-mono font-bold bg-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block">Nómina Panadero/Pastelero:</label>
                <input 
                  type="number" 
                  value={costosFijos.nominaPanaderoPastelero || 2200000}
                  onChange={e => setCostosFijos && setCostosFijos({ ...costosFijos, nominaPanaderoPastelero: Number(e.target.value) })}
                  className="w-full p-1 border border-black font-mono font-bold bg-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block">Servicios (Gas, Luz, BPM):</label>
                <input 
                  type="number" 
                  value={(costosFijos.gasPropanoPipetas || 350000) + (costosFijos.electricidadComercial || 450000) + (costosFijos.mantenimientoAseoBPM || 300000)}
                  onChange={e => {
                    const totalServ = Number(e.target.value);
                    if (setCostosFijos) {
                      setCostosFijos({
                        ...costosFijos,
                        gasPropanoPipetas: Math.round(totalServ * 0.32),
                        electricidadComercial: Math.round(totalServ * 0.41),
                        mantenimientoAseoBPM: Math.round(totalServ * 0.27)
                      });
                    }
                  }}
                  className="w-full p-1 border border-black font-mono font-bold bg-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabla Comparativa de Escenarios */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-gray-100 text-left">
                <th className="p-2 text-gray-900 font-black uppercase text-[10px]">Métrica / Concepto</th>
                {escenarios.map(esc => (
                  <th key={esc.id} className="p-2 border-l border-black/20 text-right">
                    <div className="font-black text-gray-900 text-[11px]">{esc.nombre}</div>
                    <span className="text-[8.5px] px-1 py-0.2 bg-black text-white rounded font-normal uppercase">
                      {esc.badge}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="p-2 font-bold text-gray-700 font-sans">% Ocupación de la Planta</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right font-black">
                    <span className={`px-1.5 py-0.5 rounded ${
                      esc.ocupacionPct <= 30 ? 'bg-orange-100 text-orange-800' :
                      esc.ocupacionPct <= 70 ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {esc.ocupacionPct}%
                    </span>
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="p-2 font-bold text-gray-700 font-sans">Producción Diaria (Piezas)</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right">
                    {esc.unidadesDia} uds / día
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="p-2 font-bold text-gray-700 font-sans">Producción Mensual ({diasMes} días)</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right">
                    {(esc.unidadesDia * diasMes).toLocaleString('es-CO')} uds
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50 bg-gray-50/50">
                <td className="p-2 font-bold text-gray-900 font-sans">(+) Ventas Diarias ($ COP)</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right font-bold">
                    ${Math.round(esc.ventasDia).toLocaleString('es-CO')}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50 bg-gray-50/50 font-bold">
                <td className="p-2 text-gray-900 font-sans">(+) Facturación Mensual</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right text-gray-900 font-black">
                    ${Math.round(esc.ventasMes).toLocaleString('es-CO')}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50 text-red-700">
                <td className="p-2 font-sans">(-) Costos Variables (Materia prima)</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right">
                    -${Math.round(esc.costoVarMes).toLocaleString('es-CO')}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50 text-red-700">
                <td className="p-2 font-sans">(-) Gastos Fijos (Arriendo + Nómina)</td>
                {escenarios.map(esc => (
                  <td key={esc.id} className="p-2 border-l border-black/10 text-right">
                    -${Math.round(esc.gastosFijos).toLocaleString('es-CO')}
                  </td>
                ))}
              </tr>

              <tr className="border-t-2 border-black font-black text-sm bg-gray-100">
                <td className="p-2 font-sans uppercase">(=) Utilidad Neta Mensual</td>
                {escenarios.map(esc => (
                  <td 
                    key={esc.id} 
                    className={`p-2 border-l border-black text-right font-mono ${
                      esc.utilidadNeta > 0 ? 'text-emerald-700 bg-emerald-50' : 
                      esc.utilidadNeta === 0 ? 'text-blue-700 bg-blue-50' : 
                      'text-red-700 bg-red-50'
                    }`}
                  >
                    ${Math.round(esc.utilidadNeta).toLocaleString('es-CO')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 font-bold text-gray-700 font-sans">Días para Pagar Costos Fijos</td>
                {escenarios.map(esc => {
                  const diasEq = esc.ventasMes > 0 
                    ? (esc.gastosFijos / ((esc.ventasMes * margenContribucionPctPromedio) / diasMes)).toFixed(1)
                    : 'N/A';
                  return (
                    <td key={esc.id} className="p-2 border-l border-black/10 text-right">
                      {diasEq > diasMes ? (
                        <span className="text-red-600 font-bold">No alcanza ({diasEq} d)</span>
                      ) : (
                        <span>Día {diasEq} del mes</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RECOMENDACIONES ESTRATÉGICAS DE PLANTA (Actionable Insights) */}
      <div className="bg-amber-50 border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2 text-xs">
        <span className="font-black text-amber-950 uppercase flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          Conclusiones y Plan de Acción para la Planta de Producción:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-gray-700 leading-relaxed">
          <div className="bg-white p-3 border border-amber-300">
            <span className="font-black text-amber-900 block mb-1">1. Meta Inmediata de Supervivencia</span>
            <p>
              El punto de equilibrio es vender <b>${Math.round(ventasPuntoEquilibrioDia).toLocaleString('es-CO')} COP/día</b> ({unidadesPuntoEquilibrioDia} pasteles/panes). Con eso cubres el 100% del arriendo ($1.2M) y la nómina ($2.2M) sin perder dinero.
            </p>
          </div>

          <div className="bg-white p-3 border border-amber-300">
            <span className="font-black text-amber-900 block mb-1">2. Monetizar el {porcentajeCapacidadLibre}% Libre</span>
            <p>
              El café por sí solo consume solo el {porcentajeOcupacion}% de la planta. Para rentabilizar el espacio, conviene abrir canales B2B: surtir a otros cafés o restaurantes aliados, venta corporativa de postres, o cajas de repostería para eventos.
            </p>
          </div>

          <div className="bg-white p-3 border border-amber-300">
            <span className="font-black text-amber-900 block mb-1">3. Apalancamiento Exponencial</span>
            <p>
              Al pasar del {porcentajeOcupacion}% al 65% de ocupación, la utilidad salta a <b>+${Math.round(capacidadMaxVentasMes * 0.65 * margenContribucionPctPromedio - totalCostosFijosMes).toLocaleString('es-CO')} COP/mes</b>, porque los gastos de planta no crecen; se mantienen fijos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
