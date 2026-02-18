import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Barcode from 'react-barcode';
import { Printer, Edit, List, ShoppingCart, Hammer } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CardInstanceInventario } from '@/components/ui/cardInstanceInventario';
import { Button } from '@/components/ui/button';
import { getAllFromTable } from '../../../redux/actions';
import { ItemsAlmacen, ProduccionInterna, ITEMS, PRODUCCION, PROVEE, OK, PC, PP } from "../../../redux/actions-types";
import { updateItem } from '../../../redux/actions-Proveedores';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../../utils/toast';

const BarcodeManager = () => {
    const dispatch = useDispatch();
    const itemsAlmacen = useSelector((state) => state.allItems || []);
    const itemsProduccion = useSelector((state) => state.allProduccion || []);

    // Cargar datos si no existen o al montar
    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([
                    dispatch(getAllFromTable(ITEMS)),
                    dispatch(getAllFromTable(PRODUCCION)),
                    dispatch(getAllFromTable(PROVEE)) // Necesario para editar items
                ]);
            } catch (error) {
                console.error("Error loading inventory data:", error);
            }
        };
        fetchData();
    }, [dispatch]);

    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // VIEW = Ver Lista/Detalles, PC = Pendiente Compra, PP = Pendiente Producción
    const [scanMode, setScanMode] = useState('VIEW');
    const bufferRef = useRef('');
    const lastKeyTimeRef = useRef(Date.now());

    // Combinar listas con identificador de tipo
    const allStock = [
        ...itemsAlmacen.map(i => ({ ...i, _sourceType: ItemsAlmacen })),
        ...itemsProduccion.map(i => ({ ...i, _sourceType: ProduccionInterna }))
    ];

    // Barcode Scanner Listener
    useEffect(() => {
        const handleKeyDown = async (e) => {
            // Ignorar si el foco está en un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const char = e.key;
            const currentTime = Date.now();

            // Si pasa mucho tiempo entre teclas, reiniciar buffer (diferenciar manual vs scanner)
            if (currentTime - lastKeyTimeRef.current > 100) {
                bufferRef.current = '';
            }
            lastKeyTimeRef.current = currentTime;

            if (char === 'Enter') {
                const scannedCode = bufferRef.current;
                bufferRef.current = ''; // Reset immediately

                if (scannedCode) {
                    processScan(scannedCode);
                }
            } else if (char.length === 1) {
                bufferRef.current += char;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scanMode, allStock]); // Re-bind if mode changes or stock updates (though allStock ref helps)

    const processScan = async (code) => {
        // Find item by matching the start of the ID (since we only encode the first 12 chars)
        const item = allStock.find(i => i._id.startsWith(code) || i._id === code);

        if (!item) {
            showErrorToast(`Ítem no encontrado: ${code}`);
            return;
        }

        if (scanMode === 'VIEW') {
            handleCardClick(item);
            showInfoToast(`Visualizando: ${item.Nombre_del_producto}`);
        } else if (scanMode === 'PC') {
            await updateItemStatus(item, PC, 'Pendiente de Compra');
        } else if (scanMode === 'PP') {
            await updateItemStatus(item, PP, 'Pendiente de Producción');
        }
    };

    const updateItemStatus = async (item, status, statusLabel) => {
        try {
            await dispatch(updateItem(
                item._id,
                { Estado: status },
                item._sourceType
            ));
            showSuccessToast(`${item.Nombre_del_producto} marcado como ${statusLabel}`);
        } catch (error) {
            console.error(error);
            showErrorToast(`Error actualizando ${item.Nombre_del_producto}`);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCardClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const getModeButtonClass = (mode, current) => {
        const base = "flex-1 py-4 flex flex-col items-center justify-center gap-2 transition-all border-b-4 ";
        if (mode === current) {
            return base + "bg-blue-50 border-blue-600 text-blue-700 shadow-inner";
        }
        return base + "bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700";
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen relative">
            {/* Estilos de Impresión */}
            <style>{`
        @media print {
          @page { size: letter; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact; 
            background-color: white !important;
            margin: 0;
            padding: 0;
          }
          
          /* Hide User Interface elements and layout spacers */
          .no-print, header, nav, .absolute.inset-0, br { display: none !important; }
          
          /* Remove App layout padding/margins if any */
          .p-4 { padding: 0 !important; }
          .min-h-screen { min-height: 0 !important; }
          .bg-gray-50 { background-color: white !important; }

          .print-container { 
            display: grid !important; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 4px; 
            padding: 10px;
            width: 100%;
            margin: 0;
          }
          .micro-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #ddd; /* Visual border for print */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center; /* Center content vertically */
            gap: 0px; /* Minimal gap */
            padding: 2px;
            height: 115px; /* Adjusted for ~9 rows per page */
            width: 100%;
            background-color: white !important;
          }
           /* Hide scrollbars etc */
           body { overflow: hidden; }
        }
      `}</style>

            {/* Mode Selector - Sticky Top */}
            <div className="sticky top-0 z-40 bg-white shadow-md mb-6 rounded-lg overflow-hidden flex no-print">
                <button
                    onClick={() => setScanMode('VIEW')}
                    className={getModeButtonClass('VIEW', scanMode)}
                >
                    <List size={24} />
                    <span className="font-bold text-sm">Ver Lista</span>
                    {scanMode === 'VIEW' && <span className="text-xs text-blue-500 animate-pulse">Escáner busca ítem</span>}
                </button>
                <button
                    onClick={() => setScanMode('PC')}
                    className={getModeButtonClass('PC', scanMode)}
                >
                    <ShoppingCart size={24} />
                    <span className="font-bold text-sm">Pendiente Compra</span>
                    {scanMode === 'PC' && <span className="text-xs text-blue-500 animate-pulse">Escáner marca como PC</span>}
                </button>
                <button
                    onClick={() => setScanMode('PP')}
                    className={getModeButtonClass('PP', scanMode)}
                >
                    <Hammer size={24} />
                    <span className="font-bold text-sm">Pendiente Producción</span>
                    {scanMode === 'PP' && <span className="text-xs text-blue-500 animate-pulse">Escáner marca como PP</span>}
                </button>
            </div>

            {/* Botón Flotante */}
            <div className="fixed bottom-6 right-6 z-50 no-print">
                <Button
                    onClick={handlePrint}
                    className="rounded-full h-14 w-14 shadow-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-transform hover:scale-110"
                >
                    <Printer size={24} />
                </Button>
            </div>

            {/* Header (Oculto al imprimir) */}
            <div className="mb-6 flex justify-between items-center no-print px-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Inventario QR</h1>
                    <p className="text-xs text-gray-500">Modo actual: <span className="font-bold">{scanMode === 'VIEW' ? 'Ver' : scanMode}</span></p>
                </div>
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded shadow-sm">
                    Total: {allStock.length}
                </span>
            </div>

            {/* Grid Contenedor */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 print-container pb-20">
                {allStock.map((item, idx) => {
                    // Fallback para ID si no existe
                    const itemId = item._id || `NO-ID-${idx}`;
                    // Usar solo los primeros 12 caracteres para el código de barras
                    const barcodeValue = itemId.slice(0, 12).toUpperCase();

                    const itemName = item.Nombre_del_producto || "Sin Nombre";
                    const status = item.Estado;

                    // Color indicator based on status
                    let statusColor = "border-gray-200";
                    if (status === PC) statusColor = "border-orange-400 bg-orange-50";
                    if (status === PP) statusColor = "border-purple-400 bg-purple-50";

                    return (
                        <div
                            key={itemId}
                            onClick={() => handleCardClick(item)}
                            className={`micro-card rounded border ${statusColor} hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-0 p-1 h-[115px] w-full relative overflow-hidden group`}
                        >
                            {/* Status Indicators (Corner badges) */}
                            {status === PC && <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-bl-lg z-20" />}
                            {status === PP && <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-bl-lg z-20" />}

                            {/* Nombre Arriba - Ultra Compacto */}
                            <span className="text-xs font-bold text-center leading-none line-clamp-2 w-full px-1 z-10 mb-0.5">
                                {itemName}
                            </span>

                            {/* Código de Barras Centro */}
                            <div className="flex items-center justify-center w-full">
                                <Barcode
                                    value={barcodeValue}
                                    width={1.5}
                                    height={35}
                                    format="CODE128"
                                    displayValue={false}
                                    margin={10}
                                    background="transparent"
                                />
                            </div>

                            {/* ID Abajo */}
                            <span className="text-[10px] text-gray-500 font-mono tracking-wider z-10 mt-0.5 leading-none">
                                {barcodeValue}
                            </span>

                            {/* Hover Overlay Hint */}
                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors pointer-events-none" />
                        </div>
                    );
                })}
            </div>

            {/* Modal de Edición Rápida */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto no-print">
                    {selectedItem && (
                        <div className="relative">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edición Rápida: {selectedItem.Nombre_del_producto}
                            </h2>

                            <CardInstanceInventario
                                product={selectedItem}
                                currentType={selectedItem._sourceType}
                            />

                            <div className="mt-4 flex justify-end">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BarcodeManager;
