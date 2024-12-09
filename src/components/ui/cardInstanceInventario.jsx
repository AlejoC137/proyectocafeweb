import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import supabase from "@/config/supabaseClient"; // Asegúrate de que la ruta sea correcta
import { deleteItem, updateItem } from "../../redux/actions";
import { CATEGORIES, ESTATUS, ItemsAlmacen, ProduccionInterna, unidades } from "../../redux/actions-types";
import RecetaOptions from "../../body/components/recetaOptions/RecetaOptions";

export function CardInstanceInventario({ product, currentType }) {
  const showEdit = useSelector((state) => state.showEdit);

  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    CANTIDAD: product.CANTIDAD || "",
    UNIDADES: product.UNIDADES || "",
    COSTO: product.COSTO || "",
    GRUPO: product.GRUPO || "",
    Estado: product.Estado || ESTATUS[0],
  });

  const [help, setHelp] = useState(false);
  const [buttonState, setButtonState] = useState("save");
  const [recetaData, setRecetaData] = useState(null);

  const groupOptions = CATEGORIES;

  useEffect(() => {
    const fetchReceta = async () => {
      if (product.receta && validarUUID(product.receta)) {
        const { data, error } = await supabase
          .from("Recetas")
          .select("*")
          .eq("_id", product.receta);


          setRecetaData(data);
          
        if (error) {
          console.error("Error al cargar la receta:", error);
        } else if (data && data.length > 0) {
          setRecetaData(data[0]);
        }
      }
    };

    fetchReceta();
  }, [product.receta]);

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
        ...(currentType === ItemsAlmacen && { COOR: "1.05" }),
        FECHA_ACT: new Date().toISOString().split("T")[0],
      };

      await dispatch(updateItem(product._id, updatedFields, currentType));
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
        await dispatch(deleteItem(product._id, currentType));
        setButtonState("done");
        alert("Ítem eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ítem:", error);
        alert("Hubo un error al eliminar el ítem.");
        setButtonState("save");
      }
    }
  };

  const handleHelp = () => {
    setHelp(!help);
  };

  const filteredEstatus = ESTATUS.filter((status) => {
    if (currentType === ProduccionInterna && status === "PC") return false;
    if (currentType === ItemsAlmacen && status === "PP") return false;
    return true;
  });

  const handleStatusChange = async (status) => {
    setFormData((prev) => ({ ...prev, Estado: status }));

    try {
      const updatedFields = { Estado: status };
      await dispatch(updateItem(product._id, updatedFields, currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      setButtonState("save");
    }
  };

  const validarUUID = (uuid) => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  };

  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {product.Nombre_del_producto || "Producto sin nombre"}
          </h3>
          {showEdit && (
            <Button
              className="bg-red-500 text-white hover:bg-red-400"
              onClick={handleDelete}
            >
              {buttonState === "save" && "🧨"}
              {buttonState === "syncing" && "💢"}
              {buttonState === "done" && "💥"}
            </Button>
          )}
          {currentType === ProduccionInterna && (
            <Button
              className="bg-yellow-500 text-white hover:bg-yellow-400"
              onClick={handleHelp}
            >
              📖
            </Button>
          )}
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleUpdate}
          >
            {buttonState === "save" && "💾"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && "✅"}
          </Button>
        </div>

        {help && (
          <RecetaOptions
            id={product._id}
            Nombre_del_producto={product.Nombre_del_producto}
            currentType={currentType}
          />
        )}

        {recetaData && (
          <div className="mt-4">
            <h4 className="text-lg font-bold">Detalles de la Receta:</h4>
            <p><strong>Rendimiento:</strong> {recetaData.rendimiento}</p>
            <p><strong>Autor:</strong> {recetaData.autor}</p>
            <p><strong>Revisor:</strong> {recetaData.revisor}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
