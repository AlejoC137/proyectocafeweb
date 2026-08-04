import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Package, 
  DollarSign, 
  Thermometer, 
  PieChart, 
  Settings, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Zap,
  Loader2,
  Database,
  Search,
  BookOpen,
  ArrowRight,
  Send,
  BookMarked
} from "lucide-react";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import { 
  ITEMS, 
  MENU, 
  PRODUCCION, 
  RECETAS_MENU, 
  RECETAS_PRODUCCION 
} from "../../../redux/actions-types";
import { 
  getAllFromTable, 
  createRecipeForProduct 
} from "../../../redux/actions";

// --- INGREDIENTES BASE PREDETERMINADOS (DUBOVIK FORMULATOR) ---
const DEFAULT_INGREDIENTS = [
  { id: "leche_entera", nombre: "Leche Entera (3.2% Grasa)", grasa: 3.2, solidos: 11.7, pod: 0.5, pac: 1.0, unidad: "g" },
  { id: "crema_35", nombre: "Crema de Leche 35%", grasa: 35.0, solidos: 40.5, pod: 0.3, pac: 0.6, unidad: "g" },
  { id: "lpd", nombre: "Leche en Polvo Desnatada (LPD)", grasa: 1.0, solidos: 96.0, pod: 5.2, pac: 10.4, unidad: "g" },
  { id: "sacarosa", nombre: "Sacarosa (Azúcar común)", grasa: 0.0, solidos: 100.0, pod: 100.0, pac: 100.0, unidad: "g" },
  { id: "dextrosa", nombre: "Dextrosa Monohidratada", grasa: 0.0, solidos: 92.0, pod: 70.0, pac: 90.0, unidad: "g" },
  { id: "maltodextrina", nombre: "Maltodextrina DE19", grasa: 0.0, solidos: 95.0, pod: 15.0, pac: 20.0, unidad: "g" },
  { id: "glucosa_38", nombre: "Jarabe de Glucosa 38 DE", grasa: 0.0, solidos: 80.0, pod: 50.0, pac: 90.0, unidad: "g" },
  { id: "glucosa_60", nombre: "Jarabe de Glucosa 60 DE", grasa: 0.0, solidos: 80.0, pod: 70.0, pac: 130.0, unidad: "g" },
  { id: "chocolate_54", nombre: "Chocolate Cobertura 54%", grasa: 35.0, solidos: 98.0, pod: 50.0, pac: 25.0, unidad: "g" },
  { id: "cacao_polvo", nombre: "Cacao en Polvo 20/22", grasa: 21.0, solidos: 95.0, pod: 0.0, pac: 0.0, unidad: "g" },
  { id: "neutro_5", nombre: "Estabilizante Neutro 5g", grasa: 0.0, solidos: 100.0, pod: 0.0, pac: 0.0, unidad: "g" },
  { id: "inulina", nombre: "Inulina (Fibra soluble)", grasa: 0.0, solidos: 95.0, pod: 10.0, pac: 10.0, unidad: "g" },
  { id: "frambuesa", nombre: "Puré de Frambuesa", grasa: 0.0, solidos: 8.8, pod: 7.8, pac: 17.2, unidad: "g" },
  { id: "agua", nombre: "Agua de Chorro / Filtrada", grasa: 0.0, solidos: 0.0, pod: 0.0, pac: 0.0, unidad: "g" },
];

