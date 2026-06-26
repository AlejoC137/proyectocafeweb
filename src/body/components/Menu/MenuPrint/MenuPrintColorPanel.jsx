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

function SizeSelector({ id, label, colors, setColors, saveLayoutSizes, min = 0.1, max = 500 }) {
  const isCm = colors.fontSizeUnit === 'cm';
  return (
    <div className="flex flex-col gap-1 p-1.5 rounded border border-black/5 hover:bg-black/5 transition-colors group">
      <label className="text-[9px] font-black uppercase tracking-tight leading-none text-gray-500">{label}</label>
      <div className="flex items-center gap-1.5">
        <input 
          type="number" 
          value={colors[id]} 
          min={min}
          max={max}
          step={isCm ? 0.05 : 1}
          onChange={e => { 
            const val = Number(e.target.value);
            const c = { ...colors, [id]: val }; 
            setColors(c); 
            saveLayoutSizes({ colors: c }); 
          }} 
          className="w-12 h-7 border border-black p-0.5 text-center cursor-pointer rounded-sm bg-white shrink-0 font-bold text-xs" 
        />
        <span className="text-[9px] font-mono text-gray-400">{colors.fontSizeUnit}</span>
      </div>
    </div>
  );
}

function FontSelector({ id, label, colors, setColors, saveLayoutSizes }) {
  const fonts = ['First Bunny', 'Space Grotesk', 'Outfit', 'Inter', 'Roboto', 'serif', 'sans-serif'];
  return (
    <div className="flex flex-col gap-1 p-1.5 rounded border border-black/5 hover:bg-black/5 transition-colors group">
      <label className="text-[9px] font-black uppercase tracking-tight leading-none text-gray-500">{label}</label>
      <select 
        value={colors[id]} 
        onChange={e => { 
          const c = { ...colors, [id]: e.target.value }; 
          setColors(c); 
          saveLayoutSizes({ colors: c }); 
        }} 
        className="w-full h-7 border border-black p-0.5 text-[10px] cursor-pointer rounded-sm bg-white font-bold"
      >
        {fonts.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
  );
}

const MenuPrintColorPanel = ({ colors, setColors, saveLayoutSizes, setShowColorPanel }) => {
  return (
    <div className="fixed top-[150px] left-1/2 -translate-x-1/2 w-full max-w-[1200px] z-[110] bg-white border-2 border-black p-4 rounded-lg shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4 duration-300 print:hidden overflow-x-auto max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 border-b border-black/20 pb-2">
        <h3 className="font-black font-SpaceGrotesk uppercase text-base flex items-center gap-2">
          <span className="bg-black text-white px-1.5 py-0.5 rounded text-sm">🎨</span> Diseño y Tipografía
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setShowColorPanel(false)} className="h-6 w-6 p-0 border border-black font-black hover:bg-red-50 text-xs">X</Button>
      </div>
      
      <div className="flex flex-wrap lg:flex-nowrap gap-6 items-start divide-x-0 lg:divide-x-2 divide-black/10">
        {/* SECCIÓN COLORES */}
        <div className="flex flex-col gap-6 flex-1 min-w-[300px]">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">Encabezado y Pie</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'mainTitle', label: 'Título Pral.', desc: 'Texto sup.' },
                { id: 'mainBorder', label: 'Borde/Sombra', desc: 'Líneas gral.' },
                { id: 'footerBg', label: 'Fondo Pie', desc: 'Barra inf.' },
                { id: 'footerText', label: 'Texto Pie', desc: 'Info footer' }
              ].map(col => <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />)}
            </div>
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">Productos</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'itemName', label: 'Nombres', desc: 'Texto item' },
                { id: 'itemPrice', label: 'Precios', desc: 'Valor item' },
                { id: 'itemComment', label: 'Comentarios', desc: 'Descrip.' }
              ].map(col => <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />)}
            </div>
            <div className="mt-2 flex flex-col gap-1.5 p-1.5 rounded border border-black/5 bg-zinc-50">
              <h5 className="text-[9px] font-black uppercase text-gray-500">Línea Divisoria</h5>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <label className="flex items-center gap-1 text-[9px] font-bold cursor-pointer">
                  <input type="checkbox" checked={colors.showItemLines !== false} onChange={e => {
                    const c = { ...colors, showItemLines: e.target.checked };
                    setColors(c);
                    saveLayoutSizes({ colors: c });
                  }} className="cursor-pointer" />
                  MOSTRAR
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">COLOR:</span>
                  <input type="color" className="w-5 h-5 border border-black p-0 rounded-sm cursor-pointer" value={colors.gridBorder ? colors.gridBorder.substring(0,7) : '#000000'} onChange={e => {
                    const c = { ...colors, gridBorder: e.target.value };
                    setColors(c);
                    saveLayoutSizes({ colors: c });
                  }} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">GROSOR:</span>
                  <input type="number" min="0.5" max="5" step="0.5" className="w-10 h-5 text-center text-[9px] border border-black rounded-sm p-0" value={colors.itemLineWidth || 1} onChange={e => {
                    const c = { ...colors, itemLineWidth: Number(e.target.value) };
                    setColors(c);
                    saveLayoutSizes({ colors: c });
                  }} />
                  <span className="text-[8px] font-mono text-gray-400">px</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">ESTILO:</span>
                  <select className="h-5 text-[9px] border border-black rounded-sm bg-white" value={colors.itemLineStyle || 'solid'} onChange={e => {
                    const c = { ...colors, itemLineStyle: e.target.value };
                    setColors(c);
                    saveLayoutSizes({ colors: c });
                  }}>
                    <option value="solid">Sólido</option>
                    <option value="dashed">Guiones</option>
                    <option value="dotted">Puntos</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 p-1.5 rounded border border-black/5 bg-zinc-50">
              <h5 className="text-[9px] font-black uppercase text-gray-500">Posición del Precio</h5>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">ALINEACIÓN:</span>
                  <select className="h-5 text-[9px] border border-black rounded-sm bg-white" value={colors.priceAlign || 'right'} onChange={e => {
                    const c = { ...colors, priceAlign: e.target.value };
                    setColors(c);
                    saveLayoutSizes({ colors: c });
                  }}>
                    <option value="right">A la Derecha (Extremo)</option>
                    <option value="left">Junto al Texto</option>
                  </select>
                </div>
                {colors.priceAlign === 'left' && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold">DISTANCIA:</span>
                    <input type="number" min="0" max="100" step="1" className="w-10 h-5 text-center text-[9px] border border-black rounded-sm p-0" value={colors.priceGap ?? 5} onChange={e => {
                      const c = { ...colors, priceGap: Number(e.target.value) };
                      setColors(c);
                      saveLayoutSizes({ colors: c });
                    }} />
                    <span className="text-[8px] font-mono text-gray-400">px</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN TIPOGRAFÍA */}
        <div className="flex flex-col gap-6 flex-1 min-w-[300px] lg:pl-6">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">Fuentes (Fonts)</h4>
            <div className="grid grid-cols-2 gap-2">
              <FontSelector id="fontTitle" label="Fuente Título" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <FontSelector id="fontCategory" label="Fuente Secc." colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <FontSelector id="fontItem" label="Fuente Items" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <FontSelector id="fontBody" label="Fuente Cuerpo" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-gray-400">Tamaños (Sizes)</h4>
              <div className="flex border border-black rounded overflow-hidden">
                {['px', 'cm'].map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      if (colors.fontSizeUnit === u) return;
                      // 1 inch = 96px = 2.54cm
                      // 1cm = 96 / 2.54 = 37.79527559 px
                      const factor = u === 'cm' ? (2.54 / 96) : (96 / 2.54);
                      const newColors = { ...colors, fontSizeUnit: u };
                      ['sizeTitle', 'sizeCategory', 'sizeItem', 'sizePrice', 'sizeComment'].forEach(key => {
                        const newVal = colors[key] * factor;
                        // For CM we need more precision to avoid jumps
                        newColors[key] = Number(newVal.toFixed(u === 'cm' ? 4 : 1));
                      });
                      setColors(newColors);
                      saveLayoutSizes({ colors: newColors });
                    }}
                    className={`px-2 py-0.5 text-[8px] font-black uppercase transition-colors ${colors.fontSizeUnit === u ? 'bg-black text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SizeSelector id="sizeTitle" label="T. Título" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <SizeSelector id="sizeCategory" label="T. Secciones" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <SizeSelector id="sizeItem" label="T. Nombres" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <SizeSelector id="sizePrice" label="T. Precios" colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
              <SizeSelector id="sizeComment" label="T. Descrip." colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
            </div>
          </div>
        </div>

        {/* SECCIÓN SECCIONES Y IMÁGENES */}
        <div className="flex flex-col gap-6 flex-1 min-w-[300px] lg:pl-6">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">Secciones</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'categoryTitle', label: 'Títulos', desc: 'Nombres blq.' },
                { id: 'categoryBorder', label: 'Bordes', desc: 'Marcos blq.' },
                { id: 'categoryBg', label: 'Fondos', desc: 'Tras cabec.' },
                { id: 'blockBg', label: 'Fondo Bloque', desc: 'Cuerpo blq.' }
              ].map(col => <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />)}
            </div>
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">Imágenes</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'imgBorder', label: 'Bordes', desc: 'Marco foto' },
                { id: 'imgShadow', label: 'Sombra', desc: 'Sombra foto' }
              ].map(col => <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPrintColorPanel;
