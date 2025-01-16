import React, { useState, useEffect } from "react";
import { CardInstanceInventarioMenu } from "@/components/ui/cardInstanceInventarioMenu";
import { useDispatch, useSelector } from "react-redux";

export function CardGridInventarioMenu({ products, showEdit }) {
  const dispatch = useDispatch();
  const globalExpandedGroups = useSelector((state) => state.expandedGroups);

  const groupedProducts = products.reduce((acc, product) => {
    const group = product.GRUPO || "Sin Grupo";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(product);
    return acc;
  }, {});

  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setExpandedGroups(globalExpandedGroups);
  }, [globalExpandedGroups]);

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const filteredProducts = Object.keys(groupedProducts).reduce((acc, group) => {
    const filteredGroup = groupedProducts[group].filter((product) =>
      searchTerm === "" || (product.NombreES && product.NombreES.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filteredGroup.length > 0) {
      acc[group] = filteredGroup;
    }
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-2 ml-4 mr-4">
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded-md bg-white"
      />
      {Object.keys(filteredProducts)
        .sort()
        .map((group) => (
          <div key={group}>
            <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
              <button
                onClick={() => toggleGroup(group)}
                className="flex-grow bg-white text-left py-2 px-4 overflow-hidden whitespace-nowrap truncate"
              >
                <span className="ml-2 text-sm text-gray-500">
                  {expandedGroups[group] ? "▲ " : "▼ "}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {group.toUpperCase()} ({filteredProducts[group].length})
                </span>
              </button>
            </div>
            {expandedGroups[group] && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts[group].map((product) => (
                  <CardInstanceInventarioMenu
                    key={product._id}
                    product={product}
                    showEdit={showEdit}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
