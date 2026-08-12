import React from "react";
import { User, Phone, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const StaffDetailHeader = ({
  formData,
  isEditing,
  handleInputChange,
  cc,
}) => {
  return (
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
  );
};

export default StaffDetailHeader;
