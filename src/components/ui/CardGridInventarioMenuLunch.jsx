import React, { useState, useEffect } from "react";
import { ProductRow } from "@/components/ui/CardInstanceInventarioMenuLunch";
import { useDispatch, useSelector } from "react-redux";
import { MENU, TARDEO_ALMUERZO } from "../../redux/actions-types";
import AccionesRapidasMenuLunch from "../../body/views/actualizarPrecioUnitario/AccionesRapidasMenuLunch";

export function CardGridInventarioMenuLunch({ products, showEdit }) {

  
  const dispatch = useDispatch();
  const globalExpandedGroups = useSelector((state) => state.expandedGroups);

  // Filtrar productos por categoría TARDEO_ALMUERZO
  const filteredByCategoria = products.filter(
    (product) => product.SUB_GRUPO === TARDEO_ALMUERZO
  );

  const groupedProducts = filteredByCategoria.reduce((acc, product) => {
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
      searchTerm === "" ||
      (product.NombreES &&
        product.NombreES.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <AccionesRapidasMenuLunch
       currentType={"MenuItems"}
      ></AccionesRapidasMenuLunch>
      {Object.keys(filteredProducts)
        .sort()
        .map((group) => (
          <div key={group}>
            {/* <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
              <button
                onClick={() => toggleGroup(group)}
                className="flex-grow bg-white text-left py-2 px-4 overflow-hidden whitespace-nowrap truncate flex items-center"
              >
                <span className="text-sm text-gray-500 mr-2">
                  {expandedGroups[group] ? "▲" : "▼"}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {group.toUpperCase()} ({filteredProducts[group].length})
                </span>
              </button>
            </div> */}
            <div className="mt-4 flex flex-col gap-4">
              {filteredProducts[group].map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  showEdit={showEdit}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
