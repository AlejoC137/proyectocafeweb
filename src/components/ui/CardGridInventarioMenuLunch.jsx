import { updateItem, crearItem, deleteItem } from "../../redux/actions-Proveedores";
import { getAllFromTable } from "../../redux/actions";

import React, { useState, useEffect } from "react";
import { CardInstanceInventarioMenuLunch } from "./CardInstanceInventarioMenuLunch";
import { useDispatch } from "react-redux";
import { MENU, TARDEO_ALMUERZO, TARDEO } from "../../redux/actions-types";
import AccionesRapidasMenuLunch from "../../body/views/actualizarPrecioUnitario/AccionesRapidasMenuLunch";
import FormularioMenuAlmuerzo from "../../body/views/actualizarPrecioUnitario/FormularioMenuAlmuerzo";

// --- Componente de Toggle para cambiar la vista ---
const ViewToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onViewModeChange('cards')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'cards' 
            ? 'bg-white text-blue-600 shadow' 
            : 'bg-transparent text-gray-600 hover:bg-gray-200'
        }`}
      >
        📇 Tarjetas
      </button>
      <button
        onClick={() => onViewModeChange('calendar')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'calendar' 
            ? 'bg-white text-blue-600 shadow' 
            : 'bg-transparent text-gray-600 hover:bg-gray-200'
        }`}
        >
        📅 Calendario
      </button>
    </div>
  );
};

// --- Modal Unificado para Crear y Editar Almuerzos ---
const LunchModal = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [nombreES, setNombreES] = useState('');
    const [compLunchData, setCompLunchData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                // --- Modo Edición ---
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
                // --- Modo Creación ---
                setNombreES(''); // Inicia con nombre vacío
                setCompLunchData(null); // Inicia sin datos de formulario
            }
        }
    }, [productToEdit, isOpen]);

    if (!isOpen) return null;
    
    // Si estamos editando, pasamos los datos. Si no, pasamos null para que el formulario se muestre vacío.
    const initialData = productToEdit ? compLunchData : null;

    const handleSave = async () => {
        if (!nombreES.trim()) {
            alert("El nombre del menú no puede estar vacío.");
            return;
        }
        if (onSave && !isSaving) {
            setIsSaving(true);
            try {
                // Le pasamos los datos del formulario (compLunchData) que se han ido actualizando
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


// --- Vista de Calendario ---
const LunchCalendarView = ({ products, onAddNew, onEditLunch, onDeleteLunch, showEdit }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const CalendarCard = ({ product, showEdit, onEditLunch, onDeleteLunch }) => {
        let compLunchData = null;
        try {
            compLunchData = (product.Comp_Lunch && typeof product.Comp_Lunch === 'string') 
                ? JSON.parse(product.Comp_Lunch) 
                : product.Comp_Lunch;
        } catch (error) { /* Fallback UI */ }

        const proteina = compLunchData?.proteina?.nombre || 'N/A';
        const totalPedidos = compLunchData?.lista?.length || 0;

        const handleDeleteClick = (e) => {
            e.stopPropagation(); 
            onDeleteLunch(product._id, product.NombreES);
        };

        return (
            <div 
                onClick={() => showEdit && onEditLunch(product)} 
                className={`bg-white border rounded-lg p-2 my-1 shadow-sm text-xs relative ${showEdit ? 'cursor-pointer hover:shadow-md hover:border-blue-400' : ''}`}
            >
                {showEdit && (
                    <button 
                        onClick={handleDeleteClick}
                        className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-20"
                        title={`Eliminar ${product.NombreES}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}

                <p className="font-bold text-blue-800 truncate mb-2 pr-6">{product.NombreES}</p>
                <div className="flex items-center gap-1.5 text-gray-700">
                    <span title="Proteína">🥩</span>
                    <p className="">{proteina}</p>
                </div>
                <hr className="my-2" />
{/*                 <div className="flex items-center justify-end gap-1.5 text-gray-600">
                    <span title="Total de Pedidos">📋</span>
                    <p className="font-semibold">{totalPedidos} Pedidos</p>
                </div> */}
            </div>
        );
    };

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const getMonthName = (date) => date.toLocaleString('es-ES', { month: 'long' });
    const getYear = (date) => date.getFullYear();

    const productsByDate = products.reduce((acc, product) => {
        try {
            const compLunchObj = (typeof product.Comp_Lunch === 'string') ? JSON.parse(product.Comp_Lunch) : product.Comp_Lunch;
            if (compLunchObj?.fecha?.fecha) {
                const date = compLunchObj.fecha.fecha;
                if (!acc[date]) acc[date] = [];
                acc[date].push(product);
            }
        } catch (e) { console.error("Error parsing Comp_Lunch:", e); }
        return acc;
    }, {});

    const renderCalendarGrid = () => {
        const totalDays = daysInMonth(currentDate);
        const firstDayOfMonth = startOfMonth(currentDate).getDay();
        const calendarDays = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-start-${i}`} className="border-t border-r bg-gray-50 min-h-[10rem]"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayProducts = productsByDate[dateStr] || [];
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            calendarDays.push(
                <div key={day} className="border-t border-r p-2 min-h-[10rem] overflow-y-auto relative flex flex-col">
                    <div className={`text-xs font-bold self-start ${isToday ? 'bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-600'}`}>
                        {day}
                    </div>
                    <div className="mt-1 flex-grow">
                        {dayProducts.map(p => 
                            <CalendarCard 
                                key={p._id} 
                                product={p} 
                                showEdit={showEdit}
                                onEditLunch={onEditLunch}
                                onDeleteLunch={onDeleteLunch}
                            />
                        )}
                    </div>
                    {/* Se añade un botón general para crear un nuevo almuerzo sin fecha específica */}
                    {showEdit && (
                        <div className="absolute bottom-1 right-1">
                          <button 
                            onClick={onAddNew} 
                            className="bg-gray-100 text-gray-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-200 hover:text-green-800"
                            title="Crear nuevo almuerzo"
                          >
                              +
                          </button>
                        </div>
                    )}
                </div>
            );
        }
        
        const remainingCells = (7 - (calendarDays.length % 7)) % 7;
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                calendarDays.push(<div key={`empty-end-${i}`} className="border-t border-r bg-gray-50 min-h-[10rem]"></div>);
            }
        }
        return calendarDays;
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
             <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="px-4 py-2 bg-gray-100 rounded-lg">‹</button>
                <h2 className="text-xl font-bold">{getMonthName(currentDate)} {getYear(currentDate)}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="px-4 py-2 bg-gray-100 rounded-lg">›</button>
            </div>
            <div className="grid grid-cols-7 text-xs text-center font-bold text-gray-500 border-l border-t border-b">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="py-2 border-r bg-gray-50">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 border-l border-b">
                {renderCalendarGrid()}
            </div>
        </div>
    );
};


// --- Componente Principal ---
export function CardGridInventarioMenuLunch({ products, showEdit }) {
  const [viewMode, setViewMode] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, data: null });
  const dispatch = useDispatch();

  const handleOpenModal = (mode, data = null) => {
    setModalState({ isOpen: true, mode, data });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, mode: null, data: null });
  };

  // Esta es la nueva función que abre el modal en modo creación sin datos
  const handleNewForm = () => {
    handleOpenModal('create');
  };

  const handleSaveLunch = async (nombreES, compLunchData, productId) => {
    const finalCompLunchData = compLunchData ? JSON.stringify(compLunchData) : null;
    
    if (modalState.mode === 'create') {
        const newProduct = {
            NombreES: nombreES,
            SUB_GRUPO: TARDEO_ALMUERZO,
            Comp_Lunch: finalCompLunchData,
            Precio: 22000,
            GRUPO: TARDEO,
            Estado: "Activo",
        };
        try {
            await dispatch(crearItem(newProduct, MENU));
            await dispatch(getAllFromTable(MENU));
            alert('✅ ¡Almuerzo creado con éxito!');
            handleCloseModal();
        } catch (error) {
            alert('❌ Error al crear el almuerzo.');
            console.error(error);
            throw error;
        }
    } else if (modalState.mode === 'edit') {
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
    
    switch(viewMode) {
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
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {showEdit && <AccionesRapidasMenuLunch currentType={MENU} />}
      {renderContent()}

      <LunchModal 
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLunch}
        productToEdit={modalState.mode === 'edit' ? modalState.data : null}
      />
    </div>
  );
}