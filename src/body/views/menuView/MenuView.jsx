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
          // dispatch(getAllFromTable(STAFF)),
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

  const uniqueCategories = Array.from(new Set(menuData.map(item => item.TipoEN)));

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
        return tipoEN;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col w-screen border pt-3"> {/* Ajuste aquí */}
<div className="flex justify-center items-center ">
  {/* <h1 class="text-4xl font-bold">MENU</h1> */}
</div>
      {uniqueCategories.map((category) => (
        <div key={category} className="overflow-hidden w-screen px-5 "> {/* Aseguramos que cada grid tenga overflow horizontal controlado */}
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
