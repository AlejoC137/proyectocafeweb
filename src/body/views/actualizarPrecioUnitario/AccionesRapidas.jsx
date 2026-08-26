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
import { Copy, RefreshCw, PlusCircle, X, Save, ShoppingCart, Hammer, FileText, UserPlus, FileJson, Check, SpellCheck, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard, getPromptByType } from "../../../utils/prompts";
import MacroEditorItems from "./MacroEditorItems";
import MacroAgregadorItems from "./MacroAgregadorItems";
import CorrectorOrtograficoModal from "../inventario/CorrectorOrtograficoModal";
import JsonImportReviewModal from "./JsonImportReviewModal";
import { useDeepSeek } from "@/hooks/useDeepSeek";

function AccionesRapidas({ currentType: propType }) {
  const currentType = propType === "ITEMS" ? ITEMS : propType;

  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allProveedores = useSelector((state) => state.Proveedores || []);

  useEffect(() => {
    if (!allItems || allItems.length === 0) dispatch(getAllFromTable(ITEMS));
    if (!allProduccion || allProduccion.length === 0) dispatch(getAllFromTable(PRODUCCION));
    if (!allProveedores || allProveedores.length === 0) dispatch(getAllFromTable("Proveedores"));
  }, [dispatch]);

  const [formVisible, setFormVisible] = useState(false);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [jsonImportVisible, setJsonImportVisible] = useState(false);
  
  const [aiContextInput, setAiContextInput] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [macroEditorVisible, setMacroEditorVisible] = useState(false);
  const [macroAgregadorVisible, setMacroAgregadorVisible] = useState(false);
  const [spellCheckerVisible, setSpellCheckerVisible] = useState(false);
  const [jsonItemsToReview, setJsonItemsToReview] = useState(null);
  const [showManualJson, setShowManualJson] = useState(false);

  const { loading: aiLoading, error: aiError, query: queryDeepSeek } = useDeepSeek();

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

  const parseJsonToItem = async (overrideStr = null) => {
    try {
      const strToParse = typeof overrideStr === 'string' ? overrideStr : jsonText;
      let parsed = typeof strToParse === 'object' ? strToParse : JSON.parse(strToParse);
      const isArray = Array.isArray(parsed);
      const itemsToProcess = isArray ? parsed : [parsed];

      setJsonItemsToReview(itemsToProcess);
      setJsonImportVisible(false);
    } catch (e) {
      alert("Error al leer JSON: " + e.message);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiContextInput.trim()) {
      alert("Ingresa los datos del ítem, factura o lista de productos.");
      return;
    }

    const basePrompt = getPromptByType(currentType);
    const suppliersContext = (allProveedores || []).map(p => ({ _id: p._id, Nombre_Proveedor: p.Nombre_Proveedor }));

    const systemPrompt = `${basePrompt}

## LISTA DE PROVEEDORES REGISTRADOS EN EL SISTEMA
${JSON.stringify(suppliersContext)}

REGLA CRÍTICA DE ASIGNACIÓN DE PROVEEDOR:
Para cada producto, identifica la marca, vendor o proveedor. Si coincide o se relaciona con algún proveedor de la lista de arriba, asigna exactamente su "_id" en la propiedad "Proveedor". Si no hay coincidencia directa en la lista, puedes colocar el nombre de la marca/proveedor en "MARCA" y dejar "Proveedor" como null.`;

    const userMessage = `Extrae o crea los datos de ítems para el inventario a partir de la siguiente información:

[DATOS SUMINISTRADOS]
${aiContextInput}`;

    const res = await queryDeepSeek({
      systemPrompt,
      userMessage,
      temperature: 0.1
    });

    if (res) {
      const rawJson = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      setJsonText(rawJson);
      parseJsonToItem(rawJson);
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

      await dispatch(getAllFromTable(currentType));
      alert(`🎉 ¡${count} ítem(s) guardado(s) exitosamente!`);
    } catch (e) {
      console.error(e);
      alert("Error al guardar ítems: " + e.message);
    }
  };

  const handleInputChange = (e, stateSetter) => {
    const { name, value } = e.target;
    stateSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e, parentKey, childKey, stateSetter) => {
    const { value } = e.target;
    stateSetter(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      if (currentType === MenuItems) {
        if (!menuItemData.NombreES) return alert("Falta el Nombre del Producto.");
        await dispatch(crearItem(menuItemData, MENU));
        setMenuItemData(initialMenuItemData);
      } else {
        if (!newItemData.Nombre_del_producto) return alert("Falta el Nombre del Producto.");
        
        const payload = {
          ...newItemData,
          STOCK: JSON.stringify(newItemData.STOCK),
        };
        await dispatch(crearItem(payload, currentType));
        setNewItemData(initialItemData);
      }

      await dispatch(getAllFromTable(currentType));
      alert("🎉 Ítem creado exitosamente");
      setFormVisible(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear ítem: " + err.message);
    }
  };

  const handleCreateProveedor = async (e) => {
    e.preventDefault();
    if (!newProveedorData.Nombre_Proveedor) return alert("El nombre del proveedor es obligatorio.");

    try {
      await dispatch(crearProveedor(newProveedorData));
      await dispatch(getAllFromTable("Proveedores"));
      alert("🎉 Proveedor creado exitosamente");
      setNewProveedorData(initialProveedorData);
      setFormProveedorVisible(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear proveedor: " + err.message);
    }
  };

  const handleActualizarPrecios = async () => {
    if (!confirm("¿Deseas recalcular los precios unitarios de la lista completa?")) return;
    try {
      const listToUpdate = currentType === ItemsAlmacen ? allItems : allProduccion;
      await dispatch(actualizarPrecioUnitario(listToUpdate, currentType));
      await dispatch(getAllFromTable(currentType));
      alert("🎉 Precios unitarios recalculados.");
    } catch (err) {
      console.error(err);
      alert("Error al recalcular precios.");
    }
  };

  const handleSincronizarCostosProduccion = async () => {
    if (!confirm("¿Deseas sincronizar los costos de las recetas en Producción Interna?")) return;
    try {
      await dispatch(sincronizarCostosProduccion());
      await dispatch(getAllFromTable(PRODUCCION));
      alert("🎉 Recetas y costos de producción sincronizados.");
    } catch (err) {
      console.error(err);
      alert("Error al sincronizar costos.");
    }
  };

  const handleCopyPrompt = async () => {
    await copyPromptToClipboard(currentType === MenuItems ? 'MENU_LUNCH' : ITEMS, setPromptCopied);
  };

  return (
    <div className="flex flex-col gap-3 my-3 font-sans">
      {/* BARRA DE ACCIONES RAPIDAS */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
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
            <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
            Importar con IA
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

      {/* JSON & AI IMPORT SECTION */}
      {jsonImportVisible && (
        <div className="bg-blue-50/90 p-4 rounded-xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200 shadow-sm flex flex-col gap-3">
          {/* SECCIÓN PRINCIPAL IA DIRECTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-blue-900">Importación Inteligente con IA (DeepSeek)</h4>
                <p className="text-xs text-blue-700">Pega los datos del ítem, factura o lista y la IA estructurará todo para revisión.</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyPrompt}
              className="text-xs text-blue-700 hover:bg-blue-100 flex items-center gap-1 h-7"
            >
              {promptCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{promptCopied ? "Prompt Copiado" : "Copiar Prompt Manual"}</span>
            </Button>
          </div>

          <Textarea
            value={aiContextInput}
            onChange={(e) => setAiContextInput(e.target.value)}
            placeholder="Pega el texto, ficha técnica o mensaje del ítem (ej: 'Queso Mozzarella Colanta bulto 2.5kg costo 42000 proveedor Fruver')"
            className="font-sans text-xs bg-white h-24 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />

          {aiError && <p className="text-xs font-semibold text-red-600">{aiError}</p>}

          <Button
            onClick={handleGenerateAI}
            disabled={aiLoading || !aiContextInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 py-2 rounded-lg shadow-xs"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extrayendo y Formateando con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generar e Importar con IA Directa</span>
              </>
            )}
          </Button>

          {/* SECUNDARIO: PEGAR JSON MANUALMENTE */}
          <div className="border border-blue-200 rounded-lg overflow-hidden bg-white mt-1">
            <button
              type="button"
              onClick={() => setShowManualJson(!showManualJson)}
              className="w-full bg-blue-50/50 px-3 py-2 flex items-center justify-between text-xs font-semibold text-blue-800 hover:bg-blue-100/50 transition-colors"
            >
              <span>Opciones avanzadas: Pegar código JSON manualmente</span>
              {showManualJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showManualJson && (
              <div className="p-3 flex flex-col gap-2">
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='{ "Nombre_del_producto": "...", "COSTO": 1000 ... }'
                  className="font-mono text-xs bg-slate-50 h-28 border-slate-200"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setJsonImportVisible(false)} className="text-slate-600">Cancelar</Button>
                  <Button size="sm" onClick={() => parseJsonToItem(jsonText)} disabled={!jsonText.trim()} className="bg-slate-700 hover:bg-slate-800 text-white font-medium">
                    Procesar JSON Manual &rarr;
                  </Button>
                </div>
              </div>
            )}
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

              <Input name="MARCA" value={newItemData.MARCA} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Marca" />

              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={newItemData.STOCK.minimo} onChange={(e) => handleNestedInputChange(e, 'STOCK', 'minimo', setNewItemData)} />
                <Input type="number" placeholder="Max" value={newItemData.STOCK.maximo} onChange={(e) => handleNestedInputChange(e, 'STOCK', 'maximo', setNewItemData)} />
                <Input type="number" placeholder="Act" value={newItemData.STOCK.actual} onChange={(e) => handleNestedInputChange(e, 'STOCK', 'actual', setNewItemData)} />
              </div>

              {currentType === ItemsAlmacen && (
                <Input type="number" name="COOR" value={newItemData.COOR} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="COOR (1.05)" />
              )}
            </div>
          ) : (
            /* FORMULARIO PLATOS MENU */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input name="NombreES" value={menuItemData.NombreES} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Nombre ES" />
              <Input name="NombreEN" value={menuItemData.NombreEN} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Nombre EN" />
              <Input type="number" name="Precio" value={menuItemData.Precio} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Precio Venta" />

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="GRUPO" value={menuItemData.GRUPO} onChange={(e) => handleInputChange(e, setMenuItemData)}>
                <option value="">Grupo Menú...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="SUB_GRUPO" value={menuItemData.SUB_GRUPO} onChange={(e) => handleInputChange(e, setMenuItemData)}>
                <option value="">SubGrupo Menú...</option>
                {SUB_CATEGORIES.map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </select>

              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                name="Estado" value={menuItemData.Estado} onChange={(e) => handleInputChange(e, setMenuItemData)}>
                {ESTATUS.map(est => <option key={est} value={est}>{est}</option>)}
              </select>

              <div className="md:col-span-2">
                <Input name="DescripcionMenuES" value={menuItemData.DescripcionMenuES} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Descripción ES" />
              </div>
              <Input name="Foto" value={menuItemData.Foto} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="URL Foto" />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setFormVisible(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateItem} className="bg-slate-800 hover:bg-slate-900 text-white font-medium">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar Ítem
            </Button>
          </div>
        </div>
      )}

      {/* FORMULARIO PROVEEDOR */}
      {formProveedorVisible && (
        <div className="bg-orange-50/70 p-4.5 rounded-xl border border-orange-200 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
          <h4 className="font-bold text-sm text-orange-950 mb-3.5 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-orange-600" /> Nuevo Proveedor
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input name="Nombre_Proveedor" value={newProveedorData.Nombre_Proveedor} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder="Nombre del Proveedor *" className="bg-white" />
            <Input name="Contacto_Nombre" value={newProveedorData.Contacto_Nombre} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder="Contacto (Nombre)" className="bg-white" />
            <Input name="Contacto_Numero" value={newProveedorData.Contacto_Numero} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder="Teléfono / Celular" className="bg-white" />
            <Input name="Direccion" value={newProveedorData.Direccion} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder="Dirección" className="bg-white" />
            <Input name="NIT/CC" value={newProveedorData["NIT/CC"]} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder="NIT o Cédula" className="bg-white" />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setFormProveedorVisible(false)} className="text-orange-900 hover:bg-orange-100/50">Cancelar</Button>
            <Button size="sm" onClick={handleCreateProveedor} className="bg-orange-600 hover:bg-orange-700 text-white font-medium">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar Proveedor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccionesRapidas;