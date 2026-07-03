import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable, crearItem } from '../../../redux/actions';
import { STAFF, MENU } from '../../../redux/actions-types';
import { Coffee, User, Plus, Trash2, CheckCircle } from 'lucide-react';

const ConsumoStaffView = () => {
    const dispatch = useDispatch();
    
    // Selectores de Redux
    const allStaff = useSelector((state) => state.allStaff || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const currentStaff = useSelector((state) => state.currentStaff);

    // Estados locales
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [consumedItems, setConsumedItems] = useState([]);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Cargar datos al montar
    useEffect(() => {
        dispatch(getAllFromTable(STAFF));
        dispatch(getAllFromTable(MENU));
    }, [dispatch]);

    // Pre-seleccionar el staff logueado si existe
    useEffect(() => {
        if (currentStaff && currentStaff._id) {
            setSelectedStaffId(currentStaff._id);
        }
    }, [currentStaff]);

    // Filtrar menú para mostrar solo productos válidos
    const menuOptions = useMemo(() => {
        return allMenu
            .filter(item => item.NombreES)
            .sort((a, b) => a.NombreES.localeCompare(b.NombreES));
    }, [allMenu]);

    const handleAddItem = () => {
        if (!selectedProductId) return;
        
        const product = allMenu.find(item => item._id === selectedProductId);
        if (!product) return;

        // Verificar si ya está en la lista para sumarle cantidad
        const existingIndex = consumedItems.findIndex(item => item._id === product._id);
        if (existingIndex > -1) {
            const updated = [...consumedItems];
            updated[existingIndex].quantity += Number(quantity);
            setConsumedItems(updated);
        } else {
            setConsumedItems([
                ...consumedItems,
                {
                    _id: product._id,
                    NombreES: product.NombreES,
                    Receta: product.Receta || null,
                    quantity: Number(quantity)
                }
            ]);
        }

        // Reset inputs
        setSelectedProductId('');
        setQuantity(1);
    };

    const handleRemoveItem = (index) => {
        setConsumedItems(consumedItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaffId) {
            setMessage({ type: 'error', text: 'Por favor, selecciona un miembro del staff.' });
            return;
        }
        if (consumedItems.length === 0) {
            setMessage({ type: 'error', text: 'Debes añadir al menos un producto consumido.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // Formatear datos de consumo
            const consumoData = {
                staff_id: selectedStaffId,
                Date: new Date().toISOString(), // Fecha en formato ISO completo
                Productos: JSON.stringify(consumedItems.map(item => ({
                    NombreES: item.NombreES,
                    quantity: item.quantity,
                    Receta: item.Receta
                })))
            };

            // Usamos crearItem que realiza el insert en Supabase
            // "ConsumoStaff" es el nombre físico de la tabla en Supabase
            await dispatch(crearItem(consumoData, "ConsumoStaff"));

            setMessage({ type: 'success', text: '¡Consumo registrado exitosamente!' });
            setConsumedItems([]);
        } catch (error) {
            console.error('Error registrando consumo:', error);
            setMessage({ type: 'error', text: 'Ocurrió un error al registrar el consumo. Intente de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl mt-10 font-sans border border-gray-100">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                <Coffee className="w-8 h-8 text-amber-500" />
                Registrar Consumo Personal
            </h2>

            {message && (
                <div className={`p-4 mb-6 rounded-xl border text-sm font-medium ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selector de Staff */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        ¿Quién consume?
                    </label>
                    <select
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        disabled={!!currentStaff}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 text-slate-800 transition"
                        required
                    >
                        <option value="">Selecciona tu nombre...</option>
                        {allStaff.map((staff) => (
                            <option key={staff._id} value={staff._id}>
                                {staff.Nombre} {staff.Apellido || ''}
                            </option>
                        ))}
                    </select>
                </div>

                <hr className="border-slate-100" />

                {/* Buscador/Añadidor de Items */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Añadir Productos</h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition"
                            >
                                <option value="">Selecciona un producto del menú...</option>
                                {menuOptions.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.NombreES}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-28">
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition"
                                placeholder="Cant."
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            <Plus className="w-5 h-5" />
                            Añadir
                        </button>
                    </div>
                </div>

                {/* Items Añadidos */}
                {consumedItems.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Productos Seleccionados</h3>
                        <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                            {consumedItems.map((item, index) => (
                                <div key={item._id} className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
                                            {item.quantity}x
                                        </span>
                                        <span className="font-medium text-slate-800">{item.NombreES}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-red-500 hover:text-red-700 p-1 transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || consumedItems.length === 0}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition text-lg"
                >
                    <CheckCircle className="w-5 h-5" />
                    {loading ? 'Registrando...' : 'Confirmar y Guardar Consumo'}
                </button>
            </form>
        </div>
    );
};

export default ConsumoStaffView;
