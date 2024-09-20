import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllItems, getSrcItems } from "../../../redux/actions.js"; // Asegúrate de importar getSrcItems
import CardsCheckList from './CardsCheckList.jsx';

function MenuCheckListByProps({ Area, category }) {
    const dispatch = useDispatch();
    const items = useSelector(state => state.itemsSearch); // Lista de ítems
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
    const [filteredItems, setFilteredItems] = useState([]); // Para manejar los ítems filtrados
    const [isLoading, setIsLoading] = useState(false);
    const [reportCreated, setReportCreated] = useState(false);

    useEffect(() => {
        // Obtener todos los ítems al cargar el componente
        dispatch(getAllItems());
    }, [dispatch, reportCreated]);

    useEffect(() => {
        // Cuando cambia el término de búsqueda, despachar la acción
        dispatch(getSrcItems(searchTerm));
    }, [dispatch, searchTerm]);

    // Filtrar los ítems por el área seleccionada
    const itemsByArea = items?.filter(item => item.Area === Area);

    return (
        <div className="container mx-auto py-8">
            <div className="m-4">
                {/* Input del buscador */}
                <br></br>
                <br></br>
                <br></br>
                {/* <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} // Actualizar el término de búsqueda
                    placeholder="Buscar ítems..."
                    className="border rounded w-full fixed top-20 justify-center py-8 bg-gray-800 text-white z-50"
                    // className="fixed top-0 left-0 w-full bg-gray-800 text-white z-50"

                /> */}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="m-1">
                    <CardsCheckList
                        info={itemsByArea} // Usamos los ítems filtrados por área
                        tittle={category.toUpperCase()}
                        sourceImg="https://res.cloudinary.com/dwcp7dk9h/image/upload/v1710996709/PERCHERO_02-02_g4pqcy.png"
                    />
                </div>
            </div>
        </div>
    );
}

export default MenuCheckListByProps;
