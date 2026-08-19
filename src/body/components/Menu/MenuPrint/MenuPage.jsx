import React from "react";
import MenuPrintHeader from "./MenuPrintHeader";
import MenuPrintFooter from "./MenuPrintFooter";
import MenuPrintColumn from "./MenuPrintColumn";

const MenuPage = ({
  page,
  pageIndex,
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
  commonProps,
  pageWidth = 65,
  pageHeight = 65,
  pageSizeUnit = 'cm'
}) => {
  const hasBg = showWebsiteBg && backgroundUrl;
  const widthStyle = `${pageWidth}${pageSizeUnit}`;
  const heightStyle = `${pageHeight}${pageSizeUnit}`;

  return (
    <div
      id={`page-${pageIndex}`}
      className="bg-[#fcfbf9] text-black shadow-2xl border flex flex-col box-border print:shadow-none print:border-none print:m-0 print:p-0 overflow-hidden page-container shrink-0"
      style={{ 
        width: widthStyle,
        height: heightStyle,
        backgroundColor: '#fcfbf9',
        display: 'grid',
        gridTemplateColumns: '100%',
        gridTemplateRows: '100%',
      }}
    >
      {hasBg && (
        <div className="col-start-1 row-start-1 w-full h-full relative" style={{ gridArea: '1 / 1 / 2 / 2' }}>
          <img 
            src={backgroundUrl} 
            alt="Vertical Page Background" 
            className="w-full h-full object-cover pointer-events-none"
            style={{
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none print-bg-overlay z-[1]"
            style={{
              backgroundColor: `rgba(255,255,255,${1 - websiteBgOpacity})`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        </div>
      )}

      <div 
        className="col-start-1 row-start-1 relative z-10 h-full flex flex-col p-4 print:p-3 bg-transparent"
        style={{ gridArea: '1 / 1 / 2 / 2' }}
      >

        <MenuPrintHeader 
          colors={colors} 
          leng={leng} 
          title={page.title}
          editMode={editMode}
          onTitleChange={(newTitle) => commonProps.updatePageTitle && commonProps.updatePageTitle(pageIndex, newTitle)}
        />

        <div className="flex-grow grid gap-4 items-start h-full relative z-10" style={{ gridTemplateColumns: `minmax(0, ${leftColRatio}fr) minmax(0, ${100 - leftColRatio}fr) ${photosWidth}${photosWidthUnit}` }}>

          <div 
            className="flex flex-col h-full border-[3px] rounded-[8px] p-2 bg-white/80" 
            style={{ borderColor: colors.mainBorder }}
          >
            <MenuPrintColumn
              blocks={page.left || []}
              {...commonProps}
              pageIndex={pageIndex}
              columnId="left"
            />
            {editMode && (
              <div className="mt-6 mb-2 flex justify-center shrink-0 print:hidden relative z-10">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-[10px] h-6 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black cursor-pointer"
                  onClick={() => commonProps.addBlock && commonProps.addBlock(pageIndex, 'left')}
                >
                  + BLOQUE
                </Button>
              </div>
            )}
          </div>

          <div 
            className="flex flex-col h-full border-[3px] rounded-[8px] p-2 bg-white/80" 
            style={{ borderColor: colors.mainBorder }}
          >
            <MenuPrintColumn
              blocks={page.center || []}
              {...commonProps}
              pageIndex={pageIndex}
              columnId="center"
            />
            {editMode && (
              <div className="mt-6 mb-2 flex justify-center shrink-0 print:hidden relative z-10">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-[10px] h-6 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black cursor-pointer"
                  onClick={() => commonProps.addBlock && commonProps.addBlock(pageIndex, 'center')}
                >
                  + BLOQUE
                </Button>
              </div>
            )}
          </div>

          <div 
            className="flex flex-col gap-3 relative h-full border-[3px] rounded-[8px] p-2 bg-white/80"
            style={{ borderColor: colors.mainBorder }}
          >
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
            {editMode && (
              <div className="mt-6 mb-2 flex justify-center shrink-0 print:hidden relative z-10">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-[10px] h-6 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black cursor-pointer"
                  onClick={() => commonProps.addBlock && commonProps.addBlock(pageIndex, 'right')}
                >
                  + BLOQUE
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
