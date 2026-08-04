import React from 'react';
import { TableCells } from './TableCells';

export const TableBody = ({
  sortedProducts,
  editingRows,
  currentType,
  filterSubGrupo,
  visibleColumns,
  showEdit,
  handleCellEdit,
  handleCompLunchEdit,
  dispatch,
  updateItem,
  handleRecipeModal,
  handleSaveRow,
  handleDelete,
  openRecipeModals
}) => {
  return (
    <tbody>
      {sortedProducts.map((item, index) => {
        const isEditing = editingRows[item._id];

        return (
          <tr 
            key={item._id} 
            className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            <TableCells 
              item={item}
              isEditing={isEditing}
              currentType={currentType}
              filterSubGrupo={filterSubGrupo}
              visibleColumns={visibleColumns}
              showEdit={showEdit}
              editingRows={editingRows}
              handleCellEdit={handleCellEdit}
              handleCompLunchEdit={handleCompLunchEdit}
              dispatch={dispatch}
              updateItem={updateItem}
              handleRecipeModal={handleRecipeModal}
              handleSaveRow={handleSaveRow}
              handleDelete={handleDelete}
              openRecipeModals={openRecipeModals}
            />
          </tr>
        );
      })}
    </tbody>
  );
};
