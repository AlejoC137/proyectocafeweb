import React, { useState } from "react";
import TittleComp from "../tittleComp/TittleComp";

function ManageStaff(props) {
  const [code, setCode] = useState(""); // Estado para almacenar el código
  const [isAuthorized, setIsAuthorized] = useState(false); // Estado para verificar si el código es correcto

  // Código esperado
  const expectedCode = "1034869114"; // Cambia esto por el código que quieras

  // Función para manejar el cambio de código
  const handleCodeChange = (e) => {
    const inputCode = e.target.value;
    setCode(inputCode);

    // Verificar si el código es de 10 dígitos y coincide con el esperado
    if (inputCode.length === 10 && inputCode === expectedCode) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  };

  return (
    <div className="bg-ladrillo overflow-hidden rounded-2xl border-8 border-black h-custom-height225 relative">
      <TittleComp tittle="ADMINISTRACIÓN" />

      {/* Input para ingresar el código */}
      <div className="p-4">
        <input
          type="password" // Cambiado a tipo "password" para ocultar el código
          value={code}
          onChange={handleCodeChange}
          maxLength="10"
          placeholder="Ingresa el código de acceso"
          className="border rounded px-4 py-2"
        />
      </div>

      {/* Mostrar el contenido solo si el código es correcto */}
      {isAuthorized ? (
        <div className="p-4">
          {/* Aquí va el contenido que quieres mostrar */}
          
          {/* Botón para redirigir a la URL */}
          <a
            href="https://proyecto-cafe-sigma.vercel.app/CalculatorMenuPrice"
            target="_blank" // Abre el enlace en una nueva pestaña
            rel="noopener noreferrer" // Por seguridad
            className="mt-4 inline-block bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
          >
            Ir a Calculator Menu Price
          </a>
        </div>
      ) : (
        <div className="p-4 text-red-500">Introduce el código correcto para acceder.</div>
      )}
    </div>
  );
}

export default ManageStaff;