// --- GLOSARIO TECNICO MATERIALES BASE DUBOVIK ---
const GLOSSARY_DUBOVIK = [
  {
    nombre: "Leche Entera (3.2% Grasa)",
    icono: "🧪",
    definicion: "Base líquida fundamental en helados de crema. Aporta fase acuosa, grasa láctea libre y sólidos lácteos no grasos (proteínas caseínas y suero).",
    valores: "Grasa: 3.2% | Sólidos: 11.7% | POD: 0.5 | PAC: 1.0",
    condiciones: "Representa del 50% al 70% de la mezcla total. Las proteínas encapsulan los glóbulos de grasa y aire durante el mantecado. Pastorizar a 85°C."
  },
  {
    nombre: "Crema de Leche 35%",
    icono: "🧪",
    definicion: "Fuente primaria de materia grasa láctea concentrada. Proporciona cremosidad, retarda el derretimiento y suaviza los cristales de hielo.",
    valores: "Grasa: 35.0% | Sólidos: 40.5% | POD: 0.3 | PAC: 0.6",
    condiciones: "Dosificar del 5% al 25% del mix según el nivel de grasa deseado (Soft o Gelato). Excesos provocan película grasa en el paladar."
  },
  {
    nombre: "Leche en Polvo Desnatada (LPD / SMP)",
    icono: "🧪",
    definicion: "Concentrado de sólidos lácteos no grasos (MSNF) con alta proteína. Aumenta la estructura y el overrun (incorporación de aire) sin sumar grasa.",
    valores: "Grasa: 1.0% | Sólidos: 96.0% | POD: 5.2 | PAC: 10.4",
    condiciones: "Usar de 3% a 7%. Si supera el 10% de MSNF sobre el agua del mix, existe riesgo de cristalización de la lactosa (sensación arenosa en boca)."
  },
  {
    nombre: "Sacarosa (Azúcar Común)",
    icono: "🧪",
    definicion: "Disacárido base de comparación (POD 100 / PAC 100). Determina el nivel de dulzor estándar y controla el punto de congelación inicial.",
    valores: "Grasa: 0.0% | Sólidos: 100.0% | POD: 100.0 | PAC: 100.0",
    condiciones: "Recomendado entre 10% y 16% del mix total. El consumo excesivo produce helados demasiado blandos y extremadamente dulces."
  },
  {
    nombre: "Dextrosa Monohidratada",
    icono: "🧪",
    definicion: "Monosacárido derivado del maíz. Posee un poder anticongelante elevado (PAC 90-190) y menor poder edulcorante que la sacarosa (POD 70).",
    valores: "Grasa: 0.0% | Sólidos: 92.0% | POD: 70.0 | PAC: 90.0",
    condiciones: "Excelente para reducir la dureza del helado en vitrina sin empalagar. Dosificación habitual del 2% al 6% del azúcar total."
  },
  {
    nombre: "Maltodextrina DE 19",
    icono: "🧪",
    definicion: "Polímero de glucosa de bajo DE. Aporta sólidos secos, viscosidad y cuerpo sin alterar el dulzor ni congelar demasiado el agua libre.",
    valores: "Grasa: 0.0% | Sólidos: 95.0% | POD: 15.0 | PAC: 20.0",
    condiciones: "Ideal en sorbetes y helados bajos en grasa para alcanzar entre 30% y 36% de sólidos totales sin endulzar en exceso (2% a 8% del mix)."
  },
  {
    nombre: "Jarabe de Glucosa 38 DE",
    icono: "🧪",
    definicion: "Jarabe deshidratado de mediana conversión. Otorga viscosidad, masticabilidad (chewiness) y evita la recristalización de azúcares.",
    valores: "Grasa: 0.0% | Sólidos: 80.0% | POD: 50.0 | PAC: 90.0",
    condiciones: "Reemplaza parcialmente la sacarosa (15% a 30% de los azúcares) para mejorar la resistencia al choque térmico durante el transporte."
  },
  {
    nombre: "Jarabe de Glucosa 60 DE",
    icono: "🧪",
    definicion: "Jarabe de alta conversión rico en azúcares simples. Alto valor de PAC para ablandar helados servidos a temperaturas muy bajas.",
    valores: "Grasa: 0.0% | Sólidos: 80.0% | POD: 70.0 | PAC: 130.0",
    condiciones: "Muy utilizado en sorbetes de fruta acida para mantener una textura espautlable a -14°C a -18°C."
  },
  {
    nombre: "Chocolate Cobertura 54%",
    icono: "🧪",
    definicion: "Materia prima compuesta rica en manteca de cacao y azúcar. Aporta estructura firme por la solidificación de la grasa vegetal noble.",
    valores: "Grasa: 35.0% | Sólidos: 98.0% | POD: 50.0 | PAC: 25.0",
    condiciones: "Incorporar fundido a 45°C en la fase caliente. Al tener bajo PAC, suele compensarse agregando Dextrosa a la mezcla."
  },
  {
    nombre: "Cacao en Polvo 20/22",
    icono: "🧪",
    definicion: "Cacao desgrasado parcial alcalinizado (20-22% manteca). Otorga sabor intenso, color profundo y absorbe gran cantidad de agua libre.",
    valores: "Grasa: 21.0% | Sólidos: 95.0% | POD: 0.0 | PAC: 0.0",
    condiciones: "Usar entre 2% y 4%. Al ser muy higroscópico, requiere ajustar la hidratación hídrica o aumentar ligeramente los azúcares."
  },
  {
    nombre: "Estabilizante Neutro 5g",
    icono: "🧪",
    definicion: "Complejo de hidrocoloides (Garrofín, Guar, CMC) y emulsionantes. Absorbe el agua no ligada y estabiliza las burbujas de aire.",
    valores: "Grasa: 0.0% | Sólidos: 100.0% | POD: 0.0 | PAC: 0.0",
    condiciones: "Dosis estricta de 4g a 5g por kg de mezcla (0.4% - 0.5%). Mezclar en seco con el azúcar antes de dispersar a 50°C."
  },
  {
    nombre: "Inulina (Fibra Soluble)",
    icono: "🧪",
    definicion: "Fructano de origen vegetal. Simula la textura y sensación grasosa en la boca (fat-replacer) sin aportar calorías ni apenas dulzor.",
    valores: "Grasa: 0.0% | Sólidos: 95.0% | POD: 10.0 | PAC: 10.0",
    condiciones: "Indispensable en helados veganos y sorbetes de fruta para dar cuerpo, viscosidad y textura uniforme (dosificación 2% a 6%)."
  },
  {
    nombre: "Puré de Frambuesa (Fruta)",
    icono: "🧪",
    definicion: "Pulpa natural de fruta. Aporta la fase acuosa con azúcares naturales propios (fructosa/glucosa), ácidos orgánicos y sólidos secos de fruta.",
    valores: "Grasa: 0.0% | Sólidos: 8.8% | POD: 7.8 | PAC: 17.2",
    condiciones: "En sorbetes constituye del 30% al 50% de la formulación total. Mantener balance hídrico adecuado."
  },
  {
    nombre: "Agua Filtrada",
    icono: "🧪",
    definicion: "Solvente puro para la disolución de azúcares e hidrocoloides en sorbetes y preparaciones sin base láctea.",
    valores: "Grasa: 0.0% | Sólidos: 0.0% | POD: 0.0 | PAC: 0.0",
    condiciones: "Utilizar agua purificada u ósmosis inversa para evitar que minerales/cloro interfieran con el rendimiento de los estabilizantes."
  }
];

