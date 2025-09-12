import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem,  } from "../../../redux/actions";

import { 
    ITEMS, 
    PRODUCCION, 
    AREAS, 
    CATEGORIES, 
    unidades, 
    ItemsAlmacen, 
    ProduccionInterna, 
    MENU, 
    MenuItems, 
    BODEGA, 
    ESTATUS,
    SUB_CATEGORIES
} from "../../../redux/actions-types";
import { crearProveedor } from "../../../redux/actions-Proveedores";

function AccionesRapidas({ currentType }) {
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allProveedores = useSelector((state) => state.Proveedores);

  useEffect(() => {
    // No se necesita fetchData aquí si el componente padre (Inventario) ya carga los datos.
    // Si se usa de forma aislada, descomentar.
    // const fetchData = async () => {
    //   try {
    //     await Promise.all([
    //       dispatch(getAllFromTable(ITEMS)),
    //       dispatch(getAllFromTable(PRODUCCION)),
    //       dispatch(getAllFromTable("Proveedores")),
    //     ]);
    //   } catch (error) {
    //     console.error("Error loading data:", error);
    //   }
    // };
    // fetchData();
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
    if (items.length === 0) {
        alert("No hay ítems para copiar.");
        return;
    }
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
    Estado: "OK",
    Area: "",
    CANTIDAD: "",
    UNIDADES: "",
    COSTO: "",
    STOCK: { minimo: "", maximo: "", actual: "" },
    GRUPO: "",
    MARCA: "", // Se manejará como texto simple
    Merma: 0,
    ALMACENAMIENTO: "",
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
    Precio: 0,
    DescripcionMenuES: "",
    DescripcionMenuEN: "",
    GRUPO: "",
    SUB_GRUPO: "",
    Foto: "",
    Estado: "Activo",
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

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setNewItemData((prev) => ({
        ...prev,
        STOCK: {
            ...prev.STOCK,
            [name]: value,
        },
    }));
  };

  const handleCrearItem = async () => {
    try {
      const itemData = {
        ...newItemData,
        STOCK: JSON.stringify(newItemData.STOCK),
        COOR: currentType === ItemsAlmacen ? "1.05" : undefined,
      };

      if (currentType === ProduccionInterna) {
        delete itemData.COOR;
      }

      Object.keys(itemData).forEach(key => {
        if (itemData[key] === "" || itemData[key] === null) {
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
      const menuItem = { ...menuItemData };
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
        <button className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600" onClick={() => handleCopiarPendientes(ItemsAlmacen)}>
          PENDIENTES COMPRA
        </button>
        <button className="bg-yellow-500 text-white py-1 px-2 rounded-md hover:bg-yellow-600" onClick={() => handleCopiarPendientes(ProduccionInterna)}>
          PENDIENTES PRODUCCIÓN
        </button>
      </div>
      <h2 className="text-lg font-bold pt-4">ACCIONES DE GESTIÓN</h2>
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600" onClick={handleActualizarPrecios}>
          ACTUALIZAR PRECIOS UNITARIOS
        </button>
        <button className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600" onClick={handleCopiarInfoItems}>
          COPIAR INFO ITEMS
        </button>
        <button className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600" onClick={() => setFormVisible((prev) => !prev)}>
          {formVisible ? "CANCELAR CREACIÓN" : "CREAR NUEVO ITEM"}
        </button>
        <button className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600" onClick={() => setFormProveedorVisible((prev) => !prev)}>
          {formProveedorVisible ? "CANCELAR CREACIÓN" : "CREAR NUEVO PROVEEDOR"}
        </button>
      </div>

      {formVisible && currentType !== MenuItems && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Ítem de Almacén / Producción</h3>
          <div className="grid grid-cols-3 gap-4">
            <input type="text" name="Nombre_del_producto" value={newItemData.Nombre_del_producto} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Nombre del producto" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <input type="number" name="CANTIDAD" value={newItemData.CANTIDAD} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Cantidad" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <input type="number" name="COSTO" value={newItemData.COSTO} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Costo" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <input type="number" name="Merma" value={newItemData.Merma} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Merma (ej. 0.1 para 10%)" className="border bg-white border-gray-300 rounded px-2 py-1" />
            {currentType === ItemsAlmacen && <input type="number" name="COOR" value={newItemData.COOR} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="COOR" className="border bg-white border-gray-300 rounded px-2 py-1" />}
            <input type="text" name="MARCA" value={newItemData.MARCA} onChange={(e) => handleInputChange(e, setNewItemData)} placeholder="Marca" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <input type="number" name="minimo" value={newItemData.STOCK.minimo} onChange={handleStockChange} placeholder="Stock Mínimo" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <input type="number" name="maximo" value={newItemData.STOCK.maximo} onChange={handleStockChange} placeholder="Stock Máximo" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <input type="number" name="actual" value={newItemData.STOCK.actual} onChange={handleStockChange} placeholder="Stock Actual" className="border bg-white border-gray-300 rounded px-2 py-1" />
            <select name="Proveedor" value={newItemData.Proveedor} onChange={(e) => handleInputChange(e, setNewItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
              <option value="">Seleccionar Proveedor</option>
              {allProveedores.map((p) => (<option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>))}
            </select>
            <select name="Area" value={newItemData.Area} onChange={(e) => handleInputChange(e, setNewItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
              <option value="">Seleccionar Área</option>
              {AREAS.map((area) => (<option key={area} value={area}>{area}</option>))}
            </select>
            <select name="UNIDADES" value={newItemData.UNIDADES} onChange={(e) => handleInputChange(e, setNewItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
              <option value="">Seleccionar Unidad</option>
              {unidades.map((unidad) => (<option key={unidad} value={unidad}>{unidad}</option>))}
            </select>
            <select name="GRUPO" value={newItemData.GRUPO} onChange={(e) => handleInputChange(e, setNewItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
              <option value="">Seleccionar Grupo</option>
              {CATEGORIES.map((group) => (<option key={group} value={group}>{group}</option>))}
            </select>
            <select name="ALMACENAMIENTO" value={newItemData.ALMACENAMIENTO} onChange={(e) => handleInputChange(e, setNewItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
              <option value="">Seleccionar Almacenamiento</option>
              {BODEGA.map((bodega) => (<option key={bodega} value={bodega}>{bodega}</option>))}
            </select>
            <select name="Estado" value={newItemData.Estado} onChange={(e) => handleInputChange(e, setNewItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
                <option value="">Seleccionar Estado</option>
                {ESTATUS.map((est) => (<option key={est} value={est}>{est}</option>))}
            </select>
          </div>
          <button className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600" onClick={handleCrearItem}>GUARDAR NUEVO ITEM</button>
        </div>
      )}

      {formVisible && currentType === MenuItems && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
            <h3 className="text-lg font-bold mb-2">Crear Nuevo Ítem de Menú</h3>
            <div className="grid grid-cols-3 gap-4">
                <input type="text" name="NombreES" value={menuItemData.NombreES} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Nombre (ES)" className="border bg-white border-gray-300 rounded px-2 py-1" />
                <input type="text" name="NombreEN" value={menuItemData.NombreEN} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Nombre (EN)" className="border bg-white border-gray-300 rounded px-2 py-1" />
                <input type="number" name="Precio" value={menuItemData.Precio} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Precio" className="border bg-white border-gray-300 rounded px-2 py-1" />
                <textarea name="DescripcionMenuES" value={menuItemData.DescripcionMenuES} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Descripción (ES)" className="border bg-white border-gray-300 rounded px-2 py-1 col-span-3" />
                <textarea name="DescripcionMenuEN" value={menuItemData.DescripcionMenuEN} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="Descripción (EN)" className="border bg-white border-gray-300 rounded px-2 py-1 col-span-3" />
                <select name="GRUPO" value={menuItemData.GRUPO} onChange={(e) => handleInputChange(e, setMenuItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
                    <option value="">Seleccionar Grupo</option>
                    {CATEGORIES.map((group) => (<option key={group} value={group}>{group}</option>))}
                </select>
                <select name="SUB_GRUPO" value={menuItemData.SUB_GRUPO} onChange={(e) => handleInputChange(e, setMenuItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
                    <option value="">Seleccionar Sub-Grupo</option>
                    {SUB_CATEGORIES.map((sub) => (<option key={sub} value={sub}>{sub}</option>))}
                </select>
                <select name="Estado" value={menuItemData.Estado} onChange={(e) => handleInputChange(e, setMenuItemData)} className="border bg-white border-gray-300 rounded px-2 py-1">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
                <input type="text" name="Foto" value={menuItemData.Foto} onChange={(e) => handleInputChange(e, setMenuItemData)} placeholder="URL de la Imagen" className="border bg-white border-gray-300 rounded px-2 py-1 col-span-3" />
            </div>
            <button className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600" onClick={handleCrearMenuItem}>GUARDAR NUEVO ÍTEM DE MENÚ</button>
        </div>
      )}

      {formProveedorVisible && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Proveedor</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(initialProveedorData).map((key) => (
              <input key={key} type="text" name={key} value={newProveedorData[key]} onChange={(e) => handleInputChange(e, setNewProveedorData)} placeholder={key.replace(/_/g, " ")} className="border bg-white border-gray-300 rounded px-2 py-1" />
            ))}
          </div>
          <button className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600" onClick={handleCrearProveedor}>GUARDAR NUEVO PROVEEDOR</button>
        </div>
      )}
    </div>
  );
}

export default AccionesRapidas;