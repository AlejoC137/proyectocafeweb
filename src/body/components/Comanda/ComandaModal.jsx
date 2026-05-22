import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFromTable, actualizarComanda } from "../../../redux/actions-Comanda";
import { getAllFromTable as getAllStaff } from "../../../redux/actions";
import { STAFF, PROCEDE, PRODUCCION, RECETAS_MENU, RECETAS_PRODUCCION, ITEMS } from "../../../redux/actions-types";
import { X, ClipboardList, Edit, Save, Loader2, Tag, Calendar as CalendarIcon, FileText, CheckCircle, Clock, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MacrocalculadorDeValorDeRecetas from "../../views/ventaCompra/MacrocalculadorDeValorDeRecetas";

// ─── Componentes Auxiliares ───────────────────────────────────────────────

const InfoRow = ({ label, value, highlight = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-500 w-1/3">{label}</span>
    <span className={`text-xs font-semibold text-right ${highlight ? "text-blue-700 text-sm" : "text-slate-800"} w-2/3 break-words`}>
      {value ?? "N/A"}
    </span>
  </div>
);

const SectionCard = ({ title, icon: Icon, color = "blue", children }) => {
  const colors = {
    blue: "border-l-blue-500 bg-blue-50/30",
    green: "border-l-emerald-500 bg-emerald-50/30",
    amber: "border-l-amber-500 bg-amber-50/30",
    purple: "border-l-purple-500 bg-purple-50/30",
  };
  const iconColors = { blue: "text-blue-500", green: "text-emerald-500", amber: "text-amber-500", purple: "text-purple-500" };
  return (
    <div className={`border-l-4 rounded-r-lg p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${iconColors[color]}`} />
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      {children}
    </div>
  );
};

const FormField = ({ label, name, type = "text", isReadOnly = false, options = null, value, handleChange, isSaving }) => {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {options ? (
        <select name={name} value={value} onChange={handleChange} disabled={isSaving || isReadOnly}
          className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:bg-slate-100">
          <option value="">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} value={value} onChange={handleChange}
          disabled={isSaving || isReadOnly} readOnly={isReadOnly}
          className={`w-full p-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 disabled:opacity-50 min-h-[80px] ${isReadOnly ? "bg-slate-100 text-slate-400" : ""}`} />
      ) : type === "checkbox" ? (
        <input type="checkbox" name={name} checked={value} onChange={handleChange}
          disabled={isSaving || isReadOnly} className="ml-2 w-4 h-4 text-blue-600 rounded border-gray-300" />
      ) : (
        <Input name={name} type={type} value={value} onChange={handleChange}
          disabled={isSaving || isReadOnly} readOnly={isReadOnly}
          className={`h-8 text-xs ${isReadOnly ? "bg-slate-100 text-slate-400" : ""}`} />
      )}
    </div>
  );
};

// ─── Modal Principal ──────────────────────────────────────────────────────

const ComandaModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const comandas = useSelector((state) => state.allComanda || []);
  const allStaff = useSelector((state) => state.allStaff || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allProcedimientos = useSelector((state) => state.allProcedimientos || []);

  const [editableItem, setEditableItem] = useState(null);
  const [displayItem, setDisplayItem] = useState(null);
  const [showMacro, setShowMacro] = useState(false);

  const safeJsonParse = (jsonString, fallback) => {
    if (jsonString && typeof jsonString === "string") {
      try { return JSON.parse(jsonString); } catch (e) { return fallback; }
    }
    return typeof jsonString === "object" && jsonString !== null ? jsonString : fallback;
  };

  const itemToEditable = (item) => {
    const parsedDates = safeJsonParse(item.Dates, { isued: "", EjecutionDate: "", date_repiting: [] });
    const parsedPagado = safeJsonParse(item.Pagado, { pagadoFull: false, susceptible: false, adelanto: "" });
    const parsedProcedimientos = safeJsonParse(item.Procedimientos, []);

    return {
      ...item,
      Tittle: item.Tittle || "",
      Categoria: item.Categoria || "",
      Ejecutor: item.Ejecutor || "",
      Terminado: item.Terminado || false,
      Notas: item.Notas || "",
      
      // Flattened Dates
      Dates_isued: parsedDates.isued || "",
      Dates_EjecutionDate: parsedDates.EjecutionDate || "",
      Dates_date_repiting: Array.isArray(parsedDates.date_repiting) ? JSON.stringify(parsedDates.date_repiting) : "[]",
      
      // Flattened Pagado
      Pagado_pagadoFull: parsedPagado.pagadoFull || false,
      Pagado_susceptible: parsedPagado.susceptible || false,
      Pagado_adelanto: parsedPagado.adelanto || "",

      // Flattened Procedimientos
      Procedimientos_str: JSON.stringify(parsedProcedimientos, null, 2),
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const promises = [];
      if (comandas.length === 0) promises.push(dispatch(getAllFromTable("Comanda")));
      if (allStaff.length === 0) promises.push(dispatch(getAllStaff(STAFF)));
      if (allProduccion.length === 0) promises.push(dispatch(getAllStaff(PRODUCCION)));
      if (allProcedimientos.length === 0) promises.push(dispatch(getAllStaff(PROCEDE)));
      promises.push(dispatch(getAllStaff(RECETAS_MENU)));
      promises.push(dispatch(getAllStaff(RECETAS_PRODUCCION)));
      promises.push(dispatch(getAllStaff(ITEMS)));
      try { await Promise.all(promises); }
      catch (error) { console.error("Error loading data:", error); }
      finally { setLoading(false); }
    };
    loadData();
  }, [dispatch, comandas.length, allStaff.length, allProduccion.length, allProcedimientos.length]);

  const originalItem = useMemo(() => {
    if (comandas.length > 0 && id) return comandas.find((c) => c._id === id);
    return null;
  }, [comandas, id]);

  useEffect(() => {
    if (originalItem && !displayItem) {
      setDisplayItem(originalItem);
      setEditableItem(itemToEditable(originalItem));
    }
  }, [originalItem, displayItem]);

  const handleClose = () => navigate(-1);
  const handleCancel = () => {
    if (displayItem) setEditableItem(itemToEditable(displayItem));
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!editableItem) return;
    setIsSaving(true);
    try {
      let parsedRepiting = [];
      try { parsedRepiting = JSON.parse(editableItem.Dates_date_repiting); } catch (e) {}

      let parsedProc = [];
      try { parsedProc = JSON.parse(editableItem.Procedimientos_str); } catch (e) {}

      const payload = {
        Tittle: editableItem.Tittle,
        Categoria: editableItem.Categoria,
        Ejecutor: editableItem.Ejecutor,
        Terminado: editableItem.Terminado,
        Notas: editableItem.Notas,
        Dates: JSON.stringify({
          isued: editableItem.Dates_isued,
          EjecutionDate: editableItem.Dates_EjecutionDate,
          date_repiting: parsedRepiting,
        }),
        Pagado: JSON.stringify({
          pagadoFull: editableItem.Pagado_pagadoFull,
          susceptible: editableItem.Pagado_susceptible,
          adelanto: editableItem.Pagado_adelanto,
        }),
        Procedimientos: JSON.stringify(parsedProc),
      };

      await dispatch(actualizarComanda(id, payload));
      
      // Actualizar local
      const savedData = { ...displayItem, ...payload };
      setDisplayItem(savedData);
      setEditableItem(itemToEditable(savedData));
      setIsEditing(false);
      
      // Refrescar globalmente
      dispatch(getAllFromTable("Comanda"));
    } catch (error) {
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render View Mode ─────────────────────────────────────────────────────

  const viewContent = () => {
    if (!displayItem) return null;
    
    const dates = safeJsonParse(displayItem.Dates, {});
    const pagado = safeJsonParse(displayItem.Pagado, {});
    const procs = safeJsonParse(displayItem.Procedimientos, []);

    const staffObj = allStaff.find(s => s._id === displayItem.Ejecutor) || allStaff.find(s => `${s.Nombre} ${s.Apellido}` === displayItem.Ejecutor);
    const ejecutorName = staffObj ? `${staffObj.Nombre} ${staffObj.Apellido}` : (displayItem.Ejecutor || "N/A");

    return (
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className={`flex-1 p-3 rounded-lg border text-center ${displayItem.Terminado ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Estado de Tarea</div>
                <div className="text-sm font-black flex items-center justify-center gap-1">
                  {displayItem.Terminado ? <><CheckCircle size={16}/> TERMINADO</> : <><Clock size={16}/> PENDIENTE</>}
                </div>
              </div>
              <div className={`flex-1 p-3 rounded-lg border text-center ${pagado.pagadoFull ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Estado de Pago</div>
                <div className="text-sm font-black flex items-center justify-center gap-1">
                  {pagado.pagadoFull ? "PAGADO" : "PENDIENTE DE PAGO"}
                </div>
              </div>
            </div>

            <SectionCard title="Información General" icon={Tag} color="blue">
              <InfoRow label="Título" value={displayItem.Tittle} highlight />
              <InfoRow label="Categoría" value={displayItem.Categoria} />
              <InfoRow label="Ejecutor asignado" value={ejecutorName} />
            </SectionCard>

            <SectionCard title="Fechas y Tiempos" icon={CalendarIcon} color="amber">
              <InfoRow label="Fecha Creación" value={dates.isued ? dates.isued.split("T")[0] : "N/A"} />
              <InfoRow label="Fecha Ejecución" value={dates.EjecutionDate ? dates.EjecutionDate.split("T")[0] : "N/A"} highlight />
              <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs font-medium text-slate-500 w-1/3">Repeticiones</span>
                <span className="text-xs font-semibold text-slate-800 text-right w-2/3">
                  {Array.isArray(dates.date_repiting) && dates.date_repiting.length > 0 ? `${dates.date_repiting.length} fechas` : "No se repite"}
                </span>
              </div>
            </SectionCard>

            <SectionCard title="Detalles de Pago" icon={CheckCircle} color="green">
              <InfoRow label="Susceptible a Pago" value={pagado.susceptible ? "Sí" : "No"} />
              <InfoRow label="Adelanto / Detalles" value={pagado.adelanto || "N/A"} />
            </SectionCard>

            <SectionCard title="Notas Adicionales" icon={FileText} color="purple">
              <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 min-h-[60px] whitespace-pre-wrap">
                {displayItem.Notas || "Sin notas."}
              </div>
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-3 h-full">

        <SectionCard title={`Procedimientos (${procs.length})`} icon={ClipboardList} color="blue">
          {procs.length > 0 && (
            <Button onClick={() => setShowMacro(true)} className="w-full mb-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 h-8 text-xs font-semibold border border-indigo-200">
              <Calculator className="h-3.5 w-3.5 mr-2" /> Macro Calculador Insumos
            </Button>
          )}
          {procs.length > 0 ? (
            <div className="space-y-2 mt-2">
              {procs.map((p, idx) => {
                let parsedP = p;
                if (typeof p === "string") {
                  try {
                    parsedP = JSON.parse(p);
                  } catch (e) {
                    // Si falla el parseo, mostrar como string normal
                  }
                }
                
                if (typeof parsedP === "object" && parsedP !== null && parsedP._id) {
                  const isProduccion = parsedP._tipo === "produccion";
                  const link = isProduccion ? `/receta/${parsedP._id}` : `/ProcedimientoModal/${parsedP._id}`;
                  const badgeColor = isProduccion ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700";
                  
                  let extraInfo = null;
                  if (isProduccion) {
                    const fullProd = allProduccion.find(p => p._id === parsedP._id);
                    if (fullProd) {
                      extraInfo = (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap gap-2">
                          {fullProd.Rendimiento && <span>Rendimiento: {fullProd.Rendimiento}</span>}
                          {fullProd.Categoria && <span>Cat: {fullProd.Categoria}</span>}
                        </div>
                      );
                    }
                  } else {
                    const fullProc = allProcedimientos.find(p => p._id === parsedP._id);
                    if (fullProc) {
                      extraInfo = (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          {fullProc.tittle || fullProc.Nombre_del_producto}
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
                            {parsedP._tipo}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {parsedP._name || "Sin Nombre"}
                          </span>
                        </div>
                        <Button asChild className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 focus:outline-none focus-visible:ring-0">
                            📕
                          </a>
                        </Button>
                      </div>
                      {extraInfo}
                    </div>
                  );
                }

                // Fallback para strings simples
                return (
                  <div key={idx} className="p-2 text-xs text-slate-600 bg-slate-50 rounded border border-slate-100">
                    {typeof p === "string" ? p : JSON.stringify(p)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-1">Sin procedimientos asociados.</div>
          )}
        </SectionCard>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Edit Mode ─────────────────────────────────────────────────────

  const editContent = () => {
    const cp = { editableItem, handleChange, isSaving };
    const staffOptions = allStaff.map(s => ({ value: s._id, label: `${s.Nombre} ${s.Apellido}` }));

    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Column Edit */}
          <div className="flex flex-col gap-3">
            <SectionCard title="Información General" icon={Tag} color="blue">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><FormField label="Título" name="Tittle" value={editableItem.Tittle} handleChange={handleChange} isSaving={isSaving} /></div>
                <FormField label="Categoría" name="Categoria" value={editableItem.Categoria} handleChange={handleChange} isSaving={isSaving} />
                <FormField label="Ejecutor" name="Ejecutor" options={staffOptions} value={editableItem.Ejecutor} handleChange={handleChange} isSaving={isSaving} />
                <div className="col-span-2 flex items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/3">¿Comanda Terminada?</span>
                  <FormField type="checkbox" name="Terminado" value={editableItem.Terminado} handleChange={handleChange} isSaving={isSaving} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Detalles de Pago" icon={CheckCircle} color="green">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/2">¿Susceptible?</span>
                    <FormField type="checkbox" name="Pagado_susceptible" value={editableItem.Pagado_susceptible} handleChange={handleChange} isSaving={isSaving} />
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/2">¿Pagado Full?</span>
                    <FormField type="checkbox" name="Pagado_pagadoFull" value={editableItem.Pagado_pagadoFull} handleChange={handleChange} isSaving={isSaving} />
                  </div>
                </div>
                <FormField label="Adelanto / Monto" name="Pagado_adelanto" value={editableItem.Pagado_adelanto} handleChange={handleChange} isSaving={isSaving} />
              </div>
            </SectionCard>

            <SectionCard title="Fechas" icon={CalendarIcon} color="amber">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <FormField type="date" label="Fecha Ejecución" name="Dates_EjecutionDate" value={editableItem.Dates_EjecutionDate.split("T")[0]} handleChange={handleChange} isSaving={isSaving} />
                <FormField type="date" label="Fecha Creación" name="Dates_isued" value={editableItem.Dates_isued.split("T")[0]} handleChange={handleChange} isSaving={isSaving} />
                <div className="col-span-2">
                  <FormField type="text" label="Fechas de repetición (JSON Array)" name="Dates_date_repiting" value={editableItem.Dates_date_repiting} handleChange={handleChange} isSaving={isSaving} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Notas Adicionales" icon={FileText} color="purple">
              <FormField type="textarea" label="Notas" name="Notas" value={editableItem.Notas} handleChange={handleChange} isSaving={isSaving} />
            </SectionCard>
          </div>

          {/* Right Column Edit */}
          <div className="flex flex-col gap-3 h-full">
            <SectionCard title="Procedimientos" icon={ClipboardList} color="blue">
              <div className="space-y-3 mt-2 flex flex-col h-full">
                <Button onClick={() => setShowMacro(true)} type="button" className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 h-8 text-xs font-semibold border border-indigo-200">
                  <Calculator className="h-3.5 w-3.5 mr-2" /> Macro Calculador Insumos
                </Button>
                
                {/* Editor interactivo de Procedimientos */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agregar Procedimiento / Producción</label>
                  <select
                    className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) return;
                      const [tipo, id] = value.split("|");
                      let name = "Sin nombre";
                      if (tipo === "produccion") {
                        const p = allProduccion.find(x => x._id === id);
                        if (p) name = p.Nombre_del_producto;
                      } else {
                        const p = allProcedimientos.find(x => x._id === id);
                        if (p) name = p.tittle;
                      }
                      
                      let currentList = [];
                      try { currentList = JSON.parse(editableItem.Procedimientos_str || "[]"); } catch (e) {}
                      currentList.push({ _id: id, _tipo: tipo, _name: name });
                      handleChange({ target: { name: "Procedimientos_str", value: JSON.stringify(currentList), type: "text" } });
                      e.target.value = ""; // reset
                    }}
                    disabled={isSaving}
                  >
                    <option value="">Seleccione para agregar...</option>
                    <optgroup label="PRODUCCIÓN">
                      {allProduccion.map(p => (
                        <option key={`prod_${p._id}`} value={`produccion|${p._id}`}>{p.Nombre_del_producto}</option>
                      ))}
                    </optgroup>
                    <optgroup label="PROCEDIMIENTOS">
                      {allProcedimientos.map(p => (
                        <option key={`proc_${p._id}`} value={`procedimiento|${p._id}`}>{p.tittle}</option>
                      ))}
                    </optgroup>
                  </select>

                  <div className="mt-2 space-y-2 border border-slate-200 rounded p-2 bg-slate-50 min-h-[150px] max-h-[400px] overflow-y-auto">
                    {(() => {
                      let procs = [];
                      try { procs = JSON.parse(editableItem.Procedimientos_str || "[]"); } catch (e) {}
                      if (procs.length === 0) return <div className="text-xs text-slate-400 italic p-2">No hay procedimientos agregados.</div>;
                      
                      return procs.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded shadow-sm">
                          <div className="flex flex-col gap-1 overflow-hidden">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-max ${p._tipo === 'produccion' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                              {p._tipo}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate">{p._name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 flex-shrink-0 ml-2"
                            onClick={() => {
                              const newList = procs.filter((_, i) => i !== idx);
                              handleChange({ target: { name: "Procedimientos_str", value: JSON.stringify(newList), type: "text" } });
                            }}
                            disabled={isSaving}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>
            </SectionCard>
          </div>

        </div>
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-[98vw] max-w-[1600px] transition-all duration-300 rounded-xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {isEditing ? "Editando Comanda" : (displayItem?.Tittle || "Detalles de Comanda")}
              </h2>
              {!isEditing && displayItem && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">{displayItem.Categoria || "Sin Cat"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isEditing && displayItem && (
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors text-xs font-medium">
                <Edit className="h-3.5 w-3.5" /> Editar
              </button>
            )}
            <button onClick={handleClose}
              className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
              <span className="ml-2 text-sm text-slate-500">Cargando...</span>
            </div>
          ) : !displayItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ClipboardList className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">Comanda no encontrada</p>
              <p className="font-mono text-xs text-slate-300 mt-1">ID: {id}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isEditing ? editContent() : viewContent()}
            </div>
          )}
        </div>

        {/* Footer (edit mode only) */}
        {isEditing && (
          <div className="flex items-center justify-end px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="text-xs h-8">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 min-w-[110px]">
              {isSaving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Guardando...</>
                : <><Save className="h-3.5 w-3.5 mr-1.5" />Guardar Cambios</>}
            </Button>
          </div>
        )}
      </div>

      {showMacro && displayItem && (
        <MacrocalculadorDeValorDeRecetas 
          onClose={() => setShowMacro(false)} 
          preSelectedItems={safeJsonParse(displayItem.Procedimientos, []).map(p => {
             let parsedP = p;
             if (typeof p === "string") {
                 try { parsedP = JSON.parse(p); } catch (e) {}
             }
             return { _id: parsedP._id, batches: 1 };
          }).filter(p => p._id)}
        />
      )}
    </div>
  );
};

export default ComandaModal;
