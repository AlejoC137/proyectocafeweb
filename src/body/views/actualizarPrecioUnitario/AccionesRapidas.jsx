import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles } from '../../../redux/actions';
import { ITEMS, PRODUCCION } from '../../../redux/actions-types';

function AccionesRapidas() {
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems);

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

  const handleCopiarPendientesCompra = () => {
    dispatch(copiarAlPortapapeles(allItems, "PC")); // PC: Pendiente Compra
  };

  const handleCopiarPendientesProduccion = () => {
    dispatch(copiarAlPortapapeles(allItems, "PP")); // PP: Pendiente Producción
  };

  return (
    <div className="bg-white p-4">
      <h2 className="text-lg font-bold">ACCIONES RÁPIDAS</h2>

      {/* Botón para actualizar precios */}
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded-md mt-2 hover:bg-blue-600"
        onClick={handleActualizarPrecios}
      >
        Actualizar Precios Unitarios
      </button>

      <h3 className="text-lg font-bold mt-4">EXPORTAR LISTAS:</h3>

      {/* Botón para copiar pendientes de compra */}
      <button
        className="bg-green-500 text-white py-2 px-4 rounded-md mt-2 hover:bg-green-600"
        onClick={handleCopiarPendientesCompra}
      >
        PENDIENTES COMPRA
      </button>

      {/* Botón para copiar pendientes de producción */}
      <button
        className="bg-yellow-500 text-white py-2 px-4 rounded-md mt-2 hover:bg-yellow-600"
        onClick={handleCopiarPendientesProduccion}
      >
        PENDIENTES PRODUCCIÓN
      </button>
    </div>
  );
}

export default AccionesRapidas;
