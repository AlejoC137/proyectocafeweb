import React, { useState, useEffect } from "react";
import supabase from "../../../../config/supabaseClient";
import { Button } from "@/components/ui/button";

const HorizontalGallery = ({ isOpen, onClose, onSelect, onUploadNew }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // Fetch images from all configurations to build a global gallery
      const { data, error } = await supabase.from('menu_print_config').select('images');
      if (error) throw error;

      // Flatten and get unique images by URL
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

      setImages(allImages);
    } catch (err) {
      console.error("Error fetching gallery images:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-white border-4 border-black p-6 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
          <h3 className="font-black text-2xl uppercase italic">Galería de Imágenes</h3>
          <button onClick={onClose} className="font-black hover:text-red-600 transition-colors text-xl">CERRAR X</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black uppercase italic animate-pulse">Cargando Galería...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Option to Upload New */}
              <button 
                onClick={onUploadNew}
                className="aspect-square border-4 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-black hover:bg-gray-50 transition-all group cursor-pointer"
              >
                <span className="text-4xl group-hover:scale-125 transition-transform">➕</span>
                <span className="font-black text-[10px] uppercase mt-2">Subir Nueva</span>
              </button>

              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square border-2 border-black rounded-lg overflow-hidden group relative cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1"
                  onClick={() => onSelect(img)}
                >
                  <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-white text-black font-black text-[10px] uppercase px-2 py-1 border-2 border-black">Seleccionar</span>
                  </div>
                </div>
              ))}
              
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
