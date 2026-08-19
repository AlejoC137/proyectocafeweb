import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardGridPrintMatrix } from "@/components/ui/cardGridPrintMatrix";
import QrMenu from "@/assets/QR MENU.png";
import PointingHand from "@/assets/icons/POINTINGHAND.svg";
import MenuPrintInfo from "../MenuPrintInfo";
import RecetaModal from "../../../views/ventaCompra/RecetaModal";
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

const ItemImageContainer = ({
  itemPhoto,
  itemTitle,
  product,
  leng,
  colors,
  groupDescriptions,
  setGroupDescriptions,
  saveGroupDescriptions,
  id,
  editMode
}) => {
  const imageContainerRef = useRef(null);
  const heightKey = `__${id}_height`;
  const imgHeightKey = `${id}_imgHeight`;

  return (
    <div className="relative w-full flex flex-col">
      <div 
        ref={imageContainerRef}
        className="relative w-full overflow-hidden bg-gray-100 border-b-[2px]" 
        style={{ 
          borderColor: colors.categoryBorder || '#000000',
          height: groupDescriptions[imgHeightKey] ? `${groupDescriptions[imgHeightKey]}px` : undefined,
          aspectRatio: groupDescriptions[imgHeightKey] ? undefined : '16/9'
        }}
      >
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
      {editMode && (
        <HorizontalResizeHandle
          containerRef={imageContainerRef}
          currentHeight={groupDescriptions[imgHeightKey] || 180}
          onHeightChange={(newH) => {
            setGroupDescriptions(prev => {
              const updates = { ...prev, [imgHeightKey]: newH };
              const currentBlockH = parseInt(prev[heightKey] || 0, 10);
              if (currentBlockH && currentBlockH < newH + 80) {
                updates[heightKey] = `${newH + 80}px`;
              }
              return updates;
            });
          }}
          onSaveHeight={(newH) => {
            const currentBlockH = parseInt(groupDescriptions[heightKey] || 0, 10);
            const updates = { [imgHeightKey]: newH };
            if (currentBlockH && currentBlockH < newH + 80) {
              updates[heightKey] = `${newH + 80}px`;
            }
            saveGroupDescriptions({ ...groupDescriptions, ...updates });
          }}
          color="blue"
          minHeight={40}
          maxHeight={600}
          title="Arrastrar para cambiar la altura de la foto"
        />
      )}
    </div>
  );
};

const HorizontalResizeHandle = ({
  currentHeight,
  onHeightChange,
  onSaveHeight,
  color = "purple",
  minHeight = 40,
  maxHeight = 1200,
  title = "Arrastrar para cambiar altura",
  containerRef,
  className = ""
}) => {
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const currentValRef = useRef(currentHeight);
  const [isDragging, setIsDragging] = useState(false);
  const badgeRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastHeightRef = useRef(0);

  currentValRef.current = currentHeight;

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let initialH = 180;
    const val = currentValRef.current;
    if (typeof val === 'number') {
      initialH = val;
    } else if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) {
        initialH = parsed;
      } else if (containerRef && containerRef.current) {
        initialH = containerRef.current.offsetHeight;
      }
    } else if (containerRef && containerRef.current) {
      initialH = containerRef.current.offsetHeight;
    }

    let scaleY = 1;
    if (containerRef && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const offH = containerRef.current.offsetHeight;
      if (rect.height > 0 && offH > 0) {
        scaleY = rect.height / offH;
      }
      containerRef.current.style.transition = 'none';
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = initialH;
    lastHeightRef.current = initialH;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const mouseDeltaY = moveEvent.clientY - startYRef.current;
      const canvasDeltaY = mouseDeltaY / (scaleY || 1);
      const newH = Math.max(minHeight, Math.min(maxHeight, Math.round(startHeightRef.current + canvasDeltaY)));
      
      lastHeightRef.current = newH;

      // Direct synchronous DOM update for 0ms lag
      if (containerRef && containerRef.current) {
        containerRef.current.style.height = `${newH}px`;
        containerRef.current.style.minHeight = `${newH}px`;
      }

      // Direct badge update without triggering React state re-render
      if (badgeRef.current) {
        badgeRef.current.textContent = `${newH}px`;
      }

      // Non-blocking rAF throttle for React state updates
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (onHeightChange && isDraggingRef.current) {
            onHeightChange(lastHeightRef.current);
          }
        });
      }
    };

    const handleMouseUp = (upEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }

        if (containerRef && containerRef.current) {
          containerRef.current.style.transition = '';
        }

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        const mouseDeltaY = upEvent.clientY - startYRef.current;
        const canvasDeltaY = mouseDeltaY / (scaleY || 1);
        const finalH = Math.max(minHeight, Math.min(maxHeight, Math.round(startHeightRef.current + canvasDeltaY)));
        
        if (containerRef && containerRef.current) {
          containerRef.current.style.height = `${finalH}px`;
          containerRef.current.style.minHeight = `${finalH}px`;
        }

        if (onHeightChange) {
          onHeightChange(finalH);
        }
        if (onSaveHeight) {
          onSaveHeight(finalH);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isPurple = color === 'purple';
  const borderCol = isPurple ? 'border-purple-600 shadow-purple-200' : 'border-blue-600 shadow-blue-200';
  const bgCol = isPurple ? 'bg-purple-600' : 'bg-blue-600';
  const lineHover = isPurple ? 'group-hover/handle:bg-purple-500' : 'group-hover/handle:bg-blue-500';

  return (
    <div 
      className={`w-full h-4 relative cursor-row-resize group/handle shrink-0 flex items-center justify-center print:hidden z-30 ${className}`}
      onMouseDown={handleMouseDown}
      title={title}
    >
      <div className={`absolute inset-x-0 h-0.5 bg-gray-300 ${lineHover} group-hover/handle:h-1 transition-all`}></div>
      <div className={`w-8 h-4 bg-white border-2 ${borderCol} rounded-full shadow-md z-40 flex items-center justify-center hover:scale-110 transition-transform ${isDragging ? 'ring-2 ring-purple-400 scale-110' : ''}`}>
        <div className="flex flex-col gap-0.5 pointer-events-none">
          <div className={`w-3.5 h-0.5 ${bgCol} rounded-full`}></div>
          <div className={`w-3.5 h-0.5 ${bgCol} rounded-full`}></div>
        </div>
      </div>
      {isDragging && (
        <div 
          ref={badgeRef}
          className="absolute left-1/2 -translate-x-1/2 -top-6 bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow z-50 pointer-events-none whitespace-nowrap border border-white/20"
        >
          {startHeightRef.current}px
        </div>
      )}
    </div>
  );
};

