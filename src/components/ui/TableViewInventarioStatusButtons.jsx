// ruta: src/components/ui/TableViewInventarioStatusButtons.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { Button } from "@/components/ui/button";
import { updateItem } from '../../redux/actions-Proveedores';
import { ProduccionInterna } from '../../redux/actions-types';

/**
 * Muestra un grupo de 3 botones (ej. PC, OK, NA) para cambiar el estado de un item.
 * @param {object} props
 * @param {string} props.id - El ID del item a actualizar.
 * @param {string} props.currentType - El tipo de item (tabla en la DB).
 * @param {string} props.currentEstado - El estado actual del item.
 */
export function TableViewInventarioStatusButtons({ id, currentType, currentEstado }) {
    const dispatch = useDispatch();

    // Define las etiquetas de los botones según el tipo de producto
    const statuses = currentType === ProduccionInterna
        ? ["PP", "OK", "NA"] // Para Producción
        : ["PC", "OK", "NA"]; // Para Almacén y Menú

    // Función que se llama al hacer clic en cualquier botón
    const handleStatusChange = (newStatus) => {
        // Evita despachar una acción si el estado ya es el actual
        if (newStatus === currentEstado) return;
        dispatch(updateItem(id, { Estado: newStatus }, currentType));
    };

    /**
     * Define el estilo del botón dependiendo de si es el estado activo o no.
     * @param {string} status - El estado que representa el botón.
     * @returns {string} Clases de Tailwind CSS para el botón.
     */
    const getButtonClass = (status) => {
        const isActive = currentEstado === status;
        const baseClass = "text-xs p-1 h-6 w-10 transition-all font-semibold rounded-md";
        
        if (isActive) {
            switch (status) {
                case "OK":
                    return `${baseClass} bg-green-500 hover:bg-green-600 text-white shadow-md`;
                case "PC":
                case "PP":
                    return `${baseClass} bg-blue-500 hover:bg-blue-600 text-white shadow-md`;
                case "NA":
                    return `${baseClass} bg-red-500 hover:bg-red-600 text-white shadow-md`;
                default:
                    return `${baseClass} bg-gray-500 hover:bg-gray-600 text-white shadow-md`;
            }
        } else {
            // Estilo para los botones inactivos
            return `${baseClass} bg-gray-200 hover:bg-gray-300 text-gray-600`;
        }
    };

    return (
        <div className="flex items-center gap-1">
            {statuses.map((status) => (
                <Button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={getButtonClass(status)}
                    variant="ghost" // Usamos ghost para que nuestros estilos personalizados tomen control total
                >
                    {status}
                </Button>
            ))}
        </div>
    );
}