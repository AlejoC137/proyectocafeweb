import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE, ItemsAlmacen, ProduccionInterna, MenuItems } from "../../../redux/actions-types";

function RecetaModal() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [receta, setReceta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allMenu = useSelector((state) => state.allMenu || []);



  useEffect(() => {
    try {
       Promise.all([
        dispatch(getAllFromTable(STAFF)),
        dispatch(getAllFromTable(MENU)),
        dispatch(getAllFromTable(ITEMS)),
        dispatch(getAllFromTable(PRODUCCION)),
        dispatch(getAllFromTable(PROVEE)),
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    } 
    const fetchReceta = async () => {



      if (id) {
        
        try {
          const result = await getRecepie(id, "Recetas");
          console.log(result);
          if (result) {
            setReceta(result);
            const plato = await getRecepie(result.forId, "Menu");
            setFoto(plato.Foto);
            
          } else {
            throw new Error("No se encontró en Recetas");
          }
        } catch (err) {
          try {
            const result = await getRecepie(id, "RecetasProduccion");
            if (result) {
              setReceta(result);
            } else {
              throw new Error("No se encontró en RecetasProduccion");
            }
          } catch (err) {
            setError("Error al obtener la receta.");
          } finally {
            setLoading(false);
          }
        }
      } else {
        setError("El ítem no tiene una receta asociada.");
        setLoading(false); 
      }
    };

    fetchReceta();
  }, [id]);

  const buscarPorId = (id) => {
    return allItems.find((items) => items._id === id) || allProduccion.find((items) => items._id === id) || null;
  };

  const renderIngredientes = () => (
    <>
      {Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
        const itemIdKey = `item${i}_Id`;
        const itemCuantityUnitsKey = `item${i}_Cuantity_Units`;
        const item = receta[itemIdKey];
        const itemCuantityUnits = receta[itemCuantityUnitsKey] ? JSON.parse(receta[itemCuantityUnitsKey]) : null;
        const itemData = buscarPorId(item);

        return item && itemCuantityUnits ? (
          <p key={i} className="mb-2">
            <strong>Ingrediente {i}: </strong>{itemData ? itemData.Nombre_del_producto : "Desconocido"} {itemCuantityUnits.metric.cuantity} {itemCuantityUnits.metric.units} 
          </p>
        ) : null;
      })}
    </>
  );

  const renderProduccionInterna = () => (
    <>
      {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
        const itemIdKey = `producto_interno${i}_Id`;
        const itemCuantityUnitsKey = `producto_interno${i}_Cuantity_Units`;
        const item = receta[itemIdKey];
        const itemCuantityUnits = receta[itemCuantityUnitsKey] ? JSON.parse(receta[itemCuantityUnitsKey]) : null;
        const itemData = buscarPorId(item);

        return item && itemCuantityUnits ? (
          <p key={i} className="mb-2">
            <strong>Producción Interna {i}:</strong>  ({itemData ? itemData.Nombre_del_producto : "Desconocido"}) {itemCuantityUnits.metric.cuantity} {itemCuantityUnits.metric.units}
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
      {receta.Foto && (
        <div className="mb-4">
          <p className="mb-2"><strong>Foto:</strong></p>
          <img src={receta.Foto} alt="Foto de la receta" className="w-full h-auto rounded-md shadow-md" />
        </div>
      )}
    </>
  );

  const renderImagen = () => {
    const menuItem = allMenu.find(item => item._id === receta.forId);
    return menuItem && menuItem.Foto ? (
      <div className="mb-4">
        <p className="mb-2"><strong>Imagen del Menú:</strong></p>
        <img src={menuItem.Foto} alt="Imagen del Menú" className="w-full h-auto rounded-md shadow-md" />
      </div>
    ) : null;
  };

  return (
    <div>
      <div>
        <h2 className="text-lg font-semibold mb-4">{receta?.legacyName}</h2>
        {loading ? (
          <p>Cargando receta...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : receta ? (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              {renderIngredientes()}
              {renderProduccionInterna()}
            </div>
            <div className="flex-1">
              {renderProcesosYNotas()}
            </div>
            <div className="flex-1">
              {renderDemasInfo()}
            </div>
            <div className="flex-1">
              {renderImagen()}
            
            </div>
          </div>
        ) : (
          <p>No se pudo cargar la receta.</p>
        )}
        <div className="mt-4 flex justify-end">
        </div>
      </div>
    </div>
  );
}

export default RecetaModal;
