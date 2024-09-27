import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardGrid } from '@/components/ui/cardGrid';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { STAFF, MENU, ITEMS } from '../../../redux/actions-types';

function MenuView() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const menuData = useSelector((state) => state.allMenu);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(STAFF)),
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

  // Obtener valores únicos de la propiedad 'TipoEN'
  const uniqueCategories = Array.from(new Set(menuData.map(item => item.TipoEN)));

  // Función para obtener el texto de la categoría en español
  const getCategoryTitle = (tipoEN) => {
    switch (tipoEN) {
      case 'Coffee':
        return 'Café Frío y Caliente';
      case 'Breackfast':
        return 'Desayuno Salado y Dulce';
      case 'Lunch':
        return 'Almuerzo y Para la Tarde';
      case 'Others':
        return tipoEN;
      default:
        return tipoEN; // Fallback por si no encuentra coincidencia
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden"> {/* Añadir overflow-hidden aquí */}
      {uniqueCategories.map((category) => (
        <div key={category} className="overflow-hidden"> {/* Asegurar que cada grid tenga overflow-hidden */}
          <CardGrid
            filterKey={category}
            products={menuData}
            category={getCategoryTitle(category)}
            isEnglish={true}
          />
        </div>
      ))}
    </div>
  );
}

export default MenuView;
