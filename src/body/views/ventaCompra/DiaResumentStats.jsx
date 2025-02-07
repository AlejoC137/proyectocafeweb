import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

function DiaResumentStats({ ventasRecepies }) {
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const [infoPorProducto, setInfoPorProducto] = useState([]);

  useEffect(() => {
    const calculateCosts = () => {
      const info = ventasRecepies.map((element) => {
        const recetaObj = allRecetasMenu.find((receta) => receta._id === element.recetaId);

        if (recetaObj && recetaObj.costo) {
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

  const totalCostoDirecto = infoPorProducto.reduce((acc, producto) => acc + (producto.costoDirecto || 0), 0);
console.log(ventasRecepies);
console.log(allRecetasMenu);

  return (
    <div className="">
      <p>Total Costos Directo: {totalCostoDirecto}</p>
      {/* <p>Total Costos Directo: {infoPorProducto}</p> */}
      {/* Render additional details if needed */}
    </div>
  );
}

export default DiaResumentStats;