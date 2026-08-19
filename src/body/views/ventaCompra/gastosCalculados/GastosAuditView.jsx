import React from 'react';
import { ShieldAlert, AlertTriangle, FileQuestion, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../ModelComponents';

const GastosAuditView = ({ dbAudit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 font-sans space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldAlert className="text-amber-500" size={24} />
          Auditoría y Diagnóstico de Integridad de la Base de Datos
        </h2>
        <p className="text-sm text-gray-500">
          Inspección en tiempo real de incoherencias en precios, recetas faltantes y vínculos desactualizados en Supabase.
        </p>
      </div>

      {/* Summary Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase">Insumos sin Precio Unitario</p>
            <p className="text-2xl font-bold text-amber-900">{dbAudit.missingPricesCount}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <FileQuestion size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase">Productos Menú sin Receta</p>
            <p className="text-2xl font-bold text-blue-900">{dbAudit.missingRecipesCount}</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <HelpCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase">Sub-recetas sin Vincular</p>
            <p className="text-2xl font-bold text-purple-900">{dbAudit.unlinkedInternalProductionsCount}</p>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="space-y-6">
        {/* Insumos sin precio */}
        {dbAudit.missingPricesInItems.length > 0 && (
          <div className="border border-amber-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-amber-50 border-b border-amber-200 font-bold text-sm text-amber-900 flex justify-between items-center">
              <span>Insumos de Almacén sin precio unitario configurado ({dbAudit.missingPricesInItems.length})</span>
              <span className="text-xs font-normal text-amber-700">Se asume $0 COP en los cálculos</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="p-2 pl-4">ID</th>
                    <th className="p-2">Nombre Insumo</th>
                    <th className="p-2">Grupo</th>
                    <th className="p-2 text-right pr-4">Precio Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dbAudit.missingPricesInItems.map(item => (
                    <tr key={item._id} className="hover:bg-amber-50/40">
                      <td className="p-2 pl-4 font-mono text-gray-400">{item._id.slice(0, 8)}...</td>
                      <td className="p-2 font-bold text-gray-800">{item.Nombre_del_producto || item.Nombre}</td>
                      <td className="p-2 text-gray-500">{item.GRUPO || 'Sin grupo'}</td>
                      <td className="p-2 text-right pr-4 font-bold text-amber-600">{formatCurrency(item.precioUnitario || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Productos sin receta */}
        {dbAudit.missingRecipesInMenu.length > 0 && (
          <div className="border border-blue-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-blue-50 border-b border-blue-200 font-bold text-sm text-blue-900 flex justify-between items-center">
              <span>Productos del Menú sin receta asociada ({dbAudit.missingRecipesInMenu.length})</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="p-2 pl-4">ID</th>
                    <th className="p-2">Producto Menú</th>
                    <th className="p-2">Grupo / Categoría</th>
                    <th className="p-2 text-right pr-4">Precio Menú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dbAudit.missingRecipesInMenu.map(item => (
                    <tr key={item._id} className="hover:bg-blue-50/40">
                      <td className="p-2 pl-4 font-mono text-gray-400">{item._id.slice(0, 8)}...</td>
                      <td className="p-2 font-bold text-gray-800">{item.NombreES}</td>
                      <td className="p-2 text-gray-500">{item.GRUPO || item.CATEGORIA || 'Sin grupo'}</td>
                      <td className="p-2 text-right pr-4 font-bold text-gray-700">{formatCurrency(item.Precio || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GastosAuditView;
