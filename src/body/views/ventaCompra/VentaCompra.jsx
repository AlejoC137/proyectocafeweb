import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa";
import MesaBarra from "./MesaBarra";
import { MENU, ITEMS, PRODUCCION } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";

function VentaCompra() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);

  // Fetch ventas from Supabase
  const fetchVentas = async () => {
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .select("*")
        .eq("Pagado", false);

      if (error) {
        console.error("Error fetching ventas:", error);
      } else {
        setVentas(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from Redux and Supabase
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
        ]);

        await fetchVentas();
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Reload ventas after updates
  const reloadVentas = async () => {
    setLoading(true);
    await fetchVentas();
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center text-lg font-semibold">Loading...</div>;
  }

  return (
    <div className="bg-gray-100    h-[calc(100vh-8rem)] w-full overflow-auto">
      {/* MesaBarra ocupa toda la primera columna */}
      <div className="col-span-1 pl-1 pr-1 pt-1" >
        <MesaBarra
          key="mesa-barra"
          index={0}
          ventas={ventas}
          reloadVentas={reloadVentas}
        />
      </div>

    <div className="gap-1 p-1">

      {/* Las demás mesas ocupan las columnas restantes */}
      <div className="col-span-3 grid grid-cols-3 gap-1">
        {[...Array(6)].map((_, index) => (
          <Mesa
            key={`mesa-${index + 1}`}
            index={index + 1}
            ventas={ventas}
            reloadVentas={reloadVentas}
          />
        ))}
      </div>
    </div>
    </div>
  );
}

export default VentaCompra;
