import React, { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Package, 
  DollarSign, 
  PieChart, 
  Info, 
  Zap, 
  Loader2, 
  Database, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Printer,
  ExternalLink,
  Lock
} from "lucide-react";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import { 
  ITEMS, 
  MENU, 
  PRODUCCION, 
  RECETAS_MENU, 
  RECETAS_PRODUCCION,
  VENTAS,
  Comanda
} from "../../../redux/actions-types";
import { 
  getAllFromTable, 
  createRecipeForProduct 
} from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";

// Sub-components & Data
import { 
  DEFAULT_INGREDIENTS, 
  TARGET_RANGES, 
  PRESET_RECIPES 
} from "./CalculadorRecetaHelados/dubovikData";
import SearchableSelect from "./CalculadorRecetaHelados/SearchableSelect";
import DubovikGlosario from "./CalculadorRecetaHelados/DubovikGlosario";
import FormuladorDashboard from "./CalculadorRecetaHelados/FormuladorDashboard";
import NewIngredientModal from "./CalculadorRecetaHelados/NewIngredientModal";
import ImportadorHeladoModal from "./CalculadorRecetaHelados/ImportadorHeladoModal";
import ModeloFinancieroProyecciones from "./CalculadorRecetaHelados/ModeloFinancieroProyecciones";
import VentasHeladosTab from "./CalculadorRecetaHelados/VentasHeladosTab";
import MenuPrint from "../../components/Menu/MenuPrint";
import MenuPrintHorizontal from "../../components/Menu/MenuPrintHorizontal";

