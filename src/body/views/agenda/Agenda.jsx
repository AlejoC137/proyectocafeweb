import { useSelector } from "react-redux";
import { CardGridAgenda } from "@/components/ui/cardGridAgenda";

function Agenda() {
  const agendaMes = useSelector((state) => state.agendaMes);

  // Convertir los datos de agendaMes en un array para pasarlos a CardGridAgenda
  const products = Object.values(agendaMes).map((evento) => ({
    ...evento,
  }));

  return (
    <div className="flex flex-col w-screen border ">
      {/* Título centrado */}
      <div className="flex justify-center items-center py-4 bg-gray-100">
        <h1 className="text-2xl font-bold">AGENDA DEL MES</h1>
      </div>

      {/* Contenedor de las tarjetas */}
      <div className="w-full">
        <CardGridAgenda products={products} category="Eventos" />
      </div>
    </div>
  );
}

export default Agenda;
