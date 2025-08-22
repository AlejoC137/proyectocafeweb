import React, { useState } from "react";
import { Link } from 'react-router-dom';
import GearIcon from './GearIcon.jsx';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

function Card(props) {
  const [showDescription, setShowDescription] = useState(props.fondo ? false : true); // Initialize description visibility to false
  const [statusEmoji, setStatusEmoji] = useState(''); // Initialize statusEmoji

  const toggleDescription = () => {
    setShowDescription(!showDescription); // Toggle description visibility
  };

  const dispatch = useDispatch();
  const navigate = useNavigate(); // Hook para navegar

  const handleClick = () => {
    dispatch(setReceta(props.receta));
    navigate('/RecetaCard'); // Navega a la ruta /RecetaCard después de despachar
  };

  return (
    <div className="bg-ladrillo h-72 w-full overflow-hidden border border-lilaDark relative">
      {/* Name */}
      {props.admin && (
        <div className="absolute top-0 right-0 flex space-x-2">
          <Link to={`https://portfolio-ap-seven.vercel.app/editproducto/${props.ID}`}>
            <GearIcon />
          </Link>
          <button 
            onClick={handleClick}
            className="bg-blue-500 text-white px-2 py-1 ">Ver Receta</button>
        </div>
      )}

      <div className="font-SPACEGROTESK_VARIABLEFONT_WGHT text-notBlack text-12pt text-center truncate">
        {props.name}
      </div>
      
      <div className="font-SPACEGROTESK_VARIABLEFONT_WGHT text-notBlack text-10pt text-center ">
        {props.precio} 
      </div>

      {/* Image */}
      <div className="relative" onClick={toggleDescription}>
        <img
          className="w-full h-64 object-cover  border border-lilaDark align-middle"
          src={props?.fondo}
          alt=""
        />
        {/* Description Overlay */}
        {(showDescription && props.descripcion) && (
          <div className="absolute top-0 left-0 w-full h-full flex font-SPACEGROTESK_VARIABLEFONT_WGHT text-notBlack border border-lilaDark  items-center justify-center bg-white bg-opacity-75" onClick={toggleDescription}>
            <div className="text-center">{props.name} - {props.descripcion}</div>
          </div>
        )}
      </div>
      <br />
    </div>
  );
}

export default Card;
