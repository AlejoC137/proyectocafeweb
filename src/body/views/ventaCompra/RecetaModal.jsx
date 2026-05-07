import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { ArrowLeft, Save, Trash2, Printer, Plus, X, Settings2, FileJson, Copy, Check, ChefHat, Clock, Users, DollarSign, RefreshCw, Lock, Unlock, BookOpen } from "lucide-react";
import RecipeImportModal from './RecipeImportModal';
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, getOtherExpenses, getRecepie, updateItem } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MENU, ITEMS, PRODUCCION } from "../../../redux/actions-types";
import EditableText from "../../../components/ui/EditableText";
import { recetaMariaPaula } from "../../../redux/calcularReceta.jsx";

// ─── EditableIngredientRow ────────────────────────────────────────────────────
const EditableIngredientRow = ({ item, index, source, onNameChange, onSelect, onQuantityChange, onRemove, onSync, onMove, isFirst, isLast, onNavigate }) => {
  const subtotal = (Number(item.originalQuantity) || 0) * (Number(item.precioUnitario) || 0);
  return (
    <div className="mb-2 p-2 border border-slate-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(index, -1, source)} disabled={isFirst}
            className="px-1 py-0.5 hover:bg-slate-100 rounded disabled:opacity-30 text-[10px] font-bold text-slate-500 leading-none">▲</button>
          <button onClick={() => onMove(index, 1, source)} disabled={isLast}
            className="px-1 py-0.5 hover:bg-slate-100 rounded disabled:opacity-30 text-[10px] font-bold text-slate-500 leading-none">▼</button>
        </div>
        <input type="text" placeholder="Buscar ingrediente..." value={item.nombre || ""}
          onChange={(e) => onNameChange(index, e.target.value, source)}
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-400 min-w-0" />
        {item.item_Id && onNavigate && (
          <button onClick={() => onNavigate(item.item_Id)} title="Ver ítem"
            className="flex-shrink-0 w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded text-sm flex items-center justify-center transition-colors">
            📦
          </button>
        )}
        <button onClick={() => onRemove(index, source)}
          className="flex-shrink-0 w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-bold flex items-center justify-center transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>

      {item.matches && item.matches.length > 0 && (
        <ul className="border border-slate-200 rounded bg-white max-h-36 overflow-y-auto mt-1 shadow-lg z-10">
          {item.matches.map((match) => (
            <li key={match._id} onClick={() => onSelect(index, match, source)}
              className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer text-xs border-b border-slate-50 last:border-0">
              {match.Nombre_del_producto}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-4 gap-1.5 mt-2">
        <Input type="number" placeholder="Cant." value={item.originalQuantity || ""}
          onChange={(e) => onQuantityChange(index, e.target.value, source)}
          className="h-7 text-xs px-2" />
        <Input type="text" placeholder="Und." value={item.unidades || ""} readOnly
          className="h-7 text-xs px-2 bg-slate-50 text-slate-500" />
        <Input type="text" placeholder="P.Unit" value={Number(item.precioUnitario || 0).toFixed(2)} readOnly
          className="h-7 text-xs px-2 bg-slate-50 text-slate-500 text-right" />
        <div className="flex items-center gap-1">
          <Input type="text" placeholder="Sub." value={subtotal.toFixed(2)} readOnly
            className="h-7 text-xs px-2 bg-slate-50 font-semibold text-right flex-1" />
          <button onClick={() => onSync(index, source)} title="Sincronizar precio/unidades"
            className="flex-shrink-0 p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RecipeItemRow ─────────────────────────────────────────────────────────────
const RecipeItemRow = ({ item, isEditing, onCheck, onSave }) => {
  const [editValue, setEditValue] = useState(item.cantidad.toString());
  const [isInputActive, setIsInputActive] = useState(false);
  const handleSave = () => { onSave(item.originalIndex, editValue); setIsInputActive(false); };
  const handleEditClick = () => { setEditValue(item.cantidad.toFixed(2)); setIsInputActive(true); };
  const handleCancel = () => { setIsInputActive(false); setEditValue(item.cantidad.toString()); };

  return (
    <div className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors mb-1 ${item.isChecked ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100"}`}>
      <button onClick={() => onCheck(item.originalIndex)} type="button"
        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-md border-2 transition-all ${item.isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 hover:border-emerald-400"}`}>
        {item.isChecked && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
      </button>
      <span className={`flex-1 text-xs ${item.isChecked ? "line-through text-slate-400" : "text-slate-700"}`}>{item.nombre}</span>
      <span className="text-xs font-bold text-blue-600 tabular-nums">{item.cantidad.toFixed(2)}</span>
      <span className="text-[10px] text-slate-400 w-8">{item.unidades}</span>
      {isEditing && (
        <div className="flex items-center gap-1">
          {isInputActive
            ? <><Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-16 h-6 text-xs" /><Button size="sm" className="h-6 text-[10px] px-1.5" onClick={handleSave}>OK</Button><Button size="sm" variant="ghost" className="h-6 text-[10px] px-1" onClick={handleCancel}>✕</Button></>
            : <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleEditClick}>Editar</Button>}
        </div>
      )}
    </div>
  );
};

// ─── RecipeSection ─────────────────────────────────────────────────────────────
const RecipeSection = ({ title, items, isEditing, onCheck, onSave }) => (
  <div>
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</h4>
    {items.length > 0
      ? items.map(item => <RecipeItemRow key={item.key} item={item} isEditing={isEditing} onCheck={onCheck} onSave={onSave} />)
      : <p className="text-xs text-slate-400 italic py-2">Sin elementos.</p>}
  </div>
);

// ─── EmplatadoEditor ───────────────────────────────────────────────────────────
const EmplatadoEditor = ({ value, onSave, isEditable, placeholder, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [steps, setSteps] = useState([]);
  const [isJson, setIsJson] = useState(false);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) { setSteps(parsed.sort((a, b) => a.orden - b.orden)); setIsJson(true); }
      else throw new Error();
    } catch { setIsJson(false); setRawText(value || ""); }
  }, [value]);

  const handleSaveSteps = () => { onSave(JSON.stringify(steps)); setIsEditing(false); };
  const handleSaveRaw = () => { onSave(rawText); setIsEditing(false); };
  const handleAddStep = () => setSteps([...steps, { orden: steps.length, proceso: "" }]);
  const handleUpdateStep = (i, v) => { const s = [...steps]; s[i].proceso = v; setSteps(s); };
  const handleRemoveStep = (i) => setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, orden: idx })));
  const handleConvertToSteps = () => { if (window.confirm("¿Convertir texto a lista de pasos?")) { setSteps([{ orden: 0, proceso: rawText }]); setIsJson(true); } };

  if (!isEditable) {
    return isJson
      ? <div className="space-y-1">{steps.map((s, i) => <div key={i} className="flex gap-2 text-xs"><span className="font-bold text-slate-400 min-w-[16px]">{i + 1}.</span><span className="text-slate-700">{s.proceso}</span></div>)}{steps.length === 0 && <span className="text-slate-400 italic text-xs">Sin pasos.</span>}</div>
      : <div className="text-xs whitespace-pre-wrap text-slate-700">{rawText || <span className="text-slate-400 italic">{placeholder}</span>}</div>;
  }

  if (isEditing) {
    return isJson
      ? <div className="space-y-2 border border-slate-200 p-2 rounded-lg bg-white">
          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Editando Pasos</span><button onClick={() => setIsEditing(false)} className="text-red-500 text-xs">✕</button></div>
          {steps.map((step, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-[10px] font-bold text-slate-400 mt-2 w-4 text-center">{i + 1}</span>
              <textarea className="flex-1 p-1.5 border border-slate-200 rounded text-xs min-h-[36px] resize-y focus:outline-none focus:border-blue-400" value={step.proceso} onChange={(e) => handleUpdateStep(i, e.target.value)} />
              <button onClick={() => handleRemoveStep(i)} className="text-red-400 hover:text-red-600 p-1">🗑</button>
            </div>
          ))}
          <button onClick={handleAddStep} className="w-full text-xs text-slate-500 border border-dashed border-slate-300 rounded py-1 hover:bg-slate-50">+ Agregar Paso</button>
          <div className="flex justify-end"><Button size="sm" onClick={handleSaveSteps} disabled={disabled} className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs">Guardar</Button></div>
        </div>
      : <div className="space-y-2">
          <textarea className="w-full p-2 border border-slate-200 rounded text-xs min-h-[60px] focus:outline-none focus:border-blue-400" value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder={placeholder} />
          <div className="flex justify-between items-center">
            <button onClick={handleConvertToSteps} className="text-xs text-blue-600 hover:underline">Convertir a lista</button>
            <div className="flex gap-1.5"><Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">Cancelar</Button><Button size="sm" onClick={handleSaveRaw} disabled={disabled} className="bg-green-600 text-white h-7 text-xs">Guardar</Button></div>
          </div>
        </div>;
  }

  return (
    <div className="group relative border border-transparent hover:border-slate-200 rounded-lg p-1 transition-all">
      {isJson
        ? <div className="space-y-1">{steps.map((s, i) => <div key={i} className="flex gap-2 text-xs"><span className="font-bold text-slate-400 min-w-[16px]">{i + 1}.</span><span>{s.proceso}</span></div>)}{steps.length === 0 && <span className="text-slate-400 italic text-xs">Sin pasos.</span>}</div>
        : <div className="text-xs whitespace-pre-wrap">{rawText || <span className="text-slate-400 italic">{placeholder}</span>}</div>}
      <button onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-sm rounded p-0.5 text-[10px]">✏️</button>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function RecetaModal({ item, onClose }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const id = item?.Receta || paramId;

  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allOptions = useMemo(() => [...allItems, ...allProduccion], [allItems, allProduccion]);
  const searchableProducts = useMemo(() => [
    ...allItems.map(i => ({ ...i, __type: "item" })),
    ...allProduccion.map(p => ({ ...p, __type: "producto_interno" })),
  ], [allItems, allProduccion]);

  const getProductName = (product) => product?.Nombre_del_producto || product?.NombreES || product?.name || "(Sin nombre)";

  const [receta, setReceta] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [porcentaje, setPorcentaje] = useState(100);
  const [editShow, setEditShow] = useState(false);
  const [permanentEditMode, setPermanentEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [recetaSource, setRecetaSource] = useState(null);
  const [pinCode, setPinCode] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [rendimientoCantidad, setRendimientoCantidad] = useState("");
  const [rendimientoUnidades, setRendimientoUnidades] = useState("");
  const [rendimientoPorcion, setRendimientoPorcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const implementationInstances = useMemo(() => {
    if (!receta) return [];
    return allOptions.filter(i => i.Receta === receta._id);
  }, [receta, allOptions]);

  const [ingredientes, setIngredientes] = useState([]);
  const [produccion, setProduccion] = useState([]);
  const [editableIngredientes, setEditableIngredientes] = useState([]);
  const [editableProduccion, setEditableProduccion] = useState([]);
  const [calculoDetalles, setCalculoDetalles] = useState(null);
  const [precioVentaFinal, setPrecioVentaFinal] = useState(0);
  const [costoManualCMP, setCostoManualCMP] = useState("");
  const [tiempoProceso, setTiempoProceso] = useState(0);
  const [costoProduccion, setCostoProduccion] = useState(0);

  const buscarPorId = (itemId) => allOptions.find((i) => i._id === itemId) || null;
  const handleCancelEdit = () => setPermanentEditMode(false);

  useEffect(() => {
    const fetchRecetaData = async () => {
      if (!id) { setError("El ítem no tiene una receta asociada."); setLoading(false); return; }
      setLoading(true);
      try {
        await Promise.all([dispatch(getAllFromTable(ITEMS)), dispatch(getAllFromTable(PRODUCCION)), dispatch(getAllFromTable(MENU))]);
        let result = await getRecepie(id, "Recetas");
        let source = "Recetas";
        if (!result) { result = await getRecepie(id, "RecetasProduccion"); source = "RecetasProduccion"; }
        if (!result) throw new Error("Receta no encontrada");
        console.log("📦 Objeto Receta cargado:", result);
        setReceta(result); setRecetaSource(source); setTiempoProceso(result.ProcessTime || 0);
        if (result.forId) {
          const plato = await getRecepie(result.forId, "Menu");
          if (plato) { setFoto(plato.Foto); setMenuItem(plato); }
        }
      } catch (err) { setError("Error al obtener la receta."); console.error(err); }
      finally { setLoading(false); }
    };
    fetchRecetaData();
  }, [id, dispatch]);

  const parseItemsFromRecetaObject = (recetaData) => {
    const parseItems = (prefix, count) => {
      const parsedList = [];
      for (let i = 1; i <= count; i++) {
        const itemId = recetaData[`${prefix}${i}_Id`];
        const cuantityUnitsRaw = recetaData[`${prefix}${i}_Cuantity_Units`];
        if (itemId && cuantityUnitsRaw) {
          const itemData = buscarPorId(itemId);
          if (itemData) {
            try {
              const cuantityUnits = JSON.parse(cuantityUnitsRaw);
              parsedList.push({
                key: `${prefix}-${i}`, originalIndex: i, item_Id: itemId,
                nombre: itemData.Nombre_del_producto,
                originalQuantity: cuantityUnits.metric.cuantity,
                unidades: cuantityUnits.metric.units,
                precioUnitario: Number(itemData.precioUnitario) || 0,
                isChecked: false,
              });
            } catch (e) { console.warn(`Error parseando JSON: `, cuantityUnitsRaw); }
          }
        }
      }
      return parsedList;
    };
    return { ingredientes: parseItems("item", 30), produccion: parseItems("producto_interno", 20) };
  };

  useEffect(() => {
    if (!receta || allOptions.length === 0) return;
    const { ingredientes: parsedIng, produccion: parsedProd } = parseItemsFromRecetaObject(receta);
    setIngredientes(parsedIng); setProduccion(parsedProd);
    setEditableIngredientes(parsedIng); setEditableProduccion(parsedProd);
  }, [receta, allOptions]);

  useEffect(() => {
    if (permanentEditMode && receta) {
      if (receta.rendimiento) {
        try {
          const d = JSON.parse(receta.rendimiento);
          setRendimientoCantidad(d.cantidad?.toString() || "");
          setRendimientoUnidades(d.unidades || "");
          setRendimientoPorcion(d.porcion?.toString() || "1");
        } catch (e) { console.warn(e); }
      }
      if (foto) setImagenUrl(foto);
    }
  }, [permanentEditMode, receta, foto]);

  useEffect(() => {
    if (recetaSource !== "Recetas" || !menuItem || (!editableIngredientes.length && !editableProduccion.length)) {
      setCalculoDetalles(null); setPrecioVentaFinal(0); return;
    }
    const itemsParaCalcular = [...editableIngredientes, ...editableProduccion]
      .filter(i => i.item_Id && i.originalQuantity > 0)
      .map(i => ({ ...i, cuantity: i.originalQuantity, precioUnitario: buscarPorId(i.item_Id)?.precioUnitario || 0 }));
    const resultado = recetaMariaPaula(itemsParaCalcular, menuItem.GRUPO, costoManualCMP ? `.${costoManualCMP}` : null, tiempoProceso);
    setCalculoDetalles(resultado.detalles);
    setPrecioVentaFinal(resultado.consolidado);
  }, [editableIngredientes, editableProduccion, costoManualCMP, tiempoProceso, menuItem, recetaSource, allOptions]);

  useEffect(() => {
    if (recetaSource !== "RecetasProduccion") { setCostoProduccion(0); return; }
    const itemsParaCalcular = [...editableIngredientes, ...editableProduccion]
      .filter(i => i.item_Id && i.originalQuantity > 0)
      .map(i => ({ cuantity: i.originalQuantity, precioUnitario: buscarPorId(i.item_Id)?.precioUnitario || 0 }));
    const resultado = recetaMariaPaula(itemsParaCalcular, null, null, tiempoProceso, null, null, 1, 0, 0, 0, true);
    if (resultado && typeof resultado.COSTO === "number") setCostoProduccion(resultado.COSTO);
  }, [editableIngredientes, editableProduccion, tiempoProceso, recetaSource, allOptions]);

  const ingredientesAjustados = useMemo(() => ingredientes.map(ing => ({ ...ing, cantidad: (ing.originalQuantity * porcentaje) / 100 })), [ingredientes, porcentaje]);
  const produccionAjustada = useMemo(() => produccion.map(prod => ({ ...prod, cantidad: (prod.originalQuantity * porcentaje) / 100 })), [produccion, porcentaje]);

  const handleEnablePermanentEdit = () => setShowPinInput(true);
  const handlePinVerification = () => {
    if (pinCode === import.meta.env.VITE_ADMIN_PIN) {
      setPermanentEditMode(true); setShowPinInput(false); setPinCode(""); setEditShow(true);
    } else { console.warn("PIN Incorrecto"); setPinCode(""); }
  };
  const handleCheck = (setState, index) => setState(prev => prev.map(i => i.originalIndex === index ? { ...i, isChecked: !i.isChecked } : i));
  const handleSave = (setState, index, newValue) => {
    const numValue = Number(newValue);
    if (isNaN(numValue) || numValue <= 0) return;
    const itemToUpdate = (setState === setIngredientes ? ingredientes : produccion).find(i => i.originalIndex === index);
    if (itemToUpdate && !permanentEditMode) setPorcentaje((numValue / itemToUpdate.originalQuantity) * 100);
  };
  const formatCurrency = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value || 0);

  const updateField = async (fieldsToUpdate) => {
    if (!permanentEditMode || !receta || !recetaSource) return;
    setIsUpdating(true);
    try {
      const payload = { ...fieldsToUpdate, actualizacion: new Date().toISOString() };
      const result = await dispatch(updateItem(receta._id, payload, recetaSource));
      if (result) setReceta(prev => ({ ...prev, ...payload }));
      else throw new Error("DB Error");
    } catch (error) { alert("Error: " + error.message); }
    finally { setIsUpdating(false); }
  };
  const updateProcessOrNote = (type, index, newValue) => updateField({ [type === "process" ? `proces${index}` : `nota${index}`]: newValue });
  const updateInfoField = (fieldName, newValue) => updateField({ [fieldName]: newValue });

  const updateRendimiento = async () => {
    const rendimientoData = { porcion: Number(rendimientoPorcion) || 1, cantidad: Number(rendimientoCantidad), unidades: rendimientoUnidades };
    setIsUpdating(true);
    try {
      await dispatch(updateItem(receta._id, { rendimiento: JSON.stringify(rendimientoData), actualizacion: new Date().toISOString() }, recetaSource));
      setReceta(prev => ({ ...prev, rendimiento: JSON.stringify(rendimientoData) }));
      if (receta.forId) {
        let targetTable = recetaSource === "RecetasProduccion" ? "ProduccionInterna" : null;
        if (targetTable) await dispatch(updateItem(receta.forId, { Cantidad: Number(rendimientoCantidad), UNIDADES: rendimientoUnidades }, targetTable));
      }
      alert("Rendimiento guardado y sincronizado.");
    } catch (error) { console.error(error); alert("Error al guardar rendimiento."); }
    finally { setIsUpdating(false); }
  };

  const updateImagenUrl = async () => {
    if (!receta.forId) return;
    setIsUpdating(true);
    try {
      const result = await dispatch(updateItem(receta.forId, { Foto: imagenUrl }, "Menu"));
      if (result) setFoto(imagenUrl);
    } catch (error) { alert("Error: " + error.message); }
    finally { setIsUpdating(false); }
  };

  const handleCalculateUnitValue = async () => {
    if (!rendimientoCantidad || Number(rendimientoCantidad) <= 0) {
      alert("Se requiere una cantidad de rendimiento válida para el cálculo.");
      return;
    }
    const valorPorUnidad = costoProduccion / Number(rendimientoCantidad);

    setIsUpdating(true);
    try {
      // 1. Actualizar el campo precioUnitario en la receta misma
      const payloadReceta = { 
        precioUnitario: valorPorUnidad, 
        actualizacion: new Date().toISOString() 
      };
      const resultReceta = await dispatch(updateItem(receta._id, payloadReceta, recetaSource));
      
      if (resultReceta) {
        setReceta(prev => ({ ...prev, ...payloadReceta }));
      }

      // 2. Sincronizar con el ítem de Producción Interna (forId)
      if (receta.forId) {
        await dispatch(updateItem(receta.forId, { precioUnitario: valorPorUnidad }, "ProduccionInterna"));
      }

      alert(`✅ Valor por unidad actualizado y sincronizado: ${formatCurrency(valorPorUnidad)}`);
    } catch (error) {
      console.error("Error al actualizar valor por unidad:", error);
      alert("❌ Error al actualizar el valor por unidad.");
    } finally {
      setIsUpdating(false);
    }
  };

  const addIngredient = (source) => {
    const newItem = { key: `new-${Date.now()}`, item_Id: "", nombre: "", originalQuantity: "", unidades: "", precioUnitario: 0, source, matches: [] };
    if (source === "Items") setEditableIngredientes(prev => [...prev, newItem]);
    else setEditableProduccion(prev => [...prev, newItem]);
  };

  const handleIngredientNameChange = (index, value, source) => {
    const list = source === "Items" ? editableIngredientes : editableProduccion;
    const setList = source === "Items" ? setEditableIngredientes : setEditableProduccion;
    const updated = [...list];
    updated[index].nombre = value;
    updated[index].matches = value ? allOptions.filter(opt => opt.Nombre_del_producto.toLowerCase().includes(value.toLowerCase())) : [];
    setList(updated);
  };

  const handleIngredientSelect = (index, selectedOption, source) => {
    const list = source === "Items" ? editableIngredientes : editableProduccion;
    const setList = source === "Items" ? setEditableIngredientes : setEditableProduccion;
    const updated = [...list];
    updated[index].nombre = selectedOption.Nombre_del_producto;
    updated[index].item_Id = selectedOption._id;
    updated[index].unidades = selectedOption.UNIDADES || "";
    updated[index].precioUnitario = Number(selectedOption.precioUnitario) || 0;
    updated[index].matches = [];
    setList(updated);
  };

  const handleRemoveIngredient = (index, source) => {
    if (!window.confirm("¿Eliminar este ingrediente?")) return;
    const list = source === "Items" ? editableIngredientes : editableProduccion;
    const setList = source === "Items" ? setEditableIngredientes : setEditableProduccion;
    setList(list.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, value, source) => {
    const list = source === "Items" ? editableIngredientes : editableProduccion;
    const setList = source === "Items" ? setEditableIngredientes : setEditableProduccion;
    const updated = [...list];
    updated[index].originalQuantity = value;
    setList(updated);
  };

  const handleSyncIngredient = (index, source) => {
    const list = source === "Items" ? editableIngredientes : editableProduccion;
    const setList = source === "Items" ? setEditableIngredientes : setEditableProduccion;
    const itemToSync = list[index];
    if (!itemToSync.item_Id) return;
    const original = buscarPorId(itemToSync.item_Id);
    if (original) {
      const updated = [...list];
      updated[index].precioUnitario = Number(original.precioUnitario) || 0;
      updated[index].unidades = original.UNIDADES || "";
      setList(updated);
      alert(`Sincronizado: Precio (${original.precioUnitario}) y Unidades (${original.UNIDADES})`);
    } else { alert("No se encontró el ítem original."); }
  };

  const handleMoveItem = (index, direction, source) => {
    const list = source === "Items" ? editableIngredientes : editableProduccion;
    const setList = source === "Items" ? setEditableIngredientes : setEditableProduccion;
    if ((direction === -1 && index === 0) || (direction === 1 && index === list.length - 1)) return;
    const newList = [...list];
    [newList[index], newList[index + direction]] = [newList[index + direction], newList[index]];
    setList(newList);
  };

  const handleSaveFullRecipe = async () => {
    if (!permanentEditMode || !receta || !recetaSource) return;
    const mapItemsToPayload = (items) => {
      const payload = {};
      for (let i = 1; i <= 30; i++) { payload[`item${i}_Id`] = null; payload[`item${i}_Cuantity_Units`] = null; }
      for (let i = 1; i <= 20; i++) { payload[`producto_interno${i}_Id`] = null; payload[`producto_interno${i}_Cuantity_Units`] = null; }
      let iCounter = 1; let pCounter = 1;
      items.forEach((item) => {
        const isProd = allProduccion.some(p => p._id === item.item_Id);
        const prefix = isProd ? "producto_interno" : "item";
        const idx = isProd ? pCounter++ : iCounter++;
        payload[`${prefix}${idx}_Id`] = item.item_Id || null;
        payload[`${prefix}${idx}_Cuantity_Units`] = item.item_Id
          ? JSON.stringify({ metric: { cuantity: Number(item.originalQuantity) || null, units: item.unidades || null } }) : null;
      });
      return payload;
    };
    setIsUpdating(true);
    try {
      const fullPayload = {
        ...receta,
        ...mapItemsToPayload([...editableIngredientes, ...editableProduccion]),
        costo: JSON.stringify(calculoDetalles),
        ProcessTime: tiempoProceso,
        actualizacion: new Date().toISOString(),
      };
      if (recetaSource === "RecetasProduccion") {
        fullPayload.costo = costoProduccion;
        if (receta.forId) await dispatch(updateItem(receta.forId, { COSTO: costoProduccion }, "ProduccionInterna"));
      }
      const result = await dispatch(updateItem(receta._id, fullPayload, recetaSource));
      if (result) { setReceta(fullPayload); alert("Cambios guardados."); }
      else throw new Error("Falló la actualización.");
    } catch (error) { console.error("Error:", error); alert("Error al guardar."); }
    finally { setIsUpdating(false); }
  };

  // ─── Print / PDF ────────────────────────────────────────────────────────────
  const handlePrintReceta = () => {
    if (!receta) return;
    const rendimientoData = receta.rendimiento ? (() => { try { return JSON.parse(receta.rendimiento); } catch { return null; } })() : null;
    const processSteps = Array.from({ length: 20 }, (_, i) => receta[`proces${i + 1}`]).filter(Boolean);
    const notes = Array.from({ length: 10 }, (_, i) => receta[`nota${i + 1}`]).filter(Boolean);

    const ingRows = ingredientesAjustados.map(ing =>
      `<tr><td>${ing.nombre}</td><td class="num">${ing.cantidad.toFixed(2)} ${ing.unidades}</td><td class="num">${formatCurrency(ing.cantidad * ing.precioUnitario)}</td></tr>`
    ).join("");
    const prodRows = produccionAjustada.map(p =>
      `<tr><td>${p.nombre}</td><td class="num">${p.cantidad.toFixed(2)} ${p.unidades}</td><td class="num">${formatCurrency(p.cantidad * p.precioUnitario)}</td></tr>`
    ).join("");

    const emplatadoHtml = (() => {
      try {
        const steps = JSON.parse(receta.emplatado || "");
        if (Array.isArray(steps)) return steps.map((s, i) => `<p><strong>${i + 1}.</strong> ${s.proceso}</p>`).join("");
      } catch { }
      return `<p>${receta.emplatado || ""}</p>`;
    })();

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receta: ${receta.legacyName}</title>
<style>
  @page{size:letter;margin:1.5cm 2cm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Georgia',serif;font-size:12px;color:#1a1a1a;line-height:1.6}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:16px}
  .header-left h1{font-size:25px;color:#1d4ed8;font-weight:700;letter-spacing:-0.3px}
  .badges{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
  .badge-blue{background:#dbeafe;color:#1d4ed8}
  .badge-gray{background:#f1f5f9;color:#475569}
  img{max-width:150px;max-height:150px;border-radius:6px;object-fit:cover}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:4px}
  h2{font-size:10.5px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin:16px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  thead th{background:#f0f4f8;padding:5px 7px;text-align:left;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
  thead th.num{text-align:right}
  td{padding:4px 7px;border-bottom:1px solid #f8fafc}
  td.num{text-align:right;font-family:monospace}
  .total-row td{background:#eff6ff;font-weight:700;font-size:12.5px}
  .process-step{display:flex;gap:8px;margin-bottom:6px}
  .step-num{font-weight:700;color:#1d4ed8;min-width:20px}
  .note-item{padding-left:12px;position:relative;margin-bottom:4px}
  .note-item::before{content:'•';position:absolute;left:0;color:#64748b}
  .footer{margin-top:20px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
  .cost-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:10px}
  .cost-box-label{font-size:10.5px;font-weight:700;text-transform:uppercase;color:#1d4ed8}
  .cost-box-value{font-size:16px;font-weight:700;color:#1d4ed8}
</style></head><body>
<div class="header">
  <div class="header-left">
    <h1>${receta.legacyName || "Sin nombre"}</h1>
    <div class="badges">
      ${rendimientoData ? `<span class="badge badge-blue">👥 ${rendimientoData.porcion || 1} porción(es) · ${rendimientoData.cantidad} ${rendimientoData.unidades}</span>` : ""}
      ${receta.ProcessTime ? `<span class="badge badge-gray">⏱ ${receta.ProcessTime} min</span>` : ""}
      ${receta.autor ? `<span class="badge badge-gray">👨‍🍳 ${receta.autor}</span>` : ""}
    </div>
  </div>
  ${foto ? `<img src="${foto}" alt="Foto del plato" />` : ""}
</div>

<div class="grid2">
  <div>
    ${ingRows ? `<h2>Ingredientes</h2><table><thead><tr><th>Ingrediente</th><th class="num">Cantidad</th><th class="num">Costo</th></tr></thead><tbody>${ingRows}</tbody></table>` : ""}
    ${prodRows ? `<h2>Producción Interna</h2><table><thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Costo</th></tr></thead><tbody>${prodRows}</tbody></table>` : ""}
    ${calculoDetalles ? `
    <h2>Análisis de Costos</h2>
    <table><tbody>
      <tr><td>%CMP Establecido</td><td class="num">${calculoDetalles.pCMPInicial}%</td></tr>
      <tr><td>%CMP Real</td><td class="num">${calculoDetalles.pCMPReal}%</td></tr>
      <tr><td>Valor CMP</td><td class="num">${formatCurrency(calculoDetalles.vCMP)}</td></tr>
      <tr><td>Mano de Obra</td><td class="num">${formatCurrency(calculoDetalles.vCMO)}</td></tr>
      <tr><td>Utilidad Bruta</td><td class="num">${formatCurrency(calculoDetalles.vIB)}</td></tr>
    </tbody></table>
    <div class="cost-box"><span class="cost-box-label">Precio de Venta</span><span class="cost-box-value">${formatCurrency(precioVentaFinal)}</span></div>
    ` : recetaSource === "RecetasProduccion" ? `
    <div class="cost-box"><span class="cost-box-label">Costo de Producción</span><span class="cost-box-value">${formatCurrency(costoProduccion)}</span></div>
    ` : ""}
  </div>
  <div>
    ${processSteps.length > 0 ? `<h2>Proceso de Preparación</h2>${processSteps.map((p, i) => `<div class="process-step"><span class="step-num">${i + 1}.</span><span>${p}</span></div>`).join("")}` : ""}
    ${notes.length > 0 ? `<h2>Notas del Chef</h2>${notes.map(n => `<div class="note-item">${n}</div>`).join("")}` : ""}
    ${receta.emplatado ? `<h2>Emplatado</h2>${emplatadoHtml}` : ""}
  </div>
</div>

<div class="footer">
  <span>ID Receta: ${receta._id}</span>
  <span>Generado: ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</span>
</div>
</body></html>`;

    const win = window.open("", "_blank");
    win.document.documentElement.innerHTML = html;
    win.onload = () => { win.focus(); win.print(); };
  };

  // ─── Helpers UI ─────────────────────────────────────────────────────────────
  const rendimientoDisplay = (() => {
    if (!receta?.rendimiento) return null;
    try { const r = JSON.parse(receta.rendimiento); return `${r.porcion || 1} porción · ${r.cantidad} ${r.unidades}`; }
    catch { return null; }
  })();

  const costoTotal = recetaSource === "RecetasProduccion"
    ? costoProduccion
    : (precioVentaFinal || 0);

  if (loading) return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 flex items-center gap-3 shadow-2xl">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600 font-medium">Cargando receta...</span>
      </div>
    </div>, document.body
  );

  if (error || !receta) return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-center shadow-2xl max-w-sm">
        <p className="text-red-500 font-medium">{error || "No se pudo cargar la receta."}</p>
        <button onClick={onClose || (() => navigate(-1))} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">Cerrar</button>
      </div>
    </div>, document.body
  );

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-0">
      <div className="bg-slate-50 w-screen h-screen flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-white/10 rounded-lg flex-shrink-0">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-white truncate">
                <EditableText value={receta.legacyName || ""} onSave={(v) => updateInfoField("legacyName", v)}
                  isEditable={permanentEditMode} placeholder="Nombre de la receta..." multiline={false} disabled={isUpdating} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {rendimientoDisplay && (
                  <span className="flex items-center gap-1 text-[9px] font-medium bg-white/15 text-white/80 px-2 py-0.5 rounded-full">
                    <Users className="h-2.5 w-2.5" />{rendimientoDisplay}
                  </span>
                )}
                {receta.ProcessTime > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-medium bg-white/15 text-white/80 px-2 py-0.5 rounded-full">
                    <Clock className="h-2.5 w-2.5" />{receta.ProcessTime} min
                  </span>
                )}
                {recetaSource === "RecetasProduccion" && (
                  <span className="text-[9px] font-bold bg-amber-500/80 text-white px-2 py-0.5 rounded-full">Producción</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Porcentaje */}
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1">
              <span className="text-[10px] text-white/70 font-medium">%</span>
              <input type="number" min={1} value={porcentaje}
                onChange={(e) => setPorcentaje(Number(e.target.value))}
                className="w-14 h-6 text-xs text-center bg-white/10 text-white rounded border border-white/20 focus:outline-none focus:border-white/50" />
            </div>

            {/* Edición simple */}
            <button onClick={() => setEditShow(p => !p)} disabled={permanentEditMode}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${editShow && !permanentEditMode ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white/80"} disabled:opacity-40`}>
              {editShow ? "✓ Ed. Simple" : "Editar"}
            </button>

            {/* Edición avanzada */}
            <button onClick={permanentEditMode ? handleCancelEdit : handleEnablePermanentEdit} disabled={isUpdating || (showPinInput && !permanentEditMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${permanentEditMode ? "bg-emerald-500 text-white" : "bg-amber-500/80 hover:bg-amber-500 text-white"} disabled:opacity-50`}>
              {permanentEditMode ? <><Unlock className="h-3 w-3" />Avanzado</> : <><Lock className="h-3 w-3" />Avanzado</>}
            </button>

            {showPinInput && !permanentEditMode && (
              <div className="flex items-center gap-1">
                <input type="password" placeholder="PIN" value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").substring(0, 4))}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePinVerification(); }}
                  maxLength={4} autoFocus
                  className="w-16 h-7 text-xs text-center bg-white/10 text-white border border-white/30 rounded focus:outline-none focus:border-white/60" />
                <button onClick={handlePinVerification} disabled={pinCode.length !== 4}
                  className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white text-xs rounded disabled:opacity-40">OK</button>
              </div>
            )}

            {/* Import JSON */}
            <button onClick={() => setShowImportModal(true)}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors" title="Importar desde JSON">
              <FileJson className="h-4 w-4" />
            </button>

            {/* Print */}
            <button onClick={handlePrintReceta}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors" title="Imprimir receta (PDF carta)">
              <Printer className="h-4 w-4" />
            </button>

            {/* Close */}
            <button onClick={onClose || (() => navigate(-1))}
              className="p-1.5 bg-white/10 hover:bg-red-500/70 text-white/80 hover:text-white rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Content grid ── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0">

          {/* Col 1: Ingredientes */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar border-r border-slate-200 bg-white">
            <div className="p-4 space-y-4">
              {permanentEditMode ? (
                <>
                  {/* Edit mode ingredient header */}
                  <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Editando Ingredientes</h3>
                    <div className="flex gap-1.5">
                      <Button onClick={handleSaveFullRecipe} disabled={isUpdating} size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-3">
                        {isUpdating ? "..." : <><Save className="h-3 w-3 mr-1" />Guardar</>}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Ingredientes</h4>
                    {editableIngredientes.map((item, i) => (
                      <EditableIngredientRow key={item.key || i} item={item} index={i} source="Items"
                        onNameChange={handleIngredientNameChange} onSelect={handleIngredientSelect}
                        onQuantityChange={handleQuantityChange} onRemove={handleRemoveIngredient}
                        onSync={handleSyncIngredient} onMove={handleMoveItem}
                        isFirst={i === 0} isLast={i === editableIngredientes.length - 1}
                        onNavigate={(itemId) => navigate(`/item/${itemId}`)} />
                    ))}
                    <button onClick={() => addIngredient("Items")}
                      className="w-full py-1.5 text-xs text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                      <Plus className="h-3 w-3" /> Añadir Ingrediente
                    </button>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Producción Interna</h4>
                    {editableProduccion.map((item, i) => (
                      <EditableIngredientRow key={item.key || i} item={item} index={i} source="Produccion"
                        onNameChange={handleIngredientNameChange} onSelect={handleIngredientSelect}
                        onQuantityChange={handleQuantityChange} onRemove={handleRemoveIngredient}
                        onSync={handleSyncIngredient} onMove={handleMoveItem}
                        isFirst={i === 0} isLast={i === editableProduccion.length - 1}
                        onNavigate={(itemId) => navigate(`/item/${itemId}`)} />
                    ))}
                    <button onClick={() => addIngredient("Produccion")}
                      className="w-full py-1.5 text-xs text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                      <Plus className="h-3 w-3" /> Añadir Prod. Interna
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <RecipeSection title="Ingredientes" items={ingredientesAjustados}
                    isEditing={editShow} onCheck={(i) => handleCheck(setIngredientes, i)}
                    onSave={(i, v) => handleSave(setIngredientes, i, v)} />
                  <RecipeSection title="Producción Interna" items={produccionAjustada}
                    isEditing={editShow} onCheck={(i) => handleCheck(setProduccion, i)}
                    onSave={(i, v) => handleSave(setProduccion, i, v)} />
                </>
              )}

              {/* Cálculo de costos */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Cálculo de Costos
                </h4>

                {permanentEditMode && (
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Tiempo (min)</label>
                      <Input type="number" value={tiempoProceso} onChange={(e) => setTiempoProceso(Number(e.target.value))} className="h-7 text-xs mt-0.5" />
                    </div>
                    {recetaSource !== "RecetasProduccion" && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">%CMP Manual</label>
                        <Input type="number" value={costoManualCMP} onChange={(e) => setCostoManualCMP(e.target.value)} placeholder="Ej: 35" className="h-7 text-xs mt-0.5" />
                      </div>
                    )}
                  </div>
                )}

                {recetaSource === "RecetasProduccion" ? (
                  <div className="flex flex-col gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-700">Costo de Producción</span>
                      <span className="text-base font-bold text-blue-700">{formatCurrency(costoProduccion)}</span>
                    </div>
                    {permanentEditMode && (
                      <Button
                        size="sm"
                        onClick={handleCalculateUnitValue}
                        disabled={isUpdating || !rendimientoCantidad || Number(rendimientoCantidad) <= 0}
                        className="w-full h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className={`h-3 w-3 ${isUpdating ? "animate-spin" : ""}`} />
                        Calcular y Guardar Valor x Unidad
                      </Button>
                    )}
                  </div>
                ) : calculoDetalles ? (
                  <div className="space-y-1">
                    {[
                      { label: "%CMP Establecido", value: `${calculoDetalles.pCMPInicial}%`, color: "bg-slate-100" },
                      { label: "%CMP Real", value: `${calculoDetalles.pCMPReal}%`, color: "bg-slate-100" },
                      { label: "Valor CMP", value: formatCurrency(calculoDetalles.vCMP), color: "bg-green-50" },
                      { label: "Mano de Obra", value: formatCurrency(calculoDetalles.vCMO), color: "bg-green-50" },
                      { label: "Utilidad Bruta", value: formatCurrency(calculoDetalles.vIB), color: "bg-green-50" },
                      { label: "% Util. Bruta", value: `${calculoDetalles.pIB}%`, color: "bg-green-50" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`flex justify-between items-center px-2 py-1 rounded ${color}`}>
                        <span className="text-[10px] text-slate-600">{label}</span>
                        <span className="text-[10px] font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                      <span className="text-xs font-bold text-amber-700">Precio Venta Final</span>
                      <span className="text-base font-bold text-amber-700">{formatCurrency(precioVentaFinal)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">Ajusta ingredientes para calcular.</p>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Procesos & Notas */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar border-r border-slate-200 bg-white">
            <div className="p-4 space-y-4">
              {/* Procesos */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Procesos</h3>
                <div className="space-y-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((i) =>
                    (receta[`proces${i}`] || permanentEditMode) && (
                      <div key={`process-${i}`} className="flex items-start gap-2 group">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold flex items-center justify-center mt-0.5">{i}</span>
                        <div className="flex-1 text-xs text-slate-700">
                          <EditableText value={receta[`proces${i}`] || ""} onSave={(v) => updateProcessOrNote("process", i, v)}
                            isEditable={permanentEditMode} placeholder={`Proceso ${i}...`} multiline={true} disabled={isUpdating} />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Notas</h3>
                <div className="space-y-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((i) =>
                    (receta[`nota${i}`] || permanentEditMode) && (
                      <div key={`note-${i}`} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5"></span>
                        <div className="flex-1 text-xs text-slate-700">
                          <EditableText value={receta[`nota${i}`] || ""} onSave={(v) => updateProcessOrNote("note", i, v)}
                            isEditable={permanentEditMode} placeholder={`Nota ${i}...`} multiline={true} disabled={isUpdating} />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Info, Imagen, Rendimiento, Emplatado */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="p-4 space-y-4">
              {/* Imagen */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Imagen del Plato</h3>
                {permanentEditMode ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input type="url" placeholder="URL de la imagen" value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)} disabled={isUpdating}
                        className="flex-1 h-8 text-xs" />
                      <Button size="sm" onClick={updateImagenUrl} disabled={isUpdating} className="h-8 text-xs px-3">
                        {isUpdating ? "..." : "Guardar"}
                      </Button>
                    </div>
                    {(foto || imagenUrl) && (
                      <img src={imagenUrl || foto} alt="Preview"
                        className="w-full h-40 object-cover rounded-xl shadow-sm" onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                  </div>
                ) : foto ? (
                  <img src={foto} alt="Imagen del plato" className="w-full h-44 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center">
                    <ChefHat className="h-10 w-10 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Autor */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">Autor</h3>
                <div className="text-xs text-slate-700">
                  <EditableText value={receta.autor || ""} onSave={(v) => updateInfoField("autor", v)}
                    isEditable={permanentEditMode} placeholder="Nombre del autor..." multiline={false} disabled={isUpdating} />
                </div>
              </div>

              {/* Rendimiento */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">Rendimiento</h3>
                {permanentEditMode ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Porción</label>
                        <Input type="number" value={rendimientoPorcion} onChange={(e) => setRendimientoPorcion(e.target.value)} disabled={isUpdating} className="h-7 text-xs mt-0.5" />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Cantidad</label>
                        <Input type="number" value={rendimientoCantidad} onChange={(e) => setRendimientoCantidad(e.target.value)} disabled={isUpdating} className="h-7 text-xs mt-0.5" />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Unidad</label>
                        <Input type="text" value={rendimientoUnidades} onChange={(e) => setRendimientoUnidades(e.target.value)} disabled={isUpdating} className="h-7 text-xs mt-0.5" />
                      </div>
                    </div>
                    <Button size="sm" onClick={updateRendimiento} disabled={isUpdating} className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isUpdating ? "Guardando..." : "Guardar Rendimiento"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">{rendimientoDisplay || <span className="text-slate-400 italic">No especificado</span>}</p>
                )}
              </div>

              {/* Emplatado */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">Emplatado</h3>
                <EmplatadoEditor value={receta.emplatado || ""} onSave={(v) => updateInfoField("emplatado", v)}
                  isEditable={permanentEditMode} placeholder="Describir emplatado..." disabled={isUpdating} />
              </div>

              {/* Meta */}
              <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 border border-slate-100">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Fuente: {recetaSource}</span>
                  {receta.actualizacion && <span>Act: {new Date(receta.actualizacion).toLocaleDateString("es-CO")}</span>}
                </div>
                <div className="text-[8px] text-slate-300 font-mono truncate">ID: {receta._id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import modal */}
      {showImportModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-h-[90%] overflow-auto">
            <RecipeImportModal
              onClose={() => setShowImportModal(false)}
              initialTargetProduct={implementationInstances.length > 0 ? implementationInstances[0] : null}
              forcedRecipeId={receta._id} forcedRecipeSource={recetaSource}
              onSuccess={() => alert("Receta importada correctamente. Por favor recarga si es necesario.")} />
          </div>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecetaModal;
