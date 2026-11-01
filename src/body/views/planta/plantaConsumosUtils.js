// Tarifas de Servicios Públicos y Combustibles para Cálculo de Consumos Teóricos MEP (Bogotá / Cundinamarca estándar)
export const TARIFAS_SERVICIOS = {
  tarifaKwhCOP: 850,           // COP por kWh comercial promedio
  tarifaAguaM3COP: 4500,       // COP por m³ de agua potable comercial
  tarifaGasHoraCOP: 2200,      // COP por hora de quemador GLP comercial activo (35.000 BTU/h)
  cilindroGLP40lbCOP: 115000,  // Cilindro de gas propano 40 lb (18 kg)
  kgPorCilindro40lb: 18,
  factorSimultaneidadPlanta: 0.75 // Factor de diversidad / simultaneidad de planta
};

// Jerarquía y taxonomía estándar de Autodesk Revit (BIM / MEP) - review / reviewPlugIn Standard
export const REVIT_TAXONOMIA = {
  disciplinas: [
    'Specialty Equipment (Foodservice)',
    'Mechanical / HVAC (MEP)',
    'Electrical (MEP)',
    'Plumbing & Piping (MEP)',
    'Architecture (ARC)'
  ],
  categorias: [
    'Specialty Equipment',
    'Mechanical Equipment',
    'Electrical Equipment',
    'Plumbing Fixtures',
    'Furniture',
    'Doors',
    'Windows',
    'Walls'
  ]
};

/**
 * Normaliza y enriquece cualquier objeto de equipo (de localStorage, Supabase o presets)
 * con la jerarquía completa de Revit y sus parámetros de consumos teóricos MEP.
 */
