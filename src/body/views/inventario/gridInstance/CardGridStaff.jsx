import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CardGridStaff_Instance } from "./CardGridStaff_Instance";
import { copiarAlPortapapeles } from "../../../../redux/actions";
import { ProduccionInterna } from "../../../../redux/actions-types";

export function CardGridStaff({ currentType }) {
  const allStaff = useSelector((state) => state.allStaff || []);
  const ESTATUS = currentType === ProduccionInterna ? "PP" : "PC";
  const dispatch = useDispatch();
  const globalExpandedGroups = useSelector((state) => state.expandedGroups);

  const groupedStaff = allStaff.reduce((acc, staff) => {
    const group = staff.Cargo || "SIN CARGO";
    if (!acc[group]) acc[group] = [];
    acc[group].push(staff);
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

  const filteredStaff = Object.keys(groupedStaff).reduce((acc, group) => {
    const filteredGroup = groupedStaff[group].filter(
      (staff) =>
        searchTerm === "" || (staff.Nombre && staff.Nombre.toLowerCase().includes(searchTerm.toLowerCase()))
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
        placeholder="Buscar staff..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded-md bg-white"
      />
      {Object.keys(filteredStaff)
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
                  {group.toUpperCase()} ({filteredStaff[group].length})
                </span>
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mr-2 bg-green-500 text-white text-xs rounded-full hover:bg-green-600"
                onClick={() => {
                  dispatch(copiarAlPortapapeles(filteredStaff[group], ESTATUS));
                }}
              >
                📋
              </button>
            </div>
            {expandedGroups[group] && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStaff[group].map((staff, index) => (
                  <CardGridStaff_Instance
                    key={index}
                    staff={staff}
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
