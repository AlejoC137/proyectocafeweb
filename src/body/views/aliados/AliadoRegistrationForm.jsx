import React, { useState } from 'react';
import supabase from '@/config/supabaseClient';
import { ALIADOS } from '@/redux/actions-types';
import { UploadCloud, CheckCircle, ChevronRight, Image as ImageIcon, Info, DollarSign, Heart, Star, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatUrl } from '@/utils/urlUtils';

function AliadoRegistrationForm() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
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

    const processFile = async (file) => {
        if (!file) return;

        const isImageMime = file.type && file.type.startsWith('image/');
        const isImageExt = /\.(png|jpe?g|webp|svg|gif|avif|heic|bmp)$/i.test(file.name);

        if (!isImageMime && !isImageExt) {
            alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG, GIF, AVIF, HEIC, etc.)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen no debe superar los 10 MB.');
            return;
        }

        setIsUploading(true);
        try {
            let fileExt = 'png';
            if (file.name && file.name.includes('.')) {
                fileExt = file.name.split('.').pop().toLowerCase();
            } else if (file.type) {
                fileExt = file.type.split('/')[1]?.replace('+xml', '')?.toLowerCase() || 'png';
            }

            const uniqueName = `aliado_logo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("Images_eventos").upload(uniqueName, file, {
                cacheControl: '3600',
                upsert: true
            });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from("Images_eventos").getPublicUrl(uniqueName);
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (err) {
            console.error(err);
            alert("Error al subir la imagen: " + (err.message || err));
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveLogo = () => {
        setFormData(prev => ({ ...prev, logo_url: '' }));
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
            const dataToSubmit = {
                ...formData,
                sitio_web: formatUrl(formData.sitio_web)
            };
            const { error } = await supabase.from(ALIADOS).insert([dataToSubmit]);
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
                                                Eventos comerciales y talleres. Manejamos un modelo de <strong>división de ingresos (% a definir)</strong>. Ideal para experiencias de alto valor o con consumo mínimo garantizado.
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
                                        <input 
                                            type="text" 
                                            name="sitio_web" 
                                            value={formData.sitio_web} 
                                            onChange={handleChange} 
                                            onBlur={(e) => {
                                                if (e.target.value) {
                                                    setFormData(prev => ({ ...prev, sitio_web: formatUrl(e.target.value) }));
                                                }
                                            }}
                                            placeholder="ej. concervezatorio.vercel.app" 
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
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
                                
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Logo de tu Marca o Proyecto</label>
                                    
                                    {!formData.logo_url ? (
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                                                isDragging 
                                                    ? 'border-blue-500 bg-blue-50/70 scale-[1.01]' 
                                                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100/80'
                                            }`}
                                        >
                                            {isUploading ? (
                                                <div className="flex flex-col items-center py-4 space-y-2">
                                                    <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
                                                    <p className="text-sm font-medium text-blue-600">Subiendo logo a la nube...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                                        <UploadCloud size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            Arrastra y suelta el logo de tu marca aquí
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, WEBP, SVG, GIF, AVIF (Máx. 10MB)</p>
                                                    </div>
                                                    <div className="pt-2">
                                                        <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm">
                                                            <ImageIcon size={16} /> Seleccionar Imagen
                                                            <input 
                                                                type="file" 
                                                                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif, image/avif, image/heic, image/bmp, image/*" 
                                                                onChange={handleLogoUpload} 
                                                                className="hidden" 
                                                                disabled={isUploading} 
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-16 h-16 rounded-xl border bg-white p-1 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-contain" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                                                        <CheckCircle size={14} /> Logo cargado exitosamente
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5 max-w-[200px] sm:max-w-xs">{formData.logo_url}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Eliminar logo"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="pt-1">
                                        <details className="text-xs text-gray-500 cursor-pointer">
                                            <summary className="hover:text-blue-600 transition-colors">¿Prefieres ingresar la URL de la imagen directamente?</summary>
                                            <div className="mt-2">
                                                <input 
                                                    type="text"
                                                    name="logo_url"
                                                    value={formData.logo_url}
                                                    onChange={handleChange}
                                                    placeholder="https://ejemplo.com/mi-logo.png"
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                                />
                                            </div>
                                        </details>
                                    </div>
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
