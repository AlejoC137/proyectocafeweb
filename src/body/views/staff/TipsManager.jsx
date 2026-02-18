import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllFromTable } from '../../../redux/actions';
import { STAFF } from '../../../redux/actions-types';
import { ArrowLeft, Calculator, DollarSign, Clock, Users, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const TipsManager = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Data from Redux
    const legacyStaff = useSelector((state) => state.allStaff || []);
    const { list: employees } = useSelector((state) => state.employees || { list: [] });

    // Local state
    const [tipsData, setTipsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Combine staff sources
    const staffList = employees.length > 0 ? employees : legacyStaff;

    // State for selected fortnight
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [fortnightType, setFortnightType] = useState('1'); // '1' for 1-15, '2' for 16-End

    // ENHANCEMENTS STATE
    const [excludedStaff, setExcludedStaff] = useState([]); // Array of excluded IDs
    const [manualHours, setManualHours] = useState({}); // Map { staffId: hours }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            if (staffList.length === 0) {
                await dispatch(getAllFromTable(STAFF));
            }

            const propinasAction = await dispatch(getAllFromTable('Propinas'));
            if (propinasAction && propinasAction.payload) {
                setTipsData(propinasAction.payload);
            }

            setLoading(false);
        };
        fetchData();
    }, [dispatch, staffList.length]);

    // Helper: Get date range for selected fortnight
    const getFortnightRange = () => {
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        let start, end;
        if (fortnightType === '1') {
            start = new Date(year, month, 1);
            end = new Date(year, month, 15, 23, 59, 59);
        } else {
            start = new Date(year, month, 16);
            end = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month
        }
        return { start, end };
    };

    // Helper: Parse hours from "HH:MM"
    const parseDuration = (start, end) => {
        if (!start || !end) return 0;
        try {
            const [h1, m1] = start.split(':').map(Number);
            const [h2, m2] = end.split(':').map(Number);
            let duration = (h2 - h1) + (m2 - m1) / 60;
            if (duration < 0) duration += 24;
            return duration > 0 ? duration : 0;
        } catch (e) { return 0; }
    };

    // CALCULATION LOGIC
    const calculateDistribution = () => {
        const { start, end } = getFortnightRange();

        // 1. Filter Tips
        const periodTips = tipsData.filter(tip => {
            const tipDate = new Date(tip.tiempo);
            return tipDate >= start && tipDate <= end;
        });

        const totalTipsAmount = periodTips.reduce((sum, tip) => sum + (parseFloat(tip.cantidad) || 0), 0);

        // 2. Calculate Staff Hours & Apply Overrides
        const staffStats = staffList.map(employee => {
            // Calculate actual shift hours
            let turnos = [];
            if (Array.isArray(employee.Turnos)) {
                turnos = employee.Turnos;
            } else if (typeof employee.Turnos === "string" && employee.Turnos.trim()) {
                try {
                    const parsed = JSON.parse(employee.Turnos);
                    turnos = Array.isArray(parsed) ? parsed : [parsed];
                } catch { turnos = []; }
            }

            const shiftHours = turnos.reduce((acc, shift) => {
                const shiftDate = new Date(shift.fecha || shift.turnoDate);
                const sDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
                const rStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const rEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                if (sDate >= rStart && sDate <= rEnd) {
                    return acc + parseDuration(shift.horaInicio, shift.horaCierre || shift.horaSalida);
                }
                return acc;
            }, 0);

            // Determine effective hours (Manual override takes precedence if set)
            const effectiveHours = manualHours[employee._id] !== undefined
                ? parseFloat(manualHours[employee._id])
                : shiftHours;

            return {
                ...employee,
                shiftHours, // Original calculated hours
                workedHours: isNaN(effectiveHours) ? 0 : effectiveHours, // Effective hours used for calc
                isEmulated: manualHours[employee._id] !== undefined
            };
        });

        // 3. Filter participating staff (not excluded)
        const participatingStats = staffStats.filter(emp => !excludedStaff.includes(emp._id));
        const totalHours = participatingStats.reduce((sum, emp) => sum + emp.workedHours, 0);

        const hourlyRate = totalHours > 0 ? totalTipsAmount / totalHours : 0;

        // 4. Final Distribution Mapping
        const distribution = staffStats.map(emp => ({
            id: emp._id,
            name: `${emp.Nombre} ${emp.Apellido}`,
            cc: emp.CC,
            hours: emp.workedHours,
            originalHours: emp.shiftHours,
            amount: excludedStaff.includes(emp._id) ? 0 : emp.workedHours * hourlyRate,
            isExcluded: excludedStaff.includes(emp._id),
            isEmulated: emp.isEmulated
        }));

        // Sort: Included first, then by hours desc
        distribution.sort((a, b) => {
            if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
            return b.hours - a.hours;
        });

        return {
            totalTips: totalTipsAmount,
            totalHours, // Effective total hours of participating staff
            hourlyRate,
            distribution,
            tipCount: periodTips.length
        };
    };

    const { totalTips, totalHours, hourlyRate, distribution, tipCount } = calculateDistribution();

    // Handlers
    const handleToggleExclusion = (id) => {
        setExcludedStaff(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleManualLimitChange = (id, value) => {
        const numVal = parseFloat(value);
        setManualHours(prev => ({
            ...prev,
            [id]: isNaN(numVal) ? 0 : numVal
        }));
    };

    const handleResetHours = (id) => {
        setManualHours(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8 font-SpaceGrotesk">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <button
                            onClick={() => navigate('/staff-manager')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver a Staff Manager
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Calculator className="w-8 h-8 text-blue-600" />
                            Distribución de Propinas
                        </h1>
                        <p className="text-gray-500 mt-1">Calcula y reparte propinas. Ajusta horas manuales si es necesario.</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Mes de Referencia</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Periodo</label>
                            <div className="flex bg-white rounded-lg p-1 border border-gray-300">
                                <button
                                    onClick={() => setFortnightType('1')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${fortnightType === '1' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    1ª Quincena
                                </button>
                                <button
                                    onClick={() => setFortnightType('2')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${fortnightType === '2' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    2ª Quincena
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-24 h-24 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Propinas</p>
                        <h3 className="text-4xl font-bold text-blue-600 mt-2">
                            ${totalTips.toLocaleString('es-CO')}
                        </h3>
                        <p className="text-sm text-blue-400 mt-1 flex items-center gap-1">
                            De {tipCount} registros en el periodo
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-24 h-24 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Horas (Participantes)</p>
                        <h3 className="text-4xl font-bold text-purple-600 mt-2">
                            {totalHours.toFixed(2)} hrs
                        </h3>
                        <p className="text-sm text-purple-400 mt-1">
                            Excluyendo personal inactivo
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="w-24 h-24 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Valor por Hora</p>
                        <h3 className="text-4xl font-bold text-green-600 mt-2">
                            ${hourlyRate.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </h3>
                        <p className="text-sm text-green-400 mt-1">
                            Base de cálculo
                        </p>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Detalle de Distribución</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-16">Incluir</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Horas Cálculo</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Horas Reales</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Participación</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Propina Asignada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {distribution.map((item) => (
                                    <tr key={item.id} className={`transition duration-150 ${item.isExcluded ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                                        <td className="px-4 py-4 text-center">
                                            <Checkbox
                                                checked={!item.isExcluded}
                                                onCheckedChange={() => handleToggleExclusion(item.id)}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${item.isExcluded ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-gray-500">CC: {item.cc}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    disabled={item.isExcluded}
                                                    value={item.hours}
                                                    onChange={(e) => handleManualLimitChange(item.id, e.target.value)}
                                                    className="w-20 text-center font-mono h-8"
                                                />
                                                {item.isEmulated && (
                                                    <button
                                                        onClick={() => handleResetHours(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition"
                                                        title="Restaurar horas originales"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                                            {item.originalHours.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 text-sm">
                                            {!item.isExcluded && totalHours > 0 ? ((item.hours / totalHours) * 100).toFixed(1) : 0}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`font-bold text-sm px-3 py-1 rounded-full ${item.isExcluded
                                                    ? 'bg-gray-200 text-gray-500'
                                                    : 'bg-green-100 text-green-800 border border-green-200 shadow-sm'
                                                }`}>
                                                ${item.amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-gray-800">TOTALES (Participantes)</td>
                                    <td className="px-6 py-4 text-center text-purple-700">{totalHours.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                                    <td className="px-6 py-4 text-right text-gray-500">100%</td>
                                    <td className="px-6 py-4 text-right text-green-700 font-extrabold text-lg">
                                        ${distribution.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TipsManager;
