import React from "react";

export const ViewToggle = ({ viewMode, onViewModeChange }) => {
    return (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => onViewModeChange('cards')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
            >
                📇 Tarjetas
            </button>
            <button
                onClick={() => onViewModeChange('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
            >
                📅 Calendario
            </button>
        </div>
    );
};

export default ViewToggle;
