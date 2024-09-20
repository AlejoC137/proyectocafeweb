import React from "react";
import SideComp from '../../components/sideComp/SideComp.jsx'
import styles from './menuPC.module.css'; // Import CSS module
import MenuPCSelect from '../../components/menuPCSelect/MenuPCSelect.jsx'
import { useParams } from "react-router-dom";
function MenuPC() {
    const onPressHandler = (link) => {
        // Redirect to the provided external link
        window.location.href = link;
    };

    const { edit } = useParams();


    return (
        <div 
        // className={styles.centerGroup}
        >
            <MenuPCSelect 
            // lassName={styles.sideC}
            
            edit={edit}
            />
            
            {/* <SideComp className={styles.sideL}  src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822092/00-PLANTAS2_x1njwt.png" /> */}
            {/* <SideComp className={styles.sideR} src="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710822092/00-PLANTAS_z2gtlu.png" /> */}
        </div>
    );
}

export default MenuPC;
