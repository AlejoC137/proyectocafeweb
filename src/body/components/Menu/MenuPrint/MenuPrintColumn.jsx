import React, { useState } from "react";
import MenuPrintBlock from "./MenuPrintBlock";

const MenuPrintColumn = ({ blocks, pageIndex, columnId, reorderBlock, editMode, ...props }) => {
  const [isOverColumn, setIsOverColumn] = useState(false);

  const handleDragOver = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOverColumn(true);
  };

  const handleDragLeave = (e) => {
    if (!editMode) return;
    setIsOverColumn(false);
  };

  const handleDrop = (e) => {
    if (!editMode) return;
    e.preventDefault();
    setIsOverColumn(false);
    try {
      const raw = e.dataTransfer.getData("text/plain");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.blockId && reorderBlock) {
        reorderBlock(data.blockId, null, pageIndex, columnId, 'after');
      }
    } catch (err) {
      console.error("Drop column error:", err);
    }
  };

  return (
    <div 
      className={`flex flex-row flex-wrap gap-1.5 items-start content-start w-full min-w-0 transition-all p-0.5 rounded ${isOverColumn ? 'bg-blue-100/60 border-2 border-dashed border-blue-500 shadow-inner' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {blocks.map((blockId, index) => (
        <MenuPrintBlock
          key={`${blockId}_${index}`}
          blockId={blockId}
          pageIndex={pageIndex}
          columnId={columnId}
          reorderBlock={reorderBlock}
          editMode={editMode}
          {...props}
        />
      ))}
    </div>
  );
};

export default MenuPrintColumn;
