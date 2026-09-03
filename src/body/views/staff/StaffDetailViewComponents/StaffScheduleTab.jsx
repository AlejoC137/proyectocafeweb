import React from "react";
import * as Tabs from '@radix-ui/react-tabs';
import WeeklyTimeGrid from '../../../components/staff/WeeklyTimeGrid';
import { SectionTitle, calculateDuration } from './StaffDetailHelpers';

export const StaffScheduleTab = ({
  formData,
  isEditing,
  setFormData,
}) => {
  return (
    <Tabs.Content value="schedule" className="outline-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SectionTitle>Plantilla de Horario Base</SectionTitle>

      {(() => {
        const weeklyHours = Object.values(formData.TurnosSet || {}).reduce((total, day) => {
          if (day.descanso || !day.inicio || !day.fin) return total;
          let h = parseFloat(calculateDuration(day.inicio, day.fin)) || 0;
          return total + h;
        }, 0);
        const monthlyHours = (weeklyHours / 7) * 30;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col items-center justify-center">
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mb-1">Horas Semanales</span>
              <span className="text-3xl font-bold text-indigo-700">{weeklyHours.toFixed(1)} <span className="text-lg font-medium text-indigo-400">hrs</span></span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col items-center justify-center">
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mb-1">Horas Mensuales (aprox)</span>
              <span className="text-3xl font-bold text-indigo-700">{monthlyHours.toFixed(1)} <span className="text-lg font-medium text-indigo-400">hrs</span></span>
            </div>
          </div>
        );
      })()}

      <WeeklyTimeGrid
        schedule={formData.TurnosSet || {}}
        isEditing={isEditing}
        staffColor={formData.Color}
        onChange={(newSchedule) => {
          setFormData(prev => ({ ...prev, TurnosSet: newSchedule }));
        }}
      />
    </Tabs.Content>
  );
};

export default StaffScheduleTab;
