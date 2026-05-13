import React from "react";
import { Button } from "@/components/ui/button";
import { CardGridPrintMatrix } from "@/components/ui/cardGridPrintMatrix";
import QrMenu from "@/assets/QR MENU.png";
import PointingHand from "@/assets/icons/POINTINGHAND.svg";
import MenuPrintInfo from "../MenuPrintInfo";
import {
  CAFE, BEBIDAS, CAFE_METODOS, CAFE_ESPRESSO,
  BEBIDAS_FRIAS, BEBIDAS_CALIENTES,
  DESAYUNO, DESAYUNO_DULCE, DESAYUNO_SALADO,
  PANADERIA, PANADERIA_REPOSTERIA_SALADA,
  REPOSTERIA, PANADERIA_REPOSTERIA_DULCE,
  TARDEO, ADICIONES_BEBIDAS, ADICIONES_COMIDAS
} from "../../../../redux/actions-types";
import { headerStyles } from "./MenuPrintStyles";

const MenuPrintBlock = ({
  blockId,
  pageIndex,
  columnId,
  editMode,
  moveBlock,
  colors,
  leng,
  groupDescriptions,
  setGroupDescriptions,
  saveGroupDescriptions,
  saveLayoutSizes,
  menuData,
  showIcons,
  qrScale,
  setQrScale,
  printImages,
  setPrintImages,
  saveImagesConfig,
  uploadingImage,
  handleReplaceImage,
  deleteImage,
  updateImageHeight,
  pagesCount,
  deleteBlock
}) => {

  const renderBlockControls = (id, showColumnToggle = false) => {
    if (!editMode) return null;
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === (pagesCount - 1);
    const isRemovable = true; // Permitir eliminar cualquier bloque del layout

    const colKey = `__${id}_columns`;
    const currentCols = groupDescriptions[colKey] || 2;

    return (
      <div className="absolute -top-3 -right-3 flex flex-col gap-1 z-20 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
        {showColumnToggle && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-12 p-0 text-[8px] rounded-sm border border-black bg-blue-50 hover:bg-blue-100 font-bold"
            onClick={() => {
              const nextCols = currentCols === 2 ? 1 : 2;
              saveGroupDescriptions({ ...groupDescriptions, [colKey]: nextCols });
            }}
            title="Cambiar Columnas"
          >
            {currentCols} COL
          </Button>
        )}
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'up', pageIndex, columnId)} title="Subir">↑</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'down', pageIndex, columnId)} title="Bajar">↓</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'right', pageIndex, columnId)} title="Mover a Derecha">→</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'left', pageIndex, columnId)} title="Mover a Izquierda">←</Button>

        {isRemovable && (
          <Button size="sm" variant="destructive" className="h-6 w-6 p-0 text-xs rounded-sm border border-black mt-1" onClick={() => deleteBlock(id)} title="Eliminar Bloque">X</Button>
        )}
      </div>
    );
  };

  const renderGroupDescription = (groupId) => {
    const langKey = leng ? 'en' : 'es';
    const text = groupDescriptions[groupId]?.[langKey] || '';

    if (editMode) {
      return (
        <div className="flex-1 min-w-0 flex items-center">
          <input
            type="text"
            className="w-full text-[9px] font-SpaceGrotesk px-1 py-0 border-b border-dashed border-gray-400 bg-yellow-50 print:hidden outline-none"
            placeholder={`Desc ${langKey}...`}
            value={text}
            onChange={(e) => {
              setGroupDescriptions(prev => ({
                ...prev,
                [groupId]: { ...(prev[groupId] || {}), [langKey]: e.target.value }
              }));
            }}
            onBlur={() => {
              saveGroupDescriptions(groupDescriptions);
            }}
          />
        </div>
      );
    }

    if (!text.trim()) return null;

    return (
      <div className="flex-1 min-w-0 flex items-center pb-[2px]">
        <p className="leading-none text-gray-500 italic truncate" style={{ fontFamily: colors.fontBody || 'Space Grotesk', fontSize: `${colors.sizeComment || 9}${colors.fontSizeUnit || 'px'}` }}>
          {text}
        </p>
      </div>
    );
  };

  const renderCustomBlock = (id) => {
    const langKey = leng ? 'en' : 'es';
    const titleKey = `${id}_title_${langKey}`;
    const title = groupDescriptions[titleKey] || (leng ? "Custom Title" : "Título Personalizado");

    return (
      <div key={id} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
        {renderBlockControls(id, true)}
        <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.INFO, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
          {editMode ? (
            <input
              className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none w-full"
              style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}
              value={title}
              onChange={(e) => {
                setGroupDescriptions(prev => ({ ...prev, [titleKey]: e.target.value }));
              }}
              onBlur={() => saveGroupDescriptions(groupDescriptions)}
            />
          ) : (
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}>
              {title}
            </h2>
          )}
        </div>
        <div className="p-2 leading-tight italic" style={{ color: colors.itemComment, fontFamily: colors.fontBody || 'Space Grotesk', fontSize: `${colors.sizeComment || 9}${colors.fontSizeUnit || 'px'}` }}>
          <MenuPrintInfo
            isEnglish={leng}
            editMode={editMode}
            groupDescriptions={groupDescriptions}
            saveGroupDescriptions={saveGroupDescriptions}
            className="p-0 m-0 w-full"
            // We need to tell MenuPrintInfo which key to use
            storageKey={id}
          />
        </div>
      </div>
    );
  };

  switch (blockId) {
    case "CAFE":
      return (
        <div key="CAFE" className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("CAFE")}
          <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.CAFE, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}>
              {!leng ? "Café" : "Coffee"}
            </h2>
            {renderGroupDescription("CAFE")}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
          </div>
        </div>
      );
    case "BEBIDAS":
      return (
        <div key="BEBIDAS" className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("BEBIDAS")}
          <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.BEBIDAS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}>
              {!leng ? "Bebidas" : "Drinks"}
            </h2>
            {renderGroupDescription("BEBIDAS")}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
          </div>
        </div>
      );
    case "ALIMENTOS":
      return (
        <div key="ALIMENTOS" className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("ALIMENTOS")}
          <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.ALIMENTOS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}>
              {!leng ? "Alimentos" : "Food"}
            </h2>
            {renderGroupDescription("ALIMENTOS")}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
          </div>
        </div>
      );
    case "EXTRAS":
      return (
        <div key="EXTRAS" className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("EXTRAS")}
          <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.EXTRAS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}>
              {!leng ? "Adiciones" : "Extras"}
            </h2>
            {renderGroupDescription("ADICIONES")}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} columns={3} editMode={editMode} showIcons={showIcons} colors={colors} />
            <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} columns={3} editMode={editMode} showIcons={showIcons} colors={colors} />
          </div>
        </div>
      );
    case "QR":
      return (
        <div key="QR" className="border-[2px] p-2 flex flex-row items-center gap-3 shadow-[4px_4px_0px_0px] mt-auto relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.mainBorder, boxShadow: `4px 4px 0px 0px ${colors.mainBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("QR")}
          <img src={QrMenu} alt="QR Menu" className="mix-blend-multiply flex-shrink-0" style={{ width: `${64 * qrScale}px`, height: `${64 * qrScale}px`, minWidth: `${64 * qrScale}px` }} />
          <div>
            <p className="font-SpaceGrotesk font-black uppercase leading-tight" style={{ fontSize: `${Math.max(6, 10 * qrScale)}px`, color: colors.mainTitle }}>
              {!leng ? "Escanea para ver fotos y promociones" : "Scan for photos and specials"}
            </p>
            <div className="flex gap-1 mt-1">
              <img src={PointingHand} alt="Point" style={{ height: `${48 * qrScale}px`, width: 'auto' }} />
            </div>
          </div>
          {editMode && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity print:hidden text-white p-2 text-xs font-SpaceGrotesk">
              <div className="flex items-center gap-2 w-full justify-center">
                <span className="text-right font-bold">Escalar Todo:</span>
                <input type="range" min="0.5" max="3" step="0.1" value={qrScale} onChange={e => setQrScale(Number(e.target.value))} onMouseUp={() => saveLayoutSizes({ qrScale: Number(qrScale) })} onTouchEnd={() => saveLayoutSizes({ qrScale: Number(qrScale) })} className="w-24 cursor-pointer" />
                <span>{(qrScale * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      );
    case "INFO":
      return (
        <div key="INFO" className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("INFO", true)}
          <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.INFO, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${colors.sizeCategory || 20}${colors.fontSizeUnit || 'px'}` }}>
              {!leng ? "Más sobre el Menú" : "More About"}
            </h2>
          </div>
          <div className="p-2 text-[9px] leading-tight font-SpaceGrotesk italic" style={{ color: colors.itemComment }}>
            <MenuPrintInfo
              isEnglish={leng}
              editMode={editMode}
              groupDescriptions={groupDescriptions}
              saveGroupDescriptions={saveGroupDescriptions}
              className="p-0 m-0 w-full"
            />
          </div>
        </div>
      );
    default:
      if (String(blockId).startsWith('CUSTOM_')) {
        return renderCustomBlock(blockId);
      }
      const imgObj = printImages.find(img => String(img.id) === String(blockId));
      if (imgObj) {
        return (
          <div key={blockId} className="relative group border-[2px] p-2 flex flex-col items-center justify-center rounded-[6px] overflow-hidden" style={{ borderColor: colors.imgBorder || '#000000', boxShadow: `4px 4px 0px 0px ${colors.imgShadow || '#000000'}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId)}

            <div className="w-full flex justify-between items-center mb-1">
              {editMode ? (
                <input
                  type="text"
                  defaultValue={leng ? (imgObj.nameEN || '') : (imgObj.nameES || '')}
                  placeholder={leng ? "Image Name (English)" : "Nombre de Imagen (Español)"}
                  onBlur={(e) => {
                    const updatedName = e.target.value;
                    const newImages = printImages.map(img =>
                      String(img.id) === String(blockId)
                        ? { ...img, [leng ? 'nameEN' : 'nameES']: updatedName }
                        : img
                    );
                    setPrintImages(newImages);
                    saveImagesConfig(newImages);
                  }}
                  className="text-[11px] font-bold font-SpaceGrotesk uppercase w-full border-b border-black/30 focus:outline-none focus:border-black print:hidden mb-1"
                />
              ) : (
                (leng ? imgObj.nameEN : imgObj.nameES) && (
                  <span className="text-[11px] font-bold font-SpaceGrotesk uppercase mb-1 w-full border-b-[2px] pb-1 leading-none text-center" style={{ borderColor: colors.imgBorder || '#000000', color: colors.itemName }}>
                    {leng ? imgObj.nameEN : imgObj.nameES}
                  </span>
                )
              )}
              {editMode && (
                <div className="flex gap-2 print:hidden ml-2 items-center shrink-0">
                  <label className="text-blue-600 font-bold p-1 bg-blue-100 rounded leading-none text-[10px] cursor-pointer flex items-center justify-center uppercase" title="Reemplazar Imagen">
                    Cambiar
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplaceImage(e, blockId)} disabled={uploadingImage} />
                  </label>
                  <button onClick={() => deleteImage(blockId)} className="text-red-600 font-bold p-1 px-2 bg-red-100 rounded leading-none text-xs flex items-center justify-center">X</button>
                </div>
              )}
            </div>

            <div className="w-full relative" style={{ height: `${imgObj.height || 150}px` }}>
              <img
                src={imgObj.url}
                alt={imgObj.nameES || "Menu Image"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/600x400?text=Imagen+Menu";
                }}
                className="w-full h-full object-cover rounded-none border grayscale-[30%] contrast-[1.1] brightness-[1.05]"
                style={{
                  borderColor: colors.imgBorder || '#000000'
                }}
              />
            </div>

            {editMode && (
              <div className="absolute bottom-1 left-1 bg-white border border-black p-0.5 text-[9px] z-10 print:hidden font-SpaceGrotesk opacity-0 group-hover:opacity-100 transition-opacity">
                Alto: <input type="number" defaultValue={imgObj.height || 150} onBlur={(e) => updateImageHeight(blockId, e.target.value)} className="w-10 border-b border-black/30 text-center focus:outline-none" /> px
              </div>
            )}
          </div>
        );
      }
      return null;
  }
};

export default MenuPrintBlock;
