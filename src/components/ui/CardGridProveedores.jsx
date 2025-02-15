import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateProveedor, deleteProveedor, copiarAlPortapapeles } from "../../redux/actions-Proveedores";

export function CardGridProveedores() {
  const Proveedores = useSelector((state) => state.Proveedores || []);
  const Items = useSelector((state) => state.allItems || []);
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const [formData, setFormData] = useState({});
  const [buttonState, setButtonState] = useState("save");
  const [info, setInfo] = useState({});
  const [showProperties, setShowProperties] = useState({});

  useEffect(() => {
    const initialInfoState = Proveedores.reduce((acc, proveedor) => {
      acc[proveedor._id] = "📥";
      return acc;
    }, {});
    setInfo(initialInfoState);
  }, [Proveedores]);

  const handleInputChange = (e, proveedorId) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [proveedorId]: {
        ...prev[proveedorId],
        [name]: value,
      },
    }));
    setButtonState("save");
  };

  const handleUpdate = async (proveedorId) => {
    setButtonState("syncing");
    try {
      const updatedFields = formData[proveedorId];
      await dispatch(updateProveedor(proveedorId, updatedFields));
      setButtonState("done");
    } catch (error) {
      console.error("Error al actualizar el proveedor:", error);
      setButtonState("save");
    }
  };

  const handleDelete = async (proveedorId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
      try {
        setButtonState("syncing");
        await dispatch(deleteProveedor(proveedorId));
        setButtonState("done");
        alert("Proveedor eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el proveedor:", error);
        alert("Hubo un error al eliminar el proveedor.");
        setButtonState("save");
      }
    }
  };

  const handleCopyPending = async (proveedorId) => {
    try {
      const pendingItems = Items.filter(item => item.Proveedor === proveedorId && item.Estado === "PC");
      await dispatch(copiarAlPortapapeles(pendingItems, "PC", "Proveedor", Proveedores));
      alert("Productos pendientes de compra copiados al portapapeles.");
    } catch (error) {
      console.error("Error al copiar productos pendientes:", error);
      alert("Hubo un error al copiar los productos pendientes.");
    }
  };

  const toggleInfo = (proveedorId) => {
    setInfo((prev) => ({
      ...prev,
      [proveedorId]: prev[proveedorId] === "📥" ? "📤" : "📥",
    }));
  };

  const toggleProperties = (proveedorId) => {
    setShowProperties((prev) => ({
      ...prev,
      [proveedorId]: !prev[proveedorId],
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {Proveedores.map((proveedor) => (
        <Card key={proveedor._id} className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200">
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-gray-800 flex-1">
                {proveedor.Nombre_Proveedor || "Proveedor sin nombre"}
              </h3>
              {showEdit && (
                <Button className="bg-red-500 text-white hover:bg-red-400" onClick={() => handleDelete(proveedor._id)}>
                  {buttonState === "save" && "🧨"}
                  {buttonState === "syncing" && "💢"}
                  {buttonState === "done" && "💥"}
                </Button>
              )}
              <Button className="bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleUpdate(proveedor._id)}>
                {buttonState === "save" && "💾"}
                {buttonState === "syncing" && "🔄"}
                {buttonState === "done" && "✅"}
              </Button>
              <Button className="bg-green-500 text-white hover:bg-green-600" onClick={() => handleCopyPending(proveedor._id)}>
                📋
              </Button>
              <Button className="bg-yellow-500 text-white hover:bg-yellow-600" onClick={() => toggleInfo(proveedor._id)}>
                {info[proveedor._id]}
              </Button>
              <Button className="bg-purple-500 text-white hover:bg-purple-600" onClick={() => toggleProperties(proveedor._id)}>
                📂
              </Button>
            </div>

            {showProperties[proveedor._id] && (
              <>
                <label className="text-sm text-gray-700 flex-1">
                  Nombre del Proveedor:
                  {showEdit ? (
                    <input
                      type="text"
                      name="Nombre_Proveedor"
                      value={formData[proveedor._id]?.Nombre_Proveedor || proveedor.Nombre_Proveedor}
                      onChange={(e) => handleInputChange(e, proveedor._id)}
                      className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                    />
                  ) : (
                    <p className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                      {proveedor.Nombre_Proveedor}
                    </p>
                  )}
                </label>
                <label className="text-sm text-gray-700 flex-1">
                  Contacto Nombre:
                  {showEdit ? (
                    <input
                      type="text"
                      name="Contacto_Nombre"
                      value={formData[proveedor._id]?.Contacto_Nombre || proveedor.Contacto_Nombre}
                      onChange={(e) => handleInputChange(e, proveedor._id)}
                      className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                    />
                  ) : (
                    <p className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                      {proveedor.Contacto_Nombre}
                    </p>
                  )}
                </label>
                <label className="text-sm text-gray-700 flex-1">
                  Contacto Número:
                  {showEdit ? (
                    <input
                      type="text"
                      name="Contacto_Numero"
                      value={formData[proveedor._id]?.Contacto_Numero || proveedor.Contacto_Numero}
                      onChange={(e) => handleInputChange(e, proveedor._id)}
                      className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                    />
                  ) : (
                    <p className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                      {proveedor.Contacto_Numero}
                    </p>
                  )}
                </label>
                <label className="text-sm text-gray-700 flex-1">
                  Dirección:
                  {showEdit ? (
                    <input
                      type="text"
                      name="Direccion"
                      value={formData[proveedor._id]?.Direccion || proveedor.Direccion}
                      onChange={(e) => handleInputChange(e, proveedor._id)}
                      className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                    />
                  ) : (
                    <p className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                      {proveedor.Direccion}
                    </p>
                  )}
                </label>
                <label className="text-sm text-gray-700 flex-1">
                  NIT/CC:
                  {showEdit ? (
                    <input
                      type="text"
                      name="NIT/CC"
                      value={formData[proveedor._id]?.["NIT/CC"] || proveedor["NIT/CC"]}
                      onChange={(e) => handleInputChange(e, proveedor._id)}
                      className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                    />
                  ) : (
                    <p className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                      {proveedor["NIT/CC"]}
                    </p>
                  )}
                </label>
                <label className="text-sm text-gray-700 flex-1">
                  Página Web:
                  {showEdit ? (
                    <input
                      type="text"
                      name="PAGINA_WEB"
                      value={formData[proveedor._id]?.PAGINA_WEB || proveedor.PAGINA_WEB}
                      onChange={(e) => handleInputChange(e, proveedor._id)}
                      className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                    />
                  ) : (
                    <p className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                      {proveedor.PAGINA_WEB}
                    </p>
                  )}
                </label>
              </>
            )}

            {info[proveedor._id] === "📤" && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-800">Productos Pendientes de Compra:</h4>
                <ul className="list-disc list-inside">
                  {Items.filter(item => item.Proveedor === proveedor._id && item.Estado === "PC").map((item) => (
                    <li key={item._id}>{item.Nombre_del_producto}: {item.CANTIDAD} {item.UNIDADES}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
