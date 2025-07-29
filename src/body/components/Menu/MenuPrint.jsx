import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO , CAFE_METODOS,CAFE_ESPRESSO, BEBIDAS_FRIAS,BEBIDAS_CALIENTES,PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS, AGENDA  } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { Button } from "@/components/ui/button";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import QrMenu from "@/assets/QR MENU.png";
import QrMapa from "@/assets/QR MAPA.png";
import QrWifi from "@/assets/QR WIFI.png";
import Encabezado from "./Encabezado";
import MenuPrintInfo from "./MenuPrintInfo";
import MenuAgenda from "./MenuAgenda";
import MenuPrintFormInfo from "./MenuPrintForm";

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const printRef = useRef(null);
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

  const handlePrint = () => {
    // This function prepares the content for printing
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
    <div className="flex w-screen flex-col items-center justify-center " ref={printRef}>
      {/* Buttons are hidden when printing */}
      <div className="flex gap-4 mt-12 mb-5 print:hidden">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium">
          🖨️
        </Button>
        <Button onClick={() => setLeng(!leng)} className="font-SpaceGrotesk font-medium">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
        <Button onClick={() => setShowForm((prev) => !prev)} className="font-SpaceGrotesk font-medium">
          {showForm ? "Ocultar Formulario" : "Mostrar Formulario"}
        </Button>
      </div>

      {showForm && <MenuPrintFormInfo />}

      <div className="flex justify-center ">
        <div id="print-area" className="">
          {/* --- START OF PAGE 1 --- */}
          <div className=" text-center ">
            <h1 className="text-4xl font-SpaceGrotesk font-bold mt-8 leading-tight">
              {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
            </h1>
          </div>

          {/* THREE EQUAL COLUMNS */}
          <div className="pt-0 gap-8 flex flex-row justify-center h-custom-height750">
            {/* COFFEE */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2" >{!leng ?"Café y Bebidas":"Coffe & Drinks"}</h1>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={CAFE} products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ES:"Espresso",EN:"Espresso"}} GRUPO={CAFE} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={CAFE} products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ES:"Métodos",EN:"Methods"}}  GRUPO={CAFE} isEnglish={leng} />
              </div>
              <br />
              <div className="flex flex-row gap-1 ">
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={BEBIDAS}  products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES}  TITTLE={{ES:"Caliente",EN:"Hot"}} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={BEBIDAS} products={menuData}  GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS}  TITTLE={{ES:"Frío",EN:"Cold"}} isEnglish={leng} />
              </div>
            </div>

            {/* GOOD FOOD */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2">{!leng ?"Comida":"Food"}</h1>
              <div className="flex flex-row gap-1 ">
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={DESAYUNO} products={menuData} TITTLE={{ES:"Desayuno Dulce",EN:"Sweet BreckFast"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={DESAYUNO} products={menuData} TITTLE={{ES:"Desayuno Salado",EN:"Salty BreckFast"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} isEnglish={leng} />
              </div>
              <br />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={1} cardHeight='' className="w-1/3" filterKey={TARDEO} products={menuData} TITTLE={{ES:"Tardeo",EN:"Evening"}} GRUPO={TARDEO} isEnglish={leng} />
              </div>
              <br />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={PANADERIA} products={menuData} GRUPO={PANADERIA} isEnglish={leng}  SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA}/>
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={REPOSTERIA} products={menuData} GRUPO={REPOSTERIA} isEnglish={leng}  SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE}/>
              </div>
            </div>

            {/* SOMETHING ELSE */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2 ">{!leng ?"Más":"More"}</h1>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={1} cardHeight='' className="w-1/3" filterKey={ENLATADOS} products={menuData} TITTLE={{ES:"ENBOTELLADOS",EN:"BOTTLED"}} GRUPO={"CAFÉ"} isEnglish={leng} />
              </div>
              <br />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={ADICIONES} products={menuData} TITTLE={{ES:"ADICIONES COMIDA",EN:"FOOD ADDITION "}} GRUPO={"COMIDA"}  SUB_GRUPO={ADICIONES_COMIDAS} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} cardHeight='' className="w-1/3" filterKey={ADICIONES} products={menuData} TITTLE={{ES:"ADICIONES BEBIDAS",EN:"DRINK ADDITION"}} GRUPO={"BEBIDAS"} SUB_GRUPO={ADICIONES_BEBIDAS} isEnglish={leng} />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">
              | Proyecto Café |
            </h4>
            <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">
              | Transversal 39 #65D - 22, Conquistadores |
            </h4>
            <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">
              | +57 300 821 4593 @proyecto_ _cafe |
            </h4>
          </div>

          {/* --- START OF PAGE 2 (with page break for printing) --- */}
          {/* The 'print:break-before-page' class forces a new page when printing */}
          <div className="pt-0 gap-4 flex flex-col justify-center print:break-before-page">
            <div className=" text-center mb-4">
              <h1 className="text-3xl font-LilitaOne mt-8 font-bold leading-tight">
                {leng ? "More of Proyecto Café" : "Más sobre Proyecto Café"}
              </h1>
            </div>

            {/* THREE EQUAL COMPACT COLUMNS */}
            <div className="flex flex-row justify-between w-full gap-2 mb-6">
              {/* Column 1: QRs + Agenda */}
              <div className="flex flex-col gap-2 w-custom-width400px">
                <div className="pt-2">
                  <MenuAgenda isEnglish={leng} />
                </div>
                <div className="flex flex-row w-full h-32 justify-between pt-5">
                  <div className="w-1/2 h-24 flex flex-col items-center justify-center px-1">
                    <img src={QrMenu} alt="QR Menu" className="h-full object-contain" />
                    <h3 className="text-center font-LilitaOne text-sm mt-1">QR MENU</h3>
                  </div>
                  <div className="w-1/2 h-24 flex flex-col items-center justify-center px-1">
                    <img src={QrMapa} alt="QR Maps" className="h-full object-contain" />
                    <h3 className="text-center font-LilitaOne text-sm mt-1">QR G MAPS</h3>
                  </div>
                  <div className="w-1/2 h-24 flex flex-col items-center justify-center px-1">
                    <img src={QrWifi} alt="QR Maps" className="h-full object-contain" />
                    <h3 className="text-center font-LilitaOne text-sm mt-1">QR WIFI</h3>
                  </div>
                </div>
              </div>

              {/* Column 2: MenuPrintInfo */}
              <div className="flex flex-col gap-2 w-custom-width400px">
                <MenuPrintInfo isEnglish={leng} />
              </div>

              {/* Column 3: Logo */}
              <div className="flex flex-col justify-between items-center w-custom-width400px h-full">
                <img src={BaseSillaLogo} alt="Base Silla Logo" className=" w-1/2 object-contain  " />
                <p className="text-center text-justify font-SpaceGrotesk w-4/5 text-sm mt-2 px-2">
                  {!leng
                    ? "fig-1: Silla Plan B - Coocreada con Materia nomada (@materianomada) - 2023: Felipe Mesa, de Plan B, diseñó la madera para una exposición de arte. Yo la compré y, junto con mi amigo Daniel, diseñamos y construimos el set de mesas y sillas “Conundrum Banana”. Cuando llegó a mi casa, la astronauta me ayudó a armarla, muy a regañadientes."
                    : "fig-1: Silla Plan B - Co-created with Materia nomada (@materianomada)  - 2023: Felipe Mesa, from Plan B, designed the wood for an art exhibition. I bought it and, together with my friend Daniel, we designed and built the “Conundrum Banana” table and chair set. When it arrived at my house, the astronaut helped me assemble it, very reluctantly."}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">
                | Proyecto Café |
              </h4>
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">
                | Transversal 39 #65D - 22, Conquistadores |
              </h4>
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">
                | +57 300 821 4593 @proyecto_ _cafe |
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuPrint;
