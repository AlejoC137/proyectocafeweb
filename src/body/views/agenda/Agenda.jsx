import { useSelector } from "react-redux";
import { CardGridAgenda } from "@/components/ui/cardGridAgenda";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Calendar, CalendarDays } from "lucide-react";

function Agenda() {
  const agendaMes = useSelector((state) => state.agendaMes);

  // Convertir los datos de agendaMes en un array para pasarlos a CardGridAgenda
  const products = Object.values(agendaMes || {}).map((evento) => ({
    ...evento,
  }));

  const totalEventos = products.length;
  const eventosHoy = products.filter(evento => {
    const hoy = new Date().toISOString().split('T')[0];
    return evento.fecha === hoy;
  }).length;

  return (
    <PageLayout title="Agenda del Mes">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Eventos</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{totalEventos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Eventos Hoy</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{eventosHoy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor de las tarjetas */}
      <ContentCard title="Eventos Programados" noPadding>
        <div className="p-4">
          {totalEventos > 0 ? (
            <CardGridAgenda products={products} category="Eventos" />
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay eventos programados</p>
              <p className="text-sm">Los eventos aparecerán aquí cuando se agreguen a la agenda</p>
            </div>
          )}
        </div>
      </ContentCard>
    </PageLayout>
  );
}

export default Agenda;
