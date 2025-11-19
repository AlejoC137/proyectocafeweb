import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateModelAction, createModelAction } from '../../../redux/actions';

// --- UTILS ---
const formatNumber = (num) => (num === null || num === undefined || isNaN(parseFloat(num))) ? '' : Number(num).toLocaleString('es-ES');
const parseFormattedNumber = (str) => typeof str !== 'string' ? 0 : parseFloat(str.replace(/\./g, '')) || 0;

// --- UI COMPONENTS ---
const RowContainer = ({ children, onRemove }) => (
    <div className="flex items-center gap-0 border-b border-gray-100 bg-white hover:bg-blue-50 transition-colors group w-full py-1">
        {children}
        <button onClick={onRemove} className="w-8 text-gray-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
    </div>
);

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
    const totalCost = (employee.weeklyHours || 0) * (employee.hourlyRate || 0) * 4.33;
    return (
        <RowContainer onRemove={onRemove}>
            <div className="flex-grow px-3"><input type="text" value={employee.role} onChange={(e) => onUpdate({ ...employee, role: e.target.value })} className="w-full bg-transparent outline-none font-medium text-gray-700 text-sm" placeholder="Cargo / Rol"/></div>
            <div className="w-24 flex items-center justify-center gap-1"><input type="number" value={employee.weeklyHours || ''} onChange={(e) => onUpdate({ ...employee, weeklyHours: parseFloat(e.target.value) })} className="w-10 text-center bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm"/><span className="text-[10px] text-gray-400">Hrs/sem</span></div>
            <div className="w-32 px-2 text-right"><input type="text" value={formatNumber(employee.hourlyRate)} onChange={(e) => onUpdate({ ...employee, hourlyRate: parseFormattedNumber(e.target.value) })} className="w-full text-right bg-transparent outline-none text-sm" placeholder="Valor Hora"/></div>
            <div className="w-32 px-3 text-right font-bold text-gray-800 text-sm bg-gray-50/50">{totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div>
        </RowContainer>
    );
};

