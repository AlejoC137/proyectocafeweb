import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { marked } from 'marked';
import { PlusCircle, Trash2, Download, Copy, FileText } from 'lucide-react';

const CotizacionesView = () => {
  const allItems = useSelector(state => state.allItems) || [];
  const allRecetasMenu = useSelector(state => state.allRecetasMenu) || [];
  const allRecetasProduccion = useSelector(state => state.allRecetasProduccion) || [];

  const [selectedItems, setSelectedItems] = useState([]);
  const [markdownText, setMarkdownText] = useState('# Cotización Formal\n\nEstimado cliente,\n\nA continuación presentamos la cotización solicitada:\n\n');
  const [itemType, setItemType] = useState('item'); // 'item', 'menu', 'produccion'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Opciones dependiendo del tipo
  const options = useMemo(() => {
    if (itemType === 'item') return allItems;
    if (itemType === 'menu') return allRecetasMenu;
    if (itemType === 'produccion') return allRecetasProduccion;
    return [];
  }, [itemType, allItems, allRecetasMenu, allRecetasProduccion]);

  const handleAddItem = () => {
    if (!selectedItemId) return;
    const option = options.find(o => String(o._id) === String(selectedItemId));
    if (!option) return;

    const price = option.precio_venta || option.precioUnitario || option.costo || 0;
    
    const newItem = {
      id: option._id,
      name: option.nombre || option.Item || 'Item sin nombre',
      type: itemType,
      quantity: Number(quantity),
      unitPrice: Number(price),
      totalPrice: Number(price) * Number(quantity)
    };

    setSelectedItems([...selectedItems, newItem]);
    
    // Auto-update markdown
    const itemMarkdown = `- **${newItem.quantity}x ${newItem.name}** - $${newItem.totalPrice.toLocaleString()}\n`;
    setMarkdownText(prev => prev + itemMarkdown);
    
    setSelectedItemId('');
    setQuantity(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const jsonPrompt = useMemo(() => {
    const promptData = {
      instructions: "Eres un asistente de ventas experto. Genera una cotización formal y persuasiva utilizando los siguientes datos. Formatea la salida en Markdown puro, listo para ser entregado al cliente.",
      cliente: "Nombre del Cliente (Reemplazar)",
      items: selectedItems,
      total: selectedItems.reduce((acc, curr) => acc + curr.totalPrice, 0)
    };
    return JSON.stringify(promptData, null, 2);
  }, [selectedItems]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonPrompt);
    alert('Prompt JSON copiado al portapapeles!');
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cotizacion.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMarkdown = () => {
    return { __html: marked.parse(markdownText) };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-white"><FileText /> Creador de Cotizaciones</h1>
        <button 
          onClick={handleDownloadMd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
        >
          <Download size={18} /> Descargar .md
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado izquierdo: Selección y JSON */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">1. Agregar Ítems o Recetas</h2>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  className={`py-2 px-3 text-sm rounded ${itemType === 'item' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => { setItemType('item'); setSelectedItemId(''); }}
                >
                  Ítems Almacén
                </button>
                <button 
                  className={`py-2 px-3 text-sm rounded ${itemType === 'menu' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => { setItemType('menu'); setSelectedItemId(''); }}
                >
                  Recetas Menú
                </button>
                <button 
                  className={`py-2 px-3 text-sm rounded ${itemType === 'produccion' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => { setItemType('produccion'); setSelectedItemId(''); }}
                >
                  Recetas Producción
                </button>
              </div>

              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-gray-700 text-white border-gray-600 rounded p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {options.map(opt => (
                    <option key={opt._id} value={opt._id}>
                      {opt.nombre || opt.Item} - ${(opt.precio_venta || opt.precioUnitario || opt.costo || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-20 bg-gray-700 text-white border-gray-600 rounded p-2 focus:ring-blue-500 outline-none"
                  placeholder="Cant."
                />
                <button 
                  onClick={handleAddItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center transition"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-300 mb-2">Ítems Seleccionados:</h3>
                <ul className="space-y-2">
                  {selectedItems.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{item.quantity}x {item.name}</span>
                        <span className="text-xs text-gray-400 capitalize">{item.type} | c/u ${item.unitPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-green-400 font-semibold">${item.totalPrice.toLocaleString()}</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-300 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between items-center">
                  <span className="text-xl font-bold text-white">Total:</span>
                  <span className="text-xl font-bold text-green-400">
                    ${selectedItems.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">2. Prompt JSON</h2>
              <button 
                onClick={handleCopyJson}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded transition text-sm"
              >
                <Copy size={14} /> Copiar Prompt
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Copia este bloque de JSON y pégalo en tu IA favorita (ChatGPT, Claude) para generar automáticamente un texto de cotización excelente en formato Markdown.
            </p>
            <pre className="bg-gray-900 p-4 rounded text-green-400 text-sm overflow-x-auto max-h-60 overflow-y-auto">
              {jsonPrompt}
            </pre>
          </div>
        </div>

        {/* Lado derecho: Editor Markdown */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-800 flex flex-col h-full rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-900 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">3. Editor Markdown</h2>
              <p className="text-xs text-gray-400">Edita la cotización aquí o pega el resultado de tu IA.</p>
            </div>
            
            <div className="grid grid-rows-2 h-full lg:min-h-[600px]">
              {/* Editor */}
              <div className="border-b border-gray-700 h-full p-0">
                <textarea 
                  className="w-full h-full bg-gray-800 text-gray-200 p-4 outline-none resize-none font-mono text-sm"
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="Escribe aquí tu Markdown..."
                ></textarea>
              </div>
              
              {/* Preview */}
              <div className="bg-gray-900 p-6 overflow-y-auto h-full text-gray-200 prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={renderMarkdown()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotizacionesView;
