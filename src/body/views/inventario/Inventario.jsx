import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups } from "../../../redux/actions";
import { toggleShowEdit } from "../../../redux/actions";
import { STAFF, MENU, ITEMS, PRODUCCION, PROVEE, ItemsAlmacen, ProduccionInterna } from "../../../redux/actions-types";
import { CardGridInventario } from "@/components/ui/cardGridInventario";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";
import { FaWarehouse, FaIndustry, FaEdit, FaTools } from "react-icons/fa";

function Inventario() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(ItemsAlmacen);
  const [showAccionesRapidas, setShowAccionesRapidas] = useState(false); // Local state to toggle AccionesRapidas

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
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROVEE))          
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
    if (currentType === type) {
      dispatch(resetExpandedGroups()); // Ocultar los grupos si se hace clic en el mismo botón
    } else {
      setCurrentType(type);
    }
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit()); // Alternar el estado de showEdit
  };

  const handleToggleAccionesRapidas = () => {
    setShowAccionesRapidas((prev) => !prev); // Toggle the visibility of AccionesRapidas
  };

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      <div className="flex justify-center align-top gap-4 p-4 fixed top-12 left-0 right-0 bg-white z-10">
        <button
          className={`rounded-md w-1/5 font-bold flex flex-col items-center justify-center ${
            currentType === ItemsAlmacen
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          }`}
          onClick={() => handleToggleType(ItemsAlmacen)}
        >
          🛒
          <span className="text-xs mt-1 truncate">Almacén</span>
        </button>
        <button
          className={`rounded-md w-1/5 font-bold flex flex-col items-center justify-center ${
            currentType === ProduccionInterna
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          }`}
          onClick={() => handleToggleType(ProduccionInterna)}
        >
          🥘
          <span className="text-xs mt-1 truncate">Producción</span>
        </button>
        <button
          className={`w-1/5 px-2 rounded-md flex flex-col items-center justify-center ${
            showEdit ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handleToggleShowEdit}
        >
          ⚙️
          <span className="text-xs mt-1 truncate">Edición</span>
        </button>
        <button
          className={`w-1/5 px-2 rounded-md flex flex-col items-center justify-center ${
            showAccionesRapidas ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handleToggleAccionesRapidas}
        >
          ⚡
          <span className="text-xs mt-1 truncate">Acciones</span>
        </button>
      </div>
<br></br>
      <div className="flex flex-col mt-20 overflow-y-auto">
        {showAccionesRapidas && <AccionesRapidas currentType={currentType} />}

        <h3 className="text-lg font-bold ml-4">{`Listado de ${currentType}`}</h3>
        <CardGridInventario
          products={filteredItems}
          category="Grouped"
          currentType={currentType}
          showEdit={showEdit} // Pasar showEdit a CardGridInventario
        />
      </div>
    </div>
  );
}

export default Inventario;