const SimpleCostRow = ({ cost, onUpdate, onRemove, label }) => (
    <RowContainer onRemove={onRemove}>
        <div className="flex-grow px-3"><input type="text" value={cost.name} onChange={(e) => onUpdate({ ...cost, name: e.target.value })} className="w-full bg-transparent outline-none font-medium text-gray-700 text-sm" placeholder={label}/></div>
        <div className="w-24"></div>
        <div className="w-32 px-2 text-right"><input type="text" value={formatNumber(cost.value)} onChange={(e) => onUpdate({ ...cost, value: parseFormattedNumber(e.target.value) })} className="w-full text-right bg-transparent outline-none text-sm" placeholder="$ Mensual"/></div>
        <div className="w-32 px-3 text-right font-bold text-gray-800 text-sm bg-gray-50/50">{(cost.value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div>
    </RowContainer>
);

// --- COMPONENTE PRINCIPAL ---
function ModeloContent({ targetMonth, targetYear }) {
    console.log( targetMonth, targetYear);
    
    const dispatch = useDispatch();
    
    const allVentas = useSelector(state => state.allVentas);
    const models = useSelector(state => state.models);

    const [currentCosts, setCurrentCosts] = useState(null);
    const [modelId, setModelId] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // 1. FILTRAR Y CALCULAR INGRESOS REALES (MM/DD/AAAA)
    const { realIncome, countVentas } = useMemo(() => {
        if (!allVentas || !Array.isArray(allVentas)) return { realIncome: 0, countVentas: 0 };
        
        let total = 0;
        let count = 0;

        allVentas.forEach(venta => {
            if (!venta.Date) return;
            
            // Parseo estricto MM/DD/AAAA
            const parts = venta.Date.split('/');
            if (parts.length === 3) {
                const monthIndex = parseInt(parts[0]) - 1; // EL MES ES EL PRIMERO (1-12)
                const year = parseInt(parts[2]);           // EL AÑO ES EL TERCERO

                if (monthIndex === targetMonth && year === targetYear) {
                    const ingreso = parseFloat(venta.Total_Ingreso) || 0;
                    total += ingreso;
                    count++;
                }
                console.log( parts);
            }
        });

        return { realIncome: total, countVentas: count };
    }, [allVentas, targetMonth, targetYear]);

    // 2. CARGAR O INICIALIZAR
    useEffect(() => {
        const existingModel = models.find(m => 
            parseInt(m.costs?.linkedYear) === targetYear && 
            parseInt(m.costs?.linkedMonth) === targetMonth
        );

        if (existingModel) {
            setModelId(existingModel._id);
            let costs = JSON.parse(JSON.stringify(existingModel.costs));
            if(costs.impuesto && typeof costs.impuesto === 'string') { 
                try { costs.impuestos = JSON.parse(costs.impuesto).impuestos || []; } catch {} 
            }
            if(!costs.fijos) costs.fijos = [];
            setCurrentCosts(costs);
        } else {
            setModelId(null);
            setCurrentCosts({
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
    }, [models, targetMonth, targetYear]);

    // 3. HELPERS
    const handleUpdate = (key, data) => { setCurrentCosts(p => ({ ...p, [key]: data })); setHasChanges(true); };
    const updateItem = (key, item) => handleUpdate(key, currentCosts[key].map(i => i.id === item.id ? item : i));
    const addItem = (key, item) => handleUpdate(key, [...(currentCosts[key]||[]), item]);
    const removeItem = (key, id) => handleUpdate(key, currentCosts[key].filter(i => i.id !== id));

    const totals = useMemo(() => {
        if (!currentCosts) return { personal: 0, fijos: 0, otros: 0, impuestos: 0, grand: 0 };
        const personal = (currentCosts.personal || []).reduce((a, e) => a + (e.weeklyHours||0)*(e.hourlyRate||0)*4.33, 0);
        const fijos = (currentCosts.fijos || []).reduce((a, x) => a + (x.value||0), 0);
        const otros = (currentCosts.otros || []).reduce((a, x) => a + (x.value||0), 0);
        const impuestos = (currentCosts.impuestos || []).reduce((a, t) => {
            if (t.type === 'percentage') return a + (realIncome * (t.rate||0) / 100);
            return a + (t.isAnnual ? (t.value||0)/12 : t.value||0);
        }, 0);
        return { personal, fijos, otros, impuestos, grand: personal + fijos + otros + impuestos };
    }, [currentCosts, realIncome]);

    const handleSave = () => {
        const costsToSave = JSON.parse(JSON.stringify(currentCosts));
        costsToSave.impuesto = JSON.stringify({ impuestos: costsToSave.impuestos });
        delete costsToSave.impuestos;
        const payload = { name: `Contabilidad ${monthsNames[targetMonth]} ${targetYear}`, costs: costsToSave, requireSells: 0, esquema: {} };
        
        if (modelId) dispatch(updateModelAction(modelId, payload));
        else dispatch(createModelAction(payload));
        setHasChanges(false);
    };

    if (!currentCosts) return <div className="p-10">Cargando...</div>;
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

                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Personal</h3><span className="text-sm font-medium text-gray-500">{totals.personal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.personal || []).map(i => <EmployeeRow key={i.id} employee={i} onUpdate={(it) => updateItem('personal', it)} onRemove={() => removeItem('personal', i.id)} />)}<button onClick={() => addItem('personal', {id: Date.now(), role: '', weeklyHours: 48, hourlyRate: 0})} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Empleado</button></div></section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Costos Fijos</h3><span className="text-sm font-medium text-gray-500">{totals.fijos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.fijos || []).map(i => <SimpleCostRow key={i.id} cost={i} label="Concepto" onUpdate={(it) => updateItem('fijos', it)} onRemove={() => removeItem('fijos', i.id)} />)}<button onClick={() => addItem('fijos', {id: Date.now(), name: '', value: 0})} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Costo Fijo</button></div></section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Impuestos</h3><span className="text-sm font-medium text-gray-500">{totals.impuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.impuestos || []).map(i => <ImpuestoRow key={i.id} impuesto={i} totalRevenue={realIncome} onUpdate={(it) => updateItem('impuestos', it)} onRemove={() => removeItem('impuestos', i.id)} />)}<button onClick={() => addItem('impuestos', {id: Date.now(), name: '', value: 0, type: 'percentage', rate: 0})} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Impuesto</button></div></section>
                    <section><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Otros</h3><span className="text-sm font-medium text-gray-500">{totals.otros.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div><div className="bg-white border rounded-lg overflow-hidden shadow-sm">{(currentCosts.otros || []).map(i => <SimpleCostRow key={i.id} cost={i} label="Descripción" onUpdate={(it) => updateItem('otros', it)} onRemove={() => removeItem('otros', i.id)} />)}<button onClick={() => addItem('otros', {id: Date.now(), name: '', value: 0})} className="w-full py-2 text-sm text-blue-500 font-medium text-left px-4">+ Otro Gasto</button></div></section>
                </div>
            </div>
            <div className="w-full lg:w-96 bg-gray-50 border-l border-gray-200 p-6 flex-shrink-0 flex flex-col shadow-inner h-full overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wider border-b pb-2">Balance</h3>
                <div className={`p-6 rounded-2xl text-white shadow-lg mb-6 ${utilidadNeta >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}><div className="text-white/80 text-xs font-bold uppercase mb-1">Utilidad Neta</div><div className="text-3xl font-bold mb-2">{utilidadNeta.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</div><div className="text-xs bg-white/20 inline-block px-2 py-1 rounded font-bold">{margen.toFixed(1)}% Margen</div></div>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between font-bold text-green-600"><span>Ventas</span><span>{realIncome.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <hr />
                    <div className="flex justify-between"><span>Personal</span><span>{totals.personal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Fijos</span><span>{totals.fijos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Impuestos</span><span>{totals.impuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <div className="flex justify-between"><span>Otros</span><span>{totals.otros.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                    <hr />
                    <div className="flex justify-between font-bold text-red-500 text-lg"><span>Gastos</span><span>{totals.grand.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                </div>
            </div>
        </div>
    );
}

export default ModeloContent;