export default function CalculadorRecetaHelados() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state selectors for Supabase tables
  const allItems = useSelector((state) => state.allItems || []);
  const allMenu = useSelector((state) => state.allMenu || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion || []);
  const allVentas = useSelector((state) => state.allVentas || []);
  const allComanda = useSelector((state) => state.allComanda || []);

  // Loading state for Supabase sync
  const [loadingData, setLoadingData] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // PIN Protection State (2400 from .env or fallback)
  const HELADOS_PIN = import.meta.env.VITE_HELADOS_PIN || "2400";
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(() => {
    return sessionStorage.getItem("helados_pin_authenticated") === "true";
  });
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === HELADOS_PIN) {
      sessionStorage.setItem("helados_pin_authenticated", "true");
      setIsPinAuthenticated(true);
      setPinError("");
      setPinInput("");
    } else {
      setPinError("PIN incorrecto. Intente nuevamente.");
      setPinInput("");
    }
  };

  // Form State
  const [nombreReceta, setNombreReceta] = useState("Mi Formulación Helado");
  const [tipoHelado, setTipoHelado] = useState("SOFT"); // GELATO, SOFT, SORBETE
  const [activeTab, setActiveTab] = useState("formulador"); // 'formulador' | 'costeo'
  const [showAccionesRapidas, setShowAccionesRapidas] = useState(false);
  const [selectedProductTarget, setSelectedProductTarget] = useState(""); // Menu or Produccion ID to link

  // Ingredients catalog state
  const [ingredientesDB, setIngredientesDB] = useState(DEFAULT_INGREDIENTS);
  const [newIngModal, setNewIngModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [tempIng, setTempIng] = useState({ nombre: "", grasa: 0, solidos: 0, pod: 0, pac: 0 });

  // Custom User-Imported Recipes State (Persisted in localStorage)
  const [customRecipes, setCustomRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem("dubovik_custom_recipes");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Notification Banner State
  const [notification, setNotification] = useState(null);

  // MenuPrint Link State (Persisted in localStorage)
  const [selectedMenuPrintId, setSelectedMenuPrintId] = useState(() => {
    try {
      const saved = localStorage.getItem("dubovik_selected_menu_print_id");
      return saved ? Number(saved) : 3;
    } catch (e) {
      return 3;
    }
  });
  const [filterOnlyHeladosInMenu, setFilterOnlyHeladosInMenu] = useState(true);
  const [availablePrintMenus, setAvailablePrintMenus] = useState([
    { id: 3, name: "Menú Helados Dovici (ID: 3)" },
    { id: 1, name: "Menú Vertical Principal (ID: 1)" },
    { id: 2, name: "Menú Horizontal Principal (ID: 2)" }
  ]);

  const handleSelectMenuPrint = (idStr) => {
    const newId = Number(idStr);
    setSelectedMenuPrintId(newId);
    try {
      localStorage.setItem("dubovik_selected_menu_print_id", newId);
    } catch (e) {}
  };

  // Combined Presets (Base Dubovik + Custom User Imported)
  const allPresets = useMemo(() => {
    return { ...PRESET_RECIPES, ...customRecipes };
  }, [customRecipes]);

  // Current Recipe Lines State
  const [recetaLines, setRecetaLines] = useState(PRESET_RECIPES.chocolate_soft.items);

  // Load database items on mount
  useEffect(() => {
    const loadSupabaseTables = async () => {
      setLoadingData(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(RECETAS_PRODUCCION)),
          dispatch(getAllFromTable(VENTAS)),
          dispatch(getAllFromTable(Comanda)),
        ]);
      } catch (err) {
        console.error("Error al cargar datos de Supabase:", err);
      } finally {
        setLoadingData(false);
      }
    };
    
    const loadPrintMenusList = async () => {
      try {
        const { data, error } = await supabase
          .from("menu_print_config")
          .select("*")
          .order("id", { ascending: true });

        if (!error && data && data.length > 0) {
          const list = data.map((m) => {
            let name = m.group_descriptions?.__layout?.name;
            let type = m.group_descriptions?.__layout?.type || (m.id === 2 || m.id === 3 ? "horizontal" : "vertical");
            if (!name) {
              if (m.id === 1) name = "Menú Vertical Principal";
              else if (m.id === 2) name = "Menú Horizontal Principal";
              else if (m.id === 3) name = "Menú Helados Dovici";
              else name = `Menú Config #${m.id}`;
            }
            return { id: m.id, name: `${name} (ID: ${m.id})`, type };
          });

          if (!list.some(m => m.id === 1)) list.push({ id: 1, name: "Menú Vertical Principal (ID: 1)", type: "vertical" });
          if (!list.some(m => m.id === 2)) list.push({ id: 2, name: "Menú Horizontal Principal (ID: 2)", type: "horizontal" });
          if (!list.some(m => m.id === 3)) list.push({ id: 3, name: "Menú Helados Dovici (ID: 3)", type: "horizontal" });
          list.sort((a, b) => a.id - b.id);

          setAvailablePrintMenus(list);
        }
      } catch (err) {
        console.error("Error al cargar lista de menu_print_config:", err);
      }
    };

    loadSupabaseTables();
    loadPrintMenusList();
  }, [dispatch]);

  // Combined ingredients list (Base Dubovik + ItemsAlmacen from Supabase)
  const combinedIngredientsCatalog = useMemo(() => {
    const supabaseCatalogItems = allItems.map((item) => ({
      id: `inv_${item._id}`,
      inventarioItemId: item._id,
      nombre: `🛒 ${item.Nombre_del_producto || item.nombre}`,
      grasa: parseFloat(item.Grasa) || 0,
      solidos: parseFloat(item.Solidos) || 0,
      pod: parseFloat(item.POD) || 0,
      pac: parseFloat(item.PAC) || 0,
      unidad: item.Unidad_de_medida || "g",
      costoUnitario: parseFloat(item.Precio || item.Precio_Unitario || item.COSTO) || 0
    }));

    return [...ingredientesDB, ...supabaseCatalogItems];
  }, [ingredientesDB, allItems]);

  // Searchable Select Options for Ingredients
  const ingredientSelectOptions = useMemo(() => {
    return [
      {
        group: "🧪 Ingredientes Base Dubovik",
        options: ingredientesDB.map((ing) => ({
          value: ing.id,
          label: `🧪 ${ing.nombre}`
        }))
      },
      ...(allItems.length > 0 ? [{
        group: "🛒 Insumos Almacén Supabase",
        options: allItems.map((item) => ({
          value: `inv_${item._id}`,
          label: `🛒 ${item.Nombre_del_producto || item.nombre} ($${item.Precio || item.Precio_Unitario || item.COSTO || 0})`
        }))
      }] : [])
    ];
  }, [ingredientesDB, allItems]);

  // Searchable Select Options for Inventory Items (Costing tab)
  const inventorySelectOptions = useMemo(() => {
    return [
      { value: "", label: "-- Sin vincular a almacén --" },
      ...allItems.map((item) => ({
        value: item._id,
        label: `🛒 ${item.Nombre_del_producto || item.nombre} ($${item.Precio || item.Precio_Unitario || item.COSTO || 0})`
      }))
    ];
  }, [allItems]);

  // Searchable Select Options for Target Products (Save Recipe)
  const targetProductSelectOptions = useMemo(() => {
    return [
      {
        group: "🗺️ Productos de Menú (Tabla: Menu)",
        options: allMenu.map((m) => ({
          value: `menu_${m._id}`,
          label: `🗺️ ${m.NombreES || m.nombre}`
        }))
      },
      {
        group: "🥘 Productos de Producción (Tabla: ProduccionInterna)",
        options: allProduccion.map((p) => ({
          value: `prod_${p._id}`,
          label: `🥘 ${p.Nombre_del_producto || p.nombre}`
        }))
      }
    ];
  }, [allMenu, allProduccion]);

  // Quick preset loader
  const loadPreset = (presetKey) => {
    const preset = allPresets[presetKey];
    if (preset) {
      setNombreReceta(preset.nombre);
      setTipoHelado(preset.tipo);
      setRecetaLines(preset.items);
      setNotification({
        type: "success",
        message: `✨ Receta "${preset.nombre}" (${preset.tipo}) cargada al balanceador.`
      });
    }
  };

  const handleImportRecipe = (imported) => {
    if (imported && imported.items) {
      const customKey = `custom_${Date.now()}`;
      const newRecipeObj = {
        nombre: imported.nombre || "Nuevo Helado Importado",
        tipo: imported.tipo || "GELATO",
        items: imported.items,
        isCustom: true
      };

      // 1. Cargar directamente en la tabla y balanceador activo
      setNombreReceta(newRecipeObj.nombre);
      setTipoHelado(newRecipeObj.tipo);
      setRecetaLines(newRecipeObj.items);
      setActiveTab("formulador");

      // 2. Guardar en Accesos Rápidos (State + LocalStorage)
      const updatedCustoms = { ...customRecipes, [customKey]: newRecipeObj };
      setCustomRecipes(updatedCustoms);
      try {
        localStorage.setItem("dubovik_custom_recipes", JSON.stringify(updatedCustoms));
      } catch (err) {
        console.error("Error guardando en localStorage:", err);
      }

      // 3. Notificación de éxito al usuario
      setNotification({
        type: "success",
        message: `🎉 ¡Receta "${newRecipeObj.nombre}" importada con éxito! Se cargó en la tabla de 1000g y se guardó en tus botones de accesos rápidos.`
      });
    }
  };

  const handleDeleteCustomRecipe = (e, key, name) => {
    e.stopPropagation();
    if (window.confirm(`¿Deseas eliminar el acceso rápido de "${name}"?`)) {
      const updated = { ...customRecipes };
      delete updated[key];
      setCustomRecipes(updated);
      try {
        localStorage.setItem("dubovik_custom_recipes", JSON.stringify(updated));
      } catch (err) {
        console.error("Error eliminando en localStorage:", err);
      }
    }
  };

  // Recipe Line Handlers
  const addLine = () => {
    setRecetaLines([
      ...recetaLines,
      { ingId: combinedIngredientsCatalog[0]?.id || "leche_entera", cantidad: 100, inventarioItemId: "" }
    ]);
  };

  const updateLine = (index, field, value) => {
    const updated = [...recetaLines];
    if (field === "ingId") {
      updated[index].ingId = value;
      if (value.startsWith("inv_")) {
        const invId = value.replace("inv_", "");
        updated[index].inventarioItemId = invId;
      }
    } else {
      updated[index][field] = field === "cantidad" ? parseFloat(value) || 0 : value;
    }
    setRecetaLines(updated);
  };

  const removeLine = (index) => {
    setRecetaLines(recetaLines.filter((_, i) => i !== index));
  };

  // Add custom ingredient to local catalog
  const handleCreateCustomIngredient = (e) => {
    e.preventDefault();
    if (!tempIng.nombre) return;
    const newId = `custom_${Date.now()}`;
    const newEntry = {
      id: newId,
      nombre: tempIng.nombre,
      grasa: parseFloat(tempIng.grasa) || 0,
      solidos: parseFloat(tempIng.solidos) || 0,
      pod: parseFloat(tempIng.pod) || 0,
      pac: parseFloat(tempIng.pac) || 0,
      unidad: "g"
    };
    setIngredientesDB([...ingredientesDB, newEntry]);
    setTempIng({ nombre: "", grasa: 0, solidos: 0, pod: 0, pac: 0 });
    setNewIngModal(false);
  };

  // --- DUBOVIK MATHEMATICAL CALCULATIONS ---
  const calculations = useMemo(() => {
    let pesoTotal = 0;
    let grasaGramos = 0;
    let solidosGramos = 0;
    let podContribucionTotal = 0;
    let pacContribucionTotal = 0;
    let costoTotalLote = 0;

    const linesDetail = recetaLines.map((line) => {
      const ing = combinedIngredientsCatalog.find((item) => item.id === line.ingId) || {
        nombre: "Desconocido",
        grasa: 0,
        solidos: 0,
        pod: 0,
        pac: 0,
      };

      const cant = line.cantidad || 0;
      pesoTotal += cant;

      const grasa = (cant * ing.grasa) / 100;
      const solidos = (cant * ing.solidos) / 100;
      const podContrib = (cant * ing.pod) / 100;
      const pacContrib = (cant * ing.pac) / 100;

      grasaGramos += grasa;
      solidosGramos += solidos;
      podContribucionTotal += podContrib;
      pacContribucionTotal += pacContrib;

      // Cost calculation from matching inventory item in Supabase
      let itemCostoKg = ing.costoUnitario || 0;
      const targetInvId = line.inventarioItemId || ing.inventarioItemId;
      
      if (targetInvId) {
        const invItem = allItems.find((i) => i._id === targetInvId);
        if (invItem) {
          itemCostoKg = parseFloat(invItem.Precio || invItem.Precio_Unitario || invItem.COSTO) || 0;
        }
      }

      const lineCost = (cant / 1000) * itemCostoKg;
      costoTotalLote += lineCost;

      return {
        ...line,
        ingNombre: ing.nombre,
        grasa,
        solidos,
        podContrib,
        pacContrib,
        itemCostoKg,
        lineCost,
      };
    });

    const grasaPct = pesoTotal > 0 ? (grasaGramos / pesoTotal) * 100 : 0;
    const solidosPct = pesoTotal > 0 ? (solidosGramos / pesoTotal) * 100 : 0;
    const aguaPct = pesoTotal > 0 ? 100 - solidosPct : 0;
    const pod = pesoTotal > 0 ? podContribucionTotal / (pesoTotal / 100) : 0;
    const pac = pesoTotal > 0 ? pacContribucionTotal / (pesoTotal / 100) : 0;

    // Service Temp Calculation exact Dubovik formula
    const tempServicio = tipoHelado === "SORBETE" ? pac / -2.5 : pac / -2;
    const costoPorKg = pesoTotal > 0 ? (costoTotalLote / (pesoTotal / 1000)) : 0;

    return {
      pesoTotal,
      grasaGramos,
      grasaPct,
      solidosGramos,
      solidosPct,
      aguaPct,
      pod,
      pac,
      tempServicio,
      costoTotalLote,
      costoPorKg,
      linesDetail,
    };
  }, [recetaLines, combinedIngredientsCatalog, tipoHelado, allItems]);

  const targets = TARGET_RANGES[tipoHelado];

  // --- SAVE & LINK TO SUPABASE PRODUCT ---
  const handleSaveRecipeToSupabase = async () => {
    if (!selectedProductTarget) {
      alert("Por favor seleccione un producto del Menú (🗺️) o Producción (🥘) de la lista.");
      return;
    }

    const [typePrefix, targetId] = selectedProductTarget.split("_");
    const isMenu = typePrefix === "menu";
    const productTable = isMenu ? MENU : PRODUCCION;
    const recipeTable = isMenu ? RECETAS_MENU : RECETAS_PRODUCCION;

    const targetProductList = isMenu ? allMenu : allProduccion;
    const targetProduct = targetProductList.find((p) => p._id === targetId);

    if (targetProduct && targetProduct.Receta) {
      const productName = targetProduct.NombreES || targetProduct.Nombre_del_producto || targetProduct.nombre || "Seleccionado";
      const confirmOverwrite = window.confirm(
        `⚠️ CONFIRMACIÓN REQUERIDA:\n\nEl producto "${productName}" ya tiene una receta vinculada en Supabase (ID: ${targetProduct.Receta}).\n\n¿Estás seguro de que deseas reemplazar la receta existente por esta nueva formulación balanceada de Dubovik?`
      );
      if (!confirmOverwrite) return;
    }

    setSavingRecipe(true);
    try {
      const baseRecipeData = {
        legacyName: nombreReceta,
        nombre: nombreReceta,
        detalles: calculations.linesDetail.map((line) => ({
          nombre: line.ingNombre,
          cantidad: line.cantidad,
          ingId: line.ingId,
          inventarioItemId: line.inventarioItemId || null,
          grasa: line.grasa,
          solidos: line.solidos,
          podContrib: line.podContrib,
          pacContrib: line.pacContrib,
          itemCostoKg: line.itemCostoKg,
          lineCost: line.lineCost
        })),
        balance: {
          grasaPct: calculations.grasaPct,
          solidosPct: calculations.solidosPct,
          aguaPct: calculations.aguaPct,
          pod: calculations.pod,
          pac: calculations.pac,
          tempServicio: calculations.tempServicio,
          tipoHelado: tipoHelado
        },
        costo: { COSTO: calculations.costoTotalLote, COSTO_KG: calculations.costoPorKg },
        pesoTotal: calculations.pesoTotal,
      };

      await dispatch(createRecipeForProduct(baseRecipeData, targetId, productTable, recipeTable));
    } catch (err) {
      console.error("Error al mandar receta a Supabase:", err);
      alert("Error al mandar la receta a Supabase.");
    } finally {
      setSavingRecipe(false);
    }
  };

  if (!isPinAuthenticated) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-4 font-SpaceGrotesk">
        <div className="w-full max-w-md bg-cream-bg border-2 border-black p-6 md:p-8 shadow-solid space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-terracotta-accent text-white border-2 border-black shadow-solid mb-2">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Acceso Protegido por PIN</h2>
            <p className="text-xs md:text-sm text-gray-600">
              Formulador & Balanceador de Helados (Dubovik)
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                PIN de Autorización
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                placeholder="Ingrese PIN"
                className="w-full p-3 text-center text-xl font-bold tracking-widest bg-white border-2 border-black focus:outline-none focus:ring-2 focus:ring-terracotta-accent shadow-sm"
                autoFocus
              />
            </div>

            {pinError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-bold text-center">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-terracotta-accent hover:bg-terracotta-accent/90 text-white font-bold text-sm border-2 border-black shadow-solid transition-all active:translate-y-0.5"
            >
              Ingresar al Formulador
            </button>

            <button
              type="button"
              onClick={() => navigate("/MenuView")}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border-2 border-black shadow-sm transition-all"
            >
              Volver al Menú Principal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-3 md:p-6 space-y-6 font-SpaceGrotesk">
      
      {/* HEADER BAR */}
      <div className="bg-cream-bg border-2 border-black p-4 md:p-6 shadow-solid flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-terracotta-accent text-white border-2 border-black shadow-solid">
            <Calculator className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              Formulador & Balanceador de Helados
              <span className="text-xs px-2 py-0.5 bg-yellow-300 text-black border border-black font-semibold rounded-none flex items-center gap-1">
                <Database className="h-3 w-3" /> Dubovik Formulator
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-600">
              Formulación física de Soft, Gelato y Sorbete con envío directo a productos de Menú y Producción.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {loadingData && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-400 font-bold flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Cargando Supabase...
            </span>
          )}


          <button
            onClick={() => setShowAccionesRapidas(!showAccionesRapidas)}
            className="px-3 py-1.5 bg-cobalt-blue text-white text-xs font-bold border-2 border-black shadow-solid hover:bg-blue-700 transition-all flex items-center gap-1"
          >
            <Zap className="h-3.5 w-3.5" />
            {showAccionesRapidas ? "Ocultar Acciones Rápidas" : "Acciones Rápidas"}
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem("helados_pin_authenticated");
              setIsPinAuthenticated(false);
            }}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold border-2 border-black shadow-solid transition-all flex items-center gap-1"
            title="Bloquear acceso con PIN"
          >
            <Lock className="h-3.5 w-3.5" />
            Bloquear PIN
          </button>
        </div>
      </div>

      {/* NOTIFICATION SUCCESS BANNER */}
      {notification && (
        <div className="bg-emerald-100 border-2 border-black p-3 shadow-solid flex items-center justify-between font-bold text-xs text-emerald-950 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs bg-emerald-200 hover:bg-emerald-300 px-2 py-0.5 border border-black"
          >
            ✕ Cerrar
          </button>
        </div>
      )}

      {/* MANDAR RECETA RED BOOK ACTION BAR */}
      <div className="bg-red-50 border-2 border-black p-4 shadow-solid flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-2.5 bg-red-600 text-white border-2 border-black shadow-sm font-extrabold text-sm flex items-center gap-1">
              📕 <ArrowRight className="h-4 w-4 stroke-[3]" />
            </span>
            <div>
              <label className="block text-xs font-bold text-red-950">
                Seleccionar Producto Destino (Menú o Producción):
              </label>
              <span className="text-[11px] text-red-800">
                Al hacer clic en <strong>Mandar Receta</strong>, se guardará y enlazará esta formulación balanceada a Supabase.
              </span>
            </div>
          </div>

          <div className="flex-1">
            <SearchableSelect
              value={selectedProductTarget}
              onChange={(val) => setSelectedProductTarget(val)}
              options={targetProductSelectOptions}
              placeholder="Buscar y seleccionar Producto 🗺️ Menú o 🥘 Producción..."
            />
          </div>
        </div>

        <button
          disabled={savingRecipe}
          onClick={handleSaveRecipeToSupabase}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs md:text-sm border-2 border-black shadow-solid transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 active:translate-y-0.5"
        >
          {savingRecipe ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Mandando Receta...
            </>
          ) : (
            <>
              📕 Mandar Receta <ArrowRight className="h-4 w-4 stroke-[3]" />
            </>
          )}
        </button>
      </div>

      {/* ICON LEGEND BANNER */}
      <div className="flex flex-wrap items-center justify-between bg-yellow-50 border-2 border-black p-2.5 px-4 shadow-sm text-xs font-bold gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-gray-700 shrink-0" />
          <span className="text-gray-800">Leyenda de Origen:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 bg-white border border-black text-gray-800 flex items-center gap-1">
            🧪 Base Dubovik
          </span>
          <span className="px-2 py-0.5 bg-white border border-black text-gray-800 flex items-center gap-1">
            🛒 Almacén (`ItemsAlmacen`)
          </span>
          <span className="px-2 py-0.5 bg-white border border-black text-gray-800 flex items-center gap-1">
            🗺️ Menú (`Menu`)
          </span>
          <span className="px-2 py-0.5 bg-white border border-black text-gray-800 flex items-center gap-1">
            🥘 Producción (`ProduccionInterna`)
          </span>
        </div>
      </div>

      {/* ACCIONES RAPIDAS DRAWER */}
      {showAccionesRapidas && (
        <div className="border-2 border-black bg-white p-4 shadow-solid transition-all animate-fadeIn">
          <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-cobalt-blue" /> Crear Nuevo Producto de Almacén / Menú en Vivo
            </h3>
            <button 
              onClick={() => setShowAccionesRapidas(false)}
              className="text-xs text-gray-500 hover:text-black font-bold"
            >
              ✕ Cerrar
            </button>
          </div>
          <AccionesRapidas />
        </div>
      )}

      {/* NAVIGATION TABS (ADAPTATIVAS EN ANCHO GRID 6 COLUMNAS - 1 SOLA LÍNEA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 border-b-2 border-black bg-cream-bg w-full">
        <button
          onClick={() => setActiveTab("glosario")}
          className={`px-2 md:px-3 py-3 text-xs md:text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center justify-center gap-1.5 truncate ${
            activeTab === "glosario"
              ? "bg-amber-400 text-black shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="0. Glosario Dubovik"
        >
          <BookOpen className="h-4 w-4 shrink-0 text-amber-950" />
          <span className="truncate">0. Glosario</span>
        </button>
        <button
          onClick={() => setActiveTab("formulador")}
          className={`px-2 md:px-3 py-3 text-xs md:text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center justify-center gap-1.5 truncate ${
            activeTab === "formulador"
              ? "bg-sage-green text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="1. Balanceador Dubovik (% Grasa, Sólidos, POD, PAC)"
        >
          <PieChart className="h-4 w-4 shrink-0" />
          <span className="truncate">1. Balanceador</span>
        </button>
        <button
          onClick={() => setActiveTab("costeo")}
          className={`px-2 md:px-3 py-3 text-xs md:text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center justify-center gap-1.5 truncate ${
            activeTab === "costeo"
              ? "bg-sage-green text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title={`2. Costeo & Vinculación Supabase (${allItems.length} ítems)`}
        >
          <DollarSign className="h-4 w-4 shrink-0" />
          <span className="truncate">2. Costeo</span>
        </button>
        <button
          onClick={() => setActiveTab("proyecciones")}
          className={`px-2 md:px-3 py-3 text-xs md:text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center justify-center gap-1.5 truncate ${
            activeTab === "proyecciones"
              ? "bg-terracotta-accent text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="3. Proyecciones & Modelo Financiero"
        >
          <TrendingUp className="h-4 w-4 shrink-0 text-yellow-300" />
          <span className="truncate">3. Proyecciones</span>
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`px-2 md:px-3 py-3 text-xs md:text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center justify-center gap-1.5 truncate ${
            activeTab === "menu"
              ? "bg-sky-500 text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="4. Menú Helados (Menu Print)"
        >
          <Printer className="h-4 w-4 shrink-0 text-white" />
          <span className="truncate">4. Menú</span>
        </button>
        <button
          onClick={() => setActiveTab("ventas")}
          className={`px-2 md:px-3 py-3 text-xs md:text-sm font-bold border-t-2 border-black transition-colors flex items-center justify-center gap-1.5 truncate ${
            activeTab === "ventas"
              ? "bg-amber-600 text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="5. Control de Ventas & Consumo de Helados"
        >
          <Package className="h-4 w-4 shrink-0 text-white" />
          <span className="truncate">5. Ventas</span>
        </button>
      </div>

      {/* RECIPE CONTROL HEADER (SOLO EN FORMULADOR Y COSTEO) */}
      {(activeTab === "formulador" || activeTab === "costeo") && (
        <div className="bg-white border-2 border-black p-4 shadow-solid flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de la Receta:</label>
              <input
                type="text"
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                className="w-full px-3 py-1.5 border-2 border-black focus:outline-none focus:ring-2 focus:ring-sage-green text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Formulación:</label>
              <select
                value={tipoHelado}
                onChange={(e) => setTipoHelado(e.target.value)}
                className="px-3 py-1.5 border-2 border-black bg-yellow-50 font-bold text-sm focus:outline-none cursor-pointer"
              >
                <option value="SOFT">SOFT (Helado de Máquina)</option>
                <option value="GELATO">GELATO (Artesanal Tradicional)</option>
                <option value="SORBETE">SORBETE (Agua / Fruta)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setNewIngModal(true)}
            className="px-3 py-2 bg-light-leaf text-sage-green border-2 border-black font-bold text-xs shadow-solid hover:bg-sage-green hover:text-white transition-all flex items-center justify-center gap-1 shrink-0"
          >
            <Plus className="h-4 w-4" /> Agregar Ingrediente Personalizado
          </button>
        </div>
      )}

      {/* MAIN TAB CONTENT */}
      {activeTab === "formulador" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLS: TABLE OF INGREDIENTS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-black shadow-solid overflow-hidden">
              <div className="bg-gray-900 text-white p-3 font-bold text-sm flex items-center justify-between">
                <span>Ingredientes & Proporciones (Lote Base 1000g)</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-yellow-300 font-mono">
                  Total Peso: {calculations.pesoTotal.toFixed(1)} g
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black font-bold text-gray-800">
                      <th className="p-2 border-r border-black w-64">Ingrediente (Búsqueda Interactiva)</th>
                      <th className="p-2 border-r border-black w-24">Cantidad (g)</th>
                      <th className="p-2 border-r border-black">Grasa (g)</th>
                      <th className="p-2 border-r border-black">Sólidos (g)</th>
                      <th className="p-2 border-r border-black">POD</th>
                      <th className="p-2 border-r border-black">PAC</th>
                      <th className="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.linesDetail.map((line, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-yellow-50 transition-colors">
                        <td className="p-2 border-r border-gray-300">
                          <SearchableSelect
                            value={line.ingId}
                            onChange={(val) => updateLine(idx, "ingId", val)}
                            options={ingredientSelectOptions}
                            placeholder="Buscar ingrediente..."
                          />
                        </td>

                        <td className="p-2 border-r border-gray-300">
                          <input
                            type="number"
                            step="any"
                            value={line.cantidad}
                            onChange={(e) => updateLine(idx, "cantidad", e.target.value)}
                            className="w-full p-1 border border-black text-right font-bold bg-yellow-100 font-mono"
                          />
                        </td>

                        <td className="p-2 border-r border-gray-300 text-gray-700 font-mono">
                          {line.grasa.toFixed(2)}
                        </td>

                        <td className="p-2 border-r border-gray-300 text-gray-700 font-mono">
                          {line.solidos.toFixed(2)}
                        </td>

                        <td className="p-2 border-r border-gray-300 text-gray-700 font-mono">
                          {line.podContrib.toFixed(2)}
                        </td>

                        <td className="p-2 border-r border-gray-300 text-gray-700 font-mono">
                          {line.pacContrib.toFixed(2)}
                        </td>

                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeLine(idx)}
                            className="p-1 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-600"
                            title="Eliminar ingrediente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-900 text-white font-bold font-mono">
                      <td className="p-2">TOTALES HÍDRICOS Y SÓLIDOS</td>
                      <td className="p-2 text-right text-yellow-300">{calculations.pesoTotal.toFixed(1)} g</td>
                      <td className="p-2">{calculations.grasaGramos.toFixed(1)} g</td>
                      <td className="p-2">{calculations.solidosGramos.toFixed(1)} g</td>
                      <td className="p-2">{(calculations.pod * (calculations.pesoTotal/100)).toFixed(1)}</td>
                      <td className="p-2">{(calculations.pac * (calculations.pesoTotal/100)).toFixed(1)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-3 bg-gray-50 border-t border-black flex justify-between items-center">
                <button
                  onClick={addLine}
                  className="px-3 py-1.5 bg-cobalt-blue text-white font-bold text-xs border-2 border-black shadow-solid hover:bg-blue-700 transition-all flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Agregar Fila de Ingrediente
                </button>
                <span className="text-xs text-gray-500">
                  Tip: Use la leyenda 🧪 🛒 🗺️ 🥘 para identificar el origen de los insumos.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COL: ICE CREAM TOOLS & BALANCE RESULTS */}
          <div className="space-y-4">
            
            {/* SECCIÓN DE HERRAMIENTAS DE HELADERÍA & BOTONES (SIN SELECTOR) */}
            <div className="bg-amber-50 border-2 border-black p-4 shadow-solid space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-800" />
                  🛠️ Herramientas de Heladería & Recetas Base
                </h3>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 border border-black">
                  Dubovik Formulator
                </span>
              </div>

              {/* BOTÓN CON (+) PARA CREAR NUEVO TIPO DE HELADO CON IA */}
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="w-full p-2.5 bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 text-black border-2 border-black font-black text-xs shadow-solid flex items-center justify-center gap-2 transition-all active:translate-y-0.5"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>+ Crear Nuevo Tipo de Helado (Importador IA Dubovik)</span>
              </button>

              {/* BOTONERA DE RECETAS BASE Y PERSONALIZADAS */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  ⚡ Recetas Base & Creadas ({Object.keys(allPresets).length}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                  {Object.entries(allPresets).map(([key, item]) => {
                    const badgeStyle =
                      item.tipo === "SOFT"
                        ? "bg-amber-200 text-amber-900"
                        : item.tipo === "GELATO"
                        ? "bg-blue-200 text-blue-900"
                        : "bg-pink-200 text-pink-900";

                    const isCustom = item.isCustom || key.startsWith("custom_");

                    return (
                      <div key={key} className="relative group">
                        <button
                          type="button"
                          onClick={() => loadPreset(key)}
                          className={`w-full p-2.5 bg-white hover:bg-amber-100 active:bg-amber-200 border-2 border-black text-amber-950 text-xs shadow-solid text-left flex items-center justify-between transition-all font-bold ${
                            isCustom ? "border-l-4 border-l-yellow-500" : ""
                          }`}
                        >
                          <span className="truncate pr-1 group-hover:underline flex items-center gap-1">
                            {isCustom ? "🌟 " : ""}{item.nombre}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 border border-black font-mono font-extrabold shrink-0 ${badgeStyle}`}>
                            {item.tipo}
                          </span>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomRecipe(e, key, item.nombre)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-0.5 border border-black rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar botón personalizado"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* INTERLINEADO SEPARADOR */}
            <div className="my-4 border-b-2 border-dashed border-gray-400"></div>

            {/* RESULTADOS DEL BALANCE DUBOVIK */}
            <FormuladorDashboard 
              calculations={calculations}
              targets={targets}
              tipoHelado={tipoHelado}
            />
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & COSTING */}
      {activeTab === "costeo" && (
        <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-black pb-3 gap-3">
            <div>
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Costeo de Receta en Tiempo Real por Inventario
              </h2>
              <p className="text-xs text-gray-600">
                Vincule cada ingrediente con insumos de 🛒 Almacén (`ItemsAlmacen`).
              </p>
            </div>

            <div className="bg-emerald-100 border-2 border-black p-3 text-right">
              <span className="text-xs font-bold text-emerald-800 block">Costo Estimado Lote ({calculations.pesoTotal.toFixed(0)}g):</span>
              <span className="text-2xl font-black text-emerald-950 font-mono">${calculations.costoTotalLote.toFixed(2)}</span>
              <span className="text-xs text-gray-600 block font-mono">(${calculations.costoPorKg.toFixed(2)} / kg)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black font-bold text-gray-800">
                  <th className="p-2.5 border-r border-black">Ingrediente Formulación</th>
                  <th className="p-2.5 border-r border-black">Gramos ($Q_i$)</th>
                  <th className="p-2.5 border-r border-black w-80">Vínculo Insumo 🛒 Almacén (Búsqueda)</th>
                  <th className="p-2.5 border-r border-black">Costo Ref. / kg</th>
                  <th className="p-2.5">Costo Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {calculations.linesDetail.map((line, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-2.5 font-bold border-r border-gray-300">
                      {line.ingNombre}
                    </td>
                    <td className="p-2.5 border-r border-gray-300 font-semibold font-mono">
                      {line.cantidad} g
                    </td>
                    <td className="p-2.5 border-r border-gray-300">
                      <SearchableSelect
                        value={line.inventarioItemId || ""}
                        onChange={(val) => updateLine(idx, "inventarioItemId", val)}
                        options={inventorySelectOptions}
                        placeholder="Buscar insumo 🛒 Almacén..."
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-300 text-gray-700 font-mono">
                      ${line.itemCostoKg.toFixed(2)}
                    </td>
                    <td className="p-2.5 font-bold text-emerald-700 font-mono">
                      ${line.lineCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VINCULAR Y GUARDAR RECETA EN SUPABASE */}
          <div className="bg-yellow-50 border-2 border-black p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Save className="h-4 w-4 text-cobalt-blue" /> Asignar / Guardar Receta Formulado en Supabase (`Recetas` / `RecetasProduccion`)
            </h3>
            
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedProductTarget}
                  onChange={(val) => setSelectedProductTarget(val)}
                  options={targetProductSelectOptions}
                  placeholder="Buscar Producto 🗺️ Menú o 🥘 Producción..."
                />
              </div>

              <button
                disabled={savingRecipe}
                onClick={handleSaveRecipeToSupabase}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs border-2 border-black shadow-solid transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {savingRecipe ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mandando Receta...
                  </>
                ) : (
                  <>
                    📕 Mandar Receta <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODELO FINANCIERO & PROYECCIONES */}
      {activeTab === "proyecciones" && (
        <ModeloFinancieroProyecciones 
          calculations={calculations}
          nombreReceta={nombreReceta}
          tipoHelado={tipoHelado}
          allPresets={allPresets}
          combinedIngredientsCatalog={combinedIngredientsCatalog}
          allItems={allItems}
          loadPreset={loadPreset}
        />
      )}

      {/* TAB 4: MENÚ PRINT HELADOS DOVICI (VISTA PREVIA & SELECCIÓN DE MENÚ A VINCULAR) */}
      {activeTab === "menu" && (
        <div className="bg-white border-2 border-black shadow-solid p-4 rounded-none space-y-4">
          <div className="bg-sky-950 text-white p-3 px-4 border-2 border-black font-black text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-solid">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="p-1.5 bg-sky-500 text-white border border-black shadow-sm shrink-0">
                <Printer className="h-5 w-5" />
              </div>
              <div className="truncate">
                <span className="block text-sm uppercase tracking-wide font-extrabold text-white truncate">
                  Vista Previa — Menú Print Vinculado
                </span>
                <span className="text-[11px] font-normal text-sky-200 block truncate">
                  Selecciona la plantilla de MenuPrint que deseas vincular y previsualizar.
                </span>
              </div>
            </div>

            {/* SELECTOR DE MENÚ A VINCULAR & ACCIONES EN UN SOLO RENGLÓN */}
            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto">
              <div className="flex items-center gap-1.5 bg-sky-900/90 p-1 px-2.5 border border-sky-600 shrink-0 whitespace-nowrap">
                <label className="text-xs font-bold text-sky-100 shrink-0">Menú Vinculado:</label>
                <select
                  value={selectedMenuPrintId}
                  onChange={(e) => handleSelectMenuPrint(e.target.value)}
                  className="bg-white text-black text-xs font-bold p-1 px-2 border border-black cursor-pointer focus:outline-none max-w-[200px] truncate"
                >
                  {availablePrintMenus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-sky-100 font-semibold cursor-pointer bg-sky-900/90 p-1.5 px-2.5 border border-sky-600 shrink-0 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={filterOnlyHeladosInMenu}
                  onChange={(e) => setFilterOnlyHeladosInMenu(e.target.checked)}
                  className="accent-yellow-400 h-3.5 w-3.5 cursor-pointer"
                />
                Solo Helados
              </label>

              <button
                type="button"
                onClick={() => navigate(`/MenuPrint/${selectedMenuPrintId}`)}
                className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-extrabold text-xs border-2 border-black shadow-solid flex items-center justify-center gap-1.5 transition-all shrink-0 whitespace-nowrap cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                Ir a Editar Menú #{selectedMenuPrintId}
              </button>
            </div>
          </div>

          <div className="border-2 border-black bg-gray-100 p-2 overflow-x-auto min-h-[400px] flex justify-center items-start">
            {(() => {
              const currentMenuObj = availablePrintMenus.find(m => m.id === selectedMenuPrintId);
              const isHorizontal = currentMenuObj?.type === "horizontal" || selectedMenuPrintId === 2 || selectedMenuPrintId === 3;
              if (isHorizontal) {
                return (
                  <div className="w-full">
                    <MenuPrintHorizontal 
                      key={selectedMenuPrintId}
                      menuId={selectedMenuPrintId}
                      controlTopClass="top-0 relative mb-4"
                      containerPaddingClass="pt-2"
                    />
                  </div>
                );
              }
              return (
                <MenuPrint 
                  key={selectedMenuPrintId}
                  menuId={selectedMenuPrintId} 
                  filterOnlyHelados={filterOnlyHeladosInMenu} 
                  previewMode={true} 
                  hideControls={true} 
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 5: VENTAS Y CONSUMO DE HELADO EN OTRAS RECETAS */}
      {activeTab === "ventas" && (
        <VentasHeladosTab 
          allMenu={allMenu}
          allProduccion={allProduccion}
          allItems={allItems}
          allRecetasMenu={allRecetasMenu}
          allRecetasProduccion={allRecetasProduccion}
          allVentas={allVentas}
          allComanda={allComanda}
        />
      )}

      {/* TAB 0: GLOSARIO TECNICO MATERIALES BASE DUBOVIK */}
      {activeTab === "glosario" && (
        <DubovikGlosario />
      )}

      {/* CREATE NEW INGREDIENT MODAL */}
      <NewIngredientModal 
        isOpen={newIngModal}
        onClose={() => setNewIngModal(false)}
        onSubmit={handleCreateCustomIngredient}
        tempIng={tempIng}
        setTempIng={setTempIng}
      />

      {/* IMPORT & CREATE NEW ICE CREAM TYPE MODAL (DUBOVIK IA) */}
      <ImportadorHeladoModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportRecipe={handleImportRecipe}
      />
    </div>
  );
}
