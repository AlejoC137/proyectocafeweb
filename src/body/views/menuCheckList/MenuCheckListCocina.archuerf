import React, { useEffect } from "react";
import SideComp from '../../components/sideComp/SideComp.jsx';
// import styles from './menuPC.module.css'; // Import CSS module
import MenuCheckListByProps from '../../components/checkList/MenuCheckListByProps.jsx';
import { useParams } from "react-router-dom";
import { getAllItems } from "../../../redux/actions.js";

function MenuCheckListCocina() {
    const onPressHandler = (link) => {
        // Redirect to the provided external link
        window.location.href = link;
    };

    return (
        <div 
        // className={styles.centerGroup}
        >
            <MenuCheckListByProps
                category="STOCK"
                Area="COCINA"
            />
        </div>
    );
}

export default MenuCheckListCocina;
