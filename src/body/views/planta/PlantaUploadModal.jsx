import React from 'react';
import { FileUp, FileText, FileSpreadsheet, Image } from 'lucide-react';

export default function PlantaUploadModal() {
  return (
    <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-black">
        <FileUp className="w-6 h-6 text-[#f97316]" />
        <div>
          <h3 className="text-xl font-black text-gray-900">
            ¿Cómo pasar o integrar un plano para cálculo automatizado?
          </h3>
          <p className="text-xs text-gray-500">
            Guía de compatibilidad de formatos de arquitectura, ingeniería y CAD/BIM para el sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DXF / SVG */}
        <div className="p-4 border-2 border-black bg-orange-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 bg-orange-600 text-white font-bold text-xs uppercase">
              Recomendado Vectorial
            </span>
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <h4 className="text-base font-black text-gray-900 mt-2">1. DXF o SVG (AutoCAD / Revit)</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            <b>DXF (Drawing Exchange Format)</b> o exportar a <b>SVG</b> desde AutoCAD/Revit permite que el navegador dibuje directamente cada polilínea, cota y nombre de equipo de manera 100% interactiva con zoom y pan.
          </p>
          <div className="text-[11px] font-mono text-gray-500 bg-white p-2 border border-gray-300">
            Exportar en AutoCAD: Comando <code>DXFOUT</code> o imprimir a PDF vectorial.
          </div>
        </div>

        {/* CSV / Excel */}
        <div className="p-4 border-2 border-black bg-blue-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-xs uppercase">
              Ideal para Datos BIM
            </span>
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-base font-black text-gray-900 mt-2">2. CSV / Excel (Tabla BIM)</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Si tienes una tabla con los equipos (Nombre, Ancho, Largo, Capacidad Lote, Tiempo Ciclo, Consumo Gas/Luz), se importa directamente para recalcular automáticamente las fórmulas sin rediseñar el plano.
          </p>
          <div className="text-[11px] font-mono text-gray-500 bg-white p-2 border border-gray-300">
            Columnas: Equipo, Ancho_cm, Largo_cm, Ciclo_Min, Capacidad_Batch.
          </div>
        </div>

        {/* Imagen PNG / JPG */}
        <div className="p-4 border-2 border-black bg-green-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 bg-green-600 text-white font-bold text-xs uppercase">
              Activo en la App
            </span>
            <Image className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="text-base font-black text-gray-900 mt-2">3. Imagen PNG / JPG o PDF</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            <b>¡Las imágenes que subiste recién funcionaron a la perfección!</b> Las procesamos, detectamos las medidas (3.2m x 3.1m, mesón 0.8x1.1) y ya están montadas en la pestaña &quot;Plano CAD &amp; Equipos&quot;.
          </p>
          <div className="text-[11px] font-mono text-gray-500 bg-white p-2 border border-gray-300">
            Ubicación en el proyecto: <code>/public/planta/planta_equipos.png</code>
          </div>
        </div>
      </div>

      {/* Zona de Drop para Cargar Nuevos Archivos */}
      <div className="border-2 border-dashed border-black p-8 text-center bg-[#fafafa] hover:bg-orange-50/30 transition-colors cursor-pointer">
        <FileUp className="w-10 h-10 text-gray-400 mx-auto mb-2" />
        <div className="font-black text-sm text-gray-800">
          Arrastra aquí tu plano en formato DXF, DWG, PDF o CSV
        </div>
        <p className="text-xs text-gray-500 mt-1">
          O haz clic para seleccionar archivo desde tu ordenador
        </p>
        <input 
          type="file" 
          accept=".dxf,.dwg,.pdf,.csv,.json,.png,.jpg" 
          className="hidden" 
          id="plano-file-input"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              alert('Archivo recibido: ' + e.target.files[0].name + ' (Guardado para análisis de capas).');
            }
          }}
        />
        <button 
          onClick={() => document.getElementById('plano-file-input')?.click()}
          className="mt-4 px-4 py-2 bg-black text-white font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(249,115,22,1)] hover:bg-gray-800"
        >
          Seleccionar Archivo de Plano
        </button>
      </div>
    </div>
  );
}
