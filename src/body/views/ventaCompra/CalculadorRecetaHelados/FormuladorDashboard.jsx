import React from "react";
import { PieChart, Thermometer } from "lucide-react";

export function FormuladorDashboard({ calculations, targets, tipoHelado }) {
  const isGrasaOk = calculations.grasaPct >= targets.grasa.min && calculations.grasaPct <= targets.grasa.max;
  const isSolidosOk = calculations.solidosPct >= targets.solidos.min && calculations.solidosPct <= targets.solidos.max;
  const isPodOk = calculations.pod >= targets.pod.min && calculations.pod <= targets.pod.max;
  const isPacOk = calculations.pac >= targets.pac.min && calculations.pac <= targets.pac.max;

  return (
    <div className="bg-white border-2 border-black p-4 shadow-solid space-y-4">
      <h2 className="font-bold text-base text-gray-900 border-b-2 border-black pb-2 flex items-center gap-2">
        <PieChart className="h-5 w-5 text-terracotta-accent" />
        Resultados del Balance ({tipoHelado})
      </h2>

      {/* GRASA % */}
      <div className="p-3 border-2 border-black bg-blue-50 relative">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-xs text-gray-800">Materia Grasa (%):</span>
          <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isGrasaOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
            {isGrasaOk ? "Óptimo" : "Fuera de Rango"}
          </span>
        </div>
        <div className="text-2xl font-black text-blue-900 font-mono">
          {calculations.grasaPct.toFixed(2)}%
        </div>
        <div className="text-[11px] text-gray-600 mt-1">
          Rango recomendado: <strong>{targets.grasa.opt}</strong>
        </div>
      </div>

      {/* SOLIDOS TOTALES % */}
      <div className="p-3 border-2 border-black bg-amber-50 relative">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-xs text-gray-800">Sólidos Totales (%):</span>
          <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isSolidosOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
            {isSolidosOk ? "Óptimo" : "Fuera de Rango"}
          </span>
        </div>
        <div className="text-2xl font-black text-amber-900 font-mono">
          {calculations.solidosPct.toFixed(2)}%
        </div>
        <div className="text-[11px] text-gray-600 mt-1">
          Agua restante: <strong>{calculations.aguaPct.toFixed(2)}%</strong> (Opt: {targets.solidos.opt})
        </div>
      </div>

      {/* POD (Poder Edulcorante) */}
      <div className="p-3 border-2 border-black bg-purple-50 relative">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-xs text-gray-800 flex items-center gap-1">
            POD (Poder Edulcorante):
            <span className="text-[10px] font-normal text-purple-700 bg-purple-100 px-1 border border-purple-300">Sacarosa = 100</span>
          </span>
          <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isPodOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
            {isPodOk ? "Óptimo" : "Ajustar Dulzor"}
          </span>
        </div>
        <div className="text-2xl font-black text-purple-900 font-mono">
          {calculations.pod.toFixed(2)}
        </div>
        <div className="text-[11px] text-gray-600 mt-1">
          Rango recomendado: <strong>{targets.pod.opt}</strong>
        </div>
      </div>

      {/* PAC (Poder Anticongelante) */}
      <div className="p-3 border-2 border-black bg-teal-50 relative">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-xs text-gray-800 flex items-center gap-1">
            PAC (Poder Anticongelante):
            <span className="text-[10px] font-normal text-teal-700 bg-teal-100 px-1 border border-teal-300">Sacarosa = 100</span>
          </span>
          <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${isPacOk ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}`}>
            {isPacOk ? "Óptimo" : "Ajustar Dureza"}
          </span>
        </div>
        <div className="text-2xl font-black text-teal-900 font-mono">
          {calculations.pac.toFixed(2)}
        </div>
        <div className="text-[11px] text-gray-600 mt-1">
          Rango recomendado: <strong>{targets.pac.opt}</strong>
        </div>
      </div>

      {/* SERVING TEMP ESTIMATE */}
      <div className="p-3 border-2 border-black bg-cyan-100 text-cyan-950">
        <div className="flex items-center gap-2 mb-1">
          <Thermometer className="h-4 w-4 text-cyan-700" />
          <span className="font-bold text-xs">Temp. de Servicio Estimada:</span>
        </div>
        <div className="text-xl font-black font-mono">
          {calculations.tempServicio.toFixed(2)} °C
        </div>
        <div className="text-[10px] text-cyan-800 mt-1">
          Algoritmo Dubovik: {tipoHelado === "SORBETE" ? "PAC / -2.5" : "PAC / -2"}
        </div>
      </div>
    </div>
  );
}

export default FormuladorDashboard;
