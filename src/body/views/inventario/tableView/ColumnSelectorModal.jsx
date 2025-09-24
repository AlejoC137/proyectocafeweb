// src/components/inventario/tableView/ColumnSelectorModal.jsx
import React from 'react';

export const ColumnSelectorModal = ({
  show,
  onClose,
  availableColumns,
  visibleColumns,
  toggleColumn,
  toggleAllColumns,
  resetToDefault
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 column-selector-container">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg"><span className="text-blue-600 text-lg">📋</span></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Personalizar Columnas</h3>
              <p className="text-sm text-gray-600">Selecciona las columnas que deseas mostrar</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button onClick={() => toggleAllColumns(true)} className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">✅ Mostrar Todas</button>
          <button onClick={() => toggleAllColumns(false)} className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">❌ Ocultar Todas</button>
          <button onClick={resetToDefault} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">🔄 Por Defecto</button>
        </div>
        
        <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {Object.entries(availableColumns).map(([key, column]) => (
            <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg border">
              <label className="flex items-center space-x-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={!!visibleColumns[key]}
                  onChange={() => !column.fixed && toggleColumn(key)}
                  disabled={column.fixed}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${column.fixed ? 'text-gray-500' : 'text-gray-700'}`}>
                  {column.label}
                </span>
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Aplicar</button>
        </div>
      </div>
    </div>
  );
};