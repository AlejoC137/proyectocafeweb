import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Utensils, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import almuerzoBg from '@/assets/ALMUERZO 2 P.C.png';

export default function RadioMenuDelDia({ todaysLunch }) {
  const navigate = useNavigate();
  const menuData = useSelector((state) => state?.allMenu);
  const containerRef = useRef(null);
  const posterRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const borderColor = "border-[#1F2937] dark:border-slate-700";
  const shadowColor = "shadow-[4px_4px_0px_0px_rgba(255,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(239,68,68,0.6)]";
  const buttonHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

  // Encontrar el menú activo del día: usar prop todaysLunch o buscar en Redux
  const effectiveLunch = useMemo(() => {
    if (todaysLunch && todaysLunch.Comp_Lunch) return todaysLunch;

    if (menuData) {
      const menuArray = Array.isArray(menuData) ? menuData : Object.values(menuData);
      const todayStr = new Date().toISOString().split('T')[0];

      const foundToday = menuArray.find(item => {
        if (item.SUB_GRUPO !== "TARDEO_ALMUERZO" || item.Estado !== 'Activo' || !item.Comp_Lunch) return false;
        try {
          const d = JSON.parse(item.Comp_Lunch);
          return d?.fecha?.fecha === todayStr;
        } catch { return false; }
      });
      if (foundToday) return foundToday;

      return menuArray.find(item => item.SUB_GRUPO === "TARDEO_ALMUERZO" && item.Estado === 'Activo' && item.Comp_Lunch);
    }

    return null;
  }, [todaysLunch, menuData]);

  // Parsear el contenido del almuerzo
  const parsedLunch = useMemo(() => {
    if (!effectiveLunch?.Comp_Lunch) return null;
    try {
      return typeof effectiveLunch.Comp_Lunch === 'string'
        ? JSON.parse(effectiveLunch.Comp_Lunch)
        : effectiveLunch.Comp_Lunch;
    } catch (e) {
      console.error("Error al parsear Comp_Lunch:", e);
      return null;
    }
  }, [effectiveLunch]);

  // Escalado responsivo dinámico usando ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setScale(width / 650);
      }
    };

    updateScale();

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setScale(width / 650);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [parsedLunch]);

  // Descargar PNG con html2canvas asegurando renderizado 1:1 en alta resolución
  const handleDownloadPng = async () => {
    const poster = posterRef.current;
    if (!poster) return;
    setIsDownloading(true);

    const prevTransform = poster.style.transform;
    try {
      // Quitar temporalmente la escala css para captura sin artefactos
      poster.style.transform = 'none';
      await new Promise(resolve => setTimeout(resolve, 60));

      const canvas = await html2canvas(poster, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#fff5e1',
        scale: 2,
        width: 650,
        height: 1200,
      });

      poster.style.transform = prevTransform;

      const dateStr = parsedLunch?.fecha?.fecha || new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `menu-del-dia-${dateStr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      if (poster) poster.style.transform = prevTransform;
      console.error('Error al generar PNG del menú:', err);
      alert('Hubo un error al generar la imagen del menú.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Renderizar secciones de texto sobre el afiche (coordenadas oficiales de MenuDelDiaPrint)
  const renderSection = (items, top, left = "190px", width = "440px") => {
    if (!items || items.length === 0) return null;
    return (
      <div
        className="absolute flex flex-col items-start z-10 text-left"
        style={{ top, left, width }}
      >
        {items.map((item, idx) => (
          item?.nombre ? (
            <div key={idx} className="leading-tight mb-1 w-full">
              <p className="font-AlteHaasGrotesk font-bold text-[28px] text-[#ec947e] tracking-tight leading-none mb-1">
                {items.length > 1 ? `${idx + 1}. ` : ''}{item.nombre}
              </p>
              {item.descripcion && (
                <p className="font-AlteHaasGrotesk text-[20px] font-bold text-[#374151] leading-[1.1]">
                  {item.descripcion}
                </p>
              )}
            </div>
          ) : null
        ))}
      </div>
    );
  };

  // Determinar nombre del día
  const dayName = useMemo(() => {
    const dateStr = parsedLunch?.fecha?.fecha || new Date().toISOString().split('T')[0];
    try {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
      return days[dateObj.getDay()];
    } catch {
      return 'HOY';
    }
  }, [parsedLunch]);

  const price = "24k";
  const opcion2Data = parsedLunch ? (parsedLunch.proteina_opcion_2 || parsedLunch["Opción 2"]) : null;

  return (
    <div className={`w-full flex-col flex border-[3px] ${borderColor} bg-white dark:bg-[#161722] text-black dark:text-white rounded-none ${shadowColor} transition-colors`}>

      {/* Header Neobrutalista */}
      <div className={`px-3 py-2 border-b-[3px] ${borderColor} bg-white dark:bg-[#1e1f2e] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(31,41,55,0.15)_4px,rgba(31,41,55,0.15)_5px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)] flex items-center justify-between overflow-hidden gap-2`}>
        <h3 className="font-black uppercase tracking-widest text-xl lg:text-2xl flex items-center gap-2 mt-1 whitespace-nowrap truncate text-black dark:text-white" style={{ fontFamily: "'First Bunny', sans-serif" }}>
          <Utensils className="w-4 h-4 -mt-1 flex-shrink-0 text-yellow-500" /> <span className="truncate">Menú del Día</span>
        </h3>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {parsedLunch && (
            <button
              onClick={handleDownloadPng}
              disabled={isDownloading}
              title="Descargar afiche en PNG"
              className={`px-2 py-1 bg-white dark:bg-[#12131C] text-black dark:text-white border-[2px] ${borderColor} shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] ${buttonHover} text-[9px] leading-none font-black uppercase transition-all flex items-center gap-1 disabled:opacity-50`}
            >
              <Download className="w-3 h-3 text-red-500" />
              <span>{isDownloading ? 'Generando...' : 'Descargar PNG'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenedor del Afiche Responsivo */}
      <div
        ref={containerRef}
        className="w-full relative overflow-hidden bg-[#fff5e1] dark:bg-[#0d0e15] flex flex-col justify-start"
        style={{
          height: parsedLunch ? `${1200 * scale}px` : 'auto',
          minHeight: parsedLunch ? `${1200 * scale}px` : '320px',
        }}
      >
        {parsedLunch ? (
          <div
            ref={posterRef}
            className="absolute top-0 left-0 overflow-hidden select-none text-left pointer-events-none"
            style={{
              width: '650px',
              height: '1200px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              backgroundImage: `url('${almuerzoBg}')`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Header: DÍA y Info */}
            <div className="absolute top-[15px] right-[75px] text-right max-w-[400px]">
              <h1 className="font-LilitaOne text-[90px] text-[#1f2937] leading-none mb-4 uppercase">
                {dayName}
              </h1>
              <p className="font-AlteHaasGrotesk font-bold text-[24px] text-[#1f2937]">
                Hora: 12 pm - Valor: {price}
              </p>
            </div>

            {/* Entrada */}
            {renderSection([parsedLunch.entrada], "300px")}

            {/* Proteína */}
            <div
              className="absolute flex flex-col items-start z-10 text-left"
              style={{ top: "410px", left: "190px", width: "440px" }}
            >
              {parsedLunch.proteina?.nombre && (
                <div className="leading-tight mb-2 w-full">
                  <p className="font-AlteHaasGrotesk font-bold text-[28px] text-[#ec947e] tracking-tight leading-none mb-1">
                    1. {parsedLunch.proteina.nombre}
                  </p>
                  {parsedLunch.proteina.descripcion && (
                    <p className="font-AlteHaasGrotesk text-[20px] font-bold text-[#374151] leading-[1.1]">
                      {parsedLunch.proteina.descripcion}
                    </p>
                  )}
                </div>
              )}
              {opcion2Data?.nombre && (
                <div className="leading-tight w-full">
                  <p className="font-AlteHaasGrotesk font-bold text-[28px] text-[#ec947e] tracking-tight leading-none mb-1">
                    2. {opcion2Data.nombre}
                  </p>
                  {opcion2Data.descripcion && (
                    <p className="font-AlteHaasGrotesk text-[20px] font-bold text-[#374151] leading-[1.1]">
                      {opcion2Data.descripcion}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Carbohidrato */}
            {renderSection([parsedLunch.carbohidrato], "575px")}

            {/* Acompañante */}
            {renderSection([parsedLunch.acompanante], "685px")}

            {/* Ensalada */}
            {renderSection([parsedLunch.ensalada], "790px")}

            {/* Bebida */}
            {renderSection([parsedLunch.bebida], "900px")}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-black/50 dark:text-white/50 min-h-[300px]">
            <Utensils className="w-12 h-12 mb-3 opacity-40 text-yellow-500" />
            <p className="font-black uppercase tracking-widest text-sm text-center">Menú del día no disponible</p>
            <p className="text-xs font-medium text-center mt-1 opacity-70">Consulta nuestra carta completa</p>
          </div>
        )}
      </div>

      {/* Botón Inferior */}
      <div className={`p-4 bg-white dark:bg-[#161722] mt-auto border-t-[3px] ${borderColor}`}>
        <button
          onClick={() => navigate('/Menu')}
          className={`w-full py-4 border-[3px] ${borderColor} bg-black dark:bg-yellow-400 text-white dark:text-black font-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)] hover:bg-yellow-100 dark:hover:bg-white hover:text-black transition-all ${buttonHover} rounded-none flex items-center justify-center gap-2`}
        >
          <Eye className="w-4 h-4" />
          <span>Ver Carta Completa</span>
        </button>
      </div>

    </div>
  );
}
