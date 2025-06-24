import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";

function RecetaModal() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [receta, setReceta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [porcentaje, setPorcentaje] = useState(100);

  // Ingredientes
  const [checkedIngredientes, setCheckedIngredientes] = useState({});
  const [editandoIngrediente, setEditandoIngrediente] = useState(null);
  const [nuevoValorIngrediente, setNuevoValorIngrediente] = useState("");
  const [cantidadesOriginales, setCantidadesOriginales] = useState({});

  // Producción interna
  const [checkedProduccion, setCheckedProduccion] = useState({});
  const [editandoProduccion, setEditandoProduccion] = useState(null);
  const [editShow, setEditShow] = useState(false);
  const [nuevoValorProduccion, setNuevoValorProduccion] = useState("");
  const [cantidadesOriginalesProduccion, setCantidadesOriginalesProduccion] = useState({});

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
  }, [id, dispatch]);

  const buscarPorId = (id) => {
    return allItems.find((items) => items._id === id) || allProduccion.find((items) => items._id === id) || null;
  };

  const handleCheckIngrediente = (i) => {
    setCheckedIngredientes((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const handleCheckProduccion = (i) => {
    setCheckedProduccion((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const guardarNuevoValor = (i) => {
    const original = cantidadesOriginales[i];
    const nuevo = Number(nuevoValorIngrediente);
    if (original && nuevo > 0) {
      const nuevoPorcentaje = (nuevo / original) * 100;
      setPorcentaje(nuevoPorcentaje);
      setEditandoIngrediente(null);
      setNuevoValorIngrediente("");
    }
  };

  const guardarNuevoValorProduccion = (i) => {
    const original = cantidadesOriginalesProduccion[i];
    const nuevo = Number(nuevoValorProduccion);
    if (original && nuevo > 0) {
      const nuevoPorcentaje = (nuevo / original) * 100;
      setPorcentaje(nuevoPorcentaje);
      setEditandoProduccion(null);
      setEditShow(!editShow)
      setNuevoValorProduccion("");
    }
  };

  useEffect(() => {
    if (receta) {
      let originales = {};
      for (let i = 1; i <= 30; i++) {
        const key = `item${i}_Cuantity_Units`;
        if (receta[key]) {
          const parsed = JSON.parse(receta[key]);
          originales[i] = parsed.metric.cuantity;
        }
      }
      setCantidadesOriginales(originales);

      let originalesProduccion = {};
      for (let i = 1; i <= 20; i++) {
        const key = `producto_interno${i}_Cuantity_Units`;
        if (receta[key]) {
          const parsed = JSON.parse(receta[key]);
          originalesProduccion[i] = parsed.metric.cuantity;
        }
      }
      setCantidadesOriginalesProduccion(originalesProduccion);
    }
  }, [receta]);

  const renderIngredientes = () => (
    <>
      {Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
        const itemIdKey = `item${i}_Id`;
        const itemCuantityUnitsKey = `item${i}_Cuantity_Units`;
        const item = receta[itemIdKey];
        const itemCuantityUnits = receta[itemCuantityUnitsKey] ? JSON.parse(receta[itemCuantityUnitsKey]) : null;
        const itemData = buscarPorId(item);
        const cantidadAjustada = itemCuantityUnits ? ((itemCuantityUnits.metric.cuantity * porcentaje) / 100) : null;
        if (!item || !itemCuantityUnits) return null;
        return (
          <div key={i} className={`mb-2 flex items-center gap-2 rounded ${checkedIngredientes[i] ? "bg-green-200" : ""}`}>
            <button onClick={() => handleCheckIngrediente(i)} className={`w-6 h-6 flex items-center justify-center border rounded mr-2 ${checkedIngredientes[i] ? "bg-green-500 border-green-700" : "bg-white border-gray-400"}`} type="button">
              {checkedIngredientes[i] ? <span className="text-white font-bold">&#10003;</span> : null}
            </button>
            <strong>Ingrediente {i}: </strong>
            <span>{itemData ? itemData.Nombre_del_producto : "Desconocido"}</span>
            <span style={{ marginLeft: 4, marginRight: 4 }}>{Number.isFinite(cantidadAjustada) ? (cantidadAjustada % 1 === 0 ? cantidadAjustada : cantidadAjustada.toFixed(2)) : ""}</span>
            <span>{itemCuantityUnits.metric.units}</span>
            {editShow && (
              editandoIngrediente === i ? (
                <>
                  <input type="number" min={0} step="any" value={nuevoValorIngrediente} onChange={e => setNuevoValorIngrediente(e.target.value)} className="border rounded px-1 py-0.5 w-20 ml-2" />
                  <button className="bg-green-500 text-white px-2 py-1 rounded ml-1" onClick={() => guardarNuevoValor(i)}>Guardar</button>
                  <button className="bg-gray-300 px-2 py-1 rounded ml-1" onClick={() => { setEditandoIngrediente(null); setNuevoValorIngrediente(""); }}>Cancelar</button>
                </>
              ) : (
                <button className="bg-blue-500 text-white px-2 py-1 rounded ml-2" onClick={() => {
                  setEditandoIngrediente(i);
                  setNuevoValorIngrediente(Number.isFinite(cantidadAjustada) ? cantidadAjustada : "");
                }}>Editar</button>
              )
            )}
          </div>
        );
      })}
    </>
  );

  const renderProduccionInterna = () => (
    <>
      {/* Botón para mostrar/ocultar los botones de editar */}
      <div className="mb-2">

      </div>
      {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
        const itemIdKey = `producto_interno${i}_Id`;
        const itemCuantityUnitsKey = `producto_interno${i}_Cuantity_Units`;
        const item = receta[itemIdKey];
        const itemCuantityUnits = receta[itemCuantityUnitsKey] ? JSON.parse(receta[itemCuantityUnitsKey]) : null;
        const itemData = buscarPorId(item);
        const cantidadAjustada = itemCuantityUnits ? ((itemCuantityUnits.metric.cuantity * porcentaje) / 100) : null;
        if (!item || !itemCuantityUnits) return null;
        return (
          <div key={i} className={`mb-2 flex items-center gap-2 rounded ${checkedProduccion[i] ? "bg-green-200" : ""}`}>
            <button onClick={() => handleCheckProduccion(i)} className={`w-6 h-6 flex items-center justify-center border rounded mr-2 ${checkedProduccion[i] ? "bg-green-500 border-green-700" : "bg-white border-gray-400"}`} type="button">
              {checkedProduccion[i] ? <span className="text-white font-bold">&#10003;</span> : null}
            </button>
            <strong>Producción Interna {i}:</strong>
            <span>{itemData ? itemData.Nombre_del_producto : "Desconocido"}</span>
            <span style={{ marginLeft: 4, marginRight: 4 }}>{Number.isFinite(cantidadAjustada) ? (cantidadAjustada % 1 === 0 ? cantidadAjustada : cantidadAjustada.toFixed(2)) : ""}</span>
            <span>{itemCuantityUnits.metric.units}</span>
            {editShow && (
              editandoProduccion === i ? (
                <>
                  <input type="number" min={0} step="any" value={nuevoValorProduccion} onChange={e => setNuevoValorProduccion(e.target.value)} className="border rounded px-1 py-0.5 w-20 ml-2" />
                  <button className="bg-green-500 text-white px-2 py-1 rounded ml-1" onClick={() => guardarNuevoValorProduccion(i)}>Guardar</button>
                  <button className="bg-gray-300 px-2 py-1 rounded ml-1" onClick={() => { setEditandoProduccion(null); setNuevoValorProduccion(""); }}>Cancelar</button>
                </>
              ) : (
                <button className="bg-blue-500 text-white px-1 py-1 rounded ml-1" onClick={() => {
                  setEditandoProduccion(i);
                  setNuevoValorProduccion(Number.isFinite(cantidadAjustada) ? cantidadAjustada : "");
                }}>Editar</button>
              )
            )}
          </div>
        );
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
        {/* Nuevo input para porcentaje */}
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="porcentaje" className="font-semibold">Porcentaje:</label>
          <input
            id="porcentaje"
            type="number"
            min={1}
            max={1000}
            value={porcentaje}
            onChange={e => setPorcentaje(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20"
          />
          <span>%</span>
                  <button
          className="bg-gray-400 text-white px-2 py-1 rounded"
          onClick={() => setEditShow((prev) => !prev)}
        >
          {editShow ? "Ocultar Editar" : "Mostrar Editar"}
        </button>
        </div>
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
