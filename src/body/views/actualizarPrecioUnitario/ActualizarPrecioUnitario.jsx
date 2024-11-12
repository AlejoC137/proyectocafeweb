// ActualizarPrecioUnitario.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable, actualizarPrecioUnitario } from '../../../redux/actions';
import { ITEMS, PRODUCCION } from '../../../redux/actions-types';

function ActualizarPrecioUnitario() {
  const dispatch = useDispatch();
  const allItems = useSelector(state => state.allItems);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleActualizarPrecios = () => {
    dispatch(actualizarPrecioUnitario(allItems));
  };

  return (
    <div className='bg-white'>
      <h1 className='bg-white'>Actualizar Precio Unitario</h1>
      <button
        className='bg-white'
        onClick={handleActualizarPrecios}
      >
        Actualizar Precios Unitarios
      </button>
    </div>
  );
}

export default ActualizarPrecioUnitario;
