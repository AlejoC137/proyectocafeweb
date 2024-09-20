import React from "react";
import SideComp from '../../components/sideComp/SideComp.jsx'
import styles from './LenguajeSelect.module.css'; // Import CSS module
import LengOptions from '../../components/lengOptions/LengOptions.jsx'
function LenguajeSelect() {
    


    return (
        <div 
        className={styles.centerGroup}
        >
            <SideComp className={styles.sideL}  src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822092/00-PLANTAS2_x1njwt.png" />
            <SideComp className={styles.sideR} src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822092/00-PLANTAS_z2gtlu.png" />
            <LengOptions className={styles.sideC}/>
        </div>
    );
}

export default LenguajeSelect;
