import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabaseClient';
import { ALIADOS, AGENDA } from '@/redux/actions-types';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '@/redux/actions';
import { User, LogOut, Image as ImageIcon, Calendar, Plus, Save, Edit, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AliadoPortal() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const allAliados = useSelector(state => state.allAliados) || [];
    const allAgenda = useSelector(state => state.allAgenda) || [];

    const [loading, setLoading] = useState(false);
    const [loginInput, setLoginInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');
    
    const [currentAliado, setCurrentAliado] = useState(null);
    const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'eventos'
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    
    useEffect(() => {
        if (allAliados.length === 0) dispatch(getAllFromTable(ALIADOS));
        if (allAgenda.length === 0) dispatch(getAllFromTable(AGENDA));
    }, [dispatch]);

    // Check localStorage for session
    useEffect(() => {
        const storedId = localStorage.getItem("aliadoPortalId");
        if (storedId && !currentAliado && allAliados.length > 0) {
            const aliado = allAliados.find(a => a.id === storedId);
            if (aliado) {
                setCurrentAliado(aliado);
                setEditForm(aliado);
            } else {
                localStorage.removeItem("aliadoPortalId");
            }
        }
    }, [allAliados, currentAliado]);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const inputLower = loginInput.toLowerCase().trim();
        const aliado = allAliados.find(a => 
            (a.email && a.email.toLowerCase() === inputLower) || 
            (a.telefono && a.telefono.replace(/\s+/g, '') === inputLower.replace(/\s+/g, ''))
        );
        
        if (aliado) {
            if (aliado.password === passwordInput) {
                setCurrentAliado(aliado);
                setEditForm(aliado);
                localStorage.setItem("aliadoPortalId", aliado.id);
            } else {
                setError('Contraseña incorrecta.');
            }
        } else {
            setError('No se encontró ningún aliado con ese correo.');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        setCurrentAliado(null);
        localStorage.removeItem("aliadoPortalId");
        setLoginInput('');
        setPasswordInput('');
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            const { error } = await supabase.from(ALIADOS).update(editForm).eq('id', currentAliado.id);
            if (error) throw error;
            setCurrentAliado(editForm);
            setIsEditing(false);
            dispatch(getAllFromTable(ALIADOS));
            alert('Perfil actualizado con éxito');
        } catch (err) {
            console.error(err);
            alert('Error al actualizar el perfil');
        }
    };

    if (!currentAliado) {
        return (
            <div className="min-h-screen bg-cream-bg flex items-center justify-center p-6 font-sans">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold font-SpaceGrotesk text-darker-on-cream">Portal Aliados</h1>
                        <p className="text-gray-500 mt-2">Gestiona tus eventos y alianzas con Proyecto Café</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico o Teléfono</label>
                            <input 
                                type="text" 
                                required
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="tu@correo.com o número de teléfono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input 
                                type="password" 
                                required
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            {loading ? 'Entrando...' : 'Ingresar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        ¿No eres aliado aún? <Link to="/RegistroAliado" className="text-blue-600 hover:underline">Regístrate aquí</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Filtrar eventos del aliado
    const misEventos = allAgenda.filter(e => e.aliado_id === currentAliado.id);

    return (
        <div className="min-h-screen bg-cream-bg flex flex-col md:flex-row text-darker-on-cream font-sans">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white border-r border-gray-200 md:min-h-screen p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    {currentAliado.logo_url ? (
                        <img src={currentAliado.logo_url} alt="Logo" className="w-12 h-12 rounded-full object-cover border" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User size={24} />
                        </div>
                    )}
                    <div>
                        <h2 className="font-bold font-SpaceGrotesk truncate w-32">{currentAliado.nombre}</h2>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{currentAliado.estado_proceso}</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <button 
                        onClick={() => setActiveTab('perfil')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'perfil' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <User size={20} /> Mi Perfil
                    </button>
                    <button 
                        onClick={() => setActiveTab('eventos')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'eventos' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Calendar size={20} /> Mis Eventos
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full overflow-y-auto">
                {activeTab === 'perfil' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-SpaceGrotesk">Perfil de Marca</h2>
                            <button 
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-colors ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isEditing ? <><Save size={18} /> Guardar Cambios</> : <><Edit size={18} /> Editar Perfil</>}
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Nombre</label>
                                    {isEditing ? (
                                        <input name="nombre" value={editForm.nombre || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                                    ) : (
                                        <div className="font-medium text-lg">{currentAliado.nombre}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Categoría</label>
                                    <div className="font-medium text-lg">{currentAliado.categoria}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
                                    {isEditing ? (
                                        <input name="telefono" value={editForm.telefono || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                                    ) : (
                                        <div className="font-medium text-lg">{currentAliado.telefono || 'No registrado'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Instagram</label>
                                    {isEditing ? (
                                        <input name="instagram" value={editForm.instagram || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                                    ) : (
                                        <div className="font-medium text-blue-600">{currentAliado.instagram || 'No registrado'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de Contacto</label>
                                    {isEditing ? (
                                        <input name="nombre_contacto" value={editForm.nombre_contacto || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                                    ) : (
                                        <div className="font-medium text-lg">{currentAliado.nombre_contacto || 'No registrado'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Sitio Web</label>
                                    {isEditing ? (
                                        <input type="url" name="sitio_web" value={editForm.sitio_web || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                                    ) : (
                                        <div className="font-medium text-blue-600">{currentAliado.sitio_web || 'No registrado'}</div>
                                    )}
                                </div>
                                {isEditing && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Cambiar Contraseña</label>
                                        <input type="text" name="password" value={editForm.password || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Nueva contraseña..." />
                                    </div>
                                )}
                            </div>

                            <hr className="my-6 border-gray-100" />

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Descripción de la Marca</label>
                                    {isEditing ? (
                                        <textarea name="brand_description" value={editForm.brand_description || ''} onChange={handleEditChange} rows="3" className="w-full px-3 py-2 border rounded-lg"></textarea>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-gray-700">{currentAliado.brand_description || 'Sin descripción'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Público Objetivo</label>
                                    {isEditing ? (
                                        <textarea name="target_audience" value={editForm.target_audience || ''} onChange={handleEditChange} rows="2" className="w-full px-3 py-2 border rounded-lg"></textarea>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-gray-700">{currentAliado.target_audience || 'No especificado'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Valor Esperado / Expectativas</label>
                                    {isEditing ? (
                                        <textarea name="expected_value" value={editForm.expected_value || ''} onChange={handleEditChange} rows="2" className="w-full px-3 py-2 border rounded-lg"></textarea>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-gray-700">{currentAliado.expected_value || 'No especificado'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'eventos' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-SpaceGrotesk">Mis Eventos</h2>
                            <button 
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                onClick={() => navigate(`/agendaForm/new?aliado_id=${currentAliado.id}`)}
                            >
                                <Plus size={18} /> Proponer Evento
                            </button>
                        </div>

                        {misEventos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {misEventos.map(evento => (
                                    <div key={evento._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-lg font-SpaceGrotesk leading-tight">{evento.nombre}</h3>
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">Agendado</span>
                                        </div>
                                        <div className="text-sm text-gray-500 space-y-2 mb-4 flex-1">
                                            <div className="flex items-center gap-2"><Calendar size={14} /> {evento.fecha} | {evento.horaInicio}</div>
                                            <div className="flex items-center gap-2"><User size={14} /> {evento.numeroPersonas} personas max.</div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/agendaForm/${evento._id}`)}
                                            className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 flex items-center justify-center gap-2"
                                        >
                                            Ver Detalles <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                                <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 font-SpaceGrotesk">No tienes eventos aún</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Parece que aún no hemos realizado eventos juntos o no has propuesto ninguno. ¡Anímate a co-crear algo increíble con Proyecto Café!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
