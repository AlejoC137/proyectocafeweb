{/* VERSIÓN 1: COLUMNAS (TABLOIDE VINTAGE) */ }
<div
    className="bg-[#fcfbf9] text-black shadow-2xl print:shadow-none w-[11in] h-[17in] border print:border-none mx-auto overflow-hidden flex flex-col box-border print:break-after-page"
>
    <style dangerouslySetInnerHTML={{
        __html: `
@media print {
  @page {
    size: tabloid;
    margin: 0mm;
  }
              body {
    background - color: transparent!important;
    -webkit - print - color - adjust: exact;
    print - color - adjust: exact;
  }
}
`}} />

    {/* ESPACIO INTERIOR DE LA PÁGINA */}
    <div className="p-3 h-full flex flex-col border-[2px] border-black m-6 print:m-[5mm] relative">

        {/* HEADER TIPO PERIÓDICO */}
        <div className="border-b-[2px] border-black pb-2 mb-2 flex flex-col items-center justify-center">
            <h1 className="text-6xl font-SpaceGrotesk font-bold tracking-tighter uppercase leading-none text-center">
                Proyecto Café
            </h1>
            <div className="w-full border-t border-b border-black py-0.5 mt-1 flex justify-between px-2 text-[10px] font-LilitaOne tracking-widest uppercase">
                <span>{leng ? "MENÚ OFICIAL" : "OFFICIAL MENU"}</span>
                <span>•</span>
                <span>{leng ? "MEDELLÍN, COLOMBIA" : "MEDELLIN, COLOMBIA"}</span>
                <span>•</span>
                <span>EDICIÓN 11x17 TABL.</span>
            </div>
        </div>

        {/* COLUMNAS MODULARES DENSAS */}
        <div className="grid grid-cols-4 gap-2 lg:gap-3 text-[10px] leading-tight flex-grow pb-1">

            {/* COLUMNA 1: CAFE & EMBOTELLADOS */}
            <div className="flex flex-col gap-2 border-r border-dotted border-black pr-2 lg:pr-3">
                <div className="flex flex-col gap-1">
                    <h3 className="font-LilitaOne text-xl text-center uppercase tracking-wide border-y-[1px] border-black py-0.5 bg-black text-white">
                        {!leng ? "Café" : "Coffee"}
                    </h3>
                    <CardGridPrint products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} />
                    <div className="w-full border-b border-black my-0.5 opacity-50"></div>
                    <CardGridPrint products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} />
                </div>

                <div className="flex flex-col gap-1 border-t-[1px] border-black pt-2 mt-auto">
                    <h3 className="font-LilitaOne text-lg text-center uppercase tracking-wide border-b border-black pb-0.5">
                        {!leng ? "Embotellados" : "Bottled"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Opciones", EN: "Options" }} isEnglish={leng} />
                </div>
            </div>

            {/* COLUMNA 2: BEBIDAS */}
            <div className="flex flex-col gap-2 border-r border-dotted border-black pr-2 lg:pr-3">
                <div className="flex flex-col gap-1">
                    <h3 className="font-LilitaOne text-xl text-center uppercase tracking-wide border-y-[1px] border-black py-0.5 bg-black text-white">
                        {!leng ? "Bebidas" : "Drinks"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} />
                    <div className="w-full border-b border-black my-0.5 opacity-50"></div>
                    <CardGridPrint products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} />
                </div>

                <div className="flex flex-col gap-1 border-t-[1px] border-black pt-2 mt-auto">
                    <h3 className="font-LilitaOne text-lg text-center uppercase tracking-wide border-b border-black pb-0.5">
                        {!leng ? "Extras Bebidas" : "Drink Extras"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Opciones", EN: "Options" }} isEnglish={leng} />
                </div>
            </div>

            {/* COLUMNA 3: DESAYUNO Y HORNEADOS */}
            <div className="flex flex-col gap-2 border-r border-dotted border-black pr-2 lg:pr-3">
                <div className="flex flex-col gap-1">
                    <h3 className="font-LilitaOne text-xl text-center uppercase tracking-wide border-y-[1px] border-black py-0.5 bg-black text-white">
                        {!leng ? "Desayuno" : "Breakfast"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Dulce", EN: "Sweet" }} isEnglish={leng} />
                    <div className="w-full border-b border-black my-0.5 opacity-50"></div>
                    <CardGridPrint products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Salado", EN: "Savory" }} isEnglish={leng} />
                </div>

                <div className="flex flex-col gap-1 border-t-[1px] border-black pt-2 mt-auto">
                    <h3 className="font-LilitaOne text-lg text-center uppercase tracking-wide border-b border-black pb-0.5">
                        {!leng ? "Horneados" : "Baked Goods"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Salado", EN: "Savory" }} isEnglish={leng} />
                    <div className="w-full border-b border-black my-0.5 opacity-50"></div>
                    <CardGridPrint products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Dulce", EN: "Sweet" }} isEnglish={leng} />
                </div>
            </div>

            {/* COLUMNA 4: TARDEO Y EXTRAS */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <h3 className="font-LilitaOne text-xl text-center uppercase tracking-wide border-y-[1px] border-black py-0.5 bg-black text-white">
                        {!leng ? "Tardeo" : "Evening"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Opciones", EN: "Options" }} isEnglish={leng} />
                </div>

                <div className="flex flex-col gap-1 border-t-[1px] border-black pt-2 mt-auto">
                    <h3 className="font-LilitaOne text-lg text-center uppercase tracking-wide border-b border-black pb-0.5">
                        {!leng ? "Extras Comida" : "Food Extras"}
                    </h3>
                    <CardGridPrint products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Opciones", EN: "Options" }} isEnglish={leng} />
                </div>
            </div>

        </div>



    </div>
</div>