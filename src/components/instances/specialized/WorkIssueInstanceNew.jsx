import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { WorkIssueInstanceCard } from '../base/InstanceCard';
import { useWorkIssueForm, WORK_ISSUE_CATEGORIES } from '../hooks/useWorkIssueForm';
import { useInstanceActions } from '../hooks/useInstanceActions';
import { Button } from '@/components/ui/button';

/**
 * Componente WorkIssueInstance refactorizado usando la nueva arquitectura
 * CRUD completo para work issues con manejo de fechas, procedimientos y pagos
 */
export function WorkIssueInstanceNew({ issue, viewMode = 'detailed' }) {
  const {
    formData,
    dates,
    pagado,
    procedimientos,
    categorizedProcedimientos,
    handleChange,
    handleDateChange,
    handlePagadoChange,
    getWorkIssueData,
    markAsCompleted,
    isCompleted,
    isPaid,
    hasAdvance
  } = useWorkIssueForm(issue);

  const {
    handleUpdate,
    handleDelete, 
    buttonState,
    canSave
  } = useInstanceActions(issue._id, 'WorkIssue');

  const allProcedimientos = useSelector((state) => state.allProcedimientos || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);

  const [showGeneralInfo, setShowGeneralInfo] = useState(false);

  // Función para guardar work issue
  const onSave = async () => {
    const workIssueData = getWorkIssueData();
    await handleUpdate(workIssueData);
  };

  // Función para finalizar tarea
  const handleFinalizarTarea = async () => {
    if (!window.confirm("¿Estás seguro de que quieres marcar la tarea como finalizada?")) return;
    
    markAsCompleted();
    const completedData = getWorkIssueData();
    await handleUpdate(completedData);
  };

  // Función para encontrar elemento completo en listas globales
  const encontrarElementoCompleto = (item) => {
    if (item._tipo === "procedimiento") {
      return allProcedimientos.find(el => el._id === item._id);
    } else if (item._tipo === "produccion") {
      return allProduccion.find(el => el._id === item._id);
    }
    return null;
  };

  // Renderizado de vista simple
  if (viewMode === 'simple') {
    return (
      <div className={`border rounded p-3 shadow ${isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="font-bold text-lg mb-1">{issue.Tittle || "Sin título"}</div>
        <div className="font text-lg mb-1">Notas: {issue.Notas || "Sin Notas"}</div>
        <div className="mb-1"><strong>Categoría:</strong> {issue.Categoria}</div>
        <div className="mb-1">
          <strong>Estado:</strong> 
          <span className={`ml-1 px-2 py-1 rounded text-xs ${
            isCompleted ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
          }`}>
            {isCompleted ? 'Finalizada' : 'En progreso'}
          </span>
        </div>
        
        {/* Botón de finalizar */}
        <Button
          className="bg-green-500 text-white px-3 py-1 rounded mt-2"
          onClick={handleFinalizarTarea}
          disabled={isCompleted}
        >
          {isCompleted ? "Tarea Finalizada" : "Finalizar Tarea"}
        </Button>
      </div>
    );
  }

  // Header con información de fechas
  const workIssueHeader = (
    <div className="flex items-center gap-4">
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

  // Información de procedimientos
  const procedimientosSection = (
    <div className="space-y-2">
      <strong>Procedimientos y Producción:</strong>
      {procedimientos.length === 0 ? (
        <div className="text-gray-500 ml-2">Ninguno</div>
      ) : (
        procedimientos.map((p, idx) => {
          const completo = encontrarElementoCompleto(p);
          return (
            <div
              key={p._id || idx}
              className={`ml-2 mb-1 p-2 flex justify-between items-center gap-2 rounded ${
                completo ? "bg-gray-100" : "bg-red-100"
              }`}
            >
              <div className="font-semibold">
                {completo
                  ? (completo.Nombre_del_producto || completo.tittle || completo.Nombre || "Sin nombre")
                  : (p.Nombre_del_producto || p.tittle || p.Nombre || "Sin nombre")}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const recetaId = completo && completo.Receta ? completo.Receta : p._id;
                  const url = `/receta/${recetaId}?type=${p._tipo}`;
                  window.open(url, "_blank");
                }}
                className="bg-blue-600 text-white"
              >
                Ver Receta
              </Button>
            </div>
          );
        })
      )}
    </div>
  );

  // Formulario de edición completo
  const editForm = showGeneralInfo ? (
    <div className="space-y-4 border-t pt-4">
      {/* Título y categoría */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          Título:
          <input
            type="text"
            name="Tittle"
            value={formData.Tittle}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Categoría:
          <select
            name="Categoria"
            value={formData.Categoria}
            onChange={handleChange}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          >
            <option value="">Seleccionar Categoría</option>
            {WORK_ISSUE_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Ejecutor y notas */}
      <div className="flex gap-4">
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
        <label className="text-sm text-gray-700 flex-1">
          Notas:
          <input
            type="text"
            name="Notas"
            value={formData.Notas || ""}
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

      {/* Checkbox de terminado */}
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
  ) : null;

  // Footer con acciones específicas
  const workIssueFooter = (
    <div className="flex gap-2 items-center">
      <Button
        onClick={() => setShowGeneralInfo(!showGeneralInfo)}
        className="bg-gray-500 text-white hover:bg-gray-600"
        size="sm"
      >
        {showGeneralInfo ? "Ocultar Info" : "Mostrar Info"}
      </Button>
      
      <Button
        onClick={handleFinalizarTarea}
        disabled={isCompleted}
        className="bg-green-500 text-white hover:bg-green-600"
        size="sm"
      >
        {isCompleted ? "✅ Finalizada" : "Finalizar Tarea"}
      </Button>
      
      {isPaid && (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          💰 Pagado
        </span>
      )}
      
      {hasAdvance && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          💳 Adelanto
        </span>
      )}
    </div>
  );

  return (
    <WorkIssueInstanceCard
      title={formData.Tittle || "Sin título"}
      subtitle={`${formData.Categoria} - ${formData.Ejecutor}`}
      data={issue}
      buttonState={buttonState}
      onSave={onSave}
      onDelete={handleDelete}
      showActions={true}
      showStatusButtons={false}
      headerSlot={workIssueHeader}
      footerSlot={workIssueFooter}
      collapsible={true}
      defaultExpanded={!isCompleted}
      className={isCompleted ? 'bg-green-50 border-green-200' : ''}
    >
      {procedimientosSection}
      {editForm}
    </WorkIssueInstanceCard>
  );
}
