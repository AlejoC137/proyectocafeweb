import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearVenta, actualizarVenta, eliminarVenta } from "../../../redux/actions-VentasCompras";
import RecetaModal from "./RecetaModal"; // Importa el nuevo componente

function Mesa({ index, ventas, reloadVentas, onPagar }) {
  const [formData, setFormData] = useState({
    Total_Ingreso: '',
    Tip: '',
    Cliente: '',
    Cajero: '',
  });

  const [orderItems, setOrderItems] = useState([]);
  const [comandaSaved, setComandaSaved] = useState(false);
  const [buttonState, setButtonState] = useState("save");
  const [isMesaInUse, setIsMesaInUse] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState(null); // Estado para la receta seleccionada
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
      setIsMesaInUse(true);
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
    updatedItems[itemIndex].Receta = selectedOption.Receta; // Añadir la receta seleccionada
    updatedItems[itemIndex].Foto = selectedOption.Foto; // Añadir la foto seleccionada
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
    if (!window.confirm("¿Está seguro de que desea guardar esta comanda?")) return;

    setComandaSaved(true);
    setButtonState("done");
    setIsMesaInUse(true);

    try {
      const existingVenta = ventas.find(venta => venta.Mesa === index && !venta.Pagado);
      if (existingVenta) {
        const updatedVenta = await dispatch(actualizarVenta(existingVenta._id, {
          ...formData,
          Productos: JSON.stringify(orderItems),
        }));
        alert("Venta actualizada correctamente");
      } else {
        const nuevaVenta = await dispatch(crearVenta({
          ...formData,
          Productos: JSON.stringify(orderItems),
          Pagado: false,
          Mesa: index,
        }));
        alert("Venta creada correctamente");
      }
      reloadVentas();
    } catch (error) {
      console.error("Error al crear/actualizar la venta:", error);
      alert("Error al crear/actualizar la venta");
    }
  };

  const handlePagar = () => {
    onPagar();
  };

  const handleEliminar = async () => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta comanda?")) return;

    try {
      const existingVenta = ventas.find(venta => venta.Mesa === index && !venta.Pagado);
      if (existingVenta) {
        await dispatch(eliminarVenta(existingVenta._id));
        setIsMesaInUse(false);
        alert("Venta eliminada correctamente");
        reloadVentas();
      }
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      alert("Error al eliminar la venta");
    }
    setFormData({
      Total_Ingreso: '',
      Tip: '',
      Cliente: '',
      Cajero: '',
    });
    setOrderItems([]);
    setComandaSaved(false);
    setButtonState("save");
  };

  const handleRecetaClick = (item) => {
    setSelectedReceta(item);
  };

  const handleCloseRecetaModal = () => {
    setSelectedReceta(null);
  };

  return (
    <div className={`bg-white shadow-md rounded-lg border p-1 grid grid-cols-4 gap-1 ${isMesaInUse ? 'bg-green-100' : ''}`} style={{ alignItems: 'start' }}>
      {/* Primera fila: Cliente y Cajero */}
      <div className="col-span-4 flex gap-1 items-center">
        <h3 className="flex-grow border rounded p-1 text-sm font-semibold">{`Mesa#${index}`}</h3>
        <div className="flex-1 flex items-center gap-1">
          <label className="text-sm font-medium">Cliente:</label>
          <Input
            type="text"
            name="Cliente"
            value={formData.Cliente}
            onChange={handleChange}
            className="w-full border rounded p-1 text-sm"
            disabled={comandaSaved}
          />
        </div>
        <div className="flex-1 flex items-center gap-1">
          <label className="text-sm font-medium">Cajero:</label>
          <Input
            type="text"
            name="Cajero"
            value={formData.Cajero}
            onChange={handleChange}
            className="w-full border rounded p-1 text-sm"
            disabled={comandaSaved}
          />
        </div>
        <div className="flex-1 flex items-center gap-1">
          <label className="text-sm font-medium">Tip:</label>
          <Input
            type="text"
            name="Tip"
            value={formData.Tip}
            onChange={handleChange}
            className="w-full border rounded p-1 text-sm"
            disabled={comandaSaved}
          />
        </div>
        <div className="flex-1 flex items-center gap-1">
          <label className="text-sm font-medium">Total$:</label>
          <Input
            type="text"
            name="Total_Ingreso"
            value={formData.Total_Ingreso}
            className="w-full border rounded p-1 text-sm"
            readOnly
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddItem} className="bg-green-500 text-white text-sm w-[30px]">
            ➕
          </Button>
          <Button
            onClick={handlePagar}
            disabled={!comandaSaved}
            className={`w-[40px] bg-green-500 text-white text-sm ${
              !comandaSaved ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            💸
          </Button>
        </div>
      </div>

      {/* Segunda fila: Ítems pedidos */}
      <div className="col-span-4">
        {orderItems.map((item, itemIndex) => (
          <div key={itemIndex} className="flex gap-1 items-center mb-1">
            <Button
              onClick={() => handleRecetaClick(item)}
              className="bg-yellow-500 text-white text-sm w-[30px]"
            >
              📕
            </Button>
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={item.NombreES}
              onChange={(e) => handleIngredientChange(itemIndex, e.target.value)}
              className="flex-grow border rounded p-1 text-sm"
            />
            {item.matches && item.matches.length > 0 && (
              <ul className="absolute bg-white border rounded shadow-lg max-h-40 overflow-y-auto z-10 w-full">
                {item.matches.map((match) => (
                  <li
                    key={match.id}
                    onClick={() => handleIngredientSelect(itemIndex, match)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
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
              className="w-16 border rounded p-1 text-sm"
            />
            <span className="text-sm">${item.Precio.toFixed(2)}</span>
           <Button
             onClick={() => handleRemoveItem(itemIndex)}
             className="bg-red-500 text-white text-sm w-[30px]"
           >
             ❌
           </Button>
          </div>
        ))}
      </div>

      {selectedReceta && (
        <RecetaModal item={selectedReceta} onClose={handleCloseRecetaModal} />
      )}
    </div>
  );
}

export default Mesa;
