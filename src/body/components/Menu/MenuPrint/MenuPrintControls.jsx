import React from "react";
import { Button } from "@/components/ui/button";

const MenuPrintControls = ({
  handlePrint,
  leng,
  setLeng,
  editMode,
  setEditMode,
  toggleShowIcons,
  showIcons,
  showItemDescriptions,
  setShowItemDescriptions,
  showColorPanel,
  setShowColorPanel,
  showWebsiteBg,
  setShowWebsiteBg,
  saveLayoutSizes,
  websiteBgOpacity,
  setWebsiteBgOpacity,
  backgroundUrl,
  photosWidth,
  setPhotosWidth,
  photosWidthUnit,
  setPhotosWidthUnit,
  leftColRatio,
  setLeftColRatio,
  addBlock,
  addPage,
  zoom,
  setZoom,
  handleBackgroundUpload,
  pageWidth,
  setPageWidth,
  pageHeight,
  setPageHeight,
  pageSizeUnit,
  setPageSizeUnit
}) => {
  const handlePresetChange = (e) => {
    const val = e.target.value;
    let w = 65;
    let h = 65;
    let u = 'cm';
    if (val === '65x65') { w = 65; h = 65; u = 'cm'; }
    else if (val === 'tabloid') { w = 27.94; h = 43.18; u = 'cm'; }
    else if (val === 'letter') { w = 21.59; h = 27.94; u = 'cm'; }
    else if (val === 'a3') { w = 29.7; h = 42; u = 'cm'; }

    if (val !== 'custom') {
      setPageWidth(w);
      setPageHeight(h);
      setPageSizeUnit(u);
      saveLayoutSizes({ pageWidth: w, pageHeight: h, pageSizeUnit: u });
    }
  };

  const isCustom = !((pageWidth === 65 && pageHeight === 65) || 
                     (pageWidth === 27.94 && pageHeight === 43.18) || 
                     (pageWidth === 21.59 && pageHeight === 27.94) || 
                     (pageWidth === 29.7 && pageHeight === 42));

  const currentPreset = isCustom ? 'custom' : 
    (pageWidth === 65 && pageHeight === 65) ? '65x65' :
    (pageWidth === 27.94 && pageHeight === 43.18) ? 'tabloid' :
    (pageWidth === 21.59 && pageHeight === 27.94) ? 'letter' : 'a3';

  return (
    <>
      <div className="flex gap-3 mt-8 mb-4 print:hidden flex-nowrap justify-start md:justify-center items-center px-4 overflow-x-auto whitespace-nowrap scrollbar-thin">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          🖨️ Imprimir
        </Button>
        <Button onClick={() => setLeng(!leng)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
        <Button onClick={() => setEditMode(!editMode)} className={`font-SpaceGrotesk font-medium ${editMode ? 'bg-red-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          {editMode ? "💾 Salir Modo Edición" : "✏️ Editar Layout / Fotos / Hoja"}
        </Button>
        <Button onClick={toggleShowIcons} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showIcons ? "🚫 Ocultar Iconos" : "👁️ Mostrar Iconos"}
        </Button>

        {/* SELECTOR RÁPIDO DE TAMAÑO DE HOJA */}
        <div className="flex items-center gap-2 bg-amber-100 p-1 px-3 rounded-md border-2 border-black h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-SpaceGrotesk font-black uppercase text-black">📐 Tamaño Hoja:</span>
          <select 
            value={currentPreset}
            onChange={handlePresetChange}
            className="text-xs font-bold bg-white border border-black p-1 rounded outline-none cursor-pointer"
          >
            <option value="65x65">🍦 Cuadrado (65 x 65 cm)</option>
            <option value="tabloid">📜 Tabloide (11 x 17 in)</option>
            <option value="letter">📄 Carta (8.5 x 11 in)</option>
            <option value="a3">📐 A3 (29.7 x 42 cm)</option>
            <option value="custom">✏️ Personalizado</option>
          </select>
        </div>

        <Button 
          onClick={() => {
            const next = !showItemDescriptions;
            setShowItemDescriptions(next);
            saveLayoutSizes({ showItemDescriptions: next });
          }} 
          className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800"
        >
          {showItemDescriptions ? "📝 Ocultar Detalles" : "📝 Mostrar Detalles"}
        </Button>
        <Button onClick={() => setShowColorPanel(!showColorPanel)} className={`font-SpaceGrotesk font-medium ${showColorPanel ? 'bg-purple-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          🎨 {showColorPanel ? "Cerrar Colores" : "Personalizar Colores"}
        </Button>
        
        <div className="flex items-center gap-2 bg-black/5 p-1 px-3 rounded-md border border-black/10 h-10">
          <span className="text-xs font-SpaceGrotesk font-bold">Zoom:</span>
          <input 
            type="range" min="0.1" max="1" step="0.05" 
            value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 cursor-pointer accent-black" 
          />
          <span className="text-xs font-SpaceGrotesk font-bold w-8">{(zoom * 100).toFixed(0)}%</span>
        </div>

        {editMode && (
          <div className="flex items-center gap-2 border-l border-black/20 pl-4">
            <Button onClick={() => addBlock(0)} className="font-SpaceGrotesk font-medium bg-blue-600 text-white hover:bg-blue-700">
              📝 + Bloque Texto
            </Button>
            <Button onClick={addPage} className="font-SpaceGrotesk font-medium bg-green-600 text-white hover:bg-green-700">
              📄 + Añadir Página
            </Button>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                const next = !showWebsiteBg;
                setShowWebsiteBg(next);
                saveLayoutSizes({ showWebsiteBg: next });
              }} 
              className={`font-SpaceGrotesk font-medium ${showWebsiteBg ? 'bg-blue-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}
            >
              {showWebsiteBg ? "🖼️ Quitar Fondo" : "🖼️ Poner Fondo"}
            </Button>
            {showWebsiteBg && (
              <div className="flex items-center gap-2 bg-black/5 p-1 px-3 rounded-md border border-black/10 h-10">
                <span className="text-xs font-SpaceGrotesk font-bold">Opacidad:</span>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={websiteBgOpacity} 
                  onChange={(e) => setWebsiteBgOpacity(Number(e.target.value))}
                  onMouseUp={() => saveLayoutSizes({ websiteBgOpacity: Number(websiteBgOpacity) })}
                  onTouchEnd={() => saveLayoutSizes({ websiteBgOpacity: Number(websiteBgOpacity) })}
                  className="w-24 cursor-pointer accent-black" 
                />
                <span className="text-xs font-SpaceGrotesk font-bold w-8">{(websiteBgOpacity * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
          {showWebsiteBg && (
            <div className="flex items-center gap-2 bg-black/5 p-2 rounded-md border border-black/10">
              <span className="text-[10px] font-black uppercase whitespace-nowrap">Imagen de fondo:</span>
              <Button
                onClick={() => document.getElementById('bg-upload').click()}
                className="h-7 px-3 text-[11px] bg-white text-black border border-black/30 hover:bg-gray-100 font-SpaceGrotesk font-bold"
              >
                {backgroundUrl ? "🔄 Cambiar imagen" : "📁 Subir imagen"}
              </Button>
              {backgroundUrl && (
                <span className="text-[10px] text-green-700 font-bold">✓ Imagen cargada</span>
              )}
              <input
                id="bg-upload"
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {editMode && (
        <div className="flex items-center justify-start md:justify-center gap-4 md:gap-6 bg-yellow-100 border-2 border-black p-3 text-xs font-SpaceGrotesk mb-4 print:hidden rounded-md flex-nowrap overflow-x-auto whitespace-nowrap mx-4 shadow-solid scrollbar-thin">
          {/* MEDIDAS EXACTAS DE HOJA */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-black">
            <span className="font-black uppercase text-amber-900">Dimensiones Hoja:</span>
            <span className="text-[10px] font-bold text-gray-500">Ancho:</span>
            <input 
              type="number"
              min="10"
              max="200"
              step="0.5"
              value={pageWidth}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPageWidth(val);
                saveLayoutSizes({ pageWidth: val });
              }}
              className="w-14 h-7 border border-black px-1 font-bold text-center bg-yellow-50 rounded"
            />
            <span className="text-[10px] font-bold text-gray-500">x Alto:</span>
            <input 
              type="number"
              min="10"
              max="200"
              step="0.5"
              value={pageHeight}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPageHeight(val);
                saveLayoutSizes({ pageHeight: val });
              }}
              className="w-14 h-7 border border-black px-1 font-bold text-center bg-yellow-50 rounded"
            />
            <button
              onClick={() => {
                const nextUnit = pageSizeUnit === 'cm' ? 'in' : 'cm';
                setPageSizeUnit(nextUnit);
                saveLayoutSizes({ pageSizeUnit: nextUnit });
              }}
              className="px-2 py-1 bg-black text-white font-bold rounded text-[10px] uppercase hover:bg-gray-800"
              title="Cambiar Unidad"
            >
              {pageSizeUnit}
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-yellow-400 pl-4">
            <span className="font-black uppercase">Ancho Col. Fotos:</span>
            <input 
              type="range" 
              min={photosWidthUnit === 'px' ? "100" : "15"} 
              max={photosWidthUnit === 'px' ? "400" : "50"} 
              value={photosWidth} 
              onChange={(e) => setPhotosWidth(Number(e.target.value))} 
              onMouseUp={() => saveLayoutSizes({ photosWidth: Number(photosWidth) })} 
              onTouchEnd={() => saveLayoutSizes({ photosWidth: Number(photosWidth) })} 
              className="w-[120px] cursor-pointer" 
            />
            <span
              className="cursor-pointer font-bold text-blue-600 hover:text-blue-800 underline px-2 py-0.5 bg-white rounded border border-blue-300"
              title="Cambiar unidad (% / px)"
              onClick={() => {
                const newUnit = photosWidthUnit === 'px' ? '%' : 'px';
                const newVal = newUnit === '%' ? 25 : 210;
                setPhotosWidthUnit(newUnit);
                setPhotosWidth(newVal);
                saveLayoutSizes({ photosWidthUnit: newUnit, photosWidth: newVal });
              }}
            >
              {photosWidth}{photosWidthUnit}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-yellow-400 pl-4">
            <span className="font-black uppercase">Col. Izq. vs Der.:</span>
            <input 
              type="range" 
              min="20" max="80" 
              value={leftColRatio} 
              onChange={(e) => setLeftColRatio(Number(e.target.value))} 
              onMouseUp={() => saveLayoutSizes({ leftColRatio: Number(leftColRatio) })} 
              onTouchEnd={() => saveLayoutSizes({ leftColRatio: Number(leftColRatio) })} 
              className="w-[120px] cursor-pointer" 
            />
            <span className="font-bold min-w-[30px]">{leftColRatio}%</span>
          </div>
        </div>
      )}
    </>
  );
};
export default MenuPrintControls;
