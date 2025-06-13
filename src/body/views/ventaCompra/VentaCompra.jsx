import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa";
import MesaBarra from "./MesaBarra";
import Pagar from "./Pagar";
import Gastos from "../../components/gastos/Gastos";
import { MENU, ITEMS, PRODUCCION, PROVEE } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions";
import supabase from "../../../config/supabaseClient";

function VentaCompra() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [ventaId, setVentaId] = useState(null);
  const [totalPago, setTotalPago] = useState(null);
  const [showGastos, setShowGastos] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  }, [dispatch]);

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

  const toggleGastos = () => {
    setShowGastos(!showGastos);
  };

  if (loading) {
    return <div className="text-center text-lg font-semibold">Loading...</div>;
  }
console.log(ventas);

  return (
    <div className="bg-gray-100 h-[calc(100vh-8rem)] w-full overflow-auto">
      <button onClick={toggleGastos} className="m-2 p-2 bg-blue-500 text-white rounded">
        {showGastos ? "Ocultar Gastos" : "Mostrar Gastos"}
      </button>

      {showGastos && <Gastos />}

      <div className="col-span-1 pl-1 pr-1 pt-1">
        <MesaBarra
          key="mesa-barra"
          index={0}
          ventas={ventas}
          reloadVentas={reloadVentas}
          onPagar={handlePagar}
        />
      </div>

      <div className="gap-1 p-1">
        <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
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

