import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllFromTable, crearItem } from '../../../redux/actions';
import { STAFF, MENU, CONSUMO_STAFF } from '../../../redux/actions-types';
import {
    Coffee, User, Plus, Trash2, CheckCircle, Search, Calendar,
    ArrowLeft, ShieldAlert, ClipboardList, Zap, History,
    CheckSquare, Square, Users, Clock, Loader2
} from 'lucide-react';
import PageLayout from '../../../components/ui/page-layout';

// --- Utilidad: Determinar si un staff trabaja un día dado según TurnosSet ---
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function isStaffWorkingOnDate(staff, dateStr) {
    if (!staff.TurnosSet) return false;
    let turnosSet;
    try {
        turnosSet = typeof staff.TurnosSet === 'string' ? JSON.parse(staff.TurnosSet) : staff.TurnosSet;
    } catch { return false; }

    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayName = DAY_NAMES[dateObj.getDay()];
    const dayConfig = turnosSet[dayName];

    if (!dayConfig) return false;
    if (dayConfig.descanso === true) return false;

    // Soporte quincenal (biweekly)
    if (dayConfig.biweekly && dayConfig.fechaInicio) {
        const refDate = new Date(dayConfig.fechaInicio + 'T12:00:00');
        const diffMs = dateObj - refDate;
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks % 2 !== 0) return false;
    }

    return true;
}

