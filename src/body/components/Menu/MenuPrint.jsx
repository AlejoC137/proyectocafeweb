import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO, CAFE_METODOS, CAFE_ESPRESSO, BEBIDAS_FRIAS, BEBIDAS_CALIENTES, PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS, AGENDA } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { CardGridPrintMatrix } from "@/components/ui/cardGridPrintMatrix";
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
  const [editMode, setEditMode] = useState(false);
  const menuData = useSelector((state) => state.allMenu);

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

  // Usa @media print en CSS para ocultar nav/overlay — sin tocar el DOM de React
  const handlePrint = () => window.print();

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
        <Button onClick={() => setEditMode(!editMode)} className={`font-SpaceGrotesk font-medium ${editMode ? 'bg-red-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          {editMode ? "💾 Salir Modo Edición" : "✏️ Editar Orden"}
        </Button>
        <Button onClick={() => setShowForm((prev) => !prev)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showForm ? "Ocultar Mapeo" : "Mostrar Mapeo"}
        </Button>
      </div>

      {showForm && <div className="print:hidden w-full max-w-4xl mb-4"><MenuPrintFormInfo /></div>}

      <div id="print-area" className="flex flex-col gap-10">

        {/* VERSIÓN MATRIZ: SIN DESCRIPCIONES */}
        <div
          className="bg-[#fcfbf9] text-black shadow-2xl w-[11in] h-[17in] border mx-auto overflow-hidden flex flex-col box-border print:break-after-page"
        >
          <div className="p-6 h-full flex flex-col relative print:p-4 bg-[#fcfbf9]">
            {/* HEADER */}
            <div className="border-[3px] border-black bg-white p-3 md:p-4 mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none m-0 p-0" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
              </h1>
              <div className="text-right">
                <p className="text-[12px] font-black uppercase tracking-widest leading-none">TRANSVERSAL 39 #65D - 22</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-1">Conquistadores, Medellín</p>
              </div>
            </div>

            <div className="flex-grow grid grid-cols-2 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: CAFE Y BEBIDAS */}
              <div className="flex flex-col gap-4">
                {/* GRUPO CAFE */}
                <div className="border-[2px] border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="font-black text-xl uppercase mb-3 border-b-2 border-black pb-1" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Café" : "Coffee"}
                  </h2>
                  <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} />
                </div>

                {/* GRUPO BEBIDAS */}
                <div className="border-[2px] border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="font-black text-xl uppercase mb-3 border-b-2 border-black pb-1" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Bebidas" : "Drinks"}
                  </h2>
                  <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} columns={2} editMode={editMode} />
                </div>

                {/* QR Y MENSAJE */}
                <div className="border-[2px] border-black bg-[#fff] p-4 flex flex-row items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <img src={QrMenu} alt="QR Menu" className="w-24 h-24 mix-blend-multiply" />
                  <div>
                    <p className="font-SpaceGrotesk font-black text-[12px] uppercase leading-tight">
                      {!leng ? "Escanea para ver fotos y promociones" : "Scan for photos and specials"}
                    </p>
                    <div className="flex gap-1 mt-2">
                       <ArrowLeft size={20} className="stroke-[3px]" />
                       <ArrowLeft size={20} className="stroke-[3px]" />
                       <ArrowLeft size={20} className="stroke-[3px]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: COMIDA Y EXTRAS */}
              <div className="flex flex-col gap-4">
                {/* GRUPO ALIMENTOS */}
                <div className="border-[2px] border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="font-black text-xl uppercase mb-3 border-b-2 border-black pb-1" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Alimentos" : "Food"}
                  </h2>
                  <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} columns={2} editMode={editMode} />
                </div>

                {/* GRUPO EXTRAS */}
                <div className="border-[2px] border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="font-black text-xl uppercase mb-3 border-b-2 border-black pb-1" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                    {!leng ? "Adiciones" : "Extras"}
                  </h2>
                  <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} columns={2} editMode={editMode} />
                  <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} columns={2} editMode={editMode} />
                </div>

                <div className="mt-2 border-[2px] border-black p-3 text-[10px] leading-tight font-SpaceGrotesk italic text-gray-700">
                   <MenuPrintInfo isEnglish={leng} className="p-0 m-0 w-full" />
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="mt-auto border-[3px] border-black flex justify-between items-center tracking-[0.2em] text-[11px] font-black font-SpaceGrotesk uppercase px-4 bg-black text-white py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span>PROYECTO CAFÉ</span>
              <div className="flex gap-4">
                <span>+57 300 821 4593</span>
                <span>@PROYECTO__CAFE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MenuPrint;