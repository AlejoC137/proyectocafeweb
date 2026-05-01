import React from "react";
import { Button } from "@/components/ui/button";

function ColorSelector({ col, colors, setColors, saveLayoutSizes }) {
  return (
    <div className="flex flex-col gap-1 p-1.5 rounded border border-black/5 hover:bg-black/5 transition-colors group">
      <label className="text-[9px] font-black uppercase tracking-tight leading-none text-gray-500">{col.label}</label>
      <div className="flex items-center gap-1.5">
        <input 
          type="color" 
          value={colors[col.id]} 
          onChange={e => { 
            const c = { ...colors, [col.id]: e.target.value }; 
            setColors(c); 
            saveLayoutSizes({ colors: c }); 
          }} 
          className="w-7 h-7 border border-black p-0 cursor-pointer rounded-sm bg-white shrink-0" 
        />
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-mono font-bold uppercase">{colors[col.id]}</span>
          <span className="text-[7px] text-gray-400 font-medium italic mt-0.5">{col.desc}</span>
        </div>
      </div>
    </div>
  );
}

const MenuPrintColorPanel = ({ colors, setColors, saveLayoutSizes, setShowColorPanel }) => {
  return (
    <div className="w-full max-w-5xl mb-4 bg-white border-2 border-black p-4 rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4 duration-300 print:hidden">
      <div className="flex items-center justify-between mb-4 border-b border-black/20 pb-2">
        <h3 className="font-black font-SpaceGrotesk uppercase text-base flex items-center gap-2">
          <span className="bg-black text-white px-1.5 py-0.5 rounded text-sm">🎨</span> Configuración de Colores
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setShowColorPanel(false)} className="h-6 w-6 p-0 border border-black font-black hover:bg-red-50 text-xs">X</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start lg:divide-x-2 divide-black/10">
        {/* SECCIÓN ENCABEZADO Y PIE */}
        <div className="pr-4">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
            Encabezado y Pie
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'mainTitle', label: 'Título Pral.', desc: 'Texto sup.' },
              { id: 'mainBorder', label: 'Borde/Sombra', desc: 'Líneas gral.' },
              { id: 'footerBg', label: 'Fondo Pie', desc: 'Barra inf.' },
              { id: 'footerText', label: 'Texto Pie', desc: 'Info footer' }
            ].map(col => (
              <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
            ))}
          </div>
        </div>

        {/* SECCIÓN CATEGORÍAS */}
        <div className="px-6">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
            Secciones
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'categoryTitle', label: 'Títulos', desc: 'Nombres blq.' },
              { id: 'categoryBorder', label: 'Bordes', desc: 'Marcos blq.' },
              { id: 'categoryBg', label: 'Fondos', desc: 'Tras cabec.' },
              { id: 'blockBg', label: 'Fondo Bloque', desc: 'Cuerpo blq.' }
            ].map(col => (
              <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
            ))}
          </div>
        </div>

        {/* SECCIÓN PRODUCTOS */}
        <div className="pl-6 pr-4">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
            Productos
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'itemName', label: 'Nombres', desc: 'Texto item' },
              { id: 'itemPrice', label: 'Precios', desc: 'Valor item' },
              { id: 'itemComment', label: 'Comentarios', desc: 'Descrip.' },
              { id: 'gridBorder', label: 'Divisores', desc: 'Sep. items' }
            ].map(col => (
              <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
            ))}
          </div>
        </div>

        {/* SECCIÓN IMÁGENES */}
        <div className="pl-6 border-l-2 border-black/10">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
            Imágenes
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'imgBorder', label: 'Bordes', desc: 'Marco foto' },
              { id: 'imgShadow', label: 'Sombra', desc: 'Sombra foto' }
            ].map(col => (
              <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPrintColorPanel;
