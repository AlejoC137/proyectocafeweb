import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearSelection } from '../../../redux/slices/employeeSlice';
import { updateStaff, deleteStaff } from '../../../redux/actions';
import { X, User, CreditCard, Calendar, Edit2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const StaffModal = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedEmployee: employee } = useSelector((state) => state.employees || {});
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (employee) {
            setFormData({
                ...employee,
                isAdmin: employee.isAdmin || false,
                Show: employee.Show !== false // Default to true if undefined
            });
            setIsEditing(false);
        }
    }, [employee]);

    if (!employee) return null;

    const handleClose = () => {
        dispatch(clearSelection());
        navigate('/staff-manager');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = () => {
        if (window.confirm("¿Estás seguro de guardar los cambios?")) {
            dispatch(updateStaff(formData)); // Assumes updateStaff action exists and handles the API call
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm("ADVERTENCIA: ¿Estás seguro de ELIMINAR este empleado? Esta acción no se puede deshacer.")) {
            dispatch(deleteStaff(employee._id));
            handleClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative">

                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold border-2 border-slate-500">
                            {formData.Nombre?.[0]}{formData.Apellido?.[0]}
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="flex gap-2 mb-1">
                                    <Input
                                        name="Nombre"
                                        value={formData.Nombre}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-8"
                                        placeholder="Nombre"
                                    />
                                    <Input
                                        name="Apellido"
                                        value={formData.Apellido}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-8"
                                        placeholder="Apellido"
                                    />
                                </div>
                            ) : (
                                <h2 className="text-2xl font-bold">{formData.Nombre} {formData.Apellido}</h2>
                            )}

                            <div className="text-slate-400 flex items-center gap-2 text-sm">
                                {isEditing ? (
                                    <>
                                        <Input
                                            name="Cargo"
                                            value={formData.Cargo}
                                            onChange={handleInputChange}
                                            className="bg-slate-800 border-slate-700 text-white h-6 w-32 text-xs"
                                        />
                                        <Input
                                            name="Celular"
                                            value={formData.Celular}
                                            onChange={handleInputChange}
                                            className="bg-slate-800 border-slate-700 text-white h-6 w-32 text-xs"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="bg-slate-700 px-2 py-0.5 rounded text-xs uppercase tracking-wide">{formData.Cargo}</span>
                                        <span>{formData.Celular}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <Tabs.Root className="flex flex-col flex-1 overflow-hidden" defaultValue="profile">
                    <Tabs.List className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                        <Trigger value="profile" icon={User} label="Perfil" />
                        <Trigger value="financial" icon={CreditCard} label="Financiero" />
                        <Trigger value="history" icon={Calendar} label="Historial" />
                    </Tabs.List>

                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                        <Tabs.Content value="profile" className="outline-none space-y-6">
                            <SectionTitle>Información Personal</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <InfoItem label="ID Sistema" value={formData._id} />

                                {isEditing ? (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 uppercase font-semibold">CC (Documento)</label>
                                            <Input name="CC" value={formData.CC || ''} onChange={handleInputChange} className="h-8" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 uppercase font-semibold">Dirección</label>
                                            <Input name="Direccion" value={formData.Direccion || ''} onChange={handleInputChange} className="h-8" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <InfoItem label="CC" value={formData.CC || 'N/A'} />
                                        <InfoItem label="Dirección" value={formData.Direccion || 'N/A'} />
                                    </>
                                )}

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="isAdmin"
                                        name="isAdmin"
                                        checked={formData.isAdmin}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">Es Administrador</label>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="Show"
                                        name="Show"
                                        checked={formData.Show}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <label htmlFor="Show" className="text-sm font-medium text-gray-700">Visible en Nómina</label>
                                </div>
                            </div>
                        </Tabs.Content>

                        <Tabs.Content value="financial" className="outline-none space-y-6">
                            <SectionTitle>Compensación</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isEditing ? (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 uppercase font-semibold">Tarifa (Rate)</label>
                                        <Input
                                            type="number"
                                            name="Rate"
                                            value={formData.Rate}
                                            onChange={handleInputChange}
                                            className="h-8"
                                        />
                                    </div>
                                ) : (
                                    <InfoItem label="Tarifa (Rate)" value={formatCurrency(formData.Rate || 0)} />
                                )}
                                <InfoItem label="Total Propinas" value={formatCurrency(Number(formData.Propinas) || 0)} />
                            </div>

                            <SectionTitle>Datos Bancarios (Solo Lectura)</SectionTitle>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col gap-2 opacity-75">
                                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                                    <span className="text-blue-900 font-medium">Banco</span>
                                    <span className="text-blue-700">{formData.Cuenta?.banco || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                                    <span className="text-blue-900 font-medium">Tipo de Cuenta</span>
                                    <span className="text-blue-700">{formData.Cuenta?.tipo || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-900 font-medium">Número</span>
                                    <span className="text-blue-700 font-mono text-lg">{formData.Cuenta?.numero || 'N/A'}</span>
                                </div>
                            </div>
                        </Tabs.Content>

                        <Tabs.Content value="history" className="outline-none">
                            <SectionTitle>Historial Reciente</SectionTitle>
                            <div className="mt-4 border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Fecha</th>
                                            <th className="px-4 py-2 text-center">Entrada</th>
                                            <th className="px-4 py-2 text-center">Salida</th>
                                            <th className="px-4 py-2 text-right">Duración</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {Array.isArray(formData.Turnos) && formData.Turnos.length > 0 ? (
                                            formData.Turnos.map((turno, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 font-medium text-gray-700">
                                                        {turno.fecha || turno.turnoDate?.split('T')[0] || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">{turno.horaInicio || '--:--'}</td>
                                                    <td className="px-4 py-2 text-center">{turno.horaCierre || turno.horaSalida || '--:--'}</td>
                                                    <td className="px-4 py-2 text-right text-gray-500">
                                                        {calculateDuration(turno.horaInicio, turno.horaCierre || turno.horaSalida)} hrs
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                                                    No hay historial de turnos disponible.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Tabs.Content>
                    </div>
                </Tabs.Root>

                {/* Footer Actions */}
                <div className="bg-gray-50 p-4 border-t flex justify-between items-center shrink-0">
                    {isEditing ? (
                        <Button variant="destructive" onClick={handleDelete} className="gap-2">
                            <Trash2 className="w-4 h-4" /> Eliminar
                        </Button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 gap-2">
                                    <Save className="w-4 h-4" /> Guardar Cambios
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleClose}>Cerrar</Button>
                                <Button onClick={() => setIsEditing(true)} className="bg-slate-900 hover:bg-slate-800 gap-2">
                                    <Edit2 className="w-4 h-4" /> Editar Información
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Components Helpers ---

const Trigger = ({ value, icon: Icon, label }) => (
    <Tabs.Trigger
        value={value}
        className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 transition",
            "data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-white"
        )}
    >
        <Icon className="w-4 h-4" />
        {label}
    </Tabs.Trigger>
);

const SectionTitle = ({ children }) => (
    <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-500 pl-3">
        {children}
    </h3>
);

const InfoItem = ({ label, value, highlight }) => (
    <div className="flex flex-col">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
        <span className={clsx("font-medium text-gray-900 truncate", highlight && "text-blue-600 font-bold")}>
            {value}
        </span>
    </div>
);

// --- Utils ---
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
};

const calculateDuration = (start, end) => {
    if (!start || !end) return '-';
    // Simple calculation assuming same day for preview
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const duration = (h2 - h1) + (m2 - m1) / 60;
    return duration > 0 ? duration.toFixed(2) : '-';
};

export default StaffModal;
