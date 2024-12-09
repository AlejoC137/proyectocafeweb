import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem } from "../../../redux/actions";
import { ITEMS, PRODUCCION, AREAS, CATEGORIES, unidades, ItemsAlmacen, ProduccionInterna } from "../../../redux/actions-types";

function AccionesRapidas({ currentType }) {
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems);
  const allProduccion = useSelector((state) => state.allProduccion);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
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
    Proveedor: [],
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItemData((prev) => ({
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
        Proveedor: [],
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
        {/* Primera fila */}


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
      </div>

      {/* Formulario de creación */}
      {formVisible && (
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
    </div>
  );
}

export default AccionesRapidas;
