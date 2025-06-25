import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO , CAFE_METODOS,CAFE_ESPRESSO, BEBIDAS_FRIAS,BEBIDAS_CALIENTES   } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { Button } from "@/components/ui/button";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import QrMenu from "@/assets/QR MENU.png";
import QrMapa from "@/assets/QR MAPA.png";
import Encabezado from "./Encabezado";
import MenuPrintInfo from "./MenuPrintInfo";
import MenuAgenda from "./MenuAgenda";

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
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
    <div className="flex w-screen flex-col items-center justify-center h-screen" ref={printRef}>
      <div className="flex gap-4 mb-5">
        <Button onClick={handlePrint} className="print:hidden font-SpaceGrotesk font-medium">
          🖨️
        </Button>
        <Button onClick={() => setLeng(!leng)} className="print:hidden font-SpaceGrotesk font-medium">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
      </div>

      <div className="flex justify-center  w-full">
        <div id="print-area" className="">

<div className=" text-center mb-4">
  <h1 className="text-4xl font-SpaceGrotesk font-bold leading-tight">
    {leng ? "Welcome to Proyecto Café" : "Bienvenido a Proyecto Café"}
  </h1>

  <p className="text-2x1 font-SpaceGrotesk font-light mt-2 leading-snug">
    {leng
      ? "These are the essentials and recommendations. To view the full menu with photos and details, please scan the QR code on the next page."
      : "Aquí están los esenciales y recomendaciones. Para ver la carta completa con fotos y detalles, por favor escanea el código QR en la siguiente página."}
  </p>
</div>


          {/* TRES COLUMNAS IGUALES */}
          <div className="pt-0 gap-4 flex  flex-row justify-center h-custom-height550 ">

            {/* CAFÉ */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-4" >Café y Más</h1>
              <Encabezado isEnglish={leng} GRUPO={CAFE} />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={CAFE} products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ES:"Espresso",EN:"Espresso"}} GRUPO={CAFE} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={CAFE} products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ES:"Métodos",EN:"Methods"}}  GRUPO={CAFE} isEnglish={leng} />
              </div>
              <br />
              <Encabezado isEnglish={leng} GRUPO={BEBIDAS} />
              <div className="flex flex-row gap-1 ">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={BEBIDAS}  products={menuData} 
                GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES}  TITTLE={{ES:"Caliente",EN:"Hot"}} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={BEBIDAS} products={menuData} 
                GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS}  TITTLE={{ES:"Frío",EN:"Cold"}} isEnglish={leng} />
              </div>
            </div>


            {/* BUENA COMIDA */}
            <div className="flex flex-col gap-1 w-custom-width400px">
            <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-4">Buena Comida</h1>
              <Encabezado isEnglish={leng} GRUPO={DESAYUNO} />
              <div className="flex flex-row gap-1 ">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={DESAYUNO} products={menuData} TITTLE={{ES:"Dulce",EN:"Sweet"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={DESAYUNO} products={menuData} TITTLE={{ES:"Salado",EN:"Salty"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} isEnglish={leng} />
              </div>
              <br />

              {/* <h2>{TARDEO}</h2> */}
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={1} className="w-1/3" filterKey={TARDEO} products={menuData} TITTLE={{ES:"Tardeo",EN:"Evening"}} GRUPO={TARDEO} isEnglish={leng} />
                {/* <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} GRUPO={TARDEO} isEnglish={leng} /> */}
              </div>
              <br />
              <Encabezado isEnglish={leng} GRUPO={PANADERIA} />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={PANADERIA} products={menuData} GRUPO={PANADERIA} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={REPOSTERIA} products={menuData} GRUPO={REPOSTERIA} isEnglish={leng} />
              </div>
            </div>



            {/* ALGO MÁS */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-4 ">Extra</h1>
              <Encabezado isEnglish={leng} GRUPO={ENLATADOS} />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ENLATADOS} products={menuData} GRUPO={"CAFÉ"} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ENLATADOS} products={menuData} GRUPO={BEBIDAS} isEnglish={leng} />
              </div>
              <br />
              <Encabezado isEnglish={leng} GRUPO={ADICIONES} />
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ADICIONES} products={menuData} GRUPO={"COMIDA"} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ADICIONES} products={menuData} GRUPO={"BEBIDAS"} isEnglish={leng} />
              </div>
            </div>
          </div>
                 <h4  className="self-end text-center w-full pt-4 font-LilitaOne text-1 mb-4" >Proyecto Café | Transversal 39 #65D - 22, Conquistadores | +57 300 821 4593 | @proyecto_ _cafe</h4>
  
          <div className="pt-0 gap-4 flex flex-col justify-center">




<div className=" text-center mb-4">
  <h1 className="text-3xl font-LilitaOne font-bold leading-tight">
    {leng ? "More of Proyecto Café" : "MMás sobre Proyecto Café"}
  </h1>
  {/* <p className="text-lg font-SpaceGrotesk font-light mt-2 leading-snug">
    {leng
      ? "These are the essentials and recommendations. To view the full menu with photos and details, please scan the QR code on the next page."
      : "Aquí están los esenciales y recomendaciones. Para ver la carta completa con fotos y detalles, por favor escanea el código QR en la siguiente página."}
  </p> */}
</div>



{/* TRES COLUMNAS IGUALES COMPACTAS */}
<div className="flex flex-row justify-between w-full gap-2 mb-6">
  {/* Columna 1: QRs + Agenda */}
  <div className="flex flex-col gap-2 w-custom-width400px">
    <div className="flex flex-row w-full h-32 justify-between">
      <div className="w-1/2 h-32 flex flex-col items-center justify-center px-1">
        <img src={QrMenu} alt="QR Menu" className="h-full object-contain" />
        <h3 className="text-center font-LilitaOne text-sm mt-1">QR MENU</h3>
      </div>
      <div className="w-1/2 h-32 flex flex-col items-center justify-center px-1">
        <img src={QrMapa} alt="QR Maps" className="h-full object-contain" />
        <h3 className="text-center font-LilitaOne text-sm mt-1">QR MAPS</h3>
      </div>
    </div>
    <div className="pt-2">
      <MenuAgenda isEnglish={leng} />
    </div>
  </div>

  {/* Columna 2: MenuPrintInfo */}
  <div className="flex flex-col gap-2 w-custom-width400px">
    <MenuPrintInfo isEnglish={leng} />
  </div>

  {/* Columna 3: Logo */}
<div className="flex flex-col justify-between items-center w-custom-width400px h-full">
  <img src={BaseSillaLogo} alt="Base Silla Logo" className=" w-1/3 object-contain" />
<p className="text-center font-SpaceGrotesk text-sm mt-2 px-2">
  {leng
    ? "Base Silla. Café, cultura y encuentro en torno a una mesa. Un espacio para compartir, crear y disfrutar con propósito."
    : "Base Silla. Coffee, culture, and connection around a table. A space to share, create, and enjoy with purpose."}
</p>

</div>
</div>

          </div>
       <h4  className="self-end text-center w-full pt-4 font-LilitaOne text-1 mb-4" >Proyecto Café | Transversal 39 #65D - 22, Conquistadores | +57 300 821 4593 | @proyecto_ _cafe</h4>
        </div>
      </div>
    </div>
  );
}

export default MenuPrint;

