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
import { UtensilsCrossed, Package, ChefHat, Settings, Zap, Filter, CheckSquare, Square, Save, Search, X, Trash2, Plus, SlidersHorizontal, RefreshCcw, Eye, EyeOff, Receipt, TrendingUp, TrendingDown, History, ShoppingBag, Sparkles, ExternalLink, Check, Store } from "lucide-react";
import HistorialItemModal from "./HistorialItemModal";
import HistorialCambiosView from "./HistorialCambiosView";
import ProveedorHistorialView from "./ProveedorHistorialView";
import SupermuSyncView from "./SupermuSyncView";
import SupermuMacroModal from "./SupermuMacroModal";
import { getSupermuCatalog, autoMatchInventory, buildSupermuPromptContext, findCandidatesForItem, buildProposedStagedItem } from "../../../utils/supermuMatcher";
import { markHistoricalRowsApplied } from "../../../utils/providerSnapshotUtils";
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
  const [supermuOnlySource, setSupermuOnlySource] = useState(false);
  const [showSupermuMacroModal, setShowSupermuMacroModal] = useState(false);
  const [isAutoMatchingSupermu, setIsAutoMatchingSupermu] = useState(false);
  const [col2Mode, setCol2Mode] = useState("supermu"); // "supermu" | "prompt"
  const [supermuCatalogList, setSupermuCatalogList] = useState([]);
  const [focusedItemId, setFocusedItemId] = useState(null);
  const [supermuFilterQuery, setSupermuFilterQuery] = useState("");

  useEffect(() => {
    getSupermuCatalog().then((cat) => {
      if (Array.isArray(cat)) setSupermuCatalogList(cat);
    });
  }, []);

  const handleApplySupermuToItem = (item, supermuProd) => {
    const proposed = buildProposedStagedItem(item, supermuProd);
    setStagedItems((prev) => {
      const filtered = prev.filter((p) => p._id !== item._id);
      return [...filtered, proposed];
    });
  };

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
    if (!selectedItems.find((i) => i._id === item._id)) {
      setSelectedItems((prev) => [...prev, item]);
      setFocusedItemId(item._id);
    } else {
      setFocusedItemId(item._id);
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
      let supermuCandidatesText = "";
      if (supermuOnlySource) {
        const catalog = await getSupermuCatalog();
        const matchRes = autoMatchInventory(selectedItems, catalog, 0.4);
        supermuCandidatesText = buildSupermuPromptContext(matchRes.matches);
      }
      // Generate prompt using the new centralized utility
      const promptText = generateInventoryUpdatePrompt(
        selectedItems,
        selectedProviderObjects,
        proveedores, // Pass all providers for lookup
        forceSelectedProviders,
        singleProviderReturn,
        forceLowestUnitPrice, // Pass the new flag
        supermuOnlySource,
        supermuCandidatesText
      );
      await navigator.clipboard.writeText(promptText);
      alert(
        supermuOnlySource
          ? "¡Prompt copiado al portapapeles con CATÁLOGO SUPERMÚ como ÚNICA FUENTE!"
          : "Prompt copiado al portapapeles"
      );
    } catch (err) {
      console.error("Failed to copy prompt:", err);
      alert("Error al copiar el prompt");
    }
  };


  const handleAutoMatchWithSupermu = async (itemsToMatch = selectedItems) => {
    if (!itemsToMatch || itemsToMatch.length === 0) {
      alert("Por favor selecciona ítems en la Columna 1 antes de sincronizar.");
      return;
    }
    setIsAutoMatchingSupermu(true);
    try {
      const catalog = supermuCatalogList.length > 0 ? supermuCatalogList : await getSupermuCatalog();
      const res = autoMatchInventory(itemsToMatch, catalog, 0.40);

      if (res.matches.length === 0) {
        alert("No se encontraron coincidencias automáticas directas. Puedes buscar el producto en el buscador manual de Supermú o usar 'Macro Todo' para ajustar la sensibilidad.");
        return;
      }

      const newStaged = res.matches.map(m => m.proposed);
      setStagedItems(prev => {
        const existingIds = new Set(newStaged.map(n => n._id));
        const kept = prev.filter(p => !existingIds.has(p._id));
        return [...kept, ...newStaged];
      });

      alert(`¡${res.matches.length} de ${itemsToMatch.length} productos cruzados con éxito con el Catálogo Supermú!\n\nRevisa los cambios y diferencias en la Columna 3 (Revisión).`);
    } catch (err) {
      console.error(err);
      alert("Error al cruzar con Supermú: " + err.message);
    } finally {
      setIsAutoMatchingSupermu(false);
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
          const isFromSupermu = !!item._matchedSupermu;
          const isFromProvider = !!item._providerSourceLabel;
          payload.historial_update = buildUpdatedHistory(original.historial_update, cambios, {
            origen: isFromProvider
              ? item._providerSourceLabel
              : isFromSupermu
              ? "Catálogo Supermú (Referencia)"
              : "Gestión Almacén",
            tipo: isFromSupermu || isFromProvider ? "automático" : "manual"
          });
          payload.FECHA_ACT = new Date().toISOString().split('T')[0];
        }

        // 6. Cleanup internal flags (Aggressive cleanup of ALL underscores)
        Object.keys(payload).forEach(key => {
          if (key.startsWith('_')) delete payload[key];
        });

        return dispatch(updateItem(item._id, payload, currentType));
      });

      await Promise.all(promises);

      const appliedRowIds = itemsToUpdate.map(i => i._providerSnapshotRowId).filter(Boolean);
      const captureIds = [...new Set(itemsToUpdate.map(i => i._providerCaptureId).filter(Boolean))];
      if (appliedRowIds.length > 0) {
        await markHistoricalRowsApplied(appliedRowIds, captureIds[0] || null).catch((err) =>
          console.warn("No se pudo marcar aplicado_a_almacen:", err)
        );
      }

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
            <span>Catálogos (Supermú / Éxito / Makro)</span>
            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-extrabold">3</span>
          </button>

          <button
            onClick={() => setActiveMainTab("proveedores_historial")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === "proveedores_historial"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="h-3.5 w-3.5 text-indigo-600" />
            <span>Historial por Proveedor</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Total Ítems en Almacén: <strong className="text-slate-700">{Items.length}</strong></span>
        </div>
      </div>

      {activeMainTab === "historial" && (
        <HistorialCambiosView
          items={Items}
          menuItems={Menu}
          categorias={CATEGORIES}
          onRefresh={() => {
            dispatch(getAllFromTable(ITEMS));
            dispatch(getAllFromTable(MENU));
          }}
        />
      )}

      {activeMainTab === "supermu" && (
        <SupermuSyncView
          items={Items}
          onSendToStaging={(newStaged) => {
            setStagedItems((prev) => {
              const existingIds = new Set(prev.map((p) => p._id));
              const added = newStaged.filter((n) => !existingIds.has(n._id));
              return [...prev, ...added];
            });
            setActiveMainTab("actualizador");
          }}
        />
      )}

      {activeMainTab === "proveedores_historial" && (
        <ProveedorHistorialView
          proveedores={proveedores}
          items={Items}
          onSendToStaging={(newStaged) => {
            setStagedItems((prev) => {
              const existingIds = new Set(prev.map((p) => p._id));
              const added = newStaged.filter((n) => !existingIds.has(n._id));
              return [...prev, ...added];
            });
            setActiveMainTab("actualizador");
          }}
        />
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

        {/* Column 2: Actions & Reference Catalog Engine */}
        <div className="bg-white rounded-lg shadow-sm border p-2 flex flex-col h-full border-t-4 border-t-amber-400/80 gap-2">
          {/* Header & Mode Switcher */}
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 gap-1 flex-none">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCol2Mode("supermu")}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  col2Mode === "supermu"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShoppingBag className="h-3 w-3" />
                <span>Catálogo Referencia Supermú</span>
                <span className="text-[9px] px-1 rounded bg-black/20 font-mono">2.6k</span>
              </button>
              <button
                type="button"
                onClick={() => setCol2Mode("prompt")}
                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
                  col2Mode === "prompt"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Zap className="h-3 w-3" />
                <span>IA & Prompt</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => setShowReceiptModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] h-7 px-2"
                title="Escanear recibo físico con IA"
              >
                <Receipt className="h-3 w-3 mr-1" />
                Recibo
              </Button>
            </div>
          </div>

          {col2Mode === "supermu" ? (
            /* ================= SUPERMÚ REFERENCE ENGINE ================= */
            <div className="flex-1 flex flex-col gap-2 min-h-0">
              {/* Primary Action Banner */}
              <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-200 rounded-lg p-2 flex flex-col gap-1.5 shadow-xs flex-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[11px] font-extrabold text-rose-900 tracking-wide">
                      Catálogo Único de Referencia (Supermú)
                    </span>
                  </div>
                  <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                    {supermuCatalogList.length > 0 ? `${supermuCatalogList.length} prods` : "Cargando..."}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <Button
                    onClick={() => {
                      if (selectedItems.length > 0) {
                        handleAutoMatchWithSupermu(selectedItems);
                      } else {
                        const toMatch = filteredSearchItems.length > 0 ? filteredSearchItems : Items;
                        setSelectedItems(toMatch);
                        handleAutoMatchWithSupermu(toMatch);
                      }
                    }}
                    disabled={isAutoMatchingSupermu}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs h-8 font-bold shadow-xs flex items-center justify-center gap-1.5"
                    title="Cruzar automáticamente los ítems con el catálogo de Supermú y cargar cambios en Revisión"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      {isAutoMatchingSupermu
                        ? "Cruzando con Supermú..."
                        : selectedItems.length > 0
                        ? `⚡ Auto-Cruzar Selección (${selectedItems.length})`
                        : `⚡ Seleccionar y Cruzar ${filteredSearchItems.length} de ${selectedGroup === 'TODOS' ? 'Almacén' : selectedGroup}`}
                    </span>
                  </Button>

                  <Button
                    onClick={() => setShowSupermuMacroModal(true)}
                    variant="outline"
                    className="border-rose-300 text-rose-700 hover:bg-rose-100/60 text-xs h-8 font-bold px-2.5 flex items-center gap-1"
                    title="Abrir explorador masivo de Supermú para todo el almacén"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Macro Todo</span>
                  </Button>
                </div>
              </div>

              {/* Items Selected: Interactive Candidate Inspector */}
              {selectedItems.length > 0 ? (
                <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-slate-50/50 p-2 gap-2">
                  {/* Pills of selected items */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar flex-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-none">Ítem:</span>
                    {selectedItems.map((si) => {
                      const isFocused = (focusedItemId || selectedItems[0]?._id) === si._id;
                      const isStaged = stagedItems.some((st) => st._id === si._id);
                      return (
                        <button
                          key={si._id}
                          type="button"
                          onClick={() => setFocusedItemId(si._id)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all whitespace-nowrap flex items-center gap-1 flex-none ${
                            isFocused
                              ? "bg-rose-600 text-white border-rose-600 font-bold shadow-xs"
                              : isStaged
                              ? "bg-green-50 text-green-700 border-green-300 font-medium"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className="max-w-[110px] truncate">{si.Nombre_del_producto}</span>
                          {isStaged && <span className="text-[8px] bg-green-200 text-green-800 rounded px-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Focused item details & candidate list */}
                  {(() => {
                    const focused = selectedItems.find((i) => i._id === (focusedItemId || selectedItems[0]?._id)) || selectedItems[0];
                    if (!focused) return null;

                    const candidates = supermuCatalogList.length > 0 ? findCandidatesForItem(focused, supermuCatalogList, 5, 0.35) : [];
                    const stagedForFocused = stagedItems.find((s) => s._id === focused._id);

                    return (
                      <div className="flex-1 flex flex-col min-h-0 gap-1.5">
                        {/* Focused item header info */}
                        <div className="bg-white border rounded p-1.5 flex justify-between items-center text-xs shadow-2xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-slate-800 truncate text-[11px]">{focused.Nombre_del_producto}</p>
                            <p className="text-[10px] text-slate-400">
                              Costo actual: <span className="font-bold text-slate-600">${new Intl.NumberFormat("es-CO").format(focused.COSTO || 0)}</span> • {focused.UNIDADES || "und"}
                            </p>
                          </div>
                          {stagedForFocused ? (
                            <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-none">
                              ✓ En Revisión (${new Intl.NumberFormat("es-CO").format(stagedForFocused.COSTO)})
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded flex-none">
                              Sin vincular
                            </span>
                          )}
                        </div>

                        {/* Supermú Live Search / Filter for this item */}
                        <div className="relative flex-none">
                          <Search className="h-3 w-3 absolute left-2 top-2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar alternativa en Supermú..."
                            value={supermuFilterQuery}
                            onChange={(e) => setSupermuFilterQuery(e.target.value)}
                            className="w-full text-[10px] pl-6 pr-6 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-rose-400"
                          />
                          {supermuFilterQuery && (
                            <button
                              onClick={() => setSupermuFilterQuery("")}
                              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Candidates list or Search results */}
                        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
                          {(() => {
                            let displayProducts = [];
                            if (supermuFilterQuery.trim()) {
                              const qWords = supermuFilterQuery.toLowerCase().split(" ").filter(Boolean);
                              displayProducts = supermuCatalogList
                                .filter((p) => {
                                  const t = (p.title || "").toLowerCase();
                                  return qWords.every((w) => t.includes(w));
                                })
                                .slice(0, 10)
                                .map((p) => ({ product: p, score: 100 }));
                            } else {
                              displayProducts = candidates;
                            }

                            if (displayProducts.length === 0) {
                              return (
                                <div className="text-center py-6 text-slate-400 text-[11px]">
                                  <p>No se encontraron coincidencias automáticas.</p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Escribe en el buscador de arriba para encontrar el producto en Supermú.
                                  </p>
                                </div>
                              );
                            }

                            return displayProducts.map(({ product: cand, score }) => {
                              const isMatchedWithThis = stagedForFocused?._matchedSupermu?.id === cand.id;
                              const diff = cand.price - (Number(focused.COSTO) || 0);
                              const pctDiff = (Number(focused.COSTO) || 0) > 0 ? ((diff / (Number(focused.COSTO) || 0)) * 100).toFixed(1) : 0;

                              return (
                                <div
                                  key={cand.id || cand.sku}
                                  className={`p-1.5 rounded border transition-all text-xs flex gap-2 items-center ${
                                    isMatchedWithThis
                                      ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200"
                                      : "bg-white hover:bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  {cand.image && (
                                    <img
                                      src={cand.image}
                                      alt=""
                                      className="w-10 h-10 rounded object-cover border border-slate-200 flex-none"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-slate-800 truncate text-[11px]" title={cand.title}>
                                        {cand.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                      <span className="font-bold text-rose-700 font-mono">
                                        ${new Intl.NumberFormat("es-CO").format(cand.price)}
                                      </span>
                                      {cand.grams ? <span>• {cand.grams}g</span> : null}
                                      {score ? (
                                        <span className={`text-[8px] px-1 rounded font-bold ${score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {score}% match
                                        </span>
                                      ) : null}
                                    </div>
                                    {diff !== 0 && (
                                      <span className={`text-[9px] font-mono ${diff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {diff > 0 ? `+${pctDiff}%` : `${pctDiff}%`} (${new Intl.NumberFormat("es-CO").format(diff)})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1 flex-none items-end">
                                    <button
                                      type="button"
                                      onClick={() => handleApplySupermuToItem(focused, cand)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                                        isMatchedWithThis
                                          ? "bg-emerald-600 text-white"
                                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                                      }`}
                                    >
                                      <Check className="h-3 w-3" />
                                      <span>{isMatchedWithThis ? "Aplicado" : "Vincular"}</span>
                                    </button>
                                    {cand.url && (
                                      <a
                                        href={cand.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 underline"
                                      >
                                        <span>Ver</span>
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* No items selected state */
                <div className="flex-1 flex flex-col items-center justify-center p-3 text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Catálogo Único de Referencia Activo</h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
                      Selecciona productos a la izquierda o sincroniza directamente todo el grupo actual con los 2.661 productos de Supermú.
                    </p>
                  </div>

                  <div className="w-full space-y-1.5 max-w-[240px]">
                    <Button
                      onClick={() => {
                        const toMatch = filteredSearchItems.length > 0 ? filteredSearchItems : Items;
                        setSelectedItems(toMatch);
                        handleAutoMatchWithSupermu(toMatch);
                      }}
                      disabled={isAutoMatchingSupermu || filteredSearchItems.length === 0}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-8 shadow-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Cruzar Grupo {selectedGroup === 'TODOS' ? 'Completo' : selectedGroup} ({filteredSearchItems.length})
                    </Button>

                    <Button
                      onClick={() => setShowSupermuMacroModal(true)}
                      variant="outline"
                      className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold h-8"
                    >
                      <SlidersHorizontal className="h-3 w-3 mr-1" />
                      Macro Match Todo el Almacén
                    </Button>
                  </div>

                  {/* Live Search Supermú Directly */}
                  <div className="w-full border-t pt-2 flex flex-col min-h-0 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Buscador Rápido Supermú (2.6k)
                    </label>
                    <div className="relative">
                      <Search className="h-3 w-3 absolute left-2 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Consultar precio de referencia (ej: carne, leche, queso)..."
                        value={supermuFilterQuery}
                        onChange={(e) => setSupermuFilterQuery(e.target.value)}
                        className="w-full text-[10px] pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    {supermuFilterQuery.trim() && (
                      <div className="max-h-[140px] overflow-y-auto space-y-1 mt-1 p-1 bg-white border rounded custom-scrollbar">
                        {supermuCatalogList
                          .filter((p) => {
                            const words = supermuFilterQuery.toLowerCase().split(" ").filter(Boolean);
                            const title = (p.title || "").toLowerCase();
                            return words.every((w) => title.includes(w));
                          })
                          .slice(0, 5)
                          .map((p) => (
                            <div key={p.id} className="text-[10px] p-1 border-b last:border-b-0 flex justify-between items-center">
                              <span className="truncate flex-1 font-medium text-slate-700" title={p.title}>{p.title}</span>
                              <span className="font-bold text-rose-600 font-mono ml-2">
                                ${new Intl.NumberFormat("es-CO").format(p.price)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= LEGACY PROMPT & JSON MODE ================= */
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopyPrompt}
                  variant="outline"
                  className="flex-1 justify-between items-center border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs h-8"
                >
                  <span>Generar Prompt IA</span>
                  <Zap className="h-3 w-3" />
                </Button>

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
                  <div className="flex items-center gap-1" onMouseEnter={() => setHelpText("Catálogo Supermú como ÚNICA FUENTE de verdad")} onMouseLeave={() => setHelpText("")}>
                    <div onClick={() => setSupermuOnlySource(!supermuOnlySource)} className={`cursor-pointer h-8 px-1.5 flex items-center justify-center rounded border transition-colors gap-1 ${supermuOnlySource ? 'bg-rose-100 border-rose-300 text-rose-700 font-bold' : 'bg-white border-blue-200 text-slate-300 hover:border-rose-200 hover:text-rose-500'}`} title="Usar Catálogo Supermú como ÚNICA fuente en el prompt">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {supermuOnlySource && <span className="text-[9px] font-extrabold uppercase">Única Fuente</span>}
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
                      {item._matchedSupermu && (
                        <div className="bg-rose-50/70 border border-rose-200/70 rounded px-1.5 py-1 mb-1.5 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item._matchedSupermu.image && (
                              <img src={item._matchedSupermu.image} alt="" className="w-5 h-5 rounded object-cover border border-rose-200 flex-none" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-rose-900 truncate" title={item._matchedSupermu.title}>
                                🏢 Ref Supermú: {item._matchedSupermu.title}
                              </span>
                              <span className="text-[9px] text-rose-700 font-mono">
                                ${new Intl.NumberFormat("es-CO").format(item._matchedSupermu.price || 0)} {item._matchedSupermu.grams ? `• ${item._matchedSupermu.grams}g` : ""}
                              </span>
                            </div>
                          </div>
                          {item._matchedSupermu.url && (
                            <a href={item._matchedSupermu.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-rose-600 hover:text-rose-800 underline flex items-center gap-0.5 flex-none ml-1">
                              <span>Ver</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      )}
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
      {showSupermuMacroModal && (
        <SupermuMacroModal
          isOpen={showSupermuMacroModal}
          onClose={() => setShowSupermuMacroModal(false)}
          inventoryItems={Items}
          onSendToStaging={(newStaged) => {
            setStagedItems((prev) => {
              const existingIds = new Set(prev.map((p) => p._id));
              const added = newStaged.filter((n) => !existingIds.has(n._id));
              return [...prev, ...added];
            });
            setShowSupermuMacroModal(false);
          }}
        />
      )}
    </PageLayout>
  );
}

export default GestionAlmacen;
