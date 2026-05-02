import React from "react";
import MenuPrintHeader from "./MenuPrintHeader";
import MenuPrintFooter from "./MenuPrintFooter";
import MenuPrintColumn from "./MenuPrintColumn";

const MenuPage = ({
  page,
  showWebsiteBg,
  backgroundUrl,
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
  const hasBg = showWebsiteBg && backgroundUrl;

  return (
    <div
      id="page-1"
      className="bg-[#fcfbf9] text-black shadow-2xl w-[11in] h-[17in] border mx-auto flex flex-col box-border relative print:shadow-none print:border-none print:m-0 print:p-0 overflow-hidden page-container"
      style={hasBg ? {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      } : { backgroundColor: '#fcfbf9' }}
    >
      {hasBg && (
        <div
          className="absolute inset-0 pointer-events-none print-bg-overlay"
          style={{
            backgroundColor: `rgba(255,255,255,${1 - websiteBgOpacity})`,
            zIndex: 0,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        />
      )}

      <div className="relative z-0 h-full flex flex-col p-4 print:p-3 bg-transparent">

        <MenuPrintHeader colors={colors} leng={leng} />

        <div className="flex-grow grid gap-4 items-start h-full relative z-10" style={{ gridTemplateColumns: `minmax(0, ${leftColRatio}fr) minmax(0, ${100 - leftColRatio}fr) ${photosWidth}${photosWidthUnit}` }}>

          <MenuPrintColumn
            blocks={page.left || []}
            {...commonProps}
            columnId="left"
          />

          <MenuPrintColumn
            blocks={page.center || []}
            {...commonProps}
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
              columnId="right"
            />
          </div>

        </div>

        <MenuPrintFooter colors={colors} />
      </div>

    </div>
  );
};

export default MenuPage;
