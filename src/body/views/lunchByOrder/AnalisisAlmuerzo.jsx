import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';

import { getAllFromTable } from '../../../redux/actions';
import { MENU, RECETAS_MENU, RECETAS_PRODUCCION } from '../../../redux/actions-types';
import { LunchModal } from '../../../components/ui/CardGridInventarioMenuLunch';

import { useLunchData, monthsNames } from './hooks/useLunchData';
import { useLunchActions } from './hooks/useLunchActions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { handleDownloadPDF } from './utils/lunchUtils';

import { MonthlyView } from './components/MonthlyView';
import { AnnualView } from './components/AnnualView';
import { CatalogView } from './components/CatalogView';

const AnalisisAlmuerzo = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Local states para edición
    const [showEdit, setShowEdit] = useState(false);
    const [editableMenu, setEditableMenu] = useState([]);
    const originalMenuRef = useRef([]);
    const [isLunchModalOpen, setIsLunchModalOpen] = useState(false);
    const [lunchToEdit, setLunchToEdit] = useState(null);
    const [selectedCatalogIds, setSelectedCatalogIds] = useState([]);
    const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
    const [chosenParentId, setChosenParentId] = useState("");

    // Column visibility state
    const defaultColumns = {
        DescripcionES: false,
        proteina: true,
        Precio: true,
        Receta: true,
        entrada_nombre: false, entrada_desc: false,
        proteina_nombre: false, proteina_desc: false,
        proteina_opcion_2_nombre: false, proteina_opcion_2_desc: false,
        carbohidrato_nombre: false, carbohidrato_desc: false,
        acompanante_nombre: false, acompanante_desc: false,
        ensalada_nombre: false, ensalada_desc: false,
        bebida_nombre: false, bebida_desc: false
    };

    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('lunchCatalogColumns');
        if (saved) {
            try { return { ...defaultColumns, ...JSON.parse(saved) }; } catch(e) {}
        }
        return defaultColumns;
    });

    const [showColumnMenu, setShowColumnMenu] = useState(false);

    const toggleColumn = (col) => {
        setVisibleColumns(prev => {
            const next = { ...prev, [col]: !prev[col] };
            localStorage.setItem('lunchCatalogColumns', JSON.stringify(next));
            return next;
        });
    };

    // Usar hooks personalizados
    const lunchData = useLunchData(editableMenu);
    
    useEffect(() => {
        setEditableMenu(lunchData.allMenu);
        originalMenuRef.current = JSON.parse(JSON.stringify(lunchData.allMenu));
    }, [lunchData.allMenu]);

    const lunchActions = useLunchActions(editableMenu, setEditableMenu, originalMenuRef);
    const dnd = useDragAndDrop(lunchData.allMenu, selectedCatalogIds, setSelectedCatalogIds);

    useEffect(() => {
        dispatch(getAllFromTable(MENU));
        dispatch(getAllFromTable(RECETAS_MENU));
        dispatch(getAllFromTable(RECETAS_PRODUCCION));
    }, [dispatch]);

    const handleToggleSelectCatalog = (id) => {
        setSelectedCatalogIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleOpenRelateModal = () => {
        if (selectedCatalogIds.length < 2) {
            alert("Por favor selecciona al menos 2 platos para relacionar.");
            return;
        }
        setChosenParentId(selectedCatalogIds[0]);
        setIsRelateModalOpen(true);
    };

    const handleDownload = () => {
        handleDownloadPDF(
            lunchData.selectedMonth,
            lunchData.selectedYear,
            lunchData.lunchStats,
            lunchData.groupedStats
        );
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen w-full font-SpaceGrotesk">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/CalendarioProduccion')} 
                        className="p-2.5 bg-white border rounded-xl hover:bg-slate-100 transition shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Análisis Operativo de Almuerzos</h1>
                        <p className="text-sm text-slate-500">Supervisión de tendencias, rentabilidad y distribución de proteínas.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {lunchData.activeTab === "mensual" ? (
                        <div className="flex bg-white border rounded-xl p-1 shadow-sm items-center">
                            <select
                                value={lunchData.selectedMonth}
                                onChange={(e) => lunchData.setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent px-3 py-1.5 text-sm font-semibold focus:outline-none"
                            >
                                {monthsNames.map((name, index) => (
                                    <option key={index} value={index}>{name}</option>
                                ))}
                            </select>
                            <select
                                value={lunchData.selectedYear}
                                onChange={(e) => lunchData.setSelectedYear(Number(e.target.value))}
                                className="bg-transparent px-3 py-1.5 text-sm font-semibold focus:outline-none border-l"
                            >
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    ) : lunchData.activeTab === "anual" ? (
                        <div className="flex bg-white border rounded-xl p-1 shadow-sm items-center">
                            <span className="text-xs font-bold text-slate-400 px-2">Año:</span>
                            <select
                                value={lunchData.selectedYear}
                                onChange={(e) => lunchData.setSelectedYear(Number(e.target.value))}
                                className="bg-transparent px-3 py-1.5 text-sm font-semibold focus:outline-none"
                            >
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {lunchData.activeTab === "mensual" && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow animate-fade-in"
                        >
                            <Download className="w-4 h-4" />
                            Descargar PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Pestañas de Navegación del Análisis */}
            <div className="flex border-b border-slate-200 mb-6 gap-4">
                <button
                    onClick={() => lunchData.setActiveTab("mensual")}
                    className={`pb-3 font-bold text-sm transition-all relative ${lunchData.activeTab === "mensual" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Vista Mensual
                </button>
                <button
                    onClick={() => lunchData.setActiveTab("anual")}
                    className={`pb-3 font-bold text-sm transition-all relative ${lunchData.activeTab === "anual" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    📈 Tendencias y Proteínas (Anual)
                </button>
                <button
                    onClick={() => lunchData.setActiveTab("catalogo")}
                    className={`pb-3 font-bold text-sm transition-all relative ${lunchData.activeTab === "catalogo" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                    📋 Catálogo de Platos (Todos)
                </button>
            </div>

            {lunchData.activeTab === "mensual" ? (
                <MonthlyView 
                    lunchStats={lunchData.lunchStats}
                    filteredLunchStats={lunchData.filteredLunchStats}
                    groupedStats={lunchData.groupedStats}
                    filteredGroupedStats={lunchData.filteredGroupedStats}
                    searchTermMonthly={lunchData.searchTermMonthly}
                    setSearchTermMonthly={lunchData.setSearchTermMonthly}
                    setLunchToEdit={setLunchToEdit}
                    setIsLunchModalOpen={setIsLunchModalOpen}
                    handleCreateRecipe={lunchActions.handleCreateRecipe}
                    navigate={navigate}
                />
            ) : lunchData.activeTab === "anual" ? (
                <AnnualView 
                    selectedYear={lunchData.selectedYear}
                    annualStats={lunchData.annualStats}
                    maxMonthlyQty={Math.max(...lunchData.annualStats.monthlyTrend.map(m => m.cantidad), 1)}
                    totalProteinQty={lunchData.annualStats.proteinSummary.reduce((acc, p) => acc + p.cantidad, 0) || 1}
                    searchTermAnnual={lunchData.searchTermAnnual}
                    setSearchTermAnnual={lunchData.setSearchTermAnnual}
                    filteredAnnualTopMenus={lunchData.filteredAnnualTopMenus}
                    maxTopLunchQty={Math.max(...lunchData.annualStats.topMenus.map(m => m.cantidad), 1)}
                    handleCreateRecipe={lunchActions.handleCreateRecipe}
                    setLunchToEdit={setLunchToEdit}
                    setIsLunchModalOpen={setIsLunchModalOpen}
                    navigate={navigate}
                />
            ) : lunchData.activeTab === "catalogo" ? (
                <CatalogView 
                    handleExpandAllCatalog={() => lunchData.handleExpandAllCatalog(lunchData.groupedCatalogItems)}
                    handleCollapseAllCatalog={lunchData.handleCollapseAllCatalog}
                    setShowEdit={setShowEdit}
                    showEdit={showEdit}
                    selectedCatalogIds={selectedCatalogIds}
                    handleUnlinkRelation={() => lunchActions.handleUnlinkRelation(selectedCatalogIds, setSelectedCatalogIds, lunchData.allMenu)}
                    handleOpenRelateModal={handleOpenRelateModal}
                    searchTermCatalog={lunchData.searchTermCatalog}
                    setSearchTermCatalog={lunchData.setSearchTermCatalog}
                    showColumnMenu={showColumnMenu}
                    setShowColumnMenu={setShowColumnMenu}
                    defaultColumns={defaultColumns}
                    visibleColumns={visibleColumns}
                    toggleColumn={toggleColumn}
                    groupedCatalogItems={lunchData.groupedCatalogItems}
                    handleToggleSelectAllCatalog={() => {
                        const allVisibleIds = lunchData.groupedCatalogItems.flatMap(g => [g.baseItem._id, ...g.variations.map(v => v._id)]);
                        if (selectedCatalogIds.length === allVisibleIds.length && allVisibleIds.length > 0) setSelectedCatalogIds([]);
                        else setSelectedCatalogIds(allVisibleIds);
                    }}
                    handleSortCatalog={lunchData.handleSortCatalog}
                    getSortIcon={lunchData.getSortIcon}
                    isGroupExpanded={lunchData.isGroupExpanded}
                    toggleExpandGroup={lunchData.toggleExpandGroup}
                    handleChange={lunchActions.handleChange}
                    handleBlur={lunchActions.handleBlur}
                    handleFillDown={lunchActions.handleFillDown}
                    setLunchToEdit={setLunchToEdit}
                    setIsLunchModalOpen={setIsLunchModalOpen}
                    draggedItemId={dnd.draggedItemId}
                    dragOverId={dnd.dragOverId}
                    handleDragStart={dnd.handleDragStart}
                    handleDragEnd={dnd.handleDragEnd}
                    handleDragOverTable={dnd.handleDragOverTable}
                    handleDragLeaveTable={dnd.handleDragLeaveTable}
                    handleDropToLink={dnd.handleDropToLink}
                    handleToggleSelectCatalog={handleToggleSelectCatalog}
                />
            ) : null}

            {/* Modal para Crear/Relacionar */}
            {isRelateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-md">
                        <h2 className="text-lg font-bold text-slate-800 mb-2">Relacionar Platos</h2>
                        <p className="text-sm text-slate-600 mb-4">
                            Has seleccionado {selectedCatalogIds.length} platos. Por favor, selecciona cuál será el <strong>Plato Base (Padre)</strong> de este grupo. Los demás se convertirán en variaciones vinculadas a él.
                        </p>
                        <select 
                            className="w-full p-2 border rounded-xl bg-slate-50 mb-6 font-semibold text-slate-700"
                            value={chosenParentId}
                            onChange={e => setChosenParentId(e.target.value)}
                        >
                            {selectedCatalogIds.map(id => {
                                const prod = lunchData.allMenu.find(m => m._id === id);
                                return <option key={id} value={id}>{prod ? prod.NombreES : id}</option>;
                            })}
                        </select>
                        
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setIsRelateModalOpen(false)}
                                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => lunchActions.handleConfirmRelation(chosenParentId, selectedCatalogIds, setSelectedCatalogIds, setIsRelateModalOpen, lunchData.allMenu)}
                                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow"
                            >
                                Confirmar y Relacionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLunchModalOpen && (
                <LunchModal
                    isOpen={isLunchModalOpen}
                    onClose={() => { setIsLunchModalOpen(false); setLunchToEdit(null); }}
                    onSave={(nombre, comp) => lunchActions.handleSaveLunch(nombre, comp, lunchToEdit?._id, setIsLunchModalOpen, setLunchToEdit)}
                    initialData={lunchToEdit}
                />
            )}
        </div>
    );
};

export default AnalisisAlmuerzo;
