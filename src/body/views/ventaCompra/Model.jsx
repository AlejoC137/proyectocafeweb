import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModelsAction, createModelAction, updateModelAction, deleteModelAction, getAllFromTable } from '../../../redux/actions';
import { MENU, RECETAS_MENU } from '../../../redux/actions-types';

// --- FUNCIONES AUXILIARES PARA FORMATEO DE NÚMEROS ---
/**
 * Formatea un número a un string con separadores de miles (puntos).
 * @param {number | string} num El número a formatear.
 * @returns {string} El número formateado o un string vacío.
 */
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(parseFloat(num))) {
        return '';
    }
    // Usamos 'es-ES' porque utiliza el punto como separador de miles, que es lo que buscas.
    return Number(num).toLocaleString('es-ES'); 
};

/**
 * Convierte un string de número formateado (con puntos) a un número puro.
 * @param {string} str El string formateado.
 * @returns {number} El número parseado.
 */
const parseFormattedNumber = (str) => {
    if (typeof str !== 'string') return 0;
    // Elimina todos los puntos (separadores de miles)
    const cleanedString = str.replace(/\./g, '');
    // Reemplaza la coma decimal por un punto si es necesario (para compatibilidad internacional)
    // const finalString = cleanedString.replace(/,/, '.');
    return parseFloat(cleanedString) || 0;
};


