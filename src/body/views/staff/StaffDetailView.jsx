import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as Tabs from '@radix-ui/react-tabs';
import { getAllFromTable, updateStaff, deleteStaff } from "../../../redux/actions";
import { STAFF } from "../../../redux/actions-types";
import {
    X, User, CreditCard, Calendar, Edit2, Save, Trash2,
    AlertTriangle, ArrowLeft, Phone, MapPin, CheckCircle2, Calculator
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentFortnightRange } from '../../../utils/dateUtils';

const StaffDetailView = () => {
    const { cc } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Data from Redux
    const legacyStaff = useSelector((state) => state.allStaff || []);
    const { list: employees } = useSelector((state) => state.employees || { list: [] });

    // Local state for the specific employee
    const [employee, setEmployee] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");

    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "cafe123";

    const handlePasswordSubmit = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthorized(true);
            setIsEditing(true); // Automatically enter edit mode
        } else {
            alert("Contraseña incorrecta");
        }
    };

    const handleCalcularNomina = () => {
        if (!isAuthorized) {
            alert("Por favor, ingrese el PIN de Administrador arriba para ver la nómina.");
            return;
        }
    };

    // Date range for shifts and payroll - defaults to current/last complete fortnight
    const fortnightRange = getCurrentFortnightRange();
    const [startDate, setStartDate] = useState(fortnightRange.startDate);
    const [endDate, setEndDate] = useState(fortnightRange.endDate);

    // Initial load and CC search
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

                // Parse Propinas if they come as JSON string  
                let propinas = [];
                if (Array.isArray(found.Propinas)) {
                    propinas = found.Propinas;
                } else if (typeof found.Propinas === "string" && found.Propinas.trim()) {
                    try {
                        const parsed = JSON.parse(found.Propinas);
                        propinas = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        propinas = [];
                    }
                }

                // Parse Cuenta if it comes as JSON string or JS-object-like string
                let cuenta = null;
                if (typeof found.Cuenta === "object" && found.Cuenta !== null) {
                    cuenta = found.Cuenta;
                } else if (typeof found.Cuenta === "string" && found.Cuenta.trim()) {
                    try {
                        // First try standard JSON.parse
                        cuenta = JSON.parse(found.Cuenta);
                    } catch {
                        // If that fails, try to parse JS object-like string (with unquoted keys)
                        cuenta = parseObjectString(found.Cuenta);
                    }
                }

                setFormData({
                    ...found,
                    Turnos: turnos,
                    Propinas: propinas,
                    Cuenta: cuenta,
                    isAdmin: found.isAdmin || false,
                    Show: found.Show !== false
                });
                setLoading(false);
            } else {
                // If not found in list, and list is populated, show error or handle
                setLoading(false);
            }
        }
    }, [cc, employees, legacyStaff, dispatch]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = () => {
        if (window.confirm("¿Estás seguro de guardar los cambios?")) {
            dispatch(updateStaff(formData));
            setIsEditing(false);
            setEmployee(formData);
        }
    };

    const handleDelete = () => {
        if (window.confirm("ADVERTENCIA: ¿Estás seguro de ELIMINAR este empleado? Esta acción no se puede deshacer.")) {
            dispatch(deleteStaff(employee._id));
            navigate('/staff-manager');
        }
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
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Empleado no encontrado</h2>
                <p className="text-gray-500 mt-2 mb-6">No pudimos encontrar a nadie con la cédula {cc}</p>
                <Button onClick={() => navigate('/staff-manager')} className="bg-slate-900">
                    Volver a Gestión de Empleados
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-gray-50 p-4 md:p-8 font-SpaceGrotesk">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">

                {/* Top Navigation Bar */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate('/staff-manager')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a la Lista
                    </button>
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 gap-2">
                                    <Save className="w-4 h-4" /> Guardar
                                </Button>
                                <Button onClick={handleDelete} variant="destructive" className="gap-2">
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                </Button>
                            </>
                        ) : !isAuthorized ? (
                            <div className="flex gap-2 items-center bg-slate-700/50 px-3 py-2 rounded-lg">
                                <Input
                                    type="password"
                                    placeholder="PIN para editar"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                    className="w-32 h-8 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                                />
                                <Button
                                    onClick={handlePasswordSubmit}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    Desbloquear
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 gap-2">
                                <Edit2 className="w-4 h-4" /> Editar Perfil
                            </Button>
                        )}
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

                    <div className="h-32 w-32 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold border-4 border-slate-700 z-10">
                        {formData.Nombre?.[0]}{formData.Apellido?.[0]}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Input
                                        name="Nombre"
                                        value={formData.Nombre}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                    <Input
                                        name="Apellido"
                                        value={formData.Apellido}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            ) : (
                                <h1 className="text-4xl font-bold">{formData.Nombre} {formData.Apellido}</h1>
                            )}
                            <div className="flex gap-2 justify-center">
                                {formData.isAdmin && (
                                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Admin</span>
                                )}
                                {formData.Show === false && (
                                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Oculto</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-slate-400 justify-center md:justify-start">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <User className="w-4 h-4" />
                                {isEditing ? (
                                    <Input
                                        name="Cargo"
                                        value={formData.Cargo}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white h-7 text-sm w-32"
                                    />
                                ) : (
                                    <span>{formData.Cargo}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Phone className="w-4 h-4" />
                                {isEditing ? (
                                    <Input
                                        name="Celular"
                                        value={formData.Celular}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white h-7 text-sm w-40"
                                    />
                                ) : (
                                    <span>{formData.Celular}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Activo en Sistema</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/10 flex flex-col items-center md:items-end z-10 min-w-[200px]">
                        <span className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Cédula / CC</span>
                        <span className="text-3xl font-mono font-bold tracking-tighter">{cc}</span>
                    </div>
                </div>

                {/* Detail Tabs Section */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex-1 min-h-[500px] flex flex-col">
                    <Tabs.Root className="flex flex-col flex-1" defaultValue="profile">
                        <Tabs.List className="flex border-b border-gray-100 bg-gray-50/50">
                            <Trigger value="profile" icon={User} label="Información General" />
                            <Trigger value="financial" icon={CreditCard} label="Datos Financieros" />
                            <Trigger value="history" icon={Calendar} label="Registro de Turnos" />
                        </Tabs.List>

                        <div className="flex-1 p-8">
                            <Tabs.Content value="profile" className="outline-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <SectionTitle>Detalles del Empleado</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <InfoItem
                                        label="ID de Sistema"
                                        value={formData._id}
                                        sublabel="Identificador único de base de datos"
                                    />
                                    <div className="space-y-4">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-bold text-gray-700">Dirección de Residencia</label>
                                                <div className="flex gap-2">
                                                    <MapPin className="text-slate-400 w-5 h-5 mt-2 shrink-0" />
                                                    <Input
                                                        name="Direccion"
                                                        value={formData.Direccion || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Ingrese dirección completa"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <InfoItem
                                                label="Dirección"
                                                value={formData.Direccion || 'No registrada'}
                                                icon={MapPin}
                                            />
                                        )}
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-xl space-y-4">
                                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Privilegios y Visibilidad</h4>
                                        <div className="space-y-4">
                                            <ToggleOption
                                                id="isAdmin"
                                                label="Habilitar Acceso Administrador"
                                                checked={formData.isAdmin}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                description="Permite acceder a resúmenes de ventas y configuración global."
                                            />
                                            <ToggleOption
                                                id="Show"
                                                label="Mostrar en Listado de Nómina"
                                                checked={formData.Show}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                description="Determina si el empleado aparece en el cálculo de pagos."
                                            />
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex items-end">
                                            <Button variant="destructive" onClick={handleDelete} className="w-full gap-2">
                                                <Trash2 className="w-4 h-4" /> Eliminar Empleado
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Tabs.Content>

                            <Tabs.Content value="financial" className="outline-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <SectionTitle>Esquema de Pagos</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                                        <span className="text-blue-100 text-xs font-bold uppercase tracking-widest">Tarifa por Hora</span>
                                        <div className="mt-2 flex items-center gap-2">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    name="Rate"
                                                    value={formData.Rate}
                                                    onChange={handleInputChange}
                                                    className="bg-blue-700 border-none text-white text-2xl font-bold p-0 h-auto"
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold">{formatCurrency(formData.Rate || 0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
                                        <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Acumulado Propinas</span>
                                        <div className="mt-2">
                                            <span className="text-3xl font-bold">{formatCurrency(Number(formData.Propinas) || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 rounded-2xl p-6 text-slate-800 border border-slate-200">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estatus de Cuenta</span>
                                        <div className="mt-2 flex items-center gap-2">
                                            <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                                            <span className="text-lg font-bold">Verificada</span>
                                        </div>
                                    </div>
                                </div>

                                <SectionTitle>Información Bancaria</SectionTitle>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-y-6">
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Entidad Bancaria</span>
                                            <p className="text-xl font-bold text-slate-800">{formData.Cuenta?.banco || 'No especificado'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tipo de Producto</span>
                                            <p className="text-xl font-bold text-slate-800">{formData.Cuenta?.tipo || 'Cuenta de Ahorros'}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1 pt-4 border-t border-slate-200">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Número de Cuenta</span>
                                            <p className="text-4xl font-mono font-bold text-slate-900 tracking-tighter">
                                                {formData.Cuenta?.numero || '000-0000000-00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Tabs.Content>

                            <Tabs.Content value="history" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    <SectionTitle>Registro de Asistencia</SectionTitle>

                                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <Calendar className="w-4 h-4" /> Periodo:
                                        </div>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-400">→</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Button
                                            onClick={handleCalcularNomina}
                                            variant="default"
                                            size="sm"
                                            className="ml-2 gap-2 h-8 bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Calculator className="w-4 h-4" /> Calcular Nómina
                                        </Button>
                                    </div>
                                </div>

                                {/* Payroll Summary Section - Always Visible */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                                    {(() => {
                                        const filteredTurnos = (Array.isArray(formData.Turnos) ? formData.Turnos : []).filter(t => {
                                            const tDate = t.fecha || t.turnoDate?.split('T')[0];
                                            return tDate >= startDate && tDate <= endDate;
                                        });

                                        const totalHours = filteredTurnos.reduce((total, t) => {
                                            return total + parseFloat(calculateDuration(t.horaInicio, t.horaCierre || t.horaSalida));
                                        }, 0);

                                        const baseRate = Number(formData.Rate) || 0;
                                        const basePay = totalHours * baseRate;
                                        const socialSecurity = basePay * 0.1;

                                        // Calculation of tips for the period
                                        const periodTips = (Array.isArray(formData.Propinas) ? formData.Propinas : [])
                                            .filter((propina) => {
                                                const tipDateStr = propina.tipDia || propina.fecha || "";
                                                if (!tipDateStr) return false;
                                                const tipDate = new Date(tipDateStr.includes('T') ? tipDateStr : `${tipDateStr}T00:00:00`);
                                                const start = new Date(`${startDate}T00:00:00`);
                                                const end = new Date(`${endDate}T23:59:59`);
                                                return tipDate >= start && tipDate <= end;
                                            })
                                            .reduce((total, propina) => total + parseFloat(propina.tipMonto || 0), 0) / 1000;

                                        const totalToPay = basePay + socialSecurity + periodTips;
                                        const averageHourlyRate = totalHours > 0 ? totalToPay / totalHours : 0;

                                        return (
                                            <>
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Turnos</span>
                                                    <span className="text-2xl font-bold text-slate-800">{filteredTurnos.length}</span>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Propinas</span>
                                                    <span className="text-2xl font-bold text-emerald-600">{formatCurrency(periodTips)}</span>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Seg. Social (10%)</span>
                                                    <span className="text-2xl font-bold text-slate-800">{formatCurrency(socialSecurity)}</span>
                                                </div>
                                                <div className="bg-amber-600 p-4 rounded-xl shadow-lg shadow-amber-100 flex flex-col">
                                                    <span className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mb-1">Promedio/Hora (Check)</span>
                                                    <span className="text-2xl font-bold text-white">{formatCurrency(averageHourlyRate)}</span>
                                                </div>
                                                <div className="bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-100 flex flex-col">
                                                    <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mb-1">Total a Pagar</span>
                                                    <span className="text-2xl font-bold text-white">{formatCurrency(totalToPay)}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Fecha de Turno</th>
                                                <th className="px-6 py-4 text-center">Hora Ingreso</th>
                                                <th className="px-6 py-4 text-center">Hora Salida</th>
                                                <th className="px-6 py-4 text-right">Horas Totales</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {(() => {
                                                const filtered = (Array.isArray(formData.Turnos) ? formData.Turnos : []).filter(t => {
                                                    const tDate = t.fecha || t.turnoDate?.split('T')[0];
                                                    return tDate >= startDate && tDate <= endDate;
                                                });

                                                return filtered.length > 0 ? (
                                                    filtered.sort((a, b) => new Date(b.fecha || b.turnoDate) - new Date(a.fecha || a.turnoDate)).map((turno, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/50 transition duration-150">
                                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                                {turno.fecha || turno.turnoDate?.split('T')[0] || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-center text-slate-600">{turno.horaInicio || '--:--'}</td>
                                                            <td className="px-6 py-4 text-center text-slate-600">{turno.horaCierre || turno.horaSalida || '--:--'}</td>
                                                            <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                                                                {calculateDuration(turno.horaInicio, turno.horaCierre || turno.horaSalida)} hrs
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Calendar className="w-8 h-8 opacity-20" />
                                                                <p>No se registran turnos en este periodo.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Shift Editing Button */}
                                <div className="mt-6 flex justify-center">
                                    <Button
                                        onClick={() => navigate(`/staff-manager/${cc}/editar-turnos`)}
                                        className="bg-amber-600 hover:bg-amber-700 gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" /> Editar Turnos
                                    </Button>
                                </div>
                            </Tabs.Content>
                        </div>
                    </Tabs.Root>
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const Trigger = ({ value, icon: Icon, label }) => (
    <Tabs.Trigger
        value={value}
        className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-6 text-sm font-bold text-slate-400 border-b-4 border-transparent hover:text-slate-600 transition-all duration-200",
            "data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
        )}
    >
        <Icon className="w-5 h-5" />
        {label}
    </Tabs.Trigger>
);

const SectionTitle = ({ children }) => (
    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
        {children}
    </h3>
);

const InfoItem = ({ label, value, sublabel, icon: Icon }) => (
    <div className="flex gap-4">
        {Icon && <Icon className="text-slate-400 w-6 h-6 shrink-0 mt-1" />}
        <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</span>
            <span className="text-lg font-bold text-slate-800">{value}</span>
            {sublabel && <span className="text-xs text-slate-400">{sublabel}</span>}
        </div>
    </div>
);

const ToggleOption = ({ id, label, description, checked, onChange, disabled }) => (
    <div className="flex items-start gap-3">
        <div className="pt-0.5">
            <input
                type="checkbox"
                id={id}
                name={id}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-default"
            />
        </div>
        <div className="flex flex-col">
            <label htmlFor={id} className={clsx("font-bold text-sm cursor-pointer", disabled ? "text-slate-500" : "text-slate-800")}>
                {label}
            </label>
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

// --- Global Utils ---
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

// Parse JavaScript object-like strings (e.g., "{banco: 'Bancolombia', tipo: 'Ahorros'}")
const parseObjectString = (str) => {
    if (!str || typeof str !== 'string') return null;
    try {
        // Remove outer quotes if present
        let cleaned = str.trim();
        if ((cleaned.startsWith("'") && cleaned.endsWith("'")) ||
            (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
            cleaned = cleaned.slice(1, -1);
        }

        // Convert JS object notation to valid JSON by adding quotes around keys
        // This regex finds unquoted keys and wraps them in double quotes
        const jsonString = cleaned
            .replace(/(\w+):/g, '"$1":')  // Add quotes around keys
            .replace(/'/g, '"');           // Replace single quotes with double quotes

        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse object string:', str, e);
        return null;
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

export default StaffDetailView;
