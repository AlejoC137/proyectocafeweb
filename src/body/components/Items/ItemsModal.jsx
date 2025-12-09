import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, updateItem } from "../../../redux/actions";
import { ITEMS, CATEGORIES, unidades, BODEGA, ESTATUS, PROVEE } from "../../../redux/actions-types";
import { X, Package, BookOpen, Edit, Save, Loader2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Componente de "Página Modal" para ver y EDITAR los detalles de un Item.
 * Se accede por la ruta /item/:id
 */
const ItemsModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonText, setJsonText] = useState("");

  // Estados de datos
  const items = useSelector((state) => state.allItems || []);
  const proveedores = useSelector((state) => state.Proveedores || []);
  const [editableItem, setEditableItem] = useState(null);

  // Helper para parsear JSON de forma segura
  const safeJsonParse = (jsonString, fallback) => {
    if (jsonString && typeof jsonString === 'string') {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.warn("Error parsing JSON:", jsonString, e);
      }
    }
    return fallback;
  };

  // 1. Cargar datos iniciales (Items y Proveedores)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const promises = [];
      if (items.length === 0) promises.push(dispatch(getAllFromTable(ITEMS)));
      if (proveedores.length === 0) promises.push(dispatch(getAllFromTable(PROVEE)));

      try {
        await Promise.all(promises);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, items.length, proveedores.length]);

  // 2. Encontrar el item original
  const originalItem = useMemo(() => {
    if (items.length > 0 && id) {
      return items.find((i) => i._id === id);
    }
    return null;
  }, [items, id]);

  // 3. Poblar el estado editable
  useEffect(() => {
    if (originalItem) {
      const parsedStock = safeJsonParse(originalItem.STOCK, { minimo: 0, maximo: 0, actual: 0 });
      const parsedAlmacen = safeJsonParse(originalItem.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });

      setEditableItem({
        ...originalItem,
        stock_minimo: parsedStock.minimo || 0,
        stock_maximo: parsedStock.maximo || 0,
        stock_actual: parsedStock.actual || 0,
        almacenamiento_ALMACENAMIENTO: parsedAlmacen.ALMACENAMIENTO || "",
        almacenamiento_BODEGA: parsedAlmacen.BODEGA || "",
      });
    }
  }, [originalItem]);

  // --- Handlers ---
  const handleClose = () => navigate(-1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (originalItem) {
      const parsedStock = safeJsonParse(originalItem.STOCK, { minimo: 0, maximo: 0, actual: 0 });
      const parsedAlmacen = safeJsonParse(originalItem.ALMACENAMIENTO, { ALMACENAMIENTO: "", BODEGA: "" });
      setEditableItem({
        ...originalItem,
        stock_minimo: parsedStock.minimo || 0,
        stock_maximo: parsedStock.maximo || 0,
        stock_actual: parsedStock.actual || 0,
        almacenamiento_ALMACENAMIENTO: parsedAlmacen.ALMACENAMIENTO || "",
        almacenamiento_BODEGA: parsedAlmacen.BODEGA || "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editableItem) return;
    setIsSaving(true);
    try {
      const stockData = {
        minimo: Number(editableItem.stock_minimo) || 0,
        maximo: Number(editableItem.stock_maximo) || 0,
        actual: Number(editableItem.stock_actual) || 0,
      };
      const almacenamientoData = {
        ALMACENAMIENTO: editableItem.almacenamiento_ALMACENAMIENTO || "",
        BODEGA: editableItem.almacenamiento_BODEGA || "",
      };

      const costo = Number(editableItem.COSTO) || 0;
      const cantidad = Number(editableItem.CANTIDAD) || 1;
      const coor = Number(editableItem.COOR) || 1.05;
      const precioUnitarioCalculado = (costo / cantidad) * coor;

      const payload = {
        ...editableItem,
        STOCK: JSON.stringify(stockData),
        ALMACENAMIENTO: JSON.stringify(almacenamientoData),
        precioUnitario: precioUnitarioCalculado,
        FECHA_ACT: new Date().toISOString().split("T")[0],
      };

      delete payload.stock_minimo;
      delete payload.stock_maximo;
      delete payload.stock_actual;
      delete payload.almacenamiento_ALMACENAMIENTO;
      delete payload.almacenamiento_BODEGA;

      const result = await dispatch(updateItem(id, payload, ITEMS));
      if (result) {
        setIsEditing(false);
      } else {
        throw new Error("Fallo al actualizar en Redux.");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setEditableItem(prev => {
        const next = { ...prev };
        const getVal = (keys) => {
          for (const k of keys) if (parsed[k]) return parsed[k];
          return null;
        }

        const name = getVal(['Nombre_del_producto', 'nombre', 'name', 'NombreES']);
        if (name) next.Nombre_del_producto = name;

        const qty = getVal(['CANTIDAD', 'cantidad', 'quantity']);
        if (qty) next.CANTIDAD = qty;

        const cost = getVal(['COSTO', 'costo', 'cost']);
        if (cost) next.COSTO = cost;

        const units = getVal(['UNIDADES', 'unidades', 'units', 'unit']);
        if (units) next.UNIDADES = units;

        if (parsed.STOCK) {
          let s = parsed.STOCK;
          if (typeof s === 'string') {
            try { s = JSON.parse(s); } catch { }
          }
          if (typeof s === 'object') {
            if (s.minimo !== undefined) next.stock_minimo = s.minimo;
            if (s.maximo !== undefined) next.stock_maximo = s.maximo;
            if (s.actual !== undefined) next.stock_actual = s.actual;
          }
        }

        const provRaw = getVal(['Proveedor', 'proveedor', 'provider']);
        if (provRaw) {
          if (proveedores.find(p => p._id === provRaw)) next.Proveedor = provRaw;
          else {
            const match = proveedores.find(p => p.Nombre_Proveedor.toLowerCase().includes(String(provRaw).toLowerCase()));
            if (match) next.Proveedor = match._id;
          }
        }
        return next;
      });
      alert("Datos del JSON aplicados al formulario. Revisa antes de guardar.");
    } catch (e) {
      alert("Error al leer JSON: " + e.message);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value || 0);

  const renderField = (label, name, type = "text", isReadOnly = false, options = null) => {
    const value = editableItem?.[name] ?? "";

    if (isEditing) {
      return (
        <div className="grid grid-cols-3 gap-2 items-center">
          <label htmlFor={name} className="text-sm font-medium text-slate-600 col-span-1">
            {label}:
          </label>
          <div className="col-span-2">
            {options ? (
              <select
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                disabled={isSaving || isReadOnly}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Seleccionar...</option>
                {options.map((opt) => (
                  <option key={opt._id || opt} value={opt._id || opt}>
                    {opt.Nombre_Proveedor || opt}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={handleChange}
                disabled={isSaving || isReadOnly}
                readOnly={isReadOnly}
                className={isReadOnly ? "bg-slate-100 text-slate-500" : ""}
              />
            )}
          </div>
        </div>
      );
    } else {
      if (name.startsWith("stock_") || name.startsWith("almacenamiento_")) return null;

      let displayValue = value;
      if (name === "precioUnitario" || name === "COSTO") displayValue = formatCurrency(value);
      else if (name === "STOCK") {
        const parsed = safeJsonParse(value, { minimo: 0, maximo: 0, actual: 0 });
        displayValue = `Mín: ${parsed.minimo}, Máx: ${parsed.maximo}, Actual: ${parsed.actual}`;
      }
      else if (name === "ALMACENAMIENTO") {
        const parsed = safeJsonParse(value, { ALMACENAMIENTO: "", BODEGA: "" });
        displayValue = `Almacén: ${parsed.ALMACENAMIENTO || 'N/A'} | Bodega: ${parsed.BODEGA || 'N/A'}`;
      }
      else if (name === "Proveedor") {
        const prov = proveedores.find(p => p._id === value);
        displayValue = prov ? prov.Nombre_Proveedor : (value || "N/A");
      }
      else if (value === null || value === undefined || value === "") displayValue = "N/A";

      return (
        <div className="grid grid-cols-3 gap-2 items-start py-2 border-b border-slate-100 last:border-0">
          <span className="text-sm font-medium text-slate-500 col-span-1">{label}:</span>
          <span className="text-sm font-medium text-slate-800 col-span-2 break-words">{displayValue}</span>
        </div>
      );
    }
  };

  let content;
  if (loading) {
    content = (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-500 font-medium">Cargando detalles del item...</span>
      </div>
    );
  } else if (!originalItem || !editableItem) {
    content = (
      <div className="text-center py-12 px-6 flex flex-col items-center">
        <Package className="h-16 w-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-700">Item no encontrado</h3>
        <p className="text-slate-500 mt-2">No pudimos encontrar el item solicitado.</p>
        <p className="font-mono text-xs text-slate-400 mt-1 bg-slate-100 px-2 py-1 rounded">ID: {id}</p>
      </div>
    );
  } else {
    content = (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Información General</h3>
          <div className="grid gap-4">
            {renderField("Nombre", "Nombre_del_producto")}
            {renderField("Grupo", "GRUPO", "text", false, CATEGORIES)}
            {renderField("Proveedor", "Proveedor", "text", false, proveedores)}
            {renderField("Estado", "Estado", "text", false, ESTATUS)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Costos e Inventario Base</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Cant. Base", "CANTIDAD", "number")}
            {renderField("Unidad", "UNIDADES", "text", false, unidades)}
            {renderField("Costo Total", "COSTO", "number")}
            {renderField("Factor COOR", "COOR", "number")}
            {renderField("Merma (%)", "Merma", "number")}
            {renderField("Precio Unit.", "precioUnitario", "text", true)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Control de Stock</h3>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              {renderField("Mínimo", "stock_minimo", "number")}
              {renderField("Máximo", "stock_maximo", "number")}
              {renderField("Actual", "stock_actual", "number")}
            </div>
          ) : (
            renderField("Resumen Stock", "STOCK")
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Ubicación Física</h3>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              {renderField("Almacenamiento", "almacenamiento_ALMACENAMIENTO", "text", false, BODEGA)}
              {renderField("Bodega Específica", "almacenamiento_BODEGA", "text", false, BODEGA)}
            </div>
          ) : (
            renderField("Ubicación", "ALMACENAMIENTO")
          )}
        </div>

        <div className="space-y-2 pt-4">
          <div className="text-xs text-slate-400 flex justify-between">
            <span>ID Sistema: {editableItem._id}</span>
            <span>Última Act.: {editableItem.FECHA_ACT || 'N/A'}</span>
          </div>
        </div>

        {editableItem.recipeId && !isEditing && (
          <div className="pt-2">
            <a href={`/receta/${editableItem.recipeId}`} className="w-full flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200">
              <BookOpen className="h-5 w-5 mr-2" />
              Ver Receta Asociada
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      {/* Dynamic Width based on import state */}
      <div className={`bg-white w-full ${showJsonImport ? 'max-w-6xl' : 'max-w-3xl'} transition-all duration-300 rounded-xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95`}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            {isEditing ? "Editando Item" : (originalItem?.Nombre_del_producto || "Detalles del Item")}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && !loading && originalItem && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="hidden md:flex">
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
            )}
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {(!loading && originalItem && editableItem && isEditing) ? (
            <div className={`transition-all duration-300 ${showJsonImport ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
              <div>{content}</div>
              {showJsonImport && (
                <div className="border-l pl-6 space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 sticky top-0 h-full flex flex-col">
                    <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                      <FileJson className="h-5 w-5" />
                      Importar desde JSON
                    </h4>
                    <p className="text-xs text-blue-600 mb-3">
                      Pega el JSON para autocompletar campos.
                    </p>
                    <textarea
                      className="flex-1 w-full p-3 text-xs font-mono border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[300px]"
                      placeholder='{ "nombre": "...", "costo": 1000 ... }'
                      value={jsonText}
                      onChange={e => setJsonText(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" onClick={handleParseJson} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        Aplicar Datos
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            content
          )}
        </div>

        {/* Footer de Acción (Solo en edición) */}
        {isEditing && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10">
            {/* Toggle Button */}
            <Button
              variant={showJsonImport ? "secondary" : "outline"}
              onClick={() => setShowJsonImport(!showJsonImport)}
              className={showJsonImport ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-slate-500"}
            >
              <FileJson className="h-4 w-4 mr-2" />
              {showJsonImport ? "Ocultar Importador" : "Importar JSON"}
            </Button>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsModal;
