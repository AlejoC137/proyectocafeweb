// src/components/inventario/tableView/InventarioFilterBar.jsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { ItemsAlmacen } from "../../../redux/actions-types";

export const InventarioFilterBar = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  uniqueCategories,
  filterEstado,
  setFilterEstado,
  uniqueEstados,
  filterAlmacenamiento,
  setFilterAlmacenamiento,
  uniqueAlmacenamiento,
  currentType,
  filterProveedor,
  setFilterProveedor,
  Proveedores,
  setShowColumnSelector,
  sortedProductsCount,
  totalProductsCount
}) => {
  return (
    <div className="bg-gray-50 p-4 border-b border-gray-200 mb-4 rounded-lg">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
          >
            <option value="">Todos los grupos</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-green-500" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="border border-green-300 rounded px-3 py-1 text-sm bg-gray-100 text-gray-900"
          >
            <option value="">Todos los estados</option>
            {uniqueEstados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-500" />
          <select
            value={filterAlmacenamiento}
            onChange={(e) => setFilterAlmacenamiento(e.target.value)}
            className="border border-purple-300 rounded px-3 py-1 text-sm bg-gray-100 text-gray-900"
          >
            <option value="">Todos los almacenamientos</option>
            {uniqueAlmacenamiento.map(almacen => (
              <option key={almacen} value={almacen}>{almacen}</option>
            ))}
          </select>
        </div>

        {currentType === ItemsAlmacen && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <select
              value={filterProveedor}
              onChange={(e) => setFilterProveedor(e.target.value)}
              className="border border-orange-300 rounded px-3 py-1 text-sm bg-gray-100 text-gray-900"
            >
              <option value="">Todos los proveedores</option>
              {Proveedores.map(proveedor => (
                <option key={proveedor._id} value={proveedor._id}>{proveedor.Nombre_Proveedor}</option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={() => setShowColumnSelector(true)}
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm border border-blue-300 flex items-center gap-2"
        >
          📋 Columnas
        </Button>

        <div className="text-sm text-gray-600">
          Mostrando {sortedProductsCount} de {totalProductsCount} productos
        </div>
      </div>
    </div>
  );
};