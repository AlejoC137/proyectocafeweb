import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../../../redux/actions-Proveedores';
import { getAllFromTable } from '../../../../redux/actions';
import { MENU } from '../../../../redux/actions-types';

export const useDragAndDrop = (allMenu, selectedCatalogIds, setSelectedCatalogIds) => {
    const dispatch = useDispatch();
    const [draggedItemId, setDraggedItemId] = useState(null);
    const [draggedItemParentId, setDraggedItemParentId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    const handleDragStart = (e, item, parentId = null) => {
        setDraggedItemId(item._id);
        setDraggedItemParentId(parentId);
        setDragOverId(null);
    };

    const handleDragOverTable = (e, targetId) => {
        e.preventDefault();
        if (draggedItemId && draggedItemId !== targetId && dragOverId !== targetId) {
            setDragOverId(targetId);
        }
    };

    const handleDragLeaveTable = (e, targetId) => {
        e.preventDefault();
        if (dragOverId === targetId) {
            setDragOverId(null);
        }
    };

    const handleDropToLink = async (e, targetParentId) => {
        e.preventDefault();
        
        let itemsToMove = [];
        if (draggedItemId) {
             if (selectedCatalogIds.includes(draggedItemId)) {
                 itemsToMove = selectedCatalogIds.filter(id => id !== targetParentId);
             } else {
                 itemsToMove = draggedItemId === targetParentId ? [] : [draggedItemId];
             }
        }
        
        if (itemsToMove.length === 0) {
            setDraggedItemId(null);
            setDraggedItemParentId(null);
            setDragOverId(null);
            return;
        }

        try {
            let changes = 0;
            for (const id of itemsToMove) {
                const childItem = allMenu.find(item => item._id === id);
                if (!childItem) continue;
                
                let comp = {};
                try {
                    comp = childItem.Comp_Lunch 
                        ? (typeof childItem.Comp_Lunch === 'string' ? JSON.parse(childItem.Comp_Lunch) : childItem.Comp_Lunch)
                        : {};
                } catch (err) {
                    comp = {};
                }
                
                if (comp.parentId === targetParentId) continue;
                
                comp.parentId = targetParentId;
                await dispatch(updateItem(id, {
                    Comp_Lunch: JSON.stringify(comp)
                }, MENU));
                changes++;
                await new Promise(resolve => setTimeout(resolve, 150));
            }

            if (changes > 0) {
                const parentItem = allMenu.find(item => item._id === targetParentId);
                if (parentItem) {
                    let parentComp = {};
                    try {
                        parentComp = parentItem.Comp_Lunch 
                            ? (typeof parentItem.Comp_Lunch === 'string' ? JSON.parse(parentItem.Comp_Lunch) : parentItem.Comp_Lunch)
                            : {};
                    } catch (err) {
                        parentComp = {};
                    }
                    if (parentComp.parentId) {
                        delete parentComp.parentId;
                        await dispatch(updateItem(targetParentId, {
                            Comp_Lunch: JSON.stringify(parentComp)
                        }, MENU));
                    }
                }

                await dispatch(getAllFromTable(MENU));
                alert(`✅ ¡${changes} plato(s) relacionado(s) con éxito!`);
                setSelectedCatalogIds([]);
            }
        } catch (error) {
            console.error(error);
            alert("❌ Error al relacionar los platos.");
        } finally {
            setDraggedItemId(null);
            setDraggedItemParentId(null);
            setDragOverId(null);
        }
    };

    const handleDropToUnlink = async (e) => {
        e.preventDefault();
        if (!draggedItemId || !draggedItemParentId) {
            setDraggedItemId(null);
            setDraggedItemParentId(null);
            setDragOverId(null);
            return;
        }

        try {
            const childItem = allMenu.find(item => item._id === draggedItemId);
            if (childItem) {
                let comp = {};
                try {
                    comp = childItem.Comp_Lunch 
                        ? (typeof childItem.Comp_Lunch === 'string' ? JSON.parse(childItem.Comp_Lunch) : childItem.Comp_Lunch)
                        : {};
                } catch (err) {
                    comp = {};
                }
                if (comp.parentId) {
                    delete comp.parentId;
                    await dispatch(updateItem(draggedItemId, {
                        Comp_Lunch: JSON.stringify(comp)
                    }, MENU));
                    
                    await dispatch(getAllFromTable(MENU));
                    alert("✅ ¡Plato desvinculado con éxito!");
                }
            }
        } catch (error) {
            console.error(error);
            alert("❌ Error al desvincular el plato.");
        }
        
        setDraggedItemId(null);
        setDraggedItemParentId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDraggedItemParentId(null);
        setDragOverId(null);
    };

    return {
        draggedItemId,
        draggedItemParentId,
        dragOverId,
        handleDragStart,
        handleDragOverTable,
        handleDragLeaveTable,
        handleDropToLink,
        handleDropToUnlink,
        handleDragEnd
    };
};
