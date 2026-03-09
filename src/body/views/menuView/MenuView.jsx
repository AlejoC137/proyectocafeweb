import { useEffect, useState } from 'react';
import { CardGrid } from '@/components/ui/cardGrid';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { MENU, ITEMS, ESP, CATEGORIES_t, ENG } from '../../../redux/actions-types';
import SobreNosotros from '../sobreNosotros/SobreNosotros';

function MenuView() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');

  const rawMenuData = useSelector((state) => state.allMenu);
  const menuData = rawMenuData.filter(item => item.SUB_GRUPO !== "TARDEO_ALMUERZO");
  const currentLeng = useSelector((state) => state.currentLeng);

  console.log("Elementos del menú a mostrar:", menuData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  // Importar CATEGORIES desde actions-types (necesitas agregarlo arriba)
  // O ordenarlo manualmente
  const uniqueCategories = Array.from(new Set(menuData.map(item => item.GRUPO)))
    .sort((a, b) => {
      // Define el orden deseado basado en actions-types
      const order = [
        "CAFE",
        "REPOSTERIA",
        "PANADERIA",
        "DESAYUNO",
        "BEBIDAS",
        "TARDEO",
        "ADICIONES",
        "CARNICO",
        "LACTEO",
        "VERDURAS_FRUTAS",
        "CONDIMENTOS_ESPECIAS_ADITIVOS",
        "GRANOS_CEREALES",
        "LIMPIEZA",
        "DOTACION",
        "CONCERVAS_FERMENTOS_PRECOCIDOS",
        "GUARNICION",
        "DESECHABLES",
        "ENLATADOS",
        "GRANOS",
        "HARINAS"
      ];
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      // Si alguno no está en el arreglo, lo manda al final
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

  const getCategoryTitle = (elGrupo, getIcon) => {
    const grupo = CATEGORIES_t[elGrupo];
    if (currentLeng === ESP && grupo) {
      return grupo.es;
    }
    if (currentLeng === ENG && grupo) {
      return grupo.en;
    }
    return elGrupo;
  };

  const getCategoryIcon = (elGrupo, getIcon) => {
    const grupo = CATEGORIES_t[elGrupo];
    if (getIcon === "icon" && grupo) {
      return grupo.icon;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full  rounded-none">
        <span className="text-xl font-bold uppercase tracking-widest text-black rounded-none">
          Cargando Menú...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen text-black pt-5 px-2 md:px-6 lg:px-8 rounded-none font-sans">

      <div className="w-full flex flex-row gap-0 mb-6 border-[3px] border-black bg-white rounded-none overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-wrap md:flex-nowrap">
        {/* NUESTRO Menú Tab */}
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 p-2 md:p-4 flex flex-col items-center justify-center text-center transition-colors border-r-[3px] border-black ${activeTab === 'menu' ? 'bg-black text-white hover:bg-black/90' : 'bg-transparent text-black hover:bg-black/10'
            }`}
        >
          <h1 className="text-lg sm:text-xl md:text-4xl font-black uppercase tracking-tighter m-0 rounded-none leading-none md:leading-tight">
            {currentLeng === ESP ? 'Menú' : 'Menu'}
          </h1>
        </button>

        {/* SOBRE NOSOTROS Tab */}
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 p-2 md:p-4 flex flex-col items-center justify-center text-center transition-colors border-r-[3px] border-black ${activeTab === 'about' ? 'bg-black text-white hover:bg-black/90' : 'bg-transparent text-black hover:bg-black/10'
            }`}
        >
          <h1 className="text-lg sm:text-xl md:text-4xl font-black uppercase tracking-tighter m-0 rounded-none leading-none md:leading-tight">
            {currentLeng === ESP ? 'Sobre Nosotros' : 'About Us'}
          </h1>
        </button>

        {/* AGENDA Tab */}
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 p-2 md:p-4 flex flex-col items-center justify-center text-center transition-colors ${activeTab === 'agenda' ? 'bg-black text-white hover:bg-black/90' : 'bg-transparent text-black hover:bg-black/10'
            }`}
        >
          <h1 className="text-lg sm:text-xl md:text-4xl font-black uppercase tracking-tighter m-0 rounded-none leading-none md:leading-tight">
            {currentLeng === ESP ? 'Agenda' : 'Agenda'}
          </h1>
        </button>
      </div>

      {/* Horario de Atención (SIEMPRE VISIBLE) */}
      <section className="w-full bg-yellow-100 border-[3px] border-black p-2 md:p-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 flex justify-center items-center text-center">
        <p className="text-sm md:text-base font-medium text-black m-0 uppercase flex flex-col sm:flex-row gap-1 sm:gap-2">
          <strong className="font-black">Horario:</strong>
          <span>L-V: 8am-7pm</span>
          <span className="hidden sm:inline">|</span>
          <span>Sáb: 8am-6pm</span>
          <span className="hidden sm:inline">|</span>
          <span>Dom/Fest: Cerrado</span>
        </p>
      </section>

      {/* Más sobre el menú (SÓLO SI activeTab === 'menu') */}
      {activeTab === 'menu' && (
        <section className="w-full flex flex-row bg-cream-bg border-[3px] border-black p-2 md:p-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 items-center gap-2 md:gap-4 overflow-hidden">
          {/* Título a la izquierda */}
          <div className="flex flex-col justify-center items-center px-2 md:px-4 border-r-[2px] border-black min-w-[80px] md:min-w-[120px]">
            <h2 className="text-sm md:text-lg lg:text-xl font-black uppercase tracking-tight text-black m-0 leading-tight text-center">
              SOBRE<br />EL MENÚ.
            </h2>
          </div>

          {/* Texto y horario a la derecha */}
          <div className="flex flex-col flex-1 gap-1 text-center md:text-left py-1">
            <p className="text-xs md:text-sm lg:text-base font-medium text-black m-0 leading-tight">
              En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados.
            </p>

          </div>
        </section>
      )}

      {/* Categorías de menú puestas inmediatamente debajo y antes de los platos */}
      {activeTab === 'menu' && (
        <div className="relative z-10 w-full mb-4 flex flex-wrap gap-2 justify-start items-center">
          {uniqueCategories.map((category) => (
            <button
              key={category}
              onClick={() => {
                const element = document.getElementById(`category-${category}`);
                const container = document.getElementById('menu-scroll-container');
                if (element) {
                  const yOffset = -20;
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 md:px-4 md:py-2 flex-none border-[3px] border-black bg-cream-bg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
            >
              <h2 className="font-black text-sm md:text-lg uppercase tracking-tight m-0 rounded-none">
                {getCategoryTitle(category)}
              </h2>
            </button>
          ))}
        </div>
      )}

      {/* Main content grid */}
      {activeTab === 'menu' && (
        <div id="menu-scroll-container" className="flex flex-col gap-2 rounded-none">
          {uniqueCategories.map((category) => (
            <div
              key={category}
              id={`category-${category}`} // Add ID for scrolling
              className="w-full flex flex-col rounded-none"
            >
              <div className="w-full rounded-none">
                <CardGrid
                  filterKey={category}
                  products={menuData}
                  TITTLE={getCategoryTitle(category)}
                  ICON={getCategoryIcon(category, "icon")}
                  isEnglish={currentLeng}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="w-full rounded-none mt-2">
          <SobreNosotros />
        </div>
      )}

      {activeTab === 'agenda' && (
        <div className="w-full rounded-none mt-2">
          {/* AGENDA */}
          <section className="flex flex-col gap-4 border-[3px] border-black p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-pink-100">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black border-b-[3px] border-black pb-2 inline-block self-start">
              Este Mes en Proyecto Café
            </h2>
            <p className="text-lg font-medium text-black leading-relaxed">
              Con la misión de disponer este espacio para aquellos que lo puedan usar como material y mediador. Todos los meses haremos intercambio de idiomas, talleres, eventos de música, arte y cultura, y todo lo que se nos ocurra, a ustedes y a nosotros.
            </p>

            <div className="mt-4">
              <h3 className="text-xl font-black uppercase tracking-tight bg-black text-white p-2 inline-block mb-4 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] border-[3px] border-black">
                AGENDA
              </h3>
              <ul className="flex flex-col gap-4">
                <li className="border-[3px] border-black bg-white p-4 space-y-2 hover:bg-black hover:text-white transition-colors cursor-pointer">
                  <p className="font-black uppercase text-xl">Hummingbird Watercolor Workshop</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between font-medium text-lg">
                    <span>2025-11-01</span>
                    <span>Hora: 09:00 - 13:00</span>
                  </div>
                </li>
                <li className="border-[3px] border-black bg-white p-4 space-y-2 hover:bg-black hover:text-white transition-colors cursor-pointer">
                  <p className="font-black uppercase text-xl">Hummingbird Watercolor Workshop</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between font-medium text-lg">
                    <span>2025-11-02</span>
                    <span>Hora: 09:00 - 13:00</span>
                  </div>
                </li>
                <li className="border-[3px] border-black bg-white p-4 space-y-2 hover:bg-black hover:text-white transition-colors cursor-pointer">
                  <p className="font-black uppercase text-xl">Two shores - Mistic river</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between font-medium text-lg">
                    <span>2025-11-20</span>
                    <span>Hora: 18:00 - 20:00</span>
                  </div>
                </li>
                <li className="border-[3px] border-black bg-white p-4 space-y-2 hover:bg-black hover:text-white transition-colors cursor-pointer">
                  <p className="font-black uppercase text-xl">Two shores - Mistic river</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between font-medium text-lg">
                    <span>2025-11-28</span>
                    <span>Hora: 19:00 - 10:00</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default MenuView;
