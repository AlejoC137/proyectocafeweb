import React from 'react';

export const ColumnSelector = ({
  showColumnSelector,
  setShowColumnSelector,
  toggleAllColumns,
  resetToDefault,
  availableColumns,
  visibleColumns,
  toggleColumn
}) => {
  if (!showColumnSelector) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 column-selector-container">
      <div className="bg-white rounded-lg p-6 max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Seleccionar Columnas</h3>
          <button
            onClick={() => setShowColumnSelector(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Controles rápidos */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => toggleAllColumns(true)}
            className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
          >
            Mostrar Todas
          </button>
          <button
            onClick={() => toggleAllColumns(false)}
            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
          >
            Ocultar Todas
          </button>
          <button
            onClick={resetToDefault}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            Por Defecto
          </button>
        </div>
        
        {/* Lista de columnas */}
        <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded p-3">
          {Object.entries(availableColumns).map(([key, column]) => (
            <div key={key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <label className="flex items-center space-x-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={visibleColumns[key] || false}
                  onChange={() => !column.fixed && toggleColumn(key)}
                  disabled={column.fixed}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${
                  column.fixed ? 'text-gray-500 font-medium' : 'text-gray-700'
                }`}>
                  {column.label}
                  {column.fixed && <span className="ml-1 text-xs">(fijo)</span>}
                </span>
              </label>
              {column.fixed && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Requerido</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {Object.values(visibleColumns).filter(Boolean).length} de {Object.keys(availableColumns).length} columnas visibles
            </span>
            <button
              onClick={() => setShowColumnSelector(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
