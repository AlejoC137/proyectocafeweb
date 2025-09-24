import React from "react";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TableViewInventarioFilters({
    searchTerm, setSearchTerm,
    filterCategory, setFilterCategory, uniqueCategories,
    filterEstado, setFilterEstado, uniqueEstados,
    setShowColumnSelector,
    sortedProducts, products,
}) {
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
                        className="border border-gray-300 bg-gray-100 text-gray-900 rounded px-3 py-1 text-sm"
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
                        className="border border-green-300 rounded px-3 py-1 text-sm bg-gray-100"
                    >
                        <option value="">Todos los estados</option>
                        {uniqueEstados.map(estado => (
                            <option key={estado} value={estado}>{estado}</option>
                        ))}
                    </select>
                </div>
                <Button
                    onClick={() => setShowColumnSelector(true)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 text-sm"
                >
                    Columnas
                </Button>
                <div className="text-sm text-gray-600">
                    Mostrando {sortedProducts.length} de {products.length} productos
                </div>
            </div>
        </div>
    );
}