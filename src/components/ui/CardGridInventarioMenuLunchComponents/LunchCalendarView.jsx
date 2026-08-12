import React, { useState } from "react";

export const LunchCalendarView = ({ products, onAddNew, onEditLunch, onDeleteLunch, showEdit }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const CalendarCard = ({ product, showEdit, onEditLunch, onDeleteLunch }) => {
        let compLunchData = null;
        try {
            compLunchData = (product.Comp_Lunch && typeof product.Comp_Lunch === 'string')
                ? JSON.parse(product.Comp_Lunch)
                : product.Comp_Lunch;
        } catch (error) { /* Fallback UI */ }

        const proteina = compLunchData?.proteina?.nombre || 'N/A';

        const handleDeleteClick = (e) => {
            e.stopPropagation();
            onDeleteLunch(product._id, product.NombreES);
        };

        return (
            <div
                onClick={() => showEdit && onEditLunch(product)}
                className={`bg-white border rounded-lg p-2 my-1 shadow-sm text-xs relative ${showEdit ? 'cursor-pointer hover:shadow-md hover:border-blue-400' : ''}`}
            >
                {showEdit && (
                    <button
                        onClick={handleDeleteClick}
                        className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-20"
                        title={`Eliminar ${product.NombreES}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}

                <p className="font-bold text-blue-800 truncate mb-2 pr-6">{product.NombreES}</p>
                <div className="flex items-center gap-1.5 text-gray-700">
                    <span title="Proteína">🥩</span>
                    <p className="">{proteina}</p>
                </div>
                <hr className="my-2" />
            </div>
        );
    };

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const getMonthName = (date) => date.toLocaleString('es-ES', { month: 'long' });
    const getYear = (date) => date.getFullYear();

    const productsByDate = products.reduce((acc, product) => {
        try {
            const compLunchObj = (typeof product.Comp_Lunch === 'string') ? JSON.parse(product.Comp_Lunch) : product.Comp_Lunch;
            if (compLunchObj?.fecha?.fecha) {
                const date = compLunchObj.fecha.fecha;
                if (!acc[date]) acc[date] = [];
                acc[date].push(product);
            }
        } catch (e) { console.error("Error parsing Comp_Lunch:", e); }
        return acc;
    }, {});

    const renderCalendarGrid = () => {
        const totalDays = daysInMonth(currentDate);
        const firstDayOfMonth = startOfMonth(currentDate).getDay();
        const calendarDays = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-start-${i}`} className="border-t border-r bg-gray-50 min-h-[10rem]"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayProducts = productsByDate[dateStr] || [];
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            calendarDays.push(
                <div key={day} className="border-t border-r p-2 min-h-[10rem] overflow-y-auto relative flex flex-col">
                    <div className={`text-xs font-bold self-start ${isToday ? 'bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-600'}`}>
                        {day}
                    </div>
                    <div className="mt-1 flex-grow">
                        {dayProducts.map(p =>
                            <CalendarCard
                                key={p._id}
                                product={p}
                                showEdit={showEdit}
                                onEditLunch={onEditLunch}
                                onDeleteLunch={onDeleteLunch}
                            />
                        )}
                    </div>
                    {showEdit && (
                        <div className="absolute bottom-1 right-1">
                            <button
                                onClick={onAddNew}
                                className="bg-gray-100 text-gray-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-200 hover:text-green-800"
                                title="Crear nuevo almuerzo"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        const remainingCells = (7 - (calendarDays.length % 7)) % 7;
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                calendarDays.push(<div key={`empty-end-${i}`} className="border-t border-r bg-gray-50 min-h-[10rem]"></div>);
            }
        }
        return calendarDays;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="px-4 py-2 bg-gray-100 rounded-lg">‹</button>
                <h2 className="text-xl font-bold">{getMonthName(currentDate)} {getYear(currentDate)}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="px-4 py-2 bg-gray-100 rounded-lg">›</button>
            </div>
            <div className="grid grid-cols-7 text-xs text-center font-bold text-gray-500 border-l border-t border-b">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="py-2 border-r bg-gray-50">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 border-l border-b">
                {renderCalendarGrid()}
            </div>
        </div>
    );
};

export default LunchCalendarView;
