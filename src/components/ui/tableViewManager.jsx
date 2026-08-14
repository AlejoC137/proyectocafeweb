import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteItem, updateItem, getRecepie } from "../../redux/actions-Proveedores";
import { MenuItems, Staff, Comanda, Procedimientos } from "../../redux/actions-types";
import { parseCompLunch, safeJsonStringify } from "../../utils/jsonUtils";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";

import { useTableState } from "./tableManager/useTableState";
import { TableFilters } from "./tableManager/TableFilters";
import { TableHeaders } from "./tableManager/TableHeaders";
import { TableBody } from "./tableManager/TableBody";
import { ColumnSelector } from "./tableManager/ColumnSelector";
import { validateRowData } from "./tableManager/tableUtils";
import { Button } from "@/components/ui/button";

export function TableViewManager({ products, currentType }) {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);

  const tableState = useTableState({ products, currentType });

  const {
    searchTerm, setSearchTerm,
    filterGrupo, setFilterGrupo,
    filterSubGrupo, setFilterSubGrupo,
    filterTipo, setFilterTipo,
    filterStatus, setFilterStatus,
    sortColumn, sortDirection, handleSort,
    editingRows, setEditingRows, handleCellEdit,
    openRecipeModals, setOpenRecipeModals,
    recetas, setRecetas,
    showColumnSelector, setShowColumnSelector,
    visibleColumns, availableColumns,
    toggleColumn, toggleAllColumns, resetToDefault,
    uniqueGrupos, uniqueSubGrupos, uniqueTipos, uniqueEstados,
    sortedProducts
  } = tableState;

  const handleCompLunchEdit = (itemId, component, field, value) => {
    const currentItem = products.find(p => p._id === itemId);
    const currentCompLunch = parseCompLunch(currentItem?.Comp_Lunch) || {};
    
    const updatedCompLunch = {
      ...currentCompLunch,
      [component]: {
        ...currentCompLunch[component],
        [field]: value
      }
    };

    setEditingRows(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        Comp_Lunch: safeJsonStringify(updatedCompLunch, false)
      }
    }));
  };

  const handleSaveRow = async (item) => {
    const editedData = editingRows[item._id] || {};
    
    if (Object.keys(editedData).length === 0) {
      return;
    }
    
    const validationErrors = validateRowData(editedData, currentType);
    if (validationErrors.length > 0) {
      alert(`Errores de validación:\n- ${validationErrors.join('\n- ')}`);
      return;
    }
    
    try {
      const updatedFields = { ...editedData };
      
      if (currentType === Staff) {
        if (editedData.Cuenta) {
          updatedFields.Cuenta = JSON.stringify(editedData.Cuenta);
        }
        if (editedData.infoContacto) {
          updatedFields.infoContacto = JSON.stringify(editedData.infoContacto);
        }
        if (editedData.Rate !== undefined && editedData.Rate !== '') {
          updatedFields.Rate = parseFloat(editedData.Rate) || 0;
        }
      } 
      else if (currentType === Comanda) {
        const originalItem = products.find(p => p._id === item._id);

        if (editedData.Dates) {
          const originalDates = typeof originalItem.Dates === "string" ? JSON.parse(originalItem.Dates || "{}") : (originalItem.Dates || {});
          
          if (editedData.Dates.date_asigmente_str) {
            try {
              editedData.Dates.date_asigmente = JSON.parse(editedData.Dates.date_asigmente_str);
            } catch (e) {
              alert("El formato JSON de la bitácora es inválido. No se guardará ese campo.");
              delete editedData.Dates.date_asigmente_str;
            }
            delete editedData.Dates.date_asigmente_str;
          }
          
          const newDates = { ...originalDates, ...editedData.Dates };
          updatedFields.Dates = JSON.stringify(newDates);
        }

        if (editedData.Pagado) {
          const originalPagado = typeof originalItem.Pagado === "string" ? JSON.parse(originalItem.Pagado || "{}") : (originalItem.Pagado || {});
          if (editedData.Pagado.pagadoFull !== undefined) {
             editedData.Pagado.pagadoFull = editedData.Pagado.pagadoFull === "true";
          }
          const newPagado = { ...originalPagado, ...editedData.Pagado };
          updatedFields.Pagado = JSON.stringify(newPagado);
        }

        if (editedData.Terminado !== undefined) {
            updatedFields.Terminado = editedData.Terminado === "true";
        }

        if (editedData.Procedimientos_str !== undefined) {
          try {
              JSON.parse(editedData.Procedimientos_str);
              updatedFields.Procedimientos = editedData.Procedimientos_str;
          } catch (e) {
              alert("El formato JSON de Procedimientos es inválido. No se guardará ese campo.");
          }
          delete updatedFields.Procedimientos_str; 
          delete editedData.Procedimientos_str;
        }
      } 
      else if (currentType === MenuItems) {
        if (editedData.Precio !== undefined && editedData.Precio !== '') {
          updatedFields.Precio = parseFloat(editedData.Precio) || 0;
        }
      }
      
      Object.keys(updatedFields).forEach(key => {
        if (typeof updatedFields[key] === 'string' && updatedFields[key].trim() === '') {
           if (key !== 'Dates' && key !== 'Pagado' && key !== 'Comp_Lunch' && key !== 'Procedimientos') {
             updatedFields[key] = null;
           }
        }
      });
      
      const tableType = currentType === MenuItems ? "Menu" : currentType;
      const result = await dispatch(updateItem(item._id, updatedFields, tableType));
      
      if (result) {
        setEditingRows(prev => {
          const newState = { ...prev };
          delete newState[item._id];
          return newState;
        });
      } else {
        throw new Error('No se pudo actualizar el ítem');
      }
      
    } catch (error) {
      console.error("Error al actualizar el ítem:", error);
      alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
      try {
        await dispatch(deleteItem(item._id, currentType));
        alert("Ítem eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar el ítem:", error);
        alert("Hubo un error al eliminar el ítem.");
      }
    }
  };

  const handleRecipeModal = async (productId, recetaId = null) => {
    setOpenRecipeModals(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    if (recetaId && !recetas[productId]) {
      try {
        const recetaType = currentType === MenuItems ? "Recetas" : "RecetasProduccion";
        const receta = await getRecepie(recetaId, recetaType);
        setRecetas(prev => ({
          ...prev,
          [productId]: receta
        }));
      } catch (error) {
        console.error("Error al cargar receta:", error);
      }
    }
  };

  return (
    <div className="w-full flex flex-col h-full min-h-0 overflow-hidden">
      <TableFilters 
        currentType={currentType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGrupo={filterGrupo}
        setFilterGrupo={setFilterGrupo}
        filterSubGrupo={filterSubGrupo}
        setFilterSubGrupo={setFilterSubGrupo}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        uniqueGrupos={uniqueGrupos}
        uniqueSubGrupos={uniqueSubGrupos}
        uniqueTipos={uniqueTipos}
        uniqueEstados={uniqueEstados}
        setShowColumnSelector={setShowColumnSelector}
        sortedProductsLength={sortedProducts.length}
        productsLength={products.length}
      />

      <div className="overflow-auto border border-gray-200 rounded-lg flex-1 min-h-0">
        <table className="w-full bg-white relative border-collapse">
          <TableHeaders 
            currentType={currentType}
            filterSubGrupo={filterSubGrupo}
            visibleColumns={visibleColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
          />
          <TableBody 
            sortedProducts={sortedProducts}
            editingRows={editingRows}
            currentType={currentType}
            filterSubGrupo={filterSubGrupo}
            visibleColumns={visibleColumns}
            showEdit={showEdit}
            handleCellEdit={handleCellEdit}
            handleCompLunchEdit={handleCompLunchEdit}
            dispatch={dispatch}
            updateItem={updateItem}
            handleRecipeModal={handleRecipeModal}
            handleSaveRow={handleSaveRow}
            handleDelete={handleDelete}
            openRecipeModals={openRecipeModals}
          />
        </table>
      </div>

      {Object.entries(openRecipeModals).map(([productId, isOpen]) => {
        if (!isOpen) return null;
        
        const product = products.find(p => p._id === productId);
        const receta = recetas[productId];
        
        return (
          <div key={productId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Receta para: {product?.NombreES || product?.Nombre || product?.Tittle || product?.tittle}
                </h3>
                <Button
                  onClick={() => handleRecipeModal(productId)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              {currentType === MenuItems ? (
                <RecepieOptionsMenu 
                  product={product} 
                  Receta={receta} 
                  currentType={currentType}
                />
              ) : (
                <RecepieOptions 
                  product={product} 
                  Receta={receta} 
                  currentType={currentType}
                />
              )}
            </div>
          </div>
        );
      })}

      <ColumnSelector 
        showColumnSelector={showColumnSelector}
        setShowColumnSelector={setShowColumnSelector}
        toggleAllColumns={toggleAllColumns}
        resetToDefault={resetToDefault}
        availableColumns={availableColumns}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
      />
    </div>
  );
}