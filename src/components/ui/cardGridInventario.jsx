import React, { useState } from "react";
import { CardInstanceInventario } from "@/components/ui/cardInstanceInventario";

export function CardGridInventario({ products , currentType}) {
  // Agrupar productos por GRUPO
  const groupedProducts = products.reduce((acc, product) => {
    const group = product.GRUPO || "POR ASIGNAR GRUPO"; // Usar "POR ASIGNAR GRUPO" si el producto no tiene grupo
    if (!acc[group]) acc[group] = [];
    acc[group].push(product);
    return acc;
  }, {});

  // Estado para controlar qué grupos están desplegados
  const [expandedGroups, setExpandedGroups] = useState({});

  // Función para alternar el estado de un grupo
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  

  return (
    <div className="flex flex-col gap-2 ml-4 mr-4">
      {Object.keys(groupedProducts)
        .sort() // Ordenar los grupos alfabéticamente
        .map((group) => (
          <div key={group}>
            {/* Botón para desplegar/replegar el grupo */}
            <button
              onClick={() => toggleGroup(group)}
              className="w-full text-left py-2 px-4  bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              <span className="ml-2 text-sm text-gray-500">
                {expandedGroups[group] ? "▲ " : "▼ "}
              </span>
              <span className="text-sm font-bold text-gray-700">
                {group.toUpperCase() + ` (${groupedProducts[group].length})`}
              </span>
            </button>

            {/* Grid de productos dentro del grupo (se muestra solo si el grupo está expandido) */}
            {expandedGroups[group] && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedProducts[group].map((product, index) => (
                  <CardInstanceInventario key={index} product={product} currentType={currentType} />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
