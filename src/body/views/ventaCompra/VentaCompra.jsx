import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa";
import MesaBarra from "./MesaBarra";
import Pagar from "./Pagar";
import { MENU, ITEMS, PRODUCCION , PROVEE} from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";
import Gastos from "../../components/Gastos/Gastos";
import { crearCompra } from "../../../redux/actions-VentasCompras";




function VentaCompra() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [ventaId, setVentaId] = useState(null);
  const [totalPago, setTotalPago] = useState(null);
  const [showGastos, setShowGastos] = useState(false);


  
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
          dispatch(getAllFromTable(PROVEE)),
        ]);

        await fetchVentas();
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    fetchData();
  // }, [dispatch]);
  }, []);

  // Reload ventas after updates
  const reloadVentas = async () => {
    setLoading(true);
    await fetchVentas();
    setLoading(false);
  };

  const handlePagar = (ventaId, total) => {
    setVentaId(ventaId);
    setTotalPago(total);
    setShowPagarModal(true);
  };

  const handleClosePagarModal = () => {
    setShowPagarModal(false);
    setVentaId(null);
    setTotalPago(null);
  };

  if (loading) {
    return <div className="text-center text-lg font-semibold">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 h-[calc(100vh-8rem)] w-full overflow-auto">
      {/* MesaBarra ocupa toda la primera columna */}
      <div className="col-span-2 pl-1 pr-1 pt-1 flex">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
          onClick={() => setShowGastos(!showGastos)}
        >
          {showGastos ? "Formato de Compra" : "Compra "}
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
          onClick={() => handleActualizar()}
        >
          {"Actualizar"}
        </button>

      </div>
      {showGastos && <Gastos />}



      <div className="gap-1 p-1">
        {/* Las demás mesas ocupan las columnas restantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {[...Array(6)].map((_, index) => (
            <Mesa
              key={`mesa-${index + 1}`}
              index={index + 1}
              ventas={ventas}
              reloadVentas={reloadVentas}
              onPagar={handlePagar}
            />
          ))}
        </div>
      </div>

      {showPagarModal && (
        <Pagar onClose={handleClosePagarModal} ventaId={ventaId} total={totalPago} />
      )}
    </div>
  );
}

export default VentaCompra;
