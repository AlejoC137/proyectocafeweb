// src/components/inventario/tableView/CyclicStatusSelector.jsx
import React from 'react';

export const CyclicStatusSelector = ({ initialStatus, options, onStatusChange }) => {
  const handleClick = () => {
    const currentIndex = options.indexOf(initialStatus);
    const nextIndex = (currentIndex + 1) % options.length;
    const newStatus = options[nextIndex];
    onStatusChange(newStatus);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'OK':
      case 'PC':
      case 'PP':
      case 'Activo':
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-300";
      case 'NA':
      case 'Inactivo':
      case 'Suspendido':
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300";
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`w-full px-2 py-1 rounded-full text-xs font-medium transition-colors border ${getStatusClass(initialStatus)}`}
    >
      {initialStatus || options[0]}
    </button>
  );
};