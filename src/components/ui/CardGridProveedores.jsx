import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateProveedor, deleteProveedor, copiarAlPortapapeles } from "../../redux/actions-Proveedores";
import * as XLSX from 'xlsx'; // Importación para la funcionalidad de Excel

// Componente reutilizable para campos editables, mantiene el código más limpio.
const EditableField = ({ label, name, value, isEditing, onChange }) => (
  <label className="text-sm text-gray-700 flex-1">
    {label}:
    {isEditing ? (
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    ) : (
      <p className="border bg-slate-50 border-gray-200 rounded px-2 py-1 w-full mt-1 min-h-[34px] flex items-center">
        {value || <span className="text-gray-400">No disponible</span>}
      </p>
    )}
  </label>
);

// Componente encapsulado para una única tarjeta de proveedor.
const ProveedorCard = React.memo(({ proveedor }) => {
  const dispatch = useDispatch();
  const showEdit = useSelector((state) => state.showEdit);
  const allItems = useSelector((state) => state.allItems || []);
  const allProveedores = useSelector((state) => state.Proveedores || []);

  // Estados locales
  const [formData, setFormData] = useState({});
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [deleteStatus, setDeleteStatus] = useState('idle');
  const [arePropertiesVisible, setArePropertiesVisible] = useState(false);
  const [isPendingItemsVisible, setIsPendingItemsVisible] = useState(false);
  const [isAllItemsVisible, setIsAllItemsVisible] = useState(false);

  const allAssociatedItems = allItems.filter(item => item.Proveedor === proveedor._id);
  const pendingItems = allAssociatedItems.filter(item => item.Estado === "PC");

  // --- NUEVA FUNCIÓN PARA EXPORTAR A EXCEL ---
  const handleExportToExcel = () => {
    // 1. Lista completa de headers para el archivo Excel
    const headers = [
      "_id", "Nombre_del_producto", "CANTIDAD", "STOCK", "UNIDADES", "Estado", "Area",
      "GRUPO", "COSTO", "precioUnitario", "ALMACENAMIENTO", "COOR",
      "FECHA_ACT", "MARCA", "Merma", "Proveedor"
    ];

    // 2. Mapear los datos para asegurar que todas las propiedades existan
    const dataToExport = allAssociatedItems.map(item => {
      let row = {};
      headers.forEach(header => {
        row[header] = item[header] ?? "N/A"; // Usar 'N/A' para valores nulos o indefinidos
      });
      return row;
    });

    // 3. Crear la hoja de cálculo y el libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    // 4. (Opcional) Ajustar el ancho de las columnas
    const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
    worksheet["!cols"] = colWidths;

    // 5. Generar y descargar el archivo
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Productos_${proveedor.Nombre_Proveedor}_${date}.xlsx`);
  };
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (updateStatus !== 'idle') setUpdateStatus('idle');
  }, [updateStatus]);

  const handleUpdate = async () => {
    if (Object.keys(formData).length === 0) return;
    setUpdateStatus('loading');
    try {
      await dispatch(updateProveedor(proveedor._id, formData));
      setUpdateStatus('success');
      setFormData({});
      setTimeout(() => setUpdateStatus('idle'), 2000);
    } catch (error) { console.error("Error al actualizar:", error); setUpdateStatus('idle'); }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar a ${proveedor.Nombre_Proveedor}?`)) {
      setDeleteStatus('loading');
      try {
        await dispatch(deleteProveedor(proveedor._id));
        setDeleteStatus('success');
      } catch (error) { console.error("Error al eliminar:", error); alert("Hubo un error al eliminar el proveedor."); setDeleteStatus('idle'); }
    }
  };

  const handleCopyPending = async () => {
    if (pendingItems.length === 0) {
      alert("Este proveedor no tiene productos pendientes de compra.");
      return;
    }
    try {
      await dispatch(copiarAlPortapapeles(pendingItems, "PC", "Proveedor", allProveedores));
      alert("Productos pendientes copiados al portapapeles.");
    } catch (error) { console.error("Error al copiar:", error); alert("Hubo un error al copiar los productos."); }
  };

  const getButtonContent = (status, icons) => {
    if (status === 'loading') return icons.loading;
    if (status === 'success') return icons.success;
    return icons.idle;
  };

  return (
    <Card className="w-full shadow-md rounded-lg overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Encabezado de la tarjeta con acciones */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-800 flex-1 min-w-[150px]">{proveedor.Nombre_Proveedor || "Proveedor sin nombre"}</h3>
          <div className="flex items-center gap-2">
            {showEdit && (<Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleteStatus === 'loading'}>{getButtonContent(deleteStatus, { idle: '🧨', loading: '💢', success: '💥' })}</Button>)}
            <Button className="bg-blue-500 text-white hover:bg-blue-600" size="icon" onClick={handleUpdate} disabled={Object.keys(formData).length === 0 || updateStatus !== 'idle'}>{getButtonContent(updateStatus, { idle: '💾', loading: '🔄', success: '✅' })}</Button>
            <Button className="bg-green-500 text-white hover:bg-green-600" size="icon" onClick={handleCopyPending}>📋</Button>
            <Button className="bg-yellow-500 text-white hover:bg-yellow-600" size="icon" onClick={() => setIsPendingItemsVisible(p => !p)}>{isPendingItemsVisible ? "📤" : "📥"}</Button>
            <Button className="bg-teal-500 text-white hover:bg-teal-600" size="icon" onClick={() => setIsAllItemsVisible(p => !p)}>📦</Button>
            <Button className="bg-purple-500 text-white hover:bg-purple-600" size="icon" onClick={() => setArePropertiesVisible(p => !p)}>📂</Button>
          </div>
        </div>

        {/* Sección de propiedades del proveedor */}
        {arePropertiesVisible && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 animate-fade-in"><EditableField label="Nombre del Proveedor" name="Nombre_Proveedor" value={formData.Nombre_Proveedor ?? proveedor.Nombre_Proveedor} isEditing={showEdit} onChange={handleInputChange} /><EditableField label="Contacto Nombre" name="Contacto_Nombre" value={formData.Contacto_Nombre ?? proveedor.Contacto_Nombre} isEditing={showEdit} onChange={handleInputChange} /><EditableField label="Contacto Número" name="Contacto_Numero" value={formData.Contacto_Numero ?? proveedor.Contacto_Numero} isEditing={showEdit} onChange={handleInputChange} /><EditableField label="Dirección" name="Direccion" value={formData.Direccion ?? proveedor.Direccion} isEditing={showEdit} onChange={handleInputChange} /><EditableField label="NIT/CC" name="NIT/CC" value={formData["NIT/CC"] ?? proveedor["NIT/CC"]} isEditing={showEdit} onChange={handleInputChange} /><EditableField label="Página Web" name="PAGINA_WEB" value={formData.PAGINA_WEB ?? proveedor.PAGINA_WEB} isEditing={showEdit} onChange={handleInputChange} /></div>)}

        {/* Sección de productos PENDIENTES */}
        {isPendingItemsVisible && (<div className="mt-2 border-t pt-4 animate-fade-in"><h4 className="text-md font-semibold text-gray-800">Productos Pendientes ({pendingItems.length})</h4>{pendingItems.length > 0 ? (<ul className="list-disc list-inside mt-2 text-sm text-gray-600 max-h-40 overflow-y-auto">{pendingItems.map((item) => (<li key={item._id}>{item.Nombre_del_producto}: {item.CANTIDAD} {item.UNIDADES}</li>))}</ul>) : (<p className="text-sm text-gray-500 mt-2">No hay productos pendientes.</p>)}</div>)}
        
        {/* --- NUEVA SECCIÓN DE TODOS LOS PRODUCTOS EN FORMATO TABLA --- */}
        {isAllItemsVisible && (
          <div className="mt-2 border-t pt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
              <h4 className="text-md font-semibold text-gray-800">Todos los Productos ({allAssociatedItems.length})</h4>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1 text-sm" onClick={handleExportToExcel} disabled={allAssociatedItems.length === 0}>
                📥 Descargar Excel
              </Button>
            </div>
            {allAssociatedItems.length > 0 ? (
              <div className="overflow-x-auto max-h-96 border rounded-lg">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-2">Nombre del Producto</th>
                      <th scope="col" className="px-4 py-2">Cantidad</th>
                      <th scope="col" className="px-4 py-2">Stock</th>
                      <th scope="col" className="px-4 py-2">Estado</th>
                      <th scope="col" className="px-4 py-2">Grupo</th>
                      <th scope="col" className="px-4 py-2">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAssociatedItems.map(item => (
                      <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{item.Nombre_del_producto ?? "N/A"}</td>
                        <td className="px-4 py-2">{item.CANTIDAD ?? "N/A"}</td>
                        <td className="px-4 py-2">{item.STOCK ?? "N/A"}</td>
                        <td className="px-4 py-2">{item.Estado ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{item.Estado}</span> : "N/A"}</td>
                        <td className="px-4 py-2">{item.GRUPO ?? "N/A"}</td>
                        <td className="px-4 py-2">{item.COSTO ?? "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No hay productos asociados a este proveedor.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Componente principal que renderiza la grilla de tarjetas
export function CardGridProveedores() {
  const proveedores = useSelector((state) => state.Proveedores || []);

  if (proveedores.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-16 p-6 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No se encontraron proveedores</h3>
        <p className="text-md mt-2">Puedes agregar un nuevo proveedor usando las acciones rápidas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {proveedores.map((proveedor) => (
        <ProveedorCard key={proveedor._id} proveedor={proveedor} />
      ))}
    </div>
  );
}