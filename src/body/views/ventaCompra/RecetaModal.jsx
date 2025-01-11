import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getRecepie } from "../../../redux/actions";

function RecetaModal({ item, onClose }) {
  const dispatch = useDispatch();
  const [receta, setReceta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceta = async () => {
      if (item.Receta) {
        try {
          const result = await getRecepie(item.Receta, "Recetas");
          if (result) {
            setReceta(result);
          } else {
            setError("No se pudo encontrar la receta.");
          }
        } catch (err) {
          setError("Error al obtener la receta.");
        } finally {
          setLoading(false);
        }
      } else {
        setError("El ítem no tiene una receta asociada.");
        setLoading(false);
      }
    };

    fetchReceta();
  }, [item.Receta]);

  const renderIngredientes = () => (
    Array.isArray(receta.ingredientes) && (
      <>
        <p className="mb-2"><strong>Ingredientes:</strong></p>
        <ul className="list-disc list-inside mb-4">
          {receta.ingredientes.map((ingrediente, index) => (
            <li key={index}>{ingrediente}</li>
          ))}
        </ul>
      </>
    )
  );

  const renderItems = () => (
    <>
      {Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
        const itemIdKey = `item${i}_Id`;
        const itemCuantityUnitsKey = `item${i}_Cuantity_Units`;
        const item = receta[itemIdKey];
        const itemCuantityUnits = receta[itemCuantityUnitsKey] ? JSON.parse(receta[itemCuantityUnitsKey]) : null;

        return item && itemCuantityUnits ? (
          <p key={i} className="mb-2">
            <strong>Ingredientes {i}:</strong> {itemCuantityUnits.metric.cuantity} {itemCuantityUnits.metric.units} ({itemCuantityUnits.legacyName})
          </p>
        ) : null;
      })}
    </>
  );

  const renderProcesosYNotas = () => (
    <>
      {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => (
        receta[`proces${i}`] && (
          <p key={i} className="mb-2"><strong>Proceso {i}:</strong> {receta[`proces${i}`]}</p>
        )
      ))}
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
        receta[`nota${i}`] && (
          <p key={i} className="mb-2"><strong>Nota {i}:</strong> {receta[`nota${i}`]}</p>
        )
      ))}
    </>
  );

  const renderDemasInfo = () => (
    <>
      {receta.instrucciones && (
        <>
          <p className="mb-2"><strong>Instrucciones:</strong></p>
          <p>{receta.instrucciones}</p>
        </>
      )}
      {receta.autor && (
        <p className="mb-2"><strong>Autor:</strong> {receta.autor}</p>
      )}
      {receta.revisor && (
        <p className="mb-2"><strong>Revisor:</strong> {receta.revisor}</p>
      )}
      {receta.actualizacion && (
        <p className="mb-2"><strong>Actualización:</strong> {receta.actualizacion}</p>
      )}
      {receta.emplatado && (
        <p className="mb-2"><strong>Emplatado:</strong> {receta.emplatado}</p>
      )}
      {receta.rendimiento && (
        <p className="mb-2"><strong>Rendimiento:</strong> {JSON.parse(receta.rendimiento).cantidad} {JSON.parse(receta.rendimiento).unidades}</p>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4">
        <h2 className="text-2xl font-bold mb-4">Receta de {item.NombreES}</h2>
        {loading ? (
          <p>Cargando receta...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : receta ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              {renderIngredientes()}
              {renderItems()}
            </div>
            <div>
              {renderProcesosYNotas()}
            </div>
            <div>
              {renderDemasInfo()}
            </div>
          </div>
        ) : (
          <p>No se pudo cargar la receta.</p>
        )}
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white p-2 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default RecetaModal;
