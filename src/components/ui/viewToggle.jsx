import React from "react";
import { Grid, List } from "lucide-react";

export function ViewToggle({ viewMode, onViewModeChange, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Vista:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("cards")}
          className={`flex items-center  bg-gray-100  gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === "cards"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Grid className="w-4 h-4" />
          Tarjetas
        </button>
        <button
          onClick={() => onViewModeChange("table")}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === "table"
              ? "bg-white text-blue-600 shadow-sm"
              : "bg-white text-gray-600 hover:text-gray-800"
          }`}
        >
          <List className="w-4 h-4" />
          Tabla Excel
        </button>
      </div>
    </div>
  );
}
