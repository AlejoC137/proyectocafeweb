// src/components/inventario/tableView/InventarioTableRow.jsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { ItemsAlmacen, ProduccionInterna, MenuItems, CATEGORIES, SUB_CATEGORIES, unidades, BODEGA } from "../../../../redux/actions-types";
import { parseCompLunch } from "../../../utils/jsonUtils";
import { CyclicStatusSelector } from "./CyclicStatusSelector";
import CuidadoVariations from "./CuidadoVariations"; // Ajusta la ruta si es necesario
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu"; // Ajusta la ruta si es necesario
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions"; // Ajusta la ruta si es necesario

// Este es un componente interno para las celdas editables, para mantener el código más limpio.
const EditableCell = ({ item, field, type = "text", options = null, subField = null, editingValue, onChange }) => {
    const handleChange = (e) => {
        onChange(item._id, field, e.target.value, subField);
    };

    if (type === "select") {
        return (
            <select value={editingValue} onChange={handleChange} className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900">
                <option value="">Seleccionar...</option>
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        );
    }

    return (
        <input
            type={type}
            value={editingValue}
            onChange={handleChange}
            className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900"
            step={type === "number" ? "0.01" : undefined}
        />
    );
};

export const InventarioTableRow = ({ item, index, currentType, visibleColumns, showEdit, isEditing, isRecipeOpen, editingRows, recetas, Proveedores, statusCycleOptions, handlers }) => {
    const { handleCellEdit, handleSaveRow, handleDelete, handleRecipeToggle, handleCreateReceta, handleSaveReceta } = handlers;
    
    // Función para obtener el valor correcto, ya sea del estado de edición o del ítem original.
    const getEditingValue = (field, subField = null) => {
        const parseNestedObject = (obj) => {
            try {
                return (typeof obj === "string") ? JSON.parse(obj) : obj;
            } catch {
                return {};
            }
        };

        if (subField) {
            const nestedObj = editingRows[item._id]?.[field] ?? parseNestedObject(item[field]);
            return nestedObj?.[subField] ?? "";
        }
        return editingRows[item._id]?.[field] ?? item[field] ?? "";
    };

    const cells = {
        // --- CELDAS PARA MenuItems ---
        nombreES: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="NombreES" editingValue={getEditingValue("NombreES")} onChange={handleCellEdit} /> : <span className="font-medium text-blue-800">{item.NombreES || "N/A"}</span>}</td>,
        nombreEN: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="NombreEN" editingValue={getEditingValue("NombreEN")} onChange={handleCellEdit} /> : <span>{item.NombreEN || "N/A"}</span>}</td>,
        precio: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="Precio" type="number" editingValue={getEditingValue("Precio")} onChange={handleCellEdit} /> : <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}</td>,
        descripcionES: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="DescripcionMenuES" editingValue={getEditingValue("DescripcionMenuES")} onChange={handleCellEdit} /> : <div className="text-gray-600 max-w-xs truncate" title={item.DescripcionMenuES}>{item.DescripcionMenuES || "N/A"}</div>}</td>,
        descripcionEN: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="DescripcionMenuEN" editingValue={getEditingValue("DescripcionMenuEN")} onChange={handleCellEdit} /> : <div className="text-gray-600 max-w-xs truncate" title={item.DescripcionMenuEN}>{item.DescripcionMenuEN || "N/A"}</div>}</td>,
        tipoES: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="TipoES" editingValue={getEditingValue("TipoES")} onChange={handleCellEdit} /> : <span>{item.TipoES || "N/A"}</span>}</td>,
        tipoEN: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="TipoEN" editingValue={getEditingValue("TipoEN")} onChange={handleCellEdit} /> : <span>{item.TipoEN || "N/A"}</span>}</td>,
        subTipoES: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="SubTipoES" editingValue={getEditingValue("SubTipoES")} onChange={handleCellEdit} /> : <span>{item.SubTipoES || "N/A"}</span>}</td>,
        subTipoEN: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="SubTipoEN" editingValue={getEditingValue("SubTipoEN")} onChange={handleCellEdit} /> : <span>{item.SubTipoEN || "N/A"}</span>}</td>,
        dietaES: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="DietaES" editingValue={getEditingValue("DietaES")} onChange={handleCellEdit} /> : <span className="text-green-600">{item.DietaES || "N/A"}</span>}</td>,
        dietaEN: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="DietaEN" editingValue={getEditingValue("DietaEN")} onChange={handleCellEdit} /> : <span className="text-green-600">{item.DietaEN || "N/A"}</span>}</td>,
        cuidadoES: <td className="px-3 py-2 border-r text-xs">{showEdit ? <CuidadoVariations isEnglish={false} viewName={"Inventario"} product={item} /> : <span>{item.CuidadoES || "N/A"}</span>}</td>,
        cuidadoEN: <td className="px-3 py-2 border-r text-xs">{showEdit ? <CuidadoVariations isEnglish={true} viewName={"Inventario"} product={item} /> : <span>{item.CuidadoEN || "N/A"}</span>}</td>,
        subGrupo: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="SUB_GRUPO" type="select" options={SUB_CATEGORIES} editingValue={getEditingValue("SUB_GRUPO")} onChange={handleCellEdit} /> : <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.SUB_GRUPO || "N/A"}</span>}</td>,
        order: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="Order" type="number" editingValue={getEditingValue("Order")} onChange={handleCellEdit} /> : <span className="font-mono">{item.Order || "0"}</span>}</td>,
        print: <td className="px-3 py-2 border-r text-xs">{ <span className={`px-2 py-1 rounded-full text-xs ${ item.PRINT ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800" }`}> {item.PRINT ? "SÍ" : "NO"} </span>}</td>,
        foto: <td className="px-3 py-2 border-r text-xs">{item.Foto ? <a href={item.Foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">🖼️ Ver</a> : <span>Sin foto</span>}</td>,
        composicionAlmuerzo: <td className="px-3 py-2 border-r text-xs">{/* Lógica de Composición de Almuerzo */}</td>,

        // --- CELDAS PARA INVENTARIO ---
        nombre: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="Nombre_del_producto" editingValue={getEditingValue("Nombre_del_producto")} onChange={handleCellEdit} /> : <span className="font-medium text-blue-800">{item.Nombre_del_producto || "N/A"}</span>}</td>,
        cantidad: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="CANTIDAD" type="number" editingValue={getEditingValue("CANTIDAD")} onChange={handleCellEdit} /> : <span className="font-mono">{item.CANTIDAD || 0}</span>}</td>,
        unidades: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="UNIDADES" type="select" options={unidades} editingValue={getEditingValue("UNIDADES")} onChange={handleCellEdit} /> : <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{item.UNIDADES || "N/A"}</span>}</td>,
        costo: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="COSTO" type="number" editingValue={getEditingValue("COSTO")} onChange={handleCellEdit} /> : <span className="font-mono font-bold text-green-600">${parseFloat(item.COSTO || 0).toFixed(2)}</span>}</td>,
        precioUnitario: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="precioUnitario" type="number" editingValue={getEditingValue("precioUnitario")} onChange={handleCellEdit} /> : <span className="font-mono font-bold text-purple-600">${parseFloat(item.precioUnitario || 0).toFixed(2)}</span>}</td>,
        stock: <td className="px-3 py-2 border-r text-xs"><div className="space-y-1">{['minimo', 'maximo', 'actual'].map(key => <div key={key} className="flex items-center gap-1"><span className="text-xs text-gray-500 w-8">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>{showEdit ? <EditableCell item={item} field="STOCK" type="number" subField={key} editingValue={getEditingValue("STOCK", key)} onChange={handleCellEdit} /> : <span className="text-xs">{item.STOCK?.[key] || 0}</span>}</div>)}</div></td>,
        almacenamiento: <td className="px-3 py-2 border-r text-xs"><div className="space-y-1">{['ALMACENAMIENTO', 'BODEGA'].map(key => <div key={key} className="flex items-center gap-1"><span className="text-xs text-gray-500 w-8">{key.slice(0, 3)}:</span>{showEdit ? <EditableCell item={item} field="ALMACENAMIENTO" type="select" options={BODEGA} subField={key} editingValue={getEditingValue("ALMACENAMIENTO", key)} onChange={handleCellEdit} /> : <span className="text-xs">{item.ALMACENAMIENTO?.[key] || "N/A"}</span>}</div>)}</div></td>,
        merma: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="Merma" type="number" editingValue={getEditingValue("Merma")} onChange={handleCellEdit} /> : <span className="font-mono text-yellow-600">{parseFloat(item.Merma || 0).toFixed(2)}%</span>}</td>,
        proveedor: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="Proveedor" type="select" options={Proveedores.map(p => p.Nombre_Proveedor)} editingValue={getEditingValue("Proveedor")} onChange={handleCellEdit} /> : <span>{Proveedores.find(p => p._id === item.Proveedor)?.Nombre_Proveedor || "N/A"}</span>}</td>,
        fechaActualizacion: <td className="px-3 py-2 border-r text-xs"><span className="text-gray-600">{item.FECHA_ACT || "N/A"}</span></td>,

        // --- CELDA COMÚN PARA GRUPO Y ESTADO ---
        grupo: <td className="px-3 py-2 border-r text-xs">{showEdit ? <EditableCell item={item} field="GRUPO" type="select" options={CATEGORIES} editingValue={getEditingValue("GRUPO")} onChange={handleCellEdit} /> : <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "N/A"}</span>}</td>,
        estado: <td className="px-3 py-2 border-r text-xs">{showEdit ? <CyclicStatusSelector initialStatus={getEditingValue("Estado") || statusCycleOptions[0]} options={statusCycleOptions} onStatusChange={(newStatus) => { handleCellEdit(item._id, "Estado", newStatus); handleSaveRow(item, { ...editingRows[item._id], Estado: newStatus }); }} /> : <span className={`px-2 py-1 rounded-full text-xs ${["Activo", "PC", "PP", "OK"].includes(item.Estado) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{item.Estado || "N/A"}</span>}</td>,
        acciones: <td className="px-3 py-2 text-xs">
            <div className="flex gap-1">
                {(currentType === ProduccionInterna || currentType === MenuItems) && (
                    <Button onClick={() => handleRecipeToggle(item._id, item.Receta)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6 border border-yellow-300">
                        {isRecipeOpen ? '📖' : '📕'}
                    </Button>
                )}
                {isEditing && (
                    <Button onClick={() => handleSaveRow(item)} className="bg-gray-100 hover:bg-green-600 text-green-800 px-2 py-1 text-xs h-6 border border-green-300">💾</Button>
                )}
                {showEdit && (
                    <Button onClick={() => handleDelete(item)} className="bg-gray-100 hover:bg-red-600 text-red-800 px-2 py-1 text-xs h-6 border border-red-300">🗑️</Button>
                )}
            </div>
        </td>,
    };

    return (
        <>
            <tr className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                {Object.keys(visibleColumns).map(key => visibleColumns[key] && cells[key])}
            </tr>
            {isRecipeOpen && (
                <tr className="bg-yellow-50">
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-4 border-b border-gray-200">
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                            {currentType === MenuItems ? (
                                <RecepieOptionsMenu product={item} Receta={recetas[item._id]} currentType={currentType} onSaveReceta={handleSaveReceta} onCreateReceta={handleCreateReceta} />
                            ) : (
                                <RecepieOptions product={item} Receta={recetas[item._id]} currentType={currentType} onCreateReceta={handleCreateReceta} />
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};