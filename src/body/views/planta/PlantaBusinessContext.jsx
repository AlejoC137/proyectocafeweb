import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Building2, 
  TrendingUp, 
  Cpu, 
  DollarSign, 
  Wrench, 
  Utensils, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame,
  Clock,
  Scale
} from 'lucide-react';

export default function PlantaBusinessContext({
  equipos = [],
  dimensionesHabitacion = { ancho: 3.20, largo: 3.10 },
  analisisProductos = [],
  mixProduccion = {},
  ventasRealesDb = null,
  costosFijos = {},
  totalCostosFijosMes = 4850000,
  diasMes = 26,
  horasTurno = 8,
  eficienciaOEE = 0.85
}) {
  const [copiado, setCopiado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('resumen'); // 'resumen', 'maquinaria', 'recomendaciones', 'prompt'

  const anchoHab = Number(dimensionesHabitacion?.ancho || 3.20);
  const largoHab = Number(dimensionesHabitacion?.largo || 3.10);
  const areaTotalM2 = Number((anchoHab * largoHab).toFixed(2));

  // Datos financieros reales y proyectados
  const ventasHoyDiarias = ventasRealesDb?.promedioDiario || 130000;
  const ventasHoyMensual = ventasHoyDiarias * diasMes;

  const costoFijoDiario = Math.round(totalCostosFijosMes / diasMes);
  const breakEvenVentaDiaria = Math.round(costoFijoDiario / 0.65); // Estimando margen bruto promedio 65%
  const breakEvenVentaMensual = breakEvenVentaDiaria * diasMes;

  const capacidadMaximaDiariaCOP = mixProduccion?.ingresoDiarioTotal || 2400000;
  const capacidadMaximaMensualCOP = capacidadMaximaDiariaCOP * diasMes;

  const porcentajeOcupacionActual = Math.min(100, Math.round((ventasHoyDiarias / (capacidadMaximaDiariaCOP || 1)) * 100));
  const porcentajeCapacidadDisponible = Math.max(0, 100 - porcentajeOcupacionActual);
  const crecimientoPotencialCOP = Math.max(0, capacidadMaximaMensualCOP - ventasHoyMensual);

  // Cuello de botella identificado
  const equiposConCapacidad = useMemo(() => {
    return equipos.map(eq => {
      const nombreLower = (eq.nombre || '').toLowerCase();
      let tipoCategoria = 'EQUIPO';
      let capacidadResumen = 'Área operativa';
      let esCuello = false;
      let limitacion = eq.cuelloDeBotellaDesc || 'Sin restricción crítica reportada';

      if (nombreLower.includes('horno')) {
        tipoCategoria = 'TÉRMICO / COCCIÓN';
        capacidadResumen = `${eq.camaras || 2} Cámaras (${eq.capacidadTartasVascas || 8} tartas vascas / ${eq.capacidadCroissants || 24} croissants por ciclo)`;
        esCuello = true;
        limitacion = 'Cuello de botella térmico principal: ciclos de 35-45 min fijan el paso de toda la panadería.';
      } else if (nombreLower.includes('batidora')) {
        tipoCategoria = 'MECÁNICO / BATIDO';
        capacidadResumen = `Bowl ${eq.capacidadBowlLitros || 6}L (~4 kg masa batida / tanda de 18 min)`;
        limitacion = 'Requiere tandas continuas para no dejar desabastecido el horno.';
      } else if (nombreLower.includes('nevera') || nombreLower.includes('refrig')) {
        tipoCategoria = 'CADENA DE FRÍO';
        capacidadResumen = `${eq.capacidadLitros || 420}L (Espacio para ~16 tartas o 4 latas de fermentación)`;
        limitacion = 'Volumen crítico para reposo de hojaldres y enfriamiento post-horneo.';
      } else if (nombreLower.includes('mes') || nombreLower.includes('trabajo')) {
        tipoCategoria = 'MANIPULACIÓN Y CORTE';
        capacidadResumen = `${eq.dimensiones || '80x110 cm'} (Máximo 2 operarios sincronizados)`;
        limitacion = 'Espacio de laminado y armado manual sensible a desorden.';
      }

      return {
        ...eq,
        tipoCategoria,
        capacidadResumen,
        esCuello,
        limitacion
      };
    });
  }, [equipos]);

  // Generador del Prompt / Dossier Markdown Completo
  const dossierMarkdown = useMemo(() => {
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `# ☕ PROYECTO CAFÉ — DOSSIER DE BUSINESS CONTEXT & INGENIERÍA DE PLANTA
> **Fecha:** ${fecha}  
> **Sistema:** Proyecto Café Web Management System  
> **Propósito:** Contexto integral de negocio para evaluación estratégica, consultoría multidisciplinar e inteligencia con IA.

---

## 1. RESUMEN EJECUTIVO & MODELO DE NEGOCIO
- **Empresa:** Proyecto Café (Café de Especialidad, Panadería & Repostería Artesanal).
- **Instalación:** Planta de producción integrada en punto de venta.
- **Área física:** ${anchoHab.toFixed(2)}m de ancho × ${largoHab.toFixed(2)}m de largo = **${areaTotalM2} m²**.
- **Jornada Operativa:** Turnos de **${horasTurno} horas/día**, **${diasMes} días/mes** (Total: ${horasTurno * diasMes} horas productivas/mes).
- **Eficiencia Global Operativa (OEE):** ${(eficienciaOEE * 100).toFixed(0)}% (considerando mermas, limpieza BPM y cambios de molde).

---

## 2. REALIDAD FINANCIERA: VENTAS ACTUALES VS GASTOS FIJOS
- **Ventas Reales Promedio Actuales:** $${ventasHoyDiarias.toLocaleString('es-CO')} COP/día (~$${ventasHoyMensual.toLocaleString('es-CO')} COP/mes).
- **Gastos Fijos Mensuales Totales:** $${totalCostosFijosMes.toLocaleString('es-CO')} COP/mes ($${costoFijoDiario.toLocaleString('es-CO')} COP/día).
  - *Arriendo Planta (10 m²):* $${(costosFijos?.arriendo10m2 || 1200000).toLocaleString('es-CO')} COP/mes
  - *Nómina Panadero/Pastelero:* $${(costosFijos?.nominaPanaderoPastelero || 2200000).toLocaleString('es-CO')} COP/mes
  - *Gas GLP Propano (Horno):* $${(costosFijos?.gasPropanoPipetas || 350000).toLocaleString('es-CO')} COP/mes
  - *Electricidad Comercial:* $${(costosFijos?.electricidadComercial || 450000).toLocaleString('es-CO')} COP/mes
  - *Mantenimiento & Limpieza BPM:* $${(costosFijos?.mantenimientoAseoBPM || 300000).toLocaleString('es-CO')} COP/mes
  - *Depreciación de Maquinaria:* $${(costosFijos?.depreciacionEquiposCAD || 350000).toLocaleString('es-CO')} COP/mes
- **Punto de Equilibrio (Break-Even):**
  - Venta mínima para no perder dinero: **$${breakEvenVentaDiaria.toLocaleString('es-CO')} COP/día** ($${breakEvenVentaMensual.toLocaleString('es-CO')} COP/mes).
  - Estado actual: ${ventasHoyDiarias >= breakEvenVentaDiaria ? '✅ Por encima del punto de equilibrio operativo.' : '⚠️ Por debajo del punto de equilibrio (se requiere aumentar el ticket promedio o volumen de rotación).' }

---

## 3. CAPACIDAD INSTALADA & INVENTARIO DE MAQUINARIA
| Equipo | Dimensiones | Tipo / Energía | Capacidad Nominal | Cuello de Botella (TOC) |
| :--- | :--- | :--- | :--- | :--- |
${equiposConCapacidad.map(e => `| **${e.nombre}** | ${e.dimensiones || 'N/A'} | ${e.combustible || e.tipoCategoria} | ${e.capacidadResumen} | ${e.esCuello ? '🔴 CUELLO DE BOTELLA' : '🟢 Capacidad Holgada'} |`).join('\n')}

### Diagnóstico de Cuello de Botella (Teoría de Restricciones - TOC):
El **Horno Doble Cámara** y los **tiempos de horneado (35-45 min)** representan la restricción primaria del sistema. La producción máxima teórica de la planta es de **$${capacidadMaximaDiariaCOP.toLocaleString('es-CO')} COP/día** ($${capacidadMaximaMensualCOP.toLocaleString('es-CO')} COP/mes).
- **Ocupación Actual de la Planta:** **${porcentajeOcupacionActual}%**
- **Capacidad Ociosa / Margen de Expansión:** **${porcentajeCapacidadDisponible}%** (Potencial de generar hasta **+$${crecimientoPotencialCOP.toLocaleString('es-CO')} COP/mes** adicionales con la misma maquinaria).

---

## 4. LOS 10 PRODUCTOS ESTRELLA (RECETAS, TIEMPOS & MÁRGENES)
| Producto | Categoría | P. Venta | Costo Var. | Margen COP | Margen % | T. Horneado | Lote/Horno | Demanda/Día |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${analisisProductos.map(p => `| **${p.nombre}** | ${p.categoria} | $${p.precioVentaCOP.toLocaleString('es-CO')} | $${p.costoVarUnitario.toLocaleString('es-CO')} | $${p.margenUnitarioCOP.toLocaleString('es-CO')} | ${p.margenPorcentaje}% | ${p.tiempoHorneadoMin} min | ${p.unidadesPorHorneada} u | ${p.demandaEstimadaDia} u |`).join('\n')}

---

## 5. INFORME MULTIDISCIPLINAR DE RECOMENDACIONES ESTRATÉGICAS

### A. Ingeniería Industrial & Lean Manufacturing
1. **Flujo de Proceso en 'U':** En un espacio de ${areaTotalM2} m², los desplazamientos entre la estación de pesaje (Mesón), batido y el horno deben ser menores a 1.5 metros para evitar fatiga del operario y colisiones.
2. **Estandarización SMED (Single-Minute Exchange of Die):** Preparar las latas frías y moldes con papel parafinado antes de que termine el ciclo del horno. La apertura y recarga del horno debe demorar menos de 60 segundos para evitar pérdidas térmicas de gas.
3. **Control de Lotes y Sincronización:** La batidora de 6L debe producir exactamente 2 tandas sucesivas mientras el horno cocina el lote previo de 38 min, garantizando flujo continuo.

### B. Finanzas & Rentabilidad Operativa
1. **Absorción de Costo Fijo:** Cada hora de planta abierta cuesta $${Math.round(costoFijoDiario / horasTurno).toLocaleString('es-CO')} COP en costos fijos. Los productos con mayor margen por minuto de horneado (como la *Tarta Vasca* con 67% de margen) deben priorizarse en las horas valle.
2. **Estrategia de Apalancamiento:** Con solo pasar del ${porcentajeOcupacionActual}% al 40% de ocupación de planta, la utilidad neta mensual se duplica porque los costos fijos ya están 100% amortizados.

### C. Operaciones, Mantenimiento & BPM
1. **Plan de Mantenimiento Preventivo (TPM):** 
   - Limpieza y descarbonización de piedras refractarias del horno cada semana.
   - Calibración bimestral de termocuplas y termostatos para evitar gradientes térmicos en las tartas.
   - Engrase de engranajes planetarios de la batidora cada 6 meses.
2. **Eficiencia Energética:** El gas propano representa $${(costosFijos?.gasPropanoPipetas || 350000).toLocaleString('es-CO')} COP/mes. Encender el horno solo tras alcanzar el lote completo programado; evitar precalentamientos vacíos de más de 20 minutos.

### D. Comercial, Marketing & Tendencias Gastronómicas
1. **Tendencia 'Basque Cheesecake' (Tarta Vasca):** Es el producto de mayor margen bruto ($10.000 COP netos por unidad). Promocionar formatos individuales y enteros para llevar mediante reservas programadas.
2. **Cross-Selling con Café de Especialidad:** Implementar combos matutinos estructurados (Café Filtrado + Croissant Hojaldrado o Rollo de Canela) para elevar el ticket promedio en las primeras 3 horas del día.
3. **Ventas Mayoristas B2B:** Dado que la planta tiene ${porcentajeCapacidadDisponible}% de capacidad ociosa, se puede maquilar pastelería congelada o precocida a otros cafés aliados sin aumentar costos fijos.

---

## 6. PROMPT MAESTRO PARA CONSULTORÍA CON INTELIGENCIA ARTIFICIAL
\`\`\`text
Actúa como Consultor Senior en Operaciones Gastronómicas, Ingeniería de Alimentos y Finanzas Restauranteras.
Tienes acceso a todo el Business Context de Proyecto Café detallado anteriormente.
Cuando te haga preguntas, responde con rigor numérico, basándote en la capacidad real de nuestras máquinas (horno 2 cámaras, batidora 6L, mesón en 9.92 m²), nuestros costos fijos ($${totalCostosFijosMes.toLocaleString('es-CO')} COP/mes) y ventas reales actuales ($${ventasHoyDiarias.toLocaleString('es-CO')} COP/día).
\`\`\`
`;
  }, [
    anchoHab, 
    largoHab, 
    areaTotalM2, 
    horasTurno, 
    diasMes, 
    eficienciaOEE, 
    ventasHoyDiarias, 
    ventasHoyMensual, 
    totalCostosFijosMes, 
    costoFijoDiario, 
    breakEvenVentaDiaria, 
    breakEvenVentaMensual, 
    capacidadMaximaDiariaCOP, 
    capacidadMaximaMensualCOP, 
    porcentajeOcupacionActual, 
    porcentajeCapacidadDisponible, 
    crecimientoPotencialCOP, 
    equiposConCapacidad, 
    analisisProductos, 
    costosFijos
  ]);

  const handleCopiarPrompt = () => {
    navigator.clipboard.writeText(dossierMarkdown);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleDescargarMarkdown = () => {
    const blob = new Blob([dossierMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProyectoCafe_BusinessContext_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDescargarJSON = () => {
    const dataObj = {
      empresa: 'Proyecto Café',
      generadoEl: new Date().toISOString(),
      infraestructura: {
        anchoM: anchoHab,
        largoM: largoHab,
        areaM2: areaTotalM2,
        horasTurno,
        diasMes,
        oee: eficienciaOEE
      },
      financiero: {
        ventasHoyDiariasCOP: ventasHoyDiarias,
        ventasHoyMensualCOP: ventasHoyMensual,
        costosFijosMensualCOP: totalCostosFijosMes,
        costosFijosDiarioCOP: costoFijoDiario,
        breakEvenDiarioCOP: breakEvenVentaDiaria,
        breakEvenMensualCOP: breakEvenVentaMensual,
        capacidadMaximaDiariaCOP,
        capacidadMaximaMensualCOP,
        ocupacionActualPorcentaje: porcentajeOcupacionActual,
        capacidadDisponiblePorcentaje: porcentajeCapacidadDisponible,
        crecimientoDisponibleMensualCOP: crecimientoPotencialCOP,
        costosFijosDetalle: costosFijos
      },
      maquinariaYCapacidad: equiposConCapacidad,
      productosTop10: analisisProductos,
      mixProduccion
    };

    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProyectoCafe_BusinessContext_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-3 print:p-0">
      {/* Barra Superior con Acciones de Exportación Rápidas */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-600 text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 border border-orange-300">
                Business Intelligence & AI Export
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-500">v2.4 Live</span>
            </div>
            <h2 className="text-base md:text-lg font-black text-gray-900 leading-tight">
              Exportador de Business Context & Informe Multidisciplinar
            </h2>
          </div>
        </div>

        {/* Botones de Acción de Exportación */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleCopiarPrompt}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border-2 border-black transition-all active:scale-95 cursor-pointer ${
              copiado 
                ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
            title="Copiar prompt completo formateado para ChatGPT, Claude o Gemini"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? '¡Contexto Copiado!' : 'Copiar Contexto IA'}</span>
          </button>

          <button
            onClick={handleDescargarMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-white hover:bg-gray-100 text-gray-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
            title="Descargar informe completo en formato Markdown (.md)"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Descargar .MD</span>
          </button>

          <button
            onClick={handleDescargarJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-white hover:bg-gray-100 text-gray-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
            title="Descargar datos brutos estructurados en JSON"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Descargar .JSON</span>
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black bg-gray-100 hover:bg-gray-200 text-gray-800 border-2 border-black active:scale-95 cursor-pointer"
            title="Imprimir informe en PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Selector de Vistas Internas del Dossier */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'resumen', label: '1. Resumen Ejecutivo & Capacidad', icon: TrendingUp },
          { id: 'maquinaria', label: '2. Ficha de Máquinas & Cuellos (TOC)', icon: Cpu },
          { id: 'recomendaciones', label: '3. Recomendaciones Multidisciplinares', icon: Wrench },
          { id: 'prompt', label: '4. Visualizador de Prompt IA (Markdown)', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isAct = vistaActiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setVistaActiva(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border-2 border-black transition-all cursor-pointer ${
                isAct 
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white hover:bg-gray-100 text-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO 1: RESUMEN EJECUTIVO & DIAGNÓSTICO FINANCIERO */}
      {vistaActiva === 'resumen' && (
        <div className="space-y-3">
          {/* Tarjetas de Diagnóstico de Alto Nivel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Ventas Hoy (Reales)</span>
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xl font-black text-gray-900 mt-1">
                ${ventasHoyDiarias.toLocaleString('es-CO')}
                <span className="text-xs font-normal text-gray-500"> /día</span>
              </div>
              <div className="text-[11px] font-mono text-gray-600 mt-0.5">
                ~${ventasHoyMensual.toLocaleString('es-CO')} COP/mes ({ventasRealesDb?.diasRegistrados || 0} tickets DB)
              </div>
            </div>

            <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Punto de Equilibrio</span>
                <Scale className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-900 mt-1">
                ${breakEvenVentaDiaria.toLocaleString('es-CO')}
                <span className="text-xs font-normal text-gray-500"> /día</span>
              </div>
              <div className="text-[11px] font-mono text-gray-600 mt-0.5">
                Cubre $${totalCostosFijosMes.toLocaleString('es-CO')} COP en arriendo y nómina
              </div>
            </div>

            <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Ocupación de Planta</span>
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-purple-900 mt-1">
                {porcentajeOcupacionActual}%
                <span className="text-xs font-normal text-gray-500"> de la capacidad</span>
              </div>
              <div className="w-full bg-gray-200 h-2 mt-1 border border-black overflow-hidden">
                <div className="bg-purple-600 h-full" style={{ width: `${porcentajeOcupacionActual}%` }} />
              </div>
            </div>

            <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Margen de Crecimiento</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 mt-1">
                +{porcentajeCapacidadDisponible}%
                <span className="text-xs font-normal text-gray-500"> disponible</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-800 mt-0.5 font-bold">
                Hasta +${crecimientoPotencialCOP.toLocaleString('es-CO')} COP/mes sin comprar máquinas
              </div>
            </div>
          </div>

          {/* Gráfico Visual Comparativo: Hoy vs Punto de Equilibrio vs Capacidad Máxima */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  Comparativa de Producción & Absorción de Costos
                </h3>
                <p className="text-xs text-gray-600">
                  Relación entre tus ventas actuales de Proyecto Café, el umbral de supervivencia y el techo físico de la planta.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 border border-black">
                Planta: {anchoHab.toFixed(2)}m × {largoHab.toFixed(2)}m ({areaTotalM2} m²)
              </span>
            </div>

            {/* Barra Visual Proporcional */}
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-700">1. Ventas Actuales Reales</span>
                  <span className="font-mono text-orange-700">${ventasHoyDiarias.toLocaleString('es-CO')} /día ({porcentajeOcupacionActual}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-5 border-2 border-black overflow-hidden relative">
                  <div 
                    className="bg-orange-500 h-full flex items-center justify-end pr-1 text-[10px] font-black text-white" 
                    style={{ width: `${Math.max(5, (ventasHoyDiarias / capacidadMaximaDiariaCOP) * 100)}%` }}
                  >
                    Hoy
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-900">2. Punto de Equilibrio (Break-Even)</span>
                  <span className="font-mono text-blue-900">${breakEvenVentaDiaria.toLocaleString('es-CO')} /día ({Math.round((breakEvenVentaDiaria / capacidadMaximaDiariaCOP) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-5 border-2 border-black overflow-hidden relative">
                  <div 
                    className="bg-blue-600 h-full flex items-center justify-end pr-1 text-[10px] font-black text-white" 
                    style={{ width: `${Math.max(5, (breakEvenVentaDiaria / capacidadMaximaDiariaCOP) * 100)}%` }}
                  >
                    Cubre Gastos
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-900">3. Capacidad Máxima Teórica (Turno 8h)</span>
                  <span className="font-mono text-emerald-900">${capacidadMaximaDiariaCOP.toLocaleString('es-CO')} /día (100%)</span>
                </div>
                <div className="w-full bg-gray-100 h-5 border-2 border-black overflow-hidden relative">
                  <div className="bg-emerald-600 h-full flex items-center justify-end pr-2 text-[10px] font-black text-white w-full">
                    Techo Físico Actual
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: FICHA TÉCNICA DE MÁQUINAS & CUELLOS DE BOTELLA (TOC) */}
      {vistaActiva === 'maquinaria' && (
        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-orange-600" />
                Inventario de Maquinaria, Dimensiones & Cuellos de Botella (TOC)
              </h3>
              <p className="text-xs text-gray-600">
                Detalle técnico de cada equipo instalado en el plano CAD, capacidades nominales y puntos críticos.
              </p>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-300 px-2 py-1">
              Cuello de Botella Primario: Horno Refractario
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equiposConCapacidad.map(eq => (
              <div 
                key={eq.id}
                className={`border-2 border-black p-3 space-y-2 ${
                  eq.esCuello ? 'bg-red-50/50 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 bg-gray-200 border border-black">
                      {eq.tipoCategoria}
                    </span>
                    <h4 className="text-sm font-black text-gray-900 mt-1">{eq.nombre}</h4>
                  </div>
                  {eq.esCuello ? (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase border border-black animate-pulse">
                      Restricción TOC
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-400">
                      Operativo
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-200">
                  <div>
                    <span className="text-gray-500 font-bold block text-[10px] uppercase">Dimensiones CAD:</span>
                    <span className="font-mono font-bold text-gray-800">{eq.dimensiones || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block text-[10px] uppercase">Energía / Combustible:</span>
                    <span className="font-mono font-bold text-gray-800">{eq.combustible || eq.potenciaElectrica || 'Manual'}</span>
                  </div>
                </div>

                <div className="p-2 bg-gray-50 border border-gray-200 rounded-none text-xs">
                  <span className="text-[10px] font-black uppercase text-gray-600 block">Capacidad de Producción:</span>
                  <span className="font-bold text-gray-900">{eq.capacidadResumen}</span>
                </div>

                <div className="text-[11px] text-gray-700 flex items-start gap-1.5 pt-1">
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${eq.esCuello ? 'text-red-600' : 'text-gray-400'}`} />
                  <span><strong>Diagnóstico:</strong> {eq.limitacion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO 3: RECOMENDACIONES MULTIDISCIPLINARES PROFUNDAS */}
      {vistaActiva === 'recomendaciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Tarjeta 1: Lean & Ingeniería de Métodos */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <div className="p-1.5 bg-blue-600 text-white border border-black">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase">1. Ingeniería de Métodos & Lean Manufacturing</h4>
                <span className="text-[10px] text-gray-500 font-bold">Optimización de los 9.92 m²</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-800">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Flujo en 'U' sin cruces:</strong> La secuencia Pesaje ➔ Batidora ➔ Mesón de Armado ➔ Horno ➔ Enfriamiento debe mantener un solo sentido para evitar que el operario tropiece en los 3.2m de ancho.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Metodología SMED en Horno:</strong> Tener los moldes y bandejas de la siguiente tanda 100% listos antes de sacar la tarta o los croissants. La puerta del horno no debe permanecer abierta más de 45 segundos para no botar el calor del gas.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Lotes Sincronizados:</strong> La batidora de 6L bate 4 tartas por tanda (15 min). Como el horno hornea 8 tartas simultáneas (38 min), deben programarse 2 batidas seguidas para que el horno siempre entre al 100% de su capacidad.</span>
              </li>
            </ul>
          </div>

          {/* Tarjeta 2: Finanzas & Absorción de Costos */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <div className="p-1.5 bg-emerald-600 text-white border border-black">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase">2. Finanzas & Estructura de Costos</h4>
                <span className="text-[10px] text-gray-500 font-bold">Punto de Equilibrio y Margen de Expansión</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-800">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Costo Fijo por Minuto de Horno:</strong> Mantener la planta encendida cuesta <strong>${Math.round(costoFijoDiario / (horasTurno * 60))} COP/minuto</strong>. Hornear lotes a media capacidad destruye el margen neto.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Potencial de Absorción:</strong> Estás al {porcentajeOcupacionActual}% de capacidad. Si subes al 35%, la utilidad neta mensual pasa a ser positiva y sólida porque arriendo ($1.2M) y nómina ($2.2M) no aumentan ni un solo peso.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Producto Estrella:</strong> La Tarta Vasca deja un margen bruto de <strong>67% ($10.000 COP netos/unidad)</strong>. Vender solo 19 tartas al día cubre por sí sola toda la nómina y el arriendo de la planta.</span>
              </li>
            </ul>
          </div>

          {/* Tarjeta 3: Mantenimiento & Gestión TPM */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <div className="p-1.5 bg-orange-600 text-white border border-black">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase">3. Operaciones & Mantenimiento (TPM)</h4>
                <span className="text-[10px] text-gray-500 font-bold">Eficiencia Térmica & Confiabilidad de Activos</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-800">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span><strong>Piedras Refractarias del Horno:</strong> Limpiar semanalmente en seco con espátula de latón. Nunca usar agua con las piedras calientes para evitar fisuras por choque térmico.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span><strong>Ahorro de Gas GLP:</strong> La pipeta cuesta $350.000 COP/mes. Organizar el horneado en un bloque continuo de 3 a 4 horas matutinas en lugar de encender y apagar el horno múltiples veces al día.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span><strong>Calibración de Termómetros:</strong> Instalar un termómetro de sonda bimetálica dentro de cada cámara para contrastar la aguja análoga externa, garantizando caramelizado exacto sin quemar la base.</span>
              </li>
            </ul>
          </div>

          {/* Tarjeta 4: Comercial & Tendencias Gastronómicas */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <div className="p-1.5 bg-purple-600 text-white border border-black">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase">4. Comercial & Tendencias Gastronómicas</h4>
                <span className="text-[10px] text-gray-500 font-bold">Estrategia de Carta & Maridaje con Café</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-800">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Furor de la Basque Cheesecake:</strong> La tendencia global y en Colombia premia el centro cremoso 'lava' y el tostado profundo. Es el producto más fotografiable en redes y de mayor valor percibido ($15.000 COP/porción).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Maridaje con Filtrados:</strong> El toque salado del queso y el caramelo de la tarta vasca combinan a la perfección con cafés de proceso Honey o Naturales con notas frutales, aumentando el ticket promedio en mesa.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Aprovechamiento de Capacidad Ociosa (${porcentajeCapacidadDisponible}%):</strong> Vender cajas de 4 mini tartas vascas para llevar o congelar masa de croissants para hornear por demanda en horas de la tarde.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* CONTENIDO 4: VISUALIZADOR DE CÓDIGO MARKDOWN / PROMPT IA */}
      {vistaActiva === 'prompt' && (
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-gray-700 uppercase">
                Texto del Dossier Markdown (Listo para Copiar y Pegar en ChatGPT / Claude / Gemini)
              </span>
            </div>
            <button
              onClick={handleCopiarPrompt}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-black bg-orange-600 text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
            >
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="bg-gray-950 text-gray-100 p-3.5 font-mono text-xs overflow-x-auto max-h-[500px] border border-black select-all whitespace-pre-wrap leading-relaxed">
            {dossierMarkdown}
          </div>
        </div>
      )}
    </div>
  );
}
