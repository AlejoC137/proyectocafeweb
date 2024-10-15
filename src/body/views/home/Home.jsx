// Home.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getAllFromTable, procesarRecetaYEnviarASupabase } from '../../../redux/actions';
import { STAFF, MENU, ITEMS, PRODUCCION} from '../../../redux/actions-types';

function Home() {
  const dispatch = useDispatch();
  const [recetaJsonText, setRecetaJsonText] = useState('');
  const [loading, setLoading] = useState(true);

  const handleInputChange = (e) => {
    setRecetaJsonText(e.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          // dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);



  const handleEnviarReceta = () => {
    try {
      if (!recetaJsonText.trim()) {
        throw new Error('El campo de texto está vacío. Por favor, ingresa un JSON válido.');
      }
      const recetaJson = JSON.parse(recetaJsonText);
      dispatch(procesarRecetaYEnviarASupabase(recetaJson));
    } catch (error) {
      console.error('Error al parsear el JSON de la receta:', error);
      alert('Error al parsear el JSON de la receta. Por favor, asegúrate de que el JSON es válido y está bien formateado.');
    }
  };

  return (
    <div className='bg-white'>
      <h1 className='bg-white'>Home</h1>
      <textarea
        className='bg-white'
        value={recetaJsonText}
        onChange={handleInputChange}
        placeholder='{
  "receta": {
    "nombre": "Cappuccino",
    // ... resto del JSON
  }
}'
        rows={10}
        cols={50}
      />

      <br />
      <button
        className='bg-white'
        onClick={handleEnviarReceta}
      >
        Enviar Receta a Supabase
      </button>
    </div>
  );
}

export default Home;