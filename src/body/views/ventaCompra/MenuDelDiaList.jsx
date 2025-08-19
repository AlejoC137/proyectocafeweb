import React, { useState, useEffect } from 'react';

/**
 * Componente mejorado para gestionar la lista de pedidos con edición en línea.
 * @param {object} menuDelDia - El objeto del menú del día.
 * @param {function} onUpdate - Callback que se ejecuta para guardar todos los cambios.
 */
function MenuDelDiaList({ menuDelDia, onUpdate }) {
  const [lunchData, setLunchData] = useState(null);

  // Efecto para parsear y cargar los datos iniciales
  useEffect(() => {
    if (menuDelDia && menuDelDia.Comp_Lunch) {
      try {
        const parsedData = JSON.parse(menuDelDia.Comp_Lunch);
        if (!parsedData.lista || !Array.isArray(parsedData.lista)) {
          parsedData.lista = [];
        }
        setLunchData(parsedData);
      } catch (e) {
        console.error("Error al parsear Comp_Lunch:", e);
        setLunchData(null);
      }
    }
  }, [menuDelDia]);

  // --- NUEVAS FUNCIONES PARA EDICIÓN EN LÍNEA ---

  // Actualiza el estado local cuando se edita un campo en una fila
  const handleRowChange = (index, event) => {
    const { name, value } = event.target;
    const newList = lunchData.lista.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setLunchData(prev => ({ ...prev, lista: newList }));
  };

  // Cambia el estado de 'pagado' para una fila específica
  const handleTogglePagado = (index) => {
    const newList = lunchData.lista.map((item, i) =>
      i === index ? { ...item, pagado: !item.pagado } : item
    );
    setLunchData(prev => ({ ...prev, lista: newList }));
  };

  // Añade una nueva fila vacía a la lista
  const handleAddRow = () => {
    const newOrderNumber = lunchData.lista.length > 0 ? Math.max(...lunchData.lista.map(i => i.order)) + 1 : 1;
    const newItem = {
      order: newOrderNumber,
      nombre: '',
      option: 1,
      pagado: false,
      donde: 'acá',
      notas: '',
    };
    setLunchData(prev => ({ ...prev, lista: [...prev.lista, newItem] }));
  };

  // Elimina una fila de la lista
  const handleDeleteRow = (indexToDelete) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
      const newList = lunchData.lista.filter((_, index) => index !== indexToDelete);
      setLunchData(prev => ({ ...prev, lista: newList }));
    }
  };
  
  // Envía todos los cambios al componente padre para ser guardados
  const handleUpdateAll = () => {
    const updatedLunchData = { ...lunchData };
    const updatedMenuDelDia = {
      ...menuDelDia,
      Comp_Lunch: JSON.stringify(updatedLunchData, null, 2),
    };
    onUpdate(updatedMenuDelDia);
  };

  if (!lunchData) {
    return <div className="p-4 text-center text-gray-500">Cargando datos del menú...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl font-sans">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-800">{lunchData.proteina?.nombre || 'Menú del Día'}</h2>
        <p className="text-lg text-gray-600">Fecha: {lunchData.fecha?.fecha}</p>
      </div>

      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Lista de Pedidos</h3>
      
      {/* --- BOTONES DE ACCIÓN PRINCIPALES --- */}
      <div className="flex gap-4 mb-4">
        <button onClick={handleAddRow} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">➕ Añadir Pedido</button>
        <button onClick={handleUpdateAll} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">💾 Guardar Cambios</button>
      </div>

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
            {lunchData.lista.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-1 px-2 border-b">{item.order}</td>
                <td className="py-1 px-2 border-b">
                  <input type="text" name="nombre" value={item.nombre} onChange={(e) => handleRowChange(index, e)} className="w-full p-1 border rounded" />
                </td>
                <td className="py-1 px-2 border-b">
                  <input type="number" name="option" value={item.option} onChange={(e) => handleRowChange(index, e)} className="w-20 p-1 border rounded" />
                </td>
                <td className="py-1 px-2 border-b">
                  <button onClick={() => handleTogglePagado(index)} className={`w-full p-1 rounded ${item.pagado ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {item.pagado ? 'Sí' : 'No'}
                  </button>
                </td>
                <td className="py-1 px-2 border-b">
                  <select name="donde" value={item.donde} onChange={(e) => handleRowChange(index, e)} className="w-full p-1 border rounded">
                    <option value="acá">Para acá</option>
                    <option value="llevar">Para llevar</option>
                  </select>
                </td>
                <td className="py-1 px-2 border-b">
                  <input type="text" name="notas" value={item.notas} onChange={(e) => handleRowChange(index, e)} className="w-full p-1 border rounded" />
                </td>
                <td className="py-1 px-2 border-b">
                  <button onClick={() => handleDeleteRow(index)} className="text-red-500 hover:text-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MenuDelDiaList;