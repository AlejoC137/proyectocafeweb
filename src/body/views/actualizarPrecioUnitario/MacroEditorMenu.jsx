/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateItem, getAllFromTable } from '../../../redux/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, X, RefreshCw, ChefHat, Tag } from "lucide-react";
import { MENU, MenuItems } from "../../../redux/actions-types";

// ─────────────────────────────────────────────
//  Tipos de ajuste de precio disponibles
// ─────────────────────────────────────────────
const PRICE_MODES = [
  {
    key: 'percentage_increase',
    label: 'Subir % (porcentaje)',
    icon: '📈',
    description: 'Sube el precio actual en el porcentaje indicado.',
    placeholder: '10',
    unit: '%',
  },
  {
    key: 'fixed_increase',
    label: 'Subir $ (monto fijo)',
    icon: '💵',
    description: 'Agrega una cantidad fija al precio actual.',
    placeholder: '500',
    unit: '$',
  },
  {
    key: 'set_price',
    label: 'Establecer precio exacto',
    icon: '🎯',
    description: 'Reemplaza el precio por el valor indicado.',
    placeholder: '15000',
    unit: '$',
  },
  {
    key: 'round_to_nearest',
    label: 'Redondear al múltiplo',
    icon: '🔵',
    description: 'Redondea el precio al múltiplo indicado (ej. 500, 1000).',
    placeholder: '500',
    unit: 'múltiplo',
  },
];

// ─────────────────────────────────────────────
//  Lógica de cálculo del nuevo precio
// ─────────────────────────────────────────────
function calcNewPrice(currentPrice, mode, value) {
  const current = parseFloat(currentPrice) || 0;
  const val = parseFloat(value) || 0;

  switch (mode) {
    case 'percentage_increase':
      return Math.round(current * (1 + val / 100));
    case 'fixed_increase':
      return Math.round(current + val);
    case 'set_price':
      return Math.round(val);
    case 'round_to_nearest':
      if (val <= 0) return current;
      return Math.round(current / val) * val;
    default:
      return current;
  }
}

