import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, getRecepie, updateItem } from "../../redux/actions";
import { CATEGORIES, ESTATUS, ItemsAlmacen, ProduccionInterna, unidades } from "../../redux/actions-types";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";





export function CardInstanceInventario({ product, currentType }) {
  // let receta;
  // product.Receta ? receta = getRecepie(product.Receta, "RecetasProduccion") : console.log('no receta');
  
  const [receta, setReceta] = useState(null);
  useEffect(() => {
    const fetchReceta = async () => {
      if (product.Receta) {
        const result = await getRecepie(product.Receta, "RecetasProduccion");
        setReceta(result);
      } else {
        console.log("no receta");
      }
    };

    fetchReceta();
  }, [product.Receta]);
  
  
  // Obtener el estado global showEdit desde el reducer
  const showEdit = useSelector((state) => state.showEdit);

  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    CANTIDAD: product.CANTIDAD || "",
    UNIDADES: product.UNIDADES || "",
    COSTO: product.COSTO || "",
    GRUPO: product.GRUPO || "",
    Estado: product.Estado || ESTATUS[0], // Inicializar con el primer valor de ESTATUS
  });

  const [buttonState, setButtonState] = useState("save"); // Estados: 'save', 'syncing', 'done'
  const [book, setBook] = useState("📕"); // Estados: 'save', 'syncing', 'done'

  const groupOptions = CATEGORIES;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setButtonState("save");
  };

  const handleUpdate = async () => {
    setButtonState("syncing");
    try {
      const updatedFields = {
        CANTIDAD: formData.CANTIDAD,
        UNIDADES: formData.UNIDADES,
        COSTO: formData.COSTO,
        GRUPO: formData.GRUPO,
        Estado: formData.Estado,
        ...(currentType === ItemsAlmacen && { COOR: "1.05" }), // Incluir COOR solo si es ItemsAlmacen
        FECHA_ACT: new Date().toISOString().split("T")[0],
      };

      await dispatch(updateItem(product._id, updatedFields , currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      setButtonState("save");
    }
  };
  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
      try {
        setButtonState("syncing");
        await dispatch(deleteItem(product._id,currentType)); // Llama a la acción para eliminar
        setButtonState("done");
        alert("Ítem eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ítem:", error);
        alert("Hubo un error al eliminar el ítem.");
        setButtonState("save");
      }
    }
  };
  const handleRecepie = async () => {
book === '📕' ? setBook('📖') : setBook('📕')
  };
  const filteredEstatus = ESTATUS.filter((status) => {
    if (currentType === "ProduccionInterna" && status === "PC") {
      return false; // Excluir PC si el currentType es ProduccionInterna
    }
    if (currentType === "ItemsAlmacen" && status === "PP") {
      return false; // Excluir PP si el currentType es ItemsAlmacen
    }
    return true; // Incluir el resto de opciones
  });

  const handleStatusChange = async (status) => {
    console.log(typeof status);
    
    setFormData((prev) => ({
      ...prev,
      Estado: status,
    }));


    setButtonState("save"); // Cambiar estado del botón de guardar


    try {
      const updatedFields = {
        // CANTIDAD: formData.CANTIDAD,
        // UNIDADES: formData.UNIDADES,
        // COSTO: formData.COSTO,
        // GRUPO: formData.GRUPO,
        Estado: status,
        // ...(currentType === ItemsAlmacen && { COOR: "1.05" }), // Incluir COOR solo si es ItemsAlmacen
        // FECHA_ACT: new Date().toISOString().split("T")[0],
      };

      await dispatch(updateItem(product._id, updatedFields , currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      setButtonState("save");
    }
    
  };

  const [laReceta, setLaReceta] = useState(null); // Estados: 'save', 'syncing', 'done'





  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
      <CardContent className="p-4 flex flex-col gap-4">




      {/* Nombre del producto y botón de guardar en la misma fila */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {product.Nombre_del_producto || "Producto sin nombre"}
          </h3>
          
          
          
{     ( currentType === ProduccionInterna)  &&   <Button
            className="bg-yellow-500 text-white hover:bg-yellow-500"
            onClick={
              
              handleRecepie
            }
          >
       {book}
          </Button>}
          {/* {showEdit && <Button
            className="bg-yellow-500 text-white hover:bg-yellow-500"
            onClick={
              
              handleRecepie
            }
          >
       {book}
          </Button>} */}


          {showEdit && <Button
            className="bg-red-500 text-white hover:bg-red-400"
            onClick={
              
              handleDelete
            }
          >
            {buttonState === "save" && "🧨"}
            {buttonState === "syncing" && "💢"}
            {buttonState === "done" && "💥"}

          </Button>}




          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={
              handleUpdate
              
            }
          >
            {buttonState === "save" && "💾"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && "✅"}
          </Button>
        </div>

        {/* Botones de Estado */}
        <div className="flex gap-2">
          {filteredEstatus.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex-1 py-2 rounded text-white ${
                formData.Estado === status
                  ? "bg-green-500"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {showEdit  && ( // Mostrar campos solo si showEdit es true
          
          <>


        {/* Precio por unidad y última actualización en la misma fila */}
        <div className="flex gap-4">
        {  (currentType !== ProduccionInterna) &&<label className="text-sm text-gray-700 flex-1">
            Precio por unidad:
            <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
              {product.precioUnitario}
            </h3>
          </label>}
          <label className="text-sm text-gray-700 flex-1">
            Última Actualización:
            <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
              {product.FECHA_ACT}
            </h3>
          </label>
        </div>

        {/* Cantidad y Unidades en la misma fila */}
        <div className="flex gap-4">
        {(currentType !== ProduccionInterna) &&  <label className="text-sm text-gray-700 flex-1">
            Cantidad:
            <input
              type="text"
              name="CANTIDAD"
              value={formData.CANTIDAD}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>}
          <label className="text-sm text-gray-700 flex-1">
            Unidades:
            <select
              name="GRUPO"
              value={formData.UNIDADES}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            >
              <option value="" disabled>
                {product.UNIDAD ? `Actual: ${product.UNIDAD}` : "Selecciona unidad"}
              </option>
              {unidades.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Costo y Grupo en la misma fila */}
        <div className="flex gap-4">
{   (currentType !== ProduccionInterna) &&       <label className="text-sm text-gray-700 flex-1">
            Costo:
            <input
              type="text"
              name="COSTO"
              value={formData.COSTO}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>}
          
          <label className="text-sm text-gray-700 flex-1">
            Grupo:
            <select
              name="GRUPO"
              value={formData.GRUPO}
              onChange={handleInputChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            >
              <option value="" disabled>
                {product.GRUPO ? `Actual: ${product.GRUPO}` : "Selecciona un grupo"}
              </option>
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>






        </>


        )}


        {  ( currentType === ProduccionInterna)  && (book === '📖') && <RecepieOptions
        product={product}
        Receta={receta}
        currentType={currentType}
        ></RecepieOptions>}
      </CardContent>
    </Card>
  );
}