export function normalizarEquipoRevit(eq) {
  if (!eq) return {};
  const nombreLower = (eq.nombre || '').toLowerCase();
  const tipoUpper = (eq.tipo || '').toUpperCase();

  // 1. Detección inteligente de Nomenclatura Revit si no viene definida
  let disciplina = eq.disciplina;
  let categoriaRevit = eq.categoriaRevit;
  let familiaRevit = eq.familiaRevit;
  let tipoRevit = eq.tipoRevit;
  let elementIdRevit = eq.elementIdRevit || eq.element_id || Math.floor(6900000 + Math.random() * 200000);
  let uniqueIdRevit = eq.uniqueIdRevit || eq.unique_id || ('1e8f47e0-e3e9-413c-8e3f-' + Math.random().toString(16).substring(2, 10));
  let sistemaMep = eq.sistemaMep || 'GEN-01';

  if (!disciplina || !categoriaRevit || !familiaRevit) {
    if (tipoUpper.includes('HORNO') || nombreLower.includes('horno')) {
      disciplina = 'Specialty Equipment (Foodservice)';
      categoriaRevit = 'Specialty Equipment';
      familiaRevit = 'Horno_Pizza_DobleCamara_Refractario_GLP';
      tipoRevit = '70x85cm - 2 Cámaras - GLP 35.000 BTU/h';
      sistemaMep = 'GAS-GLP-01 / ELEC-CTRL-01';
    } else if (tipoUpper.includes('BATIDORA') || nombreLower.includes('batidora')) {
      disciplina = 'Specialty Equipment (Foodservice)';
      categoriaRevit = 'Specialty Equipment';
      familiaRevit = nombreLower.includes('20') ? 'Batidora_Planetaria_Industrial_20L' : 'Batidora_Planetaria_Pedestal_6L';
      tipoRevit = nombreLower.includes('20') ? '20 Litros - 1.5 kW / 220V Bifásico' : '6 Litros - 800W / 110V Monofásico';
      sistemaMep = 'ELEC-PWR-02';
    } else if (tipoUpper.includes('REFRIGER') || tipoUpper.includes('NEVERA') || nombreLower.includes('nevera')) {
      disciplina = 'Mechanical / HVAC (MEP)';
      categoriaRevit = 'Mechanical Equipment';
      familiaRevit = 'Refrigerador_Vertical_Comercial_420L';
      tipoRevit = '420 Litros - 350W / 110V - R134a';
      sistemaMep = 'ELEC-PWR-03 / DRAIN-COND-01';
    } else if (tipoUpper.includes('ABATIDOR') || nombreLower.includes('abatidor')) {
      disciplina = 'Specialty Equipment (Foodservice)';
      categoriaRevit = 'Specialty Equipment';
      familiaRevit = 'Abatidor_Temperatura_5Bandejas_60x40';
      tipoRevit = '5 Bandejas - 1.2 kW / 220V - R404A';
      sistemaMep = 'ELEC-PWR-04 / DRAIN-COND-02';
    } else if (tipoUpper.includes('LAMINADORA') || nombreLower.includes('laminadora')) {
      disciplina = 'Specialty Equipment (Foodservice)';
      categoriaRevit = 'Specialty Equipment';
      familiaRevit = 'Laminadora_Masas_Hojaldre_Mesa';
      tipoRevit = 'Banda 100x50cm - 750W / 110V';
      sistemaMep = 'ELEC-PWR-05';
    } else if (tipoUpper.includes('LAVADO') || nombreLower.includes('poceta') || nombreLower.includes('lavado')) {
      disciplina = 'Plumbing & Piping (MEP)';
      categoriaRevit = 'Plumbing Fixtures';
      familiaRevit = 'Poceta_Lavado_Doble_Inox_BPM';
      tipoRevit = '180x50cm - 2 Pocetas con Grifería Cuello Cisne';
      sistemaMep = 'PLUMB-WATER-01 / PLUMB-DRAIN-01';
    } else if (tipoUpper.includes('ENERGIA') || nombreLower.includes('pipeta') || nombreLower.includes('glp')) {
      disciplina = 'Plumbing & Piping (MEP)';
      categoriaRevit = 'Mechanical Equipment';
      familiaRevit = 'Cilindro_Almacenamiento_GLP_40lb';
      tipoRevit = 'Capacidad 18 kg GLP - Regulador 2 psi';
      sistemaMep = 'GAS-GLP-SUPPLY';
    } else if (tipoUpper.includes('PUERTA') || tipoUpper.includes('VENTANA')) {
      disciplina = 'Architecture (ARC)';
      categoriaRevit = tipoUpper.includes('PUERTA') ? 'Doors' : 'Windows';
      familiaRevit = tipoUpper.includes('PUERTA') ? 'Puerta_Batiente_Obrador' : 'Ventana_Aluminio_Termica';
      tipoRevit = eq.dimensiones || 'Vano Estándar';
      sistemaMep = 'NONE';
    } else {
      disciplina = 'Architecture (ARC)';
      categoriaRevit = 'Furniture';
      familiaRevit = 'Mobiliario_AceroInox_AISI304';
      tipoRevit = eq.dimensiones || 'Módulo Inox';
      sistemaMep = 'NONE';
    }
  }

  // 2. Consumos teóricos por defecto según la naturaleza del equipo
  const rawConsumo = eq.consumosTeoricos || {};
  let defaultPotenciaW = 0;
  let defaultVoltios = 110;
  let defaultHorasUso = 0;
  let defaultFactorCarga = 80;
  let defaultUsaGas = false;
  let defaultPotenciaBTU = 0;
  let defaultHorasLlama = 0;
  let defaultCostoHoraGas = 2200;
  let defaultUsaAgua = false;
  let defaultLitrosAgua = 0;
  let defaultMantenimientoCOP = 10000;

  if (tipoUpper.includes('HORNO') || nombreLower.includes('horno')) {
    defaultPotenciaW = 120;
    defaultHorasUso = 6.0;
    defaultFactorCarga = 90;
    defaultUsaGas = true;
    defaultPotenciaBTU = 35000;
    defaultHorasLlama = 5.5;
    defaultCostoHoraGas = 2200;
    defaultMantenimientoCOP = 45000;
  } else if (tipoUpper.includes('BATIDORA') || nombreLower.includes('batidora')) {
    defaultPotenciaW = nombreLower.includes('20') ? 1500 : 800;
    defaultVoltios = nombreLower.includes('20') ? 220 : 110;
    defaultHorasUso = 3.0;
    defaultFactorCarga = 80;
    defaultUsaAgua = true;
    defaultLitrosAgua = 25;
    defaultMantenimientoCOP = 20000;
  } else if (tipoUpper.includes('REFRIGER') || tipoUpper.includes('NEVERA') || nombreLower.includes('nevera')) {
    defaultPotenciaW = 350;
    defaultHorasUso = 24.0;
    defaultFactorCarga = 45;
    defaultMantenimientoCOP = 30000;
  } else if (tipoUpper.includes('ABATIDOR') || nombreLower.includes('abatidor')) {
    defaultPotenciaW = 1200;
    defaultVoltios = 220;
    defaultHorasUso = 4.0;
    defaultFactorCarga = 90;
    defaultUsaAgua = true;
    defaultLitrosAgua = 15;
    defaultMantenimientoCOP = 35000;
  } else if (tipoUpper.includes('LAMINADORA') || nombreLower.includes('laminadora')) {
    defaultPotenciaW = 750;
    defaultHorasUso = 2.5;
    defaultFactorCarga = 75;
    defaultMantenimientoCOP = 20000;
  } else if (tipoUpper.includes('LAVADO') || nombreLower.includes('poceta') || nombreLower.includes('lavado')) {
    defaultUsaAgua = true;
    defaultLitrosAgua = 140;
    defaultMantenimientoCOP = 15000;
  } else if (tipoUpper.includes('ENERGIA') || nombreLower.includes('pipeta') || nombreLower.includes('glp')) {
    defaultUsaGas = true;
    defaultPotenciaBTU = 35000;
    defaultHorasLlama = 5.5;
    defaultCostoHoraGas = 2200;
    defaultMantenimientoCOP = 10000;
  }

  const consumosTeoricos = {
    potenciaElectricaW: rawConsumo.potenciaElectricaW !== undefined ? Number(rawConsumo.potenciaElectricaW) : defaultPotenciaW,
    tensionVoltios: rawConsumo.tensionVoltios !== undefined ? Number(rawConsumo.tensionVoltios) : defaultVoltios,
    horasUsoDiario: rawConsumo.horasUsoDiario !== undefined ? Number(rawConsumo.horasUsoDiario) : defaultHorasUso,
    factorCargaPct: rawConsumo.factorCargaPct !== undefined ? Number(rawConsumo.factorCargaPct) : defaultFactorCarga,
    usaGas: rawConsumo.usaGas !== undefined ? Boolean(rawConsumo.usaGas) : defaultUsaGas,
    potenciaGasBTU: rawConsumo.potenciaGasBTU !== undefined ? Number(rawConsumo.potenciaGasBTU) : defaultPotenciaBTU,
    horasLlamaDiario: rawConsumo.horasLlamaDiario !== undefined ? Number(rawConsumo.horasLlamaDiario) : defaultHorasLlama,
    costoHoraGasCOP: rawConsumo.costoHoraGasCOP !== undefined ? Number(rawConsumo.costoHoraGasCOP) : defaultCostoHoraGas,
    usaAgua: rawConsumo.usaAgua !== undefined ? Boolean(rawConsumo.usaAgua) : defaultUsaAgua,
    litrosAguaDiario: rawConsumo.litrosAguaDiario !== undefined ? Number(rawConsumo.litrosAguaDiario) : defaultLitrosAgua,
    mantenimientoMensualCOP: rawConsumo.mantenimientoMensualCOP !== undefined ? Number(rawConsumo.mantenimientoMensualCOP) : defaultMantenimientoCOP
  };

  const quick_params = eq.quick_params || {
    "Family": familiaRevit,
    "Type": tipoRevit,
    "Discipline": disciplina,
    "Revit Category": categoriaRevit,
    "ElementId": String(elementIdRevit),
    "Electrical Load": `${consumosTeoricos.potenciaElectricaW} W / ${consumosTeoricos.tensionVoltios}V`,
    "Gas Load": consumosTeoricos.usaGas ? `${consumosTeoricos.potenciaGasBTU.toLocaleString('es-CO')} BTU/h` : 'N/A',
    "Water Flow": consumosTeoricos.usaAgua ? `${consumosTeoricos.litrosAguaDiario} L/día` : 'N/A'
  };

  return {
    ...eq,
    disciplina,
    categoriaRevit,
    category: categoriaRevit,
    familiaRevit,
    family: familiaRevit,
    tipoRevit,
    type: tipoRevit,
    elementIdRevit,
    element_id: elementIdRevit,
    uniqueIdRevit,
    unique_id: uniqueIdRevit,
    sistemaMep,
    quick_params,
    consumosTeoricos
  };
}

