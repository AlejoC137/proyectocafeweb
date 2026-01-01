import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, updateLogStaff } from "../../../redux/actions";
import { STAFF } from "../../../redux/actions-types";
import { ArrowLeft, Plus, Trash2, Save, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentFortnightRange } from '../../../utils/dateUtils';

const EditarTurnosView = () => {
    const { cc } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const legacyStaff = useSelector((state) => state.allStaff || []);
    const { list: employees } = useSelector((state) => state.employees || { list: [] });

    const [employee, setEmployee] = useState(null);
    const [modifiedShifts, setModifiedShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Date range for filtering visible shifts - defaults to current/last complete fortnight
    const fortnightRange = getCurrentFortnightRange();
    const [visibleStartDate, setVisibleStartDate] = useState(fortnightRange.startDate);
    const [visibleEndDate, setVisibleEndDate] = useState(fortnightRange.endDate);

    useEffect(() => {
        const staffList = employees.length > 0 ? employees : legacyStaff;

        if (staffList.length === 0) {
            dispatch(getAllFromTable(STAFF));
        } else if (cc) {
            const found = staffList.find(e => String(e.CC) === String(cc));
            if (found) {
                setEmployee(found);

                // Parse Turnos if they come as JSON string
                let turnos = [];
                if (Array.isArray(found.Turnos)) {
                    turnos = found.Turnos;
                } else if (typeof found.Turnos === "string" && found.Turnos.trim()) {
                    try {
                        const parsed = JSON.parse(found.Turnos);
                        turnos = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        turnos = [];
                    }
                }

                setModifiedShifts(turnos);
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
    }, [cc, employees, legacyStaff, dispatch]);

    const handleShiftFieldChange = (shiftIndex, field, value) => {
        setModifiedShifts((prevShifts) => {
            const newShifts = [...prevShifts];
            newShifts[shiftIndex] = {
                ...newShifts[shiftIndex],
                [field]: value,
            };
            return newShifts;
        });
    };

    const handleDeleteShift = (shiftIndex) => {
        if (window.confirm("¿Estás seguro de eliminar este turno?")) {
            setModifiedShifts((prevShifts) => {
                const newShifts = [...prevShifts];
                newShifts.splice(shiftIndex, 1);
                return newShifts;
            });
        }
    };

    const handleAddShift = () => {
        setModifiedShifts((prevShifts) => [
            ...prevShifts,
            { fecha: "", horaInicio: "", horaCierre: "" }
        ]);
    };

    const handleSave = async () => {
        // Simple confirmation
        if (!window.confirm("¿Confirmar guardado de turnos?")) {
            console.log("❌ [EditarTurnos] Usuario canceló el guardado");
            return;
        }

        console.log("💾 [EditarTurnos] ========== INICIANDO GUARDADO ==========");
        console.log("📋 [EditarTurnos] Empleado:", employee);
        console.log("📋 [EditarTurnos] Turnos modificados:", modifiedShifts);
        console.log("📋 [EditarTurnos] Número de turnos:", modifiedShifts.length);

        try {
            console.log("🚀 [EditarTurnos] Llamando a updateLogStaff...");
            console.log("📌 [EditarTurnos] ID del empleado (_id):", employee._id);
            console.log("📌 [EditarTurnos] Turnos a enviar:", JSON.stringify(modifiedShifts, null, 2));

            // Use updateLogStaff which updates directly in Supabase
            const success = await dispatch(updateLogStaff(employee._id, modifiedShifts));

            console.log("📡 [EditarTurnos] Respuesta de updateLogStaff:", success);

            if (success) {
                console.log("✅ [EditarTurnos] Turnos guardados exitosamente");
                alert("✅ Turnos guardados correctamente");

                // Reload staff data to reflect changes (stay on same page)
                dispatch(getAllFromTable(STAFF));
            } else {
                console.error("❌ [EditarTurnos] Error: success = false");
                alert("❌ Error al guardar los cambios. Revisa la consola.");
            }
        } catch (error) {
            console.error("❌ [EditarTurnos] Excepción capturada:", error);
            console.error("❌ [EditarTurnos] Mensaje:", error.message);
            alert("❌ Error inesperado al guardar.");
        }

        console.log("💾 [EditarTurnos] ========== FIN GUARDADO ==========");
    };

    const handleCancel = () => {
        if (window.confirm("¿Descartar los cambios?")) {
            navigate(`/staff-manager/${cc}`);
        }
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '0.00';
        try {
            const [h1, m1] = start.split(':').map(Number);
            const [h2, m2] = end.split(':').map(Number);
            const duration = (h2 - h1) + (m2 - m1) / 60;
            return duration > 0 ? duration.toFixed(2) : '0.00';
        } catch (e) { return '0.00'; }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900">Empleado no encontrado</h2>
                <Button onClick={() => navigate('/staff-manager')} className="mt-4">
                    Volver a Staff Manager
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-gray-50 p-4 md:p-8 font-SpaceGrotesk">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate(`/staff-manager/${cc}`)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver al Perfil
                        </button>
                        <div className="flex gap-2 text-white">
                            <Button onClick={handleCancel} variant="ghost" className="gap-2">
                                <X className="w-4 h-4" /> Cancelar
                            </Button>
                            <Button onClick={handleSave} className="bg-blue-600 text-white  hover:bg-blue-700 gap-2">
                                <Save className="w-4 h-4 text-white" /> Guardar Cambios
                            </Button>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Editar Turnos de {employee.Nombre} {employee.Apellido}
                    </h1>
                    <p className="text-slate-500 mt-2">CC: {employee.CC}</p>
                </div>

                {/* Shifts Table */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Turnos Registrados</h2>
                            <Button onClick={handleAddShift} className="bg-green-600 hover:bg-green-700 gap-2">
                                <Plus className="w-4 h-4" /> Añadir Turno
                            </Button>
                        </div>

                        {/* Date Range Filter */}
                        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                <Calendar className="w-4 h-4" /> Mostrar turnos del:
                            </div>
                            <input
                                type="date"
                                value={visibleStartDate}
                                onChange={(e) => setVisibleStartDate(e.target.value)}
                                className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-400 font-bold">→</span>
                            <input
                                type="date"
                                value={visibleEndDate}
                                onChange={(e) => setVisibleEndDate(e.target.value)}
                                className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-400 ml-2">
                                (Los cambios afectan todos los turnos, solo la visualización se filtra)
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-200">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-700">Fecha</th>
                                        <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-700">Hora Inicio</th>
                                        <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-700">Hora Salida</th>
                                        <th className="border border-slate-300 px-4 py-3 text-center font-bold text-slate-700">Horas Totales</th>
                                        <th className="border border-slate-300 px-4 py-3 text-center font-bold text-slate-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Filter shifts to show only those in the visible date range
                                        const visibleShifts = modifiedShifts.filter(turno => {
                                            const turnoDate = (turno.fecha || turno.turnoDate || "").split('T')[0];
                                            return turnoDate >= visibleStartDate && turnoDate <= visibleEndDate;
                                        });

                                        return visibleShifts.length > 0 ? (
                                            visibleShifts.map((turno, displayIdx) => {
                                                // Find the original index in modifiedShifts for proper editing
                                                const idx = modifiedShifts.findIndex(t => t === turno);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                                        <td className="border border-slate-300 px-3 py-2">
                                                            <Input
                                                                type="date"
                                                                value={(turno.fecha || turno.turnoDate || "").split('T')[0]}
                                                                onChange={(e) => handleShiftFieldChange(idx, "fecha", e.target.value)}
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="border border-slate-300 px-3 py-2">
                                                            <Input
                                                                type="time"
                                                                value={turno.horaInicio || ""}
                                                                onChange={(e) => handleShiftFieldChange(idx, "horaInicio", e.target.value)}
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="border border-slate-300 px-3 py-2">
                                                            <Input
                                                                type="time"
                                                                value={turno.horaCierre || turno.horaSalida || ""}
                                                                onChange={(e) => handleShiftFieldChange(idx, "horaCierre", e.target.value)}
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="border border-slate-300 px-4 py-2 text-center font-mono font-bold text-blue-600">
                                                            {calculateDuration(turno.horaInicio, turno.horaCierre || turno.horaSalida)} hrs
                                                        </td>
                                                        <td className="border border-slate-300 px-3 py-2 text-center">
                                                            <Button
                                                                onClick={() => handleDeleteShift(idx)}
                                                                variant="destructive"
                                                                size="sm"
                                                                className="gap-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Eliminar
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="border border-slate-300 px-6 py-12 text-center text-slate-400">
                                                    No hay turnos en el rango de fechas seleccionado.
                                                    {modifiedShifts.length > 0 && (
                                                        <div className="mt-2 text-xs text-slate-500">
                                                            ({modifiedShifts.length} turno(s) total fuera del rango)
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarTurnosView;
