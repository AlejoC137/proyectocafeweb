import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabaseClient';
import { X, Save, AlertCircle, UserCheck, ShieldCheck, Package, DollarSign } from 'lucide-react';

const MOTIVOS_PERSONAL = [
  'Renuncia Voluntaria',
  'Terminación de Contrato',
  'Despido con Causa',
  'Despido sin Causa',
  'Licencia / Incapacidad Prolongada',
  'Período de Prueba No Superado',
  'Otro'
];

const MOTIVOS_INVENTARIO = [
  'Avería / Daño',
  'Pérdida / Extravío',
  'Obsolescencia / Caducidad',
  'Baja por Donación / Desecho',
  'Ajuste de Inventario',
  'Otro'
];

const ESTADOS = [
  'Pendiente',
  'En Proceso',
  'Completado',
  'Liquidado',
  'Rechazado'
];

const TIPOS_BAJA = [
  { value: 'Personal', label: 'Baja de Personal (Empleado)' },
  { value: 'Dotación', label: 'Entrega / Devolución de Dotación' },
  { value: 'Inventario/Equipo', label: 'Baja de Activo / Equipo / Inventario' },
  { value: 'Incapacidad', label: 'Incapacidad / Licencia Médica' }
];

export default function BajasFormModal({
  isOpen,
  onClose,
  onSuccess,
  bajaToEdit = null,
  staffList = [],
  itemsList = [],
  proveedoresList = []
}) {
  const [formData, setFormData] = useState({
    tipo_baja: 'Personal',
    staff_id: '',
    item_id: '',
    proveedor_id: '',
    fecha_baja: new Date().toISOString().split('T')[0],
    motivo: 'Renuncia Voluntaria',
    estado: 'Pendiente',
    monto_liquidacion: 0,
    paz_y_salvo: false,
    entrega_dotacion: false,
    observaciones: '',
    documento_adjunto_url: '',
    registrado_por: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (bajaToEdit) {
      setFormData({
        tipo_baja: bajaToEdit.tipo_baja || 'Personal',
        staff_id: bajaToEdit.staff_id || '',
        item_id: bajaToEdit.item_id || '',
        proveedor_id: bajaToEdit.proveedor_id || '',
        fecha_baja: bajaToEdit.fecha_baja ? bajaToEdit.fecha_baja.split('T')[0] : new Date().toISOString().split('T')[0],
        motivo: bajaToEdit.motivo || 'Renuncia Voluntaria',
        estado: bajaToEdit.estado || 'Pendiente',
        monto_liquidacion: bajaToEdit.monto_liquidacion || 0,
        paz_y_salvo: Boolean(bajaToEdit.paz_y_salvo),
        entrega_dotacion: Boolean(bajaToEdit.entrega_dotacion),
        observaciones: bajaToEdit.observaciones || '',
        documento_adjunto_url: bajaToEdit.documento_adjunto_url || '',
        registrado_por: bajaToEdit.registrado_por || ''
      });
    } else {
      setFormData({
        tipo_baja: 'Personal',
        staff_id: staffList[0]?._id || '',
        item_id: '',
        proveedor_id: '',
        fecha_baja: new Date().toISOString().split('T')[0],
        motivo: 'Renuncia Voluntaria',
        estado: 'Pendiente',
        monto_liquidacion: 0,
        paz_y_salvo: false,
        entrega_dotacion: false,
        observaciones: '',
        documento_adjunto_url: '',
        registrado_por: ''
      });
    }
    setErrorMsg(null);
  }, [bajaToEdit, isOpen, staffList]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTipoChange = (e) => {
    const newTipo = e.target.value;
    const defaultMotivo = newTipo === 'Personal' || newTipo === 'Incapacidad'
      ? MOTIVOS_PERSONAL[0]
      : MOTIVOS_INVENTARIO[0];
    
    setFormData((prev) => ({
      ...prev,
      tipo_baja: newTipo,
      motivo: defaultMotivo
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Formatear payload para Supabase
    const payload = {
      tipo_baja: formData.tipo_baja,
      staff_id: formData.staff_id || null,
      item_id: formData.item_id || null,
      proveedor_id: formData.proveedor_id || null,
      fecha_baja: formData.fecha_baja,
      motivo: formData.motivo,
      estado: formData.estado,
      monto_liquidacion: parseFloat(formData.monto_liquidacion) || 0,
      paz_y_salvo: formData.paz_y_salvo,
      entrega_dotacion: formData.entrega_dotacion,
      observaciones: formData.observaciones,
      documento_adjunto_url: formData.documento_adjunto_url,
      registrado_por: formData.registrado_por
    };

    try {
      if (bajaToEdit?.id) {
        const { error } = await supabase
          .from('Bajas')
          .update(payload)
          .eq('id', bajaToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Bajas')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar registro de baja:', err);
      setErrorMsg(err.message || 'Error al guardar el registro en Supabase');
    } finally {
      setLoading(false);
    }
  };

  const motivosDisponibles = (formData.tipo_baja === 'Personal' || formData.tipo_baja === 'Incapacidad')
    ? MOTIVOS_PERSONAL
    : MOTIVOS_INVENTARIO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 my-8 transition-all">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700/60">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              {bajaToEdit ? 'Editar Registro de Baja' : 'Registrar Nueva Baja'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Formato administrativo para desvinculación, paz y salvo y saldos de personal
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Baja */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Tipo de Baja *
              </label>
              <select
                name="tipo_baja"
                value={formData.tipo_baja}
                onChange={handleTipoChange}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {TIPOS_BAJA.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de Baja */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Fecha de Baja *
              </label>
              <input
                type="date"
                name="fecha_baja"
                value={formData.fecha_baja}
                onChange={handleChange}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empleado (Staff) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Empleado (Staff)
              </label>
              <select
                name="staff_id"
                value={formData.staff_id}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Seleccionar Empleado --</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.Nombre} {s.Apellido} {s.Cargo ? `(${s.Cargo})` : ''} - CC: {s.CC || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Motivo Principial *
              </label>
              <select
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {motivosDisponibles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Relación Opcional: Ítem de Almacén */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-zinc-400" />
                Ítem de Inventario / Dotación (Opcional)
              </label>
              <select
                name="item_id"
                value={formData.item_id}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Ningún Ítem --</option>
                {itemsList.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.Nombre_Item || item.Nombre || item._id} {item.Categoria ? `(${item.Categoria})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Relación Opcional: Proveedor */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Proveedor Relacionado (Opcional)
              </label>
              <select
                name="proveedor_id"
                value={formData.proveedor_id}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Ningún Proveedor --</option>
                {proveedoresList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.Nombre_Proveedor || p.Nombre || p._id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Estado del Trámite *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ESTADOS.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto de Liquidación */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Monto de Liquidación ($ COP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="monto_liquidacion"
                value={formData.monto_liquidacion}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Checks Paz y Salvo / Dotación */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="paz_y_salvo"
                checked={formData.paz_y_salvo}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Paz y Salvo Aprobado
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="entrega_dotacion"
                checked={formData.entrega_dotacion}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                Dotación / Equipos Devueltos
              </span>
            </label>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Observaciones / Detalles de la Baja
            </label>
            <textarea
              name="observaciones"
              rows={3}
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Detalles sobre motivos, entrega de llaves, uniforme, liquidación pendiente..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* URL Documento Adjunto */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Link Documento / Carta de Renuncia (URL)
              </label>
              <input
                type="url"
                name="documento_adjunto_url"
                value={formData.documento_adjunto_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Registrado Por */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Registrado Por (Administrador)
              </label>
              <input
                type="text"
                name="registrado_por"
                value={formData.registrado_por}
                onChange={handleChange}
                placeholder="Nombre del responsable"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : (bajaToEdit ? 'Actualizar Registro' : 'Guardar Baja')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
