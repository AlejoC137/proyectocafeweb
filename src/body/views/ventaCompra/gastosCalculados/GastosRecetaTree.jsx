import React, { useState } from 'react';
import { ChefHat, ChevronDown, ChevronRight, Factory, Package, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../ModelComponents';

const TreeNode = ({ node, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isInternal = node.type === 'internal';
  const isRaw = node.type === 'raw';
  const isMenu = node.type === 'menu_product';

  const indentPx = level * 20;

  const handleOpenBoxModal = (e) => {
    e.stopPropagation();
    if (isRaw && node.id) {
      window.open(`/item/${node.id}`, '_blank');
    } else if ((isInternal || isMenu) && node.recipeId) {
      window.open(`/receta/${node.recipeId}`, '_blank');
    } else if (node.id) {
      window.open(`/item/${node.id}`, '_blank');
    }
  };

  return (
    <div className="font-sans border-b border-gray-100 last:border-0">
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`flex flex-wrap items-center justify-between p-2.5 hover:bg-gray-50 transition-colors ${
          hasChildren ? 'cursor-pointer' : ''
        } ${level === 0 ? 'bg-blue-50/30 font-bold' : ''}`}
        style={{ paddingLeft: `${Math.max(12, indentPx)}px` }}
      >
        <div className="flex items-center gap-2 min-w-[220px]">
          {hasChildren ? (
            <span className="text-gray-400 p-0.5 hover:bg-gray-200 rounded">
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          ) : (
            <span className="w-4"></span>
          )}

          {isMenu && <Package size={16} className="text-blue-600" />}
          {isInternal && <Factory size={16} className="text-purple-600" />}
          {isRaw && <ChefHat size={16} className="text-orange-500" />}

          <span className={`text-sm ${isMenu ? 'font-bold text-gray-900' : isInternal ? 'font-bold text-purple-900' : 'text-gray-700'}`}>
            {node.name}
          </span>

          {/* Box Icon Button to Open Item or Recipe Modal */}
          <button
            onClick={handleOpenBoxModal}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={isRaw ? `Abrir Ítem (/item/${node.id})` : `Abrir Receta (/receta/${node.recipeId || node.id})`}
          >
            <Package size={15} />
          </button>

          {isInternal && (
            <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              Sub-receta Interna
            </span>
          )}

          {!node.recipeFound && level > 0 && isInternal && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1">
              <AlertCircle size={10} /> Sin Receta Registrada
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 text-xs text-right">
          {/* Quantities */}
          <div className="min-w-[120px]">
            <span className="text-gray-400 block text-[10px] uppercase">
              {level === 0 ? 'Ventas / Lotes' : 'Cant. Requerida'}
            </span>
            <span className="font-semibold text-gray-700">
              {node.totalQuantity ? node.totalQuantity.toLocaleString('es-CO', { maximumFractionDigits: 3 }) : node.multiplier}{' '}
              <span className="text-gray-400 font-normal">{node.unit}</span>
            </span>
          </div>

          {/* Unit Cost */}
          <div className="min-w-[90px]">
            <span className="text-gray-400 block text-[10px] uppercase">Costo Unit.</span>
            <span className="font-medium text-gray-600">{formatCurrency(node.unitPrice || node.unitCost)}</span>
          </div>

          {/* Subtotal Cost */}
          <div className="min-w-[110px]">
            <span className="text-gray-400 block text-[10px] uppercase">Gasto Subtotal</span>
            <span className={`font-bold ${level === 0 ? 'text-blue-700 text-sm' : isInternal ? 'text-purple-700' : 'text-orange-600'}`}>
              {formatCurrency(node.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Recursive Children Nodes */}
      {isOpen && hasChildren && (
        <div className="border-l-2 border-purple-100 ml-4">
          {node.children.map((child, index) => (
            <TreeNode key={`${child.id}_${index}`} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const GastosRecetaTree = ({ recipeTrees }) => {
  if (!recipeTrees || recipeTrees.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-400">
        No hay recetas para mostrar.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans space-y-4">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Factory className="text-purple-600" size={20} />
          Desglose Jerárquico N-Niveles de Recetas y Producciones Internas
        </h2>
        <p className="text-xs text-gray-500">
          Haz clic en el ícono de caja <Package size={14} className="inline text-blue-600" /> para abrir el modal de ítem o receta.
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {recipeTrees.map((tree, idx) => (
          <TreeNode key={idx} node={tree} level={0} />
        ))}
      </div>
    </div>
  );
};

export default GastosRecetaTree;
