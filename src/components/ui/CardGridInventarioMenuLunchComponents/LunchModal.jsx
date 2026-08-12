import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import FormularioMenuAlmuerzo from "../../../body/views/actualizarPrecioUnitario/FormularioMenuAlmuerzo";

export const LunchModal = ({ isOpen, onClose, onSave, productToEdit, initialDates = [] }) => {
    const [nombreES, setNombreES] = useState('');
    const [compLunchData, setCompLunchData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const allMenu = useSelector((state) => state.allMenu || []);
    const availableLunches = allMenu.filter(item => item.SUB_GRUPO === 'TARDEO_ALMUERZO');

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setNombreES(productToEdit.NombreES);
                try {
                    const parsedData = (productToEdit.Comp_Lunch && typeof productToEdit.Comp_Lunch === 'string')
                        ? JSON.parse(productToEdit.Comp_Lunch)
                        : (productToEdit.Comp_Lunch || null);
                    setCompLunchData(parsedData);
                } catch (e) {
                    console.error("Error al parsear Comp_Lunch para editar:", e);
                    setCompLunchData(null);
                }
            } else {
                setNombreES('');
                setCompLunchData({
                    fechasSeleccionadas: initialDates.filter(d => d !== "Sin Fecha"),
                    fecha: initialDates.length > 0 && initialDates[0] !== "Sin Fecha" ? {
                        fecha: initialDates[0],
                        dia: new Date(initialDates[0] + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })
                    } : { dia: "", fecha: "" }
                });
            }
        }
    }, [productToEdit, isOpen, initialDates]);

    if (!isOpen) return null;

    const initialData = productToEdit ? compLunchData : null;

    const handleSave = async () => {
        if (!nombreES.trim()) {
            alert("El nombre del menú no puede estar vacío.");
            return;
        }
        if (onSave && !isSaving) {
            setIsSaving(true);
            try {
                await onSave(nombreES, compLunchData, productToEdit?._id);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {productToEdit ? `Editando: ${productToEdit.NombreES}` : 'Crear Nuevo Almuerzo'}
                    </h2>
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Menú (NombreES)</label>
                        <input
                            type="text"
                            value={nombreES}
                            onChange={(e) => setNombreES(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="Ej: Almuerzo Ejecutivo del Viernes"
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <FormularioMenuAlmuerzo
                        initialData={initialData}
                        onMenuChange={setCompLunchData}
                        availableLunches={availableLunches}
                        currentProductId={productToEdit?._id}
                        nombreES={nombreES}
                    />
                </div>
                <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 flex items-center min-w-[150px] justify-center">
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LunchModal;
