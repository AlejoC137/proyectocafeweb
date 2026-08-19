import React from 'react';
import { Calendar, Filter, Search, Database, Layers, RefreshCw } from 'lucide-react';
import { getWeekNumber, getWeekDateRange } from './useGastosCalculados';

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const GastosFilters = ({
  sourceMode, setSourceMode,
  timeframeMode, setTimeframeMode,
  selectedYear, setSelectedYear,
  selectedMonth, setSelectedMonth,
  selectedWeek, setSelectedWeek,
  customStartDate, setCustomStartDate,
  customEndDate, setCustomEndDate,
  selectedCategory, setSelectedCategory,
  selectedProduct, setSelectedProduct,
  searchTerm, setSearchTerm,
  ingredientTypeFilter, setIngredientTypeFilter,
  categoriesList,
  availableYears,
  allMenu,
  onReset
}) => {
  const now = new Date();

  const handleApplyPreset = (preset) => {
    if (preset === 'thisWeek') {
      setTimeframeMode('week');
      setSelectedYear(now.getFullYear());
      setSelectedWeek(getWeekNumber(now));
    } else if (preset === 'lastWeek') {
      setTimeframeMode('week');
      const lastWeekNum = getWeekNumber(now) - 1;
      if (lastWeekNum > 0) {
        setSelectedYear(now.getFullYear());
        setSelectedWeek(lastWeekNum);
      } else {
        setSelectedYear(now.getFullYear() - 1);
        setSelectedWeek(52);
      }
    } else if (preset === 'thisMonth') {
      setTimeframeMode('month');
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth());
    } else if (preset === 'lastMonth') {
      setTimeframeMode('month');
      if (now.getMonth() === 0) {
        setSelectedYear(now.getFullYear() - 1);
        setSelectedMonth(11);
      } else {
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth() - 1);
      }
    } else if (preset === 'thisYear') {
      setTimeframeMode('year');
      setSelectedYear(now.getFullYear());
    }
  };

  const currentWeekRange = timeframeMode === 'week' ? getWeekDateRange(selectedYear, selectedWeek) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4 font-sans">
      {/* Top Controls: Mode Switch & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSourceMode('historical')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              sourceMode === 'historical'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database size={14} /> Base de Datos (Ventas Reales)
          </button>
          <button
            onClick={() => setSourceMode('simulated')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              sourceMode === 'simulated'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers size={14} /> Modelo / Simulación Actual
          </button>
        </div>

        {sourceMode === 'historical' && (
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider mr-1">Rápidos:</span>
            <button
              onClick={() => handleApplyPreset('thisWeek')}
              className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded transition-colors"
            >
              Esta Semana
            </button>
            <button
              onClick={() => handleApplyPreset('lastWeek')}
              className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded transition-colors"
            >
              Semana Pasada
            </button>
            <button
              onClick={() => handleApplyPreset('thisMonth')}
              className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded transition-colors"
            >
              Este Mes
            </button>
            <button
              onClick={() => handleApplyPreset('lastMonth')}
              className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded transition-colors"
            >
              Mes Pasado
            </button>
            <button
              onClick={() => handleApplyPreset('thisYear')}
              className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded transition-colors"
            >
              Año {now.getFullYear()}
            </button>
          </div>
        )}
      </div>

      {/* Date & Timeframe Selectors */}
      {sourceMode === 'historical' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
          {/* Timeframe Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Período</label>
            <select
              value={timeframeMode}
              onChange={(e) => setTimeframeMode(e.target.value)}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="month">Por Mes</option>
              <option value="week">Por Semana</option>
              <option value="year">Por Año</option>
              <option value="custom">Rango Personalizado</option>
            </select>
          </div>

          {/* Year Selector */}
          {timeframeMode !== 'custom' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Selector */}
          {timeframeMode === 'month' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={index} value={index}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Week Selector */}
          {timeframeMode === 'week' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semana del Año</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Array.from({ length: 53 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Start */}
          {timeframeMode === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Custom Date End */}
          {timeframeMode === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría Menú</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todas las Categorías</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Week date range badge */}
      {timeframeMode === 'week' && currentWeekRange && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-medium">
          <Calendar size={14} />
          <span>
            Rango de la Semana {selectedWeek}: <strong>{currentWeekRange.start.toLocaleDateString('es-CO')}</strong> al <strong>{currentWeekRange.end.toLocaleDateString('es-CO')}</strong>
          </span>
        </div>
      )}

      {/* Search & Insumo Type Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar insumo o sub-receta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase">Ver Insumos:</label>
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
            <button
              onClick={() => setIngredientTypeFilter('all')}
              className={`px-3 py-1 rounded-md transition-all ${ingredientTypeFilter === 'all' ? 'bg-white shadow text-blue-600 font-bold' : 'hover:text-gray-900'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setIngredientTypeFilter('raw')}
              className={`px-3 py-1 rounded-md transition-all ${ingredientTypeFilter === 'raw' ? 'bg-white shadow text-blue-600 font-bold' : 'hover:text-gray-900'}`}
            >
              Solo Materia Prima
            </button>
            <button
              onClick={() => setIngredientTypeFilter('internal')}
              className={`px-3 py-1 rounded-md transition-all ${ingredientTypeFilter === 'internal' ? 'bg-white shadow text-blue-600 font-bold' : 'hover:text-gray-900'}`}
            >
              Solo Producciones Internas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GastosFilters;
