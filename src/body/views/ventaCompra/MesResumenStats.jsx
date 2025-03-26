import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const MesResumen = ({
  ventasRecepies,
  totalIngreso,
  totalTip,
  totalProductosVendidos,
  totalTarjeta,
  totalEfectivo,
  totalTransferencia,
  totalCompras
}) => {

  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const [infoPorProducto, setInfoPorProducto] = useState([]);


  
  useEffect(() => {
    const calculateCosts = () => {
      const info = ventasRecepies.map((element) => {
        const recetaObj = allRecetasMenu.find((receta) => receta._id === element.recetaId);

        if (recetaObj && recetaObj.costo) {
          console.log(recetaObj.costo);
          
          const data = JSON.parse(recetaObj.costo);
          return { ...element, costoDirecto: data.vCMP * element.cantidad };
        }

        return element;
      });
      setInfoPorProducto(info);
    };

    try {
      calculateCosts();
    } catch (error) {
      console.error("Error in DiaResumentStats useEffect:", error);
    }
  }, [ventasRecepies, allRecetasMenu]);

  // console.log(infoPorProducto);
  const totalCostoDirecto = infoPorProducto.reduce((acc, producto) => acc + (producto.costoDirecto || 0), 0);

  const formatNumber = (number) => {
    return number.toLocaleString('es-ES');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6 flex justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Resumen del Día
        </h2>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Ingreso del Día (Pagado): </span>
          <span className="text-green-600 font-bold">{formatNumber(totalIngreso)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Tip del Día (Pagado): </span>
          <span className="text-blue-600 font-bold">{formatNumber(totalTip)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Productos Vendidos: </span>
          <span className="text-purple-600 font-bold">{formatNumber(totalProductosVendidos)}</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Pagado con Tarjeta: </span>
          <span className="text-yellow-600 font-bold">{formatNumber(totalTarjeta - (totalTarjeta * 0.03))}$</span>
          <span className="text-yellow-600 font-bold"> {'(-3% RDB)'}</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Pagado en Efectivo: </span>
          <span className="text-yellow-600 font-bold">{formatNumber(totalEfectivo)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Pagado por Transferencia: </span>
          <span className="text-yellow-600 font-bold">{formatNumber(totalTransferencia)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Costo directo: </span>
          <span className="text-red-600 font-bold">{formatNumber(totalCostoDirecto)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Ipo Consumo: </span>
          <span className="text-red-600 font-bold">{formatNumber(totalIngreso * 0.08)}$</span>
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-medium">Total Compras: </span>
          <span className="text-red-600 font-bold">{formatNumber(totalCompras)}$</span>
        </p>
      </div>
    </div>
  );
};

export default MesResumen;

