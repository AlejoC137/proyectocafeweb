import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit, updateItem } from "../../../redux/actions";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE, ItemsAlmacen, ProduccionInterna, MenuItems, CATEGORIES } from "../../../redux/actions-types";
import { CardGridInventario } from "@/components/ui/cardGridInventario";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import { CardGridInventarioMenu } from "@/components/ui/cardGridInventarioMenu";
import { TableViewInventario } from "@/components/ui/tableViewInventario";
// import { TableViewInventario } from "./tableView/TableViewInventario";
import { ViewToggle } from "@/components/ui/viewToggle";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import CategoryNavBar from "../../../components/ui/category-nav-bar";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Package, ChefHat, Settings, Zap, Filter, CheckSquare, Square, Save, Search, X, Trash2, Plus, SlidersHorizontal, RefreshCcw, Eye, EyeOff, Receipt, TrendingUp, TrendingDown, History, ShoppingBag } from "lucide-react";
import HistorialItemModal from "./HistorialItemModal";
import HistorialCambiosView from "./HistorialCambiosView";
import SupermuSyncView from "./SupermuSyncView";
import { generateInventoryUpdatePrompt } from "../../../utils/inventoryUpdatePrompt";
import ReceiptIngestionModal from "./ReceiptIngestionModal";

import { compareAndGenerateHistory, buildUpdatedHistory } from "../../../utils/historyUtils";


