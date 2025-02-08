import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Mesa from "./Mesa.jsx";
import MesaBarra from "./MesaBarra.jsx";
import Pagar from "./Pagar.jsx";
import { MENU, ITEMS, PRODUCCION , PROVEE} from "../../../redux/actions-types.js";
import { getAllFromTable } from "../../../redux/actions.js";
import supabase from "../../../config/supabaseClient.js";
import Gastos from "../../components/Gastos/Gastos.jsx";
import { crearCompra } from "../../../redux/actions-VentasCompras.js";

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
}, [dispatch]);

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

return (
<div className="container">
{/* Barra de estado */}
<div className="barra-de-estado">
{loading && <span> Cargando...</span>}
{!loading && <span> Listo para usar</span>}
</div>

{/* Botones de acción */}
<div className="botones">
<button
onClick={() => setShowGastos(!showGastos)}
className="btn-gasto"
>
{showGastos ? "Ver menos" : "Ver más"}
</button>
<button
onClick={() => handlePagar(1, 100)}
className="btn-pagar"
>
Pagar (S/ 100)
</button>
</div>

{/* Componentes principales */}
{showGastos && (
<div className="gastos">
<h2>Datos de Gasto</h2>
<Mesa data={ventas} reload={reloadVentas} />
</div>
)}

{/* Pagar modal */}
{showPagarModal && (
<div className="pago-modal">
<h3>Pago Realizado</h3>
<p>ID de Pedido: {ventaId}</p>
<p>Monto: S/ {totalPago}</p>
<button
onClick={() => setShowPagarModal(false)}
className="btn-aceptar"
>
Aceptar
</button>
</div>
)}
</div>
);
}

export default VentaCompra;