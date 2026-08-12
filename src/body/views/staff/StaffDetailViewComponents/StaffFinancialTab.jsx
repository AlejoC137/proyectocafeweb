import React from "react";
import * as Tabs from '@radix-ui/react-tabs';
import { CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SectionTitle, formatCurrency } from './StaffDetailHelpers';

export const StaffFinancialTab = ({
  formData,
  isEditing,
  handleInputChange,
}) => {
  return (
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
            {isEditing ? (
              <Input
                name="Cuenta.banco"
                value={formData.Cuenta?.banco || ''}
                onChange={handleInputChange}
                placeholder="Ej: Bancolombia"
                className="mt-1"
              />
            ) : (
              <p className="text-xl font-bold text-slate-800">{formData.Cuenta?.banco || 'No especificado'}</p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tipo de Producto</span>
            {isEditing ? (
              <Input
                name="Cuenta.tipo"
                value={formData.Cuenta?.tipo || ''}
                onChange={handleInputChange}
                placeholder="Ej: Ahorros"
                className="mt-1"
              />
            ) : (
              <p className="text-xl font-bold text-slate-800">{formData.Cuenta?.tipo || 'Cuenta de Ahorros'}</p>
            )}
          </div>
          <div className="col-span-2 space-y-1 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Número de Cuenta</span>
            {isEditing ? (
              <Input
                name="Cuenta.numero"
                value={formData.Cuenta?.numero || ''}
                onChange={handleInputChange}
                placeholder="000-0000000-00"
                className="mt-1 font-mono text-lg"
              />
            ) : (
              <p className="text-4xl font-mono font-bold text-slate-900 tracking-tighter">
                {formData.Cuenta?.numero || '000-0000000-00'}
              </p>
            )}
          </div>
        </div>
      </div>

      <SectionTitle>Contacto de Emergencia</SectionTitle>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-2xl">
        <div className="grid grid-cols-2 gap-y-6">
          <div className="space-y-1">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-widest">Nombre de Contacto</span>
            {isEditing ? (
              <Input
                name="infoContacto.nombreDeContacto"
                value={formData.infoContacto?.nombreDeContacto || ''}
                onChange={handleInputChange}
                placeholder="Nombre completo"
                className="mt-1 border-amber-300 focus:ring-amber-500"
              />
            ) : (
              <p className="text-xl font-bold text-slate-800">{formData.infoContacto?.nombreDeContacto || 'No especificado'}</p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-widest">Número de Contacto</span>
            {isEditing ? (
              <Input
                name="infoContacto.numeroDeContacto"
                value={formData.infoContacto?.numeroDeContacto || ''}
                onChange={handleInputChange}
                placeholder="Teléfono"
                className="mt-1 border-amber-300 focus:ring-amber-500"
              />
            ) : (
              <p className="text-xl font-bold text-slate-800">{formData.infoContacto?.numeroDeContacto || 'No especificado'}</p>
            )}
          </div>
        </div>
      </div>
    </Tabs.Content>
  );
};

export default StaffFinancialTab;
