import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllFromTable,
  actualizarPrecioUnitario,
  copiarAlPortapapeles,
  crearItem,
  sincronizarCostosProduccion
} from "../../../redux/actions";
import {
  ITEMS,
  PRODUCCION,
  AREAS,
  CATEGORIES,
  unidades,
  ItemsAlmacen,
  ProduccionInterna,
  MENU,
  MenuItems,
  BODEGA,
  ESTATUS,
  SUB_CATEGORIES
} from "../../../redux/actions-types";
import { crearProveedor } from "../../../redux/actions-Proveedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  RefreshCw,
  PlusCircle,
  X,
  Save,
  Hammer,
  FileText,
  UserPlus,
  ChefHat,
  Package,
  LayoutGrid,
  Zap,
  Sparkles
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard } from "../../../utils/prompts";
import MacroEditorItems from "./MacroEditorItems";
import MacroAgregadorItems from "./MacroAgregadorItems";
import CorrectorOrtograficoModal from "../inventario/CorrectorOrtograficoModal";

function AccionesRapidas({ currentType: propType }) {
  const dispatch = useDispatch();

  // Redux Selectors
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allProveedores = useSelector((state) => state.Proveedores || []);

  // Helper to normalize item types
  const normalizeType = (type) => {
    if (!type) return ItemsAlmacen;
    if (type === "ITEMS" || type === ITEMS || type === ItemsAlmacen || type === "ItemsAlmacen") {
      return ItemsAlmacen;
    }
    if (type === "PRODUCCION" || type === PRODUCCION || type === ProduccionInterna || type === "ProduccionInterna") {
      return ProduccionInterna;
    }
    if (type === "MENU" || type === MENU || type === MenuItems || type === "MenuItems" || type === "Menu") {
      return MenuItems;
    }
    return type;
  };

  const [selectedType, setSelectedType] = useState(() => normalizeType(propType));
  const [formVisible, setFormVisible] = useState(true);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [jsonImportVisible, setJsonImportVisible] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);

  const [macroEditorVisible, setMacroEditorVisible] = useState(false);
  const [macroAgregadorVisible, setMacroAgregadorVisible] = useState(false);
  const [spellCheckerVisible, setSpellCheckerVisible] = useState(false);

  // Sync selectedType when propType changes from parent component
  useEffect(() => {
    const normalized = normalizeType(propType);
    setSelectedType(normalized);
    setFormVisible(true);
  }, [propType]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable("Proveedores")),
          dispatch(getAllFromTable(MENU)),
        ]);
      } catch (error) {
        console.error("Error al cargar datos en AccionesRapidas:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  // Form Initial Data Structures
  const initialItemData = {
    Nombre_del_producto: "",
    Proveedor: "",
    Estado: "",
    Area: "",
    CANTIDAD: "",
    UNIDADES: "",
    COSTO: "",
    STOCK: { minimo: "", actual: "", maximo: "" },
    GRUPO: "",
    MARCA: "",
    Merma: "",
    ALMACENAMIENTO: "",
    COOR: "1.05",
  };

  const initialMenuItemData = {
    NombreES: "",
    NombreEN: "",
    Precio: "",
    GRUPO: "",
    SUB_GRUPO: "",
    Estado: "Activo",
    DescripcionMenuES: "",
    Foto: "",
  };

  const initialProveedorData = {
    Nombre_Proveedor: "",
    Contacto_Nombre: "",
    Contacto_Numero: "",
    Direccion: "",
    "NIT/CC": "",
  };

  const [newItemData, setNewItemData] = useState(initialItemData);
  const [menuItemData, setMenuItemData] = useState(initialMenuItemData);
  const [newProveedorData, setNewProveedorData] = useState(initialProveedorData);

  // Generic input handlers
  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setNewItemData((prev) => ({
      ...prev,
      STOCK: { ...prev.STOCK, [name]: value },
    }));
  };

  // Switch Active Form Type
  const handleSwitchType = (newType) => {
    setSelectedType(newType);
    setFormVisible(true);
  };

  // Submit Handler for Items (Insumo / Producción)
  const handleCrearItem = async () => {
    try {
      if (!newItemData.Nombre_del_producto.trim()) {
        alert("Por favor ingrese el nombre del producto.");
        return;
      }

      const isProduccion = selectedType === ProduccionInterna;
      const targetTable = isProduccion ? ProduccionInterna : ItemsAlmacen;

      // Build sanitized payload for Supabase
      const payload = {
        ...newItemData,
        STOCK: JSON.stringify(newItemData.STOCK),
        Estado: newItemData.Estado || (isProduccion ? "PP" : "PC"),
      };

      if (isProduccion) {
        delete payload.COOR;
      } else {
        payload.COOR = parseFloat(newItemData.COOR) || 1.05;
      }

      // Convert numeric fields or remove if empty
      if (payload.CANTIDAD !== "" && payload.CANTIDAD !== undefined && payload.CANTIDAD !== null) {
        payload.CANTIDAD = parseFloat(payload.CANTIDAD) || 0;
      } else {
        delete payload.CANTIDAD;
      }

      if (payload.COSTO !== "" && payload.COSTO !== undefined && payload.COSTO !== null) {
        payload.COSTO = parseFloat(payload.COSTO) || 0;
      } else {
        delete payload.COSTO;
      }

      if (payload.Merma !== "" && payload.Merma !== undefined && payload.Merma !== null) {
        payload.Merma = parseFloat(payload.Merma) || 0;
      } else {
        delete payload.Merma;
      }

      // Ensure MARCA is text format or empty
      if (Array.isArray(payload.MARCA)) {
        payload.MARCA = JSON.stringify(payload.MARCA);
      } else if (!payload.MARCA) {
        delete payload.MARCA;
      }

      // Ensure ALMACENAMIENTO is string
      if (typeof payload.ALMACENAMIENTO === "object") {
        payload.ALMACENAMIENTO = JSON.stringify(payload.ALMACENAMIENTO);
      }

      // Clean empty strings / nulls
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      await dispatch(crearItem(payload, targetTable));
      alert(`Ítem de ${isProduccion ? "Producción" : "Almacén"} creado correctamente.`);
      setNewItemData(initialItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem:", error);
      alert(`Error al crear el ítem: ${error.message || "No se pudo guardar en la base de datos."}`);
    }
  };

  // Submit Handler for Menu Items
  const handleCrearMenuItem = async () => {
    try {
      if (!menuItemData.NombreES.trim()) {
        alert("Por favor ingrese el nombre en español del plato.");
        return;
      }

      const payload = {
        ...menuItemData,
        Estado: menuItemData.Estado || "Activo",
      };

      if (payload.Precio !== "" && payload.Precio !== undefined && payload.Precio !== null) {
        payload.Precio = parseFloat(payload.Precio) || 0;
      } else {
        delete payload.Precio;
      }

      // Clean empty strings / nulls
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      await dispatch(crearItem(payload, MENU));
      alert("Ítem de menú creado correctamente.");
      setMenuItemData(initialMenuItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear ítem de menú:", error);
      alert(`Error al crear ítem de menú: ${error.message || "No se pudo guardar."}`);
    }
  };

  // Submit Handler for Proveedor
  const handleCrearProveedor = async () => {
    try {
      if (!newProveedorData.Nombre_Proveedor.trim()) {
        alert("Por favor ingrese el nombre del proveedor.");
        return;
      }
      await dispatch(crearProveedor(newProveedorData));
      alert("Proveedor creado correctamente.");
      setNewProveedorData(initialProveedorData);
      setFormProveedorVisible(false);
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      alert("Hubo un error al crear el proveedor.");
    }
  };

  // Clipboard & Action Handlers
  const handleActualizarPrecios = () => {
    if (!confirm("¿Estás seguro de recalcular los precios unitarios?")) return;
    dispatch(
      selectedType === ItemsAlmacen
        ? actualizarPrecioUnitario(allItems, ITEMS)
        : actualizarPrecioUnitario(allProduccion, PRODUCCION)
    );
  };

  const handleSincronizarCostosProduccion = () => {
    if (!confirm("¿Estás seguro de sincronizar los costos de producción con sus recetas?")) return;
    dispatch(sincronizarCostosProduccion());
  };

  const handleCopiarPendientes = (type) => {
    dispatch(
      copiarAlPortapapeles(
        type === ItemsAlmacen ? allItems : allProduccion,
        type === ItemsAlmacen ? "PC" : "PP",
        "Proveedor",
        allProveedores
      )
    );
  };

  const handleCopiarInfoItems = () => {
    const items = selectedType === ItemsAlmacen ? allItems : allProduccion;
    if (!items || items.length === 0) return alert("No hay ítems para copiar.");
    const headers = Object.keys(items[0]).join("\t");
    const rows = items.map((item) => Object.values(item).join("\t")).join("\n");
    navigator.clipboard.writeText(`${headers}\n${rows}`).then(() => alert("Información copiada al portapapeles."));
  };

  const handleCopyPrompt = async () => {
    await copyPromptToClipboard(selectedType, setPromptCopied);
  };

  // Parse JSON to Create Items
  const parseJsonToItem = async () => {
    if (!jsonText.trim()) return alert("Por favor inserte el JSON para procesar.");
    try {
      const parsed = JSON.parse(jsonText);
      const itemsArray = Array.isArray(parsed) ? parsed : [parsed];
      let count = 0;

      for (const item of itemsArray) {
        if (selectedType === MenuItems) {
          const mItem = {
            NombreES: item.NombreES || item.nombre || item.name,
            NombreEN: item.NombreEN || item.englishName,
            Precio: parseFloat(item.Precio || item.precio || item.price) || 0,
            DescripcionMenuES: item.DescripcionMenuES || item.descripcion,
            DescripcionMenuEN: item.DescripcionMenuEN || item.englishDescription,
            GRUPO: item.GRUPO || item.grupo || item.category,
            SUB_GRUPO: item.SUB_GRUPO || item.subgrupo,
            Foto: item.Foto || item.foto,
            Estado: item.Estado || "Activo",
          };
          Object.keys(mItem).forEach((k) => (mItem[k] === "" || mItem[k] == null) && delete mItem[k]);
          await dispatch(crearItem(mItem, MENU));
          count++;
        } else {
          let stockObj = { minimo: "", actual: "", maximo: "" };
          if (item.STOCK) {
            if (typeof item.STOCK === "object") stockObj = { ...stockObj, ...item.STOCK };
            else if (typeof item.STOCK === "string") {
              try {
                stockObj = { ...stockObj, ...JSON.parse(item.STOCK) };
              } catch (e) {}
            }
          }

          const targetTable = selectedType === ProduccionInterna ? ProduccionInterna : ItemsAlmacen;
          const newItem = {
            Nombre_del_producto: item.Nombre_del_producto || item.nombre || item.name,
            CANTIDAD: parseFloat(item.CANTIDAD || item.cantidad) || undefined,
            UNIDADES: item.UNIDADES || item.unidades,
            COSTO: parseFloat(item.COSTO || item.costo) || undefined,
            Merma: parseFloat(item.Merma || item.merma) || undefined,
            GRUPO: item.GRUPO || item.grupo,
            Area: item.Area || item.area,
            Proveedor: item.Proveedor || null,
            Estado: item.Estado || (selectedType === ProduccionInterna ? "PP" : "PC"),
            STOCK: JSON.stringify(stockObj),
          };

          if (selectedType === ItemsAlmacen) {
            newItem.COOR = parseFloat(item.COOR) || 1.05;
          }

          Object.keys(newItem).forEach((k) => (newItem[k] === "" || newItem[k] == null) && delete newItem[k]);
          await dispatch(crearItem(newItem, targetTable));
          count++;
        }
      }

      alert(`Se crearon ${count} ítems correctamente.`);
      setJsonText("");
      setJsonImportVisible(false);
    } catch (e) {
      console.error(e);
      alert("Error al procesar JSON: " + e.message);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-slate-200 space-y-5 animate-in fade-in duration-200">
      {/* HEADER: Category Tabs & Main Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">
            Acciones Rápidas ({selectedType === MenuItems ? "Menú" : selectedType === ProduccionInterna ? "Producción" : "Insumos"})
          </h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-stretch">
          <button
            type="button"
            onClick={() => handleSwitchType(MenuItems)}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedType === MenuItems
                ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChefHat className="h-3.5 w-3.5 text-blue-500" /> Menú
          </button>
          <button
            type="button"
            onClick={() => handleSwitchType(ProduccionInterna)}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedType === ProduccionInterna
                ? "bg-white text-amber-600 shadow-sm border border-amber-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="h-3.5 w-3.5 text-amber-500" /> Producción
          </button>
          <button
            type="button"
            onClick={() => handleSwitchType(ItemsAlmacen)}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedType === ItemsAlmacen
                ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5 text-emerald-500" /> Insumo
          </button>
        </div>
      </div>

      {/* TOOLBAR ACTIONS */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant={formVisible ? "default" : "outline"}
          size="sm"
          className={
            formVisible
              ? "bg-slate-800 text-white shadow-sm hover:bg-slate-900"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }
          onClick={() => setFormVisible(!formVisible)}
        >
          <PlusCircle className="h-4 w-4 mr-1.5 text-amber-400" />
          {selectedType === MenuItems
            ? "Nuevo Plato de Menú"
            : selectedType === ProduccionInterna
            ? "Nuevo Ítem de Producción"
            : "Nuevo Ítem de Almacén"}
        </Button>

        <Button
          variant={formProveedorVisible ? "default" : "outline"}
          size="sm"
          className={
            formProveedorVisible
              ? "bg-orange-600 text-white shadow-sm"
              : "border-orange-200 text-orange-700 hover:bg-orange-50"
          }
          onClick={() => setFormProveedorVisible(!formProveedorVisible)}
        >
          <UserPlus className="h-4 w-4 mr-1.5 text-orange-500" />
          Nuevo Proveedor
        </Button>

        <Button
          variant={jsonImportVisible ? "default" : "outline"}
          size="sm"
          className={
            jsonImportVisible
              ? "bg-blue-600 text-white shadow-sm"
              : "border-blue-200 text-blue-700 hover:bg-blue-50"
          }
          onClick={() => setJsonImportVisible(!jsonImportVisible)}
        >
          <Sparkles className="h-4 w-4 mr-1.5 text-blue-500" />
          Importar con IA (JSON)
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={() => setMacroAgregadorVisible(true)}
        >
          <PlusCircle className="h-4 w-4 mr-1.5 text-emerald-600" />
          Macro Agregador
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
          onClick={() => setMacroEditorVisible(true)}
        >
          <Hammer className="h-4 w-4 mr-1.5 text-purple-600" />
          Macro Editor
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
          onClick={() => setSpellCheckerVisible(true)}
        >
          <Sparkles className="h-4 w-4 mr-1.5 text-cyan-600" />
          Corrector Ortográfico
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700 hover:bg-slate-100"
          onClick={handleActualizarPrecios}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
          Recalcular
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          onClick={handleSincronizarCostosProduccion}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
          Sincronizar Costos
        </Button>
      </div>

      {/* CLIPBOARD QUICK ACCESS */}
      <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-100">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Portapapeles:</span>
        <button
          type="button"
          onClick={() => handleCopiarPendientes(ItemsAlmacen)}
          className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition flex items-center gap-1 font-medium"
        >
          <Copy className="h-3 w-3" /> Pendientes Compra
        </button>
        <button
          type="button"
          onClick={() => handleCopiarPendientes(ProduccionInterna)}
          className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1 font-medium"
        >
          <Copy className="h-3 w-3" /> Pendientes Producción
        </button>
        <button
          type="button"
          onClick={handleCopiarInfoItems}
          className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1 font-medium"
        >
          <FileText className="h-3 w-3" /> Copiar Info Tabla
        </button>
      </div>

      {/* MODAL / OVERLAY SUB-COMPONENTS */}
      {macroAgregadorVisible && (
        <MacroAgregadorItems
          onClose={() => setMacroAgregadorVisible(false)}
          currentType={selectedType}
          allProveedores={allProveedores}
        />
      )}

      {macroEditorVisible && (
        <MacroEditorItems
          onClose={() => setMacroEditorVisible(false)}
          currentType={selectedType}
          allProveedores={allProveedores}
        />
      )}

      {spellCheckerVisible && (
        <CorrectorOrtograficoModal
          onClose={() => setSpellCheckerVisible(false)}
          currentType={selectedType}
        />
      )}

      {/* JSON IA IMPORT FORM */}
      {jsonImportVisible && (
        <div className="bg-blue-50/80 p-4.5 rounded-xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" /> Importar {selectedType === MenuItems ? "Menú" : selectedType === ProduccionInterna ? "Producción" : "Insumos"} con JSON
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              {promptCopied ? "Prompt Copiado!" : "Copiar Prompt IA"}
            </Button>
          </div>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='Pegue aquí el JSON generado (ej. [{ "NombreES": "Café Latte", "Precio": 8000 }])'
            className="font-mono text-xs bg-white border-blue-200 focus:border-blue-400 h-28"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setJsonImportVisible(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={parseJsonToItem} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Hammer className="h-3.5 w-3.5 mr-1.5" /> Procesar e Insertar
            </Button>
          </div>
        </div>
      )}

      {/* FORM 1: CREAR PLATOS DE MENÚ */}
      {formVisible && selectedType === MenuItems && (
        <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 sm:p-5 rounded-xl border border-blue-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-blue-100">
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <ChefHat className="h-4.5 w-4.5 text-blue-600" />
              Nuevo Ítem de Menú / Plato
            </h4>
            <button
              onClick={() => setFormVisible(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Nombre (Español) *</label>
              <Input
                name="NombreES"
                value={menuItemData.NombreES}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                placeholder="Ej. Cappuccino Italiano"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Nombre (Inglés)</label>
              <Input
                name="NombreEN"
                value={menuItemData.NombreEN}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                placeholder="Ej. Italian Cappuccino"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Precio de Venta ($)</label>
              <Input
                type="number"
                name="Precio"
                value={menuItemData.Precio}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                placeholder="Ej. 12000"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Grupo / Categoría</label>
              <select
                name="GRUPO"
                value={menuItemData.GRUPO}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar Grupo...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">SubGrupo / Subcategoría</label>
              <select
                name="SUB_GRUPO"
                value={menuItemData.SUB_GRUPO}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar SubGrupo...</option>
                {SUB_CATEGORIES.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Estado</label>
              <select
                name="Estado"
                value={menuItemData.Estado}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ESTATUS.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Descripción (Español)</label>
              <Input
                name="DescripcionMenuES"
                value={menuItemData.DescripcionMenuES}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                placeholder="Ej. Elaborado con doble shot de espresso y leche texturizada..."
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">URL Foto</label>
              <Input
                name="Foto"
                value={menuItemData.Foto}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                placeholder="https://..."
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-blue-100">
            <Button variant="ghost" size="sm" onClick={() => setFormVisible(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearMenuItem} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar Plato en Menú
            </Button>
          </div>
        </div>
      )}

      {/* FORM 2: CREAR ÍTEM DE PRODUCCIÓN */}
      {formVisible && selectedType === ProduccionInterna && (
        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-4 sm:p-5 rounded-xl border border-amber-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-amber-100">
            <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-amber-600" />
              Nuevo Ítem de Producción Interna (Sub-recetas / Pre-preparados)
            </h4>
            <button
              onClick={() => setFormVisible(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Nombre del Producto *</label>
              <Input
                name="Nombre_del_producto"
                value={newItemData.Nombre_del_producto}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. Jarabe de Jamaica Base"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Cantidad Producida</label>
              <Input
                type="number"
                name="CANTIDAD"
                value={newItemData.CANTIDAD}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. 1000"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Unidad de Medida</label>
              <select
                name="UNIDADES"
                value={newItemData.UNIDADES}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Seleccionar Unidad...</option>
                {unidades.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Costo Total ($)</label>
              <Input
                type="number"
                name="COSTO"
                value={newItemData.COSTO}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. 25000"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Área de Trabajo</label>
              <select
                name="Area"
                value={newItemData.Area}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Seleccionar Área...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Grupo / Categoría</label>
              <select
                name="GRUPO"
                value={newItemData.GRUPO}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Seleccionar Grupo...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Marca / Submarca</label>
              <Input
                name="MARCA"
                value={newItemData.MARCA}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Marca opcional"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Merma (%)</label>
              <Input
                type="number"
                name="Merma"
                value={newItemData.Merma}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. 0.05"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Stock (Mín / Actual / Máx)</label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  name="minimo"
                  value={newItemData.STOCK.minimo}
                  onChange={handleStockChange}
                  placeholder="Mín"
                  className="bg-white text-xs px-2"
                />
                <Input
                  type="number"
                  name="actual"
                  value={newItemData.STOCK.actual}
                  onChange={handleStockChange}
                  placeholder="Actual"
                  className="bg-white text-xs px-2"
                />
                <Input
                  type="number"
                  name="maximo"
                  value={newItemData.STOCK.maximo}
                  onChange={handleStockChange}
                  placeholder="Máx"
                  className="bg-white text-xs px-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-amber-100">
            <Button variant="ghost" size="sm" onClick={() => setFormVisible(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearItem} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar Ítem de Producción
            </Button>
          </div>
        </div>
      )}

      {/* FORM 3: CREAR ÍTEM DE ALMACÉN / INSUMO */}
      {formVisible && selectedType === ItemsAlmacen && (
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4 sm:p-5 rounded-xl border border-emerald-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-emerald-100">
            <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
              <LayoutGrid className="h-4.5 w-4.5 text-emerald-600" />
              Nuevo Ítem de Almacén / Insumo Directo
            </h4>
            <button
              onClick={() => setFormVisible(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Nombre del Producto *</label>
              <Input
                name="Nombre_del_producto"
                value={newItemData.Nombre_del_producto}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. Leche Entera Alquería"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Cantidad del Empaque</label>
              <Input
                type="number"
                name="CANTIDAD"
                value={newItemData.CANTIDAD}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. 1000"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Unidad de Medida</label>
              <select
                name="UNIDADES"
                value={newItemData.UNIDADES}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar Unidad...</option>
                {unidades.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Costo Compra ($)</label>
              <Input
                type="number"
                name="COSTO"
                value={newItemData.COSTO}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. 4500"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Proveedor</label>
              <select
                name="Proveedor"
                value={newItemData.Proveedor}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar Proveedor...</option>
                {allProveedores.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.Nombre_Proveedor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Área de Destino</label>
              <select
                name="Area"
                value={newItemData.Area}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar Área...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Grupo / Categoría</label>
              <select
                name="GRUPO"
                value={newItemData.GRUPO}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar Grupo...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Marca</label>
              <Input
                name="MARCA"
                value={newItemData.MARCA}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="Ej. Alquería"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Factor COOR</label>
              <Input
                type="number"
                name="COOR"
                value={newItemData.COOR}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="1.05"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Merma (%)</label>
              <Input
                type="number"
                name="Merma"
                value={newItemData.Merma}
                onChange={(e) => handleInputChange(e, setNewItemData)}
                placeholder="0"
                className="bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Stock (Mín / Actual / Máx)</label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  name="minimo"
                  value={newItemData.STOCK.minimo}
                  onChange={handleStockChange}
                  placeholder="Mín"
                  className="bg-white text-xs px-2"
                />
                <Input
                  type="number"
                  name="actual"
                  value={newItemData.STOCK.actual}
                  onChange={handleStockChange}
                  placeholder="Actual"
                  className="bg-white text-xs px-2"
                />
                <Input
                  type="number"
                  name="maximo"
                  value={newItemData.STOCK.maximo}
                  onChange={handleStockChange}
                  placeholder="Máx"
                  className="bg-white text-xs px-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-emerald-100">
            <Button variant="ghost" size="sm" onClick={() => setFormVisible(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearItem} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar Ítem de Almacén
            </Button>
          </div>
        </div>
      )}

      {/* FORM 4: CREAR NUEVO PROVEEDOR */}
      {formProveedorVisible && (
        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/40 p-4 sm:p-5 rounded-xl border border-orange-200 shadow-sm animate-in fade-in duration-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-orange-200/60">
            <h4 className="font-bold text-sm text-orange-950 flex items-center gap-2">
              <UserPlus className="h-4.5 w-4.5 text-orange-600" />
              Nuevo Proveedor
            </h4>
            <button
              onClick={() => setFormProveedorVisible(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Nombre del Proveedor *</label>
              <Input
                name="Nombre_Proveedor"
                value={newProveedorData.Nombre_Proveedor}
                onChange={(e) => handleInputChange(e, setNewProveedorData)}
                placeholder="Nombre comercial"
                className="bg-white border-orange-200 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Contacto (Nombre)</label>
              <Input
                name="Contacto_Nombre"
                value={newProveedorData.Contacto_Nombre}
                onChange={(e) => handleInputChange(e, setNewProveedorData)}
                placeholder="Nombre del asesor / contacto"
                className="bg-white border-orange-200 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Teléfono / Celular</label>
              <Input
                name="Contacto_Numero"
                value={newProveedorData.Contacto_Numero}
                onChange={(e) => handleInputChange(e, setNewProveedorData)}
                placeholder="Número de contacto"
                className="bg-white border-orange-200 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Dirección</label>
              <Input
                name="Direccion"
                value={newProveedorData.Direccion}
                onChange={(e) => handleInputChange(e, setNewProveedorData)}
                placeholder="Dirección física"
                className="bg-white border-orange-200 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">NIT / Cédula</label>
              <Input
                name="NIT/CC"
                value={newProveedorData["NIT/CC"]}
                onChange={(e) => handleInputChange(e, setNewProveedorData)}
                placeholder="Documento de identidad / NIT"
                className="bg-white border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-orange-200/60">
            <Button variant="ghost" size="sm" onClick={() => setFormProveedorVisible(false)} className="text-orange-900 hover:bg-orange-100/50">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearProveedor} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar Proveedor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccionesRapidas;
