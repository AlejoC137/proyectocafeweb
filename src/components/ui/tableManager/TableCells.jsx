import React from 'react';
import { Button } from "@/components/ui/button";
import { parseCompLunch, safeJsonStringify } from "../../../utils/jsonUtils";
import { parseNestedObject } from "./tableUtils";
import { ESTATUS, CATEGORIES, SUB_CATEGORIES, Staff, Comanda, Procedimientos, MenuItems, AGENDA } from "../../../redux/actions-types";

export const TableCells = ({
  item,
  isEditing,
  currentType,
  filterSubGrupo,
  visibleColumns,
  showEdit,
  editingRows,
  handleCellEdit,
  handleCompLunchEdit,
  dispatch,
  updateItem,
  handleRecipeModal,
  handleSaveRow,
  handleDelete,
  openRecipeModals
}) => {
  const renderEditableCell = (item, field, type = "text", options = null, subField = null) => {
    let currentValue;
    if (subField) {
        let parentInEditing = editingRows[item._id]?.[field];
        let parentOriginal = parseNestedObject(item[field], {});

        currentValue = (parentInEditing && parentInEditing[subField] !== undefined) 
            ? parentInEditing[subField] 
            : parentOriginal[subField];
    } else {
        currentValue = (editingRows[item._id]?.[field] !== undefined) 
            ? editingRows[item._id][field] 
            : item[field];
    }

    currentValue = currentValue === null || currentValue === undefined ? "" : currentValue;

    if (type === "select" && Array.isArray(options) && options.includes("true") && options.includes("false")) {
        currentValue = String(currentValue);
    }

    if (type === "select") {
      return (
        <select
          value={currentValue}
          onChange={(e) => handleCellEdit(item._id, field, e.target.value, subField)}
          className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option === "true" ? (field === "Terminado" ? "Terminado" : "Pagado") : 
               option === "false" ? "Pendiente" : 
               option}
            </option>
          ))}
        </select>
      );
    }

    if (type === "date") {
         currentValue = (currentValue || "").split('T')[0];
    }

    return (
      <input
        type={type}
        value={currentValue}
        onChange={(e) => handleCellEdit(item._id, field, e.target.value, subField)}
        className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
      />
    );
  };

  const renderActionButtons = (item, isEditing) => (
    <div className="flex gap-1">
      {(currentType === MenuItems || currentType === Procedimientos) && (
        <Button
          onClick={() => handleRecipeModal(item._id, item.Receta)}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 text-xs h-6 border border-yellow-300"
        >
          {openRecipeModals[item._id] ? '📖' : '📕'}
        </Button>
      )}
      {isEditing && (
        <Button
          onClick={() => handleSaveRow(item)}
          className="bg-gray-100 hover:bg-green-600 text-green-800 px-2 py-1 text-xs h-6 border border-green-300"
        >
          💾
        </Button>
      )}
      {showEdit && (
        <Button
          onClick={() => handleDelete(item)}
          className="bg-gray-100 hover:bg-red-600 text-red-800 px-2 py-1 text-xs h-6 border border-red-300"
        >
          🗑️
        </Button>
      )}
    </div>
  );

  const cells = [];
  
  switch(currentType) {
    case MenuItems:
      const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
      
      if (isLunchOnly) {
        const lunchData = parseCompLunch(item.Comp_Lunch);
        const lunchCells = [
          { key: 'nombre', content: (
            <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "NombreES") : 
                <span className="font-medium text-blue-800">{item.NombreES || "Sin nombre"}</span>
              }
            </td>
          )},
          { key: 'fecha', content: (
            <td key="fecha" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.fecha?.dia || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "fecha", "dia", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Día"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.fecha?.fecha || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "fecha", "fecha", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Fecha"
                    />
                  </>
                ) : (
                  lunchData?.fecha ? (
                    <>
                      <div className="font-medium text-purple-700">{lunchData.fecha.dia}</div>
                      <div className="text-gray-500">{lunchData.fecha.fecha}</div>
                    </>
                  ) : (
                    <span className="text-gray-400">Sin fecha</span>
                  )
                )}
              </div>
            </td>
          )},
          { key: 'entrada', content: (
            <td key="entrada" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.entrada?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "entrada", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre entrada"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.entrada?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "entrada", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción entrada"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-orange-700">{lunchData?.entrada?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.entrada?.descripcion}>
                      {lunchData?.entrada?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'proteina', content: (
            <td key="proteina" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "proteina", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre proteína"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "proteina", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción proteína"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-red-700">{lunchData?.proteina?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.proteina?.descripcion}>
                      {lunchData?.proteina?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'opcion2', content: (
            <td key="opcion2" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina_opcion_2?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "proteina_opcion_2", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre opción 2"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.proteina_opcion_2?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "proteina_opcion_2", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción opción 2"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-purple-700">{lunchData?.proteina_opcion_2?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.proteina_opcion_2?.descripcion}>
                      {lunchData?.proteina_opcion_2?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'carbohidrato', content: (
            <td key="carbohidrato" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.carbohidrato?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "carbohidrato", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre carbohidrato"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.carbohidrato?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "carbohidrato", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción carbohidrato"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-yellow-700">{lunchData?.carbohidrato?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.carbohidrato?.descripcion}>
                      {lunchData?.carbohidrato?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'acompanante', content: (
            <td key="acompanante" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.acompanante?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "acompanante", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre acompañante"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.acompanante?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "acompanante", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción acompañante"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-green-700">{lunchData?.acompanante?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.acompanante?.descripcion}>
                      {lunchData?.acompanante?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'ensalada', content: (
            <td key="ensalada" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.ensalada?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "ensalada", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre ensalada"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.ensalada?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "ensalada", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción ensalada"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-cyan-700">{lunchData?.ensalada?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.ensalada?.descripcion}>
                      {lunchData?.ensalada?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'bebida', content: (
            <td key="bebida" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {showEdit ? (
                  <>
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.bebida?.nombre || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "bebida", "nombre", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 mb-1"
                      placeholder="Nombre bebida"
                    />
                    <input
                      type="text"
                      value={parseCompLunch(editingRows[item._id]?.Comp_Lunch || item.Comp_Lunch)?.bebida?.descripcion || ""}
                      onChange={(e) => handleCompLunchEdit(item._id, "bebida", "descripcion", e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                      placeholder="Descripción bebida"
                    />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-teal-700">{lunchData?.bebida?.nombre || "N/A"}</div>
                    <div className="text-gray-500 truncate max-w-24" title={lunchData?.bebida?.descripcion}>
                      {lunchData?.bebida?.descripcion || ""}
                    </div>
                  </>
                )}
              </div>
            </td>
          )},
          { key: 'pedidos', content: (
            <td key="pedidos" className="px-3 py-2 border-r border-gray-100 text-xs">
              <div className="text-xs">
                {lunchData?.lista ? (
                  <>
                    <div className="font-medium text-indigo-700">{lunchData.lista.length} pedidos</div>
                    <div className="text-green-600">
                      {lunchData.lista.filter(p => p.pagado).length} pagados
                    </div>
                    <div className="text-red-600">
                      {lunchData.lista.filter(p => !p.pagado).length} pendientes
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Sin pedidos</span>
                )}
              </div>
            </td>
          )},
          { key: 'precio', content: (
            <td key="precio" className="px-3 py-2 border-r border-gray-100 text-xs">
              {showEdit ? renderEditableCell(item, "Precio", "number") : 
                <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}
            </td>
          )},
          { key: 'estado', content: (
            <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            </td>
          )},
          { key: 'acciones', content: (
            <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
          )}
        ];
        return lunchCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
      }
      
      const menuCells = [
        { key: 'nombreES', content: (
          <td key="nombreES" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "NombreES") : <span className="font-medium">{item.NombreES || "Sin nombre"}</span>}
          </td>
        )},
        { key: 'nombreEN', content: (
          <td key="nombreEN" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "NombreEN") : <span className="text-gray-600">{item.NombreEN || "Sin nombre EN"}</span>}
          </td>
        )},
        { key: 'descripcionES', content: (
          <td key="descripcionES" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
            {showEdit ? (
              <textarea
                value={editingRows[item._id]?.DescripcionMenuES || item.DescripcionMenuES || ""}
                onChange={(e) => handleCellEdit(item._id, "DescripcionMenuES", e.target.value)}
                className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 resize-none"
                rows={2}
              />
            ) : (
              <div className="text-xs text-gray-600 max-w-32 truncate" title={item.DescripcionMenuES}>
                {item.DescripcionMenuES || "Sin descripción"}
              </div>
            )}
          </td>
        )},
        { key: 'descripcionEN', content: (
          <td key="descripcionEN" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
            {showEdit ? (
              <textarea
                value={editingRows[item._id]?.DescripcionMenuEN || item.DescripcionMenuEN || ""}
                onChange={(e) => handleCellEdit(item._id, "DescripcionMenuEN", e.target.value)}
                className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 resize-none"
                rows={2}
              />
            ) : (
              <div className="text-xs text-gray-600 max-w-32 truncate" title={item.DescripcionMenuEN}>
                {item.DescripcionMenuEN || "Sin descripción EN"}
              </div>
            )}
          </td>
        )},
        { key: 'precio', content: (
          <td key="precio" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Precio", "number") : 
              <span className="font-mono font-bold text-green-600">${parseFloat(item.Precio || 0).toFixed(2)}</span>}
          </td>
        )},
        { key: 'grupo', content: (
          <td key="grupo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "GRUPO", "select", CATEGORIES) :
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.GRUPO || "Sin grupo"}</span>}
          </td>
        )},
        { key: 'subGrupo', content: (
          <td key="subGrupo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "SUB_GRUPO", "select", SUB_CATEGORIES) :
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{item.SUB_GRUPO || "Sin sub-grupo"}</span>}
          </td>
        )},
        { key: 'tipoES', content: (
          <td key="tipoES" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "TipoES") : <span className="text-gray-600">{item.TipoES || "Sin tipo"}</span>}
          </td>
        )},
        { key: 'tipoEN', content: (
          <td key="tipoEN" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "TipoEN") : <span className="text-gray-600">{item.TipoEN || "Sin tipo EN"}</span>}
          </td>
        )},
        { key: 'foto', content: (
          <td key="foto" className="px-3 py-2 border-r border-gray-100 text-xs max-w-20">
            {showEdit ? (
              <input
                type="url"
                value={editingRows[item._id]?.Foto || item.Foto || ""}
                onChange={(e) => handleCellEdit(item._id, "Foto", e.target.value)}
                className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                placeholder="URL de imagen"
              />
            ) : (
              item.Foto ? (
                <a href={item.Foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                  🖼️
                </a>
              ) : (
                <span className="text-gray-400">Sin foto</span>
              )
            )}
          </td>
        )},
        { key: 'print', content: (
          <td key="print" className="px-3 py-2 border-r border-gray-100 text-xs">
            <button
              onClick={() => {
                const newPrint = !item.PRINT;
                handleCellEdit(item._id, "PRINT", newPrint);
                dispatch(updateItem(item._id, { PRINT: newPrint }, "Menu"));
              }}
              className={`px-2 py-1 rounded text-xs ${
                item.PRINT
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {item.PRINT ? "SÍ" : "NO"}
            </button>
          </td>
        )},
        { key: 'estado', content: (
          <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
            <button
              onClick={() => {
                const newEstado = item.Estado === "Activo" ? "Inactivo" : "Activo";
                handleCellEdit(item._id, "Estado", newEstado);
                dispatch(updateItem(item._id, { Estado: newEstado }, "Menu"));
              }}
              className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {item.Estado || "Sin estado"}
            </button>
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
        )}
      ];
      return menuCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
    
    case Staff:
      const staffCells = [
        { key: 'nombre', content: (
          <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Nombre") : 
              <span className="font-medium text-blue-800">{item.Nombre || "Sin nombre"}</span>}
          </td>
        )},
        { key: 'apellido', content: (
          <td key="apellido" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Apellido") : 
              <span className="font-medium text-gray-700">{item.Apellido || "Sin apellido"}</span>}
          </td>
        )},
        { key: 'cargo', content: (
          <td key="cargo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Cargo") :
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{item.Cargo || "Sin cargo"}</span>}
          </td>
        )},
        { key: 'cc', content: (
          <td key="cc" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "CC", "number") : 
              <span className="font-mono text-gray-600">{item.CC || "N/A"}</span>}
          </td>
        )},
        { key: 'rate', content: (
          <td key="rate" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Rate", "number") : 
              <span className="font-mono font-bold text-green-600">${parseFloat(item.Rate || 0).toFixed(2)}</span>}
          </td>
        )},
        { key: 'estado', content: (
          <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Estado", "select", ESTATUS) :
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Estado === "Activo" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {item.Estado || "Sin estado"}
              </span>
            }
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
        )}
      ];
      return staffCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
    
    case Comanda: 
      const datesData = parseNestedObject(item.Dates, { isued: "", finished: "", date_asigmente: [] });
      const pagadoData = parseNestedObject(item.Pagado, { pagadoFull: false });

      const ComandaCells = [
        { key: 'titulo', content: (
          <td key="titulo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Tittle") : 
              <span className="font-medium text-blue-800">{item.Tittle || "Sin título"}</span>}
          </td>
        )},
        { key: 'categoria', content: (
          <td key="categoria" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Categoria", "select", ["COCINA", "BAR", "ADMIN", "GENERAL", "MANTENIMIENTO"]) :
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">{item.Categoria || "Sin categoría"}</span>}
          </td>
        )},
        { key: 'ejecutor', content: (
          <td key="ejecutor" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Ejecutor") : 
              <span className="text-gray-700">{item.Ejecutor || "N/A"}</span>}
          </td>
        )},
        { key: 'fechaCreacion', content: (
          <td key="fechaCreacion" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Dates", "date", null, "isued") : 
              <span className="text-gray-600">
                {datesData.isued ? new Date(datesData.isued).toLocaleDateString() : "Sin fecha"}
              </span>}
          </td>
        )},
        { key: 'fechaFin', content: (
          <td key="fechaFin" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Dates", "date", null, "finished") : 
              <span className="text-gray-600">
                {datesData.finished ? new Date(datesData.finished).toLocaleDateString() : "Pendiente"}
              </span>}
          </td>
        )},
        { key: 'dateAsigmente', content: (
          <td key="dateAsigmente" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Dates", "date", null, "finished") : 
              <span className="text-gray-600">
                {datesData.finished ? new Date(datesData.finished).toLocaleDateString() : "Pendiente"}
              </span>}
          </td>
        )},
        { key: 'procedimientos', content: (
          <td key="procedimientos" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
            {showEdit ? (
              <textarea
                value={
                  editingRows[item._id]?.Procedimientos_str !== undefined
                    ? editingRows[item._id].Procedimientos_str
                    : (item.Procedimientos || "[]") 
                }
                onChange={(e) => handleCellEdit(item._id, "Procedimientos_str", e.target.value)}
                className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 font-mono"
                rows={2}
              />
            ) : (
              <span className="text-gray-600 font-mono text-xs truncate" title={item.Procedimientos}>
                {item.Procedimientos || "[]"}
              </span>
            )}
          </td>
        )},
        { key: 'pagado', content: (
          <td key="pagado" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Pagado", "select", ["true", "false"], "pagadoFull") : 
              <span className={`px-2 py-1 rounded-full text-xs ${
                pagadoData.pagadoFull ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {pagadoData.pagadoFull ? "Pagado" : "Pendiente"}
              </span>}
          </td>
        )},
        { key: 'notas', content: (
          <td key="notas" className="px-3 py-2 border-r border-gray-100 text-xs max-w-32">
            {showEdit ? (
              <textarea
                value={editingRows[item._id]?.Notas !== undefined ? editingRows[item._id].Notas : (item.Notas || "")}
                onChange={(e) => handleCellEdit(item._id, "Notas", e.target.value)}
                className="w-full p-1 border border-gray-300 rounded text-xs bg-gray-100"
                rows={2}
              />
            ) : (
              <span className="text-gray-600 truncate" title={item.Notas}>{item.Notas || "Sin notas"}</span>
            )}
          </td>
        )},
        { key: 'estado', content: (
          <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Terminado", "select", ["true", "false"]) :
              <span className={`px-2 py-1 rounded-full text-xs ${
                item.Terminado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {item.Terminado ? "Terminado" : "Pendiente"}
              </span>}
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
        )}
      ];
      return ComandaCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
      
    case Procedimientos:
      const procedimientosCells = [
        { key: 'titulo', content: (
          <td key="titulo" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "tittle") : 
              <span className="font-medium text-blue-800">{item.tittle || "Sin título"}</span>}
          </td>
        )},
        { key: 'categoria', content: (
          <td key="categoria" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "Categoria") :
              <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs">{item.Categoria || "Sin categoría"}</span>}
          </td>
        )},
        { key: 'DescripcionGeneral', content: (
          <td key="DescripcionGeneral" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "DescripcionGeneral") : 
              <div className="max-w-48 truncate" title={item.DescripcionGeneral}>
                <span className="text-gray-600">{item.DescripcionGeneral || "Sin descripción"}</span>
              </div>}
          </td>
        )},
        { key: 'estado', content: (
          <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
            <span className={`px-2 py-1 rounded-full text-xs ${
              item.Estado === "Activo" 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {item.Estado || "Sin estado"}
            </span>
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
        )}
      ];
      return procedimientosCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
    
    case AGENDA:
      const agendaCells = [
        { key: 'nombre', content: (
          <td key="nombre" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "nombreES") : <span className="font-medium text-purple-800">{item.nombreES || item.nombre || "Sin nombre"}</span>}
          </td>
        )},
        { key: 'fecha', content: (
          <td key="fecha" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "fecha", "date") : <span className="text-gray-600">{item.fecha || "Sin fecha"}</span>}
          </td>
        )},
        { key: 'horario', content: (
          <td key="horario" className="px-3 py-2 border-r border-gray-100 text-xs">
            <div className="flex gap-1">
              {showEdit ? (
                <>
                  {renderEditableCell(item, "horaInicio", "time")}
                  {renderEditableCell(item, "horaFinal", "time")}
                </>
              ) : (
                <span>{item.horaInicio} - {item.horaFinal}</span>
              )}
            </div>
          </td>
        )},
        { key: 'cliente', content: (
          <td key="cliente" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "nombreCliente") : <span>{item.nombreCliente || "-"}</span>}
          </td>
        )},
        { key: 'valor', content: (
          <td key="valor" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "valor") : <span className="font-mono text-green-600">{item.valor || "-"}</span>}
          </td>
        )},
        { key: 'estado', content: (
          <td key="estado" className="px-3 py-2 border-r border-gray-100 text-xs">
            {showEdit ? renderEditableCell(item, "estado", "select", ["pendiente", "aprobado", "desaprobado"]) :
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                item.estado === "aprobado" ? "bg-green-100 text-green-800" : 
                item.estado === "desaprobado" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {item.estado || "pendiente"}
              </span>}
          </td>
        )},
        { key: 'acciones', content: (
          <td key="acciones" className="px-3 py-2 text-xs">{renderActionButtons(item, isEditing)}</td>
        )}
      ];
      return agendaCells.filter(cell => visibleColumns[cell.key]).map(cell => cell.content);
    
    default:
      return [<td key="default" className="px-3 py-2 text-xs">Tipo no soportado</td>];
  }
};
