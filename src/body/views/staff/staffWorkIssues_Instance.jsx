import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem } from "../../../redux/actions";
import { WORKISUE } from "../../../redux/actions-types";

function StaffWorkIssues_Instance({ issue }) {
  const dispatch = useDispatch();

  // Acceder a los datos globales
  const allProcedimientos = useSelector((state) => state.allProcedimientos || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
// console.log(allProcedimientos);
// console.log(allProduccion);

  // Parsear campos JSON si vienen como string
  let fechas = {};
  try {
    fechas = typeof issue.Dates === "string" ? JSON.parse(issue.Dates) : issue.Dates;
  } catch {
    fechas = {};
  }

  let pagado = {};
  try {
    pagado = typeof issue.Pagado === "string" ? JSON.parse(issue.Pagado) : issue.Pagado;
  } catch {
    pagado = {};
  }

  let procedimientosData = [];
  try {
    procedimientosData = typeof issue.Procedimientos === "string"
      ? JSON.parse(issue.Procedimientos)
      : issue.Procedimientos;
  } catch {
    procedimientosData = [];
  }

  // Separar en tipo procedimiento y producción
  const procedimientos = Array.isArray(procedimientosData)
    ? procedimientosData.filter(p => p._tipo === "procedimiento")
    : [];

  const producciones = Array.isArray(procedimientosData)
    ? procedimientosData.filter(p => p._tipo === "produccion")
    : [];

  // Función que compara un elemento con la lista global
  const encontrarElementoCompleto = (item) => {
    if (item._tipo === "procedimiento") {
      console.log(allProcedimientos.find(el => el._id === item._id));    
    return allProcedimientos.find(el => el._id === item._id);
    
  } else if (item._tipo === "produccion") {
      console.log(allProduccion.find(el => el._id === item._id));
      return allProduccion.find(el => el._id === item._id);
    }
    return null;
  };


  const handleIniciarTarea = async () => {
    if (!window.confirm("¿Estás seguro de que quieres marcar la tarea como finalizada?")) return;
    await dispatch(updateItem(issue._id, { Terminado: true }, WORKISUE));
    alert("Tarea marcada como finalizada.");
  };

  return (
    <div className="border rounded p-3 bg-gray-50 shadow">
      <div className="font-bold text-lg mb-2">{issue.Tittle || "Sin título"}</div>
      {/* <div className="mb-1"><strong>ID:</strong> {issue._id}</div> */}
      <div className="mb-1"><strong>Categoría:</strong> {issue.Categoria}</div>
      {/* <div className="mb-1"><strong>Ejecutor:</strong> {issue.Ejecutor}</div> */}
      {/* <div className="mb-1"><strong>Terminado:</strong> {issue.Terminado ? "Sí" : "No"}</div> */}

      <div className="mb-1"><strong>Fechas:</strong>
        <ul className="ml-4">
          <li><strong>Creación:</strong> {fechas.isued?.split("T")[0] || ""}</li>
          <li><strong>Ejecución:</strong> {Array.isArray(fechas.date_asigmente) ? fechas.date_asigmente.join(", ") : fechas.date_asigmente || ""}</li>
          {/* <li><strong>Finalización:</strong> {fechas.finished?.split("T")[0] || ""}</li> */}
        </ul>
      </div>

      {/* <div className="mb-1"><strong>Pagado:</strong> */}
        {/* <ul className="ml-4"> */}
          {/* <li><strong>Pagado Full:</strong> {pagado.pagadoFull ? "Sí" : "No"}</li> */}
          {/* <li><strong>Adelanto:</strong> {pagado.adelanto || "N/A"}</li> */}
          {/* <li><strong>Susceptible:</strong> {pagado.susceptible ? "Sí" : "No"}</li> */}
        {/* </ul> */}
      {/* </div> */}

      <div className="mb-2">
        <strong>Procedimientos y Producción:</strong>
        {procedimientosData.length === 0 ? (
          <div className="text-gray-500 ml-2">Ninguno</div>
        ) : (
          procedimientosData.map((p, idx) => {
            const completo = encontrarElementoCompleto(p);
            return (
              <div
                key={p._id || idx}
                className={`ml-2 mb-1 p-1 flex gap-2 rounded ${completo ? "bg-gray-100" : "bg-red-100"}`}
              >
                <div className="font-semibold">
                  {completo
                    ? (completo.Nombre_del_producto || completo.tittle || completo.Nombre || "Sin nombre")
                    : (p.Nombre_del_producto || p.tittle || p.Nombre || "Sin nombre")}
                </div>
                <button
                  className="bg-blue-600 text-white px-2 py-1 rounded mt-1"
                  onClick={() => {
                    const recetaId = completo && completo.Receta ? completo.Receta : p._id;
                    const url = `/receta/${recetaId}?type=${p._tipo}`;
                    window.open(url, "_blank");
                  }}
                >
                  Ver Receta
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2 mb-2">
   
        <button
          className="bg-green-500 text-white px-3 py-1 rounded"
          onClick={handleIniciarTarea}
          disabled={issue.Terminado}
        >
          {issue.Terminado ? "Tarea Finalizada" : "Finalizar Tarea"}
        </button>
      </div>
    </div>
  );
}

export default StaffWorkIssues_Instance;
