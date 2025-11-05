import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { getAllFromTable } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, PROCEDE, AREAS, PRODUCCION } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { crearProcedimiento } from "../../../redux/actions-Procedimientos";
import { crearWorkIsue } from "../../../redux/actions-WorkIsue";
import { X } from "lucide-react"; // Importar ícono

function WorkIsueCreator() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const allStaff = useSelector((state) => state.allStaff || []);
  const allProcedimientos = useSelector(
    (state) => state.allProcedimientos || []
  );
  const allProduccion = useSelector((state) => state.allProduccion || []);
  
  const fechaDesdeURL = searchParams.get("fecha");

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
        Dates: {
          ...formData.Dates,
          date_repiting: formData.Dates.date_repiting.filter(date => date),
        }
      };
      
      // Asegurarnos que la acción 'crearWorkIsue' reciba 'finalFormData'
      // y no 'formData' (que podría tener strings vacíos en el array).
      await dispatch(crearWorkIsue(finalFormData)); 
      
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
      alert("WorkIssue guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el WorkIssue:", error);
      alert("Error al guardar el WorkIssue");
    }
  };

  return (
    <div className="w-screen py-12 flex justify-center">
      <div className="p-6 bg-white rounded-lg shadow-xl mb-6 w-full max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">Crear WorkIsue</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* --- SECCIÓN DE FECHAS REESTRUCTURADA --- */}
            <div className="md:col-span-2 p-4 border rounded-lg shadow-sm bg-slate-50">
              <h3 className="text-md font-semibold mb-3 border-b pb-2">Gestión de Fechas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- CAMPO 'EjecutionDate' (Principal) --- */}
                <div>
                  <label
                    htmlFor="EjecutionDate"
                    className="block bg-transparent text-sm font-medium text-gray-700"
                  >
                    Fecha Principal de Ejecución:
                  </label>
                  <input
                    type="date"
                    id="EjecutionDate"
                    name="EjecutionDate"
                    className="bg-white mt-1 block w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.Dates.EjecutionDate.split("T")[0]}
                    onChange={handleDatesFieldChange}
                  />
                </div>

                {/* --- CAMPO 'isued' (Creación) --- */}
                <div>
                  <label
                    htmlFor="isued"
                    className="block bg-transparent text-sm font-medium text-gray-700"
                  >
                    Fecha de Creación:
                  </label>
                  <input
                    type="date"
                    id="isued"
                    name="isued"
                    className="bg-white mt-1 block w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.Dates.isued.split("T")[0]}
                    onChange={handleDatesFieldChange}
                  />
                </div>
              </div>
              
              {/* --- CAMPO 'date_repiting' (Opcional) --- */}
              <div className="mt-4 pt-4 border-t">
                <label className="block bg-transparent text-sm font-medium text-gray-700 mb-2">
                  Fechas de Repetición (Opcional):
                </label>
                {formData.Dates.date_repiting.map((dateStr, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="date"
                      className="bg-white mt-1 block w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={dateStr.split("T")[0]}
                      onChange={(e) => handleRepitingDateChange(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveDate(index)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="bg-green-500 text-white text-sm mt-2"
                  onClick={handleAddDate}
                >
                  + Añadir Repetición
                </Button>
              </div>
            </div>
            {/* --- FIN SECCIÓN DE FECHAS --- */}


            {/* --- CAMPO TÍTULO --- */}
            <div className="bg-white md:col-span-2">
              <label className="text-sm font-medium">Título:</label>
              <Input
                type="text"
                name="Tittle"
                value={formData.Tittle}
                onChange={handleChange}
                className="border bg-white rounded p-1 text-sm w-full mt-1"
                placeholder="Título principal del WorkIssue"
              />
            </div>

            {/* --- CAMPO CATEGORIA CON DATALIST --- */}
            <div className="bg-white">
              <label className="text-sm font-medium">Categoría:</label>
              <Input
                type="text"
                list="categoria-list"
                value={categoriaDisplay}
                onChange={handleCategoriaChange}
                placeholder="Escribe para buscar categoría..."
                className="border bg-white rounded p-1 text-sm w-full mt-1"
              />
              <datalist id="categoria-list">
                {AREAS.map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </div>
            {/* --- FIN CAMPO CATEGORIA --- */}

            {/* --- CAMPO EJECUTOR CON DATALIST --- */}
            <div className="bg-white">
              <label className="text-sm font-medium">Ejecutor:</label>
              <Input
                type="text"
                list="ejecutor-list"
                value={ejecutorDisplay}
                onChange={handleEjecutorChange}
                placeholder="Escribe para buscar ejecutor..."
                className="border bg-white rounded p-1 text-sm w-full mt-1"
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

            {/* --- CAMPO PROCEDIMIENTOS CON DATALIST --- */}
            <div className="bg-white md:col-span-2">
              <label className="text-sm font-medium">Procedimientos:</label>
              
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
              
              {procedimientosSelectors.map((selector, index) => (
                <div key={selector} className="flex items-center gap-2 mt-2">
                  <Input
                    type="text"
                    list="procedimiento-list"
                    value={procedimientosDisplay[index] || ""}
                    onChange={(e) =>
                      handleProcedimientoDisplayChange(index, e.target.value)
                    }
                    placeholder="Escribe para buscar..."
                    className="border bg-white rounded p-1 text-sm w-full"
                  />
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveSelector(index)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSelector}
                className="bg-green-500 text-white text-sm mt-2"
              >
                + Añadir Procedimiento
              </Button>
            </div>
            {/* --- FIN CAMPO PROCEDIMIENTOS --- */}

            {/* --- CAMPO NOTAS --- */}
            <div className="bg-white md:col-span-2">
              <label className="text-sm font-medium">Notas:</label>
              <Input
                type="text"
                name="Notas"
                value={formData.Notas}
                onChange={handleChange}
                className="border bg-white rounded p-1 text-sm w-full mt-1"
                placeholder="Añade notas o descripción..."
              />
            </div>
            
            <div className="bg-white">
              <label className="text-sm font-medium">Terminado:</label>
              <Input
                type="checkbox"
                name="Terminado"
                checked={formData.Terminado}
                onChange={handleChange}
                className="border bg-white rounded p-1 text-sm mt-1"
                style={{ height: '20px', width: '20px', display: 'block' }}
              />
            </div>
            <div className="bg-white">
              <label className="text-sm font-medium">Susceptible a Pago:</label>
              <Input
                type="checkbox"
                name="susceptible"
                checked={formData.Pagado.susceptible}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Pagado: { ...formData.Pagado, susceptible: e.target.checked },
                  })
                }
                className="border bg-white rounded p-1 text-sm mt-1"
                style={{ height: '20px', width: '20px', display: 'block' }}
              />
            </div>
            {formData.Pagado.susceptible && (
              <>
                <div className="bg-white">
                  <label className="text-sm font-medium">Pagado:</label>
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
                    className="border bg-white rounded p-1 text-sm w-full mt-1"
                  >
                    <option className="bg-white" value="false">
                      No
                    </option>
                    <option className="bg-white" value="true">
                      Sí
                    </option>
                  </select>
                </div>
                {formData.Pagado.pagadoFull === false && (
                  <div className="bg-white">
                    <label className="text-sm font-medium">Adelanto:</label>
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
                      className="border bg-white rounded p-1 text-sm w-full mt-1"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <Button type="submit" className="bg-blue-500 text-white text-sm mt-6">
            Guardar
          </Button>
        </form>
      </div>
    </div>
  );
}

export default WorkIsueCreator;