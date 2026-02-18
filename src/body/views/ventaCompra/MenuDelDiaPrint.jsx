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
    try {
      const canvas = await html2canvas(elementToCapture, {
        allowTaint: true, useCORS: true, backgroundColor: '#fff5e1', scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `menu-${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
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
        
        // Función auxiliar para renderizar items
        const renderSection = (items, top, left = "250px", width = "600px") => {
           if (!items || items.length === 0) return null;
           return (
             <div className="absolute flex flex-col items-start z-10" 
                  style={{ top, left, width }}>
               {items.map((item, idx) => (
                  item?.nombre ? (
                   <div key={idx} className="leading-tight mb-1">
                     <p className="font-AlteHaasGrotesk font-bold text-3xl text-[#ec947e]">
                       {items.length > 1 ? `${idx + 1}. ` : ''}{item.nombre}
                     </p>
                     {item.descripcion && ( 
                       <p className="font-AlteHaasGrotesk text-lg text-[#374151] leading-none ml-1">{item.descripcion}</p> 
                     )}
                   </div>
                  ) : null
               ))}
             </div>
           );
        };

        return (
          <div className="relative w-full h-[1150px] bg-white overflow-hidden text-left"
               style={{ 
                 backgroundImage: `url('${almuerzoBg}')`, 
                 backgroundSize: 'cover', 
                 backgroundPosition: 'center' 
               }}>
            
            {/* Header: DÍA y Info */}
            <div className="absolute top-[30px] right-[40px] text-right">
              <h1 className="font-LilitaOne text-[100px] text-[#1f2937] leading-none mb-4">{dayName}</h1>
              <p className="font-AlteHaasGrotesk text-2xl text-[#374151]">Hora: 12 pm - Valor:{price}</p>
            </div>

            {/* SECCIONES INDIVIDUALES - Coordenadas estimadas basadas en la imagen */}
            
            {/* Entrada */}
            {renderSection([lunchData.entrada], "260px")}

            {/* Proteína */}
            <div className="absolute flex flex-col items-start z-10" 
                 style={{ top: "370px", left: "250px", width: "600px" }}>
              {lunchData.proteina?.nombre && (
                <div className="leading-tight mb-2">
                   <p className="font-AlteHaasGrotesk font-bold text-3xl text-[#ec947e]">1. {lunchData.proteina.nombre}</p>
                   {lunchData.proteina.descripcion && <p className="font-AlteHaasGrotesk text-lg text-[#374151] leading-none ml-1">{lunchData.proteina.descripcion}</p>}
                </div>
              )}
              {opcion2Data?.nombre && (
                <div className="leading-tight">
                   <p className="font-AlteHaasGrotesk font-bold text-3xl text-[#ec947e]">2. {opcion2Data.nombre}</p>
                   {opcion2Data.descripcion && <p className="font-AlteHaasGrotesk text-lg text-[#374151] leading-none ml-1">{opcion2Data.descripcion}</p>}
                </div>
              )}
            </div>

            {/* Carbohidrato */}
            {renderSection([lunchData.carbohidrato], "550px")}

            {/* Acompañante */}
            {renderSection([lunchData.acompanante], "660px")}

            {/* Ensalada */}
            {renderSection([lunchData.ensalada], "770px")}

            {/* Bebida */}
            {renderSection([lunchData.bebida], "880px")}

          </div>
        );

    } catch(e) {
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
          {/* <Button onClick={handlePrint}>Imprimir</Button> */}
          <Button onClick={handleDownloadPng} variant="outline">Descargar PNG</Button>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="menu-date" className="font-medium text-lg">Fecha:</label>
          <input type="date" id="menu-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border-gray-300 rounded-md shadow-sm" />
        </div>
      </div>

      <div className="flex-grow flex gap-8 p-8 overflow-auto">
        <div className="w-2/5 flex-shrink-0">
          <div
            ref={printRef}
            className="w-full p-2 rounded-lg shadow-lg text-center"
            style={{ backgroundColor: "#fff5e1" }}
          >
            {renderMenuDetails()}
          </div>
        </div>

        <div className="w-3/5 flex-grow">
          {mainMenuItem ? (
            <MenuDelDiaList 
              menuDelDia={mainMenuItem}
              onUpdate={handleListUpdate}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-6 bg-white rounded-lg shadow-xl">
              <p className="text-xl text-gray-500">Selecciona una fecha con menú para ver la lista de pedidos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuDelDiaPrint;
