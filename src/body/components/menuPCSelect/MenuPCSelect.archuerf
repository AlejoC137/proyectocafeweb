// import React, { useEffect, useState } from "react";
// import PercheroComp from '../percheroComp/PercheroComp.jsx';
// import styles from './menuPCSelect.module.css'; 
// import { useDispatch, useSelector } from "react-redux";
// import { getAllProducts, productsByCat, setAdmin, setLenguaje } from "../../../redux/actions";
// import MenuButtons from "../menuButtons/MenuButtons.jsx";
// import { ProductCardGridComponent } from "../product-card-grid";  // Importamos el componente ProductCardGridComponent

// function MenuPCSelect(props) {
//     const dispatch = useDispatch();
//     const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);
//     const currentLenguaje = useSelector(state => state.menu.currentLenguaje); // Obtener el idioma actual del estado global
//     const products = useSelector(state => state.menu.filteredMenu); // Obtener los productos filtrados del estado global

//     useEffect(() => {
//         dispatch(getAllProducts());
//         dispatch(setAdmin(props.edit));
//     }, [dispatch, props.edit]);

//     const handleCategoryClick = (category) => {
//         console.log('Categoría seleccionada:', category);
//         setIsButtonHighlighted(true);
//         dispatch(productsByCat(category));
//     };

//     const switchToSpanish = () => {
//         dispatch(setLenguaje('ES'));
//         setIsButtonHighlighted(false);
//     };

//     const switchToEnglish = () => {
//         dispatch(setLenguaje('EN'));
//         setIsButtonHighlighted(true);
//     };

//     return (
//         <div className="m-1 fixed">
//             <div>
//                 <PercheroComp
//                     className={styles.percheroElement}
//                     src="https://drive.google.com/thumbnail?id=1BEf6NP-lfhFVzZKtdCOdXyaUfAtmp7FX&sz=w1000-h1000"
//                     alt="Your Image Alt Text"
//                     imageWidth="40px"
//                 />
//                 <div className='font-SPACEGROTESK_VARIABLEFONT_WGHT text-15pt text-center'>
//                     {currentLenguaje === 'ES' ? `Lunes - Sábado : 8:00 AM - 7:30 PM, Domingo: 9:00 AM - 2:30 PM` : `Monday - Saturday: 8:00 AM - 7:30 PM, Sunday: 9:00 AM - 2:30 PM`}
//                 </div>
//                 <div className="flex">
//                     <button
//                         className={`w-1/2 mb-1 mr-0.5 rounded-2xl border border-lilaDark p-1 font-SPACEGROTESK_VARIABLEFONT_WGHT text-15pt text-center ${currentLenguaje === 'ES' ? 'bg-ladrillo text-notBlack' : 'text-lilaDark bg-softGrey'}`}
//                         onClick={switchToSpanish}
//                     >
//                         Español
//                     </button>
//                     <button
//                         className={`w-1/2 mb-1 ml-0.5 rounded-2xl border border-lilaDark p-1 font-SPACEGROTESK_VARIABLEFONT_WGHT text-15pt text-center ${currentLenguaje === 'EN' ? 'bg-ladrillo text-notBlack' : 'text-lilaDark bg-softGrey'}`}
//                         onClick={switchToEnglish}
//                     >
//                         English
//                     </button>
//                 </div>
//             </div>
//             <MenuButtons
//                 className='fixed'
//                 categories={currentLenguaje === 'ES' ?
//                     ['Café', 'Bebidas', 'Sanduches', 'Desayuno', 'Postres', 'Todo'] :
//                     ['Coffee', 'Drinks', 'Sandwiches', 'Breakfast', 'Desserts', 'Show all']}
//                 onClick={handleCategoryClick}
//                 highlighted={isButtonHighlighted}
//             />
            
//             {/* Enviamos los productos y el lenguaje actual al componente ProductCardGridComponent */}
//             <ProductCardGridComponent products={products} isEnglish={currentLenguaje === 'EN'} />
//         </div>
//     );
// }

// export default MenuPCSelect;
