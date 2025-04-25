import React, { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient"; // Import supabase client

function Predict({ menuItem }) {
  const [ventasGroupedByDate, setVentasGroupedByDate] = useState([]);
  const [averageByDay, setAverageByDay] = useState({});
  const [trend, setTrend] = useState(null);

  // Ensure menuItem has a default value if null or undefined
  const selectedMenuItem = menuItem || "Menu";

  const fetchVentasWithMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('Ventas')
        .select('*')
        .order('Date', { ascending: false });

      if (error) {
        console.error("Error fetching ventas:", error);
        return;
      }

      // Filter ventas based on the selected menu item
      const filteredVentas = data.filter((venta) => {
        if (venta.Productos) {
          const productos = JSON.parse(venta.Productos);
          return productos.some((producto) => producto.NombreES === selectedMenuItem);
        }
        return false;
      });

      // Group ventas by date and calculate totals
      const grouped = filteredVentas.reduce((acc, venta) => {
        const productos = JSON.parse(venta.Productos);
        const producto = productos.find((p) => p.NombreES === selectedMenuItem);

        if (!acc[venta.Date]) {
          acc[venta.Date] = {
            date: venta.Date,
            totalIngreso: 0,
            totalCantidad: 0,
            ventas: [],
          };
        }

        acc[venta.Date].totalIngreso += parseFloat(venta.Total_Ingreso || 0);
        acc[venta.Date].totalCantidad += parseFloat(producto?.quantity || 0);
        acc[venta.Date].ventas.push(venta);

        return acc;
      }, {});

      setVentasGroupedByDate(Object.values(grouped));

      // Calculate predictions
      calculateAverageByDay(filteredVentas);
      calculateTrend(filteredVentas);
    } catch (error) {
      console.error("Error fetching ventas with Menu:", error);
    }
  };

  const calculateAverageByDay = (ventas) => {
    const dayTotals = {};
    const dayCounts = {};
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    ventas.forEach((venta) => {
      const productos = JSON.parse(venta.Productos);
      const producto = productos.find((p) => p.NombreES === selectedMenuItem);
      if (producto) {
        const date = new Date(venta.Date);
        const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        if (!dayTotals[day]) {
          dayTotals[day] = 0;
          dayCounts[day] = 0;
        }

        dayTotals[day] += parseFloat(producto.quantity || 0);
        dayCounts[day] += 1;
      }
    });

    const averages = {};
    for (const day in dayTotals) {
      averages[dayNames[day]] = dayTotals[day] / dayCounts[day];
    }

    setAverageByDay(averages);
  };

  const calculateTrend = (ventas) => {
    const sortedVentas = [...ventas].sort((a, b) => new Date(a.Date) - new Date(b.Date));
    const quantities = sortedVentas.map((venta) => {
      const productos = JSON.parse(venta.Productos);
      const producto = productos.find((p) => p.NombreES === selectedMenuItem);
      return producto ? parseFloat(producto.quantity || 0) : 0;
    });

    if (quantities.length < 2) {
      setTrend("No suficiente información");
      return;
    }

    const diffs = [];
    for (let i = 1; i < quantities.length; i++) {
      diffs.push(quantities[i] - quantities[i - 1]);
    }

    const averageDiff = diffs.reduce((acc, diff) => acc + diff, 0) / diffs.length;
    setTrend(averageDiff > 0 ? "Creciente" : averageDiff < 0 ? "Decreciente" : "Estable");
  };

  useEffect(() => {
    fetchVentasWithMenu();
  }, [selectedMenuItem]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-screen">
      <h1 className="text-2xl font-bold mb-4">Ventas para: {selectedMenuItem}</h1>
      {ventasGroupedByDate.length > 0 ? (
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Fecha</th>
              <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Total Ingreso</th>
              <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Cantidad Total</th>
              <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {ventasGroupedByDate.map((group) => (
              <tr key={group.date} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 border-b text-sm text-gray-700">{group.date}</td>
                <td className="py-3 px-4 border-b text-sm text-green-600 font-bold">{group.totalIngreso}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-700">{group.totalCantidad}</td>
                <td className="py-3 px-4 border-b text-sm text-blue-500">
                  <details>
                    <summary className="cursor-pointer">Ver Detalles</summary>
                    <ul className="mt-2">
                      {group.ventas.map((venta) => (
                        <li key={venta._id} className="text-gray-600">
                          Hora: {venta.Time}, Método de Pago:{" "}
                          {(() => {
                            let pagoInfo;
                            try {
                              pagoInfo = JSON.parse(venta.Pago_Info);
                            } catch (e) {
                              console.error("Error parsing Pago_Info:", e);
                              return "Desconocido";
                            }
                            return pagoInfo?.metodo || "Desconocido";
                          })()}
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-700">No se encontraron ventas para este producto.</p>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Predicción</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Promedio por día de la semana:</h3>
          <ul>
            {Object.entries(averageByDay).map(([day, avg]) => (
              <li key={day} className="text-gray-700">
                {day}: {avg.toFixed(2)} unidades
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Tendencia:</h3>
          <p className="text-gray-700">{trend}</p>
        </div>
      </div>
    </div>
  );
}

export default Predict;
