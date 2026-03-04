import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import MenuDelDiaList from './MenuDelDiaList';
import { updateItem } from "../../../redux/actions";
import { MENU } from "../../../redux/actions-types";
import almuerzoBg from "@/assets/ALMUERZO 2 P.C.png";

const categoryEmojis = {
  "Entrada": "🍜", "Proteína": "🥩", "Opción 2": "🍗", "Carbohidrato": "🍚",
  "Acompañante": "🥔", "Ensalada": "🥗", "Bebida": "🍹", "Default": "✨"
};

function MenuDelDiaPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const printRef = useRef(null);
  const menuData = useSelector((state) => state.allMenu);

  useEffect(() => {
    setLoading(false);
  }, [dispatch]);

  const mainMenuItem = useMemo(() => {
    if (!menuData) return null;
    const menuArray = Array.isArray(menuData) ? menuData : Object.values(menuData);

    return menuArray.find(item => {
      if (item.SUB_GRUPO !== "TARDEO_ALMUERZO" || item.Estado !== 'Activo' || !item.Comp_Lunch) return false;
      try {
        const lunchData = JSON.parse(item.Comp_Lunch);
        return lunchData?.fecha?.fecha === selectedDate;
      } catch { return false; }
    });
  }, [menuData, selectedDate]);

  const handleListUpdate = async (updatedMenuItem) => {
    try {
      await dispatch(updateItem(updatedMenuItem._id, updatedMenuItem, MENU));
      alert("Lista de almuerzos guardada correctamente.");
    } catch (error) {
      console.error("Error al actualizar el ítem de menú:", error);
      alert("Hubo un error al guardar la lista.");
    }
  };

  const handleDownloadPng = async () => {
    const elementToCapture = printRef.current;
    if (!elementToCapture) {
      alert("No se pudo generar la imagen.");
      return;
    }

    // Ubicamos al contenedor padre que tiene el `transform: scale`
    const parentContainer = elementToCapture.parentElement;
    const originalTransform = parentContainer.style.transform;
    const originalMarginBottom = parentContainer.style.marginBottom;

    try {
      // 1. Apagamos el escalado visual para que html2canvas capture píxeles 1:1 perfectos
      parentContainer.style.transform = 'none';
      parentContainer.style.marginBottom = '0px';

      // 2. Esperamos a que el DOM aplique el reseteo visual
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(elementToCapture, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#fff5e1',
        scale: 2, // Genera mejor resolución interior al exportar (no confundir con css scale)
        width: 650,
        height: 1200,
      });

      // 3. Restauramos la vista miniatura responsiva para el usuario INMEDIATAMENTE después de la foto
      parentContainer.style.transform = originalTransform;
      parentContainer.style.marginBottom = originalMarginBottom;

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `menu-${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // Restauración de seguridad por si algo falla
      if (parentContainer) {
        parentContainer.style.transform = originalTransform;
        parentContainer.style.marginBottom = originalMarginBottom;
      }
      console.error("Error al generar PNG:", error);
      alert("Ocurrió un error al generar la imagen.");
    }
  };

  const renderMenuDetails = () => {
    if (!mainMenuItem) {
      return <p className="text-center p-4 text-gray-500">No hay menú para la fecha seleccionada.</p>;
    }

    // Formatear día de la semana
    const dateObj = new Date(selectedDate + 'T00:00:00'); // Asegurar fecha correcta sin timezone offsets
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const dayName = days[dateObj.getDay()];

    // Configuración de items
    const price = "24k"; // Valor fijo según imagen de referencia o sacarlo de props si existe

    try {
      const lunchData = JSON.parse(mainMenuItem.Comp_Lunch);
      const opcion2Data = lunchData.proteina_opcion_2 || lunchData["Opción 2"];

      // Función auxiliar para renderizar items con posiciones absolutas alineado con "Entrada" o identado
      const renderSection = (items, top, left = "190px", width = "440px") => {
        if (!items || items.length === 0) return null;
        return (
          <div className="absolute flex flex-col items-start z-10 text-left"
            style={{ top, left, width }}>
            {items.map((item, idx) => (
              item?.nombre ? (
                <div key={idx} className="leading-tight mb-1 w-full">
                  <p className="font-AlteHaasGrotesk font-bold text-[28px] text-[#ec947e] tracking-tight leading-none mb-1">
                    {items.length > 1 ? `${idx + 1}. ` : ''}{item.nombre}
                  </p>
                  {item.descripcion && (
                    <p className="font-AlteHaasGrotesk text-[20px] font-bold text-[#374151] leading-[1.1]">{item.descripcion}</p>
                  )}
                </div>
              ) : null
            ))}
          </div>
        );
      };

      return (
        <>
          {/* Header: DÍA y Info */}
          <div className="absolute top-[15px] right-[75px] text-right max-w-[400px]">
            <h1 className="font-LilitaOne text-[90px] text-[#1f2937] leading-none mb-4 uppercase">
              {dayName}
            </h1>
            <p className="font-AlteHaasGrotesk font-bold text-[24px] text-[#1f2937]">Hora: 12 pm - Valor: {price}</p>
          </div>

          {/* SECCIONES INDIVIDUALES - Coordenadas estimadas para encajar bajo el texto quemado */}

          {/* Entrada */}
          {renderSection([lunchData.entrada], "300px")}

          {/* Proteína */}
          <div className="absolute flex flex-col items-start z-10 text-left"
            style={{ top: "410px", left: "190px", width: "440px" }} >
            {lunchData.proteina?.nombre && (
              <div className="leading-tight mb-2 w-full">
                <p className="font-AlteHaasGrotesk font-bold text-[28px] text-[#ec947e] tracking-tight leading-none mb-1">1. {lunchData.proteina.nombre}</p>
                {lunchData.proteina.descripcion && <p className="font-AlteHaasGrotesk text-[20px] font-bold text-[#374151] leading-[1.1]">{lunchData.proteina.descripcion}</p>}
              </div>
            )}
            {opcion2Data?.nombre && (
              <div className="leading-tight w-full">
                <p className="font-AlteHaasGrotesk font-bold text-[28px] text-[#ec947e] tracking-tight leading-none mb-1">2. {opcion2Data.nombre}</p>
                {opcion2Data.descripcion && <p className="font-AlteHaasGrotesk text-[20px] font-bold text-[#374151] leading-[1.1]">{opcion2Data.descripcion}</p>}
              </div>
            )}
          </div>

          {/* Carbohidrato */}
          {renderSection([lunchData.carbohidrato], "575px")}

          {/* Acompañante */}
          {renderSection([lunchData.acompanante], "685px")}

          {/* Ensalada */}
          {renderSection([lunchData.ensalada], "790px")}

          {/* Bebida */}
          {renderSection([lunchData.bebida], "900px")}
        </>
      );

    } catch (e) {
      console.error(e);
      return <p>Error al mostrar el menú.</p>;
    }
  };

  if (loading) {
    return <div className="text-center text-2xl p-10">Cargando...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      <div className="flex justify-between items-center p-4 bg-white border-b shadow-sm w-full">
        <div className="flex gap-4">
          <Button onClick={handleDownloadPng} variant="outline">Descargar PNG</Button>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="menu-date" className="font-medium text-lg">Fecha:</label>
          <input type="date" id="menu-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border-gray-300 rounded-md shadow-sm" />
        </div>
      </div>

      <div className="flex-grow flex gap-8 p-8 overflow-auto items-start">
        <div className="flex justify-center items-start overflow-auto bg-gray-200/50 rounded-lg border border-gray-300 shadow-inner p-4" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          {/* Contenedor con dimensiones fijas estrictas para la captura de html2canvas y visualización sin deformarse */}
          <div className="shadow-2xl overflow-hidden flex-shrink-0 relative" style={{
            width: '650px',
            height: '1200px',
            minWidth: '650px',
            minHeight: '1200px',
            transform: 'scale(0.85)',
            transformOrigin: 'top center',
            marginBottom: '-180px' // Compensate for scale(0.85) roughly 15% of 1200px
          }}>
            <div
              ref={printRef}
              className="absolute inset-0 bg-white overflow-hidden text-left"
              style={{
                width: '650px',
                height: '1200px',
                backgroundImage: `url('${almuerzoBg}')`,
                backgroundSize: '100% 100%', // Evita que se recorte si cambia la proporción
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {renderMenuDetails()}
            </div>
          </div>
        </div>

        <div className="flex-grow min-w-[300px] overflow-auto bg-white rounded-lg shadow-xl p-4">
          {mainMenuItem ? (
            <MenuDelDiaList
              menuDelDia={mainMenuItem}
              onUpdate={handleListUpdate}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <p className="text-xl text-gray-500">Selecciona una fecha con menú para ver la lista de pedidos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuDelDiaPrint;
