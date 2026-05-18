import React, { useState, useEffect } from "react";
import supabase from "../../../../config/supabaseClient";
import { Button } from "@/components/ui/button";

const HorizontalGallery = ({ isOpen, onClose, onSelect, onUploadNew }) => {
  const [images, setImages] = useState([]);
  const [usages, setUsages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // Fetch configurations from both vertical (1) and horizontal (2) layouts
      const { data, error } = await supabase.from('menu_print_config').select('*');
      if (error) throw error;

      // 1. Flatten and get unique images by URL
      const allImages = [];
      const seenUrls = new Set();

      data.forEach(row => {
        if (row.images && Array.isArray(row.images)) {
          row.images.forEach(img => {
            if (img.url && !seenUrls.has(img.url)) {
              seenUrls.add(img.url);
              allImages.push(img);
            }
          });
        }
      });

      // 2. Compute usages of each image across both menus
      const usageMap = {};
      data.forEach(row => {
        const layoutType = row.id === 2 ? "Horizontal" : "Vertical";
        const layout = row.group_descriptions?.__layout || {};
        const pages = layout.pages || [];

        pages.forEach((page, pageIdx) => {
          // Check backgrounds
          if (page.bgImage) {
            const keys = [page.bgImage.id, page.bgImage.url].filter(Boolean);
            keys.forEach(key => {
              if (!usageMap[key]) usageMap[key] = [];
              const desc = `Fondo Pág. ${pageIdx + 1} (${layoutType})`;
              if (!usageMap[key].includes(desc)) {
                usageMap[key].push(desc);
              }
            });
          }

          // Check block list in columns
          if (page.columns && Array.isArray(page.columns)) {
            page.columns.forEach((col, colIdx) => {
              if (col.blocks && Array.isArray(col.blocks)) {
                col.blocks.forEach(blockId => {
                  if (blockId) {
                    if (!usageMap[blockId]) usageMap[blockId] = [];
                    const desc = `Col. ${colIdx + 1}, Pág. ${pageIdx + 1} (${layoutType})`;
                    if (!usageMap[blockId].includes(desc)) {
                      usageMap[blockId].push(desc);
                    }
                  }
                });
              }
            });
          }
        });
      });

      setUsages(usageMap);
      setImages(allImages);
    } catch (err) {
      console.error("Error fetching gallery images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, img) => {
    e.stopPropagation(); // Avoid triggering selection

    const imgId = img.id;
    const imgUrl = img.url;
    const usageList = usages[imgId] || usages[imgUrl] || [];

    let confirmMsg = `¿Eliminar esta imagen permanentemente?`;
    if (usageList.length > 0) {
      confirmMsg += `\n\n⚠️ ATENCIÓN: Esta imagen está en uso en:\n${usageList.map(u => `• ${u}`).join('\n')}\n\nSe removerá de todos los fondos y bloques del menú automáticamente.`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      // 1. Delete from Supabase Storage bucket
      if (img.storagePath) {
        await supabase.storage.from('Images_eventos').remove([img.storagePath]);
      }

      // 2. Fetch all configs to update them
      const { data: configs, error: fetchErr } = await supabase.from('menu_print_config').select('*');
      if (fetchErr) throw fetchErr;

      // 3. Clean layout arrays in each configuration
      for (const row of configs) {
        const updatedImages = (row.images || []).filter(item => item.id !== imgId && item.url !== imgUrl);

        let groupDesc = row.group_descriptions || {};
        let layout = groupDesc.__layout || {};
        let pages = layout.pages || [];

        const cleanedPages = pages.map(page => {
          let newBg = page.bgImage;
          if (page.bgImage && (page.bgImage.id === imgId || page.bgImage.url === imgUrl)) {
            newBg = null;
          }

          let newCols = page.columns || [];
          if (Array.isArray(newCols)) {
            newCols = newCols.map(col => {
              const cleanedBlocks = (col.blocks || []).filter(blockId => blockId !== imgId && blockId !== imgUrl);
              return { ...col, blocks: cleanedBlocks };
            });
          }

          return { ...page, bgImage: newBg, columns: newCols };
        });

        const updatedLayout = {
          ...groupDesc,
          __layout: { ...layout, pages: cleanedPages }
        };

        const { error: updateErr } = await supabase.from('menu_print_config').update({
          images: updatedImages,
          group_descriptions: updatedLayout
        }).eq('id', row.id);

        if (updateErr) throw updateErr;
      }

      await fetchImages();
      alert("Imagen eliminada de la galería exitosamente");
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Error al eliminar la imagen");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-white border-4 border-black p-6 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-5xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
          <h3 className="font-black text-2xl uppercase italic">Galería de Imágenes</h3>
          <button onClick={onClose} className="font-black hover:text-red-600 transition-colors text-xl">CERRAR X</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 mb-6 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black uppercase italic animate-pulse">Cargando Galería...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Option to Upload New */}
              <button 
                onClick={onUploadNew}
                className="aspect-video sm:aspect-auto sm:h-full min-h-[160px] border-4 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center hover:border-black hover:bg-zinc-50 transition-all group cursor-pointer"
              >
                <span className="text-4xl group-hover:scale-125 transition-transform">➕</span>
                <span className="font-black text-[10px] uppercase mt-2 tracking-widest">Subir Nueva Imagen</span>
              </button>

              {images.map((img, idx) => {
                const usageList = usages[img.id] || usages[img.url] || [];
                return (
                  <div 
                    key={idx} 
                    className="flex flex-col border-2 border-black rounded-lg overflow-hidden bg-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all relative group cursor-pointer"
                    onClick={() => onSelect(img)}
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, img)}
                      className="absolute top-2 right-2 z-20 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-110 active:translate-y-0.5 print:hidden cursor-pointer"
                      title="Eliminar del sistema"
                    >
                      🗑️
                    </button>

                    {/* Image Area */}
                    <div className="w-full aspect-video bg-zinc-100 overflow-hidden relative border-b border-black">
                      <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <span className="bg-white text-black font-black text-[10px] uppercase px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          Seleccionar
                        </span>
                      </div>
                    </div>

                    {/* Usage/Metadata Footer */}
                    <div className="p-3 bg-zinc-50 flex-1 flex flex-col justify-center min-h-[60px]">
                      {usageList.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                            📦 EN USO ({usageList.length}):
                          </span>
                          <div className="max-h-[38px] overflow-y-auto pr-1 text-[8px] leading-tight text-zinc-600 font-bold uppercase">
                            {usageList.map((usage, uIdx) => (
                              <div key={uIdx} className="truncate">• {usage}</div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 uppercase tracking-widest w-max">
                          ✓ Sin usar (Segura)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {images.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 font-bold uppercase italic">
                  No hay imágenes previas. ¡Sube la primera!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HorizontalGallery;