/**
 * Calcula con exactitud los consumos teóricos de un equipo individual.
 */
export function calcularConsumosEquipo(equipo, diasMes = 26, tarifas = TARIFAS_SERVICIOS) {
  const eq = normalizarEquipoRevit(equipo);
  const c = eq.consumosTeoricos;

  // 1. Eléctrico
  const potenciaKW = (c.potenciaElectricaW || 0) / 1000;
  const factorCarga = (c.factorCargaPct || 80) / 100;
  const kwhDia = potenciaKW * (c.horasUsoDiario || 0) * factorCarga;
  const kwhMes = kwhDia * diasMes;
  const costoElecMes = Math.round(kwhMes * (tarifas.tarifaKwhCOP || 850));
  const costoElecDia = Math.round(costoElecMes / (diasMes || 1));

  // 2. Gas / Térmico
  const horasLlama = c.usaGas ? (c.horasLlamaDiario || 0) : 0;
  const costoGasDia = Math.round(horasLlama * (c.costoHoraGasCOP || tarifas.tarifaGasHoraCOP || 2200));
  const costoGasMes = costoGasDia * diasMes;
  // Aprox 0.70 kg GLP por hora para quemador 35.000 BTU/h
  const kgGasHora = c.potenciaGasBTU > 0 ? (c.potenciaGasBTU / 50000) : 0.7;
  const kgGasMes = c.usaGas ? (horasLlama * kgGasHora * diasMes) : 0;
  const cilindros40lbMes = Number((kgGasMes / (tarifas.kgPorCilindro40lb || 18)).toFixed(1));

  // 3. Agua / Plomería
  const litrosAguaDia = c.usaAgua ? (c.litrosAguaDiario || 0) : 0;
  const aguaMesM3 = (litrosAguaDia * diasMes) / 1000;
  const costoAguaMes = Math.round(aguaMesM3 * (tarifas.tarifaAguaM3COP || 4500));
  const costoAguaDia = Math.round(costoAguaMes / (diasMes || 1));

  // 4. Mantenimiento Preventivo
  const mantenimientoMes = Math.round(c.mantenimientoMensualCOP || 0);

  // 5. Total de Servicios Públicos y Mantenimiento
  const costoTotalServiciosMes = costoElecMes + costoGasMes + costoAguaMes + mantenimientoMes;
  const costoTotalServiciosDia = Math.round(costoTotalServiciosMes / (diasMes || 1));

  return {
    equipoId: eq.id,
    nombre: eq.nombre,
    familiaRevit: eq.familiaRevit || eq.family,
    tipoRevit: eq.tipoRevit || eq.type,
    disciplina: eq.disciplina,
    categoriaRevit: eq.categoriaRevit || eq.category,
    elementIdRevit: eq.elementIdRevit || eq.element_id,
    uniqueIdRevit: eq.uniqueIdRevit || eq.unique_id,
    sistemaMep: eq.sistemaMep,
    potenciaKW,
    potenciaElectricaW: c.potenciaElectricaW || 0,
    tensionVoltios: c.tensionVoltios || 110,
    horasUsoDiario: c.horasUsoDiario || 0,
    horasUsoDia: c.horasUsoDiario || 0,
    factorCargaPct: c.factorCargaPct || 80,
    kwhDia: Number(kwhDia.toFixed(2)),
    kwhMes: Number(kwhMes.toFixed(1)),
    costoElecDia,
    costoElecMes,
    costoElectricidadMes: costoElecMes,
    usaGas: c.usaGas,
    potenciaGasBTU: c.potenciaGasBTU || 0,
    horasLlama,
    costoHoraGasCOP: c.costoHoraGasCOP || 2200,
    kgGasMes: Number(kgGasMes.toFixed(1)),
    cilindros40lbMes,
    cilindros18kgMes: cilindros40lbMes,
    costoGasDia,
    costoGasMes,
    usaAgua: c.usaAgua,
    litrosAguaDia,
    aguaMesM3: Number(aguaMesM3.toFixed(2)),
    m3AguaMes: Number(aguaMesM3.toFixed(2)),
    costoAguaDia,
    costoAguaMes,
    mantenimientoMes,
    costoMantenimientoMes: mantenimientoMes,
    costoTotalServiciosDia,
    costoTotalServiciosMes,
    costoTotalMes: costoTotalServiciosMes
  };
}

