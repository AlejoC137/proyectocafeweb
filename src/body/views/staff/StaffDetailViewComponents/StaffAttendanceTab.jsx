import React from "react";
import * as Tabs from '@radix-ui/react-tabs';
import { Calendar, Edit2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTitle, formatCurrency, calculateDuration } from './StaffDetailHelpers';

export const StaffAttendanceTab = ({
  formData,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleCalcularNomina,
  cc,
  navigate,
}) => {
  return (
    <Tabs.Content value="history" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <SectionTitle>Registro de Asistencia</SectionTitle>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <Calendar className="w-4 h-4" /> Periodo:
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleCalcularNomina}
            variant="default"
            size="sm"
            className="ml-2 gap-2 h-8 bg-blue-600 hover:bg-blue-700"
          >
            <Calculator className="w-4 h-4" /> Calcular Nómina
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {(() => {
          const filteredTurnos = (Array.isArray(formData.Turnos) ? formData.Turnos : []).filter(t => {
            const tDate = t.fecha || t.turnoDate?.split('T')[0];
            return tDate >= startDate && tDate <= endDate;
          });

          const totalHours = filteredTurnos.reduce((total, t) => {
            return total + parseFloat(calculateDuration(t.horaInicio, t.horaCierre || t.horaSalida));
          }, 0);

          const baseRate = Number(formData.Rate) || 0;
          const basePay = totalHours * baseRate;
          const socialSecurity = basePay * 0.1;

          const periodTips = (Array.isArray(formData.Propinas) ? formData.Propinas : [])
            .filter((propina) => {
              const tipDateStr = propina.tipDia || propina.fecha || "";
              if (!tipDateStr) return false;
              const tipDate = new Date(tipDateStr.includes('T') ? tipDateStr : `${tipDateStr}T00:00:00`);
              const start = new Date(`${startDate}T00:00:00`);
              const end = new Date(`${endDate}T23:59:59`);
              return tipDate >= start && tipDate <= end;
            })
            .reduce((total, propina) => total + parseFloat(propina.tipMonto || 0), 0) / 1000;

          const totalToPay = basePay + socialSecurity + periodTips;
          const averageHourlyRate = totalHours > 0 ? totalToPay / totalHours : 0;

          return (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Turnos</span>
                <span className="text-2xl font-bold text-slate-800">{filteredTurnos.length}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Propinas</span>
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(periodTips)}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Seg. Social (10%)</span>
                <span className="text-2xl font-bold text-slate-800">{formatCurrency(socialSecurity)}</span>
              </div>
              <div className="bg-amber-600 p-4 rounded-xl shadow-lg shadow-amber-100 flex flex-col">
                <span className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mb-1">Promedio/Hora (Check)</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(averageHourlyRate)}</span>
              </div>
              <div className="bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-100 flex flex-col">
                <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mb-1">Total a Pagar</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(totalToPay)}</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Fecha de Turno</th>
              <th className="px-6 py-4 text-center">Hora Ingreso</th>
              <th className="px-6 py-4 text-center">Hora Salida</th>
              <th className="px-6 py-4 text-right">Horas Totales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {(() => {
              const filtered = (Array.isArray(formData.Turnos) ? formData.Turnos : []).filter(t => {
                const tDate = t.fecha || t.turnoDate?.split('T')[0];
                return tDate >= startDate && tDate <= endDate;
              });

              return filtered.length > 0 ? (
                filtered.sort((a, b) => new Date(b.fecha || b.turnoDate) - new Date(a.fecha || a.turnoDate)).map((turno, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition duration-150">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {turno.fecha || turno.turnoDate?.split('T')[0] || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{turno.horaInicio || '--:--'}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{turno.horaCierre || turno.horaSalida || '--:--'}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                      {calculateDuration(turno.horaInicio, turno.horaCierre || turno.horaSalida)} hrs
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 opacity-20" />
                      <p>No se registran turnos en este periodo.</p>
                    </div>
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={() => navigate(`/staff-manager/${cc}/editar-turnos?desde=${startDate}&hasta=${endDate}`)}
          className="bg-amber-600 hover:bg-amber-700 gap-2"
        >
          <Edit2 className="w-4 h-4" /> Editar Turnos
        </Button>
      </div>
    </Tabs.Content>
  );
};

export default StaffAttendanceTab;
