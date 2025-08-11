import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem, crearProveedor } from "../../../redux/actions-Proveedores";
import { ITEMS, PRODUCCION, AREAS, CATEGORIES, unidades, ItemsAlmacen, ProduccionInterna, MENU, MenuItems } from "../../../redux/actions-types";

function AccionesRapidas({ currentType }) {
  console.log(currentType);
  
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allProveedores = useSelector((state) => state.Proveedores);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable("Proveedores")),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleActualizarPrecios = () => {
    dispatch(
      currentType === ITEMS
        ? actualizarPrecioUnitario(allItems, ITEMS)
        : actualizarPrecioUnitario(allProduccion, PRODUCCION)
    );
  };

  const handleCopiarPendientes = (type) => {
    dispatch(copiarAlPortapapeles( type === ItemsAlmacen ? allItems : allProduccion, type === ItemsAlmacen ? "PC" : "PP" , "Proveedor" , allProveedores ));
  };

  const handleCopiarInfoItems = () => {
    const items = currentType === ITEMS ? allItems : allProduccion;
    const headers = Object.keys(items[0]).join("\t");
    const rows = items.map(item => Object.values(item).join("\t")).join("\n");
    const clipboardData = `${headers}\n${rows}`;

    navigator.clipboard.writeText(clipboardData)
      .then(() => {
        alert("Información copiada al portapapeles.");
      })
      .catch(err => {
        console.error("Error al copiar al portapapeles:", err);
        alert("Hubo un error al copiar la información.");
      });
  };

  const [formVisible, setFormVisible] = useState(false);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);

  const initialItemData = {
    Nombre_del_producto: "",
    Proveedor: "",
    Estado: "Disponible",
    Area: "",
    CANTIDAD: "",
    UNIDADES: "",
    COSTO: "",
    STOCK: "",
    GRUPO: "",
    MARCA: [],
    precioUnitario: 0,
    ...(currentType === ItemsAlmacen && { COOR: "1.05" }),
  };

  const initialProveedorData = {
    Nombre_Proveedor: "",
    Contacto_Nombre: "",
    Contacto_Numero: "",
    Direccion: "",
    "NIT/CC": "",
  };

  const initialMenuItemData = {
    NombreES: "",
    NombreEN: "",
    DescripcionES: "",
    DescripcionEN: "",
    Precio: 0,
    Categoria: "",
    SUB_GRUPO: "",
    Imagen: "",
  };

  const [newItemData, setNewItemData] = useState(initialItemData);
  const [newProveedorData, setNewProveedorData] = useState(initialProveedorData);
  const [menuItemData, setMenuItemData] = useState(initialMenuItemData);

  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCrearItem = async () => {
    try {
      const itemData = {
        ...newItemData,
        COOR: currentType === ItemsAlmacen ? "1.05" : undefined,
      };

      if (currentType === ProduccionInterna) {
        delete itemData.COOR;
      }

      // Remove empty string fields
      Object.keys(itemData).forEach(key => {
        if (itemData[key] === "") {
          delete itemData[key];
        }
      });

      await dispatch(crearItem(itemData, currentType));
      alert("Ítem creado correctamente.");
      setNewItemData(initialItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem:", error);
      alert("Hubo un error al crear el ítem.");
    }
  };

  const handleCrearMenuItem = async () => {
    try {
      const menuItem = {
        ...menuItemData,
      };

      // Remove empty string fields
      Object.keys(menuItem).forEach(key => {
        if (menuItem[key] === "") {
          delete menuItem[key];
        }
      });

      await dispatch(crearItem(menuItem, MENU));
      alert("Ítem de menú creado correctamente.");
      setMenuItemData(initialMenuItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem de menú:", error);
      alert("Hubo un error al crear el ítem de menú.");
    }
  };

  const handleCrearProveedor = async () => {
    try {
      await dispatch(crearProveedor(newProveedorData));
      alert("Proveedor creado correctamente.");
      setNewProveedorData(initialProveedorData);
      setFormProveedorVisible(false);
    } catch (error) {
      console.error("Error al crear el proveedor:", error);
      alert("Hubo un error al crear el proveedor.");
    }
  };

  return (
    <div className="bg-white p-4">
      <h2 className="text-lg font-bold">ACCIONES RÁPIDAS</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
          onClick={() => handleCopiarPendientes(ItemsAlmacen)}
        >
          PENDIENTES COMPRA
        </button>
        <button
          className="bg-yellow-500 text-white py-1 px-2 rounded-md hover:bg-yellow-600"
          onClick={() => handleCopiarPendientes(ProduccionInterna)}
        >
          PENDIENTES PRODUCCIÓN
        </button>
      </div>
      <h2 className="text-lg font-bold pt-4">ACCIONES RÁPIDAS</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600"
          onClick={handleActualizarPrecios}
        >
          ACTUALIZAR PRECIOS UNITARIOS
        </button>
        <button
          className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
          onClick={() => setFormVisible((prev) => !prev)}
        >
          {formVisible ? "CANCELAR CREACIÓN" : "CREAR NUEVO ITEM"}
        </button>
        <button
          className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
          onClick={() => setFormProveedorVisible((prev) => !prev)}
        >
          {formProveedorVisible ? "CANCELAR CREACIÓN" : "CREAR NUEVO PROVEEDOR"}
        </button>
        <button
          className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600"
          onClick={handleCopiarInfoItems}
        >
          COPIAR INFO ITEMS
        </button>
      </div>

      {formVisible && currentType !== MenuItems && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Ítem</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(initialItemData).map((key) => (
              key !== "COOR" && (
                <input
                  key={key}
                  type="text"
                  name={key}
                  value={newItemData[key]}
                  onChange={(e) => handleInputChange(e, setNewItemData)}
                  placeholder={key.replace(/_/g, " ")}
                  className="border bg-white border-gray-300 rounded px-2 py-1"
                />
              )
            ))}
            <select
              name="Proveedor"
              value={newItemData.Proveedor}
              onChange={(e) => handleInputChange(e, setNewItemData)}
              className="border bg-white border-gray-300 rounded px-2 py-1"
            >
              <option value="">Proveedor</option>
              {allProveedores.map((proveedor) => (
                <option key={proveedor._id} value={proveedor.Nombre_Proveedor}>
                  {proveedor.Nombre_Proveedor}
                </option>
              ))}
            </select>
            <select
              name="Area"
              value={newItemData.Area}
              onChange={(e) => handleInputChange(e, setNewItemData)}
              className="border bg-white border-gray-300 rounded px-2 py-1"
            >
              <option value="">Área</option>
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select
              name="UNIDADES"
              value={newItemData.UNIDADES}
              onChange={(e) => handleInputChange(e, setNewItemData)}
              className="border bg-white border-gray-300 rounded px-2 py-1"
            >
              <option value="">Unidad</option>
              {unidades.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
            <select
              name="GRUPO"
              value={newItemData.GRUPO}
              onChange={(e) => handleInputChange(e, setNewItemData)}
              className="border bg-white border-gray-300 rounded px-2 py-1"
            >
              <option value="">Grupo</option>
              {CATEGORIES.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600"
            onClick={handleCrearItem}
          >
            GUARDAR NUEVO ITEM
          </button>
        </div>
      )}

      {formVisible && currentType === MenuItems && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Ítem de Menú</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(initialMenuItemData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                value={menuItemData[key]}
                onChange={(e) => handleInputChange(e, setMenuItemData)}
                placeholder={key.replace(/_/g, " ")}
                className="border bg-white border-gray-300 rounded px-2 py-1"
              />
            ))}
          </div>
          <button
            className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600"
            onClick={handleCrearMenuItem}
          >
            GUARDAR NUEVO ÍTEM DE MENÚ
          </button>
        </div>
      )}

      {formProveedorVisible && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Proveedor</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(initialProveedorData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                value={newProveedorData[key]}
                onChange={(e) => handleInputChange(e, setNewProveedorData)}
                placeholder={key.replace(/_/g, " ")}
                className="border bg-white border-gray-300 rounded px-2 py-1"
              />
            ))}
          </div>
          <button
            className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600"
            onClick={handleCrearProveedor}
          >
            GUARDAR NUEVO PROVEEDOR
          </button>
        </div>
      )}
    </div>
  );
}

export default AccionesRapidas;
