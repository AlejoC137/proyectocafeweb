import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ArrowLeft,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Send,
  Sparkles,
  Info,
  CheckCircle2,
  PieChart,
  Coffee,
  Trash2,
  Users,
  Scale
} from 'lucide-react';
import { getAllFromTable } from '../../../redux/actions';
import {
  VENTAS,
  MENU,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
  ITEMS,
  PRODUCCION,
  CONSUMO_STAFF,
  BAJAS,
  STAFF
} from '../../../redux/actions-types';
import supabase from '../../../config/supabaseClient';
import {
  calculateFinancialPockets,
  isSaleInPeriod,
  isDateInPeriod,
  POCKET_CONFIG
} from './bolsillos/pocketEngine';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function getBogotaToday() {
  try {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

export default function BolsillosFinancieros() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Autenticación de Staff
  const currentStaff = useSelector((state) => state.currentStaff);
  const isAdmin = currentStaff?.isAdmin === true;

  // Redux Data
  const allVentas = useSelector((state) => state.allVentas || []);
  const allMenu = useSelector((state) => state.allMenu || []);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allConsumoStaff = useSelector((state) => state.allConsumoStaff || []);
  const allStaff = useSelector((state) => state.allStaff || []);
  const allBajasRedux = useSelector((state) => state.allBajas || []);

  const [directBajas, setDirectBajas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Estados de Filtro de Tiempo
  const todayStr = useMemo(() => getBogotaToday(), []);
  const [periodType, setPeriodType] = useState('day'); // 'day' | 'month' | 'custom'
  const [targetDate, setTargetDate] = useState(todayStr);

  const now = new Date();
  const [targetMonth, setTargetMonth] = useState(now.getMonth());
  const [targetYear, setTargetYear] = useState(now.getFullYear());

  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Estados de UI
  const [activeTab, setActiveTab] = useState('bolsillos'); // 'bolsillos' | 'insumos' | 'productos' | 'consumo' | 'bajas' | 'pagos'
  const [searchFilter, setSearchFilter] = useState('');
  const [pocketFilter, setPocketFilter] = useState('ALL');
  const [expandedPocketId, setExpandedPocketId] = useState(null);

  // Carga inicial y auto-fetch si el store está vacío
  const fetchAllTables = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getAllFromTable(VENTAS)),
        dispatch(getAllFromTable(MENU)),
        dispatch(getAllFromTable(RECETAS_MENU)),
        dispatch(getAllFromTable(RECETAS_PRODUCCION)),
        dispatch(getAllFromTable(ITEMS)),
        dispatch(getAllFromTable(PRODUCCION)),
        dispatch(getAllFromTable(CONSUMO_STAFF)),
        dispatch(getAllFromTable(STAFF))
      ]);

      // Consultar tabla Bajas directamente de Supabase para total garantía
      try {
        const { data: bData } = await supabase.from('Bajas').select('*');
        if (bData) setDirectBajas(bData);
      } catch (errB) {
        console.warn('Tabla Bajas no disponible o vacía:', errB);
      }
    } catch (err) {
      console.error('Error cargando tablas para Bolsillos Financieros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allVentas.length || !allMenu.length || !allItems.length || !allConsumoStaff.length) {
      fetchAllTables();
    } else {
      // Intentar cargar Bajas si no se ha cargado
      if (directBajas.length === 0 && allBajasRedux.length === 0) {
        supabase.from('Bajas').select('*').then(({ data }) => {
          if (data) setDirectBajas(data);
        }).catch(() => {});
      }
    }
  }, [dispatch, allVentas.length, allMenu.length, allItems.length, allConsumoStaff.length]);

  // Lista combinada de Bajas (Redux + Direct)
  const combinedBajas = useMemo(() => {
    if (directBajas.length > 0) return directBajas;
    return allBajasRedux;
  }, [directBajas, allBajasRedux]);

  // Filtrar ventas del período seleccionado
  const ventasDelPeriodo = useMemo(() => {
    if (!allVentas || !allVentas.length) return [];
    return allVentas.filter((sale) =>
      isSaleInPeriod(sale, periodType, {
        targetDate,
        targetMonth,
        targetYear,
        customStartDate,
        customEndDate
      })
    );
  }, [allVentas, periodType, targetDate, targetMonth, targetYear, customStartDate, customEndDate]);

  // Filtrar consumos del staff del período seleccionado
  const consumosDelPeriodo = useMemo(() => {
    if (!allConsumoStaff || !allConsumoStaff.length) return [];
    return allConsumoStaff.filter((c) =>
      isDateInPeriod(c.Date || c.created_at, null, periodType, {
        targetDate,
        targetMonth,
        targetYear,
        customStartDate,
        customEndDate
      })
    );
  }, [allConsumoStaff, periodType, targetDate, targetMonth, targetYear, customStartDate, customEndDate]);

  // Filtrar bajas/mermas del período seleccionado
  const bajasDelPeriodo = useMemo(() => {
    if (!combinedBajas || !combinedBajas.length) return [];
    return combinedBajas.filter((b) =>
      isDateInPeriod(b.fecha_baja || b.created_at, null, periodType, {
        targetDate,
        targetMonth,
        targetYear,
        customStartDate,
        customEndDate
      })
    );
  }, [combinedBajas, periodType, targetDate, targetMonth, targetYear, customStartDate, customEndDate]);

  // Cálculo del motor de bolsillos y re-stock (Ventas + Consumo Staff + Bajas)
  const financialData = useMemo(() => {
    return calculateFinancialPockets({
      ventas: ventasDelPeriodo,
      consumoStaff: consumosDelPeriodo,
      bajas: bajasDelPeriodo,
      allStaff,
      allMenu,
      allRecetasMenu,
      allRecetasProduccion,
      allItems,
      allProduccion
    });
  }, [ventasDelPeriodo, consumosDelPeriodo, bajasDelPeriodo, allStaff, allMenu, allRecetasMenu, allRecetasProduccion, allItems, allProduccion]);

  // Manejadores de Fecha Rápida
  const handleSetToday = () => {
    setPeriodType('day');
    setTargetDate(todayStr);
  };

  const handleSetYesterday = () => {
    setPeriodType('day');
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setTargetDate(yStr);
  };

  const handleSetCurrentMonth = () => {
    setPeriodType('month');
    setTargetMonth(now.getMonth());
    setTargetYear(now.getFullYear());
  };

  const handleSetPreviousMonth = () => {
    setPeriodType('month');
    if (now.getMonth() === 0) {
      setTargetMonth(11);
      setTargetYear(now.getFullYear() - 1);
    } else {
      setTargetMonth(now.getMonth() - 1);
      setTargetYear(now.getFullYear());
    }
  };

  // Generador de Reporte para Copiar (WhatsApp / Notas)
  const handleCopyWhatsAppReport = () => {
    let periodDesc = '';
    if (periodType === 'day') {
      periodDesc = `Día: ${targetDate}`;
    } else if (periodType === 'month') {
      periodDesc = `Mes: ${MONTH_NAMES[targetMonth]} ${targetYear}`;
    } else {
      periodDesc = `Rango: ${customStartDate} al ${customEndDate}`;
    }

    const {
      totalIngresoVentas,
      totalRestockGlobal,
      totalRestockVentas,
      totalConsumoInterno,
      totalBajas,
      totalTip,
      gananciaLibre,
      margenLibrePct,
      restockPctGlobal,
      pockets,
      metodosPago,
      ventasPagadasCount,
      consumosCount,
      bajasCount
    } = financialData;

    let text = `☕ *PROYECTO CAFÉ - SEPARADOR DE BOLSILLOS*\n`;
    text += `📅 *${periodDesc}*\n`;
    text += `📋 *Ventas Totales:* $${totalIngresoVentas.toLocaleString('es-CO')} (${ventasPagadasCount} órdenes)\n\n`;

    text += `💼 *TOTAL RE-STOCK A GUARDAR: $${totalRestockGlobal.toLocaleString('es-CO')} (${restockPctGlobal.toFixed(1)}%)*\n`;
    text += `   • Re-Stock Ventas Menú: $${totalRestockVentas.toLocaleString('es-CO')}\n`;
    text += `   • Consumo Interno Staff: $${totalConsumoInterno.toLocaleString('es-CO')} (${consumosCount} consumos)\n`;
    text += `   • Bajas & Mermas: $${totalBajas.toLocaleString('es-CO')} (${bajasCount} registros)\n\n`;

    text += `🏷️ *BOLSILLOS POR CATEGORÍA:*\n`;
    pockets.forEach((p) => {
      text += `   • ${p.icono} ${p.nombre}: $${p.totalRestock.toLocaleString('es-CO')}\n`;
      text += `      (Ventas: $${p.totalRestockVentas.toLocaleString('es-CO')} | Consumo: $${p.totalConsumoInterno.toLocaleString('es-CO')} | Bajas: $${p.totalBajas.toLocaleString('es-CO')})\n`;
    });

    text += `\n🤝 *Bolsillo Propinas (Staff):* $${totalTip.toLocaleString('es-CO')}\n`;
    text += `📈 *Utilidad Operativa Libre:* $${gananciaLibre.toLocaleString('es-CO')} (${margenLibrePct.toFixed(1)}%)\n\n`;

    text += `💳 *MEDIOS DE PAGO:*\n`;
    text += `💵 Efectivo en Caja: $${metodosPago.Efectivo.toLocaleString('es-CO')}\n`;
    text += `💳 Tarjeta / Datáfono: $${metodosPago.Tarjeta.toLocaleString('es-CO')}\n`;
    text += `📲 Transferencias: $${metodosPago.Transferencia.toLocaleString('es-CO')}\n`;
    if (metodosPago.Otros > 0) {
      text += `🔘 Otros: $${metodosPago.Otros.toLocaleString('es-CO')}\n`;
    }

    text += `\n_Generado automáticamente desde Proyecto Café Web_`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Exportar Insumos a CSV
  const handleExportInsumosCSV = () => {
    const rows = [
      ['Insumo / Producto', 'Grupo', 'Cantidad a Reponer', 'Unidad', 'Costo Unitario (COP)', 'Dinero Re-Stock Total (COP)', 'Re-Stock Ventas (COP)', 'Re-Stock Consumo (COP)', 'Re-Stock Bajas (COP)', 'Orígenes', 'Productos que lo Usan']
    ];

    financialData.insumosRestock.forEach((ins) => {
      rows.push([
        `"${ins.nombre}"`,
        `"${ins.grupo || ''}"`,
        ins.cantidadAReponer,
        `"${ins.unidad}"`,
        ins.precioUnitario,
        ins.dineroRestock,
        ins.dineroVentas,
        ins.dineroConsumo,
        ins.dineroBajas,
        `"${ins.origenes.join(' + ')}"`,
        `"${ins.productosAsociados.join(', ')}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ReStock_Insumos_${targetDate || 'periodo'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtros de Insumos y Productos
  const filteredInsumos = useMemo(() => {
    return financialData.insumosRestock.filter((ins) => {
      const matchesSearch = !searchFilter || ins.nombre.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesPocket = pocketFilter === 'ALL' || ins.grupo === pocketFilter;
      return matchesSearch && matchesPocket;
    });
  }, [financialData.insumosRestock, searchFilter, pocketFilter]);

  const filteredProductos = useMemo(() => {
    return financialData.productosVendidos.filter((p) => {
      const matchesSearch = !searchFilter || p.nombre.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesPocket = pocketFilter === 'ALL' || p.grupo === pocketFilter;
      return matchesSearch && matchesPocket;
    });
  }, [financialData.productosVendidos, searchFilter, pocketFilter]);

  // CONTROL DE ACCESO: SOLO ADMINISTRADORES
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border-2 border-red-200 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-2xl font-bold font-SpaceGrotesk text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 text-sm mb-6">
            El <strong>Separador de Bolsillos Financieros</strong> contiene métricas confidenciales de costos, márgenes y dinero de reposición disponible únicamente para cuentas de Administrador.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
            >
              Volver al Portal
            </button>
            <button
              onClick={() => navigate('/MenuView')}
              className="px-5 py-2.5 bg-primary-stitch text-white font-bold rounded-xl text-sm shadow hover:brightness-110 transition-all"
            >
              Ir al Menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20">
      {/* HEADER SUPERIOR */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Título e Identificación */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
                title="Volver"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                    <Wallet className="text-primary-stitch" size={26} />
                    Separador de Bolsillos Financieros
                  </h1>
                  <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Calculador inteligente de re-stock por recetas: <strong>Ventas + Consumo Interno + Bajas</strong>
                </p>
              </div>
            </div>

            {/* Selector de Período y Acciones Rápidas */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Botón Actualizar */}
              <button
                onClick={fetchAllTables}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                title="Recargar datos de la base de datos"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              {/* Botón WhatsApp */}
              <button
                onClick={handleCopyWhatsAppReport}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                title="Copiar resumen para WhatsApp o socios"
              >
                {copiedNotification ? <Check size={14} /> : <Copy size={14} />}
                {copiedNotification ? '¡Copiado!' : 'Copiar Resumen'}
              </button>

              {/* Exportar Insumos CSV */}
              <button
                onClick={handleExportInsumosCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                title="Descargar lista de compras de re-stock en Excel / CSV"
              >
                <Download size={14} />
                <span className="hidden sm:inline">CSV Insumos</span>
              </button>
            </div>
          </div>

          {/* BARRA DE CONTROL DE PERÍODO */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Toggles Día / Mes / Rango */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold self-start">
              <button
                onClick={() => setPeriodType('day')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodType === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ☀️ Ventas del Día
              </button>
              <button
                onClick={() => setPeriodType('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodType === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                📅 Ventas del Mes
              </button>
              <button
                onClick={() => setPeriodType('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodType === 'custom'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                📆 Rango Personalizado
              </button>
            </div>

            {/* Inputs dinámicos según período */}
            <div className="flex flex-wrap items-center gap-2">
              {periodType === 'day' && (
                <>
                  <button
                    onClick={handleSetToday}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={handleSetYesterday}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
                  >
                    Ayer
                  </button>
                  <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2.5 py-1 shadow-sm">
                    <Calendar size={14} className="text-gray-500" />
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                    />
                  </div>
                </>
              )}

              {periodType === 'month' && (
                <>
                  <button
                    onClick={handleSetCurrentMonth}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
                  >
                    Este Mes
                  </button>
                  <button
                    onClick={handleSetPreviousMonth}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
                  >
                    Mes Anterior
                  </button>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm outline-none cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {periodType === 'custom' && (
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2.5 py-1 shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Desde</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                    />
                  </div>
                  <span>a</span>
                  <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2.5 py-1 shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Hasta</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* CARDS DE RESUMEN EJECUTIVO / BOLSILLOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          
          {/* Card 1: Ventas Totales */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Ventas Totales</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign size={18} />
              </span>
            </div>
            <div className="text-2xl font-black font-SpaceGrotesk text-gray-900">
              ${financialData.totalIngresoVentas.toLocaleString('es-CO')}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              <span>{financialData.ventasPagadasCount} órdenes pagadas</span>
              <span className="text-blue-600 font-bold">100% Ingreso</span>
            </div>
          </div>

          {/* Card 2: Bolsillo Re-Stock Total (Ventas + Consumo + Bajas) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-300 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  🔄 Bolsillo Re-Stock Total
                </span>
                <span className="text-[11px] text-amber-700">Guardar para Reposición</span>
              </div>
              <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Package size={18} />
              </span>
            </div>
            <div className="text-2xl font-black font-SpaceGrotesk text-amber-950">
              ${financialData.totalRestockGlobal.toLocaleString('es-CO')}
            </div>
            <div className="flex items-center justify-between text-xs text-amber-800 mt-2 pt-2 border-t border-amber-200 font-medium">
              <span>{financialData.totalInsumosDistintos} insumos a reponer</span>
              <span className="font-bold bg-amber-200/70 px-1.5 py-0.5 rounded text-amber-900">
                {financialData.restockPctGlobal.toFixed(1)}% de venta
              </span>
            </div>
          </div>

          {/* Card 3: Bolsillo Propinas */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  🤝 Bolsillo Propinas
                </span>
                <span className="text-[11px] text-gray-400">Total para el Equipo</span>
              </div>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Send size={18} />
              </span>
            </div>
            <div className="text-2xl font-black font-SpaceGrotesk text-purple-900">
              ${financialData.totalTip.toLocaleString('es-CO')}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              <span>{financialData.propinasPctGlobal.toFixed(1)}% s/ total</span>
              <span className="text-purple-600 font-bold">Separación Staff</span>
            </div>
          </div>

          {/* Card 4: Utilidad Libre */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Utilidad Libre</span>
                <span className="text-[11px] text-gray-400">Post Re-Stock y Propinas</span>
              </div>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="text-2xl font-black font-SpaceGrotesk text-emerald-700">
              ${financialData.gananciaLibre.toLocaleString('es-CO')}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              <span>Margen Operativo</span>
              <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                {financialData.margenLibrePct.toFixed(1)}% Libre
              </span>
            </div>
          </div>
        </div>

        {/* SUB-PANEL: DESGLOSE DE RE-STOCK (VENTAS + CONSUMO + BAJAS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Re-Stock por Ventas Menú</span>
              <span className="text-base font-extrabold font-SpaceGrotesk text-amber-950">
                ${financialData.totalRestockVentas.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {financialData.totalIngresoVentas > 0 ? ((financialData.totalRestockVentas / financialData.totalIngresoVentas) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-800 flex items-center gap-1">
                <Coffee size={12} /> Consumo Interno Staff
              </span>
              <span className="text-base font-extrabold font-SpaceGrotesk text-indigo-950">
                ${financialData.totalConsumoInterno.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              {financialData.consumosCount} consumos
            </span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-800 flex items-center gap-1">
                <Trash2 size={12} /> Bajas y Mermas
              </span>
              <span className="text-base font-extrabold font-SpaceGrotesk text-rose-950">
                ${financialData.totalBajas.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              {financialData.bajasCount} bajas
            </span>
          </div>
        </div>

        {/* BARRA VISUAL DE DISTRIBUCIÓN DE FONDOS */}
        {financialData.totalIngresoVentas > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-gray-700 mb-2 gap-1">
              <span>Distribución Inteligente de Fondos</span>
              <span className="text-gray-400 font-normal">
                Ventas = Re-Stock Ventas + Consumo Interno + Bajas + Propinas + Ganancia Libre
              </span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              {/* Re-stock Ventas */}
              <div
                style={{ width: `${Math.min(100, Math.max(0, (financialData.totalRestockVentas / financialData.totalIngresoVentas) * 100))}%` }}
                className="bg-amber-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Re-Stock Ventas: $${financialData.totalRestockVentas.toLocaleString('es-CO')}`}
              />
              {/* Consumo Interno */}
              <div
                style={{ width: `${Math.min(100, Math.max(0, (financialData.totalConsumoInterno / financialData.totalIngresoVentas) * 100))}%` }}
                className="bg-indigo-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Consumo Interno Staff: $${financialData.totalConsumoInterno.toLocaleString('es-CO')}`}
              />
              {/* Bajas */}
              <div
                style={{ width: `${Math.min(100, Math.max(0, (financialData.totalBajas / financialData.totalIngresoVentas) * 100))}%` }}
                className="bg-rose-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Bajas y Mermas: $${financialData.totalBajas.toLocaleString('es-CO')}`}
              />
              {/* Propinas */}
              <div
                style={{ width: `${Math.min(100, Math.max(0, financialData.propinasPctGlobal))}%` }}
                className="bg-purple-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Propinas Staff: $${financialData.totalTip.toLocaleString('es-CO')}`}
              />
              {/* Ganancia Libre */}
              <div
                style={{ width: `${Math.min(100, Math.max(0, financialData.margenLibrePct))}%` }}
                className="bg-emerald-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Ganancia Libre: $${financialData.gananciaLibre.toLocaleString('es-CO')}`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs mt-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-600">
                  <strong>Re-Stock Ventas:</strong> ${financialData.totalRestockVentas.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-gray-600">
                  <strong>Consumo Interno:</strong> ${financialData.totalConsumoInterno.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-gray-600">
                  <strong>Bajas/Mermas:</strong> ${financialData.totalBajas.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600">
                  <strong>Propinas:</strong> ${financialData.totalTip.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">
                  <strong>Ganancia Libre:</strong> ${financialData.gananciaLibre.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN POR TABS */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl px-2 pt-2 gap-1 overflow-x-auto shadow-sm">
          <button
            onClick={() => setActiveTab('bolsillos')}
            className={`flex items-center gap-2 px-5 py-3 font-SpaceGrotesk font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bolsillos'
                ? 'border-primary-stitch text-primary-stitch bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
            }`}
          >
            <Wallet size={16} />
            Bolsillos por Categoría
            <span className="ml-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-sans">
              {financialData.pockets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('insumos')}
            className={`flex items-center gap-2 px-5 py-3 font-SpaceGrotesk font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'insumos'
                ? 'border-primary-stitch text-primary-stitch bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
            }`}
          >
            <Package size={16} />
            Insumos a Re-comprar
            <span className="ml-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-sans">
              {financialData.insumosRestock.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('productos')}
            className={`flex items-center gap-2 px-5 py-3 font-SpaceGrotesk font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'productos'
                ? 'border-primary-stitch text-primary-stitch bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
            }`}
          >
            <Layers size={16} />
            Menú Vendido ({financialData.productosVendidos.length})
          </button>

          <button
            onClick={() => setActiveTab('consumo')}
            className={`flex items-center gap-2 px-5 py-3 font-SpaceGrotesk font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'consumo'
                ? 'border-primary-stitch text-primary-stitch bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
            }`}
          >
            <Coffee size={16} />
            Consumo Interno Staff
            <span className="ml-1 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-sans">
              {financialData.consumosCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bajas')}
            className={`flex items-center gap-2 px-5 py-3 font-SpaceGrotesk font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bajas'
                ? 'border-primary-stitch text-primary-stitch bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
            }`}
          >
            <Trash2 size={16} />
            Bajas & Mermas
            <span className="ml-1 bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-sans">
              {financialData.bajasCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pagos')}
            className={`flex items-center gap-2 px-5 py-3 font-SpaceGrotesk font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pagos'
                ? 'border-primary-stitch text-primary-stitch bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
            }`}
          >
            <Banknote size={16} />
            Medios de Pago & Caja
          </button>
        </div>

        {/* TAB 1: BOLSILLOS POR CATEGORÍA */}
        {activeTab === 'bolsillos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900">
                  Separación de Fondos por Bolsillo
                </h3>
                <p className="text-xs text-gray-500">
                  Cada bolsillo consolida: <strong>Re-stock de Ventas + Consumo Interno Staff + Bajas y Mermas</strong>
                </p>
              </div>
              <span className="text-xs text-gray-400">
                Haz clic en cualquier bolsillo para ver sus productos vendidos, consumos y bajas
              </span>
            </div>

            {/* Grid de Bolsillos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {financialData.pockets.map((pocket) => {
                const isExpanded = expandedPocketId === pocket.id;
                return (
                  <div
                    key={pocket.id}
                    className={`bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md overflow-hidden ${
                      isExpanded ? 'border-primary-stitch ring-2 ring-primary-stitch/10' : pocket.borderClass
                    }`}
                  >
                    {/* Header del Bolsillo */}
                    <div
                      onClick={() => setExpandedPocketId(isExpanded ? null : pocket.id)}
                      className={`p-4 bg-gradient-to-r ${pocket.headerClass} cursor-pointer flex items-center justify-between select-none`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl drop-shadow-sm">{pocket.icono}</span>
                        <div>
                          <h4 className="font-bold font-SpaceGrotesk text-base tracking-wide leading-tight">
                            {pocket.nombre}
                          </h4>
                          <span className="text-[11px] opacity-90">
                            {pocket.totalItemsVendidos} ítems vendidos
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Cuerpo del Bolsillo */}
                    <div className="p-4 space-y-3">
                      {/* Dinero Total para Re-stock (El más importante) */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                            Total a Guardar en Bolsillo
                          </span>
                          <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                            {pocket.totalVentas > 0 ? ((pocket.totalRestock / pocket.totalVentas) * 100).toFixed(1) : 0}% s/ venta
                          </span>
                        </div>
                        <div className="text-2xl font-black font-SpaceGrotesk text-amber-950 mb-2">
                          ${pocket.totalRestock.toLocaleString('es-CO')}
                        </div>

                        {/* Desglose interno del bolsillo */}
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-amber-200/60 text-[10px]">
                          <div>
                            <span className="text-gray-500 block">Ventas:</span>
                            <strong className="text-amber-900 font-mono">
                              ${pocket.totalRestockVentas.toLocaleString('es-CO')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-indigo-600 block">Consumo:</span>
                            <strong className="text-indigo-950 font-mono">
                              ${pocket.totalConsumoInterno.toLocaleString('es-CO')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-rose-600 block">Bajas:</span>
                            <strong className="text-rose-950 font-mono">
                              ${pocket.totalBajas.toLocaleString('es-CO')}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Ventas y Margen */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Venta Total</span>
                          <span className="font-bold text-gray-800 text-sm">
                            ${pocket.totalVentas.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                          <span className="text-emerald-700 block text-[10px] uppercase font-bold">Margen Libre</span>
                          <span className="font-bold text-emerald-800 text-sm">
                            ${pocket.totalUtilidad.toLocaleString('es-CO')} ({pocket.margenPct.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      {/* Botón expandir */}
                      <button
                        onClick={() => setExpandedPocketId(isExpanded ? null : pocket.id)}
                        className="w-full py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1 border border-dashed border-gray-200"
                      >
                        {isExpanded ? 'Ocultar detalles' : `Ver desglose (${pocket.productos.length} prods, ${pocket.consumos.length} consumos, ${pocket.bajasItems.length} bajas)`}
                      </button>

                      {/* Lista desplegable de detalles del bolsillo */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 max-h-72 overflow-y-auto pr-1">
                          {/* Productos vendidos */}
                          {pocket.productos.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                                Productos Vendidos ({pocket.productos.length})
                              </span>
                              <div className="space-y-1.5">
                                {pocket.productos.map((prod, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="text-xs p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-gray-800 block truncate">{prod.nombre}</span>
                                      <span className="text-[11px] text-gray-500">
                                        {prod.cantidadTotal} und × ${prod.costoProduccionUnitario.toLocaleString('es-CO')}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-extrabold text-amber-900 block">
                                        ${prod.costoTotalRestock.toLocaleString('es-CO')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Consumos Staff */}
                          {pocket.consumos.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">
                                Consumo Staff ({pocket.consumos.length})
                              </span>
                              <div className="space-y-1.5">
                                {pocket.consumos.map((c, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="text-xs p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-indigo-950 block truncate">{c.productoNombre}</span>
                                      <span className="text-[10px] text-indigo-600">
                                        {c.cantidad} und · {c.staffNombre}
                                      </span>
                                    </div>
                                    <span className="font-bold text-indigo-900 font-mono shrink-0">
                                      ${c.costoTotal.toLocaleString('es-CO')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bajas */}
                          {pocket.bajasItems.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1">
                                Bajas & Mermas ({pocket.bajasItems.length})
                              </span>
                              <div className="space-y-1.5">
                                {pocket.bajasItems.map((b, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className="text-xs p-2 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-rose-950 block truncate">{b.nombre}</span>
                                      <span className="text-[10px] text-rose-600">
                                        {b.cantidad} {b.unidad} · {b.motivo}
                                      </span>
                                    </div>
                                    <span className="font-bold text-rose-900 font-mono shrink-0">
                                      ${b.costoPerdida.toLocaleString('es-CO')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INSUMOS A RE-COMPRAR (LISTA DE COMPRAS) */}
        {activeTab === 'insumos' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                  <Package className="text-amber-600" size={20} />
                  Insumos Necesarios para Re-Stock
                </h3>
                <p className="text-xs text-gray-500">
                  Explosión consolidada de materia prima consumida por <strong>Ventas + Consumo Staff + Bajas</strong>
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar insumo..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-stitch w-44"
                  />
                </div>
                <select
                  value={pocketFilter}
                  onChange={(e) => setPocketFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {Object.keys(POCKET_CONFIG).map((k) => (
                    <option key={k} value={k}>
                      {POCKET_CONFIG[k].nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla de Insumos */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Insumo / Producto</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-right">Cant. Total</th>
                    <th className="py-3 px-3 text-right">Costo Unitario</th>
                    <th className="py-3 px-3 text-right font-black text-amber-900">Total a Guardar</th>
                    <th className="py-3 px-3">Orígenes</th>
                    <th className="py-3 px-3">Detalle / Productos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredInsumos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                        No se encontraron insumos con los filtros actuales
                      </td>
                    </tr>
                  ) : (
                    filteredInsumos.map((ins, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {ins.nombre}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {ins.grupo || 'OTROS'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">
                          {ins.cantidadAReponer} {ins.unidad}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500">
                          ${ins.precioUnitario.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-amber-950 bg-amber-50/50">
                          ${ins.dineroRestock.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {ins.origenes.map((orig, oIdx) => (
                              <span
                                key={oIdx}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  orig === 'Ventas'
                                    ? 'bg-amber-100 text-amber-900'
                                    : orig === 'Consumo Interno'
                                    ? 'bg-indigo-100 text-indigo-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {orig}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-[11px] max-w-xs truncate" title={ins.productosAsociados.join(', ')}>
                          {ins.productosAsociados.join(', ')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-amber-50/80 font-bold text-amber-950 border-t-2 border-amber-200">
                  <tr>
                    <td className="py-3 px-3" colSpan={4}>TOTAL DINERO A SEPARAR PARA INSUMOS:</td>
                    <td className="py-3 px-3 text-right font-mono text-sm font-black">
                      ${financialData.totalRestockGlobal.toLocaleString('es-CO')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTOS DEL MENÚ VENDIDOS */}
        {activeTab === 'productos' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                  <Layers className="text-primary-stitch" size={20} />
                  Productos Vendidos y Costo de Producción
                </h3>
                <p className="text-xs text-gray-500">
                  Desglose por producto: precio de venta, costo unitario por receta y margen de ganancia
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-stitch w-44"
                  />
                </div>
                <select
                  value={pocketFilter}
                  onChange={(e) => setPocketFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {Object.keys(POCKET_CONFIG).map((k) => (
                    <option key={k} value={k}>
                      {POCKET_CONFIG[k].nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla de Productos */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Producto Menú</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-center">Cant.</th>
                    <th className="py-3 px-3 text-right">Precio Venta</th>
                    <th className="py-3 px-3 text-right">Costo Unit.</th>
                    <th className="py-3 px-3 text-right">Venta Total</th>
                    <th className="py-3 px-3 text-right font-black text-amber-900">Re-Stock a Guardar</th>
                    <th className="py-3 px-3 text-right text-emerald-800">Utilidad</th>
                    <th className="py-3 px-3 text-right">% Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredProductos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400 text-xs">
                        No hay productos vendidos en este período
                      </td>
                    </tr>
                  ) : (
                    filteredProductos.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{p.nombre}</span>
                            {!p.hasCostData && (
                              <span
                                title="Sin receta vinculada o costo $0. ¡Configura su receta en el menú!"
                                className="text-amber-500 cursor-pointer"
                              >
                                <AlertTriangle size={14} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {p.grupo || 'OTROS'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                          {p.cantidadTotal}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">
                          ${p.precioVentaUnitario.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500">
                          ${p.costoProduccionUnitario.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          ${p.totalIngreso.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50/40">
                          ${p.costoTotalRestock.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          ${p.utilidad.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {p.margenPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
                  <tr>
                    <td className="py-3 px-3" colSpan={5}>TOTALES VENTAS MENÚ:</td>
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      ${financialData.totalIngresoVentas.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-amber-900 font-black">
                      ${financialData.totalRestockVentas.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-emerald-800 font-black">
                      ${(financialData.totalIngresoVentas - financialData.totalRestockVentas).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      {financialData.totalIngresoVentas > 0
                        ? (((financialData.totalIngresoVentas - financialData.totalRestockVentas) / financialData.totalIngresoVentas) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CONSUMO INTERNO STAFF */}
        {activeTab === 'consumo' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                  <Coffee className="text-indigo-600" size={20} />
                  Consumo Interno del Personal (Staff)
                </h3>
                <p className="text-xs text-gray-500">
                  Alimentos y bebidas consumidos por el equipo que requieren reposición de insumos
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                  Total Costo Producción: <strong>${financialData.totalConsumoInterno.toLocaleString('es-CO')}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Staff / Empleado</th>
                    <th className="py-3 px-3">Producto Consumido</th>
                    <th className="py-3 px-3">Bolsillo Asignado</th>
                    <th className="py-3 px-3 text-center">Cant.</th>
                    <th className="py-3 px-3 text-right">Costo Unitario</th>
                    <th className="py-3 px-3 text-right font-black text-indigo-950">Dinero a Reponer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {financialData.consumoInternoList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                        No se registraron consumos internos en este período
                      </td>
                    </tr>
                  ) : (
                    financialData.consumoInternoList.map((c, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-gray-500 font-mono">
                          {c.date ? new Date(c.date).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {c.staffNombre}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-indigo-950">
                          {c.productoNombre}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {c.grupo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                          {c.cantidad}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500">
                          ${c.unitCost.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/50">
                          ${c.costoTotal.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-indigo-50 font-bold text-indigo-950 border-t-2 border-indigo-200">
                  <tr>
                    <td className="py-3 px-3" colSpan={6}>TOTAL REPOSICIÓN POR CONSUMO INTERNO:</td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-black">
                      ${financialData.totalConsumoInterno.toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BAJAS Y MERMAS */}
        {activeTab === 'bajas' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                  <Trash2 className="text-rose-600" size={20} />
                  Bajas, Mermas y Deterioros
                </h3>
                <p className="text-xs text-gray-500">
                  Pérdidas de inventario por vencimiento, daño o mermas que deben ser restituidas
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                  Total Pérdidas a Reponer: <strong>${financialData.totalBajas.toLocaleString('es-CO')}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Item / Insumo</th>
                    <th className="py-3 px-3">Tipo de Baja</th>
                    <th className="py-3 px-3">Motivo / Proceso</th>
                    <th className="py-3 px-3">Bolsillo Asignado</th>
                    <th className="py-3 px-3 text-right">Cant. Mermada</th>
                    <th className="py-3 px-3 text-right font-black text-rose-950">Costo Pérdida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {financialData.bajasList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                        No se registraron bajas o mermas en este período
                      </td>
                    </tr>
                  ) : (
                    financialData.bajasList.map((b, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-gray-500 font-mono">
                          {b.fecha ? new Date(b.fecha).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {b.nombre}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {b.tipoBaja}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {b.motivo}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {b.grupo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">
                          {b.cantidad} {b.unidad}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-900 bg-rose-50/50">
                          ${b.costoPerdida.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-rose-50 font-bold text-rose-950 border-t-2 border-rose-200">
                  <tr>
                    <td className="py-3 px-3" colSpan={6}>TOTAL REPOSICIÓN POR BAJAS Y MERMAS:</td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-black">
                      ${financialData.totalBajas.toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: MEDIOS DE PAGO Y CAJA */}
        {activeTab === 'pagos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Arqueo de Medios de Pago */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                <Banknote className="text-emerald-600" size={20} />
                Ingresos por Método de Pago
              </h3>
              <p className="text-xs text-gray-500">
                Distribución de ingresos según el medio de pago recibido en caja
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-emerald-500 text-white rounded-lg">
                      <Banknote size={18} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Efectivo en Caja</span>
                      <span className="text-[11px] text-emerald-700">Dinero líquido disponible</span>
                    </div>
                  </div>
                  <span className="text-lg font-black font-SpaceGrotesk text-emerald-950">
                    ${financialData.metodosPago.Efectivo.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-blue-500 text-white rounded-lg">
                      <CreditCard size={18} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-blue-950 block">Tarjeta / Datáfono</span>
                      <span className="text-[11px] text-blue-700">Redeban / Bold / Datáfono</span>
                    </div>
                  </div>
                  <span className="text-lg font-black font-SpaceGrotesk text-blue-950">
                    ${financialData.metodosPago.Tarjeta.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-purple-500 text-white rounded-lg">
                      <Send size={18} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-purple-950 block">Transferencias Bancarias</span>
                      <span className="text-[11px] text-purple-700">Bancolombia / Nequi / Daviplata</span>
                    </div>
                  </div>
                  <span className="text-lg font-black font-SpaceGrotesk text-purple-950">
                    ${financialData.metodosPago.Transferencia.toLocaleString('es-CO')}
                  </span>
                </div>

                {financialData.metodosPago.Otros > 0 && (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Otros Medios</span>
                    <span className="text-lg font-black font-SpaceGrotesk text-gray-900">
                      ${financialData.metodosPago.Otros.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sugerencia de Separación Operativa */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold font-SpaceGrotesk text-gray-900 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} />
                Guía de Separación Física de Dinero
              </h3>
              <p className="text-xs text-gray-500">
                Instrucciones recomendadas para el cierre y custodia de bolsillos
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-900 block">1. Bolsillo de Re-Stock Total:</strong>
                    <p className="text-amber-800 mt-0.5">
                      Aparta <strong>${financialData.totalRestockGlobal.toLocaleString('es-CO')}</strong> en un sobre o cuenta de reposición (incluye <strong>${financialData.totalRestockVentas.toLocaleString('es-CO')}</strong> de ventas, <strong>${financialData.totalConsumoInterno.toLocaleString('es-CO')}</strong> de consumo staff y <strong>${financialData.totalBajas.toLocaleString('es-CO')}</strong> de bajas/mermas).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-900 block">2. Bolsillo de Propinas:</strong>
                    <p className="text-purple-800 mt-0.5">
                      Aparta <strong>${financialData.totalTip.toLocaleString('es-CO')}</strong> para entregar o cuadrar con el staff según el esquema de turnos.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 block">3. Utilidad Operativa Disponible:</strong>
                    <p className="text-emerald-800 mt-0.5">
                      Quedan <strong>${financialData.gananciaLibre.toLocaleString('es-CO')}</strong> como margen libre para gastos fijos, nómina y utilidad neta del negocio.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
