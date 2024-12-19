import React, { useState, useEffect } from "react";
import { CardInstanceInventario } from "@/components/ui/cardInstanceInventario";
import { copiarAlPortapapeles } from "../../redux/actions";
import { ItemsAlmacen, ProduccionInterna } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";

export function CardGridInventario({ products, currentType }) {
  // Determinar el estado (PC o PP) según el tipo actual
  const ESTATUS = currentType === ProduccionInterna ? "PP" : "PC";
  const dispatch = useDispatch();
  const globalExpandedGroups = useSelector((state) => state.expandedGroups); // Obtener el estado de expandedGroups desde Redux

  // Agrupar productos por GRUPO
  const groupedProducts = products.reduce((acc, product) => {
    const group = product.GRUPO || "POR ASIGNAR GRUPO"; // Usar "POR ASIGNAR GRUPO" si el producto no tiene grupo
    if (!acc[group]) acc[group] = [];
    acc[group].push(product);
    return acc;
  }, {});

  // Estado local para controlar qué grupos están desplegados
  const [expandedGroups, setExpandedGroups] = useState({});

  // Sincronizar el estado local con el estado global
  useEffect(() => {
    setExpandedGroups(globalExpandedGroups);
  }, [globalExpandedGroups]);

  // Alternar el estado de un grupo localmente
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className="flex flex-col gap-2 ml-4 mr-4 ">
      {Object.keys(groupedProducts)
        .sort() // Ordenar los grupos alfabéticamente
        .map((group) => (
          <div key={group}>
            {/* Botón para desplegar/replegar el grupo */}
            <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
              <button
                onClick={() => toggleGroup(group)}
                className="flex-grow bg-white text-left py-2 px-4 overflow-hidden whitespace-nowrap truncate"
              >
                <span className="ml-2 text-sm text-gray-500">
                  {expandedGroups[group] ? "▲ " : "▼ "}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {group.toUpperCase()} ({groupedProducts[group].length})
                </span>
              </button>

              {/* Botón del icono del portapapeles */}
              <button
                className="flex items-center justify-center w-8 h-8 mr-2 bg-green-500 text-white text-xs rounded-full hover:bg-green-600"
                onClick={() => {
                  dispatch(copiarAlPortapapeles(groupedProducts[group], ESTATUS));
                }}
              >
                📋
              </button>
            </div>

            {/* Grid de productos dentro del grupo (se muestra solo si el grupo está expandido) */}
            {expandedGroups[group] && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedProducts[group].map((product, index) => (
                  <CardInstanceInventario
                    key={index}
                    product={product}
                    currentType={currentType}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