const SearchableItemSelect = ({ productList = [], activeProductId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedProduct = productList.find(p => String(p._id) === String(activeProductId)) || productList[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = productList.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const es = (p.NombreES || '').toLowerCase();
    const en = (p.NombreEN || '').toLowerCase();
    return es.includes(term) || en.includes(term);
  });

  return (
    <div className="relative flex items-center font-SpaceGrotesk" ref={containerRef}>
      <input
        type="text"
        className="w-[180px] sm:w-[210px] h-5.5 text-[9px] font-bold border border-black bg-white rounded px-1.5 py-0 outline-none leading-none truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center"
        placeholder="🔍 Escribe para buscar..."
        value={isOpen ? searchTerm : (selectedProduct ? `${selectedProduct.NombreES} ($${selectedProduct.Precio})` : '')}
        onFocus={() => {
          setSearchTerm('');
          setIsOpen(true);
        }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-[220px] max-h-52 overflow-y-auto bg-white border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[100] text-[9px] font-bold">
          {filtered.length === 0 ? (
            <div className="p-2 text-gray-400 text-center italic">Sin coincidencias</div>
          ) : (
            filtered.map(p => (
              <div
                key={p._id}
                onClick={() => {
                  onSelect(p._id);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`p-1.5 cursor-pointer hover:bg-yellow-100 border-b border-gray-100 flex justify-between items-center ${String(p._id) === String(activeProductId) ? 'bg-yellow-200 font-black' : ''}`}
              >
                <span className="truncate pr-1">{p.NombreES}</span>
                <span className="shrink-0 text-gray-700 font-black">${p.Precio}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const DimensionInput = ({ value, onApply, placeholder, className, title }) => {
  const [localVal, setLocalVal] = useState(value ?? '');
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalVal(value ?? '');
    }
  }, [value]);

  const handleApply = () => {
    onApply(localVal);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localVal}
      onFocus={() => { isFocusedRef.current = true; }}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => {
        isFocusedRef.current = false;
        handleApply();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApply();
          e.target.blur();
        }
      }}
      className={className}
      title={title}
    />
  );
};

const MenuPrintBlock = ({
  blockId,
  pageIndex,
  columnId,
  editMode,
  moveBlock,
  duplicateBlock,
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
  const [selectedRecetaItem, setSelectedRecetaItem] = useState(null);

  const parseDimensionStyle = (val, isWidth = true) => {
    if (!val || val === 'auto') return isWidth ? '100%' : undefined;
    const str = String(val).trim();

    if (isWidth) {
      if (str === '50' || str === '50%') return 'calc(50% - 0.375rem)';
      if (str === '100' || str === '100%') return '100%';
      if (str === '33' || str === '33%') return 'calc(33.333% - 0.5rem)';
      if (str === '66' || str === '66%') return 'calc(66.666% - 0.25rem)';
      
      if (str.endsWith('%')) {
        const num = parseFloat(str);
        if (!isNaN(num)) {
          if (num === 100) return '100%';
          return `calc(${num}% - 0.375rem)`;
        }
      }
      if (str.endsWith('px')) return str;

      const num = parseFloat(str);
      if (!isNaN(num)) {
        if (num <= 100) {
          if (num === 100) return '100%';
          return `calc(${num}% - 0.375rem)`;
        }
        return `${num}px`;
      }
      return str;
    } else {
      if (str.endsWith('%') || str.endsWith('px')) return str;
      const num = parseFloat(str);
      if (!isNaN(num)) return `${num}px`;
      return str;
    }
  };

  const handleOpenReceta = (prod) => {
    if (!prod) return;
    const recetaId = prod.Receta || prod.receta || prod._id;
    if (recetaId) {
      window.open(`/receta/${recetaId}`, '_blank');
    } else {
      alert("Este ítem no tiene una receta asignada.");
    }
  };

  const getBlockActiveHeight = (id) => {
    const hKey = `__${id}_height`;
    if (groupDescriptions[hKey]) return String(groupDescriptions[hKey]);
    const isImg = String(id).startsWith('IMG_');
    const isItem = String(id).startsWith('ITEM_');
    const itemM = isItem ? (groupDescriptions[`item_${id}_mode`] || 'normal') : null;
    const isSoloImg = isItem && itemM === 'solo_imagen';
    const imgO = isImg ? printImages.find(img => String(img.id) === String(id)) : null;

    if (isImg && imgO?.height) return `${imgO.height}px`;
    if (isSoloImg && groupDescriptions[`${id}_imgHeight`]) return `${groupDescriptions[`${id}_imgHeight`]}px`;
    if (groupDescriptions[`${id}_height`]) return String(groupDescriptions[`${id}_height`]);
    return '';
  };

  const renderBlockControls = (id, showColumnToggle = false) => {
    if (!editMode) return null;
    const isRemovable = true;

    const colKey = `__${id}_columns`;
    const currentCols = groupDescriptions[colKey] || 2;

    const widthKey = `__${id}_width`;
    const heightKey = `__${id}_height`;
    const currentWidth = groupDescriptions[widthKey] || '';
    const activeHeight = getBlockActiveHeight(id);
    const displayHeight = activeHeight ? String(activeHeight).replace(/px$/, '') : '';

    return (
      <div className="absolute top-1 right-1 flex flex-col gap-1 z-50 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-[6px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
        {/* Controles de Ancho y Alto (%, px, auto) */}
        <div className="flex flex-col gap-1 p-1 bg-purple-50 rounded border border-black text-[9px] font-SpaceGrotesk">
          <div className="flex items-center justify-between gap-1" title="Ancho del bloque (ej. 50%, 100%, 400px)">
            <span className="font-black text-purple-800 uppercase shrink-0">ANCHO:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`text-[8px] font-black px-1 py-0.2 rounded border transition-colors ${currentWidth === '50' || currentWidth === '50%' ? 'bg-purple-700 text-white border-purple-900' : 'bg-white text-black border-black hover:bg-purple-100'}`}
                onClick={() => {
                  const nextW = (currentWidth === '50' || currentWidth === '50%') ? '100%' : '50%';
                  saveGroupDescriptions({ ...groupDescriptions, [widthKey]: nextW });
                }}
                title="Alternar entre 50% y 100%"
              >
                50%
              </button>
              <DimensionInput
                placeholder="100%, 50%"
                value={groupDescriptions[widthKey] ?? ''}
                onApply={(val) => {
                  saveGroupDescriptions({ ...groupDescriptions, [widthKey]: val.trim() });
                }}
                className="w-12 text-[9px] font-bold p-0.5 border border-black bg-white outline-none text-center rounded"
                title="Ancho del bloque (ej. 50%, 100%, 400px)"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-1" title="Alto del bloque (ej. auto, 250px, 100%)">
            <span className="font-black text-purple-800 uppercase shrink-0">ALTO:</span>
            <DimensionInput
              placeholder="auto, 250px"
              value={displayHeight}
              onApply={(rawVal) => {
                const trimmed = String(rawVal).trim();
                const parsedNum = parseInt(trimmed, 10);
                let formattedVal = trimmed;
                if (!isNaN(parsedNum) && !trimmed.includes('%') && !trimmed.toLowerCase().includes('auto') && !trimmed.endsWith('px')) {
                  formattedVal = `${parsedNum}px`;
                }

                const isImg = String(id).startsWith('IMG_');
                const isItem = String(id).startsWith('ITEM_');
                const itemM = isItem ? (groupDescriptions[`item_${id}_mode`] || 'normal') : null;
                const isSoloImg = isItem && itemM === 'solo_imagen';

                const updates = { 
                  ...groupDescriptions, 
                  [heightKey]: formattedVal,
                  [`${id}_height`]: formattedVal
                };

                if (trimmed === '' || trimmed.toLowerCase() === 'auto') {
                  updates[heightKey] = '';
                  updates[`${id}_height`] = '';
                  delete updates[`${id}_imgHeight`];
                } else if (isSoloImg && !isNaN(parsedNum) && parsedNum > 0) {
                  updates[`${id}_imgHeight`] = parsedNum;
                } else if (isItem && itemM === 'ampliado' && !isNaN(parsedNum) && parsedNum > 0) {
                  const currentImgH = groupDescriptions[`${id}_imgHeight`] || 180;
                  if (parsedNum - 70 < currentImgH) {
                    updates[`${id}_imgHeight`] = Math.max(40, parsedNum - 70);
                  }
                }

                saveGroupDescriptions(updates);

                if (isImg && !isNaN(parsedNum) && parsedNum > 0) {
                  updateImageHeight(id, parsedNum);
                  saveImagesConfig(printImages);
                }
              }}
              className="w-12 text-[9px] font-bold p-0.5 border border-black bg-white outline-none text-center rounded"
              title="Alto del bloque (ej. auto, 250px, 100%)"
            />
          </div>
        </div>

        {/* Columnas, Alineación de Precio y Omitir Título */}
        {showColumnToggle && (
          <div className="flex flex-col gap-1 bg-blue-50 p-1 rounded border border-black text-[9px]">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <span className="font-black text-blue-800">COL:</span>
                <input 
                  type="number"
                  min="1"
                  max="5"
                  className="w-6 bg-white text-[9px] font-bold border border-black rounded outline-none text-center p-0.5"
                  value={currentCols}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    saveGroupDescriptions({ ...groupDescriptions, [colKey]: val });
                  }}
                />
              </div>
              <div className="flex items-center gap-1" title="Alineación del Precio">
                <span className="font-black text-gray-600">ALN:</span>
                <select 
                  className="text-[8px] font-bold border border-black outline-none bg-white p-0.5 rounded cursor-pointer"
                  value={groupDescriptions[`${id}_priceAlign`] || colors?.priceAlign || 'right'}
                  onChange={(e) => {
                    saveGroupDescriptions({ ...groupDescriptions, [`${id}_priceAlign`]: e.target.value });
                  }}
                >
                  <option value="right">Der.</option>
                  <option value="left">Jun.</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`flex-1 h-5 text-[8px] font-black rounded border border-black px-1 transition-colors flex items-center justify-center gap-1 cursor-pointer ${groupDescriptions[`__${id}_hide_header`] ? 'bg-amber-200 text-amber-900 border-amber-500' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveGroupDescriptions({
                    ...groupDescriptions,
                    [`__${id}_hide_header`]: !groupDescriptions[`__${id}_hide_header`]
                  });
                }}
                title={groupDescriptions[`__${id}_hide_header`] ? "Mostrar Encabezado/Título del Bloque" : "Omitir/Ocultar Encabezado del Bloque"}
              >
                {groupDescriptions[`__${id}_hide_header`] ? "👁️ Título" : "🚫 Omitir Título"}
              </button>

              <button
                type="button"
                className={`flex-1 h-5 text-[8px] font-black rounded border border-black px-1 transition-colors flex items-center justify-center gap-1 cursor-pointer ${groupDescriptions[`__${id}_hide_block`] ? 'bg-red-200 text-red-900 border-red-500' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveGroupDescriptions({
                    ...groupDescriptions,
                    [`__${id}_hide_block`]: !groupDescriptions[`__${id}_hide_block`]
                  });
                }}
                title={groupDescriptions[`__${id}_hide_block`] ? "Mostrar Bloque Completo" : "Omitir/Ocultar Bloque Completo en esta Instancia"}
              >
                {groupDescriptions[`__${id}_hide_block`] ? "👁️ Bloque" : "🚫 Omitir Bloque"}
              </button>
            </div>
          </div>
        )}

        {!showColumnToggle && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`w-full h-5 text-[8px] font-black rounded border border-black px-1 transition-colors flex items-center justify-center gap-1 cursor-pointer ${groupDescriptions[`__${id}_hide_block`] ? 'bg-red-200 text-red-900 border-red-500' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveGroupDescriptions({
                  ...groupDescriptions,
                  [`__${id}_hide_block`]: !groupDescriptions[`__${id}_hide_block`]
                });
              }}
              title={groupDescriptions[`__${id}_hide_block`] ? "Mostrar Bloque Completo" : "Omitir/Ocultar Bloque Completo en esta Instancia"}
            >
              {groupDescriptions[`__${id}_hide_block`] ? "👁️ Mostrar Bloque" : "🚫 Omitir Bloque"}
            </button>
          </div>
        )}

        {/* Botones de Dirección Horizontales */}
        <div className="flex items-center justify-between gap-1">
          <Button size="sm" variant="secondary" className="h-5 w-5 p-0 text-xs rounded border border-black cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveBlock && moveBlock(id, 'up', pageIndex, columnId); }} title="Subir">↑</Button>
          <Button size="sm" variant="secondary" className="h-5 w-5 p-0 text-xs rounded border border-black cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveBlock && moveBlock(id, 'down', pageIndex, columnId); }} title="Bajar">↓</Button>
          <Button size="sm" variant="secondary" className="h-5 w-5 p-0 text-xs rounded border border-black cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveBlock && moveBlock(id, 'left', pageIndex, columnId); }} title="Mover a Izquierda">←</Button>
          <Button size="sm" variant="secondary" className="h-5 w-5 p-0 text-xs rounded border border-black cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveBlock && moveBlock(id, 'right', pageIndex, columnId); }} title="Mover a Derecha">→</Button>
        </div>

        {/* Fila de Acciones: Duplicar + Eliminar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex-1 h-5 px-1 text-[8px] font-black rounded border border-black bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); duplicateBlock && duplicateBlock(id, pageIndex, columnId); }}
            title="Duplicar Bloque"
          >
            📋 Duplicar
          </button>
          {isRemovable && (
            <Button size="sm" variant="destructive" className="h-5 w-5 p-0 text-xs rounded border border-black shrink-0 cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBlock && deleteBlock(id); }} title="Eliminar Bloque">
              X
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderBlockHeader = (id, defaultTitleES, defaultTitleEN, customHeaderStyle = {}) => {
    const hideHeaderKey = `__${id}_hide_header`;
    const isHeaderHidden = groupDescriptions[hideHeaderKey] === true;

    const savedTitle = groupDescriptions[`title_${id}`];
    const defaultTitle = !leng ? defaultTitleES : defaultTitleEN;
    const titleVal = savedTitle !== undefined ? savedTitle : defaultTitle;

    const langKey = leng ? 'en' : 'es';
    const baseGroupId = String(id).split('_')[0];
    const descText = groupDescriptions[id]?.[langKey] || groupDescriptions[baseGroupId]?.[langKey] || '';

    const hasTitle = titleVal && titleVal.trim().length > 0;
    const hasDesc = descText && descText.trim().length > 0;

    if (isHeaderHidden && !editMode) {
      return null;
    }

    if (!hasTitle && !hasDesc && !editMode) {
      return null;
    }

    return (
      <div 
        className={`border-b-[2px] p-2 flex flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-0 rounded-t-[4px] relative ${isHeaderHidden && editMode ? 'opacity-60 bg-amber-50/60 border-dashed border-amber-400' : ''}`} 
        style={{ ...customHeaderStyle, backgroundColor: isHeaderHidden && editMode ? '#fffbeb' : colors.categoryBg, borderColor: colors.categoryBorder }}
      >
        {isHeaderHidden && editMode && (
          <span className="absolute top-0.5 left-1 text-[8px] font-black uppercase text-amber-800 bg-amber-200 px-1 rounded border border-amber-400">
            🚫 Título Omitido
          </span>
        )}
        {editMode ? (
          <input
            className="font-black uppercase leading-none m-0 bg-transparent border-none outline-none text-center tracking-[0.1em] p-0"
            style={{ 
              width: 'fit-content', 
              minWidth: '80px', 
              fontFamily: colors.fontCategory || "'First Bunny', sans-serif", 
              color: colors.categoryTitle, 
              fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` 
            }}
            placeholder="Sin título (vacío)..."
            value={titleVal}
            onChange={(e) => setGroupDescriptions(prev => ({ ...prev, [`title_${id}`]: e.target.value }))}
            onBlur={() => saveGroupDescriptions(groupDescriptions)}
          />
        ) : (
          hasTitle && (
            <h2 
              className="font-black uppercase leading-none m-0 whitespace-nowrap text-center tracking-[0.1em]" 
              style={{ 
                fontFamily: colors.fontCategory || "'First Bunny', sans-serif", 
                color: colors.categoryTitle, 
                fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}` 
              }}
            >
              {titleVal}
            </h2>
          )
        )}
        {renderGroupDescription(id, true)}
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
              ? "w-full bg-transparent border-b border-dashed border-gray-400 print:hidden outline-none text-center font-black tracking-[0.1em] p-0 m-0 leading-none" 
              : "w-full bg-transparent border-b border-dashed border-gray-400 print:hidden outline-none italic p-0 m-0 leading-none text-gray-500"}
            style={isTitleStyle ? { 
              fontFamily: colors.fontCategory || "'First Bunny', sans-serif", 
              color: colors.categoryTitle, 
              fontSize: `${(colors.sizeCategory || 20) * 2}${colors.fontSizeUnit || 'px'}`,
              textTransform: 'uppercase'
            } : {
              fontFamily: colors.fontBody || 'Space Grotesk', 
              fontSize: `${colors.sizeComment || 9}${colors.fontSizeUnit || 'px'}` 
            }}
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
    return (
      <div key={id} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] h-full" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
        {renderBlockControls(id, true)}
        {renderBlockHeader(id, "Título Personalizado", "Custom Title", headerStyles.INFO)}
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
    const rawFallback = parts.length >= 3 ? parts[1] : (parts.length === 2 && parts[1] !== 'CUSTOM' ? parts[1] : null);
    const fallbackProductId = (rawFallback && rawFallback !== 'dup') ? rawFallback : null;
    const activeProductId = savedProductId || fallbackProductId;

    // Display mode: 'normal' | 'ampliado' | 'solo_imagen'
    const displayMode = groupDescriptions[`item_${id}_mode`] || 'normal';

    const productList = Array.isArray(menuData) ? menuData : [];
    const product = productList.find(p => String(p._id) === String(activeProductId)) || productList[0];

    if (!product) {
      return (
        <div key={id} className="border-2 border-black p-3 text-center text-xs font-bold text-gray-500 bg-gray-50 rounded-[6px] relative group h-full">
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
        className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px] transition-all overflow-hidden h-full"
        style={{ 
          borderColor: colors.categoryBorder || '#000000', 
          boxShadow: `4px 4px 0px 0px ${colors.categoryBorder || '#000000'}`, 
          backgroundColor: colors.blockBg || '#ffffff' 
        }}
      >
        {/* Controles Estándar del Bloque (Mover/Eliminar/Duplicar) */}
        {renderBlockControls(id)}

        {/* Panel de Configuración de Modo e Ítem en Modo Edición */}
        {editMode && (
          <div className="bg-yellow-100 border-b-2 border-black p-1.5 flex flex-wrap items-center justify-start gap-2 z-40 print:hidden text-[10px] font-SpaceGrotesk">
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
              <button
                type="button"
                onClick={() => handleOpenReceta(product)}
                className="p-1 bg-red-100 border border-black hover:bg-red-200 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center text-xs shrink-0"
                title="Abrir Receta en nueva ventana (/receta/...)"
              >
                📕
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-black text-gray-800 uppercase leading-none text-[9px] shrink-0">ÍTEM:</span>
              <SearchableItemSelect
                productList={productList}
                activeProductId={product._id}
                onSelect={(newId) => {
                  saveGroupDescriptions({
                    ...groupDescriptions,
                    [`item_${id}_productId`]: newId
                  });
                }}
              />
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
              <ItemImageContainer
                itemPhoto={itemPhoto}
                itemTitle={itemTitle}
                product={product}
                leng={leng}
                colors={colors}
                groupDescriptions={groupDescriptions}
                setGroupDescriptions={setGroupDescriptions}
                saveGroupDescriptions={saveGroupDescriptions}
                id={id}
                editMode={editMode}
              />
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
          <div className="flex flex-col w-full h-full flex-1 items-center justify-center p-1 bg-white relative group/imgcontainer overflow-hidden min-h-0">
            {itemPhoto ? (
              <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden">
                <img
                  src={itemPhoto}
                  alt={itemTitle}
                  className="w-full h-full flex-1 object-cover rounded-sm border"
                  style={{ borderColor: colors.imgBorder || '#000000' }}
                />
              </div>
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-400 text-gray-500 font-bold text-xs p-2 text-center">
                📷 {itemTitle} (Sin foto asignada en menú)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const baseBlockId = String(blockId).split('_')[0];

  const renderBlockContent = () => {
    switch (baseBlockId) {
      case "ITEM":
        return renderItemBlock(blockId);
      case "CAFE": {
        const cafeCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__CAFE_columns"] || 2;
        return (
          <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId, true)}
            {renderBlockHeader(blockId, "Café", "Coffee", headerStyles.CAFE)}
            <div className="p-2">
              <CardGridPrintMatrix blockId={blockId} products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} columns={cafeCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_cafe_espresso`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} columns={cafeCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_cafe_metodos`} />
            </div>
          </div>
        );
      }
      case "BEBIDAS": {
        const bebidasCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__BEBIDAS_columns"] || 2;
        return (
          <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId, true)}
            {renderBlockHeader(blockId, "Bebidas", "Drinks", headerStyles.BEBIDAS)}
            <div className="p-2">
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} columns={bebidasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_bebidas_calientes`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} columns={bebidasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_bebidas_frias`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} columns={bebidasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_bebidas_embotellados`} />
            </div>
          </div>
        );
      }
      case "ALIMENTOS": {
        const alimentosCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__ALIMENTOS_columns"] || 2;
        return (
          <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId, true)}
            {renderBlockHeader(blockId, "Alimentos", "Food", headerStyles.ALIMENTOS)}
            <div className="p-2">
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_desayuno_dulce`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_desayuno_salado`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_horneados_salados`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_horneados_dulces`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} columns={alimentosCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_alimentos_tardeo`} />
            </div>
          </div>
        );
      }
      case "EXTRAS": {
        const extrasCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__EXTRAS_columns"] || 3;
        return (
          <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId, true)}
            {renderBlockHeader(blockId, "Adiciones", "Extras", headerStyles.EXTRAS)}
            <div className="p-2">
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} columns={extrasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_extras_bebidas`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} columns={extrasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_extras_comida`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={"ADICIONES"} excludeSubgrupos={[ADICIONES_BEBIDAS, ADICIONES_COMIDAS]} TITTLE={{ ES: "Otras Adiciones", EN: "Other Extras" }} isEnglish={leng} columns={extrasCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_extras_generales`} />
            </div>
          </div>
        );
      }
      case "HELADOS": {
        const heladoCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions["__HELADOS_columns"] || 2;
        return (
          <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId, true)}
            {renderBlockHeader(blockId, "Helados Dovici", "Dovici Ice Cream", headerStyles.HELADOS || headerStyles.ALIMENTOS)}
            <div className="p-2">
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={["HELADOS", "REPOSTERIA"]} SUB_GRUPO="SOFT" TITTLE={{ ES: "Helado Soft", EN: "Soft Serve" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_soft`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={["HELADOS", "REPOSTERIA"]} SUB_GRUPO="GELATO" TITTLE={{ ES: "Gelato Artesanal", EN: "Craft Gelato" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_gelato`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={["HELADOS", "REPOSTERIA"]} SUB_GRUPO="SORBETE" TITTLE={{ ES: "Sorbetes de Fruta", EN: "Fruit Sorbets" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_sorbete`} />
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO="HELADOS" excludeSubgrupos={["SOFT", "GELATO", "SORBETE"]} TITTLE={{ ES: "Helados Generales", EN: "General Ice Cream" }} isEnglish={leng} columns={heladoCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_helados_generales`} />
            </div>
          </div>
        );
      }
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
            {renderBlockHeader("INFO", "Más sobre el Menú", "More About", headerStyles.INFO)}
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
      default: {
        if (String(blockId).startsWith('CUSTOM_')) {
          return renderCustomBlock(blockId);
        }
        if (String(blockId).startsWith('ITEM_')) {
          return renderItemBlock(blockId);
        }
        const imgObj = printImages.find(img => String(img.id) === String(blockId));
        if (imgObj) {
          return (
            <div key={blockId} className="relative group border-[2px] p-2 flex flex-col items-center justify-center rounded-[6px] overflow-hidden w-full h-full flex-1" style={{ borderColor: colors.imgBorder || '#000000', boxShadow: `4px 4px 0px 0px ${colors.imgShadow || '#000000'}`, backgroundColor: colors.blockBg }}>
              {renderBlockControls(blockId)}

              <div className="w-full flex justify-between items-center mb-1 shrink-0">
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

              <div className="w-full flex-1 min-h-0 relative h-full flex flex-col overflow-hidden">
                <img
                  src={imgObj.url}
                  alt={imgObj.nameES || "Menu Image"}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/600x400?text=Imagen+Menu";
                  }}
                  className="w-full h-full flex-1 object-cover rounded-none border grayscale-[30%] contrast-[1.1] brightness-[1.05]"
                  style={{
                    borderColor: colors.imgBorder || '#000000'
                  }}
                />
              </div>
            </div>
          );
        }

        // Renderizador dinámico de categorías para cualquier action type (DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, ADICIONES, ENLATADOS, etc.)
        const catInfo = CATEGORIES_t[baseBlockId] || { es: baseBlockId, en: baseBlockId, icon: "📌" };
        const dynCols = groupDescriptions[`__${blockId}_columns`] || groupDescriptions[`__${baseBlockId}_columns`] || 2;
        return (
          <div key={blockId} className="border-[2px] shadow-[4px_4px_0px_0px] relative group rounded-[6px]" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}`, backgroundColor: colors.blockBg }}>
            {renderBlockControls(blockId, true)}
            {renderBlockHeader(blockId, catInfo.es, catInfo.en)}
            <div className="p-2">
              <CardGridPrintMatrix blockId={blockId} products={menuData} GRUPO={baseBlockId} isEnglish={leng} columns={dynCols} editMode={editMode} showIcons={showIcons} showItemDescriptions={showItemDescriptions} colors={colors} groupDescriptions={groupDescriptions} saveGroupDescriptions={saveGroupDescriptions} excludeKey={`${blockId}_exclude_${baseBlockId}`} />
            </div>
          </div>
        );
      }
    }
  };

  const blockContainerRef = useRef(null);

  const isImageBlock = String(blockId).startsWith('IMG_');
  const isItemBlock = String(blockId).startsWith('ITEM_');
  const itemMode = isItemBlock ? (groupDescriptions[`item_${blockId}_mode`] || 'normal') : null;
  const isSoloImagen = isItemBlock && itemMode === 'solo_imagen';
  const imgObj = isImageBlock ? printImages.find(img => String(img.id) === String(blockId)) : null;

  const widthKey = `__${blockId}_width`;
  const heightKey = `__${blockId}_height`;
  const blockWidthVal = groupDescriptions[widthKey] || groupDescriptions[`${blockId}_width`];
  const blockHeightVal = groupDescriptions[heightKey] || groupDescriptions[`${blockId}_height`];

  const effectiveHeightVal = getBlockActiveHeight(blockId);

  const widthStyle = parseDimensionStyle(blockWidthVal, true);
  const heightStyle = parseDimensionStyle(effectiveHeightVal, false);

  const getCurrentHandleHeight = () => {
    return effectiveHeightVal || 'auto';
  };

  const [isDragTarget, setIsDragTarget] = useState(false);

  const handleDragStartBlock = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", JSON.stringify({ blockId, pageIndex, columnId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverBlock = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragTarget(true);
  };

  const handleDragLeaveBlock = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    setIsDragTarget(false);
  };

  const handleDropOnBlock = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragTarget(false);
    try {
      const raw = e.dataTransfer.getData("text/plain");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.blockId && data.blockId !== blockId && props.reorderBlock) {
        props.reorderBlock(data.blockId, blockId, pageIndex, columnId, 'before');
      }
    } catch (err) {
      console.error("Drop block error:", err);
    }
  };

  const hideBlockKey = `__${blockId}_hide_block`;
  const isBlockHidden = groupDescriptions[hideBlockKey] === true;

  if (isBlockHidden && !editMode) {
    return null;
  }

  return (
    <>
      <div 
        ref={blockContainerRef}
        draggable={editMode}
        onDragStart={handleDragStartBlock}
        onDragOver={handleDragOverBlock}
        onDragLeave={handleDragLeaveBlock}
        onDrop={handleDropOnBlock}
        className={`box-border shrink-0 grow-0 transition-shadow duration-150 relative group/blockwrapper flex flex-col z-20 hover:z-40 ${isDragTarget ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isBlockHidden && editMode ? 'opacity-50 grayscale border-2 border-dashed border-red-500 rounded-[6px] bg-red-50/50' : ''}`} 
        style={{ 
          width: widthStyle,
          height: heightStyle || undefined,
          minHeight: heightStyle || undefined
        }}
      >
        {isBlockHidden && editMode && (
          <div className="bg-red-600 text-white font-black text-[9px] uppercase px-2 py-0.5 text-center flex items-center justify-center gap-1 z-30 shrink-0">
            🚫 Bloque Omitido en esta Instancia
          </div>
        )}
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden rounded-[6px]">
          {renderBlockContent()}
        </div>

        {editMode && (
          <HorizontalResizeHandle
            currentHeight={effectiveHeightVal || 'auto'}
            containerRef={blockContainerRef}
            onHeightChange={(newH) => {
              if (isImageBlock) {
                updateImageHeight(blockId, newH);
              }
              setGroupDescriptions(prev => {
                const updates = { ...prev, [heightKey]: `${newH}px` };
                if (isSoloImagen) {
                  updates[`${blockId}_imgHeight`] = newH;
                } else if (itemMode === 'ampliado') {
                  const currentImgH = prev[`${blockId}_imgHeight`] || 180;
                  const minTextH = 70;
                  if (newH - minTextH < currentImgH) {
                    updates[`${blockId}_imgHeight`] = Math.max(40, newH - minTextH);
                  }
                }
                return updates;
              });
            }}
            onSaveHeight={(newH) => {
              const updates = { [heightKey]: `${newH}px` };
              if (isImageBlock) {
                updateImageHeight(blockId, newH);
                saveImagesConfig(printImages);
              } else if (isSoloImagen) {
                updates[`${blockId}_imgHeight`] = newH;
              } else if (itemMode === 'ampliado') {
                const currentImgH = groupDescriptions[`${blockId}_imgHeight`] || 180;
                const minTextH = 70;
                if (newH - minTextH < currentImgH) {
                  updates[`${blockId}_imgHeight`] = Math.max(40, newH - minTextH);
                }
              }
              saveGroupDescriptions({ ...groupDescriptions, ...updates });
            }}
            color="purple"
            minHeight={isSoloImagen ? 40 : (itemMode === 'ampliado' ? 100 : (isImageBlock ? 40 : 40))}
            maxHeight={1200}
            title="Arrastrar para cambiar el alto del bloque"
            className="absolute -bottom-2 inset-x-0 z-50"
          />
        )}
      </div>

      {selectedRecetaItem && (
        <RecetaModal 
          item={selectedRecetaItem} 
          onClose={() => setSelectedRecetaItem(null)} 
        />
      )}
    </>
  );
};

export default MenuPrintBlock;

