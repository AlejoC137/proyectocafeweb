import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X, Trash2 } from "lucide-react";
import { MenuItems, AREAS, CATEGORIES, unidades, BODEGA, SUB_CATEGORIES, ESTATUS } from "../../../redux/actions-types";

const JsonImportReviewModal = ({ items, onClose, onSave, currentType, allProveedores = [] }) => {
    const [draftItems, setDraftItems] = useState(() => {
        // Parse strings if needed on initialization
        return items.map(item => {
            let stock = item.STOCK;
            if (typeof stock === 'string') {
                try { stock = JSON.parse(stock); } catch (e) { stock = { minimo: 0, actual: 0, maximo: 0 }; }
            }
            
            let alm = item.ALMACENAMIENTO;
            if (typeof alm === 'string') {
                try { 
                    alm = JSON.parse(alm); 
                    // Fallback si el json parseado no es un objeto con esas keys
                    if (typeof alm !== 'object' || alm === null) {
                        alm = { ALMACENAMIENTO: item.ALMACENAMIENTO || "", BODEGA: "" };
                    }
                } catch (e) { 
                    alm = { ALMACENAMIENTO: alm || "", BODEGA: "" }; 
                }
            } else if (!alm || typeof alm !== 'object') {
                alm = { ALMACENAMIENTO: "", BODEGA: "" };
            }

            return {
                ...item,
                STOCK: stock || { minimo: 0, actual: 0, maximo: 0 },
                ALMACENAMIENTO: alm
            };
        });
    });

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
            onClose();
        }
    };

    const isMenu = currentType === MenuItems;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* HEADER */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Revisión Detallada de Ítems a Importar
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Revisa y edita toda la información de cada ítem antes de guardarlos en la base de datos.
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
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0 rounded-md" title="Eliminar ítem de la lista">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Ítem {idx + 1}</h3>

                            {isMenu ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-8">
                                    <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre (ES)</label>
                                        <Input value={item.NombreES || item.nombre || item.name || ''} onChange={(e) => handleItemChange(idx, 'NombreES', e.target.value)} className="h-8 text-xs border-slate-200 font-medium text-slate-800" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre (EN)</label>
                                        <Input value={item.NombreEN || item.englishName || ''} onChange={(e) => handleItemChange(idx, 'NombreEN', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Precio</label>
                                        <Input type="number" value={item.Precio || item.price || item.precio || ''} onChange={(e) => handleItemChange(idx, 'Precio', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.Estado || 'Activo'} onChange={(e) => handleItemChange(idx, 'Estado', e.target.value)}>
                                            <option value="">Estado...</option>
                                            {ESTATUS.map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.GRUPO || item.category || item.grupo || ''} onChange={(e) => handleItemChange(idx, 'GRUPO', e.target.value)}>
                                            <option value="">Grupo...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sub Grupo</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.SUB_GRUPO || item.subcategory || ''} onChange={(e) => handleItemChange(idx, 'SUB_GRUPO', e.target.value)}>
                                            <option value="">Sub Grupo...</option>
                                            {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Foto (URL)</label>
                                        <Input value={item.Foto || item.image || ''} onChange={(e) => handleItemChange(idx, 'Foto', e.target.value)} className="h-8 text-xs border-slate-200" placeholder="URL de la imagen" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción (ES)</label>
                                        <Input value={item.DescripcionMenuES || item.description || ''} onChange={(e) => handleItemChange(idx, 'DescripcionMenuES', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción (EN)</label>
                                        <Input value={item.DescripcionMenuEN || item.englishDescription || ''} onChange={(e) => handleItemChange(idx, 'DescripcionMenuEN', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-8">
                                    <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Producto</label>
                                        <Input value={item.Nombre_del_producto || item.nombre || item.name || ''} onChange={(e) => handleItemChange(idx, 'Nombre_del_producto', e.target.value)} className="h-8 text-xs border-slate-200 font-medium text-slate-800" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad</label>
                                        <Input type="number" value={item.CANTIDAD || item.cantidad || item.quantity || ''} onChange={(e) => handleItemChange(idx, 'CANTIDAD', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Unidad</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.UNIDADES || item.unidades || item.units || ''} onChange={(e) => handleItemChange(idx, 'UNIDADES', e.target.value)}>
                                            <option value="">Unidad...</option>
                                            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Costo</label>
                                        <Input type="number" value={item.COSTO || item.costo || item.cost || ''} onChange={(e) => handleItemChange(idx, 'COSTO', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Merma (Ej. 0.1)</label>
                                        <Input type="number" value={item.Merma || item.merma || '0'} onChange={(e) => handleItemChange(idx, 'Merma', e.target.value)} className="h-8 text-xs border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Área</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.Area || item.area || ''} onChange={(e) => handleItemChange(idx, 'Area', e.target.value)}>
                                            <option value="">Área...</option>
                                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.GRUPO || item.grupo || item.category || ''} onChange={(e) => handleItemChange(idx, 'GRUPO', e.target.value)}>
                                            <option value="">Grupo...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Proveedor</label>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background"
                                            value={item.Proveedor || ''} onChange={(e) => handleItemChange(idx, 'Proveedor', e.target.value)}>
                                            <option value="">Proveedor...</option>
                                            {allProveedores.map(p => <option key={p._id} value={p._id}>{p.Nombre_Proveedor}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ubicación Física</label>
                                        <div className="flex gap-2">
                                            <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background flex-1"
                                                value={item.ALMACENAMIENTO?.ALMACENAMIENTO || ''} onChange={(e) => handleAlmacenamientoChange(idx, 'ALMACENAMIENTO', e.target.value)}>
                                                <option value="" disabled>Almacenamiento...</option>
                                                {BODEGA.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background flex-1"
                                                value={item.ALMACENAMIENTO?.BODEGA || ''} onChange={(e) => handleAlmacenamientoChange(idx, 'BODEGA', e.target.value)}>
                                                <option value="" disabled>Bodega...</option>
                                                {BODEGA.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Control de Stock</label>
                                        <div className="flex gap-2">
                                            <Input type="number" value={item.STOCK?.minimo || ''} onChange={(e) => handleStockChange(idx, 'minimo', e.target.value)} placeholder="Min" className="h-8 text-xs border-slate-200 flex-1" title="Stock Mínimo" />
                                            <Input type="number" value={item.STOCK?.actual || ''} onChange={(e) => handleStockChange(idx, 'actual', e.target.value)} placeholder="Actual" className="h-8 text-xs border-slate-200 flex-1" title="Stock Actual" />
                                            <Input type="number" value={item.STOCK?.maximo || ''} onChange={(e) => handleStockChange(idx, 'maximo', e.target.value)} placeholder="Max" className="h-8 text-xs border-slate-200 flex-1" title="Stock Máximo" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        {draftItems.length} {draftItems.length === 1 ? 'ítem listo' : 'ítems listos'}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                            Cancelar
                        </Button>
                        <Button onClick={() => onSave(draftItems)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar {draftItems.length > 1 ? 'Todos' : 'Ítem'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonImportReviewModal;