function getShiftHours(staff, dateStr) {
    if (!staff.TurnosSet) return null;
    let turnosSet;
    try {
        turnosSet = typeof staff.TurnosSet === 'string' ? JSON.parse(staff.TurnosSet) : staff.TurnosSet;
    } catch { return null; }
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayName = DAY_NAMES[dateObj.getDay()];
    const dayConfig = turnosSet[dayName];
    if (!dayConfig || dayConfig.descanso) return null;
    return { inicio: dayConfig.inicio || '—', fin: dayConfig.fin || '—' };
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================
const ConsumoAdminView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Selectores de Redux
    const allStaff = useSelector((state) => state.allStaff || []);
    const allMenu = useSelector((state) => state.allMenu || []);
    const allConsumoStaff = useSelector((state) => state.allConsumoStaff || []);
    const currentStaff = useSelector((state) => state.currentStaff);

    const isAdmin = currentStaff?.isAdmin === true;

    // --- ESTADOS COMUNES ---
    const [activeTab, setActiveTab] = useState('manual');
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- ESTADOS: Pestaña Manual ---
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [searchItemTerm, setSearchItemTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [quantity, setQuantity] = useState(1);
    const [consumedItems, setConsumedItems] = useState([]);

    // --- ESTADOS: Pestaña Programado ---
    const [progDate, setProgDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [progSearchTerm, setProgSearchTerm] = useState('');
    const [progSelectedStaff, setProgSelectedStaff] = useState(new Set());
    const [progQuantity, setProgQuantity] = useState(1);

    // --- ESTADOS: Pestaña Historial ---
    const [histDate, setHistDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Cargar datos al montar
    useEffect(() => {
        dispatch(getAllFromTable(STAFF));
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(CONSUMO_STAFF));
    }, [dispatch]);

    // Opciones para datalists
    const menuOptions = useMemo(() => {
        return allMenu.filter(item => item.NombreES).sort((a, b) => a.NombreES.localeCompare(b.NombreES));
    }, [allMenu]);

    const activeStaff = useMemo(() => {
        return allStaff
            .filter(staff => staff.Contratacion !== false && staff.Contratacion !== "false")
            .sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || ''));
    }, [allStaff]);

    // ================================================================
    // PESTAÑA 1: MANUAL
    // ================================================================
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

    const handleSubmitManual = async (e) => {
        e.preventDefault();
        if (!selectedStaffId) { setMessage({ type: 'error', text: 'Selecciona un miembro del staff.' }); return; }
        if (consumedItems.length === 0) { setMessage({ type: 'error', text: 'Debes añadir al menos un producto.' }); return; }

        setLoading(true); setMessage(null);
        try {
            const consumoData = {
                staff_id: selectedStaffId,
                Date: new Date(selectedDate).toISOString(),
                Productos: JSON.stringify(consumedItems.map(item => ({
                    NombreES: item.NombreES, quantity: item.quantity,
                    Receta: item.Receta, tipo: 'eventual'
                }))),
                tipo: 'eventual'
            };
            await dispatch(crearItem(consumoData, "ConsumoStaff"));
            await dispatch(getAllFromTable(CONSUMO_STAFF));
            setMessage({ type: 'success', text: '¡Consumo registrado exitosamente!' });
            setConsumedItems([]);
        } catch (error) {
            console.error('Error registrando consumo:', error);
            setMessage({ type: 'error', text: 'Error al registrar. Verifique que la tabla ConsumoStaff exista en Supabase.' });
        } finally { setLoading(false); }
    };

    // ================================================================
    // PESTAÑA 2: PROGRAMADO
    // ================================================================
    const staffWorkingOnProgDate = useMemo(() => {
        return activeStaff.filter(s => isStaffWorkingOnDate(s, progDate));
    }, [activeStaff, progDate]);

    // Inicializar selección cuando cambia la fecha
    useEffect(() => {
        setProgSelectedStaff(new Set(staffWorkingOnProgDate.map(s => s._id)));
    }, [staffWorkingOnProgDate]);

    const toggleStaffSelection = (id) => {
        setProgSelectedStaff(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const selectAllStaff = () => setProgSelectedStaff(new Set(staffWorkingOnProgDate.map(s => s._id)));
    const deselectAllStaff = () => setProgSelectedStaff(new Set());

    const handleSubmitProgramado = async () => {
        if (!progSearchTerm) { setMessage({ type: 'error', text: 'Selecciona un producto para asignar.' }); return; }
        const product = allMenu.find(item => item.NombreES === progSearchTerm);
        if (!product) { setMessage({ type: 'error', text: 'El producto no existe en el menú.' }); return; }
        if (progSelectedStaff.size === 0) { setMessage({ type: 'error', text: 'Selecciona al menos un empleado.' }); return; }

        setLoading(true); setMessage(null);
        try {
            const dateISO = new Date(progDate + 'T12:00:00').toISOString();
            const promises = Array.from(progSelectedStaff).map(staffId => {
                const consumoData = {
                    staff_id: staffId,
                    Date: dateISO,
                    Productos: JSON.stringify([{
                        NombreES: product.NombreES,
                        quantity: Number(progQuantity),
                        Receta: product.Receta || null,
                        tipo: 'programado'
                    }]),
                    tipo: 'programado'
                };
                return dispatch(crearItem(consumoData, "ConsumoStaff"));
            });
            await Promise.all(promises);
            await dispatch(getAllFromTable(CONSUMO_STAFF));
            setMessage({ type: 'success', text: `¡${progSelectedStaff.size} consumos programados creados exitosamente!` });
            setProgSearchTerm('');
        } catch (error) {
            console.error('Error creando consumos programados:', error);
            setMessage({ type: 'error', text: 'Error al crear consumos. Verifique que la tabla ConsumoStaff exista en Supabase.' });
        } finally { setLoading(false); }
    };

    // ================================================================
    // PESTAÑA 3: HISTORIAL
    // ================================================================
    const historialDelDia = useMemo(() => {
        return allConsumoStaff
            .filter(c => {
                if (!c.Date) return false;
                const cDate = new Date(c.Date).toISOString().split('T')[0];
                return cDate === histDate;
            })
            .map(c => {
                const staffMember = allStaff.find(s => s._id === c.staff_id);
                let productos = [];
                try { productos = typeof c.Productos === 'string' ? JSON.parse(c.Productos) : (c.Productos || []); } catch {}
                return {
                    ...c,
                    staffName: staffMember ? `${staffMember.Nombre} ${staffMember.Apellido || ''}` : 'Desconocido',
                    productos,
                    tipo: c.tipo || (productos[0]?.tipo) || 'eventual',
                    hora: c.Date ? new Date(c.Date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'
                };
            })
            .sort((a, b) => new Date(b.Date) - new Date(a.Date));
    }, [allConsumoStaff, histDate, allStaff]);

    // --- GUARD: Solo admins ---
    if (!isAdmin) {
        return (
            <PageLayout title="Acceso Restringido">
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-400" />
                    <h2 className="text-2xl font-bold text-slate-700">Acceso Denegado</h2>
                    <p className="text-slate-500 max-w-md">Esta sección es exclusiva para administradores.</p>
                    <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                </div>
            </PageLayout>
        );
    }

    const tabs = [
        { id: 'manual', label: 'Registro Manual', icon: ClipboardList },
        { id: 'programado', label: 'Consumo Programado', icon: Zap },
        { id: 'historial', label: 'Historial del Día', icon: History },
    ];

    return (
        <PageLayout
            title={
                <span className="flex items-center gap-3">
                    <Coffee className="w-8 h-8 text-amber-500" />
                    Gestión de Consumos
                    <span className="bg-primary-stitch text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                </span>
            }
            actions={
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all text-sm font-semibold">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
            }
        >
            {/* Mensaje global */}
            {message && (
                <div className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {message.text}
                </div>
            )}

            {/* Pestañas */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setMessage(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ============= TAB: MANUAL ============= */}
            {activeTab === 'manual' && (
                <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-sm p-6 md:p-8 animate-fade-in">
                    <form onSubmit={handleSubmitManual} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-500" /> ¿Para quién?
                                </label>
                                <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition" required>
                                    <option value="">Selecciona un empleado...</option>
                                    {activeStaff.map(s => <option key={s._id} value={s._id}>{s.Nombre} {s.Apellido || ''}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500" /> Fecha y hora
                                </label>
                                <input type="datetime-local" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition" required />
                            </div>
                        </div>
                        <hr className="border-slate-100" />
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Añadir Productos</h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input type="text" list="menu-dl-manual" placeholder="Buscar producto..." value={searchItemTerm}
                                        onChange={(e) => setSearchItemTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 transition shadow-sm" />
                                    <datalist id="menu-dl-manual">
                                        {menuOptions.map(i => <option key={i._id} value={i.NombreES} />)}
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
                        {consumedItems.length > 0 && (
                            <div className="space-y-3 animate-fade-in">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Productos Seleccionados</h3>
                                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50">
                                    {consumedItems.map((item, index) => (
                                        <div key={item._id} className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-4">
                                                <span className="bg-amber-100 text-amber-800 text-sm font-extrabold px-3 py-1 rounded-full border border-amber-200">{item.quantity}x</span>
                                                <span className="font-medium text-slate-800 text-lg">{item.NombreES}</span>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <button type="submit" disabled={loading || consumedItems.length === 0}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all text-lg">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                {loading ? 'Registrando...' : 'Confirmar y Guardar Consumo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ============= TAB: PROGRAMADO ============= */}
            {activeTab === 'programado' && (
                <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-sm p-6 md:p-8 animate-fade-in space-y-6">
                    {/* Controles superiores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" /> Fecha
                            </label>
                            <input type="date" value={progDate} onChange={(e) => setProgDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Search className="w-4 h-4 text-slate-500" /> Producto a asignar
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                <input type="text" list="menu-dl-prog" placeholder="Buscar producto..." value={progSearchTerm}
                                    onChange={(e) => setProgSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition" />
                                <datalist id="menu-dl-prog">
                                    {menuOptions.map(i => <option key={i._id} value={i.NombreES} />)}
                                </datalist>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">Cantidad por persona</label>
                            <input type="number" min="1" value={progQuantity} onChange={(e) => setProgQuantity(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition" />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Info del día */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                                Staff programado para {new Date(progDate + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                <Users className="w-4 h-4 inline mr-1" />
                                {staffWorkingOnProgDate.length} empleados trabajan · {progSelectedStaff.size} seleccionados
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={selectAllStaff} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                                Seleccionar todos
                            </button>
                            <button onClick={deselectAllStaff} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">
                                Deseleccionar
                            </button>
                        </div>
                    </div>

                    {/* Lista de staff */}
                    {staffWorkingOnProgDate.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No hay empleados con turno configurado para este día.</p>
                            <p className="text-sm mt-1">Verifica que los empleados tengan su TurnosSet definido.</p>
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                            {staffWorkingOnProgDate.map(staff => {
                                const shift = getShiftHours(staff, progDate);
                                const isSelected = progSelectedStaff.has(staff._id);
                                return (
                                    <div key={staff._id}
                                        onClick={() => toggleStaffSelection(staff._id)}
                                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                                            isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        {isSelected
                                            ? <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
                                            : <Square className="w-5 h-5 text-slate-300 shrink-0" />
                                        }
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800">{staff.Nombre} {staff.Apellido || ''}</p>
                                            <p className="text-xs text-slate-500">{staff.Cargo || 'Sin cargo'}</p>
                                        </div>
                                        {shift && (
                                            <span className="flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                <Clock className="w-3.5 h-3.5" />
                                                {shift.inicio} — {shift.fin}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Botón de generar */}
                    <div className="pt-4">
                        <button onClick={handleSubmitProgramado}
                            disabled={loading || progSelectedStaff.size === 0 || !progSearchTerm}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all text-lg">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                            {loading ? 'Generando...' : `Generar ${progSelectedStaff.size} Consumos Programados`}
                        </button>
                    </div>
                </div>
            )}

            {/* ============= TAB: HISTORIAL ============= */}
            {activeTab === 'historial' && (
                <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-sm p-6 md:p-8 animate-fade-in space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" /> Ver consumos del día
                            </label>
                            <input type="date" value={histDate} onChange={(e) => setHistDate(e.target.value)}
                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition" />
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-2xl font-extrabold text-slate-800">{historialDelDia.length}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Registros</p>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {historialDelDia.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Sin consumos registrados para esta fecha.</p>
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                            {historialDelDia.map((record, idx) => (
                                <div key={record._id || idx} className="p-4 bg-white hover:bg-slate-50/50 transition">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold text-slate-800">{record.staffName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{record.hora}</span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                record.tipo === 'programado'
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                            }`}>
                                                {record.tipo === 'programado' ? '⚡ Programado' : '📝 Eventual'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 ml-7">
                                        {record.productos.map((prod, pIdx) => (
                                            <span key={pIdx} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                                                {prod.quantity || 1}x {prod.NombreES}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </PageLayout>
    );
};

export default ConsumoAdminView;
