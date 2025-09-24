// src/components/inventario/tableView/InventarioTableBody.jsx
import React from 'react';
import { InventarioTableRow } from './InventarioTableRow';

export const InventarioTableBody = ({
  sortedProducts,
  currentType,
  visibleColumns,
  showEdit,
  editingRows,
  openRecipeRows,
  recetas,
  Proveedores,
  statusCycleOptions,
  handlers
}) => {
  if (sortedProducts.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={Object.keys(visibleColumns).length} className="text-center py-10 text-gray-500">
            No se encontraron productos con los filtros actuales.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {sortedProducts.map((item, index) => (
        <InventarioTableRow
          key={item._id}
          item={item}
          index={index}
          currentType={currentType}
          visibleColumns={visibleColumns}
          showEdit={showEdit}
          isEditing={!!editingRows[item._id]}
          isRecipeOpen={!!openRecipeRows[item._id]}
          editingRows={editingRows}
          recetas={recetas}
          Proveedores={Proveedores}
          statusCycleOptions={statusCycleOptions}
          handlers={handlers}
        />
      ))}
    </tbody>
  );
};