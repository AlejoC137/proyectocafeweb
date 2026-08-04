import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateItem } from '../../../../redux/actions-Proveedores';
import { getAllFromTable, createRecipeForProduct } from '../../../../redux/actions';
import { MENU, RECETAS_MENU } from '../../../../redux/actions-types';
import { getProteinType } from '../utils/lunchUtils';

export const useLunchActions = (editableMenu, setEditableMenu, originalMenuRef) => {
    const dispatch = useDispatch();
    const savingMap = useRef(new Map());

    const enqueueSaveForProduct = useCallback((productId, payload) => {
        if (!productId || !payload || Object.keys(payload).length === 0) return;
        const entry = savingMap.current.get(productId) || { inFlight: false, pending: null };

        if (entry.inFlight) {
            entry.pending = { ...(entry.pending || {}), ...payload };
            savingMap.current.set(productId, entry);
            return;
        }

        entry.inFlight = true;
        savingMap.current.set(productId, entry);

        const processLoop = async (initialPayload) => {
            let payloadToSend = initialPayload;
            while (payloadToSend) {
                try {
                    await dispatch(updateItem(productId, payloadToSend, MENU));
                    
                    const edited = editableMenu.find(p => p._id === productId);
                    if (edited) {
                        const idx = originalMenuRef.current.findIndex(p => p._id === productId);
                        if (idx !== -1) {
                            originalMenuRef.current[idx] = JSON.parse(JSON.stringify(edited));
                        }
                    }

                    const currentEntry = savingMap.current.get(productId) || { inFlight: false, pending: null };
                    if (currentEntry.pending) {
                        payloadToSend = currentEntry.pending;
                        currentEntry.pending = null;
                        savingMap.current.set(productId, currentEntry);
                    } else {
                        currentEntry.inFlight = false;
                        savingMap.current.set(productId, currentEntry);
                        payloadToSend = null;
                    }
                } catch (err) {
                    const currentEntry = savingMap.current.get(productId) || { inFlight: false, pending: null };
                    currentEntry.inFlight = false;
                    currentEntry.pending = null;
                    savingMap.current.set(productId, currentEntry);

                    const orig = originalMenuRef.current.find(p => p._id === productId);
                    if (orig) {
                        setEditableMenu(prev => prev.map(p => p._id === productId ? JSON.parse(JSON.stringify(orig)) : p));
                    }
                    console.error("Error saving item", productId, err);
                    alert(`❌ Falló al guardar. Se revirtió al último estado guardado.`);
                    break;
                }
            }
        };

        processLoop(payload);
    }, [dispatch, editableMenu, setEditableMenu, originalMenuRef]);

    const handleBlur = useCallback((productId) => {
        const item = editableMenu.find(p => p._id === productId);
        if (!item) return;
        const original = originalMenuRef.current.find(p => p._id === productId);
        if (!original) return;
        
        const payload = {};
        if (item.NombreES !== original.NombreES) payload.NombreES = item.NombreES;
        if (item.Precio !== original.Precio) payload.Precio = item.Precio;
        
        // Check proteina inside Comp_Lunch
        if (item.Comp_Lunch !== original.Comp_Lunch) {
            payload.Comp_Lunch = item.Comp_Lunch;
        }

        if (Object.keys(payload).length > 0) {
            enqueueSaveForProduct(productId, payload);
        }
    }, [editableMenu, enqueueSaveForProduct, originalMenuRef]);

    const handleChange = (productId, field, value) => {
        setEditableMenu(prev => prev.map(p => {
            if (p._id !== productId) return p;
            const updated = { ...p };
            
            if (field === 'proteina') {
                let comp = {};
                try { comp = updated.Comp_Lunch ? (typeof updated.Comp_Lunch === 'string' ? JSON.parse(updated.Comp_Lunch) : updated.Comp_Lunch) : {}; } catch(e) {}
                comp.proteina_clasificacion = value;
                updated.Comp_Lunch = JSON.stringify(comp);
            } else if (field.startsWith('Comp_Lunch.')) {
                const parts = field.split('.'); 
                let comp = {};
                try { comp = updated.Comp_Lunch ? (typeof updated.Comp_Lunch === 'string' ? JSON.parse(updated.Comp_Lunch) : updated.Comp_Lunch) : {}; } catch(e) {}
                
                if (!comp[parts[1]]) comp[parts[1]] = {};
                comp[parts[1]][parts[2]] = value;
                
                updated.Comp_Lunch = JSON.stringify(comp);
            } else {
                updated[field] = value;
            }
            return updated;
        }));
    };

    const handleFillDown = (baseItem, field, variations) => {
        if (!variations || variations.length === 0) return;
        
        let valueToPropagate = null;
        if (field === 'proteina') {
            valueToPropagate = getProteinType(baseItem);
        } else if (field.startsWith('Comp_Lunch.')) {
            const parts = field.split('.');
            let comp = {};
            try { comp = baseItem.Comp_Lunch ? (typeof baseItem.Comp_Lunch === 'string' ? JSON.parse(baseItem.Comp_Lunch) : baseItem.Comp_Lunch) : {}; } catch(e) {}
            valueToPropagate = comp[parts[1]]?.[parts[2]] || '';
        } else {
            valueToPropagate = baseItem[field] || '';
        }

        if (!window.confirm(`¿Estás seguro de propagar el valor a las ${variations.length} variaciones?`)) return;

        variations.forEach(v => {
            handleChange(v._id, field, valueToPropagate);
            const payload = {};
            if (field === 'proteina' || field.startsWith('Comp_Lunch.')) {
                let comp = {};
                try { comp = v.Comp_Lunch ? (typeof v.Comp_Lunch === 'string' ? JSON.parse(v.Comp_Lunch) : v.Comp_Lunch) : {}; } catch(e) {}
                
                if (field === 'proteina') {
                    comp.proteina_clasificacion = valueToPropagate;
                } else {
                    const parts = field.split('.');
                    if (!comp[parts[1]]) comp[parts[1]] = {};
                    comp[parts[1]][parts[2]] = valueToPropagate;
                }
                payload.Comp_Lunch = JSON.stringify(comp);
            } else {
                payload[field] = valueToPropagate;
            }
            enqueueSaveForProduct(v._id, payload);
        });
    };

    const handleConfirmRelation = async (chosenParentId, selectedCatalogIds, setSelectedCatalogIds, setIsRelateModalOpen, allMenu) => {
        if (!chosenParentId) return;
        try {
            const otherIds = selectedCatalogIds.filter(id => id !== chosenParentId);
            
            for (const childId of otherIds) {
                const childItem = allMenu.find(item => item._id === childId);
                if (childItem) {
                    let comp = {};
                    try {
                        comp = childItem.Comp_Lunch 
                            ? (typeof childItem.Comp_Lunch === 'string' ? JSON.parse(childItem.Comp_Lunch) : childItem.Comp_Lunch)
                            : {};
                    } catch (e) {
                        comp = {};
                    }
                    comp.parentId = chosenParentId;
                    
                    await dispatch(updateItem(childId, {
                        Comp_Lunch: JSON.stringify(comp)
                    }, MENU));
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
            
            const parentItem = allMenu.find(item => item._id === chosenParentId);
            if (parentItem) {
                let comp = {};
                try {
                    comp = parentItem.Comp_Lunch 
                        ? (typeof parentItem.Comp_Lunch === 'string' ? JSON.parse(parentItem.Comp_Lunch) : parentItem.Comp_Lunch)
                        : {};
                } catch (e) {
                    comp = {};
                }
                delete comp.parentId;
                await dispatch(updateItem(chosenParentId, {
                    Comp_Lunch: JSON.stringify(comp)
                }, MENU));
            }

            await dispatch(getAllFromTable(MENU));
            alert("✅ ¡Platos relacionados con éxito!");
            setSelectedCatalogIds([]);
            setIsRelateModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("❌ Error al relacionar los platos.");
        }
    };

    const handleUnlinkRelation = async (selectedCatalogIds, setSelectedCatalogIds, allMenu) => {
        if (selectedCatalogIds.length === 0) return;
        if (!window.confirm(`¿Estás seguro de que deseas desvincular ${selectedCatalogIds.length} plato(s)? Ya no serán considerados variaciones y pasarán a ser platos base independientes.`)) return;

        try {
            let changesMade = false;
            for (const childId of selectedCatalogIds) {
                const childItem = allMenu.find(item => item._id === childId);
                if (childItem) {
                    let comp = {};
                    try {
                        comp = childItem.Comp_Lunch 
                            ? (typeof childItem.Comp_Lunch === 'string' ? JSON.parse(childItem.Comp_Lunch) : childItem.Comp_Lunch)
                            : {};
                    } catch (e) {
                        comp = {};
                    }
                    if (comp.parentId) {
                        delete comp.parentId;
                        await dispatch(updateItem(childId, {
                            Comp_Lunch: JSON.stringify(comp)
                        }, MENU));
                        changesMade = true;
                        await new Promise(resolve => setTimeout(resolve, 150));
                    }
                }
            }
            if (changesMade) {
                await dispatch(getAllFromTable(MENU));
                alert("✅ ¡Platos desvinculados con éxito!");
            } else {
                alert("ℹ️ Ninguno de los platos seleccionados estaba vinculado a otro plato.");
            }
            setSelectedCatalogIds([]);
        } catch (error) {
            console.error(error);
            alert("❌ Error al desvincular los platos.");
        }
    };

    const handleSaveLunch = async (nombreES, compLunchData, productId, setIsLunchModalOpen, setLunchToEdit) => {
        try {
            if (productId) {
                const fechaStr = compLunchData?.fechasSeleccionadas?.[0] || compLunchData?.fecha?.fecha;
                const diaSemana = fechaStr ? new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' }) : '';
                const compParaFecha = {
                    ...compLunchData,
                    fechasSeleccionadas: fechaStr ? [fechaStr] : [],
                    fecha: { fecha: fechaStr, dia: diaSemana }
                };
                const finalCompLunchData = JSON.stringify(compParaFecha);
                
                const updatedData = {
                    NombreES: nombreES,
                    Comp_Lunch: finalCompLunchData,
                };
                await dispatch(updateItem(productId, updatedData, MENU));
                await dispatch(getAllFromTable(MENU));
                alert('✅ ¡Almuerzo actualizado con éxito!');
            }
            setIsLunchModalOpen(false);
            setLunchToEdit(null);
        } catch (error) {
            alert('❌ Error al guardar el almuerzo.');
            console.error(error);
        }
    };

    const handleCreateRecipe = async (productId, productName) => {
        if (window.confirm(`¿Deseas crear y asociar una nueva receta para "${productName}"?`)) {
            const baseRecipeData = {
                legacyName: productName,
                autor: "Sistema Automático",
                revisor: "Pendiente",
            };
            await dispatch(createRecipeForProduct(baseRecipeData, productId, MENU, RECETAS_MENU));
            await dispatch(getAllFromTable(MENU));
            await dispatch(getAllFromTable(RECETAS_MENU));
            alert('✅ ¡Receta creada con éxito! Haz clic en "Receta" para editarla.');
        }
    };

    return {
        enqueueSaveForProduct,
        handleBlur,
        handleChange,
        handleFillDown,
        handleConfirmRelation,
        handleUnlinkRelation,
        handleSaveLunch,
        handleCreateRecipe
    };
};
