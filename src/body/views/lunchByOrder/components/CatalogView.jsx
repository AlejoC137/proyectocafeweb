import React from 'react';
import { ChevronDown, ChevronUp, Search, Settings, Pencil, ArrowDownToLine } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { getProteinType } from '../utils/lunchUtils';

export const CatalogView = ({
    handleExpandAllCatalog,
    handleCollapseAllCatalog,
    setShowEdit,
    showEdit,
    selectedCatalogIds,
    handleUnlinkRelation,
    handleOpenRelateModal,
    searchTermCatalog,
    setSearchTermCatalog,
    showColumnMenu,
    setShowColumnMenu,
    defaultColumns,
    visibleColumns,
    toggleColumn,
    groupedCatalogItems,
    handleToggleSelectAllCatalog,
    handleSortCatalog,
    getSortIcon,
    isGroupExpanded,
    toggleExpandGroup,
    handleChange,
    handleBlur,
    handleFillDown,
    setLunchToEdit,
    setIsLunchModalOpen,
    draggedItemId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOverTable,
    handleDragLeaveTable,
    handleDropToLink,
    handleToggleSelectCatalog
}) => {
    return (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 border-b bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-700">Catálogo General de Platos de Almuerzo</h3>
                    <p className="text-xs text-slate-500">Listado maestro de todos los almuerzos registrados en el sistema.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 mr-2 shadow-inner">
                        <button 
                            onClick={handleExpandAllCatalog} 
                            className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-800 rounded transition-all flex items-center gap-1" 
                            title="Expandir todas las variaciones"
                        >
                            <ChevronDown size={14} /> <span className="hidden md:inline">Expandir</span>
                        </button>
                        <button 
                            onClick={handleCollapseAllCatalog} 
                            className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-800 rounded transition-all flex items-center gap-1" 
                            title="Contraer todas las variaciones"
                        >
                            <ChevronUp size={14} /> <span className="hidden md:inline">Contraer</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setShowEdit(!showEdit)}
                        className={`font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm select-none ${showEdit ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-inner' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                        {showEdit ? "✏️ Editando..." : "✏️ Modo Edición"}
                    </button>
                    {selectedCatalogIds.length >= 1 && (
                        <button
                            onClick={handleUnlinkRelation}
                            className="text-slate-700 bg-white border border-slate-300 font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 animate-fade-in shadow-sm hover:bg-slate-50 select-none"
                        >
                            ⛓️‍💥 DESVINCULAR ({selectedCatalogIds.length})
                        </button>
                    )}
                    {selectedCatalogIds.length >= 2 && (
                        <button
                            onClick={handleOpenRelateModal}
                            className="text-white font-black px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 animate-fade-in shadow-sm select-none"
                            style={{ backgroundColor: '#D22B2B' }}
                        >
                            🔗 RELACIONAR ({selectedCatalogIds.length})
                        </button>
                    )}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar plato por nombre..."
                            value={searchTermCatalog}
                            onChange={(e) => setSearchTermCatalog(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className="p-2 border rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-500"
                            title="Configurar columnas"
                        >
                            <Settings size={18} />
                        </button>
                        {showColumnMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="p-3 bg-slate-50 border-b font-bold text-slate-700 text-sm">
                                    Columnas Visibles
                                </div>
                                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                                    {Object.keys(defaultColumns).map(col => (
                                        <label key={col} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs font-medium text-slate-600">
                                            <input 
                                                type="checkbox" 
                                                checked={visibleColumns[col]} 
                                                onChange={() => toggleColumn(col)} 
                                                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                                            />
                                            {col.replace(/_/g, ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th className="w-12 py-3 px-4 text-center select-none">
                                <input 
                                    type="checkbox"
                                    checked={groupedCatalogItems.length > 0 && selectedCatalogIds.length === groupedCatalogItems.reduce((acc, g) => acc + 1 + g.variations.length, 0)}
                                    onChange={handleToggleSelectAllCatalog}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    title="Seleccionar todos los visibles"
                                />
                            </th>
                            <th 
                                className="py-3 px-4 font-bold text-slate-500 text-left cursor-pointer hover:bg-slate-100 select-none transition-all"
                                onClick={() => handleSortCatalog("NombreES")}
                            >
                                <div className="flex items-center gap-1">
                                    Nombre del Almuerzo {getSortIcon("NombreES")}
                                </div>
                            </th>
                            {visibleColumns.DescripcionES && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[200px]">Descripción</th>}
                            {visibleColumns.proteina && (
                                <th 
                                    className="py-3 px-4 font-bold text-slate-500 text-left cursor-pointer hover:bg-slate-100 select-none transition-all"
                                    onClick={() => handleSortCatalog("protein")}
                                >
                                    <div className="flex items-center gap-1">
                                        Proteína {getSortIcon("protein")}
                                    </div>
                                </th>
                            )}
                            {visibleColumns.Precio && (
                                <th 
                                    className="py-3 px-4 font-bold text-slate-500 text-right cursor-pointer hover:bg-slate-100 select-none transition-all"
                                    onClick={() => handleSortCatalog("Precio")}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Precio {getSortIcon("Precio")}
                                    </div>
                                </th>
                            )}
                            {visibleColumns.entrada_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Entrada</th>}
                            {visibleColumns.entrada_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Entrada (Desc)</th>}
                            {visibleColumns.proteina_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Proteína Principal</th>}
                            {visibleColumns.proteina_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Proteína (Desc)</th>}
                            {visibleColumns.proteina_opcion_2_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Opción 2</th>}
                            {visibleColumns.proteina_opcion_2_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Opción 2 (Desc)</th>}
                            {visibleColumns.carbohidrato_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Carbohidrato</th>}
                            {visibleColumns.carbohidrato_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Carbohidrato (Desc)</th>}
                            {visibleColumns.acompanante_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Acompañante</th>}
                            {visibleColumns.acompanante_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Acompañante (Desc)</th>}
                            {visibleColumns.ensalada_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Ensalada</th>}
                            {visibleColumns.ensalada_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Ensalada (Desc)</th>}
                            {visibleColumns.bebida_nombre && <th className="py-3 px-4 font-bold text-slate-500 text-left">Bebida</th>}
                            {visibleColumns.bebida_desc && <th className="py-3 px-4 font-bold text-slate-500 text-left min-w-[150px]">Bebida (Desc)</th>}
                            {visibleColumns.Receta && (
                                <th 
                                    className="py-3 px-4 font-bold text-slate-500 text-center cursor-pointer hover:bg-slate-100 select-none transition-all"
                                    onClick={() => handleSortCatalog("Receta")}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Estado Receta {getSortIcon("Receta")}
                                    </div>
                                </th>
                            )}
                            <th className="py-3 px-4 font-bold text-slate-500 text-center select-none">Gestión / Enlaces</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {groupedCatalogItems.map((group, groupIndex) => {
                            const item = group.baseItem;
                            const hasVariations = group.variations.length > 0;
                            const expanded = isGroupExpanded(item._id);
                            
                            const protein = getProteinType(item);
                            const proteinColors = {
                                POLLO: 'bg-sky-50 text-sky-700 border-sky-100',
                                CERDO: 'bg-amber-50 text-amber-700 border-amber-100',
                                RES: 'bg-red-50 text-red-700 border-red-100',
                                PESCADO: 'bg-violet-50 text-violet-700 border-violet-100',
                                VEGETARIANO: 'bg-lime-50 text-lime-700 border-lime-100',
                                OTROS: 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            };

                            const renderRow = (currentItem, isBaseRow) => {
                                const currentProtein = getProteinType(currentItem);
                                return (
                                    <tr 
                                        key={currentItem._id}
                                        className={`transition-all duration-200 font-medium ${
                                            draggedItemId === currentItem._id 
                                                ? 'opacity-40 bg-slate-200' 
                                                : dragOverId === currentItem._id 
                                                    ? 'bg-emerald-100 ring-2 ring-inset ring-emerald-500' 
                                                    : !isBaseRow ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-50/80'
                                        }`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, currentItem, !isBaseRow ? group.baseItem._id : null)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOverTable(e, currentItem._id)}
                                        onDragLeave={(e) => handleDragLeaveTable(e, currentItem._id)}
                                        onDrop={(e) => isBaseRow ? handleDropToLink(e, currentItem._id) : null}
                                    >
                                        <td className="py-3.5 px-4 text-center">
                                            <input 
                                                type="checkbox"
                                                checked={selectedCatalogIds.includes(currentItem._id)}
                                                onChange={() => handleToggleSelectCatalog(currentItem._id)}
                                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-3.5 px-4 text-left text-slate-800">
                                            <div className="flex items-center gap-2">
                                                {!isBaseRow && <span className="text-slate-300 ml-4 mr-2">↳</span>}
                                                {isBaseRow && hasVariations && (
                                                    <button 
                                                        onClick={() => toggleExpandGroup(item._id)}
                                                        className="p-1 hover:bg-slate-100 rounded text-slate-500 flex items-center justify-center transition-all"
                                                        title={expanded ? "Colapsar variaciones" : "Ver variaciones hermanos"}
                                                    >
                                                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                )}
                                                {showEdit ? (
                                                    <div className="flex items-center gap-1 w-full relative group min-w-[150px]">
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-2 py-1 text-sm border rounded bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={currentItem.NombreES || ''}
                                                            onChange={(e) => handleChange(currentItem._id, 'NombreES', e.target.value)}
                                                            onBlur={() => handleBlur(currentItem._id)}
                                                        />
                                                        {isBaseRow && hasVariations && (
                                                            <button 
                                                                onClick={() => handleFillDown(currentItem, 'NombreES', group.variations)}
                                                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-all absolute -right-5 z-10 shadow-sm border border-blue-200"
                                                                title="Propagar a variaciones"
                                                            >
                                                                <ArrowDownToLine size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={`${isBaseRow ? 'font-semibold' : 'text-slate-600 text-sm'}`}>{currentItem.NombreES}</span>
                                                )}
                                                {isBaseRow && hasVariations && (
                                                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                        {group.variations.length} {group.variations.length === 1 ? 'hermano' : 'hermanos'}
                                                    </span>
                                                )}
                                                {!showEdit && (
                                                    <button 
                                                        onClick={() => { setLunchToEdit(currentItem); setIsLunchModalOpen(true); }}
                                                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-all flex-shrink-0"
                                                        title="Editar nombre y componentes del menú"
                                                    >
                                                        <Pencil size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        
                                        {visibleColumns.DescripcionES && (
                                            <EditableCell item={currentItem} field="DescripcionES" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />
                                        )}
                                        
                                        {visibleColumns.proteina && (
                                            <td className="py-3.5 px-4 text-left">
                                                {showEdit ? (
                                                    <div className="flex items-center gap-1 w-full relative group">
                                                        <select
                                                            className="w-full px-2 py-1 text-xs font-bold border rounded bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={currentProtein}
                                                            onChange={(e) => handleChange(currentItem._id, 'proteina', e.target.value)}
                                                            onBlur={() => handleBlur(currentItem._id)}
                                                        >
                                                            <option value="POLLO">POLLO</option>
                                                            <option value="CERDO">CERDO</option>
                                                            <option value="RES">RES</option>
                                                            <option value="PESCADO">PESCADO</option>
                                                            <option value="VEGETARIANO">VEGETARIANO</option>
                                                            <option value="OTROS">OTROS</option>
                                                        </select>
                                                        {isBaseRow && hasVariations && (
                                                            <button 
                                                                onClick={() => handleFillDown(currentItem, 'proteina', group.variations)}
                                                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-all absolute -right-5 z-10 shadow-sm border border-blue-200"
                                                                title="Propagar a variaciones"
                                                            >
                                                                <ArrowDownToLine size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${proteinColors[currentProtein] || 'bg-slate-50'}`}>
                                                        {currentProtein}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        
                                        {visibleColumns.Precio && (
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                                                {showEdit ? (
                                                    <div className="flex items-center gap-1 w-full relative group justify-end">
                                                        <input 
                                                            type="number" 
                                                            className="w-24 px-2 py-1 text-sm border rounded bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                                                            value={currentItem.Precio || ''}
                                                            onChange={(e) => handleChange(currentItem._id, 'Precio', e.target.value)}
                                                            onBlur={() => handleBlur(currentItem._id)}
                                                        />
                                                        {isBaseRow && hasVariations && (
                                                            <button 
                                                                onClick={() => handleFillDown(currentItem, 'Precio', group.variations)}
                                                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-all absolute -right-5 z-10 shadow-sm border border-blue-200"
                                                                title="Propagar a variaciones"
                                                            >
                                                                <ArrowDownToLine size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    parseFloat(currentItem.Precio || 22000).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
                                                )}
                                            </td>
                                        )}

                                        {visibleColumns.entrada_nombre && <EditableCell item={currentItem} field="Comp_Lunch.entrada.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.entrada_desc && <EditableCell item={currentItem} field="Comp_Lunch.entrada.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.proteina_nombre && <EditableCell item={currentItem} field="Comp_Lunch.proteina.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.proteina_desc && <EditableCell item={currentItem} field="Comp_Lunch.proteina.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.proteina_opcion_2_nombre && <EditableCell item={currentItem} field="Comp_Lunch.proteina_opcion_2.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.proteina_opcion_2_desc && <EditableCell item={currentItem} field="Comp_Lunch.proteina_opcion_2.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.carbohidrato_nombre && <EditableCell item={currentItem} field="Comp_Lunch.carbohidrato.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.carbohidrato_desc && <EditableCell item={currentItem} field="Comp_Lunch.carbohidrato.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.acompanante_nombre && <EditableCell item={currentItem} field="Comp_Lunch.acompanante.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.acompanante_desc && <EditableCell item={currentItem} field="Comp_Lunch.acompanante.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.ensalada_nombre && <EditableCell item={currentItem} field="Comp_Lunch.ensalada.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.ensalada_desc && <EditableCell item={currentItem} field="Comp_Lunch.ensalada.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.bebida_nombre && <EditableCell item={currentItem} field="Comp_Lunch.bebida.nombre" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        {visibleColumns.bebida_desc && <EditableCell item={currentItem} field="Comp_Lunch.bebida.desc" isBase={isBaseRow} hasVariations={hasVariations} variations={group.variations} showEdit={showEdit} handleChange={handleChange} handleBlur={handleBlur} handleFillDown={handleFillDown} />}
                                        
                                        {visibleColumns.Receta && (
                                            <td className="py-3.5 px-4 text-center">
                                                {currentItem.Receta ? (
                                                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Vinculada
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                        Sin Receta
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        
                                        <td className="py-3.5 px-4 text-center">
                                            {/* Aquí irían los enlaces o acciones si los hay, mantenemos vacío si no había */}
                                        </td>
                                    </tr>
                                );
                            };

                            return (
                                <React.Fragment key={item._id || groupIndex}>
                                    {renderRow(item, true)}
                                    {expanded && group.variations.map(variation => renderRow(variation, false))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
