import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Mesa from "./Mesa";
import { MENU } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";

function VentaCompra() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          // dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          // dispatch(getAllFromTable(ITEMS)),
          // dispatch(getAllFromTable(PRODUCCION)),
          // dispatch(getAllFromTable(PROVEE)),
        ]);

        const { data, error } = await supabase
          .from("Ventas")
          .select("*")
          .eq("Pagado", false);

        if (error) {
          console.error("Error fetching ventas:", error);
        } else {
          setVentas(data);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 grid grid-cols-3 w-screen gap-1 h-[calc(100vh-8rem)] p-2">
      {[...Array(6)].map((_, index) => (
        <Mesa key={index} index={index + 1} ventas={ventas} />
      ))}
    </div>
  );
}

export default VentaCompra;
