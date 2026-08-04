import React from 'react';
import { Coffee, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MenuColumn({ menuItems, menuCarouselIdx, setMenuCarouselIdx, currentMenuItem, todaysLunch }) {
  const navigate = useNavigate();
  const borderColor = "border-[#1F2937]";
  const shadowColor = "shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  // Siguientes items (3 para llenar el espacio)
  const nextItems = menuItems.length > 1 
    ? [
        menuItems[(menuCarouselIdx + 1) % menuItems.length],
        menuItems[(menuCarouselIdx + 2) % menuItems.length],
        menuItems[(menuCarouselIdx + 3) % menuItems.length]
      ]
    : [];

  let parsedLunch = null;
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (todaysLunch) {
    try {
      parsedLunch = JSON.parse(todaysLunch.Comp_Lunch);
    } catch(e) {}
  }

  const renderLunchField = (label, itemData, indexPrefix = "") => {
    if (!itemData || !itemData.nombre) return null;
    return (
      <div className="w-full leading-tight mb-0.5 truncate">
        <span className="text-lg lg:text-xl font-black uppercase tracking-wide text-black mr-1.5" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          {label}:
        </span>
        <span className="font-black text-base lg:text-lg uppercase text-pink-600">
          {indexPrefix}{itemData.nombre}
        </span>
        {itemData.descripcion && (
          <span className="text-[10px] sm:text-xs font-bold text-[#1F2937] ml-1">({itemData.descripcion})</span>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full flex-col flex border-[3px] ${borderColor} bg-white rounded-none ${shadowColor}`}>
      
      {/* SECCIÓN 1: Menú del Día (Almuerzo Tipográfico) */}
      <div className={`p-4 border-b-[3px] ${borderColor} bg-yellow-100 flex items-center justify-between`}>
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          <Utensils className="w-4 h-4" /> Menú del Día
        </h3>
        {parsedLunch?.fecha?.fecha && (
          <span className="text-[10px] font-black uppercase bg-white border-[2px] border-black px-2 py-0.5">
            {parsedLunch.fecha.fecha === todayStr ? 'HOY' : parsedLunch.fecha.fecha}
          </span>
        )}
      </div>
      
      {/* Imagen del Almuerzo (1:1) si existe */}
      {todaysLunch?.Foto && (
        <div className={`w-full pt-[100%] border-b-[3px] ${borderColor} relative overflow-hidden bg-white group flex-shrink-0`}>
          <div className="absolute inset-0">
            <img 
              src={todaysLunch.Foto} 
              alt="Menú del Día" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      )}

      <div className={`bg-cream-bg border-b-[3px] ${borderColor} flex flex-col relative px-3 py-2`}>
        {parsedLunch ? (
          <div className="flex flex-col w-full overflow-hidden">
            <div className="flex flex-col gap-0.5 w-full">
              {/* Entrada */}
              {renderLunchField("Entrada", parsedLunch.entrada)}
              
              {/* Proteína inline 1 */}
              {parsedLunch.proteina?.nombre && (
                <div className="w-full leading-tight truncate">
                  <span className="text-lg lg:text-xl font-black uppercase tracking-wide text-black mr-1.5" style={{ fontFamily: "'First Bunny', sans-serif" }}>Proteína:</span>
                  <span className="font-black text-base lg:text-lg uppercase text-pink-600">
                    1. {parsedLunch.proteina.nombre}
                  </span>
                  {parsedLunch.proteina.descripcion && <span className="text-[10px] sm:text-xs font-bold text-[#1F2937] ml-1">({parsedLunch.proteina.descripcion})</span>}
                </div>
              )}
              
              {/* Proteína inline 2 */}
              {(parsedLunch.proteina_opcion_2?.nombre || parsedLunch["Opción 2"]?.nombre) && (
                <div className="w-full leading-tight truncate">
                  <span className="text-lg lg:text-xl font-black uppercase tracking-wide text-transparent mr-1.5 select-none" style={{ fontFamily: "'First Bunny', sans-serif" }}>Proteína:</span>
                  <span className="font-black text-base lg:text-lg uppercase text-pink-600">
                    2. {parsedLunch.proteina_opcion_2?.nombre || parsedLunch["Opción 2"]?.nombre}
                  </span>
                  {(parsedLunch.proteina_opcion_2?.descripcion || parsedLunch["Opción 2"]?.descripcion) && (
                    <span className="text-[10px] sm:text-xs font-bold text-[#1F2937] ml-1">({parsedLunch.proteina_opcion_2?.descripcion || parsedLunch["Opción 2"]?.descripcion})</span>
                  )}
                </div>
              )}

              {renderLunchField("Carbo", parsedLunch.carbohidrato)}
              {renderLunchField("Acomp", parsedLunch.acompanante)}
              {renderLunchField("Ensalada", parsedLunch.ensalada)}
              {renderLunchField("Bebida", parsedLunch.bebida)}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-black/50">
            <Utensils className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest text-center">No hay menú para hoy</p>
          </div>
        )}
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

      <div className="flex-1 bg-cream-bg relative overflow-hidden flex flex-col justify-start">
        {menuItems.length > 0 && currentMenuItem ? (
          <div className="flex flex-col h-full w-full">
            
            {/* Foto Grande Cuadrada (Full Width 1:1 Bulletproof) */}
            <div className={`w-full pt-[100%] border-b-[3px] border-[#1F2937] relative group flex-shrink-0 overflow-hidden bg-white`}>
              <div className="absolute inset-0">
                <img 
                  src={currentMenuItem.Foto} 
                  alt={currentMenuItem.NombreES} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Badge Precio */}
                <div className={`absolute top-3 right-3 bg-yellow-100 border-[3px] border-[#1F2937] px-2 py-1 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                  <span className="font-black text-lg">{currentMenuItem.Precio}</span>
                </div>
                
                {/* Info Text Box */}
                <div className={`absolute bottom-3 left-3 right-3 bg-white border-[3px] border-[#1F2937] p-2 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]`}>
                  <p className="text-xs font-black uppercase text-pink-500 tracking-widest leading-none mb-1">{currentMenuItem.SubTipoES || currentMenuItem.TipoES}</p>
                  <h4 className="font-black uppercase tracking-tight text-xl leading-none truncate" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {currentMenuItem.NombreES}
                  </h4>
                </div>
              </div>
            </div>

            {/* Lista compacta de siguientes items */}
            {nextItems.length > 0 && (
              <div className="p-3 bg-cream-bg flex-1 flex flex-col justify-start border-b-[3px] border-black overflow-y-auto custom-scrollbar">
                <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-2">A continuación:</p>
                <div className="flex flex-col gap-1.5">
                  {nextItems.map((item, i) => (
                    <div key={i} className={`flex flex-col p-2 bg-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] cursor-pointer hover:bg-yellow-100 transition-colors leading-tight`}
                      onClick={() => setMenuCarouselIdx((menuCarouselIdx + i + 1) % menuItems.length)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <p className="text-base font-black uppercase truncate text-black flex-1">
                          {item.NombreES}
                          {item.DescripcionMenuES && (
                            <span className="text-[10px] font-bold text-gray-500 ml-1">({item.DescripcionMenuES})</span>
                          )}
                        </p>
                        <span className="text-sm font-black bg-yellow-100 border-[2px] border-black px-1.5 py-0.5 leading-none flex-shrink-0">{item.Precio}</span>
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
      <div className={`p-4 bg-white mt-auto`}>
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
