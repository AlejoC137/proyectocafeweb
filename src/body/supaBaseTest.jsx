import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardGrid } from '@/components/ui/cardGrid';
import { useDispatch, useSelector } from 'react-redux';
import { fixUrl, getAllFromTable } from '../redux/actions';

import {
  STAFF,
  MENU,
  ITEMS,
} from '../redux/actions-types';

function SupaBaseTest() {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4"> {/* Adjust the gap between grids */}
      <CardGrid products={menuData} category={'Café Frío y Caliente'} isEnglish={true} />
      <CardGrid products={menuData} category={'Desayuno Salado y Dulce'} isEnglish={true} />
      <CardGrid products={menuData} category={'Almuerzo y Para la tarde'} isEnglish={true} />
      <CardGrid products={menuData} category={'Otros'} isEnglish={true} />
    </div>
  );
}

export default SupaBaseTest;
