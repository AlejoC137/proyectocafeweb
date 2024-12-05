import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { STAFF, MENU, ITEMS, ItemsAlmacen, ProduccionInterna } from "../../../redux/actions-types";
import { CardGridInventario } from "@/components/ui/cardGridInventario";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";

function Inventario() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(ItemsAlmacen); // Estado inicial del toggle

  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);

  // Determinar los elementos según el tipo seleccionado
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

  // Ordenar los productos alfabéticamente por Nombre_del_producto
  const sortedItems = filteredItems.sort((a, b) => {
    if (a.Nombre_del_producto && b.Nombre_del_producto) {
      return a.Nombre_del_producto.localeCompare(b.Nombre_del_producto);
    }
    return 0;
  });

  // Agrupar productos por GRUPO, con una sección "POR ASIGNAR GRUPO" para los productos sin grupo
  const groupedItems = sortedItems.reduce((acc, item) => {
    const group = item.GRUPO || "POR ASIGNAR GRUPO";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const handleToggleType = (type) => {
    setCurrentType(type);
  };

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-screen border pt-3">
      {/* Botones para cambiar el tipo */}
      <h3
            className="text-lg font-bold ml-4"

      >ELIJA UNA LISTA</h3>
      <div className="flex justify-center gap-2 m-4">
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

      {/* Pasar currentType a AccionesRapidas */}
      <AccionesRapidas currentType={currentType} />

      {Object.keys(groupedItems)
        .sort() // Ordenar los grupos alfabéticamente
        .map((group) => (
          <div key={group} className="mb-6">
    
            {/* Grid de productos en el grupo */}
            <div className="overflow-hidden w-screen px-5">
              <CardGridInventario
                products={groupedItems[group]}
                category={group}
                currentType={currentType} // Pasar currentType a CardGridInventario
              />
            </div>
          </div>
        ))}
    </div>
  );
}

export default Inventario;
