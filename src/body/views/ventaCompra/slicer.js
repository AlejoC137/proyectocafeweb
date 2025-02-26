import supabase from "../../../config/supabaseClient.js";
import { actualizarVenta } from "../../../redux/actions-VentasCompras"; // Import the action

export async function fetchAndProcessSales(dispatch) {
  try {
    const { data, error } = await supabase
      .from("Ventas")
      .select("*")
      .filter("Time", "is", null)
      .order("Date", { ascending: true });

    if (error) {
      console.error("Error fetching sales:", error);
      return;
    }

    const processedSales = data.map((sale) => {
      if (sale.Date && sale.Date.includes(',')) {
        const [date, time] = sale.Date.split(',');
        const updatedSale = {
          ...sale,
          Date: date.trim(),
          Time: time.trim(),
        };
        // Dispatch the actualizarVenta action
        dispatch(actualizarVenta(sale._id, { Date: updatedSale.Date, Time: updatedSale.Time }));
        return updatedSale;
      }
      return sale;
    });

    console.log("Processed Sales:", processedSales);
    return processedSales;
  } catch (error) {
    console.error("Error processing sales:", error);
  }
}
