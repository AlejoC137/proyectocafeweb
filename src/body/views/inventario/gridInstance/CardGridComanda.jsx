import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CardGridComanda_Instance } from "./CardGridComanda_Instance";
import { copiarAlPortapapeles } from "../../../../redux/actions";
import { AREAS, Comanda } from "../../../../redux/actions-types";

export function CardGridComanda() {
  const allComanda = useSelector((state) => state.allComanda || []);
  const dispatch = useDispatch();
  const globalExpandedGroups = useSelector((state) => state.expandedGroups);

  const groupedComanda = allComanda.reduce((acc, Comanda) => {
    const group = AREAS.includes(Comanda.Categoria) ? Comanda.Categoria : "SIN CATEGORÍA";
    if (!acc[group]) acc[group] = [];
    acc[group].push(Comanda);
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

  const filteredComanda = Object.keys(groupedComanda).reduce((acc, group) => {
    const filteredGroup = groupedComanda[group].filter(
      (Comanda) =>
        searchTerm === "" || (Comanda.Nombre && Comanda.Nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filteredGroup.length > 0) {
      acc[group] = filteredGroup;
    }
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-2 ml-4 mr-4 ">
      <input
        type="text"
        placeholder="Buscar Comanda..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded-md bg-white"
      />
      {Object.keys(filteredComanda)
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
                  {group.toUpperCase()} ({filteredComanda[group].length})
                </span>
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mr-2 bg-green-500 text-white text-xs rounded-full hover:bg-green-600"
                onClick={() => {
                  dispatch(copiarAlPortapapeles(filteredComanda[group], Comanda));
                }}
              >
                📋
              </button>
            </div>
            {expandedGroups[group] && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredComanda[group].map((Comanda, index) => (
                  <CardGridComanda_Instance
                    key={index}
                    item={Comanda}
                    currentType={Comanda}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
