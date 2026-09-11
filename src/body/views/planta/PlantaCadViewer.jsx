import React, { useState } from 'react';
import { Building2, Flame, Layers, CheckSquare, Square, FileCode, Edit3, CheckCircle2 } from 'lucide-react';
import { PLANTA_CONFIG } from './plantaData';
import dxfData from '../../../assets/data/plantaDxfData.json';
import dxfSvgData from '../../../assets/data/plantaDxfSvgData.json';
import PlantaCadEditor from './PlantaCadEditor';

export default function PlantaCadViewer({ 
  equipos = PLANTA_CONFIG.equipos, 
  setEquipos, 
  dimensionesHabitacion = { ancho: 3.20, largo: 3.10 },
  setDimensionesHabitacion,
  analisisProductos = [],
  horasTurno = 8,
  onResetOriginal,
  syncStatus = 'idle',
  onForceSaveSupabase
}) {
  const [vistaPlano, setVistaPlano] = useState('editor'); // 'editor', 'dxf', 'vectorial'
  const [selectedEquipoId, setSelectedEquipoId] = useState(() => equipos[0]?.id || PLANTA_CONFIG.equipos[0]?.id);

  const equipoSeleccionado = React.useMemo(() => {
    return equipos.find(e => e.id === selectedEquipoId) || equipos[0] || PLANTA_CONFIG.equipos[0];
  }, [equipos, selectedEquipoId]);

  const handleSelectEquipo = (eqOrId) => {
    const id = typeof eqOrId === 'string' ? eqOrId : eqOrId?.id;
    if (id) setSelectedEquipoId(id);
  };

  // Filtros de capas DXF
  const [capasActivas, setCapasActivas] = useState({
    muros: true,
    mobiliario: true,
    puertas: true,
    cotas: true,
    textos: true
  });

  const toggleCapa = (capa) => {
    setCapasActivas(prev => ({ ...prev, [capa]: !prev[capa] }));
  };

  return (
    <div className="space-y-1.5">
      {/* Selector de modo de visualización y edición */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white border-2 border-black p-1.5 px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-[#f97316]" />
          <span className="font-black text-xs uppercase">Plano Arquitectónico & Diseñador 2D:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'editor', label: '✎ Diseñador 2D (Con Regla Graduada)', badge: 'Principal', highlight: true },
            { id: 'dxf', label: '★ Vista AutoCAD DXF' },
            { id: 'vectorial', label: 'Diagrama Esquemático' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setVistaPlano(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-black transition-all ${
                vistaPlano === m.id 
                  ? (m.highlight ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-[#f97316] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]')
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {m.label}
              {m.badge && (
                <span className="text-[9px] px-1 py-0.2 bg-white text-black font-black uppercase">
                  {m.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MODO EDITOR INTERACTIVO */}
      {vistaPlano === 'editor' && (
        <PlantaCadEditor 
          equipos={equipos}
          setEquipos={setEquipos}
          dimensionesHabitacion={dimensionesHabitacion}
          setDimensionesHabitacion={setDimensionesHabitacion}
          analisisProductos={analisisProductos}
          horasTurno={horasTurno}
          equipoSeleccionado={equipoSeleccionado}
          setEquipoSeleccionado={handleSelectEquipo}
          onResetOriginal={onResetOriginal}
          syncStatus={syncStatus}
          onForceSaveSupabase={onForceSaveSupabase}
        />
      )}

      {/* MODOS DE VISUALIZACIÓN */}
      {vistaPlano !== 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visor Central del Plano */}
          <div className="lg:col-span-8 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[540px]">
            {/* MODO 1: DXF REAL AUTOCAD */}
            {vistaPlano === 'dxf' && (
              <div className="w-full flex flex-col items-center">
                {/* Banner de archivo DXF leído */}
                <div className="w-full max-w-xl bg-emerald-50 border-2 border-emerald-600 p-2.5 mb-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span>DXF Leído: <code>{dxfData.filename}</code></span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-700 text-white font-mono text-[10px] font-bold">
                    {dxfData.version}
                  </span>
                </div>

                {/* Controles de Capas del DXF */}
                <div className="w-full max-w-xl flex flex-wrap gap-2 mb-3 text-xs">
                  {[
                    { id: 'muros', label: 'Muros (3.2m x 3.1m)', color: 'text-gray-900' },
                    { id: 'mobiliario', label: 'Equipos/Mobiliario', color: 'text-orange-600' },
                    { id: 'puertas', label: 'Puertas Batientes', color: 'text-blue-600' },
                    { id: 'cotas', label: 'Cotas Arquitectónicas', color: 'text-emerald-600' }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => toggleCapa(c.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 border border-black font-bold text-[11px] ${
                        capasActivas[c.id] ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 line-through'
                      }`}
                    >
                      {capasActivas[c.id] ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Render Vectorial SVG del DXF Real - Exactitud Nativa CAD */}
                <div className="w-full max-w-xl aspect-[32/31] bg-[#f8fafc] border-4 border-black relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none overflow-hidden">
                  <svg 
                    viewBox="-15 -15 350 340" 
                    className="w-full h-full"
                    style={{ backgroundColor: '#fdfbf7' }}
                  >
                    <defs>
                      <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                      </pattern>
                    </defs>

                    <rect x="-15" y="-15" width="350" height="340" fill="url(#cadGrid)" />

                    {/* Muros del plano DXF Real (Capas X-ARQ-MURO_CUT, X-ARQ-MURO_PROJ) */}
                    {capasActivas.muros && (
                      <g className="dxf-walls">
                        {dxfSvgData.modelLines
                          .filter(l => l.layer?.includes('MURO') || l.layer === '0')
                          .map((l, idx) => (
                            <line
                              key={`ml-${idx}`}
                              x1={l.x1}
                              y1={l.y1}
                              x2={l.x2}
                              y2={l.y2}
                              stroke={l.layer.includes('CUT') ? '#0f172a' : '#64748b'}
                              strokeWidth={l.layer.includes('CUT') ? 2.8 : 1.2}
                              strokeDasharray={l.layer.includes('PROJ') ? '3 2' : 'none'}
                            />
                          ))}
                        {/* Relleno de muros perimetrales */}
                        <rect x="-15" y="-15" width="350" height="15" fill="#334155" opacity="0.3" />
                        <rect x="-15" y="310" width="85" height="15" fill="#334155" opacity="0.3" />
                        <rect x="155" y="310" width="100" height="15" fill="#334155" opacity="0.3" />
                        <rect x="320" y="-15" width="15" height="255" fill="#334155" opacity="0.3" />
                        <rect x="-15" y="-15" width="15" height="340" fill="#334155" opacity="0.3" />
                      </g>
                    )}

                    {/* Mobiliario y Equipos Nativos del DXF */}
                    {capasActivas.mobiliario && (
                      <g className="dxf-furniture">
                        {dxfSvgData.blockInstances
                          .filter(b => !b.name?.includes('PUERTA'))
                          .map((b, bIdx) => {
                            const isHorno = b.name.includes('Horno');
                            const isMeson = b.name.includes('Surface');
                            const isNevera = b.name.includes('NEVERA');
                            const isCanastillas = b.name.includes('Canastillas');
                            const isRepisa = b.name.includes('Repiza');

                            let fillColor = 'rgba(249, 115, 22, 0.12)';
                            let strokeColor = '#ea580c';
                            let label = 'Equipo CAD';
                            let targetId = 'horno-padrino';

                            if (isHorno) {
                              fillColor = 'rgba(234, 88, 12, 0.2)';
                              strokeColor = '#ea580c';
                              label = 'Horno Padrino (70x85)';
                              targetId = 'horno-padrino';
                            } else if (isMeson) {
                              fillColor = 'rgba(16, 185, 129, 0.2)';
                              strokeColor = '#059669';
                              label = 'Mesón Central Inox (80x110)';
                              targetId = 'meson-central';
                            } else if (isNevera) {
                              fillColor = 'rgba(6, 182, 212, 0.2)';
                              strokeColor = '#0891b2';
                              label = 'Nevera (70x70)';
                              targetId = 'nevera-vertical';
                            } else if (isCanastillas) {
                              fillColor = 'rgba(139, 92, 246, 0.2)';
                              strokeColor = '#7c3aed';
                              label = 'Canastillas (60x40)';
                              targetId = 'pocetas-aux';
                            } else if (isRepisa) {
                              fillColor = 'rgba(234, 179, 8, 0.2)';
                              strokeColor = '#ca8a04';
                              label = 'Repisa (90x35)';
                              targetId = 'estanteria-secos';
                            }

                            const eqObj = equipos.find(e => e.id === targetId) || equipos[0];
                            const isSelected = equipoSeleccionado?.id === eqObj?.id;

                            return (
                              <g 
                                key={`blk-${bIdx}`}
                                onClick={() => handleSelectEquipo(eqObj)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {b.lines.map((l, lIdx) => (
                                  <line
                                    key={`bl-${bIdx}-${lIdx}`}
                                    x1={l.x1}
                                    y1={l.y1}
                                    x2={l.x2}
                                    y2={l.y2}
                                    stroke={isSelected ? '#2563eb' : strokeColor}
                                    strokeWidth={isSelected ? 2.5 : 1.5}
                                  />
                                ))}
                                {b.arcs?.map((a, aIdx) => (
                                  <circle
                                    key={`ba-${bIdx}-${aIdx}`}
                                    cx={a.cx}
                                    cy={a.cy}
                                    r={a.r}
                                    fill="none"
                                    stroke={isSelected ? '#2563eb' : strokeColor}
                                    strokeWidth={1}
                                  />
                                ))}
                              </g>
                            );
                          })}
                      </g>
                    )}

                    {/* Puertas Batientes del DXF (Capas X-ARQ-PUERTAS_CUT y X-ARQ-PROYECCIONES) */}
                    {capasActivas.puertas && (
                      <g className="dxf-doors">
                        {dxfSvgData.blockInstances
                          .filter(b => b.name?.includes('PUERTA'))
                          .map((b, bIdx) => (
                            <g key={`door-${bIdx}`}>
                              {b.lines.map((l, lIdx) => (
                                <line
                                  key={`dl-${bIdx}-${lIdx}`}
                                  x1={l.x1}
                                  y1={l.y1}
                                  x2={l.x2}
                                  y2={l.y2}
                                  stroke={l.layer?.includes('CUT') ? '#1e3a8a' : '#3b82f6'}
                                  strokeWidth={l.layer?.includes('CUT') ? 2 : 1}
                                  strokeDasharray={l.layer?.includes('PROJ') ? '2 2' : 'none'}
                                />
                              ))}
                              {b.arcs?.map((a, aIdx) => {
                                // Dibujar arco de barrido de la puerta
                                const rad1 = (a.a1 * Math.PI) / 180;
                                const rad2 = (a.a2 * Math.PI) / 180;
                                const x1 = a.cx + a.r * Math.cos(rad1);
                                const y1 = a.cy - a.r * Math.sin(rad1);
                                const x2 = a.cx + a.r * Math.cos(rad2);
                                const y2 = a.cy - a.r * Math.sin(rad2);
                                return (
                                  <path
                                    key={`da-${bIdx}-${aIdx}`}
                                    d={`M ${x1} ${y1} A ${a.r} ${a.r} 0 0 0 ${x2} ${y2}`}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="1.2"
                                    strokeDasharray="2 2"
                                  />
                                );
                              })}
                            </g>
                          ))}
                      </g>
                    )}

                    {/* Cotas Arquitectónicas Reales del DXF */}
                    {capasActivas.cotas && (
                      <g className="dxf-dimensions font-mono font-bold text-[10px]">
                        {/* Cota Superior X (3.20m) */}
                        <line x1="0" y1="-8" x2="320" y2="-8" stroke="#047857" strokeWidth="1" />
                        <line x1="0" y1="-12" x2="0" y2="-4" stroke="#047857" strokeWidth="1" />
                        <line x1="320" y1="-12" x2="320" y2="-4" stroke="#047857" strokeWidth="1" />
                        <text x="160" y="-11" fill="#047857" textAnchor="middle" fontSize="9" fontWeight="900">
                          3.20 m
                        </text>

                        {/* Cota Lateral Y (3.10m) */}
                        <line x1="-8" y1="0" x2="-8" y2="310" stroke="#047857" strokeWidth="1" />
                        <line x1="-12" y1="0" x2="-4" y2="0" stroke="#047857" strokeWidth="1" />
                        <line x1="-12" y1="310" x2="-4" y2="310" stroke="#047857" strokeWidth="1" />
                        <text x="-12" y="155" fill="#047857" textAnchor="middle" fontSize="9" fontWeight="900" transform="rotate(-90 -12 155)">
                          3.10 m
                        </text>

                        {/* Cota Mesón Central (1.10m x 0.80m) */}
                        <text x="160" y="94" fill="#059669" textAnchor="middle" fontSize="7.5" fontWeight="bold">
                          0.80 m
                        </text>
                        <text x="112" y="155" fill="#059669" textAnchor="middle" fontSize="7.5" fontWeight="bold" transform="rotate(-90 112 155)">
                          1.10 m
                        </text>
                      </g>
                    )}

                    {/* Textos del DXF */}
                    {capasActivas.textos && (
                      <g className="dxf-texts">
                        <text x="160" y="270" fill="#0f172a" textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="1">
                          PLANTA DE PRODUCCIÓN
                        </text>
                        <text x="160" y="284" fill="#64748b" textAnchor="middle" fontSize="8" fontWeight="bold">
                          CAFÉ - 9.92 m² (3.20m × 3.10m)
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="mt-3 text-xs font-bold text-gray-500 text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span>Geometría 100% Vectorial interpretada de <code>ARQ_CASA_REC - Floor Plan - Piso 1 - Arq.dxf</code> (Líneas, Bloques y Arcos)</span>
                </div>
              </div>
            )}

            {/* MODO 2: PLANO ANOTADO (PNG) */}
            {vistaPlano === 'equipos' && (
              <div className="w-full max-w-xl relative flex flex-col items-center">
                <img 
                  src="/planta/planta_equipos.png" 
                  alt="Plano Planta de Producción con Equipos" 
                  className="w-full h-auto object-contain border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="mt-3 text-xs font-bold text-gray-500 text-center">
                  Plano Anotado: Distribución perimetral de equipos + Mesón Central de 80 &times; 110 cm
                </div>
              </div>
            )}

            {/* MODO 3: PLANO CON COTAS (PNG) */}
            {vistaPlano === 'cotas' && (
              <div className="w-full max-w-xl relative flex flex-col items-center">
                <img 
                  src="/planta/planta_cotas.png" 
                  alt="Plano Planta de Producción Cotas" 
                  className="w-full h-auto object-contain border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="mt-3 text-xs font-bold text-gray-500 text-center">
                  Cotas Arquitectónicas: 3.20 m ancho &times; 3.10 m fondo = 9.92 m² de área total
                </div>
              </div>
            )}

            {/* MODO 4: VECTORIAL ESQUEMÁTICO */}
            {vistaPlano === 'vectorial' && (
              <div className="w-full max-w-xl aspect-[32/31] bg-[#f8fafc] border-4 border-black relative p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-black bg-black text-white px-2 py-0.5">
                  3.20 m
                </div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black bg-black text-white px-2 py-0.5">
                  3.10 m
                </div>

                {equipos.map((eq) => {
                  const isSel = equipoSeleccionado?.id === eq.id;
                  const px = eq.posicion?.x ?? 40;
                  const py = eq.posicion?.y ?? 40;
                  const pw = eq.posicion?.width ?? 20;
                  const ph = eq.posicion?.height ?? 20;

                  return (
                    <div
                      key={eq.id}
                      onClick={() => handleSelectEquipo(eq)}
                      style={{
                        left: px + '%',
                        top: py + '%',
                        width: pw + '%',
                        height: ph + '%'
                      }}
                      className={`absolute border-2 border-black flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                        isSel 
                          ? 'bg-orange-500 text-white z-20 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-105' 
                          : 'bg-white hover:bg-orange-100 text-gray-900 z-10'
                      }`}
                    >
                      <span className="text-[10px] font-black leading-tight text-center truncate w-full">
                        {eq.nombre.split('(')[0]}
                      </span>
                      <span className="text-[8px] font-mono opacity-80">
                        {eq.dimensiones}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ficha Técnica del Equipo Seleccionado */}
          <div className="lg:col-span-4 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
              <Flame className="w-5 h-5 text-[#f97316]" />
              <h3 className="text-lg font-black text-gray-900">Ficha de Equipo CAD / BIM</h3>
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-gray-500">Nombre del Activo</div>
              <div className="text-base font-black text-gray-900 mt-0.5">{equipoSeleccionado?.nombre}</div>
              <div className="text-xs font-mono bg-gray-100 p-1.5 border border-black mt-1">
                Dimensiones CAD: {equipoSeleccionado?.dimensiones}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-950">
                <span className="font-black block uppercase text-[10px]">Restricción / Cuello de Botella:</span>
                {equipoSeleccionado?.cuelloDeBotellaDesc}
              </div>

              {equipoSeleccionado?.camaras && (
                <div className="p-2 bg-gray-50 border border-gray-300">
                  <span className="font-bold">Cámaras Refractarias:</span> {equipoSeleccionado.camaras} independientes
                </div>
              )}

              {equipoSeleccionado?.capacidadBowlLitros && (
                <div className="p-2 bg-gray-50 border border-gray-300">
                  <span className="font-bold">Volumen del Bowl:</span> {equipoSeleccionado.capacidadBowlLitros} Litros (~4 kg masa batida)
                </div>
              )}

              {equipoSeleccionado?.capacidadTartasVascas && (
                <div className="p-2 bg-gray-50 border border-gray-300">
                  <span className="font-bold">Capacidad Tartas Vascas por ciclo:</span> {equipoSeleccionado.capacidadTartasVascas} unidades
                </div>
              )}

              {equipoSeleccionado?.combustible && (
                <div className="p-2 bg-gray-50 border border-gray-300">
                  <span className="font-bold">Fuente Energética:</span> {equipoSeleccionado.combustible}
                </div>
              )}

              {equipoSeleccionado?.usos && (
                <div className="p-2 bg-gray-50 border border-gray-300">
                  <span className="font-bold">Función en Línea:</span> {equipoSeleccionado.usos}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs font-bold uppercase text-gray-500 mb-2">Seleccionar otro equipo del plano:</div>
              <div className="flex flex-wrap gap-1.5">
                {equipos.map(eq => (
                  <button
                    key={eq.id}
                    onClick={() => handleSelectEquipo(eq)}
                    className={`px-2 py-1 text-xs font-bold border border-black ${
                      equipoSeleccionado?.id === eq.id ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {eq.nombre.split(' ')[0]} {eq.dimensiones ? eq.dimensiones.split(' ')[0] : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
