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
import { Copy, RefreshCw, PlusCircle, X, Save, ShoppingCart, Hammer, FileText, UserPlus, FileJson, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard } from "../../../utils/prompts";

function AccionesRapidas({ currentType: propType }) {
  // Normalize type: "ITEMS" string -> ItemsAlmacen constant
  const currentType = propType === "ITEMS" ? ITEMS : propType;

  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allProveedores = useSelector((state) => state.Proveedores);

  // States
  const [formVisible, setFormVisible] = useState(false);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [jsonImportVisible, setJsonImportVisible] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);

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
  const parseJsonToItem = () => {
    try {
      const parsed = JSON.parse(jsonText);

      if (currentType === MenuItems) {
        setMenuItemData(prev => ({
          ...prev,
          NombreES: parsed.NombreES || parsed.nombre || parsed.name || prev.NombreES,
          NombreEN: parsed.NombreEN || parsed.englishName || prev.NombreEN,
          Precio: parsed.Precio || parsed.price || parsed.precio || prev.Precio,
          DescripcionMenuES: parsed.DescripcionMenuES || parsed.description || prev.DescripcionMenuES,
          GRUPO: parsed.GRUPO || parsed.category || parsed.grupo || prev.GRUPO,
          SUB_GRUPO: parsed.SUB_GRUPO || parsed.subcategory || prev.SUB_GRUPO,
          Foto: parsed.Foto || parsed.image || prev.Foto,
        }));
        alert("Datos cargados al formulario de Menú.");
      } else {
        // Items / Produccion
        let stockData = { ...newItemData.STOCK };
        if (parsed.STOCK) {
          if (typeof parsed.STOCK === 'object') stockData = { ...stockData, ...parsed.STOCK };
        }

        // Try to find provider ID by name
        let providerId = newItemData.Proveedor;
        if (parsed.Proveedor) {
          const provName = parsed.Proveedor.toLowerCase();
          const found = allProveedores.find(p => p.Nombre_Proveedor.toLowerCase().includes(provName));
          if (found) providerId = found._id;
        }

        setNewItemData(prev => ({
          ...prev,
          Nombre_del_producto: parsed.Nombre_del_producto || parsed.nombre || parsed.name || prev.Nombre_del_producto,
          CANTIDAD: parsed.CANTIDAD || parsed.cantidad || parsed.quantity || prev.CANTIDAD,
          UNIDADES: parsed.UNIDADES || parsed.unidades || parsed.units || prev.UNIDADES,
          COSTO: parsed.COSTO || parsed.costo || parsed.cost || prev.COSTO,
          Merma: parsed.Merma || parsed.merma || prev.Merma,
          GRUPO: parsed.GRUPO || parsed.grupo || parsed.category || prev.GRUPO,
          Area: parsed.Area || parsed.area || prev.Area,
          ALMACENAMIENTO: parsed.ALMACENAMIENTO || parsed.storage || prev.ALMACENAMIENTO,
          Proveedor: providerId || prev.Proveedor, // Keep existing if not found/provided
          STOCK: stockData
        }));
        alert("Datos cargados al formulario de Ítem.");
      }
      setJsonImportVisible(false);
      setFormVisible(true); // Open the form to see the data
    } catch (e) {
      alert("Error al leer JSON: " + e.message);
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
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">

      {/* SECTION 1: CLIPBOARD ACTIONS */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portapapeles</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCopiarPendientes(ItemsAlmacen)} className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
            <Copy className="h-4 w-4 mr-1" /> Pendientes Compra
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCopiarPendientes(ProduccionInterna)} className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100">
            <Copy className="h-4 w-4 mr-1" /> Pendientes Producción
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopiarInfoItems} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
            <FileText className="h-4 w-4 mr-1" /> Copiar Toda Info
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Acciones de Gestión</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={formVisible ? "default" : "outline"}
            className={formVisible ? "bg-slate-800 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}
            onClick={() => setFormVisible(!formVisible)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {currentType === MenuItems ? "Nuevo Plato" : "Nuevo Ítem"}
          </Button>

          <Button
            variant={formProveedorVisible ? "default" : "outline"}
            className={formProveedorVisible ? "bg-orange-600 text-white" : "border-orange-300 text-orange-700 hover:bg-orange-50"}
            onClick={() => setFormProveedorVisible(!formProveedorVisible)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>

          <Button
            variant={jsonImportVisible ? "default" : "outline"}
            className={jsonImportVisible ? "bg-blue-600 text-white" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
            onClick={() => setJsonImportVisible(!jsonImportVisible)}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>


          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleActualizarPrecios}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalcular Precios
          </Button>

          {currentType === ProduccionInterna && (
            <Button
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
              onClick={handleSincronizarCostosProduccion}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Costos Receta
            </Button>
          )}

        </div>
      </div>

      {/* JSON IMPORT SECTION */}
      {jsonImportVisible && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2">
              <FileJson className="h-4 w-4" /> Importar desde JSON
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 text-xs h-7 px-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400"
              title="Copia instrucciones para IA que generan JSON compatible"
            >
              {promptCopied ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar Prompt</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-blue-600 mb-2">
            Pega aquí el objeto JSON del producto (ej. desde Claude/GPT). El sistema intentará autocompletar el formulario.
          </p>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{ "nombre": "...", "costo": 1000 ... }'
            className="font-mono text-xs bg-white mb-3 h-32"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setJsonImportVisible(false)} className="text-blue-600 hover:text-blue-800">Cancelar</Button>
            <Button size="sm" onClick={parseJsonToItem} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Hammer className="h-4 w-4 mr-1" /> Procesar JSON
            </Button>
          </div>
        </div>
      )}

      {/* FORMS */}
      {formVisible && (
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
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
                <Input name="minimo" value={newItemData.STOCK.minimo} onChange={handleStockChange} placeholder="Min" title="Stock Min" className="w-1/3" />
                <Input name="actual" value={newItemData.STOCK.actual} onChange={handleStockChange} placeholder="Actual" title="Stock Actual" className="w-1/3" />
                <Input name="maximo" value={newItemData.STOCK.maximo} onChange={handleStockChange} placeholder="Max" title="Stock Max" className="w-1/3" />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-2">
                <Button onClick={handleCrearItem} className="w-full bg-emerald-600 hover:bg-emerald-700">
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
                <Button onClick={handleCrearMenuItem} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" /> Guardar Plato
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {formProveedorVisible && (
        <div className="bg-orange-50 p-4 rounded-md border border-orange-200 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="font-bold text-sm text-orange-800 mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Nuevo Proveedor
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(initialProveedorData).map(k => (
              <Input key={k} name={k} value={newProveedorData[k]} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder={k.replace(/_/g, " ")} />
            ))}
            <div className="col-span-1 md:col-span-2 pt-2">
              <Button onClick={handleCrearProveedor} className="w-full bg-orange-600 hover:bg-orange-700">
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