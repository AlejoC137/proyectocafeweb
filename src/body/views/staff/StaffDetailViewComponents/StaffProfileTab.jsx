import React from "react";
import * as Tabs from '@radix-ui/react-tabs';
import { MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle, InfoItem, ToggleOption } from './StaffDetailHelpers';

export const StaffProfileTab = ({
  formData,
  isEditing,
  handleInputChange,
  handleDelete,
}) => {
  return (
    <Tabs.Content value="profile" className="outline-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SectionTitle>Detalles del Empleado</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InfoItem
          label="ID de Sistema"
          value={formData._id}
          sublabel="Identificador único de base de datos"
        />
        <div className="space-y-4">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Dirección de Residencia</label>
              <div className="flex gap-2">
                <MapPin className="text-slate-400 w-5 h-5 mt-2 shrink-0" />
                <Input
                  name="Direccion"
                  value={formData.Direccion || ''}
                  onChange={handleInputChange}
                  placeholder="Ingrese dirección completa"
                />
              </div>
              <label className="text-sm font-bold text-gray-700 mt-2">Código (PIN de Acceso)</label>
              <Input
                type="number"
                name="Codigo"
                value={formData.Codigo || ''}
                onChange={handleInputChange}
                placeholder="Ej: 1234"
              />
              <label className="text-sm font-bold text-gray-700 mt-2">Color del Staff</label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  name="Color"
                  value={formData.Color || '#3b82f6'}
                  onChange={handleInputChange}
                  className="w-12 h-10 p-1"
                />
                <span className="text-sm text-gray-500">Usado en Calendario de Producción</span>
              </div>
            </div>
          ) : (
            <>
              <InfoItem
                label="Dirección"
                value={formData.Direccion || 'No registrada'}
                icon={MapPin}
              />
              <div className="mt-4 flex gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Código (PIN)</span>
                  <span className="text-lg font-bold text-slate-800">{formData.Codigo || 'No configurado'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Color</span>
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm mt-1" style={{ backgroundColor: formData.Color || '#3b82f6' }}></div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-50 p-6 rounded-xl space-y-4">
          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Privilegios y Visibilidad</h4>
          <div className="space-y-4">
            <ToggleOption
              id="isAdmin"
              label="Habilitar Acceso Administrador"
              checked={formData.isAdmin}
              onChange={handleInputChange}
              disabled={!isEditing}
              description="Permite acceder a resúmenes de ventas y configuración global."
            />
            <ToggleOption
              id="Show"
              label="Mostrar en Listado de Nómina"
              checked={formData.Show}
              onChange={handleInputChange}
              disabled={!isEditing}
              description="Determina si el empleado aparece en el cálculo de pagos."
            />
            <ToggleOption
              id="Contratacion"
              label="Empleado Activo"
              checked={formData.Contratacion}
              onChange={handleInputChange}
              disabled={!isEditing}
              description="Activa o desactiva al empleado. Los inactivos se agrupan colapsados."
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex items-end">
            <Button variant="destructive" onClick={handleDelete} className="w-full gap-2">
              <Trash2 className="w-4 h-4" /> Eliminar Empleado
            </Button>
          </div>
        )}
      </div>
    </Tabs.Content>
  );
};

export default StaffProfileTab;
