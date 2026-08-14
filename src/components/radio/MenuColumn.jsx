import React from 'react';
import { Coffee, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MenuColumn({ menuItems, menuCarouselIdx, setMenuCarouselIdx, currentMenuItem, todaysLunch }) {
  const navigate = useNavigate();
  const borderColor = "border-[#1F2937] dark:border-slate-700";
  const shadowColor = "shadow-[4px_4px_0px_0px_rgba(255,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(239,68,68,0.6)]";
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
    } catch (e) { }
  }

  const renderLunchField = (label, itemData, indexPrefix = "") => {
    if (!itemData || !itemData.nombre) return null;
    return (
      <div className="w-full leading-tight mb-1 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <span className="text-lg lg:text-xl font-bold uppercase tracking-widest text-black dark:text-yellow-400 mr-1.5">
          {label}:
        </span>
        <span className="text-lg lg:text-xl font-bold uppercase tracking-widest text-[#000000] dark:text-white [text-shadow:1px_1px_0px_#FF0000]">
          {indexPrefix}{itemData.nombre}
        </span>
        {itemData.descripcion && (
          <span className="text-[10px] sm:text-xs font-bold text-[#1F2937] dark:text-slate-300 ml-1">({itemData.descripcion})</span>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full flex-col flex border-[3px] ${borderColor} bg-white dark:bg-[#161722] text-black dark:text-white rounded-none ${shadowColor} transition-colors`}>

      {/* Header Menu del Dia */}
      <div className={`px-3 py-2 border-b-[3px] ${borderColor} bg-white dark:bg-[#1e1f2e] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.15)_4px,rgba(31,41,55,0.15)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)] flex items-center justify-between overflow-hidden gap-2`}>
        <h3 className="font-black uppercase tracking-widest text-xl lg:text-2xl flex items-center gap-2 mt-1 whitespace-nowrap truncate text-black dark:text-white" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          <Utensils className="w-4 h-4 -mt-1 flex-shrink-0 text-yellow-500" /> <span className="truncate">Menú del Día</span>
        </h3>
        {parsedLunch?.fecha?.fecha && (
          <span className="text-[9px] leading-none font-black uppercase tracking-widest border-[2px] border-black dark:border-slate-500 px-1.5 py-1 bg-white dark:bg-[#0d0e15] text-black dark:text-yellow-400 flex-shrink-0">
            {parsedLunch.fecha.fecha === todayStr ? 'HOY' : parsedLunch.fecha.fecha}
          </span>
        )}
      </div>

      {/* Imagen del Almuerzo (1:1) si existe */}
      {todaysLunch?.Foto && (
        <div className={`w-full pt-[100%] border-b-[3px] ${borderColor} relative overflow-hidden bg-white dark:bg-[#12131C] group flex-shrink-0`}>
          <div className="absolute inset-0">
            <img
              src={todaysLunch.Foto}
              alt="Menú del Día"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      )}

      <div className={`bg-white dark:bg-[#0d0e15] border-b-[3px] ${borderColor} flex flex-col relative px-3 py-2 transition-colors`}>
        {parsedLunch ? (
          <div className="flex flex-col w-full overflow-hidden">
            <div className="flex flex-col gap-0.5 w-full">
              {/* Entrada */}
              {renderLunchField("Entrada", parsedLunch.entrada)}

              {/* Proteína inline 1 */}
              {parsedLunch.proteina?.nombre && (
                <div className="w-full leading-tight mb-1 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span className="text-lg lg:text-xl font-bold uppercase tracking-widest text-black dark:text-yellow-400 mr-1.5">Proteína:</span>
                  <span className="text-lg lg:text-xl font-bold uppercase tracking-widest text-[#000000] dark:text-white [text-shadow:1px_1px_0px_#FF0000]">
                    1. {parsedLunch.proteina.nombre}
                  </span>
                  {parsedLunch.proteina.descripcion && <span className="text-[10px] sm:text-xs font-bold text-[#1F2937] dark:text-slate-300 ml-1">({parsedLunch.proteina.descripcion})</span>}
                </div>
              )}

              {/* Proteína inline 2 */}
              {(parsedLunch.proteina_opcion_2?.nombre || parsedLunch["Opción 2"]?.nombre) && (
                <div className="w-full leading-tight mb-1 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span className="text-lg lg:text-xl font-bold uppercase tracking-widest text-transparent mr-1.5 select-none">Proteína:</span>
                  <span className="text-lg lg:text-xl font-bold uppercase tracking-widest text-[#000000] dark:text-white [text-shadow:1px_1px_0px_#FF0000]">
                    2. {parsedLunch.proteina_opcion_2?.nombre || parsedLunch["Opción 2"]?.nombre}
                  </span>
                  {(parsedLunch.proteina_opcion_2?.descripcion || parsedLunch["Opción 2"]?.descripcion) && (
                    <span className="text-[10px] sm:text-xs font-bold text-[#1F2937] dark:text-slate-300 ml-1">({parsedLunch.proteina_opcion_2?.descripcion || parsedLunch["Opción 2"]?.descripcion})</span>
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
          <div className="h-full flex flex-col items-center justify-center text-black/50 dark:text-white/50 py-4">
            <Utensils className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest text-center">No hay menú para hoy</p>
          </div>
        )}
      </div>

      {/* Header Carta de Hoy */}
      <div className={`px-3 py-2 border-b-[3px] ${borderColor} bg-white dark:bg-[#1e1f2e] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.15)_4px,rgba(31,41,55,0.15)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)] text-black dark:text-white flex items-center justify-between overflow-hidden gap-2`}>
        <h3 className="font-black uppercase tracking-widest text-xl lg:text-2xl flex items-center gap-2 mt-1 whitespace-nowrap truncate text-black dark:text-white" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          <Coffee className="w-4 h-4 -mt-1 flex-shrink-0 text-amber-500" /> <span className="truncate">Carta de Hoy</span>
        </h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setMenuCarouselIdx(prev => (prev - 1 + menuItems.length) % menuItems.length)}
            className={`p-1 bg-white dark:bg-[#12131C] text-black dark:text-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] ${buttonHover} transition-all`}
            disabled={menuItems.length <= 1}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMenuCarouselIdx(prev => (prev + 1) % menuItems.length)}
            className={`p-1 bg-white dark:bg-[#12131C] text-black dark:text-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] ${buttonHover} transition-all`}
            disabled={menuItems.length <= 1}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className={`flex-1 bg-white dark:bg-[#161722] relative overflow-hidden flex flex-col justify-start transition-colors`}>
        {menuItems.length > 0 && currentMenuItem ? (
          <div className="flex flex-col h-full w-full">

            {/* Foto Grande Cuadrada (Full Width 1:1 Bulletproof) */}
            <div className={`w-full pt-[100%] border-b-[3px] ${borderColor} relative group flex-shrink-0 overflow-hidden bg-white dark:bg-[#12131C]`}>
              <div className="absolute inset-0">
                <img
                  src={currentMenuItem.Foto}
                  alt={currentMenuItem.NombreES}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Price Badge */}
                <div className={`absolute top-3 right-3 bg-yellow-100 dark:bg-yellow-400 text-[#1F2937] dark:text-black border-[2px] ${borderColor} px-2 py-1 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]`}>
                  <span className="text-sm font-black">{currentMenuItem.Precio}</span>
                </div>

                {/* Info Text Box */}
                <div className={`absolute top-3 left-3 right-24 bg-white dark:bg-[#1e1f2e] text-black dark:text-white border-[3px] ${borderColor} px-2 py-1 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex items-center gap-2 overflow-hidden`}>
                  <span className="text-[10px] sm:text-xs font-black uppercase text-black dark:text-yellow-400 [text-shadow:0.7px_0.7px_0px_#FF0000] tracking-widest flex-shrink-0 mt-0.5">{currentMenuItem.SubTipoES || currentMenuItem.TipoES}</span>
                  <span className="font-black uppercase tracking-tight text-lg lg:text-xl truncate text-black dark:text-white">
                    {currentMenuItem.NombreES}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista compacta de siguientes items */}
            {nextItems.length > 0 && (
              <div className={`p-3 bg-white dark:bg-[#0d0e15] flex-1 flex flex-col justify-start border-b-[3px] ${borderColor} overflow-y-auto custom-scrollbar`}>
                <div className="flex flex-col gap-1.5">
                  {nextItems.map((item, i) => (
                    <div
                      key={item._id || i}
                      className={`flex items-baseline justify-between px-3 py-1.5 bg-white dark:bg-[#1e1f2e] text-black dark:text-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] hover:bg-[#f8f8f8] dark:hover:bg-slate-800 transition-colors cursor-pointer group`}
                      onClick={() => setMenuCarouselIdx((menuCarouselIdx + i + 1) % menuItems.length)}
                    >
                      <div className="flex items-baseline gap-2 truncate flex-1 min-w-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        <span className="text-base lg:text-lg font-bold uppercase truncate text-black dark:text-white group-hover:[text-shadow:1.5px_1.5px_0px_#FF0000] transition-all flex-shrink-0 max-w-[60%]">
                          {item.NombreES}
                        </span>
                        {item.DescripcionMenuES && (
                          <span className="text-[11px] font-bold text-[#1F2937] dark:text-slate-300 truncate flex-1 transition-colors">
                            ({item.DescripcionMenuES})
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <span className="text-base lg:text-lg font-bold text-black dark:text-yellow-400 group-hover:[text-shadow:1.5px_1.5px_0px_#FF0000] transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {item.Precio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-black/50 dark:text-white/50 min-h-[200px]">
            <Coffee className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-black uppercase tracking-widest text-xs text-center">Cargando carta...</p>
          </div>
        )}
      </div>

      {/* Botón Inferior */}
      <div className={`p-4 bg-white dark:bg-[#161722] mt-auto`}>
        <button
          onClick={() => navigate('/Menu')}
          className={`w-full py-3 border-[3px] ${borderColor} bg-black dark:bg-yellow-400 text-white dark:text-black font-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)] hover:bg-yellow-100 dark:hover:bg-white hover:text-black transition-all ${buttonHover} rounded-none`}
        >
          Ver Carta
        </button>
      </div>

    </div>
  );
}

