import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { procesarRecetaYEnviarASupabase } from '../../../redux/actions';

function Home() {
  const dispatch = useDispatch();
  const [recetaJsonText, setRecetaJsonText] = useState('');

  const handleInputChange = (e) => {
    setRecetaJsonText(e.target.value);
  };

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