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
import QrAgenda from "@/assets/QR AGENDA.png";
import MenuPrintInfo from "./MenuPrintInfo";
import MenuAgenda from "./MenuAgenda";
import MenuMenu from "./MenuMenu";
import MenuPrintFormInfo from "./MenuPrintForm";

function MenuPrint() {
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
              <div className="flex flex-col gap-1 w-custom-width400px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2" >{!leng ?"Café":"Coffee"}</h1>
                <div className="flex flex-col gap-1">
                  <CardGridPrint products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ES:"Espresso",EN:"Espresso"}} GRUPO={CAFE} isEnglish={leng} />
                  <br />
                  <CardGridPrint products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ES:"Métodos",EN:"Methods"}}  GRUPO={CAFE} isEnglish={leng} />
                </div>
              </div>
              {/* DRINKS */}
              <div className="flex flex-col gap-1 w-custom-width400px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2">{!leng ?"Bebidas":"Drinks"}</h1>
                <div className="flex flex-col gap-1 ">
                  <CardGridPrint products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES}  TITTLE={{ES:"Caliente",EN:"Hot"}} isEnglish={leng} />
                  <CardGridPrint products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS}  TITTLE={{ES:"Frío",EN:"Cold"}} isEnglish={leng} />
                </div>
              </div>
              {/* SOMETHING ELSE */}
              <div className="flex flex-col gap-1 w-custom-width400px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2 ">{!leng ?"Más":"More"}</h1>
                <div className="flex flex-row gap-1">
                  <CardGridPrint products={menuData} TITTLE={{ES:"ENBOTELLADOS",EN:"BOTTLED"}} GRUPO={"ENLATADOS"} isEnglish={leng} />
                </div>
                <br />
                <div className="flex flex-row gap-1">
                  <CardGridPrint products={menuData} TITTLE={{ES:"ADICIONES BEBIDAS",EN:"DRINK ADDITION"}} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} isEnglish={leng} />
                </div>
              </div>
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
              <div className="flex flex-col gap-1 w-custom-width400px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2" >{!leng ?"Horneados":"Baked Goods"}</h1>
                <div className="flex flex-col gap-1">
                  <CardGridPrint products={menuData} GRUPO={PANADERIA} isEnglish={leng}  SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA}/>
                  <CardGridPrint products={menuData} GRUPO={REPOSTERIA} isEnglish={leng}  SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE}/>
                </div>
              </div>
              {/* BREAKFAST */}
              <div className="flex flex-col gap-1 w-custom-width400px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2">{!leng ?"Desayuno":"Breakfast"}</h1>
                <div className="flex flex-col gap-1 ">
                  <CardGridPrint products={menuData} TITTLE={{ES:"Desayuno Dulce",EN:"Sweet Breakfast"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} isEnglish={leng} />
                  <CardGridPrint products={menuData} TITTLE={{ES:"Desayuno Salado",EN:"Savory Breakfast"}} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} isEnglish={leng} />
                </div>
              </div>
              {/* MORE */}
              <div className="flex flex-col gap-1 w-custom-width400px">
                <h1 className="self-end text-center w-full font-LilitaOne text-2xl mb-2 ">{!leng ?"Más":"More"}</h1>
                <div className="flex flex-row gap-1">
                  <CardGridPrint products={menuData} TITTLE={{ES:"Tardeo",EN:"Evening"}} GRUPO={TARDEO} isEnglish={leng} />
                </div>
                <br />
                <div className="flex flex-row gap-1">
                  <CardGridPrint products={menuData} TITTLE={{ES:"ADICIONES COMIDA",EN:"FOOD ADDITION "}} GRUPO={"ADICIONES"}  SUB_GRUPO={ADICIONES_COMIDAS} isEnglish={leng} />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4 pb-4">
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| Proyecto Café |</h4>
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| Transversal 39 #65D - 22, Conquistadores |</h4>
              <h4 className="text-center w-1/3 font-LilitaOne text-1 self-end">| +57 300 821 4593 @proyecto_ _cafe |</h4>
            </div>
          </div>
          
          {/* --- INICIO PÁGINA 3 --- */}
          <div className="flex flex-col print:h-screen">
            <div className=" text-center mb-4">
              <h1 className="text-3xl font-LilitaOne mt-8 font-bold leading-tight">
                {/* {leng ? "Menu" : "Menú"} */}
              </h1>
            </div>
            <div className="flex flex-row justify-between w-full gap-2 mb-6 grow">
              <div className="flex flex-col gap-2 w-custom-width400px">
                <div className="pt-2">
                  <MenuMenu isEnglish={leng} />
                </div>
                <div className="flex flex-row w-full  justify-between ">
                  <div className="w-full flex flex-col items-center justify-center">
                    <img src={QrMenu} alt="QR Menu " className={`object-contain ${qrSize}`} />
                    {/* <h3 className="text-center font-LilitaOne pt-2 text-sm">QR MENU</h3> */}
                  </div>
        
                </div>
              </div>
              <div className="flex flex-col gap-2 w-custom-width400px">
                                <div className=" text-center mb-4">

                        <h1 className="text-3xl font-LilitaOne mt-3 font-bold leading-tight">
          {!leng ? "More about Proyecto Café." : "Más sobre Proyecto Café."}
        </h1>
                <div className="pt-2">
                  <MenuPrintInfo isEnglish={leng} />
                </div>
                </div>
                <div className="flex flex-row w-full  justify-between ">
                  <div className="w-full flex flex-col items-center justify-center">
                    <img src={QrMapa} alt="QR MAPA " className={`object-contain ${qrSize}`} />
                    <h3 className="text-center font-LilitaOne pt-2 text-sm">QR Mapa</h3>
                  </div>
        
                </div>
              </div>
          

        <div className="flex flex-col gap-2 w-custom-width400px">
                <div className="pt-2">
                  <MenuAgenda isEnglish={leng} />
                </div>
                <div className="flex flex-row w-full  justify-center ">
                  <div className=" flex flex-col items-center bg-red-700 px-1">
                    <img 
                    src={QrAgenda} 
                    alt="QR Agenda" 
                    className={`object-contain ${qrSize} mx-auto `} 
                    />
                    <h3 className="text-center font-LilitaOne text-sm mt-1">QR AGENDA</h3>
                  </div>
        
                </div>
              </div>      
    
            </div>
            <div className="flex justify-between">
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">| Proyecto Café |</h4>
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">| Transversal 39 #65D - 22, Conquistadores |</h4>
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">| +57 300 821 4593 @proyecto_ _cafe |</h4>
            </div>
          </div>
          {/* --- INICIO PÁGINA 4 --- */}
          <div className="flex flex-col print:h-screen">
            <div className=" text-center mb-4">
              <h1 className="text-3xl font-LilitaOne mt-8 font-bold leading-tight">
                {leng ? "Proyecto Café" : "Proyecto Café"}
              </h1>
            </div>
            <div className="flex flex-row justify-between w-full gap-2 mb-6 grow">
           
       
              <div className="flex flex-col justify-start items-center w-custom-width400px h-full">
                {/* <img src={BaseSillaLogo} alt="Base Silla Logo" className=" w-1/2 object-contain  " />
                <p className="text-center  font-SpaceGrotesk w-4/5 text-sm mt-2 px-2">
                  {!leng
                    ? "fig-1: Silla Plan B - Coocreada con Materia nomada (@materianomada) - 2023: Felipe Mesa, de Plan B, diseñó la madera para una exposición de arte. Yo la compré y, junto con mi amigo Daniel, diseñamos y construimos el set de mesas y sillas “Conundrum Banana”. Cuando llegó a mi casa, la astronauta me ayudó a armarla, muy a regañadientes."
                    : "fig-1: Silla Plan B - Co-created with Materia nomada (@materianomada)  - 2023: Felipe Mesa, from Plan B, designed the wood for an art exhibition. I bought it and, together with my friend Daniel, we designed and built the “Conundrum Banana” table and chair set. When it arrived at my house, the astronaut helped me assemble it, very reluctantly."}
                </p> */}
              </div>
              <div className="flex flex-col justify-start items-center w-custom-width400px h-full">
                <img src={BaseSillaLogo} alt="Base Silla Logo" className=" w-1/2 object-contain  " />
                <p className="text-center  font-SpaceGrotesk w-4/5 text-sm mt-2 px-2">
                  {!leng
                    ? "fig-1: Silla Plan B - Coocreada con Materia nomada (@materianomada) - 2023: Felipe Mesa, de Plan B, diseñó la madera para una exposición de arte. Yo la compré y, junto con mi amigo Daniel, diseñamos y construimos el set de mesas y sillas “Conundrum Banana”. Cuando llegó a mi casa, la astronauta me ayudó a armarla, muy a regañadientes."
                    : "fig-1: Silla Plan B - Co-created with Materia nomada (@materianomada)  - 2023: Felipe Mesa, from Plan B, designed the wood for an art exhibition. I bought it and, together with my friend Daniel, we designed and built the “Conundrum Banana” table and chair set. When it arrived at my house, the astronaut helped me assemble it, very reluctantly."}
                </p>
              </div>
              <div className="flex flex-col justify-start items-center w-custom-width400px h-full">
                {/* <img src={BaseSillaLogo} alt="Base Silla Logo" className=" w-1/2 object-contain  " />
                <p className="text-center  font-SpaceGrotesk w-4/5 text-sm mt-2 px-2">
                  {!leng
                    ? "fig-1: Silla Plan B - Coocreada con Materia nomada (@materianomada) - 2023: Felipe Mesa, de Plan B, diseñó la madera para una exposición de arte. Yo la compré y, junto con mi amigo Daniel, diseñamos y construimos el set de mesas y sillas “Conundrum Banana”. Cuando llegó a mi casa, la astronauta me ayudó a armarla, muy a regañadientes."
                    : "fig-1: Silla Plan B - Co-created with Materia nomada (@materianomada)  - 2023: Felipe Mesa, from Plan B, designed the wood for an art exhibition. I bought it and, together with my friend Daniel, we designed and built the “Conundrum Banana” table and chair set. When it arrived at my house, the astronaut helped me assemble it, very reluctantly."}
                </p> */}
              </div>
            </div>
            <div className="flex justify-between">
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">| Proyecto Café |</h4>
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">| Transversal 39 #65D - 22, Conquistadores |</h4>
              <h4 className="text-center w-1/3 pt-4 font-LilitaOne text-1 mb-4 self-end">| +57 300 821 4593 @proyecto_ _cafe |</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuPrint;