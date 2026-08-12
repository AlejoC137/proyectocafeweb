import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, getRecepie, updateItem } from "../../../redux/actions.js";
import { Button } from "@/components/ui/button";
import { MENU, ITEMS, PRODUCCION } from "../../../redux/actions-types.js";
import { recetaMariaPaula } from "../../../redux/calcularReceta.jsx";
import { Save, Plus, X, DollarSign } from "lucide-react";
import ProcedimientoImportModal from "./ProcedimientoImportModal.jsx";

// Sub-components
import EditableIngredientRow from "./RecetaModalComponents/EditableIngredientRow";
import RecipeSection from "./RecetaModalComponents/RecipeSection";
import { handlePrintProcedimiento } from "./ProcedimientoModalComponents/printProcedimiento";
import ProcedimientoHeader from "./ProcedimientoModalComponents/ProcedimientoHeader";
import ProcedimientoProcesosNotas from "./ProcedimientoModalComponents/ProcedimientoProcesosNotas";
import ProcedimientoSidebarMeta from "./ProcedimientoModalComponents/ProcedimientoSidebarMeta";

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function ProcedimientoModal({ item, onClose }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const id = item?.Receta || paramId;

  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allOptions = useMemo(() => [...allItems, ...allProduccion], [allItems, allProduccion]);

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
  const [imagenUrl, setImagenUrl] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

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
        let result = await getRecepie(id, "RecetasProcedimientos");
        if (!result) throw new Error("Receta no encontrada");
        setReceta(result); setRecetaSource("RecetasProcedimientos"); setTiempoProceso(result.ProcessTime || 0);
        if (result.forId) {
          const plato = await getRecepie(result.forId, "Procedimientos");
          if (plato) { setFoto(plato.Foto); setMenuItem(plato); }
        }
      } catch (err) { setError("Error al obtener el procedimiento."); console.error(err); }
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
    } else { setPinCode(""); }
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
    const rendimientoData = {
      porcion: receta.rendimiento ? JSON.parse(receta.rendimiento).porcion ?? 1 : 1,
      cantidad: Number(rendimientoCantidad),
      unidades: rendimientoUnidades,
    };
    await updateField({ rendimiento: JSON.stringify(rendimientoData) });
  };

  const updateImagenUrl = async () => {
    if (!receta.forId) return;
    setIsUpdating(true);
    try {
      const result = await dispatch(updateItem(receta.forId, { Foto: imagenUrl }, "Procedimientos"));
      if (result) setFoto(imagenUrl);
    } catch (error) { alert("Error: " + error.message); }
    finally { setIsUpdating(false); }
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
      items.forEach((it) => {
        const isProd = allProduccion.some(p => p._id === it.item_Id);
        const prefix = isProd ? "producto_interno" : "item";
        const idx = isProd ? pCounter++ : iCounter++;
        payload[`${prefix}${idx}_Id`] = it.item_Id || null;
        payload[`${prefix}${idx}_Cuantity_Units`] = it.item_Id
          ? JSON.stringify({ metric: { cuantity: Number(it.originalQuantity) || null, units: it.unidades || null } }) : null;
      });
      return payload;
    };
    setIsUpdating(true);
    try {
      const fullPayload = {
        ...receta,
        ...mapItemsToPayload([...editableIngredientes, ...editableProduccion]),
        ProcessTime: tiempoProceso,
        actualizacion: new Date().toISOString(),
      };
      const result = await dispatch(updateItem(receta._id, fullPayload, recetaSource));
      if (result) { setReceta(fullPayload); alert("Cambios guardados."); }
      else throw new Error("Falló la actualización.");
    } catch (error) { console.error("Error:", error); alert("Error al guardar."); }
    finally { setIsUpdating(false); }
  };

  const handlePrint = () => {
    handlePrintProcedimiento({
      receta,
      menuItem,
      foto,
      ingredientesAjustados,
      produccionAjustada,
    });
  };

  const rendimientoDisplay = (() => {
    if (!receta?.rendimiento) return null;
    try { const r = JSON.parse(receta.rendimiento); return `${r.cantidad} ${r.unidades}`; }
    catch { return null; }
  })();

  if (loading) return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 flex items-center gap-3 shadow-2xl">
        <div className="h-6 w-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600 font-medium">Cargando procedimiento...</span>
      </div>
    </div>, document.body
  );

  if (error || !receta) return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-center shadow-2xl max-w-sm">
        <p className="text-red-500 font-medium">{error || "No se pudo cargar el procedimiento."}</p>
        <button onClick={onClose || (() => navigate(-1))} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">Cerrar</button>
      </div>
    </div>, document.body
  );

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-0">
      <div className="bg-slate-50 w-screen h-screen flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <ProcedimientoHeader
          menuItem={menuItem}
          receta={receta}
          rendimientoDisplay={rendimientoDisplay}
          porcentaje={porcentaje}
          setPorcentaje={setPorcentaje}
          editShow={editShow}
          setEditShow={setEditShow}
          permanentEditMode={permanentEditMode}
          handleEnablePermanentEdit={handleEnablePermanentEdit}
          handleCancelEdit={handleCancelEdit}
          isUpdating={isUpdating}
          showPinInput={showPinInput}
          pinCode={pinCode}
          setPinCode={setPinCode}
          handlePinVerification={handlePinVerification}
          setShowImportModal={setShowImportModal}
          handlePrint={handlePrint}
          onClose={onClose}
          navigate={navigate}
        />

        {/* ── Content grid ── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0">

          {/* Col 1: Ingredientes & Insumos */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar border-r border-slate-200 bg-white">
            <div className="p-4 space-y-4">
              {permanentEditMode ? (
                <>
                  <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Editando Insumos</h3>
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
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Insumos</h4>
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
                      <Plus className="h-3 w-3" /> Añadir Insumo
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
                  <RecipeSection title="Insumos" items={ingredientesAjustados}
                    isEditing={editShow} onCheck={(i) => handleCheck(setIngredientes, i)}
                    onSave={(i, v) => handleSave(setIngredientes, i, v)} />
                  <RecipeSection title="Producción Interna" items={produccionAjustada}
                    isEditing={editShow} onCheck={(i) => handleCheck(setProduccion, i)}
                    onSave={(i, v) => handleSave(setProduccion, i, v)} />
                </>
              )}

              {(calculoDetalles || costoProduccion > 0) && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" /> Costos
                  </h4>
                  {costoProduccion > 0 && (
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                      <span className="text-xs font-bold text-blue-700">Costo Total</span>
                      <span className="text-base font-bold text-blue-700">{formatCurrency(costoProduccion)}</span>
                    </div>
                  )}
                  {calculoDetalles && (
                    <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-amber-700">Precio Venta</span>
                      <span className="text-base font-bold text-amber-700">{formatCurrency(precioVentaFinal)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Procesos & Notas */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar border-r border-slate-200 bg-white">
            <ProcedimientoProcesosNotas
              receta={receta}
              permanentEditMode={permanentEditMode}
              updateProcessOrNote={updateProcessOrNote}
              isUpdating={isUpdating}
            />
          </div>

          {/* Col 3: Info, Imagen, Rendimiento, Observaciones */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar bg-white">
            <ProcedimientoSidebarMeta
              receta={receta}
              id={id}
              foto={foto}
              imagenUrl={imagenUrl}
              setImagenUrl={setImagenUrl}
              permanentEditMode={permanentEditMode}
              isUpdating={isUpdating}
              updateImagenUrl={updateImagenUrl}
              updateInfoField={updateInfoField}
              rendimientoCantidad={rendimientoCantidad}
              setRendimientoCantidad={setRendimientoCantidad}
              rendimientoUnidades={rendimientoUnidades}
              setRendimientoUnidades={setRendimientoUnidades}
              updateRendimiento={updateRendimiento}
              rendimientoDisplay={rendimientoDisplay}
              recetaSource={recetaSource}
            />
          </div>
        </div>
      </div>

      {/* Import modal */}
      {showImportModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-h-[90%] overflow-auto">
            <ProcedimientoImportModal
              onClose={() => setShowImportModal(false)}
              forcedRecipeId={receta._id} forcedRecipeSource={recetaSource}
              onSuccess={() => alert("Procedimiento importado correctamente. Por favor recarga si es necesario.")} />
          </div>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default ProcedimientoModal;