// RANGOS RECOMENDADOS SEGÚN TIPO DE HELADO
const TARGET_RANGES = {
  GELATO: {
    grasa: { min: 6.0, max: 12.0, opt: "6% - 12%" },
    solidos: { min: 36.0, max: 42.0, opt: "36% - 42%" },
    pod: { min: 16.0, max: 22.0, opt: "16 - 22" },
    pac: { min: 24.0, max: 32.0, opt: "24 - 32" },
  },
  SOFT: {
    grasa: { min: 4.0, max: 10.0, opt: "4% - 10%" },
    solidos: { min: 32.0, max: 39.0, opt: "32% - 39%" },
    pod: { min: 14.0, max: 18.0, opt: "14 - 18" },
    pac: { min: 15.0, max: 22.0, opt: "15 - 22" },
  },
  SORBETE: {
    grasa: { min: 0.0, max: 1.5, opt: "0% - 1.5%" },
    solidos: { min: 26.0, max: 32.0, opt: "26% - 32%" },
    pod: { min: 15.0, max: 20.0, opt: "15 - 20" },
    pac: { min: 18.0, max: 25.0, opt: "18 - 25" },
  }
};

// PRESET TEST RECIPES FROM DUBOVIK EXCEL
const PRESET_RECIPES = {
  chocolate_soft: {
    nombre: "Chocolate Soft (Dubovik)",
    tipo: "SOFT",
    items: [
      { ingId: "leche_entera", cantidad: 655, inventarioItemId: "" },
      { ingId: "crema_35", cantidad: 60, inventarioItemId: "" },
      { ingId: "lpd", cantidad: 30, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 70, inventarioItemId: "" },
      { ingId: "dextrosa", cantidad: 60, inventarioItemId: "" },
      { ingId: "chocolate_54", cantidad: 90, inventarioItemId: "" },
      { ingId: "cacao_polvo", cantidad: 30, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  },
  frambuesa_sorbete: {
    nombre: "Frambuesa Soft Sorbete (Dubovik)",
    tipo: "SORBETE",
    items: [
      { ingId: "agua", cantidad: 365, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 110, inventarioItemId: "" },
      { ingId: "inulina", cantidad: 70, inventarioItemId: "" },
      { ingId: "maltodextrina", cantidad: 70, inventarioItemId: "" },
      { ingId: "frambuesa", cantidad: 380, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  }
};

// --- REUSABLE SEARCHABLE SELECT COMPONENT ---
function SearchableSelect({ value, onChange, options, placeholder = "Buscar o seleccionar...", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => {
    for (const opt of options) {
      if (opt.options) {
        const found = opt.options.find((o) => o.value === value);
        if (found) return found;
      } else if (opt.value === value) {
        return opt;
      }
    }
    return null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();

    return options.map((opt) => {
      if (opt.options) {
        const matchingSub = opt.options.filter((sub) =>
          sub.label.toLowerCase().includes(term)
        );
        return matchingSub.length > 0 ? { ...opt, options: matchingSub } : null;
      }
      return opt.label.toLowerCase().includes(term) ? opt : null;
    }).filter(Boolean);
  }, [options, search]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-1.5 border-2 border-black bg-white flex items-center justify-between cursor-pointer hover:bg-yellow-50 text-xs font-semibold shadow-sm"
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-600" />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-black shadow-solid max-h-64 overflow-y-auto">
          <div className="p-1.5 border-b-2 border-black sticky top-0 bg-yellow-100 z-10 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe para buscar..."
              className="w-full p-1 text-xs border border-black bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 text-center font-medium">No se encontraron resultados</div>
            ) : (
              filteredOptions.map((item, idx) => {
                if (item.options) {
                  return (
                    <div key={idx} className="mb-1">
                      <div className="px-2 py-1 bg-gray-100 text-[10px] font-bold text-gray-700 uppercase border-y border-gray-300">
                        {item.group}
                      </div>
                      {item.options.map((subOpt) => (
                        <div
                          key={subOpt.value}
                          onClick={() => {
                            onChange(subOpt.value);
                            setIsOpen(false);
                            setSearch("");
                          }}
                          className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-sage-green hover:text-white flex items-center justify-between transition-colors ${
                            subOpt.value === value ? "bg-yellow-200 font-bold text-black" : "text-gray-800"
                          }`}
                        >
                          <span className="truncate pr-2">{subOpt.label}</span>
                          {subOpt.value === value && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sage-green" />}
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div
                    key={item.value}
                    onClick={() => {
                      onChange(item.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-sage-green hover:text-white flex items-center justify-between transition-colors ${
                      item.value === value ? "bg-yellow-200 font-bold text-black" : "text-gray-800"
                    }`}
                  >
                    <span className="truncate pr-2">{item.label}</span>
                    {item.value === value && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sage-green" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalculadorRecetaHelados() {
  const dispatch = useDispatch();
  
  // Redux state selectors for Supabase tables
  const allItems = useSelector((state) => state.allItems || []);
  const allMenu = useSelector((state) => state.allMenu || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);

  // Loading state for Supabase sync
  const [loadingData, setLoadingData] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Form State
  const [nombreReceta, setNombreReceta] = useState("Mi Formulación Helado");
  const [tipoHelado, setTipoHelado] = useState("SOFT"); // GELATO, SOFT, SORBETE
  const [activeTab, setActiveTab] = useState("formulador"); // 'formulador' | 'costeo'
  const [showAccionesRapidas, setShowAccionesRapidas] = useState(false);
  const [selectedProductTarget, setSelectedProductTarget] = useState(""); // Menu or Produccion ID to link

  // Ingredients catalog state
  const [ingredientesDB, setIngredientesDB] = useState(DEFAULT_INGREDIENTS);
  const [newIngModal, setNewIngModal] = useState(false);
  const [tempIng, setTempIng] = useState({ nombre: "", grasa: 0, solidos: 0, pod: 0, pac: 0 });

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
        ]);
      } catch (err) {
        console.error("Error al cargar datos de Supabase:", err);
      } finally {
        setLoadingData(false);
      }
    };
    loadSupabaseTables();
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
    const preset = PRESET_RECIPES[presetKey];
    if (preset) {
      setNombreReceta(preset.nombre);
      setTipoHelado(preset.tipo);
      setRecetaLines(preset.items);
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

  // Target ranges & health checks
  const targets = TARGET_RANGES[tipoHelado];
  const isGrasaOk = calculations.grasaPct >= targets.grasa.min && calculations.grasaPct <= targets.grasa.max;
  const isSolidosOk = calculations.solidosPct >= targets.solidos.min && calculations.solidosPct <= targets.solidos.max;
  const isPodOk = calculations.pod >= targets.pod.min && calculations.pod <= targets.pod.max;
  const isPacOk = calculations.pac >= targets.pac.min && calculations.pac <= targets.pac.max;

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

    // Verificar si el producto ya cuenta con una receta previa asignada
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
            onClick={() => loadPreset("chocolate_soft")}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border-2 border-black shadow-solid transition-all flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" /> Demo Soft Chocolate
          </button>

          <button
            onClick={() => loadPreset("frambuesa_sorbete")}
            className="px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-900 text-xs font-bold border-2 border-black shadow-solid transition-all flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" /> Demo Sorbete Frambuesa
          </button>

          <button
            onClick={() => setShowAccionesRapidas(!showAccionesRapidas)}
            className="px-3 py-1.5 bg-cobalt-blue text-white text-xs font-bold border-2 border-black shadow-solid hover:bg-blue-700 transition-all flex items-center gap-1"
          >
            <Zap className="h-3.5 w-3.5" />
            {showAccionesRapidas ? "Ocultar Acciones Rápidas" : "Acciones Rápidas"}
          </button>
        </div>
      </div>

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

      {/* NAVIGATION TABS */}
      <div className="flex border-b-2 border-black bg-cream-bg">
        <button
          onClick={() => setActiveTab("formulador")}
          className={`px-5 py-3 text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center gap-2 ${
            activeTab === "formulador"
              ? "bg-sage-green text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <PieChart className="h-4 w-4" /> 1. Balanceador Dubovik (% Grasa, Sólidos, POD, PAC)
        </button>
        <button
          onClick={() => setActiveTab("costeo")}
          className={`px-5 py-3 text-sm font-bold border-r-2 border-t-2 border-black transition-colors flex items-center gap-2 ${
            activeTab === "costeo"
              ? "bg-sage-green text-white shadow-solid"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <DollarSign className="h-4 w-4" /> 2. Costeo & Vinculación con Inventario Supabase ({allItems.length} ítems)
        </button>
      </div>

      {/* RECIPE CONTROL HEADER */}
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

          {/* RIGHT COL: BALANCE RESULTS & GAUGES */}
          <div className="space-y-4">
            
            {/* INDICATORS DASHBOARD */}
            <div className="bg-white border-2 border-black p-4 shadow-solid space-y-4">
              <h2 className="font-bold text-base text-gray-900 border-b-2 border-black pb-2 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-terracotta-accent" />
                Resultados del Balance ({tipoHelado})
              </h2>

              {/* GRASA % */}
              <div className="p-3 border-2 border-black bg-blue-50 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-gray-800">Materia Grasa (%):</span>
                  <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isGrasaOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
                    {isGrasaOk ? "Óptimo" : "Fuera de Rango"}
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-900 font-mono">
                  {calculations.grasaPct.toFixed(2)}%
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Rango recomendado: <strong>{targets.grasa.opt}</strong>
                </div>
              </div>

              {/* SOLIDOS TOTALES % */}
              <div className="p-3 border-2 border-black bg-amber-50 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-gray-800">Sólidos Totales (%):</span>
                  <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isSolidosOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
                    {isSolidosOk ? "Óptimo" : "Fuera de Rango"}
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-900 font-mono">
                  {calculations.solidosPct.toFixed(2)}%
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Agua restante: <strong>{calculations.aguaPct.toFixed(2)}%</strong> (Opt: {targets.solidos.opt})
                </div>
              </div>

              {/* POD (Poder Edulcorante) */}
              <div className="p-3 border-2 border-black bg-purple-50 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-gray-800">POD (Dulzor):</span>
                  <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isPodOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
                    {isPodOk ? "Óptimo" : "Ajustar Dulzor"}
                  </span>
                </div>
                <div className="text-2xl font-black text-purple-900 font-mono">
                  {calculations.pod.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Rango recomendado: <strong>{targets.pod.opt}</strong>
                </div>
              </div>

              {/* PAC (Poder Anticongelante) */}
              <div className="p-3 border-2 border-black bg-teal-50 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-gray-800">PAC (Anticongelante):</span>
                  <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isPacOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
                    {isPacOk ? "Óptimo" : "Ajustar Dureza"}
                  </span>
                </div>
                <div className="text-2xl font-black text-teal-900 font-mono">
                  {calculations.pac.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Rango recomendado: <strong>{targets.pac.opt}</strong>
                </div>
              </div>

              {/* SERVING TEMP ESTIMATE */}
              <div className="p-3 border-2 border-black bg-cyan-100 text-cyan-950">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="h-4 w-4 text-cyan-700" />
                  <span className="font-bold text-xs">Temp. de Servicio Estimada:</span>
                </div>
                <div className="text-xl font-black font-mono">
                  {calculations.tempServicio.toFixed(2)} °C
                </div>
                <div className="text-[10px] text-cyan-800 mt-1">
                  Algoritmo Dubovik: {tipoHelado === "SORBETE" ? "PAC / -2.5" : "PAC / -2"}
                </div>
              </div>
            </div>

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

      {/* GLOSARIO TECNICO MATERIALES BASE DUBOVIK */}
      <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-6">
        <div className="border-b-2 border-black pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              🧪 Glosario Técnico de Ingredientes & Condiciones (Método Dubovik)
            </h2>
            <p className="text-xs text-gray-600">
              Manual bromatológico y condiciones de formulación física para cada materia prima de la base.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-yellow-200 text-black border-2 border-black font-bold shrink-0">
            {GLOSSARY_DUBOVIK.length} Materias Primas Base
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GLOSSARY_DUBOVIK.map((item, idx) => (
            <div key={idx} className="border-2 border-black bg-cream-bg p-3 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-solid transition-all">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 border-b border-black pb-1">
                  <span className="text-base">{item.icono}</span>
                  <h3 className="font-bold text-xs text-gray-900">{item.nombre}</h3>
                </div>
                <p className="text-[11px] text-gray-700 leading-snug mb-2">
                  {item.definicion}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-300">
                <div className="text-[10px] font-mono font-bold bg-yellow-100 p-1 border border-black text-gray-900">
                  {item.valores}
                </div>
                <div className="text-[10px] text-gray-600 bg-white p-1.5 border border-gray-300">
                  <strong>Condición:</strong> {item.condiciones}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW INGREDIENT MODAL */}
      {newIngModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-6 w-full max-w-md shadow-solid space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b-2 border-black pb-2">
              Registrar Nuevo Ingrediente al Catálogo Local
            </h3>
            <form onSubmit={handleCreateCustomIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Nombre Ingrediente:</label>
                <input
                  type="text"
                  required
                  value={tempIng.nombre}
                  onChange={(e) => setTempIng({ ...tempIng, nombre: e.target.value })}
                  className="w-full p-1.5 border border-black"
                  placeholder="ej. Pasta de Avellana 100%"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">% Grasa:</label>
                  <input
                    type="number"
                    step="any"
                    value={tempIng.grasa}
                    onChange={(e) => setTempIng({ ...tempIng, grasa: e.target.value })}
                    className="w-full p-1.5 border border-black font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">% Sólidos Totales:</label>
                  <input
                    type="number"
                    step="any"
                    value={tempIng.solidos}
                    onChange={(e) => setTempIng({ ...tempIng, solidos: e.target.value })}
                    className="w-full p-1.5 border border-black font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">POD (Poder Edulcorante):</label>
                  <input
                    type="number"
                    step="any"
                    value={tempIng.pod}
                    onChange={(e) => setTempIng({ ...tempIng, pod: e.target.value })}
                    className="w-full p-1.5 border border-black font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">PAC (Poder Anticongelante):</label>
                  <input
                    type="number"
                    step="any"
                    value={tempIng.pac}
                    onChange={(e) => setTempIng({ ...tempIng, pac: e.target.value })}
                    className="w-full p-1.5 border border-black font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewIngModal(false)}
                  className="px-3 py-1.5 bg-gray-200 font-bold border border-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sage-green text-white font-bold border border-black"
                >
                  Guardar Ingrediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
