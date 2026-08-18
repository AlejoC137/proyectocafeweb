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
  TARDEO, ADICIONES_BEBIDAS, ADICIONES_COMIDAS,
  HELADOS, CATEGORIES_t
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
  showItemDescriptions,
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
  deleteBlock,
  openGallery
}) => {

  const renderBlockControls = (id, showColumnToggle = false) => {
    if (!editMode) return null;
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === (pagesCount - 1);
    const isRemovable = true; // Permitir eliminar cualquier bloque del layout

    const colKey = `__${id}_columns`;
    const currentCols = groupDescriptions[colKey] || 2;

    return (
      <div className="absolute top-1 right-1 flex flex-col gap-1 z-50 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
        {showColumnToggle && (
          <div className="flex items-center gap-1 bg-blue-50 px-1 rounded-sm border border-black h-6">
            <span className="text-[8px] font-black text-blue-700">COL:</span>
            <input 
              type="number"
              min="1"
              max="5"
              className="w-6 bg-transparent text-[10px] font-bold outline-none text-center"
              value={currentCols}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                saveGroupDescriptions({ ...groupDescriptions, [colKey]: val });
              }}
            />
          </div>
        )}
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'up', pageIndex, columnId)} title="Subir">↑</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'down', pageIndex, columnId)} title="Bajar">↓</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'right', pageIndex, columnId)} title="Mover a Derecha">→</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'left', pageIndex, columnId)} title="Mover a Izquierda">←</Button>

        {isRemovable && (
          <Button size="sm" variant="destructive" className="h-6 w-6 p-0 text-xs rounded-sm border border-black mt-1" onClick={() => deleteBlock(id)} title="Eliminar Bloque">X</Button>
        )}

        {showColumnToggle && (
          <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-black/20">
            <div className="flex items-center gap-1 justify-between" title="Alineación del Precio">
              <span className="text-[8px] font-black text-gray-500">ALN:</span>
              <select 
                className="w-10 text-[8px] font-bold border border-black outline-none bg-white p-0 h-4 cursor-pointer"
                value={groupDescriptions[`${id}_priceAlign`] || colors?.priceAlign || 'right'}
                onChange={(e) => {
                  saveGroupDescriptions({ ...groupDescriptions, [`${id}_priceAlign`]: e.target.value });
                }}
              >
                <option value="right">Der.</option>
                <option value="left">Jun.</option>
              </select>
            </div>
            {(groupDescriptions[`${id}_priceAlign`] || colors?.priceAlign || 'right') === 'left' && (
              <div className="flex items-center gap-1 justify-between" title="Distancia del Precio">
                <span className="text-[8px] font-black text-gray-500">GAP:</span>
                <input 
                  type="number"
                  className="w-8 text-[8px] h-4 font-bold border border-black outline-none text-center bg-white"
                  value={groupDescriptions[`${id}_priceGap`] ?? colors?.priceGap ?? 5}
                  onChange={(e) => {
                    saveGroupDescriptions({ ...groupDescriptions, [`${id}_priceGap`]: parseInt(e.target.value) || 0 });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGroupDescription = (groupId, isTitleStyle = false) => {
    const langKey = leng ? 'en' : 'es';
    const baseGroupId = String(groupId).split('_')[0];
    const text = groupDescriptions[groupId]?.[langKey] || groupDescriptions[baseGroupId]?.[langKey] || '';

    if (editMode) {
      return (
        <div className="flex-none min-w-[50px] flex items-center">
          <input
            type="text"
            className={isTitleStyle 
              ? "w-full bg-transparent border-b border-dashed border-gray-400 print:hidden outline-none text-center font-black tracking-[0.1em]" 
              : "w-full text-[9px] font-SpaceGrotesk px-1 py-0 border-b border-dashed border-gray-400 bg-yellow-50 print:hidden outline-none"}
            style={isTitleStyle ? { 
              fontFamily: colors.fontCategory || "'First Bunny', sans-serif", 
              color: colors.categoryTitle, 
              fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}`,
              textTransform: 'uppercase'
            } : {}}
            placeholder={`Desc ${langKey}...`}
            value={text}
            onChange={(e) => {
              setGroupDescriptions(prev => ({
                ...prev,
                [groupId]: { ...(prev[groupId] || prev[baseGroupId] || {}), [langKey]: e.target.value }
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
      <div className="flex-none flex items-center">
        <p className={isTitleStyle 
          ? "leading-none whitespace-nowrap uppercase font-black tracking-[0.1em]" 
          : "leading-none text-gray-500 italic truncate"} 
          style={isTitleStyle ? { 
            fontFamily: colors.fontCategory || "'First Bunny', sans-serif", 
            color: colors.categoryTitle, 
            fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}`,
            marginLeft: '4px'
          } : { 
            fontFamily: colors.fontBody || 'Space Grotesk', 
            fontSize: `${colors.sizeComment || 9}${colors.fontSizeUnit || 'px'}` 
          }}>
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
      <div key={id} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
        {renderBlockControls(id, true)}
        <div className="border-b-[2px] p-0 flex flex-col items-center justify-center gap-0 rounded-t-[4px]" style={{ ...headerStyles.INFO, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
          {editMode ? (
            <input
              className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none w-full text-center tracking-[0.4em]"
              style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
              value={title}
              onChange={(e) => {
                setGroupDescriptions(prev => ({ ...prev, [titleKey]: e.target.value }));
              }}
              onBlur={() => saveGroupDescriptions(groupDescriptions)}
            />
          ) : (
            <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center w-full tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
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

  const renderItemBlock = (id) => {
    const langKey = leng ? 'en' : 'es';
    
    // Find assigned product ID
    const savedProductId = groupDescriptions[`item_${id}_productId`];
    const parts = String(id).split('_');
    const fallbackProductId = parts.length >= 3 ? parts[1] : (parts.length === 2 && parts[1] !== 'CUSTOM' ? parts[1] : null);
    const activeProductId = savedProductId || fallbackProductId;

    // Display mode: 'normal' | 'ampliado' | 'solo_imagen'
    const displayMode = groupDescriptions[`item_${id}_mode`] || 'normal';

    const productList = Array.isArray(menuData) ? menuData : [];
    const product = productList.find(p => String(p._id) === String(activeProductId)) || productList[0];

    if (!product) {
      return (
        <div key={id} className="border-2 border-black p-3 text-center text-xs font-bold text-gray-500 bg-gray-50 rounded-[6px] relative group">
          {renderBlockControls(id)}
          Ítem de menú no disponible
        </div>
      );
    }

    const itemTitle = leng ? (product.NombreEN || product.NombreES) : product.NombreES;
    const itemDesc = leng 
      ? (product.DescripcionMenuEN || product.DescripcionEN || product.MenuComentsEN || "") 
      : (product.DescripcionMenuES || product.DescripcionES || product.MenuComentsES || "");
    const itemPhoto = product.Foto || product.foto || product.ImagenUrl || product.url;
    const formattedPrice = product.Precio >= 1000 
      ? `$${(product.Precio / 1000).toFixed(product.Precio % 1000 === 0 ? 0 : 1)}K` 
      : `$${product.Precio}`;

    return (
      <div 
        key={id} 
        className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] transition-all overflow-hidden"
        style={{ 
          borderColor: colors.categoryBorder || '#000000', 
          boxShadow: `4px 4px 0px 0px ${colors.categoryBorder || '#000000'}`, 
          backgroundColor: colors.blockBg || '#ffffff' 
        }}
      >
        {/* Controles Estándar del Bloque (Mover/Eliminar) */}
        {renderBlockControls(id)}

        {/* Panel de Configuración de Modo e Ítem en Modo Edición */}
        {editMode && (
          <div className="bg-yellow-100 border-b-2 border-black p-1.5 flex flex-wrap items-center justify-between gap-1 z-40 print:hidden text-[10px] font-SpaceGrotesk">
            <div className="flex items-center gap-1">
              <span className="font-black text-gray-800 uppercase">VISTA:</span>
              <div className="flex bg-white border border-black rounded overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <button
                  onClick={() => saveGroupDescriptions({ ...groupDescriptions, [`item_${id}_mode`]: 'normal' })}
                  className={`px-1.5 py-0.5 font-bold uppercase transition-colors ${displayMode === 'normal' ? 'bg-black text-white' : 'hover:bg-gray-200 text-black'}`}
                  title="Modo Normal (Fila compacta)"
                >
                  Normal
                </button>
                <button
                  onClick={() => saveGroupDescriptions({ ...groupDescriptions, [`item_${id}_mode`]: 'ampliado' })}
                  className={`px-1.5 py-0.5 font-bold uppercase transition-colors border-l border-black ${displayMode === 'ampliado' ? 'bg-black text-white' : 'hover:bg-gray-200 text-black'}`}
                  title="Modo Ampliado (Foto y Descripción)"
                >
                  Ampliado
                </button>
                <button
                  onClick={() => saveGroupDescriptions({ ...groupDescriptions, [`item_${id}_mode`]: 'solo_imagen' })}
                  className={`px-1.5 py-0.5 font-bold uppercase transition-colors border-l border-black ${displayMode === 'solo_imagen' ? 'bg-black text-white' : 'hover:bg-gray-200 text-black'}`}
                  title="Modo Solo Imagen"
                >
                  Solo Imagen
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 max-w-[200px]">
              <span className="font-black text-gray-800 uppercase">ÍTEM:</span>
              <select
                className="text-[9px] font-bold border border-black bg-white rounded p-0.5 outline-none max-w-[140px] truncate"
                value={product._id}
                onChange={(e) => {
                  saveGroupDescriptions({
                    ...groupDescriptions,
                    [`item_${id}_productId`]: e.target.value
                  });
                }}
              >
                {productList.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.NombreES} (${p.Precio})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 1. MODO NORMAL */}
        {displayMode === 'normal' && (
          <div className="p-2 flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2 border-b border-dashed pb-1" style={{ borderColor: colors.gridBorder || '#0000001a' }}>
              <span 
                className="font-black uppercase tracking-tight truncate text-left"
                style={{ 
                  fontFamily: colors.fontItem || 'Space Grotesk', 
                  color: colors.itemName || '#000000',
                  fontSize: `${colors.sizeItem || 11}${colors.fontSizeUnit || 'px'}`
                }}
              >
                {itemTitle}
              </span>
              <span 
                className="font-black shrink-0"
                style={{ 
                  fontFamily: colors.fontItem || 'Space Grotesk', 
                  color: colors.itemPrice || '#000000',
                  fontSize: `${colors.sizePrice || 11}${colors.fontSizeUnit || 'px'}`
                }}
              >
                {formattedPrice}
              </span>
            </div>
            {showItemDescriptions && itemDesc && (
              <p 
                className="text-left italic leading-tight mt-0.5"
                style={{ 
                  fontFamily: colors.fontBody || 'Inter', 
                  color: colors.itemComment || '#6b7280',
                  fontSize: `${colors.sizeComment || 9}${colors.fontSizeUnit || 'px'}`
                }}
              >
                {itemDesc}
              </p>
            )}
          </div>
        )}

        {/* 2. MODO AMPLIADO */}
        {displayMode === 'ampliado' && (
          <div className="flex flex-col w-full">
            {itemPhoto ? (
              <div className="relative w-full aspect-[16/9] border-b-[2px] overflow-hidden bg-gray-100" style={{ borderColor: colors.categoryBorder || '#000000' }}>
                <img
                  src={itemPhoto}
                  alt={itemTitle}
                  className="w-full h-full object-cover"
                />
                {product.AproxTime && (
                  <div className="absolute top-1.5 left-1.5 bg-white border border-black px-1.5 py-0.5 font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ⏱️ {product.AproxTime}m
                  </div>
                )}
                {(product.DietaES || product.DietaEN) && (
                  <div className="absolute top-1.5 right-1.5 bg-green-100 text-green-900 border border-black px-1.5 py-0.5 font-bold text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    🌱 {leng ? product.DietaEN : product.DietaES}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 bg-yellow-50 border-b border-black text-center text-[10px] italic text-gray-500 font-bold">
                (Sin foto asignada en menú)
              </div>
            )}

            <div className="p-2.5 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2 border-b-2 pb-1.5" style={{ borderColor: colors.categoryBorder || '#000000' }}>
                <h3 
                  className="font-black uppercase tracking-tight leading-tight text-left"
                  style={{ 
                    fontFamily: colors.fontCategory || colors.fontItem || "'First Bunny', sans-serif", 
                    color: colors.itemName || '#000000',
                    fontSize: `${(colors.sizeItem || 11) * 1.3}${colors.fontSizeUnit || 'px'}`
                  }}
                >
                  {itemTitle}
                </h3>
                <span 
                  className="font-black bg-black text-white px-2 py-0.5 rounded-sm shrink-0 leading-none"
                  style={{ 
                    fontFamily: colors.fontItem || 'Space Grotesk', 
                    fontSize: `${(colors.sizePrice || 11) * 1.1}${colors.fontSizeUnit || 'px'}`
                  }}
                >
                  {formattedPrice}
                </span>
              </div>

              {itemDesc && (
                <p 
                  className="text-left font-medium leading-snug mt-1"
                  style={{ 
                    fontFamily: colors.fontBody || 'Inter', 
                    color: colors.itemComment || '#4b5563',
                    fontSize: `${colors.sizeComment || 9}${colors.fontSizeUnit || 'px'}`
                  }}
                >
                  {itemDesc}
                </p>
              )}

              {Array.isArray(product.IngredientesBasicos) && product.IngredientesBasicos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-gray-200">
                  {product.IngredientesBasicos.map((ing, idx) => (
                    <span key={idx} className="bg-gray-100 border border-gray-300 text-[8px] font-bold px-1.5 py-0.5 rounded text-gray-700 uppercase">
                      {ing}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. MODO SOLO IMAGEN */}
        {displayMode === 'solo_imagen' && (
          <div className="flex flex-col w-full items-center justify-center p-1 bg-white">
            {itemPhoto ? (
              <div className="relative w-full overflow-hidden" style={{ height: `${groupDescriptions[`${id}_imgHeight`] || 180}px` }}>
                <img
                  src={itemPhoto}
                  alt={itemTitle}
                  className="w-full h-full object-cover rounded-sm border"
                  style={{ borderColor: colors.imgBorder || '#000000' }}
                />
              </div>
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-400 text-gray-500 font-bold text-xs p-2 text-center">
                📷 {itemTitle} (Sin foto asignada en menú)
              </div>
            )}
            {editMode && (
              <div className="w-full flex items-center justify-between text-[9px] font-bold text-gray-500 mt-1 px-1 print:hidden">
                <span>Alto imagen:</span>
                <input
                  type="number"
                  defaultValue={groupDescriptions[`${id}_imgHeight`] || 180}
                  onBlur={(e) => saveGroupDescriptions({ ...groupDescriptions, [`${id}_imgHeight`]: parseInt(e.target.value) || 180 })}
                  className="w-12 border border-black px-1 text-center bg-white"
                /> px
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const baseBlockId = String(blockId).split('_')[0];

  switch (baseBlockId) {
    case "ITEM":
      return renderItemBlock(blockId);
    case "CAFE":
      const cafeCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__CAFE_columns"] || 2;
      return (
        <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls(blockId, true)}
          <div className="border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px]" style={{ ...headerStyles.CAFE, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em]"
                style={{ width: 'fit-content', minWidth: '80px', fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_${blockId}`] || (!leng ? "Café" : "Coffee")}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${blockId}`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_${blockId}`] || (!leng ? "Café" : "Coffee")}
              </h2>
            )}
            {renderGroupDescription(blockId, true)}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix blockId={blockId} products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} columns={cafeCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_cafe_espresso`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} columns={cafeCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_cafe_metodos`} />
          </div>
        </div>
      );
    case "BEBIDAS":
      const bebidasCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__BEBIDAS_columns"] || 2;
      return (
        <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls(blockId, true)}
          <div className="border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px]" style={{ ...headerStyles.BEBIDAS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em]"
                style={{ width: 'fit-content', minWidth: '80px', fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_${blockId}`] || (!leng ? "Bebidas" : "Drinks")}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${blockId}`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_${blockId}`] || (!leng ? "Bebidas" : "Drinks")}
              </h2>
            )}
            {renderGroupDescription(blockId, true)}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} columns={bebidasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_bebidas_calientes`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} columns={bebidasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_bebidas_frias`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} columns={bebidasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_bebidas_embotellados`} />
          </div>
        </div>
      );
    case "ALIMENTOS":
      const alimentosCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__ALIMENTOS_columns"] || 2;
      return (
        <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls(blockId, true)}
          <div className="border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px]" style={{ ...headerStyles.ALIMENTOS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em]"
                style={{ width: 'fit-content', minWidth: '80px', fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_${blockId}`] || (!leng ? "Alimentos" : "Food")}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${blockId}`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_${blockId}`] || (!leng ? "Alimentos" : "Food")}
              </h2>
            )}
            {renderGroupDescription(blockId, true)}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_desayuno_dulce`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_desayuno_salado`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_horneados_salados`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_horneados_dulces`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_tardeo`} />
          </div>
        </div>
      );
    case "EXTRAS":
      const extrasCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__EXTRAS_columns"] || 3;
      return (
        <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls(blockId, true)}
          <div className="border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px]" style={{ ...headerStyles.EXTRAS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em]"
                style={{ width: 'fit-content', minWidth: '80px', fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_${blockId}`] || (!leng ? "Adiciones" : "Extras")}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${blockId}`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_${blockId}`] || (!leng ? "Adiciones" : "Extras")}
              </h2>
            )}
            {renderGroupDescription(blockId, true)}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} columns={extrasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_extras_bebidas`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} columns={extrasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_extras_comida`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ADICIONES"} excludeSubgrupos={[ADICIONES_BEBIDAS, ADICIONES_COMIDAS]} TITTLE={{ ES: "Otras Adiciones", EN: "Other Extras" }} isEnglish={leng} columns={extrasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_extras_generales`} />
          </div>
        </div>
      );
    case "HELADOS":
      const heladoCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__HELADOS_columns"] || 2;
      return (
        <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls(blockId, true)}
          <div className="border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px]" style={{ ...(headerStyles.HELADOS || headerStyles.ALIMENTOS), backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em]"
                style={{ width: 'fit-content', minWidth: '80px', fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_${blockId}`] || (!leng ? "Helados Dovici" : "Dovici Ice Cream")}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${blockId}`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_${blockId}`] || (!leng ? "Helados Dovici" : "Dovici Ice Cream")}
              </h2>
            )}
            {renderGroupDescription(blockId, true)}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={["HELADOS", "REPOSTERIA"]} SUB_GRUPO="SOFT" TITTLE={{ ES: "Helado Soft", EN: "Soft Serve" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_soft`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={["HELADOS", "REPOSTERIA"]} SUB_GRUPO="GELATO" TITTLE={{ ES: "Gelato Artesanal", EN: "Craft Gelato" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_gelato`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={["HELADOS", "REPOSTERIA"]} SUB_GRUPO="SORBETE" TITTLE={{ ES: "Sorbetes de Fruta", EN: "Fruit Sorbets" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_sorbete`} />
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO="HELADOS" excludeSubgrupos={["SOFT", "GELATO", "SORBETE"]} TITTLE={{ ES: "Helados Generales", EN: "General Ice Cream" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_generales`} />
          </div>
        </div>
      );
    case "QR":
      return (
        <div key="QR" className="border-[2px] p-2 flex flex-row items-center gap-3 shadow-[4px_4px_0px_0px] mt-auto relative group rounded-[6px]" style={{ borderColor: colors.mainBorder, boxShadow: `4px 4px 0px 0px ${colors.mainBorder}`, backgroundColor: colors.blockBg }}>
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
        <div key="INFO" className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls("INFO", true)}
          <div className="border-b-[2px] p-0 flex flex-col items-center justify-center gap-0 rounded-t-[4px]" style={{ ...headerStyles.INFO, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none w-full text-center tracking-[0.1em]"
                style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_INFO`] || (!leng ? "Más sobre el Menú" : "More About")}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_INFO`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center w-full tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_INFO`] || (!leng ? "Más sobre el Menú" : "More About")}
              </h2>
            )}
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
      if (String(blockId).startsWith('ITEM_')) {
        return renderItemBlock(blockId);
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
                  {openGallery ? (
                    <button 
                      onClick={() => openGallery('REPLACE_IMAGE', { blockId })}
                      className="text-blue-600 font-bold p-1 bg-blue-100 rounded leading-none text-[10px] cursor-pointer flex items-center justify-center uppercase border border-blue-300"
                      title="Reemplazar Imagen"
                    >
                      Cambiar
                    </button>
                  ) : (
                    <div className="relative">
                      <label className="text-blue-600 font-bold p-1 bg-blue-100 rounded leading-none text-[10px] cursor-pointer flex items-center justify-center uppercase border border-blue-300">
                        Cambiar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleReplaceImage(e, blockId)}
                        />
                      </label>
                    </div>
                  )}
                  <button onClick={() => deleteImage(blockId)} className="text-red-600 font-bold p-1 px-2 bg-red-100 rounded leading-none text-xs flex items-center justify-center border border-red-300">X</button>
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

      // Renderizador dinámico de categorías para cualquier action type (DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, ADICIONES, ENLATADOS, etc.)
      const catInfo = CATEGORIES_t[baseBlockId] || { es: baseBlockId, en: baseBlockId, icon: "📌" };
      const dynCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions[`__${baseBlockId}_columns`] || 2;
      return (
        <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
          {renderBlockControls(blockId, true)}
          <div className="border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px]" style={{ backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
            {editMode ? (
              <input
                className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em]"
                style={{ width: 'fit-content', minWidth: '80px', fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}
                value={groupDescriptions[`title_${blockId}`] || (!leng ? catInfo.es : catInfo.en)}
                onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${blockId}`]: e.target.value }))}
                onBlur={() => saveGroupDescriptions(groupDescriptions)}
              />
            ) : (
              <h2 className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" style={{ fontFamily: colors.fontCategory || "'First Bunny', sans-serif", color: colors.categoryTitle, fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` }}>
                {groupDescriptions[`title_${blockId}`] || (!leng ? catInfo.es : catInfo.en)}
              </h2>
            )}
            {renderGroupDescription(blockId, true)}
          </div>
          <div className="p-2">
            <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={baseBlockId} isEnglish={leng} columns={dynCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_${baseBlockId}`} />
          </div>
        </div>
      );
  }
};

export default MenuPrintBlock;
