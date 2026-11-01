const fs = require('fs');

const orig = fs.readFileSync('src/body/views/planta/PlantaCadEditor.jsx', 'utf8');

// 1. Update imports at top
let code = orig;

// Add plantaConsumosUtils imports and extra lucide icons
const importReplacement = `import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, RotateCcw, RotateCw, Copy, Move, Check, 
  Sparkles, Sliders, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Download, Eye, Database, Cloud, Loader2, DoorOpen, ArrowLeftRight, ArrowUpDown, AppWindow,
  Zap, Flame, Droplets, Wrench, Activity, Gauge, BarChart2, CheckCircle2, AlertTriangle, Layers, Info, FileSpreadsheet, FileCode, RefreshCw
} from 'lucide-react';
import defaultCadLayout from '../../../assets/data/plantaCustomLayout.json';
import dxfSvgData from '../../../assets/data/plantaDxfSvgData.json';
import {
  normalizarEquipoRevit,
  calcularConsumosEquipo,
  calcularConsumosPlanta,
  TARIFAS_SERVICIOS,
  REVIT_TAXONOMIA
} from './plantaConsumosUtils.js';
`;

code = code.replace(/import React, \{ useState, useRef \} from 'react';[\s\S]*?import dxfSvgData from '\.\.\/\.\.\/\.\.\/assets\/data\/plantaDxfSvgData\.json';/, importReplacement);

// 2. Wrap EQUIPOS_PRESETS with normalizarEquipoRevit
code = code.replace(/const EQUIPOS_PRESETS = \[([\s\S]*?)\];\s*\/\/\s*RENDERIZADOR ARQUITECTÓNICO/, (match, presetsBody) => {
  return `const RAW_PRESETS = [${presetsBody}];\n\nconst EQUIPOS_PRESETS = RAW_PRESETS.map(p => normalizarEquipoRevit(p));\n\n// RENDERIZADOR ARQUITECTÓNICO`;
});

// 3. Update PlantaCadEditor function signature to receive MEP & costs props
const funcSigTarget = `export default function PlantaCadEditor({ 
  equipos = [], 
  setEquipos, 
  dimensionesHabitacion = { ancho: 3.20, largo: 3.10 },
  setDimensionesHabitacion,
  analisisProductos = [],
  horasTurno = 8,
  equipoSeleccionado, 
  setEquipoSeleccionado,
  onResetOriginal,
  syncStatus = 'idle',
  onForceSaveSupabase
}) {`;

const funcSigReplacement = `export default function PlantaCadEditor({ 
  equipos = [], 
  setEquipos, 
  dimensionesHabitacion = { ancho: 3.20, largo: 3.10 },
  setDimensionesHabitacion,
  analisisProductos = [],
  horasTurno = 8,
  diasMes = 26,
  costosFijos = {},
  setCostosFijos,
  onSincronizarCostosConConsumos,
  equipoSeleccionado, 
  setEquipoSeleccionado,
  onResetOriginal,
  syncStatus = 'idle',
  onForceSaveSupabase
}) {`;

code = code.replace(funcSigTarget, funcSigReplacement);

// 4. Add MEP states and computations in PlantaCadEditor
const stateTarget = `  const [activeYieldTab, setActiveYieldTab] = useState('tarta-basca');
  const [verMuros, setVerMuros] = useState(true);`;

const stateReplacement = `  const [activeYieldTab, setActiveYieldTab] = useState('tarta-basca');
  const [verMuros, setVerMuros] = useState(true);
  const [inspectorTab, setInspectorTab] = useState('cad'); // 'cad', 'consumos', 'revit'
  const [showConsumosModal, setShowConsumosModal] = useState(false);
  const [tarifasMep, setTarifasMep] = useState(TARIFAS_SERVICIOS);
  const [notifSincronizacion, setNotifSincronizacion] = useState(false);`;

code = code.replace(stateTarget, stateReplacement);

// 5. Update eq resolution to always use normalizarEquipoRevit, and add calculations and handlers
const eqTarget = `  const eq = equipos.find(e => e.id === equipoSeleccionado?.id) || equipoSeleccionado || equipos[0] || {};`;

const eqReplacement = `  const rawSelectedEq = equipos.find(e => e.id === equipoSeleccionado?.id) || equipoSeleccionado || equipos[0] || {};
  const eq = useMemo(() => normalizarEquipoRevit(rawSelectedEq), [rawSelectedEq]);

  // Cálculos de Consumos Teóricos MEP individuales y globales de planta
  const consumoActivo = useMemo(() => {
    return calcularConsumosEquipo(eq, diasMes, tarifasMep);
  }, [eq, diasMes, tarifasMep]);

  const balancePlanta = useMemo(() => {
    return calcularConsumosPlanta(equipos, diasMes, horasTurno, tarifasMep);
  }, [equipos, diasMes, horasTurno, tarifasMep]);

  // Actualizador de Consumos Teóricos MEP de un equipo
  const handleUpdateConsumo = (campo, valor) => {
    setEquipos(prev => prev.map(item => {
      if (item.id === eq.id) {
        const c = { ...(item.consumosTeoricos || {}) };
        c[campo] = valor;
        return normalizarEquipoRevit({ ...item, consumosTeoricos: c });
      }
      return item;
    }));
    triggerGuardado();
  };

  // Actualizador de Nomenclatura Revit de un equipo (review / reviewPlugIn Standard)
  const handleUpdateRevit = (campo, valor) => {
    setEquipos(prev => prev.map(item => {
      if (item.id === eq.id) {
        const updated = { ...item, [campo]: valor };
        const qp = { ...(item.quick_params || {}) };
        if (campo === 'familiaRevit') qp['Family'] = valor;
        if (campo === 'tipoRevit') qp['Type'] = valor;
        if (campo === 'disciplina') qp['Discipline'] = valor;
        if (campo === 'categoriaRevit') qp['Revit Category'] = valor;
        if (campo === 'elementIdRevit') qp['ElementId'] = String(valor);
        updated.quick_params = qp;
        return normalizarEquipoRevit(updated);
      }
      return item;
    }));
    triggerGuardado();
  };

  // Presets Rápidos de Consumo Teórico
  const handleAplicarPresetConsumo = (modo) => {
    if (!eq.id) return;
    let horasUso = 4.0;
    let factorCarga = 80;
    let horasLlama = eq.consumosTeoricos?.usaGas ? 4.0 : 0;
    if (modo === 'eco') {
      horasUso = Math.max(1, Number(((eq.consumosTeoricos?.horasUsoDiario || 4) * 0.7).toFixed(1)));
      factorCarga = 65;
      horasLlama = Math.max(1, Number(((eq.consumosTeoricos?.horasLlamaDiario || 4) * 0.7).toFixed(1)));
    } else if (modo === 'intenso') {
      horasUso = horasTurno;
      factorCarga = 95;
      horasLlama = eq.consumosTeoricos?.usaGas ? Number((horasTurno * 0.9).toFixed(1)) : 0;
    } else {
      // Nominal
      horasUso = eq.tipo === 'HORNO' ? 5.5 : (eq.tipo === 'BATIDORA' ? 3.0 : 4.0);
      factorCarga = 80;
      horasLlama = eq.tipo === 'HORNO' ? 5.0 : 0;
    }
    setEquipos(prev => prev.map(item => {
      if (item.id === eq.id) {
        return normalizarEquipoRevit({
          ...item,
          consumosTeoricos: {
            ...item.consumosTeoricos,
            horasUsoDiario: horasUso,
            factorCargaPct: factorCarga,
            horasLlamaDiario: horasLlama
          }
        });
      }
      return item;
    }));
    triggerGuardado();
  };

  // Sincronizar consumos teóricos calculados con los costos fijos de simulación
  const handleSincronizarCostosConPlanta = () => {
    if (onSincronizarCostosConConsumos) {
      onSincronizarCostosConConsumos();
      setNotifSincronizacion(true);
      setTimeout(() => setNotifSincronizacion(false), 3500);
      return;
    }
    if (setCostosFijos) {
      setCostosFijos(prev => ({
        ...prev,
        electricidadComercial: balancePlanta.costoTotalElecMes,
        gasPropanoPipetas: balancePlanta.costoTotalGasMes
      }));
      setNotifSincronizacion(true);
      setTimeout(() => setNotifSincronizacion(false), 3500);
    }
  };`;

code = code.replace(eqTarget, eqReplacement);

// 6. In top toolbar, add the Consumos MEP button
const toolbarButtonTarget = `<button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-800 font-black text-[11px] border border-blue-800 hover:bg-blue-100"
            title="Descargar archivo plantaCustomLayout.json"
          >
            <Download className="w-3 h-3" /> JSON
          </button>`;

const toolbarButtonReplacement = `<button
            onClick={() => setShowConsumosModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-black font-black text-[11px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[1px] active:translate-y-[1px]"
            title="Abrir Balance de Consumos Teóricos MEP de la Planta (Luz, Gas, Agua)"
          >
            <Zap className="w-3.5 h-3.5 text-black" />
            Consumos MEP (\` + '$' + \`{Math.round(balancePlanta.costoTotalServiciosPlantaMes).toLocaleString('es-CO')}/m)
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-800 font-black text-[11px] border border-blue-800 hover:bg-blue-100"
            title="Descargar archivo plantaCustomLayout.json"
          >
            <Download className="w-3 h-3" /> JSON
          </button>`;

code = code.replace(toolbarButtonTarget, toolbarButtonReplacement);

fs.writeFileSync('src/body/views/planta/PlantaCadEditor.jsx', code, 'utf8');
console.log('Step 1 applied cleanly! Next: inspector tabs & modal.');
