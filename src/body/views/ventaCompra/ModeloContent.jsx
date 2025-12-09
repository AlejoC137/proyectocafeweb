import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateModelAction, createModelAction, getAllFromTable } from '../../../redux/actions';
import { STAFF } from '../../../redux/actions-types';

// --- UTILS ---
const formatNumber = (num) => (num === null || num === undefined || isNaN(parseFloat(num))) ? '' : Number(num).toLocaleString('es-ES');
const parseFormattedNumber = (str) => typeof str !== 'string' ? 0 : parseFloat(str.replace(/\./g, '')) || 0;
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

// --- UI COMPONENTS ---
const RowContainer = ({ children, onRemove }) => (
    <div className="flex items-center gap-0 border-b border-gray-100 bg-white hover:bg-blue-50 transition-colors group w-full py-1">
        {children}
        <button onClick={onRemove} className="w-8 text-gray-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
    </div>
);

const PurchasesModal = ({ isOpen, onClose, purchases, total }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Detalle de Compras ({purchases.length})</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="overflow-y-auto p-4 flex-grow">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0">
                            <tr>
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Concepto / Prov</th>
                                <th className="p-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {purchases.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-2 text-gray-500">{formatDate(p.Date)}</td>
                                    <td className="p-2">
                                        <div className="font-medium text-gray-800">{p.Concepto || p.Nombre_del_producto || 'Compra General'}</div>
                                        <div className="text-xs text-gray-400">{p.Proveedor_Id || p.Comprador}</div>
                                    </td>
                                    <td className="p-2 text-right font-medium text-gray-700">
                                        {(parseFloat(p.Valor || p.Total || 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold text-gray-800 sticky bottom-0">
                            <tr>
                                <td colSpan="2" className="p-2 text-right">Total:</td>
                                <td className="p-2 text-right">{total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ... (other components unchanged)

const ImpuestoRow = ({ impuesto, onUpdate, onRemove, totalRevenue }) => {
    const type = impuesto.type || 'fixed';
    const isAnnual = impuesto.isAnnual || false;
    const calculatedVal = useMemo(() => {
        if (type === 'percentage') return totalRevenue * (impuesto.rate || 0) / 100;
        return isAnnual ? (impuesto.value || 0) / 12 : impuesto.value || 0;
    }, [impuesto, type, isAnnual, totalRevenue]);

    return (
        <RowContainer onRemove={onRemove}>
            <div className="flex-grow px-3"><input type="text" value={impuesto.name} onChange={(e) => onUpdate({ ...impuesto, name: e.target.value })} className="w-full bg-transparent outline-none font-medium text-gray-700 text-sm" placeholder="Nombre Impuesto" /></div>
            <div className="w-24 flex justify-center"><button onClick={() => onUpdate({ ...impuesto, type: type === 'fixed' ? 'percentage' : 'fixed' })} className="px-2 py-0.5 text-[10px] uppercase border rounded bg-gray-50 text-gray-600 hover:border-blue-400">{type === 'fixed' ? '$ Fijo' : '% Venta'}</button></div>
            <div className="w-32 px-2 text-right">{type === 'fixed' ? <input type="text" value={formatNumber(impuesto.value)} onChange={(e) => onUpdate({ ...impuesto, value: parseFormattedNumber(e.target.value) })} className="w-full text-right bg-transparent outline-none text-sm" placeholder="$0" /> : <div className="flex justify-end gap-1 text-sm"><input type="number" value={impuesto.rate || ''} onChange={(e) => onUpdate({ ...impuesto, rate: parseFloat(e.target.value) })} className="w-12 text-right bg-transparent outline-none border-b border-gray-300 focus:border-blue-500" placeholder="0" /><span className="text-gray-500">%</span></div>}</div>
            <div className="w-32 px-3 text-right font-bold text-gray-800 text-sm bg-gray-50/50">{calculatedVal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div>
        </RowContainer>
    );
};

const EmployeeRow = ({ employee, onUpdate, onRemove }) => {
    const isManual = employee.totalValue !== undefined;
    const totalCost = isManual ? employee.totalValue : (employee.weeklyHours || 0) * (employee.hourlyRate || 0) * 4.33;

    return (
        <RowContainer onRemove={onRemove}>
            <div className="flex-grow px-3">
                <input type="text" value={employee.role} onChange={(e) => onUpdate({ ...employee, role: e.target.value })} className="w-full bg-transparent outline-none font-medium text-gray-700 text-sm" placeholder="Cargo / Rol" />
                {isManual && <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-1 rounded">Sincronizado</span>}
            </div>

            {!isManual ? (
                <>
                    <div className="w-24 flex items-center justify-center gap-1"><input type="number" value={employee.weeklyHours || ''} onChange={(e) => onUpdate({ ...employee, weeklyHours: parseFloat(e.target.value) })} className="w-10 text-center bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm" /><span className="text-[10px] text-gray-400">Hrs/sem</span></div>
                    <div className="w-32 px-2 text-right"><input type="text" value={formatNumber(employee.hourlyRate)} onChange={(e) => onUpdate({ ...employee, hourlyRate: parseFormattedNumber(e.target.value) })} className="w-full text-right bg-transparent outline-none text-sm" placeholder="Valor Hora" /></div>
                </>
            ) : (
                <div className="w-56 px-2 text-right text-xs text-gray-400 flex items-center justify-end">
                    Cálculo automático
                </div>
            )}

            <div className={`w-32 px-3 text-right font-bold text-sm bg-gray-50/50 ${isManual ? 'text-blue-600' : 'text-gray-800'}`}>
                {totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </div>
        </RowContainer>
    );
};

const SimpleCostRow = ({ cost, onUpdate, onRemove, label }) => (
    <RowContainer onRemove={onRemove}>
        <div className="flex-grow px-3">
            <input
                type="text"
                value={cost.name}
                onChange={(e) => onUpdate({ ...cost, name: e.target.value })}
                className="w-full bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-blue-300 rounded px-1 outline-none font-medium text-gray-700 text-sm transition-all"
                placeholder={label}
            />
        </div>
        <div className="w-24"></div>
        <div className="w-32 px-2 text-right">
            <input
                type="text"
                value={formatNumber(cost.value)}
                onChange={(e) => onUpdate({ ...cost, value: parseFormattedNumber(e.target.value) })}
                className="w-full text-right bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-blue-300 rounded px-1 outline-none text-sm transition-all"
                placeholder="$ Mensual"
            />
        </div>
        <div className="w-32 px-3 text-right font-bold text-gray-800 text-sm bg-gray-50/50">{(cost.value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div>
    </RowContainer>
);

// --- COMPONENTE PRINCIPAL ---
function ModeloContent({ targetMonth, targetYear }) {

    const dispatch = useDispatch();

    const allVentas = useSelector(state => state.allVentas);
    const allCompras = useSelector(state => state.allCompras);
    const models = useSelector(state => state.models);
    const staff = useSelector(state => state.allStaff);

    const [currentCosts, setCurrentCosts] = useState(null);
    const [modelId, setModelId] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showPurchasesModal, setShowPurchasesModal] = useState(false);
    const [purchasesList, setPurchasesList] = useState([]);

    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    useEffect(() => {
        dispatch(getAllFromTable(STAFF));
    }, [dispatch]);

    // 1. FILTRAR Y CALCULAR INGRESOS Y COMPRAS REALES
    const { realIncome, countVentas, realPurchases, purchasesDetail } = useMemo(() => {
        let totalIncome = 0;
        let count = 0;
        let totalPurchases = 0;
        let pList = [];

        // Ventas
        if (allVentas && Array.isArray(allVentas)) {
            allVentas.forEach(venta => {
                if (!venta.Date) return;
                const parts = venta.Date.split('/');
                if (parts.length === 3) {
                    const monthIndex = parseInt(parts[0]) - 1;
                    const year = parseInt(parts[2]);
                    if (monthIndex === targetMonth && year === targetYear) {
                        const ingreso = parseFloat(venta.Total_Ingreso) || 0;
                        totalIncome += ingreso;
                        count++;
                    }
                }
            });
        }

        // Compras
        if (allCompras && Array.isArray(allCompras)) {
            allCompras.forEach(compra => {
                if (!compra.Date) return;
                const d = new Date(compra.Date);
                const dLocal = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);

                if (dLocal.getMonth() === targetMonth && dLocal.getFullYear() === targetYear) {
                    const val = parseFloat(compra.Valor || compra.Total || 0);
                    totalPurchases += val;
                    pList.push(compra);
                }
            });
        }

        return { realIncome: totalIncome, countVentas: count, realPurchases: totalPurchases, purchasesDetail: pList };
    }, [allVentas, allCompras, targetMonth, targetYear]);

    useEffect(() => {
        setPurchasesList(purchasesDetail);
    }, [purchasesDetail]);

    // 2. CARGAR O INICIALIZAR
    useEffect(() => {
        const existingModel = models.find(m =>
            parseInt(m.costs?.linkedYear) === targetYear &&
            parseInt(m.costs?.linkedMonth) === targetMonth
        );

        if (existingModel) {
            setModelId(existingModel._id);
            let costs = JSON.parse(JSON.stringify(existingModel.costs));
            if (costs.impuesto && typeof costs.impuesto === 'string') {
                try { costs.impuestos = JSON.parse(costs.impuesto).impuestos || []; } catch { }
            }
            if (!costs.fijos) costs.fijos = [];
            if (!costs.compras) costs.compras = [];

            // Actualizar siempre el valor calculado de compras si existe el item "auto-compras"
            // Esto es opcional, depende si queremos que se actualice solo o permanezca fijo.
            // Por ahora, actualizamos el valor si es el item automático.
            const autoCompraIndex = costs.compras.findIndex(c => c.id === 'auto-compras');
            if (autoCompraIndex >= 0) {
                costs.compras[autoCompraIndex].value = realPurchases;
            } else if (realPurchases > 0 && costs.compras.length === 0) {
                costs.compras.push({ id: 'auto-compras', name: 'Compras Insumos (Calculado)', value: realPurchases });
            }

            setCurrentCosts(costs);
        } else {
            setModelId(null);
            setCurrentCosts({
                compras: [
                    { id: 'auto-compras', name: 'Compras Insumos (Calculado)', value: realPurchases }
                ],
                personal: [],
                fijos: [
                    { id: Date.now() + 1, name: 'Servicios Públicos', value: 0 },
                    { id: Date.now() + 2, name: 'Arriendo', value: 0 },
                ],
                impuestos: [],
                impuesto: JSON.stringify({ impuestos: [] }),
                otros: [],
                linkedMonth: targetMonth,
                linkedYear: targetYear
            });
        }
        setHasChanges(false);
    }, [models, targetMonth, targetYear, realPurchases]);

    // 3. HELPERS
    const handleUpdate = (key, data) => { setCurrentCosts(p => ({ ...p, [key]: data })); setHasChanges(true); };
    const updateItem = (key, item) => handleUpdate(key, currentCosts[key].map(i => i.id === item.id ? item : i));
    const addItem = (key, item) => handleUpdate(key, [...(currentCosts[key] || []), item]);
    const removeItem = (key, id) => handleUpdate(key, currentCosts[key].filter(i => i.id !== id));

    const handleSyncPayroll = () => {
        if (!staff || staff.length === 0) {
            alert("No hay datos de staff disponibles.");
            return;
        }

        // Calcular rango del mes
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

        const newPersonalRows = staff.map(persona => {
            // Lógica similar a CalculoNomina
            let turnos = [];
            try {
                turnos = typeof persona.Turnos === 'string' ? JSON.parse(persona.Turnos) : (persona.Turnos || []);
                if (!Array.isArray(turnos)) turnos = [turnos];
            } catch { turnos = []; }

            // Filtrar turnos del mes
            const turnosMes = turnos.filter(t => {
                const f = new Date(t.turnoDate || t.date);
                return f >= startOfMonth && f <= endOfMonth;
            });

            // Calcular horas
            const totalHoras = turnosMes.reduce((acc, t) => {
                if (!t.horaInicio || !t.horaSalida) return acc;
                const [h1, m1] = t.horaInicio.split(':').map(Number);
                const [h2, m2] = t.horaSalida.split(':').map(Number);
                const horas = (h2 - h1) + (m2 - m1) / 60;
                return acc + (horas > 0 ? horas : 0);
            }, 0);

            if (totalHoras === 0) return null;

            const rate = Number(persona.Rate) || 0;
            const base = totalHoras * rate;
            const seguridadSocial = base * 0.10; // 10% Seguridad estimada
            const totalValue = base + seguridadSocial;

            // Retornar objeto compatible con EmployeeRow pero con totalValue fijo
            return {
                id: persona._id,
                role: `${persona.Nombre} ${persona.Apellido} (${persona.Cargo})`,
                weeklyHours: 0, // No aplica
                hourlyRate: 0, // No aplica
                totalValue: totalValue,
                isSynced: true
            };
        }).filter(Boolean);

        if (newPersonalRows.length === 0) {
            alert("No se encontraron turnos registrados para este mes.");
            return;
        }

        if (window.confirm(`Se encontraron ${newPersonalRows.length} empleados con actividad en este mes. ¿Desea reemplazar la lista actual de personal?`)) {
            handleUpdate('personal', newPersonalRows);
        }
    };

    const totals = useMemo(() => {
        if (!currentCosts) return { compras: 0, personal: 0, fijos: 0, otros: 0, impuestos: 0, grand: 0 };
        const compras = (currentCosts.compras || []).reduce((a, x) => a + (x.value || 0), 0);

        // Updated Personal Calculation
        const personal = (currentCosts.personal || []).reduce((a, e) => {
            if (e.totalValue !== undefined) return a + e.totalValue;
            return a + (e.weeklyHours || 0) * (e.hourlyRate || 0) * 4.33;
        }, 0);

        const fijos = (currentCosts.fijos || []).reduce((a, x) => a + (x.value || 0), 0);
        const otros = (currentCosts.otros || []).reduce((a, x) => a + (x.value || 0), 0);
        const impuestos = (currentCosts.impuestos || []).reduce((a, t) => {
            if (t.type === 'percentage') return a + (realIncome * (t.rate || 0) / 100);
            return a + (t.isAnnual ? (t.value || 0) / 12 : t.value || 0);
        }, 0);
        return { compras, personal, fijos, otros, impuestos, grand: compras + personal + fijos + otros + impuestos };
    }, [currentCosts, realIncome]);

    const handleSave = () => {
        const costsToSave = JSON.parse(JSON.stringify(currentCosts));
        costsToSave.impuesto = JSON.stringify({ impuestos: costsToSave.impuestos });
        delete costsToSave.impuestos;

        const idToSave = modelId || uuidv4();
        const payload = {
            name: `Contabilidad ${monthsNames[targetMonth]} ${targetYear}`,
            costs: costsToSave,
            requireSells: 0,
            esquema: {},
            _id: idToSave
        };

        if (modelId) {
            dispatch(updateModelAction(modelId, payload));
            alert("Modelo actualizado correctamente.");
        } else {
            dispatch(createModelAction(payload));
            alert("Modelo creado correctamente.");
        }
        setHasChanges(false);
    };

    if (!currentCosts) return <div className="p-10 w-screen">Cargando...</div>;
    const utilidadNeta = realIncome - totals.grand;
    const margen = realIncome > 0 ? (utilidadNeta / realIncome) * 100 : 0;

    return (
        <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-white p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex flex-wrap justify-between items-end border-b pb-4 sticky top-0 bg-white z-10 pt-2">
                        <div><h1 className="text-3xl font-bold text-gray-800">{monthsNames[targetMonth]} <span className="text-gray-400">{targetYear}</span></h1><p className="text-sm text-gray-500">{modelId ? 'Hoja activa' : 'Borrador'}</p></div>
                        <div className="flex items-center gap-4"><div className="text-right"><div className="text-xs text-gray-400 font-bold uppercase">Ventas ({countVentas})</div><div className="text-2xl font-bold text-green-600">{realIncome.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div></div><button onClick={handleSave} disabled={!hasChanges && modelId} className={`px-6 py-2 rounded-lg font-bold shadow-md ${hasChanges || !modelId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400'}`}>{modelId ? (hasChanges ? 'Guardar Cambios' : 'Guardado') : 'Crear Hoja'}</button></div>
                    </div>

                    <section>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-700">Costos de Ventas (Compras/Insumos)</h3>
                            <span className="text-sm font-medium text-gray-500">{totals.compras.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                            {(currentCosts.compras || []).map(i => (
                                <div key={i.id} className="relative">
                                    <SimpleCostRow cost={i} label="Descripción" onUpdate={(it) => updateItem('compras', it)} onRemove={() => removeItem('compras', i.id)} />
                                    {i.id === 'auto-compras' && (
                                        <button
                                            onClick={() => setShowPurchasesModal(true)}
                                            className="absolute right-40 top-1.5 text-blue-500 hover:text-blue-700 text-xs font-bold border rounded px-2 py-1 bg-blue-50"
                                            title="Ver detalle de compras calculadas"
                                        >
                                            Ver Detalle
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => addItem('compras', { id: Date.now(), name: '', value: 0 })} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Costo Variable</button>
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-700">Personal</h3>
                                <button onClick={handleSyncPayroll} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 hover:scale-105 transition-transform">
                                    🔄 Sincronizar Nómina
                                </button>
                            </div>
                            <span className="text-sm font-medium text-gray-500">{totals.personal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                            {(currentCosts.personal || []).map(i => <EmployeeRow key={i.id} employee={i} onUpdate={(it) => updateItem('personal', it)} onRemove={() => removeItem('personal', i.id)} />)}
                            <button onClick={() => addItem('personal', { id: Date.now(), role: '', weeklyHours: 48, hourlyRate: 0 })} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Empleado</button>
                        </div>
                    </section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Costos Fijos</h3><span className="text-sm font-medium text-gray-500">{totals.fijos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.fijos || []).map(i => <SimpleCostRow key={i.id} cost={i} label="Concepto" onUpdate={(it) => updateItem('fijos', it)} onRemove={() => removeItem('fijos', i.id)} />)}<button onClick={() => addItem('fijos', { id: Date.now(), name: '', value: 0 })} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Costo Fijo</button></div></section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Impuestos</h3><span className="text-sm font-medium text-gray-500">{totals.impuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.impuestos || []).map(i => <ImpuestoRow key={i.id} impuesto={i} totalRevenue={realIncome} onUpdate={(it) => updateItem('impuestos', it)} onRemove={() => removeItem('impuestos', i.id)} />)}<button onClick={() => addItem('impuestos', { id: Date.now(), name: '', value: 0, type: 'percentage', rate: 0 })} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Impuesto</button></div></section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Otros</h3><span className="text-sm font-medium text-gray-500">{totals.otros.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.otros || []).map(i => <SimpleCostRow key={i.id} cost={i} label="Descripción" onUpdate={(it) => updateItem('otros', it)} onRemove={() => removeItem('otros', i.id)} />)}<button onClick={() => addItem('otros', { id: Date.now(), name: '', value: 0 })} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Otro Gasto</button></div></section>
                </div>
            </div>
            <div className="w-full lg:w-96 bg-gray-50 border-l border-gray-200 p-6 flex-shrink-0 flex flex-col shadow-inner h-full overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wider border-b pb-2">Balance</h3>
                <div className={`p-6 rounded-2xl text-white shadow-lg mb-6 ${utilidadNeta >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}><div className="text-white/80 text-xs font-bold uppercase mb-1">Utilidad Neta</div><div className="text-3xl font-bold mb-2">{utilidadNeta.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div><div className="text-xs bg-white/20 inline-block px-2 py-1 rounded font-bold">{margen.toFixed(1)}% Margen</div></div>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between font-bold text-green-600"><span>Ventas</span><span>{realIncome.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <hr />
                    <div className="flex justify-between"><span>Compras (Costo Venta)</span><span>{totals.compras.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Personal</span><span>{totals.personal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Fijos</span><span>{totals.fijos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Impuestos</span><span>{totals.impuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Otros</span><span>{totals.otros.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <hr />
                </div>
            </div>
            <PurchasesModal
                isOpen={showPurchasesModal}
                onClose={() => setShowPurchasesModal(false)}
                purchases={purchasesList}
                total={realPurchases}
            />
        </div>
    );
}

export default ModeloContent;