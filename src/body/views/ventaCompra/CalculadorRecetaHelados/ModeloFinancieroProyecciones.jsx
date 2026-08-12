import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Zap, 
  Percent, 
  PieChart, 
  Sparkles, 
  Coffee, 
  Info,
  CheckCircle2,
  Award,
  Layers,
  ArrowUpRight,
  Calculator
} from "lucide-react";

export function ModeloFinancieroProyecciones({ 
  calculations, 
  nombreReceta, 
  tipoHelado,
  allPresets = {},
  combinedIngredientsCatalog = [],
  allItems = [],
  loadPreset
}) {
  // --- ESTADO DE RECETA / SABOR SELECCIONADO PARA EL MODELO FINANCIERO ---
  const [selectedRecipeKey, setSelectedRecipeKey] = useState("active");

  // --- CONFIGURACIÓN DE PARÁMETROS UNITARIOS ---
  const [porcionGramos, setPorcionGramos] = useState(90); // 90g por cono por defecto
  const [costoEmpaque, setCostoEmpaque] = useState(350); // Cono / Vaso + Cucharita ($350 COP)
  const [precioVenta, setPrecioVenta] = useState(6500); // $6.500 COP por helado

  // --- CONFIGURACIÓN DE OPERACIÓN MÁQUINA SOFT ---
  const [potenciaKW, setPotenciaKW] = useState(2.0); // 2.0 kW
  const [horasUsoDiario, setHorasUsoDiario] = useState(8); // 8 horas al día
  const [costoKWh, setCostoKWh] = useState(900); // $900 COP / kWh
  const [costoMantenimientoMensual, setCostoMantenimientoMensual] = useState(120000); // Sanitización, empaques, lubricante

  // --- OBTENER RECETA Y COSTO SEGÚN LA SELECCIÓN ---
  const currentRecipeDetail = useMemo(() => {
    if (selectedRecipeKey === "active" || !allPresets[selectedRecipeKey]) {
      return {
        nombre: nombreReceta || "Receta Activa",
        tipo: tipoHelado || "SOFT",
        costoPorKg: calculations?.costoPorKg || 0,
        pesoTotal: calculations?.pesoTotal || 1000
      };
    }

    const preset = allPresets[selectedRecipeKey];
    let pesoTotal = 0;
    let costoTotalLote = 0;

    preset.items.forEach((line) => {
      const ing = combinedIngredientsCatalog.find((item) => item.id === line.ingId) || {};
      const cant = parseFloat(line.cantidad) || 0;
      pesoTotal += cant;

      let itemCostoKg = ing.costoUnitario || 0;
      const targetInvId = line.inventarioItemId || ing.inventarioItemId;
      if (targetInvId) {
        const invItem = allItems.find((i) => i._id === targetInvId);
        if (invItem) {
          itemCostoKg = parseFloat(invItem.Precio || invItem.Precio_Unitario || invItem.COSTO) || 0;
        }
      }
      costoTotalLote += (cant / 1000) * itemCostoKg;
    });

    const costoPorKg = pesoTotal > 0 ? costoTotalLote / (pesoTotal / 1000) : 0;

    return {
      nombre: preset.nombre,
      tipo: preset.tipo,
      costoPorKg,
      pesoTotal: pesoTotal || 1000
    };
  }, [selectedRecipeKey, nombreReceta, tipoHelado, calculations, allPresets, combinedIngredientsCatalog, allItems]);

  // --- CÁLCULOS UNITARIOS DE FOOD COST ---
  const costoMezclaPorGramo = useMemo(() => {
    return (currentRecipeDetail.costoPorKg || 0) / 1000;
  }, [currentRecipeDetail.costoPorKg]);

  const costoMezclaPorcion = useMemo(() => {
    return costoMezclaPorGramo * porcionGramos;
  }, [costoMezclaPorGramo, porcionGramos]);

  const costoUnitarioTotal = useMemo(() => {
    return costoMezclaPorcion + parseFloat(costoEmpaque || 0);
  }, [costoMezclaPorcion, costoEmpaque]);

  const margenBrutoUnitario = useMemo(() => {
    return parseFloat(precioVenta || 0) - costoUnitarioTotal;
  }, [precioVenta, costoUnitarioTotal]);

  const pctFoodCost = useMemo(() => {
    return precioVenta > 0 ? (costoUnitarioTotal / precioVenta) * 100 : 0;
  }, [costoUnitarioTotal, precioVenta]);

  const pctMargenBruto = useMemo(() => {
    return precioVenta > 0 ? (margenBrutoUnitario / precioVenta) * 100 : 0;
  }, [margenBrutoUnitario, precioVenta]);

  // --- COSTOS OPERATIVOS MENSUALES MÁQUINA ---
  const costoEnergiaMensual = useMemo(() => {
    return potenciaKW * horasUsoDiario * 30 * costoKWh;
  }, [potenciaKW, horasUsoDiario, costoKWh]);

  const costoFijoOperativoHelado = useMemo(() => {
    return costoEnergiaMensual + parseFloat(costoMantenimientoMensual || 0);
  }, [costoEnergiaMensual, costoMantenimientoMensual]);

  // --- DATOS TABLA LANZAMIENTO (MESES 1 A 3) ---
  const proyeccionesLanzamiento = useMemo(() => {
    const data = [
      { mes: "Mes 1 (Lanzamiento)", clientes: 1500, convPct: 15 },
      { mes: "Mes 2 (Consolidación)", clientes: 1550, convPct: 22 },
      { mes: "Mes 3 (Maduración)", clientes: 1600, convPct: 30 },
    ];

    return data.map((item) => {
      const unidadesVendidas = Math.round(item.clientes * (item.convPct / 100));
      const promedioDiario = parseFloat((unidadesVendidas / 30).toFixed(1));
      const ingresosBrutos = unidadesVendidas * precioVenta;
      const costoInsumosTotal = unidadesVendidas * costoUnitarioTotal;
      const utilidadBruta = ingresosBrutos - costoInsumosTotal;
      const utilidadNetaLimpia = utilidadBruta - costoFijoOperativoHelado;

      return {
        ...item,
        unidadesVendidas,
        promedioDiario,
        ingresosBrutos,
        costoInsumosTotal,
        utilidadBruta,
        utilidadNetaLimpia
      };
    });
  }, [precioVenta, costoUnitarioTotal, costoFijoOperativoHelado]);

  // --- DATOS TABLA ESCENARIO IDEAL (MESES 4 A 6) ---
  const proyeccionesIdeal = useMemo(() => {
    const data = [
      { mes: "Mes Ideal 1 (Conservador)", clientes: 1500, convPct: 35 },
      { mes: "Mes Ideal 2 (Estándar)", clientes: 1650, convPct: 40 },
      { mes: "Mes Ideal 3 (Pico Verano / Temporada)", clientes: 1800, convPct: 45 },
    ];

    return data.map((item) => {
      const unidadesVendidas = Math.round(item.clientes * (item.convPct / 100));
      const promedioDiario = parseFloat((unidadesVendidas / 30).toFixed(1));
      const ingresosBrutos = unidadesVendidas * precioVenta;
      const costoInsumosTotal = unidadesVendidas * costoUnitarioTotal;
      const utilidadBruta = ingresosBrutos - costoInsumosTotal;
      const utilidadNetaLimpia = utilidadBruta - costoFijoOperativoHelado;

      return {
        ...item,
        unidadesVendidas,
        promedioDiario,
        ingresosBrutos,
        costoInsumosTotal,
        utilidadBruta,
        utilidadNetaLimpia
      };
    });
  }, [precioVenta, costoUnitarioTotal, costoFijoOperativoHelado]);

  // --- PROPUESTA DE MENÚ ESTRATÉGICO ---
  const propuestaMenu = [
    {
      titulo: `🍦 Cono Soft Clásico (${currentRecipeDetail.nombre})`,
      precioRecomendado: "$6.500 COP",
      costoEst: `$${costoUnitarioTotal.toFixed(0)} COP`,
      margen: `$${margenBrutoUnitario.toFixed(0)} COP`,
      badge: "ALTO VOLUMEN",
      badgeBg: "bg-yellow-300 text-black",
      descripcion: `Formulación activa (${currentRecipeDetail.nombre}) de ${porcionGramos}g por servido en cono waffle.`
    },
    {
      titulo: "🌀 Cono Dúo / Espiral Mixto (Soft Combinado)",
      precioRecomendado: "$7.000 COP",
      costoEst: `$${(costoUnitarioTotal * 1.05).toFixed(0)} COP`,
      margen: `$${(7000 - costoUnitarioTotal * 1.05).toFixed(0)} COP`,
      badge: "MÁXIMO ATRACTIVO",
      badgeBg: "bg-amber-300 text-black",
      descripcion: "Combinación de dos sabores en espiral. Eleva el precio percibido con el mismo costo base."
    },
    {
      titulo: `☕ Sundae Affogato Café Web (${currentRecipeDetail.nombre})`,
      precioRecomendado: "$9.500 COP",
      costoEst: `$${(costoUnitarioTotal + 600).toFixed(0)} COP`,
      margen: `$${(9500 - (costoUnitarioTotal + 600)).toFixed(0)} COP`,
      badge: "VENTA CRUZADA",
      badgeBg: "bg-blue-300 text-black",
      descripcion: "Porción de Helado Soft servida en vaso cristalino ahogado con un shot expreso de la casa."
    },
    {
      titulo: "🥐 Combo Café + Cono Soft (Desayuno / Tardeo)",
      precioRecomendado: "$18.000 COP",
      costoEst: `$${(costoUnitarioTotal + 1800).toFixed(0)} COP`,
      margen: `$${(18000 - (costoUnitarioTotal + 1800)).toFixed(0)} COP`,
      badge: "TICKET PROMEDIO PICO",
      badgeBg: "bg-emerald-300 text-black",
      descripcion: "Apoyado en tu ticket promedio actual ($15.000 - $18.000 COP). Incluye bebida caliente + helado."
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-SpaceGrotesk">
      
      {/* HEADER PRINCIPAL CON SELECTOR DE SABOR / RECETA */}
      <div className="bg-amber-50 border-2 border-black p-4 md:p-6 shadow-solid flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-terracotta-accent text-white border-2 border-black shadow-solid shrink-0">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
              Modelo Financiero & Proyección de Ventas de Helado Soft
            </h2>
            <p className="text-xs text-gray-700">
              Evaluación de viabilidad y rentabilidad en tiempo real. Selecciona cualquier sabor o receta base para simular sus costos.
            </p>
          </div>
        </div>

        {/* SELECTOR INTERACTIVO DE RECETA ESPECÍFICA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 border-2 border-black shadow-solid w-full lg:w-auto shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <label className="text-xs font-black text-gray-900">Sabor / Receta a Evaluar:</label>
          </div>
          
          <select
            value={selectedRecipeKey}
            onChange={(e) => setSelectedRecipeKey(e.target.value)}
            className="bg-yellow-100 font-extrabold text-xs text-amber-950 p-1.5 border-2 border-black focus:outline-none cursor-pointer flex-1"
          >
            <option value="active">
              ⭐ Receta Activa del Balanceador ("{nombreReceta}")
            </option>
            {Object.keys(allPresets).length > 0 && (
              <optgroup label="📋 Recetas Base & Creadas por IA">
                {Object.entries(allPresets).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.nombre} ({item.tipo})
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {selectedRecipeKey !== "active" && loadPreset && (
            <button
              type="button"
              onClick={() => loadPreset(selectedRecipeKey)}
              className="px-3 py-1.5 bg-sage-green hover:bg-emerald-700 text-white font-bold text-xs border-2 border-black shadow-sm flex items-center justify-center gap-1 transition-all shrink-0 active:translate-y-0.5"
              title="Cargar esta receta activa en la Pestaña 1 (Balanceador)"
            >
              <span>⚡ Cargar al Balanceador</span>
            </button>
          )}
        </div>
      </div>

      {/* SECCIÓN CONFIGURADOR DE COSTOS UNITARIOS POR CONO */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-4">
        <h3 className="font-bold text-sm text-gray-900 border-b-2 border-black pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-cobalt-blue" />
            1. Parámetros Unitarios del Helado (Cálculo en Vivo por Porción)
          </span>
          <span className="text-xs font-mono font-bold bg-yellow-200 text-yellow-950 px-2 py-0.5 border border-black">
            Evaluando: {currentRecipeDetail.nombre} ({currentRecipeDetail.tipo})
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
          {/* Porción Gramos */}
          <div className="bg-gray-50 border-2 border-black p-3 space-y-1">
            <label className="block text-gray-700">Porción por Helado (Gramos):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={porcionGramos}
                onChange={(e) => setPorcionGramos(parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 border border-black font-mono font-bold text-sm bg-white text-gray-900"
              />
              <span className="text-gray-500 font-mono">g</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Estándar Soft: 80g a 100g</span>
          </div>

          {/* Costo Empaque / Cono */}
          <div className="bg-gray-50 border-2 border-black p-3 space-y-1">
            <label className="block text-gray-700">Costo Cono / Vaso + Cucharita:</label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-mono">$</span>
              <input
                type="number"
                value={costoEmpaque}
                onChange={(e) => setCostoEmpaque(parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 border border-black font-mono font-bold text-sm bg-white text-gray-900"
              />
              <span className="text-gray-500 font-mono">COP</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Cono waffle o galleta barquillo</span>
          </div>

          {/* Precio Venta Sugerido */}
          <div className="bg-yellow-50 border-2 border-black p-3 space-y-1">
            <label className="block text-yellow-950">Precio Venta al Público (PVP):</label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-mono">$</span>
              <input
                type="number"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 border border-black font-mono font-bold text-sm bg-white text-yellow-950"
              />
              <span className="text-gray-500 font-mono">COP</span>
            </div>
            <span className="text-[10px] text-yellow-800 block">Propuesto: $6.500 COP</span>
          </div>

          {/* Costo Mezcla por Kg (Read Only evaluated flavor) */}
          <div className="bg-blue-50 border-2 border-black p-3 space-y-1">
            <label className="block text-blue-950">Costo Base Lote de Mezcla:</label>
            <div className="text-base font-black font-mono text-blue-900 pt-1">
              ${currentRecipeDetail.costoPorKg.toFixed(2)} <span className="text-xs font-normal">/ kg</span>
            </div>
            <span className="text-[10px] text-blue-700 block">Costo calculado de la receta seleccionada</span>
          </div>
        </div>

        {/* METRIC CARDS RESUMEN UNITARIO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* COSTO UNITARIO TOTAL */}
          <div className="bg-red-50 border-2 border-black p-3 shadow-sm">
            <span className="text-xs font-bold text-red-950 block">Costo Total por Cono (Food Cost):</span>
            <div className="text-2xl font-black text-red-900 font-mono">
              ${costoUnitarioTotal.toFixed(0)} <span className="text-xs font-bold">COP</span>
            </div>
            <div className="text-[11px] text-red-800 mt-1 flex justify-between">
              <span>Mezcla ({porcionGramos}g): ${costoMezclaPorcion.toFixed(0)}</span>
              <span>Empaque: ${costoEmpaque}</span>
            </div>
          </div>

          {/* MARGEN BRUTO UNITARIO */}
          <div className="bg-emerald-50 border-2 border-black p-3 shadow-sm">
            <span className="text-xs font-bold text-emerald-950 block">Margen Bruto Directo por Cono:</span>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              ${margenBrutoUnitario.toFixed(0)} <span className="text-xs font-bold">COP</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1">
              Contribución limpia por cada helado vendido.
            </div>
          </div>

          {/* PORCENTAJE COSTO INSUMOS */}
          <div className="bg-purple-50 border-2 border-black p-3 shadow-sm">
            <span className="text-xs font-bold text-purple-950 block">% Insumos vs Venta (Food Cost %):</span>
            <div className="text-2xl font-black text-purple-900 font-mono">
              {pctFoodCost.toFixed(1)}%
            </div>
            <div className="text-[11px] text-purple-800 mt-1">
              Margen de Ganancia Bruta: <strong>{pctMargenBruto.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN PROYECCIÓN DE VENTAS (LANZAMIENTO Y REGIMEN IDEAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOQUE 1: PROYECCIÓN LANZAMIENTO (MESES 1 A 3) */}
        <div className="bg-white border-2 border-black p-4 shadow-solid space-y-3">
          <div className="border-b-2 border-black pb-2 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              1. Proyección de Lanzamiento (Meses 1 a 3)
            </h3>
            <span className="text-[10px] font-bold bg-amber-100 px-2 py-0.5 border border-black text-amber-900">
              Introducción & Curva
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black font-bold text-gray-800">
                  <th className="p-2 border-r border-black">Mes</th>
                  <th className="p-2 border-r border-black text-center">Conv. %</th>
                  <th className="p-2 border-r border-black text-center">Unid / Mes</th>
                  <th className="p-2 border-r border-black text-center">U/Día</th>
                  <th className="p-2 text-right">Ventas Brutas</th>
                </tr>
              </thead>
              <tbody>
                {proyeccionesLanzamiento.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-yellow-50">
                    <td className="p-2 border-r border-gray-300 font-bold">{row.mes}</td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-bold text-blue-800">
                      {row.convPct}%
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-bold">
                      {row.unidadesVendidas}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono text-gray-600">
                      ~{row.promedioDiario}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-emerald-800">
                      ${row.ingresosBrutos.toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-gray-50 border border-black text-[11px] text-gray-700 leading-snug">
            💡 <strong>Comentario de Lanzamiento:</strong> La progresión del 15% al 30% responde a la exhibición visual en punto de venta y degustaciones de introducción.
          </div>
        </div>

        {/* BLOQUE 2: ESCENARIO OPERATIVO IDEAL (MESES 4 A 6) */}
        <div className="bg-white border-2 border-black p-4 shadow-solid space-y-3">
          <div className="border-b-2 border-black pb-2 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              2. Escenario Operativo Ideal (Meses 4 a 6)
            </h3>
            <span className="text-[10px] font-bold bg-emerald-100 px-2 py-0.5 border border-black text-emerald-900">
              Régimen Estable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black font-bold text-gray-800">
                  <th className="p-2 border-r border-black">Escenario</th>
                  <th className="p-2 border-r border-black text-center">Conv. %</th>
                  <th className="p-2 border-r border-black text-center">Unid / Mes</th>
                  <th className="p-2 border-r border-black text-center">U/Día</th>
                  <th className="p-2 text-right">Ventas Brutas</th>
                </tr>
              </thead>
              <tbody>
                {proyeccionesIdeal.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-emerald-50">
                    <td className="p-2 border-r border-gray-300 font-bold">{row.mes}</td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-bold text-blue-800">
                      {row.convPct}%
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-bold text-emerald-900">
                      {row.unidadesVendidas}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono text-gray-600">
                      ~{row.promedioDiario}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-emerald-800">
                      ${row.ingresosBrutos.toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-black text-[11px] text-emerald-900 leading-snug">
            🚀 <strong>Potencial Pico:</strong> Con 810 unidades vendidas al mes (27 helados/día), el ingreso bruto alcanza los <strong>$5.265.000 COP</strong> mensuales.
          </div>
        </div>
      </div>

      {/* SECCIÓN COSTOS OPERATIVOS DE MÁQUINA SOFT & UTILIDAD NETA */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-4">
        <h3 className="font-bold text-sm text-gray-900 border-b-2 border-black pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            3. Costos Operativos de la Máquina Soft & Utilidad Neta Real
          </span>
          <span className="text-xs font-mono font-bold bg-gray-200 px-2 py-0.5 border border-black">
            Costo Fijo Mensual Máquina: ${costoFijoOperativoHelado.toLocaleString("es-CO")} COP
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Ajuste Energía */}
          <div className="bg-gray-50 border-2 border-black p-3 space-y-2">
            <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1">⚡ Consumo Eléctrico Estimado</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold">Potencia (kW):</label>
                <input
                  type="number"
                  step="0.1"
                  value={potenciaKW}
                  onChange={(e) => setPotenciaKW(parseFloat(e.target.value) || 0)}
                  className="w-full p-1 border border-black font-mono bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold">Uso Diario (Horas):</label>
                <input
                  type="number"
                  value={horasUsoDiario}
                  onChange={(e) => setHorasUsoDiario(parseFloat(e.target.value) || 0)}
                  className="w-full p-1 border border-black font-mono bg-white font-bold"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 font-mono text-[11px]">
              <span>Tarifa kWh: ${costoKWh}</span>
              <span className="font-bold text-amber-900">${costoEnergiaMensual.toLocaleString("es-CO")}/mes</span>
            </div>
          </div>

          {/* Ajuste Sanitización */}
          <div className="bg-gray-50 border-2 border-black p-3 space-y-2">
            <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1">🧴 Sanitización & Empaques</h4>
            <div>
              <label className="block text-[11px] font-bold">Mantenimiento Mensual (COP):</label>
              <input
                type="number"
                value={costoMantenimientoMensual}
                onChange={(e) => setCostoMantenimientoMensual(parseFloat(e.target.value) || 0)}
                className="w-full p-1 border border-black font-mono bg-white font-bold"
              />
            </div>
            <p className="text-[10px] text-gray-500">
              Incluye jabón desinfectante neutro, lubricante sanitario grado alimenticio y cambio periódico de orings.
            </p>
          </div>

          {/* Resumen Capacidad */}
          <div className="bg-blue-50 border-2 border-black p-3 space-y-2 text-blue-950">
            <h4 className="font-bold border-b border-blue-200 pb-1">⚙️ Capacidad Operativa vs Carga</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Carga Operativa Promedio:</span>
                <strong className="font-mono">15 a 30 helados/día</strong>
              </div>
              <div className="flex justify-between">
                <span>Estrés Térmico Compresor:</span>
                <strong className="text-emerald-700 font-bold">Muy Bajo (Holgado)</strong>
              </div>
              <div className="flex justify-between">
                <span>Desgaste de Agitadores:</span>
                <strong className="text-emerald-700 font-bold">Mínimo</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: PROPUESTA ESTRATÉGICA DE MENÚ DE HELADOS */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-4">
        <div className="border-b-2 border-black pb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-terracotta-accent" />
              4. Propuesta Estratégica de Menú de Helados Soft & Combos
            </h3>
            <p className="text-xs text-gray-600">
              Ideas de arquitectura de menú para maximizar la conversión y elevar el ticket promedio actual ($15.000 - $18.000 COP).
            </p>
          </div>
          <span className="px-3 py-1 bg-yellow-300 text-black border border-black font-bold text-xs">
            💡 Propuesta para Empezar a Ofertar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {propuestaMenu.map((item, idx) => (
            <div key={idx} className="bg-gray-50 border-2 border-black p-4 shadow-sm space-y-2 hover:border-sage-green transition-all">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-sm text-gray-900">{item.titulo}</h4>
                <span className={`text-[9px] px-2 py-0.5 border border-black font-extrabold shrink-0 ${item.badgeBg}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-gray-600">{item.descripcion}</p>

              <div className="pt-2 border-t border-gray-300 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-gray-500 block text-[10px]">Costo Estimado:</span>
                  <span className="font-bold text-red-700">{item.costoEst}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Margen Bruto Est.:</span>
                  <span className="font-bold text-emerald-700">{item.margen}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[10px]">PVP Sugerido:</span>
                  <span className="font-black text-gray-900 text-sm bg-yellow-200 px-1 border border-black">
                    {item.precioRecomendado}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default ModeloFinancieroProyecciones;
