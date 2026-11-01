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
  PieChart
} from 'lucide-react';
import { getAllFromTable } from '../../../redux/actions';
import {
  VENTAS,
  MENU,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
  ITEMS,
  PRODUCCION
} from '../../../redux/actions-types';
import {
  calculateFinancialPockets,
  isSaleInPeriod,
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
  const [activeTab, setActiveTab] = useState('bolsillos'); // 'bolsillos' | 'insumos' | 'productos' | 'pagos'
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
        dispatch(getAllFromTable(PRODUCCION))
      ]);
    } catch (err) {
      console.error('Error cargando tablas para Bolsillos Financieros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allVentas.length || !allMenu.length || !allItems.length) {
      fetchAllTables();
    }
  }, [dispatch, allVentas.length, allMenu.length, allItems.length]);

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

  // Cálculo del motor de bolsillos y re-stock
  const financialData = useMemo(() => {
    return calculateFinancialPockets({
      ventas: ventasDelPeriodo,
      allMenu,
      allRecetasMenu,
      allRecetasProduccion,
      allItems,
      allProduccion
    });
  }, [ventasDelPeriodo, allMenu, allRecetasMenu, allRecetasProduccion, allItems, allProduccion]);

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
      totalTip,
      gananciaLibre,
      margenLibrePct,
      restockPctGlobal,
      pockets,
      metodosPago,
      ventasPagadasCount
    } = financialData;

    let text = `☕ *PROYECTO CAFÉ - SEPARADOR DE BOLSILLOS*\n`;
    text += `📅 *${periodDesc}*\n`;
    text += `📋 *Ventas Totales:* $${totalIngresoVentas.toLocaleString('es-CO')} (${ventasPagadasCount} órdenes)\n\n`;

    text += `💼 *BOLSILLOS FINANCIEROS A SEPARAR:*\n`;
    text += `🔄 *Bolsillo Re-Stock (Insumos):* $${totalRestockGlobal.toLocaleString('es-CO')} (${restockPctGlobal.toFixed(1)}%)\n`;

    pockets.forEach((p) => {
      text += `   • ${p.icono} ${p.nombre}: $${p.totalRestock.toLocaleString('es-CO')} (Venta: $${p.totalVentas.toLocaleString('es-CO')})\n`;
    });

    text += `\n🤝 *Bolsillo Propinas (Staff):* $${totalTip.toLocaleString('es-CO')}\n`;
    text += `📈 *Bolsillo Utilidad Libre:* $${gananciaLibre.toLocaleString('es-CO')} (${margenLibrePct.toFixed(1)}%)\n\n`;

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
      ['Insumo / Producto', 'Grupo', 'Cantidad a Reponer', 'Unidad', 'Costo Unitario (COP)', 'Dinero Re-Stock (COP)', 'Productos que lo Usan']
    ];

    financialData.insumosRestock.forEach((ins) => {
      rows.push([
        `"${ins.nombre}"`,
        `"${ins.grupo || ''}"`,
        ins.cantidadAReponer,
        `"${ins.unidad}"`,
        ins.precioUnitario,
        ins.dineroRestock,
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
                  Calculador inteligente de re-stock por recetas, propinas y bolsillos por categorías
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
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

          {/* Card 2: Bolsillo Re-Stock Total */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-300 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  🔄 Bolsillo Re-Stock
                </span>
                <span className="text-[11px] text-amber-700">Guardar para Recompra</span>
              </div>
              <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Package size={18} />
              </span>
            </div>
            <div className="text-2xl font-black font-SpaceGrotesk text-amber-950">
              ${financialData.totalRestockGlobal.toLocaleString('es-CO')}
            </div>
            <div className="flex items-center justify-between text-xs text-amber-800 mt-2 pt-2 border-t border-amber-200 font-medium">
              <span>{financialData.totalInsumosDistintos} insumos consumidos</span>
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

        {/* BARRA VISUAL DE DISTRIBUCIÓN DE FONDOS */}
        {financialData.totalIngresoVentas > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-gray-700 mb-2 gap-1">
              <span>Distribución Inteligente de Fondos de lo Vendido</span>
              <span className="text-gray-400 font-normal">
                100% de la venta = Re-Stock Insumos + Propinas + Ganancia Libre
              </span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.min(100, Math.max(0, financialData.restockPctGlobal))}%` }}
                className="bg-amber-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Re-Stock Insumos: ${financialData.restockPctGlobal.toFixed(1)}% ($${financialData.totalRestockGlobal.toLocaleString('es-CO')})`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, financialData.propinasPctGlobal))}%` }}
                className="bg-purple-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Propinas Staff: ${financialData.propinasPctGlobal.toFixed(1)}% ($${financialData.totalTip.toLocaleString('es-CO')})`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, financialData.margenLibrePct))}%` }}
                className="bg-emerald-500 hover:brightness-110 transition-all relative group cursor-pointer"
                title={`Ganancia Libre: ${financialData.margenLibrePct.toFixed(1)}% ($${financialData.gananciaLibre.toLocaleString('es-CO')})`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs mt-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-600">
                  <strong>Re-Stock Insumos:</strong> ${financialData.totalRestockGlobal.toLocaleString('es-CO')} ({financialData.restockPctGlobal.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600">
                  <strong>Propinas:</strong> ${financialData.totalTip.toLocaleString('es-CO')} ({financialData.propinasPctGlobal.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">
                  <strong>Ganancia Libre:</strong> ${financialData.gananciaLibre.toLocaleString('es-CO')} ({financialData.margenLibrePct.toFixed(1)}%)
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
                  Monto exacto a apartar en cada bolsillo para reponer insumos según lo vendido
                </p>
              </div>
              <span className="text-xs text-gray-400">
                Haz clic en cualquier bolsillo para ver sus productos vendidos
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
                      {/* Dinero para Re-stock (El más importante) */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                            Dinero Re-Stock a Guardar
                          </span>
                          <span className="text-xl font-black font-SpaceGrotesk text-amber-950">
                            ${pocket.totalRestock.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          {pocket.totalVentas > 0 ? ((pocket.totalRestock / pocket.totalVentas) * 100).toFixed(1) : 0}%
                        </span>
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
                        {isExpanded ? 'Ocultar productos' : `Ver ${pocket.productos.length} productos vendidos`}
                      </button>

                      {/* Lista desplegable de productos del bolsillo */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 max-h-60 overflow-y-auto pr-1">
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
                                <span className="text-[10px] text-gray-400">
                                  Venta: ${prod.totalIngreso.toLocaleString('es-CO')}
                                </span>
                              </div>
                            </div>
                          ))}
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
                  Explosión exacta de materia prima consumida y dinero requerido para recomprar a proveedores
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
                    <th className="py-3 px-3 text-right">Cant. a Reponer</th>
                    <th className="py-3 px-3 text-right">Costo Unitario</th>
                    <th className="py-3 px-3 text-right font-black text-amber-900">Dinero Re-Stock</th>
                    <th className="py-3 px-3">Productos que lo Consumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredInsumos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
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
                    <td></td>
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
                    <td className="py-3 px-3" colSpan={5}>TOTALES:</td>
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      ${financialData.totalIngresoVentas.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-amber-900 font-black">
                      ${financialData.totalRestockGlobal.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-emerald-800 font-black">
                      ${(financialData.totalIngresoVentas - financialData.totalRestockGlobal).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      {financialData.totalIngresoVentas > 0
                        ? (((financialData.totalIngresoVentas - financialData.totalRestockGlobal) / financialData.totalIngresoVentas) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MEDIOS DE PAGO Y CAJA */}
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
                    <strong className="text-amber-900 block">1. Bolsillo de Re-Stock Inmediato:</strong>
                    <p className="text-amber-800 mt-0.5">
                      Aparta <strong>${financialData.totalRestockGlobal.toLocaleString('es-CO')}</strong> en un sobre o cuenta de re-compra antes de cualquier distribución de ganancias.
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
