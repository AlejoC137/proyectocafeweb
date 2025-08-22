import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUserRegState } from "../../../redux/actions";

function UserData() {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    paymentMethod: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User Data Submitted:", formData);
    alert("Datos enviados exitosamente.");
    dispatch(updateUserRegState("pickDiet")); // Move to the next step: PickDiet
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-4 max-w-md mx-auto bg-white rounded shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Información del Usuario</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col">
            Nombre:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-2 py-1 mt-1 bg-white"
              placeholder="Ingresa tu nombre"
              required
            />
          </label>
          <label className="flex flex-col">
            Dirección:
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-2 py-1 mt-1 bg-white"
              placeholder="Ingresa tu dirección"
              required
            />
          </label>
          <label className="flex flex-col">
            Número de Celular:
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-2 py-1 mt-1 bg-white"
              placeholder="Ingresa tu número de celular"
              required
            />
          </label>
          <label className="flex flex-col">
            Método Preferido de Pago:
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-2 py-1 mt-1 bg-white"
              required
            >
              <option value="" disabled>
                Selecciona un método de pago
              </option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
            </select>
          </label>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserData;
