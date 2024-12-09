import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { toggleShowEdit } from "../../../redux/actions";
import { STAFF, MENU, ITEMS, ItemsAlmacen, ProduccionInterna } from "../../../redux/actions-types";
import { CardGridInventario } from "@/components/ui/cardGridInventario";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";

function Inventario() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(ItemsAlmacen);

  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);
  const showEdit = useSelector((state) => state.showEdit); // Obtener el estado de showEdit

  const filteredItems = currentType === ItemsAlmacen ? Items : Produccion;

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleToggleType = (type) => {
    setCurrentType(type);
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit()); // Alternar el estado de showEdit
  };

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-screen border ">
      <h3 className="text-lg font-bold ml-4">ELIJA UNA LISTA</h3>
      <div className="flex justify-center gap-4 ml-4 mr-4 mb-4">
        <button
          className={`rounded-md w-1/2 font-bold ${
            currentType === ItemsAlmacen
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          }`}
          onClick={() => handleToggleType(ItemsAlmacen)}
        >
          Almacén
        </button>
        <button
          className={`rounded-md w-1/2 font-bold ${
            currentType === ProduccionInterna
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          }`}
          onClick={() => handleToggleType(ProduccionInterna)}
        >
          Producción
        </button>
      </div>

      <button
        className="bg-blue-500 text-white px-2 rounded-md ml-4  mr-4 hover:bg-blue-600"
        onClick={handleToggleShowEdit}
      >
        {showEdit ? "Ocultar Edición" : "Mostrar Edición"}
      </button>

      <AccionesRapidas currentType={currentType} />
      
      <h3 className="text-lg font-bold ml-4">LISTAS</h3>
      {/* {filteredItems.map((item) => ( */}
        <CardGridInventario
          // key={item.id}
          products={filteredItems}
          category="Grouped"
          currentType={currentType}
          showEdit={showEdit} // Pasar showEdit a CardGridInventario
        />
      {/* ))} */}
    </div>
  );
}

export default Inventario;
