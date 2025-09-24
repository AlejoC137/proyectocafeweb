import React from "react";

export function TableViewInventarioColumnSelector({
    showColumnSelector, setShowColumnSelector,
    availableColumns, visibleColumns,
    toggleColumn, toggleAllColumns, resetToDefault,
}) {
    if (!showColumnSelector) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Personalizar Columnas</h3>
                    <button onClick={() => setShowColumnSelector(false)} className="text-gray-500 hover:text-gray-800">
                        &times;
                    </button>
                </div>
                <div className="flex gap-2 mb-4">
                    <button onClick={() => toggleAllColumns(true)} className="flex-1 px-3 py-2 bg-green-100 text-sm">Mostrar Todas</button>
                    <button onClick={() => toggleAllColumns(false)} className="flex-1 px-3 py-2 bg-red-100 text-sm">Ocultar Todas</button>
                    <button onClick={resetToDefault} className="flex-1 px-3 py-2 bg-gray-100 text-sm">Por Defecto</button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                    {Object.entries(availableColumns).map(([key, column]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded bg-gray-50">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns[key] || false}
                                    onChange={() => !column.fixed && toggleColumn(key)}
                                    disabled={column.fixed}
                                    className="w-4 h-4"
                                />
                                <span className={column.fixed ? 'text-gray-500' : ''}>{column.label}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}