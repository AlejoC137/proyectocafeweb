import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../redux/actions';
import { CardGrid } from '@/components/ui/cardGrid';
import {
  STAFF,
  MENU,
  ITEMS,
} from '../redux/actions-types';

function SupaBaseTest() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const menuData = useSelector((state) => state.allMenu);
  const staffData = useSelector((state) => state.allStaff); // Mantienes los datos de Staff por si los necesitas
  const itemsData = useSelector((state) => state.allItems); // Mantienes los datos de Items por si los necesitas

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

  if (loading) {
    return <div>Loading...</div>;
  }

  // Filtrar los datos por categoría en el componente
  const cafeFrioCaliente = menuData.filter(item => item.TipoES === 'Café');
  const desayuno = menuData.filter(item => item.TipoES === 'Desayuno');
  const almuerzo = menuData.filter(item => item.TipoES === 'Almuerzo');
  const postres = menuData.filter(item => item.TipoES === 'Postres');

  return (
    <div className="flex flex-col gap-4">
      <CardGrid products={cafeFrioCaliente} category={'Café Frío y Caliente'} isEnglish={true} />
      <CardGrid products={desayuno} category={'Desayuno Salado y Dulce'} isEnglish={true} />
      <CardGrid products={almuerzo} category={'Almuerzo y Para la tarde'} isEnglish={true} />
      <CardGrid products={postres} category={'Postres'} isEnglish={true} />
    </div>
  );
}

export default SupaBaseTest;