function GestionAlmacen() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const getTabType = (tabParam) => {
    switch (tabParam?.toLowerCase()) {
      case 'menu': return MenuItems;
      case 'produccion': return ProduccionInterna;
      case 'almacen':
      default: return ItemsAlmacen;
    }
  };

  const [currentType, setCurrentType] = useState(getTabType(tab));

  useEffect(() => {
    setCurrentType(getTabType(tab));
  }, [tab]);

  const [showAccionesRapidas, setShowAccionesRapidas] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "cards" o "table"

  const Menu = useSelector((state) => state.allMenu || []);
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit);
  const recetas = useSelector((state) => state.allRecetasMenu || []);
  const proveedores = useSelector((state) => state.Proveedores || []);

  const filteredItems = {
    [ItemsAlmacen]: Items,
    [ProduccionInterna]: Produccion,
    [MenuItems]: Menu,
  }[currentType] || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleToggleType = (type) => {
    if (currentType === type) {
      dispatch(resetExpandedGroups());
    } else {
      let tabStr = 'almacen';
      if (type === MenuItems) tabStr = 'menu';
      else if (type === ProduccionInterna) tabStr = 'produccion';
      navigate(`/GestionAlmacen/${tabStr}`);
    }
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const handleToggleAccionesRapidas = () => {
    setShowAccionesRapidas((prev) => !prev);
  };

  // Categorías para CategoryNavBar
  const categories = [
    { type: MenuItems, label: "Menú", icon: "🗺️" },
    { type: ItemsAlmacen, label: "Almacén", icon: "🛒" },
    { type: ProduccionInterna, label: "Producción", icon: "🥘" }
  ];

  // New state for 3-column layout
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("TODOS"); // Group filter
  const [filterProvider, setFilterProvider] = useState("TODOS"); // Provider Filter
  const [selectedItems, setSelectedItems] = useState([]);
  const [stagedItems, setStagedItems] = useState([]); // New state for Column 3
  const [jsonText, setJsonText] = useState("");
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");

  // Bulk Edit States
  const [activeMacroFields, setActiveMacroFields] = useState([
    { key: "Nombre_del_producto", value: "", enabled: true },
    { key: "CANTIDAD", value: "", enabled: true },
    { key: "COSTO", value: "", enabled: true },
    { key: "MARCA", value: "", enabled: true },
    { key: "precioUnitario", value: "", enabled: true }
  ]);
  const [newMacroField, setNewMacroField] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState("actualizador"); // "actualizador" | "historial" | "supermu"

  const handleMacroToggle = (key) => {
    setActiveMacroFields(prev => prev.map(f => {
      if (f.key === key) {
        const newEnabled = !f.enabled;

        // Apply Master Toggle Logic: Enable/Disable this field for ALL staged items
        setStagedItems(currentStaged => currentStaged.map(item => {
          const currentExcluded = item._excludedFields || [];
          const isCurrentlyExcluded = currentExcluded.includes(key);

          if (newEnabled) {
            // Forced Enable -> Remove from excluded
            return { ...item, _excludedFields: currentExcluded.filter(k => k !== key) };
          } else {
            // Forced Disable -> Add to excluded
            if (!isCurrentlyExcluded) {
              return { ...item, _excludedFields: [...currentExcluded, key] };
            }
            return item;
          }
        }));

        return { ...f, enabled: newEnabled };
      }
      return f;
    }));
  };

  const handleMacroValueChange = (key, val) => {
    setActiveMacroFields(prev => prev.map(f => f.key === key ? { ...f, value: val } : f));
    setStagedItems(prev => prev.map(item => ({ ...item, [key]: val })));
  };

  const handleAddMacroField = () => {
    if (newMacroField && !activeMacroFields.find(f => f.key === newMacroField)) {
      setActiveMacroFields(prev => [...prev, { key: newMacroField, value: "", enabled: true }]);
      setNewMacroField("");
    }
  };


  // Prompt Options
  const [forceSelectedProviders, setForceSelectedProviders] = useState(false);
  const [singleProviderReturn, setSingleProviderReturn] = useState(false);
  const [forceLowestUnitPrice, setForceLowestUnitPrice] = useState(false); // New option




  // UI States for "Action Description"
  const [showHelp, setShowHelp] = useState(true);
  const [helpText, setHelpText] = useState("");

  // Filter items based on search term AND Group
  const filteredSearchItems = (() => {
    if (!searchTerm && selectedGroup === "TODOS" && filterProvider === "TODOS") return [];

    return filteredItems.filter((item) => {
      const matchesSearch = item.Nombre_del_producto?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === "TODOS" || item.GRUPO === selectedGroup;

      let itemProvId = item.Proveedor;
      // Handle populated object case just in case, but prioritize the ID
      if (itemProvId && typeof itemProvId === 'object' && itemProvId._id) {
        itemProvId = itemProvId._id;
      }

      const matchesProvider = filterProvider === "TODOS" || String(itemProvId).trim().toLowerCase() === String(filterProvider).trim().toLowerCase();

      return matchesSearch && matchesGroup && matchesProvider;
    });
  })();

  // Effect to auto-select provider options when filtering by provider
  useEffect(() => {
    if (filterProvider !== "TODOS") {
      setForceSelectedProviders(true);
      setSingleProviderReturn(true);
      setSelectedProviderIds([filterProvider]);
    } else {
      // Optional: Reset?? User didn't specify, but maybe safer not to reset in case they manually set it?
      // Let's leave it manual if they go back to TODOS, or maybe just clear the provider selection in Col 2.
      // For "Force" checkboxes, better leave them as user might have wanted them ON anyway.
      // But for selectedProviderIds, if we go to TODOS, maybe we should clear it IF it was just that one?
      // Let's stick to strict user request: "When filtering... force return... and addition".
      // It implies the action happens ON selection.
    }
  }, [filterProvider]);

  const handleSelectItem = (item) => {
    // Prevent duplicates
    if (!selectedItems.find((i) => i._id === item._id)) {
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems((prev) => prev.filter((i) => i._id !== itemId));
    setStagedItems((prev) => prev.filter((i) => i._id !== itemId));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCopyPrompt = async () => {
    if (selectedItems.length === 0) return;
    try {
      const selectedProviderObjects = proveedores.filter(p => selectedProviderIds.includes(p._id));
      // Generate prompt using the new centralized utility
      const promptText = generateInventoryUpdatePrompt(
        selectedItems,
        selectedProviderObjects,
        proveedores, // Pass all providers for lookup
        forceSelectedProviders,
        singleProviderReturn,
        forceLowestUnitPrice // Pass the new flag
      );
      await navigator.clipboard.writeText(promptText);
      alert("Prompt copiado al portapapeles");
    } catch (err) {
      console.error("Failed to copy prompt:", err);
      alert("Error al copiar el prompt");
    }
  };


  const handleProcessJson = () => {
    if (!jsonText) return;
    try {
      let parsed = JSON.parse(jsonText);
      const updates = Array.isArray(parsed) ? parsed : [parsed];

      const newStagedItems = updates.map(update => {
        const original = selectedItems.find(i => i._id === update._id);
        if (!original) return null;
        return {
          ...original,
          ...update,
          _original: original,
          _isStaged: true,
          _includedFields: Object.keys(update).filter(k => k !== "_id" && k !== "COSTO")
        };
      }).filter(Boolean);

      if (newStagedItems.length === 0) {
        alert("Ningún _id del JSON coincide con los items seleccionados. Asegúrate de seleccionar los items en la columna izquierda antes de procesar.");
        return;
      }
      setStagedItems(newStagedItems);
    } catch (e) {
      alert("Error al parsear JSON: " + e.message);
    }
  };

  const handleRemoveStagedItem = (itemId) => {
    setStagedItems(prev => prev.filter(i => i._id !== itemId));
  };
  const handleUpdateStagedItem = (itemId, field, newValue) => {
    setStagedItems(prev => prev.map(item => (item._id === itemId ? { ...item, [field]: newValue } : item)));
  };

  const handleToggleFieldInclusion = (itemId, field) => {
    setStagedItems(prev => prev.map(item => {
      if (item._id === itemId) {
        const currentExcluded = item._excludedFields || [];
        const isExcluded = currentExcluded.includes(field);

        return {
          ...item,
          _excludedFields: isExcluded
            ? currentExcluded.filter(f => f !== field) // Include it back
            : [...currentExcluded, field] // Exclude it
        };
      }
      return item;
    }));
  };



  const handleSaveChanges = async () => {
    const itemsToUpdate = stagedItems;

    if (itemsToUpdate.length === 0) return alert("No hay cambios pendientes para guardar.");

    setIsSaving(true);
    try {
      const promises = itemsToUpdate.map(async (item) => {
        // 1. Start with the staged item properties
        const payload = { ...item };
        const original = item._original || {};

        // 2. Revert properties that were excluded by the user
        const excludedFields = item._excludedFields || [];
        excludedFields.forEach(field => {
          payload[field] = original[field];
        });

        // 3. Ensure numbers are numbers
        if (payload.COSTO !== undefined && payload.COSTO !== null && payload.COSTO !== "") {
          payload.COSTO = Number(payload.COSTO);
        }
        if (payload.CANTIDAD !== undefined && payload.CANTIDAD !== null && payload.CANTIDAD !== "") {
          payload.CANTIDAD = Number(payload.CANTIDAD);
        }
        if (payload.precioUnitario !== undefined && payload.precioUnitario !== null && payload.precioUnitario !== "") {
          payload.precioUnitario = Number(payload.precioUnitario);
        }

        // 4. Calculate actual field changes
        const ignoredKeys = ["_id", "historial_update", "FECHA_ACT", "createdAt", "updatedAt", "campos_parseados", "id"];
        const cambios = {};

        Object.keys(payload).forEach(key => {
          if (key.startsWith('_') || ignoredKeys.includes(key)) return;

          let oldVal = original[key];
          let newVal = payload[key];

          const isOldNum = !isNaN(oldVal) && oldVal !== "" && oldVal !== null && typeof oldVal !== 'object';
          const isNewNum = !isNaN(newVal) && newVal !== "" && newVal !== null && typeof newVal !== 'object';

          let different = false;
          if (isOldNum && isNewNum) {
            if (Number(oldVal) !== Number(newVal)) different = true;
          } else {
            const strOld = (oldVal === null || oldVal === undefined) ? "" : String(oldVal).trim();
            const strNew = (newVal === null || newVal === undefined) ? "" : String(newVal).trim();
            if (strOld !== strNew) different = true;
          }

          if (different) {
            cambios[key] = {
              anterior: oldVal !== undefined ? oldVal : null,
              nuevo: newVal
            };
          }
        });

        // 5. Append to historial_update if there are changes
        if (Object.keys(cambios).length > 0) {
          payload.historial_update = buildUpdatedHistory(original.historial_update, cambios, "GestionAlmacen");
          payload.FECHA_ACT = new Date().toISOString().split('T')[0];
        }

        // 6. Cleanup internal flags (Aggressive cleanup of ALL underscores)
        Object.keys(payload).forEach(key => {
          if (key.startsWith('_')) delete payload[key];
        });

        return dispatch(updateItem(item._id, payload, currentType));
      });

      await Promise.all(promises);
      alert("Inventario actualizado correctamente.");
      setSelectedItems([]);
      setStagedItems([]);
      setJsonText("");
      dispatch(getAllFromTable(currentType || ITEMS));
    } catch (error) {
      console.error("Error updating items:", error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to extract all available keys from selected/staged items for Bulk Edit
  const getAvailableKeys = () => {
    const source = stagedItems.length > 0 ? stagedItems : selectedItems;
    if (source.length === 0) return ["Proveedor", "MARCA", "GRUPO", "COSTO", "Merma"];

    // Collect all unique keys from all items
    const allKeys = new Set();
    source.forEach(item => {
      Object.keys(item).forEach(key => {
        if (!key.startsWith('_') && key !== 'historial_update' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'campos_parseados' && key !== 'id') {
          allKeys.add(key);
        }
      });
    });
    return Array.from(allKeys).sort();
  };

  const availableKeys = getAvailableKeys(); // All possible keys from items
  // Keys available to ADD (not already in activeMacroFields)
  const availableToAdd = availableKeys.filter(k => !activeMacroFields.find(f => f.key === k));

  const itemsWithHistoryCount = Items.filter(i => Array.isArray(i.historial_update) ? i.historial_update.length > 0 : !!i.historial_update).length;

  return (
    <PageLayout loading={loading} >
      {/* Top Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveMainTab("actualizador")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === "actualizador"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Gestión Precios & IA</span>
          </button>

          <button
            onClick={() => setActiveMainTab("historial")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === "historial"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="h-3.5 w-3.5 text-blue-600" />
            <span>Historial en el Tiempo</span>
            {itemsWithHistoryCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeMainTab === "historial" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"
              }`}>
                {itemsWithHistoryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainTab("supermu")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === "supermu"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 text-rose-500" />
            <span>Catálogo Supermú (Directo)</span>
            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-extrabold">2.6k</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Total Ítems en Almacén: <strong className="text-slate-700">{Items.length}</strong></span>
        </div>
      </div>

      {activeMainTab === "historial" && (
        <HistorialCambiosView
          items={Items}
          categorias={CATEGORIES}
          onRefresh={() => dispatch(getAllFromTable(ITEMS))}
        />
      )}

      {activeMainTab === "supermu" && (
        <SupermuSyncView items={Items} />
      )}

      {activeMainTab === "actualizador" && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 min-h-[calc(100vh-185px)] md:h-[calc(100vh-185px)] text-xs">
        {/* Column 1: Search & Selection List */}
        <div className="bg-white rounded-lg shadow-sm border p-2 flex flex-col h-full gap-2 border-t-4 border-t-blue-500/80">
          <h2 className="text-sm font-bold mb-1 text-slate-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-500" />
            Explorador
          </h2>

          {/* Search & Filter Section */}
          <div className="flex-shrink-0 space-y-2 bg-slate-50 p-2 rounded border border-slate-100">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Buscar</label>
              <input
                type="text"
                placeholder="Nombre item..."
                className="w-full p-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grupo</label>
                <select
                  className="w-full p-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 bg-white h-8"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Proveedor</label>
                <select
                  className="w-full p-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 bg-white h-8"
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {proveedores.map(p => (
                    <option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  const newItems = filteredSearchItems.filter(i => !selectedItems.some(s => s._id === i._id));
                  setSelectedItems(prev => [...prev, ...newItems]);
                }}
                className="cursor-pointer h-7 px-3 flex items-center justify-center rounded border border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors text-[10px] font-bold gap-1 shadow-sm"
                title="Seleccionar todos los items listados"
              >
                <CheckSquare className="h-3 w-3" />
                Seleccionar Todos
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Resultados</span>
              <span>{filteredSearchItems.length}</span>
            </h3>
            <div className="overflow-y-auto space-y-0.5 p-1 flex-1">
              {filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    className="group relative p-1.5 rounded hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-all border border-transparent hover:border-blue-100"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[11px] leading-tight font-medium text-slate-700 truncate">{item.Nombre_del_producto}</span>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        <span className="truncate max-w-[80px]">{item.GRUPO || 'Sin grupo'}</span>
                        <span>•</span>
                        <span>{item.UNIDADES}</span>
                      </div>
                    </div>
                    <div className="text-[10px] items-end flex flex-col opacity-70 group-hover:opacity-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistoryItem(item);
                          }}
                          className={`p-0.5 rounded hover:bg-blue-100 transition-colors ${
                            item.historial_update && item.historial_update.length > 0
                              ? "text-blue-600 font-bold"
                              : "text-slate-300 hover:text-slate-500"
                          }`}
                          title={
                            item.historial_update && item.historial_update.length > 0
                              ? `Ver historial (${item.historial_update.length} cambios)`
                              : "Ver historial"
                          }
                        >
                          <History className="h-3 w-3" />
                        </button>
                        <span className="font-semibold text-slate-600">
                          ${new Intl.NumberFormat("es-CO").format(item.COSTO || 0)}
                        </span>
                      </div>
                      <span className="bg-blue-100 text-blue-600 px-1 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">ADD</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-300 text-center py-8 flex flex-col items-center">
                  <Package className="h-8 w-8 mb-2 opacity-20" />
                  <span className="text-[10px]">Sin resultados</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Items List - Compact Tags */}
          <div className="h-1/3 flex flex-col min-h-0 border-t pt-2 mt-1">
            <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>Seleccionados</span>
                <span className="bg-blue-100 px-1 rounded text-blue-700">{selectedItems.length}</span>
              </div>
              {selectedItems.length > 0 && (
                <button
                  onClick={() => { setSelectedItems([]); setStagedItems([]); }}
                  className="text-[9px] text-red-400 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-1 rounded transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Limpiar
                </button>
              )}
            </h3>
            <div className="overflow-y-auto p-1 flex-1 bg-blue-50/30 rounded border border-blue-100/50">
              <div className="flex flex-wrap gap-1 content-start">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <div key={`sel-${item._id}`} className="bg-white pl-2 pr-1 py-0.5 rounded-full shadow-sm border border-blue-100 flex items-center gap-1 group whitespace-nowrap max-w-full">
                      <span className="text-[10px] font-medium text-slate-700 truncate max-w-[120px]">{item.Nombre_del_producto}</span>
                      <button onClick={() => handleRemoveItem(item._id)} className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] italic">
                    Lista vacía
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Actions Options */}
        <div className="bg-white rounded-lg shadow-sm border p-2 flex flex-col h-full border-t-4 border-t-amber-400/80 gap-2">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Acciones
            </h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowReceiptModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 flex-1"
              >
                <Receipt className="h-3 w-3 mr-2" />
                Ingestión Recibo (IA)
              </Button>
              {showHelp && (
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${helpText ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : 'text-slate-300 border-transparent'}`}>
                  {helpText || "Opciones de Prompt"}
                </span>
              )}
              <button onClick={() => setShowHelp(!showHelp)} className="text-slate-400 hover:text-blue-500">
                {showHelp ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {selectedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-2">
              <Settings className="h-12 w-12 opacity-20" />
              <p className="text-center px-4 text-[11px]">Selecciona items en la izquierda para ver opciones disponibles</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopyPrompt}
                  variant="outline"
                  className="flex-1 justify-between items-center border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs h-8"
                >
                  <span>Generar Prompt IA</span>
                  <Zap className="h-3 w-3" />
                </Button>

                {/* Prompt Options Checkboxes */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1" onMouseEnter={() => setHelpText("Forzar proveedores seleccionados")} onMouseLeave={() => setHelpText("")}>
                    <div onClick={() => setForceSelectedProviders(!forceSelectedProviders)} className={`cursor-pointer h-8 w-8 flex items-center justify-center rounded border transition-colors ${forceSelectedProviders ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-white border-blue-200 text-slate-300 hover:border-blue-300'}`}>
                      {forceSelectedProviders ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onMouseEnter={() => setHelpText("Unificar en UN solo proveedor")} onMouseLeave={() => setHelpText("")}>
                    <div onClick={() => setSingleProviderReturn(!singleProviderReturn)} className={`cursor-pointer h-8 w-8 flex items-center justify-center rounded border transition-colors ${singleProviderReturn ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-blue-200 text-slate-300 hover:border-blue-300'}`}>
                      {singleProviderReturn ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onMouseEnter={() => setHelpText("Buscar precio unitario MÁS BAJO")} onMouseLeave={() => setHelpText("")}>
                    <div onClick={() => setForceLowestUnitPrice(!forceLowestUnitPrice)} className={`cursor-pointer h-8 w-8 flex items-center justify-center rounded border transition-colors ${forceLowestUnitPrice ? 'bg-green-100 border-green-300 text-green-600' : 'bg-white border-blue-200 text-slate-300 hover:border-blue-300'}`}>
                      <span className="text-[10px] font-bold">$</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider List Filter */}
              <div className="flex flex-col min-h-0 border-t pt-2">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Filtrar Proveedores</h3>
                  <input
                    type="text"
                    className="flex-1 min-w-0 p-0.5 border-b border-slate-200 text-[10px] focus:outline-none focus:border-blue-500 bg-transparent text-right"
                    placeholder="Buscar..."
                    value={providerSearchTerm}
                    onChange={(e) => setProviderSearchTerm(e.target.value)}
                  />
                  {(selectedProviderIds.length > 0 || providerSearchTerm) && (
                    <span className="text-[9px] text-blue-500 cursor-pointer hover:underline whitespace-nowrap" onClick={() => { setSelectedProviderIds([]); setProviderSearchTerm(""); }}>Limpiar</span>
                  )}
                </div>
                <div className="bg-slate-50 border rounded p-2 overflow-y-auto flex-1 max-h-[140px] custom-scrollbar">
                  <div className="flex flex-wrap gap-1">
                    {proveedores
                      .filter(p => p.Nombre_Proveedor.toLowerCase().includes(providerSearchTerm.toLowerCase()))
                      .map(prov => {
                        const isSelected = selectedProviderIds.includes(prov._id);
                        return (
                          <div
                            key={prov._id}
                            onClick={() => {
                              if (isSelected) setSelectedProviderIds(s => s.filter(id => id !== prov._id));
                              else setSelectedProviderIds(s => [...s, prov._id]);
                            }}
                            className={`cursor-pointer px-2 py-1 rounded-full text-[10px] border transition-all select-none ${isSelected
                              ? 'bg-blue-100 border-blue-200 text-blue-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            {prov.Nombre_Proveedor}
                          </div>
                        )
                      })}
                  </div>
                  {proveedores.filter(p => p.Nombre_Proveedor.toLowerCase().includes(providerSearchTerm.toLowerCase())).length === 0 && (
                    <div className="text-center text-slate-300 text-[10px] py-4">No encontrado</div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 border-t pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Respuesta JSON (Pegar aquí)
                </label>
                <textarea
                  className="flex-1 w-full p-2 border border-slate-300 rounded text-[10px] font-mono leading-relaxed focus:outline-none focus:border-green-500 resize-none bg-slate-50 focus:bg-white transition-colors"
                  placeholder='[ { "_id": "...", "COSTO": "15000" } ... ]'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                ></textarea>
              </div>

              <Button
                onClick={handleProcessJson}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm h-9 text-xs font-semibold"
                disabled={!jsonText}
              >
                Procesar Cambios
              </Button>
            </div>
          )}
        </div>

        {/* Column 3: Confirmation, Bulk Edit & Save */}
        <div className="bg-white rounded-lg shadow-sm border p-2 flex flex-col h-full border-t-4 border-t-green-500/80">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-600" />
              Revisión
            </h2>
            {stagedItems.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{stagedItems.length} items</span>}
          </div>

          {/* Advanced Bulk Edit Panel */}
          {stagedItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2 flex-none max-h-[35vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  Edición Masiva (Macro)
                </h3>

                {/* Add Field Control */}
                <div className="flex items-center gap-1">
                  <select
                    className="h-5 text-[9px] border border-amber-300 rounded bg-white focus:outline-none w-24"
                    value={newMacroField}
                    onChange={(e) => setNewMacroField(e.target.value)}
                  >
                    <option value="">+ Campo...</option>
                    {availableToAdd.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <button
                    onClick={handleAddMacroField}
                    disabled={!newMacroField}
                    className="h-5 w-5 bg-amber-500 text-white rounded flex items-center justify-center hover:bg-amber-600 disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Dynamic Macro Fields List */}
              <div className="space-y-1">
                {activeMacroFields.map((field) => (
                  <div key={field.key} className="flex gap-1 items-center bg-white/50 p-1 rounded border border-amber-100">
                    {/* Master Switch */}
                    <div
                      onClick={() => handleMacroToggle(field.key)}
                      className={`cursor-pointer flex-shrink-0 ${field.enabled ? 'text-amber-600' : 'text-slate-300'}`}
                      title={field.enabled ? `Desactivar ${field.key} en todos` : `Activar ${field.key} en todos`}
                    >
                      {field.enabled ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    </div>

                    {/* Label */}
                    <span className={`text-[10px] font-bold w-[70px] truncate ${field.enabled ? 'text-slate-600' : 'text-slate-400 opacity-70'}`} title={field.key}>
                      {field.key}
                    </span>

                    {/* Value Input */}
                    {field.key === "Proveedor" ? (
                      <select
                        className={`flex-1 h-5 text-[10px] border border-slate-200 rounded bg-white focus:outline-none focus:border-amber-400 ${!field.enabled ? 'opacity-50 pointer-events-none' : ''}`}
                        value={field.value}
                        onChange={(e) => handleMacroValueChange(field.key, e.target.value)}
                        disabled={!field.enabled}
                      >
                        <option value="">Seleccionar...</option>
                        {proveedores.map(p => <option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className={`flex-1 h-5 text-[10px] border border-slate-200 rounded px-1 bg-white focus:outline-none focus:border-amber-400 min-w-0 font-mono text-right ${!field.enabled ? 'opacity-50 pointer-events-none' : ''}`}
                        placeholder="-"
                        value={field.value}
                        onChange={(e) => handleMacroValueChange(field.key, e.target.value)}
                        disabled={!field.enabled}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto mb-2 bg-slate-50 rounded border border-slate-100 p-2 custom-scrollbar">
            {stagedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                <Package className="h-10 w-10 opacity-20" />
                <p className="text-center text-[11px]">Procesa el JSON para ver los cambios aquí</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stagedItems.map(item => {

                  // Helper to get change list
                  const changes = compareAndGenerateHistory(item._original, item);
                  const isUpdated = changes.length > 0;

                  return (
                    <div key={item._id} className="bg-white border rounded shadow-sm overflow-hidden text-xs">
                      <div className="bg-slate-50 border-b px-2 py-1.5 flex justify-between items-center">
                        <span className="font-bold text-slate-700 truncate flex-1 flex flex-col min-w-0" title={item.Nombre_del_producto}>
                          {item._original?.Nombre_del_producto !== item.Nombre_del_producto ? (
                            <>
                              <span className="text-[9px] text-slate-400 line-through truncate opacity-70">
                                {item._original?.Nombre_del_producto}
                              </span>
                              <span className="text-blue-600 truncate">
                                {item.Nombre_del_producto}
                              </span>
                            </>
                          ) : (
                            <span className="truncate">{item.Nombre_del_producto}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryItem(item._original || item)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 transition-colors"
                            title="Ver historial previo"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveStagedItem(item._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                            title="Descartar este item"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        {isUpdated && (
                          <div className="flex flex-col gap-1 mt-1">
                            {changes.map((change) => {
                              const isExcluded = item._excludedFields?.includes(change.campo);
                              
                              // Check if value increased or decreased (for numeric fields like COSTO or precioUnitario)
                              const isNumeric = (val) => !isNaN(val) && val !== "" && val !== null && typeof val !== 'object';
                              const subio = isNumeric(change.valor_inicial) && isNumeric(change.valor_final) && Number(change.valor_final) > Number(change.valor_inicial);
                              const bajo = isNumeric(change.valor_inicial) && isNumeric(change.valor_final) && Number(change.valor_final) < Number(change.valor_inicial);

                              return (
                                <div key={change.campo} className={`text-[10px] flex items-center gap-2 px-1 py-1 rounded border transition-all ${isExcluded ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-blue-50/50 border-blue-100'}`}>

                                  {/* Toggle Checkbox */}
                                  <div onClick={() => handleToggleFieldInclusion(item._id, change.campo)} className="cursor-pointer text-blue-600 flex-shrink-0">
                                    {isExcluded ? <Square className="h-3 w-3 text-slate-400" /> : <CheckSquare className="h-3 w-3" />}
                                  </div>

                                  {/* Change Detail */}
                                  <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
                                    <span className="font-semibold text-slate-600 truncate w-[60px] flex-shrink-0" title={change.campo}>{change.campo}</span>

                                    <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                      <span className="text-slate-400 font-mono truncate max-w-[50%] text-[9px] text-right">{change.valor_inicial ?? '-'}</span>
                                      <span className="text-slate-300 flex-shrink-0">→</span>
                                        <input
                                          type="text"
                                          className={`flex-1 min-w-0 text-[10px] border-b focus:outline-none bg-transparent font-mono font-bold text-right px-0.5 ${
                                            isExcluded ? 'text-slate-400 border-slate-300' : 
                                            subio ? 'text-red-600 border-red-300 focus:border-red-500' : 
                                            bajo ? 'text-emerald-600 border-emerald-300 focus:border-emerald-500' :
                                            'text-blue-700 border-blue-300 focus:border-blue-500'
                                          }`}
                                          value={change.valor_final ?? ""}
                                          onChange={(e) => handleUpdateStagedItem(item._id, change.campo, e.target.value)}
                                          disabled={isExcluded}
                                        />
                                        {subio && !isExcluded && <TrendingUp size={10} className="text-red-600 flex-shrink-0" />}
                                        {bajo && !isExcluded && <TrendingDown size={10} className="text-emerald-600 flex-shrink-0" />}
                                      </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:opacity-50 h-9 text-xs font-bold"
            disabled={stagedItems.length === 0 || isSaving}
            onClick={handleSaveChanges}
          >
            {isSaving ? "Guardando..." : "Guardar Todo"}
          </Button>
        </div>
      </div>
      )}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
          <ReceiptIngestionModal 
            onClose={() => setShowReceiptModal(false)} 
            onSuccess={() => dispatch(getAllFromTable(ITEMS))}
          />
        </div>
      )}
      {selectedHistoryItem && (
        <HistorialItemModal
          item={selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
        />
      )}
    </PageLayout>
  );
}

export default GestionAlmacen;
