import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModelsAction, getAllFromTable, deleteModelAction } from '../../../redux/actions';
import { VENTAS, COMPRAS } from '../../../redux/actions-types';
import ModeloContent from './ModeloContent';

const ModeloProyecto = () => {
    const dispatch = useDispatch();

    // Consumimos el estado de Redux
    const models = useSelector(state => state.models);
    const allVentas = useSelector(state => state.allVentas);
    const loading = useSelector(state => state.modelsLoading);

    // Estado Local: Fecha seleccionada
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    });

    useEffect(() => {
        dispatch(fetchModelsAction());
        dispatch(getAllFromTable(VENTAS));
        dispatch(getAllFromTable(COMPRAS));
    }, [dispatch]);

    // --- LÓGICA DE MATRIZ: Calcular Años Disponibles ---
    const years = useMemo(() => {
        const uniqueYears = new Set();
        const currentYear = new Date().getFullYear();
        uniqueYears.add(currentYear);

        // 1. Buscar años en las VENTAS (Formato MM/DD/AAAA)
        if (allVentas && Array.isArray(allVentas)) {
            allVentas.forEach(v => {
                if (v.Date) {
                    const parts = v.Date.split('/');
                    if (parts.length === 3) {
                        // parts[0] = Mes, parts[1] = Día, parts[2] = Año
                        const y = parseInt(parts[2]);
                        if (!isNaN(y)) uniqueYears.add(y);
                    }
                }
            });
        }

        // 2. Buscar años en los MODELOS
        if (models && Array.isArray(models)) {
            models.forEach(m => {
                if (m.costs?.linkedYear) uniqueYears.add(parseInt(m.costs.linkedYear));
            });
        }

        return Array.from(uniqueYears).sort((a, b) => b - a);
    }, [allVentas, models]);

    const monthCols = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    const handleDeleteModel = async (e, modelId, modelName) => {
        e.stopPropagation();
        if (window.confirm(`¿Eliminar hoja de costos de "${modelName}"?`)) {
            dispatch(deleteModelAction(modelId));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen w-screen text-gray-500">Cargando datos...</div>;

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden m-0 p-0">

            {/* --- HEADER & GRID DE NAVEGACIÓN --- */}
            <div className="bg-slate-900 text-white shadow-xl z-50 flex-shrink-0 w-screen p-2">
                <div className="w-full px-2 overflow-x-auto">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Navegador Contable</h2>

                    {years.map(year => (
                        <div key={year} className="flex w-full mb-1 last:mb-0 border-b border-slate-800 pb-1">
                            <div className="w-16 flex-shrink-0 flex items-center justify-center font-bold text-lg bg-slate-800 text-blue-400 rounded-l border-r border-slate-700">
                                {year}
                            </div>

                            <div className="flex-grow grid grid-cols-12 gap-px bg-slate-700 rounded-r overflow-hidden">
                                {monthCols.map((monthName, monthIndex) => {
                                    // Modelo guardado
                                    const savedModel = models.find(m =>
                                        parseInt(m.costs?.linkedYear) === year &&
                                        parseInt(m.costs?.linkedMonth) === monthIndex
                                    );

                                    // Ventas reales (Parseo MM/DD/AAAA)
                                    const hasSales = allVentas && allVentas.some(v => {
                                        if (!v.Date) return false;
                                        const parts = v.Date.split('/');
                                        if (parts.length !== 3) return false;
                                        const rawMonth = parseInt(parts[0], 10);
                                        const parsedYear = parseInt(parts[2], 10);
                                        if (isNaN(rawMonth) || isNaN(parsedYear)) return false;
                                        const normalizedMonth = rawMonth > 11 ? rawMonth - 1 : rawMonth;
                                        return normalizedMonth === monthIndex && parsedYear === year;
                                    });

                                    const isSelected = selectedDate.month === monthIndex && selectedDate.year === year;

                                    return (
                                        <button
                                            key={monthIndex}
                                            onClick={() => setSelectedDate({ month: monthIndex, year: year })}
                                            className={`
                                                relative h-10 flex flex-col items-center justify-center text-[10px] transition-all
                                                ${isSelected
                                                    ? 'bg-blue-600 text-white font-bold shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]'
                                                    : (savedModel
                                                        ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700')
                                                }
                                            `}
                                        >
                                            <span className="uppercase tracking-wide">{monthName}</span>

                                            <div className="flex gap-1 mt-0.5">
                                                {savedModel && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm" title="Modelo Guardado"></span>}
                                                {hasSales && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm" title="Hay Ventas"></span>}
                                            </div>

                                            {savedModel && isSelected && (
                                                <div
                                                    onClick={(e) => handleDeleteModel(e, savedModel._id, savedModel.name)}
                                                    className="absolute top-0 right-0 p-1 hover:text-red-400 text-slate-300 cursor-pointer font-sans font-bold"
                                                >
                                                    ×
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- VISTA DE CONTENIDO --- */}
            <div className="flex-grow overflow-hidden w-screen h-full bg-gray-50">
                <ModeloContent
                    targetMonth={selectedDate.month}
                    targetYear={selectedDate.year}
                />
            </div>
        </div>
    );
};

export default ModeloProyecto;