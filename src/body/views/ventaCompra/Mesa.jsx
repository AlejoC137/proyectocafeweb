import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearVenta, actualizarVenta } from "../../../redux/actions-VentasCompras";

function Mesa({ index, ventas }) {
  const [formData, setFormData] = useState({
    Total_Ingreso: '',
    Tip: '',
    Cliente: '',
    Cajero: '',
  });

  const [orderItems, setOrderItems] = useState([]);
  const [comandaSaved, setComandaSaved] = useState(false);
  const [buttonState, setButtonState] = useState("save");
  const allMenu = useSelector((state) => state.allMenu || []);
  const dispatch = useDispatch();

  useEffect(() => {
    const existingVenta = ventas.find(venta => venta.Mesa === index && !venta.Pagado);
    if (existingVenta) {
      setFormData({
        Total_Ingreso: existingVenta.Total_Ingreso,
        Tip: existingVenta.Tip,
        Cliente: existingVenta.Cliente,
        Cajero: existingVenta.Cajero,
      });
      setOrderItems(JSON.parse(existingVenta.Productos));
      setComandaSaved(true);
      setButtonState("done");
    }
  }, [ventas, index]);

  useEffect(() => {
    const total = orderItems.reduce((acc, item) => acc + (item.Precio * item.quantity), 0);
    const totalWithTip = (parseFloat(total) + parseFloat(formData.Tip || 0)).toFixed(2);
    setFormData((prev) => ({ ...prev, Total_Ingreso: totalWithTip }));
  }, [orderItems, formData.Tip]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { id: '', NombreES: '', Precio: 0, quantity: 1, matches: [] }]);
  };

  const handleIngredientChange = (itemIndex, value) => {
    const updatedItems = [...orderItems];
    updatedItems[itemIndex].NombreES = value;

    // Generar coincidencias dinámicamente
    const matches = allMenu.filter((option) =>
      option.NombreES.toLowerCase().includes(value.toLowerCase())
    );
    updatedItems[itemIndex].matches = matches;

    setOrderItems(updatedItems);
  };

  const handleIngredientSelect = (itemIndex, selectedOption) => {
    const updatedItems = [...orderItems];
    updatedItems[itemIndex].id = selectedOption.id;
    updatedItems[itemIndex].NombreES = selectedOption.NombreES;
    updatedItems[itemIndex].Precio = selectedOption.Precio;
    updatedItems[itemIndex].matches = []; // Limpiar las coincidencias tras la selección
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (itemIndex) => {
    const updatedItems = orderItems.filter((_, i) => i !== itemIndex);
    setOrderItems(updatedItems);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setComandaSaved(true);
    setButtonState("done");
    console.log("Datos enviados:", formData, orderItems);

    // Enviar los datos a la tabla "Ventas" en Supabase
    try {
      await dispatch(crearVenta({
        ...formData,
        Productos: JSON.stringify(orderItems),
        Pagado: false,
        Mesa: index,
      }));
      console.log("Venta creada correctamente");
    } catch (error) {
      console.error("Error al crear la venta:", error);
    }
  };

  const handlePagar = async () => {
    // Lógica para marcar la comanda como pagada
    try {
      const existingVenta = ventas.find(venta => venta.Mesa === index && !venta.Pagado);
      if (existingVenta) {
        await dispatch(actualizarVenta(existingVenta._id, { Pagado: true }));
        console.log("Comanda pagada:", formData, orderItems);
      }
    } catch (error) {
      console.error("Error al pagar la venta:", error);
    }
  };

  const handleEliminar = () => {
    // Lógica para eliminar los datos locales de la comanda
    setFormData({
      Total_Ingreso: '',
      Tip: '',
      Cliente: '',
      Cajero: '',
    });
    setOrderItems([]);
    setComandaSaved(false);
    setButtonState("save");
    console.log("Datos locales de la comanda eliminados");
  };

  return (
    <div className="bg-white shadow-md rounded-lg flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border p-1"
         style={{ height: `calc(50vh - 80px)` }}>
      {/* Columna izquierda: formulario */}
      <div className="flex-1 p-1">
        <form onSubmit={handleSubmit} className="grid gap-1">
          <h2 className="font-bold text-sm">Mesa #{index}</h2>
          <div className="flex items-center gap-2 text-sm"> 
            <label className="flex-shrink-0">Total$:</label>
            <Input
              type="text"
              name="Total_Ingreso"
              value={formData.Total_Ingreso}
              onChange={handleChange}
              className="border rounded p-1 text-sm flex-grow"
              readOnly
            />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <label className="flex-shrink-0">Tip:</label>
            <Input
              type="text"
              name="Tip"
              value={formData.Tip}
              onChange={handleChange}
              className="border rounded p-1 text-sm flex-grow"
              disabled={comandaSaved}
            />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <label className="flex-shrink-0">Cliente:</label>
            <Input
              type="text"
              name="Cliente"
              value={formData.Cliente}
              onChange={handleChange}
              className="border rounded p-1 text-sm flex-grow"
              disabled={comandaSaved}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="flex-shrink-0">Cajero:</label>
            <Input
              type="text"
              name="Cajero"
              value={formData.Cajero}
              onChange={handleChange}
              className="border rounded p-1 text-sm flex-grow"
              disabled={comandaSaved}
            />
          </div>
          {/* Botones de acción */}
          <div className="flex gap-1 mt-2">
            <Button
              type="submit"
              className="bg-blue-500 text-white flex-1 text-sm p-1"
              disabled={comandaSaved}
            >
              {buttonState === "save" && "💾"}
              {buttonState === "syncing" && "🔄"}
              {buttonState === "done" && "✅"}
            </Button>
            <Button
              onClick={handlePagar}
              disabled={!comandaSaved || orderItems.length === 0}
              className={`bg-green-500 text-white flex-1 text-sm p-1 ${!comandaSaved || orderItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {buttonState === "save" && "🧾"}
              {buttonState === "syncing" && "🔄"}
              {buttonState === "done" && "💸"}
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={!comandaSaved || orderItems.length === 0}
              className={`bg-red-500 text-white flex-1 text-sm p-1 ${!comandaSaved || orderItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {buttonState === "save" && "🧨"}
              {buttonState === "syncing" && "💢"}
              {buttonState === "done" && "💥"}
            </Button>
          </div>
        </form>
      </div>

      {/* Columna derecha: ítems pedidos */}
      <div className="flex-1 p-2 overflow-y-auto">
        <h3 className="font-bold mb-1 text-sm">Ítems pedidos:</h3>
        {orderItems.map((item, itemIndex) => (
          <div key={itemIndex} className="mb-1 flex items-center gap-1">
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={item.NombreES}
              onChange={(e) => handleIngredientChange(itemIndex, e.target.value)}
              className="border rounded p-1 text-sm flex-grow"
              disabled={comandaSaved}
            />
            {/* Lista de coincidencias dinámicas */}
            {item.matches && item.matches.length > 0 && (
              <ul className="border rounded bg-white max-h-40 overflow-y-auto shadow-lg mt-1 text-sm">
                {item.matches.map((match) => (
                  <li
                    key={match.id}
                    onClick={() => handleIngredientSelect(itemIndex, match)}
                    className="p-1 hover:bg-gray-200 cursor-pointer"
                  >
                    {match.NombreES}
                  </li>
                ))}
              </ul>
            )}
            <Input
              type="number"
              placeholder="Cantidad"
              value={item.quantity}
              onChange={(e) =>
                setOrderItems((prev) =>
                  prev.map((it, i) =>
                    i === itemIndex ? { ...it, quantity: e.target.value } : it
                  )
                )
              }
              className="border rounded p-1 text-sm w-16"
              disabled={comandaSaved}
            />
            <span className="text-sm">${item.Precio}</span>
            <Button
              onClick={() => handleRemoveItem(itemIndex)}
              className="bg-red-500 text-white text-sm p-1"
              disabled={comandaSaved}
            >
              X
            </Button>
          </div>
        ))}
        <Button onClick={handleAddItem} className="mt-2 bg-green-500 text-white text-sm p-1" disabled={comandaSaved}>
          Añadir Ítem
        </Button>
      </div>
    </div>
  );
}

export default Mesa;
