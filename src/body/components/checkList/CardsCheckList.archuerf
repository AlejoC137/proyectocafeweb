import React, { useEffect, useState } from 'react';
import CardCheckList from './CardCheckList';
import { useDispatch, useSelector } from "react-redux";
import { getSrcItems } from '../../../redux/actions';

function CardsCheckList(props) {
   
    const dispatch = useDispatch();

    const items = props.info || []; // Asegurarse de que `items` sea un arreglo
    const [largeEdit, setLargeEdit] = useState(false); // Estado inicial del switch de edición
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda

    useEffect(() => {
        // Cuando cambia el término de búsqueda, despachar la acción
        dispatch(getSrcItems(searchTerm));
    }, [dispatch, searchTerm]);

    // Función para cambiar el estado de largeEdit
    const handleSwitchSet = () => {
        setLargeEdit(!largeEdit); // Cambia el estado al opuesto
    };

    // Agrupar los items por categoría
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'Sin categoría'; // Asignar una categoría si no tiene
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    return (
        <div>
            {/* Botones fijos */}
            <div className="fixed top-0 left-0 w-full bg-gray-800 text-white z-50">
                <div className="container mx-auto flex justify-center py-4 space-x-4">
                    {Object.keys(groupedItems).map((category) => (
                        <a 
                            key={category} 
                            href={`#${category}`} 
                            className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
                        >
                            {category}
                        </a>
                    ))}

                    {/* Botón de cambio de estado */}
                    <button 
                        onClick={handleSwitchSet} 
                        className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-700"
                    >
                        {largeEdit ? "VIEW" : "EDIT"}
                    </button>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} // Actualizar el término de búsqueda
                        placeholder="Buscar ítems..."
                        className="bg-gray-800 z-50 text-white placeholder-white border rounded w-full"
                    />
                </div>
            </div>

            <div>
                {/* Secciones de categorías */}
                <div className="p-4 mt-16"> {/* Añadimos margen superior para evitar que los botones fijos tapen el contenido */}
                    {Object.keys(groupedItems).map((category) => (
                        <div key={category} id={category} className="mb-8">
                            <h1 className="text-xl font-semibold mb-4">{category}</h1>
                            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
                                {groupedItems[category].map((item) => (
                                    <div key={item?._id} className="min-w-0">
                                        <CardCheckList
                                            largeEditSet={largeEdit} // Pasar el estado al componente CardCheckList
                                            datos={item}
                                            category={category}
                                            subCategory={item}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CardsCheckList;
