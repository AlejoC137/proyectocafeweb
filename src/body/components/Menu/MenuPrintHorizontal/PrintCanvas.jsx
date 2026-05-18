import React, { useEffect, useState, useRef } from "react";
import HorizontalPage from "./HorizontalPage";

export default function PrintCanvas({
  pages,
  pageSize,
  colors,
  leng,
  editMode,
  commonProps,
  onAddColumn,
  onRemoveColumn,
  updateColumnFlex,
  onAddBlock,
  setUploadTargetPage,
  fileInputRef,
  uploadingImage,
  selectedColumn,
  setSelectedColumn,
  removePage
}) {
  const [zoom, setZoom] = useState(0.5); // 1 = 100% zoom
  const [panOffset, setPanOffset] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Allow scrolling normally in print mode, but this is disabled via print styles usually.
      // We prevent default to handle our own zoom
      e.preventDefault();
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasMouseX = (mouseX - panOffset.x) / zoom;
      const canvasMouseY = (mouseY - panOffset.y) / zoom;
      
      const delta = -e.deltaY;
      const zoomIntensity = 0.001;
      let newZoom = Math.min(Math.max(0.1, zoom + delta * zoomIntensity * zoom), 3);
      
      const newPanX = mouseX - canvasMouseX * newZoom;
      const newPanY = mouseY - canvasMouseY * newZoom;
      
      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoom, panOffset]);

  const handleMouseDown = (e) => {
    // Allow panning on middle click, OR on left click if not clicking an interactive element
    const isInteractive = e.target.closest('button, input, select, textarea, a, [role="button"], .cursor-col-resize, [contenteditable="true"]');
    if (e.button === 1 || (e.button === 0 && !isInteractive)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      id="print-area"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
      className={`flex-1 w-full min-h-[600px] bg-zinc-200 overflow-hidden relative flex justify-start items-start p-10 print:p-0 print:bg-white print:overflow-visible ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div
        id="canvas-inner"
        className="flex gap-12 print:gap-0 print:block w-max"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {pages.map((p, idx) => (
          <div key={p.id} className="relative group/page-container bg-white shadow-xl print:shadow-none print-page-wrapper">
            <HorizontalPage
              page={p}
              pageIndex={idx}
              width={pageSize.width}
              height={pageSize.height}
              unit={pageSize.unit}
              colors={colors}
              leng={leng}
              editMode={editMode}
              commonProps={commonProps}
              onAddColumn={onAddColumn}
              onRemoveColumn={onRemoveColumn}
              updateColumnFlex={updateColumnFlex}
              onAddBlock={onAddBlock}
              triggerImageUpload={(idx) => {
                setUploadTargetPage(idx);
                fileInputRef.current.click();
              }}
              uploadingImage={uploadingImage}
              selectedColumn={selectedColumn}
              setSelectedColumn={setSelectedColumn}
              openGallery={commonProps.openGallery}
            />
            {editMode && pages.length > 1 && (
              <button
                onClick={() => removePage(idx)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 text-white rounded-full font-black shadow-lg hover:scale-110 transition-transform z-50 print:hidden flex items-center justify-center border-2 border-white"
                title="Eliminar Página"
              >
                X
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
