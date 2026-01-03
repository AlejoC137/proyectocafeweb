import React, { useMemo } from 'react';

// --- UTILS ---
export const formatNumber = (num) => (num === null || num === undefined || isNaN(parseFloat(num))) ? '' : Number(num).toLocaleString('es-ES');
export const parseFormattedNumber = (str) => typeof str !== 'string' ? 0 : parseFloat(str.replace(/\./g, '')) || 0;
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

// --- UI COMPONENTS ---
export const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 animate-pulse">Cargando Información...</h2>
        <p className="text-gray-500 text-sm mt-2">Calculando costos y ventas...</p>
    </div>
);

export const RowContainer = ({ children, onRemove }) => (
    <div className="flex items-center gap-2 border-b border-gray-50 bg-white hover:bg-blue-50 transition-colors group w-full py-1.5 px-1">
        {children}
        {onRemove && (
            <button onClick={onRemove} className="text-gray-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity w-5 text-center flex-shrink-0">×</button>
        )}
    </div>
);

export const PurchasesModal = ({ isOpen, onClose, purchases, total }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Detalle de Compras ({purchases.length})</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="overflow-y-auto p-4 flex-grow custom-scrollbar">
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

export const ImpuestoRow = ({ impuesto, onUpdate, onRemove, totalRevenue, readOnly = false }) => {
    const type = impuesto.type || 'fixed';
    const isAnnual = impuesto.isAnnual || false;
    const calculatedVal = useMemo(() => {
        if (type === 'percentage') return totalRevenue * (impuesto.rate || 0) / 100;
        return isAnnual ? (impuesto.value || 0) / 12 : impuesto.value || 0;
    }, [impuesto, type, isAnnual, totalRevenue]);

    return (
        <RowContainer onRemove={!readOnly ? onRemove : null}>
            <div className="flex-grow min-w-0">
                <input
                    type="text"
                    value={impuesto.name}
                    onChange={(e) => onUpdate && onUpdate({ ...impuesto, name: e.target.value })}
                    className="w-full bg-transparent outline-none font-medium text-gray-700 text-xs placeholder-gray-400"
                    placeholder="Nombre Impuesto"
                    readOnly={readOnly}
                />
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={() => !readOnly && onUpdate && onUpdate({ ...impuesto, type: type === 'fixed' ? 'percentage' : 'fixed' })}
                    className="px-1.5 py-0.5 text-[10px] uppercase border rounded bg-gray-50 text-gray-600 hover:border-blue-400 whitespace-nowrap"
                    disabled={readOnly}
                >
                    {type === 'fixed' ? '$ Fijo' : '% Venta'}
                </button>

                {type === 'fixed' ? (
                    <input
                        type="text"
                        value={formatNumber(impuesto.value)}
                        onChange={(e) => onUpdate && onUpdate({ ...impuesto, value: parseFormattedNumber(e.target.value) })}
                        className="w-16 text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none text-xs"
                        placeholder="$0"
                        readOnly={readOnly}
                    />
                ) : (
                    <div className="flex items-center gap-0.5 w-16 justify-end">
                        <input
                            type="number"
                            value={impuesto.rate || ''}
                            onChange={(e) => onUpdate && onUpdate({ ...impuesto, rate: parseFloat(e.target.value) })}
                            className="w-full text-right bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-xs"
                            placeholder="0"
                            readOnly={readOnly}
                        />
                        <span className="text-gray-500 text-xs">%</span>
                    </div>
                )}
            </div>

            <div className="w-20 text-right font-bold text-gray-800 text-xs flex-shrink-0">
                {calculatedVal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
        </RowContainer>
    );
};

export const EmployeeRow = ({ employee, onUpdate, onRemove, readOnly = false }) => {
    const isManual = employee.totalValue !== undefined;
    const totalCost = isManual ? employee.totalValue : (employee.weeklyHours || 0) * (employee.hourlyRate || 0) * 4.33;

    return (
        <RowContainer onRemove={!readOnly ? onRemove : null}>
            <div className="flex-grow min-w-0">
                <input
                    type="text"
                    value={employee.role}
                    onChange={(e) => onUpdate && onUpdate({ ...employee, role: e.target.value })}
                    className="w-full bg-transparent outline-none font-medium text-gray-700 text-xs placeholder-gray-400"
                    placeholder="Cargo / Rol"
                    readOnly={readOnly}
                />
                {isManual && <div className="text-[9px] text-blue-500 leading-none">Sincronizado</div>}
            </div>

            {!isManual ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                        <input
                            type="number"
                            value={employee.weeklyHours || ''}
                            onChange={(e) => onUpdate && onUpdate({ ...employee, weeklyHours: parseFloat(e.target.value) })}
                            className="w-8 text-center bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none text-xs"
                            placeholder="0"
                            readOnly={readOnly}
                        />
                        <span className="text-[9px] text-gray-400">Hrs</span>
                    </div>
                    <div className="w-16">
                        <input
                            type="text"
                            value={formatNumber(employee.hourlyRate)}
                            onChange={(e) => onUpdate && onUpdate({ ...employee, hourlyRate: parseFormattedNumber(e.target.value) })}
                            className="w-full text-right bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none text-xs"
                            placeholder="Valor/Hr"
                            readOnly={readOnly}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-shrink-0 w-24 text-right text-[10px] text-gray-400 italic">
                    Cálculo automático
                </div>
            )}

            <div className={`w-20 text-right font-bold text-xs flex-shrink-0 ${isManual ? 'text-blue-600' : 'text-gray-800'}`}>
                {totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
        </RowContainer>
    );
};

export const SimpleCostRow = ({ cost, onUpdate, onRemove, label, readOnly = false }) => (
    <RowContainer onRemove={!readOnly ? onRemove : null}>
        <div className="flex-grow min-w-0">
            <input
                type="text"
                value={cost.name}
                onChange={(e) => onUpdate && onUpdate({ ...cost, name: e.target.value })}
                className="w-full bg-transparent outline-none font-medium text-gray-700 text-xs placeholder-gray-400"
                placeholder={label}
                readOnly={readOnly}
            />
        </div>
        <div className="w-24 text-right flex-shrink-0">
            <input
                type="text"
                value={formatNumber(cost.value)}
                onChange={(e) => onUpdate && onUpdate({ ...cost, value: parseFormattedNumber(e.target.value) })}
                className="w-full text-right bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-800 text-xs transition-colors placeholder-gray-300"
                placeholder="$0"
                readOnly={readOnly}
            />
        </div>
    </RowContainer>
);
