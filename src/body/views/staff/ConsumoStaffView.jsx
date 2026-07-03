import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllFromTable, crearItem } from '../../../redux/actions';
import { STAFF, MENU } from '../../../redux/actions-types';
import { Coffee, User, Plus, Trash2, CheckCircle, Search, Calendar, ArrowLeft, CheckSquare, Square, X, Users, Loader2 } from 'lucide-react';
import PageLayout from '../../../components/ui/page-layout';

const ConsumoStaffView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Selectores de Redux
    const allStaff = useSelector((state) => state.allStaff || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const currentStaff = useSelector((state) => state.currentStaff);

    // Estados locales
    const [selectedStaffIds, setSelectedStaffIds] = useState(new Set());
    const [staffSearchTerm, setStaffSearchTerm] = useState('');
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
            setSelectedStaffIds(new Set([currentStaff._id]));
        }
    }, [currentStaff]);

    // Staff activo
    const activeStaff = useMemo(() => {
        return allStaff
            .filter(staff => staff.Contratacion !== false && staff.Contratacion !== "false")
            .sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || ''));
    }, [allStaff]);

    // Staff filtrado por búsqueda
    const filteredStaff = useMemo(() => {
        if (!staffSearchTerm) return activeStaff;
        const term = staffSearchTerm.toLowerCase();
        return activeStaff.filter(s => 
            `${s.Nombre} ${s.Apellido || ''}`.toLowerCase().includes(term)
        );
    }, [activeStaff, staffSearchTerm]);

    // Opciones para el datalist
    const menuOptions = useMemo(() => {
        return allMenu.filter(item => item.NombreES).sort((a, b) => a.NombreES.localeCompare(b.NombreES));
    }, [allMenu]);

    // Toggle selección de staff
    const toggleStaff = (id) => {
        setSelectedStaffIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const removeStaff = (id) => {
        setSelectedStaffIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    // Nombres de los seleccionados
    const selectedStaffNames = useMemo(() => {
        return Array.from(selectedStaffIds).map(id => {
            const s = allStaff.find(st => st._id === id);
            return s ? { _id: id, name: `${s.Nombre} ${s.Apellido || ''}`.trim() } : null;
        }).filter(Boolean);
    }, [selectedStaffIds, allStaff]);

    const handleAddItem = () => {
        if (!searchItemTerm) return;
        const product = allMenu.find(item => item.NombreES === searchItemTerm);
        if (!product) {
            setMessage({ type: 'error', text: 'El producto ingresado no existe en el menú.' });
            return;
        }
        const existingIndex = consumedItems.findIndex(item => item._id === product._id);
        if (existingIndex > -1) {
            const updated = [...consumedItems];
            updated[existingIndex].quantity += Number(quantity);
            setConsumedItems(updated);
        } else {
            setConsumedItems([...consumedItems, {
                _id: product._id, NombreES: product.NombreES,
                Receta: product.Receta || null, quantity: Number(quantity)
            }]);
        }
        setSearchItemTerm('');
        setQuantity(1);
        setMessage(null);
    };

    const handleRemoveItem = (index) => setConsumedItems(consumedItems.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedStaffIds.size === 0) {
            setMessage({ type: 'error', text: 'Selecciona al menos una persona.' });
            return;
        }
        if (consumedItems.length === 0) {
            setMessage({ type: 'error', text: 'Debes añadir al menos un producto consumido.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const dateISO = new Date(selectedDate).toISOString();
            const productosJSON = JSON.stringify(consumedItems.map(item => ({
                NombreES: item.NombreES, quantity: item.quantity,
                Receta: item.Receta, tipo: 'eventual'
            })));

            // Crear un registro idéntico para CADA persona seleccionada
            const promises = Array.from(selectedStaffIds).map(staffId => {
                const consumoData = {
                    staff_id: staffId,
                    Date: dateISO,
                    Productos: productosJSON,
                    tipo: 'eventual'
                };
                return dispatch(crearItem(consumoData, "ConsumoStaff"));
            });

            await Promise.all(promises);

            const count = selectedStaffIds.size;
            setMessage({ type: 'success', text: `¡Consumo registrado para ${count} persona${count > 1 ? 's' : ''} exitosamente!` });
            setConsumedItems([]);
        } catch (error) {
            console.error('Error registrando consumo:', error);
            setMessage({ type: 'error', text: 'Ocurrió un error al registrar el consumo. Intente de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout 
            title={
                <span className="flex items-center gap-3">
                    <Coffee className="w-8 h-8 text-amber-500" />
                    Registrar Consumo Personal
                </span>
            } 
            actions={
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all text-sm font-semibold">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
            }
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
                    {/* Selector de Staff — Multi-selección */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            ¿Quiénes consumen?
                            {selectedStaffIds.size > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {selectedStaffIds.size} seleccionado{selectedStaffIds.size > 1 ? 's' : ''}
                                </span>
                            )}
                        </label>

                        {/* Chips de seleccionados */}
                        {selectedStaffNames.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedStaffNames.map(s => (
                                    <span key={s._id} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-sm font-medium pl-3 pr-1.5 py-1.5 rounded-full border border-blue-200">
                                        {s.name}
                                        <button type="button" onClick={() => removeStaff(s._id)} className="p-0.5 hover:bg-blue-200 rounded-full transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Buscador de staff */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar empleado por nombre..."
                                value={staffSearchTerm}
                                onChange={(e) => setStaffSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            />
                        </div>

                        {/* Lista de checkboxes */}
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
                            {filteredStaff.map(staff => {
                                const isSelected = selectedStaffIds.has(staff._id);
                                return (
                                    <div key={staff._id}
                                        onClick={() => toggleStaff(staff._id)}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${
                                            isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        {isSelected
                                            ? <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                            : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                        }
                                        <span className={`text-sm ${isSelected ? 'font-semibold text-blue-800' : 'text-slate-700'}`}>
                                            {staff.Nombre} {staff.Apellido || ''}
                                        </span>
                                        {staff.Cargo && <span className="text-xs text-slate-400 ml-auto">{staff.Cargo}</span>}
                                    </div>
                                );
                            })}
                            {filteredStaff.length === 0 && (
                                <p className="text-center py-4 text-sm text-slate-400">No se encontraron empleados</p>
                            )}
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            ¿Cuándo se consumió?
                        </label>
                        <input
                            type="datetime-local" value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition"
                            required
                        />
                    </div>

                    <hr className="border-slate-100" />

                    {/* Buscador/Añadidor de Items */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Añadir Productos al Consumo</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input type="text" list="menu-options-datalist"
                                    placeholder="Escribe para buscar y seleccionar producto..."
                                    value={searchItemTerm} onChange={(e) => setSearchItemTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition shadow-sm" />
                                <datalist id="menu-options-datalist">
                                    {menuOptions.map((item) => (<option key={item._id} value={item.NombreES} />))}
                                </datalist>
                            </div>
                            <div className="w-full md:w-32">
                                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition shadow-sm" placeholder="Cant." />
                            </div>
                            <button type="button" onClick={handleAddItem}
                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                                <Plus className="w-5 h-5" /> Añadir
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
                                        <button type="button" onClick={() => handleRemoveItem(index)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar producto">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {selectedStaffIds.size > 1 && (
                                <p className="text-sm text-blue-600 font-medium bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                    ℹ️ Estos productos se registrarán de forma idéntica para cada una de las {selectedStaffIds.size} personas seleccionadas.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <button type="submit" disabled={loading || consumedItems.length === 0 || selectedStaffIds.size === 0}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all text-lg">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                            {loading
                                ? 'Registrando...'
                                : selectedStaffIds.size > 1
                                    ? `Guardar Consumo para ${selectedStaffIds.size} personas`
                                    : 'Confirmar y Guardar Consumo'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </PageLayout>
    );
};

export default ConsumoStaffView;
