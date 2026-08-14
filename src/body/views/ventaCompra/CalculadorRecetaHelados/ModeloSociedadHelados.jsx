import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Plus, 
  Trash2, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Award, 
  ArrowRightLeft,
  Upload,
  AlertCircle
} from "lucide-react";
import supabase from "../../../../config/supabaseClient";

export default function ModeloSociedadHelados({ utilidadNetaProyectada = 3500000 }) {
  // -------------------------------------------------------------
  // 1. ESTADO DE LA PROPUESTA DE SOCIEDAD
  // -------------------------------------------------------------
  const [costoMaquina, setCostoMaquina] = useState(18000000); // $18.000.000 COP
  const [aporteOperativoCafe, setAporteOperativoCafe] = useState(2500000); // $2.500.000 COP / mes en valor asignado
  const [pctProyectoCafe, setPctProyectoCafe] = useState(50); // 50% por defecto
  const [modoPayback, setModoPayback] = useState("acelerado"); // 'acelerado' (70/30 hasta pagar) | 'fijo'
  const [pctPaybackInversionista, setPctPaybackInversionista] = useState(70); // 70% durante fase de amortización
  const [baseUtilidadMensual, setBaseUtilidadMensual] = useState(utilidadNetaProyectada);

  // Actualizar la base de utilidad si cambia desde las proyecciones
  useEffect(() => {
    if (utilidadNetaProyectada > 0) {
      setBaseUtilidadMensual(utilidadNetaProyectada);
    }
  }, [utilidadNetaProyectada]);

  // -------------------------------------------------------------
  // 2. CÁLCULOS DE LA SOCIEDAD & RETORNO DE INVERSIÓN (PAYBACK)
  // -------------------------------------------------------------
  const pctInversionista = useMemo(() => 100 - pctProyectoCafe, [pctProyectoCafe]);

  const calculosSociedad = useMemo(() => {
    const utilidad = parseFloat(baseUtilidadMensual) || 0;
    const invMaquina = parseFloat(costoMaquina) || 0;
    const pctPaybackInv = parseFloat(pctPaybackInversionista) || 70;
    const pctPaybackCafe = 100 - pctPaybackInv;

    // FASE 1: Amortización Acelerada de la Máquina
    const retMensualInvFase1 = utilidad * (pctPaybackInv / 100);
    const retMensualCafeFase1 = utilidad * (pctPaybackCafe / 100);
    const mesesPaybackFase1 = retMensualInvFase1 > 0 ? (invMaquina / retMensualInvFase1).toFixed(1) : "N/A";

    // FASE 2: Operación Madura (Reparto Normal)
    const retMensualCafeMaduro = utilidad * (pctProyectoCafe / 100);
    const retMensualInvMaduro = utilidad * (pctInversionista / 100);
    const mesesPaybackFijo = retMensualInvMaduro > 0 ? (invMaquina / retMensualInvMaduro).toFixed(1) : "N/A";

    // ROI Anual para el Socio Máquina
    const retornoAnualInvMaduro = retMensualInvMaduro * 12;
    const roiAnualPct = invMaquina > 0 ? ((retornoAnualInvMaduro / invMaquina) * 100).toFixed(1) : 0;

    return {
      utilidad,
      invMaquina,
      retMensualInvFase1,
      retMensualCafeFase1,
      mesesPaybackFase1,
      retMensualCafeMaduro,
      retMensualInvMaduro,
      mesesPaybackFijo,
      roiAnualPct
    };
  }, [baseUtilidadMensual, costoMaquina, pctProyectoCafe, pctInversionista, pctPaybackInversionista]);

  // -------------------------------------------------------------
  // 3. ESTADO & MANEJO DE GASTOS EN EL TIEMPO (SUPABASE + LOCALSTORAGE)
  // -------------------------------------------------------------
  const [gastos, setGastos] = useState([]);
  const [loadingGastos, setLoadingGastos] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroPagadoPor, setFiltroPagadoPor] = useState("TODOS");

  // Formulario nuevo gasto
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoria: "Insumos",
    monto: "",
    pagadoPor: "Proyecto Café",
    fotoUrl: "",
    notas: ""
  });
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Cargar gastos al montar
  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    setLoadingGastos(true);
    let loadedGastos = [];
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("gastos_helados_sociedad")
          .select("*")
          .order("fecha", { ascending: false });

        if (!error && data) {
          loadedGastos = data;
        }
      }
    } catch (err) {
      console.warn("No se pudo conectar a Supabase para gastos, usando respaldo local:", err);
    }

    // Si no hay datos en Supabase o falló, usar localStorage
    if (loadedGastos.length === 0) {
      try {
        const saved = localStorage.getItem("dubovik_gastos_sociedad");
        if (saved) {
          loadedGastos = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Error al leer gastos de localStorage:", e);
      }
    }

    setGastos(loadedGastos);
    setLoadingGastos(false);
  };

  const syncGastosToLocalStorage = (updatedList) => {
    try {
      localStorage.setItem("dubovik_gastos_sociedad", JSON.stringify(updatedList));
    } catch (e) {
      console.error("Error guardando en localStorage:", e);
    }
  };

  const handleAddGasto = async (e) => {
    e.preventDefault();
    if (!nuevoGasto.descripcion || !nuevoGasto.monto) {
      alert("Por favor completa el concepto y el monto del gasto.");
      return;
    }

    const item = {
      id: `gasto_${Date.now()}`,
      fecha: nuevoGasto.fecha,
      descripcion: nuevoGasto.descripcion,
      categoria: nuevoGasto.categoria,
      monto: parseFloat(nuevoGasto.monto) || 0,
      pagadoPor: nuevoGasto.pagadoPor,
      fotoUrl: nuevoGasto.fotoUrl,
      notas: nuevoGasto.notas,
      created_at: new Date().toISOString()
    };

    // 1. Guardar localmente de inmediato
    const updated = [item, ...gastos];
    setGastos(updated);
    syncGastosToLocalStorage(updated);

    // 2. Intentar guardar en Supabase si la tabla existe
    try {
      if (supabase) {
        const { error } = await supabase.from("gastos_helados_sociedad").insert([{
          fecha: item.fecha,
          descripcion: item.descripcion,
          categoria: item.categoria,
          monto: item.monto,
          pagado_por: item.pagadoPor,
          foto_url: item.fotoUrl,
          notas: item.notas
        }]);

        if (error) {
          console.warn("Aviso: Supabase insert omitido o requiere migración de tabla. Se guardó en memoria local.", error.message);
        }
      }
    } catch (err) {
      console.warn("Supabase no disponible, gasto guardado localmente.", err);
    }

    // Limpiar formulario
    setNuevoGasto({
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      categoria: "Insumos",
      monto: "",
      pagadoPor: "Proyecto Café",
      fotoUrl: "",
      notas: ""
    });
  };

  const handleDeleteGasto = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro de gasto?")) return;

    const updated = gastos.filter((g) => g.id !== id && g._id !== id);
    setGastos(updated);
    syncGastosToLocalStorage(updated);

    try {
      if (supabase) {
        await supabase.from("gastos_helados_sociedad").delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Error borrando en Supabase:", err);
    }
  };

  // Manejador de subida de imagen (Convertir a Data URL para previsualización inmediata)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNuevoGasto((prev) => ({ ...prev, fotoUrl: reader.result }));
      setSubiendoFoto(false);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // 4. METRICAS & CÁLCULOS DEL DASHBOARD DE GASTOS
  // -------------------------------------------------------------
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const matchCat = filtroCategoria === "TODAS" || g.categoria === filtroCategoria;
      const matchPagado = filtroPagadoPor === "TODOS" || (g.pagadoPor || g.pagado_por) === filtroPagadoPor;
      return matchCat && matchPagado;
    });
  }, [gastos, filtroCategoria, filtroPagadoPor]);

  const resumenGastos = useMemo(() => {
    let totalGeneral = 0;
    let totalCafe = 0;
    let totalSocioMaquina = 0;
    let totalFondoComun = 0;

    const porCategoria = {
      Insumos: 0,
      "Mantenimiento Máquina": 0,
      Repuestos: 0,
      "Servicios / Energía": 0,
      "Transporte / Flete": 0,
      "Publicidad / Marketing": 0,
      Otros: 0
    };

    gastos.forEach((g) => {
      const monto = parseFloat(g.monto) || 0;
      totalGeneral += monto;

      const payer = g.pagadoPor || g.pagado_por || "Proyecto Café";
      if (payer === "Proyecto Café") totalCafe += monto;
      else if (payer === "Socio Máquina") totalSocioMaquina += monto;
      else totalFondoComun += monto;

      const cat = g.categoria || "Otros";
      if (porCategoria[cat] !== undefined) {
        porCategoria[cat] += monto;
      } else {
        porCategoria.Otros += monto;
      }
    });

    // Saldo de Nivelación: Drenaje o saldo compensatorio
    const diferenciaAportes = totalCafe - totalSocioMaquina;

    return {
      totalGeneral,
      totalCafe,
      totalSocioMaquina,
      totalFondoComun,
      porCategoria,
      diferenciaAportes
    };
  }, [gastos]);

  // Datos ordenados por mes para la gráfica de línea / barras de tiempo
  const gastosPorMesGrafica = useMemo(() => {
    const mapMeses = {};
    gastos.forEach((g) => {
      if (!g.fecha) return;
      const keyMes = g.fecha.substring(0, 7); // "YYYY-MM"
      const monto = parseFloat(g.monto) || 0;
      mapMeses[keyMes] = (mapMeses[keyMes] || 0) + monto;
    });

    const llavesOrdenadas = Object.keys(mapMeses).sort();
    return llavesOrdenadas.map((mes) => ({
      mes,
      monto: mapMeses[mes]
    }));
  }, [gastos]);

  const maxMontoGrafica = useMemo(() => {
    if (gastosPorMesGrafica.length === 0) return 1;
    return Math.max(...gastosPorMesGrafica.map((d) => d.monto));
  }, [gastosPorMesGrafica]);

  return (
    <div className="space-y-8 animate-fadeIn font-SpaceGrotesk">
      
      {/* ========================================================================= */}
      {/* SECCIÓN 1: MODELO DE SOCIEDAD & PROPUESTA COMERCIAL DE ACCIONARIADO       */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-6">
        
        {/* ENCABEZADO */}
        <div className="border-b-2 border-black pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-yellow-50 p-4 border-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-terracotta-accent text-white border-2 border-black shadow-solid">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg md:text-xl text-gray-900 flex items-center gap-2">
                5. Modelo & Propuesta de Sociedad: Proyecto Café 🤝 Socio Máquina
              </h3>
              <p className="text-xs text-gray-700">
                Calculadora interactiva para estructurar el reparto de utilidades y retorno de capital de la máquina de helado soft.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-300 text-emerald-950 border border-black font-extrabold text-xs shadow-sm flex items-center gap-1 shrink-0">
            <ShieldCheck className="h-4 w-4" /> Acuerdo Negociable
          </span>
        </div>

        {/* CONTROLES DE LA SOCIEDAD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border-2 border-black p-4">
          
          {/* Valor Máquina */}
          <div>
            <label className="block text-xs font-black text-gray-900 mb-1">
              🍦 Valor de la Máquina de Helado Soft ($ COP):
            </label>
            <input
              type="number"
              value={costoMaquina}
              onChange={(e) => setCostoMaquina(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border-2 border-black font-mono font-bold bg-white text-sm focus:ring-2 focus:ring-sage-green"
            />
            <p className="text-[10px] text-gray-500 mt-1">Capital aportado por el Inversionista/Socio.</p>
          </div>

          {/* Valor Aporte Operativo Proyecto Café */}
          <div>
            <label className="block text-xs font-black text-gray-900 mb-1">
              ☕ Valor Estimado Operación Proyecto Café ($ COP/mes):
            </label>
            <input
              type="number"
              value={aporteOperativoCafe}
              onChange={(e) => setAporteOperativoCafe(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border-2 border-black font-mono font-bold bg-white text-sm focus:ring-2 focus:ring-sage-green"
            />
            <p className="text-[10px] text-gray-500 mt-1">Recetas Dubovik, insumos, personal, local y atención.</p>
          </div>

          {/* Utilidad Neta Mensual Base */}
          <div>
            <label className="block text-xs font-black text-gray-900 mb-1">
              📈 Utilidad Neta Mensual Proyectada ($ COP/mes):
            </label>
            <input
              type="number"
              value={baseUtilidadMensual}
              onChange={(e) => setBaseUtilidadMensual(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border-2 border-black font-mono font-bold bg-yellow-100 text-sm focus:ring-2 focus:ring-sage-green"
            />
            <p className="text-[10px] text-gray-500 mt-1">Tomado de la pestaña de proyecciones financieras.</p>
          </div>
        </div>

        {/* ESTRATEGIA DE REPARTO DE UTILIDADES */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-terracotta-accent" /> Configuración del Porcentaje de Participación
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Slider de Porcentaje Base */}
            <div className="bg-white border-2 border-black p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-black">
                <span>Proyecto Café: <strong className="text-emerald-700 text-sm">{pctProyectoCafe}%</strong></span>
                <span>Socio Máquina: <strong className="text-blue-700 text-sm">{pctInversionista}%</strong></span>
              </div>

              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={pctProyectoCafe}
                onChange={(e) => setPctProyectoCafe(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-terracotta-accent border border-black"
              />

              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                <span>10% Café / 90% Socio</span>
                <span>50% / 50% (Equitativo)</span>
                <span>90% Café / 10% Socio</span>
              </div>
            </div>

            {/* Selector de Modo de Amortización / Payback */}
            <div className="bg-white border-2 border-black p-4 space-y-3 shadow-sm">
              <label className="block text-xs font-black text-gray-900">Estrategia de Retorno del Capital (Payback):</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModoPayback("acelerado")}
                  className={`p-2 border-2 border-black font-bold text-xs transition-all ${
                    modoPayback === "acelerado"
                      ? "bg-terracotta-accent text-white shadow-solid"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  ⚡ Amortización Acelerada ({pctPaybackInversionista}% Socio hasta recuperar)
                </button>

                <button
                  type="button"
                  onClick={() => setModoPayback("fijo")}
                  className={`p-2 border-2 border-black font-bold text-xs transition-all ${
                    modoPayback === "fijo"
                      ? "bg-sage-green text-white shadow-solid"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  ⚖️ Reparto Fijo Directo ({pctProyectoCafe}% / {pctInversionista}%)
                </button>
              </div>

              {modoPayback === "acelerado" && (
                <div className="pt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-700">Porcentaje Socio durante Pago Máquina:</span>
                  <select
                    value={pctPaybackInversionista}
                    onChange={(e) => setPctPaybackInversionista(parseInt(e.target.value))}
                    className="p-1 border border-black font-bold bg-yellow-50 text-xs"
                  >
                    <option value={80}>80% Socio / 20% Café</option>
                    <option value={70}>70% Socio / 30% Café (Recomendado)</option>
                    <option value={60}>60% Socio / 40% Café</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TARJETAS DE RESULTADOS & RESUMEN DE GANANCIAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          
          {/* Tarjeta 1: Retorno Mensual Proyecto Café */}
          <div className="bg-emerald-50 border-2 border-black p-4 space-y-1 text-emerald-950 shadow-solid">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800">
              ☕ Ganancia Proyecto Café
            </span>
            <span className="text-lg md:text-xl font-black font-mono block">
              ${(modoPayback === "acelerado" ? calculosSociedad.retMensualCafeFase1 : calculosSociedad.retMensualCafeMaduro).toLocaleString("es-CO")}/mes
            </span>
            <span className="text-[10px] text-emerald-800 font-semibold block pt-1 border-t border-emerald-300">
              {modoPayback === "acelerado" ? `Fase 1 (${100 - pctPaybackInversionista}%)` : `Reparto (${pctProyectoCafe}%)`}
            </span>
          </div>

          {/* Tarjeta 2: Retorno Mensual Socio Máquina */}
          <div className="bg-blue-50 border-2 border-black p-4 space-y-1 text-blue-950 shadow-solid">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-800">
              🍦 Ganancia Socio Máquina
            </span>
            <span className="text-lg md:text-xl font-black font-mono block">
              ${(modoPayback === "acelerado" ? calculosSociedad.retMensualInvFase1 : calculosSociedad.retMensualInvMaduro).toLocaleString("es-CO")}/mes
            </span>
            <span className="text-[10px] text-blue-800 font-semibold block pt-1 border-t border-blue-300">
              {modoPayback === "acelerado" ? `Fase 1 (${pctPaybackInversionista}%)` : `Reparto (${pctInversionista}%)`}
            </span>
          </div>

          {/* Tarjeta 3: Tiempo Payback Máquina */}
          <div className="bg-amber-50 border-2 border-black p-4 space-y-1 text-amber-950 shadow-solid">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-800">
              ⏳ Retorno Total Máquina (Payback)
            </span>
            <span className="text-lg md:text-xl font-black font-mono block text-amber-900">
              {modoPayback === "acelerado" ? calculosSociedad.mesesPaybackFase1 : calculosSociedad.mesesPaybackFijo} Meses
            </span>
            <span className="text-[10px] text-amber-800 font-semibold block pt-1 border-t border-amber-300">
              Amortización del 100% de ${calculosSociedad.invMaquina.toLocaleString("es-CO")}
            </span>
          </div>

          {/* Tarjeta 4: ROI Anual Inversionista */}
          <div className="bg-purple-50 border-2 border-black p-4 space-y-1 text-purple-950 shadow-solid">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-800">
              💎 Rendimiento Anual (ROI)
            </span>
            <span className="text-lg md:text-xl font-black font-mono block text-purple-900">
              {calculosSociedad.roiAnualPct}% / año
            </span>
            <span className="text-[10px] text-purple-800 font-semibold block pt-1 border-t border-purple-300">
              Rentabilidad sobre la máquina
            </span>
          </div>
        </div>

        {/* RESUMEN DEL ACUERDO EN TEXTO CLARO LISTO PARA PRESENTAR AL SOCIO */}
        <div className="bg-gray-900 text-white p-4 border-2 border-black shadow-solid space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-xs uppercase tracking-wider">
            <FileText className="h-4 w-4" /> Borrador de Propuesta Comercial Negociable:
          </div>
          <p className="text-xs leading-relaxed text-gray-200 font-sans">
            "<strong>Proyecto Café</strong> aporta la formulación técnica de helados Dubovik, los insumos base, la atención al público, personal de operación y espacio físico. El <strong>Socio Máquina</strong> aporta el equipo de helado soft valorado en <strong>${calculosSociedad.invMaquina.toLocaleString("es-CO")} COP</strong>. 
            {modoPayback === "acelerado" ? (
              <span> Se establece una <strong>Fase de Amortización Acelerada</strong> donde el socio recibe el <strong>{pctPaybackInversionista}%</strong> de la utilidad neta mensual (${calculosSociedad.retMensualInvFase1.toLocaleString("es-CO")} COP/mes est.) para recuperar su máquina en aprox. <strong>{calculosSociedad.mesesPaybackFase1} meses</strong>. Cumplido este plazo, la sociedad pasa a un reparto continuo de <strong>{pctProyectoCafe}% Proyecto Café / {pctInversionista}% Socio Máquina</strong>."</span>
            ) : (
              <span> Se acuerda un reparto de utilidades continuo del <strong>{pctProyectoCafe}% para Proyecto Café y {pctInversionista}% para el Socio Máquina</strong>, logrando un retorno estimado de la inversión en <strong>{calculosSociedad.mesesPaybackFijo} meses</strong> con un ROI anual del {calculosSociedad.roiAnualPct}%."</span>
            )}
          </p>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* SECCIÓN 2: REGISTRO DE GASTOS EN EL TIEMPO & HISTORIAL                     */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-6">
        
        {/* ENCABEZADO */}
        <div className="border-b-2 border-black pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base md:text-lg text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-terracotta-accent" />
              6. Registro & Seguimiento de Gastos en el Tiempo
            </h3>
            <p className="text-xs text-gray-600">
              Registra los gastos pasados y futuros con comprobante/foto. Sincronizado en tiempo real con Supabase y respaldo local.
            </p>
          </div>

          <button
            onClick={fetchGastos}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-black text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingGastos ? "animate-spin" : ""}`} /> Recargar Gastos
          </button>
        </div>

        {/* FORMULARIO PARA REGISTRAR NUEVO GASTO */}
        <form onSubmit={handleAddGasto} className="bg-yellow-50 border-2 border-black p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950 border-b border-amber-200 pb-2">
            <Plus className="h-4 w-4 text-terracotta-accent" />
            <span>Agregar Nuevo Gasto o Inversión al Registro</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Fecha */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">Fecha del Gasto:</label>
              <input
                type="date"
                value={nuevoGasto.fecha}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
                className="w-full p-2 border border-black text-xs font-mono font-bold bg-white"
                required
              />
            </div>

            {/* Concepto */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-800 mb-1">Concepto / Descripción:</label>
              <input
                type="text"
                placeholder="Ej. Compra de 50L leche + kit de o-rings sanitarios"
                value={nuevoGasto.descripcion}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
                className="w-full p-2 border border-black text-xs font-semibold bg-white"
                required
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">Monto ($ COP):</label>
              <input
                type="number"
                placeholder="Ej. 185000"
                value={nuevoGasto.monto}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                className="w-full p-2 border border-black text-xs font-mono font-bold bg-white text-right"
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">Categoría:</label>
              <select
                value={nuevoGasto.categoria}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                className="w-full p-2 border border-black text-xs font-bold bg-white cursor-pointer"
              >
                <option value="Insumos">Insumos / Ingredientes</option>
                <option value="Mantenimiento Máquina">Mantenimiento Máquina</option>
                <option value="Repuestos">Repuestos / O-rings</option>
                <option value="Servicios / Energía">Servicios / Energía</option>
                <option value="Transporte / Flete">Transporte / Flete</option>
                <option value="Publicidad / Marketing">Publicidad / Marketing</option>
                <option value="Otros">Otros Gastos</option>
              </select>
            </div>

            {/* Pagado Por */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">Pagado Por / Asignado a:</label>
              <select
                value={nuevoGasto.pagadoPor}
                onChange={(e) => setNuevoGasto({ ...nuevoGasto, pagadoPor: e.target.value })}
                className="w-full p-2 border border-black text-xs font-bold bg-white cursor-pointer"
              >
                <option value="Proyecto Café">Proyecto Café</option>
                <option value="Socio Máquina">Socio Máquina</option>
                <option value="Fondo Común">Fondo Común Helados</option>
              </select>
            </div>

            {/* Adjuntar Foto / Comprobante */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-800 mb-1">Foto / Comprobante de Evidencia:</label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-2 bg-white border border-black text-xs font-bold cursor-pointer hover:bg-gray-100 flex items-center gap-1 shrink-0">
                  <Upload className="h-3.5 w-3.5 text-sage-green" />
                  <span>{subiendoFoto ? "Cargando..." : "Subir Foto"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                
                <input
                  type="text"
                  placeholder="o pega URL de foto/comprobante..."
                  value={nuevoGasto.fotoUrl}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, fotoUrl: e.target.value })}
                  className="w-full p-2 border border-black text-xs font-mono bg-white truncate"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-amber-200 pt-3">
            {nuevoGasto.fotoUrl && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span>Imagen/Comprobante adjuntado correctamente</span>
              </div>
            )}

            <button
              type="submit"
              className="ml-auto px-5 py-2 bg-terracotta-accent hover:bg-red-700 text-white font-extrabold text-xs border-2 border-black shadow-solid transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Registrar Gasto en Supabase
            </button>
          </div>
        </form>

        {/* FILTROS Y TABLA DE GASTOS */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-100 p-2.5 border-2 border-black text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              <span>Filtrar Registros:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="p-1 border border-black font-semibold text-xs bg-white"
              >
                <option value="TODAS">Todas las Categorías</option>
                <option value="Insumos">Insumos</option>
                <option value="Mantenimiento Máquina">Mantenimiento Máquina</option>
                <option value="Repuestos">Repuestos</option>
                <option value="Servicios / Energía">Servicios / Energía</option>
                <option value="Transporte / Flete">Transporte / Flete</option>
                <option value="Publicidad / Marketing">Publicidad / Marketing</option>
                <option value="Otros">Otros</option>
              </select>

              <select
                value={filtroPagadoPor}
                onChange={(e) => setFiltroPagadoPor(e.target.value)}
                className="p-1 border border-black font-semibold text-xs bg-white"
              >
                <option value="TODOS">Todos los Responsables</option>
                <option value="Proyecto Café">Proyecto Café</option>
                <option value="Socio Máquina">Socio Máquina</option>
                <option value="Fondo Común">Fondo Común</option>
              </select>
            </div>
          </div>

          {/* TABLA DE GASTOS */}
          <div className="border-2 border-black bg-white overflow-hidden shadow-sm">
            {gastosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 font-semibold space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
                <p>No hay gastos registrados que coincidan con el filtro.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-900 text-white font-bold">
                      <th className="p-2.5 border-r border-gray-700">Fecha</th>
                      <th className="p-2.5 border-r border-gray-700">Concepto / Descripción</th>
                      <th className="p-2.5 border-r border-gray-700">Categoría</th>
                      <th className="p-2.5 border-r border-gray-700">Pagado Por</th>
                      <th className="p-2.5 border-r border-gray-700 text-right">Monto ($ COP)</th>
                      <th className="p-2.5 border-r border-gray-700 text-center">Evidencia</th>
                      <th className="p-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastosFiltrados.map((gasto, idx) => {
                      const idVal = gasto.id || gasto._id;
                      const payer = gasto.pagadoPor || gasto.pagado_por || "Proyecto Café";
                      const foto = gasto.fotoUrl || gasto.foto_url;

                      return (
                        <tr key={idVal || idx} className="border-b border-gray-200 hover:bg-yellow-50 transition-colors">
                          <td className="p-2.5 border-r border-gray-300 font-mono font-bold text-gray-900">
                            {gasto.fecha}
                          </td>
                          
                          <td className="p-2.5 border-r border-gray-300 font-semibold text-gray-900">
                            {gasto.descripcion}
                          </td>

                          <td className="p-2.5 border-r border-gray-300">
                            <span className="px-2 py-0.5 bg-gray-100 border border-black text-[10px] font-bold">
                              {gasto.categoria}
                            </span>
                          </td>

                          <td className="p-2.5 border-r border-gray-300">
                            <span className={`px-2 py-0.5 border text-[10px] font-extrabold ${
                              payer === "Proyecto Café" 
                                ? "bg-emerald-100 text-emerald-950 border-emerald-400"
                                : payer === "Socio Máquina"
                                ? "bg-blue-100 text-blue-950 border-blue-400"
                                : "bg-purple-100 text-purple-950 border-purple-400"
                            }`}>
                              {payer}
                            </span>
                          </td>

                          <td className="p-2.5 border-r border-gray-300 text-right font-mono font-extrabold text-red-700">
                            ${(parseFloat(gasto.monto) || 0).toLocaleString("es-CO")}
                          </td>

                          <td className="p-2.5 border-r border-gray-300 text-center">
                            {foto ? (
                              <a
                                href={foto}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 bg-yellow-300 hover:bg-yellow-400 border border-black inline-flex items-center gap-1 text-[10px] font-bold text-black"
                                title="Ver comprobante adjunto"
                              >
                                <ImageIcon className="h-3.5 w-3.5" /> Foto
                              </a>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">Sin foto</span>
                            )}
                          </td>

                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleDeleteGasto(idVal)}
                              className="p-1 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-600 rounded transition-all"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* SECCIÓN 3: DASHBOARD VISUAL Y GRÁFICAS ("TODA LA GRÁFICA")                 */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-6">
        
        {/* ENCABEZADO */}
        <div className="border-b-2 border-black pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base md:text-lg text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-terracotta-accent" />
              7. Dashboard Gráfico de Análisis de Gastos & Balance de Cuentas
            </h3>
            <p className="text-xs text-gray-600">
              Visualización interactiva de la acumulación de gastos en el tiempo y nivelación entre socios.
            </p>
          </div>
        </div>

        {/* METRICAS CLAVE DE NIVELACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 border-2 border-black p-3 space-y-1 font-mono">
            <span className="text-[10px] text-gray-600 uppercase font-bold block">Total Gastos Proyecto Café:</span>
            <span className="text-lg font-black text-emerald-800">${resumenGastos.totalCafe.toLocaleString("es-CO")}</span>
          </div>

          <div className="bg-gray-100 border-2 border-black p-3 space-y-1 font-mono">
            <span className="text-[10px] text-gray-600 uppercase font-bold block">Total Gastos Socio Máquina:</span>
            <span className="text-lg font-black text-blue-800">${resumenGastos.totalSocioMaquina.toLocaleString("es-CO")}</span>
          </div>

          <div className="bg-yellow-100 border-2 border-black p-3 space-y-1 font-mono">
            <span className="text-[10px] text-amber-900 uppercase font-bold block">Saldo Nivelación de Aportes:</span>
            <span className="text-lg font-black text-amber-950">
              {resumenGastos.diferenciaAportes > 0 
                ? `Proyecto Café aportó +$${resumenGastos.diferenciaAportes.toLocaleString("es-CO")}`
                : `Socio Máquina aportó +$${Math.abs(resumenGastos.diferenciaAportes).toLocaleString("es-CO")}`
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* GRÁFICA 1: EVOLUCIÓN MENSUAL DE GASTOS (SVG NEO-BRUTALISTA) */}
          <div className="bg-gray-50 border-2 border-black p-4 space-y-3 shadow-sm">
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center justify-between border-b border-gray-300 pb-2">
              <span>📊 Evolución de Gastos Acumulados por Mes</span>
              <span className="text-[10px] font-mono text-gray-600">Total: ${resumenGastos.totalGeneral.toLocaleString("es-CO")}</span>
            </h4>

            {gastosPorMesGrafica.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center italic">Registra tus primeros gastos para generar el gráfico de tiempo.</p>
            ) : (
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b-2 border-black bg-white">
                {gastosPorMesGrafica.map((item, idx) => {
                  const alturaPct = maxMontoGrafica > 0 ? (item.monto / maxMontoGrafica) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip Hover */}
                      <div className="absolute -top-8 bg-gray-900 text-white text-[10px] font-mono p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        ${item.monto.toLocaleString("es-CO")}
                      </div>

                      {/* Barra SVG */}
                      <div
                        style={{ height: `${Math.max(alturaPct, 6)}%` }}
                        className="w-full bg-terracotta-accent border-2 border-black hover:bg-red-600 transition-all shadow-sm"
                      />

                      <span className="text-[10px] font-mono font-bold mt-2 text-gray-700 truncate w-full text-center">
                        {item.mes}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GRÁFICA 2: DISTRIBUCIÓN DE GASTOS POR CATEGORÍA (BARRAS DE PORCENTAJE) */}
          <div className="bg-gray-50 border-2 border-black p-4 space-y-3 shadow-sm">
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2">
              🍩 Distribución de Gastos por Categoría
            </h4>

            <div className="space-y-2.5 pt-1">
              {Object.entries(resumenGastos.porCategoria).map(([cat, totalCat], idx) => {
                const pct = resumenGastos.totalGeneral > 0 ? (totalCat / resumenGastos.totalGeneral) * 100 : 0;
                if (totalCat === 0) return null;

                const colores = [
                  "bg-emerald-500", "bg-blue-500", "bg-amber-500", 
                  "bg-purple-500", "bg-red-500", "bg-sky-500", "bg-gray-500"
                ];
                const colorBg = colores[idx % colores.length];

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-800">{cat}</span>
                      <span className="font-mono text-gray-900">
                        ${totalCat.toLocaleString("es-CO")} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-200 border border-black">
                      <div
                        className={`h-full ${colorBg} border-r border-black transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {resumenGastos.totalGeneral === 0 && (
                <p className="text-xs text-gray-500 py-12 text-center italic">Sin gastos registrados para mostrar categorías.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
