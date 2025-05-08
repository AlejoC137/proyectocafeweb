import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO , CAFE_METODOS,CAFE_ESPRESSO  } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { Button } from "@/components/ui/button";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import QrMenu from "@/assets/QR MENU.png";
import QrMapa from "@/assets/QR MAPA.png";

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
    <div className="flex w-screen flex-col items-center justify-center h-screen font-SpaceGrotesk font-light" ref={printRef}>
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
          <div className="pb-5 gap-2 w-custom-width1200px flex flex-row">

            
            <div className="w-1/6 h-20 flex flex-col items-center justify-center">
              <img src={QrMenu} alt="QR Menu" className="h-full" />
              <h3>QR MENU</h3>
            </div>
            <div className="w-1/6 h-20 flex flex-col items-center justify-center">
              <img src={QrMapa} alt="QR Menu" className="h-full" />
              <h3>QR MAPS</h3>
            </div>
            

            
            <div className="w-1/12 h-20 flex items-center justify-center">
              <img src={BaseSillaLogo} alt="Base Silla Logo" className="h-full" />
            </div>

          </div>

          {/* TRES COLUMNAS IGUALES */}
          <div className="pt-0 gap-4 flex flex-row justify-center">

            {/* CAFÉ */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full" >- CAFÉ Y MÁS -</h1>
              <h2>{"CAFÉ"}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={CAFE} products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ES:"Espresso",EN:"Espresso"}} GRUPO={"Espresso"} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={CAFE} products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ES:"Métodos",EN:"Methods"}}  GRUPO={"Metodos"} isEnglish={leng} />
              </div>
              <br />
              <h2 className="">{BEBIDAS}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={BEBIDAS}  products={menuData} GRUPO={"Caliente"} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={BEBIDAS} products={menuData} GRUPO={"Frio"} isEnglish={leng} />
              </div>
            </div>


            {/* BUENA COMIDA */}
            <div className="flex flex-col gap-1 w-custom-width400px">
            <h1 className="self-end text-center w-full">- COMIDA -</h1>
            <h2>{DESAYUNO}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={DESAYUNO} products={menuData} TITTLE={{ES:"Dulce",EN:"Sweet"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={DESAYUNO} products={menuData} TITTLE={{ES:"Salado",EN:"Salty"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} isEnglish={leng} />
              </div>
              <br />

              <h2>{TARDEO}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={1} className="w-1/3" filterKey={TARDEO} products={menuData} TITTLE={{ES:"Tardeo",EN:"Evening"}} GRUPO={TARDEO} isEnglish={leng} />
                {/* <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={TARDEO} products={menuData} GRUPO={TARDEO} isEnglish={leng} /> */}
              </div>
              <br />
              <h2>{PANADERIA}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={PANADERIA} products={menuData} GRUPO={PANADERIA} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={REPOSTERIA} products={menuData} GRUPO={REPOSTERIA} isEnglish={leng} />
              </div>
            </div>



            {/* ALGO MÁS */}
            <div className="flex flex-col gap-1 w-custom-width400px">
              <h1 className="self-end text-center w-full">- OTROS -</h1>
              <h2>{"ENLATADOS"}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ENLATADOS} products={menuData} GRUPO={"CAFÉ"} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ENLATADOS} products={menuData} GRUPO={BEBIDAS} isEnglish={leng} />
              </div>
              <br />
              <h2>{ADICIONES}</h2>
              <div className="flex flex-row gap-1">
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ADICIONES} products={menuData} GRUPO={"COMIDA"} isEnglish={leng} />
                <CardGridPrint withDividerValue={2} className="w-1/3" filterKey={ADICIONES} products={menuData} GRUPO={"BEBIDAS"} isEnglish={leng} />
              </div>
            </div>
          </div>
       <h4  className="self-end text-center w-full pt-4" >Proyecto Café | Transversal 39 #65D - 22, Conquistadores | +57 300 821 4593 | @proyecto_ _cafe</h4>
        </div>
      </div>
    </div>
  );
}

export default MenuPrint;
