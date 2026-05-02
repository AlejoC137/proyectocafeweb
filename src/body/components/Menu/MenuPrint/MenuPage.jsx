import React from "react";
import MenuPrintHeader from "./MenuPrintHeader";
import MenuPrintFooter from "./MenuPrintFooter";
import MenuPrintColumn from "./MenuPrintColumn";
import FondoWeb from "@/assets/fondo.png";

const MenuPage = ({ 
  page, 
  pageIndex, 
  showWebsiteBg, 
  FondoWeb, 
  websiteBgOpacity, 
  colors, 
  leng, 
  leftColRatio, 
  photosWidth, 
  photosWidthUnit, 
  editMode, 
  handleImageUpload, 
  fileInputRef, 
  uploadingImage, 
  Button, 
  commonProps 
}) => {
  return (
    <div id={`page-${pageIndex}`} className={`bg-[#fcfbf9] ${showWebsiteBg ? 'print:bg-transparent' : 'print:bg-white'} text-black shadow-2xl w-[11in] h-[17in] border mx-auto overflow-hidden flex flex-col box-border print:break-after-page print:shadow-none print:border-none print:mx-0 print:my-0 relative page-container`}>
      <div className={`p-4 h-full flex flex-col relative print:p-3 bg-[#fcfbf9] ${showWebsiteBg ? 'print:bg-transparent' : 'print:bg-white'}`}>
        {showWebsiteBg && (
          <img 
            src={FondoWeb}
            alt="background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
            style={{ 
              opacity: websiteBgOpacity 
            }}
          />
        )}

        <MenuPrintHeader colors={colors} leng={leng} />

        <div className="flex-grow grid gap-4 items-start h-full relative z-10" style={{ gridTemplateColumns: `minmax(0, ${leftColRatio}fr) minmax(0, ${100 - leftColRatio}fr) ${photosWidth}${photosWidthUnit}` }}>
          
          <MenuPrintColumn 
            blocks={page.left || []} 
            {...commonProps} 
            pageIndex={pageIndex} 
            columnId="left"
          />
          
          <MenuPrintColumn 
            blocks={page.center || []} 
            {...commonProps} 
            pageIndex={pageIndex} 
            columnId="center"
          />

          <div className="flex flex-col gap-3 relative">
            {editMode && (
              <div className="absolute -top-10 right-0 z-[60] print:hidden">
                <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
                <Button onClick={() => fileInputRef.current.click()} disabled={uploadingImage} className="font-SpaceGrotesk text-[10px] bg-green-600 p-1 px-2 h-auto text-white hover:bg-green-700">
                  {uploadingImage ? "Subiendo..." : "+ Añadir Foto"}
                </Button>
              </div>
            )}

            {(page.right || []).length === 0 && !editMode && (
              <div className="text-[10px] text-gray-400 font-bold uppercase text-center mt-10">Sin elementos</div>
            )}
            
            <MenuPrintColumn 
              blocks={page.right || []} 
              {...commonProps} 
              pageIndex={pageIndex} 
              columnId="right"
            />
          </div>

        </div>

        <MenuPrintFooter colors={colors} />
      </div>
      
      {editMode && (
        <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-[10px] rounded print:hidden font-black uppercase">
          Página {pageIndex + 1}
        </div>
      )}
    </div>
  );
};

export default MenuPage;
