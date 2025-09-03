import React, { useState } from "react";
import { CardInstanceInventarioMenuLunch } from "@/components/ui/CardInstanceInventarioMenuLunch";
import { useDispatch } from "react-redux";
import { MENU, TARDEO_ALMUERZO } from "../../redux/actions-types";
import { updateItem } from "../../redux/actions";
import AccionesRapidasMenuLunch from "../../body/views/actualizarPrecioUnitario/AccionesRapidasMenuLunch";
import { ViewToggle } from "./viewToggle";

// --- Editor de Componentes del Almuerzo - ESTILO EXCEL PURO ---
const CompLunchEditor = ({ compLunch, onSave, onCancel }) => {
  // Inicializar con estructura vacía si no hay datos
  const initializeCompLunch = () => {
    return {
      fecha: { dia: "", fecha: "" },
      entrada: { nombre: "", descripcion: "" },
      proteina: { nombre: "", descripcion: "" },
      proteina_opcion_2: { nombre: "", descripcion: "" },
      carbohidrato: { nombre: "", descripcion: "" },
      acompanante: { nombre: "", descripcion: "" },
      ensalada: { nombre: "", descripcion: "" },
      bebida: { nombre: "", descripcion: "" },
      lista: [],
      ...compLunch // Sobrescribir con datos existentes si los hay
    };
  };
  
  const [editData, setEditData] = useState(initializeCompLunch);
  
  const updateField = (section, field, value) => {
    setEditData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  const updateListItem = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      lista: prev.lista.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };
  
  const addListItem = () => {
    const newOrder = (editData.lista?.length || 0) + 1;
    setEditData(prev => ({
      ...prev,
      lista: [...(prev.lista || []), {
        order: newOrder,
        nombre: "",
        option: 1,
        pagado: false,
        donde: "acá",
        notas: ""
      }]
    }));
  };
  
  const removeListItem = (index) => {
    setEditData(prev => ({
      ...prev,
      lista: prev.lista.filter((_, i) => i !== index)
    }));
  };
  
  const sections = [
    { key: 'entrada', label: 'Entrada' },
    { key: 'proteina', label: 'Proteína' },
    { key: 'proteina_opcion_2', label: 'Proteína Opción 2' },
    { key: 'carbohidrato', label: 'Carbohidrato' },
    { key: 'acompanante', label: 'Acompañante' },
    { key: 'ensalada', label: 'Ensalada' },
    { key: 'bebida', label: 'Bebida' }
  ];
  
  return (
    <div className="w-full" style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#FFFFFF',
      color: '#000000'
    }}>
      {/* TABLA EXCEL UNIFICADA */}
      <div style={{ 
        border: '2px solid #000000',
        borderCollapse: 'collapse',
        backgroundColor: '#FFFFFF'
      }}>
        
        {/* TABLA MAESTRA - ENCABEZADO PRINCIPAL */}
        <table className="w-full" id="TBL_MASTER_HEADER" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              <th 
                colSpan="4" 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#1E40AF',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  padding: '12px 16px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                📝 EDITOR DE COMPOSICIÓN DEL ALMUERZO - SISTEMA CAFETERÍA v2.0
              </th>
            </tr>
          </thead>
        </table>
        
        {/* TABLA TMP_FECHA - PROGRAMACIÓN TEMPORAL */}
        <table className="w-full" id="TBL_TMP_FECHA" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              <th 
                colSpan="4" 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#E5E7EB',
                  color: '#1F2937',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                📅 TABLA TMP_FECHA - PROGRAMACIÓN TEMPORAL DEL MENÚ
              </th>
            </tr>
            <tr>
              <th 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  textAlign: 'center',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Arial, sans-serif',
                  width: '25%'
                }}
              >
                CAMPO
              </th>
              <th 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  textAlign: 'center',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Arial, sans-serif',
                  width: '75%'
                }}
              >
                VALOR
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                Día
              </td>
              <td 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#FFFFFF',
                  padding: '8px 12px'
                }}
              >
                <input
                  type="text"
                  value={editData.fecha?.dia || ""}
                  onChange={(e) => updateField('fecha', 'dia', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    fontFamily: 'Arial, sans-serif',
                    outline: 'none'
                  }}
                  placeholder="Ej: Lunes"
                />
              </td>
            </tr>
            <tr>
              <td 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                Fecha
              </td>
              <td 
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  backgroundColor: '#FFFFFF',
                  padding: '8px 12px'
                }}
              >
                <input
                  type="date"
                  value={editData.fecha?.fecha || ""}
                  onChange={(e) => updateField('fecha', 'fecha', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    fontFamily: 'Arial, sans-serif',
                    outline: 'none'
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* TABLA MENU_COMP - MATRIZ DE COMPONENTES */}
        <table className="w-full" id="TBL_MENU_COMP" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              <th 
                colSpan="3" 
                className="bg-gray-200 text-gray-800 text-left py-2 px-3 text-sm font-bold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
              >
                🍽️ TABLA MENU_COMP - MATRIZ DE COMPONENTES DEL ALMUERZO
              </th>
            </tr>
            <tr>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '20%' }}
              >
                COMPONENTE
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '35%' }}
              >
                NOMBRE
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '45%' }}
              >
                DESCRIPCIÓN
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map(({ key, label }, index) => (
              <tr key={key}>
                <td 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-gray-900 py-2 px-3 text-xs font-medium`}
                  style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                >
                  {label}
                </td>
                <td 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-2 px-3`}
                  style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                >
                  <input
                    type="text"
                    value={editData[key]?.nombre || ""}
                    onChange={(e) => updateField(key, 'nombre', e.target.value)}
                    className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    placeholder={`Nombre del ${label.toLowerCase()}`}
                  />
                </td>
                <td 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-2 px-3`}
                  style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                >
                  <input
                    type="text"
                    value={editData[key]?.descripcion || ""}
                    onChange={(e) => updateField(key, 'descripcion', e.target.value)}
                    className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    placeholder={`Descripción del ${label.toLowerCase()}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* TABLA ORD_LIST - REGISTRO DE PEDIDOS DINÁMICO */}
        <table className="w-full" id="TBL_ORD_LIST" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              <th 
                colSpan="7" 
                className="bg-gray-200 text-gray-800 py-2 px-3 text-sm font-bold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
              >
                <div className="flex justify-between items-center">
                  <span>📋 TABLA ORD_LIST - REGISTRO DE PEDIDOS DINÁMICO ({editData.lista?.length || 0})</span>
                  <button
                    onClick={addListItem}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs font-semibold"
                    style={{ border: '1px solid #000' }}
                  >
                    + AGREGAR
                  </button>
                </div>
              </th>
            </tr>
            <tr>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '8%' }}
              >
                #
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '25%' }}
              >
                NOMBRE
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '12%' }}
              >
                OPCIÓN
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '10%' }}
              >
                PAGADO
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '15%' }}
              >
                DÓNDE
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '20%' }}
              >
                NOTAS
              </th>
              <th 
                className="bg-gray-100 text-gray-700 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '10%' }}
              >
                ELIMINAR
              </th>
            </tr>
          </thead>
          <tbody>
            {(editData.lista || []).length === 0 ? (
              <tr>
                <td 
                  colSpan="7" 
                  className="bg-yellow-50 text-center py-8 px-4 text-gray-600"
                  style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                >
                  <div className="text-xs">
                    <p className="font-semibold mb-1">⚠️ NO HAY PEDIDOS REGISTRADOS</p>
                    <p>Haz clic en "+ AGREGAR" para añadir el primer pedido</p>
                  </div>
                </td>
              </tr>
            ) : (
              (editData.lista || []).map((item, index) => (
                <tr key={index}>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-center py-2 px-3 text-xs font-mono`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    {item.order}
                  </td>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-2 px-3`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    <input
                      type="text"
                      value={item.nombre}
                      onChange={(e) => updateListItem(index, 'nombre', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                      placeholder="Nombre"
                    />
                  </td>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-2 px-3`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    <select
                      value={item.option}
                      onChange={(e) => updateListItem(index, 'option', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </td>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-center py-2 px-3`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    <input
                      type="checkbox"
                      checked={item.pagado}
                      onChange={(e) => updateListItem(index, 'pagado', e.target.checked)}
                      className="scale-125"
                    />
                    <span className="ml-1 text-xs">
                      {item.pagado ? '✅' : '⏳'}
                    </span>
                  </td>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-2 px-3`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    <input
                      type="text"
                      value={item.donde}
                      onChange={(e) => updateListItem(index, 'donde', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                      placeholder="Ubicación"
                    />
                  </td>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} py-2 px-3`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    <input
                      type="text"
                      value={item.notas}
                      onChange={(e) => updateListItem(index, 'notas', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-0"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                      placeholder="Notas"
                    />
                  </td>
                  <td 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-center py-2 px-3`}
                    style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
                  >
                    <button
                      onClick={() => removeListItem(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs font-bold"
                      style={{ border: '1px solid #000' }}
                      title="Eliminar"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* TABLA RPT_SUMMARY - DASHBOARD DE REPORTES */}
        <table className="w-full" id="TBL_RPT_SUMMARY" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              <th 
                colSpan="4" 
                className="bg-gray-200 text-gray-800 text-left py-2 px-3 text-sm font-bold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
              >
                📊 TABLA RPT_SUMMARY - DASHBOARD DE REPORTES Y MÉTRICAS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td 
                className="bg-blue-50 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '25%' }}
              >
                TOTAL PEDIDOS<br/>
                <span className="text-lg font-bold text-blue-700">{editData.lista?.length || 0}</span>
              </td>
              <td 
                className="bg-green-50 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '25%' }}
              >
                PAGADOS<br/>
                <span className="text-lg font-bold text-green-700">{editData.lista?.filter(p => p.pagado).length || 0}</span>
              </td>
              <td 
                className="bg-red-50 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '25%' }}
              >
                PENDIENTES<br/>
                <span className="text-lg font-bold text-red-700">{editData.lista?.filter(p => !p.pagado).length || 0}</span>
              </td>
              <td 
                className="bg-purple-50 text-center py-2 px-3 text-xs font-semibold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '25%' }}
              >
                COMPONENTES<br/>
                <span className="text-lg font-bold text-purple-700">
                  {sections.filter(s => editData[s.key]?.nombre?.trim()).length}/{sections.length}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* TABLA CTL_ACTION - PANEL DE CONTROL Y ACCIONES */}
        <table className="w-full" id="TBL_CTL_ACTION" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              <th 
                colSpan="4" 
                className="bg-gray-300 text-gray-800 text-center py-2 px-3 text-sm font-bold"
                style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
              >
                ⚙️ TABLA CTL_ACTION - PANEL DE CONTROL Y ACCIONES DEL SISTEMA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td 
                colSpan="4" 
                className="bg-white text-right py-3 px-4"
                style={{ border: '1px solid #000', borderCollapse: 'collapse' }}
              >
                <button
                  onClick={onCancel}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm font-bold mr-3"
                  style={{ border: '1px solid #000' }}
                >
                  ❌ CANCELAR
                </button>
                <button
                  onClick={() => onSave(editData)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-bold"
                  style={{ border: '1px solid #000' }}
                >
                  💾 GUARDAR CAMBIOS
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
      </div>
    </div>
  );
};

// --- Componente de Tabla Interna para Almuerzos ---
const LunchTableView = ({ products, showEdit }) => {
  const dispatch = useDispatch();
  const [editingProduct, setEditingProduct] = useState(null);
  
  const handleSaveCompLunch = (productId, newCompLunch) => {
    dispatch(updateItem(productId, { Comp_Lunch: newCompLunch }, MENU));
    setEditingProduct(null);
  };
  
  const handleCancelEdit = () => {
    setEditingProduct(null);
  };
  
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Header de la tarjeta */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{product.NombreES}</h3>
            {showEdit && editingProduct !== product._id && (
              <button
                onClick={() => setEditingProduct(product._id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                ✏️ Editar Almuerzo
              </button>
            )}
          </div>
          
          {/* Contenido de la tarjeta */}
          <div className="p-6">
            {editingProduct === product._id ? (
              <CompLunchEditor
                compLunch={product.Comp_Lunch}
                onSave={(newData) => handleSaveCompLunch(product._id, newData)}
                onCancel={handleCancelEdit}
              />
            ) : (
              // Verificar si hay datos en Comp_Lunch
              !product.Comp_Lunch || Object.keys(product.Comp_Lunch).length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-600 mb-2">
                    <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-lg font-medium text-yellow-800">Sin Configuración de Almuerzo</p>
                    <p className="text-sm text-yellow-600 mt-1">Este menú no tiene configurados los componentes del almuerzo.</p>
                    <p className="text-xs text-yellow-500 mt-2">Haz clic en "Editar Almuerzo" para agregar la información.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">📅 Fecha:</span>
                    <p className="text-gray-600 mt-1">
                      {product.Comp_Lunch?.fecha?.dia || <span className="text-gray-400 italic">Sin día</span>} 
                      ({product.Comp_Lunch?.fecha?.fecha || <span className="text-gray-400 italic">Sin fecha</span>})
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">🥄 Entrada:</span>
                    <p className="text-gray-600 mt-1">
                      {product.Comp_Lunch?.entrada?.nombre || <span className="text-gray-400 italic">No definida</span>}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">🥩 Proteína:</span>
                    <p className="text-gray-600 mt-1">
                      {product.Comp_Lunch?.proteina?.nombre || <span className="text-gray-400 italic">No definida</span>}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">🍚 Carbohidrato:</span>
                    <p className="text-gray-600 mt-1">
                      {product.Comp_Lunch?.carbohidrato?.nombre || <span className="text-gray-400 italic">No definido</span>}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">🥗 Ensalada:</span>
                    <p className="text-gray-600 mt-1">
                      {product.Comp_Lunch?.ensalada?.nombre || <span className="text-gray-400 italic">No definida</span>}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">🥤 Bebida:</span>
                    <p className="text-gray-600 mt-1">
                      {product.Comp_Lunch?.bebida?.nombre || <span className="text-gray-400 italic">No definida</span>}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">📋 Pedidos:</span>
                    <p className={`mt-1 ${product.Comp_Lunch?.lista?.length > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {product.Comp_Lunch?.lista?.length || 0} personas
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">💰 Pagados:</span>
                    <p className="mt-1">
                      <span className="text-green-600 font-semibold">
                        {product.Comp_Lunch?.lista?.filter(p => p.pagado).length || 0}
                      </span>
                      <span className="text-gray-500"> de {product.Comp_Lunch?.lista?.length || 0}</span>
                    </p>
                  </div>
                </div>
              )
            )
          }
        </div>
      </div>
      ))}
    </div>
  );
};


// --- Componente Principal de la Rejilla de Almuerzos ---
export function CardGridInventarioMenuLunch({ products, showEdit }) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Filtrar productos que son almuerzos
  const lunchProducts = products.filter(
    (product) => product.SUB_GRUPO === TARDEO_ALMUERZO
  );

  // 2. Aplicar búsqueda sobre los almuerzos ya filtrados
  const filteredProducts = lunchProducts.filter((product) =>
    searchTerm === "" ||
    (product.NombreES &&
      product.NombreES.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de herramientas con búsqueda y toggle de vista */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Buscar almuerzos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded-md bg-white w-full max-w-sm shadow-sm"
        />
        {/* <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} /> */}
      </div>

      {/* Acciones rápidas (si el modo edición está activo) */}
      {showEdit && <AccionesRapidasMenuLunch currentType={MENU} />}

      {/* Renderizado condicional de la vista */}
      {filteredProducts.length > 0 ? (
        viewMode === 'table' ? (
          <LunchTableView products={filteredProducts} showEdit={showEdit} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <CardInstanceInventarioMenuLunch
                key={product._id}
                product={product}
                showEdit={showEdit}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
          <p className="text-xl font-semibold">No se encontraron almuerzos</p>
          <p>Prueba a cambiar el término de búsqueda o revisa los filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}