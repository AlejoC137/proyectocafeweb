import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { getAllFromTable } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, PROCEDE, AREAS, PRODUCCION } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { crearProcedimiento } from "../../../redux/actions-Procedimientos";
import { crearComanda } from "../../../redux/actions-Comanda";
import { X, Plus } from "lucide-react";

function ComandaCreator({ initialFecha, isModal, onClose }) {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const allStaff = useSelector((state) => state.allStaff || []);
  const allProcedimientos = useSelector(
    (state) => state.allProcedimientos || []
  );
  const allProduccion = useSelector((state) => state.allProduccion || []);
  
  const fechaDesdeURL = initialFecha || searchParams.get("fecha");

  // --- ESTADO INICIAL MODIFICADO ---
  // Adaptado a la nueva estructura: { isued, EjecutionDate, date_repiting }
  const [formData, setFormData] = useState({
    Dates: {
      isued: new Date().toISOString(),
      EjecutionDate: fechaDesdeURL ? fechaDesdeURL.split("T")[0] : "", // Fecha principal
      date_repiting: [], // Array de repeticiones, inicia vacío
    },
    Terminado: false,
    Pagado: { pagadoFull: false, adelanto: "NoAplica", susceptible: false },
    Categoria: "",
    Ejecutor: "",
    Procedimientos: [],
    Tittle: "",
    Notas: "", 
  });
  
  const [procedimientosList, setProcedimientosList] = useState([]);
  const [procedimientosSelectors, setProcedimientosSelectors] = useState([0]);

  const [ejecutorDisplay, setEjecutorDisplay] = useState("");
  const [categoriaDisplay, setCategoriaDisplay] = useState("");
  const [procedimientosDisplay, setProcedimientosDisplay] = useState([""]);
  
  // Estado para la repetición estilo Google Calendar
  const [recurrence, setRecurrence] = useState({
    frequency: "none", // none, daily, weekly, monthly
    endType: "occurrences", // occurrences, date
    occurrences: 5,
    endDate: "",
  });

  useEffect(() => {
    dispatch(getAllFromTable(PROCEDE));
    dispatch(getAllFromTable(PRODUCCION));
    dispatch(getAllFromTable(STAFF));
  }, [dispatch]);

  const allProcedimientosAndProduccion = useMemo(
    () => [
      ...allProcedimientos.map((proc) => ({ ...proc, _tipo: "procedimiento" })),
      ...allProduccion.map((prod) => ({ ...prod, _tipo: "produccion" })),
    ],
    [allProcedimientos, allProduccion]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Manejador para campos anidados dentro de 'Dates' (isued, EjecutionDate)
  const handleDatesFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      Dates: { ...prev.Dates, [name]: value },
    }));
  };

  // --- MANEJADORES PARA 'date_repiting' (Sin cambios, ya funcionan) ---

  const handleRepitingDateChange = (index, value) => {
    const newRepitingDates = [...formData.Dates.date_repiting];
    newRepitingDates[index] = value;
    setFormData((prev) => ({
      ...prev,
      Dates: { ...prev.Dates, date_repiting: newRepitingDates },
    }));
  };

  const handleAddDate = () => {
    setFormData((prev) => ({
      ...prev,
      Dates: {
        ...prev.Dates,
        date_repiting: [...prev.Dates.date_repiting, ""], // Añade un slot vacío
      },
    }));
  };

  const handleRemoveDate = (index) => {
    const newRepitingDates = formData.Dates.date_repiting.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      Dates: { ...prev.Dates, date_repiting: newRepitingDates },
    }));
  };

  // Efecto para calcular las fechas automáticamente si hay repetición
  useEffect(() => {
    if (recurrence.frequency === "none") {
      return;
    }

    if (!formData.Dates.EjecutionDate) return;

    const baseDateStr = formData.Dates.EjecutionDate.split("T")[0];
    if (!baseDateStr) return;

    let dates = [];
    let currentDate = new Date(baseDateStr + "T00:00:00");
    
    if (isNaN(currentDate.getTime())) return;

    let occurrencesCount = Number(recurrence.occurrences) || 1;
    let limitDate = recurrence.endDate ? new Date(recurrence.endDate + "T00:00:00") : null;

    let i = 1; 
    while (true) {
      if (recurrence.endType === "occurrences" && i >= occurrencesCount) break;
      
      let nextDate = new Date(currentDate);
      if (recurrence.frequency === "daily") {
        nextDate.setDate(currentDate.getDate() + i);
      } else if (recurrence.frequency === "weekly") {
        nextDate.setDate(currentDate.getDate() + (i * 7));
      } else if (recurrence.frequency === "monthly") {
        nextDate.setMonth(currentDate.getMonth() + i);
      }

      if (recurrence.endType === "date" && limitDate && nextDate > limitDate) break;

      dates.push(nextDate.toISOString().split("T")[0]);
      i++;

      // Límite de seguridad
      if (i > 100) break;
    }

    setFormData((prev) => ({
      ...prev,
      Dates: { ...prev.Dates, date_repiting: dates },
    }));
  }, [recurrence, formData.Dates.EjecutionDate]);

  // --- FIN MANEJADORES 'date_repiting' ---


  const handleEjecutorChange = (e) => {
    const displayName = e.target.value;
    setEjecutorDisplay(displayName);
    const foundStaff = allStaff.find(
      (s) => `${s.Nombre} ${s.Apellido}` === displayName
    );
    setFormData((prev) => ({
      ...prev,
      Ejecutor: foundStaff ? foundStaff._id : "",
    }));
  };

  const handleCategoriaChange = (e) => {
    const displayName = e.target.value;
    setCategoriaDisplay(displayName);
    const foundArea = AREAS.find((area) => area === displayName);
    setFormData((prev) => ({
      ...prev,
      Categoria: foundArea ? foundArea : "",
    }));
  };

  const handleProcedimientoDisplayChange = (index, displayName) => {
    const newDisplayValues = [...procedimientosDisplay];
    newDisplayValues[index] = displayName;
    setProcedimientosDisplay(newDisplayValues);

    const foundItem = allProcedimientosAndProduccion.find((item) => {
      const nombre = item.Nombre_del_producto || item.tittle || item.Nombre;
      const tipo = item._tipo === "procedimiento" ? "PROC" : "PROD";
      const itemDisplayName = `${tipo}: ${nombre}`;
      return itemDisplayName === displayName;
    });

    const updatedList = [...procedimientosList];
    if (foundItem) {
      const nombre = foundItem.Nombre_del_producto || foundItem.tittle || foundItem.Nombre;
      updatedList[index] = { _id: foundItem.Receta, _tipo: foundItem._tipo, _name: nombre };
    } else {
      updatedList[index] = null;
    }

    const cleanList = updatedList.filter(Boolean);
    setProcedimientosList(cleanList);
    setFormData((prev) => ({
      ...prev,
      Procedimientos: cleanList,
    }));
  };


  const handleAddSelector = () => {
    setProcedimientosSelectors((prev) => [...prev, prev.length]);
    setProcedimientosDisplay(prev => [...prev, ""]);
  };

  const handleRemoveSelector = (index) => {
    const updatedSelectors = procedimientosSelectors.filter(
      (_, i) => i !== index
    );
    const updatedDisplay = procedimientosDisplay.filter((_, i) => i !== index);
    const updatedList = procedimientosList.filter((_, i) => i !== index);
    
    setProcedimientosSelectors(updatedSelectors);
    setProcedimientosDisplay(updatedDisplay);
    setProcedimientosList(updatedList);
    
    setFormData((prev) => ({
      ...prev,
      Procedimientos: updatedList,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filtramos fechas vacías del array de repetición antes de enviar
      const finalFormData = {
        ...formData,
        Dates: JSON.stringify({
          ...formData.Dates,
          date_repiting: formData.Dates.date_repiting.filter(date => date),
        }),
        Pagado: JSON.stringify(formData.Pagado),
        Procedimientos: JSON.stringify(formData.Procedimientos)
      };
      
      // Asegurarnos que la acción 'crearComanda' reciba 'finalFormData'
      // y no 'formData' (que podría tener strings vacíos en el array).
      await dispatch(crearComanda(finalFormData)); 
      
      // --- LÓGICA DE RESET MODIFICADA ---
      setFormData({
        Dates: {
          isued: new Date().toISOString(),
          EjecutionDate: "", // Resetea
          date_repiting: [], // Resetea a array vacío
        },
        Terminado: false,
        Pagado: { pagadoFull: false, adelanto: "NoAplica", susceptible: false },
        Categoria: "",
        Ejecutor: "",
        Procedimientos: [],
        Tittle: "",
        Notas: "",
      });
      setProcedimientosList([]);
      setProcedimientosSelectors([0]);
      setEjecutorDisplay("");
      setCategoriaDisplay("");
      setProcedimientosDisplay([""]);
      alert("Comanda guardada correctamente");
      if (isModal && onClose) onClose();
    } catch (error) {
      console.error("Error al guardar la Comanda:", error);
      alert("Error al guardar la Comanda");
    }
  };

  const content = (
    <div className={`bg-white rounded-2xl ${isModal ? "p-2" : "p-8 shadow-2xl mb-6 w-full max-w-4xl border border-slate-100"}`}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Crear Comanda</h2>
          <p className="text-sm text-slate-500 mt-1">Completa los detalles para programar una nueva tarea.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- SECCIÓN DE FECHAS REESTRUCTURADA --- */}
            <div className="md:col-span-2 p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Gestión de Fechas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- CAMPO 'EjecutionDate' (Principal) --- */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="EjecutionDate"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Fecha Principal de Ejecución
                  </label>
                  <input
                    type="date"
                    id="EjecutionDate"
                    name="EjecutionDate"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    value={formData.Dates.EjecutionDate.split("T")[0]}
                    onChange={handleDatesFieldChange}
                  />
                </div>

                {/* --- CAMPO 'isued' (Creación) --- */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="isued"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Fecha de Creación
                  </label>
                  <input
                    type="date"
                    id="isued"
                    name="isued"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    value={formData.Dates.isued.split("T")[0]}
                    onChange={handleDatesFieldChange}
                  />
                </div>
              </div>
              
              {/* --- CAMPO 'date_repiting' (Google Calendar style) --- */}
              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Repetición
                </label>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 mb-4">
                  <select
                    value={recurrence.frequency}
                    onChange={(e) => setRecurrence({...recurrence, frequency: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 font-medium"
                  >
                    <option value="none">No se repite (Añadir manualmente)</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensualmente</option>
                  </select>

                  {recurrence.frequency !== "none" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-slate-100">
                      <p className="text-sm font-semibold text-slate-600">Finaliza:</p>
                      
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="endType" 
                            value="occurrences" 
                            checked={recurrence.endType === "occurrences"}
                            onChange={() => setRecurrence({...recurrence, endType: "occurrences"})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-slate-700">Después de</span>
                          <input 
                            type="number" 
                            min="1" 
                            max="100"
                            value={recurrence.occurrences}
                            onChange={(e) => setRecurrence({...recurrence, occurrences: e.target.value})}
                            disabled={recurrence.endType !== "occurrences"}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-md text-sm disabled:opacity-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                          />
                          <span className="text-sm text-slate-700">ocurrencias</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="endType" 
                            value="date" 
                            checked={recurrence.endType === "date"}
                            onChange={() => setRecurrence({...recurrence, endType: "date"})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-slate-700">El día</span>
                          <input 
                            type="date"
                            value={recurrence.endDate}
                            onChange={(e) => setRecurrence({...recurrence, endDate: e.target.value})}
                            disabled={recurrence.endType !== "date"}
                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:opacity-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de fechas */}
                {formData.Dates.date_repiting.length > 0 && (
                  <div className="space-y-3 mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Fechas programadas ({formData.Dates.date_repiting.length})
                    </p>
                    {formData.Dates.date_repiting.map((dateStr, index) => (
                      <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                          type="date"
                          readOnly={recurrence.frequency !== "none"}
                          className={`flex-1 px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700 ${
                            recurrence.frequency !== "none" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                          }`}
                          value={dateStr.split("T")[0]}
                          onChange={(e) => handleRepitingDateChange(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={recurrence.frequency !== "none"}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-10 w-10 shrink-0 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          onClick={() => handleRemoveDate(index)}
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {recurrence.frequency === "none" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 border-dashed border-2 border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 w-full rounded-xl transition-all duration-200"
                    onClick={handleAddDate}
                  >
                    <Plus size={16} className="mr-2" /> Añadir Fecha Manual
                  </Button>
                )}
              </div>
            </div>
            {/* --- FIN SECCIÓN DE FECHAS --- */}


            {/* --- SECCIÓN DETALLES PRINCIPALES --- */}
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Detalles de la Comanda
              </h3>

              {/* --- CAMPO TÍTULO --- */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Título</label>
                <Input
                  type="text"
                  name="Tittle"
                  value={formData.Tittle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-700"
                  placeholder="Ej. Tostado Lote Especial Etiopía"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- CAMPO CATEGORIA CON DATALIST --- */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Categoría</label>
                  <Input
                    type="text"
                    list="categoria-list"
                    value={categoriaDisplay}
                    onChange={handleCategoriaChange}
                    placeholder="Buscar o escribir categoría..."
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-700"
                  />
                  <datalist id="categoria-list">
                    {AREAS.map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                </div>
                {/* --- FIN CAMPO CATEGORIA --- */}

                {/* --- CAMPO EJECUTOR CON DATALIST --- */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Staff / Ejecutor</label>
                  <Input
                    type="text"
                    list="ejecutor-list"
                    value={ejecutorDisplay}
                    onChange={handleEjecutorChange}
                    placeholder="Asignar a un miembro del staff..."
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm focus:bg-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-700"
                  />
                  <datalist id="ejecutor-list">
                    {allStaff.map((staff) => (
                      <option
                        key={staff._id}
                        value={`${staff.Nombre} ${staff.Apellido}`}
                      />
                    ))}
                  </datalist>
                </div>
                {/* --- FIN CAMPO EJECUTOR --- */}
              </div>
            </div>

            {/* --- CAMPO PROCEDIMIENTOS CON DATALIST --- */}
            <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tareas y Procedimientos
              </h3>
              
              <datalist id="procedimiento-list">
                {allProcedimientosAndProduccion.map((item) => {
                  const nombre = item.Nombre_del_producto || item.tittle || item.Nombre;
                  const tipo = item._tipo === "procedimiento" ? "PROC" : "PROD";
                  const displayValue = `${tipo}: ${nombre}`;
                  return (
                    <option
                      key={item._tipo + "|" + item._id}
                      value={displayValue}
                    />
                  );
                })}
              </datalist>
              
              <div className="space-y-3">
                {procedimientosSelectors.map((selector, index) => (
                  <div key={selector} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        list="procedimiento-list"
                        value={procedimientosDisplay[index] || ""}
                        onChange={(e) =>
                          handleProcedimientoDisplayChange(index, e.target.value)
                        }
                        placeholder="Buscar un procedimiento o producto..."
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-700"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-10 w-10 shrink-0 transition-colors"
                      onClick={() => handleRemoveSelector(index)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSelector}
                className="mt-2 border-dashed border-2 border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl transition-all duration-200"
              >
                <Plus size={16} className="mr-2" /> Vincular Procedimiento
              </Button>
            </div>
            {/* --- FIN CAMPO PROCEDIMIENTOS --- */}

            {/* --- CAMPO NOTAS --- */}
            <div className="md:col-span-2 space-y-1.5 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700">Notas Adicionales</label>
              <textarea
                name="Notas"
                value={formData.Notas}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700 resize-none"
                placeholder="Añade instrucciones, consideraciones o comentarios..."
              />
            </div>
            
            {/* --- ESTADO Y PAGOS --- */}
            <div className="md:col-span-2 p-5 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="Terminado"
                    checked={formData.Terminado}
                    onChange={handleChange}
                    className="w-5 h-5 border-2 border-slate-300 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 transition-colors cursor-pointer"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors">Marcar como Terminado</span>
              </label>

              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="susceptible"
                      checked={formData.Pagado.susceptible}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          Pagado: { ...formData.Pagado, susceptible: e.target.checked },
                        })
                      }
                      className="w-5 h-5 border-2 border-slate-300 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Susceptible a Pago</span>
                </label>

                {formData.Pagado.susceptible && (
                  <div className="flex gap-4 flex-1 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-slate-600">Estado:</label>
                      <select
                        name="Pagado"
                        value={formData.Pagado.pagadoFull}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            Pagado: {
                              ...formData.Pagado,
                              pagadoFull: e.target.value === "true",
                            },
                          })
                        }
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-slate-700"
                      >
                        <option value="false">No Pagado</option>
                        <option value="true">Pagado Completo</option>
                      </select>
                    </div>

                    {formData.Pagado.pagadoFull === false && (
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Adelanto:</label>
                        <Input
                          type="text"
                          name="adelanto"
                          value={formData.Pagado.adelanto}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              Pagado: {
                                ...formData.Pagado,
                                adelanto: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                          placeholder="Monto..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* --- FIN ESTADO Y PAGOS --- */}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            {isModal && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-medium"
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all font-medium border-0"
            >
              Guardar Comanda
            </Button>
          </div>
        </form>
      </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="w-screen py-12 flex justify-center">
      {content}
    </div>
  );
}

export default ComandaCreator;