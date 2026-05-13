import React from "react";
import MenuPrintHeader from "../MenuPrint/MenuPrintHeader";
import MenuPrintFooter from "../MenuPrint/MenuPrintFooter";
import MenuPrintColumn from "../MenuPrint/MenuPrintColumn";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const HorizontalPage = ({
  page,
  pageIndex,
  width,
  height,
  unit,
  colors,
  leng,
  editMode,
  commonProps,
  onAddColumn,
  onRemoveColumn,
  updateColumnFlex,
  onAddBlock,
  triggerImageUpload,
  uploadingImage,
  selectedColumn,
  setSelectedColumn
}) => {
  const rulerRef = React.useRef(null);
  const [draggingHandle, setDraggingHandle] = React.useState(null); // { colIdx }

  const handleRulerMouseMove = (e) => {
    if (draggingHandle === null || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0.05, Math.min(0.95, x / rect.width));
    
    const cols = page.columns || [];
    const idx = draggingHandle;
    const totalFlexOfTwo = (cols[idx].flex || 1) + (cols[idx+1].flex || 1);
    
    let cumulative = 0;
    const totalFlex = cols.reduce((sum, c) => sum + (c.flex || 1), 0);
    for (let i = 0; i < idx; i++) {
      cumulative += (cols[i].flex || 1) / totalFlex;
    }
    
    const availablePercentForTwo = ((cols[idx].flex || 1) + (cols[idx+1].flex || 1)) / totalFlex;
    const localPercent = (percentage - cumulative) / availablePercentForTwo;
    const clampedLocal = Math.max(0.1, Math.min(0.9, localPercent));
    
    const newFlexA = clampedLocal * totalFlexOfTwo;
    const newFlexB = (1 - clampedLocal) * totalFlexOfTwo;

    updateColumnFlex(pageIndex, idx, newFlexA, false);
    updateColumnFlex(pageIndex, idx + 1, newFlexB, false);
  };

  const handleRulerMouseUp = () => {
    if (draggingHandle !== null) {
      setDraggingHandle(null);
      document.body.style.cursor = '';
      // Trigger a save with the final values
      updateColumnFlex(pageIndex, draggingHandle, page.columns[draggingHandle].flex, true);
    }
  };

  React.useEffect(() => {
    if (draggingHandle !== null) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleRulerMouseMove);
      window.addEventListener('mouseup', handleRulerMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleRulerMouseMove);
      window.removeEventListener('mouseup', handleRulerMouseUp);
      if (draggingHandle !== null) document.body.style.cursor = '';
    };
  }, [draggingHandle, page.columns]);

  const totalFlex = (page.columns || []).reduce((sum, c) => sum + (c.flex || 1), 0);

  return (
    <div
      className="horizontal-page shrink-0 print:m-0 print:p-0 relative group/page"
      style={{
        width: `${width}${unit}`,
        height: `${height}${unit}`,
        padding: '1.5rem',
        backgroundColor: colors.blockBg || '#fff',
        color: colors.itemName || '#000'
      }}
    >
      <div className="flex flex-col h-full w-full relative z-10">
        <MenuPrintHeader colors={colors} leng={leng} />

        <div className="flex-grow flex mt-6 w-full relative h-full min-h-0">
          {(page.columns || []).map((col, colIdx) => (
            <React.Fragment key={col.id}>
              <div 
                className={`flex flex-col min-w-0 transition-all duration-75 relative h-full ${
                  selectedColumn?.pageIndex === pageIndex && selectedColumn?.colIdx === colIdx 
                  ? 'ring-1 ring-blue-500/30 bg-blue-50/5' 
                  : ''
                }`}
                style={{ flex: col.flex || 1 }}
                onClick={() => editMode && setSelectedColumn({ pageIndex, colIdx })}
              >
                {editMode && (
                  <div className="absolute -top-6 left-0 right-0 flex justify-between items-center px-1 print:hidden opacity-0 group-hover/page:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black opacity-20">C{colIdx + 1}</span>
                    <Button
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveColumn(pageIndex, colIdx);
                      }}
                    >
                      <Plus className="rotate-45" size={10} />
                    </Button>
                  </div>
                )}
                
                <div className="flex-grow overflow-auto h-full scrollbar-hide">
                  <MenuPrintColumn
                    blocks={col.blocks || []}
                    {...commonProps}
                    pageIndex={pageIndex}
                    columnId={colIdx}
                  />
                  {editMode && (
                    <div className="mt-2 flex justify-center print:hidden opacity-0 group-hover/page:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        className="h-6 text-[8px] font-black uppercase border border-dashed border-black/10 hover:border-black/30"
                        onClick={() => onAddBlock(pageIndex, colIdx)}
                      >
                        + Bloque
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Divider Handle */}
              {editMode && colIdx < (page.columns.length - 1) && (
                <div className="w-4 h-full relative cursor-col-resize group/divider shrink-0 flex items-center justify-center">
                  <div className="absolute inset-y-0 w-px bg-zinc-200 group-hover/divider:bg-blue-400 group-hover/divider:w-0.5 transition-all"></div>
                  <div 
                    className="w-6 h-6 bg-white border-2 border-blue-600 rounded-full shadow-lg z-50 flex items-center justify-center hover:scale-125 transition-transform"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      // We need the rulerRef to be the parent container now
                      rulerRef.current = e.currentTarget.parentElement.parentElement;
                      setDraggingHandle(colIdx);
                    }}
                  >
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-2 bg-blue-600 rounded-full"></div>
                      <div className="w-0.5 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Natural spacing in print */}
              {!editMode && colIdx < (page.columns.length - 1) && (
                <div className="w-6 shrink-0"></div>
              )}
            </React.Fragment>
          ))}

          {editMode && (page.columns || []).length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-gray-200 rounded-xl p-12 hover:border-black/20 transition-colors group cursor-pointer" onClick={() => onAddColumn(pageIndex)}>
              <div className="bg-zinc-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-black" />
              </div>
              <p className="font-black uppercase italic text-gray-400 group-hover:text-black text-center">Haz clic para añadir la primera columna</p>
            </div>
          )}
        </div>

        {editMode && (
          <>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 print:hidden z-50">
              <Button 
                onClick={() => onAddColumn(pageIndex)} 
                variant="default" 
                className="w-10 h-10 rounded-full bg-black text-white shadow-xl hover:scale-110 transition-transform flex items-center justify-center"
              >
                <Plus size={24} />
              </Button>
            </div>

            <div className="absolute bottom-16 right-4 flex gap-2 print:hidden z-[50]">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-black shadow-lg"
                onClick={() => triggerImageUpload(pageIndex)}
                disabled={uploadingImage}
              >
                {uploadingImage ? "SUBIENDO..." : "+ IMAGEN"}
              </Button>
            </div>
          </>
        )}

        <MenuPrintFooter colors={colors} />
      </div>
    </div>
  );
};

export default HorizontalPage;
