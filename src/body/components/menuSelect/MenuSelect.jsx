import React, { useEffect, useState } from "react";
import PercheroComp from '../percheroComp/PercheroComp'
import styles from './MenuSelect.module.css'; // Import CSS module
import { useSelector } from "react-redux";

function MenuSelect() {
    // const [showBanner, setShowBanner] = useState(true);


    const onPressHandler = (link) => {
        // Redirect to the provided external link
        window.location.href = link;
    };






    const currentLenguaje = useSelector(state => state.currentLenguaje);

    return (
            <div className={styles.centerColumn}>
                <PercheroComp 
                    className={styles.percheroElement}
                    src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822553/Untitled-1-02_zml2ay.png" 
                    alt="Your Image Alt Text" 
                    // buttonText="MENÚ BEBIDAS Y CAFÉ" 
                    // onClick={() => onPressHandler('https://drive.google.com/open?id=1XdYJBJlGG72I-zdY639OOcYRHdtPz46V&usp=drive_fs')}
                    imageWidth="40px"
                    />
                <PercheroComp 
                    className={styles.percheroElement}
                    src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822094/PERCHERO_02-01_mvlvyz.png" 
                    alt="Your Image Alt Text" 
                    buttonText={currentLenguaje == 'ES' ? "MENÚ CAFÉ Y BEBIDAS" : "COFFEE & DRINKS MENU"}
                    onClick={
                        currentLenguaje == 'ES' 
                        ? () => onPressHandler(`${MENU_ES_BEBIDAS}`)
                        : () => onPressHandler(`${MENU_EN_DRIKS}`)
                    }                    imageWidth="40px"
                    />
                <PercheroComp 
                    className={styles.percheroElement}
                    src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822094/PERCHERO_02-01_mvlvyz.png" 
                    alt="Your Image Alt Text" 
                    buttonText={currentLenguaje == 'ES' ? "MENÚ COMIDA" : "FOOD MENU"}
                    onClick={
                        currentLenguaje == 'ES' 
                        ? () => onPressHandler(`${MENU_ES_COMIDA}`)
                        : () => onPressHandler(`${MENU_EN_FOOD}`)
                    }
                    imageWidth=""
                    />
                {/* <PercheroComp 
                    className={styles.percheroElement}
                    src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822094/PERCHERO_02-01_mvlvyz.png" 
                    alt="Your Image Alt Text" 
                    buttonText={currentLenguaje == 'ES' ? "SERVICIOS" : "SERVICES"}
                    onClick={() => console.log('Button clicked')} 
                    imageWidth="45px"
                    /> */}

                <PercheroComp 
                    className={styles.percheroElement}
                    src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822094/PERCHERO_02-01_mvlvyz.png" 
                    alt="Your Image Alt Text" 
    
                    buttonText={currentLenguaje == 'ES' ? "CÓMO LLEGAR?" : "HOW TO GET HERE?"}

                    onClick={() => onPressHandler('https://maps.app.goo.gl/W6rawzsECjrDqJYf7')}
                    imageWidth="40px"
                    />

                <PercheroComp 
                    className={styles.percheroElement}
                    src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822094/PERCHERO_02-01_mvlvyz.png" 
                    alt="Your Image Alt Text" 
                    buttonText={currentLenguaje == 'ES' ? "AGENDA / CONTACTO" : "EVENTS / CONTACT"}

                    onClick={() => onPressHandler('https://www.instagram.com/proyecto__cafe?igsh=MWllenJ5Y2wwM2FuaA%3D%3D&utm_source=qr')}
                    imageWidth="40px"
                    />

{/* {showBanner && (
    <div className={`${styles.popup} max-w-sm p-3 bg-white border border-gray-200 shadow dark:bg-gray-800 dark:border-gray-700`}>
        <button onClick={() => setShowBanner(false)}>❎</button>
        <div>
            <h2>¡Bienvenid@ a Proyecto Café!</h2>
            <p>Te invitamos a registrarte para que puedas comentar, guardar artículos y mucho más:</p>
        </div>
    </div>
)} */}


            </div>

    );
}

export default MenuSelect;
