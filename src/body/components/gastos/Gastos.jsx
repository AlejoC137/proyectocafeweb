import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import supabase from "../../../config/supabaseClient";
import { crearCompra } from "../../../redux/actions-VentasCompras";

function Gastos() {
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const Proveedores = useSelector((state) => state.Proveedores);
  const [hoy, setHoy] = useState(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }).split(",")[0]);
  const dispatch = useDispatch();

  // Estados para los campos del formulario
  const [fecha, setFecha] = useState(hoy);
  const [Valor, setValor] = useState("");
  const [MedioDeCompra, setMedioDeCompra] = useState("");
  const [MedioDePago, setMedioDePago] = useState("");
  const [Comprador, setComprador] = useState("");
  const [Pagado, setPagado] = useState({ pagadoFull: false, adelanto: "NoAplica" });
  const [Categoria, setCategoria] = useState("");
  const [linkDocSoporte, setLinkDocSoporte] = useState("");
  const [Proveedor_Id, setProveedorId] = useState("");

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Crear el objeto con los datos del formulario
    const gastoData = {
      Date: fecha,
      Valor: parseFloat(Valor), // Convertir a número
      MedioDeCompra,
      MedioDePago,
      Comprador,
      Pagado,
      Categoria,
      linkDocSoporte,
      Proveedor_Id,
    };

    try {
      // Usar la acción crearCompra
      const result = await dispatch(crearCompra(gastoData));

      if (result) {
        console.log("Datos insertados correctamente:", result);
        alert("Gasto registrado exitosamente!");
      } else {
        throw new Error("Error al registrar el gasto.");
      }
    } catch (error) {
      console.error("Error al insertar datos en Supabase:", error);
      alert("Hubo un error al registrar el gasto.");
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    const dateList = date.split("-");

    // Remove leading zeros from month and day
    dateList[1] = dateList[1].replace(/^0+/, '');
    dateList[2] = dateList[2].replace(/^0+/, '');

    let formattedDate = `${dateList[1]}/${dateList[2]}/${dateList[0]}`;

    setHoy(formattedDate);
    console.log(formattedDate); // Output: "2/3/2025"
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Registrar Gasto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo: Fecha */}
        <div>
        <label htmlFor="date" className="block bg-white text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          className=" bg-gray-500 mt-1 block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          onChange={handleDateChange}
        />
        <p>Selected Date: {hoy}</p>
      </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Campo: Valor */}
          <div>
            <label className="block text-sm font-medium">Valor:</label>
            <input
              type="text"
              value={Valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: 10000"
              className="w-full p-2 border bg-white rounded"
              required
            />
          </div>

          {/* Campo: Medio de Compra */}
          <div>
            <label className="block text-sm font-medium">Medio de Compra:</label>
            <select
              value={MedioDeCompra}
              onChange={(e) => setMedioDeCompra(e.target.value)}
              className="w-full p-2 border bg-white rounded"
              required
            >
              <option value="">Seleccione...</option>
              <option value="PEDIDO">PEDIDO</option>
              <option value="COMPRA">COMPRA</option>
            </select>
          </div>

          {/* Campo: Medio de Pago */}
          <div>
            <label className="block text-sm font-medium">Medio de Pago:</label>
            <select
              value={MedioDePago}
              onChange={(e) => setMedioDePago(e.target.value)}
              className="w-full p-2 border bg-white rounded"
              required
            >
              <option value="">Seleccione...</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TARJETA">TARJETA</option>
              <option value="QR">QR</option>
            </select>
          </div>

          {/* Campo: Comprador */}
          <div>
            <label className="block text-sm font-medium">Comprador:</label>
            <input
              type="text"
              value={Comprador}
              onChange={(e) => setComprador(e.target.value)}
              placeholder="Nombre del comprador"
              className="w-full p-2 border bg-white rounded"
              required
            />
          </div>

          {/* Campo: Pagado */}
          <div>
            <label className="block text-sm font-medium">Pagado:</label>
            <div className="flex items-center space-x-4">
              <label>
                <input
                  type="checkbox"
                  checked={Pagado.pagadoFull}
                  onChange={(e) => setPagado({ ...Pagado, pagadoFull: e.target.checked })}
                />
                Pagado Full
              </label>
              {!Pagado.pagadoFull && (
                <input
                  type="text"
                  value={Pagado.adelanto}
                  onChange={(e) => setPagado({ ...Pagado, adelanto: e.target.value })}
                  placeholder="% de adelanto"
                  className="p-2 border rounded bg-white"
                />
              )}
            </div>
          </div>

          {/* Campo: Categoría */}
          <div>
            <label className="block text-sm font-medium">Categoría:</label>
            <select
              value={Categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border bg-white rounded"
              required
            >
              <option value="">Seleccione...</option>
              <option value="COCINA">COCINA</option>
              <option value="CAFE">CAFE</option>
              <option value="MESAS">MESAS</option>
              <option value="JARDINERIA">JARDINERIA</option>
              <option value="TIENDA">TIENDA</option>
            </select>
          </div>

          {/* Campo: Proveedor */}
          <div>
            <label className="block text-sm font-medium">Proveedor:</label>
            <select
              value={Proveedor_Id}
              onChange={(e) => setProveedorId(e.target.value)}
              className="w-full p-2 border bg-white rounded"
              required
            >
              <option value="">Seleccione un proveedor...</option>
              {Proveedores.map((proveedor) => (
                <option key={proveedor._id} value={proveedor._id}>
                  {proveedor.Nombre_Proveedor}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSubmit}
        >
          Registrar Gasto
        </button>
      </form>
    </div>
  );
}

export default Gastos;