import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, AGENDA } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';

const categoryEmojis = {
  "Entrada": "🍜", "Proteína": "🥩", "Carbohidrato": "🍚",
  "Acompañante": "🥔", "Ensalada": "🥗", "Bebida": "🍹", "Default": "✨"
};

function MenuDelDiaPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const printRef = useRef(null);
  const menuData = useSelector((state) => state.allMenu);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([ /* dispatch calls */ ]);
        setLoading(false);
      } catch (error) { console.error("Error loading data:", error); setLoading(false); }
    };
    fetchData();
  }, [dispatch]);

  const mainMenuItem = useMemo(() => {
    if (!menuData) return null;
    const menuArray = Array.isArray(menuData) ? menuData : Object.values(menuData);
    
    const todaysMenu = menuArray.find(item => {
      if (item.SUB_GRUPO !== "TARDEO_ALMUERZO" || item.Estado !== 'Activo' || !item.Comp_Lunch) return false;
      try {
        const lunchData = JSON.parse(item.Comp_Lunch);
        return lunchData?.fecha?.fecha === selectedDate;
      } catch { return false; }
    });
    return todaysMenu;
  }, [menuData, selectedDate]);

  const handlePrint = () => { /* ... (sin cambios) */ };

  // --- ### FUNCIÓN DE DESCARGA DE PNG MEJORADA Y CORREGIDA ### ---
  const handleDownloadPng = async () => {
    const elementToCapture = printRef.current;
    if (!elementToCapture) {
      console.error("Error: El elemento del menú no fue encontrado para capturar.");
      alert("No se pudo generar la imagen. Inténtalo de nuevo.");
      return;
    }
  
    try {
      // Se agregan opciones para mayor compatibilidad y mejor calidad
      const canvas = await html2canvas(elementToCapture, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#f9e6c7', // Se asegura de que el fondo 'cream' se aplique
        scale: 2, // Doble resolución para una imagen más nítida
        logging: true // Activa logs en la consola para depurar si algo falla
      });
  
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0); // Calidad máxima
      link.download = `menu-${selectedDate}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
    } catch (error) {
      console.error("Ocurrió un error al generar el PNG con html2canvas:", error);
      alert("Ocurrió un error al generar la imagen. Revisa la consola (F12) para más detalles.");
    }
  };

  const renderMenuDetails = () => {
    if (!mainMenuItem) {
      return <p className="text-center p-4 text-gray-500 font-SpaceGrotesk">No hay menú para la fecha seleccionada.</p>;
    }

    const price = new Intl.NumberFormat('es-CO').format(mainMenuItem.Precio);
    let lunchDetails = null;
    try {
        const lunchData = JSON.parse(mainMenuItem.Comp_Lunch);
        const components = { "Entrada": lunchData.entrada, "Proteína": lunchData.proteina, "Carbohidrato": lunchData.carbohidrato, "Acompañante": lunchData.acompanante, "Ensalada": lunchData.ensalada, "Bebida": lunchData.bebida };
        
        lunchDetails = Object.entries(components).map(([title, component]) => {
            if (component && component.nombre) {
                return (
                    <div key={title} className="detail-item flex flex-col items-center text-center">
                        <span className="detail-emoji text-5xl">{categoryEmojis[title] || categoryEmojis.Default}</span>
                        <p className="detail-name mt-2 font-semibold font-SpaceGrotesk text-notBlack leading-tight">{component.nombre}</p>
                        {component.descripcion && ( <p className="detail-desc text-xs font-SpaceGrotesk text-gray-600 italic mt-1 px-2">{component.descripcion}</p> )}
                        <p className="detail-title text-sm font-SpaceGrotesk text-gray-500 mt-1">{title}</p>
                    </div>
                );
            }
            return null;
        });
    } catch(e) {}

    return (
      <>
        <h1 className="header-title font-LilitaOne text-5xl text-notBlack">Menú Almuerzo</h1>
        <h2 className="header-subtitle font-SpaceGrotesk text-xl text-gray-500 mb-8">
          Hora: 12:30 PM | Valor: ${price}
        </h2>
        
        {/* --- ### LÍNEA ELIMINADA ### --- 
          Ya no se muestra el nombre del plato aquí, ya que el desglose de abajo lo representa.
        */}

        <div className="details-grid grid grid-cols-2 gap-x-4 gap-y-6 mt-6">
            {lunchDetails}
        </div>
      </>
    );
  };

  if (loading) {
    return <div className="text-center text-gray-500 text-2xl p-10 font-SpaceGrotesk">Cargando menú...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center justify-start p-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-5 print:hidden">
        <label htmlFor="menu-date" className="font-medium text-lg font-SpaceGrotesk">Fecha:</label>
        <input type="date" id="menu-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border-gray-300 rounded-md shadow-sm font-SpaceGrotesk" />
      </div>

      <div className="flex gap-4 print:hidden mb-5">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium">Imprimir</Button>
        <Button onClick={handleDownloadPng} className="font-SpaceGrotesk font-medium" variant="outline">Descargar PNG</Button>
      </div>

      <div ref={printRef} id="print-area" className="w-full max-w-2xl p-8 bg-cream rounded-lg shadow-lg text-center">
          {renderMenuDetails()}
      </div>
    </div>
  );
}

export default MenuDelDiaPrint;