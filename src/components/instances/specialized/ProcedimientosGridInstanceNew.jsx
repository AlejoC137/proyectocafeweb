import React, { useState } from 'react';
import { WorkIssueInstanceCard } from '../base/InstanceCard';
import { useWorkIssueForm } from '../hooks/useWorkIssueForm';
import { useInstanceActions } from '../hooks/useInstanceActions';
import { Button } from '@/components/ui/button';
import RecepieOptionsProcedimientos from '../../../body/components/recepieOptions/RecepieOptionsProcedimientos';

/**
 * Componente ProcedimientosGridInstance refactorizado usando la nueva arquitectura
 * Reemplaza a CardGridProcedimientos_Instance con funcionalidad mejorada
 */
export function ProcedimientosGridInstanceNew({ 
  item, 
  currentType, 
  book, 
  product, 
  receta, 
  handleSaveReceta, 
  handleCreateReceta 
}) {
  
  // Usar hooks especializados para work issues (los procedimientos tienen estructura similar)
  const {
    formData,
    dates,
    pagado,
    handleChange,
    handleDateChange,
    handlePagadoChange,
    getWorkIssueData
  } = useWorkIssueForm(item);

  const {
    handleUpdate,
    handleDelete,
    handleStatusChange,
    buttonState
  } = useInstanceActions(item._id, currentType);

  const [showGeneralInfo, setShowGeneralInfo] = useState(false);

  // Función para guardar con datos formateados
  const onSave = async () => {
    const procedimientoData = {
      ...getWorkIssueData(),
      tittle: formData.tittle, // Título específico de procedimientos
      Receta: formData.Receta
    };
    
    await handleUpdate(procedimientoData);
  };

  // Header específico para procedimientos
  const procedimientoHeader = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        Creado: {dates.value.isued?.split("T")[0] || ""}
      </span>
      {dates.value.finished && (
        <span className="text-sm text-green-600">
          Finalizado: {dates.value.finished.split("T")[0]}
        </span>
      )}
    </div>
  );

  // Formulario básico de procedimiento
  const procedimientoForm = (
    <div className="space-y-4">
      {/* Campo de título principal */}
      <label className="text-sm text-gray-700 flex-1">
        Título:
        <input
          type="text"
          name="tittle"
          value={formData.tittle}
          onChange={handleChange}
          className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
        />
      </label>

      {/* Sección de receta siempre visible */}
      <div className="border rounded p-3 bg-gray-50">
        <h5 className="font-medium text-gray-800 mb-2">Receta del Procedimiento</h5>
        <RecepieOptionsProcedimientos
          product={item}
          receta={item.Receta}
          currentType={currentType}
          onSaveReceta={handleSaveReceta}
          onCreateReceta={handleCreateReceta}
        />
      </div>

      {/* Información general expandible */}
      {showGeneralInfo && (
        <div className="border rounded p-3 bg-blue-50 space-y-3">
          <h5 className="font-medium text-blue-800">Información General</h5>
          
          {/* Categoría y Ejecutor */}
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1">
              Categoría:
              <input
                type="text"
                name="Categoria"
                value={formData.Categoria}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Ejecutor:
              <input
                type="text"
                name="Ejecutor"
                value={formData.Ejecutor}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
          </div>

          {/* Fechas */}
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1">
              Fecha de Creación:
              <input
                type="date"
                name="isued"
                value={dates.value.isued ? dates.value.isued.split('T')[0] : ""}
                onChange={handleDateChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Fecha de Finalización:
              <input
                type="date"
                name="finished"
                value={dates.value.finished ? dates.value.finished.split('T')[0] : ""}
                onChange={handleDateChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
          </div>

          {/* Estado de pago */}
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1">
              Pagado:
              <select
                value={pagado.value.pagadoFull}
                onChange={(e) => handlePagadoChange('pagadoFull', e.target.value === "true")}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>
            {!pagado.value.pagadoFull && (
              <label className="text-sm text-gray-700 flex-1">
                Adelanto:
                <input
                  type="text"
                  value={pagado.value.adelanto}
                  onChange={(e) => handlePagadoChange('adelanto', e.target.value)}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                />
              </label>
            )}
          </div>

          {/* Terminado */}
          <label className="text-sm text-gray-700 flex items-center gap-2">
            Terminado:
            <input
              type="checkbox"
              name="Terminado"
              checked={formData.Terminado}
              onChange={handleChange}
              className="border bg-slate-50 border-gray-300 rounded"
            />
          </label>
        </div>
      )}
    </div>
  );

  // Footer con toggle de información general
  const procedimientoFooter = (
    <div className="flex justify-between items-center">
      <Button 
        onClick={() => setShowGeneralInfo(!showGeneralInfo)}
        variant="outline"
        size="sm"
      >
        {showGeneralInfo ? "Ocultar Información General" : "Mostrar Información General"}
      </Button>
      
      {formData.Terminado && (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          ✅ Completado
        </span>
      )}
    </div>
  );

  return (
    <WorkIssueInstanceCard
      title={formData.tittle || "Procedimiento sin título"}
      subtitle={`${formData.Categoria || "Sin categoría"} - ${formData.Estado || "Sin estado"}`}
      data={item}
      buttonState={buttonState}
      onSave={onSave}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      showActions={true}
      showStatusButtons={true}
      entityType={currentType}
      headerSlot={procedimientoHeader}
      footerSlot={procedimientoFooter}
      collapsible={true}
      defaultExpanded={!formData.Terminado}
    >
      {procedimientoForm}
    </WorkIssueInstanceCard>
  );
}
