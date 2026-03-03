import { useEffect, useState } from 'react';
import { CardGrid } from '@/components/ui/cardGrid';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { MENU, ITEMS, ESP, CATEGORIES_t, ENG } from '../../../redux/actions-types';

function MenuView() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

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
      <div className="flex justify-center items-center min-h-screen w-full bg-white rounded-none">
        <span className="text-xl font-bold uppercase tracking-widest text-black rounded-none">
          Cargando Menú...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-cream-bg bg-[url('/bg-pattern.jpg')] bg-repeat text-black pt-5 px-2 md:px-6 lg:px-8 rounded-none font-sans">

      <div className="w-full border-b-[4px] border-black mb-6 pb-2 rounded-none bg-white/80 p-4 border-[3px]">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black rounded-none">
          {currentLeng === ESP ? 'Nuestro Menú' : 'Our Menu'}
        </h1>
        <p className="text-lg md:text-xl font-medium text-black rounded-none">
          {currentLeng === ESP ? 'Todo es fresco y hecho con amor' : 'Everything is fresh and made with love'}
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-none">
        {uniqueCategories.map((category) => (
          <div
            key={category}
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
    </div>
  );
}

export default MenuView;
