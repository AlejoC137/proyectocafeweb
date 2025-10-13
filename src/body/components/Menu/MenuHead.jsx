import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO , CAFE_METODOS,CAFE_ESPRESSO, BEBIDAS_FRIAS,BEBIDAS_CALIENTES,PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS, AGENDA  } from "../../../redux/actions-types";
import { CardGridPrintHead } from "@/components/ui/cardGridPrintHead";
import { Button } from "@/components/ui/button";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import QrMenu from "@/assets/QR MENU.png";
import QrMapa from "@/assets/QR MAPA.png";
import QrWifi from "@/assets/QR WIFI.png";
import QrAgenda from "@/assets/QR AGENDA.png";
import MenuPrintInfo from "./MenuPrintInfo";
import MenuAgenda from "./MenuAgenda";
import MenuMenu from "./MenuMenu";
import MenuPrintFormInfo from "./MenuPrintForm";

function MenuHead() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const printRef = useRef(null);
  const menuData = useSelector((state) => state.allMenu);
  const qrSize = "h-[200px]"; // Puedes ajustar el valor aquí

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
    return <div className="text-center text-white text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  return (
    <div className="flex w-screen flex-col items-center justify-center " ref={printRef}>
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
        <div id="print-area" className="print:h-auto">
          
          {/* --- INICIO PÁGINA 1 --- */}
          {/* CORRECTO: Se añade flex, flex-col y print:h-screen para crear el layout de página completa */}
          <div className="print:break-after-page flex flex-col print:h-screen">
            <div className=" text-center ">
              <h1 className="text-4xl font-SpaceGrotesk font-bold mt-8 leading-tight">
                {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
              </h1>
            </div>
            
            {/* CORRECTO: Se añade 'grow' para que esta sección ocupe el espacio disponible */}
            <div className="pt-0 gap-8 flex flex-row justify-center items-start grow">
              {/* COFFEE */}
              <div className="flex flex-col gap-1 w-custom-width1200px">
                <h1 className="self-end text-center w-full font-LilitaOne text-xl mb-2" >{!leng ?"Café":"Coffee"}</h1>
                <div className="flex flex-col gap-1">
                  <CardGridPrintHead products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ES:"Espresso",EN:"Espresso"}} GRUPO={CAFE} isEnglish={leng} />
                  <br />
                  <CardGridPrintHead products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ES:"Métodos",EN:"Methods"}}  GRUPO={CAFE} isEnglish={leng} />
                </div>
              </div>
              {/* DRINKS */}
              {/* <div className="flex flex-col gap-1 w-custom-width1200px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2">{!leng ?"Bebidas":"Drinks"}</h1>
                <div className="flex flex-col gap-1 ">
                  <CardGridPrintHead products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES}  TITTLE={{ES:"Caliente",EN:"Hot"}} isEnglish={leng} />
                  <CardGridPrintHead products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS}  TITTLE={{ES:"Frío",EN:"Cold"}} isEnglish={leng} />
                </div>
              </div> */}
              {/* SOMETHING ELSE */}
              {/* <div className="flex flex-col gap-1 w-custom-width1200px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2 ">{!leng ?"Más":"More"}</h1>
                <div className="flex flex-row gap-1">
                  <CardGridPrintHead products={menuData} TITTLE={{ES:"ENBOTELLADOS",EN:"BOTTLED"}} GRUPO={"ENLATADOS"} isEnglish={leng} />
                </div>
                <br />
                <div className="flex flex-row gap-1">
                  <CardGridPrintHead products={menuData} TITTLE={{ES:"ADICIONES BEBIDAS",EN:"DRINK ADDITION"}} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} isEnglish={leng} />
                </div>
              </div> */}
            </div>

            <div className="flex justify-between mt-4 pb-4">
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| Proyecto Café |</h4>
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| Transversal 39 #65D - 22, Conquistadores |</h4>
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| +57 300 821 4593 @proyecto_ _cafe |</h4>
            </div>
          </div>
          
          {/* --- INICIO PÁGINA 2 --- */}
          <div className="print:break-after-page flex flex-col print:h-screen">
            <div className=" text-center ">
              <h1 className="text-4xl font-SpaceGrotesk font-bold mt-8 leading-tight">
                {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
              </h1>
            </div>

            <div className="pt-0 gap-8 flex flex-row justify-center items-start grow">
              {/* BAKED GOODS */}
              {/* <div className="flex flex-col gap-1 w-custom-width1200px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2" >{!leng ?"Horneados":"Baked Goods"}</h1>
                <div className="flex flex-col gap-1">
                  <CardGridPrintHead products={menuData} GRUPO={PANADERIA} isEnglish={leng}  SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA}/>
                  <CardGridPrintHead products={menuData} GRUPO={REPOSTERIA} isEnglish={leng}  SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE}/>
                </div>
              </div> */}
              {/* BREAKFAST */}
              <div className="flex flex-col gap-1 w-custom-width1200px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2">{!leng ?"Desayuno":"Breakfast"}</h1>
                <div className="flex flex-col gap-1 ">
                  <CardGridPrintHead products={menuData} TITTLE={{ES:"Desayuno Dulce",EN:"Sweet Breakfast"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} isEnglish={leng} />
                  <CardGridPrintHead products={menuData} TITTLE={{ES:"Desayuno Salado",EN:"Savory Breakfast"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} isEnglish={leng} />
                </div>
              </div>
              {/* MORE */}
              {/* <div className="flex flex-col gap-1 w-custom-width1200px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2 ">{!leng ?"Más":"More"}</h1>
                <div className="flex flex-row gap-1">
                  <CardGridPrintHead products={menuData} TITTLE={{ES:"Tardeo",EN:"Evening"}} GRUPO={TARDEO} isEnglish={leng} />
                </div>
                <br />
                <div className="flex flex-row gap-1">
                  <CardGridPrintHead products={menuData} TITTLE={{ES:"ADICIONES COMIDA",EN:"FOOD ADDITION "}} GRUPO={"ADICIONES"}  SUB_GRUPO={ADICIONES_COMIDAS} isEnglish={leng} />
                </div>
              </div> */}
            </div>

            <div className="flex justify-between mt-4 pb-4">
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| Proyecto Café |</h4>
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| Transversal 39 #65D - 22, Conquistadores |</h4>
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| +57 300 821 4593 @proyecto_ _cafe |</h4>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}

export default MenuHead;