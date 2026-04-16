import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable } from '../../../redux/actions';
import { ITEMS, PRODUCCION } from '../../../redux/actions-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Asumiendo que usas shadcn o similar
import { AlertCircle, Database, Search, ClipboardList } from 'lucide-react';
import UniversalScraper from './UniversalScraper';

function BuscarPreciosInternet() {
  const dispatch = useDispatch();
  const allItems = useSelector(state => state.allItems);
  const [itemsConCostoNaN, setItemsConCostoNaN] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const itemsNaN = allItems
      .filter(item => isNaN(parseFloat(item.COSTO)))
      .map(item => ({
        _id: item._id,
        Nombre_del_producto: item.Nombre_del_producto,
        Proveedor: item.Proveedor,
        CANTIDAD: item.CANTIDAD,
        UNIDADES: item.UNIDADES,
        COSTO: item.COSTO,
        COOR: item.COOR
      }));
    setItemsConCostoNaN(itemsNaN);
  }, [allItems]);

  const handleCopyGroupToClipboard = (grupo) => {
    const jsonText = JSON.stringify(grupo, null, 2);
    navigator.clipboard.writeText(jsonText)
      .then(() => alert('Grupo copiado al portapapeles'))
      .catch(err => console.error('Error al copiar:', err));
  };

  const dividirEnGrupos = (array, tamaño) => {
    const grupos = [];
    for (let i = 0; i < array.length; i += tamaño) {
      grupos.push(array.slice(i, i + tamaño));
    }
    return grupos;
  };

  const gruposDeItems = dividirEnGrupos(itemsConCostoNaN, 5);

  return (
    <div className='min-h-screen bg-transparent p-4 md:p-8'>
      
      <Tabs defaultValue="scraper" className="w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className='text-3xl font-black text-slate-800 tracking-tight'>Inteligencia de Precios</h1>
            <p className='text-slate-500'>Gestiona y extrae información de costos de manera universal.</p>
          </div>
          
          <TabsList className="bg-white/50 backdrop-blur shadow-inner p-1 rounded-2xl border border-white">
            <TabsTrigger value="scraper" className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all flex items-center gap-2">
              <Search size={16} /> Extractor Universal
            </TabsTrigger>
            <TabsTrigger value="nan" className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all flex items-center gap-2">
              <AlertCircle size={16} /> Items Pendientes ({itemsConCostoNaN.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="scraper" className="mt-0 outline-none">
          <UniversalScraper allItems={allItems} />
        </TabsContent>

        <TabsContent value="nan" className="mt-0 outline-none">
          <div className='bg-white/80 backdrop-blur-md p-8 rounded-[32px] shadow-xl border border-white/40'>
            <div className='mb-6 flex items-center gap-4 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100'>
              <ClipboardList size={24} />
              <div>
                <h2 className='font-bold'>Productos con Costo No Definido</h2>
                <p className='text-sm opacity-80'>Estos productos necesitan actualización de precio para cálculos precisos de recetas.</p>
              </div>
            </div>

            {itemsConCostoNaN.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {gruposDeItems.map((grupo, index) => (
                  <div key={index} className="group bg-slate-50 border border-slate-200 p-6 rounded-3xl hover:bg-white hover:shadow-2xl hover:border-indigo-200 transition-all duration-300">
                    <div className='flex justify-between items-center mb-4'>
                      <span className='px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase'>Grupo {index + 1}</span>
                      <button
                        className='bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2'
                        onClick={() => handleCopyGroupToClipboard(grupo)}
                      >
                        Copiar JSON
                      </button>
                    </div>
                    <div className='h-[200px] overflow-y-auto custom-scrollbar'>
                      <pre className="text-[10px] font-mono text-slate-500 bg-slate-100 p-4 rounded-xl leading-relaxed">
                        {JSON.stringify(grupo, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200'>
                <Database size={64} className='text-slate-200 mb-4' strokeWidth={1}/>
                <p className='text-slate-400 font-medium'>¡Excelente! Todos tus productos tienen costos válidos.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BuscarPreciosInternet;
