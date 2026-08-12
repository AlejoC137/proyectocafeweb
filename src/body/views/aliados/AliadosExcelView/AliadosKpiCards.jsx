import React from 'react';

export function AliadosKpiCards({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3 flex-shrink-0">
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Aliados</span>
        <span className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</span>
      </div>
      <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">Activos</span>
        <span className="text-2xl font-bold text-emerald-800 mt-1">{stats.activos}</span>
      </div>
      <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase text-amber-700 tracking-wider">Prospectos</span>
        <span className="text-2xl font-bold text-amber-800 mt-1">{stats.prospectos}</span>
      </div>
      <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase text-blue-700 tracking-wider">En Negociación</span>
        <span className="text-2xl font-bold text-blue-800 mt-1">{stats.negociacion}</span>
      </div>
      <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase text-rose-700 tracking-wider">Inactivos</span>
        <span className="text-2xl font-bold text-rose-800 mt-1">{stats.inactivos}</span>
      </div>
    </div>
  );
}

export default AliadosKpiCards;
