import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAllFromTable,
  getRecepie,
  trimRecepie,
  updateItem
} from "../../../redux/actions";
import {
  MENU,
  RECETAS_MENU,
  ITEMS,
  PRODUCCION,
  TODAYS_MENU
} from "../../../redux/actions-types";
import {
  X,
  Utensils,
  UtensilsCrossed,
  ChefHat,
  Tag,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Edit,
  Save,
  Loader2,
  FileJson,
  Copy,
  Check,
  Printer,
  ShoppingBag,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "../../../config/supabaseClient";
import HorizontalGallery from "./MenuPrintHorizontal/HorizontalGallery";
import { recetaMariaPaula } from "../../../redux/calcularReceta.jsx";

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue", badge }) => {
  const colorStyles = {
    blue: "bg-blue-50/70 border-blue-200 text-blue-900",
    green: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
    purple: "bg-purple-50/70 border-purple-200 text-purple-900",
    amber: "bg-amber-50/70 border-amber-200 text-amber-900",
  };

  const iconStyles = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    purple: "bg-purple-600 text-white",
    amber: "bg-amber-600 text-white",
  };

  return (
    <div className={`p-3.5 rounded-xl border ${colorStyles[color]} shadow-sm flex flex-col justify-between relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">{title}</span>
          <h4 className="text-lg font-extrabold tracking-tight">{value}</h4>
        </div>
        <div className={`p-2 rounded-lg ${iconStyles[color]} shadow-xs`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {subtitle && (
        <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-600">
          <span>{subtitle}</span>
          {badge && <span className="font-semibold">{badge}</span>}
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
    {Icon && <Icon className="h-4 w-4 text-blue-600" />}
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h3>
      {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const ItemMenuModal = ({ item: propItem, onClose, itemId: propItemId }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const targetId = propItem?._id || propItem?.id || propItemId || paramId;

  // Redux Selectors
  const allMenu = useSelector((state) => state.allMenu || []);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allComandas = useSelector((state) => state.allComanda || []);

  // Component States
  const [loading, setLoading] = useState(false);
  const [menuItem, setMenuItem] = useState(null);
  const [editableItem, setEditableItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("ventas"); // "ventas", "receta", "edicion", "json"

  // Recipe & Cost calculation state
  const [recipeData, setRecipeData] = useState(null);
  const [recipeCostDetails, setRecipeCostDetails] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Gallery & Upload State
  const [showGallery, setShowGallery] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // JSON & Prompt State
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);

  // Load initial required tables if missing
  useEffect(() => {
    const loadRequiredData = async () => {
      setLoading(true);
      try {
        const promises = [];
        if (allMenu.length === 0) promises.push(dispatch(getAllFromTable(MENU)));
        if (allRecetasMenu.length === 0) promises.push(dispatch(getAllFromTable(RECETAS_MENU)));
        if (allItems.length === 0) promises.push(dispatch(getAllFromTable(ITEMS)));
        if (allProduccion.length === 0) promises.push(dispatch(getAllFromTable(PRODUCCION)));
        await Promise.all(promises);
      } catch (err) {
        console.error("[ItemMenuModal] Error loading initial tables:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRequiredData();
  }, [dispatch, allMenu.length, allRecetasMenu.length, allItems.length, allProduccion.length]);

  // Resolve target Menu Item
  useEffect(() => {
    if (propItem) {
      setMenuItem(propItem);
      setEditableItem({ ...propItem });
    } else if (targetId && allMenu.length > 0) {
      const found = allMenu.find((m) => String(m._id) === String(targetId) || String(m.id) === String(targetId));
      if (found) {
        setMenuItem(found);
        setEditableItem({ ...found });
      }
    }
  }, [propItem, targetId, allMenu]);

  // Resolve associated recipe data & calculate recipe costs
  useEffect(() => {
    const fetchAssociatedRecipe = async () => {
      const recipeId = menuItem?.Receta || menuItem?.uuid_receta || menuItem?.Receta_id;
      if (!recipeId) {
        setRecipeData(null);
        setRecipeCostDetails(null);
        return;
      }

      setLoadingRecipe(true);
      try {
        const fetchedRecepie = await getRecepie(recipeId, "Recetas");
        if (fetchedRecepie) {
          const allOptions = [...allItems, ...allProduccion];
          const trimmed = trimRecepie(allOptions, fetchedRecepie);
          const calculated = recetaMariaPaula(trimmed, menuItem?.GRUPO || menuItem?.SUB_GRUPO, null, menuItem?.tiempoProceso || 0);

          setRecipeData({
            raw: fetchedRecepie,
            ingredients: trimmed,
            cost: calculated?.consolidado || 0,
            details: calculated,
          });
          setRecipeCostDetails(calculated);
        }
      } catch (err) {
        console.error("[ItemMenuModal] Error fetching associated recipe:", err);
      } finally {
        setLoadingRecipe(false);
      }
    };

    if (menuItem) {
      fetchAssociatedRecipe();
    }
  }, [menuItem, allItems, allProduccion]);

  // Compute Sales Analytics for this specific menu item across commandas/ventas
  const salesMetrics = useMemo(() => {
    if (!menuItem) {
      return {
        totalQuantity: 0,
        totalRevenue: 0,
        totalCost: 0,
        netProfit: 0,
        marginPercent: 0,
        salesCount: 0,
        recentOrders: [],
      };
    }

    const nameMatches = (itemStr) => {
      if (!itemStr) return false;
      const targetName = (menuItem.NombreES || menuItem.Nombre || menuItem.name || "").toLowerCase().trim();
      const current = String(itemStr).toLowerCase().trim();
      return current === targetName || current.includes(targetName);
    };

    let totalQuantity = 0;
    let salesCount = 0;
    const ordersList = [];

    // Search commandas or sales records
    if (Array.isArray(allComandas)) {
      allComandas.forEach((comanda) => {
        const itemsList = comanda.productos || comanda.items || comanda.detalles || [];
        let itemQuantityInOrder = 0;

        if (Array.isArray(itemsList)) {
          itemsList.forEach((prod) => {
            const prodName = prod.NombreES || prod.nombre || prod.Nombre || prod.name;
            if (nameMatches(prodName)) {
              const qty = Number(prod.quantity || prod.cantidad || 1);
              itemQuantityInOrder += qty;
            }
          });
        }

        if (itemQuantityInOrder > 0) {
          totalQuantity += itemQuantityInOrder;
          salesCount += 1;
          ordersList.push({
            id: comanda._id || comanda.id || `CMD-${ordersList.length + 1}`,
            date: comanda.fecha || comanda.created_at || comanda.date || "Reciente",
            mesa: comanda.mesa || comanda.table || "Barra",
            quantity: itemQuantityInOrder,
            unitPrice: Number(menuItem.Precio || menuItem.price || 0),
            total: itemQuantityInOrder * Number(menuItem.Precio || menuItem.price || 0),
          });
        }
      });
    }

    const price = Number(menuItem.Precio || menuItem.price || 0);
    const totalRevenue = totalQuantity * price;
    const unitRecipeCost = recipeData?.cost || 0;
    const totalCost = totalQuantity * unitRecipeCost;
    const netProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalQuantity,
      totalRevenue,
      totalCost,
      netProfit,
      marginPercent,
      salesCount,
      unitRecipeCost,
      recentOrders: ordersList.slice(0, 15),
    };
  }, [menuItem, allComandas, recipeData]);

  // Gallery and Image Upload handlers
  const handleGallerySelect = (img) => {
    setEditableItem((prev) => ({ ...prev, Foto: img.url }));
    setShowGallery(false);
  };

  const handleUploadNewClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Imagen demasiado pesada (máximo 4MB)");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `menu_${Date.now()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Images_eventos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("Images_eventos")
        .getPublicUrl(filePath);

      setEditableItem((prev) => ({ ...prev, Foto: publicUrl }));
      alert("¡Imagen subida y asignada con éxito!");
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("Error al subir la imagen: " + err.message);
    } finally {
      setUploadingImage(false);
      setShowGallery(false);
    }
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    if (!editableItem || !editableItem._id) return;
    setIsSaving(true);
    try {
      const updated = await dispatch(updateItem(editableItem._id, editableItem, MENU));
      if (updated) {
        setMenuItem({ ...editableItem });
        setIsEditing(false);
        alert("Ítem de menú actualizado correctamente.");
      }
    } catch (err) {
      console.error("[ItemMenuModal] Error saving menu item:", err);
      alert("Error al guardar cambios: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Format currency in COP
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });
  };

  // Handle closing modal
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Generate Prompt Copy
  const handleCopyPrompt = () => {
    const promptText = `ANÁLISIS Y OPTIMIZACIÓN DE ÍTEM DE MENÚ:
Nombre: ${menuItem?.NombreES || menuItem?.Nombre}
Categoría: ${menuItem?.SUB_GRUPO || menuItem?.Categoria || "General"}
Precio Actual: ${formatCurrency(menuItem?.Precio)}
Costo Receta: ${formatCurrency(salesMetrics.unitRecipeCost)}
Margen de Ganancia: ${salesMetrics.marginPercent.toFixed(1)}%
Unidades Vendidas: ${salesMetrics.totalQuantity}

Optimiza la presentación, estrategia de precio y estructura de este platillo para aumentar rentabilidad sin perder ventas.`;

    navigator.clipboard.writeText(promptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  if (loading || !menuItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl border">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Cargando datos del Platillo del Menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* ─── HEADER ────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
          
          <div className="flex items-center gap-3.5">
            {/* Main Item Photo / Dish Icon */}
            <div className="relative group shrink-0">
              {menuItem.Foto ? (
                <img
                  src={menuItem.Foto}
                  alt={menuItem.NombreES || menuItem.Nombre}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-blue-400/40 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Utensils className="h-8 w-8 text-blue-400" />
                </div>
              )}
              <button
                onClick={() => setShowGallery(true)}
                className="absolute -bottom-1 -right-1 p-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] shadow-sm transition-transform active:scale-95"
                title="Cambiar imagen del platillo"
              >
                <ImageIcon className="h-3 w-3" />
              </button>
            </div>

            {/* Main Title & Badges */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                  <Utensils className="h-3 w-3 text-blue-400" />
                  {menuItem.SUB_GRUPO || menuItem.Categoria || "Menú"}
                </span>

                {menuItem.Receta ? (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                    <ChefHat className="h-3 w-3 text-amber-400" />
                    Receta Conectada
                  </span>
                ) : (
                  <span className="bg-slate-700/60 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Venta Directa
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                {menuItem.NombreES || menuItem.Nombre || "Platillo Sin Nombre"}
              </h2>

              <p className="text-xs text-slate-300 font-semibold mt-0.5 flex items-center gap-2">
                <span>Precio de Venta: <strong className="text-emerald-400">{formatCurrency(menuItem.Precio)}</strong></span>
                {recipeData?.cost > 0 && (
                  <span className="text-slate-400">| Costo Receta: <strong className="text-amber-300">{formatCurrency(recipeData.cost)}</strong></span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              onClick={handleCopyPrompt}
              variant="outline"
              size="sm"
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs h-8 gap-1.5"
              title="Copiar prompt para análisis IA"
            >
              {promptCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{promptCopied ? "¡Copiado!" : "Prompt IA"}</span>
            </Button>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              size="sm"
              className={`text-xs h-8 gap-1.5 font-bold ${
                isEditing ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              <Edit className="h-3.5 w-3.5" />
              <span>{isEditing ? "Cancelar Edición" : "Editar Ítem"}</span>
            </Button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── KPIS SUMMARY CARDS BAR ───────────────────────────────────────── */}
        <div className="bg-slate-50/80 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            title="Unidades Vendidas"
            value={salesMetrics.totalQuantity}
            subtitle={`${salesMetrics.salesCount} Comandas`}
            icon={ShoppingBag}
            color="blue"
          />

          <StatCard
            title="Ingresos Totales"
            value={formatCurrency(salesMetrics.totalRevenue)}
            subtitle={`Precio: ${formatCurrency(menuItem.Precio)}`}
            icon={DollarSign}
            color="green"
          />

          <StatCard
            title="Costo de Receta"
            value={formatCurrency(salesMetrics.unitRecipeCost)}
            subtitle={`Total: ${formatCurrency(salesMetrics.totalCost)}`}
            icon={ChefHat}
            color="amber"
          />

          <StatCard
            title="Margen de Ganancia"
            value={`${salesMetrics.marginPercent.toFixed(1)}%`}
            subtitle={`Utilidad: ${formatCurrency(salesMetrics.netProfit)}`}
            icon={TrendingUp}
            color={salesMetrics.marginPercent >= 50 ? "green" : salesMetrics.marginPercent >= 30 ? "blue" : "amber"}
          />
        </div>

        {/* ─── NAVIGATION TABS ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab("ventas")}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "ventas"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Ventas & Historial
          </button>

          <button
            onClick={() => setActiveTab("receta")}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "receta"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Receta Asociada
          </button>

          <button
            onClick={() => setActiveTab("edicion")}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "edicion"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit className="h-3.5 w-3.5" />
            Configuración & Campos
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === "json"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileJson className="h-3.5 w-3.5" />
            JSON & Herramientas
          </button>
        </div>

        {/* ─── TAB CONTENT AREA ──────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">

          {/* TAB 1: VENTAS & HISTORIAL */}
          {activeTab === "ventas" && (
            <div className="space-y-4">
              <SectionHeader
                title="Historial de Ventas del Platillo"
                subtitle="Consolidado de ventas registradas en comandas para este producto del menú"
                icon={BarChart3}
              />

              {salesMetrics.recentOrders.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No se registran ventas recientes para este producto en comandas.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Las ventas se actualizarán automáticamente a medida que se procesen comandas.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b">
                        <th className="py-2.5 px-3">Comanda / Fecha</th>
                        <th className="py-2.5 px-3 text-center">Ubicación</th>
                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">Total Ingreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {salesMetrics.recentOrders.map((order, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-slate-800 font-semibold flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {order.date}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600">{order.mesa}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-600">{order.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(order.unitPrice)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600">{formatCurrency(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECETA ASOCIADA & INGREDIENTES */}
          {activeTab === "receta" && (
            <div className="space-y-4">
              <SectionHeader
                title="Receta & Estructura de Costos"
                subtitle="Ficha técnica de preparación e ingredientes asociados al platillo"
                icon={UtensilsCrossed}
              />

              {loadingRecipe ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">Cargando receta e ingredientes...</span>
                </div>
              ) : recipeData ? (
                <div className="space-y-4">
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-600 text-white rounded-lg shadow-xs">
                        <ChefHat className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          {recipeData.raw?.legacyName || recipeData.raw?.Nombre || "Receta Asociada"}
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          ID de Receta: <code className="bg-amber-100 px-1 py-0.5 rounded">{menuItem.Receta || menuItem.uuid_receta}</code>
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/receta/${menuItem.Receta || menuItem.uuid_receta}`)}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir Libro de Receta
                    </Button>
                  </div>

                  {/* Ingredients Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100/90 px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider text-slate-600 flex justify-between">
                      <span>Ingredientes de la Receta ({recipeData.ingredients?.length || 0})</span>
                      <span>Costo Consolidado: {formatCurrency(recipeData.cost)}</span>
                    </div>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b">
                          <th className="py-2 px-3">Ingrediente</th>
                          <th className="py-2 px-3 text-center">Cantidad</th>
                          <th className="py-2 px-3 text-right">Precio Unit.</th>
                          <th className="py-2 px-3 text-right">Costo Parcial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {recipeData.ingredients && recipeData.ingredients.length > 0 ? (
                          recipeData.ingredients.map((ing, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-800">{ing.nombre || ing.name || "Ingrediente"}</td>
                              <td className="py-2 px-3 text-center text-slate-600">
                                {Number(ing.cantidad || 0).toFixed(2)} {ing.unidades || "und"}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(ing.precioUnitario || 0)}</td>
                              <td className="py-2 px-3 text-right font-bold text-amber-700">
                                {formatCurrency((ing.cantidad || 0) * (ing.precioUnitario || 0))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">
                              Sin ingredientes registrados en la receta.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ChefHat className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Este platillo no tiene una Receta asociada.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Puedes asignar una ID de receta en la pestaña de edición para calcular su costo exacto de materia prima.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDICIÓN & CONFIGURACIÓN */}
          {activeTab === "edicion" && (
            <div className="space-y-4">
              <SectionHeader
                title="Edición del Platillo"
                subtitle="Modifica campos principales y configuración general del menú"
                icon={Edit}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Nombre del Platillo (Español)</label>
                  <Input
                    value={editableItem?.NombreES || editableItem?.Nombre || ""}
                    onChange={(e) => setEditableItem((prev) => ({ ...prev, NombreES: e.target.value, Nombre: e.target.value }))}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Categoría / Sub-Grupo</label>
                  <Input
                    value={editableItem?.SUB_GRUPO || editableItem?.Categoria || ""}
                    onChange={(e) => setEditableItem((prev) => ({ ...prev, SUB_GRUPO: e.target.value, Categoria: e.target.value }))}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Precio de Venta (COP)</label>
                  <Input
                    type="number"
                    value={editableItem?.Precio || ""}
                    onChange={(e) => setEditableItem((prev) => ({ ...prev, Precio: Number(e.target.value) }))}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">ID Receta Vincular</label>
                  <Input
                    value={editableItem?.Receta || editableItem?.uuid_receta || ""}
                    onChange={(e) => setEditableItem((prev) => ({ ...prev, Receta: e.target.value, uuid_receta: e.target.value }))}
                    placeholder="Ej: REC-102"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">URL Foto Principal</label>
                  <div className="flex gap-2">
                    <Input
                      value={editableItem?.Foto || ""}
                      onChange={(e) => setEditableItem((prev) => ({ ...prev, Foto: e.target.value }))}
                      className="h-8 text-xs bg-white flex-1"
                    />
                    <Button
                      onClick={() => setShowGallery(true)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                      Galería
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold px-4 gap-1.5 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: HERRAMIENTAS JSON & PROMPTS */}
          {activeTab === "json" && (
            <div className="space-y-4">
              <SectionHeader
                title="Herramientas JSON & IA"
                subtitle="Inspección directa y exportación/importación del objeto menú"
                icon={FileJson}
              />

              <div className="bg-slate-900 rounded-xl p-3 text-slate-200 overflow-x-auto text-[11px] font-mono shadow-inner border border-slate-800">
                <pre>{JSON.stringify(menuItem, null, 2)}</pre>
              </div>
            </div>
          )}

        </div>

        {/* ─── FOOTER BAR ────────────────────────────────────────────────────── */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Utensils className="h-3.5 w-3.5 text-blue-600" />
            ID Ítem: <strong className="text-slate-700">{menuItem._id || menuItem.id}</strong>
          </span>

          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-white hover:bg-slate-200 text-slate-700 font-bold border-slate-300"
          >
            Cerrar Modal
          </Button>
        </div>

      </div>

      {/* ─── SHARED HORIZONTAL GALLERY DRAWER / MODAL ───────────────────────── */}
      {showGallery && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-3xl w-full max-h-[85vh] flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-blue-600" /> Seleccionar o Subir Imagen para Platillo
              </h3>
              <button onClick={() => setShowGallery(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <HorizontalGallery onSelectImage={handleGallerySelect} />

            <div className="flex items-center justify-between pt-2 border-t">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={handleUploadNewClick}
                disabled={uploadingImage}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5"
              >
                {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Subir Nueva Imagen (&lt;4MB)
              </Button>

              <Button onClick={() => setShowGallery(false)} variant="outline" size="sm" className="h-8 text-xs">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemMenuModal;
