import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAllFromTable, getRecepie } from "../../../redux/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";

function RecetaModal({ item, onClose, type }) {
  const { id: paramId } = useParams();
  const id = item?.Receta || paramId;
  const dispatch = useDispatch();
  const [receta, setReceta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [porcentaje, setPorcentaje] = useState(100);

  const [checkedIngredientes, setCheckedIngredientes] = useState({});
  const [editandoIngrediente, setEditandoIngrediente] = useState(null);
  const [nuevoValorIngrediente, setNuevoValorIngrediente] = useState("");
  const [cantidadesOriginales, setCantidadesOriginales] = useState({});

  const [checkedProduccion, setCheckedProduccion] = useState({});
  const [editandoProduccion, setEditandoProduccion] = useState(null);
  const [editShow, setEditShow] = useState(false);
  const [nuevoValorProduccion, setNuevoValorProduccion] = useState("");
  const [cantidadesOriginalesProduccion, setCantidadesOriginalesProduccion] = useState({});

  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const allMenu = useSelector((state) => state.allMenu || []);

  useEffect(() => {
    const fetchRecetaData = async () => {
      if (!id) {
        setError("El ítem no tiene una receta asociada.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE)),
        ]);
        
        const result = await getRecepie(id, "Recetas");
        if (result) {
            setReceta(result);
            const plato = await getRecepie(result.forId, "Menu");
            setFoto(plato.Foto);
        } else {
            throw new Error("Receta no encontrada");
        }
      } catch (err) {
        setError("Error al obtener la receta.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecetaData();
  }, [id, dispatch]);

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

  const buscarPorId = (id) => allItems.find((i) => i._id === id) || allProduccion.find((p) => p._id === id) || null;
  const handleCheckIngrediente = (i) => setCheckedIngredientes((prev) => ({ ...prev, [i]: !prev[i] }));
  const handleCheckProduccion = (i) => setCheckedProduccion((prev) => ({ ...prev, [i]: !prev[i] }));
  
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

  const renderIngredientes = () => (
    <>
      {Array.from({ length: 30 }, (_, i) => i + 1).map((i) => {
        const itemData = buscarPorId(receta[`item${i}_Id`]);
        const itemCuantityUnits = receta[`item${i}_Cuantity_Units`] ? JSON.parse(receta[`item${i}_Cuantity_Units`]) : null;
        if (!itemData || !itemCuantityUnits) return null;
        const cantidadAjustada = (itemCuantityUnits.metric.cuantity * porcentaje) / 100;
        return (
          <div key={i} className={`mb-2 flex items-center gap-2 p-2 rounded-md ${checkedIngredientes[i] ? "bg-green-100" : "bg-gray-50"}`}>
            <button onClick={() => handleCheckIngrediente(i)} className={`w-5 h-5 flex-shrink-0 border rounded-sm ${checkedIngredientes[i] ? "bg-green-500 border-green-600 text-white" : "bg-white border-gray-400"}`} type="button">{checkedIngredientes[i] && "✔"}</button>
            <span className="flex-grow text-sm">{itemData.Nombre_del_producto}</span>
            <span className="font-bold text-blue-600">{cantidadAjustada.toFixed(2)}</span>
            <span className="text-gray-500 text-sm">{itemCuantityUnits.metric.units}</span>
            {editShow && (
              <div className="flex items-center gap-1">
                {editandoIngrediente === i ? (
                  <>
                    <Input type="number" value={nuevoValorIngrediente} onChange={e => setNuevoValorIngrediente(e.target.value)} className="w-20 h-8 text-sm" />
                    <Button size="sm" className="h-8" onClick={() => guardarNuevoValor(i)}>OK</Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditandoIngrediente(null); setNuevoValorIngrediente(""); }}>X</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => { setEditandoIngrediente(i); setNuevoValorIngrediente(cantidadAjustada); }}>Editar</Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  const renderProduccionInterna = () => (
    <>
      {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
        const itemData = buscarPorId(receta[`producto_interno${i}_Id`]);
        const itemCuantityUnits = receta[`producto_interno${i}_Cuantity_Units`] ? JSON.parse(receta[`producto_interno${i}_Cuantity_Units`]) : null;
        if (!itemData || !itemCuantityUnits) return null;
        const cantidadAjustada = (itemCuantityUnits.metric.cuantity * porcentaje) / 100;
        return (
          <div key={i} className={`mb-2 flex items-center gap-2 p-2 rounded-md ${checkedProduccion[i] ? "bg-green-100" : "bg-gray-50"}`}>
            <button onClick={() => handleCheckProduccion(i)} className={`w-5 h-5 flex-shrink-0 border rounded-sm ${checkedProduccion[i] ? "bg-green-500 border-green-600 text-white" : "bg-white border-gray-400"}`} type="button">{checkedProduccion[i] && "✔"}</button>
            <span className="flex-grow text-sm">{itemData.Nombre_del_producto}</span>
            <span className="font-bold text-purple-600">{cantidadAjustada.toFixed(2)}</span>
            <span className="text-gray-500 text-sm">{itemCuantityUnits.metric.units}</span>
            {editShow && (
              <div className="flex items-center gap-1">
                {editandoProduccion === i ? (
                  <>
                    <Input type="number" value={nuevoValorProduccion} onChange={e => setNuevoValorProduccion(e.target.value)} className="w-20 h-8 text-sm" />
                    <Button size="sm" className="h-8" onClick={() => guardarNuevoValorProduccion(i)}>OK</Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditandoProduccion(null); setNuevoValorProduccion(""); }}>X</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => { setEditandoProduccion(i); setNuevoValorProduccion(cantidadAjustada); }}>Editar</Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  const renderProcesosYNotas = () => (
    <>
      {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => receta[`proces${i}`] && <p key={i}><strong>Proceso {i}:</strong> {receta[`proces${i}`]}</p>)}
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => receta[`nota${i}`] && <p key={i}><strong>Nota {i}:</strong> {receta[`nota${i}`]}</p>)}
    </>
  );

  const renderDemasInfo = () => (
    <>
      {receta.instrucciones && <p><strong>Instrucciones:</strong> {receta.instrucciones}</p>}
      {receta.autor && <p><strong>Autor:</strong> {receta.autor}</p>}
      {receta.revisor && <p><strong>Revisor:</strong> {receta.revisor}</p>}
      {receta.actualizacion && <p><strong>Actualización:</strong> {receta.actualizacion}</p>}
      {receta.emplatado && <p><strong>Emplatado:</strong> {receta.emplatado}</p>}
      {receta.rendimiento && <p><strong>Rendimiento:</strong> {JSON.parse(receta.rendimiento).cantidad} {JSON.parse(receta.rendimiento).unidades}</p>}
      {receta.Foto && <img src={receta.Foto} alt="Foto de la receta" className="w-full h-auto rounded-md shadow-md mt-4" />}
    </>
  );

  const renderImagen = () => (
    foto ? <img src={foto} alt="Imagen del Menú" className="w-full h-auto rounded-md shadow-md" /> : null
  );

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center">Cargando receta...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!receta) return <div className="p-8 text-center">No se pudo cargar la receta.</div>;

    return (
      
        <div className=" w-screen ">
        <div className="p-4  border-b bg-gray-50 flex justify-between items-center sticky top-0">
          <h2 className="text-2xl font-bold text-gray-800">{receta.legacyName || "Receta"}</h2>
          {/* <Button onClick={onClose} variant="ghost" className="h-9 w-9 p-0 text-xl">❌</Button> */}
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="mb-6 flex items-center gap-4 p-3 bg-gray-100 rounded-md">
            <div className="flex items-center gap-2">
              <label htmlFor="porcentaje" className="font-semibold">Porcentaje:</label>
              <Input id="porcentaje" type="number" min={1} value={porcentaje} onChange={e => setPorcentaje(Number(e.target.value))} className="w-24 h-9" />
              <span className="font-semibold text-gray-700">%</span>
            </div>
            <Button variant="outline" onClick={() => setEditShow(prev => !prev)}>
              {editShow ? "Ocultar Edición" : "Habilitar Edición"}
            </Button>
          </div>
          
          {/* ESTRUCTURA ORIGINAL DE 4 COLUMNAS */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Ingredientes</h3>
                {renderIngredientes()}
              </div>
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Producción Interna</h3>
                {renderProduccionInterna()}
              </div>
            </div>
            <div className="flex-1 space-y-4 text-sm">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Procesos y Notas</h3>
                {renderProcesosYNotas()}
            </div>
            <div className="flex-1 space-y-4 text-sm">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Información Adicional</h3>
                {renderDemasInfo()}
            </div>
            <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Imagen del Menú</h3>
                {renderImagen()}
            </div>
          </div>
        </div>
        </div>
    
    );
  };
  
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-screen h-screen flex flex-col overflow-auto">
        {renderContent()}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecetaModal;