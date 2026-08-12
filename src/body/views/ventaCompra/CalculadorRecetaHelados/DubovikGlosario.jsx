import React from "react";
import { HelpCircle } from "lucide-react";
import { GLOSSARY_DUBOVIK } from "./dubovikData";

export function DubovikGlosario() {
  return (
    <div className="bg-white border-2 border-black p-4 md:p-6 shadow-solid space-y-6">
      {/* TARJETA EXPLICATIVA POD, PAC Y LPD/SMP (SACAROSA = 100/100) */}
      <div className="bg-yellow-50 border-2 border-black p-4 space-y-3">
        <h3 className="font-extrabold text-sm text-yellow-950 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-yellow-700 shrink-0" />
          📘 Conceptos Clave de Balanceo: POD, PAC y LPD/SMP (Sacarosa = 100/100)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-3 border border-black space-y-1.5 shadow-sm">
            <div className="font-bold text-purple-950 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-purple-200 text-purple-900 border border-purple-900 text-[10px] font-mono font-bold">POD</span>
              Poder Edulcorante (Sweetening Power)
            </div>
            <p className="text-gray-700 leading-relaxed">
              Mide la capacidad edulcorante o dulzor que aporta un ingrediente en comparación directa con la <strong>Sacarosa (Azúcar Común)</strong>, la cual se fija arbitrariamente como patrón con <strong>POD = 100</strong>.
            </p>
            <div className="text-[11px] text-purple-900 font-medium bg-purple-50 p-2 border border-purple-200">
              • <strong>Sacarosa (POD 100)</strong>: Dulzor estándar.<br/>
              • <strong>Dextrosa (POD 70)</strong>: Endulza 30% menos que la sacarosa.<br/>
              • <strong>Maltodextrina (POD 15)</strong>: Aporta cuerpo sin empalagar.
            </div>
          </div>

          <div className="bg-white p-3 border border-black space-y-1.5 shadow-sm">
            <div className="font-bold text-teal-950 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-teal-200 text-teal-900 border border-teal-900 text-[10px] font-mono font-bold">PAC</span>
              Poder Anticongelante (Anti-Freezing Power)
            </div>
            <p className="text-gray-700 leading-relaxed">
              Mide la capacidad de los azúcares disueltos para descender el punto de congelación del agua libre del helado (*depresión del punto de congelación*). Toma a la <strong>Sacarosa como patrón de referencia (PAC = 100)</strong>.
            </p>
            <div className="text-[11px] text-teal-900 font-medium bg-teal-50 p-2 border border-teal-200">
              • <strong>Dextrosa (PAC 90)</strong>: Ablanda el helado y baja la temp. de servicio.<br/>
              • <strong>Algoritmo Dubovik Temp Servicio (°C)</strong>:<br/>
              &nbsp;&nbsp; Gelato / Soft: PAC / -2 &nbsp;|&nbsp; Sorbete: PAC / -2.5
            </div>
          </div>

          <div className="bg-white p-3 border border-black space-y-1.5 shadow-sm md:col-span-2">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 border border-amber-900 text-[10px] font-mono font-bold">LPD / SMP</span>
              Leche en Polvo Desnatada / Skimmed Milk Powder (Sólidos Lácteos No Grasos - MSNF)
            </div>
            <p className="text-gray-700 leading-relaxed">
              <strong>LPD (Leche en Polvo Desnatada)</strong> o <strong>SMP (Skimmed Milk Powder)</strong> es la leche desnatada deshidratada (concentra ~96% sólidos secos: proteínas caseínas/suero, lactosa y minerales). Es la fuente fundamental de <strong>Sólidos Lácteos No Grasos (MSNF)</strong> para estabilizar las burbujas de aire (*overrun*) y aportar cremosidad sin sumar materia grasa.
            </p>
            <div className="text-[11px] text-amber-950 font-medium bg-amber-50 p-2 border border-amber-200">
              • <strong>Aporte Dubovik (100g LPD)</strong>: 1.0% Grasa | 96.0% Sólidos | POD 5.2 | PAC 10.4.<br/>
              • <strong>Límite Crítico (Riesgo de Arenosidad / Sandiness)</strong>: No superar el 10% a 11% de MSNF sobre el agua del mix. Si se excede, la lactosa cristaliza formando diminutos granos duros e indeseables en la lengua.
            </div>
          </div>
        </div>
      </div>

      <div className="border-b-2 border-black pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            🧪 Glosario Técnico de Ingredientes & Condiciones (Método Dubovik)
          </h2>
          <p className="text-xs text-gray-600">
            Manual bromatológico y condiciones de formulación física para cada materia prima de la base.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-yellow-200 text-black border-2 border-black font-bold shrink-0">
          {GLOSSARY_DUBOVIK.length} Materias Primas Base
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GLOSSARY_DUBOVIK.map((item, idx) => (
          <div key={idx} className="border-2 border-black bg-cream-bg p-3 shadow-sm flex flex-col justify-between space-y-2 hover:shadow-solid transition-all">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 border-b border-black pb-1">
                <span className="text-base">{item.icono}</span>
                <h3 className="font-bold text-xs text-gray-900">{item.nombre}</h3>
              </div>
              <p className="text-[11px] text-gray-700 leading-snug mb-2">
                {item.definicion}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-300">
              <div className="text-[10px] font-mono font-bold bg-yellow-100 p-1 border border-black text-gray-900">
                {item.valores}
              </div>
              <div className="text-[10px] text-gray-600 bg-white p-1.5 border border-gray-300">
                <strong>Condición:</strong> {item.condiciones}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DubovikGlosario;
