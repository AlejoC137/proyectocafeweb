// ruta: src/components/ui/tableViewInventarioRenderers.jsx

import React from 'react';
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItems, ProduccionInterna } from "../../redux/actions-types";
import { parseNestedObject } from "../../utils/jsonUtils";
import { TableViewInventarioStatusButtons } from "./TableViewInventarioStatusButtons"; // 👈 1. IMPORTA EL NUEVO COMPONENTE
import CuidadoVariations from "./CuidadoVariations";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";

// Componente para el ícono de ordenamiento (sin cambios)
const SortIcon = ({ column, sortColumn, sortDirection }) => {
    if (sortColumn !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
};

// Función para renderizar una celda editable (sin cambios)
const renderEditableCell = (item, field, handleCellEdit, editingRows, type = "text") => {
    return (
        <input
            type={type}
            value={editingRows[item._id]?.[field] ?? item[field] ?? ''}
            onChange={(e) => handleCellEdit(item._id, field, e.target.value)}
            className="w-full p-1 border rounded bg-slate-50 text-xs"
        />
    );
};

// Renderiza los encabezados de la tabla (sin cambios)
export const renderTableHeaders = (availableColumns, visibleColumns, handleSort, sortColumn, sortDirection) => {
    return Object.entries(availableColumns)
        .filter(([key]) => visibleColumns[key])
        .map(([key, col]) => (
            <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-blue-600">
                    {col.label}
                    <SortIcon column={col.key} sortColumn={sortColumn} sortDirection={sortDirection} />
                </button>
            </th>
        ));
};

// Renderiza las filas de la tabla (CON CAMBIOS)
export const renderTableRows = ({
    sortedProducts, currentType, showEdit, editingRows, handleCellEdit,
    handleSaveRow, handleDelete, handleRecipeToggle, openRecipeRows,
    visibleColumns, Proveedores, recetas
}) => {
    return sortedProducts.map((item, index) => {
        const isEditing = !!editingRows[item._id];
        const isRecipeOpen = !!openRecipeRows[item._id];
        const visibleColsCount = Object.values(visibleColumns).filter(Boolean).length;

        const rowContent = (
            <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {visibleColumns.nombre && <td className="px-3 py-2 text-xs">{item.Nombre_del_producto}</td>}
                {visibleColumns.nombreES && <td className="px-3 py-2 text-xs font-medium text-slate-800">{item.NombreES}</td>}
                {visibleColumns.precio && <td className="px-3 py-2 text-xs">${item.Precio}</td>}
                
                <td className="px-3 py-2 text-xs">
                    {showEdit ? (
                        // 👇 2. REEMPLAZA TableViewInventarioCycle CON LOS NUEVOS BOTONES
                        <TableViewInventarioStatusButtons 
                            id={item._id} 
                            currentType={currentType} 
                            currentEstado={item.Estado} 
                        />
                    ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${item.Estado === 'OK' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                            {item.Estado}
                        </span>
                    )}
                </td>

                <td className="px-3 py-2 text-xs">
                    <div className="flex items-center gap-1">
                        {isEditing && <Button onClick={() => handleSaveRow(item)} size="sm">💾</Button>}
                        {showEdit && <Button onClick={() => handleDelete(item)} size="sm" variant="destructive">🗑️</Button>}
                        {(currentType === ProduccionInterna || currentType === MenuItems) && (
                            <Button onClick={() => handleRecipeToggle(item._id, item.Receta)} size="sm" variant="outline">{isRecipeOpen ? '📖' : '📕'}</Button>
                        )}
                    </div>
                </td>
            </tr>
        );
        
        const recipeContent = isRecipeOpen && (
            <tr key={`${item._id}-recipe`}>
                <td colSpan={visibleColsCount} className="p-4 bg-yellow-50 border-t border-yellow-200">
                    {currentType === MenuItems ? (
                        <RecepieOptionsMenu product={item} Receta={recetas[item._id]} />
                    ) : (
                        <RecepieOptions product={item} Receta={recetas[item._id]} />
                    )}
                </td>
            </tr>
        );

        return (
            <React.Fragment key={item._id}>
                {rowContent}
                {recipeContent}
            </React.Fragment>
        );
    });
};
