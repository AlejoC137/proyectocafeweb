import { useSelector } from "react-redux";
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
      {/* Título centrado */}
      <div className="flex justify-center items-center py-4 bg-gray-100">
        <h1 className="text-2xl font-bold">ESPECIALES</h1>
      </div>

      {/* Contenedor de las tarjetas */}
      <div className="w-full">
        <CardGridHome products={products} category="Especiales" />
      </div>
    </div>
  );
}

export default LandingHome;