/**
 * Calcula el Balance Energético Global y la Matriz de Consumos Teóricos MEP de la Planta.
 */
export function calcularConsumosPlanta(equipos = [], diasMes = 26, horasTurno = 8, tarifas = TARIFAS_SERVICIOS) {
  let potenciaInstaladaTotalW = 0;
  let consumoTotalKwhDia = 0;
  let consumoTotalKwhMes = 0;
  let costoTotalElecMes = 0;
  let costoTotalGasMes = 0;
  let totalKgGasMes = 0;
  let totalCilindrosGasMes = 0;
  let consumoTotalAguaDiaL = 0;
  let consumoTotalAguaMesM3 = 0;
  let costoTotalAguaMes = 0;
  let totalMantenimientoMes = 0;

  const desglosePorEquipo = (equipos || []).map(eq => {
    const calc = calcularConsumosEquipo(eq, diasMes, tarifas);
    potenciaInstaladaTotalW += (eq.consumosTeoricos?.potenciaElectricaW || 0);
    consumoTotalKwhDia += calc.kwhDia;
    consumoTotalKwhMes += calc.kwhMes;
    costoTotalElecMes += calc.costoElecMes;
    costoTotalGasMes += calc.costoGasMes;
    totalKgGasMes += calc.kgGasMes;
    totalCilindrosGasMes += calc.cilindros40lbMes;
    consumoTotalAguaDiaL += calc.litrosAguaDia;
    consumoTotalAguaMesM3 += calc.aguaMesM3;
    costoTotalAguaMes += calc.costoAguaMes;
    totalMantenimientoMes += calc.mantenimientoMes;
    return calc;
  });

  const potenciaInstaladaTotalKW = Number((potenciaInstaladaTotalW / 1000).toFixed(2));
  const potenciaSimultaneaKW = Number((potenciaInstaladaTotalKW * (tarifas.factorSimultaneidadPlanta || 0.75)).toFixed(2));

  const costoTotalServiciosPlantaMes = costoTotalElecMes + costoTotalGasMes + costoTotalAguaMes + totalMantenimientoMes;
  const costoTotalServiciosPlantaDia = Math.round(costoTotalServiciosPlantaMes / (diasMes || 1));
  const costoServiciosPorHora = Math.round(costoTotalServiciosPlantaDia / (horasTurno || 8));
  const costoServiciosPorMinuto = Math.round(costoServiciosPorHora / 60);

  // Calcular porcentajes de aporte por equipo al costo energético total
  const desgloseConPct = desglosePorEquipo.map(item => ({
    ...item,
    pctDelTotal: costoTotalServiciosPlantaMes > 0 
      ? Math.round((item.costoTotalServiciosMes / costoTotalServiciosPlantaMes) * 100) 
      : 0
  })).sort((a, b) => b.costoTotalServiciosMes - a.costoTotalServiciosMes);

  return {
    potenciaInstaladaTotalKW,
    potenciaSimultaneaKW,
    consumoTotalKwhDia: Number(consumoTotalKwhDia.toFixed(2)),
    consumoTotalKwhMes: Number(consumoTotalKwhMes.toFixed(1)),
    totalKwhMes: Number(consumoTotalKwhMes.toFixed(1)),
    costoTotalElecMes,
    totalElectricidadMes: costoTotalElecMes,
    costoTotalGasMes,
    totalGasMes: costoTotalGasMes,
    totalKgGasMes: Number(totalKgGasMes.toFixed(1)),
    totalCilindrosGasMes: Number(totalCilindrosGasMes.toFixed(1)),
    totalCilindrosMes: Number(totalCilindrosGasMes.toFixed(1)),
    consumoTotalAguaDiaL,
    consumoTotalAguaMesM3: Number(consumoTotalAguaMesM3.toFixed(2)),
    totalM3AguaMes: Number(consumoTotalAguaMesM3.toFixed(2)),
    costoTotalAguaMes,
    totalAguaMes: costoTotalAguaMes,
    totalMantenimientoMes,
    costoTotalServiciosPlantaMes,
    totalServiciosMes: costoTotalServiciosPlantaMes,
    costoTotalServiciosPlantaDia,
    costoServiciosPorDia: costoTotalServiciosPlantaDia,
    costoServiciosPorHora,
    costoServiciosPorMinuto,
    desglosePorEquipo: desgloseConPct
  };
}
