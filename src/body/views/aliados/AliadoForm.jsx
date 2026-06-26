import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabaseClient';
import { ALIADOS } from '@/redux/actions-types';
import { X, Save } from 'lucide-react';

function AliadoForm({ aliadoToEdit = null, onClose }) {
    const [formData, setFormData] = useState({
        nombre: '',
        categoria: 'Patrocinado',
        email: '',
        telefono: '',
        instagram: '',
        estado_proceso: 'Prospecto',
        notas: '',
        brand_description: '',
        target_audience: '',
        expected_value: '',
        sitio_web: '',
        nombre_contacto: '',
        password: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (aliadoToEdit) {
            setFormData({
                nombre: aliadoToEdit.nombre || '',
                categoria: aliadoToEdit.categoria || 'Patrocinado',
                email: aliadoToEdit.email || '',
                telefono: aliadoToEdit.telefono || '',
                instagram: aliadoToEdit.instagram || '',
                estado_proceso: aliadoToEdit.estado_proceso || 'Prospecto',
                notas: aliadoToEdit.notas || '',
                brand_description: aliadoToEdit.brand_description || '',
                target_audience: aliadoToEdit.target_audience || '',
                expected_value: aliadoToEdit.expected_value || '',
                sitio_web: aliadoToEdit.sitio_web || '',
                nombre_contacto: aliadoToEdit.nombre_contacto || '',
                password: aliadoToEdit.password || ''
            });
        }
    }, [aliadoToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre) return alert('El nombre es obligatorio');
        
        setIsSaving(true);
        try {
            if (aliadoToEdit && aliadoToEdit.id) {
                // Update
                const { error } = await supabase.from(ALIADOS).update(formData).eq('id', aliadoToEdit.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase.from(ALIADOS).insert([formData]);
                if (error) throw error;
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el aliado: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-cream-bg px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold font-SpaceGrotesk text-darker-on-cream">
                    {aliadoToEdit ? 'Editar Aliado' : 'Nuevo Aliado'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-200/50 rounded-full text-gray-500 transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                <form id="aliado-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Nombre *</label>
                            <input 
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nombre de la marca o persona"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Categoría</label>
                            <select 
                                name="categoria"
                                value={formData.categoria}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Patrocinado">Patrocinado</option>
                                <option value="Aliado Sin Ánimo de Lucro">Aliado Sin Ánimo de Lucro</option>
                                <option value="Aliado Con Ánimo de Lucro">Aliado Con Ánimo de Lucro</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
                            <input 
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+57 300..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Instagram / Redes</label>
                            <input 
                                type="text"
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="@usuario"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Sitio Web</label>
                            <input 
                                type="url"
                                name="sitio_web"
                                value={formData.sitio_web}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Nombre del Contacto</label>
                            <input 
                                type="text"
                                name="nombre_contacto"
                                value={formData.nombre_contacto}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Estado del Proceso</label>
                            <select 
                                name="estado_proceso"
                                value={formData.estado_proceso}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Prospecto">Prospecto</option>
                                <option value="En Negociación">En Negociación</option>
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Contraseña del Portal</label>
                            <input 
                                type="text"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Crear o cambiar contraseña..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Descripción de la Marca</label>
                            <textarea 
                                name="brand_description"
                                value={formData.brand_description}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Público Objetivo</label>
                                <textarea 
                                    name="target_audience"
                                    value={formData.target_audience}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Valor Esperado / Expectativas</label>
                                <textarea 
                                    name="expected_value"
                                    value={formData.expected_value}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Notas Internas / Acuerdos</label>
                            <textarea 
                                name="notas"
                                value={formData.notas}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Detalles sobre el acuerdo..."
                            ></textarea>
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    form="aliado-form"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );
}

export default AliadoForm;
