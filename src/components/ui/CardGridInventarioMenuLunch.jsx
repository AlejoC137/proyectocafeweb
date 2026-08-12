import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateItem, crearItem, deleteItem } from "../../redux/actions-Proveedores";
import { getAllFromTable } from "../../redux/actions";
import { CardInstanceInventarioMenuLunch } from "./CardInstanceInventarioMenuLunch";
import { MENU, TARDEO_ALMUERZO, TARDEO } from "../../redux/actions-types";
import AccionesRapidasMenuLunch from "../../body/views/actualizarPrecioUnitario/AccionesRapidasMenuLunch";
import MenuLunchImportModal from "../../body/views/actualizarPrecioUnitario/MenuLunchImportModal";
import { Sparkles } from "lucide-react";

// Sub-components
import ViewToggle from "./CardGridInventarioMenuLunchComponents/ViewToggle";
import LunchModal from "./CardGridInventarioMenuLunchComponents/LunchModal";
import LunchCalendarView from "./CardGridInventarioMenuLunchComponents/LunchCalendarView";

// Re-export LunchModal to maintain 100% backwards compatibility
export { LunchModal };

// --- Componente Principal ---
export function CardGridInventarioMenuLunch({ products, showEdit }) {
    const [viewMode, setViewMode] = useState('calendar');
    const [searchTerm, setSearchTerm] = useState("");
    const [modalState, setModalState] = useState({ isOpen: false, mode: null, data: null });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const dispatch = useDispatch();

    const handleOpenModal = (mode, data = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, mode: null, data: null });
    };

    const handleNewForm = () => {
        handleOpenModal('create');
    };

    const handleSaveLunch = async (nombreES, compLunchData, productId) => {
        if (modalState.mode === 'create') {
            const fechas = compLunchData?.fechasSeleccionadas?.length > 0 
                ? compLunchData.fechasSeleccionadas 
                : [compLunchData?.fecha?.fecha || new Date().toISOString().split('T')[0]];

            try {
                for (const fechaStr of fechas) {
                    const diaSemana = new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
                    const compParaFecha = {
                        ...compLunchData,
                        fechasSeleccionadas: [fechaStr],
                        fecha: { fecha: fechaStr, dia: diaSemana }
                    };
                    const finalCompLunchData = JSON.stringify(compParaFecha);
                    
                    const newProduct = {
                        NombreES: nombreES,
                        SUB_GRUPO: TARDEO_ALMUERZO,
                        Comp_Lunch: finalCompLunchData,
                        Precio: 22000,
                        GRUPO: TARDEO,
                        Estado: "Activo",
                    };
                    await dispatch(crearItem(newProduct, MENU));
                }
                await dispatch(getAllFromTable(MENU));
                alert(`✅ ¡Almuerzo(s) creado(s) con éxito! (${fechas.length} fechas)`);
                handleCloseModal();
            } catch (error) {
                alert('❌ Error al crear el almuerzo.');
                console.error(error);
                throw error;
            }
        } else if (modalState.mode === 'edit') {
            const fechaStr = compLunchData?.fechasSeleccionadas?.[0] || compLunchData?.fecha?.fecha;
            const diaSemana = fechaStr ? new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' }) : '';
            const compParaFecha = {
                ...compLunchData,
                fechasSeleccionadas: fechaStr ? [fechaStr] : [],
                fecha: { fecha: fechaStr, dia: diaSemana }
            };
            const finalCompLunchData = JSON.stringify(compParaFecha);

            const updatedData = {
                NombreES: nombreES,
                Comp_Lunch: finalCompLunchData,
            };
            try {
                await dispatch(updateItem(productId, updatedData, MENU));
                await dispatch(getAllFromTable(MENU));
                alert('✅ ¡Almuerzo actualizado con éxito!');
                handleCloseModal();
            } catch (error) {
                alert('❌ Error al actualizar el almuerzo.');
                console.error(error);
                throw error;
            }
        }
    };

    const handleDeleteLunch = async (productId, productName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el almuerzo "${productName}"?`)) {
            try {
                await dispatch(deleteItem(productId, MENU));
                await dispatch(getAllFromTable(MENU));
                alert('🗑️ Almuerzo eliminado correctamente.');
            } catch (error) {
                alert('❌ Error al eliminar el almuerzo.');
                console.error("Error al eliminar:", error);
            }
        }
    };

    const lunchProducts = products.filter(p => p.SUB_GRUPO === TARDEO_ALMUERZO);
    const filteredProducts = lunchProducts.filter(p => searchTerm === "" || p.NombreES.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderContent = () => {
        if (filteredProducts.length === 0 && viewMode !== 'calendar') {
            return <div className="text-center py-16 text-gray-500">No se encontraron almuerzos.</div>;
        }

        switch (viewMode) {
            case 'calendar':
                return <LunchCalendarView
                    products={lunchProducts}
                    onAddNew={handleNewForm}
                    onEditLunch={(product) => handleOpenModal('edit', product)}
                    onDeleteLunch={handleDeleteLunch}
                    showEdit={showEdit}
                />;
            case 'cards':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <CardInstanceInventarioMenuLunch key={product._id} product={product} showEdit={showEdit} />
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4 p-3 bg-white rounded-lg shadow-sm border">
                <input
                    type="text"
                    placeholder="Buscar almuerzos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md w-full max-w-sm"
                    disabled={viewMode === 'calendar'}
                />
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 rounded-md font-bold text-sm transition-colors shadow-sm"
                        title="Importar menú desde JSON usando IA"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">Importar JSON</span>
                    </button>
                    <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
            </div>

            {showEdit && <AccionesRapidasMenuLunch />}
            {renderContent()}

            <LunchModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onSave={handleSaveLunch}
                productToEdit={modalState.mode === 'edit' ? modalState.data : null}
                initialDates={[]}
            />

            {isImportModalOpen && (
                <MenuLunchImportModal
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => dispatch(getAllFromTable(MENU))}
                />
            )}
        </div>
    );
}