// --- COMPONENTE DE FILA DE IMPUESTO (ACTUALIZADO CON FORMATO) ---
const ImpuestoRow = ({ impuesto, onUpdate, onRemove, totalRevenue }) => {
    // Aseguramos que las propiedades existan para modelos viejos
    const type = impuesto.type || 'fixed';
    const isAnnual = impuesto.isAnnual || false;
    
    // Calcula el valor monetario mensual final
    const calculatedMonthlyValue = useMemo(() => {
        if (type === 'percentage') {
            return totalRevenue * (impuesto.rate || 0) / 100;
        }
        // Si es fijo
        if (isAnnual) {
            return (impuesto.value || 0) / 12;
        }
        return impuesto.value || 0;
    }, [impuesto, type, isAnnual, totalRevenue]);

    const handleTypeToggle = () => {
        const newType = type === 'fixed' ? 'percentage' : 'fixed';
        onUpdate({ ...impuesto, type: newType });
    };

    const handleFrequencyToggle = () => {
        onUpdate({ ...impuesto, isAnnual: !isAnnual });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center mb-3 p-2 bg-gray-50 rounded-md">
            {/* Columna 1: Nombre del Impuesto */}
            <input 
                type="text" 
                placeholder="Nombre del Impuesto" 
                value={impuesto.name} 
                onChange={(e) => onUpdate({ ...impuesto, name: e.target.value })} 
                className="p-2 border rounded-md shadow-sm"
            />
            
            {/* Columna 2: Tipo y Frecuencia */}
            <div className="flex items-center gap-2">
                 <button 
                    onClick={handleTypeToggle}
                    className="px-2 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 w-24 text-center"
                    title={type === 'fixed' ? "Cambiar a porcentaje relativo" : "Cambiar a valor fijo"}
                >
                    {type === 'fixed' ? '% Relativo' : 'Fijo $'}
                </button>
                {type === 'fixed' && (
                    <button
                        onClick={handleFrequencyToggle}
                        className="px-2 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 w-24 text-center"
                        title={isAnnual ? "Cambiar a pago mensual" : "Cambiar a pago anual"}
                    >
                        {isAnnual ? 'Mensual' : 'Anual'}
                    </button>
                )}
            </div>
            
            {/* Columna 3: Valor/Tasa */}
            <div className="flex items-center">
                 {type === 'fixed' ? (
                    <div className="flex items-center w-full">
                        <span className="text-gray-500 mr-2">$</span>
                        <input 
                            type="text" // CAMBIO: de 'number' a 'text'
                            placeholder={isAnnual ? "Valor Anual Total" : "Valor Mensual"} 
                            value={formatNumber(impuesto.value)} // CAMBIO: Aplicar formato
                            onChange={(e) => onUpdate({ ...impuesto, value: parseFormattedNumber(e.target.value) })} // CAMBIO: Parsear valor
                            className="p-2 border rounded-md shadow-sm w-full text-right"
                        />
                    </div>
                ) : (
                    <div className="flex items-center w-full">
                        <input 
                            type="number" // Mantenemos number para porcentajes que son pequeños
                            placeholder="Tasa %" 
                            value={impuesto.rate || ''} 
                            onChange={(e) => onUpdate({ ...impuesto, rate: parseFloat(e.target.value) || 0 })} 
                            className="p-2 border rounded-md shadow-sm w-full"
                        />
                        <span className="text-gray-500 ml-2">%</span>
                    </div>
                )}
            </div>

            {/* Columna 4: Valor Mensualizado y Botón de Eliminar */}
            <div className="flex justify-end items-center gap-4">
                <span className="text-sm text-gray-600 font-medium" title="Costo mensual equivalente">
                    {calculatedMonthlyValue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                </span>
                <button onClick={onRemove} className="text-red-500 hover:text-red-700 font-medium px-2">Eliminar</button>
            </div>
        </div>
    );
};


// --- Componentes de Filas (ACTUALIZADOS CON FORMATO) ---
const EmployeeRow = ({ employee, onUpdate, onRemove }) => {
    const totalCost = (employee.weeklyHours || 0) * (employee.hourlyRate || 0) * 4.33;
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center mb-3 p-2 bg-gray-50 rounded-md">
            <input type="text" placeholder="Nombre del Cargo" value={employee.role} onChange={(e) => onUpdate({ ...employee, role: e.target.value })} className="p-2 border rounded-md shadow-sm"/>
            <input type="number" placeholder="Horas/Semana" value={employee.weeklyHours || ''} onChange={(e) => onUpdate({ ...employee, weeklyHours: parseFloat(e.target.value) || '' })} className="p-2 border rounded-md shadow-sm w-full"/>
            <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input 
                    type="text" // CAMBIO
                    placeholder="Valor/Hora" 
                    value={formatNumber(employee.hourlyRate)} // CAMBIO
                    onChange={(e) => onUpdate({ ...employee, hourlyRate: parseFormattedNumber(e.target.value) })} // CAMBIO
                    className="p-2 border rounded-md shadow-sm w-full text-right"
                />
            </div>
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                <button onClick={onRemove} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
            </div>
        </div>
    );
};
const FixedCostRow = ({ cost, onUpdate, onRemove }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-3 p-2 bg-gray-50 rounded-md">
            <input type="text" placeholder="Nombre del Costo Fijo" value={cost.name} onChange={(e) => onUpdate({ ...cost, name: e.target.value })} className="p-2 border rounded-md shadow-sm"/>
            <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input 
                    type="text" // CAMBIO
                    placeholder="Valor Mensual" 
                    value={formatNumber(cost.value)} // CAMBIO
                    onChange={(e) => onUpdate({ ...cost, value: parseFormattedNumber(e.target.value) })} // CAMBIO
                    className="p-2 border rounded-md shadow-sm w-full text-right"
                />
            </div>
            <div className="flex justify-end items-center"><button onClick={onRemove} className="text-red-500 hover:text-red-700 font-medium px-2">Eliminar</button></div>
        </div>
    );
};
const OtherCostRow = ({ cost, onUpdate, onRemove }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-3 p-2 bg-gray-50 rounded-md">
            <input type="text" placeholder="Nombre del Gasto" value={cost.name} onChange={(e) => onUpdate({ ...cost, name: e.target.value })} className="p-2 border rounded-md shadow-sm"/>
            <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input 
                    type="text" // CAMBIO
                    placeholder="Valor Mensual" 
                    value={formatNumber(cost.value)} // CAMBIO
                    onChange={(e) => onUpdate({ ...cost, value: parseFormattedNumber(e.target.value) })} // CAMBIO
                    className="p-2 border rounded-md shadow-sm w-full text-right"
                />
            </div>
            <div className="flex justify-end items-center"><button onClick={onRemove} className="text-red-500 hover:text-red-700 font-medium px-2">Eliminar</button></div>
        </div>
    );
};
const SimulationRow = ({ product, quantity, onQuantityChange, onRemove }) => {
    return (
        <div className="grid grid-cols-5 gap-3 items-center p-2 bg-gray-50 rounded">
            <div className="col-span-2 font-medium text-gray-800">{product.name}</div>
            <div className="text-sm text-gray-500">
                Costo: {product.cost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-green-600 font-medium">
                Utilidad: {product.profitPerUnit.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </div>
            <div className="flex items-center justify-end">
                <input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => onQuantityChange(product._id, e.target.value)}
                    className="p-1 border rounded-md w-20 text-center"
                    placeholder="Cant."
                />
                <a href={`/receta/${product.recipeId}`} target="_blank" rel="noopener noreferrer" className="p-2 font-medium text-blue-600 hover:text-blue-800" title="Ver Receta">
                    📕
                </a>
                <button onClick={() => onRemove(product._id)} className="text-red-500 hover:text-red-700 font-bold px-2 ml-2">X</button>
            </div>
        </div>
    );
};
// --- FIN Componentes de Filas ---

// --- Componente Principal ---
function Model() {
    const dispatch = useDispatch();
    
    const models = useSelector(state => state.models);
    const loading = useSelector(state => state.modelsLoading);
    const error = useSelector(state => state.modelsError);
    const allMenu = useSelector(state => state.allMenu);
    const allRecetasMenu = useSelector(state => state.allRecetasMenu);

    const [activeModel_id, setActiveModel_id] = useState(null);
    const [modifiedModel, setModifiedModel] = useState(null);
    const [newModelName, setNewModelName] = useState("");
    const [simulatedProductIds, setSimulatedProductIds] = useState([]);
    const [salesMix, setSalesMix] = useState({});
    const [productSearchQuery, setProductSearchQuery] = useState("");

    useEffect(() => {
        dispatch(fetchModelsAction());
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(RECETAS_MENU));
    }, [dispatch]);

    useEffect(() => { if (!activeModel_id && models && models.length > 0) { setActiveModel_id(models[0]._id); } }, [models, activeModel_id]);
    
    const activeModel = useMemo(() => models.find(m => m._id === activeModel_id), [models, activeModel_id]);

    useEffect(() => {
        if (activeModel) {
            const modelCopy = JSON.parse(JSON.stringify(activeModel));

            let impuestosDesdePayload = [];
            if (modelCopy.costs.impuesto && typeof modelCopy.costs.impuesto === 'string') {
                try {
                    const parsedData = JSON.parse(modelCopy.costs.impuesto);
                    if (Array.isArray(parsedData.impuestos)) {
                        impuestosDesdePayload = parsedData.impuestos;
                    }
                } catch (e) { console.error("Error al parsear 'impuesto' JSON:", e); }
            }
            modelCopy.costs.impuestos = impuestosDesdePayload;

            if (modelCopy.costs.fijos && Array.isArray(modelCopy.costs.fijos)) {
                const taxFromFixed = modelCopy.costs.fijos.find(c => c.name === 'Impuestos');
                if (taxFromFixed) {
                    if (!modelCopy.costs.impuestos.some(t => t.id === taxFromFixed.id)) {
                        modelCopy.costs.impuestos.push({ ...taxFromFixed, type: 'fixed', rate: 0, isAnnual: false });
                    }
                    modelCopy.costs.fijos = modelCopy.costs.fijos.filter(c => c.name !== 'Impuestos');
                }
            }
            
            const hasOldFixedCosts = ['serviciosPublicos', 'arriendo', 'serviciosExternos', 'mantenimiento'].some(key => modelCopy.costs[key] !== undefined);
            if (!modelCopy.costs.fijos && hasOldFixedCosts) {
                modelCopy.costs.fijos = [];
                const oldFixedMap = { 'Servicios Públicos': 'serviciosPublicos', 'Arriendo': 'arriendo', 'Servicios Externos': 'serviciosExternos', 'Mantenimiento': 'mantenimiento' };
                Object.entries(oldFixedMap).forEach(([name, key], index) => {
                    if (modelCopy.costs[key] !== undefined) {
                        modelCopy.costs.fijos.push({ id: Date.now() + index, name: name, value: modelCopy.costs[key] });
                        delete modelCopy.costs[key];
                    }
                });
            }

            setModifiedModel(modelCopy);
    
            const savedSimulation = activeModel.esquema?.simulacionVentas;
            if (savedSimulation && Array.isArray(savedSimulation)) {
                const ids = savedSimulation.map(item => item.productId);
                const mix = savedSimulation.reduce((acc, item) => {
                    acc[item.productId] = item.quantity;
                    return acc;
                }, {});
                setSimulatedProductIds(ids);
                setSalesMix(mix);
            } else {
                setSimulatedProductIds([]);
                setSalesMix({});
            }
        } else {
            setModifiedModel(null);
        }
    }, [activeModel]);
    
    const handleLocalChange = (updatedCosts) => { setModifiedModel(prev => ({ ...prev, costs: updatedCosts })); };
    const handleProfitMarginChange = (value) => { const parsedValue = parseFloat(value) || 0; const clampedValue = Math.max(0, Math.min(100, parsedValue)); handleLocalChange({ ...modifiedModel.costs, desiredProfitMargin: clampedValue }); };
    
    const addEmployee = () => { const newEmployee = { id: Date.now(), role: "", weeklyHours: 40, hourlyRate: 0 }; handleLocalChange({ ...modifiedModel.costs, personal: [...(modifiedModel.costs.personal || []), newEmployee] }); };
    const updateEmployee = (updatedEmployee) => { const updatedList = modifiedModel.costs.personal.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp); handleLocalChange({ ...modifiedModel.costs, personal: updatedList }); };
    const removeEmployee = (idToRemove) => { const filteredList = modifiedModel.costs.personal.filter(emp => emp.id !== idToRemove); handleLocalChange({ ...modifiedModel.costs, personal: filteredList }); };
    
    const addFixedCost = () => { const newCost = { id: Date.now(), name: "Nuevo Costo Fijo", value: 0 }; handleLocalChange({ ...modifiedModel.costs, fijos: [...(modifiedModel.costs.fijos || []), newCost] }); };
    const updateFixedCost = (updatedCost) => { const updatedList = modifiedModel.costs.fijos.map(cost => cost.id === updatedCost.id ? updatedCost : cost); handleLocalChange({ ...modifiedModel.costs, fijos: updatedList }); };
    const removeFixedCost = (idToRemove) => { const filteredList = modifiedModel.costs.fijos.filter(cost => cost.id !== idToRemove); handleLocalChange({ ...modifiedModel.costs, fijos: filteredList }); };

    const addImpuesto = () => { const newImpuesto = { id: Date.now(), name: "Nuevo Impuesto", value: 0, type: 'fixed', rate: 0, isAnnual: false }; handleLocalChange({ ...modifiedModel.costs, impuestos: [...(modifiedModel.costs.impuestos || []), newImpuesto] }); };
    const updateImpuesto = (updatedImpuesto) => { const updatedList = modifiedModel.costs.impuestos.map(imp => imp.id === updatedImpuesto.id ? updatedImpuesto : imp); handleLocalChange({ ...modifiedModel.costs, impuestos: updatedList }); };
    const removeImpuesto = (idToRemove) => { const filteredList = modifiedModel.costs.impuestos.filter(imp => imp.id !== idToRemove); handleLocalChange({ ...modifiedModel.costs, impuestos: filteredList }); };

    const addOtherCost = () => { const newCost = { id: Date.now(), name: "", value: 0 }; handleLocalChange({ ...modifiedModel.costs, otros: [...(modifiedModel.costs.otros || []), newCost] }); };
    const updateOtherCost = (updatedCost) => { const updatedList = modifiedModel.costs.otros.map(cost => cost.id === updatedCost.id ? updatedCost : cost); handleLocalChange({ ...modifiedModel.costs, otros: updatedList }); };
    const removeOtherCost = (idToRemove) => { const filteredList = modifiedModel.costs.otros.filter(cost => cost.id !== idToRemove); handleLocalChange({ ...modifiedModel.costs, otros: filteredList }); };
    
    const calculateRequireSells = (costs, totalRevenueForTaxes) => { 
        if (!costs) return 0; 
        const personal = (costs.personal || []).reduce((acc, emp) => acc + (emp.weeklyHours || 0) * (emp.hourlyRate || 0) * 4.33, 0); 
        const otros = (costs.otros || []).reduce((acc, cost) => acc + (cost.value || 0), 0); 
        const fijos = (costs.fijos || []).reduce((acc, cost) => acc + (cost.value || 0), 0); 
        const impuestos = (costs.impuestos || []).reduce((acc, tax) => {
            if ((tax.type || 'fixed') === 'percentage') {
                return acc + (totalRevenueForTaxes * (tax.rate || 0) / 100);
            }
            if (tax.isAnnual) {
                return acc + ((tax.value || 0) / 12);
            }
            return acc + (tax.value || 0);
        }, 0);
        const total = personal + otros + fijos + impuestos; 
        const margin = (costs.desiredProfitMargin || 0) / 100; 
        return margin >= 1 ? total : total / (1 - margin); 
    };

    const handleSaveChanges = () => {
        const costsToSave = JSON.parse(JSON.stringify(modifiedModel.costs));
        costsToSave.impuesto = JSON.stringify({ impuestos: costsToSave.impuestos || [] });
        delete costsToSave.impuestos;

        const simulatedRevenue = simulationResults.totalRevenue;
        const newRequireSells = Math.round(calculateRequireSells(modifiedModel.costs, simulatedRevenue));
        const simulacionVentasData = simulatedProductIds.map(id => ({ productId: id, quantity: salesMix[id] || 0 }));
    
        const updatedData = {
            costs: costsToSave,
            requireSells: newRequireSells,
            esquema: { simulacionVentas: simulacionVentasData }
        };
        dispatch(updateModelAction(modifiedModel._id, updatedData));
    };

    const addNewModel = async () => { 
        if (!newModelName.trim()) { alert("Por favor, dale un nombre al nuevo modelo."); return; } 
        const newModelData = { 
            name: newModelName, 
            costs: { 
                personal: [], 
                fijos: [ { id: Date.now() + 1, name: 'Servicios Públicos', value: 0 }, { id: Date.now() + 2, name: 'Arriendo', value: 0 }, { id: Date.now() + 4, name: 'Servicios Externos', value: 0 }, { id: Date.now() + 5, name: 'Mantenimiento', value: 0 }, ], 
                impuesto: JSON.stringify({ impuestos: [] }),
                otros: [], 
                desiredProfitMargin: 20, 
            }, 
            requireSells: 0, 
            esquema: {} 
        }; 
        const createdModel = await dispatch(createModelAction(newModelData)); 
        if (createdModel) { setActiveModel_id(createdModel._id); setNewModelName(""); } 
    };
    
    const deleteActiveModel = () => { if (!window.confirm(`¿Estás seguro de que quieres eliminar el modelo "${activeModel.name}"?`)) return; dispatch(deleteModelAction(activeModel_id)); const remainingModels = models.filter(m => m._id !== activeModel_id); setActiveModel_id(remainingModels.length > 0 ? remainingModels[0]._id : null); };
    
    const sellableProducts = useMemo(() => { if (!allMenu || !allRecetasMenu) return []; return allMenu.filter(item => item.Receta).map(item => { const receta = allRecetasMenu.find(r => r._id === item.Receta); if (!receta) return null; let costoData = {}; try { if (typeof receta.costo === 'string' && receta.costo.startsWith('{')) costoData = JSON.parse(receta.costo); } catch {} const cost = parseFloat(costoData.vCMP || 0); const price = parseFloat(item.Precio || 0); return { _id: item._id,recipeId: receta._id, name: item.NombreES, price: price, cost: cost, profitPerUnit: price - cost }; }).filter(Boolean); }, [allMenu, allRecetasMenu]);
    const searchResults = useMemo(() => { if (!productSearchQuery) return []; return sellableProducts.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) && !simulatedProductIds.includes(p._id)); }, [productSearchQuery, sellableProducts, simulatedProductIds]);
    const addProductToSimulation = (productId) => { setSimulatedProductIds(prev => [...prev, productId]); setProductSearchQuery(""); };
    const removeProductFromSimulation = (productId) => { setSimulatedProductIds(prev => prev.filter(id => id !== productId)); const { [productId]: _, ...rest } = salesMix; setSalesMix(rest); };
    const handleSalesMixChange = (productId, quantity) => { const newQuantity = Math.max(0, parseInt(quantity, 10) || 0); setSalesMix(prev => ({ ...prev, [productId]: newQuantity })); };
    const simulationResults = useMemo(() => { return simulatedProductIds.reduce((acc, productId) => { const product = sellableProducts.find(p => p._id === productId); if (!product) return acc; const quantity = salesMix[productId] || 0; acc.totalRevenue += product.price * quantity; acc.totalProfit += product.profitPerUnit * quantity; return acc; }, { totalRevenue: 0, totalProfit: 0 }); }, [salesMix, simulatedProductIds, sellableProducts]);
    
    const { totalPersonal, totalOtros, totalCostosFijos, totalImpuestos, grandTotal, utilidad, hasChanges, requireSells } = useMemo(() => {
        if (!modifiedModel || !activeModel) return { totalPersonal: 0, totalOtros: 0, totalCostosFijos: 0, totalImpuestos: 0, grandTotal: 0, utilidad: 0, hasChanges: false, requireSells: 0 };
        
        const costs = modifiedModel.costs;
        const personal = (costs.personal || []).reduce((acc, emp) => acc + (emp.weeklyHours || 0) * (emp.hourlyRate || 0) * 4.33, 0);
        const otros = (costs.otros || []).reduce((acc, cost) => acc + (cost.value || 0), 0);
        const fijos = (costs.fijos || []).reduce((acc, cost) => acc + (cost.value || 0), 0);
        
        const simulatedRevenue = simulationResults.totalRevenue;
        const impuestos = (costs.impuestos || []).reduce((acc, tax) => {
            if ((tax.type || 'fixed') === 'percentage') {
                return acc + (simulatedRevenue * (tax.rate || 0) / 100);
            }
            if (tax.isAnnual) {
                return acc + ((tax.value || 0) / 12);
            }
            return acc + (tax.value || 0);
        }, 0);

        const total = personal + otros + fijos + impuestos;
        const reqSells = calculateRequireSells(costs, simulatedRevenue);
        const utilidadCalculada = reqSells - total;
        
        const normalizeCostsForComparison = (costsObj) => {
            const copy = JSON.parse(JSON.stringify(costsObj));
            let impuestosTemp = [];
            if(copy.impuesto && typeof copy.impuesto === 'string') { try { impuestosTemp = JSON.parse(copy.impuesto).impuestos || [] } catch {} }
            if(Array.isArray(copy.impuestos)) { impuestosTemp = copy.impuestos; }
            delete copy.impuesto;
            copy.impuestos = impuestosTemp;
            return copy;
        }

        const originalCostsNormalized = normalizeCostsForComparison(activeModel.costs);
        const modifiedCostsNormalized = normalizeCostsForComparison(modifiedModel.costs);
        const costsHaveChanged = JSON.stringify(originalCostsNormalized) !== JSON.stringify(modifiedCostsNormalized);

        const originalSimulation = activeModel.esquema?.simulacionVentas || [];
        const currentSimulation = simulatedProductIds.map(id => ({ productId: id, quantity: salesMix[id] || 0 }));
        const simulationHasChanged = JSON.stringify(originalSimulation) !== JSON.stringify(currentSimulation);

        const changesDetected = costsHaveChanged || simulationHasChanged;

        return { totalPersonal: personal, totalOtros: otros, totalCostosFijos: fijos, totalImpuestos: impuestos, grandTotal: total, utilidad: utilidadCalculada, hasChanges: changesDetected, requireSells: reqSells };
    }, [modifiedModel, activeModel, simulatedProductIds, salesMix, simulationResults]);

    if (loading) return <div className="p-8 text-center">Cargando modelos...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    const progressPercentage = requireSells > 0 ? (simulationResults.totalRevenue / requireSells) * 100 : 0;

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen w-full flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Análisis de Modelos de Negocio</h1>
            
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Gestión de Modelos</h2>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {models.length > 0 && activeModel ? (
                            <>
                                <div>
                                    <label className="mr-2 font-medium text-gray-600">Modelo Activo:</label>
                                    <select value={activeModel_id || ''} onChange={(e) => setActiveModel_id(e.target.value)} className="p-2 border rounded-md shadow-sm">
                                        {models.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleSaveChanges} disabled={!hasChanges} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {hasChanges ? 'Guardar Cambios' : 'Sin Cambios'}
                                </button>
                                <button onClick={deleteActiveModel} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Eliminar Modelo</button>
                            </>
                        ) : ( <p className="text-gray-500">No hay modelos. ¡Crea el primero!</p> )}
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="text" placeholder="Nombre del nuevo modelo" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} className="p-2 border rounded-md shadow-sm"/>
                        <button onClick={addNewModel} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Crear Modelo</button>
                    </div>
                </div>
            </div>

            {!modifiedModel ? ( <div className="text-center p-10 bg-white rounded-lg shadow-md"> <h2 className="text-xl font-semibold text-gray-700">Bienvenido</h2> <p className="text-gray-500 mt-2">Selecciona un modelo o crea uno nuevo para comenzar.</p> </div> ) : (
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Simulación de Ventas Mensuales</h3>
                        <div className="relative mt-4">
                            <input type="text" placeholder="Buscar producto para añadir..." value={productSearchQuery} onChange={e => setProductSearchQuery(e.target.value)} className="p-2 border rounded-md w-full" />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                    {searchResults.map(product => (<div key={product._id} onClick={() => addProductToSimulation(product._id)} className="p-2 hover:bg-gray-100 cursor-pointer">{product.name}</div>))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 mt-4">
                            {simulatedProductIds.length > 0 ? simulatedProductIds.map(id => {
                                const product = sellableProducts.find(p => p._id === id);
                                if (!product) return null;
                                return ( <SimulationRow key={id} product={product} quantity={salesMix[id]} onQuantityChange={handleSalesMixChange} onRemove={removeProductFromSimulation} /> );
                            }) : <p className="text-gray-500 mt-4">Busca y añade productos para empezar la simulación.</p>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Costos de Personal</h3>
                        {(modifiedModel.costs.personal || []).map(emp => ( <EmployeeRow key={emp.id} employee={emp} onUpdate={updateEmployee} onRemove={() => removeEmployee(emp.id)} /> ))}
                        <button onClick={addEmployee} className="mt-4 px-4 py-2 border rounded-md hover:bg-gray-100">Añadir Personal</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Costos Operativos Fijos</h3>
                        {(modifiedModel.costs.fijos || []).map(cost => ( <FixedCostRow key={cost.id} cost={cost} onUpdate={updateFixedCost} onRemove={() => removeFixedCost(cost.id)} /> ))}
                        <button onClick={addFixedCost} className="mt-4 px-4 py-2 border rounded-md hover:bg-gray-100">Añadir Costo Operativo</button>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Impuestos</h3>
                        {(modifiedModel.costs.impuestos || []).map(imp => ( 
                            <ImpuestoRow 
                                key={imp.id} 
                                impuesto={imp} 
                                onUpdate={updateImpuesto} 
                                onRemove={() => removeImpuesto(imp.id)}
                                totalRevenue={simulationResults.totalRevenue}
                            /> 
                        ))}
                        <button onClick={addImpuesto} className="mt-4 px-4 py-2 border rounded-md hover:bg-gray-100">Añadir Impuesto</button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Otros Costos</h3>
                        {(modifiedModel.costs.otros || []).map(cost => ( <OtherCostRow key={cost.id} cost={cost} onUpdate={updateOtherCost} onRemove={() => removeOtherCost(cost.id)} /> ))}
                        <div className="flex gap-4 mt-4"><button onClick={addOtherCost} className="px-4 py-2 border rounded-md hover:bg-gray-100">Añadir Otro Costo</button></div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2"> Resumen: <span className="text-blue-600">{modifiedModel.name}</span> </h3>
                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between"><span>Total Personal:</span><span className="font-medium">{totalPersonal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                            <div className="flex justify-between"><span>Total Costos Fijos:</span><span className="font-medium">{totalCostosFijos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                            <div className="flex justify-between"><span>Total Impuestos:</span><span className="font-medium">{totalImpuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                            <div className="flex justify-between"><span>Total Otros Costos:</span><span className="font-medium">{totalOtros.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                            <hr className="my-3"/>
                            <div className="flex justify-between items-center text-lg font-bold"><span>Costo Operativo Total:</span><span className="text-red-600">{grandTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t">
                            <h4 className="font-semibold text-lg text-gray-700 mb-3">Análisis de Rentabilidad</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Margen de Utilidad Deseado (%)</label>
                                    <div className="flex items-center">
                                        <input 
                                            type="number" 
                                            value={modifiedModel.costs.desiredProfitMargin || ''} 
                                            onChange={(e) => handleProfitMarginChange(e.target.value)} 
                                            className="p-2 border rounded-md shadow-sm w-full text-right" 
                                            min="0" max="99"
                                        />
                                        <span className="ml-2 text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <div className="flex justify-between items-center text-sm"><span>Punto de Equilibrio:</span><span className="font-bold">{grandTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                                </div>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex justify-between items-center font-bold text-green-800"><span>Meta de Ventas Mensual:</span><span>{requireSells.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                                    <div className="flex justify-between items-center font-medium text-green-700 mt-2 pt-2 border-t border-green-200"><span>Utilidad Proyectada:</span><span>{utilidad.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <h5 className="font-semibold text-md text-gray-700 mb-2">Resultados de la Simulación</h5>
                                    <div className="space-y-3">
                                        <div className="flex justify-between"><span>Ingresos Simulados:</span><span className="font-bold text-blue-600">{simulationResults.totalRevenue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                                        <div className="flex justify-between"><span>Utilidad Simulada:</span><span className="font-bold text-green-600">{simulationResults.totalProfit.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                                        <div className="mt-2">
                                            <label className="text-sm text-gray-600">Progreso Meta ({requireSells.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })})</label>
                                            <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                                                <div className="bg-blue-500 h-4 rounded-full text-center text-white text-xs flex items-center justify-center" style={{ width: `${Math.min(progressPercentage, 100)}%` }}>
                                                   <span>{progressPercentage.toFixed(0)}%</span> 
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default Model;