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
  showColorPanel,
  setShowColorPanel,
  showWebsiteBg,
  setShowWebsiteBg,
  saveLayoutSizes,
  websiteBgOpacity,
  setWebsiteBgOpacity,
  photosWidth,
  setPhotosWidth,
  photosWidthUnit,
  setPhotosWidthUnit,
  leftColRatio,
  setLeftColRatio
}) => {
  return (
    <>
      <div className="flex gap-4 mt-8 mb-4 print:hidden flex-wrap justify-center items-center">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          🖨️ Imprimir
        </Button>
        <Button onClick={() => setLeng(!leng)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
        <Button onClick={() => setEditMode(!editMode)} className={`font-SpaceGrotesk font-medium ${editMode ? 'bg-red-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          {editMode ? "💾 Salir Modo Edición" : "✏️ Editar Orden / Fotos"}
        </Button>
        <Button onClick={toggleShowIcons} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showIcons ? "🚫 Ocultar Iconos" : "👁️ Mostrar Iconos"}
        </Button>
        <Button onClick={() => setShowColorPanel(!showColorPanel)} className={`font-SpaceGrotesk font-medium ${showColorPanel ? 'bg-purple-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          🎨 {showColorPanel ? "Cerrar Colores" : "Personalizar Colores"}
        </Button>
        
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
      </div>

      {editMode && (
        <div className="flex items-center justify-center gap-8 bg-yellow-100 border border-yellow-400 p-2 text-xs font-SpaceGrotesk mb-4 print:hidden rounded flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold">Ancho Col. Fotos:</span>
            <input 
              type="range" 
              min={photosWidthUnit === 'px' ? "100" : "15"} 
              max={photosWidthUnit === 'px' ? "400" : "50"} 
              value={photosWidth} 
              onChange={(e) => setPhotosWidth(Number(e.target.value))} 
              onMouseUp={() => saveLayoutSizes({ photosWidth: Number(photosWidth) })} 
              onTouchEnd={() => saveLayoutSizes({ photosWidth: Number(photosWidth) })} 
              className="w-[150px]" 
            />
            <span
              className="cursor-pointer font-bold text-blue-600 hover:text-blue-800 underline px-1 bg-white rounded border border-blue-300"
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
            <span className="font-bold">Col. Bebidas vs Comida:</span>
            <input 
              type="range" 
              min="30" max="70" 
              value={leftColRatio} 
              onChange={(e) => setLeftColRatio(Number(e.target.value))} 
              onMouseUp={() => saveLayoutSizes({ leftColRatio: Number(leftColRatio) })} 
              onTouchEnd={() => saveLayoutSizes({ leftColRatio: Number(leftColRatio) })} 
              className="w-[150px]" 
            />
            <span>{leftColRatio}%</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuPrintControls;
