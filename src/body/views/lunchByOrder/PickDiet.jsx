'use client';

import { useState } from 'react';
import { NumberGridComponent } from '@/components/number-grid'; // Importa el componente
import { FaLeaf, FaFish, FaCarrot, FaBreadSlice, FaEgg } from "react-icons/fa"; // Iconos para las dietas
import { GiWheat, GiPeanut, GiMilkCarton } from "react-icons/gi"; // Iconos para alergias

function PickDiet() {
  // Array de objetos para representar las dietas
  const dietOptions = [
    { label: "Vegetariana", icon: <FaLeaf /> },
    { label: "Pescatariana", icon: <FaFish /> },
    { label: "Vegana", icon: <FaCarrot /> },
    { label: "Sin Gluten", icon: <FaBreadSlice /> },
    { label: "Cetogénica", icon: <FaEgg /> },
  ];

  // Array de objetos para representar las alergias
  const alergyOptions = [
    { label: "Sin Gluten", icon: <GiWheat /> },
    { label: "Sin Maní", icon: <GiPeanut /> },
    { label: "Sin Lactosa", icon: <GiMilkCarton /> },
  ];

  // Opcional: Manejo del estado local para la selección de dieta/alergias
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [selectedAlergy, setSelectedAlergy] = useState(null);

  const handleDietSelect = (diet) => {
    setSelectedDiet(diet);
    console.log("Dieta seleccionada:", diet);
  };

  const handleAlergySelect = (alergy) => {
    setSelectedAlergy(alergy);
    console.log("Alergia seleccionada:", alergy);
  };

  return (
    <div className="flex flex-col w-screen  ">
      <h2 className="text-center text-xl font-bold">Selecciona tu Dieta</h2>
      {/* Renderiza el componente NumberGridComponent con las opciones de dietas */}
      <NumberGridComponent options={dietOptions} onSelect={handleDietSelect} />

      <hr className="my-6" />

      <h2 className="text-center text-xl font-bold ">Selecciona tus Alergias</h2>
      {/* Renderiza el componente NumberGridComponent con las opciones de alergias */}
      <NumberGridComponent options={alergyOptions} onSelect={handleAlergySelect} />

      {/* Mostrar selección actual */}
      <div className=" text-center">
        {selectedDiet && <p>Has seleccionado la dieta: {selectedDiet.label}</p>}
        {selectedAlergy && <p>Has seleccionado la alergia: {selectedAlergy.label}</p>}
      </div>
    </div>
  );
}

export default PickDiet;
