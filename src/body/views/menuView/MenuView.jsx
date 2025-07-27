import { useEffect, useState } from 'react';
import { CardGrid } from '@/components/ui/cardGrid'; // Asegúrate que la ruta sea correcta
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { MENU, ITEMS, ESP, CATEGORIES_t, ENG } from '../../../redux/actions-types';

function MenuView() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const menuData = useSelector((state) => state.allMenu);
  const currentLeng = useSelector((state) => state.currentLeng);

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

  // Se obtienen las categorías únicas basadas en el GRUPO del producto.
  const uniqueCategories = Array.from(new Set(menuData.map(item => item.GRUPO)));

  /**
   * Busca la traducción de un grupo de categoría en el objeto CATEGORIES_t.
   * @param {string} elGrupo - La clave de la categoría (ej. "CAFE").
   * @returns {{ES: string, EN: string}} Un objeto con la traducción en español e inglés.
   */
  const getCategoryTitle = (elGrupo, getIcon) => {
    const grupo = CATEGORIES_t[elGrupo];
    
    // Si se encuentra una traducción, se devuelve en el formato que espera CardGrid.
    if (currentLeng === ESP   && grupo  ) {
      return    grupo.es

    
    }
    if (currentLeng === ENG && grupo ) {
     
      return    grupo.en

  
    }

    
    // Si no se encuentra, se devuelve el nombre del grupo como fallback.
  };
  const getCategoryIcon = (elGrupo, getIcon) => {
    const grupo = CATEGORIES_t[elGrupo];
    
    // Si se encuentra una traducción, se devuelve en el formato que espera CardGrid.

    if (getIcon === "icon" && grupo ) {
     
      return    grupo.icon

  
    }
    
    // Si no se encuentra, se devuelve el nombre del grupo como fallback.
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col w-screen border pt-20">
      <div className="flex justify-center items-center">
        {/* Título principal del menú si es necesario */}
      </div>
      {uniqueCategories.map((category) => (
        <div key={category} className="overflow-hidden w-screen px-3 mb-3">
          <CardGrid
            // La clave para filtrar ahora es el GRUPO
            filterKey={category} 
            products={menuData}
            // El título ahora viene de la función de traducción
            TITTLE={getCategoryTitle(category)}
            ICON={getCategoryIcon(category,"icon")}
            isEnglish={ currentLeng }
          />
        </div>
      ))}
    </div>
  );
}

export default MenuView;
