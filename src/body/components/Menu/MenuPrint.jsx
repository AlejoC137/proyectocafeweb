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
    <div className="flex flex-col items-center w-custom-width2480px h-screen font-SpaceGrotesk font-light" ref={printRef}>
      <Button onClick={handlePrint} className="mb-5 print:hidden font-SpaceGrotesk font-medium">
        🖨️
      </Button>
      <div id="print-area">
        <div className="pt-5 gap-2 w-custom-width2480px flex flex-row">
          <div className="w-1/6 h-44 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/6 h-44 flex items-center justify-center">
            <img src={QrMenu} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/6 h-44 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/6 h-44 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/6 h-44 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
          <div className="w-1/6 h-44 flex items-center justify-center">
            <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
          </div>
        </div>

        <div className="pt-5 gap-2 w-custom-width2480px flex flex-row">
          <CardGridPrint withDividerValue={3} className="w-1/3" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
          <CardGridPrint withDividerValue={3} className="w-1/3" filterKey={PANADERIA} products={menuData} category={[PANADERIA, REPOSTERIA]} isEnglish={true} />
          <CardGridPrint withDividerValue={3} className="w-1/3" filterKey={TARDEO} products={menuData} category={TARDEO} isEnglish={true} />
        </div>

        <div className="pt-5 gap-2 w-custom-width2480px flex flex-row py-4">
          <CardGridPrint withDividerValue={6} className="w-1/6" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
          <CardGridPrint withDividerValue={6} className="w-1/6" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
          <CardGridPrint withDividerValue={6} className="w-1/6" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
          <CardGridPrint withDividerValue={6} className="w-1/6" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
          <CardGridPrint withDividerValue={6} className="w-1/6" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
          <CardGridPrint withDividerValue={6} className="w-1/6" filterKey={DESAYUNO} products={menuData} category={DESAYUNO} isEnglish={true} />
        </div>

        <div className="pt-5 gap-2 w-custom-width2480px h-screen flex flex-row overflow-hidden font-SpaceGrotesk font-light">
          <CardGridPrint withDividerValue={3} filterKey={BEBIDAS} products={menuData} category={BEBIDAS} isEnglish={true} />
          <CardGridPrint withDividerValue={3} filterKey={CAFE} products={menuData} className="p-1" category={CAFE} isEnglish={true} />
          <CardGridPrint withDividerValue={3} filterKey={ENLATADOS} products={menuData} category={ENLATADOS} isEnglish={true} />
        </div>
      </div>
    </div>
  );
}

export default MenuPrint;
