import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem, crearProveedor } from "../../../redux/actions-Proveedores";
import { ITEMS, PRODUCCION, AREAS, CATEGORIES, unidades, ItemsAlmacen, ProduccionInterna, MENU , MenuItems} from "../../../redux/actions-types";

function AccionesRapidas({ currentType }) {
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
      currentType === ItemsAlmacen
        ? actualizarPrecioUnitario(allItems, ItemsAlmacen)
        : actualizarPrecioUnitario(allProduccion, ProduccionInterna)
    );
  };

  const handleCopiarPendientesCompra = () => {
    dispatch(copiarAlPortapapeles(allItems, "PC"));
  };

  const handleCopiarPendientesProduccion = () => {
    dispatch(copiarAlPortapapeles(allProduccion, "PP"));
  };

  const [formVisible, setFormVisible] = useState(false);
  const [newItemData, setNewItemData] = useState({
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
  });

  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [newProveedorData, setNewProveedorData] = useState({
    Nombre_Proveedor: "",
    Contacto_Nombre: "",
    Contacto_Numero: "",
    Direccion: "",
    "NIT/CC": "",
  });

  const [menuItemData, setMenuItemData] = useState({
    NombreES: "",
    NombreEN: "",
    DescripcionES: "",
    DescripcionEN: "",
    Precio: 0,
    Categoria: "",
    Subcategoria: "",
    Imagen: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItemData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProveedorInputChange = (e) => {
    const { name, value } = e.target;
    setNewProveedorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMenuItemInputChange = (e) => {
    const { name, value } = e.target;
    setMenuItemData((prev) => ({
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

      await dispatch(crearItem(itemData, currentType));
      alert("Ítem creado correctamente.");
      setNewItemData({
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
      });
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem:", error);
      alert("Hubo un error al crear el ítem.");
    }
  };

  const handleCrearMenuItem = async () => {
    try {
      await dispatch(crearItem(menuItemData, MENU));
      alert("Ítem de menú creado correctamente.");
      setMenuItemData({
        NombreES: "",
        NombreEN: "",
        DescripcionES: "",
        DescripcionEN: "",
        Precio: 0,
        Categoria: "",
        Subcategoria: "",
        Imagen: "",
      });
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
      setNewProveedorData({
        Nombre_Proveedor: "",
        Contacto_Nombre: "",
        Contacto_Numero: "",
        Direccion: "",
        "NIT/CC": "",
      });
      setFormProveedorVisible(false);
    } catch (error) {
      console.error("Error al crear el proveedor:", error);
      alert("Hubo un error al crear el proveedor.");
    }
  };

  return (
    <div className="bg-white p-4">
      <h2 className="text-lg font-bold">ACCIONES RÁPIDAS</h2>

      {/* Botones en filas de dos */}
      <div className="grid grid-cols-2 gap-4 ">
        {/* Primera fila */}
        <button
          className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
          onClick={handleCopiarPendientesCompra}
        >
          PENDIENTES COMPRA
        </button>
        <button
          className="bg-yellow-500 text-white py-1 px-2 rounded-md hover:bg-yellow-600"
          onClick={handleCopiarPendientesProduccion}
        >
          PENDIENTES PRODUCCIÓN
        </button>
      </div>
      
      <h2 className="text-lg font-bold pt-4">ACCIONES RÁPIDAS</h2>

      <div className="grid grid-cols-2 gap-4 ">
        {/* Segunda fila */}
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
      </div>

      {/* Formulario de creación de ítem */}
      {formVisible && currentType !== MenuItems && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Ítem</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="Nombre_del_producto"
              value={newItemData.Nombre_del_producto}
              onChange={handleInputChange}
              placeholder="Nombre del producto"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <select
              name="Proveedor"
              value={newItemData.Proveedor}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              className="border bg-white border-gray-300 rounded px-2 py-1"
            >
              <option value="">Área</option>
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="CANTIDAD"
              value={newItemData.CANTIDAD}
              onChange={handleInputChange}
              placeholder="Cantidad"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <select
              name="UNIDADES"
              value={newItemData.UNIDADES}
              onChange={handleInputChange}
              className="border bg-white border-gray-300 rounded px-2 py-1"
            >
              <option value="">Unidad</option>
              {unidades.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="COSTO"
              value={newItemData.COSTO}
              onChange={handleInputChange}
              placeholder="Costo"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="STOCK"
              value={newItemData.STOCK}
              onChange={handleInputChange}
              placeholder="Stock"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <select
              name="GRUPO"
              value={newItemData.GRUPO}
              onChange={handleInputChange}
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

      {/* Formulario de creación de ítem de menú */}
      {formVisible && currentType === MenuItems && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Ítem de Menú</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="NombreES"
              value={menuItemData.NombreES}
              onChange={handleMenuItemInputChange}
              placeholder="Nombre en Español"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="NombreEN"
              value={menuItemData.NombreEN}
              onChange={handleMenuItemInputChange}
              placeholder="Nombre en Inglés"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="DescripcionES"
              value={menuItemData.DescripcionES}
              onChange={handleMenuItemInputChange}
              placeholder="Descripción en Español"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="DescripcionEN"
              value={menuItemData.DescripcionEN}
              onChange={handleMenuItemInputChange}
              placeholder="Descripción en Inglés"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="number"
              name="Precio"
              value={menuItemData.Precio}
              onChange={handleMenuItemInputChange}
              placeholder="Precio"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="Categoria"
              value={menuItemData.Categoria}
              onChange={handleMenuItemInputChange}
              placeholder="Categoría"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="Subcategoria"
              value={menuItemData.Subcategoria}
              onChange={handleMenuItemInputChange}
              placeholder="Subcategoría"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="Imagen"
              value={menuItemData.Imagen}
              onChange={handleMenuItemInputChange}
              placeholder="URL de la Imagen"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
          </div>
          <button
            className="bg-blue-500 text-white py-1 px-2 rounded-md mt-4 hover:bg-blue-600"
            onClick={handleCrearMenuItem}
          >
            GUARDAR NUEVO ÍTEM DE MENÚ
          </button>
        </div>
      )}

      {/* Formulario de creación de proveedor */}
      {formProveedorVisible && (
        <div className="bg-gray-100 p-4 rounded-md mt-4">
          <h3 className="text-lg font-bold mb-2">Crear Nuevo Proveedor</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="Nombre_Proveedor"
              value={newProveedorData.Nombre_Proveedor}
              onChange={handleProveedorInputChange}
              placeholder="Nombre del proveedor"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="Contacto_Nombre"
              value={newProveedorData.Contacto_Nombre}
              onChange={handleProveedorInputChange}
              placeholder="Nombre del contacto"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="Contacto_Numero"
              value={newProveedorData.Contacto_Numero}
              onChange={handleProveedorInputChange}
              placeholder="Número de contacto"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="Direccion"
              value={newProveedorData.Direccion}
              onChange={handleProveedorInputChange}
              placeholder="Dirección"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
            <input
              type="text"
              name="NIT/CC"
              value={newProveedorData["NIT/CC"]}
              onChange={handleProveedorInputChange}
              placeholder="NIT/CC"
              className="border bg-white border-gray-300 rounded px-2 py-1"
            />
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
