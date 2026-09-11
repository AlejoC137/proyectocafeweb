import React, { useEffect, useState, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { Save, Plus, X } from "lucide-react";
import RecipeImportModal from './RecipeImportModal';
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, getRecepie, updateItem } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { MENU, ITEMS, PRODUCCION } from "../../../redux/actions-types";
import { recetaMariaPaula } from "../../../redux/calcularReceta.jsx";
import supabase from "../../../config/supabaseClient";
import HorizontalGallery from "../../components/Menu/MenuPrintHorizontal/HorizontalGallery";

import EditableIngredientRow from "./RecetaModalComponents/EditableIngredientRow";
import RecipeSection from "./RecetaModalComponents/RecipeSection";

// Sub-components
import { handlePrintReceta as printRecetaPdf } from "./RecetaModalComponents/printReceta";
import RecetaHeader from "./RecetaModalComponents/RecetaHeader";
import RecetaCostosCard from "./RecetaModalComponents/RecetaCostosCard";
import RecetaProcesosNotas from "./RecetaModalComponents/RecetaProcesosNotas";
import RecetaSidebarMeta from "./RecetaModalComponents/RecetaSidebarMeta";

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function RecetaModal({ item, onClose }) {
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
  const [rendimientoPorcion, setRendimientoPorcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // Shared gallery states
  const [showGallery, setShowGallery] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleGallerySelect = async (img) => {
    setImagenUrl(img.url);
    setShowGallery(false);
    
    if (receta.forId) {
      setIsUpdating(true);
      try {
        const result = await dispatch(updateItem(receta.forId, { Foto: img.url }, "Menu"));
        if (result) setFoto(img.url);
      } catch (error) {
        alert("Error al actualizar la imagen: " + error.message);
      } finally {
        setIsUpdating(false);
      }
    }
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
      alert("Imagen demasiado pesada (<4MB)");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Images_eventos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Images_eventos')
        .getPublicUrl(filePath);

      const newImage = {
        id: 'IMG_' + Date.now(),
        url: publicUrl,
        storagePath: filePath,
        height: 300
      };

      const { data: configs, error: fetchErr } = await supabase.from('menu_print_config').select('*');
      if (!fetchErr && configs && configs.length > 0) {
        const configToUpdate = configs.find(c => c.id === 2) || configs[0];
        const updatedImages = [...(configToUpdate.images || []), newImage];
        await supabase.from('menu_print_config').update({
          images: updatedImages
        }).eq('id', configToUpdate.id);
      }

      setImagenUrl(publicUrl);
      
      if (receta.forId) {
        const result = await dispatch(updateItem(receta.forId, { Foto: publicUrl }, "Menu"));
        if (result) setFoto(publicUrl);
      }

      alert("Imagen subida y guardada exitosamente");
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
      setShowGallery(false);
    }
  };

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
      const payloadReceta = { 
        precioUnitario: valorPorUnidad, 
        actualizacion: new Date().toISOString() 
      };
      const resultReceta = await dispatch(updateItem(receta._id, payloadReceta, recetaSource));
      
      if (resultReceta) {
        setReceta(prev => ({ ...prev, ...payloadReceta }));
      }

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
    if (!window.confirm("⚠️ CONFIRMACIÓN DE GUARDADO:\n\n¿Estás seguro de que deseas guardar y actualizar los cambios de esta receta en Supabase?")) return;
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

  const handlePrint = () => {
    printRecetaPdf({
      receta,
      foto,
      ingredientesAjustados,
      produccionAjustada,
      calculoDetalles,
      precioVentaFinal,
      costoProduccion,
      recetaSource,
      formatCurrency,
    });
  };

  const rendimientoDisplay = (() => {
    if (!receta?.rendimiento) return null;
    try { const r = JSON.parse(receta.rendimiento); return `${r.porcion || 1} porción · ${r.cantidad} ${r.unidades}`; }
    catch { return null; }
  })();

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
        <RecetaHeader
          receta={receta}
          rendimientoDisplay={rendimientoDisplay}
          recetaSource={recetaSource}
          formatCurrency={formatCurrency}
          updateInfoField={updateInfoField}
          permanentEditMode={permanentEditMode}
          isUpdating={isUpdating}
          porcentaje={porcentaje}
          setPorcentaje={setPorcentaje}
          editShow={editShow}
          setEditShow={setEditShow}
          handleEnablePermanentEdit={handleEnablePermanentEdit}
          handleCancelEdit={handleCancelEdit}
          showPinInput={showPinInput}
          pinCode={pinCode}
          setPinCode={setPinCode}
          handlePinVerification={handlePinVerification}
          setShowImportModal={setShowImportModal}
          handlePrintReceta={handlePrint}
          onClose={onClose}
          navigate={navigate}
        />

        {/* ── Content grid ── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0">

          {/* Col 1: Ingredientes & Costos */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar border-r border-slate-200 bg-white">
            <div className="p-4 space-y-4">
              {permanentEditMode ? (
                <>
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
                        onNavigate={(itemId) => {
                          const itemData = buscarPorId(itemId);
                          if (itemData && itemData.Receta) {
                            navigate(`/receta/${itemData.Receta}`);
                          } else {
                            navigate(`/item/${itemId}`);
                          }
                        }} />
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
              <RecetaCostosCard
                recetaSource={recetaSource}
                permanentEditMode={permanentEditMode}
                tiempoProceso={tiempoProceso}
                setTiempoProceso={setTiempoProceso}
                costoManualCMP={costoManualCMP}
                setCostoManualCMP={setCostoManualCMP}
                costoProduccion={costoProduccion}
                handleCalculateUnitValue={handleCalculateUnitValue}
                isUpdating={isUpdating}
                rendimientoCantidad={rendimientoCantidad}
                calculoDetalles={calculoDetalles}
                precioVentaFinal={precioVentaFinal}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>

          {/* Col 2: Procesos & Notas */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar border-r border-slate-200 bg-white">
            <RecetaProcesosNotas
              receta={receta}
              permanentEditMode={permanentEditMode}
              updateProcessOrNote={updateProcessOrNote}
              updateField={updateField}
              isUpdating={isUpdating}
            />
          </div>

          {/* Col 3: Info, Imagen, Rendimiento, Emplatado */}
          <div className="lg:col-span-1 overflow-y-auto custom-scrollbar bg-white">
            <RecetaSidebarMeta
              receta={receta}
              id={id}
              foto={foto}
              imagenUrl={imagenUrl}
              setImagenUrl={setImagenUrl}
              permanentEditMode={permanentEditMode}
              isUpdating={isUpdating}
              uploadingImage={uploadingImage}
              setShowGallery={setShowGallery}
              updateImagenUrl={updateImagenUrl}
              updateInfoField={updateInfoField}
              rendimientoPorcion={rendimientoPorcion}
              setRendimientoPorcion={setRendimientoPorcion}
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
            <RecipeImportModal
              onClose={() => setShowImportModal(false)}
              initialTargetProduct={implementationInstances.length > 0 ? implementationInstances[0] : null}
              forcedRecipeId={receta._id} forcedRecipeSource={recetaSource}
              onSuccess={() => {
                alert("Receta importada correctamente. La página se recargará.");
                window.location.reload();
              }} />
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {showGallery && (
        <HorizontalGallery
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={handleGallerySelect}
          onUploadNew={handleUploadNewClick}
        />
      )}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecetaModal;
