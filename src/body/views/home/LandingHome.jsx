import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CardGridHome } from "@/components/ui/cardGridHome";

function LandingHome() {
  const frontPage = useSelector((state) => state.frontPage);

  // Procesar los datos de frontPage en un array de productos
  const products = [
    {
      nombre: "Especial Desayuno",
      ...frontPage.todaysEspecialBreackFast,
    },
    {
      nombre: "Especial Almuerzo",
      ...frontPage.todaysEspecialLunch,
    },
    ...Object.values(frontPage.monthEspecials).map((especial, index) => ({
      nombre: `Especial ${index + 1}`,
      ...especial,
    })),
  ];

  return (
    <div className="flex flex-col w-screen border ">
      <div className="flex justify-center items-center ">
      </div>
      <div className="overflow-hidden w-screen ">
        {/* Pasa los productos a CardGridHome */}
        <CardGridHome products={products} category="Especialidades del Mes" />
      </div>
    </div>
  );
}

export default LandingHome;
