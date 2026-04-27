import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO, CAFE_METODOS, CAFE_ESPRESSO, BEBIDAS_FRIAS, BEBIDAS_CALIENTES, PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS, AGENDA } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { CardGridPrintInline } from "@/components/ui/cardGridPrintInline";
import { Button } from "@/components/ui/button";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import QrMenu from "@/assets/QR MENU.png";
import MenuPrintInfo from "./MenuPrintInfo";
import MenuAgenda from "./MenuAgenda";
import MenuMenu from "./MenuMenu";
import MenuPrintFormInfo from "./MenuPrintForm";
import { ArrowLeft } from "lucide-react";

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const printRef = useRef(null);
  const menuData = useSelector((state) => state.allMenu);

  // unused var kept intact for compatibility if ever needed later
  const qrSize = "h-[200px]";

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(AGENDA))
        ]);
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
    return <div className="text-center text-black text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center bg-gray-200 min-h-screen pb-10">
      <div className="flex gap-4 mt-8 mb-4 print:hidden flex-wrap justify-center">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          🖨️ Imprimir
        </Button>
        <Button onClick={() => setLeng(!leng)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
        <Button onClick={() => setShowForm((prev) => !prev)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showForm ? "Ocultar Mapeo" : "Mostrar Mapeo"}
        </Button>
      </div>

      {showForm && <div className="print:hidden w-full max-w-4xl mb-4"><MenuPrintFormInfo /></div>}

      <div ref={printRef} className="flex flex-col gap-10">



        {/* VERSIÓN 2: HORIZONTAL CONTINUO (ALTERNATIVA) */}
        <div
          className="bg-[#fcfbf9] text-black shadow-2xl w-[11in] h-[17in] border mx-auto overflow-hidden flex flex-col box-border print:break-after-page"
        >
          <div className="p-4 h-full flex flex-col relative print:p-2 bg-[#fcfbf9]">
            <div className="border-[2px] border-black bg-white p-2 md:p-3 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-end">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none m-0 p-0" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
              </h1>
              <div className="text-[10px] md:text-xs font-LilitaOne tracking-widest uppercase text-right leading-tight">
                <span>TRANSVERSAL 39 #65D - 22, CONQUISTADORES</span>
              </div>
            </div>

            <div className="flex-grow flex flex-col gap-3 text-justify leading-snug">

              {/* GRUPO QRS - MOVIDO AL TOP, DEBAJO DEL HEADER */}
              <div className="flex-none flex flex-row gap-2 break-inside-avoid min-h-[220px] mb-2.5">
                {/* LEFT COLUMN: MENU QR & INTRO */}
                <div className="border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-row flex-[0.3] break-inside-avoid">
                  <div className="w-8 shrink-0 flex items-center justify-center border-r-[2px] border-black overflow-hidden bg-white">
                    <h2 className="font-black text-2xl uppercase text-black tracking-widest whitespace-nowrap [writing-mode:vertical-lr] rotate-180" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                      MENÚ DIGITAL
                    </h2>
                  </div>
                  <div className="flex-grow flex justify-center items-center h-full p-2">
                    <div className="flex flex-col items-center justify-center w-full h-full text-center">
                      <img src={QrMenu} alt="QR Menu" className="w-[85%] max-w-[185px] aspect-square object-contain mix-blend-multiply" />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: INFO */}
                <div className="border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-row flex-[0.7] p-3 items-start justify-center text-center">
                  <div className="flex flex-col items-center justify-between h-full w-full gap-2">
                    <div className="flex flex-col w-full text-left font-SpaceGrotesk">

                      <div className="border-[2px] border-black  bg-cream-bg flex items-center justify-center text-center w-full">
                        <ArrowLeft size={42} className="stroke-[3px]" />
                        <ArrowLeft size={42} className="stroke-[3px]" />
                        <ArrowLeft size={42} className="stroke-[3px]" />
                        <p className="font-SpaceGrotesk font-black text-[12px] md:text-[15px] uppercase tracking-tight text-black leading-[1.1] flex items-center justify-center gap-3">
                          <span>
                            {!leng ? "Please scan the menu for photos, promotions, and important info." : "Por favor escanea el menú para ver fotos, promociones e información importante."}
                          </span>
                        </p>
                      </div>

                      <h1 className="text-[12px] md:text-[14px] font-black uppercase tracking-tight mb-2  border-black pb-1 leading-none mt-1">
                      </h1>
                      <div className="text-[7px] md:text-[8px] leading-tight origin-top-left transform scale-90 w-[110%]">
                        <MenuPrintInfo isEnglish={leng} className="p-0 m-0 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRUPO CAFE */}
              <div className="border-[2px] border-black bg-white p-1.5 mb-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] break-inside-avoid flex flex-row">
                <div className="w-8 shrink-0 flex items-center justify-center border-r-[2px] border-black mr-2 overflow-hidden bg-white">
                  <h2 className="font-black text-2xl uppercase text-black tracking-widest whitespace-nowrap [writing-mode:vertical-lr] rotate-180" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Café" : "Coffee"}
                  </h2>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} />
                  </div>
                  <div>
                    <CardGridPrintInline products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} />
                  </div>
                </div>
              </div>

              {/* GRUPO BEBIDAS */}
              <div className="border-[2px] border-black bg-white p-1.5 mb-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] break-inside-avoid flex flex-row">
                <div className="w-8 shrink-0 flex items-center justify-center border-r-[2px] border-black mr-2 overflow-hidden bg-white">
                  <h2 className="font-black text-2xl uppercase text-black tracking-widest whitespace-nowrap [writing-mode:vertical-lr] rotate-180" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Bebidas" : "Drinks"}
                  </h2>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} />
                  </div>
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} />
                  </div>
                  <div>
                    <CardGridPrintInline products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} />
                  </div>
                </div>
              </div>

              {/* GRUPO ALIMENTOS */}
              <div className="border-[2px] border-black bg-white p-1.5 mb-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] break-inside-avoid flex flex-row">
                <div className="w-8 shrink-0 flex items-center justify-center border-r-[2px] border-black mr-2 overflow-hidden bg-white">
                  <h2 className="font-black text-2xl uppercase text-black tracking-widest whitespace-nowrap [writing-mode:vertical-lr] rotate-180" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Alimentos" : "Food"}
                  </h2>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} />
                  </div>
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} />
                  </div>
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked Goods" }} isEnglish={leng} />
                  </div>
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked Goods" }} isEnglish={leng} />
                  </div>
                  <div>
                    <CardGridPrintInline products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} />
                  </div>
                </div>
              </div>

              {/* GRUPO EXTRAS */}
              <div className="border-[2px] border-black bg-white p-1.5 mb-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] break-inside-avoid flex flex-row">
                <div className="w-8 shrink-0 flex items-center justify-center border-r-[2px] border-black mr-2 overflow-hidden bg-white">
                  <h2 className="font-black text-2xl uppercase text-black tracking-widest whitespace-nowrap [writing-mode:vertical-lr] rotate-180" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Adiciones" : "Extras"}
                  </h2>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <div className="mb-1">
                    <CardGridPrintInline products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} />
                  </div>
                  <div>
                    <CardGridPrintInline products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} />
                  </div>
                </div>
              </div>

              {/* END OF THE FOOD LISTINGS */}

            </div>
            {/* FOOTER */}
            <div className="mt-auto border-[2px] border-black flex justify-between items-center tracking-widest text-[9px] font-bold font-SpaceGrotesk uppercase px-2 bg-black text-white py-1 mb-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] print:shadow-none">
              <span>TRANSVERSAL 39 #65D - 22, CONQ.</span>
              <span>|</span>
              <span>+57 300 821 4593</span>
              <span>|</span>
              <span>@PROYECTO__CAFE</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default MenuPrint;