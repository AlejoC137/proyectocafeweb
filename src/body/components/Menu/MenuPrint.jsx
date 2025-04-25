
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { Button } from "@/components/ui/button";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import QrMenu from "@/assets/QR MENU.png";

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);
  const menuData = useSelector((state) => state.allMenu);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([dispatch(getAllFromTable(MENU)), dispatch(getAllFromTable(ITEMS))]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (loading) {
    return <div className="text-center text-white text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  return (
    <div className="flex flex-col items-center w-custom-width1200px h-screen font-SpaceGrotesk font-light" ref={printRef}>
      <Button onClick={handlePrint} className="mb-5 print:hidden font-SpaceGrotesk font-medium">
        🖨️
      </Button>
  
      <div id="print-area">
        <div className="pt-5 gap-2 w-custom-width1200px flex flex-row">
          <div className="w-1/12 h-20 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/12 h-20 flex items-center justify-center">
            <img src={QrMenu} alt="QR Menu" className="h-full" />
          </div>
          <div className="w-1/12 h-20 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/12 h-20 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/12 h-20 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/12 h-20 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
        </div>
  
        {/* TRES COLUMNAS IGUALES */}
        <div className="pt-0 gap-4 flex flex-row justify-center">
          {/* BUENA COMIDA */}
          <div className="flex flex-col gap-2 w-custom-width400px">
            <h1>BUENA COMIDA</h1>
            <h2>{DESAYUNO}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
            </div>
            <br />
            <br />
            <h2>{TARDEO}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
            </div>
            <h2>{PANADERIA}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={PANADERIA} products={menuData} category={PANADERIA} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={REPOSTERIA} products={menuData} category={REPOSTERIA} isEnglish={true} />
            </div>
          </div>
  
          {/* CAFÉ */}
          <div className="flex flex-col gap-2 w-custom-width400px">
            <h1>CAFÉ</h1>
            <h2>{CAFE}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={CAFE} products={menuData} category={CAFE} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={BEBIDAS} products={menuData} category={BEBIDAS} isEnglish={true} />
            </div>
            <br />
            <br />
            <h2>{TARDEO}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
            </div>
          </div>
  
          {/* BEBIDAS */}
          <div className="flex flex-col gap-2 w-custom-width400px">
            <h1>BEBIDAS</h1>
            <h2>{CAFE}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={CAFE} products={menuData} category={CAFE} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={BEBIDAS} products={menuData} category={BEBIDAS} isEnglish={true} />
            </div>
            <br />
            <br />
            <h2>{TARDEO}</h2>
            <div className="flex flex-row gap-2">
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
              <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default MenuPrint;
