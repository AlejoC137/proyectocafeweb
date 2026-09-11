import React, { useState, useMemo, useEffect } from 'react';
import { PLANTA_CONFIG } from './plantaData';
import PlantaHeader from './PlantaHeader';
import PlantaKpis from './PlantaKpis';
import PlantaCadViewer from './PlantaCadViewer';
import PlantaProductosTable from './PlantaProductosTable';
import PlantaSimulador from './PlantaSimulador';
import PlantaOcupacionVentas from './PlantaOcupacionVentas';
import PlantaBusinessContext from './PlantaBusinessContext';
import supabase from '../../../config/supabaseClient';

export default function PlantaProduccion() {
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'cad', 'productos', 'ocupacion', 'simulador', 'contexto'
  const [selectedProductId, setSelectedProductId] = useState('tarta-basca');
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'saved', 'error'
  const [ventasRealesDb, setVentasRealesDb] = useState(null);

  // Estado de Dimensiones de la Habitación (metros)
  const [dimensionesHabitacion, setDimensionesHabitacion] = useState(() => {
    try {
      const saved = localStorage.getItem('planta_cad_dimensiones_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.ancho && parsed?.largo) return parsed;
      }
    } catch (e) {}
    return { ancho: 3.20, largo: 3.10 };
  });

  // Estado de Equipos (persistido en localStorage + Supabase view_preferences)
  const [equipos, setEquipos] = useState(() => {
    try {
      const saved = localStorage.getItem('planta_cad_equipos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return PLANTA_CONFIG.equipos;
  });

  // Cargar desde Supabase al montar la página
  useEffect(() => {
    const fetchFromSupabase = async () => {
      try {
        setSyncStatus('syncing');
        // 1. Intentar leer de la tabla dedicada planta_layout
        const { data: dedicatedData, error: dedicatedErr } = await supabase
          .from('planta_layout')
          .select('*')
          .eq('id', 'planta_principal')
          .single();

        if (dedicatedData) {
          if (dedicatedData.ancho_m && dedicatedData.largo_m) {
            const dims = { ancho: Number(dedicatedData.ancho_m), largo: Number(dedicatedData.largo_m) };
            setDimensionesHabitacion(dims);
            localStorage.setItem('planta_cad_dimensiones_v1', JSON.stringify(dims));
          }
          if (dedicatedData.equipos && Array.isArray(dedicatedData.equipos) && dedicatedData.equipos.length > 0) {
            setEquipos(dedicatedData.equipos);
            localStorage.setItem('planta_cad_equipos_v2', JSON.stringify(dedicatedData.equipos));
            setSyncStatus('saved');
            return;
          }
        }

        // 2. Fallback a view_preferences si la tabla dedicada no existe aún
        const { data, error } = await supabase
          .from('view_preferences')
          .select('preferences')
          .eq('user_id', 'planta_layout_master')
          .single();

        if (data?.preferences) {
          if (data.preferences.dimensiones?.ancho && data.preferences.dimensiones?.largo) {
            const dims = { 
              ancho: Number(data.preferences.dimensiones.ancho), 
              largo: Number(data.preferences.dimensiones.largo) 
            };
            setDimensionesHabitacion(dims);
            localStorage.setItem('planta_cad_dimensiones_v1', JSON.stringify(dims));
          }
          if (data.preferences.equipos && Array.isArray(data.preferences.equipos) && data.preferences.equipos.length > 0) {
            setEquipos(data.preferences.equipos);
            localStorage.setItem('planta_cad_equipos_v2', JSON.stringify(data.preferences.equipos));
            setSyncStatus('saved');
          } else {
            setSyncStatus('idle');
          }
        } else {
          setSyncStatus('idle');
        }
      } catch (err) {
        console.warn('No se pudo cargar desde Supabase:', err);
        setSyncStatus('idle');
      }
    };

    fetchFromSupabase();

    // SUSCRIPCIÓN EN TIEMPO REAL (REALTIME POSTGRES LISTEN)
    const channel = supabase
      .channel('realtime_planta_layout')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planta_layout' }, (payload) => {
        if (payload.new?.ancho_m && payload.new?.largo_m) {
          const dims = { ancho: Number(payload.new.ancho_m), largo: Number(payload.new.largo_m) };
          setDimensionesHabitacion(dims);
          localStorage.setItem('planta_cad_dimensiones_v1', JSON.stringify(dims));
        }
        if (payload.new?.equipos && Array.isArray(payload.new.equipos)) {
          setEquipos(payload.new.equipos);
          localStorage.setItem('planta_cad_equipos_v2', JSON.stringify(payload.new.equipos));
          setSyncStatus('saved');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cargar ventas históricas reales de Proyecto Café para calcular promedios reales
  const fetchVentasReales = async () => {
    try {
      const { data, error } = await supabase
        .from('Ventas')
        .select('Date, Total_Ingreso, Productos')
        .limit(300);

      if (data && data.length > 0) {
        const diasMap = {};
        let totalGeneral = 0;
        data.forEach(v => {
          const d = v.Date || 'sin_fecha';
          const tot = Number(v.Total_Ingreso) || 0;
          diasMap[d] = (diasMap[d] || 0) + tot;
          totalGeneral += tot;
        });

        const diasCount = Object.keys(diasMap).length || 1;
        const promedioDiario = Math.round(totalGeneral / diasCount);

        setVentasRealesDb({
          promedioDiario: promedioDiario > 0 ? promedioDiario : 130000,
          diasRegistrados: diasCount,
          totalGeneral
        });
      }
    } catch (err) {
      console.warn('Error cargando ventas reales para planta:', err);
    }
  };

  useEffect(() => {
    fetchVentasReales();
  }, []);

  // Guardar en localStorage y Supabase cada vez que el usuario modifica un equipo o el tamaño de la habitación
  useEffect(() => {
    try {
      localStorage.setItem('planta_cad_equipos_v2', JSON.stringify(equipos));
      localStorage.setItem('planta_cad_dimensiones_v1', JSON.stringify(dimensionesHabitacion));
    } catch (e) {}

    const areaCalc = Number((dimensionesHabitacion.ancho * dimensionesHabitacion.largo).toFixed(2));

    // Debounced sync a Supabase
    const timer = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        // Intentar guardar en planta_layout
        await supabase
          .from('planta_layout')
          .upsert({
            id: 'planta_principal',
            nombre: 'Planta de Producción Principal',
            ancho_m: dimensionesHabitacion.ancho,
            largo_m: dimensionesHabitacion.largo,
            area_m2: areaCalc,
            equipos: equipos,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        // Guardar también en view_preferences para compatibilidad
        await supabase
          .from('view_preferences')
          .upsert({
            user_id: 'planta_layout_master',
            preferences: {
              modulo: 'planta_produccion',
              dimensiones: { 
                ancho: dimensionesHabitacion.ancho, 
                largo: dimensionesHabitacion.largo, 
                areaTotalM2: areaCalc 
              },
              updated_at: new Date().toISOString(),
              equipos: equipos
            }
          }, { onConflict: 'user_id' });

        setSyncStatus('saved');
      } catch (err) {
        console.warn('Error Supabase upsert:', err);
        setSyncStatus('error');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [equipos, dimensionesHabitacion]);

  // Guardar manual forzado a Supabase
  const handleForceSaveSupabase = async () => {
    try {
      setSyncStatus('syncing');
      const areaCalc = Number((dimensionesHabitacion.ancho * dimensionesHabitacion.largo).toFixed(2));

      await supabase
        .from('planta_layout')
        .upsert({
          id: 'planta_principal',
          nombre: 'Planta de Producción Principal',
          ancho_m: dimensionesHabitacion.ancho,
          largo_m: dimensionesHabitacion.largo,
          area_m2: areaCalc,
          equipos: equipos,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      const { error } = await supabase
        .from('view_preferences')
        .upsert({
          user_id: 'planta_layout_master',
          preferences: {
            modulo: 'planta_produccion',
            dimensiones: { 
              ancho: dimensionesHabitacion.ancho, 
              largo: dimensionesHabitacion.largo, 
              areaTotalM2: areaCalc 
            },
            updated_at: new Date().toISOString(),
            equipos: equipos
          }
        }, { onConflict: 'user_id' });

      if (!error) {
        setSyncStatus('saved');
        alert('✓ Layout y dimensiones guardados con éxito en la nube de Supabase (SQL).');
      } else {
        alert('Error al guardar en Supabase: ' + error.message);
        setSyncStatus('error');
      }
    } catch (err) {
      alert('Error de conexión a Supabase: ' + err.message);
      setSyncStatus('error');
    }
  };

  // Restablecer al diseño original del archivo DXF
  const handleResetOriginal = async () => {
    if (window.confirm('¿Deseas restablecer las dimensiones y todos los equipos a la versión original?')) {
      const defaultDims = { ancho: 3.20, largo: 3.10 };
      setDimensionesHabitacion(defaultDims);
      setEquipos(PLANTA_CONFIG.equipos);
      localStorage.removeItem('planta_cad_equipos_v2');
      localStorage.removeItem('planta_cad_dimensiones_v1');
      try {
        await supabase
          .from('planta_layout')
          .upsert({
            id: 'planta_principal',
            nombre: 'Planta de Producción Principal',
            ancho_m: defaultDims.ancho,
            largo_m: defaultDims.largo,
            area_m2: 9.92,
            equipos: PLANTA_CONFIG.equipos,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        await supabase
          .from('view_preferences')
          .upsert({
            user_id: 'planta_layout_master',
            preferences: {
              modulo: 'planta_produccion',
              dimensiones: { ancho: 3.20, largo: 3.10, areaTotalM2: 9.92 },
              updated_at: new Date().toISOString(),
              equipos: PLANTA_CONFIG.equipos
            }
          }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('Error al resetear:', e);
      }
    }
  };

  // Parámetros de simulación configurables
  const [horasTurno, setHorasTurno] = useState(8);
  const [diasMes, setDiasMes] = useState(26);
  const [eficienciaOEE, setEficienciaOEE] = useState(0.85); // 85% OEE
  const [costosFijos, setCostosFijos] = useState(PLANTA_CONFIG.costosFijosBase);

  const totalCostosFijosMes = useMemo(() => {
    return Object.values(costosFijos).reduce((acc, curr) => acc + Number(curr || 0), 0);
  }, [costosFijos]);

  const costoFijoPorDia = useMemo(() => {
    return totalCostosFijosMes / (diasMes || 1);
  }, [totalCostosFijosMes, diasMes]);

  // Cálculo DINÁMICO de capacidad monoproducto a partir de los equipos activos en planta
  const analisisProductos = useMemo(() => {
    const minutosDisponibles = horasTurno * 60 * eficienciaOEE;

    // Calcular capacidad agregada de hornos activos en el plano
    const hornosActivos = equipos.filter(e => e.tipo === 'HORNO');
    const batidorasActivas = equipos.filter(e => e.tipo === 'BATIDORA');

    const capHornosTartas = hornosActivos.reduce((sum, h) => sum + (h.capacidadTartasVascas || 8), 0);
    const capHornosCroissants = hornosActivos.reduce((sum, h) => sum + (h.capacidadCroissants || 24), 0);

    const capBatidorasTartas = batidorasActivas.reduce((sum, b) => sum + (b.capacidadTartasVascas || 4), 0);
    const capBatidorasMasasKg = batidorasActivas.reduce((sum, b) => sum + (b.capacidadMasaBatidaKg || 4.0), 0);

    return PLANTA_CONFIG.productos.map((prod) => {
      // 1. Capacidad por Horno dinámico
      const cicloHornoMin = (prod.tiempoHorneadoMin || 20) + 8;
      const hornadasPorTurno = Math.floor(minutosDisponibles / cicloHornoMin);
      
      // Proporción de carga según el tipo de producto
      let unidadesPorHorneadaDinamica = prod.unidadesPorHorneada || 8;
      if (prod.id === 'tarta-basca') {
        unidadesPorHorneadaDinamica = capHornosTartas > 0 ? capHornosTartas : 8;
      } else if (prod.categoria === 'PANADERIA') {
        unidadesPorHorneadaDinamica = capHornosCroissants > 0 ? capHornosCroissants : (prod.unidadesPorHorneada || 24);
      }

      const capMaxHorno = hornadasPorTurno * unidadesPorHorneadaDinamica;

      // 2. Capacidad por Batidora dinámica
      const cicloBatidoMin = (prod.tiempoBatidoMin || 15) + 5;
      const batidosPorTurno = Math.floor(minutosDisponibles / cicloBatidoMin);

      let unidadesPorBatidoDinamico = prod.unidadesPorBatido || 4;
      if (prod.id === 'tarta-basca' && capBatidorasTartas > 0) {
        unidadesPorBatidoDinamico = capBatidorasTartas;
      }

      const capMaxBatidora = batidosPorTurno * unidadesPorBatidoDinamico;

      let unidadesTurno = Math.min(capMaxHorno, capMaxBatidora);
      let equipoLimitante = capMaxHorno <= capMaxBatidora 
        ? (hornosActivos[0]?.nombre || 'Horno de Planta') 
        : (batidorasActivas[0]?.nombre || 'Batidora de Planta');

      const merma = prod.mermaPorcentaje || 0.04;
      const unidadesNetas = Math.floor(unidadesTurno * (1 - merma));

      const precioVenta = prod.precioVentaCOP || 0;
      const costoMateriaPrima = prod.costoMateriaPrimaCOP || 0;
      const costoEmpaque = prod.costoEmpaqueCOP || 0;
      const costoVarUnitario = costoMateriaPrima + costoEmpaque;
      const margenUnitarioCOP = precioVenta - costoVarUnitario;
      const margenPorcentaje = precioVenta > 0 ? Math.round((margenUnitarioCOP / precioVenta) * 100) : 0;

      const ingresoTurnoCOP = unidadesNetas * precioVenta;
      const costoVarTurnoCOP = unidadesNetas * costoVarUnitario;
      const margenContribucionTurnoCOP = ingresoTurnoCOP - costoVarTurnoCOP;
      const utilidadNetaTurnoCOP = margenContribucionTurnoCOP - costoFijoPorDia;

      return {
        ...prod,
        unidadesPorHorneada: unidadesPorHorneadaDinamica,
        unidadesPorBatido: unidadesPorBatidoDinamico,
        capMaxHorno,
        capMaxBatidora,
        equipoLimitante,
        unidadesNetasTurno: unidadesNetas,
        costoVarUnitario,
        margenUnitarioCOP,
        margenPorcentaje,
        ingresoTurnoCOP,
        costoVarTurnoCOP,
        margenContribucionTurnoCOP,
        utilidadNetaTurnoCOP
      };
    });
  }, [equipos, horasTurno, eficienciaOEE, costoFijoPorDia]);

  // Producto activo enriquecido
  const productoSeleccionado = useMemo(() => {
    return analisisProductos.find(p => p.id === selectedProductId) || analisisProductos[0] || {};
  }, [analisisProductos, selectedProductId]);

  // Simulación de Mix Multiproducto Diario Real (para abastecer la vitrina del café)
  const mixProduccion = useMemo(() => {
    let unidadesTotales = 0;
    let ingresoDiarioTotal = 0;
    let costoVarDiarioTotal = 0;

    const productosMix = analisisProductos.map(p => {
      const cant = p.demandaEstimadaDia || 10;
      const ingreso = cant * (p.precioVentaCOP || 0);
      const costo = cant * (p.costoVarUnitario || 0);
      unidadesTotales += cant;
      ingresoDiarioTotal += ingreso;
      costoVarDiarioTotal += costo;

      return {
        ...p,
        cantDiaria: cant,
        ingreso,
        costo,
        margen: ingreso - costo
      };
    });

    const margenBrutoDiario = ingresoDiarioTotal - costoVarDiarioTotal;
    const utilidadNetaDiaria = margenBrutoDiario - costoFijoPorDia;

    const ingresoMensual = ingresoDiarioTotal * diasMes;
    const costoVarMensual = costoVarDiarioTotal * diasMes;
    const margenBrutoMensual = margenBrutoDiario * diasMes;
    const utilidadNetaMensual = margenBrutoMensual - totalCostosFijosMes;

    const diasBreakEven = margenBrutoDiario > 0 ? (totalCostosFijosMes / margenBrutoDiario).toFixed(1) : '0';

    return {
      productosMix,
      unidadesTotales,
      ingresoDiarioTotal,
      costoVarDiarioTotal,
      margenBrutoDiario,
      utilidadNetaDiaria,
      ingresoMensual,
      costoVarMensual,
      margenBrutoMensual,
      utilidadNetaMensual,
      diasBreakEven
    };
  }, [analisisProductos, diasMes, costoFijoPorDia, totalCostosFijosMes]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2420] p-1 md:p-2 font-sans">
      <div className="w-full max-w-[1700px] mx-auto">
        <PlantaHeader 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          utilidadNetaMensual={mixProduccion.utilidadNetaMensual} 
        />

        {activeTab === 'resumen' && (
          <PlantaKpis 
            mixProduccion={mixProduccion}
            horasTurno={horasTurno}
            eficienciaOEE={eficienciaOEE}
            costoFijoPorDia={costoFijoPorDia}
            totalCostosFijosMes={totalCostosFijosMes}
            diasMes={diasMes}
            analisisProductos={analisisProductos}
            onSelectProducto={(p) => {
              setSelectedProductId(p.id);
              setActiveTab('productos');
            }}
            onNavigateToOcupacion={() => setActiveTab('ocupacion')}
            ventasRealesDb={ventasRealesDb}
          />
        )}

        {activeTab === 'cad' && (
          <PlantaCadViewer 
            equipos={equipos}
            setEquipos={setEquipos}
            dimensionesHabitacion={dimensionesHabitacion}
            setDimensionesHabitacion={setDimensionesHabitacion}
            analisisProductos={analisisProductos}
            horasTurno={horasTurno}
            onResetOriginal={handleResetOriginal}
            syncStatus={syncStatus}
            onForceSaveSupabase={handleForceSaveSupabase}
          />
        )}

        {activeTab === 'productos' && (
          <PlantaProductosTable 
            analisisProductos={analisisProductos}
            productoSeleccionado={productoSeleccionado}
            setProductoSeleccionado={(p) => setSelectedProductId(p.id)}
            horasTurno={horasTurno}
          />
        )}

        {activeTab === 'ocupacion' && (
          <PlantaOcupacionVentas 
            analisisProductos={analisisProductos}
            costosFijos={costosFijos}
            setCostosFijos={setCostosFijos}
            totalCostosFijosMes={totalCostosFijosMes}
            diasMes={diasMes}
            horasTurno={horasTurno}
            eficienciaOEE={eficienciaOEE}
            ventasRealesDb={ventasRealesDb}
            onRecargarVentas={fetchVentasReales}
          />
        )}

        {activeTab === 'simulador' && (
          <PlantaSimulador 
            horasTurno={horasTurno}
            setHorasTurno={setHorasTurno}
            eficienciaOEE={eficienciaOEE}
            setEficienciaOEE={setEficienciaOEE}
            diasMes={diasMes}
            setDiasMes={setDiasMes}
            costosFijos={costosFijos}
            setCostosFijos={setCostosFijos}
            totalCostosFijosMes={totalCostosFijosMes}
            costoFijoPorDia={costoFijoPorDia}
            mixProduccion={mixProduccion}
          />
        )}

        {activeTab === 'contexto' && (
          <PlantaBusinessContext 
            equipos={equipos}
            dimensionesHabitacion={dimensionesHabitacion}
            analisisProductos={analisisProductos}
            mixProduccion={mixProduccion}
            ventasRealesDb={ventasRealesDb}
            costosFijos={costosFijos}
            totalCostosFijosMes={totalCostosFijosMes}
            diasMes={diasMes}
            horasTurno={horasTurno}
            eficienciaOEE={eficienciaOEE}
          />
        )}
      </div>
    </div>
  );
}
