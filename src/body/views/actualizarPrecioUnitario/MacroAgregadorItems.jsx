import React, { useState } from 'react';
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X, Trash2, PlusCircle } from "lucide-react";
import { MenuItems, AREAS, CATEGORIES, unidades, BODEGA, SUB_CATEGORIES, ESTATUS, ItemsAlmacen, ProduccionInterna, MENU } from "../../../redux/actions-types";
import { crearItem } from "../../../redux/actions";

const MacroAgregadorItems = ({ onClose, currentType, allProveedores = [] }) => {
    const dispatch = useDispatch();
    const isMenu = currentType === MenuItems;

    const getInitialRow = () => {
        if (isMenu) {
            return {
                NombreES: "",
                NombreEN: "",
                Precio: "",
                Estado: "Activo",
                GRUPO: "",
                SUB_GRUPO: "",
                Foto: "",
                DescripcionMenuES: "",
                DescripcionMenuEN: ""
            };
        } else {
            return {
                Nombre_del_producto: "",
                CANTIDAD: "",
                UNIDADES: "",
                COSTO: "",
                Merma: "0",
                Area: "",
                GRUPO: "",
                Proveedor: "",
                Estado: "OK",
                ALMACENAMIENTO: { ALMACENAMIENTO: "", BODEGA: "" },
                STOCK: { minimo: "", actual: "", maximo: "" },
                COOR: currentType === ItemsAlmacen ? "1.05" : undefined
            };
        }
    };

    const [draftItems, setDraftItems] = useState([getInitialRow()]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddRow = () => {
        setDraftItems([...draftItems, getInitialRow()]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...draftItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setDraftItems(newItems);
    };

    const handleStockChange = (index, field, value) => {
        const newItems = [...draftItems];
        newItems[index] = {
            ...newItems[index],
            STOCK: {
                ...newItems[index].STOCK,
                [field]: value
            }
        };
        setDraftItems(newItems);
    };

    const handleAlmacenamientoChange = (index, field, value) => {
        const newItems = [...draftItems];
        newItems[index] = {
            ...newItems[index],
            ALMACENAMIENTO: {
                ...newItems[index].ALMACENAMIENTO,
                [field]: value
            }
        };
        setDraftItems(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = draftItems.filter((_, i) => i !== index);
        setDraftItems(newItems);
        if (newItems.length === 0) {
            setDraftItems([getInitialRow()]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        let count = 0;
        try {
            for (const item of draftItems) {
                if (isMenu) {
                    const menuItemData = { ...item };
                    // Clean up empty fields
                    Object.keys(menuItemData).forEach(key => { if (menuItemData[key] === "" || menuItemData[key] == null) delete menuItemData[key]; });
                    // Basic validation
                    if (!menuItemData.NombreES) continue; 
                    
                    await dispatch(crearItem(menuItemData, MENU));
                    count++;
                } else {
                    const newItemToCreate = { ...item };
                    
                    // Format nested objects
                    newItemToCreate.STOCK = JSON.stringify(item.STOCK);
                    newItemToCreate.ALMACENAMIENTO = JSON.stringify(item.ALMACENAMIENTO);
                    
                    if (currentType === ProduccionInterna) {
                        delete newItemToCreate.COOR;
                    }

                    // Clean up empty fields
                    Object.keys(newItemToCreate).forEach(key => { if (newItemToCreate[key] === "" || newItemToCreate[key] == null) delete newItemToCreate[key]; });
                    
                    // Basic validation
                    if (!newItemToCreate.Nombre_del_producto) continue;

                    await dispatch(crearItem(newItemToCreate, currentType));
                    count++;
                }
            }
            alert(`Se agregaron exitosamente ${count} ítems.`);
            onClose();
        } catch (e) {
            alert("Error al guardar ítems: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* HEADER */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Macro Agregador de Ítems
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Agrega múltiples ítems rápidamente. Usa el botón "Añadir Fila" para agregar más elementos.
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* CONTENT */}
                <div className="p-4 overflow-y-auto flex-grow flex flex-col gap-4">
                    {draftItems.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative">
                            <div className="absolute top-2 right-2">
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0 rounded-md" title="Eliminar ítem">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Nuevo Ítem {idx + 1}</h3>

                            {isMenu ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-8">
                                    <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre (ES) *</label>
                                        <Input value={item.NombreES} onChange={(e) => handleItemChange(idx, 'NombreES', e.target.value)} className="h-8 text-xs border-slate-200 font-medium text-slate-800" placeholder="Requerido" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre (EN)</label>
                                        <Input value={item.NombreEN} onChange={(e) => handleItemChange(idx, 'NombreEN', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Precio</label>
                                        <Input type="number" value={item.Precio} onChange={(e) => handleItemChange(idx, 'Precio', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.Estado} onChange={(e) => handleItemChange(idx, 'Estado', e.target.value)}>
                                            <option value="">Estado...</option>
                                            {ESTATUS.map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.GRUPO} onChange={(e) => handleItemChange(idx, 'GRUPO', e.target.value)}>
                                            <option value="">Grupo...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sub Grupo</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.SUB_GRUPO} onChange={(e) => handleItemChange(idx, 'SUB_GRUPO', e.target.value)}>
                                            <option value="">Sub Grupo...</option>
                                            {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Foto (URL)</label>
                                        <Input value={item.Foto} onChange={(e) => handleItemChange(idx, 'Foto', e.target.value)} className="h-8 text-xs border-slate-200" placeholder="URL de la imagen" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción (ES)</label>
                                        <Input value={item.DescripcionMenuES} onChange={(e) => handleItemChange(idx, 'DescripcionMenuES', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción (EN)</label>
                                        <Input value={item.DescripcionMenuEN} onChange={(e) => handleItemChange(idx, 'DescripcionMenuEN', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-8">
                                    <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Producto *</label>
                                        <Input value={item.Nombre_del_producto} onChange={(e) => handleItemChange(idx, 'Nombre_del_producto', e.target.value)} className="h-8 text-xs border-slate-200 font-medium text-slate-800" placeholder="Requerido" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad</label>
                                        <Input type="number" value={item.CANTIDAD} onChange={(e) => handleItemChange(idx, 'CANTIDAD', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Unidad</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.UNIDADES} onChange={(e) => handleItemChange(idx, 'UNIDADES', e.target.value)}>
                                            <option value="">Unidad...</option>
                                            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Costo</label>
                                        <Input type="number" value={item.COSTO} onChange={(e) => handleItemChange(idx, 'COSTO', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Merma (Ej. 0.1)</label>
                                        <Input type="number" value={item.Merma} onChange={(e) => handleItemChange(idx, 'Merma', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Área</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.Area} onChange={(e) => handleItemChange(idx, 'Area', e.target.value)}>
                                            <option value="">Área...</option>
                                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.GRUPO} onChange={(e) => handleItemChange(idx, 'GRUPO', e.target.value)}>
                                            <option value="">Grupo...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Proveedor</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.Proveedor} onChange={(e) => handleItemChange(idx, 'Proveedor', e.target.value)}>
                                            <option value="">Proveedor...</option>
                                            {allProveedores.map(p => <option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ubicación Física</label>
                                        <div className="flex gap-2">
                                            <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background flex-1"
                                                value={item.ALMACENAMIENTO.ALMACENAMIENTO} onChange={(e) => handleAlmacenamientoChange(idx, 'ALMACENAMIENTO', e.target.value)}>
                                                <option value="" disabled>Almacenamiento...</option>
                                                {BODEGA.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background flex-1"
                                                value={item.ALMACENAMIENTO.BODEGA} onChange={(e) => handleAlmacenamientoChange(idx, 'BODEGA', e.target.value)}>
                                                <option value="" disabled>Bodega...</option>
                                                {BODEGA.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Control de Stock</label>
                                        <div className="flex gap-2">
                                            <Input type="number" value={item.STOCK.minimo} onChange={(e) => handleStockChange(idx, 'minimo', e.target.value)} placeholder="Min" className="h-8 text-xs border-slate-200 flex-1" title="Stock Mínimo" />
                                            <Input type="number" value={item.STOCK.actual} onChange={(e) => handleStockChange(idx, 'actual', e.target.value)} placeholder="Actual" className="h-8 text-xs border-slate-200 flex-1" title="Stock Actual" />
                                            <Input type="number" value={item.STOCK.maximo} onChange={(e) => handleStockChange(idx, 'maximo', e.target.value)} placeholder="Max" className="h-8 text-xs border-slate-200 flex-1" title="Stock Máximo" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Add row button */}
                    <div className="flex justify-center mt-2">
                        <Button 
                            variant="outline" 
                            onClick={handleAddRow}
                            className="w-full max-w-md border-dashed border-2 border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 bg-transparent hover:bg-slate-100 h-12"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" /> Añadir Fila
                        </Button>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        {draftItems.length} {draftItems.length === 1 ? 'ítem en borrador' : 'ítems en borrador'}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isSaving} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Guardando...' : `Guardar ${draftItems.length > 1 ? 'Todos' : 'Ítem'}`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MacroAgregadorItems;