// ─────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────
const MacroEditorMenu = ({ onClose }) => {
  const dispatch = useDispatch();

  // Todos los items de menú desde Redux
  const allMenu = useSelector((state) => state.allMenu || []);

  // ── State ──
  const [priceMode, setPriceMode] = useState('percentage_increase');
  const [priceValue, setPriceValue] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // ── Derived ──
  const availableGroups = useMemo(
    () => [...new Set(allMenu.map((i) => i.GRUPO).filter(Boolean))].sort(),
    [allMenu]
  );

  const filteredItems = useMemo(() => {
    return allMenu.filter((item) => {
      const name = item.NombreES || item.NombreEN || '';
      const matchesSearch = name.toLowerCase().includes(itemSearch.toLowerCase());
      const matchesGroup = selectedGroup ? item.GRUPO === selectedGroup : true;
      return matchesSearch && matchesGroup;
    });
  }, [allMenu, itemSearch, selectedGroup]);

  const currentModeConfig = PRICE_MODES.find((m) => m.key === priceMode);

  // ── Selección ──
  const toggleItem = (id) => {
    const s = new Set(selectedItems);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedItems(s);
  };

  const handleSelectVisible = () => {
    const s = new Set(selectedItems);
    filteredItems.forEach((i) => s.add(i._id));
    setSelectedItems(s);
  };

  const handleDeselectVisible = () => {
    const s = new Set(selectedItems);
    filteredItems.forEach((i) => s.delete(i._id));
    setSelectedItems(s);
  };

  const handleSelectAll = () => setSelectedItems(new Set(allMenu.map((i) => i._id)));
  const handleClearAll = () => setSelectedItems(new Set());

  const handleAddGroup = (group) => {
    if (!group) return;
    const s = new Set(selectedItems);
    allMenu.filter((i) => i.GRUPO === group).forEach((i) => s.add(i._id));
    setSelectedItems(s);
  };

  const handleRemoveGroup = (group) => {
    if (!group) return;
    const s = new Set(selectedItems);
    allMenu.filter((i) => i.GRUPO === group).forEach((i) => s.delete(i._id));
    setSelectedItems(s);
  };

  // ── Aplicar cambios ──
  const handleApply = async () => {
    if (!priceValue || selectedItems.size === 0) {
      alert('Por favor ingrese un valor y seleccione al menos un ítem.');
      return;
    }

    const modeLabel = currentModeConfig?.label || priceMode;
    if (
      !confirm(
        `¿Estás seguro de aplicar "${modeLabel}" con valor ${priceValue} a ${selectedItems.size} ítem(s) de menú?`
      )
    )
      return;

    setIsApplying(true);
    setFeedback('Iniciando actualización de precios...');

    let successCount = 0;
    let failCount = 0;

    try {
      const itemsToUpdate = allMenu.filter((i) => selectedItems.has(i._id));

      for (const item of itemsToUpdate) {
        const newPrice = calcNewPrice(item.Precio, priceMode, priceValue);
        try {
          await dispatch(updateItem(item._id, { Precio: newPrice }, MenuItems));
          successCount++;
          setFeedback(`Actualizando... ${successCount} / ${itemsToUpdate.length}`);
        } catch (e) {
          failCount++;
          console.error(`Error actualizando ${item.NombreES}:`, e);
        }
      }

      // Refrescar datos del menú
      await dispatch(getAllFromTable(MENU));

      setFeedback(
        `✅ Finalizado — ${successCount} actualizado(s)${failCount > 0 ? `, ${failCount} error(es)` : ''}.`
      );
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error(error);
      setFeedback('❌ Error crítico durante la actualización.');
    } finally {
      setIsApplying(false);
    }
  };

  // ── Cálculo de vista previa para un ítem dado ──
  const getPreviewPrice = (item) => {
    if (!priceValue) return null;
    return calcNewPrice(item.Precio, priceMode, priceValue);
  };

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-700 to-blue-500 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-black leading-tight">Macro Editor de Precios — Menú</h2>
              <p className="text-blue-100 text-xs">Sube precios a todos los productos o por categoría</p>
            </div>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/20 font-bold" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ══ Columna Izquierda: Configurar Ajuste ══ */}
          <div className="w-[300px] shrink-0 border-r p-4 flex flex-col gap-4 bg-slate-50 overflow-y-auto">
            <h3 className="font-bold text-sm text-slate-700 border-b pb-2 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-blue-600" /> 1. Tipo de Ajuste
            </h3>

            {/* Modo */}
            <div className="space-y-2">
              {PRICE_MODES.map((mode) => (
                <label
                  key={mode.key}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    priceMode === mode.key
                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="priceMode"
                    value={mode.key}
                    checked={priceMode === mode.key}
                    onChange={(e) => setPriceMode(e.target.value)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-700">
                      {mode.icon} {mode.label}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Valor */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-2">
              <label className="text-sm font-semibold text-blue-800 block">
                Valor ({currentModeConfig?.unit})
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={currentModeConfig?.placeholder}
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="bg-white pr-10 text-lg font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">
                  {currentModeConfig?.unit}
                </span>
              </div>
              <p className="text-xs text-blue-600">
                {priceMode === 'percentage_increase' && priceValue
                  ? `Ej. Precio $10.000 → $${calcNewPrice(10000, priceMode, priceValue).toLocaleString('es-CO')}`
                  : priceMode === 'fixed_increase' && priceValue
                  ? `Ej. Precio $10.000 → $${calcNewPrice(10000, priceMode, priceValue).toLocaleString('es-CO')}`
                  : priceMode === 'set_price' && priceValue
                  ? `Todos quedarán en $${parseFloat(priceValue).toLocaleString('es-CO')}`
                  : priceMode === 'round_to_nearest' && priceValue
                  ? `Ej. $10.300 → $${calcNewPrice(10300, priceMode, priceValue).toLocaleString('es-CO')}`
                  : 'Ingresa un valor para ver la vista previa.'}
              </p>
            </div>

            {/* Toggle Preview */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={previewMode}
                onChange={(e) => setPreviewMode(e.target.checked)}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-600 font-medium">Mostrar precios nuevos</span>
            </label>

            {/* Summary */}
            <div className="mt-auto bg-slate-100 rounded-lg p-3 border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Seleccionados</p>
              <p className="text-3xl font-black text-blue-700">{selectedItems.size}</p>
              <p className="text-xs text-slate-500">de {allMenu.length} ítems del menú</p>
            </div>
          </div>

          {/* ══ Columna Derecha: Selección de Ítems ══ */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden min-h-0">
            <div className="flex justify-between items-center border-b pb-2 shrink-0">
              <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                <ChefHat className="h-4 w-4 text-blue-600" /> 2. Seleccionar Productos
              </h3>
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-slate-500">
                  Selec: <span className="font-black text-blue-600">{selectedItems.size}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-500 h-6 text-xs px-2" disabled={selectedItems.size === 0}>
                  Borrar
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-blue-600 h-6 text-xs px-2">
                  Todos ({allMenu.length})
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 shrink-0">
              <div className="flex gap-2">
                <select
                  className="border rounded p-2 text-sm max-w-[180px] bg-white border-slate-200"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="">-- Filtrar por Grupo --</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <Input
                  className="flex-1 bg-white"
                  placeholder="Buscar por nombre..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones Rápidas:</span>
                <Button variant="outline" size="sm" onClick={handleSelectVisible} className="h-6 text-xs bg-white text-green-700 border-green-200 hover:bg-green-50">
                  + Agregar Visibles ({filteredItems.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectVisible} className="h-6 text-xs bg-white text-red-700 border-red-200 hover:bg-red-50">
                  - Quitar Visibles
                </Button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <span className="text-[10px] text-slate-400">Grupo:</span>
                <select
                  className="h-6 rounded border border-slate-300 text-xs px-1 w-36 bg-white"
                  onChange={(e) => { if (e.target.value) { handleAddGroup(e.target.value); e.target.value = ''; } }}
                >
                  <option value="">+ Sumar grupo...</option>
                  {availableGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select
                  className="h-6 rounded border border-slate-300 text-xs px-1 w-36 bg-white"
                  onChange={(e) => { if (e.target.value) { handleRemoveGroup(e.target.value); e.target.value = ''; } }}
                >
                  <option value="">- Restar grupo...</option>
                  {availableGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto border rounded-lg bg-white p-2 min-h-0">
              {filteredItems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No se encontraron ítems del menú.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.has(item._id);
                    const preview = previewMode && priceValue ? getPreviewPrice(item) : null;
                    return (
                      <div
                        key={item._id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 shadow-sm'
                            : 'hover:bg-slate-50 border-slate-200'
                        }`}
                        onClick={() => toggleItem(item._id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 accent-blue-600 shrink-0"
                        />
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {item.NombreES || item.NombreEN || 'Sin nombre'}
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between items-center mt-0.5">
                            <span className="truncate max-w-[55%]">{item.GRUPO || item.SUB_GRUPO || '—'}</span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-500 font-medium">
                                ${(item.Precio || 0).toLocaleString('es-CO')}
                              </span>
                              {preview !== null && preview !== item.Precio && (
                                <>
                                  <span className="text-slate-300">→</span>
                                  <span className={`font-bold ${preview > item.Precio ? 'text-green-600' : 'text-red-500'}`}>
                                    ${preview.toLocaleString('es-CO')}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-3 border-t bg-slate-50 flex justify-between items-center gap-3 shrink-0">
          <div className={`text-sm font-semibold ${feedback.startsWith('✅') ? 'text-green-600' : feedback.startsWith('❌') ? 'text-red-600' : 'text-blue-600'}`}>
            {feedback}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isApplying}>
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplying || !priceValue || selectedItems.size === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
            >
              {isApplying ? (
                <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Aplicando...</>
              ) : (
                <><TrendingUp className="h-4 w-4 mr-1.5" /> Subir Precios ({selectedItems.size})</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroEditorMenu;
