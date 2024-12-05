import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { STAFF, MENU, ITEMS } from "../../../redux/actions-types";
import { CardGridInventario } from "@/components/ui/cardGridInventario";
import AccionesRapidas from "../actualizarPrecioUnitario/AccionesRapidas";

function Inventario() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const allItems = useSelector((state) => state.allItems || []);

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
  const sortedItems = allItems.sort((a, b) => {
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

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-screen border pt-3">
      <AccionesRapidas></AccionesRapidas>
      {Object.keys(groupedItems)
        .sort() // Ordenar los grupos alfabéticamente
        .map((group) => (
          <div key={group} className="mb-6">
            {/* Título del grupo */}
            <div className="text-2xl font-bold text-center py- bg-gray-100">
              {/* {group.toUpperCase()} */}
            </div>
            {/* Grid de productos en el grupo */}
            <div className="overflow-hidden w-screen px-5">
              <CardGridInventario
                products={groupedItems[group]}
                category={group}
              />
            </div>
          </div>
        ))}
    </div>
  );
}

export default Inventario;
