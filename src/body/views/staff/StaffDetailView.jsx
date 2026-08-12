import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as Tabs from '@radix-ui/react-tabs';
import { getAllFromTable, updateStaff, deleteStaff } from "../../../redux/actions";
import { STAFF } from "../../../redux/actions-types";
import {
    User, CreditCard, Calendar, Edit2, Save, Trash2,
    AlertTriangle, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentFortnightRange } from '../../../utils/dateUtils';

// Sub-components
import { Trigger, parseObjectString } from './StaffDetailViewComponents/StaffDetailHelpers';
import StaffDetailHeader from './StaffDetailViewComponents/StaffDetailHeader';
import StaffProfileTab from './StaffDetailViewComponents/StaffProfileTab';
import StaffFinancialTab from './StaffDetailViewComponents/StaffFinancialTab';
import StaffAttendanceTab from './StaffDetailViewComponents/StaffAttendanceTab';
import StaffScheduleTab from './StaffDetailViewComponents/StaffScheduleTab';

const StaffDetailView = () => {
    const { cc } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const legacyStaff = useSelector((state) => state.allStaff || []);
    const { list: employees } = useSelector((state) => state.employees || { list: [] });

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
            setIsEditing(true);
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

    const [searchParams, setSearchParams] = useSearchParams();
    const fortnightRange = getCurrentFortnightRange();

    const [startDate, setStartDate] = useState(searchParams.get("desde") || fortnightRange.startDate);
    const [endDate, setEndDate] = useState(searchParams.get("hasta") || fortnightRange.endDate);

    useEffect(() => {
        const currentDesde = searchParams.get("desde");
        const currentHasta = searchParams.get("hasta");

        if (startDate !== currentDesde || endDate !== currentHasta) {
            setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev);
                newParams.set("desde", startDate);
                newParams.set("hasta", endDate);
                return newParams;
            }, { replace: true });
        }
    }, [startDate, endDate, setSearchParams, searchParams]);

    useEffect(() => {
        const staffList = employees.length > 0 ? employees : legacyStaff;

        if (staffList.length === 0) {
            dispatch(getAllFromTable(STAFF));
        } else if (cc) {
            const found = staffList.find(e => String(e.CC) === String(cc));
            if (found) {
                setEmployee(found);

                let turnos = [];
                if (Array.isArray(found.Turnos)) {
                    turnos = found.Turnos;
                } else if (typeof found.Turnos === "string" && found.Turnos.trim()) {
                    try {
                        const parsed = JSON.parse(found.Turnos);
                        turnos = Array.isArray(parsed) ? parsed : [parsed];
                    } catch { turnos = []; }
                }

                let propinas = [];
                if (Array.isArray(found.Propinas)) {
                    propinas = found.Propinas;
                } else if (typeof found.Propinas === "string" && found.Propinas.trim()) {
                    try {
                        const parsed = JSON.parse(found.Propinas);
                        propinas = Array.isArray(parsed) ? parsed : [parsed];
                    } catch { propinas = []; }
                }

                let cuenta = null;
                if (typeof found.Cuenta === "object" && found.Cuenta !== null) {
                    cuenta = found.Cuenta;
                } else if (typeof found.Cuenta === "string" && found.Cuenta.trim()) {
                    try {
                        cuenta = JSON.parse(found.Cuenta);
                    } catch {
                        cuenta = parseObjectString(found.Cuenta);
                    }
                }

                let infoContacto = null;
                if (typeof found.infoContacto === "object" && found.infoContacto !== null) {
                    infoContacto = found.infoContacto;
                } else if (typeof found.infoContacto === "string" && found.infoContacto.trim()) {
                    try {
                        infoContacto = JSON.parse(found.infoContacto);
                    } catch {
                        infoContacto = parseObjectString(found.infoContacto);
                    }
                }

                let turnosSet = {};
                if (typeof found.TurnosSet === "object" && found.TurnosSet !== null) {
                    turnosSet = found.TurnosSet;
                } else if (typeof found.TurnosSet === "string" && found.TurnosSet.trim()) {
                    try {
                        turnosSet = JSON.parse(found.TurnosSet);
                    } catch { turnosSet = {}; }
                }

                const defaultSchedule = {
                    Lunes: { inicio: "08:00", fin: "16:00", descanso: false },
                    Martes: { inicio: "08:00", fin: "16:00", descanso: false },
                    Miercoles: { inicio: "08:00", fin: "16:00", descanso: false },
                    Jueves: { inicio: "08:00", fin: "16:00", descanso: false },
                    Viernes: { inicio: "08:00", fin: "16:00", descanso: false },
                    Sabado: { inicio: "08:00", fin: "16:00", descanso: false },
                    Domingo: { inicio: "08:00", fin: "16:00", descanso: true }
                };

                setFormData({
                    ...found,
                    Turnos: turnos,
                    Propinas: propinas,
                    Cuenta: cuenta || { banco: '', tipo: '', numero: '' },
                    infoContacto: infoContacto || { nombreDeContacto: '', numeroDeContacto: '' },
                    isAdmin: found.isAdmin || false,
                    Show: found.Show !== false,
                    Contratacion: found.Contratacion !== false,
                    Codigo: found.Codigo || '',
                    Color: found.Color || '#3b82f6',
                    TurnosSet: Object.keys(turnosSet).length > 0 ? turnosSet : defaultSchedule
                });
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
    }, [cc, employees, legacyStaff, dispatch]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSave = () => {
        if (window.confirm("¿Estás seguro de guardar los cambios?")) {
            const dataToSave = {
                ...formData,
                Cuenta: JSON.stringify(formData.Cuenta),
                infoContacto: JSON.stringify(formData.infoContacto),
                TurnosSet: JSON.stringify(formData.TurnosSet),
                Codigo: parseInt(formData.Codigo) || null
            };

            dispatch(updateStaff(dataToSave));
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
        <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8 font-SpaceGrotesk">
            <div className="w-full flex flex-col gap-6">

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

                <StaffDetailHeader
                    formData={formData}
                    isEditing={isEditing}
                    handleInputChange={handleInputChange}
                    cc={cc}
                />

                {/* Detail Tabs Section */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex-1 min-h-[500px] flex flex-col">
                    <Tabs.Root className="flex flex-col flex-1" defaultValue="profile">
                        <Tabs.List className="flex border-b border-gray-100 bg-gray-50/50">
                            <Trigger value="profile" icon={User} label="Información General" />
                            <Trigger value="financial" icon={CreditCard} label="Datos Financieros" />
                            <Trigger value="history" icon={Calendar} label="Registro de Turnos" />
                            <Trigger value="schedule" icon={Calendar} label="Horario Base" />
                        </Tabs.List>

                        <div className="flex-1 p-8">
                            <StaffProfileTab
                                formData={formData}
                                isEditing={isEditing}
                                handleInputChange={handleInputChange}
                                handleDelete={handleDelete}
                            />

                            <StaffFinancialTab
                                formData={formData}
                                isEditing={isEditing}
                                handleInputChange={handleInputChange}
                            />

                            <StaffAttendanceTab
                                formData={formData}
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                                handleCalcularNomina={handleCalcularNomina}
                                cc={cc}
                                navigate={navigate}
                            />

                            <StaffScheduleTab
                                formData={formData}
                                isEditing={isEditing}
                                setFormData={setFormData}
                            />
                        </div>
                    </Tabs.Root>
                </div>
            </div>
        </div>
    );
};

export default StaffDetailView;
