'use client';

import { useState, useEffect } from 'react';
import { NumberGridComponent } from '@/components/number-grid'; 
import { FaLeaf, FaFish, FaCarrot, FaBreadSlice, FaEgg } from "react-icons/fa"; 
import { GiWheat, GiPeanut, GiMilkCarton } from "react-icons/gi"; 

function PickDiet() {
  const dietOptions = [
    { label: "Vegetariana", icon: <FaLeaf /> },
    { label: "Pescatariana", icon: <FaFish /> },
    { label: "Vegana", icon: <FaCarrot /> },
    { label: "Sin Gluten", icon: <FaBreadSlice /> },
    { label: "Cetogénica", icon: <FaEgg /> },
  ];

  const alergyOptions = [
    { label: "Sin Gluten", icon: <GiWheat /> },
    { label: "Sin Maní", icon: <GiPeanut /> },
    { label: "Sin Lactosa", icon: <GiMilkCarton /> },
  ];

  const cuantosPlatos = [
    { label: 10, icon: <GiMilkCarton /> },
    { label: 15, icon: <GiMilkCarton /> },
    { label: 20, icon: <GiMilkCarton /> },
    { label: 25, icon: <GiMilkCarton /> },
    { label: 30, icon: <GiMilkCarton /> },
    { label: "INDEFINIDO", icon: <GiMilkCarton /> },
  ];

  const cualesDias = [
    { label: "Lunes", icon: <GiWheat /> },
    { label: "Martes", icon: <GiPeanut /> },
    { label: "Miércoles", icon: <GiMilkCarton /> },
    { label: "Jueves", icon: <GiWheat /> },
    { label: "Viernes", icon: <GiPeanut /> },
    { label: "Sábado", icon: <GiMilkCarton /> },
    { label: "Domingo", icon: <GiWheat /> },
  ];

  const [selectedPlatos, setSelectedPlatos] = useState(null);
  const [selectedDias, setSelectedDias] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [selectedAlergias, setSelectedAlergias] = useState([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState(1);
  const [chefSelection, setChefSelection] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlatosSelect = (plato) => {
    setSelectedPlatos(plato);
  };

  const handleDiasSelect = (dia) => {
    setSelectedDias((prevSelected) =>
      prevSelected.includes(dia.label)
        ? prevSelected.filter((item) => item !== dia.label)
        : [...prevSelected, dia.label]
    );
  };

  const handleDietSelect = (diet) => {
    setSelectedDiet(diet);
  };

  const handleAlergySelect = (alergy) => {
    setSelectedAlergias((prevSelected) =>
      prevSelected.includes(alergy.label)
        ? prevSelected.filter((item) => item !== alergy.label)
        : [...prevSelected, alergy.label]
    );
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleConfirm = () => {
    setStep(3);
  };

  const handleGoToPayment = () => {
    console.log('Redirigiendo a la pasarela de pagos...');
  };

  const handleChooseAgain = () => {
    setStep(1);
  };

  const calculateTotal = () => {
    const basePrice = 10;
    const totalPlatos = selectedPlatos?.label || 0;
    return basePrice * totalPlatos;
  };

  const handleChefSelectionChange = () => {
    setChefSelection(!chefSelection);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {step === 1 && (
        <>
          <h2 className="text-center text-xl font-bold">Cuantos platos quieres?</h2>
          <NumberGridComponent options={cuantosPlatos} onSelect={handlePlatosSelect} className="pb-16 text-sm text-center whitespace-normal break-words w-full"/>
          <h2 className="text-center text-xl font-bold">Selecciona los días de la semana</h2>
          <NumberGridComponent options={cualesDias} onSelect={handleDiasSelect} multiSelect={true} />

          {isMobile && (
            <button 
              className="mx-auto justify-center bg-blue-500 text-white rounded" 
              onClick={handleContinue}
            >
              Continuar
            </button>
          )}
          <br></br>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-center text-xl font-bold">Selecciona tu Dieta</h2>
          <NumberGridComponent options={dietOptions} onSelect={handleDietSelect} />
          <br></br>
          <h2 className="text-center text-xl font-bold">Selecciona tus Alergias</h2>
          <NumberGridComponent options={alergyOptions} onSelect={handleAlergySelect} multiSelect={true} />
          <br></br>

          <div className="flex justify-between my-6">
            <button 
              className="mx-auto px-4 py-2 bg-gray-500 text-white rounded" 
              onClick={handleBack}
            >
              Atrás
            </button>
            <button 
              className="mx-auto px-4 py-2 bg-green-500 text-white rounded" 
              onClick={handleConfirm}
            >
              Confirmar
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="mx-auto my-8 p-6 bg-white rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-center text-2xl font-bold mb-4">Resumen del Pedido</h2>
          <p><strong>Platos seleccionados:</strong> {selectedPlatos?.label || 'N/A'}</p>
          <p><strong>Días seleccionados:</strong> {selectedDias.length > 0 ? selectedDias.join(', ') : 'N/A'}</p>
          <p><strong>Dieta seleccionada:</strong> {selectedDiet?.label || 'N/A'}</p>
          <p><strong>Alergias seleccionadas:</strong> {selectedAlergias.length > 0 ? selectedAlergias.join(', ') : 'N/A'}</p>
          <p><strong>Total a Pagar:</strong> ${calculateTotal()}</p>

          <hr className="my-4" />

          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              className="mr-2"
              checked={chefSelection}
              onChange={handleChefSelectionChange}
            />
            Platos a selección del chef basado en mis preferencias
          </label>

          <p className="text-sm text-gray-600">
            Al confirmar el pedido, aceptas nuestros términos y condiciones.
          </p>

          <div className="flex justify-between mt-6">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded" 
              onClick={handleGoToPayment}
            >
              Ir a Pasarela de Pagos
            </button>
            <button 
              className={`px-4 py-2 bg-gray-500 text-white rounded ${chefSelection ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={handleChooseAgain}
              disabled={chefSelection}
            >
              Elegir Platos Nuevamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PickDiet;
