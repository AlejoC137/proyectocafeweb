// Home.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable, preProcess, procesarRecetaYEnviarASupabase } from '../../../redux/actions';
import { STAFF, MENU, ITEMS, PRODUCCION } from '../../../redux/actions-types';

function Home() {
  const dispatch = useDispatch();
  const [recetaJsonText, setRecetaJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const preProcessedData = useSelector(state => state.preProcess);

  const handleInputChange = (e) => {
    setRecetaJsonText(e.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
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

  const handlePreProcessAndSend = () => {
    try {
      if (!recetaJsonText.trim()) {
        throw new Error('El campo de texto está vacío. Por favor, ingresa un JSON válido.');
      }
      const recetaJson = JSON.parse(recetaJsonText);
      dispatch(preProcess(recetaJson));
    } catch (error) {
      console.error('Error al parsear el JSON de la receta:', error);
      alert('Error al parsear el JSON de la receta. Por favor, asegúrate de que el JSON es válido y está bien formateado.');
    }
  };

  const handleEnviarTodasLasRecetas = () => {
    if (preProcessedData && Array.isArray(preProcessedData)) {
      // preProcessedData.forEach(receta => {
        dispatch(procesarRecetaYEnviarASupabase());
      // });
    }
  };

  return (
    <div className='bg-white'>
      <h1 className='bg-white'>Pre-Process and Send</h1>
      <textarea
        className='bg-white'
        value={recetaJsonText}
        onChange={handleInputChange}
        rows={10}
        cols={50}
      />

      <br />
      <button
        className='bg-white'
        onClick={handlePreProcessAndSend}
      >
        Procesar y Enviar Receta
      </button>
      <br />
      <button
        className='bg-white'
        onClick={handleEnviarTodasLasRecetas}
      >
        Enviar Todas las Recetas Preprocesadas
      </button>
    </div>
  );
}

export default Home;
