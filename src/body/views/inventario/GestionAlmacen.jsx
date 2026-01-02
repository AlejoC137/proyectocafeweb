import React, { useEffect, useState } from "react";
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
import { UtensilsCrossed, Package, ChefHat, Settings, Zap, Filter, CheckSquare, Square, Save, Search, X, Trash2, Plus, SlidersHorizontal, RefreshCcw, Eye, EyeOff } from "lucide-react";
import { generateInventoryUpdatePrompt } from "../../../utils/inventoryUpdatePrompt";
import { compareAndGenerateHistory } from "../../../utils/historyUtils";

function GestionAlmacen() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(ItemsAlmacen);
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
      setCurrentType(type);
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
    // 1. Update the local macro input state
    setActiveMacroFields(prev => prev.map(f => f.key === key ? { ...f, value: val } : f));

    // 2. Apply this value to ALL staged items imediatelly (if field is enabled)
    //    Logic: If you type in macro, it updates everyone.
    setStagedItems(prev => prev.map(item => {
      // Only update if the item actually has this field or we want to force it?
      // Let's assume we update the changes.

      // Clone item
      const newItem = { ...item, [key]: val };

      // SYNC HISTORY (reusing logic from handleUpdateStagedItem but simpler)
      if (newItem.historial_update && newItem._latestHistoryIndex >= 0) {
        const historyCopy = [...newItem.historial_update];
        try {
          const lastEntry = JSON.parse(historyCopy[newItem._latestHistoryIndex]);
          if (!lastEntry.cambios) lastEntry.cambios = {};

          if (lastEntry.cambios[key]) {
            lastEntry.cambios[key].nuevo = val;
          } else {
            lastEntry.cambios[key] = {
              anterior: item._original ? item._original[key] : "",
              nuevo: val
            };
          }
          historyCopy[newItem._latestHistoryIndex] = JSON.stringify(lastEntry);
          newItem.historial_update = historyCopy;
        } catch (e) { console.error("Error syncing history macro", e); }
      }
      return newItem;
    }));
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
      const updates = JSON.parse(jsonText);
      if (!Array.isArray(updates)) {
        alert("El JSON debe ser un array de objetos");
        return;
      }

      const newStagedItems = updates.map(update => {
        const original = selectedItems.find(i => i._id === update._id);
        if (!original) return null; // Skip if not in selected
        return {
          ...original, // Keep original props
          ...update,   // Overwrite with updates
          __original: original, // Store ref to original for diffing
          _isStaged: true, // Marker
          _includedFields: Object.keys(update).filter(k => k !== "_id" && k !== "COSTO") // Default included fields (COSTO excluded by default per logic if needed, but usually we include everything provided)
        };
      }).filter(Boolean);

      setStagedItems(newStagedItems);
      // alert(`Procesados ${newStagedItems.length} items.`);
    } catch (e) {
      alert("Error al parsear JSON: " + e.message);
    }
  };

  const handleRemoveStagedItem = (itemId) => {
    setStagedItems(prev => prev.filter(i => i._id !== itemId));
  };
  const handleUpdateStagedItem = (itemId, field, newValue) => {
    setStagedItems(prev => prev.map(item => {
      if (item._id === itemId && item._isUpdated) {
        // Deep copy to avoid mutation
        const newItem = { ...item, [field]: newValue };

        // SYNC HISTORY: We need to update the 'nuevo' value in the last history entry
        if (newItem.historial_update && newItem._latestHistoryIndex >= 0) {
          const historyCopy = [...newItem.historial_update];
          const lastEntryStr = historyCopy[newItem._latestHistoryIndex];
          try {
            const lastEntry = JSON.parse(lastEntryStr);
            // Verify if this field exists in changes, if not add it, if yes update it
            if (!lastEntry.cambios) lastEntry.cambios = {};

            if (lastEntry.cambios[field]) {
              lastEntry.cambios[field].nuevo = newValue;
            } else {
              // If it wasn't originally changed but now user edits it, add it
              // We need the original value. access from _original
              lastEntry.cambios[field] = {
                anterior: item._original[field],
                nuevo: newValue
              };
            }
            historyCopy[newItem._latestHistoryIndex] = JSON.stringify(lastEntry);
            newItem.historial_update = historyCopy;
          } catch (e) {
            console.error("Error syncing history on edit", e);
          }
        }
        return newItem;
      }
      return item;
    }));
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
    // FIX: Use stagedItems instead of selectedItems, as stagedItems contains the updates.
    const itemsToUpdate = stagedItems.filter(i => i._isUpdated);

    if (itemsToUpdate.length === 0) return alert("No hay cambios pendientes para guardar.");

    setIsSaving(true);
    try {
      const promises = itemsToUpdate.map(async (item) => {
        // 1. Start with the staged item properties
        const payload = { ...item };

        // 2. Revert properties that were excluded by the user
        const excludedFields = item._excludedFields || [];
        excludedFields.forEach(field => {
          // Reset payload value to original value
          payload[field] = item._original[field];

          // Also need to clean this from history!
          // This is tricky because history is a JSON string in payload.historial_update array.
          // We need to edit the LAST entry of historial_update to remove this field.
        });

        // 2.5 Fix History for excluded fields
        if (excludedFields.length > 0 && Array.isArray(payload.historial_update)) {
          const lastIdx = payload.historial_update.length - 1;
          if (lastIdx >= 0) {
            try {
              const lastEntry = JSON.parse(payload.historial_update[lastIdx]);

              // Filter out excluded fields from 'cambios'
              const newCambios = {};
              Object.keys(lastEntry.cambios || {}).forEach(key => {
                if (!excludedFields.includes(key)) {
                  newCambios[key] = lastEntry.cambios[key];
                }
              });

              lastEntry.cambios = newCambios;

              // If changes become empty, maybe we shouldn't add the history entry at all?
              // For now, keep it even if empty or handle logic elsewhere.
              if (Object.keys(newCambios).length === 0) {
                // Remove this history entry entirely
                payload.historial_update.pop();
              } else {
                payload.historial_update[lastIdx] = JSON.stringify(lastEntry);
              }
            } catch (e) { console.error("Error fixing history for excluded fields", e); }
          }
        }

        // 3. Cleanup internal flags
        delete payload._isUpdated;
        delete payload._original;
        delete payload._excludedFields;
        delete payload._latestHistoryIndex;

        // Ensure numbers are numbers
        if (payload.COSTO) payload.COSTO = Number(payload.COSTO);
        if (payload.CANTIDAD) payload.CANTIDAD = Number(payload.CANTIDAD);
        if (payload.precioUnitario) payload.precioUnitario = Number(payload.precioUnitario);

        return dispatch(updateItem(item._id, payload, currentType));
      });

      await Promise.all(promises);
      alert("Inventario actualizado correctamente.");
      setSelectedItems([]);
      setStagedItems([]);
      setJsonText("");
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

  return (
    <PageLayout loading={loading} >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[calc(100vh-140px)] text-xs">
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
                      <span className="font-semibold text-slate-600">${new Intl.NumberFormat("es-CO").format(item.COSTO || 0)}</span>
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
                        <span className="font-bold text-slate-700 truncate flex-1" title={item.Nombre_del_producto}>
                          {item.Nombre_del_producto}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-1 rounded flex items-center gap-0.5">
                            <X className="h-3 w-3" /> MODIFICADO
                          </span>
                          <button
                            onClick={() => handleRemoveStagedItem(item._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                            title="Descartar este item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        {isUpdated && (
                          <div className="flex flex-col gap-1 mt-1">
                            {changes.map((change) => {
                              const isExcluded = item._excludedFields?.includes(change.campo);

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
                                        className={`flex-1 min-w-0 text-[10px] border-b focus:outline-none bg-transparent font-mono font-bold text-right px-0.5 ${isExcluded ? 'text-slate-400 border-slate-300' : 'text-blue-700 border-blue-300 focus:border-blue-500'}`}
                                        value={change.valor_final}
                                        onChange={(e) => handleUpdateStagedItem(item._id, change.campo, e.target.value)}
                                        disabled={isExcluded}
                                      />
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
      </div >
    </PageLayout >
  );
}

export default GestionAlmacen;
