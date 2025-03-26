import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteItem, getRecepie, updateItem, getProveedor, actualizarPrecioUnitario, calcularPrecioUnitario } from "../../redux/actions-Proveedores";
import { BODEGA, CATEGORIES, ESTATUS, ItemsAlmacen, ProduccionInterna, unidades } from "../../redux/actions-types";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";
import ProveedorOptions from "../../body/components/proveedorOptions/ProveedorOptions";
import { setSelectedProviderId } from "../../redux/actions-Proveedores";
import supabase from "../../config/supabaseClient";

export function CardInstanceInventario({ product, currentType }) {
  const Proveedores = useSelector((state) => state.Proveedores || []);
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const [receta, setReceta] = useState(null);

  const initialStock = (() => {
    try {
      return typeof product.STOCK === "string" ? JSON.parse(product.STOCK) : product.STOCK;
    } catch (e) {
      console.error("Invalid JSON in product.STOCK:", e);
      return {
        minimo: "",
        maximo: "",
        actual: "",
      };
    }
  })();

  const initialAlmacenamiento = (() => {
    try {
      return typeof product.ALMACENAMIENTO === "string" ? JSON.parse(product.ALMACENAMIENTO) : product.ALMACENAMIENTO;
    } catch (e) {
      console.error("Invalid JSON in product.ALMACENAMIENTO:", e);
      return {
        ALMACENAMIENTO: "",
        BODEGA: "",
      };
    }
  })();
// fff   ffdfd
  const [formData, setFormData] = useState({
    Nombre_del_producto: product.Nombre_del_producto || "",
    CANTIDAD: product.CANTIDAD || "",
    UNIDADES: product.UNIDADES || "",
    COSTO: product.COSTO || "",
    GRUPO: product.GRUPO || "",
    precioUnitario: product.precioUnitario || "",
    Estado: product.Estado || ESTATUS[0],
    Proveedor: product.Proveedor || "",
    ALMACENAMIENTO: initialAlmacenamiento,
    STOCK: initialStock || {
      minimo: "",
      maximo: "",
      actual: "",
      
    },

    Merma: product.Merma || 0.00,
  });
  const [provData, setProvData] = useState({
    Proveedor_Name: '',
  });

  const [buttonState, setButtonState] = useState("save");
  const [book, setBook] = useState("📕");
  const groupOptions = CATEGORIES;

  useEffect(() => {
    const fetchReceta = async () => {
      if (product.Receta) {
        const result = await getRecepie(product.Receta, "RecetasProduccion");
        setReceta(result);
      }
    };

    fetchReceta();
  }, [product.Receta]);

  useEffect(() => {
    if (currentType === ItemsAlmacen) {
      const fetchProveedor = async () => {
        if (product.Proveedor) {
          const result = await getProveedor(product.Proveedor);
          if (result) {
            setProvData((prev) => ({
              ...prev,
              Proveedor_Name: result.Nombre_Proveedor,
            }));
          }
        }
      };

      fetchProveedor();
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "ALMACENAMIENTO" || name === "BODEGA") {
      setFormData((prev) => ({
        ...prev,
        ALMACENAMIENTO: {
          ...prev.ALMACENAMIENTO,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (name === "Proveedor" && currentType === ItemsAlmacen) {
      const selectedProvider = Proveedores.find(proveedor => proveedor._id === value);
      if (selectedProvider) {
        dispatch(setSelectedProviderId(selectedProvider._id));
      }
    }
    setButtonState("save");
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      STOCK: {
        ...prev.STOCK,
        [name]: value,
      },
    }));
    setButtonState("save");
  };

  const handleUpdate = async () => {
    console.log(product);

    let { data, error } = await supabase
      .from(currentType) // Nombre correcto de la tabla
      .update({
        precioUnitario: calcularPrecioUnitario(product),
      })
      .eq('_id', product._id) // Filtrar la fila donde _id coincida
      .select(); // Retornar los datos actualizados

    setButtonState("syncing");
    try {
      const updatedFields = {
        Nombre_del_producto: formData.Nombre_del_producto,
        CANTIDAD: formData.CANTIDAD,
        UNIDADES: formData.UNIDADES,
        COSTO: formData.COSTO,
        GRUPO: formData.GRUPO,
        Merma: formData.Merma,
        Estado: formData.Estado,
        Proveedor: formData.Proveedor ? formData.Proveedor : product.Proveedor,
        ...(currentType === ItemsAlmacen && { COOR: "1.05" }),
        FECHA_ACT: new Date().toISOString().split("T")[0],
        STOCK: formData.STOCK,
        ALMACENAMIENTO: JSON.stringify(formData.ALMACENAMIENTO),
      };

      await dispatch(updateItem(product._id, updatedFields, currentType));
      setButtonState("done");
      window.location.reload(); // Reload the page after a successful update
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

  const handleRecepie = () => {
    setBook((prev) => (prev === '📕' ? '📖' : '📕'));
  };

  const filteredEstatus = ESTATUS.filter((status) => {
    if (currentType === "ProduccionInterna" && status === "PC") {
      return false;
    }
    if (currentType === "ItemsAlmacen" && status === "PP") {
      return false;
    }
    return true;
  });

  const handleStatusChange = async (status) => {
    setFormData((prev) => ({
      ...prev,
      Estado: status,
    }));
    setButtonState("save");

    try {
      const updatedFields = {
        Estado: status,
      };

      await dispatch(updateItem(product._id, updatedFields, currentType));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      setButtonState("save");
    }
  };

  const handleCreateReceta = async (recetaData, productId) => {
    try {
      await dispatch(crearReceta(recetaData, productId));
      setReceta(recetaData);
      alert("Receta creada correctamente.");
    } catch (error) {
      console.error("Error al crear la receta:", error);
      alert("Hubo un error al crear la receta.");
    }
  };

  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex-1">
            {product.Nombre_del_producto || "Producto sin nombre"}
            <br></br>
            {product.precioUnitario || "Producto sin nombre"} {product.UNIDADES || "Producto sin nombre"}
          </h3>
          {currentType === ProduccionInterna && (
            <Button className="bg-yellow-500 text-white hover:bg-yellow-500" onClick={handleRecepie}>
              {book}
            </Button>
          )}
          {showEdit && (
            <Button className="bg-red-500 text-white hover:bg-red-400" onClick={handleDelete}>
              {buttonState === "save" && "🧨"}
              {buttonState === "syncing" && "💢"}
              {buttonState === "done" && "💥"}
            </Button>
          )}
          <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={handleUpdate}>
            {buttonState === "save" && "💾"}
            {buttonState === "syncing" && "🔄"}
            {buttonState === "done" && "✅"}
          </Button>
        </div>

        <div className="flex gap-2">
          {filteredEstatus.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex-1 py-2 rounded text-white ${
                formData.Estado === status ? "bg-green-500" : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <label className="text-sm text-gray-700 flex-1">
            Stock Mínimo:
            {
            //showEdit
            true
            ? (
              <input
                type="text"
                name="minimo"
                value={formData.STOCK.minimo}
                onChange={handleStockChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                placeholder={product.STOCK?.minimo || ""}
              />
            ) : (
              <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                {formData.STOCK?.minimo || ""}
              </h3>
            )}
          </label>
          <label className="text-sm text-gray-700 flex-1">
            Stock Máximo:
        
            {
            //showEdit
            true
            ? (
              <input
                type="text"
                name="maximo"
                value={formData.STOCK?.maximo}
                onChange={handleStockChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                placeholder={product.STOCK?.maximo || ""}
              />
            ) : (
              <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                {formData.STOCK?.maximo || "" }
              </h3>
            )}
          </label>
          <label className="text-sm text-gray-700 flex-1">
            Stock Actual:
            {
            //showEdit
            true
            ? (
              <input
                type="text"
                name="actual"
                value={formData.STOCK?.actual}
                onChange={handleStockChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                placeholder={product.STOCK?.actual || ""}
              />
            ) : (
              <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                {formData.STOCK?.actual || ""}
              </h3>
            )}
          </label>
        </div>
        <div className="flex gap-4">
              <label className="text-sm text-gray-700 flex-1">
                Almacenamiento:
                <select
                  name="ALMACENAMIENTO"
                  value={formData.ALMACENAMIENTO?.ALMACENAMIENTO}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                >
                  <option value="" disabled>
                    {product.ALMACENAMIENTO?.ALMACENAMIENTO ? `Actual: ${product.ALMACENAMIENTO?.ALMACENAMIENTO}` : "Selecciona almacenamiento"}
                  </option>
                  {BODEGA.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-700 flex-1">
                Bodega:
                <select
                  name="BODEGA"
                  value={formData.ALMACENAMIENTO?.BODEGA}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                >
                  <option value="" disabled>
                    {product.ALMACENAMIENTO?.BODEGA ? `Actual: ${product.ALMACENAMIENTO?.BODEGA}` : "Selecciona bodega"}
                  </option>
                  {BODEGA.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

        {showEdit && (
          <>
            <label className="text-sm text-gray-700 flex-1">
              Nombre_del_producto:
              <input
                type="text"
                name="Nombre_del_producto"
                value={formData.Nombre_del_producto}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <div className="flex gap-4">
              {currentType !== ProduccionInterna && (
                <label className="text-sm text-gray-700 flex-1">
                  Precio por unidad:
                  <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                    {product.precioUnitario}
                  </h3>
                </label>
              )}
              <label className="text-sm text-gray-700 flex-1">
                Última Actualización:
                <h3 className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                  {product.FECHA_ACT}
                </h3>
              </label>
            </div>
            <label className="text-sm text-gray-700 flex-1">
              precioUnitario:
              <input
                type="text"
                name="precioUnitario"
                value={formData.precioUnitario}
                onChange={handleInputChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>

            <div className="flex gap-4">
              <label className="text-sm text-gray-700 flex-1">
                Cantidad:
                <input
                  type="text"
                  name="CANTIDAD"
                  value={formData.CANTIDAD}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
              <label className="text-sm text-gray-700 flex-1">
                Unidades:
                <select
                  name="UNIDADES"
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

            <div className="flex gap-4">
              <label className="text-sm text-gray-700 flex-1">
                Costo:
                <input
                  type="text"
                  name="COSTO"
                  value={formData.COSTO}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
              <label className="text-sm text-gray-700 flex-1">
                {"% Merma (0.00):"}
                <input
                  type="text"
                  name="Merma"
                  value={formData.Merma}
                  onChange={handleInputChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
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

              {currentType === ItemsAlmacen && (
                <label className="text-sm text-gray-700 flex-1">
                  Proveedor:
                  <select
                    name="Proveedor"
                    value={formData.Proveedor}
                    onChange={handleInputChange}
                    className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                  >
                    <option value="">
                      {product.Proveedor ? `${provData.Proveedor_Name}` : "Selecciona un Proveedor"}
                    </option>
                    {Proveedores.map((proveedor) => (
                      <option key={proveedor._id} value={proveedor._id}>
                        {proveedor.Nombre_Proveedor}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
           
          </>
        )}

        {currentType === ProduccionInterna && book === '📖' && (
          <RecepieOptions product={product} Receta={receta} currentType={currentType} onCreateReceta={handleCreateReceta} />
        )}
      </CardContent>
    </Card>
  );
}
