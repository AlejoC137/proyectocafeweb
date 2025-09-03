import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { InventoryInstanceCard } from '../base/InstanceCard';
import { useInventoryForm } from '../hooks/useInstanceForm';
import { useInventoryActions } from '../hooks/useInstanceActions';
import { useStockField, useAlmacenamientoField } from '../hooks/useJSONField';
import { InventoryStatusButtons } from '../base/StatusButtons';
import { getRecepie, getProveedor, setSelectedProviderId } from '../../../redux/actions-Proveedores';
import { CATEGORIES, BODEGA, ESTATUS, ItemsAlmacen, ProduccionInterna, unidades } from '../../../redux/actions-types';
import RecepieOptions from '../../../body/components/recepieOptions/RecepieOptions';

/**
 * Componente InventoryInstance refactorizado usando la nueva arquitectura
 * Versión CRUD completa para gestión de inventario
 */
export function InventoryInstanceNew({ product, currentType }) {
  const dispatch = useDispatch();
  const Proveedores = useSelector((state) => state.Proveedores || []);
  const showEdit = useSelector((state) => state.showEdit);

  // Usar hooks de la nueva arquitectura
  const { formData, handleChange, isDirty, markAsSaved } = useInventoryForm(product);
  const { 
    handleUpdate, 
    handleDelete, 
    handleStatusChange,
    buttonState,
    canSave,
    canDelete
  } = useInventoryActions(product._id, {
    onSuccess: (action) => {
      if (action === 'update') {
        markAsSaved();
        // Eliminar window.reload - usamos el estado local
      }
    },
    reloadOnSuccess: false, // Ya no recargar la página
    showAlerts: true
  });

  // Usar hooks especializados para campos JSON
  const stock = useStockField(product.STOCK);
  const almacenamiento = useAlmacenamientoField(product.ALMACENAMIENTO);

  // Estados locales específicos
  const [receta, setReceta] = React.useState(null);
  const [provData, setProvData] = React.useState({ Proveedor_Name: '' });
  const [book, setBook] = React.useState("📕");

  // Efectos para cargar datos relacionados
  useEffect(() => {
    const fetchReceta = async () => {
      if (product.Receta) {
        const result = await getRecepie(product.Receta, "RecetasProduccion");
        setReceta(result);
      }
    };
    fetchReceta();
  }, [product.Receta]);

  useEffect(() => {
    if (currentType === ItemsAlmacen) {
      const fetchProveedor = async () => {
        if (product.Proveedor) {
          const result = await getProveedor(product.Proveedor);
          if (result) {
            setProvData(prev => ({
              ...prev,
              Proveedor_Name: result.Nombre_Proveedor,
            }));
          }
        }
      };
      fetchProveedor();
    }
  }, [product.Proveedor, currentType]);

  // Manejar cambios en proveedor
  const handleProviderChange = (e) => {
    const { value } = e.target;
    handleChange(e);
    
    if (value && currentType === ItemsAlmacen) {
      const selectedProvider = Proveedores.find(proveedor => proveedor._id === value);
      if (selectedProvider) {
        dispatch(setSelectedProviderId(selectedProvider._id));
      }
    }
  };

  // Función para guardar con datos completos
  const onSave = async () => {
    const updatedFields = {
      ...formData,
      STOCK: stock.stringifyValue,
      ALMACENAMIENTO: almacenamiento.stringifyValue,
      ...(currentType === ItemsAlmacen && { COOR: "1.05" }),
    };
    
    await handleUpdate(updatedFields);
  };

  // Toggle para mostrar/ocultar receta
  const handleRecepie = () => {
    setBook(prev => prev === '📕' ? '📖' : '📕');
  };

  // Obtener estados filtrados según tipo
  const filteredEstatus = ESTATUS.filter(status => {
    if (currentType === "ProduccionInterna" && status === "PC") return false;
    if (currentType === "ItemsAlmacen" && status === "PP") return false;
    return true;
  });

  // Contenido principal del formulario
  const inventoryForm = (
    <div className="space-y-4">
      
      {/* Campos de Stock */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          Stock Mínimo:
          <input
            type="text"
            value={stock.value.minimo}
            onChange={(e) => stock.updateField('minimo', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            placeholder={product.STOCK?.minimo || ""}
          />
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Stock Máximo:
          <input
            type="text"
            value={stock.value.maximo}
            onChange={(e) => stock.updateField('maximo', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            placeholder={product.STOCK?.maximo || ""}
          />
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Stock Actual:
          <input
            type="text"
            value={stock.value.actual}
            onChange={(e) => stock.updateField('actual', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            placeholder={product.STOCK?.actual || ""}
          />
        </label>
      </div>

      {/* Campos de Almacenamiento */}
      <div className="flex gap-4">
        <label className="text-sm text-gray-700 flex-1">
          Almacenamiento:
          <select
            value={almacenamiento.value.ALMACENAMIENTO}
            onChange={(e) => almacenamiento.updateField('ALMACENAMIENTO', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          >
            <option value="" disabled>
              {product.ALMACENAMIENTO?.ALMACENAMIENTO 
                ? `Actual: ${product.ALMACENAMIENTO?.ALMACENAMIENTO}` 
                : "Selecciona almacenamiento"}
            </option>
            {BODEGA.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700 flex-1">
          Bodega:
          <select
            value={almacenamiento.value.BODEGA}
            onChange={(e) => almacenamiento.updateField('BODEGA', e.target.value)}
            className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
          >
            <option value="" disabled>
              {product.ALMACENAMIENTO?.BODEGA 
                ? `Actual: ${product.ALMACENAMIENTO?.BODEGA}` 
                : "Selecciona bodega"}
            </option>
            {BODEGA.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Campos editables solo en modo edición */}
      {showEdit && (
        <>
          {/* Nombre del producto */}
          <label className="text-sm text-gray-700 flex-1">
            Nombre del producto:
            <input
              type="text"
              name="Nombre_del_producto"
              value={formData.Nombre_del_producto}
              onChange={handleChange}
              className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
            />
          </label>

          {/* Información de precio y fecha */}
          <div className="flex gap-4">
            {currentType !== ProduccionInterna && (
              <label className="text-sm text-gray-700 flex-1">
                Precio por unidad:
                <div className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                  {product.precioUnitario}
                </div>
              </label>
            )}
            <label className="text-sm text-gray-700 flex-1">
              Última Actualización:
              <div className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1">
                {product.FECHA_ACT}
              </div>
            </label>
          </div>

          {/* Cantidad, Unidades, Costo */}
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1">
              Cantidad:
              <input
                type="text"
                name="CANTIDAD"
                value={formData.CANTIDAD}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Unidades:
              <select
                name="UNIDADES"
                value={formData.UNIDADES}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              >
                <option value="" disabled>
                  {product.UNIDAD ? `Actual: ${product.UNIDAD}` : "Selecciona unidad"}
                </option>
                {unidades.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Costo, Merma, Grupo */}
          <div className="flex gap-4">
            <label className="text-sm text-gray-700 flex-1">
              Costo:
              <input
                type="text"
                name="COSTO"
                value={formData.COSTO}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              % Merma (0.00):
              <input
                type="text"
                name="Merma"
                value={formData.Merma}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm text-gray-700 flex-1">
              Grupo:
              <select
                name="GRUPO"
                value={formData.GRUPO}
                onChange={handleChange}
                className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
              >
                <option value="" disabled>
                  {product.GRUPO ? `Actual: ${product.GRUPO}` : "Selecciona un grupo"}
                </option>
                {CATEGORIES.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {/* Proveedor solo para ItemsAlmacen */}
            {currentType === ItemsAlmacen && (
              <label className="text-sm text-gray-700 flex-1">
                Proveedor:
                <select
                  name="Proveedor"
                  value={formData.Proveedor}
                  onChange={handleProviderChange}
                  className="border bg-slate-50 border-gray-300 rounded px-2 py-1 w-full mt-1"
                >
                  <option value="">
                    {product.Proveedor ? `${provData.Proveedor_Name}` : "Selecciona un Proveedor"}
                  </option>
                  {Proveedores.map(proveedor => (
                    <option key={proveedor._id} value={proveedor._id}>
                      {proveedor.Nombre_Proveedor}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </>
      )}

      {/* Sección de receta para ProduccionInterna */}
      {currentType === ProduccionInterna && book === '📖' && (
        <div className="border-t pt-4">
          <RecepieOptions 
            product={product} 
            Receta={receta} 
            currentType={currentType} 
          />
        </div>
      )}
    </div>
  );

  // Header personalizado para inventario
  const inventoryHeader = currentType === ProduccionInterna ? (
    <button
      onClick={handleRecepie}
      className="bg-yellow-500 text-white hover:bg-yellow-500 px-3 py-1 rounded transition-colors"
    >
      {book}
    </button>
  ) : null;

  return (
    <InventoryInstanceCard
      title={formData.Nombre_del_producto || "Producto sin nombre"}
      subtitle={`${product.precioUnitario || 0} ${product.UNIDADES || ''}`}
      data={product}
      buttonState={buttonState}
      onSave={onSave}
      onDelete={() => handleDelete(currentType)}
      onStatusChange={(status) => handleStatusChange(status, currentType)}
      showActions={true}
      showStatusButtons={true}
      showEdit={showEdit}
      showDelete={showEdit}
      headerSlot={inventoryHeader}
      entityType={currentType}
    >
      {inventoryForm}
    </InventoryInstanceCard>
  );
}
