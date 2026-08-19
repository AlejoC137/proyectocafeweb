import React, { useState, useEffect, useMemo, useRef } from 'react';
import supabase from '@/config/supabaseClient';
import { X, Save, Calculator, AlertCircle, Percent, Package, Scale, DollarSign, Layers, Search, Check, Utensils, Box, ChefHat, RefreshCw, ArrowRight, TrendingUp, Trash } from 'lucide-react';

const PROCESOS = [
  'Pelado / Limpieza',
  'Deterioro / Podredumbre (Daño)',
  'Vencimiento de Insumo',
  'Cocción / Evaporación',
  'Desposte / Fileteado',
  'Error de Preparación / Caída',
  'Otro'
];

const UNIDADES = ['gr', 'kg', 'unidades', 'ml', 'lt'];

export default function MermasFormModal({
  isOpen,
  onClose,
  onSuccess,
  recordToEdit = null,
  itemsAlmacen = [],
  produccionList = [],
  menuList = []
}) {
  const [origenTabla, setOrigenTabla] = useState('ItemsAlmacen');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemNombre, setItemNombre] = useState('');
  
  // Buscador interactivo
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Pesos: Field 1 (Peso Inicial) y Field 2 (Peso Quitado/Mermado)
  const [pesoBruto, setPesoBruto] = useState('');
  const [pesoQuitado, setPesoQuitado] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('gr');

  const [procesoOrigen, setProcesoOrigen] = useState('Pelado / Limpieza');
  const [motivo, setMotivo] = useState('Pelado y Limpieza de Insumo');
  const [costoPerdida, setCostoPerdida] = useState('');
  const [fechaBaja, setFechaBaja] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [registradoPor, setRegistradoPor] = useState('');
  const [tipoBaja, setTipoBaja] = useState('Merma de Procesamiento');

  // Toggle para afectar costo unitario del ítem en Supabase
  const [actualizarItemEnBD, setActualizarItemEnBD] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Auto-cálculos de merma basados en Peso Inicial (Bruto) y Peso Quitado (Mermado)
  const numBruto = parseFloat(pesoBruto) || 0;
  const numQuitado = parseFloat(pesoQuitado) || 0;
  const numUtil = numBruto > numQuitado ? numBruto - numQuitado : 0;
  const cantidadMermada = numQuitado;
  const porcentajeMerma = numBruto > 0 ? ((numQuitado / numBruto) * 100) : 0;
  const porcentajeAprovechable = numBruto > 0 ? (100 - porcentajeMerma) : 0;

  // Unificar todos los ítems de las 3 tablas para el buscador
  const allSearchableItems = useMemo(() => {
    const almacen = itemsAlmacen.map((i) => ({
      id: i._id,
      nombre: i.Nombre_del_producto || i.Nombre_Item || i.Nombre || i.name || '',
      categoria: i.Categoria || i.GRUPO || 'Almacén',
      costo: parseFloat(i.COSTO || i.Costo || 0),
      cantidad: parseFloat(i.CANTIDAD || i.Cantidad || 1),
      coor: parseFloat(i.COOR) || 1,
      precioUnitarioActual: parseFloat(i.precioUnitario || 0),
      rawItem: i,
      origen: 'ItemsAlmacen',
      labelOrigen: 'Insumo Almacén',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
    }));

    const produccion = produccionList.map((p) => ({
      id: p._id,
      nombre: p.Nombre_del_producto || '',
      categoria: p.GRUPO || 'Producción',
      costo: parseFloat(p.COSTO || 0),
      cantidad: parseFloat(p.CANTIDAD || 1),
      coor: parseFloat(p.COOR) || 1,
      precioUnitarioActual: parseFloat(p.precioUnitario || 0),
      rawItem: p,
      origen: 'ProduccionInterna',
      labelOrigen: 'Producción Interna',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
    }));

    const menu = menuList.map((m) => ({
      id: m._id,
      nombre: m.NombreES || '',
      categoria: m.GRUPO || 'Menú',
      costo: parseFloat(m.Precio || 0),
      cantidad: 1,
      coor: 1,
      precioUnitarioActual: parseFloat(m.Precio || 0),
      rawItem: m,
      origen: 'Menu',
      labelOrigen: 'Plato Menú',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
    }));

    return [...almacen, ...produccion, ...menu];
  }, [itemsAlmacen, produccionList, menuList]);

  // Objeto del ítem seleccionado actualmente
  const selectedProductObj = useMemo(() => {
    return allSearchableItems.find((i) => i.id === selectedItemId && i.origen === origenTabla);
  }, [allSearchableItems, selectedItemId, origenTabla]);

  // Cálculo matemático del impacto en el precio unitario del ítem
  const calculoImpactoItem = useMemo(() => {
    if (!selectedProductObj || porcentajeMerma <= 0) return null;

    const costo = selectedProductObj.costo || 0;
    const cantidad = selectedProductObj.cantidad || 1;
    const coor = selectedProductObj.coor || 1;
    const precioActual = selectedProductObj.precioUnitarioActual || (costo > 0 ? (costo / cantidad) * 1.04 : 0);

    const mermaDecimal = porcentajeMerma / 100;
    const rendimiento = cantidad - (cantidad * mermaDecimal);

    if (rendimiento <= 0 || costo <= 0) return null;

    const nuevoPrecioUnitario = parseFloat(((costo / rendimiento) * 1.04 * coor).toFixed(2));
    const diferencia = nuevoPrecioUnitario - precioActual;
    const incrementoPorcentual = precioActual > 0 ? ((diferencia / precioActual) * 100) : 0;

    return {
      costo,
      cantidad,
      precioActual,
      nuevoPrecioUnitario,
      diferencia,
      incrementoPorcentual
    };
  }, [selectedProductObj, porcentajeMerma]);

  // Filtrado de resultados de búsqueda
  const filteredSearchResults = useMemo(() => {
    return allSearchableItems.filter((item) => {
      const matchesCategory = filterCategory === 'Todos' ? true : item.origen === filterCategory;
      const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.categoria.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).slice(0, 30);
  }, [allSearchableItems, searchQuery, filterCategory]);

  useEffect(() => {
    if (recordToEdit) {
      setOrigenTabla(recordToEdit.origen_tabla || 'ItemsAlmacen');
      setItemNombre(recordToEdit.item_nombre || '');
      setSearchQuery(recordToEdit.item_nombre || '');
      setPesoBruto(recordToEdit.peso_bruto || '');
      
      // En el 2do campo mostramos la cantidad quitada / mermada
      const quitado = recordToEdit.cantidad_mermada ||
        ((parseFloat(recordToEdit.peso_bruto) || 0) - (parseFloat(recordToEdit.peso_util) || 0));
      setPesoQuitado(quitado > 0 ? quitado : '');

      setUnidadMedida(recordToEdit.unidad_medida || 'gr');
      setProcesoOrigen(recordToEdit.proceso_origen || 'Pelado / Limpieza');
      setMotivo(recordToEdit.motivo || 'Pelado y Limpieza de Insumo');
      setCostoPerdida(recordToEdit.costo_perdida || '');
      setFechaBaja(recordToEdit.fecha_baja ? recordToEdit.fecha_baja.split('T')[0] : new Date().toISOString().split('T')[0]);
      setObservaciones(recordToEdit.observaciones || '');
      setRegistradoPor(recordToEdit.registrado_por || '');
      setTipoBaja(recordToEdit.tipo_baja || 'Merma de Procesamiento');

      if (recordToEdit.item_id) setSelectedItemId(recordToEdit.item_id);
      else if (recordToEdit.produccion_id) setSelectedItemId(recordToEdit.produccion_id);
      else if (recordToEdit.menu_id) setSelectedItemId(recordToEdit.menu_id);
      else setSelectedItemId('');
    } else {
      setOrigenTabla('ItemsAlmacen');
      const defaultItem = itemsAlmacen[0];
      setSelectedItemId(defaultItem?._id || '');
      setItemNombre(defaultItem?.Nombre_del_producto || defaultItem?.Nombre_Item || defaultItem?.Nombre || '');
      setSearchQuery(defaultItem?.Nombre_del_producto || defaultItem?.Nombre_Item || defaultItem?.Nombre || '');
      setPesoBruto('');
      setPesoQuitado('');
      setUnidadMedida('gr');
      setProcesoOrigen('Pelado / Limpieza');
      setMotivo('Pelado y Limpieza de Insumo');
      setCostoPerdida('');
      setFechaBaja(new Date().toISOString().split('T')[0]);
      setObservaciones('');
      setRegistradoPor('');
      setTipoBaja('Merma de Procesamiento');
    }
    setErrorMsg(null);
  }, [recordToEdit, isOpen, itemsAlmacen]);

  // Manejar clic fuera del dropdown para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Seleccionar un producto del buscador
  const handleSelectProduct = (product) => {
    setSelectedItemId(product.id);
    setItemNombre(product.nombre);
    setOrigenTabla(product.origen);
    setSearchQuery(product.nombre);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId && !itemNombre) {
      setErrorMsg('Debes buscar y seleccionar un producto o insumo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      tipo_baja: tipoBaja,
      origen_tabla: origenTabla,
      item_nombre: itemNombre,
      item_id: origenTabla === 'ItemsAlmacen' ? selectedItemId || null : null,
      produccion_id: origenTabla === 'ProduccionInterna' ? selectedItemId || null : null,
      menu_id: origenTabla === 'Menu' ? selectedItemId || null : null,
      fecha_baja: fechaBaja,
      proceso_origen: procesoOrigen,
      motivo: motivo,
      peso_bruto: numBruto,
      peso_util: numUtil,
      cantidad_mermada: cantidadMermada,
      unidad_medida: unidadMedida,
      porcentaje_merma: parseFloat(porcentajeMerma.toFixed(2)),
      costo_perdida: parseFloat(costoPerdida) || 0,
      estado: 'Completado',
      observaciones: observaciones,
      registrado_por: registradoPor
    };

    try {
      // 1. Guardar o actualizar registro en la tabla "Bajas"
      if (recordToEdit?.id) {
        const { error } = await supabase
          .from('Bajas')
          .update(payload)
          .eq('id', recordToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Bajas')
          .insert([payload]);
        if (error) throw error;
      }

      // 2. AFECTAR ÚNICAMENTE EL CAMPO MERMA DEL ÍTEM EN SUPABASE
      if (actualizarItemEnBD && selectedItemId && (origenTabla === 'ItemsAlmacen' || origenTabla === 'ProduccionInterna') && porcentajeMerma > 0) {
        const updateFields = {
          Merma: parseFloat(porcentajeMerma.toFixed(2))
        };

        const { error: itemUpdateErr } = await supabase
          .from(origenTabla)
          .update(updateFields)
          .eq('_id', selectedItemId);

        if (itemUpdateErr) {
          console.warn(`Error al actualizar la merma en ${origenTabla}:`, itemUpdateErr.message);
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar merma en Supabase:', err);
      if (err.message && (err.message.includes('schema cache') || err.message.includes('column'))) {
        setErrorMsg('Faltan columnas de mermas en la tabla "Bajas" en Supabase. Ejecuta el script "alter_bajas_add_mermas_columns.sql" en el SQL Editor de tu Supabase.');
      } else {
        setErrorMsg(err.message || 'Error al conectar con la base de datos');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 my-8 transition-all">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-b border-amber-200 dark:border-amber-900/60">
          <div>
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              {recordToEdit ? 'Editar Registro de Merma' : 'Calculadora y Registro de Merma / Baja'}
            </h2>
            <p className="text-xs text-amber-700/80 dark:text-amber-400">
              Ingresa el peso inicial y el peso que estás quitando para calcular el % de merma automático
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Tipo de Registro & Proceso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tipo de Registro *
              </label>
              <select
                value={tipoBaja}
                onChange={(e) => setTipoBaja(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="Merma de Procesamiento">Merma de Procesamiento (Pelado/Limpieza)</option>
                <option value="Baja por Daño">Baja por Daño / Deterioro / Podredumbre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Proceso u Origen del Desperdicio *
              </label>
              <select
                value={procesoOrigen}
                onChange={(e) => setProcesoOrigen(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                {PROCESOS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* BUSCADOR INTERACTIVO (COMBOBOX) ENTRE MENÚ, ALMACÉN Y PRODUCCIÓN */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 space-y-3 relative" ref={searchRef}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4" /> Buscador de Ítems, Producción y Menú
              </h4>

              {/* Botones de filtro de origen */}
              <div className="flex gap-1 bg-zinc-200/70 dark:bg-zinc-700/60 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterCategory('Todos')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    filterCategory === 'Todos' ? 'bg-white dark:bg-zinc-800 text-amber-600 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('ItemsAlmacen')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    filterCategory === 'ItemsAlmacen' ? 'bg-white dark:bg-zinc-800 text-amber-600 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Almacén
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('ProduccionInterna')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    filterCategory === 'ProduccionInterna' ? 'bg-white dark:bg-zinc-800 text-purple-600 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Producción
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('Menu')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    filterCategory === 'Menu' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Menú
                </button>
              </div>
            </div>

            {/* Input del Buscador con Autocompletado */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Escribe para buscar (ej: Tomate, Relleno, Pepino)..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedItemId('');
                    setItemNombre('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda (Dropdown Flotante) */}
            {isDropdownOpen && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No se encontraron coincidencias para "{searchQuery}"
                  </div>
                ) : (
                  filteredSearchResults.map((prod) => (
                    <div
                      key={`${prod.origen}-${prod.id}`}
                      onClick={() => handleSelectProduct(prod)}
                      className={`p-3 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 cursor-pointer flex items-center justify-between transition-colors ${
                        selectedItemId === prod.id ? 'bg-amber-50 dark:bg-amber-950/60 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {prod.origen === 'ItemsAlmacen' && <Box className="w-4 h-4 text-amber-600 shrink-0" />}
                        {prod.origen === 'ProduccionInterna' && <ChefHat className="w-4 h-4 text-purple-600 shrink-0" />}
                        {prod.origen === 'Menu' && <Utensils className="w-4 h-4 text-blue-600 shrink-0" />}

                        <div>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{prod.nombre}</p>
                          <span className="text-[10px] text-zinc-400">{prod.categoria}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${prod.badgeColor}`}>
                          {prod.labelOrigen}
                        </span>
                        {selectedItemId === prod.id && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Insumo Seleccionado Badge */}
            {itemNombre && (
              <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-950/70 px-3.5 py-2 rounded-xl flex items-center justify-between border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Elemento Seleccionado: <strong>{itemNombre}</strong></span>
                </div>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-amber-200 dark:bg-amber-900 rounded-md">
                  {origenTabla}
                </span>
              </div>
            )}
          </div>

          {/* Calculadora de Pesos: Peso Inicial vs Peso Quitado */}
          <div className="p-4 bg-orange-50/60 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-4">
            <h4 className="text-xs font-extrabold text-orange-800 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4" /> Calculadora de Cantidades y % de Merma
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Peso Inicial */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  1. Peso Inicial (Bruto) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pesoBruto}
                  onChange={(e) => setPesoBruto(e.target.value)}
                  placeholder="ej: 1000"
                  required
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[10px] text-zinc-500">Peso total recibido antes de pelar</span>
              </div>

              {/* Peso Quitado (Merma Retirada) */}
              <div>
                <label className="block text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                  <Trash className="w-3.5 h-3.5 text-red-500" />
                  2. Peso Quitado / Mermado *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pesoQuitado}
                  onChange={(e) => setPesoQuitado(e.target.value)}
                  placeholder="ej: 150"
                  required
                  className="w-full bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500"
                />
                <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold">Cantidad desperdiciada / retirada</span>
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={unidadMedida}
                  onChange={(e) => setUnidadMedida(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resultado del Cálculo (Badge Interactivo) */}
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-orange-200 dark:border-orange-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500">Cantidad Aprovechable Final</span>
                <p className="text-lg font-black text-emerald-600 font-mono">
                  {numUtil.toFixed(2)} {unidadMedida}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500">% Merma (Pérdida)</span>
                <p className="text-lg font-black text-red-600 dark:text-red-400 font-mono flex items-center justify-center gap-1">
                  <Percent className="w-4 h-4" />
                  {porcentajeMerma.toFixed(2)} %
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500">% Aprovechable a Gramear</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {porcentajeAprovechable.toFixed(2)} %
                </p>
              </div>
            </div>
          </div>

          {/* ACTUALIZACIÓN DE MERMA EN EL ÍTEM */}
          {porcentajeMerma > 0 && (origenTabla === 'ItemsAlmacen' || origenTabla === 'ProduccionInterna') && (
            <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-purple-600" />
                  Actualización de la Merma del Ítem
                </h4>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={actualizarItemEnBD}
                    onChange={(e) => setActualizarItemEnBD(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Actualizar % Merma en Supabase
                  </span>
                </label>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">
                  Se actualizará la columna <strong>Merma</strong> del ítem en la tabla <strong>{origenTabla}</strong>:
                </span>
                <span className="font-mono font-black text-purple-700 dark:text-purple-300 text-sm bg-purple-100 dark:bg-purple-950 px-2.5 py-1 rounded-lg">
                  {porcentajeMerma.toFixed(2)} %
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Costo Pérdida */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Costo Pérdida ($ COP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costoPerdida}
                onChange={(e) => setCostoPerdida(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Fecha de la Merma *
              </label>
              <input
                type="date"
                value={fechaBaja}
                onChange={(e) => setFechaBaja(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Registrado Por */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Registrado Por
              </label>
              <input
                type="text"
                value={registradoPor}
                onChange={(e) => setRegistradoPor(e.target.value)}
                placeholder="Nombre del cocinero/admin"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Observaciones / Motivo de la Merma
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Tomates pelados para salsa napolitana. Merma de cáscara y semillas..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Merma & Afectar Ítem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
