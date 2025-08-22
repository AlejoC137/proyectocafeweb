import React, { useEffect, useState } from 'react';
import Card from '../card/Card.jsx';
import styles from '../cards/Cards.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { getSrcItems } from '../../../redux/actions.js';

function Cards(props) {
   const menu = useSelector(state => state.menu);
   const currentLenguaje = useSelector(state => state.currentLenguaje);
   const menuByCat = useSelector(state => state.menuByCat);
   const isAdmin = useSelector(state => state.isAdmin);
   const [searchTerm, setSearchTerm] = useState('');

   const items = useSelector(state => state.itemsSearch);  // Usar itemsSearch para mostrar los resultados filtrados
   const cate = useSelector(state => state.cat);  // Usar itemsSearch para mostrar los resultados filtrados



   const dispatch = useDispatch();

   useEffect(() => {
      dispatch(getSrcItems(searchTerm, menuByCat)); // Despachar la búsqueda cada vez que cambie el término de búsqueda
    }, [searchTerm,cate]);

    const handleSearch = (e) => {
      setSearchTerm(e.target.value);
    };




   return (
      <div className="grid grid-cols-2 gap-1 h-screen overflow-y-auto">
       

      {isAdmin && <input
        className='h-5'
        type="text"
        placeholder={currentLenguaje === 'ES'? "Buscar" : "Search"}
        value={searchTerm}
        onChange={handleSearch}
      />}
        
         {items.map((PAD) => (
            (isAdmin || PAD.Estado === 'Activo') && // Render card if isAdmin is true or PAD.Estado is 'Activo'
            <div key={PAD?._id} className="w-full">
               <Card
                  fondo={PAD?.foto}
                  key={PAD?._id}
                  ID={PAD?._id}
                  name={currentLenguaje === 'ES' ? PAD.NombreES : PAD.NombreEN}
                  precio={PAD.Precio}
                  descripcion={currentLenguaje === 'ES' ? PAD.DescripcionES : PAD.DescripcionEN}
                  admin={isAdmin}
                  isActive={PAD.Estado}
                  receta={PAD.receta}
               />
            </div>
         ))}

<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
      </div>
   );
}

export default Cards;












