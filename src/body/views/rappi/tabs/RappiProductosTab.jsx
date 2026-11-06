import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  analizarProducto,
  formatCOP,
  formatPct,
  colorMargen,
} from "../utils/rappiPricing";
import { CanalToggleCell } from "../components/CanalToggleCell";
import { ModeradorPrecioPanel } from "../components/ModeradorPrecioPanel";
import { ExportMenuExcelButton } from "../components/ExportMenuExcelButton";
import { bulkUpdateMenu, aplicarPreciosRappi } from "@/redux/actions-Rappi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  TrendingUp,
  ChefHat,
  Pencil,
  Check,
  X,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";

export function RappiProductosTab({
  menu = [],
  recetasMenu = [],
  recetasProduccion = [],
  config,
  onConfigChange,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Filtros
  const [search, setSearch] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("");
  const [filterCanal, setFilterCanal] = useState("RAPPI"); // "RAPPI" | "PROYECTO_1" | "PROYECTO_2" | "TODOS" | "SIN_INDEXAR"
  const [soloActivos, setSoloActivos] = useState(true);
  const [showModerador, setShowModerador] = useState(true);

  // Selección
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Inline editing del precio Rappi
  const [editingId, setEditingId] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");

  // Analizar todos los productos del menú con sus recetas y fórmulas
  const analyzedItems = useMemo(() => {
    return menu.map((m) =>
      analizarProducto(m, config, recetasMenu, recetasProduccion)
    );
  }, [menu, config, recetasMenu, recetasProduccion]);

  // Lista filtrada
  const filteredItems = useMemo(() => {
    return analyzedItems.filter((item) => {
      if (soloActivos && item.estado !== "Activo") return false;

      if (filterCanal === "RAPPI" && !item.RAPPI) return false;
      if (filterCanal === "PROYECTO_1" && !item.PROYECTO_1) return false;
      if (filterCanal === "PROYECTO_2" && !item.PROYECTO_2) return false;
      if (filterCanal === "SIN_INDEXAR" && (item.RAPPI || item.PROYECTO_1 || item.PROYECTO_2)) return false;

      if (filterGrupo && item.grupo !== filterGrupo) return false;

      if (search) {
        const query = search.toLowerCase();
        const matchNombre = (item.nombre || "").toLowerCase().includes(query);
        const matchSub = (item.subGrupo || "").toLowerCase().includes(query);
        if (!matchNombre && !matchSub) return false;
      }

      return true;
    });
  }, [analyzedItems, soloActivos, filterCanal, filterGrupo, search]);

  // Grupos únicos para el select
  const uniqueGrupos = useMemo(() => {
    return [...new Set(menu.map((m) => m.GRUPO).filter(Boolean))].sort();
  }, [menu]);

  // KPIs de la selección actual
  const kpis = useMemo(() => {
    const total = filteredItems.length;
    const conReceta = filteredItems.filter((i) => i.tieneReceta).length;
    const indexadosRappi = analyzedItems.filter((i) => i.RAPPI).length;
    const indexadosP1 = analyzedItems.filter((i) => i.PROYECTO_1).length;
    const indexadosP2 = analyzedItems.filter((i) => i.PROYECTO_2).length;

    const sumaMargen = filteredItems.reduce((acc, i) => acc + (i.tieneReceta ? i.margenRappi : 0), 0);
    const margenPromedio = conReceta > 0 ? sumaMargen / conReceta : 0;

    return { total, conReceta, indexadosRappi, indexadosP1, indexadosP2, margenPromedio };
  }, [filteredItems, analyzedItems]);

  // Selección múltiple
  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  // Acciones en lote para canales
  const handleBulkToggleCanal = async (campo, valor) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      alert("Por favor selecciona primero los productos.");
      return;
    }
    const label = valor ? "indexar" : "quitar";
    if (!window.confirm(`¿Seguro que deseas ${label} ${ids.length} productos en ${campo}?`)) return;

    try {
      await dispatch(bulkUpdateMenu(ids, { [campo]: valor }, `Lote ${campo}`));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert("Error en la operación en lote.");
    }
  };

  // Guardar edición manual de precio Rappi
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditingPrice(String(Math.round(item.precioRappi)));
  };

  const handleSavePrice = async (itemId) => {
    const val = parseFloat(editingPrice);
    if (isNaN(val) || val < 0) {
      alert("Por favor ingresa un precio válido");
      return;
    }
    try {
      await dispatch(aplicarPreciosRappi({ [itemId]: val }));
      setEditingId(null);
      setEditingPrice("");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar precio.");
    }
  };

  const handleClearManualPrice = async (itemId) => {
    try {
      await dispatch(aplicarPreciosRappi({ [itemId]: null }));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra de KPIs superiores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Indexados Rappi</span>
          <span className="text-lg font-bold text-orange-600">{kpis.indexadosRappi}</span>
          <span className="text-[10px] text-slate-500 block">de {menu.length} productos</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Proyecto 1 / 2</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-blue-600">P1: {kpis.indexadosP1}</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-bold text-purple-600">P2: {kpis.indexadosP2}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">canales paralelos</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Margen Rappi Prom</span>
          <span className="text-lg font-bold text-emerald-600">{formatPct(kpis.margenPromedio)}</span>
          <span className="text-[10px] text-slate-500 block">neto después de comisión</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Con Receta / Costo</span>
          <span className="text-lg font-bold text-slate-800">{kpis.conReceta}</span>
          <span className="text-[10px] text-slate-500 block">{filteredItems.length - kpis.conReceta} sin receta</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Exportación</span>
          <ExportMenuExcelButton
            items={filteredItems}
            config={config}
            canalLabel={filterCanal === "TODOS" ? "Menu_Completo" : filterCanal}
          />
        </div>
      </div>

      {/* Moderador de Aumento & Comisiones (1.2) */}
      <ModeradorPrecioPanel
        config={config}
        onConfigChange={onConfigChange}
        items={filteredItems}
        selectedIds={selectedIds}
      />

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o subgrupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtro de Canal */}
          <select
            value={filterCanal}
            onChange={(e) => setFilterCanal(e.target.value)}
            className="h-8 text-xs border border-input rounded-md px-2 bg-white font-medium"
          >
            <option value="RAPPI">🛵 Solo Rappi</option>
            <option value="PROYECTO_1">1️⃣ Solo Proyecto 1</option>
            <option value="PROYECTO_2">2️⃣ Solo Proyecto 2</option>
            <option value="TODOS">🌐 Todos los productos</option>
            <option value="SIN_INDEXAR">⚪ Sin indexar</option>
          </select>

          {/* Filtro Grupo */}
          <select
            value={filterGrupo}
            onChange={(e) => setFilterGrupo(e.target.value)}
            className="h-8 text-xs border border-input rounded-md px-2 bg-white max-w-[160px]"
          >
            <option value="">Todos los grupos</option>
            {uniqueGrupos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Solo Activos */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
            />
            <span>Solo Activos</span>
          </label>
        </div>

        {/* Acciones en lote si hay selección */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
            <span className="text-[11px] font-bold text-orange-800">
              {selectedIds.size} seleccionados:
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleCanal("RAPPI", true)}
              className="h-6 text-[10px] px-1.5 bg-white border-orange-300 text-orange-700"
            >
              + Rappi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleCanal("RAPPI", false)}
              className="h-6 text-[10px] px-1.5 bg-white border-orange-300 text-orange-700"
            >
              - Rappi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleCanal("PROYECTO_1", true)}
              className="h-6 text-[10px] px-1.5 bg-white border-blue-300 text-blue-700"
            >
              + P1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleCanal("PROYECTO_2", true)}
              className="h-6 text-[10px] px-1.5 bg-white border-purple-300 text-purple-700"
            >
              + P2
            </Button>
          </div>
        )}
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[58vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-2 w-8 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-2">Producto</th>
                <th className="p-2 text-center">Canales</th>
                <th className="p-2 text-right">P. Local</th>
                <th className="p-2 text-right">P. Rappi</th>
                <th className="p-2 text-right">Dif. %</th>
                <th className="p-2 text-right">Costo (CMP+CMO)</th>
                <th className="p-2 text-right">Neto Rappi</th>
                <th className="p-2 text-right">Ganancia Rappi</th>
                <th className="p-2 text-center">Margen</th>
                <th className="p-2 text-center">Receta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    No se encontraron productos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-orange-50/30 transition-colors ${
                        isSelected ? "bg-orange-50/60" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                        />
                      </td>

                      {/* Producto & Foto */}
                      <td className="p-2 max-w-xs">
                        <div className="flex items-center gap-2">
                          {item.foto ? (
                            <img
                              src={item.foto}
                              alt={item.nombre}
                              className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                              🍽️
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate" title={item.nombre}>
                              {item.nombre}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>{item.grupo || "Sin grupo"}</span>
                              {item.subGrupo && (
                                <>
                                  <span>•</span>
                                  <span>{item.subGrupo}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Canales (Rappi / P1 / P2) */}
                      <td className="p-2 text-center">
                        <CanalToggleCell item={item} />
                      </td>

                      {/* Precio Local */}
                      <td className="p-2 text-right font-medium text-slate-700">
                        {formatCOP(item.precioLocal)}
                      </td>

                      {/* Precio Rappi (Editable / Auto) */}
                      <td className="p-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="h-6 w-20 text-xs font-bold text-right"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSavePrice(item.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSavePrice(item.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-700"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group">
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                item.precioManual
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                              title={item.precioManual ? "Precio fijado manualmente" : "Precio calculado por fórmula"}
                            >
                              {item.precioManual ? "Manual" : "Auto"}
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatCOP(item.precioRappi)}
                            </span>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-orange-600 transition-opacity"
                              title="Editar precio manual"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            {item.precioManual && (
                              <button
                                onClick={() => handleClearManualPrice(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-opacity text-[10px]"
                                title="Volver a cálculo automático"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Diferencia % */}
                      <td className="p-2 text-right font-medium text-orange-700">
                        +{formatPct(item.diferenciaPct)}
                      </td>

                      {/* Costo (CMP + CMO) */}
                      <td className="p-2 text-right text-slate-600">
                        {item.tieneReceta ? (
                          <span title={`CMP: ${formatCOP(item.vCMP)} | CMO: ${formatCOP(item.vCMO)}`}>
                            {formatCOP(item.costo)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-500 italic">Sin receta</span>
                        )}
                      </td>

                      {/* Neto Rappi */}
                      <td className="p-2 text-right text-slate-700 font-medium">
                        {formatCOP(item.neto)}
                      </td>

                      {/* Ganancia Rappi */}
                      <td className="p-2 text-right">
                        {item.tieneReceta ? (
                          <span
                            className={`font-bold ${
                              item.gananciaRappi >= 0 ? "text-emerald-700" : "text-red-600"
                            }`}
                          >
                            {formatCOP(item.gananciaRappi)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Margen % */}
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${colorMargen(
                            item.margenRappi,
                            item.tieneReceta
                          )}`}
                        >
                          {item.tieneReceta ? formatPct(item.margenRappi) : "N/D"}
                        </span>
                      </td>

                      {/* Link Receta */}
                      <td className="p-2 text-center">
                        {item.recetaId ? (
                          <button
                            onClick={() => navigate(`/receta/${item.recetaId}`)}
                            className="p-1 rounded text-slate-400 hover:text-cobalt-blue hover:bg-slate-100"
                            title="Ver ficha técnica de receta"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con conteo */}
        <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Mostrando {filteredItems.length} de {analyzedItems.length} productos</span>
          <span>{selectedIds.size} seleccionados</span>
        </div>
      </div>
    </div>
  );
}

export default RappiProductosTab;
