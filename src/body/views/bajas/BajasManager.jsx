import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '@/redux/actions';
import { ITEMS, PRODUCCION, MENU } from '@/redux/actions-types';
import supabase from '@/config/supabaseClient';
import MermasFormModal from './MermasFormModal';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Percent,
  Package,
  Scale,
  DollarSign,
  AlertCircle,
  FileText,
  Eye,
  X,
  Layers,
  Flame,
  ChefHat,
  Apple
} from 'lucide-react';

export default function BajasManager() {
  const dispatch = useDispatch();

  const reduxItems = useSelector((state) => state.allItems) || [];
  const reduxProduccion = useSelector((state) => state.allProduccion) || [];
  const reduxMenu = useSelector((state) => state.allMenu) || [];

  const [bajas, setBajas] = useState([]);
  const [itemsAlmacen, setItemsAlmacen] = useState([]);
  const [produccionList, setProduccionList] = useState([]);
  const [menuList, setMenuList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mermas'); // 'mermas' | 'danos' | 'todos'

  const [searchTerm, setSearchTerm] = useState('');
  const [origenFilter, setOrigenFilter] = useState('');
  const [procesoFilter, setProcesoFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  // Cargar registros de Bajas/Mermas y las bases de datos de origen
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Bajas y Mermas
      const { data: bajasData, error: bajasErr } = await supabase
        .from('Bajas')
        .select('*')
        .order('fecha_baja', { ascending: false });

      if (!bajasErr) {
        setBajas(bajasData || []);
      }

      // 2. Cargar ItemsAlmacen completo
      const { data: itemsData } = await supabase
        .from('ItemsAlmacen')
        .select('*');
      if (itemsData) setItemsAlmacen(itemsData);

      // 3. Cargar ProduccionInterna completo
      const { data: prodData } = await supabase
        .from('ProduccionInterna')
        .select('*');
      if (prodData) setProduccionList(prodData);

      // 4. Cargar Menu completo
      const { data: menuData } = await supabase
        .from('Menu')
        .select('*');
      if (menuData) setMenuList(menuData);

    } catch (err) {
      console.error('Error al cargar datos de Bajas y Mermas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (reduxItems.length === 0) dispatch(getAllFromTable(ITEMS));
    if (reduxProduccion.length === 0) dispatch(getAllFromTable(PRODUCCION));
    if (reduxMenu.length === 0) dispatch(getAllFromTable(MENU));
  }, []);

  const finalItemsAlmacen = useMemo(() => {
    return itemsAlmacen.length > 0 ? itemsAlmacen : reduxItems;
  }, [itemsAlmacen, reduxItems]);

  const finalProduccionList = useMemo(() => {
    return produccionList.length > 0 ? produccionList : reduxProduccion;
  }, [produccionList, reduxProduccion]);

  const finalMenuList = useMemo(() => {
    return menuList.length > 0 ? menuList : reduxMenu;
  }, [menuList, reduxMenu]);

  const handleCreate = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de merma/baja?')) {
      try {
        const { error } = await supabase.from('Bajas').delete().eq('id', id);
        if (error) throw error;
        setBajas((prev) => prev.filter((item) => item.id !== id));
        if (detailRecord?.id === id) setDetailRecord(null);
      } catch (err) {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  // Filtrado de registros según pestaña y buscador
  const filteredBajas = useMemo(() => {
    return bajas.filter((b) => {
      // Filtrar por pestaña
      if (activeTab === 'mermas' && b.tipo_baja !== 'Merma de Procesamiento') return false;
      if (activeTab === 'danos' && b.tipo_baja !== 'Baja por Daño') return false;

      // Buscador
      const itemNombre = b.item_nombre || '';
      const observaciones = b.observaciones || '';
      const motivo = b.motivo || '';
      const matchesSearch =
        itemNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observaciones.toLowerCase().includes(searchTerm.toLowerCase()) ||
        motivo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesOrigen = origenFilter ? b.origen_tabla === origenFilter : true;
      const matchesProceso = procesoFilter ? b.proceso_origen === procesoFilter : true;

      return matchesSearch && matchesOrigen && matchesProceso;
    });
  }, [bajas, activeTab, searchTerm, origenFilter, procesoFilter]);

  // Métricas para tarjetas
  const metrics = useMemo(() => {
    const totalRegistros = bajas.length;
    const mermasCount = bajas.filter((b) => b.tipo_baja === 'Merma de Procesamiento').length;
    const danosCount = bajas.filter((b) => b.tipo_baja === 'Baja por Daño').length;

    // Promedio % de merma
    const arrayMermas = bajas.filter((b) => (Number(b.porcentaje_merma) || 0) > 0);
    const sumaPorcentajes = arrayMermas.reduce((acc, b) => acc + Number(b.porcentaje_merma), 0);
    const promedioMerma = arrayMermas.length > 0 ? (sumaPorcentajes / arrayMermas.length) : 0;

    // Total peso mermado (sumatoria de cantidad_mermada)
    const pesoTotalMermado = bajas.reduce((acc, b) => acc + (Number(b.cantidad_mermada) || 0), 0);

    // Costo total de pérdida
    const costoTotalPerdida = bajas.reduce((acc, b) => acc + (Number(b.costo_perdida) || 0), 0);

    return { totalRegistros, mermasCount, danosCount, promedioMerma, pesoTotalMermado, costoTotalPerdida };
  }, [bajas]);

  // Exportar CSV
  const exportToCSV = () => {
    if (filteredBajas.length === 0) {
      alert('No hay registros para exportar');
      return;
    }

    const headers = [
      'ID',
      'Tipo Registro',
      'Origen BD',
      'Producto / Insumo',
      'Proceso',
      'Peso Bruto',
      'Peso Útil',
      'Cantidad Mermada',
      'Unidad',
      'Porcentaje Merma (%)',
      'Costo Pérdida ($)',
      'Fecha',
      'Observaciones',
      'Registrado Por'
    ];

    const rows = filteredBajas.map((b) => [
      b.id,
      b.tipo_baja,
      b.origen_tabla || 'N/A',
      `"${(b.item_nombre || '').replace(/"/g, '""')}"`,
      `"${(b.proceso_origen || b.motivo || '').replace(/"/g, '""')}"`,
      b.peso_bruto || 0,
      b.peso_util || 0,
      b.cantidad_mermada || 0,
      b.unidad_medida || 'gr',
      b.porcentaje_merma || 0,
      b.costo_perdida || 0,
      b.fecha_baja,
      `"${(b.observaciones || '').replace(/"/g, '""')}"`,
      `"${b.registrado_por || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mermas_bajas_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getMermaBadgeColor = (porcentaje) => {
    const p = parseFloat(porcentaje) || 0;
    if (p <= 10) return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
    if (p <= 25) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300';
  };

  return (
    <div className="p-4 md:p-6 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-800 dark:text-zinc-100 font-sans">
      
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Apple className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            Control de Bajas y Mermas de Insumos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Registro de mermas por pelado/limpieza (ej. tomate), desperdicios de cocina y bajas por deterioro en Supabase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            title="Recargar datos"
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors shadow-sm text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Merma / Baja
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">% Merma Promedio</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
              {metrics.promedioMerma.toFixed(2)} %
            </h3>
            <span className="text-xs text-zinc-400">{metrics.mermasCount} mermas procesadas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cantidad Mermada</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5 font-mono">
              {metrics.pesoTotalMermado.toLocaleString('es-CO')} <span className="text-xs font-normal">gr/unid</span>
            </h3>
            <span className="text-xs text-zinc-400">Total de desperdicio acumulado</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Costo de Pérdida</p>
            <h3 className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5 font-mono">
              {formatCurrency(metrics.costoTotalPerdida)}
            </h3>
            <span className="text-xs text-zinc-400">Valor financiero mermado</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Registros</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {metrics.totalRegistros}
            </h3>
            <span className="text-xs text-zinc-400">{metrics.danosCount} bajas por deterioro</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 bg-white dark:bg-zinc-900 rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('mermas')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'mermas'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          Mermas de Procesamiento (Pelado / Limpieza)
        </button>

        <button
          onClick={() => setActiveTab('danos')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'danos'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          Bajas por Daño y Deterioro
        </button>

        <button
          onClick={() => setActiveTab('todos')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Todos los Registros ({bajas.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por producto (ej. Tomate), motivo u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Origen Filter */}
        <div className="w-full md:w-52">
          <select
            value={origenFilter}
            onChange={(e) => setOrigenFilter(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todas las Bases de Datos</option>
            <option value="ItemsAlmacen">Items de Almacén</option>
            <option value="ProduccionInterna">Producción Interna</option>
            <option value="Menu">Ítems del Menú</option>
          </select>
        </div>

        {/* Proceso Filter */}
        <div className="w-full md:w-52">
          <select
            value={procesoFilter}
            onChange={(e) => setProcesoFilter(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos los Procesos</option>
            <option value="Pelado / Limpieza">Pelado / Limpieza</option>
            <option value="Deterioro / Podredumbre (Daño)">Deterioro / Podredumbre</option>
            <option value="Vencimiento de Insumo">Vencimiento</option>
            <option value="Cocción / Evaporación">Cocción / Evaporación</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
            Cargando registros de mermas y bajas...
          </div>
        ) : filteredBajas.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
            <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">No hay registros para mostrar</h3>
            <p className="text-xs mt-1">Prueba cambiando los filtros o agrega una nueva merma.</p>
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-amber-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar primera merma
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Producto / Insumo</th>
                  <th className="py-3.5 px-4">Origen BD</th>
                  <th className="py-3.5 px-4">Proceso / Motivo</th>
                  <th className="py-3.5 px-4 text-center">Peso Bruto ➔ Útil</th>
                  <th className="py-3.5 px-4 text-center">Cantidad Mermada</th>
                  <th className="py-3.5 px-4 text-center">% Merma</th>
                  <th className="py-3.5 px-4">Costo Pérdida</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredBajas.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Producto */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-600" />
                        {b.item_nombre || 'Sin nombre'}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {b.tipo_baja}
                      </div>
                    </td>

                    {/* Origen BD */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {b.origen_tabla || 'ItemsAlmacen'}
                      </span>
                    </td>

                    {/* Proceso */}
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                      <div className="font-medium text-xs">
                        {b.proceso_origen || b.motivo}
                      </div>
                    </td>

                    {/* Peso Bruto -> Útil */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      <span className="text-zinc-500">{b.peso_bruto || 0}</span>
                      <span className="text-zinc-400 mx-1">➔</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{b.peso_util || 0}</span>
                      <span className="text-[10px] text-zinc-400 ml-1">{b.unidad_medida || 'gr'}</span>
                    </td>

                    {/* Cantidad Mermada */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {b.cantidad_mermada || 0} {b.unidad_medida || 'gr'}
                    </td>

                    {/* % Merma */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border font-mono ${getMermaBadgeColor(
                          b.porcentaje_merma
                        )}`}
                      >
                        <Percent className="w-3 h-3" />
                        {Number(b.porcentaje_merma || 0).toFixed(2)} %
                      </span>
                    </td>

                    {/* Costo Pérdida */}
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(b.costo_perdida)}
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {b.fecha_baja}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailRecord(b)}
                          title="Ver Detalle"
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(b)}
                          title="Editar"
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(b.id)}
                          title="Eliminar"
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit Merma) */}
      <MermasFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        recordToEdit={selectedRecord}
        itemsAlmacen={finalItemsAlmacen}
        produccionList={finalProduccionList}
        menuList={finalMenuList}
      />

      {/* Detail Overlay */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setDetailRecord(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-amber-600" /> Detalle de la Merma / Baja
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                <p className="text-xs text-zinc-500 font-bold uppercase">Producto / Insumo</p>
                <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                  {detailRecord.item_nombre || 'Sin Nombre'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Base de Datos: {detailRecord.origen_tabla || 'ItemsAlmacen'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <p className="text-xs text-zinc-500 font-bold uppercase">Proceso Origen</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">{detailRecord.proceso_origen || detailRecord.motivo}</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <p className="text-xs text-zinc-500 font-bold uppercase">Fecha</p>
                  <p className="font-mono font-semibold">{detailRecord.fecha_baja}</p>
                </div>
              </div>

              {/* Ratios & Pesos */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Peso Bruto</span>
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {detailRecord.peso_bruto} {detailRecord.unidad_medida}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Peso Útil</span>
                  <p className="font-mono font-bold text-emerald-600">
                    {detailRecord.peso_util} {detailRecord.unidad_medida}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500">% Merma</span>
                  <p className="font-mono font-black text-red-600">
                    {Number(detailRecord.porcentaje_merma || 0).toFixed(2)} %
                  </p>
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase">Costo Pérdida Financiera</span>
                <span className="text-lg font-black text-red-600 dark:text-red-400 font-mono">
                  {formatCurrency(detailRecord.costo_perdida)}
                </span>
              </div>

              {detailRecord.observaciones && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <p className="text-xs text-zinc-500 font-bold uppercase">Observaciones</p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-line">
                    {detailRecord.observaciones}
                  </p>
                </div>
              )}

              {detailRecord.registrado_por && (
                <p className="text-xs text-zinc-400 italic">
                  Registrado por: {detailRecord.registrado_por}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
