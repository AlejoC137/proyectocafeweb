import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem, sincronizarCostosProduccion } from "../../../redux/actions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RefreshCw, PlusCircle, X, Save, ShoppingCart, Hammer, FileText, UserPlus, FileJson, Check, SpellCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard } from "../../../utils/prompts";
import MacroEditorItems from "./MacroEditorItems";
import MacroAgregadorItems from "./MacroAgregadorItems";
import CorrectorOrtograficoModal from "../inventario/CorrectorOrtograficoModal";
import JsonImportReviewModal from "./JsonImportReviewModal";

function AccionesRapidas({ currentType: propType }) {
  // Normalize type: "ITEMS" string -> ItemsAlmacen constant
  const currentType = propType === "ITEMS" ? ITEMS : propType;

  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allProveedores = useSelector((state) => state.Proveedores || []);

  // Fetch missing data on mount
  useEffect(() => {
    if (!allItems || allItems.length === 0) dispatch(getAllFromTable(ITEMS));
    if (!allProduccion || allProduccion.length === 0) dispatch(getAllFromTable(PRODUCCION));
    if (!allProveedores || allProveedores.length === 0) dispatch(getAllFromTable("Proveedores"));
  }, [dispatch]);

  // States
  const [formVisible, setFormVisible] = useState(false);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [jsonImportVisible, setJsonImportVisible] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [macroEditorVisible, setMacroEditorVisible] = useState(false);
  const [macroAgregadorVisible, setMacroAgregadorVisible] = useState(false);
  const [spellCheckerVisible, setSpellCheckerVisible] = useState(false);
  const [jsonItemsToReview, setJsonItemsToReview] = useState(null);

  // Initial Data
  const initialItemData = {
    Nombre_del_producto: "", Proveedor: "", Estado: "OK", Area: "", CANTIDAD: "", UNIDADES: "", COSTO: "",
    STOCK: { minimo: "", maximo: "", actual: "" }, GRUPO: "", MARCA: "", Merma: 0, ALMACENAMIENTO: "",
    ...(currentType === ItemsAlmacen && { COOR: "1.05" }),
  };
  const initialProveedorData = { Nombre_Proveedor: "", Contacto_Nombre: "", Contacto_Numero: "", Direccion: "", "NIT/CC": "" };
  const initialMenuItemData = { NombreES: "", NombreEN: "", Precio: 0, DescripcionMenuES: "", DescripcionMenuEN: "", GRUPO: "", SUB_GRUPO: "", Foto: "", Estado: "Activo" };

  const [newItemData, setNewItemData] = useState(initialItemData);
  const [newProveedorData, setNewProveedorData] = useState(initialProveedorData);
  const [menuItemData, setMenuItemData] = useState(initialMenuItemData);

  // Helpers
  const parseJsonToItem = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const isArray = Array.isArray(parsed);
      const itemsToProcess = isArray ? parsed : [parsed];

      setJsonItemsToReview(itemsToProcess);
      setJsonImportVisible(false);
    } catch (e) {
      alert("Error al leer JSON: " + e.message);
    }
  };

  const handleSaveImportedItems = async (reviewedItems) => {
    try {
      let count = 0;
      for (const item of reviewedItems) {
        if (currentType === MenuItems) {
          const menuItemData = {
            NombreES: item.NombreES || item.nombre || item.name,
            NombreEN: item.NombreEN || item.englishName,
            Precio: item.Precio || item.price || item.precio,
            DescripcionMenuES: item.DescripcionMenuES || item.description,
            DescripcionMenuEN: item.DescripcionMenuEN || item.englishDescription,
            GRUPO: item.GRUPO || item.category || item.grupo,
            SUB_GRUPO: item.SUB_GRUPO || item.subcategory,
            Foto: item.Foto || item.image,
            Estado: item.Estado || "Activo"
          };
          Object.keys(menuItemData).forEach(key => { if (menuItemData[key] === "" || menuItemData[key] == null) delete menuItemData[key]; });
          await dispatch(crearItem(menuItemData, MENU));
          count++;
        } else {
          let stockData = { minimo: 0, maximo: 0, actual: 0 };
          if (item.STOCK) {
            if (typeof item.STOCK === 'object') stockData = { ...stockData, ...item.STOCK };
            else if (typeof item.STOCK === 'string') {
              try { stockData = { ...stockData, ...JSON.parse(item.STOCK) }; } catch (e) { }
            }
          }

          let providerId = item.Proveedor;
          if (item.Proveedor && typeof item.Proveedor === 'string') {
            const provName = item.Proveedor.toLowerCase();
            const found = allProveedores.find(p => p.Nombre_Proveedor.toLowerCase().includes(provName));
            if (found) providerId = found._id;
          }

          let newItemToCreate = {
            Nombre_del_producto: item.Nombre_del_producto || item.nombre || item.name,
            CANTIDAD: item.CANTIDAD || item.cantidad || item.quantity,
            UNIDADES: item.UNIDADES || item.unidades || item.units,
            COSTO: item.COSTO || item.costo || item.cost,
            Merma: item.Merma || item.merma || 0,
            GRUPO: item.GRUPO || item.grupo || item.category,
            Area: item.Area || item.area,
            ALMACENAMIENTO: typeof item.ALMACENAMIENTO === 'object' ? JSON.stringify(item.ALMACENAMIENTO) : (item.ALMACENAMIENTO || item.storage || ""),
            Proveedor: providerId || null,
            Estado: item.Estado || "OK",
            STOCK: JSON.stringify(stockData),
          };

          if (currentType === ItemsAlmacen) {
            newItemToCreate.COOR = item.COOR || "1.05";
          }

          Object.keys(newItemToCreate).forEach(key => { if (newItemToCreate[key] === "" || newItemToCreate[key] == null) delete newItemToCreate[key]; });
          await dispatch(crearItem(newItemToCreate, currentType));
          count++;
        }
      }

      alert(`Se importaron exitosamente ${count} ítems.`);
      setJsonText("");
      setJsonItemsToReview(null);
    } catch (e) {
      alert("Error al guardar ítems: " + e.message);
    }
  };

  // Handlers
  const handleActualizarPrecios = () => {
    if (!confirm("¿Estás seguro de recalcular los precios unitarios?")) return;
    dispatch(currentType === ITEMS ? actualizarPrecioUnitario(allItems, ITEMS) : actualizarPrecioUnitario(allProduccion, PRODUCCION));
  };

  const handleSincronizarCostosProduccion = () => {
    if (!confirm("¿Estás seguro de sincronizar los costos de producción con sus recetas? Esto actualizará el COSTO de los ítems.")) return;
    dispatch(sincronizarCostosProduccion());
  };

  const handleCopiarPendientes = (type) => {
    dispatch(copiarAlPortapapeles(type === ItemsAlmacen ? allItems : allProduccion, type === ItemsAlmacen ? "PC" : "PP", "Proveedor", allProveedores));
  };

  const handleCopiarInfoItems = () => {
    const items = currentType === ITEMS ? allItems : allProduccion;
    if (items.length === 0) return alert("No hay ítems para copiar.");
    const headers = Object.keys(items[0]).join("\t");
    const rows = items.map(item => Object.values(item).join("\t")).join("\n");
    navigator.clipboard.writeText(`${headers}\n${rows}`).then(() => alert("Copiado al portapapeles."));
  };

  const handleCopyPrompt = async () => {
    await copyPromptToClipboard(currentType, setPromptCopied);
  };

  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setNewItemData((prev) => ({ ...prev, STOCK: { ...prev.STOCK, [name]: value } }));
  };

  const handleCrearItem = async () => {
    try {
      const itemData = { ...newItemData, STOCK: JSON.stringify(newItemData.STOCK), COOR: currentType === ItemsAlmacen ? "1.05" : undefined };
      if (currentType === ProduccionInterna) delete itemData.COOR;
      Object.keys(itemData).forEach(key => { if (itemData[key] === "" || itemData[key] === null) delete itemData[key]; });
      await dispatch(crearItem(itemData, currentType));
      alert("Ítem creado correctamente."); setNewItemData(initialItemData); setFormVisible(false);
    } catch (e) { console.error(e); alert("Error al crear ítem."); }
  };

  const handleCrearMenuItem = async () => {
    try {
      const menuItem = { ...menuItemData };
      Object.keys(menuItem).forEach(key => { if (menuItem[key] === "") delete menuItem[key]; });
      await dispatch(crearItem(menuItem, MENU));
      alert("Ítem de menú creado."); setMenuItemData(initialMenuItemData); setFormVisible(false);
    } catch (e) { console.error(e); alert("Error al crear ítem menú."); }
  };

  const handleCrearProveedor = async () => {
    try {
      await dispatch(crearProveedor(newProveedorData));
      alert("Proveedor creado."); setNewProveedorData(initialProveedorData); setFormProveedorVisible(false);
    } catch (e) { console.error(e); alert("Error al crear proveedor."); }
  };

  return (
    <div className="bg-slate-50/90 p-2 rounded-xl border border-slate-200 shadow-2xs space-y-2">

      {/* UNIFIED COMPACT TOOLBAR ROW */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* SECTION 1: PORTAPAPELES */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1">
            📋 Portapapeles:
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCopiarPendientes(ItemsAlmacen)} 
            className="h-7 text-[11px] font-semibold px-2 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 transition-colors"
          >
            <Copy className="h-3 w-3 mr-1 text-emerald-600" /> Pendientes Compra
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCopiarPendientes(ProduccionInterna)} 
            className="h-7 text-[11px] font-semibold px-2 text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100/80 transition-colors"
          >
            <Copy className="h-3 w-3 mr-1 text-amber-600" /> Pendientes Producción
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopiarInfoItems} 
            className="h-7 text-[11px] font-semibold px-2 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100/80 transition-colors"
          >
            <FileText className="h-3 w-3 mr-1 text-blue-600" /> Copiar Info
          </Button>
        </div>

        {/* SECTION 2: CREACIÓN */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wide flex items-center gap-1">
            ➕ Creación:
          </span>
          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[11px] font-semibold px-2 transition-all ${
              formVisible 
                ? "bg-slate-800 text-white border-slate-800" 
                : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
            }`}
            onClick={() => setFormVisible(!formVisible)}
          >
            <PlusCircle className="h-3 w-3 mr-1" />
            {currentType === MenuItems ? "Nuevo Plato" : "Nuevo Ítem"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[11px] font-semibold px-2 transition-all ${
              formProveedorVisible 
                ? "bg-orange-600 text-white border-orange-600" 
                : "border-orange-200 text-orange-700 bg-orange-50/40 hover:bg-orange-100/70"
            }`}
            onClick={() => setFormProveedorVisible(!formProveedorVisible)}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Nuevo Proveedor
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[11px] font-semibold px-2 transition-all ${
              jsonImportVisible 
                ? "bg-blue-600 text-white border-blue-600" 
                : "border-blue-200 text-blue-700 bg-blue-50/40 hover:bg-blue-100/70"
            }`}
            onClick={() => setJsonImportVisible(!jsonImportVisible)}
          >
            <FileJson className="h-3 w-3 mr-1" />
            Importar JSON
          </Button>
        </div>

        {/* SECTION 3: HERRAMIENTAS & CALCULOS */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black text-violet-800 uppercase tracking-wide flex items-center gap-1">
            🛠️ Herramientas:
          </span>
          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[11px] font-semibold px-2 transition-all ${
              macroAgregadorVisible 
                ? "bg-emerald-600 text-white border-emerald-600" 
                : "border-emerald-200 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-100/70"
            }`}
            onClick={() => setMacroAgregadorVisible(true)}
          >
            <PlusCircle className="h-3 w-3 mr-1" />
            Macro Agregador
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[11px] font-semibold px-2 transition-all ${
              macroEditorVisible 
                ? "bg-amber-600 text-white border-amber-600" 
                : "border-amber-200 text-amber-700 bg-amber-50/40 hover:bg-amber-100/70"
            }`}
            onClick={() => setMacroEditorVisible(true)}
          >
            <Hammer className="h-3 w-3 mr-1" />
            Macro Editor
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[11px] font-semibold px-2 transition-all ${
              spellCheckerVisible 
                ? "bg-indigo-600 text-white border-indigo-600" 
                : "border-indigo-200 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-100/70"
            }`}
            onClick={() => setSpellCheckerVisible(true)}
          >
            <SpellCheck className="h-3 w-3 mr-1" />
            Corrector
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] font-semibold px-2 border-rose-200 text-rose-700 bg-rose-50/40 hover:bg-rose-100/70 transition-colors"
            onClick={handleActualizarPrecios}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Recalcular
          </Button>

          {currentType === ProduccionInterna && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] font-semibold px-2 border-purple-200 text-purple-700 bg-purple-50/40 hover:bg-purple-100/70 transition-colors"
              onClick={handleSincronizarCostosProduccion}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sincronizar Costos
            </Button>
          )}
        </div>
      </div>

      {macroAgregadorVisible && (
        <MacroAgregadorItems
          onClose={() => setMacroAgregadorVisible(false)}
          currentType={currentType}
          allProveedores={allProveedores}
        />
      )}

      {macroEditorVisible && (
        <MacroEditorItems
          onClose={() => setMacroEditorVisible(false)}
          currentType={currentType}
        />
      )}

      {spellCheckerVisible && (
        <CorrectorOrtograficoModal
          onClose={() => setSpellCheckerVisible(false)}
          currentType={currentType}
        />
      )}

      {jsonItemsToReview && (
        <JsonImportReviewModal
          items={jsonItemsToReview}
          onClose={() => setJsonItemsToReview(null)}
          onSave={handleSaveImportedItems}
          currentType={currentType}
          allProveedores={allProveedores}
        />
      )}

      {/* JSON IMPORT SECTION */}
      {jsonImportVisible && (
        <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <FileJson className="h-4 w-4 text-blue-600" /> Importar desde JSON
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 text-xs h-7 px-2.5 border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
              title="Copia instrucciones para IA que generan JSON compatible"
            >
              {promptCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar Prompt IA</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-blue-700 mb-2.5">
            Pega aquí el objeto JSON del producto (ej. desde Claude/GPT). El sistema intentará autocompletar el formulario.
          </p>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{ "nombre": "...", "costo": 1000 ... }'
            className="font-mono text-xs bg-white mb-3 h-32 border-blue-200 focus:border-blue-400"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setJsonImportVisible(false)} className="text-blue-700 hover:text-blue-900 hover:bg-blue-100/50">Cancelar</Button>
            <Button size="sm" onClick={parseJsonToItem} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Hammer className="h-3.5 w-3.5 mr-1.5" /> Procesar JSON
            </Button>
          </div>
        </div>
      )}

      {/* FORMS */}
      {formVisible && (
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
          <h4 className="font-bold text-sm text-slate-800 mb-3.5 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-slate-600" />
            {currentType === MenuItems ? "Nuevo Ítem de Menú" : "Nuevo Ítem de Almacén/Producción"}
          </h4>

          {currentType !== MenuItems ? (
            /* FORMULARIO INSUMOS/PRODUCCION */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input name="Nombre_del_producto" value={newItemData.Nombre_del_producto} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Nombre del Producto" />
              <Input type="number" name="CANTIDAD" value={newItemData.CANTIDAD} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Cantidad" />

              <div className="flex gap-2">
                <Input type="number" name="COSTO" value={newItemData.COSTO} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Costo Total" />
                <Input type="number" name="Merma" value={newItemData.Merma} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Merma (0.1)" title="Merma" className="w-24" />
              </div>

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="UNIDADES" value={newItemData.UNIDADES} onChange={(e) => handleInputChange(e, setNewItemData)}>
                <option value="">Unidad...</option>
                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
              </select>

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="Proveedor" value={newItemData.Proveedor} onChange={(e) => handleInputChange(e, setNewItemData)}>
                <option value="">Proveedor...</option>
                {allProveedores.map(p => <option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>)}
              </select>

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="Area" value={newItemData.Area} onChange={(e) => handleInputChange(e, setNewItemData)}>
                <option value="">Área...</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="GRUPO" value={newItemData.GRUPO} onChange={(e) => handleInputChange(e, setNewItemData)}>
                <option value="">Grupo...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="flex gap-2 col-span-1 md:col-span-2 lg:col-span-3">
                <Input name="minimo" value={newItemData.STOCK.minimo} onChange={handleStockChange} placeholder="Stock Mín" title="Stock Min" className="w-1/3" />
                <Input name="actual" value={newItemData.STOCK.actual} onChange={handleStockChange} placeholder="Stock Actual" title="Stock Actual" className="w-1/3" />
                <Input name="maximo" value={newItemData.STOCK.maximo} onChange={handleStockChange} placeholder="Stock Máx" title="Stock Max" className="w-1/3" />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-2">
                <Button onClick={handleCrearItem} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                  <Save className="h-4 w-4 mr-2" /> Guardar Ítem
                </Button>
              </div>
            </div>
          ) : (
            /* FORMULARIO MENU */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input name="NombreES" value={menuItemData.NombreES} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Nombre (Español)" />
              <Input name="NombreEN" value={menuItemData.NombreEN} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Nombre (Inglés)" />
              <Input type="number" name="Precio" value={menuItemData.Precio} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Precio Venta" />

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="GRUPO" value={menuItemData.GRUPO} onChange={(e) => handleInputChange(e, setMenuItemData)}>
                <option value="">Grupo...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="col-span-1 md:col-span-2">
                <Button onClick={handleCrearMenuItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <Save className="h-4 w-4 mr-2" /> Guardar Plato
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {formProveedorVisible && (
        <div className="bg-orange-50/80 p-4.5 rounded-xl border border-orange-200 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
          <h4 className="font-bold text-sm text-orange-900 mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-orange-600" /> Nuevo Proveedor
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(initialProveedorData).map(k => (
              <Input key={k} name={k} value={newProveedorData[k]} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder={k.replace(/_/g, " ")} className="bg-white border-orange-200 focus:border-orange-400" />
            ))}
            <div className="col-span-1 md:col-span-2 pt-2">
              <Button onClick={handleCrearProveedor} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium">
                <Save className="h-4 w-4 mr-2" /> Guardar Proveedor
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AccionesRapidas;