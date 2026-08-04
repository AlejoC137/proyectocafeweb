import React from 'react';
import { Coffee, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MenuDelDiaPrint from '../../body/views/ventaCompra/MenuDelDiaPrint';

export default function MenuColumn({ menuItems, menuCarouselIdx, setMenuCarouselIdx, currentMenuItem }) {
  const navigate = useNavigate();
  const borderColor = "border-[#1F2937]";
  const shadowColor = "shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  // Siguientes items (solo 2 para que sea pequeño y sencillo)
  const nextItems = menuItems.length > 1 
    ? [
        menuItems[(menuCarouselIdx + 1) % menuItems.length],
        menuItems[(menuCarouselIdx + 2) % menuItems.length]
      ]
    : [];

  return (
    <div className={`w-full flex-col flex border-[3px] ${borderColor} bg-white rounded-none ${shadowColor}`}>
      
      {/* SECCIÓN 1: Menú del Día (Almuerzo) */}
      <div className={`p-4 border-b-[3px] ${borderColor} bg-yellow-100 flex items-center justify-between`}>
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          <Utensils className="w-4 h-4" /> Menú del Día
        </h3>
      </div>
      <div className={`bg-cream-bg border-b-[3px] ${borderColor} flex flex-col justify-center items-center overflow-hidden h-[300px] relative`}>
        {/* Aquí renderizamos el componente de Almuerzo pero escalado para encajar */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 scale-[0.25] origin-top pointer-events-none mt-2">
          <MenuDelDiaPrint isMiniature={true} />
        </div>
        {/* Capa invisible para atrapar clicks y redirigir si se quiere */}
        <div 
          onClick={() => navigate('/Menu')}
          className="absolute inset-0 z-10 cursor-pointer hover:bg-black/5 transition-colors"
        />
      </div>

      {/* SECCIÓN 2: Carrusel de la Carta */}
      <div className={`p-4 border-b-[3px] ${borderColor} bg-pink-100 flex items-center justify-between`}>
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          <Coffee className="w-4 h-4" /> Carta de Hoy
        </h3>
        <div className="flex gap-1">
          <button 
            onClick={() => setMenuCarouselIdx(prev => (prev - 1 + menuItems.length) % menuItems.length)}
            className={`p-1 bg-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] ${buttonHover} transition-all`}
            disabled={menuItems.length <= 1}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button 
            onClick={() => setMenuCarouselIdx(prev => (prev + 1) % menuItems.length)}
            className={`p-1 bg-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] ${buttonHover} transition-all`}
            disabled={menuItems.length <= 1}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-cream-bg relative overflow-hidden flex flex-col">
        {menuItems.length > 0 && currentMenuItem ? (
          <div className="flex flex-col h-full">
            {/* Foto Grande (Carrusel) */}
            <div className="w-full h-48 sm:h-56 relative group">
              <div className={`w-full h-full border-b-[3px] ${borderColor} relative overflow-hidden bg-white`}>
                <img 
                  src={currentMenuItem.Foto} 
                  alt={currentMenuItem.NombreES} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Badge Precio */}
                <div className={`absolute top-3 right-3 bg-yellow-100 border-[3px] ${borderColor} px-2 py-1 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                  <span className="font-black text-xs">{currentMenuItem.Precio}</span>
                </div>
                
                {/* Info Text Box */}
                <div className={`absolute bottom-3 left-3 right-3 bg-white border-[3px] ${borderColor} p-2 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                  <p className="text-[9px] font-black uppercase text-pink-500 tracking-widest leading-none mb-1">{currentMenuItem.SubTipoES || currentMenuItem.TipoES}</p>
                  <h4 className="font-black uppercase tracking-tight text-sm leading-none truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {currentMenuItem.NombreES}
                  </h4>
                </div>
              </div>
            </div>

            {/* Mini lista de los siguientes (muy pequeña y sencilla) */}
            {nextItems.length > 0 && (
              <div className="p-3 bg-cream-bg flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">A continuación:</p>
                <div className="flex flex-col gap-2">
                  {nextItems.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 bg-white border-[2px] ${borderColor} shadow-[1px_1px_0px_0px_rgba(31,41,55,1)] cursor-pointer hover:bg-yellow-100 transition-colors`}
                      onClick={() => setMenuCarouselIdx((menuCarouselIdx + i + 1) % menuItems.length)}
                    >
                      <img src={item.Foto} alt={item.NombreES} className="w-8 h-8 object-cover border-[1px] border-black" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase truncate">{item.NombreES}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-black/50 min-h-[200px]">
            <Coffee className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-black uppercase tracking-widest text-xs text-center">Cargando carta...</p>
          </div>
        )}
      </div>

      {/* Botón Inferior */}
      <div className={`p-4 border-t-[3px] ${borderColor} bg-white mt-auto`}>
        <button
          onClick={() => navigate('/Menu')}
          className={`w-full py-3 border-[3px] ${borderColor} bg-black text-white font-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:bg-yellow-100 hover:text-black transition-all ${buttonHover} rounded-none`}
        >
          Ver Carta
        </button>
      </div>

    </div>
  );
}
