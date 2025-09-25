import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Componente para una fila de la tabla de pedidos.
 */
const OrderRow = React.memo(({ item, index, onRowChange, onTogglePagado, onDeleteRow, lastAddedRowIndex }) => {
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (index === lastAddedRowIndex) {
            nameInputRef.current?.focus();
        }
    }, [index, lastAddedRowIndex]);

    return (
        <tr className="hover:bg-gray-50">
            <td className="py-1 px-2 border-b">{item.order}</td>
            <td className="py-1 px-2 border-b">
                <input ref={nameInputRef} type="text" name="nombre" value={item.nombre} onChange={(e) => onRowChange(index, e)} className="w-full p-1 border rounded" />
            </td>
            <td className="py-1 px-2 border-b">
                <input type="number" name="option" value={item.option} onChange={(e) => onRowChange(index, e)} className="w-20 p-1 border rounded" />
            </td>
            <td className="py-1 px-2 border-b">
                <button onClick={() => onTogglePagado(index)} className={`w-full p-1 rounded ${item.pagado ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {item.pagado ? 'Sí' : 'No'}
                </button>
            </td>
            <td className="py-1 px-2 border-b">
                <select name="donde" value={item.donde} onChange={(e) => onRowChange(index, e)} className="w-full p-1 border rounded">
                    <option value="acá">Para acá</option>
                    <option value="llevar">Para llevar</option>
                </select>
            </td>
            <td className="py-1 px-2 border-b">
                <input type="text" name="notas" value={item.notas} onChange={(e) => onRowChange(index, e)} className="w-full p-1 border rounded" />
            </td>
            <td className="py-1 px-2 border-b">
                <button onClick={() => onDeleteRow(index)} className="text-red-500 hover:text-red-700">Eliminar</button>
            </td>
        </tr>
    );
});


/**
 * Componente para gestionar la lista de pedidos con un sistema de versiones simple.
 * @param {object} menuDelDia - El objeto del menú del día.
 * @param {function} onUpdate - Callback que se ejecuta para guardar todos los cambios.
 */
function MenuDelDiaList({ menuDelDia, onUpdate }) {
    const [lunchData, setLunchData] = useState(null);
    const [activeV, setActiveV] = useState(1);
    const [isDirty, setIsDirty] = useState(false);
    const [notification, setNotification] = useState('');
    const [lastAddedRowIndex, setLastAddedRowIndex] = useState(null);

    // Efecto para parsear, migrar (si es necesario) y cargar los datos
    useEffect(() => {
        if (menuDelDia && menuDelDia.Comp_Lunch) {
            try {
                let parsedData = JSON.parse(menuDelDia.Comp_Lunch);

                // --- Lógica de Retrocompatibilidad ---
                // Si 'lista' no existe o no es un array, inicialízalo.
                if (!parsedData.lista || !Array.isArray(parsedData.lista)) {
                    parsedData.lista = [{ v: 1, date: new Date().toISOString(), list: [] }];
                }
                // Si 'lista' es un array de pedidos (formato antiguo), conviértelo al formato versionado.
                else if (parsedData.lista.length > 0 && typeof parsedData.lista[0].v === 'undefined') {
                    parsedData.lista = [{ v: 1, date: new Date().toISOString(), list: parsedData.lista }];
                }
                 // Si la lista está vacía, inicializa la primera versión.
                else if (parsedData.lista.length === 0) {
                     parsedData.lista = [{ v: 1, date: new Date().toISOString(), list: [] }];
                }

                setLunchData(parsedData);
                
                // Encuentra la 'v' más alta y establécela como activa
                const maxV = Math.max(...parsedData.lista.map(version => version.v));
                setActiveV(maxV);

            } catch (e) {
                console.error("Error al parsear Comp_Lunch:", e);
                setLunchData(null);
            }
        }
    }, [menuDelDia]);

    const handleStateChange = (newLunchData) => {
        setLunchData(newLunchData);
        setIsDirty(true);
        setLastAddedRowIndex(null);
        setNotification('');
    };

    // Función que actualiza la 'list' de la versión activa
    const updateActiveVersionList = (newList) => {
        const newLunchData = { ...lunchData };
        const activeVersionIndex = newLunchData.lista.findIndex(v => v.v === activeV);

        if (activeVersionIndex > -1) {
            newLunchData.lista[activeVersionIndex].list = newList;
            handleStateChange(newLunchData);
        }
    };
    
    // Obtiene la lista de pedidos de la versión activa
    const getActiveOrderList = useCallback(() => {
        return lunchData?.lista.find(v => v.v === activeV)?.list || [];
    }, [lunchData, activeV]);


    const handleRowChange = (index, event) => {
        const { name, value } = event.target;
        const activeList = getActiveOrderList();
        const newList = activeList.map((item, i) =>
            i === index ? { ...item, [name]: value } : item
        );
        updateActiveVersionList(newList);
    };

    const handleTogglePagado = (index) => {
        const activeList = getActiveOrderList();
        const newList = activeList.map((item, i) =>
            i === index ? { ...item, pagado: !item.pagado } : item
        );
        updateActiveVersionList(newList);
    };

    const handleAddRow = () => {
        const activeList = getActiveOrderList();
        const newOrderNumber = activeList.length > 0 ? Math.max(...activeList.map(i => i.order)) + 1 : 1;
        const newItem = { order: newOrderNumber, nombre: '', option: 1, pagado: false, donde: 'acá', notas: '' };
        const newList = [...activeList, newItem];
        setLastAddedRowIndex(newList.length - 1);
        updateActiveVersionList(newList);
    };

    const handleDeleteRow = (indexToDelete) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
            const activeList = getActiveOrderList();
            const newList = activeList.filter((_, index) => index !== indexToDelete);
            updateActiveVersionList(newList);
        }
    };

    const handleAddNewVersion = () => {
        const maxV = Math.max(...lunchData.lista.map(version => version.v));
        const newV = maxV + 1;
        const newVersion = {
            v: newV,
            date: new Date().toISOString(),
            list: []
        };
        
        const newLunchData = {
            ...lunchData,
            lista: [...lunchData.lista, newVersion]
        };

        handleStateChange(newLunchData);
        setActiveV(newV); // Cambia a la nueva versión
    };

    const handleUpdateAll = () => {
        const updatedMenuDelDia = {
            ...menuDelDia,
            Comp_Lunch: JSON.stringify(lunchData, null, 2),
        };
        onUpdate(updatedMenuDelDia);
        setIsDirty(false);
        setNotification('¡Cambios guardados con éxito!');
        setTimeout(() => setNotification(''), 3000);
    };

    if (!lunchData) {
        return <div className="p-4 text-center text-gray-500">Cargando datos del menú...</div>;
    }

    const currentOrderList = getActiveOrderList();

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl font-sans">
            <div className="mb-6 border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-800">{lunchData.proteina?.nombre || 'Menú del Día'}</h2>
                <p className="text-lg text-gray-600">Fecha: {lunchData.fecha?.fecha}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                     <button onClick={handleAddRow} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">➕ Añadir Pedido</button>
                     <button onClick={handleUpdateAll} disabled={!isDirty} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">💾 Guardar Cambios</button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="version-selector" className="font-medium text-gray-700">Versión:</label>
                        <select id="version-selector" value={activeV} onChange={(e) => setActiveV(parseInt(e.target.value, 10))} className="p-2 border border-gray-300 rounded-md bg-white">
                            {lunchData.lista.map(v => <option key={v.v} value={v.v}>V{v.v}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAddNewVersion} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">Nueva Versión</button>
                </div>
                 {notification && <div className="w-full text-center p-2 rounded bg-green-100 text-green-800">{notification}</div>}
            </div>
            
            <h3 className="text-2xl font-semibold mb-4 text-gray-700">Lista de Pedidos (V{activeV})</h3>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            {['Orden', 'Nombre', 'Opción', 'Pagado', 'Dónde', 'Notas', 'Acciones'].map(header => (
                                <th key={header} className="py-2 px-4 border-b text-left">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrderList.map((item, index) => (
                            <OrderRow
                                key={`${activeV}-${item.order}`}
                                item={item}
                                index={index}
                                onRowChange={handleRowChange}
                                onTogglePagado={handleTogglePagado}
                                onDeleteRow={handleDeleteRow}
                                lastAddedRowIndex={lastAddedRowIndex}
                            />
                        ))}
                    </tbody>
                </table>
                 {currentOrderList.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No hay pedidos en la V{activeV}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MenuDelDiaList;