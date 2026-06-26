import React, { useState } from 'react';
import supabase from '@/config/supabaseClient';
import { ALIADOS } from '@/redux/actions-types';
import { UploadCloud, CheckCircle, ChevronRight, Image as ImageIcon, Info, DollarSign, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

function AliadoRegistrationForm() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        instagram: '',
        password: '',
        logo_url: '',
        brand_description: '',
        target_audience: '',
        expected_value: '',
        sitio_web: '',
        nombre_contacto: '',
        categoria: 'Aliado Sin Ánimo de Lucro', // Default
        estado_proceso: 'Prospecto'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const uniqueName = `aliado_logo_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("Images_eventos").upload(uniqueName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from("Images_eventos").getPublicUrl(uniqueName);
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (err) {
            console.error(err);
            alert("Error subiendo el logo");
        } finally {
            setIsUploading(false);
        }
    };

    const nextStep = (e) => {
        e.preventDefault();
        setStep(s => s + 1);
    };

    const prevStep = () => {
        setStep(s => s - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from(ALIADOS).insert([formData]);
            if (error) throw error;
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Error al enviar el registro: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-6 text-darker-on-cream">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6">
                    <div className="flex justify-center text-green-500">
                        <CheckCircle size={80} />
                    </div>
                    <h1 className="text-3xl font-bold font-SpaceGrotesk">¡Registro Exitoso!</h1>
                    <p className="text-gray-600">
                        Gracias por querer ser parte de Proyecto Café. Hemos recibido tu información y está en revisión. 
                    </p>
                    <p className="text-gray-600">
                        Puedes acceder a tu panel de aliado usando tu correo y contraseña para editar tu perfil o proponer eventos futuros.
                    </p>
                    <div className="pt-4">
                        <Link to="/PortalAliado" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                            Ir al Portal de Aliado
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-bg py-12 px-4 sm:px-6 lg:px-8 text-darker-on-cream font-sans">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <h2 className="text-3xl font-bold font-SpaceGrotesk text-white">Únete a Proyecto Café</h2>
                    <p className="text-blue-100 mt-2">Formulario de registro para Aliados</p>
                </div>

                <div className="p-8">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`h-2 w-1/4 rounded-l-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`h-2 w-1/4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`h-2 w-1/4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`h-2 w-1/4 rounded-r-full ${step >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    </div>

                    <form onSubmit={step === 4 ? handleSubmit : nextStep} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                                    <Info className="text-blue-600" size={24} /> 
                                    Paso 1: ¿Cómo funcionan nuestras alianzas?
                                </h3>
                                <div className="text-sm text-gray-700 space-y-4">
                                    <p className="text-base">
                                        En Proyecto: Café buscamos co-crear experiencias de valor. Nuestro <strong>aforo íntimo de 16 personas</strong> nos permite ofrecer formatos exclusivos, enfocando nuestras alianzas en tres modelos principales:
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col items-start gap-3 shadow-sm">
                                            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                                                <DollarSign size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-blue-800 leading-tight">Con Ánimo de Lucro</h4>
                                            </div>
                                            <p className="text-xs text-blue-900 flex-1">
                                                Eventos comerciales y talleres. Manejamos un modelo de <strong>división de ingresos (60% Aliado / 40% Café)</strong>. Ideal para experiencias de alto valor (+$80.000 COP) o con consumo mínimo garantizado.
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex flex-col items-start gap-3 shadow-sm">
                                            <div className="p-2 bg-green-100 rounded-xl text-green-700">
                                                <Heart size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-green-800 leading-tight">Sin Ánimo de Lucro</h4>
                                            </div>
                                            <p className="text-xs text-green-900 flex-1">
                                                Eventos comunitarios, culturales o de impacto social. Dinamizan el espacio, aportan al tejido social y no tienen costo de boletería.
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex flex-col items-start gap-3 shadow-sm">
                                            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-purple-800 leading-tight">Patrocinado</h4>
                                            </div>
                                            <p className="text-xs text-purple-900 flex-1">
                                                El café asume los costos de forma estratégica para posicionamiento de marca, atracción de nuevo público y creación de contenido en conjunto.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mt-6 shadow-sm">
                                        <h4 className="font-bold text-amber-800 mb-3">Ten en cuenta que...</h4>
                                        <ul className="list-disc pl-5 text-sm text-amber-900 space-y-2 marker:text-amber-500">
                                            <li>La capacidad máxima para eventos sentados es de <strong>16 personas</strong>. Los eventos comerciales deben ser altamente rentables para ambas partes.</li>
                                            <li>Se requiere un registro detallado de asistentes y contenido digital (fotos/videos) en cada evento para nutrir la comunidad.</li>
                                            <li>Priorizamos experiencias exclusivas como cenas clandestinas, catas sensoriales, talleres creativos o alquileres corporativos boutique.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-semibold border-b pb-2 mb-4">Paso 2: Información Básica</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Marca o Proyecto *</label>
                                    <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                                        <input type="text" name="telefono" required value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Contacto</label>
                                    <input type="text" name="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} placeholder="Ej: Juan Pérez" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram o Redes Sociales</label>
                                        <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@tu_marca" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                                        <input type="url" name="sitio_web" value={formData.sitio_web} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Aliado que te interesa</label>
                                    <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option value="Aliado Sin Ánimo de Lucro">Colectivo / Organización sin ánimo de lucro</option>
                                        <option value="Aliado Con Ánimo de Lucro">Marca / Empresa comercial (Con ánimo de lucro)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-semibold border-b pb-2 mb-4">Paso 3: Detalles Estratégicos</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">¿De qué trata tu marca/proyecto?</label>
                                    <textarea name="brand_description" required value={formData.brand_description} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe brevemente la esencia de tu proyecto..."></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">¿A quién va dirigido? (Público Objetivo)</label>
                                    <textarea name="target_audience" required value={formData.target_audience} onChange={handleChange} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Jóvenes de 20-35 años interesados en arte local..."></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué buscas lograr haciendo un evento/alianza con Proyecto Café?</label>
                                    <textarea name="expected_value" required value={formData.expected_value} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Llegar a nuevo público, lanzar un producto, hacer comunidad..."></textarea>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-semibold border-b pb-2 mb-4">Paso 4: Perfil y Seguridad</h3>
                                
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sube el Logo de tu Marca</label>
                                    <div className="flex justify-center">
                                        <label className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 font-medium">
                                            <UploadCloud size={18} /> {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploading} />
                                        </label>
                                    </div>
                                    {formData.logo_url && (
                                        <div className="mt-4">
                                            <img src={formData.logo_url} alt="Logo preview" className="h-20 object-contain mx-auto rounded-lg border border-gray-200 shadow-sm" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Crea una Contraseña *</label>
                                    <p className="text-xs text-gray-500 mb-2">Usarás esta contraseña (junto con tu email si lo ingresaste) para ingresar al portal y autogestionar tus eventos.</p>
                                    <input type="password" name="password" required value={formData.password} onChange={handleChange} minLength="6" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-6 border-t">
                            {step > 1 ? (
                                <button type="button" onClick={prevStep} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                                    Atrás
                                </button>
                            ) : <div></div>}
                            
                            <button type="submit" disabled={isSubmitting || isUploading} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                                {step === 4 ? (isSubmitting ? 'Enviando...' : 'Completar Registro') : 'Entendido, Siguiente'} <ChevronRight size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="text-center mt-6">
                <Link to="/PortalAliado" className="text-blue-600 hover:underline">¿Ya eres aliado? Inicia Sesión aquí</Link>
            </div>
        </div>
    );
}

export default AliadoRegistrationForm;
