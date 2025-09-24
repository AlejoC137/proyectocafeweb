import React from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../redux/actions-Proveedores';
import { ProduccionInterna } from '../../redux/actions-types';

/**
 * Un botón que cicla a través de diferentes estados (e.g., "Pendiente", "OK", "N/A")
 * cuando se hace clic, actualizando el estado a través de una acción de Redux.
 * @param {object} props
 * @param {string} props.id - El ID del item a actualizar.
 * @param {string} props.currentType - El tipo de item (e.g., 'ProduccionInterna', 'Menu').
 * @param {string} props.currentEstado - El estado actual del item.
 */
export function TableViewInventarioCycle({ id, currentType, currentEstado }) {
    const dispatch = useDispatch();
    
    // Define los posibles estados según el tipo de producto.
    const statusCycleOptions = currentType === ProduccionInterna 
        ? ["PP", "OK", "NA"]  // Producción: Pendiente Producción -> OK -> No Aplica
        : ["PC", "OK", "NA"]; // Otro: Pendiente Compra -> OK -> No Aplica

    const estadoActual = currentEstado || "NA";

    /**
     * Maneja el clic en el botón: calcula el siguiente estado en el ciclo y
     * despacha la acción para actualizarlo en la base de datos.
     */
    const handleClick = async () => {
        const currentIndex = statusCycleOptions.indexOf(estadoActual);
        const nextIndex = (currentIndex + 1) % statusCycleOptions.length; // El truco del módulo para el ciclo
        const newEstado = statusCycleOptions[nextIndex];
        
        // Despacha la acción a Redux para que actualice el estado global y la DB
        await dispatch(updateItem(id, { Estado: newEstado }, currentType));
    };

    /**
     * Retorna las clases de Tailwind CSS correspondientes para dar color al botón
     * según su estado actual.
     * @param {string} estado - El estado actual ('OK', 'PC', 'PP', 'NA').
     * @returns {string} Las clases de CSS para el estilo.
     */
    const getStatusClass = (estado) => {
        switch (estado) {
            case "OK":
                return "bg-green-100 text-green-800 hover:bg-green-200";
            case "PC":
            case "PP":
                return "bg-blue-100 text-blue-800 hover:bg-blue-200";
            default: // "NA" o cualquier otro valor
                return "bg-red-100 text-red-800 hover:bg-red-200";
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${getStatusClass(estadoActual)}`}
        >
            {estadoActual}
        </button>
    );
}