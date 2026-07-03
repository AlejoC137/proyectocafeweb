import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllFromTable, crearItem } from '../../../redux/actions';
import { STAFF, MENU } from '../../../redux/actions-types';
import { Coffee, User, Plus, Trash2, CheckCircle, Search, Calendar, ArrowLeft } from 'lucide-react';
import PageLayout from '../../../components/ui/page-layout';

const ConsumoStaffView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Selectores de Redux
    const allStaff = useSelector((state) => state.allStaff || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const currentStaff = useSelector((state) => state.currentStaff);

    // Estados locales
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [searchItemTerm, setSearchItemTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
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

    // Opciones para el datalist
    const menuOptions = useMemo(() => {
        return allMenu
            .filter(item => item.NombreES)
            .sort((a, b) => a.NombreES.localeCompare(b.NombreES));
    }, [allMenu]);

    const handleAddItem = () => {
        if (!searchItemTerm) return;
        
        const product = allMenu.find(item => item.NombreES === searchItemTerm);
        if (!product) {
            setMessage({ type: 'error', text: 'El producto ingresado no existe en el menú.' });
            return;
        }

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
        setSearchItemTerm('');
        setQuantity(1);
        setMessage(null);
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
                Date: new Date(selectedDate).toISOString(), // Fecha seleccionada en formato ISO completo
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

    const headerActions = (
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all text-sm font-semibold"
        >
            <ArrowLeft className="w-4 h-4" />
            Volver
        </button>
    );

    return (
        <PageLayout 
            title={
                <span className="flex items-center gap-3">
                    <Coffee className="w-8 h-8 text-amber-500" />
                    Registrar Consumo Personal
                </span>
            } 
            actions={headerActions}
        >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 animate-fade-in w-full max-w-4xl mx-auto">
                {message && (
                    <div className={`p-4 mb-6 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                        message.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <CheckCircle className="w-4 h-4" />
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                {allStaff
                                    .filter(staff => staff.Contratacion !== false && staff.Contratacion !== "false")
                                    .map((staff) => (
                                    <option key={staff._id} value={staff._id}>
                                        {staff.Nombre} {staff.Apellido || ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Fecha */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                ¿Cuándo se consumió?
                            </label>
                            <input
                                type="datetime-local"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition"
                                required
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Buscador/Añadidor de Items */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Añadir Productos al Consumo</h3>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    list="menu-options-datalist"
                                    placeholder="Escribe para buscar y seleccionar producto..."
                                    value={searchItemTerm}
                                    onChange={(e) => setSearchItemTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition shadow-sm"
                                />
                                <datalist id="menu-options-datalist">
                                    {menuOptions.map((item) => (
                                        <option key={item._id} value={item.NombreES} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="w-full md:w-32">
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition shadow-sm"
                                    placeholder="Cant."
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Añadir
                            </button>
                        </div>
                    </div>

                    {/* Items Añadidos */}
                    {consumedItems.length > 0 && (
                        <div className="space-y-3 animate-fade-in">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Productos Seleccionados</h3>
                            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50">
                                {consumedItems.map((item, index) => (
                                    <div key={item._id} className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-amber-100 text-amber-800 text-sm font-extrabold px-3 py-1 rounded-full border border-amber-200">
                                                {item.quantity}x
                                            </span>
                                            <span className="font-medium text-slate-800 text-lg">{item.NombreES}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar producto"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={loading || consumedItems.length === 0}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all text-lg"
                        >
                            <CheckCircle className="w-6 h-6" />
                            {loading ? 'Registrando...' : 'Confirmar y Guardar Consumo'}
                        </button>
                    </div>
                </form>
            </div>
        </PageLayout>
    );
};

export default ConsumoStaffView;
