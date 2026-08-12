import React from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import { CATEGORIAS_OPTIONS, ESTADOS_OPTIONS } from './constants';

export function AliadosFilterHeader({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  selectedIds,
  handleBulkDelete,
}) {
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-2 mb-3 flex-shrink-0">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, instagram, contacto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 py-2 w-full border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas las Categorías</option>
            {CATEGORIAS_OPTIONS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos los Estados</option>
            {ESTADOS_OPTIONS.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {(searchTerm || categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="text-xs text-rose-600 hover:underline px-2 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 bg-amber-50/50 p-2 rounded-lg">
          <span className="text-xs font-semibold text-amber-800">
            {selectedIds.size} {selectedIds.size === 1 ? 'aliado seleccionado' : 'aliados seleccionados'}
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >
            <Trash2 size={14} /> Eliminar seleccionados
          </button>
        </div>
      )}
    </div>
  );
}

export default AliadosFilterHeader;
