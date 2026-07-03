import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MultiDatePicker({ selectedDates = [], onChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getMonthName = (date) => date.toLocaleString('es-ES', { month: 'long' });
  const getYear = (date) => date.getFullYear();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const toggleDate = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (selectedDates.includes(dateStr)) {
      onChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onChange([...selectedDates, dateStr]);
    }
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const firstDay = startOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDates.includes(dateStr);
      const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => toggleDate(day)}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm transition-all m-auto ${
            isSelected
              ? 'bg-blue-600 text-white font-bold shadow-md'
              : isToday
              ? 'bg-blue-100 text-blue-800 font-bold border border-blue-300'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 w-full min-w-[280px]">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-sm text-gray-700 capitalize">
          {getMonthName(currentMonth)} {getYear(currentMonth)}
        </span>
        <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
          <span key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {renderCalendar()}
      </div>
    </div>
  );
}
