import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { ITEMS, PRODUCCION } from '../../../redux/actions-types';

function BuscarPreciosInternet() {
  const dispatch = useDispatch();
  const allItems = useSelector(state => state.allItems);
  const [itemsConCostoNaN, setItemsConCostoNaN] = useState([]);

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

  useEffect(() => {
    // Filtra los items cuyo COSTO es NaN y selecciona solo los campos requeridos
    const itemsNaN = allItems
      .filter(item => isNaN(parseFloat(item.COSTO)))
      .map(item => ({
        _id: item._id,
        Nombre_del_producto: item.Nombre_del_producto,
        Proveedor: item.Proveedor,
        CANTIDAD: item.CANTIDAD,
        UNIDADES: item.UNIDADES,
        COSTO: item.COSTO,
        COOR: item.COOR
      }));
    setItemsConCostoNaN(itemsNaN);
  }, [allItems]);

  // Función para dividir los items en grupos de 10
  const dividirEnGrupos = (array, tamaño) => {
    const grupos = [];
    for (let i = 0; i < array.length; i += tamaño) {
      grupos.push(array.slice(i, i + tamaño));
    }
    return grupos;
  };

  // Divide los items en grupos de 10
  const gruposDeItems = dividirEnGrupos(itemsConCostoNaN, 5);

  // Función para copiar un grupo de items al portapapeles
  const handleCopyGroupToClipboard = (grupo) => {
    const jsonText = JSON.stringify(grupo, null, 2);
    navigator.clipboard.writeText(jsonText)
      .then(() => {
        alert('Grupo copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  };

  return (
    <div className='bg-white p-6'>
      <h1 className='text-2xl font-bold mb-4'>Items con COSTO "NaN"</h1>

      {itemsConCostoNaN.length > 0 ? (
        <div>
          <h2 className='text-lg font-semibold mb-4'>Items en formato JSON (en grupos de 5):</h2>

          {/* Grid container for groups of 10 items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gruposDeItems.map((grupo, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-md">
                <pre className="text-sm">
                <button
                  className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-2'
                  onClick={() => handleCopyGroupToClipboard(grupo)}
                >
                  Copiar Grupo al Portapapeles
                </button>
                <br></br>
                  {JSON.stringify(grupo, null, 2)}
                </pre>

              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className='text-gray-600'>No se encontraron items con COSTO "NaN".</p>
      )}

      <br></br>
      <br></br>
      <br></br>
    </div>
  );
}

export default BuscarPreciosInternet;
