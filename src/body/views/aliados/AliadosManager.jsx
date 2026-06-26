import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '@/redux/actions';
import { ALIADOS } from '@/redux/actions-types';
import supabase from '@/config/supabaseClient';
import AliadoForm from './AliadoForm';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

function AliadosManager() {
    const dispatch = useDispatch();
    const allAliados = useSelector(state => state.allAliados) || [];
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAliado, setSelectedAliado] = useState(null);

    useEffect(() => {
        dispatch(getAllFromTable(ALIADOS));
    }, [dispatch]);

    const handleEdit = (aliado) => {
        setSelectedAliado(aliado);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedAliado(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if(window.confirm('¿Estás seguro de eliminar este aliado?')) {
            const { error } = await supabase.from(ALIADOS).delete().eq('id', id);
            if(error) {
                console.error(error);
                alert('Error al eliminar');
            } else {
                dispatch(getAllFromTable(ALIADOS));
            }
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedAliado(null);
        dispatch(getAllFromTable(ALIADOS));
    };

    const filteredAliados = allAliados.filter(a => {
        const matchesSearch = (a.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = categoryFilter ? a.categoria === categoryFilter : true;
        const matchesStatus = statusFilter ? a.estado_proceso === statusFilter : true;
        return matchesSearch && matchesCat && matchesStatus;
    });

    const copyToClipboard = (path) => {
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url);
        alert(`Enlace copiado: ${url}`);
    };

    return (
        <div className="p-6 bg-cream-bg min-h-screen text-darker-on-cream">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-SpaceGrotesk font-bold">Base de Datos de Aliados</h1>
                <div className="flex gap-3">
                    <button 
                        onClick={() => copyToClipboard('/RegistroAliado')}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                    >
                        Copiar Link Registro
                    </button>
                    <button 
                        onClick={() => copyToClipboard('/PortalAliado')}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                    >
                        Copiar Link Portal
                    </button>
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm"
                    >
                        <Plus size={20} /> Nuevo Aliado
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar aliado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                </div>
                <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-blue-400"
                >
                    <option value="">Todas las Categorías</option>
                    <option value="Patrocinado">Patrocinado</option>
                    <option value="Aliado Sin Ánimo de Lucro">Sin Ánimo de Lucro</option>
                    <option value="Aliado Con Ánimo de Lucro">Con Ánimo de Lucro</option>
                </select>
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-blue-400"
                >
                    <option value="">Todos los Estados</option>
                    <option value="Prospecto">Prospecto</option>
                    <option value="En Negociación">En Negociación</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-4 font-semibold text-gray-600">Nombre</th>
                                <th className="py-3 px-4 font-semibold text-gray-600">Categoría</th>
                                <th className="py-3 px-4 font-semibold text-gray-600">Estado</th>
                                <th className="py-3 px-4 font-semibold text-gray-600">Contacto</th>
                                <th className="py-3 px-4 font-semibold text-gray-600 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAliados.length > 0 ? (
                                filteredAliados.map((aliado) => (
                                    <tr key={aliado.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4 font-medium">{aliado.nombre}</td>
                                        <td className="py-3 px-4">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                {aliado.categoria}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                aliado.estado_proceso === 'Activo' ? 'bg-green-100 text-green-800' :
                                                aliado.estado_proceso === 'Prospecto' ? 'bg-yellow-100 text-yellow-800' :
                                                aliado.estado_proceso === 'Inactivo' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {aliado.estado_proceso}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {aliado.email && <div className="truncate w-40" title={aliado.email}>{aliado.email}</div>}
                                            {aliado.instagram && <div className="truncate w-40 text-blue-500" title={aliado.instagram}>{aliado.instagram}</div>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEdit(aliado)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(aliado.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">
                                        No se encontraron aliados que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <AliadoForm aliadoToEdit={selectedAliado} onClose={handleCloseForm} />
                </div>
            )}
        </div>
    );
}

export default AliadosManager;
