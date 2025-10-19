import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, PROCEDE, AREAS, PRODUCCION } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { crearProcedimiento } from "../../../redux/actions-Procedimientos";
import { crearWorkIsue } from "../../../redux/actions-WorkIsue";

function WorkIsueCreator() {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const allProcedimientos = useSelector(
    (state) => state.allProcedimientos || []
  );
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const [formData, setFormData] = useState({
    Dates: { isued: new Date().toISOString(), finished: "", date_asigmente: "" },
    Terminado: false,
    Pagado: { pagadoFull: false, adelanto: "NoAplica", susceptible: false },
    Categoria: "",
    Ejecutor: "",
    Procedimientos: [],
    Tittle: "",
  });
  const [procedimientosList, setProcedimientosList] = useState([]);
  const [procedimientosSelectors, setProcedimientosSelectors] = useState([0]);

  useEffect(() => {
    dispatch(getAllFromTable(PROCEDE));
    dispatch(getAllFromTable(PRODUCCION));
    dispatch(getAllFromTable(STAFF));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      Dates: { ...prev.Dates, [name]: value },
    }));
  };

  const handleAddSelector = () => {
    setProcedimientosSelectors((prev) => [...prev, prev.length]);
  };

  // Combina ambos arreglos y marca su origen
  const allProcedimientosAndProduccion = [
    ...allProcedimientos.map((proc) => ({ ...proc, _tipo: "procedimiento" })),
    ...allProduccion.map((prod) => ({ ...prod, _tipo: "produccion" })),
  ];

  // Cambia el handler para guardar _id y _tipo
  const handleProcedimientoChange = (index, value) => {
    // value es _tipo|_id|_name
    const [tipo, id, name] = value.split("|");
    const updatedList = [...procedimientosList];
    updatedList[index] = { _id: id, _tipo: tipo, _name: name };
    setProcedimientosList(updatedList);
    setFormData((prev) => ({
      ...prev,
      Procedimientos: updatedList,
    }));
  };

  const handleRemoveSelector = (index) => {
    const updatedSelectors = procedimientosSelectors.filter(
      (_, i) => i !== index
    );
    const updatedList = procedimientosList.filter((_, i) => i !== index);
    setProcedimientosSelectors(updatedSelectors);
    setProcedimientosList(updatedList);
    setFormData((prev) => ({
      ...prev,
      Procedimientos: updatedList,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(crearWorkIsue(formData));
      setFormData({
        Dates: {
          isued: new Date().toISOString(),
          finished: "",
          date_asigmente: "",
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
      alert("Procedimiento guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el procedimiento:", error);
      alert("Error al guardar el procedimiento");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold">Crear WorkIsue</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="date_asigmente" // El htmlFor debe coincidir con el name/id
              className="block bg-white text-sm font-medium text-gray-700"
            >
              Fecha de Ejecución:
            </label>
            <input
              type="date"
              id="date_asigmente" // El id debe ser único
              name="date_asigmente" // El name debe ser "date_asigmente"
              className="bg-white mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.Dates.date_asigmente.split("T")[0]}
              onChange={handleDateChange}
            />
            <p>
              Selected Date: {formData.Dates.date_asigmente.split("T")[0]}
            </p>
          </div>
          <div>
            <label
              htmlFor="isued"
              className="block bg-white text-sm font-medium text-gray-700"
            >
              Fecha de Creación:
            </label>
            <input
              type="date"
              id="isued"
              name="isued"
              className="bg-white mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.Dates.isued.split("T")[0]}
              onChange={handleDateChange}
            />
            <p>Selected Date: {formData.Dates.isued.split("T")[0]}</p>
          </div>
          <div>
            <label
              htmlFor="finished"
              className="block bg-white text-sm font-medium text-gray-700"
            >
              Fecha de Finalización:
            </label>
            <input
              type="date"
              id="finished"
              name="finished"
              className="bg-white mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.Dates.finished.split("T")[0]}
              onChange={handleDateChange}
            />
            <p>Selected Date: {formData.Dates.finished.split("T")[0]}</p>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Categoría:</label>
            <select
              name="Categoria"
              value={formData.Categoria}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            >
              <option className="bg-white" value="">
                Seleccionar Categoría
              </option>
              {AREAS.map((area) => (
                <option className="bg-white" key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Ejecutor:</label>
            <select
              name="Ejecutor"
              value={formData.Ejecutor}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            >
              <option className="bg-white" value="">
                Seleccionar Ejecutor
              </option>
              {allStaff.map((staff) => (
                <option className="bg-white" key={staff._id} value={staff._id}>
                  {staff.Nombre} {staff.Apellido}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Procedimientos:</label>
            {procedimientosSelectors.map((selector, index) => (
              <div key={selector} className="flex items-center gap-2 mt-2">
                <select
                  // ===== CAMBIO 1: Construir el value con las 3 partes =====
                  value={
                    procedimientosList[index]
                      ? `${procedimientosList[index]._tipo}|${procedimientosList[index]._id}|${procedimientosList[index]._name}`
                      : ""
                  }
                  onChange={(e) =>
                    handleProcedimientoChange(index, e.target.value)
                  }
                  className="border bg-white rounded p-1 text-sm w-full"
                >
                  <option className="bg-white" value="">
                    Seleccionar Procedimiento o Producción
                  </option>
                  {allProcedimientosAndProduccion.map((item) => (
                    <option
                      className="bg-white"
                      key={item._tipo + "|" + item._id}
                      // ===== CAMBIO 2: Usar item._id (no item.Receta) y las 3 partes =====
                      value={`${item._tipo}|${item.Receta}|${
                        item.Nombre_del_producto || item.tittle || item.Nombre
                      }`}
                    >
                      {item._tipo === "procedimiento"
                        ? `PROC: ${
                            item.tittle ||
                            item.Nombre ||
                            item.Nombre_del_producto
                          }`
                        : `PROD: ${
                            item.Nombre_del_producto ||
                            item.tittle ||
                            item.Nombre
                          }`}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={() => handleRemoveSelector(index)}
                  className="bg-red-500 text-white text-sm"
                >
                  x
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={handleAddSelector}
              className="bg-green-500 text-white text-sm mt-2"
            >
              +
            </Button>
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Título:</label>
            <Input
              type="text"
              name="Tittle"
              value={formData.Tittle}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Notas:</label>
            <Input
              type="text"
              name="Notas"
              value={formData.Notas}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm w-full"
            />
          </div>
          <div className="bg-white">
            <label className="text-sm font-medium">Terminado:</label>
            <Input
              type="checkbox"
              name="Terminado"
              checked={formData.Terminado}
              onChange={handleChange}
              className="border bg-white rounded p-1 text-sm"
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
              className="border bg-white rounded p-1 text-sm"
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
                  className="border bg-white rounded p-1 text-sm w-full"
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
                    className="border bg-white rounded p-1 text-sm w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
        <Button type="submit" className="bg-blue-500 text-white text-sm mt-4">
          Guardar
        </Button>
      </form>
    </div>
  );
}

export default WorkIsueCreator;