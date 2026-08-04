import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { MenuItems, Comanda } from "../../../redux/actions-types";

export const TableFilters = ({
  currentType,
  searchTerm,
  setSearchTerm,
  filterGrupo,
  setFilterGrupo,
  filterSubGrupo,
  setFilterSubGrupo,
  filterTipo,
  setFilterTipo,
  filterStatus,
  setFilterStatus,
  uniqueGrupos,
  uniqueSubGrupos,
  uniqueTipos,
  uniqueEstados,
  setShowColumnSelector,
  sortedProductsLength,
  productsLength
}) => {
  return (
    <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="bg-slate-100 text-gray-950 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={`Buscar ${currentType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm bg-gray-100"
          />
        </div>
        
        <div className="bg-slate-100 text-gray-950 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterGrupo}
            onChange={(e) => setFilterGrupo(e.target.value)}
            className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{currentType === Comanda ? "Todas las Categorías" : "Todos los Grupos"}</option>
            {uniqueGrupos.map(grupo => (
              <option key={grupo} value={grupo}>{grupo}</option>
            ))}
          </select>
        </div>

        {currentType === MenuItems && (
          <>
            <div className="bg-slate-100 text-gray-950 flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-500" />
              <select
                value={filterSubGrupo}
                onChange={(e) => setFilterSubGrupo(e.target.value)}
                className="border border-orange-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
              >
                <option value="">Todos los sub-grupos</option>
                {uniqueSubGrupos.map(subGrupo => (
                  <option key={subGrupo} value={subGrupo}>{subGrupo}</option>
                ))}
              </select>
            </div>
            
            <div className="bg-slate-100 text-gray-950 flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-500" />
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="border border-purple-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
              >
                <option value="">Todos los tipos</option>
                {uniqueTipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="bg-slate-100 text-gray-950 flex items-center gap-2">
          <Filter className="w-4 h-4 text-green-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-green-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
          >
            <option value="">Todos los estados</option>
            {uniqueEstados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => setShowColumnSelector(true)}
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm border border-blue-300 flex items-center gap-2"
        >
          📋 Columnas
        </Button>

        <div className="text-sm text-gray-600">
          Mostrando {sortedProductsLength} de {productsLength} elementos
          {currentType === MenuItems && filterSubGrupo && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              Filtro: {filterSubGrupo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
