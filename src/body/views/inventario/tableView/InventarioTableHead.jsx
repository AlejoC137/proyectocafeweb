// src/components/inventario/tableView/InventarioTableHead.jsx
import React from 'react';
import { ChevronUp, ChevronDown } from "lucide-react";

const SortIcon = ({ column, sortColumn, sortDirection }) => {
  if (sortColumn !== column) return <ChevronDown className="w-4 h-4 text-gray-400" />;
  return sortDirection === "asc" ?
    <ChevronUp className="w-4 h-4" /> :
    <ChevronDown className="w-4 h-4" />;
};

export const InventarioTableHead = ({ headers, sortColumn, sortDirection, handleSort, visibleColumns }) => {
  const visibleHeaders = headers.filter(header => visibleColumns[header.key]);

  return (
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>
        {visibleHeaders.map(header => {
          if (!header.sortKey) {
            return (
              <th key={header.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                {header.label}
              </th>
            );
          }
          return (
            <th key={header.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort(header.sortKey)} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                {header.label}
                <SortIcon column={header.sortKey} sortColumn={sortColumn} sortDirection={sortDirection} />
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};