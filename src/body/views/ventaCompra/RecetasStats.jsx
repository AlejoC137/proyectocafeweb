import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteItem, getAllFromTable } from "../../../redux/actions";
import { RECETAS_MENU, RECETAS_PRODUCCION } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";

// --- Componente para el Modal de Confirmación de Borrado ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h3>
                <p className="mt-2 text-sm text-gray-600">
                    ¿Estás seguro de que deseas eliminar la receta "<strong>{itemName}</strong>"? Esta acción no se puede deshacer.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button onClick={onClose} variant="ghost">Cancelar</Button>
                    <Button onClick={onConfirm} variant="destructive">Eliminar</Button>
                </div>
            </div>
        </div>
    );
};

// --- Componente para el ícono de ordenamiento ---
const SortIcon = ({ direction }) => {
  if (!direction) return <span className="text-gray-400">↕</span>;
  return direction === 'ascending' ? <span>▲</span> : <span>▼</span>;
};

// --- Componente principal de la tabla de estadísticas ---
function RecetasStats() {
  const dispatch = useDispatch();
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu);
  const allRecetasProduccion = useSelector((state) => state.allRecetasProduccion);

  const [sortConfig, setSortConfig] = useState({ key: 'legacyName', direction: 'ascending' });
  const [deletingReceta, setDeletingReceta] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(getAllFromTable(RECETAS_MENU));
    dispatch(getAllFromTable(RECETAS_PRODUCCION));
  }, [dispatch]);
  
  const processedRecetas = useMemo(() => {
    const combined = [...allRecetasMenu, ...allRecetasProduccion];
    return combined.map(receta => {
        let rendimientoData = {};
        try { if (receta.rendimiento) rendimientoData = JSON.parse(receta.rendimiento); } catch {}
        let costoData = {};
        try { if (typeof receta.costo === 'string' && receta.costo.startsWith('{')) costoData = JSON.parse(receta.costo); } catch {}
        return {
            _id: receta._id, legacyName: receta.legacyName, porcion: rendimientoData.porcion,
            cantidad: Number(rendimientoData.cantidad) || null, unidades: rendimientoData.unidades,
            emplatado: receta.emplatado, vIB: costoData.vIB, pIB: costoData.pIB, vCMP: costoData.vCMP,
            pCMPInicial: costoData.pCMPInicial, pCMPReal: costoData.pCMPReal, PPVii: costoData.PPVii, costoTiempo: costoData.costoTiempo,
        };
    });
  }, [allRecetasMenu, allRecetasProduccion]);

  const filteredAndSortedRecetas = useMemo(() => {
    let items = [...processedRecetas];
    
    if (searchTerm) {
        items = items.filter(receta =>
            receta.legacyName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key]; const bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1; if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [processedRecetas, sortConfig, searchTerm]);
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  
  const handleDeleteClick = (receta) => {
      setDeletingReceta(receta);
  };

  const confirmDelete = async () => {
      if (deletingReceta) {
          const source = allRecetasMenu.some(r => r._id === deletingReceta._id) ? "Recetas" : "RecetasProduccion";
          await dispatch(deleteItem(deletingReceta._id, source));
          setDeletingReceta(null);
          dispatch(getAllFromTable(RECETAS_MENU));
          dispatch(getAllFromTable(RECETAS_PRODUCCION));
      }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (String(num).includes('.') && Math.abs(num) < 1 && num !== 0) { return (num * 100).toFixed(1); }
    if (num % 1 !== 0) return num.toFixed(2);
    return num.toLocaleString('es-CO');
  };

  const columns = [ { key: 'legacyName', label: 'Nombre', subtitle: 'Nombre de la receta o plato' }, { key: 'porcion', label: 'Porción', subtitle: 'Cantidad de porciones que rinde la receta' }, { key: 'cantidad', label: 'Cantidad', subtitle: 'Rendimiento total de la receta' }, { key: 'unidades', label: 'Unidades', subtitle: 'Unidad de medida del rendimiento (Gr, mL, etc.)' }, { key: 'vIB', label: 'vIB', subtitle: 'Valor Ingreso Bruto', sufix: "$" }, { key: 'pIB', label: 'pIB', subtitle: '% Utilidad Bruta', sufix: "%" }, { key: 'vCMP', label: 'vCMP', subtitle: 'Valor Costo Materia Prima', sufix: "$" }, { key: 'pCMPInicial', label: 'pCMP Estab.', subtitle: '% Costo Materia Prima (Establecido)', sufix: "%" }, { key: 'pCMPReal', label: 'pCMP Real', subtitle: '% Costo Materia Prima (Real)', sufix: "%" }, { key: 'PPVii', label: 'PPVii', subtitle: 'Precio Potencial de Venta', sufix: "$" }, { key: 'costoTiempo', label: 'Costo Tiempo', subtitle: 'Costo asociado al tiempo de preparación', sufix: "m" }, ];

  return (
    <>
      <div className="p-4 md:p-8 bg-gray-100 min-h-screen w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Análisis de Recetas</h1>
        
        <div className="mb-4">
            <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded-md shadow-sm w-full md:w-1/3"
            />
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col" title={col.subtitle} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-200" onClick={() => requestSort(col.key)}>
                    <div className="flex items-center">
                      {col.label}
                      <span className="ml-2">{sortConfig.key === col.key ? <SortIcon direction={sortConfig.direction} /> : <SortIcon direction={null} />}</span>
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedRecetas.length > 0 ? (
                filteredAndSortedRecetas.map((receta) => (
                  <tr key={receta._id} className="hover:bg-gray-50 transition-colors duration-200">
                    {columns.map(col => {
                      const value = receta[col.key]; let cellContent;
                      if (typeof value === 'number') { const formattedValue = formatNumber(value); if (formattedValue !== 'N/A' && col.sufix) { cellContent = col.sufix === '$' ? `$ ${formattedValue}` : `${formattedValue} ${col.sufix}`; } else { cellContent = formattedValue; } } else { cellContent = value || 'N/A'; }
                      return (<td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cellContent}</td>);
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-4">
                      <a href={`/receta/${receta._id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800">
                        Ver Receta
                      </a>
                      <button onClick={() => handleDeleteClick(receta)} className="font-medium text-red-600 hover:text-red-800">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-500">No se encontraron recetas con ese nombre.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={!!deletingReceta} 
        onClose={() => setDeletingReceta(null)} 
        onConfirm={confirmDelete} 
        itemName={deletingReceta?.legacyName} 
      />
    </>
  );
}

export default RecetasStats;