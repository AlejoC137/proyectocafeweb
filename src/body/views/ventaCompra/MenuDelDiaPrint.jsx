import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import MenuDelDiaList from './MenuDelDiaList'; 
import { updateItem } from "../../../redux/actions"; 
import { MENU } from "../../../redux/actions-types";
import proyecto_cafe_logo_wide from "@/assets/proyecto_cafe_logo_wide.png";
import proyecto_cafe_foter_wide from "@/assets/proyecto_cafe_foter_wide.png";

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

  const handlePrint = () => {
    const contentToPrint = printRef.current.innerHTML;
    if (!contentToPrint) { alert("No hay contenido para imprimir."); return; }

    let printHtml = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Space+Grotesk:wght@400;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }
        .print-container { margin: 0 auto; max-width: 800px; padding: 2rem; text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 90vh; }
        .logo-print { max-width: 200px; margin: 0 auto 1.5rem auto; }
        .footer-print { max-width: 250px; margin: 2rem auto 0 auto; }
        .header-title { font-family: 'Lilita One', cursive; font-size: 2.5rem; color: #2d2823; margin: 0; }
        .header-subtitle { font-size: 1.2rem; color: #6b7280; margin-top: 0.5rem; margin-bottom: 2rem; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
      </style>
      <div class="print-container">
        ${contentToPrint}
      </div>
    `;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printHtml;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const renderMenuDetails = () => {
    if (!mainMenuItem) {
      return <p className="text-center p-4 text-gray-500">No hay menú para la fecha seleccionada.</p>;
    }
    const price = new Intl.NumberFormat('es-CO').format(mainMenuItem.Precio);
    try {
        const lunchData = JSON.parse(mainMenuItem.Comp_Lunch);
        const opcion2Data = lunchData.proteina_opcion_2 || lunchData["Opción 2"];
        const components = { "Entrada": lunchData.entrada, "Proteína": lunchData.proteina, "Opción 2": opcion2Data, "Carbohidrato": lunchData.carbohidrato, "Acompañante": lunchData.acompanante, "Ensalada": lunchData.ensalada, "Bebida": lunchData.bebida };
        
        const lunchDetails = Object.entries(components).map(([title, component]) => {
            if (component && component.nombre) {
                return (
                    <div key={title} className="flex flex-col items-center text-center">
                        <span className="text-4xl">{categoryEmojis[title] || categoryEmojis.Default}</span>
                        <p className="text-sm text-gray-500 mt-1">{title}</p>
                        <p className="mt-2 font-semibold leading-tight">{component.nombre}</p>
                        {component.descripcion && ( <p className="text-xs text-gray-600 italic mt-1 px-2">{component.descripcion}</p> )}
                    </div>
                );
            }
            return null;
        });

        return (
          <div className="flex flex-col justify-between min-h-[80vh]">
            <div>
              <img 
          src={proyecto_cafe_logo_wide} 
          alt="Proyecto Café Logo" 
          className="w-full mx-auto mb-2 logo-print p-2"
          style={{ backgroundColor: "#fdedd7" }}
              />
              <h1 className="font-LilitaOne text-5xl text-notBlack header-title">Menú Almuerzo</h1>
              <h2 className="text-xl text-gray-500 mb-8 header-subtitle">
          Hora: 12:00 PM | Valor: ${price}
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 mt-6 details-grid">
          {lunchDetails}
              </div>
            </div>
            
            <img 
              src={proyecto_cafe_foter_wide}
              alt="Proyecto Café Footer"
              className="w-full  mt-2 footer-print"
            />
          </div>
        );
    } catch(e) {
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